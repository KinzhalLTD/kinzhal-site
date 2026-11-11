// Aeloria: Age of Crowns — real-time 3D city (Three.js / WebGL).
// Lit by a moving sun with soft shadows, ACES tone mapping and bloom; animated water, day/night,
// realm architecture and forests, chimney smoke and fireflies. Falls back to the SVG city when WebGL is missing.
import * as THREE from 'three';
import { EffectComposer } from './vendor/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from './vendor/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './vendor/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from './vendor/jsm/postprocessing/OutputPass.js';
import { RoomEnvironment } from './vendor/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from './vendor/jsm/geometries/RoundedBoxGeometry.js';

// Uses the game's globals by name: S, INNER, FIELD_POS, BLD, ART, META, inQueue, openPlots, upgradeCheck, troopCount, nightAmt, warmAmt, dayP.
const SC = 24; // world units per half-wall
const toWorld = (x, y) => { const u = (x - 500) / 350, v = (y - 290) / 178; return new THREE.Vector3((u + v) * SC, 0, (v - u) * SC); };
const rnd = (seed => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; })(1234567);

let renderer, scene, camera, composer, bloom, sun, moon, hemi, sky, water, root, ground, wallsGroup, treesGroup, fx, ui, host, raycaster, pointer;
let active = false, built = false, sig = '', pickables = [], anchors = [], hover = null, failed = false, realmKey = '';
const cam = { tx: 0, tz: 6, dist: 118, yaw: Math.PI / 4, pitch: .82, vx: 0, vz: 0 };
const tier = (() => { const mob = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent); const weak = (navigator.deviceMemory || 8) <= 4 || (navigator.hardwareConcurrency || 8) <= 4; return mob || weak ? 'med' : 'high'; })();

/* ---------------- materials ---------------- */
const MATS = new Map();
function mat(color, o = {}) {
  const key = color + JSON.stringify(o);
  if (!MATS.has(key)) MATS.set(key, new THREE.MeshStandardMaterial({ color, roughness: o.r ?? .82, metalness: o.m ?? 0, flatShading: !!o.flat, emissive: o.e ? new THREE.Color(o.e) : undefined, emissiveIntensity: o.ei ?? 0, transparent: !!o.t, opacity: o.op ?? 1, envMapIntensity: .45 }));
  return MATS.get(key);
}
const winMat = new THREE.MeshStandardMaterial({ color: '#2a1a10', emissive: new THREE.Color('#ffb04a'), emissiveIntensity: 0, roughness: .6 });
const glowMats = [];
const glow = (c, base = 1.6) => { const m = new THREE.MeshStandardMaterial({ color: c, emissive: new THREE.Color(c), emissiveIntensity: base, roughness: .4 }); m.userData.base = base; glowMats.push(m); return m; };
const gold = () => mat('#e8b04a', { r: .28, m: .9 });

/* ---------------- primitive helpers ---------------- */
function mesh(geo, m, x = 0, y = 0, z = 0, parent) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; if (parent) parent.add(o); return o; }
const rbox = (w, h, d, m, x, y, z, p, r = .22) => mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 4, h / 4, d / 4)), m, x, y + h / 2, z, p);
const box = (w, h, d, m, x, y, z, p) => mesh(new THREE.BoxGeometry(w, h, d), m, x, y + h / 2, z, p);
const cyl = (rt, rb, h, m, x, y, z, p, seg = 16) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m, x, y + h / 2, z, p);
function windows(p, w, d, y, n = 2, h = .9) {
  for (let i = 0; i < n; i++) { const off = (i - (n - 1) / 2) * (w / (n + .4)); const g = new THREE.BoxGeometry(.55, h, .08); mesh(g, winMat, off, y, d / 2 + .02, p).castShadow = false; const g2 = new THREE.BoxGeometry(.08, h, .55); mesh(g2, winMat, w / 2 + .02, y, off * (d / w), p).castShadow = false; }
}
function crenels(p, w, d, y, m) {
  const n = Math.max(2, Math.round(w / 1.4)); const g = new THREE.BoxGeometry(.6, .6, .6);
  for (let i = 0; i < n; i++) { const t = (i / (n - 1) - .5) * (w - .6); mesh(g, m, t, y + .3, d / 2 - .3, p); mesh(g, m, t, y + .3, -d / 2 + .3, p); }
  const nz = Math.max(2, Math.round(d / 1.4)); for (let i = 1; i < nz - 1; i++) { const t = (i / (nz - 1) - .5) * (d - .6); mesh(g, m, w / 2 - .3, y + .3, t, p); mesh(g, m, -w / 2 + .3, y + .3, t, p); }
}
// Roof caps in each realm's style
function cap(p, style, r, y, color, x = 0, z = 0) {
  const m = mat(color, { r: .6 });
  const g = new THREE.Group(); g.position.set(x, y, z); p.add(g);
  switch (style) {
    case 'dome': {
      mesh(new THREE.SphereGeometry(r, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), mat(color, { r: .35, m: .25 }), 0, 0, 0, g);
      cyl(.06, .06, r * .5, gold(), 0, r * .95, 0, g, 6); mesh(new THREE.SphereGeometry(r * .12, 12, 8), gold(), 0, r * 1.5, 0, g); break;
    }
    case 'pagoda': {
      const t1 = mesh(new THREE.CylinderGeometry(r * .55, r * 1.35, r * .55, 4, 1), m, 0, r * .27, 0, g); t1.rotation.y = Math.PI / 4;
      box(r * .9, r * .45, r * .9, mat('#cdbf9f'), 0, r * .55, 0, g);
      const t2 = mesh(new THREE.CylinderGeometry(r * .2, r * 1.0, r * .5, 4, 1), m, 0, r * 1.25, 0, g); t2.rotation.y = Math.PI / 4;
      cyl(.05, .05, r * .6, gold(), 0, r * 1.5, 0, g, 6); mesh(new THREE.SphereGeometry(r * .1, 10, 8), gold(), 0, r * 2.1, 0, g); break;
    }
    case 'thatch': { mesh(new THREE.ConeGeometry(r * 1.2, r * 1.2, 12, 3), mat(color, { r: 1, flat: true }), 0, r * .6, 0, g); break; }
    case 'cone': { mesh(new THREE.ConeGeometry(r * 1.15, r * 1.5, 10, 2), mat(color, { r: .95, flat: true }), 0, r * .75, 0, g); mesh(new THREE.TorusGeometry(r * .85, .08, 6, 20), mat('#3a2414'), 0, r * .3, 0, g).rotation.x = Math.PI / 2; break; }
    default: { const c = mesh(new THREE.ConeGeometry(r * 1.3, r * 1.15, 4, 1), m, 0, r * .57, 0, g); c.rotation.y = Math.PI / 4; }
  }
  return g;
}
function flag(p, x, y, z, color, h = 3) {
  cyl(.06, .06, h, mat('#5a3418'), x, y, z, p, 6);
  const geo = new THREE.PlaneGeometry(1.6, 1, 8, 1); geo.translate(.8, 0, 0);
  const f = mesh(geo, new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, roughness: .7 }), x, y + h - .55, z, p); f.userData.flag = { base: geo.attributes.position.array.slice(), ph: rnd() * 6 };
  flags.push(f); return f;
}
const flags = [];

