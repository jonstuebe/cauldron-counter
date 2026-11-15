// Finds a Godot 4.7.2 editor with the Web (no threads) export template, or
// downloads both. Workers Builds and CI have no Godot, so they take the
// download path; a local install at the right version is used as is.
//
//   node scripts/godot.mjs        -> prints the path to the godot binary
//
// The templates archive (.tpz) is a ~1.3 GB zip. Only one ~10 MB entry
// (web_nothreads_release.zip) is needed, so it is read with HTTP range
// requests instead of downloading the whole file.
import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';

export const VERSION = '4.7.2';
const TAG = `${VERSION}-stable`;
const RELEASE = `https://github.com/godotengine/godot/releases/download/${TAG}`;
const TEMPLATE = 'web_nothreads_release.zip';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(ROOT, '.godot-bin');

function versionOf(bin) {
  try { return execFileSync(bin, ['--version'], { encoding: 'utf8' }).trim(); } catch { return ''; }
}

function templatesDir() {
  const base = platform() === 'darwin'
    ? join(homedir(), 'Library/Application Support/Godot')
    : platform() === 'win32'
      ? join(process.env.APPDATA ?? '', 'Godot')
      : join(process.env.XDG_DATA_HOME || join(homedir(), '.local/share'), 'godot');
  return join(base, 'export_templates', `${VERSION}.stable`);
}

async function fetchRange(url, start, end) {
  const res = await fetch(url, { headers: { Range: `bytes=${start}-${end}` } });
  if (res.status !== 206) throw new Error(`Range request failed (${res.status}) for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

// Reads one entry from a remote zip without downloading the rest.
async function extractRemoteZipEntry(url, suffix) {
  const head = await fetch(url, { method: 'HEAD' });
  const size = Number(head.headers.get('content-length'));
  if (!size) throw new Error(`No content-length for ${url}`);

  const tailLen = Math.min(size, 65536 + 22);
  const tail = await fetchRange(url, size - tailLen, size - 1);
  const eocd = tail.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) throw new Error('Zip end-of-central-directory not found');
  const cdSize = tail.readUInt32LE(eocd + 12);
  const cdOffset = tail.readUInt32LE(eocd + 16);
  if (cdOffset === 0xffffffff) throw new Error('Zip64 archives are not supported');

  const cd = await fetchRange(url, cdOffset, cdOffset + cdSize - 1);
  for (let p = 0; p < cd.length;) {
    if (cd.readUInt32LE(p) !== 0x02014b50) break;
    const method = cd.readUInt16LE(p + 10);
    const compSize = cd.readUInt32LE(p + 20);
    const nameLen = cd.readUInt16LE(p + 28);
    const extraLen = cd.readUInt16LE(p + 30);
    const commentLen = cd.readUInt16LE(p + 32);
    const localOffset = cd.readUInt32LE(p + 42);
    const name = cd.toString('utf8', p + 46, p + 46 + nameLen);
    p += 46 + nameLen + extraLen + commentLen;
    if (!name.endsWith(suffix)) continue;

    const local = await fetchRange(url, localOffset, localOffset + 30 + 1024 - 1);
    const dataStart = localOffset + 30 + local.readUInt16LE(26) + local.readUInt16LE(28);
    const data = await fetchRange(url, dataStart, dataStart + compSize - 1);
    if (method === 0) return data;
    if (method === 8) return inflateRawSync(data);
    throw new Error(`Unsupported zip compression method ${method} for ${name}`);
  }
  throw new Error(`${suffix} not found in ${url}`);
}

async function ensureTemplate() {
  const dest = join(templatesDir(), TEMPLATE);
  if (existsSync(dest)) return;
  console.error(`Fetching ${TEMPLATE} from the ${TAG} export templates…`);
  const buf = await extractRemoteZipEntry(`${RELEASE}/Godot_v${TAG}_export_templates.tpz`, `templates/${TEMPLATE}`);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, buf);
}

async function ensureEditor() {
  for (const bin of [process.env.GODOT, 'godot', join(CACHE, `Godot_v${TAG}_linux.x86_64`)].filter(Boolean)) {
    if (versionOf(bin).startsWith(`${VERSION}.stable`)) return bin;
  }
  if (platform() !== 'linux' || process.arch !== 'x64') {
    throw new Error(`Godot ${VERSION} not found. Install it (e.g. \`brew install --cask godot\`) or set GODOT=/path/to/godot.`);
  }
  console.error(`Downloading Godot ${TAG} (linux x86_64)…`);
  const zip = `Godot_v${TAG}_linux.x86_64.zip`;
  const res = await fetch(`${RELEASE}/${zip}`);
  if (!res.ok) throw new Error(`Download failed (${res.status}) for ${zip}`);
  mkdirSync(CACHE, { recursive: true });
  writeFileSync(join(CACHE, zip), Buffer.from(await res.arrayBuffer()));
  execFileSync('unzip', ['-o', '-q', join(CACHE, zip), '-d', CACHE]);
  const bin = join(CACHE, `Godot_v${TAG}_linux.x86_64`);
  chmodSync(bin, 0o755);
  return bin;
}

export async function ensureGodot() {
  const bin = await ensureEditor();
  await ensureTemplate();
  return bin;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(await ensureGodot());
}
