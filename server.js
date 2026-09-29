require('dotenv').config();

const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { neon } = require('@neondatabase/serverless');
const { put, del } = require('@vercel/blob');
const { parseImageManifest, updateProductGallery } = require('./server/product-gallery');

const app = express();
const PORT = process.env.PORT || 5000;
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'tkitec2026';
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'TKITEC_SECRET_AUTH_KEY';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { files: 10, fileSize: 8 * 1024 * 1024 }
});

const getDb = () => {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is required for the Neon database.');
    }
    return neon(process.env.DATABASE_URL);
};

const getBlobToken = () => {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        throw new Error('BLOB_READ_WRITE_TOKEN is required for product images.');
    }
    return process.env.BLOB_READ_WRITE_TOKEN;
};

const transporter = process.env.SMTP_USER && process.env.SMTP_PASS
    ? nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    })
    : null;

app.use(express.json());
app.use(express.static(require('path').join(__dirname, 'docs')));

function requireAdmin(req, res, next) {
    const token = req.get('authorization')?.replace(/^Bearer\s+/i, '') || req.get('x-admin-token');
    if (token !== AUTH_TOKEN) return res.status(401).json({ error: 'Admin authorization required.' });
    next();
}

function parseBoolean(value) {
    return value === true || value === 'true' || value === 'on' || value === '1';
}

function parseProductFields(body) {
    return {
        name: String(body.name || '').trim(),
        price: Number(body.price),
        stock: Math.max(0, Number.parseInt(body.stock || '0', 10) || 0),
        category: String(body.category || '').trim(),
        specs: String(body.specs || '').trim(),
        isFeatured: parseBoolean(body.isFeatured)
    };
}

function validateProduct(product) {
    if (!product.name || !product.category || !Number.isFinite(product.price) || product.price < 0) {
        return 'Name, category, and a non-negative price are required.';
    }
    return null;
}

function shapeProduct(row) {
    const images = (row.images || []).filter(image => image?.url);
    const mainImage = images.find(image => image.is_main)?.url || images[0]?.url || '';
    return {
        id: String(row.id),
        name: row.name,
        price: Number(row.price),
        stock: row.stock,
        category: row.category,
        specs: row.specs,
        isFeatured: row.is_featured,
        main_image: mainImage,
        images: images.map(image => image.url),
        image: mainImage
    };
}

async function listProducts() {
    const sql = getDb();
    const rows = await sql`
        SELECT p.id, p.name, p.price, p.stock, p.category, p.specs, p.is_featured,
               COALESCE(
                   json_agg(
                       json_build_object(
                           'url', pi.url,
                           'is_main', pi.is_main,
                           'sort_order', pi.sort_order
                       ) ORDER BY pi.sort_order, pi.id
                   ) FILTER (WHERE pi.id IS NOT NULL), '[]'::json
               ) AS images
        FROM products p
        LEFT JOIN product_images pi ON pi.product_id = p.id
        GROUP BY p.id
        ORDER BY p.created_at DESC
    `;
    return rows.map(shapeProduct);
}

async function getProduct(id) {
    const products = await listProducts();
    return products.find(product => String(product.id) === String(id));
}

async function uploadImages(files) {
    const token = getBlobToken();
    return Promise.all((files || []).map(async file => {
        const safeName = file.originalname.replace(/[^a-z0-9._-]/gi, '-').toLowerCase();
        const blob = await put(`products/${crypto.randomUUID()}-${safeName}`, file.buffer, {
            access: 'public',
            addRandomSuffix: false,
            contentType: file.mimetype,
            token
        });
        return { url: blob.url, pathname: blob.pathname };
    }));
}

async function deleteBlobImages(images) {
    const token = getBlobToken();
    await Promise.all((images || []).map(image => image?.url ? del(image.url, { token }) : Promise.resolve()));
}

function collectFiles(files) {
    if (Array.isArray(files)) return files;
    return Object.values(files || {}).flat();
}

app.post('/api/admin/login', (req, res) => {
    const { user, pass } = req.body;
    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        return res.json({ success: true, token: AUTH_TOKEN });
    }
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

app.get('/api/products', async (req, res) => {
    try {
        res.json(await listProducts());
    } catch (error) {
        console.error('[Products] List failed:', error.message);
        res.status(503).json({ error: 'Product database unavailable.' });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await getProduct(req.params.id);
        if (!product) return res.status(404).json({ error: 'Product not found.' });
        res.json(product);
    } catch (error) {
        console.error('[Products] Detail failed:', error.message);
        res.status(503).json({ error: 'Product database unavailable.' });
    }
});

async function createProduct(req, res) {
    try {
        const product = parseProductFields(req.body);
        const validationError = validateProduct(product);
        const files = collectFiles(req.files);
        if (validationError) return res.status(400).json({ error: validationError });
        if (!files.length) return res.status(400).json({ error: 'At least one product image is required.' });
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            return res.status(503).json({ error: 'Image storage is not configured. Set BLOB_READ_WRITE_TOKEN on the server before uploading products.' });
        }
        if (!process.env.DATABASE_URL) {
            return res.status(503).json({ error: 'Product database is not configured. Set DATABASE_URL on the server before uploading products.' });
        }

        const uploadedImages = await uploadImages(files);
        const sql = getDb();
        const [created] = await sql`
            INSERT INTO products (name, price, stock, category, specs, is_featured)
            VALUES (${product.name}, ${product.price}, ${product.stock}, ${product.category}, ${product.specs}, ${product.isFeatured})
            RETURNING id
        `;

        for (const [index, image] of uploadedImages.entries()) {
            await sql`
                INSERT INTO product_images (product_id, url, blob_pathname, alt_text, sort_order, is_main)
                VALUES (${created.id}, ${image.url}, ${image.pathname}, ${product.name}, ${index}, ${index === 0})
            `;
        }

        res.status(201).json(await getProduct(created.id));
    } catch (error) {
        console.error('[Products] Create failed:', error);
        res.status(500).json({ error: 'Product creation failed.' });
    }
}