/* ---------------- buildings ---------------- */
function building(id, L, P) {
  const g = new THREE.Group(), wall = mat(P.wall), wall2 = mat(P.wall2), wall3 = mat(P.wall3), roofC = L >= 10 && id === 'citadel' ? '#e8a33d' : P.roof, style = P.cap;
  const col = (S && S.color) || '#e8a33d';
  switch (id) {
    case 'citadel': {
      const h = 7 + Math.min(L, 20) * .22;
      rbox(13, h, 13, wall, 0, 0, 0, g); crenels(g, 13, 13, h, wall2); windows(g, 13, 13, h * .55, 3);
      for (const [x, z] of [[-6.5, -6.5], [6.5, -6.5], [-6.5, 6.5], [6.5, 6.5]]) { cyl(2, 2.2, h + 3, wall2, x, 0, z, g, 18); cap(g, style, 2.3, h + 3, roofC, x, z); }
      rbox(6.5, 5 + L * .1, 6.5, mat(P.wall, { r: .7 }), 0, h, 0, g); windows(g, 6.5, 6.5, h + 2.4, 2);
      cap(g, style, 3.8, h + 5 + L * .1, roofC);
      box(3.2, 4.2, .6, mat('#3a2414'), 0, 0, 6.6, g);
      flag(g, -6.5, h + 3 + 2.4, -6.5, col); flag(g, 6.5, h + 3 + 2.4, -6.5, P.color);
      if (L >= 5) { cyl(.9, 1.1, 3, wall2, 0, h + 7.5 + L * .1, 0, g, 12); }
      break;
    }
    case 'barracks': rbox(12, 4, 7, wall, 0, 0, 0, g); crenels(g, 12, 7, 4, wall2); windows(g, 12, 7, 2.3, 3);
      for (const x of [-3, 3]) { const t = mesh(new THREE.CylinderGeometry(1, 1, .25, 20), mat(x < 0 ? '#b3433a' : '#2f5a8a'), x, 2.6, 3.65, g); t.rotation.x = Math.PI / 2; }
      box(.25, 3, .25, mat('#7e4a22'), -7, 0, 2, g); box(.25, 3, .25, mat('#7e4a22'), -7, 0, -2, g); box(.2, .2, 4, mat('#7e4a22'), -7, 2.6, 0, g);
      flag(g, 5.5, 4, -3, '#b3433a'); break;
    case 'mews': rbox(9, 5, 8, wall, 0, 0, 0, g); windows(g, 9, 8, 2.8, 2); cap(g, style, 4.4, 5, P.roof);
      cyl(.6, .8, 1.2, wall3, 0, 0, 5.5, g, 12); mesh(new THREE.TorusGeometry(.7, .18, 8, 16), gold(), 0, 1.7, 5.5, g); break;
    case 'academy': rbox(8, 5, 8, mat(P.wall, { r: .7 }), 0, 0, 0, g); windows(g, 8, 8, 2.8, 2); cap(g, style, 3.8, 5, P.roof);
      cyl(.8, 1, 9, wall2, 4.6, 0, -2.8, g, 12); mesh(new THREE.SphereGeometry(.9, 16, 12), glow('#7fe0ff', .9), 4.6, 9.9, -2.8, g); break;
    case 'infirmary': rbox(9, 3.6, 7, wall, 0, 0, 0, g); windows(g, 9, 7, 2, 2); cap(g, style, 2.6, 3.6, '#f2ede4');
      box(.5, 2, .2, glow('#3fd7c8', .7), 0, 1, 3.6, g); box(1.8, .5, .2, glow('#3fd7c8', .7), 0, 1.75, 3.6, g); break;
    case 'vault': rbox(7, 5, 7, wall2, 0, 0, 0, g); crenels(g, 7, 7, 5, wall3); box(2.4, 3, .3, glow('#ffc04a', .5), 0, 0, 3.55, g); break;
    case 'tower': cyl(1.8, 2.2, 14, wall, 0, 0, 0, g, 18); box(4.6, 1.4, 4.6, wall2, 0, 14, 0, g); crenels(g, 4.6, 4.6, 15.4, wall3); cap(g, style, 2.4, 15.4, P.roof);
      mesh(new THREE.SphereGeometry(.45, 12, 8), glow('#ffcf6b', 1.2), 0, 13.2, 2.2, g); break;
    case 'wall': for (const x of [-4.5, 4.5]) { cyl(2.2, 2.4, 9, wall2, x, 0, 0, g, 16); cap(g, style, 2.5, 9, P.roof, x, 0); }
      rbox(7, 6.5, 4, wall, 0, 0, 0, g); crenels(g, 7, 4, 6.5, wall2); box(3, 4.2, .4, mat('#5a3418'), 0, 0, 2.05, g); flag(g, -4.5, 11.4, 0, col); flag(g, 4.5, 11.4, 0, P.color); break;
    case 'embassy': rbox(9, 4, 7, mat(P.wall, { r: .7 }), 0, 0, 0, g); windows(g, 9, 7, 2.2, 2); cap(g, style, 4, 4, P.roof); flag(g, -3.8, 4, 2.8, '#2b4a8a', 4); break;
    case 'market': for (const [x, c] of [[-4.5, '#b3433a'], [0, '#2f5a8a'], [4.5, '#e8a33d']]) {
      box(3.6, 1.6, 3, mat('#8a5a3a'), x, 0, 0, g); for (const dx of [-1.6, 1.6]) box(.15, 2.8, .15, mat('#5a3418'), x + dx, 0, 1.4, g);
      const a = box(4, .15, 3.6, mat(c, { r: .8 }), x, 2.8, .3, g); a.rotation.x = -.18;
      for (let i = 0; i < 4; i++) mesh(new THREE.SphereGeometry(.32, 10, 8), mat(['#f0c04a', '#9fc3e6', '#3e8a4a', '#ff7a59'][i]), x - 1.1 + i * .73, 1.9, .6, g); } break;
    case 'farm': {
      for (let i = 0; i < 7; i++) box(8, .25, .9, mat(i % 2 ? '#c9b24a' : '#7aa64a', { r: 1 }), 0, 0, -3.2 + i * 1.05, g);
      rbox(3, 2.6, 2.6, mat('#9c4a2a'), -5.6, 0, -2.2, g); cap(g, 'default', 2, 2.6, '#5a3418', -5.6, -2.2);
      cyl(.9, .9, 1.4, mat('#e8c35a', { r: 1 }), -5.4, 0, 2.2, g, 12); break;
    }
    case 'lumber': for (let i = 0; i < 3; i++) { const lg = mesh(new THREE.CylinderGeometry(.5, .5, 5, 12), mat('#8a5a3a'), 0, .5 + i * .9, (i - 1) * 1.05, g); lg.rotation.z = Math.PI / 2; }
      for (const [x, z] of [[-4, -3], [3.5, -3.5], [-3.5, 3.4]]) treeInto(g, P.tree, x, z, 1.1); box(2.4, .3, 1.2, mat('#c9a26b'), 3.5, 0, 2.6, g); break;
    case 'quarry': { const rock = mat('#a9a39a', { flat: true, r: .95 }), rock2 = mat('#857f77', { flat: true, r: .95 });
      for (let i = 0; i < 6; i++) { const r = .9 + rnd() * 1.3; mesh(new THREE.DodecahedronGeometry(r, 0), i % 2 ? rock : rock2, (rnd() - .5) * 7, r * .6, (rnd() - .5) * 6, g).rotation.set(rnd(), rnd(), rnd()); }
      box(4, .4, 3, mat('#5a5048'), 0, -.2, 0, g); break; }
    case 'mine': { const m2 = mesh(new THREE.SphereGeometry(4.5, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat('#857f77', { flat: true, r: .95 }), 0, 0, 0, g); m2.scale.y = .7;
      box(2.4, 2.6, 1, mat('#1b1430'), 0, 0, 3.4, g); box(3, .35, 1.2, mat('#7e4a22'), 0, 2.6, 3.5, g); for (const x of [-1.35, 1.35]) box(.3, 2.6, .3, mat('#7e4a22'), x, 0, 3.9, g);
      mesh(new THREE.OctahedronGeometry(.5), glow('#9fd0ff', .8), 2.6, 1.6, 2.6, g); break; }
    default: { // empty plot
      const fr = new THREE.Mesh(new THREE.RingGeometry(3.4, 3.8, 4), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .55 })); fr.rotation.x = -Math.PI / 2; fr.rotation.z = Math.PI / 4; fr.position.y = .08; g.add(fr);
    }
  }
  return g;
}
function scaffold(g, h) {
  const m = mat('#7e4a22'); for (const [x, z] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) box(.18, h, .18, m, x, 0, z, g);
  for (const y of [h * .4, h * .8]) { box(6.2, .14, .14, m, 0, y, 3, g); box(6.2, .14, .14, m, 0, y, -3, g); box(.14, .14, 6.2, m, 3, y, 0, g); box(.14, .14, 6.2, m, -3, y, 0, g); }
}

