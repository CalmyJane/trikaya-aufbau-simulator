# contact sheets of the preview stills: python sheet8.py [SHOT ...] -> preview8_land/_sheet_N.jpg (one row per shot)
import glob, subprocess, sys, re, io
order = re.findall(r"\n  \['([A-Z]+)', (\d+),", io.open('shots8.mjs', encoding='utf8').read())
names = [n for n, _ in order if not sys.argv[1:] or n in sys.argv[1:]]
rows = int(__import__('os').environ.get('ROWS', '3'))
for i in range(0, len(names), rows):
    files = []
    for n in names[i:i + rows]:
        fs = sorted(glob.glob(f'preview8_land/{n}_*.jpg'))
        files += fs[:4] + [fs[-1]] * (4 - len(fs[:4]))
    r = len(files) // 4
    args = ['ffmpeg', '-v', 'error', '-y']
    for f in files: args += ['-i', f]
    lay = '|'.join(f'{c * 640}_{rr * 360}' for rr in range(r) for c in range(4))
    args += ['-filter_complex', ''.join(f'[{j}]scale=640:360[s{j}];' for j in range(len(files))) + ''.join(f'[s{j}]' for j in range(len(files))) + f'xstack=inputs={len(files)}:layout={lay}', '-q:v', '4', f'preview8_land/_sheet_{i // rows}.jpg']
    subprocess.run(args, check=True)
    print('sheet', i // rows, names[i:i + rows])
