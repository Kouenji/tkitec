# Website check — 2026-09-27

## Admin upload fix

The admin page submitted products without an authorization header. The server returned 401, but the page reset the form and refreshed the dashboard anyway. The dashboard also omitted authorization on order reads and deletions, and rejected configured tokens through a hardcoded browser-side comparison.

Fixed in `docs/admin.html`: send the stored token, check response status, display errors, retain the form and image selection after failure, prevent duplicate submissions while publishing, and reset only after success. Dashboard refresh failures are now displayed instead of causing an unhandled exception. The backend now reports missing upload configuration before contacting storage.

Run `npm run test:admin` (requires installed Google Chrome, or an installed Playwright browser selected with `TEST_BROWSER_CHANNEL`). Eight browser/API regression tests pass. Storage/database writes are intercepted in successful upload tests; no real products or orders were created or deleted.

## Required local configuration

- `BLOB_READ_WRITE_TOKEN` is absent from the local environment files. Add the token for the intended Vercel Blob store to the server environment and restart the server; deployed instances need their own environment configuration and redeployment.
- Neon connectivity and existence of `products`, `product_images`, and `orders` were verified with a read-only query outside the network-restricted sandbox. The initial sandbox-only product request returned 503 due to network restrictions, not proven database failure.
- Local admin username/password/token settings are absent, so the backend uses its built-in defaults. Default login was confirmed to succeed. Configure unique credentials and a secret token before exposing the admin API.

## Other findings still open

| Priority | Finding | Evidence / impact |
| --- | --- | --- |
| High | Checkout trusts browser-supplied totals and item descriptions | `server.js`, POST `/api/orders`, inserts `order.total` and `order.items` without looking up product prices or checking stock. Orders need server-side pricing and inventory validation. |
| High | Customer-controlled values enter admin HTML without escaping | Order creation accepts customer fields, while `docs/admin.html` interpolates them into `innerHTML`. This creates a stored script-injection path; production exploitation was not attempted. |
| High | Known dependency advisories | `npm audit` reports 5 affected packages: 3 high, 1 moderate, 1 low. Packages: multer, nodemailer, path-to-regexp, qs, body-parser. Applicability of each advisory needs review; no automatic major upgrades were applied. |
| Medium | Product quantity and stock are not enforced | Browser testing with an out-of-stock product allowed adding it; entering -2 reduced an existing cart quantity from 3 to 1. `docs/product.html` does not validate the parsed quantity or check stock. |
| Medium | Database failure leaves broken storefront states | With a simulated 503, shop loading stays visible and the builder throws `allProducts.filter is not a function` when choosing a component. Pages need response checks and visible retry/error states. |
| Medium | Admin layout overflows on mobile | At 390px viewport width, the admin document measured 995px wide. Admin and login also lack viewport metadata. |
| Medium | Image replacement is not atomic | `server.js` deletes existing image rows/blobs before completing replacement inserts. A storage/database failure can leave missing images or orphaned uploads. |
| Medium | Custom PC selections are lost at checkout | Builder stores component specifications on the cart item, but checkout sends only the name and quantity summary; the order has no selected-component breakdown. |
| Low | Homepage cart badge stays at zero on reload | Browser test with three saved items displayed 0. Shared script places badge initialization in a nested DOMContentLoaded listener registered after the event has begun. |
| Low | Latest hardware ordering is reversed | API returns newest-first; homepage uses `slice(-8).reverse()`, selecting the oldest eight when more than eight products exist. |
| Low | Admin order columns do not match headings | Email has a heading but no corresponding rendered cell, shifting subsequent columns. |
| Incomplete feature | Admin editing/stock controls and product gallery are absent | Backend supports PATCH, stock and multiple images, but the inspected admin/product pages do not expose these capabilities. Earlier task notes claiming completion do not match current code. |

## Coverage and limits

All seven HTML routes returned 200. Backend, shared scripts and inline JavaScript parsed successfully. Browser smoke checks covered desktop/mobile pages, cart behavior, admin refresh and upload, and simulated database failures. External font/icon requests were blocked during deterministic browser tests, and catalog fixtures were used to avoid changing real inventory. A real Blob upload and the deployed website have not been verified. Existing unrelated workspace changes were preserved.