/* ---------------- trees (instanced) ---------------- */
const TREE_DEF = {
  oak: { trunk: [.3, .45, 2.4, '#6a4a2a'], crown: () => new THREE.IcosahedronGeometry(2, 1), cy: 3.6, cc: '#4f8a3c' },
  pine: { trunk: [.25, .35, 1.6, '#5a3a24'], crown: () => new THREE.ConeGeometry(1.7, 5, 9), cy: 3.8, cc: '#3f7f5a' },
  palm: { trunk: [.18, .3, 5, '#8a6a3c'], crown: () => { const g = new THREE.ConeGeometry(2.8, 1.3, 9); g.rotateX(Math.PI); return g; }, cy: 5.4, cc: '#3e8a4a' },
  bamboo: { trunk: [.12, .14, 6.5, '#7fae5a'], crown: () => new THREE.IcosahedronGeometry(1.3, 0), cy: 6.2, cc: '#6fbf5a' },
  acacia: { trunk: [.22, .3, 3.2, '#6a4a2a'], crown: () => new THREE.CylinderGeometry(3, 2.6, .8, 12), cy: 3.6, cc: '#8a9a3a' },
  cherry: { trunk: [.25, .4, 2.2, '#5a3a2a'], crown: () => new THREE.IcosahedronGeometry(1.9, 1), cy: 3.3, cc: '#f5b0c8' }
};
function treeInto(g, kind, x, z, s = 1) { const d = TREE_DEF[kind] || TREE_DEF.oak; const [rt, rb, h, c] = d.trunk; cyl(rt * s, rb * s, h * s, mat(c), x, 0, z, g, 7); mesh(d.crown(), mat(d.cc, { flat: true }), x, d.cy * s, z, g).scale.setScalar(s); }
function forest(P, avoid) {
  const grp = new THREE.Group(), pts = [];
  const free = (x, z) => Math.max(Math.abs(x), Math.abs(z)) > 31 && Math.hypot(x - 3, z + 51) > 14 && avoid.every(([ax, az]) => Math.hypot(x - ax, z - az) > 6.5) && !(x > 20 && z > 20 && Math.abs(x - z) < 9) && pts.every(([px, pz]) => Math.hypot(x - px, z - pz) > 3.2);
  for (let i = 0; i < 4000 && pts.length < (tier === 'high' ? 260 : 170); i++) { const x = (rnd() - .5) * 190, z = (rnd() - .5) * 190; if (free(x, z)) pts.push([x, z]); }
  const kinds = P.realm === 'jade' ? [P.tree, 'cherry'] : [P.tree, P.tree, P.realm === 'greenhold' ? 'pine' : P.tree];
  const per = {}; pts.forEach(p => { const k = kinds[Math.floor(rnd() * kinds.length)]; (per[k] = per[k] || []).push(p); });
  const dummy = new THREE.Object3D();
  for (const [k, list] of Object.entries(per)) {
    const d = TREE_DEF[k], [rt, rb, h, c] = d.trunk;
    const tg = new THREE.CylinderGeometry(rt, rb, h, 6); tg.translate(0, h / 2, 0); const cg = d.crown(); cg.translate(0, d.cy, 0);
    const tm = new THREE.InstancedMesh(tg, mat(c), list.length), cm = new THREE.InstancedMesh(cg, mat(d.cc, { flat: true }), list.length);
    const col = new THREE.Color(); list.forEach(([x, z], i) => { const s = .75 + rnd() * .6; dummy.position.set(x, heightAt(x, z), z); dummy.rotation.y = rnd() * 6; dummy.scale.setScalar(s); dummy.updateMatrix(); tm.setMatrixAt(i, dummy.matrix); cm.setMatrixAt(i, dummy.matrix); col.set(d.cc).offsetHSL((rnd() - .5) * .04, 0, (rnd() - .5) * .08); cm.setColorAt(i, col); });
    for (const m of [tm, cm]) { m.castShadow = true; m.receiveShadow = true; grp.add(m); }
  }
  return grp;
}

