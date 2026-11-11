# XCircle Chrome Extension

Chrome MV3 extension for [xcircle.me](https://xcircle.me) — generate, customize, download and share your X/Twitter interaction circle from a side panel.

## Install

[Add to Chrome from the Chrome Web Store](https://chromewebstore.google.com/detail/filficdjpnkokpmfhgcnpommlcfpagpn).

## Features

- Generate circles from any public X username (calls `https://xcircle.me/api/circle`)
- Prefill from the current X/Twitter tab or context menu
- Themes, 8/24/50 layouts, names/ranks, hide people
- PNG download + seven-day share links
- Persistent links back to the website (home, how-it-works, guides, recap, mosaic, privacy)

## Reference

Built against Manifest V3 patterns from the official samples:

`GoogleChrome/chrome-extensions-samples` → `functional-samples/cookbook.sidepanel-global`

Local clone used during development:

`_ai_workspace/chrome-ext-research/chrome-extensions-samples`

## Develop

```sh
npm install
npm run build
```

Load unpacked in Chrome:

1. `chrome://extensions`
2. Enable Developer mode
3. Load unpacked → select the `dist/` folder

```sh
npm run pack   # builds + writes store/xcircle-chrome-extension-v1.0.0.zip
```

## Publish

Upload `store/xcircle-chrome-extension-v1.0.0.zip` in the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/). Listing copy lives in `store/listing.md`.
