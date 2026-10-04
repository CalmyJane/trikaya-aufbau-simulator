// Keeps the game's music in sync with the `music/` folder. Runs automatically before `dev` and `build`.
//  - every audio file in music/ is converted to a web-friendly MP3 in public/music/ (only new/changed ones)
//  - MP3s whose source is gone are removed
//  - src/data/tracks.json is written: file, artist, title, tags  → used by the game and the credits
//  - music/credits.json (optional, created on first run, editable) holds per-artist SoundCloud links and
//    whether an artist is hidden from the credits. New artists are added automatically.
import { readdirSync, statSync, existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, extname, basename } from 'node:path';

const SRC = 'music', OUT = 'public/music', DATA = 'src/data/tracks.json', CREDITS = join(SRC, 'credits.json');
const AUDIO = new Set(['.wav', '.mp3', '.flac', '.ogg', '.m4a', '.aif', '.aiff']);

const slug = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const pretty = (a) => (a === a.toUpperCase() && a.length > 3 ? a[0] + a.slice(1).toLowerCase() : a); // ASTRALICA → Astralica

mkdirSync(OUT, { recursive: true });
mkdirSync('src/data', { recursive: true });
if (!existsSync(SRC)) mkdirSync(SRC);

// The source audio (WAVs, ~600 MB) is not in git. Without it (e.g. in GitHub Actions or a cloud session) the
// already converted public/music/*.mp3 and src/data/tracks.json are used as they are.
if (!readdirSync(SRC).some((n) => AUDIO.has(extname(n).toLowerCase()))) {
  console.log('♪ Keine Quell-Audios in music/ – nutze die vorhandenen MP3s und tracks.json.');
  process.exit(0);
}

const credits = existsSync(CREDITS) ? JSON.parse(readFileSync(CREDITS, 'utf8')) : { artists: {} };
credits.artists ||= {};
credits.tracks ||= {}; // per-file overrides: { "file.wav": { artists: [..], title: ".." } } or { ignore: true }

/** "A & B", "A x B", "A vs. B", "A feat. B", "A, B" → [A, B] */
const splitArtists = (s) => s.split(/\s*(?:,|&|\+|\bx\b|\bvs\.?|\bfeat\.?|\bft\.?)\s*/i).map((a) => a.trim()).filter(Boolean);
/** Artists mentioned in a title: "(X Remix)", "(X rmx)", "(X Edit)", "feat. X", "vs. X" */
function artistsInTitle(title) {
  const out = [];
  for (const m of title.matchAll(/[([]\s*([^()[\]]+?)\s+(?:remix|rmx|edit|bootleg|flip|vip|rework|mix)\s*[)\]]/gi)) {
    if (!/^(original|extended|radio|club|dub|mixed)$/i.test(m[1].trim())) out.push(...splitArtists(m[1]));
  }
  for (const m of title.matchAll(/\b(?:feat\.?|ft\.?|vs\.?)\s+([^()[\]]+)/gi)) out.push(...splitArtists(m[1]));
  return out;
}
const registerArtist = (name) => {
  const key = name.toLowerCase();
  if (!credits.artists[key]) credits.artists[key] = { name, link: '', hidden: /calmy\s*jane/i.test(name) };
  const a = credits.artists[key];
  if (a.soundcloud && !a.link) { a.link = a.soundcloud; } // old field name
  delete a.soundcloud;
  return a.name;
};

const files = readdirSync(SRC).sort().filter((n) => AUDIO.has(extname(n).toLowerCase()));
const sizes = {};
for (const n of files) (sizes[statSync(join(SRC, n)).size] ||= []).push(n);

const tracks = [];
let converted = 0;
for (const name of files) {
  const ov = credits.tracks[name] || {};
  if (ov.ignore) continue;
  const stem = basename(name, extname(name));
  // the same file twice (e.g. once without "Artist - "): keep the one that names the artist
  const twins = sizes[statSync(join(SRC, name)).size];
  if (twins.length > 1 && !/\s-\s/.test(stem) && twins.some((t) => t !== name && /\s-\s/.test(t))) { console.log(`♪ doppelt, übersprungen: ${name}`); continue; }
  const file = `${slug(stem)}.mp3`;
  const src = join(SRC, name), out = join(OUT, file);
  if (!existsSync(out) || statSync(out).mtimeMs < statSync(src).mtimeMs) {
    try {
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-ac', '2', '-ar', '44100', '-b:a', '128k', out], { stdio: 'inherit' });
      converted++;
      console.log(`♪ konvertiert: ${name}`);
    } catch (e) {
      console.error(`✗ ffmpeg fehlt oder ${name} ließ sich nicht konvertieren:`, e.message);
      continue;
    }
  }
  // "Artist - Title" (anything else: the whole name is the title, artist from credits.json or the name)
  const date = /(\d{4}-\d{2}-\d{2})/.exec(stem);
  const m = /^(.+?)\s+-\s+(.+)$/.exec(stem) || (date ? null : /^([^-]+?)-([^-].*)$/.exec(stem));
  let artist = m ? m[1].trim() : stem.replace(/\s*\d{4}-\d{2}-\d{2}.*$/, '').trim();
  let title = m ? m[2].trim() : (date ? date[1] : stem.trim());
  // tidy up studio leftovers in titles: "Final", "16b M", "(30sec)", "( x )"
  title = title.replace(/\s*\(\s*\d+\s*sec\s*\)/i, '').replace(/\s+(final|16b\s*m|\d+\s*bit)(\s.*)?$/i, '').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').trim();
  if (ov.title) title = ov.title;
  const main = (ov.artists || splitArtists(artist)).map((a) => registerArtist(pretty(a)));
  const featured = artistsInTitle(title).map((a) => registerArtist(pretty(a))).filter((a) => !main.includes(a));
  const tags = [];
  if (/techno/i.test(stem)) tags.push('techno');
  if (/fire/i.test(stem)) tags.push('fire');
  if (/\(\d+\s*sec\)/i.test(stem)) tags.push('clip');
  tracks.push({ file, artist: main.join(' & '), artists: [...main, ...featured], title, tags });
}

// remove MP3s whose source is gone
const keep = new Set(tracks.map((t) => t.file));
for (const f of readdirSync(OUT)) if (f.endsWith('.mp3') && !keep.has(f)) { unlinkSync(join(OUT, f)); console.log(`♪ entfernt: ${f}`); }

writeFileSync(DATA, JSON.stringify({ tracks, artists: credits.artists }, null, 2) + '\n');
writeFileSync(CREDITS, JSON.stringify(credits, null, 2) + '\n');

// CREDITS.md: regenerate the music section
if (existsSync('CREDITS.md')) {
  let md = readFileSync('CREDITS.md', 'utf8');
  const i = md.indexOf('\n## Music');
  if (i >= 0) md = md.slice(0, i);
  const byArtist = {};
  for (const t of tracks) {
    for (const a of t.artists) {
      if (credits.artists[a.toLowerCase()]?.hidden) continue;
      (byArtist[a] ||= []).push(t.title);
    }
  }
  md += '\n## Music\n\n' + Object.entries(byArtist).map(([a, ts]) => {
    const link = credits.artists[a.toLowerCase()]?.link || `https://soundcloud.com/search?q=${encodeURIComponent(a)}`;
    return `- [${a}](${link}) – ${ts.map((t) => `*${t}*`).join(', ')}`;
  }).join('\n') + '\n';
  writeFileSync('CREDITS.md', md);
}
console.log(`♪ Musik: ${tracks.length} Tracks${converted ? `, ${converted} neu konvertiert` : ''}`);
