# TKITEC storefront redesign implementation plan

**Goal:** Apply the approved dark gaming storefront direction to the current homepage.

**Architecture:** Retain Express, API models, routes, shared card rendering and gallery bindings. Scope presentation overrides to the homepage. Populate category imagery from existing API products.

**Tech stack:** Existing HTML, CSS, vanilla JavaScript, Express, Node tests and Playwright.

## Constraints

Preserve existing uncommitted edits, logo, inventory, photos, specifications, DZD prices, availability, WhatsApp configuration, search and PC Builder. No generated imagery or sample inventory added. No backend modifications.

## Tasks

- [x] Preserve affected files and run baseline storefront tests.
- [x] Update homepage markup: compact header, visual categories between hero and products, contact CTA.
- [x] Update home.js: prefer a real prebuilt hero product, populate categories with inventory photos, render responsive grids using existing cards and gallery handlers.
- [x] Adjust shared card presentation: show up to four existing specification lines before price and availability; preserve all ordering and gallery behavior.
- [x] Add homepage-scoped dark/red styles with 4/3/2/1 product columns, compact galleries, mobile header/search and menu.
- [x] Run existing tests and browser checks for responsive layout, galleries, search, ordering links and empty/sparse inventory.

## Verification

### Revised banner layout

- Replaced the split hero with a full-width setup-red background banner, left readability overlay and one red CTA. Promotional copy uses TKITEC's own wording.
- Added second-row category navigation and six image tiles, using existing local hardware photos as fallbacks where inventory lacks that category. Motherboards remain in the existing category menu and Components shortcuts.
- Broadened content to 1600px inside gutters; compact desktop image/details cards preserve shared gallery and ordering bindings.
- Read-only browser checks against live inventory at 1920, 1440, 1100, 820, 390 and 320px confirm 4/4/3/2/1/1 columns and no page overflow. At 1920x1080, the Featured section starts at y=727 and its first product row is visible. Mobile category navigation scrolls independently.
- All 13 existing storefront/image tests pass after the revision. No backend, product-page, builder or admin files were changed.

### Earlier baseline checks

- Storefront and image tests: 13/13 pass; JavaScript syntax checks pass.
- Browser against live inventory: 1440/1100/820/390/320 widths show 4/3/2/1/1 columns without horizontal overflow. Real inventory has 17 prebuilts and one GPU; the GPU card is centered.
- Gallery selection, WhatsApp number and order message, search navigation/results, menu and Escape, sticky header and empty inventory checks pass.
- Full existing suite: 32/34 pass. Untouched admin upload test expects compression settings different from the current admin script. Untouched backend stale gallery edit test expects HTTP 409 and receives 200; also failed before redesign.
- The existing global stylesheet is byte-for-byte identical to the saved pre-redesign version. Admin, server, product-detail, shop, configuration and builder files were not edited by this task.
