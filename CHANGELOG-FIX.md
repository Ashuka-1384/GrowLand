# GrowLand – Fix Pass

## Scope
این نسخه عمداً از Database جدید استفاده نمی‌کند و JSON/Blob Storage فعلی پروژه را حفظ می‌کند.

## اصلاحات مهم
- رفع مسیر مشکل‌ساز `api/member/profile` برای `admin-root`؛ مدیر اصلی دیگر درخواست ویرایش پروفایل عضو ارسال نمی‌کند و API نیز این مسیر را صریحاً رد می‌کند.
- پایدارسازی Hookهای React و نگه‌داشتن همه Hookها قبل از Conditional Return برای جلوگیری از React error #310.
- اضافه شدن Error Boundary برای جلوگیری از Crash کامل UI در خطاهای Render.
- کنترل درخواست‌های هم‌زمان برای ثبت‌نام، ورود، ذخیره پروفایل، تغییر ready و ارسال گزارش.
- اضافه شدن timeout برای fetch و پاک‌سازی توکن در 401.
- کاهش درخواست تکراری `/api/public/members` با in-flight request cache.
- سخت‌گیری بیشتر روی JWT در production و اضافه شدن issuer/audience.
- محدودسازی CORS بر اساس `CLIENT_URL` در production.
- Rate limiting سبک بدون افزودن dependency جدید.
- اعتبارسنجی بیشتر شماره تلفن، نام، سن و متن گزارش.
- اصلاح پاسخ public members تا اطلاعات خصوصی عضو مثل شماره تلفن، درباره من، هدف و سایر داده‌های شخصی عمومی نشوند.
- جلوگیری از 500 در `member/ready` برای عضو ناموجود.
- بهبود JSON storage با cache کوتاه‌مدت، صف نوشتن، و نوشتن اتمیک در فایل محلی.
- جلوگیری از raceهای ساده هنگام کلیک‌های چندباره.
- اصلاح dependencyهای Hookهای مهم با `useCallback`.

## Verification
- `server/index.js` با `node --check` بررسی شد.
- `server/store.js` با `node --check` بررسی شد.
- نصب dependency و build کامل در محیط بررسی به دلیل عدم دسترسی/timeout رجیستری npm قابل اجرا نبود؛ بنابراین این مورد در گزارش نهایی صریحاً ذکر می‌شود و ادعای build موفق ارائه نمی‌شود.

## Fix Pass 3 – Authentication / CORS
- اصلاح CORS برای استقرارهای same-origin مانند Vercel؛ Origin فعلی دامنه API با Host/X-Forwarded-Host تطبیق داده می‌شود.
- `CLIENT_URL` به‌صورت نرمال‌شده و با پشتیبانی از چند دامنه بررسی می‌شود.
- پس از عبور از بررسی Origin، هدرهای CORS به‌درستی برای مرورگر منعکس می‌شوند.
- توکن منقضی یا ساخته‌شده با Secret قبلی در `/api/auth/me` با وضعیت 401 پاک می‌شود و UI به صفحه ورود برمی‌گردد.
- `VITE_API_URL` در فرانت به‌صورت ایمن از `/` انتهایی پاک‌سازی می‌شود تا URLهای API دو `/` نداشته باشند.

## Verification – Pass 3
- `node --check server/index.js`: OK
- `node --check server/store.js`: OK
- Frontend JSX parsing: verified in previous pass.
- Runtime integration test in this environment could not be executed because `node_modules` is not installed in the provided archive and package installation was unavailable in the execution environment.


## 2026-09-28 — hardening and growth-domain revision

### Authentication
- Removed browser `localStorage` token storage.
- Added HttpOnly/Secure/SameSite session cookie.
- Added password hashing with Node `scryptSync`.
- Added explicit logout endpoint.
- Admin authentication now requires the configured admin password; production requires a hashed admin password.
- Kept legacy password migration only for non-production when `ALLOW_LEGACY_LOGIN=true`.

### Data integrity
- Level is derived from XP; direct admin level mutation is ignored.
- Added XP transaction ledger and audit log.
- Member job readiness is now assessment-derived and read-only.
- Member-submitted skill XP/level cannot be used to self-award progression.

### Growth domain
- Added Activities, Submissions/Proof, Assessments, Jobs and audit-log collections to the storage model.
- Added member activity submission endpoint.
- Added admin activity creation and submission review endpoints.
- Added assessment endpoint that updates job-readiness state.

### Storage
- Blob encryption now requires a dedicated `BLOB_DATA_SECRET` in production and no longer falls back to `JWT_SECRET`.
- Reads from configured Blob storage fail closed instead of silently falling back to local serverless disk.
- Repository API remains storage-agnostic so a transactional database can replace JSON/Blob later.

### Verification
- `node --check` passes for `server/index.js`, `server/store.js`, and `api/index.js`.
- Full `npm install` / Vite build could not be completed in the execution environment because package installation timed out; no claim of a successful production bundle is made without those dependencies.
