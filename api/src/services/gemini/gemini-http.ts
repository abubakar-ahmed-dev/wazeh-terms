/**
 * Gemini HTTP implementation of the extraction service: bounded inline PDFs
 * (ADR-003), JSON response mime, temperature 0, at most two attempts, and a
 * hard abort at the application deadline. Provider failures map to typed
 * "unavailable"/"timeout" outcomes; the route turns those into
 * `503 EXTRACTION_UNAVAILABLE`. Request and response content is never logged.
 */
import { GoogleGenAI } from '@google/genai';

import { buildExtractionPrompt } from './prompt.js';
import { ModelExtractionSchema } from '../extraction/model-output.js';
import type { GeminiExtractionRequest, GeminiExtractionService } from './types.js';

const MAX_ATTEMPTS = 2;

/** Coarse provider error class for operational logs — never a message body. */
function errorClassOf(error: unknown): string {
  const name = (error as Error)?.name ?? 'UnknownError';
  const status = /"code"\s*:\s*(\d{3})/.exec(String((error as Error)?.message ?? ''))?.[1];
  return status ? `${name}:${status}` : name;
}

export function createGeminiHttpService(options: {
  apiKey: string;
  model: string;
}): GeminiExtractionService {
  const client = new GoogleGenAI({ apiKey: options.apiKey });

  return {
    async extract(request: GeminiExtractionRequest) {
      const startedAt = Date.now();
      const controller = new AbortController();
      const timer = setTimeout(
        () => controller.abort(),
        Math.max(1_000, request.deadlineMs),
      );

      const onAbort = () => {
        controller.abort();
      };
      if (request.signal) {
        if (request.signal.aborted) {
          controller.abort();
        } else {
          request.signal.addEventListener('abort', onAbort, { once: true });
        }
      }

      try {
        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
          try {
            const response = await client.models.generateContent({
              model: options.model,
              contents: [
                {
                  role: 'user',
                  parts: [
                    { text: buildExtractionPrompt() },
                    ...request.documents.map((document) => ({
                      inlineData: { mimeType: 'application/pdf', data: document.pdfBase64 },
                    })),
                  ],
                },
              ],
              config: {
                temperature: 0,
                responseMimeType: 'application/json',
                abortSignal: controller.signal,
              },
            });

            if (controller.signal.aborted) {
              return {
                ok: false,
                reason: 'timeout',
                attempts: attempt,
                providerMs: Date.now() - startedAt,
              };
            }

            const text = response.text ?? '';
            let parsedJson: unknown;
            try {
              parsedJson = JSON.parse(text);
            } catch {
              // Malformed JSON counts as a validation failure: bounded retry.
              continue;
            }
            const checked = ModelExtractionSchema.safeParse(parsedJson);
            if (!checked.success) {
              continue;
            }
            return {
              ok: true,
              modelJson: checked.data,
              attempts: attempt,
              providerMs: Date.now() - startedAt,
            };

          } catch (error) {
            if (controller.signal.aborted) {
              return {
                ok: false,
                reason: 'timeout',
                attempts: attempt,
                providerMs: Date.now() - startedAt,
              };
            }
            // Provider/network/schema-transport failure: fail closed.
            return {
              ok: false,
              reason: 'unavailable',
              errorClass: errorClassOf(error),
              attempts: attempt,
              providerMs: Date.now() - startedAt,
            };
          }
        }
        return {
          ok: false,
          reason: 'unavailable',
          attempts: MAX_ATTEMPTS,
          providerMs: Date.now() - startedAt,
        };
      } finally {
        clearTimeout(timer);
        if (request.signal) {
          request.signal.removeEventListener('abort', onAbort);
        }
      }
    },
  };
}
