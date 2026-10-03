const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const configPath = path.join(__dirname, '../docs/assets/js/store-config.js');
const storefrontPath = path.join(__dirname, '../docs/assets/js/storefront.js');

test('product order messages include the configured WhatsApp number, product, and DZD price', () => {
    assert.ok(fs.existsSync(configPath), 'store-config.js should centralize WhatsApp ordering');

    const context = { window: {} };
    vm.runInNewContext(fs.readFileSync(configPath, 'utf8'), context);

    const message = context.window.createProductOrderMessage({ name: 'RTX 4080 SUPER', price: 345000 });
    assert.equal(message, 'Hello, I want to order:\nProduct: RTX 4080 SUPER\nPrice: 345,000 DZD');

    const orderUrl = new URL(context.window.createWhatsAppOrderUrl(message));
    assert.equal(orderUrl.origin, 'https://wa.me');
    assert.equal(orderUrl.pathname, '/213540993181');
    assert.equal(orderUrl.searchParams.get('text'), message);
});

test('shared product cards show safe product details, gallery thumbnails, stock, and WhatsApp ordering', () => {
    assert.ok(fs.existsSync(storefrontPath), 'storefront.js should render reusable product cards');

    const context = { window: {} };
    vm.runInNewContext(fs.readFileSync(configPath, 'utf8'), context);
    vm.runInNewContext(fs.readFileSync(storefrontPath, 'utf8'), context);

    const card = context.window.TkiStorefront.renderProductCard({
        id: 'gpu-1',
        name: 'RTX 4080 <SUPER>',
        price: 345000,
        stock: 3,
        category: 'gpu',
        specs: '16GB GDDR6X\nPCIe 4.0',
        image: 'https://images.example/main.png',
        images: ['https://images.example/main.png', 'https://images.example/side.png']
    });

    assert.match(card, /RTX 4080 &lt;SUPER&gt;/);
    assert.match(card, /GPU/);
    assert.match(card, /345,000 DZD/);
    assert.match(card, /Available/);
    assert.match(card, /16GB GDDR6X/);
    assert.match(card, /data-gallery-src="https:\/\/images\.example\/side\.png"/);
    assert.match(card, /https:\/\/wa\.me\/213540993181/);
});

test('image roles keep a clean main image first and retain promo art in the gallery', () => {
    const context = { window: {} };
    vm.runInNewContext(fs.readFileSync(configPath, 'utf8'), context);
    vm.runInNewContext(fs.readFileSync(storefrontPath, 'utf8'), context);
    const product = {
        id: 'gpu-roles',
        name: 'Graphics card',
        category: 'gpu',
        image: 'promo.png',
        images: ['promo.png', 'clean.png', 'detail.png'],
        image_roles: [
            { url: 'promo.png', role: 'promo' },
            { url: 'clean.png', role: 'clean' },
            { url: 'detail.png', role: 'gallery' }
        ]
    };

    assert.deepEqual(Array.from(context.window.TkiStorefront.productImages(product)), ['clean.png', 'detail.png', 'promo.png']);
    assert.deepEqual(Array.from(context.window.TkiStorefront.productImages({
        main_image: 'selected.png',
        images: ['other.png', 'selected.png']
    })), ['selected.png', 'other.png']);
    assert.match(context.window.TkiStorefront.renderProductCard({ ...product, price: 1, stock: 1 }), /product-card--component/);
    assert.match(context.window.TkiStorefront.renderProductCard({ ...product, id: 'pc-demo', category: 'prebuilt', price: 1, stock: 1 }), /product-card--prebuilt/);
});

test('product shelves render only supplied inventory with labeled swipe controls', () => {
    const context = { window: {} };
    vm.runInNewContext(fs.readFileSync(configPath, 'utf8'), context);
    vm.runInNewContext(fs.readFileSync(storefrontPath, 'utf8'), context);
    const store = context.window.TkiStorefront;
    assert.equal(typeof store.renderProductShelf, 'function', 'storefront should render reusable product shelves');

    const products = [
        { id: 'gpu-1', name: 'RTX 4080 SUPER', category: 'gpu', price: 345000, stock: 2, image: 'https://images.example/gpu.png' },
        { id: 'cpu-1', name: 'Ryzen 7', category: 'cpu', price: 150000, stock: 1, image: 'https://images.example/cpu.png' }
    ];
    const shelf = store.renderProductShelf(products, { label: 'Featured products' });

    assert.match(shelf, /aria-label="Featured products"/);
    assert.match(shelf, /data-shelf-direction="-1"/);
    assert.match(shelf, /data-shelf-direction="1"/);
    assert.match(shelf, /data-shelf-track/);
    assert.match(shelf, /RTX 4080 SUPER/);
    assert.match(shelf, /Ryzen 7/);
    assert.doesNotMatch(shelf, /product-3/);
});

test('touch swipe helper reports horizontal direction and ignores vertical movement', () => {
    const context = { window: {} };
    vm.runInNewContext(fs.readFileSync(configPath, 'utf8'), context);
    vm.runInNewContext(fs.readFileSync(storefrontPath, 'utf8'), context);
    const store = context.window.TkiStorefront;
    assert.equal(typeof store.bindTouchSwipe, 'function', 'storefront should expose touch-swipe handling');

    const handlers = {};
    const element = { addEventListener(type, handler) { handlers[type] = handler; } };
    const directions = [];
    store.bindTouchSwipe(element, direction => directions.push(direction));
    handlers.touchstart({ touches: [{ clientX: 180, clientY: 100 }] });
    handlers.touchend({ changedTouches: [{ clientX: 90, clientY: 104 }] });
    handlers.touchstart({ touches: [{ clientX: 100, clientY: 100 }] });
    handlers.touchend({ changedTouches: [{ clientX: 98, clientY: 170 }] });

    assert.deepEqual(directions, [1]);
});

