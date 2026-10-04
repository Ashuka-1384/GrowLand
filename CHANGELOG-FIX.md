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

## 2026-09-28 — Fresh Deployment / Architecture Hardening Pass

### Storage reliability
- Blob pathname نسخه‌دار شد و از `BLOB_DB_PATH` پشتیبانی می‌کند؛ default جدید `growland/v7/db.json.enc` است تا با payloadهای نسخه‌های قبلی تداخل نکند.
- اولین read روی pathname جدید، در صورت نبودن Blob، از `data/db.json` bootstrap می‌کند و نسخه رمزگذاری‌شده را می‌نویسد.
- plaintext fallback حذف شد؛ Blob production فقط payload رمزگذاری‌شده با AES-256-GCM را می‌پذیرد.
- خطای authentication/decryption کلید Blob به‌صورت شفاف به `STORAGE_UNAVAILABLE`/503 تبدیل می‌شود و دیگر به‌عنوان 500 مبهم گزارش نمی‌شود.
- `BLOB_DATA_SECRET` در صورت فعال بودن Blob حداقل 32 کاراکتر لازم دارد.
- `JWT_SECRET` در production حداقل 32 کاراکتر لازم دارد.
- Production دیگر اجازه استفاده از local filesystem به‌عنوان storage را نمی‌دهد.
- `Cache-Control: no-store` برای API فعال شد.

### Authentication
- Production admin password باید ساختار scrypt hash معتبر داشته باشد.
- مسیر legacy password migration حذف شد تا Deploy جدید فقط با passwordهای صریح و hashشده کار کند.
- شماره مدیر اصلی از ثبت‌نام memberها مستثنی شد.
- endpoint تغییر password برای memberها اضافه شد.
- session پس از تغییر password پاک می‌شود تا ورود مجدد اجباری باشد.

### Growth integrity
- تأیید Activity علاوه بر XP کلی، XP مهارت مرتبط را نیز ثبت می‌کند.
- skill level از skill XP محاسبه می‌شود و سقف 5 دارد.
- Admin UI مدیریت Activity و بررسی Proof/Submission را دریافت کرد.
- Admin UI ثبت Job Assessment را دریافت کرد.
- کنترل مستقیم Level در UI حذف شد؛ Level همچنان derived از XP است.

### UX / failure handling
- Dashboard member در خطای API دیگر روی loading بی‌نهایت نمی‌ماند و دکمه retry دارد.
- Admin panel نیز loading/error/retry را به‌صورت مشخص مدیریت می‌کند.
- خطاهای public members/announcements دیگر silently به empty state تبدیل نمی‌شوند.
- لینک placeholder خارجی `example.com` حذف شد.

### Dependency hygiene
- نسخه dependencyهای package.json از range به exact version pin شد تا installهای آینده dependency ناخواسته جدید نکشند.

### Deployment limitation
- اجرای کامل `npm install` در محیط بررسی به علت timeout رجیستری npm موفق نشد؛ در نتیجه Vite production build به‌صورت واقعی در این محیط verify نشده است.


## 2026-10-04 — requested admin/deployment fixes

- Added a real `.env` deployment configuration with persistent generated JWT/Blob secrets, configured admin phone, admin password hash, admin name and Blob namespace.
- Added `ADMIN_NAME` support; the root admin name is persisted in the storage document and can be edited from the admin dashboard.
- Added `PATCH /api/admin/profile` for root-admin profile name changes.
- Added `DELETE /api/admin/reports/:id` and a delete action in the admin reports UI.
- Existing root-admin-only admin promotion/demotion controls were retained and hardened.


## 2026-10-04 — mobile responsiveness and animated logo hero

- Replaced the homepage mock dashboard UI with the original GrowLand logo only, presented inside an animated neon-glass frame.
- Added rotating orbit rings, pulsing glow and gentle floating motion; respects `prefers-reduced-motion`.
- Reworked mobile hero ordering so the logo is visible above the copy, with stack-first CTAs, improved text sizing and a normal-flow trust strip that no longer overlaps the heading.
- Fixed mobile navigation grid placement so the logo, membership/profile action and menu use separate columns.
- Added `src/responsive-polish.css` to normalize overflow, min-width constraints and narrow-screen layouts across member and admin panels.
- JSX syntax and all six CSS layers passed parser checks. `npm install` again timed out, so a full Vite build and integrated browser test are not confirmed in this environment.

## 2026-10-04 — Navbar responsiveness and readability refinement

- Reworked the final navigation layer with a three-zone desktop grid and a stable two-zone tablet/mobile grid, removing the implicit third-column behavior that could produce crowding.
- Switched tablet layouts at 1024px and below to a compact, scrollable glass dropdown with a clear open state and adequate tap targets.
- Added viewport-aware handling for 760px, 390px, and 340px widths, plus safe-area insets for mobile devices.
- Improved contrast and legibility for navigation links, profile labels, branding microcopy, and dropdown items.
- Preserved the original GrowLand logo with `object-fit: contain` and removed the redundant second membership CTA from the menu; the dedicated membership CTA remains in the header.
- No changes to API routes, authentication logic, or business data.
- CSS parse validation and Node syntax checks passed. A full Vite build was not run because dependencies are not installed in this environment and offline npm installation could not find the required package cache.


## 2026-10-04 — Navbar responsiveness and readability refinement

- Reworked the final navigation layer with a three-zone desktop grid and a stable two-zone tablet/mobile grid, removing the implicit third-column behavior that could produce crowding.
- Switched tablet layouts at 1024px and below to a compact, scrollable glass dropdown with a clear open state and adequate tap targets.
- Added viewport-aware handling for 760px, 390px, and 340px widths, plus safe-area insets for mobile devices.
- Improved contrast and legibility for navigation links, profile labels, branding microcopy, and dropdown items.
- Preserved the original GrowLand logo with `object-fit: contain` and removed the redundant second membership CTA from the menu; the dedicated membership CTA remains in the header.
- No changes to API routes, authentication logic, or business data.
- CSS parse validation and Node syntax checks passed. A full Vite build was not run because dependencies are not installed in this environment and offline npm installation could not find the required package cache.

## 2026-10-05 — final production polish
- Reworked the registration/onboarding page into a responsive card-based layout with clear hierarchy and mobile-safe single-column fields.
- Constrained the top navigation logo/wordmark so it cannot overflow the glass navigation container.
- Kept `/api/auth/me` explicitly anonymous-safe (`200 { user: null }`) so a logged-out session is not treated as an authentication error.

## 2026-10-05 — Build hotfix

- Fixed a malformed JSX fragment in `src/main.jsx` inside the admin Reports component.
- The component was missing its closing `</>` fragment and contained the fragment terminator in the wrong position, which caused Vite/esbuild to report `Unterminated regular expression` at build time.
- Validated `src/main.jsx` with the TypeScript JSX parser and validated the Node server/API files with `node --check`.
