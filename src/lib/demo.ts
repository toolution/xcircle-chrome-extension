import type { CircleResult } from './types';

const names = [
  'Maya',
  'Leo',
  'Ada',
  'Kai',
  'Nora',
  'Finn',
  'Zoe',
  'Noah',
  'Milo',
  'Iris',
  'Eli',
  'June',
  'Remy',
  'Luna',
  'Jude',
  'Alma',
  'Otis',
  'Nina',
  'Theo',
  'Rae',
  'Luca',
  'Esme',
  'Arlo',
  'Wren',
  'Alex',
  'Sage',
  'Ash',
  'Quinn',
  'Robin',
  'Jules',
  'Ari',
  'Blair',
  'Cleo',
  'Drew',
  'Eden',
  'Frankie',
  'Gray',
  'Harper',
  'Indy',
  'Jesse',
  'Kit',
  'Lane',
  'Morgan',
  'Parker',
  'Reese',
  'River',
  'Rowan',
  'Sky',
  'Taylor',
  'Winter',
];
const colors = [
  '#e8b8ac',
  '#b4c8ad',
  '#cfcae3',
  '#f4d48c',
  '#a6c6c8',
  '#e9b7cd',
  '#c6c29c',
  '#bdcbea',
];
const skins = ['#d79a72', '#f0bf99', '#ad7254', '#efc6a7', '#c58963'];
export function sampleAvatar(index: number) {
  const bg = colors[index % colors.length];
  const skin = skins[index % skins.length];
  const hair = ['#3b2b26', '#ae653b', '#29272b', '#6d4935'][index % 4];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" fill="${bg}"/><path d="M20 160c0-44 27-57 60-57s60 13 60 57" fill="${index % 2 ? '#244e42' : '#fff3db'}"/><path d="M68 94h24v30c-6 9-18 9-24 0" fill="${skin}"/><ellipse cx="80" cy="68" rx="35" ry="42" fill="${hair}"/><ellipse cx="80" cy="76" rx="28" ry="35" fill="${skin}"/><path d="M50 65c-2-34 51-50 62-9-13 3-28-6-33-15-6 13-17 18-29 24" fill="${hair}"/><circle cx="70" cy="75" r="2.4" fill="#352820"/><circle cx="91" cy="75" r="2.4" fill="#352820"/><path d="M73 91q8 7 15-1" fill="none" stroke="#8e4c3b" stroke-width="2.7" stroke-linecap="round"/>${index % 3 === 0 ? '<path d="M60 73h17m7 0h17m-24 0h7" stroke="#3b342e" stroke-width="2"/><circle cx="69" cy="74" r="10" stroke="#3b342e" stroke-width="2" fill="none"/><circle cx="93" cy="74" r="10" stroke="#3b342e" stroke-width="2" fill="none"/>' : ''}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Illustrative characters only. Never represents a live X account or API result. */
export const sampleCircle: CircleResult = {
  version: 1,
  owner: {
    id: 'sample-owner',
    handle: 'you',
    name: 'You',
    avatar: sampleAvatar(13),
  },
  people: names.map((name, index) => ({
    id: `sample-${index}`,
    handle: `sample_${name.toLowerCase()}`,
    name,
    avatar: sampleAvatar(index),
    score: 100 - index * 1.8,
    fromYou: Math.max(1, 29 - index),
    fromThem: Math.max(1, 24 - index),
    replies: Math.max(1, 23 - index),
    quotes: Math.max(0, 5 - index),
    mentions: Math.max(0, 10 - index),
    reposts: Math.max(0, 4 - index),
  })),
  fetchedAt: '2026-10-30T00:00:00.000Z',
  source: 'fxtwitter',
  cache: 'fresh',
  coverage: {
    posts: 0,
    inbound: 0,
    oldestAt: null,
    partial: false,
    inboundSource: 'none',
  },
};
