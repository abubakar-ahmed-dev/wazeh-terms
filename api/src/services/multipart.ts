/**
 * Streaming multipart/form-data parser for custom document uploads (docs/API.md §4.1).
 * Zero disk persistence: incoming file streams are bounded and buffered in memory.
 */
import type { Request } from 'express';
import Busboy from 'busboy';

import { ScopeSchema, type Scope } from '../contracts/issued-extraction.js';
import { HttpError } from '../errors.js';

export interface UploadedFilePart {
  readonly role: 'offer' | 'contract';
  readonly filename: string;
  readonly mimeType: string;
  readonly buffer: Buffer;
}

export interface ParsedMultipartUpload {
  readonly scope: Scope;
  readonly files: UploadedFilePart[];
}

export interface MultipartLimits {
  readonly maxBytesPerFile: number;
  readonly maxTotalBytes: number;
}

export const DEFAULT_UPLOAD_SCOPE: Scope = {
  origin: 'PK',
  destination: 'AE',
  declaredRegime: 'uae_mainland_private',
  declaredWorkerCategory: 'non_domestic',
};

export function parseMultipartUpload(
  req: Request,
  limits: MultipartLimits,
): Promise<ParsedMultipartUpload> {
  return new Promise((resolve, reject) => {
    let busboyInstance: ReturnType<typeof Busboy>;
    try {
      busboyInstance = Busboy({
        headers: req.headers,
        limits: {
          files: 2,
          fileSize: limits.maxBytesPerFile,
        },
      });
    } catch {
      reject(new HttpError(400, 'BAD_REQUEST', 'Malformed multipart request.'));
      return;
    }

    let parsedScope: Scope = DEFAULT_UPLOAD_SCOPE;
    const files: UploadedFilePart[] = [];
    const seenRoles = new Set<string>();
    let totalBytes = 0;
    let aborted = false;

    function abortWithError(error: Error): void {
      if (aborted) return;
      aborted = true;
      req.unpipe(busboyInstance);
      req.resume();
      reject(error);
    }

    busboyInstance.on('field', (name, value) => {
      if (aborted) return;
      if (name === 'scope') {
        try {
          const raw = JSON.parse(value) as unknown;
          const parsed = ScopeSchema.safeParse(raw);
          if (!parsed.success) {
            abortWithError(new HttpError(400, 'BAD_REQUEST', 'Invalid scope in upload request.'));
            return;
          }
          parsedScope = parsed.data;
        } catch {
          abortWithError(new HttpError(400, 'BAD_REQUEST', 'Scope must be a valid JSON string.'));
        }
      } else {
        abortWithError(new HttpError(400, 'BAD_REQUEST', `Unexpected field in upload: ${name}`));
      }
    });

    busboyInstance.on('file', (fieldname, stream, info) => {
      if (aborted) {
        stream.resume();
        return;
      }

      if (fieldname !== 'offer' && fieldname !== 'contract') {
        abortWithError(new HttpError(400, 'BAD_REQUEST', `Unknown file field: ${fieldname}. Expected offer or contract.`));
        stream.resume();
        return;
      }

      if (seenRoles.has(fieldname)) {
        abortWithError(new HttpError(400, 'DUPLICATE_DOCUMENT_ROLE', `Duplicate document role submitted: ${fieldname}.`));
        stream.resume();
        return;
      }
      seenRoles.add(fieldname);

      const chunks: Buffer[] = [];
      let fileBytes = 0;
      let fileTruncated = false;

      stream.on('limit', () => {
        fileTruncated = true;
      });

      stream.on('data', (chunk: Buffer) => {
        if (aborted) return;
        fileBytes += chunk.length;
        totalBytes += chunk.length;

        if (fileTruncated || fileBytes > limits.maxBytesPerFile) {
          abortWithError(new HttpError(413, 'FILE_TOO_LARGE', `Uploaded ${fieldname} exceeds the file size limit.`));
          return;
        }

        if (totalBytes > limits.maxTotalBytes) {
          abortWithError(new HttpError(413, 'REQUEST_TOO_LARGE', 'Total upload size exceeds the maximum request limit.'));
          return;
        }

        chunks.push(chunk);
      });

      stream.on('end', () => {
        if (aborted) return;
        if (fileTruncated) {
          abortWithError(new HttpError(413, 'FILE_TOO_LARGE', `Uploaded ${fieldname} exceeds the file size limit.`));
          return;
        }
        if (fileBytes === 0) {
          abortWithError(new HttpError(400, 'BAD_REQUEST', `Uploaded ${fieldname} is empty.`));
          return;
        }

        files.push({
          role: fieldname,
          filename: info.filename || `${fieldname}.pdf`,
          mimeType: info.mimeType,
          buffer: Buffer.concat(chunks),
        });
      });
    });

    busboyInstance.on('error', (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      abortWithError(new HttpError(400, 'BAD_REQUEST', `Multipart parsing error: ${msg}`));
    });

    busboyInstance.on('close', () => {
      if (aborted) return;
      if (files.length === 0) {
        abortWithError(new HttpError(400, 'BAD_REQUEST', 'At least one offer or contract document must be uploaded.'));
        return;
      }
      resolve({ scope: parsedScope, files });
    });

    req.pipe(busboyInstance);
  });
}
