export type CircleTheme = 'mint' | 'midnight' | 'peach' | 'paper';
export type CircleCount = 8 | 24 | 50;
export interface CircleProfile {
  id: string;
  handle: string;
  name: string;
  avatar: string | null;
  /** Public follower count at collection time; absent in older snapshots. */
  followers?: number | null;
  bio?: string | null;
}
export interface CirclePerson extends CircleProfile {
  score: number;
  fromYou: number;
  fromThem: number;
  replies: number;
  quotes: number;
  mentions: number;
  reposts: number;
}
export interface CircleResult {
  version: number;
  owner: CircleProfile;
  people: CirclePerson[];
  fetchedAt: string;
  source: 'fxtwitter' | 'twitterapi';
  cache: 'fresh' | 'hit' | 'stale';
  coverage: {
    posts: number;
    inbound: number;
    oldestAt: string | null;
    partial: boolean;
    inboundSource: 'search' | 'threads' | 'none';
  };
}
export interface CircleShare {
  kind?: 'circle' | 'recap' | 'mosaic';
  id: string;
  circle: CircleResult;
  theme: CircleTheme;
  count: CircleCount;
  showNames: boolean;
  showRanks: boolean;
  hidden: string[];
  createdAt: string;
  expiresAt: string;
}
export type CircleErrorCode =
  | 'invalid_handle'
  | 'private_account'
  | 'not_found'
  | 'upstream_unavailable'
  | 'empty_circle'
  | 'rate_limited'
  | 'storage_unavailable'
  | 'share_not_found'
  | 'circle_changed';
