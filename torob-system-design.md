# پشت‌صحنه ترب: جمع‌آوری، تطبیق و به‌روزرسانی میلیون‌ها محصول

> **نویسنده:** Afshin Yarinia — Back End Developer | PHP | PYTHON
> **تاریخ:** July 3, 2026

ترب از نظر طراحی سیستم مثال جالبی است، چون مسئله اصلی آن فقط «اسکریپ کردن چند سایت» نیست.

مسئله واقعی این است:

> چطور می‌توان داده‌های نامنظم، متغیر و گاهی غیرقابل‌اعتماد هزاران فروشنده را به یک تجربه قابل‌اعتماد برای جست‌وجو و مقایسه قیمت تبدیل کرد؟

دیجی‌کالا و ترب هر دو در فضای ecommerce هستند، اما جنس مسئله‌شان فرق دارد. دیجی‌کالا بیشتر شبیه یک commerce platform است: بخش بزرگی از کاتالوگ، فرایند خرید، جریان سفارش، قوانین فروشنده، موجودی و تجربه checkout داخل یک سیستم کنترل‌شده مدیریت می‌شود. ترب بیشتر شبیه یک لایه کشف محصول و مقایسه قیمت روی تعداد زیادی فروشگاه مستقل است.

همین تفاوت باعث می‌شود ترب با واقعیت بیرونی سروکار داشته باشد:

- فروشگاه‌های مختلف با پیاده‌سازی‌های مختلف
- CMSهای متفاوت مثل WooCommerce، فروشگاه‌سازهای اختصاصی یا سیستم‌های داخلی
- ساختار URLهای متفاوت
- فرمت‌های متفاوت قیمت و موجودی
- عنوان‌های متفاوت برای یک محصول مشابه
- سایت‌هایی که کند می‌شوند یا از دسترس خارج می‌شوند
- قیمت‌های stale
- محصولات تکراری
- matching اشتباه بین محصولات
- فروشندگانی که ممکن است برای گرفتن کلیک، قیمت یا اطلاعات گمراه‌کننده منتشر کنند

در این مقاله از زاویه system design بررسی می‌کنیم ترب احتمالا چطور محصولات را وارد سیستم می‌کند، چطور داده‌ها را normalize و match می‌کند، چطور freshness قیمت و موجودی را مدیریت می‌کند، و چه edge caseهایی در مقیاس واقعی اهمیت دارند.

## چیزهایی که به صورت عمومی می‌دانیم

از صفحات عمومی ترب چند نکته مشخص می‌شود:

- فروشگاه‌های آنلاین بعد از تایید و شارژ حساب، می‌توانند محصولاتشان را به صورت خودکار توسط ربات‌های ترب وارد سیستم کنند.
- ترب می‌گوید تغییرات قیمت و موجودی بعد از تغییر در سایت فروشنده، به صورت خودکار به‌روزرسانی می‌شود.
- در فرایند ترب، اطلاعات محصول خوانده می‌شود و بعد محصولات دسته‌بندی و ادغام می‌شوند.
- فروشگاه‌های فیزیکی بدون سایت می‌توانند محصول موجود در ترب را جست‌وجو کنند و فقط قیمت خودشان را برای آن ثبت کنند.
- ترب پلاگین رسمی WooCommerce دارد.
- مقاله پلاگین WooCommerce ترب می‌گوید این پلاگین یک API بر پایه WordPress REST API ایجاد می‌کند و فیلدهایی مثل عنوان، شناسه محصول، قیمت فعلی، قیمت قبلی، موجودی، دسته‌بندی، لینک تصویر، لینک محصول، توضیحات، ویژگی‌ها، تاریخ انتشار، گارانتی و اطلاعات رجیستری را استخراج می‌کند.
- changelog عمومی پلاگین WordPress به مواردی مثل product-change webhook، token validation، product preview و connection check اشاره می‌کند.

از اینجا به بعد باید بین دو نوع گزاره فرق بگذاریم:

> **Verified** = چیزی که در اطلاعات عمومی ترب یا پلاگین آمده است
> **Inferred** = معماری منطقی برای یک سیستم شبیه ترب

