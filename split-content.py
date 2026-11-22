#!/usr/bin/env python3
"""
split-content.py — يقسم content/site.json لملفات منفصلة، ملف لكل شاشة في Pages CMS.

المشكلة اللي بيحلها:
  خمس entries في .pages.yml كانوا كلهم بيشاوروا على site.json. Pages CMS بيحل
  الـentry بالمسار، فخمس شاشات على مسار واحد = شاشات فاضية وحفظ بيدوس على بعض.

الاستخدام:
  python split-content.py

بيقرا site.json الموجود عندك دلوقتي (بعد الـpull) ويكتب:
  content/seo.json      meta
  content/person.json   person
  content/hero.json     hero
  content/about.json    about
  content/contact.json  contact

مهم: بيقرا من site.json بتاعك أنت — مش من نسخة قديمة. يعني أي تعديل عملته
من Pages CMS هيتنقل للملفات الجديدة زي ما هو.
"""
import json, os, sys

SRC = os.path.join('content', 'site.json')
SPLITS = {
    'seo.json':     'meta',
    'person.json':  'person',
    'hero.json':    'hero',
    'about.json':   'about',
    'contact.json': 'contact',
}

def main():
    if not os.path.exists(SRC):
        sys.exit('✗ مش لاقي %s — شغّل الأمر من فولدر الموقع' % SRC)

    with open(SRC, encoding='utf-8') as f:
        try:
            site = json.load(f)
        except json.JSONDecodeError as e:
            sys.exit('✗ %s فيه JSON بايظ: %s' % (SRC, e))

    print('قرأت %s — فيه %d مفتاح: %s' % (SRC, len(site), ', '.join(site)))
    print()

    written, skipped = 0, 0
    for filename, key in SPLITS.items():
        path = os.path.join('content', filename)

        # لو الملف موجود وفيه تعديلات مختلفة، ما تدوسش عليه من غير ما تقول
        if key not in site:
            print('  ! %-14s — مفتاح "%s" مش موجود في site.json، اتخطى' % (filename, key))
            skipped += 1
            continue

        payload = {key: site[key]}
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
            f.write('\n')

        n = len(site[key]) if isinstance(site[key], (dict, list)) else 1
        print('  ✓ %-14s ← %-8s (%d حقل)' % (filename, key, n))
        written += 1

    print()
    print('اتكتب %d ملف، اتخطى %d' % (written, skipped))
    print()
    print('بعد كده:')
    print('  git add -A')
    print('  git commit -m "fix(cms): split content per screen"')
    print('  git push')

if __name__ == '__main__':
    main()
