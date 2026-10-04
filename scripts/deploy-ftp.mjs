// Upload the built game (dist/) to your own webspace via SFTP (or FTP/FTPS).
// Credentials come from environment variables (e.g. GitHub Actions secrets) or, locally, from .env in the
// project root (never committed, never uploaded). Environment variables win.
//   npm run deploy:ftp
// FTP_HOST may be a plain host name or a URL like sftp://user@host:22 (protocol, user and port are taken from it).
import { readFileSync, existsSync, writeFileSync } from 'node:fs';

function loadEnv(path = '.env') {
  const env = {};
  for (const [k, v] of Object.entries(process.env)) if (k.startsWith('FTP_') && v) env[k] = v;
  if (!existsSync(path)) return env;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && !line.trim().startsWith('#') && !(m[1] in env)) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
}

const env = loadEnv();
// parse host: "sftp://user@host:22", "ftp://host", or just "host"
let proto = (env.FTP_PROTOCOL || '').toLowerCase();
let host = env.FTP_HOST || '';
let user = env.FTP_USER || '';
let port = env.FTP_PORT ? Number(env.FTP_PORT) : 0;
const um = /^(s?ftps?):\/\/(?:([^@/]+)@)?([^:/]+)(?::(\d+))?/i.exec(host);
if (um) {
  proto = proto || um[1].toLowerCase();
  user = user || um[2] || '';
  host = um[3];
  port = port || (um[4] ? Number(um[4]) : 0);
}
proto = proto || 'sftp';
if (!host || !user || !env.FTP_PASSWORD) { console.error('✗ FTP_HOST, FTP_USER oder FTP_PASSWORD fehlt (Umgebungsvariablen oder .env).'); process.exit(1); }
const dir = (env.FTP_DIR || '/aufbau').replace(/\/$/, '');

// Apache: correct types + caching for models/textures/music (like the Netlify headers)
writeFileSync('dist/.htaccess', [
  'AddType application/javascript .js .mjs',
  'AddType model/gltf-binary .glb',
  'AddType audio/mpeg .mp3',
  'AddType image/svg+xml .svg',
  '<IfModule mod_headers.c>',
  '  <FilesMatch "\\.(glb|jpg|png|mp3|svg)$">',
  '    Header set Cache-Control "public, max-age=604800"',
  '  </FilesMatch>',
  '  <FilesMatch "index\\.html$">',
  '    Header set Cache-Control "no-cache"',
  '  </FilesMatch>',
  '</IfModule>',
  '',
].join('\n'));

const isBundle = (name) => /^index-.*\.(js|css)$/.test(name);

async function viaSftp() {
  const { default: SftpClient } = await import('ssh2-sftp-client');
  const c = new SftpClient();
  await c.connect({ host, port: port || 22, username: user, password: env.FTP_PASSWORD, readyTimeout: 30000 });
  try {
    console.log(`→ verbunden mit ${host} (SFTP), lade nach ${dir} …`);
    await c.mkdir(dir, true);
    if (await c.exists(`${dir}/assets`)) {
      for (const f of await c.list(`${dir}/assets`)) if (isBundle(f.name)) await c.delete(`${dir}/assets/${f.name}`);
    }
    let n = 0;
    c.on('upload', () => { n++; if (n % 10 === 0) console.log(`  ${n} Dateien…`); });
    await c.uploadDir('dist', dir);
    console.log(`✓ fertig (${n} Dateien): das Spiel liegt jetzt in ${dir}`);
  } finally {
    await c.end();
  }
}

async function viaFtp() {
  const { Client } = await import('basic-ftp');
  const c = new Client(60000);
  try {
    await c.access({
      host, port: port || 21, user, password: env.FTP_PASSWORD,
      secure: proto === 'ftps' || env.FTP_SECURE !== 'false',
      secureOptions: { rejectUnauthorized: env.FTP_INSECURE !== 'true' }, // only set FTP_INSECURE=true if the certificate doesn't match the host
    });
    console.log(`→ verbunden mit ${host} (FTP), lade nach ${dir} …`);
    await c.ensureDir(dir);
    try { for (const f of await c.list(`${dir}/assets`)) if (isBundle(f.name)) await c.remove(`${dir}/assets/${f.name}`); } catch { /* first upload */ }
    await c.uploadFromDir('dist', dir);
    console.log(`✓ fertig: das Spiel liegt jetzt in ${dir}`);
  } finally {
    c.close();
  }
}

try {
  if (proto === 'sftp') await viaSftp(); else await viaFtp();
} catch (e) {
  console.error('✗ Upload fehlgeschlagen:', e.message);
  process.exitCode = 1;
}
