# Premium Workbench Storefront Implementation Plan

> **For agentic workers:** Execute inline in the current workspace. Preserve pre-existing user edits and do not commit.

**Goal:** Redesign the storefront as a premium, mobile-first PC hardware shop with direct WhatsApp ordering and no cart or checkout flow.

**Architecture:** Keep product fetching on the existing `/api/products` endpoint and render its current product shape. Add one shared frontend configuration/helper for WhatsApp URLs and one shared product-card renderer, then connect the homepage, catalog, detail page, and PC builder to those helpers. Remove cart and order-submission logic only from frontend files.

**Tech Stack:** Static HTML, CSS, browser JavaScript, Node's built-in test runner, Playwright.

## Global Constraints

- Preserve Neon, Vercel Blob URLs, the product schema, and all existing APIs.
- Do not edit backend or database files.
- Use WhatsApp number `213540993181` from one frontend configuration value.
- Do not invent offers or discount information.
- Keep existing uncommitted changes; do not commit.

---

### Task 1: Shared Ordering Helpers

**Files:**
- Create: `docs/assets/js/store-config.js`
- Create: `tests/storefront.test.js`

**Interface:** `window.TKI_STORE_CONFIG.whatsappNumber`; `window.createWhatsAppOrderUrl(message)`; `window.createProductOrderMessage(product, quantity)`; `window.createBuildOrderMessage(build)`.

- [ ] Write tests that load the shared script in a VM, assert the configured number, and verify URL encoding for product name and formatted DZD price.
- [ ] Run `node --test tests/storefront.test.js` and confirm the missing helper fails by assertion.
- [ ] Implement message builders and the WhatsApp URL helper in the shared config script.
- [ ] Rerun `node --test tests/storefront.test.js` and confirm it passes.

### Task 2: Homepage and Catalog

**Files:**
- Create: `docs/assets/js/storefront.js`
- Modify: `docs/index.html`
- Modify: `docs/shop.html`
- Modify: `docs/assets/css/style.css`

**Interface:** `window.TkiStorefront.renderProductCard(product, options)` returns a complete safe card using existing `image`, `images`, `name`, `price`, `stock`, `category`, and `specs` fields.

- [ ] Implement escaped product rendering, category labels, responsive image thumbnails, stock labels, and product-order links using Task 1 helpers.
- [ ] Replace the homepage's generic sections with a real-product hero, the six requested category links, featured items, and latest items fetched from `/api/products`.
- [ ] Add catalog search, category filtering, price sorting, 4/2/1-column breakpoints, and the shared cards without changing the API request.
- [ ] Style the shared storefront in the dark workbench direction and verify the card renderer with the Node test suite.

### Task 3: Product Details and Builder Orders

**Files:**
- Modify: `docs/product.html`
- Modify: `docs/build.html`
- Modify: `docs/assets/js/builder.js`
- Modify: `docs/assets/css/style.css`

- [ ] Render the existing product `images` array as a large main image with selectable thumbnails and preserve full specifications.
- [ ] Replace product purchase actions with a WhatsApp link containing the selected product name, quantity, and price; add a mobile sticky order bar.
- [ ] Keep PC component selection but replace both builder purchase actions with one WhatsApp order containing chosen components and total.
- [ ] Verify product and build message payloads with the focused Node tests.

### Task 4: Remove Cart and Verify

**Files:**
- Modify: `docs/assets/js/script.js`
- Delete: `docs/cart.html`
- Modify as needed: `docs/index.html`, `docs/shop.html`, `docs/product.html`, `docs/build.html`

- [ ] Remove cart navigation, badge CSS/logic, local-storage cart mutations, checkout modal/order submission, and obsolete query-trigger handling.
- [ ] Search `docs/` application files for remaining cart, checkout, and Add to Cart references; retain no dead cart links.
- [ ] Run `node --test tests/*.test.js` and `npm run test:admin`.
- [ ] Use Playwright with `/api/products` intercepted to verify rendered products and image switching, order URLs/messages, category/search/sort behavior, and desktop/tablet/mobile layout without horizontal overflow.
- [ ] Confirm product image requests use the original API URLs and report any environment-dependent checks that could not run.