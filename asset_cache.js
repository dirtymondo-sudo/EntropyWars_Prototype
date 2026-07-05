// On-disk asset cache for Playwright, to defeat Cloudflare R2 *.r2.dev dev-endpoint
// throttling. The game pulls ~35 scripts/styles (~1.3MB, battle.js alone ~975KB)
// from the rate-limited public R2 bucket + a few CDNs. Each chromium cold-start
// re-downloads all of them; after ~15 launches the endpoint throttles and page
// loads time out.
//
// installAssetCache(context, dir) intercepts requests to those hosts: it serves
// from a local cache file when present, otherwise fetches ONCE, stores the bytes,
// and serves them. Across runs the cache persists, so each file is fetched at most
// once ever. Content-encoding/length headers are dropped (route.fetch() returns the
// already-decoded body) to avoid the browser double-decoding.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CACHEABLE_HOSTS = new Set([
  'cdn.entropywars.net',
  'cdnjs.cloudflare.com',
  'cdn.jsdelivr.net',
  'cdn.socket.io',
]);

function hostOf(url) { try { return new URL(url).host; } catch (e) { return ''; } }
function baseOf(url) { try { return path.basename(new URL(url).pathname); } catch (e) { return ''; } }

// Content-type by extension, for locally-served overrides.
const CT = { '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json',
             '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };

function cachePaths(dir, url) {
  let base = 'asset';
  try { base = path.basename(new URL(url).pathname) || 'index'; } catch (e) {}
  const h = crypto.createHash('md5').update(url).digest('hex').slice(0, 10);
  const file = path.join(dir, `${h}_${base}`);
  return { file, meta: file + '.json' };
}

// Freshness controls (important when you're actively editing the R2 files — the
// cache is URL-keyed with no validation, so it will happily serve a STALE copy):
//   ASSET_CACHE=off        → bypass entirely, always fetch live from R2/CDN
//   ASSET_CACHE_TTL_MIN=N  → treat cache entries older than N minutes as stale
//                            (re-fetch them). Default 0 = never expire within a run.
// Or just `rm -rf .asset-cache` to force a full refresh.
async function installAssetCache(context, dir = path.join(__dirname, '.asset-cache')) {
  const OFF = String(process.env.ASSET_CACHE || '').toLowerCase() === 'off';
  const TTL_MS = (parseFloat(process.env.ASSET_CACHE_TTL_MIN) || 0) * 60000;
  if (OFF) { return { stats: () => ({ hits: 0, misses: 0, disabled: true }) }; }
  // LOCAL_ASSETS=online.js,battle.js → serve the repo-local copy of these files in
  // place of the R2 versions, so you can TEST edits to the R2-hosted scripts locally
  // before deploying them to the bucket. (The live game still loads from R2 until you
  // re-upload — this only affects the Playwright harness.)
  const localNames = new Set(String(process.env.LOCAL_ASSETS || '').split(',').map(s => s.trim()).filter(Boolean));
  fs.mkdirSync(dir, { recursive: true });
  let hits = 0, misses = 0, locals = 0;
  await context.route('**/*', async (route) => {
    const url = route.request().url();
    if (!CACHEABLE_HOSTS.has(hostOf(url))) return route.continue();
    const base = baseOf(url);
    if (localNames.has(base)) {
      const local = path.join(__dirname, base);
      if (fs.existsSync(local)) {
        locals++;
        const ct = CT[path.extname(base)] || 'application/octet-stream';
        return route.fulfill({ status: 200, contentType: ct, body: fs.readFileSync(local) });
      }
    }
    const { file, meta } = cachePaths(dir, url);
    try {
      if (fs.existsSync(file) && fs.existsSync(meta)) {
        const fresh = TTL_MS <= 0 || (Date.now() - fs.statSync(file).mtimeMs) < TTL_MS;
        if (fresh) {
          const { contentType } = JSON.parse(fs.readFileSync(meta, 'utf8'));
          hits++;
          return route.fulfill({ status: 200, contentType, body: fs.readFileSync(file) });
        }
      }
    } catch (e) { /* fall through to network */ }
    try {
      const resp = await route.fetch();
      const body = await resp.body();
      const contentType = resp.headers()['content-type'] || 'application/octet-stream';
      if (resp.ok()) {
        fs.writeFileSync(file, body);
        fs.writeFileSync(meta, JSON.stringify({ contentType, url }));
        misses++;
      }
      return route.fulfill({ status: resp.status(), contentType, body });
    } catch (e) {
      return route.continue();
    }
  });
  return { stats: () => ({ hits, misses, locals }) };
}

module.exports = { installAssetCache };
