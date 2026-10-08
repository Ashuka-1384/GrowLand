# GrowLand — MVP Growth & Talent Platform

GrowLand یک MVP برای تبدیل مسیر رشد فردی به **فعالیت → خروجی → Proof → XP → Level → Assessment → Job Ready** است.

این نسخه عمداً **Database رابطه‌ای ندارد**. در توسعه، داده در JSON محلی ذخیره می‌شود؛ در Production، یک JSON document رمزگذاری‌شده داخل **Private Vercel Blob** نگهداری می‌شود.


## رابط کاربری جدید GrowLand

نسخه‌ی Neo Glass با پالت هماهنگ با لوگوی گرولند، سطوح شیشه‌ای و تأکیدهای نئونی سبز طراحی شده است. در آخرین اصلاح صفحه‌ی اصلی، پیش‌نمایش گرافیکی داشبورد حذف و با خود لوگوی گرولند در یک قاب شیشه‌ای، هاله‌ی نور و حلقه‌های متحرک جایگزین شده است. فایل `src/responsive-polish.css` نیز به‌عنوان آخرین لایه‌ی CSS، ترتیب موبایل، فضای هدر و نوار پایین Hero و چیدمان پنل‌ها را برای عرض‌های کوچک‌تر اصلاح می‌کند. جزئیات تغییرات در `CHANGELOG-FIX.md` آمده است.

**نکته امنیتی:** فایل `.env` محرمانه داخل بسته‌ی قابل‌انتقال قرار نمی‌گیرد. برای توسعه‌ی محلی از `.env.example` یک کپی با نام `.env` بساز و برای استقرار، مقادیر محرمانه‌ی تازه را فقط در متغیرهای محیطی میزبان تنظیم کن.

## Stack

- React 19 + Vite 7
- React Router 7
- Node.js + Express 5
- Private Vercel Blob + AES-256-GCM برای storage در Production
- JWT داخل HttpOnly/Secure/SameSite cookie
- scrypt برای password hashing

## قبل از Deploy جدید

این نسخه برای یک **Fresh Deployment** آماده شده است. اگر می‌خواهی از صفر شروع کنی:

1. یک Private Vercel Blob Store بساز.
2. یک `BLOB_READ_WRITE_TOKEN` معتبر برای همان Store تنظیم کن.
3. یک `BLOB_DB_PATH` جدید و منحصربه‌فرد انتخاب کن؛ مثلاً:
   `growland/production-v1/db.json.enc`
4. `JWT_SECRET` و `BLOB_DATA_SECRET` را با دو مقدار کاملاً متفاوت و تصادفی بساز.
5. برای ساخت هر سه secret اصلی، راحت‌ترین روش:

```bash
node scripts/generate-secrets.mjs "YourStrongAdminPassword"
```

این دستور `JWT_SECRET`، `BLOB_DATA_SECRET` و `ADMIN_PASSWORD` hashشده تولید می‌کند. `BLOB_DB_PATH` را هم پیشنهاد می‌دهد.

اگر فقط hash رمز ادمین را می‌خواهی:

```bash
node scripts/hash-password.mjs "YourStrongAdminPassword"
```

6. مقادیر خروجی را در Vercel Environment Variables قرار بده.
7. قبل از Deploy می‌توانی با `npm run validate:env` تنظیمات را بررسی کنی.
8. پروژه را Deploy کن.

### نکته حیاتی درباره Storage

- **`JWT_SECRET` را عوض کردن** تمام sessionهای قبلی را نامعتبر می‌کند.
- **`BLOB_DATA_SECRET` را عوض کردن** بدون migration، داده Blob قبلی را غیرقابل‌خواندن می‌کند.
- **`BLOB_DB_PATH` را عوض کردن** عمداً یک namespace جدید می‌سازد و در اولین خواندن، دیتای seed موجود در `data/db.json` را bootstrap می‌کند.
- برای Fresh Deployment، استفاده از `BLOB_DB_PATH` جدید باعث می‌شود داده رمزگذاری‌شده نسخه‌های قبلی با نسخه جدید قاطی نشود.

## Environment Variables

نمونه کامل در `.env.example` قرار دارد:

- `NODE_ENV=production`
- `JWT_SECRET` — حداقل 32 کاراکتر تصادفی
- `ADMIN_PHONE`
- `ADMIN_PASSWORD` — در Production فقط scrypt hash
- `BLOB_READ_WRITE_TOKEN` — Private Blob Store
- `BLOB_DATA_SECRET` — کلید مستقل storage، حداقل 32 کاراکتر
- `BLOB_DB_PATH` — namespace نسخه‌دار storage
- `CLIENT_URL` — اختیاری برای same-origin؛ برای origin جداگانه دقیق تنظیم شود

## Deploy روی Vercel

### 1. Repository

Root Directory باید همان پوشه‌ای باشد که `package.json` و `vercel.json` در آن قرار دارند.

### 2. Build

```bash
npm run build
```

Vercel از `vercel.json` برای rewrite کردن `/api/*` به serverless API و باقی مسیرها به SPA استفاده می‌کند.

### 3. Blob

یک **Private Blob Store** به پروژه متصل کن و token آن را در `BLOB_READ_WRITE_TOKEN` قرار بده.