این تفکیک مهم است، چون هدف مقاله حدس زدن معماری داخلی ترب نیست؛ هدف این است که مسئله را از زاویه طراحی سیستم درست تحلیل کنیم.

## فرض‌های مقیاس

قبل از طراحی سیستم، باید چند فرض تقریبی درباره مقیاس داشته باشیم. لازم نیست دقیق باشند، ولی جهت معماری را مشخص می‌کنند.

برای یک سیستم شبیه ترب می‌توان چنین فرض‌هایی داشت:

| مورد | فرض |
|---|---|
| تعداد فروشنده‌ها | هزاران تا ده‌ها هزار |
| تعداد محصول/offer | میلیون‌ها |
| الگوی ترافیک | read-heavy |
| تغییرات | قیمت و موجودی دائما تغییر می‌کنند |
| محصولات داغ | نیاز به freshness در حد چند دقیقه |
| محصولات long-tail | تحمل refresh کندتر |
| latency جست‌وجو | چند صد میلی‌ثانیه |
| مدل consistency | eventually consistent |

از همین فرض‌ها چند نتیجه مهم می‌گیریم:

- کاربران خیلی بیشتر از فروشنده‌ها سیستم را می‌خوانند.
- مسیر ingestion و مسیر serving باید از هم جدا باشند.
- crawl کردن همه فروشگاه‌ها در هر دقیقه واقع‌بینانه نیست.
- freshness قیمت باید adaptive باشد، نه یکسان برای همه محصولات.
- search باید از روی search index سرو شود، نه مستقیم از catalog database.
- چون product matching کامل و بی‌خطا نیست، سیستم به human review نیاز دارد.

## مدل اصلی: محصول canonical در برابر offer فروشنده

مهم‌ترین مفهوم در طراحی چنین سیستمی تفاوت بین **canonical product** و **seller offer** است.

**canonical product** یعنی محصول normalize شده‌ای که کاربر می‌خواهد مقایسه کند:

```
Apple iPhone 15 Pro Max, 256GB, Natural Titanium
```

**seller offer** یعنی پیشنهاد یک فروشنده برای همان محصول:

- فروشنده A: قیمت ۷۱,۵۰۰,۰۰۰ تومان، موجود
- فروشنده B: قیمت ۷۲,۲۰۰,۰۰۰ تومان، موجود
- فروشنده C: قیمت ۶۹,۹۰۰,۰۰۰ تومان، ناموجود

این تفکیک پایه سیستم است.

اگر ترب هر listing فروشنده را یک محصول مستقل در نظر بگیرد، کاربر با تعداد زیادی محصول تکراری روبه‌رو می‌شود. اگر هم محصولات را بیش از حد aggressive با هم merge کند، کاربر قیمت‌های چند محصول متفاوت را کنار هم می‌بیند. هر دو حالت اعتماد کاربر را از بین می‌برد.

پس سیستم به دو لایه نیاز دارد:

> **Canonical product** = محصول نرمال‌شده و قابل مقایسه
>
> **Seller offer** = قیمت، موجودی، گارانتی، لینک، فروشنده و freshness

این مدل به ترب اجازه می‌دهد برای یک محصول، چندین قیمت و فروشنده مختلف نشان دهد.

## معماری کلی

در سطح بالا، سیستم محصول در ترب دو مسیر اصلی دارد:

- **مسیر ingestion:** جمع‌آوری، پاک‌سازی، normalize، match و index کردن داده محصول.
- **مسیر serving:** پاسخ سریع به جست‌وجو و صفحه محصول برای کاربران.

ایده اصلی این است:

> Ingestion می‌تواند کند، retryable و eventually consistent باشد.
>
> Serving باید سریع، قابل‌اتکا و user-facing باشد.

به همین دلیل نمی‌خواهیم هر بار که کاربر جست‌وجو می‌کند، سیستم برود سایت فروشنده‌ها را live crawl کند. کاربر باید از view ایندکس‌شده ترب از دنیا جواب بگیرد.

## محصولات چطور وارد سیستم می‌شوند؟

یک سیستم شبیه ترب معمولا فقط یک روش ingestion ندارد. هر روش مزایا و محدودیت‌های خودش را دارد.

### tradeoff روش‌های ingestion

