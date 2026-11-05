/**
 * MV3 service worker — based on GoogleChrome/chrome-extensions-samples
 * functional-samples/cookbook.sidepanel-global (open panel on action click).
 */

const SITE_URL = 'https://xcircle.me';

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'xcircle-generate',
      title: 'Generate XCircle for "%s"',
      contexts: ['selection'],
    });
    chrome.contextMenus.create({
      id: 'xcircle-page',
      title: 'Generate XCircle for this profile',
      contexts: ['page'],
      documentUrlPatterns: ['https://x.com/*', 'https://twitter.com/*'],
    });
    chrome.contextMenus.create({
      id: 'xcircle-open-site',
      title: 'Open xcircle.me',
      contexts: ['action'],
    });
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'xcircle-open-site') {
    chrome.tabs.create({ url: SITE_URL });
    return;
  }

  let handle = '';
  if (info.menuItemId === 'xcircle-generate' && info.selectionText) {
    handle = info.selectionText.trim().replace(/^@/, '');
  } else if (info.menuItemId === 'xcircle-page' && tab?.url) {
    try {
      const path = new URL(tab.url).pathname.split('/').filter(Boolean)[0] || '';
      handle = path;
    } catch {
      handle = '';
    }
  }

  await chrome.storage.session.set({
    pendingHandle: handle,
    pendingAt: Date.now(),
  });

  if (tab?.windowId != null) {
    await chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {});
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'xcircle:open-site') {
    chrome.tabs.create({ url: message.url || SITE_URL });
    sendResponse({ ok: true });
    return true;
  }
  if (message?.type === 'xcircle:get-tab-handle') {
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      const url = tab?.url || '';
      let handle: string | null = null;
      try {
        const parsed = new URL(url);
        if (
          ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'].includes(
            parsed.hostname
          )
        ) {
          const segment = parsed.pathname.split('/').filter(Boolean)[0] || '';
          if (/^[A-Za-z0-9_]{1,15}$/.test(segment)) handle = segment;
        }
      } catch {
        handle = null;
      }
      sendResponse({ handle, url });
    });
    return true;
  }
  return false;
});
