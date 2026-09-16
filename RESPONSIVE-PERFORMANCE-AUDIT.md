# GrowLand — Mobile & Performance Audit

## Fixed: mobile member-profile close button

The profile modal close control is now explicitly placed above all modal content with a dedicated stacking level (`z-index: 30`) and mobile-friendly touch behavior. This prevents the header/content layers inside the modal from intercepting taps on the close button.

Mobile modal behavior was also hardened with:
- `100dvh`-based height calculation
- safe-area aware padding
- contained overscroll
- a larger 44px close-button hit area
- disabled desktop-grade backdrop blur on small screens

## Performance optimizations

- Profile images use `loading="lazy"` and `decoding="async"`.
- Expensive decorative background animations are disabled on small screens.
- Mobile/touch devices no longer run decorative card scan/shine/orbit animations.
- Mobile hover transforms are neutralized where hover is not meaningful.
- Decorative page noise is removed on small screens.
- Mobile modal backdrop blur is removed to reduce GPU/compositing cost.

## Validation

Data and article validators pass:
- 16 users, version 2
- 1 article metadata entry and 1 published article

A production Vite build could not be completed in the provided execution environment because npm dependency installation did not finish within the available runtime. No dependency versions or application architecture were changed.
