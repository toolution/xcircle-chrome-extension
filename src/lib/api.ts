import { API_BASE } from './config';
import type {
  CircleCount,
  CircleResult,
  CircleTheme,
} from './types';

export class ApiError extends Error {
  constructor(
    public code: number | string,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface Envelope<T> {
  code: number;
  message: string;
  data?: T;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(-1, 'upstream_unavailable');
  }

  const text = await res.text();
  let json: Envelope<T>;
  try {
    json = JSON.parse(text) as Envelope<T>;
  } catch {
    throw new ApiError(
      -1,
      res.ok ? 'upstream_unavailable' : 'upstream_unavailable'
    );
  }

  if (json.code !== 0) {
    throw new ApiError(
      json.code ?? -1,
      json.message || 'Request failed',
      json.data
    );
  }
  return json.data as T;
}

export function generateCircle(
  handle: string,
  options?: { refresh?: boolean; signal?: AbortSignal }
) {
  return request<CircleResult>('/api/circle', {
    method: 'POST',
    signal: options?.signal,
    body: JSON.stringify({
      handle,
      ...(options?.refresh ? { refresh: true } : {}),
    }),
  });
}

export function createShare(input: {
  circleHandle: string;
  theme: CircleTheme;
  count: CircleCount;
  showNames: boolean;
  showRanks: boolean;
  hidden: string[];
  expectedFetchedAt?: string;
}) {
  return request<{ id: string; url: string; expiresAt: string }>(
    '/api/share',
    {
      method: 'POST',
      body: JSON.stringify(input),
    }
  );
}

export function errorMessage(error: unknown, locale: 'en' | 'zh'): string {
  const code =
    error instanceof ApiError ? error.message : 'upstream_unavailable';
  const map =
    locale === 'zh'
      ? {
          invalid_handle: '用户名无效，请输入公开的 X 账号。',
          private_account: '该账号受保护，无法生成圈子。',
          not_found: '找不到这个账号。',
          empty_circle: '最近公开互动太少，暂时画不出圈子。',
          rate_limited: '请求太频繁，请稍后再试。',
          storage_unavailable: '服务暂时不可用，请稍后再试。',
          share_not_found: '分享链接无效或已过期。',
          circle_changed: '圈子数据已更新，请重新生成后再分享。',
          upstream_unavailable: '暂时读不到公开数据，请稍后再试。',
        }
      : {
          invalid_handle: 'Enter a valid public X username.',
          private_account: 'Protected accounts cannot be read.',
          not_found: 'That account was not found.',
          empty_circle: 'Not enough recent public interactions.',
          rate_limited: 'Too many requests. Try again shortly.',
          storage_unavailable: 'Service unavailable. Try again later.',
          share_not_found: 'That share link is missing or expired.',
          circle_changed: 'Circle data changed. Generate again, then share.',
          upstream_unavailable: 'Public data is temporarily unavailable.',
        };
  return map[code as keyof typeof map] ?? map.upstream_unavailable;
}