| روش | مزیت | ضعف | کاربرد مناسب |
|---|---|---|---|
| HTML crawling | با سایت‌های زیادی کار می‌کند | با تغییر HTML شکننده است | فروشگاه‌هایی که feed یا API ندارند |
| Sitemap/feed | discovery ساده‌تر | ممکن است stale یا ناقص باشد | پیدا کردن URL محصولات |
| Plugin/API | ساختاریافته و قابل‌اعتمادتر | نیاز به نصب یا تنظیم فروشنده دارد | WooCommerce یا پلتفرم‌های پشتیبانی‌شده |
| Webhook | به‌روزرسانی سریع | ممکن است گم، تکراری یا غیرفعال شود | تغییرات قیمت و موجودی |
| Manual offer | ساده برای فروشگاه فیزیکی | برای ساخت محصول کامل کافی نیست | ثبت قیمت روی محصول موجود |

معماری پخته معمولا انتخاب بین «crawler یا API» نیست. ترکیبی است:

> - API/plugin وقتی ممکن است
> - Sitemap/feed برای discovery
> - Crawling به عنوان fallback
> - Webhook برای update سریع
> - Polling به عنوان safety net
> - Human review برای موارد مبهم

### onboarding فروشگاه آنلاین

برای یک فروشگاه آنلاین، جریان کلی می‌تواند این‌طور باشد که فروشگاه ثبت‌نام و تایید می‌شود و سپس ingestion آغاز می‌گردد.

نکته مهم این است که ingestion بعد از تایید فروشگاه شروع می‌شود. ترب نباید بدون شناخت فروشنده، هر سایت تصادفی را وارد index کند.

### جریان فروشگاه فیزیکی

برای فروشگاهی که سایت ندارد، جریان فرق می‌کند.

اینجا دوباره اهمیت canonical product مشخص می‌شود. فروشنده لازم نیست کل محصول را از صفر بسازد؛ فقط قیمت و offer خودش را به یک محصول موجود وصل می‌کند.

## Crawling سایت فروشنده‌ها

HTML crawling منعطف‌ترین روش ingestion است، اما در عین حال شکننده‌ترین روش هم هست.

crawler باید به چند سوال جواب دهد:

- الان کدام فروشنده باید crawl شود؟
- کدام URLها احتمالا product page هستند؟
- با چه سرعتی می‌توان سایت این فروشنده را crawl کرد بدون اینکه به سایت فشار بیاید؟
- از آخرین fetch موفق چه چیزی تغییر کرده؟
- اگر سایت فروشنده down شد، چه باید کرد؟
- اگر parser دیگر نتوانست قیمت را پیدا کند، چه اتفاقی باید بیفتد؟

### Discovery در برابر Extraction

Discovery و extraction باید جدا باشند.

**Discovery** جواب می‌دهد:

> چه URLهایی برای محصول وجود دارد؟

**Extraction** جواب می‌دهد:

> روی این URL چه داده محصولی وجود دارد؟

خروجی discovery می‌تواند شبیه این باشد:

```
seller_id
product_url
discovered_at
source_type = sitemap | api | crawl | plugin | manual
```

خروجی extraction می‌تواند شبیه این باشد:

```
seller_id
product_url
seller_product_id
title
price
old_price
availability
image_url
attributes
category
fetched_at
```

این جداسازی در debug خیلی مهم است. اگر محصولی در ترب دیده نمی‌شود، تیم می‌تواند دقیق‌تر بپرسد: مشکل در discovery بوده یا URL پیدا شده ولی parse نشده است؟

## API، feed یا plugin ساختاریافته

وقتی فروشنده بتواند داده ساختاریافته بدهد، API یا plugin معمولا بهتر از HTML crawling است.

پلاگین WooCommerce ترب یک نمونه عمومی از این مدل است. طبق توضیح ترب، این پلاگین داده محصول را از طریق یک API مبتنی بر WordPress REST API در اختیار ترب قرار می‌دهد. changelog عمومی پلاگین هم به connection check، token validation، product preview و webhook اشاره می‌کند.

API بهتر است چون:

- نام فیلدها مشخص است
- pagination قابل کنترل‌تر است
- product IDها پایدارتر هستند
- variantها بهتر قابل نمایش هستند
- قیمت و موجودی مستقیم از ecommerce platform می‌آیند
- parser کمتر به HTML و CSS سایت وابسته است

