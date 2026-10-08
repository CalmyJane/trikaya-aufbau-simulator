import io
s = io.open('capture6.mjs', encoding='utf8').read()
head, rest = s.split('const SHOTS = [', 1)
_, tail = rest.split('];\n\nconst outRoot', 1)
tail = '];\n\nconst outRoot' + tail

head = head.replace('// Gameplay promo v3 (German)', '// Promo v7 (German, 40 s: aerials + gameplay)')
head = head.replace('capture3.mjs full|preview', 'capture7.mjs full|preview')
# corner mark: Calmy Jane head + lettering
a = """m.innerHTML = '<img class="t" src="assets/ui/calmyjane_text.svg">';"""
assert a in head
# corner: only the lettering logo (it has the face built in)
a = """window.CJBIG = '<div class="cjbig"><img class="t" src="assets/ui/calmyjane_text.svg"></div>';"""
assert a in head
head = head.replace(a, """window.CJBIG = '<div class="cjbig"><img class="h" src="/CalmyJaneHeadWhite.png"><img class="t" src="assets/ui/calmyjane_text.svg"></div>';""")

shots = io.open('shots7.js', encoding='utf8').read()
assert shots.startswith('const SHOTS = [')
shots = shots[len('const SHOTS = ['):].rstrip()
assert shots.endswith('];')
shots = shots[:-2]
tail = tail.replace("(preview ? 'preview6_' : 'shots6_') + orient", "(preview ? 'preview7_' : 'shots7_') + orient")
assert 'shots7_' in tail
io.open('capture7.mjs', 'w', encoding='utf8').write(head + 'const SHOTS = [' + shots + tail)
print('ok')
