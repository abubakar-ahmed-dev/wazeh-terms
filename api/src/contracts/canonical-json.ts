/**
 * Canonical JSON serialization shared by HMAC issuance and verification
 * (`docs/API.md` §5, `docs/SECURITY.md` §3). Both sides must use this exact
 * serializer — verification re-canonicalizes the received payload object and
 * never trusts client byte order.
 *
 * ## Canonical serialization specification
 *
 * 1. Input must be plain JSON data: string, safe-integer number, boolean,
 *    null, array, or plain object. `undefined`, functions, symbols, BigInt,
 *    non-integer or unsafe numbers, class instances, sparse members, and
 *    cyclic structures throw `CanonicalizationError`.
 * 2. Object keys are sorted lexicographically by UTF-16 code unit, applied
 *    recursively at every nesting level.
 * 3. Output has no whitespace; member separator `,`, key separator `:`.
 *    Strings use standard `JSON.stringify` escaping. `null` is the literal.
 * 4. Array element order is preserved — order is significant data.
 * 5. Numbers must be safe integers (`Number.isSafeInteger`); the issued
 *    payload carries all measured data as strings by design.
 * 6. The HMAC signature input is the canonical JSON of the two-key envelope
 *    `{ "issuedExtraction": <payload>, "keyId": <keyId> }`.
 * 7. `signature` = base64url(`HMAC-SHA256(secret, UTF-8(canonical bytes))`).
 */

export class CanonicalizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CanonicalizationError';
  }
}

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

export function canonicalJson(input: unknown): string {
  return serialize(input, new Set<object>());
}

function serialize(value: unknown, ancestors: Set<object>): string {
  if (value === null) {
    return 'null';
  }

  switch (typeof value) {
    case 'string':
      return JSON.stringify(value);
    case 'boolean':
      return value ? 'true' : 'false';
    case 'number':
      if (!Number.isSafeInteger(value)) {
        throw new CanonicalizationError('Only safe integers are serializable');
      }
      return String(value);
    case 'object':
      return serializeObject(value as object, ancestors);
    default:
      throw new CanonicalizationError(`Unsupported JSON type: ${typeof value}`);
  }
}

function serializeObject(value: object, ancestors: Set<object>): string {
  if (ancestors.has(value)) {
    throw new CanonicalizationError('Cyclic structure is not serializable');
  }

  if (Array.isArray(value)) {
    ancestors.add(value);
    try {
      const members = value.map((member) => serialize(member, ancestors));
      return `[${members.join(',')}]`;
    } finally {
      ancestors.delete(value);
    }
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new CanonicalizationError('Only plain objects are serializable');
  }

  ancestors.add(value);
  try {
    const entries = Object.entries(value);
    for (const [, member] of entries) {
      if (member === undefined) {
        throw new CanonicalizationError('undefined is not JSON data');
      }
    }
    entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    const members = entries.map(([key, member]) => `${JSON.stringify(key)}:${serialize(member, ancestors)}`);
    return `{${members.join(',')}}`;
  } finally {
    ancestors.delete(value);
  }
}
