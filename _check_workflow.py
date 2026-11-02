import re
s = open("share-lanes-workflow.js", encoding="utf-8").read()
lines = s.splitlines()
bad = []
for i, l in enumerate(lines, 1):
    for m in re.finditer(r"\$\{", l):
        idx = m.start()
        before = l[idx-1] if idx > 0 else ""
        if not (before == "\\"):
            bad.append((i, l[max(0, idx-3):idx+3]))
print("unescaped interpolation sites:", len(bad))
for b in bad:
    print(b)
print("done")