/* ---------------- terrain, walls, water, sky ---------------- */
function noise2(x, z) { return Math.sin(x * .07 + Math.sin(z * .05) * 2) * .5 + Math.sin(z * .09 + x * .03) * .35 + Math.sin((x + z) * .21) * .15; }
function heightAt(x, z) { const d = Math.max(Math.abs(x), Math.abs(z)); const k = THREE.MathUtils.smoothstep(d, 34, 90); return k * (noise2(x, z) * 2.2 + 1) + THREE.MathUtils.smoothstep(d, 80, 130) * 9; }
const GROUND_TEX = { frostmark: 'snow', amber: 'sand', sunveldt: 'sand' }, texLoader = new THREE.TextureLoader();
const artUrl = (k, id) => (typeof ART !== 'undefined' && ART.asset) ? ART.asset(k, id) : null;
function paintTex(mesh, id, rep) {
  const url = artUrl('ground', id); if (!url || mesh.userData.tex === url) return; mesh.userData.tex = url;
  texLoader.load(url, t => { t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = 4; mesh.material.map = t; if (mesh.userData.tint) mesh.material.color.set(mesh.userData.tint); mesh.material.needsUpdate = true; });
}
let groundMesh, yardMesh, groundId = 'grass';
function retex() { if (groundMesh) paintTex(groundMesh, groundId, 56); if (yardMesh) paintTex(yardMesh, 'stone', 7); }
function makeGround(P) {
  const geo = new THREE.PlaneGeometry(320, 320, 160, 160); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, cols = new Float32Array(pos.count * 3), c0 = new THREE.Color(P.ground[0]), c1 = new THREE.Color(P.ground[1]), c2 = new THREE.Color(P.ground[2]), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), y = heightAt(x, z); pos.setY(i, y);
    const n = noise2(x * 2.3, z * 2.3) * .5 + .5, n2 = noise2(x * 5.1 + 40, z * 5.1) * .5 + .5; c.copy(c1).lerp(c2, n * .55).lerp(c0, Math.max(0, n2 - .6) * .8); if (y > 4) c.lerp(c2, Math.min(1, (y - 4) / 8));
    const d = Math.max(Math.abs(x), Math.abs(z)); if (d < 26) c.lerp(new THREE.Color(P.wall).multiplyScalar(.92), .55);
    c.multiplyScalar(P.realm === 'frostmark' ? .86 : .93); cols.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3)); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95 })); m.receiveShadow = true; m.userData.tint = '#e8e8e8'; groundMesh = m; groundId = GROUND_TEX[P.realm] || 'grass'; paintTex(m, groundId, 56); return m;
}
function makeCourtyard(P) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 512; const x = cv.getContext('2d');
  x.fillStyle = P.wall; x.fillRect(0, 0, 512, 512); const base = new THREE.Color(P.wall);
  for (let yy = 0; yy < 512; yy += 32) for (let xx = (yy / 32) % 2 * 16; xx < 512; xx += 32) { const k = .82 + Math.random() * .2; x.fillStyle = `rgb(${base.r * 255 * k | 0},${base.g * 255 * k | 0},${base.b * 255 * k | 0})`; x.fillRect(xx + 1, yy + 1, 30, 30); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 5); t.anisotropy = 4;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(48, 48), new THREE.MeshStandardMaterial({ map: t, roughness: .92 })); m.rotation.x = -Math.PI / 2; m.position.y = .03; m.receiveShadow = true; m.userData.tint = new THREE.Color(P.wall).lerp(new THREE.Color('#ffffff'), .45).getStyle(); yardMesh = m; paintTex(m, 'stone', 7); return m;
}
function makeWalls(P) {
  const g = new THREE.Group(), w = mat(P.wall2), w3 = mat(P.wall3), L = 2 * SC;
  const segs = [[0, -SC, L, 1.6], [0, SC, L, 1.6], [-SC, 0, 1.6, L], [SC, 0, 1.6, L]];
  for (const [x, z, sx, sz] of segs) { const gap = x === SC || z === SC; if (gap) { const half = (L - 9) / 2; if (sx > sz) { box(half, 4, 1.6, w, x - SC + half / 2, 0, z, g); box(half, 4, 1.6, w, x + SC - half / 2 - 0, 0, z, g); } else { box(1.6, 4, half, w, x, 0, z - SC + half / 2, g); box(1.6, 4, half, w, x, 0, z + SC - half / 2, g); } } else box(sx, 4, sz, w, x, 0, z, g); }
  const cg = new THREE.BoxGeometry(.7, .7, .7), n = 34, cr = new THREE.InstancedMesh(cg, w3, n * 4), d = new THREE.Object3D(); let k = 0;
  for (let i = 0; i < n; i++) { const t = -SC + (i + .5) * (L / n); for (const [x, z] of [[t, -SC], [t, SC], [-SC, t], [SC, t]]) { d.position.set(x, 4.35, z); d.updateMatrix(); cr.setMatrixAt(k++, d.matrix); } }
  cr.castShadow = true; g.add(cr);
  for (const [x, z] of [[-SC, -SC], [SC, -SC], [-SC, SC]]) { cyl(2.4, 2.7, 7, w, x, 0, z, g, 18); cap(g, P.cap, 2.7, 7, P.roof, x, z); }
  return g;
}
function makeWater(P) {
  const geo = new THREE.CircleGeometry(12, 64); geo.rotateX(-Math.PI / 2);
  const m = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: { t: { value: 0 }, deep: { value: new THREE.Color(P.water).multiplyScalar(.45) }, shallow: { value: new THREE.Color(P.water) }, sky: { value: new THREE.Color('#bfe6ff') }, sunDir: { value: new THREE.Vector3(.5, .8, .3) }, night: { value: 0 } },
    vertexShader: 'varying vec3 vW; varying vec2 vUv; void main(){ vUv=uv; vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
    fragmentShader: `precision mediump float; uniform float t,night; uniform vec3 deep,shallow,sky,sunDir; varying vec3 vW; varying vec2 vUv;
      float h(vec2 p){ return sin(p.x*1.3+t*1.1)*.5+sin(p.y*1.7-t*.9)*.5+sin((p.x+p.y)*2.6+t*1.7)*.25; }
      void main(){ vec2 p=vW.xz; float e=.15; vec3 n=normalize(vec3(h(p-vec2(e,0.))-h(p+vec2(e,0.)), 2.6, h(p-vec2(0.,e))-h(p+vec2(0.,e))));
        vec3 v=normalize(cameraPosition-vW); float fr=pow(1.-max(dot(n,v),0.),3.);
        float r=length(vUv-.5)*2.; vec3 col=mix(deep,shallow,smoothstep(.2,1.,r)); col=mix(col,sky*(1.-night*.8),fr*.65);
        float spec=pow(max(dot(reflect(-normalize(sunDir),n),v),0.),90.)*(1.-night*.7); col+=vec3(1.,.95,.8)*spec*1.6;
        float foam=smoothstep(.86,.98,r)*(.6+.4*sin(t*2.+atan(vUv.y-.5,vUv.x-.5)*12.)); col=mix(col,vec3(1.),foam*.5);
        gl_FragColor=vec4(col,1.); }`
  });
  const o = new THREE.Mesh(geo, m); o.position.set(3, .12, -51); o.receiveShadow = true;
  const shore = new THREE.Mesh(new THREE.RingGeometry(11.6, 14, 64), mat('#e6d3a8', { r: 1 })); shore.rotation.x = -Math.PI / 2; shore.position.set(3, .09, -51); shore.receiveShadow = true;
  const g = new THREE.Group(); g.add(shore, o); g.userData.mat = m; return g;
}
function makeSky() {
  const m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: { top: { value: new THREE.Color('#5aa0e0') }, hor: { value: new THREE.Color('#f6e2c0') }, sunDir: { value: new THREE.Vector3(.4, .6, .3) }, sunCol: { value: new THREE.Color('#fff2d0') } },
    vertexShader: 'varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'uniform vec3 top,hor,sunDir,sunCol; varying vec3 vD; void main(){ float k=pow(clamp(vD.y,0.,1.),.55); vec3 c=mix(hor,top,k); float s=max(dot(normalize(vD),normalize(sunDir)),0.); c+=sunCol*(pow(s,600.)*3.+pow(s,10.)*.25); gl_FragColor=vec4(c,1.); }' });
  const o = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), m); o.userData.mat = m; return o;
}
/* ---------------- particles: smoke, fireflies ---------------- */
function makeFx() {
  const N = 220, geo = new THREE.BufferGeometry(), pos = new Float32Array(N * 3), seed = new Float32Array(N), kind = new Float32Array(N);
  for (let i = 0; i < N; i++) { seed[i] = Math.random(); kind[i] = i < 60 ? 0 : 1; }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('seed', new THREE.BufferAttribute(seed, 1)); geo.setAttribute('kind', new THREE.BufferAttribute(kind, 1));
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.NormalBlending, uniforms: { t: { value: 0 }, night: { value: 0 }, px: { value: Math.min(2, devicePixelRatio || 1) } },
    vertexShader: `attribute float seed,kind; uniform float t,night,px; varying float vK,vA;
      void main(){ vK=kind; vec3 p;
        if(kind<.5){ float life=fract(t*.08+seed); vec2 src=seed<.5?vec2(0.,0.):vec2(-11.,9.); p=vec3(src.x+sin(life*6.+seed*20.)*1.2+life*3., 12.+life*14.+(seed<.5?6.:-4.), src.y+cos(seed*30.)*1.)  ; vA=(1.-life)*.35*(1.-night*.5); gl_PointSize=(18.+life*60.)*px*(120./max(1.,length((modelViewMatrix*vec4(p,1.)).xyz))); }
        else { float a=seed*628.; float r=36.+fract(seed*13.)*40.; p=vec3(cos(a)*r+sin(t*.5+seed*9.)*2.,1.2+sin(t*1.3+seed*40.)*1.,sin(a)*r+cos(t*.4+seed*7.)*2.); vA=night*(.6+.4*sin(t*4.+seed*50.)); gl_PointSize=7.*px; }
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.); }`,
    fragmentShader: `precision mediump float; varying float vK,vA; void main(){ float d=length(gl_PointCoord-.5); if(d>.5) discard; float a=smoothstep(.5,0.,d)*vA; vec3 c=vK<.5?vec3(.86,.84,.82):vec3(1.,.9,.45)*2.; gl_FragColor=vec4(c,a); }` });
  const p = new THREE.Points(geo, m); p.frustumCulled = false; p.userData.mat = m; return p;
}

