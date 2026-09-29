const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function storefront() {
    const context = { window: {} };
    for (const file of ['store-config.js', 'storefront.js']) {
        vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../docs/assets/js', file), 'utf8'), context);
    }
    return context.window.TkiStorefront;
}

test('catalog excludes promotional photos while preserving them for featured use', () => {
    const store = storefront();
    const product = { image: 'ad.jpg', images: ['ad.jpg', 'phone.jpg', 'side.jpg'],
        image_roles: [{ url: 'ad.jpg', role: 'promotional' }, { url: 'phone.jpg', role: 'main' }] };
    assert.deepEqual(Array.from(store.productImages(product, { includePromotional: false })), ['phone.jpg', 'side.jpg']);
    assert.deepEqual(Array.from(store.productImages(product)), ['phone.jpg', 'side.jpg', 'ad.jpg']);
    assert.doesNotMatch(store.renderProductCard(product), /ad\.jpg/);
});

test('role main outranks legacy first image, but explicit main selection wins', () => {
    const store = storefront();
    const product = { image: 'old.jpg', images: ['old.jpg', 'best.jpg'], image_roles: [{ url: 'best.jpg', role: 'main' }] };
    assert.equal(store.productImages(product)[0], 'best.jpg');
    assert.equal(store.productImages({ ...product, main_image: 'selected.jpg' })[0], 'selected.jpg');
});

test('legacy uploads retain order and duplicates are removed', () => {
    const product = { image: 'phone.jpg', images: ['side.jpg', 'phone.jpg', 'detail.jpg'] };
    assert.deepEqual(Array.from(storefront().productImages(product, { includePromotional: false })), ['phone.jpg', 'side.jpg', 'detail.jpg']);
});

test('promo-only or missing images show an honest placeholder, never an empty source', () => {
    const store = storefront();
    for (const product of [{}, { image: 'ad.jpg', image_roles: [{ url: 'ad.jpg', role: 'promo' }] }]) {
        const card = store.renderProductCard(product);
        assert.doesNotMatch(card, /src=""|ad\.jpg/);
        assert.match(card, /Photo unavailable/);
    }
});
