# Shared TKITEC storefront design

**Goal:** Unify public catalog, search, product-detail and PC Builder pages with the approved homepage design.

**Architecture:** All public pages reuse homepage.css as the master design tokens and component styles. site-shell.js supplies one header and category-navigation template. store-pages.css contains shared branding and scoped differences for vertical catalog cards, details and Builder controls. Existing API, product renderer, galleries and ordering helpers remain in place.

## Completed implementation

- [x] Save the current public pages/scripts before editing; preserve unrelated uncommitted work.
- [x] Extract the homepage header into one shared template and add the TKITEC wordmark beside the original logo.
- [x] Reuse header, search, category navigation, fonts, palette and container widths on all public routes.
- [x] Add compact category descriptions, consistent filters and vertical 4/3/2/1 catalog grids.
- [x] Apply dark media areas, compact scrollable thumbnails, red selection borders and white prices to catalog/detail pages.
- [x] Style Builder selection controls, modal and summary without changing selection or order handlers.
- [x] Verify all six categories, search, product details, Builder and homepage at 1920, 1440, 820, 390 and 320px.

## Verification

The 13 storefront/image tests pass. Browser checks against a read-only snapshot of current live inventory confirm shared header/footer branding and background, no horizontal overflow, filtering, sorting, gallery selection, quantity-aware WhatsApp links, Builder component selection and totals, mobile menu/Escape and no JavaScript errors. No orders were sent. The homepage hero framing, dedicated category images and prebuilt rail were retained.

Admin, authentication, Express routes and database behavior are outside this visual refactor and were left unchanged.

Full regression suite: 32/34 pass. The same two pre-existing failures remain: admin upload compression expectation mismatch, and backend stale-gallery conflict response (200 instead of 409). A comparison with the saved homepage confirms its entire main markup is unchanged. Syntax and whitespace checks pass.