/* ---------------- build / sync ---------------- */
function init(container) {
  host = container;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: tier === 'high', powerPreference: 'high-performance' });
  } catch (e) { failed = true; return false; }
  renderer.setPixelRatio(Math.min(tier === 'high' ? 2 : 1.5, devicePixelRatio || 1));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .85;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement); renderer.domElement.className = 'c3canvas';
  ui = document.createElement('div'); ui.className = 'c3ui'; host.appendChild(ui);
  scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(renderer), .04).texture;
  camera = new THREE.PerspectiveCamera(32, 1, 1, 1600);
  hemi = new THREE.HemisphereLight('#cfe6ff', '#5a4a2a', .5); scene.add(hemi);
  sun = new THREE.DirectionalLight('#fff0d8', 3.2); sun.castShadow = true; const sm = tier === 'high' ? 2048 : 1024; sun.shadow.mapSize.set(sm, sm);
  Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 10, far: 400 }); sun.shadow.bias = -.0004; sun.shadow.normalBias = .04; scene.add(sun, sun.target);
  moon = new THREE.DirectionalLight('#7a9aff', 0); moon.position.set(-60, 90, 40); scene.add(moon);
  sky = makeSky(); scene.add(sky); scene.fog = new THREE.Fog('#f6e2c0', 230, 700);
  composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera));
  bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .3, .5, .93); composer.addPass(bloom); composer.addPass(new OutputPass());
  raycaster = new THREE.Raycaster(); pointer = new THREE.Vector2();
  input(); new ResizeObserver(resize).observe(host); resize();
  renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); failed = true; active = false; window.dispatchEvent(new Event('city3dlost')); });
  requestAnimationFrame(loop);
  return true;
}
function rebuildWorld() {
  if (root) { scene.remove(root); root.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
  flags.length = 0; MATS.clear(); glowMats.length = 0;
  const P = ART.P; realmKey = P.realm + (S.skin || '');
  root = new THREE.Group(); scene.add(root);
  root.add(makeGround(P), makeCourtyard(P));
  wallsGroup = makeWalls(P); root.add(wallsGroup);
  water = makeWater(P); root.add(water);
  const avoid = FIELD_POS.map(([x, y]) => { const v = toWorld(x, y); return [v.x, v.z]; });
  treesGroup = forest(P, avoid); root.add(treesGroup);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(6, 90), mat(new THREE.Color(P.ground[2]).multiplyScalar(.85).getStyle(), { r: 1 })); road.rotation.x = -Math.PI / 2; road.rotation.z = Math.PI / 4; road.position.set(24 + 32, .06, 24 + 32); road.receiveShadow = true; root.add(road);
  fx = makeFx(); root.add(fx);
  root.userData.bld = new THREE.Group(); root.add(root.userData.bld);
  built = true; sig = '';
}
function stateSig() {
  const s = S; return JSON.stringify([s.b, s.fields, s.queue.map(q => q.key), openPlots(), s.color, troopCount(s.troops) > 0]);
}
function sync() {
  if (!renderer || failed) return;
  if (!built || realmKey !== ART.P.realm + (S.skin || '')) rebuildWorld();
  const ns = stateSig(); if (ns !== sig) { sig = ns; rebuildBuildings(); }
  drawUI();
}
function rebuildBuildings() {
  const grp = root.userData.bld; while (grp.children.length) { const c = grp.children.pop(); c.traverse(o => o.geometry && o.geometry.dispose()); }
  pickables = []; anchors = [];
  const s = S, P = ART.P;
  for (const [id, [x, y]] of Object.entries(INNER)) {
    const L = s.b[id] || 0, d = BLD[id], locked = d.unlock > s.b.citadel, q = inQueue(id), p = toWorld(x, y);
    const g = L ? building(id, L, P) : building('empty', 0, P); if (q) scaffold(g, id === 'citadel' ? 12 : 6);
    if (locked) g.traverse(o => { if (o.material && o.material.opacity !== undefined && !L) o.material = new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: .25 }); });
    g.position.copy(p); g.rotation.y = 0; grp.add(g);
    const top = new THREE.Box3().setFromObject(g).max.y;
    g.userData = { act: 'bld', key: id }; pickables.push(g);
    anchors.push({ g, pos: new THREE.Vector3(p.x, Math.max(2, top) + 1.2, p.z), act: 'bld', key: id, label: `${locked ? '🔒 ' : ''}${d.name.replace('Royal Academy', 'Academy').replace('Alliance ', '')}${L ? ' ' + L : ''}`, q, can: !locked && !q && L && upgradeCheck(id).ok });
  }
  const open = openPlots();
  FIELD_POS.forEach(([x, y], i) => {
    const f = s.fields[i], p = toWorld(x, y), locked = i >= open, q = inQueue('f' + i);
    const g = f ? building(f.t, f.l, P) : building('empty', 0, P); if (q) scaffold(g, 4);
    if (locked) g.visible = false;
    g.position.set(p.x, heightAt(p.x, p.z) * .3, p.z); grp.add(g);
    if (!locked) { g.userData = { act: 'field', i }; pickables.push(g); }
    anchors.push({ g, pos: new THREE.Vector3(p.x, 3.4, p.z), act: locked ? 'lockedfield' : 'field', i, label: locked ? '🔒' : f && f.l ? String(f.l) : '+', small: true, q, field: true });
  });
  // army tents
  if (troopCount(s.troops)) { const tp = toWorld(590, 545); for (let k = 0; k < Math.min(6, Math.ceil(troopCount(s.troops) / 150)); k++) { const t = mesh(new THREE.ConeGeometry(1.4, 2.2, 6), mat('#f2ede4', { flat: true }), tp.x + (k % 3) * 3.2, 1.1, tp.z + Math.floor(k / 3) * 3.2, grp); t.userData = {}; } }
  buildUI();
}