اما API هم edge case دارد:

- نسخه پلاگین قدیمی است
- token منقضی یا اشتباه است
- پلاگین با پلاگین دیگری در WordPress تداخل دارد
- فروشنده pricing rule اختصاصی دارد
- API داده stale برمی‌گرداند
- pagination محصولی را جا می‌اندازد یا تکراری برمی‌گرداند
- catalog بزرگ باعث timeout می‌شود
- firewall فروشنده requestهای ترب را block می‌کند

پس هر seller integration باید مثل یک **data contract** مانیتور شود.

## Webhook و Polling

Webhook برای freshness خیلی مهم است. به جای اینکه ترب مدام بپرسد «این محصول تغییر کرده؟»، سیستم فروشنده می‌تواند وقتی قیمت یا موجودی تغییر کرد به ترب خبر بدهد.

اما webhook به تنهایی کافی نیست. ممکن است گم شود، دیر برسد، دوبار برسد یا کلا غیرفعال شود.

الگوی قابل‌اعتماد این است:

> **Webhook = fast path**
>
> **Polling = safety net**

اگر webhook تکراری آمد، پردازش باید idempotent باشد. اگر webhook گم شد، polling باید در نهایت داده را اصلاح کند.

## استخراج داده محصول

لایه extraction داده خام فروشنده را به یک product event ساختاریافته تبدیل می‌کند.

مثلا داده خام می‌تواند چنین چیزی باشد:

```json
{
  "title": "iPhone 15 ProMax 256 Natural - رجیستر شده",
  "price": "715,000,000 ریال",
  "availability": "موجود",
  "category": "Mobile Phones",
  "image": "https://seller.example/cdn/iphone.jpg",
  "url": "https://seller.example/product/123"
}
```

خروجی normalize شده می‌تواند این باشد:

```json
{
  "seller_id": "seller_123",
  "seller_product_id": "123",
  "title": "iPhone 15 Pro Max 256GB Natural",
  "brand": "Apple",
  "model": "iPhone 15 Pro Max",
  "storage": "256GB",
  "color": "Natural Titanium",
  "price_toman": 71500000,
  "in_stock": true,
  "product_url": "https://seller.example/product/123",
  "image_url": "https://seller.example/cdn/iphone.jpg",
  "observed_at": "2026-07-02T10:00:00Z"
}
```

این لایه باید این موارد را مدیریت کند:

- تبدیل ریال و تومان
- اعداد فارسی، عربی و انگلیسی
- قیمت خالی یا صفر
- «تماس بگیرید» به جای قیمت
- قیمت اقساطی به جای قیمت نهایی
- قیمت قبلی و قیمت فعلی
- variantهای محصول
- ابهام در موجودی
- صفحات JavaScript-rendered
- redirectها
- تصویر خراب
- URLهای تکراری
- فرمت‌های اختصاصی هر فروشنده

سیستم خوب به همه فیلدها به یک اندازه اعتماد نمی‌کند. برای داده‌ها confidence نگه می‌دارد:

```
price_confidence = high | medium | low
stock_confidence = high | medium | low
match_confidence = high | medium | low
```

داده low-confidence می‌تواند مخفی شود، پایین‌تر rank شود یا به human review برود.

## Normalization

Normalization یعنی تبدیل متن و داده فروشنده به زبان داخلی سیستم.

مثال:

```
"اپل"                 -> "Apple"
"آیفون ۱۵ پرو مکس"    -> "iPhone 15 Pro Max"
"256 گیگ"             -> "256GB"
"ناموجود"             -> in_stock = false
"۷۱۵,۰۰۰,۰۰۰ ریال"   -> 71,500,000 Toman
```

کارهای رایج در normalization:

- تبدیل اعداد
- پاک‌سازی متن
- تبدیل واحد پول
- normalize کردن واحدها
- mapping دسته‌بندی
- تشخیص brand
- استخراج model
- استخراج attributeها
- حذف stopword برای search و matching

Machine learning می‌تواند کمک کند، اما ruleهای deterministic هنوز خیلی مهم‌اند. در commerce تفاوت‌های کوچک می‌توانند هویت محصول را عوض کنند.

