const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const app = require('../server');
let browser, server, base;
before(async () => {
    server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({ channel: process.env.TEST_BROWSER_CHANNEL || 'chrome', headless: true });
});
after(async () => { if (browser) await browser.close(); if (server) await new Promise(r => server.close(r)); });
const product = i => ({ id: String(i), name: `Hardware ${i}`, price: 12000 + i, stock: 8, category: i % 2 ? 'gpu' : 'ram', specs: 'Reliable hardware', isFeatured: i === 1, image: '/assets/images/pc.jpg', main_image: '/assets/images/pc.jpg', images: ['/assets/images/pc.jpg', '/assets/images/gpu.jpg'] });
async function setup(t, width = 1440) {
    const context = await browser.newContext({ viewport: { width, height: 1000 } });
    t.after(() => context.close());
    await context.addInitScript(() => localStorage.setItem('adminToken', 'test-token'));
    await context.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
    let products = Array.from({ length: 15 }, (_, i) => product(i + 1));
    await context.route('**/api/products', r => r.request().method() === 'GET' ? r.fulfill({ json: products }) : r.continue());
    await context.route('**/api/admin/stats', r => r.fulfill({ json: { orders: [], totalOrders: 0, totalRevenue: 0 } }));
    const page = await context.newPage();
    page.setDefaultTimeout(3000);
    await page.goto(base + '/admin.html');
    await page.waitForLoadState('networkidle');
    return { page, setProducts: value => { products = value; } };
}
test('products open by default with search, pagination and a separate orders view', async t => {
    const { page } = await setup(t);
    assert.equal(await page.locator('#productsView').isVisible(), true);
    assert.equal(await page.locator('#ordersView').isVisible(), false);
    assert.equal(await page.locator('.product-card').count(), 12);
    await page.getByRole('button', { name: 'Next page' }).click();
    assert.equal(await page.locator('.product-card').count(), 3);
    await page.getByLabel('Search products').fill('Hardware 15');
    assert.equal(await page.locator('.product-card').count(), 1);
    await page.getByRole('tab', { name: 'Orders' }).click();
    assert.equal(await page.locator('#ordersView').isVisible(), true);
});
test('creation sends selected main image first and excludes removed files', async t => {
    const { page } = await setup(t);
    const form = page.locator('#productForm');
    await form.getByLabel('Product name').fill('New hardware');
    await form.getByLabel('Price (DZD)').fill('9000');
    await form.getByLabel('Category', { exact: true }).selectOption('gpu');
    await page.locator('#productImages').setInputFiles(['first.png', 'second.png', 'third.png'].map(name => ({ name, mimeType: 'image/png', buffer: Buffer.from(name) })));
    await page.getByRole('button', { name: 'Set second.png as main image' }).click();
    await page.getByRole('button', { name: 'Remove first.png' }).click();
    let payload;
    await page.route('**/api/products', async r => {
        if (r.request().method() !== 'POST') return r.fallback();
        payload = r.request().postDataBuffer().toString();
        await r.fulfill({ status: 201, json: product(16) });
    });
    await form.getByRole('button', { name: 'Publish product' }).click();
    await page.waitForLoadState('networkidle');
    assert.ok(payload.indexOf('second.png') < payload.indexOf('third.png'));
    assert.ok(!payload.includes('first.png'));
    assert.equal(await form.getByLabel('Product name').inputValue(), '');
});
test('edit uses PATCH, retains the chosen gallery and updates the visible main image', async t => {
    const { page, setProducts } = await setup(t);
    await page.getByRole('button', { name: 'Edit Hardware 1', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Edit product' });
    await dialog.getByLabel('Product name').fill('Updated hardware');
    await dialog.getByRole('button', { name: 'Set image 2 as main image' }).click();
    await dialog.getByRole('button', { name: 'Remove image 1' }).click();
    let payload;
    await page.route('**/api/products/1', async r => {
        assert.equal(r.request().method(), 'PATCH');
        payload = r.request().postDataBuffer().toString();
        const updated = { ...product(1), name: 'Updated hardware', image: '/assets/images/gpu.jpg', main_image: '/assets/images/gpu.jpg', images: ['/assets/images/gpu.jpg'] };
        setProducts([updated]);
        await r.fulfill({ json: updated });
    });
    await dialog.getByRole('button', { name: 'Save changes' }).click();
    await page.waitForLoadState('networkidle');
    assert.match(payload, /imageManifest/);
    assert.match(payload, /gpu.jpg/);
    assert.ok(!payload.includes('pc.jpg'));
    assert.equal(await dialog.isVisible(), false);
    assert.equal(new URL(await page.locator('.product-card img').first().getAttribute('src'), base).pathname, '/assets/images/gpu.jpg');
});
test('mobile starts with inventory and opens creation without horizontal overflow', async t => {
    const { page } = await setup(t, 390);
    assert.equal(await page.locator('#productForm').isVisible(), false);
    await page.getByRole('button', { name: 'Add product', exact: true }).click();
    assert.equal(await page.getByRole('dialog', { name: 'Add product' }).isVisible(), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
});
