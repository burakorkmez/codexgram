import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const target = 'dev:savory-raven-325';
const local = readFileSync('.env.local', 'utf8');
const configured = local.match(/^CONVEX_DEPLOYMENT\s*=\s*([^\s#]+)/m)?.[1];
if (configured !== target || process.env.CONVEX_DEPLOY_KEY || (process.env.CONVEX_DEPLOYMENT && process.env.CONVEX_DEPLOYMENT !== target)) throw new Error('Refusing to seed: expected the existing codexgram development deployment, without a deploy-key override.');
const username = process.argv[2] || 'burakorkmez';
function run(name, args) {
  let output;
  try { output = execFileSync('npx', ['convex', 'run', name, JSON.stringify(args), '--deployment', 'savory-raven-325'], { encoding: 'utf8', maxBuffer: 2 * 1024 * 1024, stdio: ['ignore', 'pipe', 'inherit'] }); }
  catch { throw new Error(`Seed step ${name} failed. See the CLI error above; rerunning is safe.`); }
  return JSON.parse(output);
}
console.log(`Target: development savory-raven-325; connecting @${username} to fictional demo members.`);
const assets = Array.from({ length: 9 }, (_, i) => [`photo-${i + 1}`, `assets/images/profile/photo-${i + 1}.png`]);
['alex', 'maya', 'jordan', 'taylor', 'casey', 'avatar'].forEach((name, i) => assets.push([`avatar-${i}`, name === 'avatar' ? 'assets/images/profile/avatar.png' : `assets/images/feed/${name}.png`]));
for (const [key, path] of assets) {
  const image = readFileSync(path);
  run('seed:storeAsset', { key, base64: image.toString('base64'), width: image.readUInt32BE(16), height: image.readUInt32BE(20) });
  console.log(`Ready: ${key}`);
}
console.log(run('seed:initialize', { username }));
for (let start = 0; start < 162; start += 12) console.log(`Posts ${start + 1}–${Math.min(start + 12, 162)}:`, run('seed:populate', { start, count: 12 }));
console.log('Verified seed totals:', run('seed:summary', { username }));