## Product Matching

سخت‌ترین بخش سیستم product matching است.

این عنوان‌ها ممکن است به یک محصول اشاره کنند:

- فروشنده A: گوشی اپل iPhone 15 Pro Max ظرفیت 256 گیگ
- فروشنده B: Apple iPhone 15 ProMax 256GB رجیستر شده
- فروشنده C: آیفون 15 پرومکس 256 نچرال تیتانیوم

اما این‌ها نباید با هم merge شوند:

- iPhone 15 Pro Max 256GB
- iPhone 15 Pro Max 512GB
- iPhone 15 Pro 256GB
- iPhone 15 Plus 256GB

تفاوت کوچک در عنوان می‌تواند محصول واقعی متفاوتی باشد.

### Pipeline مربوط به matching

candidate generation برای scale حیاتی است. به جای اینکه یک محصول جدید با کل catalog مقایسه شود، سیستم اول چند candidate احتمالی پیدا می‌کند.

کلیدهای candidate می‌تواند شامل این‌ها باشد:

- category
- brand
- model
- barcode یا شناسه محصول
- tokenهای normalize شده عنوان
- attributeهای مهم مثل storage، size، color، capacity یا voltage

### خطاهای رایج در matching

matching بد از crawl کند خطرناک‌تر است.

اشتباه‌های رایج:

- گوشی 256GB با 512GB merge شود
- لپ‌تاپ 8GB RAM با 16GB RAM merge شود
- عطر 50ml با 100ml merge شود
- محصول original با copy merge شود
- bundle با محصول تکی merge شود
- accessory با محصول اصلی merge شود
- گوشی رجیسترشده با رجیسترنشده merge شود
- محصول refurbished با محصول new merge شود

برای دسته‌های حساس، بهتر است سیستم false negative را به false positive ترجیح دهد:

> بهتر است دو محصول جدا نشان داده شوند تا اینکه دو محصول متفاوت اشتباه merge شوند.

## Human Review و عملیات merge

اطلاعات عمومی ترب به دسته‌بندی و ادغام محصولات اشاره می‌کند. این یعنی حداقل برای موارد نامطمئن، یک فرایند human-in-the-loop لازم است.

ابزار داخلی review باید این قابلیت‌ها را داشته باشد:

- پیشنهاد matchهای احتمالی
- preview تصویر محصول
- مقایسه attributeها
- سابقه فروشنده
- توضیح confidence
- عملیات bulk
- audit log
- rollback

rollback مهم است. اگر دو محصول اشتباه merge شوند، سیستم باید بتواند آن‌ها را دوباره جدا کند.

## Freshness قیمت و موجودی

freshness لایه اعتماد در یک price-comparison product است.

اگر ترب نشان دهد:

> قیمت در ترب: ۷۱,۵۰۰,۰۰۰ تومان
>
> قیمت در سایت فروشنده: ۷۴,۰۰۰,۰۰۰ تومان

کاربر معمولا ترب را مقصر می‌داند، حتی اگر فروشنده همین چند دقیقه قبل قیمت را عوض کرده باشد.

سیستم نباید همه محصولات را با یک سرعت refresh کند. باید **adaptive freshness** داشته باشد.

### Adaptive Refresh Scheduling

اولویت refresh می‌تواند به این موارد وابسته باشد:

- محبوبیت محصول
- reliability فروشنده
- نوسان تاریخی قیمت
- نوسان موجودی
- حساسیت دسته‌بندی
- زمان آخرین fetch موفق
- کلیک‌های اخیر کاربر
- گزارش mismatch از کاربران
- سیگنال webhook

### Freshness Metadata

هر offer باید metadata مربوط به freshness داشته باشد:

```
observed_at
last_successful_fetch_at
last_failed_fetch_at
source = webhook | poll | plugin | manual
freshness_status = fresh | stale | unknown | seller_unreachable
```

این metadata می‌تواند رفتار صفحه محصول را کنترل کند:

- offer خیلی stale مخفی شود
- فروشنده stale پایین‌تر rank شود
- با کلیک کاربر refresh فوری trigger شود
- برای داده حساس، last checked نمایش داده شود
- برای feedهای مهم alert به تیم پشتیبانی یا فروشنده ارسال شود

