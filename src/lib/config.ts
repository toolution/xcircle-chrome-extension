/** Production site — every outbound product link and API call uses this. */
export const SITE_URL = 'https://xcircle.me';
export const API_BASE = SITE_URL;

export const SITE_LINKS = {
  home: SITE_URL,
  extension: `${SITE_URL}/chrome-extension`,
  howItWorks: `${SITE_URL}/how-it-works`,
  guides: `${SITE_URL}/guides/how-to-make-a-twitter-circle`,
  recap: `${SITE_URL}/x-recap`,
  mosaic: `${SITE_URL}/x-mosaic`,
  privacy: `${SITE_URL}/privacy-policy`,
  about: `${SITE_URL}/about`,
  openStudio: (handle?: string) =>
    handle
      ? `${SITE_URL}/?handle=${encodeURIComponent(handle)}`
      : SITE_URL,
  share: (id: string) => `${SITE_URL}/c/${id}`,
} as const;
