# GrowLand Responsive Audit & Mobile Fix

## Scope

This pass hardens the production frontend for phones, tablets and narrow desktop viewports while preserving the existing GrowLand visual language.

## Fixed

- Fixed the mobile/tablet hamburger menu being clipped by `overflow: hidden` and `contain: paint` on the fixed header.
- Moved the mobile navigation into a safe overlay layer with a controlled max height and internal scrolling.
- Added outside-click and `Escape` handling for the navigation menu.
- Added mobile navigation close behavior when a navigation item is selected.
- Added responsive body/document state for the open menu.
- Raised navigation stacking order so decorative sections cannot cover the menu.
- Added safe-area aware header spacing for modern mobile browsers.
- Added stronger touch targets for navigation and primary controls.
- Hardened dashboard/admin/auth/signup grids against min-content overflow.
- Collapsed multi-column layouts before they become cramped.
- Hardened admin/member lists, reports, modal actions and forms for narrow screens.
- Added narrow-phone breakpoints down to 320px-class viewports.
- Preserved reduced-motion and keyboard focus behavior.

## Important implementation note

The stylesheet has accumulated several historical responsive layers. The new hardening layer is intentionally placed at the end of `src/styles.css` so it wins in the cascade without requiring a risky rewrite of the existing production styles.