## Search Indexing

جست‌وجو نباید مستقیم از روی database نرمال‌شده انجام شود.

search engine برای این موارد لازم است:

- full-text search
- typo tolerance
- filter
- sorting
- faceting
- price range query
- category navigation
- پاسخ سریع به کاربران

یک search document می‌تواند ترکیبی از اطلاعات canonical product و خلاصه offerها باشد:

```json
{
  "product_id": "p_123",
  "title": "Apple iPhone 15 Pro Max 256GB",
  "category": "mobile-phone",
  "brand": "Apple",
  "min_price": 71500000,
  "max_price": 74200000,
  "available_offer_count": 8,
  "updated_at": "2026-07-02T10:02:00Z"
}
```

تغییر offer باید event برای reindex ایجاد کند:

```
offer.updated -> reindex product summary
```

ممکن است search index کمی از source of truth عقب باشد. پس search indexing lag باید اندازه‌گیری شود.

## Ranking فروشنده‌ها و offerها

اگر فقط بر اساس کمترین قیمت sort کنیم، سیستم به راحتی قابل سوءاستفاده می‌شود.

ranking باید چند سیگنال را در نظر بگیرد:

- قیمت
- موجود بودن
- trust score فروشنده
- freshness
- سابقه price mismatch
- امکان ارسال
- گارانتی
- موقعیت کاربر
- قوانین تبلیغاتی یا تجاری در صورت وجود

یک مدل ساده scoring:

```
offer_score =
  price_score * 0.35
+ seller_trust_score * 0.25
+ freshness_score * 0.20
+ availability_score * 0.15
+ delivery_score * 0.05
```

وزن‌ها به business بستگی دارد. اصل معماری این است که ranking نباید فروشنده‌ای را که قیمت گمراه‌کننده منتشر می‌کند، پاداش دهد.

## استراتژی Cache

cache مفید است، اما در سیستم مقایسه قیمت می‌تواند خطرناک هم باشد.

گزینه‌های مناسب برای cache:

- canonical product pages
- short-lived search results
- seller config and health
- category and brand dictionaries
- hot offer summaries with short TTL

مواردی که باید با احتیاط cache شوند:

- price
- stock
- seller availability
- ranking dependent on freshness

فرق ترب با دیجی‌کالا اینجاست:

> در دیجی‌کالا، cache بیشتر از سیستم‌های داخلی محافظت می‌کند.
>
> در ترب، cache می‌تواند stale بودن داده بیرونی را پنهان یا حتی تشدید کند.

برای ترب، cache invalidation فقط مسئله performance نیست؛ مسئله trust است.

## مدیریت خطا

product ingestion همیشه با خطا همراه است. سیستم باید از ابتدا برای failure طراحی شود.

| خطا | مثال | پاسخ سیستم |
|---|---|---|
| سایت فروشنده down است | timeout یا HTTP 500 | retry با backoff، علامت seller_unreachable |
| محصول حذف شده | HTTP 404 | بعد از تایید، offer غیرفعال شود |
| bot بلاک شده | HTTP 403 | alert به support/فروشنده، بررسی firewall |
| parser خراب شده | HTML سایت تغییر کرده | انتقال به review queue مربوط به parser |
| token API نامعتبر است | plugin auth fail | pause کردن API polling و alert |
| webhook تکراری | یک event دوبار رسید | deduplication و idempotency |
| webhook گم شده | event نرسید | polling به عنوان safety net |
| search index lag دارد | offer آپدیت شده ولی search stale است | retry reindex و alert روی lag |

retry باید با exponential backoff و jitter باشد:

```
1 دقیقه -> 5 دقیقه -> 30 دقیقه -> کاهش priority و alert
```

jitter مهم است، چون اگر همه workerها هم‌زمان retry کنند، خود سیستم retry storm ایجاد می‌کند.

## مدل Consistency

ترب نمی‌تواند consistency کاملا real-time با همه فروشگاه‌ها تضمین کند. این ذات سیستم aggregator است.

مدل واقع‌بینانه این است:

> **eventual consistency with bounded freshness**

نمونه هدف‌های داخلی:

