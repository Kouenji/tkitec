# Admin dashboard implementation plan

Approved scope: admin-redesign-proposal.md. Execute inline in the existing working tree to preserve the user's uncommitted application changes.

## 1. Gallery compatibility
- [ ] Add failing integration tests using the real Express routes with isolated database/storage doubles, covering main-image reordering, retained image ownership, additions/removals, rollback, and legacy PATCH.
- [ ] Add server/product-gallery.js: parse ordered imageManifest entries `{url}` or `{upload: index}`, validate ownership/duplicates/count, upload new files through existing uploadImages, and transact product/image writes together.
- [ ] Add a conditional branch only to the existing PATCH route. Legacy requests remain on their current path. Cleanup removed blobs after commit; cleanup new blobs on failed writes.
- [ ] Verify public response image/main_image and gallery ordering through GET.

## 2. Admin interface
- [ ] Add failing browser tests for product-first navigation, search/pagination, creation image ordering, edit PATCH payload, removal, and mobile overflow.
- [ ] Replace docs/admin.html with semantic admin shell and templates; add docs/assets/css/admin.css and docs/assets/js/admin.js. Keep shared storefront files unchanged.
- [ ] Implement compact creation form, inventory grid, search/category filtering and pagination, separate orders section, edit and confirmation dialogs.
- [ ] Implement shared gallery editor: drop/browse, validate 10 images and 8 MiB, thumbnails, main selection, removal, object URL cleanup, preserved inputs on failures.
- [ ] Use authenticated XMLHttpRequest for multipart upload progress. Display Saving after transfer completion and disable duplicate submission until server response. Creation keeps images multipart field; edit adds optional imageManifest.

## 3. Verification
- [ ] Run existing npm run test:admin and new route/browser suites; inspect every failure before changing code.
- [ ] Verify create/edit/main thumbnail/removal end to end with isolated fixtures, no real inventory mutation.
- [ ] Capture desktop and mobile screenshots and inspect layout, focus, form labels, progress and error states.
- [ ] Review changed files for unrelated edits and run node syntax checks plus git diff --check.

Visual reference: generated dark cyan hardware dashboard, 320px creation column, flexible 2–4 column inventory. Implement 1-column mobile inventory with creation dialog. No decorative global search, notifications, or invented account controls. Preserve existing API paths and database schema.