test('product filtering searches name, category, and specs and sorts by price', () => {
    const context = { window: {} };
    vm.runInNewContext(fs.readFileSync(configPath, 'utf8'), context);
    vm.runInNewContext(fs.readFileSync(storefrontPath, 'utf8'), context);
    const store = context.window.TkiStorefront;
    assert.equal(typeof store.filterProducts, 'function', 'storefront should expose product filtering');

    const products = [
        { id: 'gpu', name: 'RTX 4080', category: 'gpu', specs: 'silent cooler', price: 345000 },
        { id: 'keyboard', name: 'Mechanical board', category: 'keyboard', specs: 'RGB quiet switches', price: 25000 },
        { id: 'mouse', name: 'Gaming mouse', category: 'mouse', specs: 'quiet clicks', price: 8000 }
    ];
    const matches = store.filterProducts(products, { category: 'peripherals', search: 'quiet', sort: 'price-asc' });

    assert.deepEqual(Array.from(matches, product => product.id), ['mouse', 'keyboard']);
});

test('storefront has no cart or checkout flow and custom builds order through WhatsApp', () => {
    const frontendPaths = [
        '../docs/index.html',
        '../docs/shop.html',
        '../docs/product.html',
        '../docs/build.html',
        '../docs/assets/css/style.css',
        '../docs/assets/js/script.js',
        '../docs/assets/js/builder.js'
    ].map(file => path.join(__dirname, file));
    const storefront = frontendPaths.map(file => fs.readFileSync(file, 'utf8')).join('\n');

    assert.equal(fs.existsSync(path.join(__dirname, '../docs/cart.html')), false, 'cart page should be removed');
    assert.doesNotMatch(storefront, /cart\.html|cartBadge|tki_cart|add to cart|checkoutModal|checkout_cart|buy_id/i);
    assert.match(fs.readFileSync(path.join(__dirname, '../docs/build.html'), 'utf8'), /order-build-whatsapp/);
    assert.match(fs.readFileSync(path.join(__dirname, '../docs/assets/js/builder.js'), 'utf8'), /createBuildOrderMessage/);
});

test('homepage puts prebuilt PCs before components and handles an empty prebuilt shelf', () => {
    const homepage = fs.readFileSync(path.join(__dirname, '../docs/index.html'), 'utf8');
    const homeScript = fs.readFileSync(path.join(__dirname, '../docs/assets/js/home.js'), 'utf8');
    const prebuiltSection = homepage.indexOf('id="prebuilt"');
    const componentsSection = homepage.indexOf('id="components"');

    assert.notEqual(prebuiltSection, -1, 'homepage should include a prebuilt PCs section');
    assert.notEqual(componentsSection, -1, 'homepage should include a components section');
    assert.ok(prebuiltSection < componentsSection, 'prebuilt PCs should appear before components');
    assert.match(homepage, /Prebuilt PCs/);
    assert.match(homepage, /id="componentsHeading">PCs &amp; Components/);
    assert.doesNotMatch(homepage, /Algerian store|WhatsApp ordering|Hardware specialists|Fast response|hero-trust/);
    assert.match(homeScript, /category: 'prebuilt'/);
    assert.match(homeScript, /No PCs available/);
});

test('demo preview uses a local 30-product fixture and live mode uses the API', async () => {
    const demoPath = path.join(__dirname, '../docs/assets/js/demo-products.js');
    assert.ok(fs.existsSync(demoPath), 'demo products should live in a separate frontend fixture');

    const notices = [];
    const storage = new Map();
    const context = {
        window: {
            location: { search: '?preview=demo' },
            sessionStorage: {
                getItem(key) { return storage.get(key) || null; },
                setItem(key, value) { storage.set(key, value); },
                removeItem(key) { storage.delete(key); }
            }
        },
        document: {
            querySelector() { return notices[0] || null; },
            createElement() {
                return { className: '', innerHTML: '', setAttribute() {} };
            },
            body: { prepend(notice) { notices.push(notice); } }
        },
        URLSearchParams,
        fetch: async () => ({ ok: true, async json() { return [{ id: 'live-product' }]; } })
    };

    vm.runInNewContext(fs.readFileSync(configPath, 'utf8'), context);
    vm.runInNewContext(fs.readFileSync(demoPath, 'utf8'), context);
    vm.runInNewContext(fs.readFileSync(storefrontPath, 'utf8'), context);
    const demoProducts = await context.window.TkiStorefront.getProducts();
    assert.equal(demoProducts.length, 30);
    assert.equal(storage.get('tki-storefront-preview'), 'demo');
    assert.equal(notices.length, 1);
    const demoCard = context.window.TkiStorefront.renderProductCard(demoProducts[0]);
    assert.match(demoCard, /Preview only/);
    assert.match(demoCard, /product\.html\?id=demo-prebuilt-001/);
    assert.doesNotMatch(demoCard, /href="https:\/\/wa\.me\/213540993181/);

    context.window.location.search = '';
    assert.equal((await context.window.TkiStorefront.getProducts()).length, 30);

    context.window.location.search = '?preview=live';
    const liveProducts = await context.window.TkiStorefront.getProducts();
    assert.equal(liveProducts[0].id, 'live-product');
    assert.equal(storage.has('tki-storefront-preview'), false);
});
