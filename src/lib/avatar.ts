import type { CircleResult } from './types';

/** Only X's raster profile-image CDN. Kept pure for browser and server use. */
export function safeProfileAvatarUrl(input: unknown): string | null {
  if (
    typeof input !== 'string' ||
    input.length > 1024 ||
    input.includes('?') ||
    input.includes('#')
  )
    return null;
  try {
    const url = new URL(input);
    if (
      url.protocol !== 'https:' ||
      url.hostname !== 'pbs.twimg.com' ||
      url.port ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      return null;
    if (
      !/^\/profile_images\/[0-9]{1,24}\/[A-Za-z0-9_-]{1,180}\.(?:jpe?g|png|webp|gif)$/i.test(
        url.pathname
      )
    )
      return null;
    return url.href;
  } catch {
    return null;
  }
}

/** Upscale recognized X variants only; never guess an unknown filename. */
export function profileAvatarUrl(
  input: unknown,
  minimum: 200 | 400 = 200
): string | null {
  const url = safeProfileAvatarUrl(input);
  if (!url) return null;
  return url.replace(
    /_(normal|bigger|mini|200x200|400x400)(\.(?:jpe?g|png|webp|gif))$/i,
    (full, size: string, extension: string) => {
      if (
        size.toLowerCase() === '400x400' ||
        (size.toLowerCase() === '200x200' && minimum === 200)
      )
        return full;
      return `_${minimum}x${minimum}${extension}`;
    }
  );
}

/** Upgrade only the central portrait, including old cached/share readings. */
export function withClearOwnerAvatar(circle: CircleResult): CircleResult {
  const avatar = profileAvatarUrl(circle.owner.avatar, 400);
  return avatar === circle.owner.avatar
    ? circle
    : { ...circle, owner: { ...circle.owner, avatar } };
}
