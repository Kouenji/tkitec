# Findings

- Active app is the repository root: `server.js`, `docs/`, root `products.json`, root `data/`.
- A duplicated nested `tkitec-main/` directory exists and must not be used; it is scheduled for removal.
- Current backend reads/writes `data/products.json` and `data/orders.json`; Multer writes to `data/assets/images` and uses `upload.single('image')`.
- Current product records use `image`, `id`, `name`, `price`, `category`, `specs`, and `isFeatured`; no stock field is currently wired.
- Admin page posts `FormData` to `POST /api/products`, renders an inventory list, and has no edit flow.
- Product page fetches all products and renders one image; it has no gallery.
- No Neon package/client, Vercel Blob package/client, SQL schema, migration, or database API exists in the root project.
- Existing pages use `docs/assets/css/style.css`; homepage has collection cards and dynamic product sliders.
- Theme default currently uses `#0f172a` and white logo behavior from the previous task.
