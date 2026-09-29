const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

// Exercise real HTTP routes and multipart parsing, isolating only external Neon/Blob I/O.
async function fixture(t, options = {}) {
    const { failTransaction = false, concurrentEdit = false } = typeof options === 'boolean' ? { failTransaction: options } : options;
    let state = { product: { id: '1', name: 'Original', price: 100, stock: 7, category: 'gpu', specs: 'Specs', is_featured: true }, images: [{ url: 'https://store/a.png', blob_pathname: 'a.png', is_main: true, sort_order: 0 }, { url: 'https://store/b.png', blob_pathname: 'b.png', is_main: false, sort_order: 1 }] };
    const deleted = [], uploaded = [];
    const execute = q => {
        const v = q.values;
        if (q.text.includes('FOR UPDATE')) return [{ id: '1' }];
        if (q.text.includes('gallery_snapshot_valid')) {
            const actual = Object.fromEntries(state.images.map(image => [image.url, { sort_order: image.sort_order, is_main: image.is_main }]));
            if (JSON.stringify(actual) !== JSON.stringify(JSON.parse(v[1]))) throw Object.assign(new Error('division by zero'), { code: '22012' });
            return [{ gallery_snapshot_valid: 1 }];
        }
        if (q.text.includes('SELECT p.id')) return [{ ...state.product, images: state.images }];
        if (q.text.includes('SELECT url')) return state.images.map(i => ({ ...i }));
        if (q.text.includes('UPDATE products')) { [state.product.name, state.product.price, state.product.stock, state.product.category, state.product.specs, state.product.is_featured] = v; return []; }
        if (q.text.includes('DELETE FROM product_images')) { state.images = []; return []; }
        if (q.text.includes('INSERT INTO product_images')) { state.images.push({ url: v[1], blob_pathname: v[2], sort_order: v[4], is_main: v[5] }); return []; }
        throw new Error(`Unexpected SQL: ${q.text}`);
    };
    const sql = (strings, ...values) => {
        const query = { text: strings.join('?'), values };
        query.then = (resolve, reject) => Promise.resolve().then(() => execute(query)).then(resolve, reject);
        return query;
    };
    sql.transaction = async queries => {
        const backup = structuredClone(state);
        try { const result = queries.map(execute); if (failTransaction) throw new Error('Simulated write failure'); return result; }
        catch (error) { state = backup; throw error; }
    };
    const module = { exports: {} };
    const localRequire = createRequire(path.resolve('server.js'));
    const customRequire = name => {
        if (name === 'dotenv') return { config() {} };
        if (name === '@neondatabase/serverless') return { neon: () => sql };
        if (name === '@vercel/blob') return {
            put: async name => {
                const blob = { url: `https://store/${name}`, pathname: name }; uploaded.push(blob);
                if (concurrentEdit) {
                    state.product.name = 'Other admin edit';
                    state.images = [{ url: 'https://store/b.png', blob_pathname: 'b.png', is_main: true, sort_order: 0 }];
                    deleted.push('https://store/a.png');
                }
                return blob;
            },
            del: async url => { deleted.push(url); }
        };
        return localRequire(name);
    };
    const loadServer = new Function('require', 'module', '__dirname', 'process', 'console', fs.readFileSync('server.js', 'utf8'));
    loadServer(customRequire, module, path.resolve('.'), { env: { DATABASE_URL: 'fixture', BLOB_READ_WRITE_TOKEN: 'fixture', AUTH_TOKEN: 'test' } }, { log() {}, error() {} });
    const server = module.exports.listen(0, '127.0.0.1');
    await new Promise(r => server.once('listening', r));
    t.after(() => new Promise(r => server.close(r)));
    const base = `http://127.0.0.1:${server.address().port}`;
    return { deleted, uploaded, state: () => state, async patch(manifest, files = []) {
        const form = new FormData();
        for (const [key, value] of Object.entries({ name: 'Updated', price: 150, stock: 7, category: 'gpu', specs: 'Updated specs', isFeatured: true })) form.set(key, value);
        if (manifest !== undefined) form.set('imageManifest', JSON.stringify(manifest));
        for (const name of files) form.append('images', new Blob(['image'], { type: 'image/png' }), name);
        return fetch(base + '/api/products/1', { method: 'PATCH', headers: { Authorization: 'Bearer test' }, body: form });
    } };
}

test('reordering retained images changes public main thumbnail without touching Blob', async t => {
    const f = await fixture(t);
    const response = await f.patch([{ url: 'https://store/b.png' }, { url: 'https://store/a.png' }]);
    assert.equal(response.status, 200);
    const product = await response.json();
    assert.equal(product.image, 'https://store/b.png');
    assert.equal(product.main_image, product.image);
    assert.deepEqual(product.images, ['https://store/b.png', 'https://store/a.png']);
    assert.deepEqual(f.deleted, []); assert.deepEqual(f.uploaded, []);
});
test('edit keeps retained images, adds a main image and deletes only removed blobs', async t => {
    const f = await fixture(t);
    const response = await f.patch([{ upload: 0 }, { url: 'https://store/b.png' }], ['new.png']);
    assert.equal(response.status, 200);
    const product = await response.json();
    assert.equal(product.images.length, 2);
    assert.equal(product.main_image, f.uploaded[0].url);
    assert.equal(product.images[1], 'https://store/b.png');
    assert.deepEqual(f.deleted, ['https://store/a.png']);
});
for (const [name, manifest] of [
    ['foreign image', [{ url: 'https://foreign/image.png' }]],
    ['duplicate image', [{ url: 'https://store/a.png' }, { url: 'https://store/a.png' }]],
    ['empty gallery', []],
    ['invalid upload index', [{ upload: 4 }]]
]) test(`rejects ${name} before changing product or gallery`, async t => {
    const f = await fixture(t);
    const response = await f.patch(manifest);
    assert.equal(response.status, 400);
    assert.equal(f.state().product.name, 'Original');
    assert.equal(f.state().images.length, 2);
    assert.deepEqual(f.deleted, []);
});
test('transaction failure keeps old product/gallery and cleans up new upload', async t => {
    const f = await fixture(t, true);
    const response = await f.patch([{ upload: 0 }], ['new.png']);
    assert.equal(response.status, 500);
    assert.equal(f.state().product.name, 'Original');
    assert.equal(f.state().images.length, 2);
    assert.deepEqual(f.deleted, [f.uploaded[0].url]);
});
test('legacy text-only PATCH preserves gallery without requiring an image manifest', async t => {
    const f = await fixture(t);
    const response = await f.patch(undefined);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).image, 'https://store/a.png');
    assert.deepEqual(f.deleted, []);
});

test('concurrent gallery change rejects stale edit instead of restoring a deleted blob', async t => {
    const f = await fixture(t, { concurrentEdit: true });
    const response = await f.patch([{ url: 'https://store/a.png' }, { upload: 0 }], ['new.png']);
    assert.equal(response.status, 409);
    assert.match((await response.json()).error, /another session|changed/i);
    assert.equal(f.state().product.name, 'Other admin edit');
    assert.deepEqual(f.state().images.map(image => image.url), ['https://store/b.png']);
    assert.deepEqual(f.deleted, ['https://store/a.png', f.uploaded[0].url]);
});
