# Youssef Mohamed — Portfolio (production build)

موقع بورتفوليو جاهز للنشر: ستاتيك بالكامل (HTML/CSS/JS)، بدون أي مكتبة خارجية، بدون build step، ويعمل أوفلاين.

**المحتوى حقيقي**: الاسم، الصورة، المشاريع (٨ من ١٢ على Behance) والأرقام — كلها من <https://www.behance.net/65c12764>.

---

## 1) تشغيل ونشر

### محليًا
```bash
cd portfolio
python3 -m http.server 8080      # http://localhost:8080
```

### النشر (اختر واحد)
| المنصة | الخطوات |
|---|---|
| **Netlify** | اسحب مجلد `portfolio` على app.netlify.com/drop — ملف `_headers` بيشتغل تلقائيًا (أمان + كاش). |
| **Vercel** | `vercel deploy --prod` من جوّه المجلد (ستاتيك تلقائي). |
| **GitHub Pages** | ارفع المجلد على branch `main` → Settings > Pages > Deploy from branch. |
| **Cloudflare Pages** | Build command: *(فاضي)* · Output directory: `/`. |
| **أي cPanel / هوستنج عادي** | ارفع محتويات المجلد في `public_html`. |

### بعد النشر (٣ خطوات إلزامية)
1. **الدومين**: بدّل `https://youssefmohamed.design/` في `index.html` (canonical + og:url + og:image) وفي `sitemap.xml` و`robots.txt`.
2. **الإيميل** متظبّط على `jomongy52@gmail.com` (في `index.html`, `offline.html`, `404.html`, `js/data.js`) — لو اتغيّر بدّله في الأربعة.
3. **ارفع الـ sitemap** في Google Search Console واطلب فحص الرابط.
4. **زوّد رقم الـ cache** في `sw.js`: `const CACHE = 'ym-portfolio-v6'` → أي إصدار جديد (وإلا الزوار القدام هيفضلوا على النسخة القديمة).

> ملاحظة: الأرقام (1,176 view / 112 appreciation / 12 مشروع) مأخوذة من البروفايل وقت البناء — حدّثها في `index.html` قسم `.stats` لو اتغيّرت.

---

## 2) اللي جوه الموقع

| Section | إيه اللي بيحصل |
|---|---|
| **Hero** | الاسم بخط variable بيتفاعل مع الماوس/اللمس (وبيتنفّس لوحده بعد سكون)، بورتريه Youssef مقصوص بـ parallax، خلفية WebGL بتشتغل على الموبايل كمان، بادج «3 سنوات»، ساعة القاهرة live |
| **01 Hire me (what you get)** | أول سكشن بعد الإنترو، وأداة مش عرض: ٤ خدمات، كل كارت فيه سطر «إيه ده»، تابين **Today / After the fix** — وكل تاب بيعرض **شغل حقيقي**: صفحة منيو مطبوعة، الـkey visual بتاع Talabat، اللوجو زي ما بيوصل من الواتساب جنب اللوجو من الملف، والبوستات الحقيقية — مع أرقام تقدر تتأكد منها (١٤ طبق، ٤ مقاسات تايب، ١٢ بوست). مفيش أي placeholders أو أزرار وهمية. **What changes for you** (الفايدة)، **What you get** (٤ تسليمات بعلامات ✓)، و**Made for** (مشروع حقيقي). في الآخر **باني بريف ٣٠ ثانية** (`js/brief.js`): ٣ اختيارات (إيه / إمتى / فين) → نص بريف جاهز قابل للتعديل + Send it (mailto) + Copy + Start over، مفيش أي داتا بتتحفظ. الكوبي كله ودود وبصيغة المخاطب، ومفيش أي ego |
| **02 Work** | ٨ مشاريع حقيقية، كل مشروع بـ ٣ صور من الجاليري الأصلي معروضة **كاملة** على بلاطة بلون البراند + وصف + tags + سطر «+38 more». الكروت بتلف في 3D مع السكرول (`js/reel.js`) — نفس التأثير على الموبايل والديسكتوب. الضغط بيفتح case study فيه صور أكبر، تفاصيل الشغل، لينك Behance، وتنقّل بالكيبورد (← → Esc) ولينك مباشر `#work/talabat` |
| **03 About** | statement بيتنوّر مع السكرول، أرقام حقيقية، toolkit، خدمات، توصية عميل، سطر عربي للعملاء المحليين |
| **04 Contact** | إيميل CTA واحد + Behance + زر Share (native share / copy link) + ساعة القاهرة |
| **05 Tools** (`tools.html`) | صفحة مستقلة فيها **١٠ أدوات** بتشتغل على الجهاز نفسه: مقاسات سوشيال (١٧) · حاسبة bleed و dpi (١٠ بريستات) · فحص تباين WCAG · px/rem/pt · توليد باليتة + تصدير tokens · **كاشف الخطوط الحقيقي** (بيقيس الخط فعليًا بالـcanvas ويقولك أنهي face بيرندر) · ميزانية حجم الملف · **فاحص صور** (أبعاد · dpi فعلي · شفافية · ضوضاء — بدون رفع) · **مصدّر لوكاب SVG** (٤ تركيبات بتحميل حقيقي) + دليل ٢٨ أداة بفلتر وبحث. مفيش رفع ولا تتبع، وكلها أوفلاين |

