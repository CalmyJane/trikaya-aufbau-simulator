# Assemble promo v7: shots7_land/<SHOT>/f*.jpg in shots7.js order + music (drop lands on the first caption).
import io, re, os, glob, subprocess
order = re.findall(r"\n  \['([A-Z]+)', 'saves4/24.json', (\d+),", io.open('shots7.js', encoding='utf8').read())
lst = []
for name, n in order:
    fs = sorted(f for f in glob.glob(f'shots7_land/{name}/f*.jpg') if '(' not in f)
    assert len(fs) == int(n), (name, len(fs), n)
    lst += fs
print(len(lst), 'frames', len(lst) / 30, 's')
with open('frames7.txt', 'w') as f:
    for p in lst:
        f.write(f"file '{p}'\nduration {1/30:.6f}\n")
dur = len(lst) / 30
music = '../../music/CalmyJane-Trikaya.mp3'
subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'frames7.txt',
                '-ss', '208.2', '-t', f'{dur}', '-i', music,
                '-vf', f'fps=30,format=yuv420p,fade=t=out:st={dur - 0.5}:d=0.5',
                '-af', f'afade=t=in:d=0.3,afade=t=out:st={dur - 2.5}:d=2.5',
                '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart',
                '-t', f'{dur}', '../Trikaya_Promo_40s_DE.mp4'], check=True)
print('ok')
