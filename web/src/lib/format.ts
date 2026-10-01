/** Display helpers. Money stays a decimal string — never float math. */
import type { Evidence, FieldState, NormalizedValue } from './types';

export const STATE_LABELS: Readonly<Record<FieldState, string>> = {
  present: 'Found in document',
  absent: 'Not found on readable pages',
  unclear: 'Unclear',
  unreadable: 'Could not read',
};

export const STATE_CHIP_CLASS: Readonly<Record<FieldState, string>> = {
  present: 'chip chip--state-found',
  absent: 'chip chip--state-absent',
  unclear: 'chip chip--state-unclear',
  unreadable: 'chip chip--state-unreadable',
};

export const EVIDENCE_LABELS: Readonly<Record<Evidence['verification'], string>> = {
  matched_text: 'Text matched to PDF',
  model_transcription: 'Model transcription — check the page',
};

export function roleLabel(role: string): string {
  if (role === 'offer') return 'Offer';
  if (role === 'contract') return 'Contract';
  return 'Document';
}

export function formatValue(value: NormalizedValue): string {
  switch (value.kind) {
    case 'text':
    case 'reference_text':
      return value.text;
    case 'money': {
      const parts = [`${value.currency ?? ''} ${value.amount}`.trim()];
      if (value.frequency) parts.push(value.frequency.replace('_', ' '));
      if (value.payer) parts.push(`stated payer: ${value.payer.replace(/_/g, ' ')}`);
      return parts.join(' · ');
    }
    case 'date':
      return value.date;
    case 'duration':
      return `${value.amount} ${value.unit}${value.amount === '1' ? '' : 's'}`;
    case 'benefit_state':
      return [value.status.replace(/_/g, ' '), value.conditions ? `(${value.conditions})` : null]
        .filter(Boolean)
        .join(' ');
    case 'boolean':
      return value.value ? 'Present' : 'Not present';
  }
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

/** Inclusive human label; the client never guesses a fixed TTL. */
export function expiryLabel(expiresAt: string, now = Date.now()): string {
  const ms = Date.parse(expiresAt) - now;
  if (Number.isNaN(ms)) return '';
  if (ms <= 0) return 'This review has expired.';
  const minutes = Math.floor(ms / 60000);
  if (minutes >= 1) return `Review expires in about ${minutes} minute${minutes === 1 ? '' : 's'}.`;
  return 'Review expires in less than a minute.';
}
