// src/modules/landingPages/landingPage.service.ts
//
// Campaign landing pages served at timesauto.net/drive/<slug>/.
//
// Stored as files rather than rows. These are self-contained HTML with
// their own images, they carry no site chrome, and nginx serves them
// straight from disk — putting the markup in Postgres would add a
// database round-trip and a render step to a page whose whole point is
// that it is already finished. The directory is the source of truth, so
// a page uploaded by hand and one uploaded here behave identically.

import fs from 'fs/promises';
import path from 'path';
import { env } from '@/config/env';
import { ApiError } from '@/core/errors/ApiError';
import type { LandingPageRecord } from './landingPage.types';

// nginx's docroot for the site, where /banners/ and /go/ already live.
export const LANDING_ROOT = path.resolve(
  env.landingPageRoot || '/var/www/timesauto_ne_usr/data/www/timesauto.net/drive',
);

const INDEX_FILE = 'index.html';

// A slug becomes a directory name and a public URL, so it is restricted
// to what is safe in both. Rejecting rather than sanitising keeps the
// name the admin typed the name that gets served.
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function assertSafeSlug(slug: string): void {
  if (!SLUG_PATTERN.test(slug) || slug.length > 80) {
    throw ApiError.badRequest(
      'Use lowercase letters, numbers and single hyphens — for example "mahindra-scorpio".',
    );
  }
}

// Every path is rebuilt from a validated slug and resolved against the
// root before use: a slug that escaped validation still cannot reach
// outside the directory.
function pageDir(slug: string): string {
  assertSafeSlug(slug);
  const dir = path.resolve(LANDING_ROOT, slug);
  if (dir !== path.join(LANDING_ROOT, slug)) {
    throw ApiError.badRequest('Invalid page name');
  }
  return dir;
}

async function dirSize(dir: string): Promise<number> {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  let total = 0;
  for (const entry of entries) {
    if (entry.isFile()) {
      const stat = await fs.stat(path.join(dir, entry.name)).catch(() => null);
      total += stat?.size ?? 0;
    }
  }
  return total;
}

export async function listLandingPages(): Promise<LandingPageRecord[]> {
  const entries = await fs.readdir(LANDING_ROOT, { withFileTypes: true }).catch(() => []);
  const pages: LandingPageRecord[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(LANDING_ROOT, entry.name);
    const indexPath = path.join(dir, INDEX_FILE);
    const stat = await fs.stat(indexPath).catch(() => null);

    const files = (await fs.readdir(dir).catch(() => [])) as string[];
    pages.push({
      slug: entry.name,
      url: `/drive/${entry.name}/`,
      // A directory with no index.html is a broken page, not a hidden
      // one — surfaced so it can be fixed rather than silently omitted.
      hasIndex: stat !== null,
      title: stat ? await readTitle(indexPath) : null,
      assetCount: Math.max(files.length - (stat ? 1 : 0), 0),
      sizeBytes: await dirSize(dir),
      updatedAt: stat?.mtime.toISOString() ?? null,
    });
  }

  return pages.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
}

// The <title> is what the admin list shows, so the page identifies itself
// rather than being identified only by its slug.
async function readTitle(indexPath: string): Promise<string | null> {
  const html = await fs.readFile(indexPath, 'utf8').catch(() => '');
  const match = html.match(/<title>([^<]*)<\/title>/i);
  return match ? match[1].trim().slice(0, 200) : null;
}

export async function getLandingPage(slug: string): Promise<LandingPageRecord> {
  const dir = pageDir(slug);
  const stat = await fs.stat(dir).catch(() => null);
  if (!stat?.isDirectory()) throw ApiError.notFound(`Landing page "${slug}" not found`);

  const pages = await listLandingPages();
  const found = pages.find((p) => p.slug === slug);
  if (!found) throw ApiError.notFound(`Landing page "${slug}" not found`);
  return found;
}

export async function saveLandingPageHtml(slug: string, html: string): Promise<LandingPageRecord> {
  const dir = pageDir(slug);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, INDEX_FILE), html, 'utf8');
  await adoptSiteOwner(path.join(dir, INDEX_FILE));
  return getLandingPage(slug);
}

export async function readLandingPageHtml(slug: string): Promise<string> {
  const indexPath = path.join(pageDir(slug), INDEX_FILE);
  const html = await fs.readFile(indexPath, 'utf8').catch(() => null);
  if (html === null) throw ApiError.notFound(`Landing page "${slug}" has no ${INDEX_FILE}`);
  return html;
}

// PHP is the one server-side language wired up for /drive/ (apache on
// :81 handles it, as the site user). Everything else here would be sent
// to the browser as source rather than executed, publishing whatever is
// inside; nginx refuses to serve them, and refusing the upload too means
// the author finds out now rather than from a leaked file later.
const BLOCKED_EXTENSIONS = new Set([
  '.phtml', '.php5', '.phar', '.inc', '.env', '.sh', '.bash', '.py', '.rb', '.pl', '.cgi',
  '.htaccess', '.htpasswd',
]);

