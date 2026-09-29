# Tki Tec Premium Retail Storefront Design

## Goal and Scope

Make the storefront feel like a real premium Algerian PC hardware retailer: easy to browse, product-led, information-dense, and enjoyable on a phone. This revision supersedes the earlier “Premium Workbench” visual treatment, which felt too much like a generic technology landing page. It changes frontend presentation and interaction only.

Keep the existing `/api/products` fetch, Neon database, Vercel Blob image URLs, product schema, and backend unchanged. Do not create product brands, prices, stock, discounts, or promotional claims that are not present in the current data. Keep direct WhatsApp ordering and the configured number `213540993181`; remove no existing product or image data.

## Visual Direction

Keep the dark premium hardware palette, but make it feel like a shop rather than a dashboard: warm charcoal and graphite foundations, restrained steel/cyan details, clear white product information, price contrast, and WhatsApp green only on order/contact actions. Use a practical retail type hierarchy: a distinctive but readable heading face, a neutral sans-serif for descriptions and controls, and monospaced numerals only where they improve price or stock scanning.

Avoid oversized portfolio-style headlines, large empty bands, decorative grids or circuit motifs, floating cards, and isolated “feature” panels. The signature is an active inventory storefront: a strong product-image-led commercial banner flowing directly into category shortcuts and compact product shelves. Use existing product imagery as the visual source; do not substitute generic stock art or fabricate product composites that imply unsold items.

## Header and Homepage

Use a compact brand header with a deliberate logo treatment, prominent search, visible category navigation, and a restrained WhatsApp contact action. On mobile, keep search and category access within thumb reach and provide an accessible menu.

The hero is a compact commercial banner, not a text column paired with a single product card. Lead with “Build your dream PC” and the supporting line “Premium components selected for gamers and creators,” plus “Browse products” and “Contact WhatsApp” actions. Make real inventory imagery the dominant hero visual: a larger featured product alongside smaller real product images where available, composed as an unframed retail banner rather than nested UI cards. If inventory only supplies one usable product image, use that image at larger scale without adding invented items.

Place a compact trust strip directly with the hero, communicating the requested signals: Algerian store, hardware specialists, WhatsApp ordering, and fast response. Follow it immediately with category shortcuts for GPUs, CPUs, motherboards, RAM, storage, and accessories, then featured and latest product shelves. Add a “Why buy from TKI TEC?” section with genuine components, expert advice, custom PC builds, and WhatsApp support. These are concise store assurances, not oversized explanatory cards. Do not add offers or discount sections; the schema has no offer data.

## Product Browsing

Keep the dedicated catalog searchable and filterable by category, with price sorting. Preserve existing query-based navigation and product fetching. Product shelves on the homepage use the current featured flag and newest-first API order.

On desktop, show a balanced four-column catalog grid with compact but readable cards and tight section spacing so more products enter the first viewport. On phones, featured and latest sections become horizontal touch carousels: fixed-width cards, horizontal overflow, scroll snapping, smooth native swipe, and visible progress/dot or arrow controls with accessible names. Do not turn these homepage shelves into long vertical lists. Keep the dedicated catalog usable as a responsive listing and avoid horizontal page overflow.

## Product Cards

Cards should read like retail product tiles, not generic dashboard cards: a generous, clean image stage; a small category label; product name; prominent DZD price; availability; a concise specifications excerpt; and a full-width primary “Order via WhatsApp” action. Use only category data for the category label; do not infer a brand field that is not in the schema. Preserve image proportions and use the source image URL from the API. Add subtle image zoom and border/position feedback on hover without large glow effects or excessive rounding. On mobile, keep labels, price, availability, and ordering scannable at a glance.

## Product Details and Mobile Ordering

Retain the existing product detail route and data lookup. Present a large main product image with selectable thumbnails; support touch swipe when multiple images exist, while keeping explicit thumbnail controls available. Keep full specifications, category, price, and stock status beside or directly below the gallery with a clear hierarchy.

On mobile, keep a fixed bottom WhatsApp order action with the current product price, respect device safe areas, and ensure it does not obscure specifications or other page content. Order messages include the exact product name and displayed DZD price. Custom PC build orders include the selected components and total.

## Cart Removal and Data Integrity

The storefront has no cart or checkout flow: no cart navigation, counter, local-storage cart, cart page, checkout modal, order-submission form, Add to Cart action, or obsolete checkout URL handling. Product and build purchasing actions open WhatsApp. Keep all backend routes intact; this request does not change server behavior, the database, storage, or API contracts.

## Performance and Verification

Load the hero image eagerly with appropriate priority; lazy-load below-the-fold product images and thumbnails, preserve the existing Blob URLs, and decode images asynchronously where supported. Use native horizontal scrolling and reduced-motion-aware transitions.

Verify the homepage and catalog render live products, WhatsApp URLs contain the correct number/name/price, image galleries switch and swipe, mobile shelves scroll and snap, fixed ordering does not cover details, responsive layouts have no horizontal page overflow, and the frontend contains no cart/checkout remnants. Run the existing test suite and report failures that originate outside the frontend scope without changing backend code.