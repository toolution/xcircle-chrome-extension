/** Never turn a missing or malformed upstream count into a real zero. */
export function followerCount(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
    ? value
    : null;
}

/** Keep profile descriptions as bounded plain text, never HTML. */
export function profileBio(value: unknown): string | null {
  return typeof value === 'string' ? value.trim().slice(0, 500) || null : null;
}

/** A whole Unicode code point keeps SSR and browser fallback text identical. */
export function profileInitial(name: string): string {
  return Array.from(name.trim())[0] || '?';
}
