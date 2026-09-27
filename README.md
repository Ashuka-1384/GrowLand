# GrowLand 🌱

یک MVP کامل و mobile-friendly برای GrowLand با **Next.js + React + Node.js API Routes + JSON file storage**.

## امکانات

- Landing page با هویت بصری GrowLand و لوگوی ارائه‌شده
- معرفی حوزه‌های رشد
- Top Members
- اطلاعیه‌ها
- Ranking بر اساس Level و XP
- ثبت‌نام فارسی و راست‌چین با پیش‌فرض شماره‌های ایران (+98)
- ورود فقط با شماره تلفن؛ بدون SMS و بدون احراز هویت
- پنل رشد عضو:
  - Radar مهارت‌ها
  - XP هر مهارت
  - دسته‌بندی مهارت‌ها
  - نمودار رشد ۷ روز گذشته
  - Roadmap شخصی
  - وضعیت «آماده برای کار»
  - ارسال گزارش به ادمین
- پنل واحد Admin برای تمام ادمین‌ها:
  - مشاهده اعضا
  - مشاهده گزارش‌ها
  - اضافه/کم کردن XP
  - تنظیم Level
  - افزودن/حذف مهارت
  - تنظیم Roadmap
  - تغییر وضعیت آماده کار
  - فعال/غیرفعال کردن عضو
- ادمین اصلی: `+989333167279`
- ادمین اصلی می‌تواند سایر اعضا را Admin کند یا عزل کند.
- ذخیره اطلاعات در `data/store.json` و بدون دیتابیس SQL/NoSQL.

## اجرا

```bash
npm install
npm run dev
```

سپس:

```text
http://localhost:3000
```

برای Build:

```bash
npm run build
npm start
```

## ورود ادمین اصلی

شماره:

```text
+989333167279
```

در نسخه فعلی، ادمین اصلی به‌صورت Seed شده در `data/store.json` قرار دارد تا بلافاصله بعد از اجرا بتواند وارد پنل شود. این حساب از لیست عمومی اعضا و Ranking مخفی است.

## مدل ذخیره‌سازی

این پروژه دو حالت دارد:

- توسعه محلی: `data/store.json`
- Vercel Production: یک فایل JSON در **Vercel Blob** با دسترسی Private

در Vercel، فایل‌سیستم Function قابل اتکا برای ذخیره دائمی نیست؛ بنابراین اطلاعات ثبت‌نام، XP، گزارش‌ها و تغییرات ادمین در Blob نگهداری می‌شوند. این دقیقاً برای این پروژه مناسب‌تر از نوشتن روی filesystem محلی است.

برای فعال‌شدن Storage در Vercel، یک Blob Store به پروژه وصل کنید. Vercel در صورت اتصال Store متغیر `BLOB_READ_WRITE_TOKEN` را به پروژه اضافه می‌کند.

## امنیت

چون ورود طبق نیاز پروژه فقط با شماره انجام می‌شود و SMS/پسورد وجود ندارد، هر فردی که شماره یک عضو را بداند می‌تواند به حساب او وارد شود. این رفتار عمداً مطابق مشخصات فعلی GrowLand پیاده شده است.

برای محیط واقعی پیشنهاد می‌شود حداقل یک عامل دوم (رمز، magic link، OTP یا SSO) اضافه شود.

## ساختار مهم پروژه

```text
app/
  page.tsx                 # Landing
  signup/                  # Registration
  login/                   # Login
  members/                 # All members + public profile
  ranking/                 # Ranking
  dashboard/               # Member growth dashboard
  admin/                   # Shared admin panel
  api/                     # Node/Next API routes
components/
  Nav.tsx
  Charts.tsx
data/
  store.json               # JSON storage
lib/
  auth.ts
  store.ts
  types.ts
  utils.ts
public/
  logo.jpg
  wireframe.png
```

## Vercel production notes

- Next.js is pinned to `14.2.35`, which is the patched 14.x release identified by the official Next.js December 11, 2025 security update.
- Vercel production storage uses Vercel Blob; local JSON remains the development seed.
- `SESSION_SECRET` and `BLOB_READ_WRITE_TOKEN` must exist in Production.
- The current `globals.css` contains no `justify-content: end`, `align-items: end`, or `align-self: end` declaration.
- Public member responses omit phone numbers and private self-description fields.
- Stateful mutation APIs use a store-update path designed to avoid silently overwriting concurrent Blob updates.

### Build preflight

```bash
npm install
npm run typecheck
npm run build
```