// Anything a landing page legitimately serves.
const ALLOWED_EXTENSIONS = new Set([
  '.html', '.htm', '.php', '.css', '.js', '.mjs', '.json', '.txt', '.xml', '.webmanifest', '.map',
  '.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg', '.ico',
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.mp4', '.webm', '.mp3',
]);

const MAX_PATH_DEPTH = 3;

// A landing page is a folder, so a file may be "css/site.css" as easily
// as "hero.jpg". Every segment is checked and the result re-resolved
// against the page directory, so no relative path can climb out of it.
export function safeRelativePath(slug: string, filename: string): string {
  const dir = pageDir(slug);
  const parts = filename.replace(/\\/g, '/').split('/').filter((p) => p !== '' && p !== '.');

  if (parts.length === 0 || parts.length > MAX_PATH_DEPTH) {
    throw ApiError.badRequest(`Invalid file path "${filename}"`);
  }
  for (const part of parts) {
    if (part === '..' || !/^[A-Za-z0-9._-]+$/.test(part) || part.startsWith('.')) {
      throw ApiError.badRequest(`Invalid file path "${filename}"`);
    }
  }

  const ext = path.extname(parts[parts.length - 1]).toLowerCase();
  if (BLOCKED_EXTENSIONS.has(ext)) {
    throw ApiError.badRequest(
      `"${filename}" cannot run here — PHP is the only server-side language enabled for landing pages, so this would be served as source and expose whatever is inside it.`,
    );
  }
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw ApiError.badRequest(`"${filename}" has an unsupported file type`);
  }

  const target = path.resolve(dir, parts.join('/'));
  if (target !== path.join(dir, ...parts)) {
    throw ApiError.badRequest(`Invalid file path "${filename}"`);
  }
  return target;
}

// This API runs as root, but PHP under /drive/ runs as the site user. A
// page folder left root-owned is one submit.php cannot create its
// storage/ directory inside — and its filesystem calls are all
// error-suppressed, so leads would disappear with nothing in any log.
// The owner is read off the drive root rather than configured, so it
// tracks whatever the site user actually is.
let siteOwner: { uid: number; gid: number } | null | undefined;

async function ownerOfLandingRoot(): Promise<{ uid: number; gid: number } | null> {
  if (siteOwner === undefined) {
    const stat = await fs.stat(LANDING_ROOT).catch(() => null);
    siteOwner = stat ? { uid: stat.uid, gid: stat.gid } : null;
  }
  return siteOwner;
}

// Every directory between the drive root and the file is adopted too: a
// subfolder created along the way would otherwise stay root-owned and
// block writes just as surely as the page folder would. Not running as
// root is the normal case in development, where chown is both impossible
// and unnecessary — hence the swallowed error.
async function adoptSiteOwner(target: string): Promise<void> {
  const owner = await ownerOfLandingRoot();
  if (!owner) return;

  const paths: string[] = [];
  for (let p = target; p.startsWith(LANDING_ROOT) && p !== LANDING_ROOT; p = path.dirname(p)) {
    paths.push(p);
  }
  for (const p of paths) {
    await fs.chown(p, owner.uid, owner.gid).catch(() => undefined);
  }
}

// Files keep the exact name the page references — an uploaded
// "scorpio-hero.jpg" has to land as exactly that, or the relative src in
// the HTML breaks.
export async function saveLandingAsset(slug: string, filename: string, data: Buffer): Promise<void> {
  const target = safeRelativePath(slug, filename);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, data);
  await adoptSiteOwner(target);
}

export interface LandingFile {
  name: string;
  sizeBytes: number;
  updatedAt: string;
}

// Walks the folder so subdirectories show up too; the admin needs to see
// everything that is actually there, not just the top level.
export async function listLandingFiles(slug: string, prefix = ''): Promise<LandingFile[]> {
  const dir = path.join(pageDir(slug), prefix);
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const out: LandingFile[] = [];

  for (const entry of entries) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (rel.split('/').length < MAX_PATH_DEPTH) out.push(...(await listLandingFiles(slug, rel)));
      continue;
    }
    const stat = await fs.stat(path.join(dir, entry.name)).catch(() => null);
    if (stat) out.push({ name: rel, sizeBytes: stat.size, updatedAt: stat.mtime.toISOString() });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export async function deleteLandingFile(slug: string, filename: string): Promise<void> {
  const target = safeRelativePath(slug, filename);
  await fs.rm(target, { force: true });
}

export async function deleteLandingPage(slug: string): Promise<void> {
  const dir = pageDir(slug);
  const stat = await fs.stat(dir).catch(() => null);
  if (!stat?.isDirectory()) throw ApiError.notFound(`Landing page "${slug}" not found`);
  await fs.rm(dir, { recursive: true, force: true });
}

// Creating the folder is enough to make a page exist: uploading an
// index.html is as valid a way to publish as pasting the markup.
export async function ensureLandingPage(slug: string): Promise<void> {
  const dir = pageDir(slug);
  await fs.mkdir(dir, { recursive: true });
  await adoptSiteOwner(dir);
}