/* ---------------- HTML overlay: labels, bubbles, hammers ---------------- */
let uiEls = [];
function buildUI() {
  ui.innerHTML = ''; uiEls = [];
  for (const a of anchors) {
    const el = document.createElement('div'); el.className = 'c3l' + (a.small ? ' sm' : '') + (a.act === 'lockedfield' ? ' lock' : '');
    el.dataset.act = a.act; if (a.key) el.dataset.key = a.key; if (a.i !== undefined) el.dataset.i = a.i;
    el.innerHTML = (a.q ? '<span class="c3hammer">🔨</span>' : '') + (a.can ? '<span class="c3up">▲</span>' : '') + `<b>${a.label}</b>`;
    ui.appendChild(el); uiEls.push({ el, a });
  }
  drawUI();
}
function drawUI() {
  // harvest bubbles reuse META's readiness logic through its SVG output: find which are ready
  ui.querySelectorAll('.bubble').forEach(e => e.remove());
  const html = META.bubbles(), tmp = document.createElement('div'); tmp.innerHTML = `<svg>${html}</svg>`;
  tmp.querySelectorAll('.bubble').forEach(b => {
    const i = b.dataset.i, el = document.createElement('div'); el.className = 'bubble c3b'; el.dataset.act = 'harvest'; el.dataset.i = i;
    const k = i === 'tax' ? 'gold' : BLD[S.fields[+i].t].field; el.innerHTML = ART.icon(k, 26);
    const pos = i === 'tax' ? new THREE.Vector3(9, 26, -2) : (() => { const [x, y] = FIELD_POS[+i]; const v = toWorld(x, y); v.y = 7.5; return v; })();
    ui.appendChild(el); uiEls.push({ el, a: { pos, bubble: true } });
  });
  uiEls = uiEls.filter(u => u.el.isConnected);
}
const v3 = new THREE.Vector3();
function placeUI() {
  const w = host.clientWidth, h = host.clientHeight;
  for (const { el, a } of uiEls) { v3.copy(a.pos).project(camera); const vis = v3.z < 1 && Math.abs(v3.x) < 1.15 && Math.abs(v3.y) < 1.15; el.style.display = vis ? '' : 'none'; if (vis) el.style.transform = `translate(${(v3.x * .5 + .5) * w}px,${(-v3.y * .5 + .5) * h}px) translate(-50%,-50%)`; }
}