در اولین درخواست، اگر `BLOB_DB_PATH` وجود نداشته باشد، GrowLand از `data/db.json` به‌عنوان seed استفاده می‌کند و نسخه رمزگذاری‌شده را در Blob می‌نویسد. بنابراین Deploy تازه نباید با «database not found» روی 500 متوقف شود.

### 4. Health Check

بعد از Deploy این مسیر را باز کن:

```text
/api/health
```

در حالت سالم باید `ok: true` دریافت کنی.

اگر storage در دسترس نباشد، API به‌جای 500 مبهم، `503` با کد `STORAGE_UNAVAILABLE` برمی‌گرداند.

## Authentication

### Admin اصلی

ادمین اصلی از `ADMIN_PHONE` و `ADMIN_PASSWORD` خوانده می‌شود و در دیتابیس به‌عنوان member ذخیره نمی‌شود.

برای Production:

```bash
node scripts/hash-password.mjs "YourStrongAdminPassword"
```

خروجی را دقیقاً در `ADMIN_PASSWORD` قرار بده.

### Members

اعضا با شماره موبایل + password وارد می‌شوند. Password با `crypto.scryptSync` hash می‌شود و token در browser ذخیره نمی‌شود؛ session با HttpOnly cookie مدیریت می‌شود.

Member می‌تواند password خود را از API تغییر دهد؛ password خام هیچ‌وقت در response ذخیره/نمایش داده نمی‌شود.

## Security

- HttpOnly + Secure + SameSite=Lax session cookie
- JWT با issuer و audience مشخص
- Password hashing با scrypt
- Rate limiting سبک برای API و auth
- Origin validation + CORS credentials
- محدودیت body به 1MB
- Security headers پایه
- API responses با `Cache-Control: no-store`
- حذف اطلاعات خصوصی از public member profile
- جلوگیری از ثبت‌نام با شماره مدیر اصلی
- جلوگیری از تغییر مستقیم Level؛ Level از XP محاسبه می‌شود
- XP ledger و audit log
- Job readiness فقط از طریق assessment تغییر می‌کند
- Blob با AES-256-GCM و کلید مستقل از JWT رمزگذاری می‌شود

## Growth Domain

نسخه فعلی شامل این چرخه است:

```text
Member
  ↓
Activity
  ↓
Submission / Proof
  ↓
Admin Review
  ↓
XP + Skill XP
  ↓
Level
  ↓
Assessment
  ↓
Job Ready
```

Admin می‌تواند Activity بسازد، خروجی‌ها را بررسی کند و برای member ارزیابی شغلی ثبت کند.

## محدودیت معماری بدون Database

این تصمیم عمداً حفظ شده است، اما باید محدودیت آن روشن باشد:

- JSON document روی Blob برای MVP و ترافیک کم مناسب است.
- چند instance هم‌زمان که یک JSON بزرگ را read-modify-write می‌کنند، transaction واقعی یا row-level locking ندارند.
- صف نوشتن فقط داخل هر instance کار می‌کند و بین serverless instances قفل توزیع‌شده ایجاد نمی‌کند.
- برای ترافیک بالا، رقابت شدید روی داده یا analytics سنگین، repository باید بعداً به یک datastore تراکنشی مهاجرت کند.

این محدودیت به معنی «خرابی در Deploy» نیست؛ یک محدودیت مقیاس‌پذیری آگاهانه از معماری بدون Database است.

## Local Development

```bash
npm install
cp .env.example .env
```

برای اجرای local می‌توانی `NODE_ENV` را حذف کنی و `BLOB_READ_WRITE_TOKEN` را تنظیم نکنی؛ در این حالت `data/db.json` استفاده می‌شود.

```bash
npm run dev
```

Frontend: `http://localhost:5173`
API: `http://localhost:3001`

## Verification

در بررسی این نسخه:

- syntax تمام فایل‌های server/API بررسی شده است.
- JSX با parser رسمی TypeScript از نظر syntax بررسی شده است.
- JSON seed معتبر است.
- ZIP نهایی باید با `unzip -t` بررسی شود.

Build کامل Vite در محیط بررسی فعلی اجرا نشد، چون دریافت dependencyها از npm registry با timeout مواجه شد؛ بنابراین ادعای build موفق بدون اجرای واقعی `npm run build` ارائه نمی‌شود.


## Environment and secret safety

فایل `.env` واقعی عمداً در بسته قرار ندارد. برای توسعه‌ی محلی، `.env.example` را کپی کن و مقادیر لازم را با secretهای اختصاصی خودت جایگزین کن؛ در Vercel نیز secretها را فقط در بخش Environment Variables تنظیم کن. فایل `.env` و فایل‌های محیطی محلی در `.gitignore` قرار دارند و نباید وارد Git یا ZIP قابل اشتراک شوند.

برای محیط Production از رمز عبور مدیر پیش‌فرض یا secretهای نمونه استفاده نکن. رمز مدیر باید با `scripts/hash-password.mjs` به scrypt hash تبدیل شود و مقدار هش‌شده در `ADMIN_PASSWORD` قرار بگیرد. پس از تغییر secretها، وضعیت storage و مسیر `/api/health` را قبل از استفاده‌ی واقعی بررسی کن.
