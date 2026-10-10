# Assemble promo v8: %TEMP%/trikaya_promo8/<SHOT>/f*.jpg (or PROMO_OUT) in shots8.mjs order + music.
# Music is 160 BPM (one bar = 1.5 s = 45 frames). The first drop (210.05 s in the track) lands on the TITLE cut,
# the one-second silence on AWARE, the second drop on STAGE, and the music stops under the end card.
import io, re, glob, subprocess, os, tempfile
root = (os.environ.get('PROMO_OUT') or os.path.join(tempfile.gettempdir(), 'trikaya_promo8')).replace(os.sep, '/')
order = re.findall(r"\n  \['([A-Z]+)', (\d+),", io.open('shots8.mjs', encoding='utf8').read())
lst, at = [], {}
for name, n in order:
    fs = sorted(f for f in glob.glob(f'{root}/{name}/f*.jpg'))
    assert len(fs) == int(n), (name, len(fs), n)
    at[name] = len(lst)
    lst += fs
dur = len(lst) / 30
print(len(lst), 'frames', dur, 's', {k: round(v / 30, 2) for k, v in at.items()})
lst = [p.replace(os.sep, '/') for p in lst]
with open(f'{root}/frames8.txt', 'w') as f:
    for p in lst:
        f.write(f"file '{p}'\nduration {1/30:.6f}\n")
DROP = 210.05
start = DROP - at['TITLE'] / 30
music = '../../music/CalmyJane-Trikaya.mp3'
subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', f'{root}/frames8.txt',
                '-ss', f'{start}', '-t', f'{dur}', '-i', music,
                '-vf', f'fps=30,format=yuv420p,fade=t=out:st={dur - 0.4}:d=0.4',
                '-af', f'afade=t=in:d=0.4,afade=t=out:st={dur - 0.3}:d=0.3',
                '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart',
                '-t', f'{dur}', '../Trikaya_Promo_v8_DE.mp4'], check=True)
print('ok')
