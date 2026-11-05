import { profileAvatarUrl } from './avatar';
import { API_BASE } from './config';
import { profileInitial } from './profile';
import type {
  CircleCount,
  CircleProfile,
  CircleResult,
  CircleTheme,
} from './types';

export interface CircleDrawSettings {
  theme: CircleTheme;
  count: CircleCount;
  showNames: boolean;
  showRanks: boolean;
  hidden: string[];
}
export interface CircleDrawCopy {
  title: string;
  subtitle: string;
  brand: string;
  sample: string;
  you: string;
}
export const circleThemes = {
  mint: {
    background: '#d9f2d9',
    ink: '#173f32',
    faint: '#95c5a1',
    accent: '#1f664a',
    border: '#f3fff0',
  },
  midnight: {
    background: '#193d39',
    ink: '#ecf8e8',
    faint: '#4a6e5d',
    accent: '#cdf085',
    border: '#d7efce',
  },
  peach: {
    background: '#f5dace',
    ink: '#663f31',
    faint: '#d5ab94',
    accent: '#a6503d',
    border: '#fff0df',
  },
  paper: {
    background: '#f4f0e6',
    ink: '#302e29',
    faint: '#d7cfc0',
    accent: '#605f48',
    border: '#ffffff',
  },
} as const;
export interface CircleNode {
  person: CircleProfile;
  x: number;
  y: number;
  radius: number;
  rank: number;
}
export function layoutCircle(
  circle: CircleResult,
  settings: CircleDrawSettings
): CircleNode[] {
  const people = circle.people
    .filter((person) => !settings.hidden.includes(person.handle.toLowerCase()))
    .slice(0, settings.count);
  const nodes: CircleNode[] = [
    { person: circle.owner, x: 600, y: 590, radius: 112, rank: 0 },
  ];
  const rings =
    settings.count === 8
      ? [{ n: 8, distance: 280, radius: 83 }]
      : settings.count === 24
        ? [
            { n: 8, distance: 223, radius: 70 },
            { n: 16, distance: 407, radius: 67 },
          ]
        : [
            { n: 8, distance: 202, radius: 65 },
            { n: 16, distance: 350, radius: 58 },
            { n: 26, distance: 477, radius: 48 },
          ];
  let index = 0;
  for (const ring of rings) {
    const available = Math.min(ring.n, people.length - index);
    for (let i = 0; i < available; i++) {
      const angle =
        -Math.PI / 2 +
        (i * Math.PI * 2) / (available < ring.n ? available : ring.n);
      nodes.push({
        person: people[index],
        x: 600 + Math.cos(angle) * ring.distance,
        y: 590 + Math.sin(angle) * ring.distance,
        radius: ring.radius,
        rank: index + 1,
      });
      index++;
    }
  }
  return nodes;
}
export function avatarSource(url: string | null, minimum: 200 | 400 = 200) {
  if (!url) return null;
  if (url.startsWith('data:image/svg+xml;')) return url;
  const safe = profileAvatarUrl(url, minimum);
  return safe
    ? `${API_BASE}/api/avatar?url=${encodeURIComponent(safe)}`
    : null;
}
const imagePromises = new Map<string, Promise<HTMLImageElement | null>>();
export function imageFor(url: string): Promise<HTMLImageElement | null> {
  let promise = imagePromises.get(url);
  if (!promise) {
    promise = new Promise((resolve) => {
      const img = new Image();
      const timer = setTimeout(() => resolve(null), 8000);
      img.onload = () => {
        clearTimeout(timer);
        resolve(img);
      };
      img.onerror = () => {
        clearTimeout(timer);
        resolve(null);
        imagePromises.delete(url);
      };
      img.src = url;
    });
    imagePromises.set(url, promise);
  }
  return promise;
}
function rounded(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}
function fittedText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  size: number,
  family = 'sans-serif'
) {
  let n = size;
  context.font = `600 ${n}px ${family}`;
  while (context.measureText(text).width > maxWidth && n > 14)
    context.font = `600 ${--n}px ${family}`;
  return text;
}
export async function renderCircle(
  canvas: HTMLCanvasElement,
  circle: CircleResult,
  settings: CircleDrawSettings,
  copy: CircleDrawCopy,
  signal?: AbortSignal
) {
  const nodes = layoutCircle(circle, settings);
  const theme = circleThemes[settings.theme];
  const images = await Promise.all(
    nodes.map(async (node) => {
      const url = avatarSource(node.person.avatar, node.rank === 0 ? 400 : 200);
      return url ? imageFor(url) : null;
    })
  );
  if (signal?.aborted) return;
  canvas.width = 1200;
  canvas.height = 1200;
  const context = canvas.getContext('2d');
  if (!context) return;
  context.fillStyle = theme.background;
  context.fillRect(0, 0, 1200, 1200);
  context.strokeStyle = theme.faint;
  context.lineWidth = 1;
  for (const r of [202, 350, 477]) {
    context.beginPath();
    context.arc(600, 590, r, 0, Math.PI * 2);
    context.stroke();
  }
  for (let i = 0; i < nodes.length; i++) {
    const { person, x, y, radius, rank } = nodes[i];
    context.save();
    context.shadowColor = 'rgba(20,45,32,.09)';
    context.shadowBlur = 16;
    context.shadowOffsetY = 5;
    context.fillStyle = rank === 0 ? theme.accent : theme.border;
    context.beginPath();
    context.arc(x, y, radius + (rank === 0 ? 9 : 5), 0, Math.PI * 2);
    context.fill();
    context.restore();
    context.save();
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.clip();
    const image = images[i];
    if (image) {
      const side = Math.min(image.naturalWidth, image.naturalHeight);
      context.drawImage(
        image,
        (image.naturalWidth - side) / 2,
        (image.naturalHeight - side) / 2,
        side,
        side,
        x - radius,
        y - radius,
        radius * 2,
        radius * 2
      );
    } else {
      context.fillStyle = ['#d9c4ac', '#b2cbc0', '#dfc5d2', '#c7c6df'][
        rank % 4
      ];
      context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      context.fillStyle = '#233e33';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.font = `600 ${radius * 0.8}px sans-serif`;
      context.fillText(profileInitial(person.name).toUpperCase(), x, y);
    }
    context.restore();
    if (settings.showNames || rank === 0) {
      const label =
        rank === 0 && person.id.startsWith('sample-')
          ? copy.you
          : `@${person.handle}`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      fittedText(context, label, radius * 2.4, rank === 0 ? 25 : 19);
      const width = context.measureText(label).width + 22;
      context.fillStyle = theme.border;
      rounded(context, x - width / 2, y + radius - 9, width, 33, 16);
      context.fill();
      context.fillStyle = '#233e33';
      context.fillText(label, x, y + radius + 8);
    }
    if (settings.showRanks && rank > 0) {
      const rx = x + radius * 0.72,
        ry = y - radius * 0.72;
      context.fillStyle = rank <= 3 ? '#ebc478' : theme.border;
      context.beginPath();
      context.arc(rx, ry, 18, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#233e33';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.font = '700 19px sans-serif';
      context.fillText(String(rank), rx, ry + 1);
    }
  }
  context.textAlign = 'left';
  context.textBaseline = 'middle';
  context.fillStyle = theme.ink;
  context.font = '600 23px sans-serif';
  context.fillText(
    circle.owner.id.startsWith('sample-')
      ? copy.sample
      : `@${circle.owner.handle}`,
    45,
    1144
  );
  context.textAlign = 'right';
  context.font = '500 23px sans-serif';
  context.fillText(copy.brand, 1155, 1144);
}
export function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('image_export_failed')),
      'image/png'
    )
  );
}
