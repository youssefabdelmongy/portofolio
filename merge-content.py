#!/usr/bin/env python3
"""
merge-content.py — دمج آمن بين نسخة الريموت ونسختك، ثم التقسيم لملفات منفصلة.

ليه محتاجين ده:
  Pages CMS لما بيحفظ، بيكتب الحقول اللي يعرفها بس. الـconfig القديم مكانش
  معرّف meta، فأول حفظ مسحه. النسخة اللي على الريموت ناقصة meta — لكن
  تعديلات تانية عليه ممكن تكون أحدث من نسختك.

السياسة (مهمة):
  1. الريموت هو الأساس — لأنه أحدث تعديلات المحرر
  2. أي مفتاح فاضي أو ناقص في الريموت → نرجّعه من نسختك
  3. أي مفتاح موجود في الاتنين → الريموت يكسب (شغل المحرر ميتداسش)

الاستخدام:
  git show HEAD:content/site.json > remote-site.json
  python merge-content.py

بيكتب:
  content/site.json        النسخة المدمجة (الأساس + اللي كان ضايع)
  content/seo.json          meta
  content/person.json       person
  content/hero.json         hero
  content/about.json        about
  content/contact.json      contact
"""
import json, os, sys

REMOTE = 'remote-site.json'
LOCAL  = os.path.join('content', 'site.json')
SPLITS = {
    'seo.json':     'meta',
    'person.json':  'person',
    'hero.json':    'hero',
    'about.json':   'about',
    'contact.json': 'contact',
}

def load(path, label):
    if not os.path.exists(path):
        sys.exit('✗ مش لاقي %s\n  شغّل: git show HEAD:content/site.json > %s' % (path, REMOTE))
    try:
        with open(path, encoding='utf-8') as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        sys.exit('✗ %s (من %s) فيه JSON بايظ: %s' % (path, label, e))

def is_empty(v):
    return v is None or v == '' or v == [] or v == {}

def main():
    remote = load(REMOTE, 'الريموت')
    local  = load(LOCAL, 'نسختك')

    print('الريموت (HEAD) :', len(remote), 'مفتاح —', ', '.join(remote) or '(فاضي)')
    print('نسختك        :', len(local),  'مفتاح —', ', '.join(local) or '(فاضي)')
    print()

    merged = {}
    all_keys = list(dict.fromkeys(list(remote) + list(local)))
    restored, kept = [], []

    for k in all_keys:
        r = remote.get(k)
        l = local.get(k)
        if is_empty(r) and not is_empty(l):
            merged[k] = l
            restored.append(k)
        elif not is_empty(r):
            merged[k] = r
            # نبّه لو نسختك فيها حاجة الريموت مفيهاش جوه نفس المفتاح
            if isinstance(r, dict) and isinstance(l, dict):
                extra = [f for f in l if f not in r or is_empty(r.get(f))]
                if extra:
                    print('  ! "%s" — الريموت ناقصه %d حقل: %s' % (k, len(extra), ', '.join(extra)))
                    for f in extra:
                        r[f] = l[f]
                    restored.extend('%s.%s' % (k, f) for f in extra)
            kept.append(k)
        else:
            merged[k] = l if l is not None else {}
            restored.append(k)

    print()
    print('من الريموت (تعديلات المحرر محفوظة):', ', '.join(kept) or 'لا شيء')
    print('اترجّع من نسختك (كان ضايع):      ', ', '.join(restored) or 'لا شيء')
    print()

    with open(LOCAL, 'w', encoding='utf-8') as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print('✓ اتكتب %s (مدموج)' % LOCAL)

    for filename, key in SPLITS.items():
        if key not in merged:
            print('  ! %-14s — مفتاح "%s" مش موجود، اتخطى' % (filename, key))
            continue
        path = os.path.join('content', filename)
        with open(path, 'w', encoding='utf-8') as f:
            json.dump({key: merged[key]}, f, ensure_ascii=False, indent=2)
            f.write('\n')
        n = len(merged[key]) if isinstance(merged[key], (dict, list)) else 1
        print('  ✓ %-14s ← %-8s (%d حقل)' % (filename, key, n))

    print()
    print('الخطوة الجاية:')
    print('  python split-check.py     (اختياري — يتأكد إن كل حاجة سليمة)')
    print('  git add -A && git commit -m "fix(cms): restore meta, split content per screen" && git push')

if __name__ == '__main__':
    main()