app.post('/api/products', requireAdmin, upload.array('images', 10), createProduct);

app.patch('/api/products/:id', requireAdmin, upload.array('images', 10), async (req, res) => {
    try {
        const product = parseProductFields(req.body);
        const validationError = validateProduct(product);
        if (validationError) return res.status(400).json({ error: validationError });

        const current = await getProduct(req.params.id);
        if (!current) return res.status(404).json({ error: 'Product not found.' });

        const sql = getDb();
        if (req.body.imageManifest !== undefined) {
            const files = collectFiles(req.files);
            let manifest;
            try {
                manifest = parseImageManifest(req.body.imageManifest, current.images, files.length);
            } catch (error) {
                return res.status(400).json({ error: error.message });
            }
            await updateProductGallery({ sql, id: req.params.id, product, manifest, files, uploadImages, deleteBlobImages });
            return res.json(await getProduct(req.params.id));
        }
        await sql`
            UPDATE products
            SET name = ${product.name}, price = ${product.price}, stock = ${product.stock},
                category = ${product.category}, specs = ${product.specs},
                is_featured = ${product.isFeatured}, updated_at = NOW()
            WHERE id = ${req.params.id}
        `;

        const files = collectFiles(req.files);
        if (files.length) {
            const uploadedImages = await uploadImages(files);
            const oldImages = await sql`
                SELECT url FROM product_images WHERE product_id = ${req.params.id}
            `;
            await sql`DELETE FROM product_images WHERE product_id = ${req.params.id}`;
            await deleteBlobImages(oldImages);
            for (const [index, image] of uploadedImages.entries()) {
                await sql`
                    INSERT INTO product_images (product_id, url, blob_pathname, alt_text, sort_order, is_main)
                    VALUES (${req.params.id}, ${image.url}, ${image.pathname}, ${product.name}, ${index}, ${index === 0})
                `;
            }
        }

        res.json(await getProduct(req.params.id));
    } catch (error) {
        console.error('[Products] Update failed:', error);
        res.status(500).json({ error: 'Product update failed.' });
    }
});

app.delete('/api/products/:id', requireAdmin, async (req, res) => {
    try {
        const sql = getDb();
        const images = await sql`SELECT url FROM product_images WHERE product_id = ${req.params.id}`;
        const result = await sql`DELETE FROM products WHERE id = ${req.params.id} RETURNING id`;
        if (!result.length) return res.status(404).json({ error: 'Product not found.' });
        await deleteBlobImages(images);
        res.json({ success: true });
    } catch (error) {
        console.error('[Products] Delete failed:', error);
        res.status(500).json({ error: 'Product deletion failed.' });
    }
});

app.get('/api/admin/stats', requireAdmin, async (req, res) => {
    try {
        const sql = getDb();
        const [summary] = await sql`SELECT COUNT(*)::int AS total_orders, COALESCE(SUM(total), 0) AS total_revenue FROM orders`;
        const orders = await sql`SELECT id, date, customer_name AS "customerName", customer_email AS "customerEmail", phone, wilaya, address, delivery_type AS "deliveryType", items, total FROM orders ORDER BY date DESC`;
        res.json({
            orders: orders.map(order => ({ ...order, id: String(order.id), total: Number(order.total) })),
            totalOrders: summary.total_orders,
            totalRevenue: Number(summary.total_revenue)
        });
    } catch (error) {
        console.error('[Admin] Stats failed:', error.message);
        res.status(503).json({ error: 'Admin database unavailable.' });
    }
});

app.delete('/api/orders/:id', requireAdmin, async (req, res) => {
    try {
        const sql = getDb();
        await sql`DELETE FROM orders WHERE id = ${req.params.id}`;
        res.json({ success: true });
    } catch (error) {
        console.error('[Orders] Delete failed:', error.message);
        res.status(500).json({ error: 'Order deletion failed.' });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        const order = req.body;
        const sql = getDb();
        const [created] = await sql`
            INSERT INTO orders (customer_name, customer_email, phone, wilaya, address, delivery_type, items, total)
            VALUES (${order.customerName}, ${order.customerEmail}, ${order.phone}, ${order.wilaya}, ${order.address}, ${order.deliveryType}, ${order.items}, ${Number(order.total)})
            RETURNING id, date
        `;

        if (transporter) {
            transporter.sendMail({
                from: `Tki Tec Hardware <${process.env.SMTP_USER}>`,
                to: order.customerEmail,
                subject: `Order Confirmed #${created.id} - Tki Tec`,
                text: `Your order for ${order.items} has been received. Total: ${Number(order.total).toLocaleString()} DZD.`
            }).catch(error => console.error('[Email] Send failed:', error.message));
        }

        res.json({ success: true, id: String(created.id) });
    } catch (error) {
        console.error('[Orders] Create failed:', error.message);
        res.status(500).json({ error: 'Order failed.' });
    }
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`TKI TEC server listening at http://localhost:${PORT}`);
    });
}

module.exports = app;
