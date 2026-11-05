const RESERVED = new Set([
  'home',
  'explore',
  'search',
  'notifications',
  'messages',
  'settings',
  'i',
  'compose',
  'login',
  'signup',
  'intent',
  'hashtag',
  'share',
  'tos',
  'privacy',
]);

/** Extract an X handle from typed text, profile URL, or current tab URL. */
export function parseHandle(input: string): string | null {
  let handle = input
    .trim()
    .replace(/^[\uFF20@]+/, '') // ASCII or full-width @
    .replace(/\s+/g, '');

  if (!handle || handle.length > 160) return null;

  // Accept bare x.com/user and twitter.com/user, not only full https URLs.
  if (/^(https?:\/\/)?(www\.)?(x|twitter)\.com\//i.test(handle)) {
    try {
      const url = new URL(
        /^https?:\/\//i.test(handle) ? handle : `https://${handle}`
      );
      if (
        !['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'].includes(
          url.hostname.toLowerCase()
        )
      ) {
        return null;
      }
      handle = url.pathname.split('/').filter(Boolean)[0] || '';
    } catch {
      return null;
    }
  }

  handle = handle.replace(/^@/, '').replace(/\/+$/, '');
  if (!/^[A-Za-z0-9_]{1,15}$/.test(handle)) return null;
  if (RESERVED.has(handle.toLowerCase())) return null;
  // Match xcircle.me server normalization.
  return handle.toLowerCase();
}
