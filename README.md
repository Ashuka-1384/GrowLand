# GrowLand — React + Node.js + JSON/Vercel Blob

نسخه MVP یکپارچه GrowLand بدون دیتابیس رابطه‌ای.

## Stack
- React 19 + Vite
- React Router
- Node.js + Express 5
- JSON storage در توسعه
- Vercel Blob در Production در صورت تنظیم `BLOB_READ_WRITE_TOKEN`
- JWT برای session؛ بدون SMS و احراز هویت تلفنی
- Responsive / mobile-first UI

## اجرا در لوکال
```bash
npm install
cp .env.example .env
npm run dev
```

Frontend: `http://localhost:5173`
API: `http://localhost:3001`

## ورود ادمین اصلی
شماره اولیه: `+989333167279`
این شماره از `ADMIN_PHONE` خوانده می‌شود و بهتر است در Vercel Environment Variables تنظیم شود.

## Deploy روی Vercel
1. پروژه را به GitHub وصل یا با Vercel CLI deploy کنید.
2. Environment Variables:
   - `JWT_SECRET`
   - `ADMIN_PHONE`
   - `BLOB_READ_WRITE_TOKEN`
   - `BLOB_DATA_SECRET`
3. Build command: `npm run build`
4. `vercel.json` مسیرهای `/api/*` را به Express serverless و باقی مسیرها را به Vite SPA می‌فرستد.

### درباره ذخیره‌سازی
اگر `BLOB_READ_WRITE_TOKEN` وجود داشته باشد، فایل منطقی `growland/db.json` داخل Vercel Blob نگهداری می‌شود و محتوای آن قبل از ذخیره با AES-256-GCM رمزنگاری می‌شود؛ کلید در Environment Variable باقی می‌ماند. اگر توکن وجود نداشته باشد، در توسعه از `data/db.json` استفاده می‌شود.

> نکته امنیتی: چون مدل ورود طبق درخواست پروژه فقط بر اساس شماره تلفن است و SMS/رمز عبور ندارد، این روش برای محیط واقعی احراز هویت قوی محسوب نمی‌شود. برای MVP پیاده‌سازی شده و بعداً می‌توان OTP یا رمز عبور را بدون تغییر معماری داده اضافه کرد.

## مدل داده
`members`, `reports`, `announcements`, و `site` در یک JSON document قرار دارند. XP و Level به‌صورت مدیریتی قابل ویرایش هستند؛ Level پیش‌فرض از XP با قانون هر 1000 XP محاسبه می‌شود.


## Vercel Root Directory
If deploying this repository, set Root Directory to the folder containing package.json and vercel.json. If the project is uploaded as the repository root, leave Root Directory empty.
