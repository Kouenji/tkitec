const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

// External storage/database calls are intercepted; these tests never create real inventory.
process.env.AUTH_TOKEN = 'admin-upload-test-token';
const app = require('../server');
let server, browser, base;

before(async () => {
    server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({ headless: true, channel: process.env.TEST_BROWSER_CHANNEL || 'chrome' });
});
after(async () => {
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
});

async function openAdmin(t, token = 'TKITEC_SECRET_AUTH_KEY') {
    const context = await browser.newContext();
    t.after(() => context.close());
    await context.addInitScript(value => localStorage.setItem('adminToken', value), token);
    await context.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.abort());
    await context.route('**/api/admin/stats', route => route.fulfill({ json: { totalOrders: 0, totalRevenue: 0, orders: [] } }));
    await context.route('**/api/products', route => route.request().method() === 'GET' ? route.fulfill({ json: [] }) : route.continue());
    const page = await context.newPage();
    await page.goto(`${base}/admin.html`);
    await page.waitForLoadState('networkidle');
    return page;
}

async function fillProduct(page) {
    await page.locator('[name=name]').fill('Upload regression product');
    await page.locator('[name=price]').fill('1500');
    await page.locator('[name=category]').selectOption('cpu');
    await page.locator('#productImages').setInputFiles({ name: 'cpu.png', mimeType: 'image/png', buffer: Buffer.from('fixture') });
}

test('configured admin tokens can open the dashboard', async t => {
    const page = await openAdmin(t, 'admin-upload-test-token');
    assert.equal(new URL(page.url()).pathname, '/admin.html');
});

test('rejected upload keeps the form and selected images, and displays the error', async t => {
    const page = await openAdmin(t);
    await fillProduct(page);
    await page.getByRole('button', { name: 'Publish Product' }).click();
    await page.waitForLoadState('networkidle');
    assert.equal(await page.locator('[name=name]').inputValue(), 'Upload regression product');
    assert.equal(await page.locator('#productImages').evaluate(el => el.files.length), 1);
    assert.match(await page.locator('#adminMessage').innerText(), /authorization|session|log in/i);
});

test('successful upload sends the stored token and clears the form after saving', async t => {
    const page = await openAdmin(t);
    let authorization;
    await page.route('**/api/products', async route => {
        if (route.request().method() !== 'POST') return route.fallback();
        authorization = route.request().headers().authorization;
        await route.fulfill({ status: 201, json: { id: '123' } });
    });
    await fillProduct(page);
    await page.getByRole('button', { name: 'Publish Product' }).click();
    await page.waitForLoadState('networkidle');
    assert.equal(authorization, 'Bearer TKITEC_SECRET_AUTH_KEY');
    assert.equal(await page.locator('[name=name]').inputValue(), '');
    assert.match(await page.locator('#adminMessage').innerText(), /published|saved/i);
});

test('missing image storage configuration produces a useful upload error', async t => {
    const previous = process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.BLOB_READ_WRITE_TOKEN;
    t.after(() => { if (previous !== undefined) process.env.BLOB_READ_WRITE_TOKEN = previous; });
    const form = new FormData();
    form.set('name', 'Test'); form.set('price', '100'); form.set('category', 'cpu');
    form.set('images', new Blob(['fixture'], { type: 'image/png' }), 'cpu.png');
    const response = await fetch(`${base}/api/products`, { method: 'POST', headers: { Authorization: 'Bearer admin-upload-test-token' }, body: form });
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /BLOB_READ_WRITE_TOKEN/);
});

for (const failure of ['server', 'network', 'non-json']) {
    test(`${failure} upload failure preserves inputs and allows retry`, async t => {
        const page = await openAdmin(t);
        await page.route('**/api/products', async route => {
            if (route.request().method() !== 'POST') return route.fallback();
            if (failure === 'network') return route.abort();
            if (failure === 'non-json') return route.fulfill({ status: 413, contentType: 'text/html', body: '<h1>Payload too large</h1>' });
            return route.fulfill({ status: 500, json: { error: 'Product creation failed.' } });
        });
        await fillProduct(page);
        await page.getByRole('button', { name: 'Publish Product' }).click();
        await page.waitForLoadState('networkidle');
        assert.equal(await page.locator('[name=name]').inputValue(), 'Upload regression product');
        assert.equal(await page.locator('#productImages').evaluate(el => el.files.length), 1);
        assert.equal(await page.getByRole('button', { name: 'Publish Product' }).isEnabled(), true);
        assert.match(await page.locator('#adminMessage').innerText(), /not published/i);
    });
}

test('dashboard requests carry authorization and rejected refreshes show a message', async t => {
    const page = await openAdmin(t, 'admin-upload-test-token');
    let authorization;
    await page.route('**/api/admin/stats', async route => {
        authorization = route.request().headers().authorization;
        return route.fulfill({ status: 503, json: { error: 'Admin database unavailable.' } });
    });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.reload();
    // Orders now load on their dedicated tab, independently of inventory.
    await page.getByRole('tab', { name: 'Orders' }).click();
    await page.waitForLoadState('networkidle');
    assert.equal(authorization, 'Bearer admin-upload-test-token');
    assert.match(await page.locator('#adminMessage').innerText(), /database unavailable/i);
    assert.deepEqual(errors, []);
});
