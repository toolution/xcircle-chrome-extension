/**
 * Lightweight content script on x.com / twitter.com.
 * Detects the profile handle from the URL and exposes it to the side panel.
 */

function currentHandle(): string | null {
  const segment = location.pathname.split('/').filter(Boolean)[0] || '';
  if (!/^[A-Za-z0-9_]{1,15}$/.test(segment)) return null;
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
  ]);
  if (reserved.has(segment.toLowerCase())) return null;
  return segment;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'xcircle:page-handle') {
    sendResponse({ handle: currentHandle(), href: location.href });
    return true;
  }
  return false;
});

// Keep a session hint so the side panel can prefill after navigation.
const handle = currentHandle();
if (handle) {
  chrome.storage.session.set({ lastPageHandle: handle }).catch(() => {});
}
