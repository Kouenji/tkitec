const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const nodemailer = require('nodemailer'); // Added for Email System

const app = express();
const PORT = 5000;

// ==========================================
// 1. CRITICAL MIDDLEWARE
// ==========================================
app.use(express.json()); 
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// 2. CONFIGURATION & SECURITY
// ==========================================
const PROD_FILE = path.join(__dirname, 'products.json');
const ORDER_FILE = path.join(__dirname, 'orders.json');
const IMG_DIR = path.join(__dirname, 'public/assets/images');

const ADMIN_USER = "admin";
const ADMIN_PASS = "tkitec2026";
const AUTH_TOKEN = "TKITEC_SECRET_AUTH_KEY";

// --- EMAIL CONFIGURATION (GMAIL) ---
// Note: Use a Google "App Password", not your regular password.
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com', // Your business email
        pass: 'xxxx xxxx xxxx xxxx'     // Your 16-character App Password
    }
});

// Ensure folders and files exist
if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });
const checkFile = (f) => { if (!fs.existsSync(f)) fs.writeFileSync(f, '[]'); };
checkFile(PROD_FILE);
checkFile(ORDER_FILE);

// ==========================================
// 3. FILE UPLOAD SETUP (MULTER)
// ==========================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, IMG_DIR),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + path.extname(file.originalname);
        cb(null, uniqueSuffix);
    }
});
const upload = multer({ storage: storage });

// ==========================================
// 4. DATABASE HELPERS
// ==========================================
const getData = (file) => JSON.parse(fs.readFileSync(file, 'utf8') || '[]');
const saveData = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

// ==========================================
// 5. SECURITY: ADMIN LOGIN API
// ==========================================
app.post('/api/admin/login', (req, res) => {
    const { user, pass } = req.body;
    console.log(`[Security] Login attempt: ${user}`);
    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        res.json({ success: true, token: AUTH_TOKEN });
    } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
    }
});

// ==========================================
// 6. API: PRODUCTS
// ==========================================
app.get('/api/products', (req, res) => res.json(getData(PROD_FILE)));

app.post('/api/products', upload.single('image'), (req, res) => {
    try {
        const products = getData(PROD_FILE);
        const newProd = {
            id: Date.now(),
            name: req.body.name,
            price: Number(req.body.price),
            category: req.body.category,
            specs: req.body.specs,
            isFeatured: req.body.isFeatured === 'true',
            image: req.file ? `./assets/images/${req.file.filename}` : './assets/images/default.jpg'
        };
        products.push(newProd);
        saveData(PROD_FILE, products);
        console.log(`[Inventory] Added: ${newProd.name}`);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Upload failed" }); }
});

app.delete('/api/products/:id', (req, res) => {
    const products = getData(PROD_FILE).filter(p => String(p.id) !== String(req.params.id));
    saveData(PROD_FILE, products);
    res.json({ success: true });
});

// ==========================================
// 7. API: ORDERS & EMAIL SYSTEM
// ==========================================
app.get('/api/admin/stats', (req, res) => {
    const orders = getData(ORDER_FILE);
    const rev = orders.reduce((s, o) => s + Number(o.total), 0);
    res.json({ orders: orders.reverse(), totalOrders: orders.length, totalRevenue: rev });
});

app.delete('/api/orders/:id', (req, res) => {
    const orders = getData(ORDER_FILE).filter(o => String(o.id) !== String(req.params.id));
    saveData(ORDER_FILE, orders);
    res.json({ success: true });
});

app.post('/api/orders', (req, res) => {
    try {
        const orders = getData(ORDER_FILE);
        const newOrder = {
            id: Date.now(),
            date: new Date().toLocaleString('en-GB'),
            customerName: req.body.customerName,
            customerEmail: req.body.customerEmail, // Added Email to Database
            phone: req.body.phone,
            wilaya: req.body.wilaya,
            address: req.body.address,
            deliveryType: req.body.deliveryType,
            items: req.body.items,
            total: Number(req.body.total)
        };

        orders.push(newOrder);
        saveData(ORDER_FILE, orders);

        // --- LEGENDARY EMAIL TEMPLATE ---
        const mailOptions = {
            from: '"Tki Tec Hardware" <your-email@gmail.com>',
            to: newOrder.customerEmail,
            subject: `Order Confirmed #${newOrder.id} - Tki Tec`,
            html: `
            <div style="background:#080a0d; color:#f0f6fc; font-family:sans-serif; padding:40px; border-radius:20px; border:1px solid #00d4ff; max-width:600px; margin:auto;">
                <h1 style="color:#00d4ff; text-align:center; border-bottom:1px solid #30363d; padding-bottom:20px;">Protocol: Order Confirmed</h1>
                <p style="font-size:16px;">Greetings <b>${newOrder.customerName}</b>,</p>
                <p style="color:#8b949e;">Your tactical hardware request has been received and processed by our mainframe. Our logistics team will contact you shortly.</p>
                
                <div style="background:#161b22; padding:25px; border-radius:15px; border:1px solid #30363d; margin:30px 0;">
                    <h3 style="margin-top:0; color:#00d4ff; font-size:18px; text-transform:uppercase;">Manifest Summary:</h3>
                    <p style="margin:5px 0;"><b>Equipment:</b> ${newOrder.items}</p>
                    <p style="margin:5px 0;"><b>Total Investment:</b> <span style="color:#ff3c3c; font-weight:bold;">${newOrder.total.toLocaleString()} DA</span></p>
                    <p style="margin:5px 0;"><b>Destination:</b> ${newOrder.wilaya}, ${newOrder.address}</p>
                    <p style="margin:5px 0;"><b>Method:</b> ${newOrder.deliveryType}</p>
                </div>

                <p style="text-align:center; color:#8b949e; font-size:12px; margin-top:40px; border-top:1px solid #30363d; padding-top:20px;">
                    This is an automated transmission from Tki Tec Hardware Algeria. <br>
                    Keep this receipt for your records.
                </p>
            </div>`
        };

        // Send Email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) console.log("Email Error:", error);
            else console.log(`[Order] Email Sent: ${newOrder.customerEmail}`);
        });

        console.log(`[Order] New sale confirmed: ${newOrder.customerName}`);
        res.json({ success: true });

    } catch (e) {
        console.error("Order process error:", e);
        res.status(500).json({ error: "Order failed" });
    }
});

// ==========================================
// 8. START SERVER
// ==========================================
app.listen(PORT, () => {
    console.clear();
    console.log(`
    ================================================
    🚀 TKI TEC HARDWARE - LEGENDARY SERVER LIVE
    ================================================
    
    🌐 URL: http://localhost:${PORT}/index.html
    🔐 LOGIN: http://localhost:${PORT}/login.html
    
    Status: Email & Database Sync Active.
    ================================================
    `);
});