**إيستر إيجز**: `g` = grid المصممين · `ink!` = حبر على الشاشة · `/` أو `⌘K` = command palette.

---

## 3) Production features

- **SEO**: title/metrics مكتوبة، `canonical`, Open Graph + Twitter card بصورة **1200×630 مولّدة فعليًا** (`assets/og.jpg`)، JSON-LD كامل (`Person` + `WebSite` + `ProfilePage` + `ItemList` بالأعمال)، `robots.txt`, `sitemap.xml`.
- **محتوى في الـ HTML**: كل المشاريع والصور موجودة في الماركب قبل الجافاسكريبت → تظهر بدون JS، وتُقرأ بواسطة محركات البحث وAI crawlers، والـ modal بيضيف السلوك بس.
- **PWA / أوفلاين**: `manifest.webmanifest` + أيقونات 192/512 + `sw.js` (precache للشل والصور + fallback `offline.html`) — الموقع بيفتح بدون نت بعد أول زيارة.
- **صفحات**: `404.html` و`offline.html` بنفس هوية الموقع.
- **أداء**: FCP ≈ 0.18s محليًا، صفر مكتبات، خطوط self-hosted (400KB woff2)، صور webp مع `srcset` (نسخة 640w لكل صورة) و`width/height` لمنع CLS، تبويب preload للبورتريه والخطوط الحرجة، LAN lazyload لكل صور المشاريع.
- **أمان**: `_headers` فيه CSP, HSTS, nosniff, frame-options, permissions-policy + كاش immutable للأصول و`must-revalidate` للـ HTML.
- **وصولية (WCAG 2.2 AA)**: HTML دلالي، `h1` واحد وتسلسل عناوين سليم، skip link، focus visible، كل صورة بـ alt، كل زر باسم، المودال modal حقيقي مع focus trap وEsc، أهداف لمس ≥44px، احترام `prefers-reduced-motion` بالكامل.
- **كيبورد**: كل شيء قابل للوصول بالتاب، الأسهم بتتنقّل في المودال، و`⌘K`/`Ctrl+K` بيفتح **Command Palette** بتوصلك لأي مشروع أو سكشن + Copy email + Download as PDF.
- **خلفية Hero حقيقية**: WebGL shader مكتوب من الصفر (domain-warped fbm) بألوان الهوية، بيشتغل على **الموبايل كمان** (dpr مخفَّض + 30fps + حركة تلقائية بطيئة للسنتر لو مفيش لمس)، بيقف لما يخرج من الشاشة أو التاب يتخفي، ولو الجهاز مش داعم أو `prefers-reduced-motion` بيرجع للتدرّج اللوني العادي.
- **PDF جاهز للإرسال**: `⌘K → Download the portfolio as PDF` (أو Ctrl/⌘+P) بيطلع **٤ صفحات A4**: غلاف فيه الاسم والإيميل والبورتريه + الأربع خدمات، الـ٨ مشاريع، ثم الـAbout والـContact في صفحة واحدة — بتصميم أبيض نظيف للطباعة، مش سكرين شوت من الموقع الداكن.

---

## 4) هيكل الملفات

```
portfolio/
├── index.html              # الصفحة (محتوى pre-rendered + JSON-LD + OG)
├── tools.html              # صفحة الأدوات (مستقلة، مش من content/)
├── offline.html 404.html   # صفحات الحالات الخاصة
├── manifest.webmanifest    # PWA
├── sw.js                   # service worker (ا bump الـ CACHE مع كل نشر)
├── robots.txt sitemap.xml _headers .gitignore
├── fonts.css + fonts/      # Bricolage Grotesque · Space Grotesk · JetBrains Mono ·
│                           # Instrument Serif · IBM Plex Sans Arabic (woff2 محلية)
├── css/  base.css · sections.css · effects.css · print.css · tools.css
├── js/
│   ├── data.js             # المشاريع (blurb/details/gallery/bg)
│   ├── utils.js            # helpers + ticker واحد لكل الأنيميشن
│   ├── smooth.js           # inertial scroll + velocity + parallax + header/progress
│   ├── cursor.js           # cursor states + magnetic + sparkle trail
│   ├── intro.js            # شاشة التحميل (مرة/جلسة)
│   ├── reveal.js           # splits، counters، scroll-spy، statement
│   ├── hero.js             # variable font تفاعلي + parallax + clocks
│   ├── work.js             # المودال + keyboard + deep links (الكروت نفسها في HTML)
│   ├── cursorlab.js        # سكشن "what you get": ٤ خدمات + specimen + before/after
│   ├── brief.js            # باني البريف (٣ اختيارات → نص → mailto / copy)
│   ├── reel.js             # ميلان 3D لكروت الشغل مع السكرول (موبايل + ديسكتوب)
│   ├── shader.js           # خلفية الـ hero بـ WebGL خام (fallback: gradient)
│   ├── palette.js          # Command Palette (⌘K / Ctrl+K / /)
│   ├── tools.js            # كل حاسبات صفحة الأدوات + الدليل
│   └── app.js              # menu، anchors، SW، share، copy email، easter eggs
└── assets/
    ├── og.jpg icon-192/512.png apple-touch-icon.png
    ├── portrait-cut.webp · portrait-square.webp

    └── work/  (٨ مشاريع × ٣ صور + نسخ -sm بـ 640w)
```

