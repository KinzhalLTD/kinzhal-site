// Rimal Realms — cinematic effects: particles, flying rewards, shakes, banners, skill cut-ins and the music engine.
'use strict';
const FX = (() => {
  /* ---------- particle layer ---------- */
  const cv = document.createElement('canvas'); cv.id = 'fxLayer';
  const ctx = cv.getContext('2d'); let parts = [], running = false, dpr = 1;
  const size = () => { dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; };
  window.addEventListener('resize', size);
  document.addEventListener('DOMContentLoaded', () => { document.body.appendChild(cv); size(); });
  const loop = () => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter(p => (p.life -= 1 / 60) > 0);
    for (const p of parts) {
      p.vx *= p.drag; p.vy = p.vy * p.drag + p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      const a = Math.min(1, p.life / p.max * 1.6); ctx.globalAlpha = a; ctx.fillStyle = p.c; ctx.strokeStyle = p.c;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      if (p.shape === 'spark') { ctx.lineWidth = p.s * .5; ctx.beginPath(); ctx.moveTo(-p.vx * 2, -p.vy * 2); ctx.lineTo(0, 0); ctx.stroke(); }
      else if (p.shape === 'star') { ctx.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? p.s * .45 : p.s; ctx.lineTo(Math.cos(i * Math.PI / 5) * r, Math.sin(i * Math.PI / 5) * r); } ctx.fill(); }
      else if (p.shape === 'ring') { ctx.lineWidth = 3 * a; ctx.beginPath(); ctx.arc(0, 0, p.s * (1 + (1 - p.life / p.max) * 6), 0, 7); ctx.stroke(); }
      else if (p.shape === 'rect') { ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); }
      else { ctx.beginPath(); ctx.arc(0, 0, p.s * a, 0, 7); ctx.fill(); }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    if (parts.length) requestAnimationFrame(loop); else { running = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  };
  const kick = () => { if (!running) { running = true; requestAnimationFrame(loop); } };
  function burst(x, y, o = {}) {
    const n = o.n || 24, colors = o.colors || ['#ffd36b', '#e8a33d', '#fff3c4', '#3fd7c8'];
    for (let i = 0; i < n; i++) {
      const a = (o.angle ?? Math.random() * 6.283) + (o.spread ?? 6.283) * (Math.random() - .5), sp = (o.speed || 6) * (.35 + Math.random() * .9);
      parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: o.g ?? .15, drag: o.drag ?? .96, life: o.life || 1, max: o.life || 1, s: (o.size || 4) * (.6 + Math.random() * .8), c: colors[i % colors.length], shape: o.shape || 'dot', rot: Math.random() * 6, vr: (Math.random() - .5) * .3 });
    }
    if (o.ring) parts.push({ x, y, vx: 0, vy: 0, g: 0, drag: 1, life: .6, max: .6, s: 8, c: o.ring, shape: 'ring', rot: 0, vr: 0 });
    kick();
  }
  const confetti = () => { for (let i = 0; i < 4; i++) setTimeout(() => burst(innerWidth * (.2 + Math.random() * .6), innerHeight * .25, { n: 40, shape: 'rect', size: 9, speed: 9, g: .22, life: 2.2, colors: ['#ffd36b', '#3fd7c8', '#ff7a59', '#9b7bff', '#f6ecd9'] }), i * 140); };
  const centerOf = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };

  /* ---------- rewards flying to the HUD ---------- */
  function fly(from, toEl, html, n = 6) {
    if (!toEl) return;
    const to = centerOf(toEl);
    for (let i = 0; i < n; i++) {
      const el = document.createElement('div'); el.className = 'flyer'; el.innerHTML = html; document.body.appendChild(el);
      const sx = from.x + (Math.random() - .5) * 50, sy = from.y + (Math.random() - .5) * 30, mx = (sx + to.x) / 2 + (Math.random() - .5) * 160, my = Math.min(sy, to.y) - 60 - Math.random() * 80;
      const anim = el.animate([
        { transform: `translate(${sx}px,${sy}px) scale(.4)`, opacity: 0 },
        { transform: `translate(${sx}px,${sy - 20}px) scale(1.15)`, opacity: 1, offset: .18 },
        { transform: `translate(${mx}px,${my}px) scale(1)`, opacity: 1, offset: .55 },
        { transform: `translate(${to.x - 9}px,${to.y - 9}px) scale(.6)`, opacity: .9 }
      ], { duration: 750 + i * 70, easing: 'cubic-bezier(.5,0,.3,1)' });
      anim.onfinish = () => { el.remove(); toEl.classList.remove('gain'); void toEl.offsetWidth; toEl.classList.add('gain'); if (i === n - 1) sound('coin'); };
    }
  }

  /* ---------- shake ---------- */
  function shake(el = document.body, power = 8, ms = 320) {
    el.animate([0, 1, 2, 3, 4, 5].map(i => ({ transform: i === 5 ? 'none' : `translate(${(Math.random() - .5) * power}px,${(Math.random() - .5) * power}px)` })), { duration: ms });
  }

  /* ---------- cinematic banner (letterbox + title) ---------- */
  function banner(title, sub = '', o = {}) {
    return new Promise(res => {
      const el = document.createElement('div'); el.className = 'cine ' + (o.cls || '');
      el.innerHTML = `<i class="lb top"></i><i class="lb bot"></i><div class="rays"></div><div class="cine-in">${o.art || ''}<h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div>`;
      document.body.appendChild(el); sound(o.sound || 'fanfare');
      const c = centerOf(el); setTimeout(() => burst(c.x, c.y, { n: 60, shape: 'star', size: 6, speed: 9, ring: '#ffd36b', life: 1.4 }), 350);
      const done = () => { el.classList.add('out'); setTimeout(() => { el.remove(); res(); }, 450); };
      const t = setTimeout(done, o.ms || 2600); el.addEventListener('click', () => { clearTimeout(t); done(); });
    });
  }

  /* ---------- hero skill cut-in ---------- */
  function cutIn(portraitHTML, heroName, skillName, color = '#e8a33d') {
    const el = document.createElement('div'); el.className = 'cutin'; el.style.setProperty('--c', color);
    el.innerHTML = `<div class="band"><div class="cp">${portraitHTML}</div><div class="ct"><small>${heroName}</small><b>${skillName}</b></div></div>`;
    (document.getElementById('battle') || document.body).appendChild(el); sound('skill');
    setTimeout(() => el.remove(), 1000);
  }

  /* ---------- floating text ---------- */
  function text(x, y, str, cls = '') {
    const el = document.createElement('div'); el.className = 'ftext ' + cls; el.textContent = str; el.style.left = x + 'px'; el.style.top = y + 'px';
    document.body.appendChild(el); setTimeout(() => el.remove(), 1300);
  }

  /* ---------- audio: sfx + procedural music (Hijaz maqam) ---------- */
  let AC = null, master, musicBus, sfxBus, verb, musicOn = true, sfxOn = true, mood = 'city', nextNote = 0, step = 0, schedTimer = null, phrase = [];
  const ac = () => {
    if (AC) return AC;
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      master = AC.createGain(); master.gain.value = .9; master.connect(AC.destination);
      musicBus = AC.createGain(); musicBus.gain.value = musicOn ? .16 : 0; sfxBus = AC.createGain(); sfxBus.gain.value = sfxOn ? .5 : 0;
      verb = AC.createConvolver(); const len = AC.sampleRate * 2.2, ir = AC.createBuffer(2, len, AC.sampleRate);
      for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
      verb.buffer = ir; const wet = AC.createGain(); wet.gain.value = .35; verb.connect(wet).connect(master);
      musicBus.connect(master); musicBus.connect(verb); sfxBus.connect(master);
    } catch (e) { AC = null; }
    return AC;
  };
  const env = (g, t, a, d, peak) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); };
  function tone(f, t, d, type = 'triangle', peak = .3, bus = sfxBus, cutoff = 4000) {
    const o = AC.createOscillator(), g = AC.createGain(), fl = AC.createBiquadFilter();
    o.type = type; o.frequency.setValueAtTime(f, t); fl.type = 'lowpass'; fl.frequency.value = cutoff;
    env(g, t, .005, d, peak); o.connect(fl).connect(g).connect(bus); o.start(t); o.stop(t + d + .05); return o;
  }
  function noise(t, d, f, q, peak, bus = sfxBus) {
    const b = AC.createBuffer(1, AC.sampleRate * d, AC.sampleRate), ch = b.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    const s = AC.createBufferSource(), fl = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = b; fl.type = 'bandpass'; fl.frequency.value = f; fl.Q.value = q;
    env(g, t, .002, d, peak); s.connect(fl).connect(g).connect(bus); s.start(t);
  }
  function oud(f, t, d = .9, peak = .22) { // plucked string: bright attack, fast decay, slight detune
    tone(f, t, d, 'sawtooth', peak * .6, musicBus, 2600); tone(f * 1.003, t, d * .8, 'triangle', peak, musicBus, 3000); noise(t, .03, f * 4, 2, peak * .4, musicBus);
  }
  const doum = (t, v = .5) => { const o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(48, t + .18); env(g, t, .004, .3, v); o.connect(g).connect(musicBus); o.start(t); o.stop(t + .4); };
  const tek = (t, v = .25) => noise(t, .06, 3200, 1.5, v, musicBus);
  const SFX = {
    click: t => tone(880, t, .05, 'triangle', .15),
    build: t => { noise(t, .08, 900, 2, .4); tone(220, t, .12, 'square', .08); tone(330, t + .08, .12, 'square', .08); },
    done: t => [523, 659, 784].forEach((f, i) => tone(f, t + i * .07, .2, 'triangle', .22)),
    coin: t => { tone(1318, t, .08, 'square', .06); tone(1760, t + .05, .16, 'triangle', .14); },
    horn: t => { tone(147, t, .5, 'sawtooth', .18, sfxBus, 900); tone(220, t + .18, .6, 'sawtooth', .18, sfxBus, 1100); },
    win: t => [523, 659, 784, 1046].forEach((f, i) => tone(f, t + i * .1, .35, 'triangle', .25)),
    loss: t => [330, 311, 262].forEach((f, i) => tone(f, t + i * .18, .4, 'sawtooth', .1, sfxBus, 900)),
    alarm: t => [880, 660, 880, 660].forEach((f, i) => tone(f, t + i * .14, .12, 'square', .1)),
    hit: t => { noise(t, .07, 600 + Math.random() * 600, 1.2, .35); tone(90, t, .08, 'sine', .25); },
    crit: t => { noise(t, .12, 2400, 1, .5); tone(160, t, .2, 'sawtooth', .2, sfxBus, 1200); },
    arrow: t => noise(t, .14, 5000, 4, .18),
    skill: t => { noise(t, .5, 1500, .7, .2); [587, 740, 880].forEach((f, i) => tone(f, t + i * .05, .5, 'sawtooth', .07, sfxBus, 2500)); },
    fanfare: t => { [294, 370, 440, 587].forEach((f, i) => tone(f, t + i * .12, .6, 'sawtooth', .1, sfxBus, 2200)); tone(587, t + .5, 1.1, 'triangle', .22); doum(t + .5, .6); },
    whoosh: t => noise(t, .35, 800, .5, .25),
    chest: t => { noise(t, .3, 400, 1, .4); [784, 988, 1175, 1568].forEach((f, i) => tone(f, t + .25 + i * .06, .4, 'triangle', .18)); },
    legend: t => { [294, 392, 466, 587, 784].forEach((f, i) => tone(f, t + i * .09, .9, 'sawtooth', .09, sfxBus, 3000)); noise(t, 1.2, 3000, .5, .15); }
  };
  function sound(k) { if (!sfxOn || !ac()) return; if (AC.state === 'suspended') AC.resume(); try { (SFX[k] || SFX.click)(AC.currentTime + .01); } catch (e) { } }
  // Hijaz on D: D Eb F# G A Bb C D
  const SCALE = [0, 1, 4, 5, 7, 8, 10, 12, 13, 16, 17, 19];
  const hz = (semi, base = 146.83) => base * Math.pow(2, semi / 12);
  const MOODS = { city: { bpm: 84, perc: .5, density: .45 }, battle: { bpm: 118, perc: 1, density: .7 }, world: { bpm: 76, perc: .25, density: .35 }, cine: { bpm: 70, perc: .15, density: .3 } };
  function newPhrase() { let i = Math.floor(Math.random() * 5) + 2; phrase = []; for (let n = 0; n < 16; n++) { i = Math.max(0, Math.min(SCALE.length - 1, i + [-2, -1, -1, 0, 1, 1, 2][Math.floor(Math.random() * 7)])); phrase.push(Math.random() < MOODS[mood].density ? SCALE[i] : null); } phrase[15] = phrase[15] ?? SCALE[0]; }
  function schedule() {
    const M = MOODS[mood], spb = 60 / M.bpm / 2; // eighth notes
    while (nextNote < AC.currentTime + .25) {
      const s = step % 16;
      if (s === 0) { if (step % 64 === 0 || !phrase.length) newPhrase(); tone(hz(-12), nextNote, spb * 16, 'sawtooth', .05, musicBus, 500); tone(hz(-5), nextNote, spb * 16, 'triangle', .04, musicBus, 700); }
      const note = phrase[s]; if (note != null) oud(hz(note + (step % 32 >= 16 && mood !== 'cine' ? 12 : 0)), nextNote, spb * 2.5, .18);
      // maqsum rhythm: D T - T D - T -
      const pat = 'DT.TD.T.'[s % 8];
      if (M.perc && pat === 'D') doum(nextNote, .45 * M.perc); else if (M.perc && pat === 'T') tek(nextNote, .14 * M.perc);
      nextNote += spb; step++;
    }
  }
  function music(on) {
    if (on !== undefined) musicOn = on;
    if (!ac()) return;
    if (AC.state === 'suspended') AC.resume();
    musicBus.gain.setTargetAtTime(musicOn ? .16 : 0, AC.currentTime, .4);
    if (musicOn && !schedTimer) { nextNote = AC.currentTime + .1; schedTimer = setInterval(schedule, 90); }
    if (!musicOn && schedTimer) { clearInterval(schedTimer); schedTimer = null; }
  }
  function setMood(m) { if (MOODS[m] && m !== mood) { mood = m; phrase = []; } }
  function setSfx(on) { sfxOn = on; if (AC) sfxBus.gain.value = on ? .5 : 0; }

  return { burst, confetti, fly, shake, banner, cutIn, text, sound, music, setMood, setSfx, centerOf, get musicOn() { return musicOn; }, get sfxOn() { return sfxOn; } };
})();
