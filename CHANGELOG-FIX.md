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
