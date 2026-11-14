"""Builds the shipped dictionaries i18n/<lang>.js from tools/i18n/<lang>.json.
Also adds singular/plural English variants for keys where the game glues an English plural ending
onto a word through a placeholder (e.g. "Fight · {0} attempt{1} left"), so every language matches
"…3 attempts left" and "…1 attempt left" without showing a stray "s".
Usage: python3 tools/i18n/build_dicts.py"""
import json, os, re
here = os.path.dirname(os.path.abspath(__file__)); out_dir = os.path.join(here, '..', '..', 'i18n')
GLUED = re.compile(r'(?<=[A-Za-z])\{(\d+)\}')
def drop(text, k):
    text = text.replace('{%d}' % k, '')
    return re.sub(r'\{(\d+)\}', lambda m: '{%d}' % (int(m.group(1)) - (1 if int(m.group(1)) > k else 0)), text)
os.makedirs(out_dir, exist_ok=True)
for lang in ['ar', 'zh', 'de', 'ru']:
    d = json.load(open(os.path.join(here, f'{lang}.json')))
    junk = {k for k in d if re.search(r'DOMContentLoaded|ca-app-pub|cubic-bezier|translateY\(|dialog\[open\]|nav\.tabs|^deg\)$|DT\.TD', k)}
    out = {k: v for k, v in d.items() if k not in junk and v != k}
    for k, tv in json.load(open(os.path.join(here, 'supplement.json'))).items():
        if lang in tv: out[k] = tv[lang]
    added = 0
    for k, v in list(out.items()):
        for m in GLUED.finditer(k):
            n = int(m.group(1)); tv = drop(v, n)
            for suffix in ('', 's', 'es'):
                pos = k.index('{%d}' % n)
                eng = k[:pos] + suffix + k[pos:].replace('{%d}' % n, '', 1)
                eng = re.sub(r'\{(\d+)\}', lambda mm: '{%d}' % (int(mm.group(1)) - (1 if int(mm.group(1)) > n else 0)), eng)
                if eng not in out: out[eng] = tv; added += 1
    js = '(window.AELORIA_I18N = window.AELORIA_I18N || {}).%s = %s;\n' % (lang, json.dumps(out, ensure_ascii=False, separators=(',', ':')))
    open(os.path.join(out_dir, f'{lang}.js'), 'w').write(js)
    print(lang, len(out), 'entries,', added, 'plural variants,', len(junk), 'code strings dropped,', round(len(js.encode()) / 1024), 'KB')
