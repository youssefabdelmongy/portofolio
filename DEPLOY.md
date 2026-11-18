# النشر — Youssef Mohamed portfolio

موقع static بالكامل: مفيش build، مفيش npm، مفيش server. ارفع الملفات زي ما هي.

---

## ⚠️ قبل أي نشر: الدومين

الملفات دي فيها الرابط `https://yousefmohamed.design/` مكتوب جوه:
`index.html` (canonical + og:url + JSON-LD) · `sitemap.xml` · `robots.txt` · `manifest.webmanifest`

اختار واحد من اتنين:

- **عندك الدومين** → اربطه بالمشروع، وخلاص.
- **مش عندك** → إما تشتريه (~$12–15/سنة لـ `.design`)، أو أبلّغني وأنا أستبدل كل ال روابط بالدومين الحقيقي
  (مثلاً `youssef-portfolio.pages.dev`) قبل ما تنشر — عشان الـ SEO والـ social preview ميضلّوش.

---

## الخيار الأول (الأوصى بيه): Cloudflare Pages

**ليه:** الشخص الوحيد اللي بيدّي **باندويث غير محدود** على الخطة المجانية، وبيقرأ ملف `_headers`
اللي عندنا (فالـ CSP والكاش شغالين)، ومسموح للاستخدام التجاري من أول يوم.

| | |
|---|---|
| باندويث | **غير محدود** للـ static |
| سعر | $0 |
| حد أقصى للملف | 25 MiB — أكبر ملف عندنا ٤٥٨ كيلو |
| Custom domain + SSL | مجاني |
| Build | مش محتاج — Direct Upload |

**الطريقة (من غير Git):**
1. اعمل حساب على `dash.cloudflare.com`.
2. **Workers & Pages → Create → Pages → Upload assets**.
3. اسم المشروع (مثلاً `youssef-portfolio`).
4. اسحب محتويات فولدر `portfolio/` جوّه — **مش الفولدر نفسه**، المحتويات.
   (أو `npx wrangler pages deploy . --project-name=youssef-portfolio` من جوّه الفولدر.)
5. **Deploy** → هيطلعلك `https://youssef-portfolio.pages.dev`.
6. **Custom domains → Set up a domain** لو هتستخدم `yousefmohamed.design`.

> ملحوظة: Cloudflare بيوجّه المشاريع الجديدة ناحية Workers، بس Pages لسه مدعوم بالكامل
> ومفيش خطط لإيقافه. بالنسبة لموقع زي ده الاتنين نفس الحاجة.

---

## الخيار التاني: Netlify

ملف `netlify.toml` موجود جاهز، و`_headers` بتتقرأ تلقائيًا.

1. `app.netlify.com` → **Add new site → Deploy manually**.
2. اسحب فولدر `portfolio/` كله.
3. **Domain settings** لربط الدومين.

**تحذير مهم:** من ٤ سبتمبر ٢٠٢٥ خطة Netlify المجانية بقت بنظام **credits** —
٣٠٠ كريديت/شهر، وكل **deploy للإنتاج بيكلّف ١٥ كريديت**، والباندويث ٢٠ كريديت/جيجا.
يعني لو بتعدّل كتير، الـ ٣٠٠ كريديت بتخلص بسرعة. (الحسابات القديمة قبل التاريخ ده لسه عندها ١٠٠ جيجا.)
لو حسابك جديد، Cloudflare أنضف.

---

## الخيار التالت: GitHub Pages

مجاني، بس **مش بيدعم custom headers خالص** — يعني هتخسر الـ CSP
و`X-Frame-Options` والـ cache rules اللي في `_headers`. لو الأمان مهم (وهو مهم)، سيبها آخر خيار.

---

## بعد النشر — checklist سريع

- [ ] افتح الموقع على الموبايل: سكشن `#pointer` لازم يمشي على ٤ فصول بالسكرول، والكارت ميقفزش بين التابات.
- [ ] `Ctrl/⌘+K` تفتح الـ command palette.
- [ ] افتح أي مشروع → المودال يفتح، و`Esc` يقفله، والرابط يبقى `#work/اسم-المشروع`.
- [ ] جرّب تحميل الصفحة وأنت offline بعد أول زيارة (الـ service worker `v8`).
- [ ] اطبع `Ctrl+P` → لازم يطلع ٤ صفحات A4.
- [ ] **شغّل Lighthouse** — المفروض الأداء والتوصل والـ SEO عاليين.
- [ ] راجع `_headers` اشتغلت: في DevTools → Network → `index.html` → شوف `Content-Security-Policy` موجودة.

## بعد كل تعديل

غيّر رقم الكاش في `sw.js`: `ym-portfolio-v8` → `v9` → `v10` …
من غير كده الزوار اللي سبق زاروا الموقع هيفضلوا يشوفوا النسخة القديمة من الـ service worker.

---

## المحتوى والتعديل بعد النشر

المحتوى كله في `content/*.json`. عشان تعدّله من غير كود:

1. ارفع المشروع على **GitHub** (repo).
2. اربط الـ repo بـ Cloudflare Pages → **بنى تلقائي مع كل commit**.
3. افتح **[app.pagescms.org](https://app.pagescms.org)** → اختار الـ repo → عدّل من فورم بالعربي.

التفاصيل الكاملة في [`EDITING.md`](EDITING.md).

> لو نشرت بـ **Direct Upload** (سحب الملفات)، هتضطر ترفع تاني بعد كل تعديل.
> اربط GitHub وخلّي النشر أوتوماتيك زي ما طلبت.