---

## 5) ازاي تعدّل

- **مشروع جديد**: ضيف object في `js/data.js → projects` **وكمان** كارت في `index.html` (لأن الكروت pre-rendered، ده مقصود للـ SEO). الصور: حطها في `assets/work/` + نسخة `-sm.webp` (640px) وحدّث `srcset`.
- **فصل جديد في The Cursor**: ضيف object في `STAGES` جوه `js/cursorlab.js` (key, name, glyph, size, bg, foot, url, blurb) + `<article class="cstep">` في `index.html` + body جديد للـ specimen (`data-spec`) لو محتاج سطح مختلف. الـ counter والـ rail والـ palette ونسخة الموبايل بيتحدّثوا لوحدهم.
- **الألوان**: `:root` أول `css/base.css` (`--ink`, `--paper`, `--accent`, `--accent-2`).
- **السيرة/الأرقام**: قسم `#about` في `index.html` (`data-count` + `data-suffix`).
- **البورتريه**: بدّل `assets/portrait-cut.webp` (خلفية شفافة) و`portrait-square.webp`، وقص الخلفية لو محتاج:
  ```bash
  pip install rembg pillow
  python3 -c "from rembg import remove, new_session; from PIL import Image; \
  remove(Image.open('me.jpg'), session=new_session('u2net')).save('assets/portrait-cut.png')"
  ```
- **بعد أي نشر**: غيّر `const CACHE = 'ym-portfolio-v8'` في `sw.js` لـ `v9` وهكذا، عشان الزوار ياخدوا النسخة الجديدة.

---

## 6) QA تم تنفيذه

- ✅ يفتح ويعرض كل المشاريع **بدون JavaScript**.
- ✅ `prefers-reduced-motion` بيوقف الحركة وبيخفي شاشة التحميل.
- ✅ Service worker بيشتغل، والموقع بيفتح **offline** بعد أول زيارة.
- ✅ مودال: Esc / ← → / focus trap / deep link `#work/qandil`.
- ✅ موبايل 390/375/360px: هيرو بشيدر WebGL شغّال، كروت بتلف في 3D، وسكشن «what you get» واقع كله في شاشة واحدة (المعروض + كلام الفصل) من غير قطع نص.
- ✅ لا أخطاء console ولا 404 للأصول، `h1` واحد، alt لكل صورة، أسماء لكل زر.
- ✅ Command Palette: `Ctrl/⌘+K` بتفتح، الفلترة والتنقّل بالأسهم وEnter شغالين، واختيار أي مرحلة بيسكرول لها فعليًا.
- ✅ The Cursor: الـ ٤ فصول بتتقدّم مع السكرول بالترتيب، الكوبي المثبّت بيتبدّل مع الفصل، والـ rail (٤ أزرار) بـ keyboard + Enter.
- ✅ كارت الـ specimen: **صوت بصري واحد** — radius 10px، كابشن واحد `0.5rem` تحت الصورة (مش فوقها)، رمادي واحد للنص الثانوي، وارتفاع ثابت لكل الـ ٨ وجوه (after/before × ٤ فصول) فالكارت مابيقفزش بين التابات. الصور بتتحط كاملة (`object-fit:contain`) — مفيش قص في الشغل.
- ✅ تاب «Today / After the fix» شغّال فعليًا: `data-view` على `.cspec` + قواعد `data-on` × `data-view`، وبادي على `after`.
- ✅ مقاسات: ٣٩٠×٨٤٤ / ٣٧٥×٦٦٧ / ١٤٤٠×٩٠٠ — الـ ٨ وجوه كلها جوّ الشاشة، الكابشن ظاهر، والـ sticky مثبّت (`top:0`) قبل القياس.
- ✅ PDF: صفحة كاملة لسكشن الـ cursor بالأسود على الأبيض (الفصول الـ٤ + اللي بيقدّمه).
- ✅ خلفية WebGL: بتظهر على ديسكتوب، بتختفي تمامًا مع `prefers-reduced-motion`، ولو الـ context ضاع بترجع للتدرّج اللوني.
- ✅ PDF: ٤ صفحات A4 (غلاف + الخدمات + ٨ مشاريع + About & Contact في صفحة واحدة) بخطوط سودا على أبيض، والصور كاملة، بدون أي كارت مقطوع أو صفحة شبه فاضية. (كان في مشكلة rasterization في هيرو الصفحة الأولى فاتحلّت بغلاف مخصص للطباعة.)


---

✏️ **التعديل:** كل المحتوى في `content/*.json` — شوف [`EDITING.md`](EDITING.md).

📦 **النشر:** شوف [`DEPLOY.md`](DEPLOY.md) — Cloudflare Pages هو الخيار الموصى بيه (باندويث غير محدود، بيقرأ `_headers`).
