import { readFileSync, existsSync } from 'node:fs';
import { Script } from 'node:vm';

const required = [
  'index.html', 'reports.js', 'sw.js', 'manifest.webmanifest',
  'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'CNAME'
];
for (const file of required) {
  if (!existsSync(file)) throw new Error('Missing website file: ' + file);
}
const cname = readFileSync('CNAME', 'utf8').trim();
if (cname !== 'projects.mysomis.com') {
  throw new Error('Unexpected GitHub Pages domain: ' + cname);
}
const html = readFileSync('index.html', 'utf8');
const sw = readFileSync('sw.js', 'utf8');
const reportsJs = readFileSync('reports.js', 'utf8');
new Script(reportsJs, { filename: 'reports.js' });
if (!html.includes('<script src="./reports.js"></script>')) throw new Error('Monthly reports engine is not linked to the application');
const manifest = JSON.parse(readFileSync('manifest.webmanifest', 'utf8'));
const htmlVersion = html.match(/<meta\s+name="app-version"\s+content="([^"]+)"/i)?.[1];
const swVersion = sw.match(/const\s+VERSION\s*=\s*['"]([^'"]+)['"]/i)?.[1];
if (!htmlVersion || !swVersion || htmlVersion !== swVersion) {
  throw new Error('App and service worker versions disagree: ' + htmlVersion + ' / ' + swVersion);
}
if (!manifest.icons?.length || !manifest.start_url || !manifest.scope) {
  throw new Error('Invalid app manifest: required PWA fields missing');
}
if (!html.includes('https://mos-project-monitor-api.ormocslaughter.workers.dev')) {
  throw new Error('Cloudflare API address is missing from the frontend');
}
if (!html.includes('Developed by: Engr. Rico J. Pono')) {
  throw new Error('Developer footer is missing');
}
const inlineScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script\s*>/gi)];
if (!inlineScripts.length) throw new Error('No application script found in index.html');
for (let i = 0; i < inlineScripts.length; i++) {
  new Script(inlineScripts[i][1], { filename: 'index.html inline script ' + (i + 1) });
}
console.log('PASS: MOS Project Monitor v' + htmlVersion + ', ' + inlineScripts.length + ' inline script(s), HTTPS API, PWA manifest and custom domain');
