# Aeloria score: five loops and a set of stingers built on one theme, rendered with a GM soundfont.
import numpy as np, tinysoundfont, pretty_midi, os, random, subprocess, sys
SF = os.path.join(os.path.dirname(pretty_midi.__file__), 'TimGM6mb.sf2'); SR = 44100
MODES = {'maj': [0, 2, 4, 5, 7, 9, 11], 'min': [0, 2, 3, 5, 7, 8, 10], 'dor': [0, 2, 3, 5, 7, 9, 10]}
GM = dict(piano=0, glock=9, bells=14, guitar=24, cello=42, bass=43, trem=44, pizz=45, harp=46, timp=47, strings=48, slow=49, choir=52,
          trumpet=56, trombone=57, tuba=58, horn=60, brass=61, oboe=68, clar=71, piccolo=72, flute=73, pan=75, ocarina=79, koto=107, kalimba=108, fiddle=110, taiko=116, tom=117)

class Song:
    def __init__(s, bpm, root, mode, seed=1):
        s.bpm, s.root, s.mode, s.ev, s.ch, s.r = bpm, root, MODES[mode], [], {}, random.Random(seed)
    def chan(s, inst, pan=64):
        if inst not in s.ch: n = len(s.ch); s.ch[inst] = (n if n < 9 else n + 1, GM[inst], pan)
        return s.ch[inst][0]
    def deg(s, d, octv=0, sharp7=False):
        d -= 1; p = s.root + s.mode[d % 7] + 12 * (d // 7) + 12 * octv
        if sharp7 and d % 7 == 6 and s.mode[6] == 10: p += 1
        return p
    def note(s, inst, t, dur, pitch, vel, pan=64, hum=.012):
        s.ev.append((max(0, t + s.r.uniform(-hum, hum)), dur, s.chan(inst, pan), pitch, int(max(1, min(127, vel + s.r.randint(-5, 5))))))
    def drum(s, t, key, vel): s.ev.append((max(0, t + s.r.uniform(-.008, .008)), .2, 9, key, int(max(1, min(127, vel + s.r.randint(-6, 6))))))
    def chord(s, c):  # c = degree or (degree, 'M') to force a major third (dominant in minor)
        d, q = (c if isinstance(c, tuple) else (c, ''))
        ps = [s.deg(d), s.deg(d + 2), s.deg(d + 4)]
        if q == 'M': ps[1] = ps[0] + 4
        if q == 'm': ps[1] = ps[0] + 3
        return ps
    def voiced(s, c, lo):  # close voicing with every tone at or above `lo`
        return sorted(p + 12 * (-(-(lo - p) // 12)) if p < lo else p - 12 * ((p - lo) // 12) for p in s.chord(c))
    def melody(s, inst, t, notes, octv=0, vel=84, legato=.96, pan=64, double=None):
        for d, dur in notes:
            if d:
                sh = isinstance(d, str); dd = int(d[:-1]) if sh else d
                p = s.deg(dd, octv, sharp7=sh)
                s.note(inst, t, dur * legato, p, vel + (6 if dur >= 1.5 else 0), pan)
                if double: s.note(double[0], t, dur * legato, p + 12 * double[1], vel - 14, 127 - pan)
            t += dur
        return t
    def pad(s, inst, t, prog, lo=55, vel=58, pan=64):  # prog = [(chord, beats)]
        for c, b in prog:
            for p in s.voiced(c, lo): s.note(inst, t, b * .99, p, vel, pan)
            t += b
    def bass(s, inst, t, prog, octv=-2, vel=70, pattern=None):
        for c, b in prog:
            r = s.chord(c)[0] + 12 * octv
            while r < 28: r += 12
            if pattern:
                for off, dur in pattern:
                    if off < b: s.note(inst, t + off, dur, r, vel)
            else: s.note(inst, t, b * .97, r, vel)
            t += b
    def arp(s, inst, t, prog, lo=48, vel=62, step=.5, pan=64, shape=(0, 1, 2, 3, 4, 3, 2, 1)):
        for c, b in prog:
            v = s.voiced(c, lo); tones = v + [v[0] + 12, v[1] + 12]
            for i in range(int(b / step)): s.note(inst, t + i * step, step * 1.8, tones[shape[i % len(shape)]], vel - (0 if i % 4 == 0 else 8), pan)
            t += b
    def stabs(s, inst, t, prog, offs, lo=60, vel=70, dur=.3, pan=64):
        for c, b in prog:
            for o in offs:
                if o < b:
                    for p in s.voiced(c, lo): s.note(inst, t + o, dur, p, vel, pan)
            t += b
    def ost(s, inst, t, prog, step=.5, octv=-1, vel=72, pat=(0, 0, 2, 0, 1, 0, 2, 0), pan=64):
        for c, b in prog:
            ch = s.chord(c); tones = [ch[0] + 12 * octv, ch[2] + 12 * octv, ch[0] + 12 * (octv + 1)]
            for i in range(int(b / step)): s.note(inst, t + i * step, step * .55, tones[pat[i % len(pat)]], vel + (10 if i % 4 == 0 else 0), pan)
            t += b
    def render(s, tail=3.5):
        syn = tinysoundfont.Synth(samplerate=SR); sf = syn.sfload(SF)
        for inst, (ch, prog, pan) in s.ch.items(): syn.program_select(ch, sf, 0, prog); syn.control_change(ch, 10, pan)
        syn.program_select(9, sf, 0, 0, True)
        spb = 60 / s.bpm; acts = []
        for t, d, ch, p, v in s.ev: acts.append((t * spb, 1, ch, p, v)); acts.append(((t + d) * spb, 0, ch, p, 0))
        acts.sort(key=lambda a: (a[0], a[1])); out = []; pos = 0
        for tm, on, ch, p, v in acts:
            n = int(tm * SR) - pos
            if n > 0: out.append(np.frombuffer(syn.generate(n), dtype=np.float32).copy()); pos += n
            (syn.noteon(ch, p, v) if on else syn.noteoff(ch, p))
        out.append(np.frombuffer(syn.generate(int(tail * SR)), dtype=np.float32).copy())
        return np.concatenate(out).reshape(-1, 2)

def reverb(x, secs=2.4, wet=.24, seed=3):
    rng = np.random.default_rng(seed); n = int(secs * SR); t = np.arange(n) / SR
    out = np.zeros((len(x) + n, 2), np.float32)
    for c in range(2):
        ir = rng.standard_normal(n) * np.exp(-t * (6.9 / secs)); ir[:int(.012 * SR)] = 0
        k = np.fft.rfft(ir); f = np.fft.rfftfreq(n, 1 / SR); k *= 1 / (1 + (f / 4500) ** 2) * (f > 180); ir = np.fft.irfft(k, n); ir /= np.sqrt((ir ** 2).sum())
        N = 1 << int(np.ceil(np.log2(len(x) + n))); y = np.fft.irfft(np.fft.rfft(x[:, c], N) * np.fft.rfft(ir, N), N)[:len(x) + n]
        out[:, c] = y
    out *= wet * .5; out[:len(x)] += x * (1 - wet * .35); return out

def eq(x):  # phone-friendly balance: trim sub and low-mid mud, lift presence and air
    N = len(x); f = np.fft.rfftfreq(N, 1 / SR); sh = lambda fc, db, up: 10 ** (db / 20 * (1 / (1 + (fc / np.maximum(f, 1)) ** 2) if up else 1 / (1 + (np.maximum(f, 1) / fc) ** 2)))
    g = (f ** 4 / (f ** 4 + 42.0 ** 4)) * sh(130, -7, False) * sh(2400, 7.5, True) * sh(7000, 3, True) * 10 ** (-2.5 / 20 * np.exp(-(np.log2(np.maximum(f, 1) / 320)) ** 2 / .5))
    return np.stack([np.fft.irfft(np.fft.rfft(x[:, c]) * g, N) for c in range(2)], 1).astype(np.float32)

def master(x, loop_beats=None, bpm=None, name='x', peak=.89, fade_tail=True):
    x = eq(reverb(x))
    if loop_beats:  # fold the reverb tail back onto the start so the loop joins without a bump
        L = int(loop_beats * 60 / bpm * SR); tail = x[L:]; x = x[:L].copy(); m = min(len(tail), L); x[:m] += tail[:m]
    else:  # stinger: cut once the tail has died away, then fade
        env = np.abs(x).max(axis=1); pk = env.max(); idx = np.nonzero(env > pk * 10 ** (-38 / 20))[0]; end = min(len(x), idx[-1] + int(.25 * SR)); x = x[:end].copy()
        f = int(.35 * SR); x[-f:] *= np.linspace(1, 0, f)[:, None] ** 2
    x = np.tanh(x * 1.9 / max(1e-6, np.abs(x).max())); x *= peak / np.abs(x).max()
    return x

def save(x, path, kbps='112k'):
    raw = (x * 32767).astype('<i2').tobytes()
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', '-', '-codec:a', 'libmp3lame', '-b:a', kbps, path], input=raw, check=True)
    rms = float(np.sqrt((x ** 2).mean())); print(f'{os.path.basename(path):14s} {len(x) / SR:6.1f}s  rms {20 * np.log10(rms):6.1f} dB  {os.path.getsize(path) / 1024:6.0f} KB')

# ---------------- the theme: a five-note rising motif, "a crown being lifted" ----------------
A = [[(1, .5), (2, .5), (3, 1), (5, 1), (6, 1)], [(5, 1.5), (3, .5), (2, 2)], [(1, .5), (2, .5), (3, 1), (5, 1), (8, 1)], [(7, 1.5), (6, .5), (5, 2)],
     [(6, .5), (7, .5), (8, 1), (9, 1), (8, 1)], [(6, 1.5), (5, .5), (3, 2)], [(4, .5), (3, .5), (2, 1), (1, 1), (2, 1)], [(1, 3), (0, 1)]]
A_MAJ = [(1, 4), (5, 4), (1, 4), (5, 4), (4, 4), (6, 4), (2, 2), (5, 2), (1, 4)]
A_MIN = [(1, 4), (5, 4), (1, 4), (5, 4), (4, 4), (6, 4), (4, 2), ((5, 'M'), 2), (1, 4)]
B1 = [[(6, 1), (8, 1), (7, .5), (6, .5), (5, 1)], [(6, 2), (3, 2)]]; B2 = [[(5, 1), (8, 1), (7, .5), (8, .5), (9, 1)], [(9, 1.5), (7, .5), (5, 2)]]
B3 = [[(6, 1), (8, 1), (10, 1), (9, .5), (8, .5)], [(8, 2), (6, 2)]]; B4 = [[(4, 1), (6, 1), (8, 1), (9, 1)], [(9, 2), (7, 2)]]
B_PROG = [(6, 4), (4, 4), (1, 4), (5, 4), (6, 4), (4, 4), (2, 4), (5, 4)]
flat = lambda bars: [n for b in bars for n in b]
def minorise(bars):  # raise the leading note where the harmony is the major dominant
    out = [list(b) for b in bars]; out[6] = [(4, .5), (3, .5), (2, 1), (1, 1), (2, 1)]; return out

def cine():
    s = Song(70, 62, 'maj', 11); t = 0
    intro = [(1, 4), (4, 4), (1, 4), (5, 4)]
    s.arp('harp', t, intro, lo=50, vel=58, pan=40); s.pad('slow', t, intro, lo=57, vel=40); s.melody('flute', t + 8, [(5, 2), (6, 1), (8, 1), (9, 3), (0, 1)], 1, 60, pan=84); t += 16
    s.arp('harp', t, A_MAJ, lo=50, vel=56, pan=40); s.pad('slow', t, A_MAJ, lo=57, vel=48); s.bass('cello', t, A_MAJ, vel=58)
    s.melody('horn', t, flat(A), 0, 86, pan=58); t += 32
    s.pad('choir', t, B_PROG, lo=60, vel=50); s.pad('slow', t, B_PROG, lo=55, vel=46); s.bass('cello', t, B_PROG, vel=60); s.arp('harp', t, B_PROG, lo=50, vel=50, step=1, pan=40)
    s.melody('koto', t, flat(B1), 0, 88, pan=36); s.melody('guitar', t + 8, flat(B2), 0, 88, pan=92); s.melody('koto', t + 16, flat(B3), 0, 90, pan=36)
    s.melody('guitar', t + 24, flat(B4), 0, 90, pan=92, double=('koto', 1)); s.note('timp', t + 30, 2, s.deg(5, -2), 70); t += 32
    s.pad('strings', t, A_MAJ, lo=55, vel=66); s.pad('choir', t, A_MAJ, lo=60, vel=56); s.bass('bass', t, A_MAJ, vel=74); s.bass('cello', t, A_MAJ, octv=-1, vel=62)
    s.arp('harp', t, A_MAJ, lo=50, vel=60, pan=40); s.melody('strings', t, flat(A), 1, 96, double=('horn', -1)); s.melody('trumpet', t + 16, flat(A[4:]), 0, 70, pan=80)
    for b in (0, 16): s.note('timp', t + b, 3, s.deg(1, -2), 84); s.drum(t + b, 49, 62)
    t += 32
    out = [(4, 4), (5, 4)]; s.arp('harp', t, out, lo=50, vel=52, pan=40); s.pad('slow', t, out, lo=57, vel=40); s.melody('flute', t, [(6, 2), (5, 2), (5, 3), (0, 1)], 1, 58, pan=84); t += 8
    return s, t

def city():
    s = Song(84, 55, 'maj', 22); t = 0
    comp = lambda t, prog, v=62: (s.stabs('pizz', t, prog, (1, 3), lo=55, vel=v, pan=44), s.bass('pizz', t, prog, octv=-2, vel=v + 10, pattern=[(0, .5), (2, .5)]))
    def perc(t, bars, v=54):
        for b in range(bars):
            for o, k, vv in ((0, 63, 10), (.75, 62, -6), (1.5, 63, 0), (2, 64, 6), (2.75, 62, -8), (3.5, 63, -2)): s.drum(t + b * 4 + o, k, v + vv)
            for o in (1, 3): s.drum(t + b * 4 + o, 54, v - 14)
    intro = [(1, 4), (4, 4)]; comp(t, intro); s.arp('harp', t, intro, lo=55, vel=54, pan=88); perc(t, 2); t += 8
    comp(t, A_MAJ); perc(t, 8); s.arp('harp', t, A_MAJ, lo=55, vel=50, step=1, pan=88); s.melody('ocarina', t, flat(A), 1, 82, legato=.88, pan=60); t += 32
    comp(t, A_MAJ, 66); perc(t, 8, 58); s.pad('slow', t, A_MAJ, lo=59, vel=40); s.melody('clar', t, flat(A), 0, 80, legato=.9, pan=40)
    s.melody('piccolo', t, [n for b in A for n in ([(0, 2)] + [(d + 2 if d else 0, x) for d, x in b[-2:]] if sum(x for _, x in b[-2:]) == 2 else [(0, 4)])], 0, 58, pan=96); t += 32
    comp(t, B_PROG, 60); perc(t, 8, 50); s.pad('slow', t, B_PROG, lo=59, vel=42)
    s.melody('guitar', t, flat(B1), 0, 90, legato=.85, pan=34); s.melody('kalimba', t + 8, flat(B2), 0, 92, legato=.8, pan=96); s.melody('guitar', t + 16, flat(B3), 0, 92, legato=.85, pan=34); s.melody('kalimba', t + 24, flat(B4), 0, 92, legato=.8, pan=96, double=('guitar', -1)); t += 32
    comp(t, A_MAJ, 68); perc(t, 8, 60); s.arp('harp', t, A_MAJ, lo=55, vel=56, pan=88); s.pad('slow', t, A_MAJ, lo=59, vel=46)
    s.melody('ocarina', t, flat(A), 1, 86, legato=.88, pan=60, double=('clar', -1)); t += 32
    return s, t

def world():
    s = Song(76, 57, 'dor', 33); t = 0
    def drum(t, bars, v=58):
        for b in range(bars):
            for o, vv in ((0, 12), (1.5, -6), (2.5, 0), (3.5, -10)): s.note('taiko', t + b * 4 + o, .5, 45, v + vv, 50)
            for o in (1, 3): s.drum(t + b * 4 + o, 69, v - 20)
            if b % 2: s.drum(t + b * 4 + 3.5, 76, v - 16); s.drum(t + b * 4 + 3.75, 77, v - 18)
    intro = [(1, 8), (7, 4), (1, 4)]; s.pad('slow', t, intro, lo=52, vel=50); s.bass('bass', t, intro, vel=60); drum(t + 8, 2, 46); s.melody('horn', t + 4, [(5, 2), (8, 2), (7, 3), (5, 1), (8, 4)], -1, 66, pan=44); t += 16
    s.pad('slow', t, A_MIN, lo=52, vel=50); s.bass('bass', t, A_MIN, vel=62); drum(t, 8); s.arp('harp', t, A_MIN, lo=52, vel=44, step=1, pan=92); s.melody('fiddle', t, flat(minorise(A)), 0, 92, legato=.94, pan=72); t += 32
    s.pad('slow', t, B_PROG, lo=52, vel=52); s.bass('bass', t, B_PROG, vel=62); drum(t, 8, 54)
    s.melody('pan', t, flat(B1), 0, 84, pan=40); s.melody('koto', t + 8, flat(B2), 0, 90, pan=96); s.melody('pan', t + 16, flat(B3), 0, 86, pan=40); s.melody('horn', t + 24, flat(B4), -1, 78, pan=44, double=('pan', 1)); t += 32
    s.pad('strings', t, A_MIN, lo=52, vel=58); s.bass('bass', t, A_MIN, vel=70); drum(t, 8, 66); s.arp('harp', t, A_MIN, lo=52, vel=50, pan=92)
    s.melody('fiddle', t, flat(minorise(A)), 0, 96, legato=.94, pan=72, double=('horn', -1)); s.melody('flute', t + 16, flat(minorise(A)[4:]), 1, 62, pan=30); t += 32
    return s, t

def taiko(s, t, bars, v=92, busy=False):
    for b in range(bars):
        hits = ((0, 16), (.75, -14), (1.5, 0), (2, 8), (2.5, -10), (3, 0), (3.5, -6)) if busy else ((0, 16), (1.5, -4), (2, 6), (3.5, -8))
        for o, vv in hits: s.note('taiko', t + b * 4 + o, .4, 41 if o in (0, 2) else 48, v + vv, 64)
        for o in (0, 2): s.drum(t + b * 4 + o, 36, v - 10)
        if b % 4 == 3:
            for i in range(4): s.note('tom', t + b * 4 + 3 + i * .25, .2, 52 - i * 3, v - 6 + i * 4)

def battle():
    s = Song(120, 50, 'min', 44); t = 0
    P = [(1, 4), (1, 4), (6, 4), (7, 4)] * 2
    s.ost('strings', t, P, vel=70, pan=40); taiko(s, t + 16, 4, 84); s.bass('bass', t, P, vel=78, pattern=[(0, 1.5), (2, 1.5)]); s.pad('trombone', t + 16, P[4:], lo=45, vel=58); t += 32
    for rep, (lead, octv, vel) in enumerate((('brass', 0, 98), ('strings', 1, 96))):
        s.ost('strings', t, A_MIN, vel=74, pan=40); s.ost('cello', t, A_MIN, octv=-2, vel=70, pat=(0, 0, 0, 1, 0, 0, 2, 0), pan=90); taiko(s, t, 8, 94, busy=bool(rep)); s.bass('bass', t, A_MIN, vel=84, pattern=[(0, 1.5), (2, 1.5)])
        s.melody(lead, t, flat(minorise(A)), octv, vel, legato=.9, double=(('horn', 0) if rep == 0 else ('trumpet', -1)))
        if rep: s.stabs('choir', t, A_MIN, (0,), lo=60, vel=84, dur=1.6); s.stabs('brass', t, A_MIN, (0, 2.5), lo=55, vel=74, dur=.4, pan=90)
        for b in (0, 16): s.drum(t + b, 49, 80); s.note('timp', t + b, 2, s.deg(1, -2), 92)
        t += 32
    Bk = [(6, 4), (7, 4), (4, 4), ((5, 'M'), 4)]
    s.pad('trem', t, Bk, lo=50, vel=62); s.bass('bass', t, Bk, vel=80); s.pad('trombone', t, Bk, lo=43, vel=60)
    for i in range(16): s.note('timp', t + i, .9, s.chord(Bk[i // 4][0])[0] - 24, 60 + i * 3)
    for i in range(8): s.note('tom', t + 14 + i * .25, .2, 43 + i, 70 + i * 6)
    s.melody('horn', t, [(8, 3), (7, 1), (9, 3), (8, 1), (8, 2), (6, 2), ('7#', 4)], 0, 84); t += 16
    s.ost('strings', t, A_MIN, vel=80, pan=40); s.ost('cello', t, A_MIN, octv=-2, vel=74, pat=(0, 0, 0, 1, 0, 0, 2, 0), pan=90); taiko(s, t, 8, 100, busy=True); s.bass('bass', t, A_MIN, vel=88, pattern=[(0, 1.5), (2, 1.5)])
    s.melody('trumpet', t, flat(minorise(A)), 1, 100, legato=.9, double=('brass', -1)); s.stabs('choir', t, A_MIN, (0,), lo=60, vel=88, dur=1.8); s.pad('horn', t, A_MIN, lo=50, vel=62, pan=30)
    for b in (0, 8, 16, 24): s.drum(t + b, 49, 84); s.note('timp', t + b, 2, s.deg(1, -2), 96)
    t += 32
    return s, t

def boss():
    s = Song(128, 48, 'min', 55); t = 0
    R = [(1, 4), (1, 4), (6, 4), (5, 4)]
    def riff(t, prog, v=78):
        for i, (c, b) in enumerate(prog):
            r = s.chord(c)[0] - 12
            for j, sh in enumerate((0, 0, 12, 0, 1, 0, 12, 7)): s.note('piano', t + i * 4 + j * .5, .3, r + sh, v + (12 if j % 4 == 0 else 0), 50); s.note('piano', t + i * 4 + j * .5, .3, r + sh - 12, v - 6, 50)
    LOW = [[(1, 1.5), (3, .5), (2, 2)], [(1, 1.5), (4, .5), (3, 2)], [(1, 1.5), (5, .5), (4, 1), (3, 1)], [(2, 3), (0, 1)]]
    riff(t, R); taiko(s, t + 8, 2, 90); s.pad('trombone', t + 8, R[2:], lo=41, vel=64); s.note('timp', t, 4, 36, 80); t += 16
    for rep in range(2):
        riff(t, R * 2, 80 + rep * 4); taiko(s, t, 8, 96, busy=bool(rep)); s.bass('tuba', t, R * 2, octv=-2, vel=84); s.melody('trombone', t, flat(LOW) * 2, -1, 96, legato=.9, double=('brass', 0))
        s.stabs('choir', t, R * 2, (0,), lo=60, vel=76 + rep * 8, dur=2.5)
        for b in (0, 16):  # the dissonant flat-second cluster
            for p in (s.deg(1, 1), s.deg(1, 1) + 1, s.deg(5, 1)): s.note('trem', t + b + 12, 4, p, 62 + rep * 8, 90)
            s.drum(t + b, 49, 84)
        if rep: s.ost('strings', t, R * 2, vel=72, pan=30)
        t += 32
    # the hero theme fights through: fragments rising by sequence, then the whole theme
    riff(t, R * 2, 84); taiko(s, t, 8, 98, busy=True); s.bass('tuba', t, R * 2, octv=-2, vel=86); s.ost('strings', t, R * 2, vel=74, pan=30)
    for i, sh in enumerate((0, 2, 0, 4)): s.melody('trumpet', t + i * 8, [(d + sh if d else 0, x) for d, x in A[0]] + [(5 + sh, 1.5), (0, 2.5)], 0, 84 + i * 4, legato=.85, pan=84)
    s.melody('trombone', t, flat(LOW) * 2, -1, 88, legato=.9); t += 32
    riff(t, A_MIN[:6] + [(4, 4), (1, 4)], 78); taiko(s, t, 8, 104, busy=True); s.bass('tuba', t, A_MIN, octv=-2, vel=90); s.ost('strings', t, A_MIN, vel=80, pan=30)
    s.melody('trumpet', t, flat(minorise(A)), 1, 104, legato=.9, double=('brass', -1)); s.stabs('choir', t, A_MIN, (0,), lo=60, vel=92, dur=2.5); s.pad('horn', t, A_MIN, lo=48, vel=66, pan=30)
    for b in (0, 8, 16, 24): s.drum(t + b, 49, 88); s.note('timp', t + b, 2, 36, 100)
    t += 32
    return s, t

def stinger(kind):
    if kind == 'win':
        s = Song(96, 62, 'maj', 6); s.melody('brass', 0, [(1, .5), (2, .5), (3, .5), (5, .5), (8, 3)], 0, 104, double=('trumpet', 1)); s.pad('strings', 2, [(1, 3)], lo=57, vel=80); s.pad('choir', 2, [(1, 3)], lo=62, vel=74); s.note('timp', 2, 3, 38, 100); s.drum(2, 49, 90); s.arp('harp', 2, [(1, 2)], lo=62, vel=70, step=.25)
    elif kind == 'loss':
        s = Song(70, 62, 'min', 7); s.melody('strings', 0, [(5, 1), (4, 1), (3, 1), (1, 3)], 0, 80, double=('cello', -1)); s.pad('slow', 3, [(1, 3)], lo=50, vel=60); s.note('timp', 3, 2, 38, 70)
    elif kind == 'fanfare':
        s = Song(120, 62, 'maj', 8); s.melody('trumpet', 0, [(5, .5), (5, .25), (5, .25), (8, 1), (10, 2)], 0, 100, double=('brass', -1)); s.pad('brass', 2, [(1, 2)], lo=57, vel=80); s.drum(2, 49, 80)
    elif kind == 'legend':
        s = Song(90, 62, 'maj', 9); s.pad('choir', 0, [(4, 1.5), (1, 3)], lo=62, vel=84); s.arp('bells', 0, [(4, 1.5), (1, 1.5)], lo=74, vel=84, step=.25); s.arp('harp', 0, [(4, 1.5), (1, 1.5)], lo=62, vel=70, step=.25); s.note('glock', 1.5, 2, 86, 90); s.drum(1.5, 49, 70)
    elif kind == 'horn':
        s = Song(80, 50, 'min', 10); s.melody('horn', 0, [(1, .75), (5, 2.25)], 0, 100, double=('trombone', -1))
    elif kind == 'done':
        s = Song(120, 67, 'maj', 12); s.melody('harp', 0, [(5, .5), (8, .5), (10, 1.5)], 0, 90, double=('glock', 1))
    elif kind == 'alarm':
        s = Song(100, 62, 'min', 13); [s.note('bells', i, 1, 62, 104) or s.note('bells', i, 1, 69, 80) for i in range(3)]
    return s

if __name__ == '__main__':
    out = sys.argv[1]; os.makedirs(out + '/music', exist_ok=True); os.makedirs(out + '/sfx', exist_ok=True)
    for name, fn in (('cine', cine), ('city', city), ('world', world), ('battle', battle), ('boss', boss)):
        s, beats = fn(); x = master(s.render(), beats, s.bpm, name); save(x, f'{out}/music/{name}.mp3')
    for k in ('win', 'loss', 'fanfare', 'legend', 'horn', 'done', 'alarm'):
        s = stinger(k); x = master(s.render(tail=2.2), None, None, k); save(x, f'{out}/sfx/{k}.mp3', '96k')
