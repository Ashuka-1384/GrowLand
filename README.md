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

تمام داده‌ها در:

```text
data/store.json
```

قرار دارند. این فایل شامل members، reports و announcements است.

### نکته مهم برای Vercel

Vercel در محیط Serverless فایل‌سیستم محلی را برای ذخیره دائمی داده تضمین نمی‌کند؛ بنابراین **JSON file storage برای توسعه، دمو، یا سروری با دیسک پایدار مناسب است، اما برای Production واقعی روی Vercel باید همین ساختار Storage با یک JSON object پایدار مثل Vercel Blob/S3 یا یک سرویس فایل پایدار جایگزین شود.** این پروژه عمداً مطابق درخواست شما هیچ Databaseای ندارد و adapter فعلی مستقیماً `data/store.json` را می‌خواند/می‌نویسد.

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


## Vercel build hardening

This revision fixes the CSS Autoprefixer warning in `app/globals.css`, adds and safely handles the `hiddenFromPublic` field in the member model, hardens session-token verification, and marks JSON-backed pages as dynamic so they are not incorrectly frozen at build time.

### TypeScript compatibility guard

Public member filtering goes through `isPublicMember()` rather than accessing `hiddenFromPublic` directly from every route/page. This keeps the build compatible with older member records/type snapshots while preserving the hidden-member behavior when the field exists.

### Important storage note

`data/store.json` is a local JSON store. It is suitable for local development, but Vercel's serverless runtime does not provide durable application storage through the deployed filesystem. A production deployment that must retain registrations, XP, reports, and admin changes needs persistent object storage or a database. This package deliberately keeps the JSON storage contract so the application remains easy to migrate to persistent JSON storage without changing the UI/API contract.


### Build preflight

Before deploying, run:

```bash
npm install
npm run typecheck
npm run build
```

This revision pins Next.js to `14.2.35`, includes optional `hiddenFromPublic` support in the member model, fixes UUID session verification, and removes the CSS logical `end` warning from the deployed source. The current CSS no longer contains a `justify-content: end` / `align-items: end` declaration.
