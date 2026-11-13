// Copies the web game from the repository (play/aeloria) into www/. Run inside the kinzhal-site repo only;
// the Replit zip already contains www/.
const fs = require('fs'), path = require('path');
const src = path.resolve(__dirname, '../../../play/aeloria'), dst = path.resolve(__dirname, '../www');
if (!fs.existsSync(src)) { console.log('sync-game: play/aeloria not found, keeping the existing www/'); process.exit(0); }
const skip = new Set(['tools', 'vendor', 'city3d.js', 'ART_BIBLE.md', 'SOUND_BIBLE.md', '.DS_Store']);
fs.rmSync(dst, { recursive: true, force: true });
(function copy(a, b) {
  fs.mkdirSync(b, { recursive: true });
  for (const n of fs.readdirSync(a)) { if (skip.has(n)) continue; const s = path.join(a, n), d = path.join(b, n); fs.statSync(s).isDirectory() ? copy(s, d) : fs.copyFileSync(s, d); }
})(src, dst);
console.log('sync-game: copied play/aeloria → www/');