- 95% از offerهای مهم در کمتر از 15 دقیقه refresh شوند
- 99% از offerهای فعال در کمتر از 24 ساعت refresh شوند
- Webhook processing p95 زیر 30 ثانیه باشد
- Search index lag p95 زیر 2 دقیقه باشد

برای صفحه محصول، مدل ذهنی امن‌تر این است:

> ترب آخرین قیمت مشاهده‌شده را نشان می‌دهد.
> قیمت و موجودی نهایی در سایت فروشنده تایید می‌شود.

## Abuse و کیفیت داده

هر سیستم مقایسه قیمت در معرض manipulation فروشنده‌هاست.

نمونه abuse:

- قیمت پایین غیرواقعی برای گرفتن کلیک
- محصول ناموجود اما با وضعیت موجود
- تغییر قیمت بعد از کلیک
- عنوان گمراه‌کننده
- listing تکراری
- discount fake با old_price غیرواقعی
- mapping اشتباه به محصول پرطرفدار
- block کردن crawler بعد از index شدن
- نمایش قیمت متفاوت به crawler و کاربر

دفاع‌ها:

- ثبت گزارش price mismatch کاربران
- مقایسه قیمت landing page با قیمت index شده
- جریمه فروشنده‌هایی که mismatch زیاد دارند
- تشخیص الگوهای تخفیف مشکوک
- نیاز به product ID پایدار تا جای ممکن
- استفاده از trust score در ranking
- نگه داشتن تاریخچه تغییرات offer
- human review برای mergeهای حساس

## Observability

چنین سیستمی بدون observability قابل اداره نیست.

متریک‌های مهم:

- crawler success rate by seller
- fetch latency by seller
- HTTP status distribution
- parser success rate
- products discovered per day
- products updated per day
- webhook success/failure count
- queue lag
- search indexing lag
- price mismatch reports
- offer freshness percentiles
- match confidence distribution
- manual review backlog

داشبوردهای مهم:

- سلامت فروشنده‌ها
- backlog مربوط به crawler
- خطاهای parser
- freshness به تفکیک category
- lag مربوط به search index
- backlog مربوط به matching review
- گزارش‌های price mismatch

## Security

crawler و webhook/API سطح حمله مهمی ایجاد می‌کنند.

نیازهای امنیتی:

- احراز هویت API فروشنده
- validate کردن token یا signature برای webhook
- rate limit برای ingestion API
- sanitize کردن HTML فروشنده
- validate کردن image URL
- نگهداری امن secretها
- audit کردن تغییرات seller config
- محدود کردن دسترسی شبکه crawler

مهم‌ترین ریسک فنی **SSRF** است.

اگر فروشنده بتواند URLهایی را کنترل کند که backend ترب fetch می‌کند، crawler نباید بتواند به آدرس‌های داخلی دسترسی داشته باشد:

```
localhost
127.0.0.1
169.254.169.254
private network ranges
internal admin domains
```

crawler workerها بهتر است در محیط شبکه محدود اجرا شوند.

## Edge Caseهای مهم

این‌ها نمونه edge caseهایی هستند که سیستم را در production سخت می‌کنند.

### Seller Integration

- فروشنده domain را عوض می‌کند
- ساختار URL تغییر می‌کند
- فروشنده CMS را عوض می‌کند
- plugin غیرفعال می‌شود
- نسخه plugin قدیمی است
- firewall فروشنده IPهای crawler را block می‌کند
- API فروشنده داده stale برمی‌گرداند
- SSL certificate مشکل دارد
- سایت فقط از IP ایران باز می‌شود
- چند فروشگاه روی یک domain هستند

### Product Discovery

- sitemap شامل URL غیرمحصولی است
- sitemap خیلی بزرگ است
- sitemap محصول حذف‌شده دارد
- category pageها infinite pagination دارند
- یک محصول در چند category دیده می‌شود
- URL محصول به query parameter وابسته است
- canonical URL اشتباه یا خالی است

### Product Data

- قیمت وجود ندارد
- قیمت صفر است
- قیمت، مبلغ قسط است نه قیمت نهایی
- خطای تبدیل ریال و تومان
- قیمت تخفیفی از قیمت قبلی بیشتر است
- محصول موجود است ولی add-to-cart غیرفعال است
- عنوان محصول SEO spam دارد
- تصویر خراب یا hotlink-protected است

