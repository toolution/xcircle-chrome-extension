import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

if (!existsSync(dist)) mkdirSync(dist, { recursive: true });

const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
writeFileSync(join(dist, 'manifest.json'), JSON.stringify(manifest, null, 2));

cpSync(join(root, 'icons'), join(dist, 'icons'), { recursive: true });

// Vite emits sidepanel.html; ensure relative script paths work in extension context.
const htmlPath = join(dist, 'sidepanel.html');
if (existsSync(htmlPath)) {
  let html = readFileSync(htmlPath, 'utf8');
  html = html.replaceAll('src="/', 'src="./').replaceAll('href="/', 'href="./');
  writeFileSync(htmlPath, html);
}

console.log('postbuild: manifest + icons copied');
