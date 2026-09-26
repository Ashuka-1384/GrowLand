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
