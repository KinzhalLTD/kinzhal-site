# Encode screencast frames into an App Store preview: exact size, 30 fps, H.264 + AAC, <= 29.5 s.
import json, subprocess, sys, os
src, out, W, H = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
f = json.load(open(f'{src}/list.json'))
with open(f'{src}/concat.txt', 'w') as o:
    o.write('ffconcat version 1.0\n')
    for i, (fn, t) in enumerate(f):
        d = (f[i + 1][1] - t) if i + 1 < len(f) else 0.1
        o.write(f"file '{os.path.basename(fn)}'\nduration {d:.4f}\n")
    o.write(f"file '{os.path.basename(f[-1][0])}'\n")
dur = min(29.0, f[-1][1] - f[0][1] - 0.3)
vf = f"scale={W}:{H}:flags=lanczos:force_original_aspect_ratio=increase,crop={W}:{H},fps=30,format=yuv420p,trim=0:{dur},setpts=PTS-STARTPTS"
af = f"atrim=0:{dur},afade=t=in:d=0.8,afade=t=out:st={dur-2}:d=2,aresample=44100"
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', f'{src}/concat.txt', '-i', '/home/user/kinzhal-site/play/aeloria/art/music/battle.mp3',
  '-filter_complex', f'[0:v]{vf}[v];[1:a]{af}[a]', '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-profile:v', 'high', '-level', '4.0', '-preset', 'slow', '-crf', '20', '-r', '30',
  '-c:a', 'aac', '-b:a', '256k', '-ac', '2', '-movflags', '+faststart', out], check=True)
print('encoded', out, f'{dur:.1f}s')
