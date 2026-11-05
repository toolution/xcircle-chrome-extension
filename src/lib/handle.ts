/** Extract an X handle from typed text, profile URL, or current tab URL. */
export function parseHandle(input: string): string | null {
  let handle = input.trim();
  if (!handle || handle.length > 160) return null;

  if (/^https?:\/\//i.test(handle)) {
    try {
      const url = new URL(handle);
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

  handle = handle.replace(/^@/, '');
  if (!/^[A-Za-z0-9_]{1,15}$/.test(handle)) return null;

  const reserved = new Set([
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
  ]);
  if (reserved.has(handle.toLowerCase())) return null;
  return handle;
}