/* ---------------- camera input ---------------- */
function input() {
  const c = renderer.domElement, pts = new Map(); let drag = null, moved = false, pinch = null;
  c.addEventListener('pointerdown', e => { c.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); if (pts.size === 1) { drag = { x: e.clientX, y: e.clientY }; moved = false; cam.vx = cam.vz = 0; } else if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), dist: cam.dist }; } });
  c.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) { hoverPick(e); return; } pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2 && pinch) { const [a, b] = [...pts.values()]; cam.dist = THREE.MathUtils.clamp(pinch.dist * pinch.d / Math.max(20, Math.hypot(a[0] - b[0], a[1] - b[1])), 55, 190); moved = true; return; }
    if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 5) moved = true; drag.x = e.clientX; drag.y = e.clientY; panBy(dx, dy); }
  });
  const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (!pts.size) { if (drag && !moved) pick(e); drag = null; } };
  c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
  c.addEventListener('wheel', e => { e.preventDefault(); cam.dist = THREE.MathUtils.clamp(cam.dist * (e.deltaY > 0 ? 1.1 : .9), 55, 190); }, { passive: false });
}
function panBy(dx, dy) {
  const k = cam.dist / host.clientHeight * 1.15, cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw);
  const mx = (-dx * cy - dy * sy * 1.25) * k * .7, mz = (dx * sy - dy * cy * 1.25) * k * .7;
  cam.tx = THREE.MathUtils.clamp(cam.tx + mx, -70, 70); cam.tz = THREE.MathUtils.clamp(cam.tz + mz, -70, 70); cam.vx = mx; cam.vz = mz;
}
function hit(e) {
  const r = renderer.domElement.getBoundingClientRect(); pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera); const hits = raycaster.intersectObjects(pickables, true);
  for (const h of hits) { let o = h.object; while (o && !(o.userData && o.userData.act)) o = o.parent; if (o) return o; }
  return null;
}
function pick(e) { const o = hit(e); if (!o) return; const d = o.userData; pulse(o); if (window.CITY3D_PICK) window.CITY3D_PICK(d); }
function hoverPick(e) { const o = hit(e); if (o !== hover) { if (hover) hover.scale.setScalar(1); hover = o; if (o) o.scale.setScalar(1.035); renderer.domElement.style.cursor = o ? 'pointer' : 'grab'; } }
function pulse(o) { const t0 = performance.now(); const f = () => { const k = (performance.now() - t0) / 260; o.scale.setScalar(1 + Math.sin(Math.min(1, k) * Math.PI) * .08); if (k < 1) requestAnimationFrame(f); else o.scale.setScalar(1); }; f(); }