### Variants

- parent product قیمت ندارد
- قیمت variant بر اساس رنگ فرق می‌کند
- موجودی variant بر اساس سایز فرق می‌کند
- یک URL چند variant دارد
- هر variant URL جدا دارد
- فروشنده فقط default variant را expose می‌کند

### Matching

- ظرفیت متفاوت است
- گارانتی متفاوت است
- رجیسترشده و رجیسترنشده فرق دارند
- bundle با محصول تکی اشتباه گرفته می‌شود
- original و copy اشتباه merge می‌شوند
- refurbished و new اشتباه merge می‌شوند
- accessory با محصول اصلی merge می‌شود

### Freshness

- webhook می‌گوید محصول تغییر کرده ولی API هنوز داده قدیمی می‌دهد
- polling به cache stale فروشنده می‌خورد
- محصول flash sale خیلی سریع موجودی عوض می‌کند
- search index هنوز min_price قبلی را دارد
- کاربر وقتی refresh در حال انجام است کلیک می‌کند

### Abuse

- قیمت پایین fake
- redirect به محصول نامرتبط
- offerهای تکراری با قیمت پایین
- old_price fake برای نمایش تخفیف
- block کردن crawler بعد از index شدن
- قیمت متفاوت بر اساس user-agent

## انتخاب تکنولوژی

stack دقیق از boundaryهای معماری کم‌اهمیت‌تر است، اما یک پیاده‌سازی منطقی می‌تواند از این جنس ابزارها استفاده کند:

| نیاز | نوع تکنولوژی |
|---|---|
| Backend API | Go, Java, Python, Node.js |
| Queue/Event | Kafka, RabbitMQ, SQS, Redis Streams |
| Crawler Worker | autoscaled workers یا Kubernetes jobs |
| Raw Response Storage | object storage |
| Catalog DB | PostgreSQL/MySQL |
| Offer Store | relational DB، wide-column store یا event-sourced store |
| Search | Elasticsearch/OpenSearch |
| Cache | Redis |
| Analytics | ClickHouse/BigQuery-style warehouse |
| Observability | Prometheus, Grafana, OpenTelemetry |

## خلاصه برای توضیح در مصاحبه یا بحث فنی

اگر بخواهیم طراحی را در یک دقیقه توضیح دهیم:

> سیستم‌هایی شبیه ترب محصولات را از مسیرهای مختلف مثل crawler، feed، plugin، API، webhook و جریان دستی فروشنده وارد می‌کنند.
>
> مدل اصلی سیستم، جداسازی canonical product از seller offer است. ingestion به صورت event-driven انجام می‌شود: URL محصول کشف می‌شود، داده خام fetch می‌شود، فیلدها استخراج و normalize می‌شوند، محصول با catalog اصلی match می‌شود، offer فروشنده به‌روزرسانی می‌شود و search index آپدیت می‌شود.
>
> چون داده فروشنده‌ها همیشه قابل‌اعتماد و real-time نیست، سیستم به adaptive refresh، freshness metadata، retry، human review، seller trust score و abuse detection نیاز دارد. serving از روی search index و cache انجام می‌شود، در حالی که ingestion eventually consistent باقی می‌ماند.

## جمع‌بندی

مسئله ترب فقط scraping نیست. مسئله اصلی، کیفیت داده، matching، freshness و trust است.

مهم‌ترین تصمیم‌های طراحی:

- جدا کردن canonical product از seller offer
- استفاده از چند مسیر ingestion به جای تکیه کامل بر crawler
- جدی گرفتن product matching به عنوان سخت‌ترین بخش سیستم
- استفاده از adaptive freshness به جای refresh یکسان برای همه محصولات
- سرو کردن کاربر از search index و cache، نه از سایت فروشنده به صورت live
- ساختن human review، observability و abuse prevention از ابتدا

pipeline کلی سیستم را می‌توان این‌طور خلاصه کرد:

```
Discover -> Fetch -> Extract -> Normalize -> Match -> Review -> Index -> Serve -> Monitor
```

این همان طراحی سیستمی است که می‌تواند هزاران catalog نامنظم فروشنده را به یک تجربه قابل استفاده برای مقایسه محصول و قیمت تبدیل کند.
