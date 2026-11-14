"""Checks a translation file: python3 validate.py <lang>   (reads i18n/<lang>.json next to keys.json)"""
import json, re, sys, os
here = os.path.dirname(os.path.abspath(__file__)); lang = sys.argv[1]
keys = json.load(open(os.path.join(here, 'keys.json')))
tr = json.load(open(os.path.join(here, f'{lang}.json')))
PH = re.compile(r'\{(?:\d+|name)\}')
SCRIPT = {'ar': r'[؀-ۿ]', 'zh': r'[一-鿿]', 'ru': r'[Ѐ-ӿ]', 'de': r'[A-Za-zÄÖÜäöüß]'}[lang]
missing = [k for k in keys if k not in tr]
extra = [k for k in tr if k not in set(keys)]
bad_ph, empty, untranslated = [], [], []
for k in keys:
    v = tr.get(k)
    if v is None: continue
    if not isinstance(v, str) or not v.strip(): empty.append(k); continue
    if sorted(PH.findall(k)) != sorted(PH.findall(v)): bad_ph.append((k, v))
    if lang != 'de' and re.search(r'[A-Za-z]{3}', k) and not re.search(SCRIPT, v): untranslated.append(k)
print(f'{lang}: {len(tr)} entries | missing {len(missing)} | extra {len(extra)} | placeholder mismatches {len(bad_ph)} | empty {len(empty)} | no {lang} script {len(untranslated)}')
for k in missing[:10]: print('  MISSING:', k)
for k, v in bad_ph[:10]: print('  PLACEHOLDER:', k, '=>', v)
for k in untranslated[:10]: print('  NOT TRANSLATED?:', k)
sys.exit(1 if (missing or bad_ph or empty) else 0)