/* ---------------- frame loop ---------------- */
function resize() { const w = Math.max(1, host.clientWidth), h = Math.max(1, host.clientHeight); renderer.setSize(w, h, false); renderer.domElement.style.width = w + 'px'; renderer.domElement.style.height = h + 'px'; composer.setSize(w, h); bloom.resolution.set(w / 2, h / 2); camera.aspect = w / h; camera.fov = w < h ? 44 : 32; camera.updateProjectionMatrix(); }
const cSky = { day: ['#4f97e0', '#f4e4c8'], dusk: ['#3a2a6b', '#ff9a5a'], night: ['#060a1c', '#1a2350'] };
const lerpC = (a, b, k) => new THREE.Color(a).lerp(new THREE.Color(b), k);
let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  if (!active || failed || document.hidden || !built) return;
  const dt = Math.min(.05, (now - last) / 1000); last = now; const t = now / 1000;
  if (!drag0()) { cam.tx += cam.vx; cam.tz += cam.vz; cam.vx *= .9; cam.vz *= .9; }
  const ce = Math.cos(cam.pitch), se = Math.sin(cam.pitch);
  camera.position.set(cam.tx + Math.cos(cam.yaw) * ce * cam.dist, se * cam.dist, cam.tz + Math.sin(cam.yaw) * ce * cam.dist); camera.lookAt(cam.tx, 0, cam.tz);
  // time of day from the game's own clock
  const n = typeof nightAmt === 'function' ? nightAmt() : 0, w = typeof warmAmt === 'function' ? warmAmt() : 0, p = typeof dayP === 'function' ? dayP() : .2;
  const ang = (p / .5) * Math.PI; const sx = Math.cos(ang) * 120, sy = Math.max(12, Math.sin(Math.min(Math.PI, ang)) * 150 + 15);
  sun.position.set(cam.tx + sx * .7, sy, cam.tz + 80); sun.target.position.set(cam.tx, 0, cam.tz);
  sun.intensity = 2.7 * (1 - n) + .02; sun.color.copy(lerpC('#fff0d8', '#ff9a5a', w));
  moon.intensity = .38 * n; hemi.intensity = .5 - n * .43; hemi.color.copy(lerpC('#cfe6ff', '#4a5aa0', n));
  const skyTop = lerpC(lerpC(cSky.day[0], cSky.dusk[0], w), cSky.night[0], n), skyHor = lerpC(lerpC(cSky.day[1], cSky.dusk[1], w), cSky.night[1], n);
  sky.userData.mat.uniforms.top.value.copy(skyTop); sky.userData.mat.uniforms.hor.value.copy(skyHor); sky.userData.mat.uniforms.sunDir.value.set(sx, sy, 80).normalize(); sky.position.copy(camera.position);
  scene.fog.color.copy(skyHor); renderer.toneMappingExposure = .85 - n * .38;
  winMat.emissiveIntensity = n * 5; for (const m of glowMats) m.emissiveIntensity = m.userData.base * (1 + n * 2.5);
  bloom.strength = .22 + n * .45; bloom.threshold = .92;
  const wm = water.userData.mat.uniforms; wm.t.value = t; wm.night.value = n; wm.sunDir.value.set(sx, sy, 80).normalize(); wm.sky.value.copy(skyTop).lerp(skyHor, .5);
  fx.userData.mat.uniforms.t.value = t; fx.userData.mat.uniforms.night.value = n;
  for (const f of flags) { const a = f.geometry.attributes.position, b = f.userData.flag.base; for (let i = 0; i < a.count; i++) { const x = b[i * 3]; a.array[i * 3 + 2] = b[i * 3 + 2] + Math.sin(t * 4 + x * 2.2 + f.userData.flag.ph) * .14 * x; } a.needsUpdate = true; }
  composer.render(dt);
  placeUI();
}
let dragging = false; const drag0 = () => dragging;

window.CITY3D = { retex,
  init(container) { if (failed) return false; if (renderer) return true; const ok = init(container); if (!ok) failed = true; return ok; },
  sync, setActive(v) { active = v && !failed; if (active) { last = performance.now(); resize(); } }, get ok() { return !!renderer && !failed; }, rebuild() { built = false; sig = ''; }, tier
};
window.dispatchEvent(new Event('city3dready'));
