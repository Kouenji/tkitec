# Admin redesign proposal

## Scope

Redesign admin.html and its dedicated CSS/JavaScript. Preserve the working Express, Neon, and Vercel Blob integration, existing route URLs, authorization headers, database tables, and public product response fields. No changes to checkout or storefront styling.

## Recommended layout

Product management opens by default. A compact top bar contains Tki Tec branding, Products and Orders navigation, and a View store link. Orders and revenue summaries live in the Orders section rather than above inventory.

On desktop, a roughly 320px creation panel sits on the left. The remaining width holds inventory controls and a responsive product grid, with two to four columns depending on available width. Search, category filtering, and pagination keep large inventories manageable. On mobile, inventory is first and Add product opens the creation form in a dialog; this avoids making users scroll past a form to reach their products.

Alternatives considered: a dense table fits more text but gives images less prominence; a separate creation page increases navigation. The split-panel grid best matches the requested workflow.

## Visual direction

Dark hardware-store workspace: ink background #0B1018, slate surfaces #141D29, borders #293647, cyan accent #21C4E6, primary text #F2F6FA, muted text #A4B1C2. Restrained cyan highlights identify active navigation, primary actions, and the selected main image. Compact typography, visible field labels, tabular prices, 8–12px radii, and consistent spacing replace oversized statistics and empty panels. Use a system sans-serif stack for reliable loading and a condensed heading treatment where locally available.

Product cards show a contained image, name, DZD price, category, short description, featured badge, and labeled Edit/Delete controls. Cards do not nest inside additional decorative panels. Loading, empty, filtered-empty, success, and failure states have explicit messages and useful actions.

## Create and edit behavior

- Compact labeled fields: name, price, category, description, stock, featured status. Preserve stock when editing; display its existing database value.
- Image selection supports browsing and dropping files, validates the existing limit of 10 images and 8 MiB per image, and provides thumbnails with remove controls.
- Clicking a thumbnail selects the main image. Its selected state has a cyan outline and a textual Main image indicator, with keyboard and screen-reader support.
- Creation sends the selected main file first, using the current multipart images field and existing POST endpoint. Other files remain gallery images.
- Edit opens an accessible dialog populated with the selected product. Saving uses PATCH /api/products/:id, never POST. Closing a dirty editor asks before discarding changes.
- Existing images can be retained, removed, or selected as main; new files can be added. Require at least one final image.
- Upload progress uses XMLHttpRequest upload events. After browser transfer reaches 100%, show Saving product until the server confirms persistence; do not imply Blob/database completion before the response.
- Disable duplicate submission while saving. On failure, retain entered values and image selections and show the error. On success, update inventory without reloading the page and reset/close the relevant form.
- Delete requires confirmation and updates inventory only after the server confirms success.

## Minimal API compatibility extension

Keep all existing endpoint URLs, multipart file fields, authentication, Blob operations, and database columns. Extend only the existing product update flow with optional ordered image references, identifying retained URLs belonging to that product and new uploads by their submitted file index. The first final image becomes main. Validate references, ownership, uniqueness, image count, and nonempty gallery before mutation.

Legacy requests that omit this optional image manifest retain current behavior: no files preserves the gallery; supplied files replace the gallery. New UI requests explicitly describe the final gallery. Use the existing product_images columns (url, sort_order, is_main) with no migration. Commit the database image changes together before deleting removed blobs; preserve retained images and never delete files merely to change the main image. Failed writes must not silently discard the old gallery.

The public API continues returning image and main_image for the main thumbnail plus images for the gallery, maintaining compatibility with current storefront callers.

## Orders

A dedicated Orders section loads orders independently of product management. Show order/revenue summaries, readable customer and delivery information, item details, totals, and existing removal action with confirmation. Escape customer-controlled content. Provide search and an empty state. On narrow screens, order details remain readable without overflowing the full page.

## Implementation boundaries and validation

Separate admin-only styles and behavior into dedicated files. Avoid changing shared storefront CSS. Use native dialog semantics, visible focus, descriptive labels, reduced-motion support, and meaningful disabled states.

Add browser regressions for default product view, filtering, pagination, create and edit, thumbnail selection/removal, retained-image editing, failed uploads, deletion, orders navigation, and mobile layout. Keep existing upload/auth regression coverage. Test API image-manifest compatibility and failure cases without writing to the real production database or Blob store. Visually inspect desktop and mobile screenshots before completion.

No deployment, live inventory mutation, or database migration is part of this redesign.
