// Run AFTER the existing Netlify site build. Never replaces the website itself.
import { readFile, mkdir, writeFile, stat, lstat, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// wrap(html, route): optional. The site build passes its own page template so these pages match kinzhal.space.
export async function installLegal(publishDir, sourceDir = path.dirname(fileURLToPath(import.meta.url)), wrap = (html) => html) {
  if (!publishDir) throw new Error('Supply the existing Netlify publish directory.');
  const root = path.resolve(publishDir);
  // A README-only checkout must not become a replacement for the live website.
  const home = await readFile(path.join(root, 'index.html'), 'utf8').catch(() => '');
  if (!/<html\b/i.test(home) || !/Kinzhal/i.test(home)) {
    throw new Error('STOP: build the existing Kinzhal website first. No legal files were written.');
  }
  const pages = await Promise.all(['privacy.html', 'terms.html', 'support.html'].map(async name => {
    const html = await readFile(path.join(sourceDir, name), 'utf8');
    if (!/Aeloria/.test(html) || !/Kinzhal LTD Co\./.test(html) || !/lang="ar"/.test(html)) {
      throw new Error('STOP: policy source failed the bilingual publisher check.');
    }
    return html;
  }));
  const routes = [
    ['aeloria/privacy/index.html', pages[0]], ['aeloria/terms/index.html', pages[1]],
    ['Aeloria/privacy/index.html', pages[0]], ['Aeloria/conditions/index.html', pages[1]],
    ['aeloria/support/index.html', pages[2]],
  ];
  // Validate ALL destinations before touching any. Refuse symlinks/other content.
  for (const [route] of routes) {
    let current = root;
    for (const part of route.split('/')) {
      current = path.join(current, part);
      const entry = await lstat(current).catch(e => { if (e.code !== 'ENOENT') throw e; return null; });
      if (entry?.isSymbolicLink()) throw new Error('STOP: a legal destination contains a symbolic link.');
    }
    const existing = await readFile(path.join(root, route), 'utf8').catch(e => {
      if (e.code !== 'ENOENT') throw e;
      return '';
    });
    if (existing && !/Aeloria/.test(existing)) {
      throw new Error('STOP: an existing legal route contains unrelated content; review it manually.');
    }
  }
  // Also reject a symlinked publish directory before writes.
  if (await realpath(root) !== root || !(await stat(root)).isDirectory()) {
    throw new Error('STOP: use the real existing publish directory, not a symlink.');
  }
  for (const [route, html] of routes) {
    const target = path.join(root, route);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, wrap(html, route));
  }
  return routes.map(([route]) => route);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const output = process.argv.find(arg => arg.startsWith('--publish-dir='))?.slice('--publish-dir='.length);
    const routes = await installLegal(output);
    console.log(`Installed ${routes.length} bilingual Aeloria pages. Homepage, app-ads.txt and other games untouched.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
