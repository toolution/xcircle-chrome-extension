import { execSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const outDir = join(root, 'store');
const zip = join(outDir, 'xcircle-chrome-extension-v1.0.0.zip');

if (!existsSync(dist)) {
  console.error('Run npm run build first');
  process.exit(1);
}
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

execSync(`cd "${dist}" && zip -r "${zip}" . -x "*.DS_Store"`, {
  stdio: 'inherit',
});
console.log(`Packed: ${zip}`);
