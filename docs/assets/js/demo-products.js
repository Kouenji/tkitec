'use strict';

window.TkiDemoProducts = [
    {
        id: 'demo-prebuilt-001', name: 'Forge 1080p Gaming PC', category: 'prebuilt', price: 245000, stock: 3, isFeatured: true,
        image: './assets/images/pc.jpg', images: ['./assets/images/pc.jpg', './assets/images/desktop.png'],
        image_roles: [{ url: './assets/images/desktop.png', role: 'promo' }],
        specs: 'AMD Ryzen 5 5600\nGeForce RTX 3060 12GB\n16GB DDR4 · 1TB NVMe SSD'
    },
    {
        id: 'demo-prebuilt-002', name: 'Forge 1440p Gaming PC', category: 'prebuilt', price: 389000, stock: 2,
        image: './assets/images/setup.jpg', images: ['./assets/images/setup.jpg', './assets/images/pc.jpg'],
        specs: 'AMD Ryzen 7 7800X3D\nGeForce RTX 4070 SUPER 12GB\n32GB DDR5 · 1TB NVMe SSD'
    },
    {
        id: 'demo-prebuilt-003', name: 'Studio Creator Workstation', category: 'prebuilt', price: 529000, stock: 0,
        image: './assets/images/desktop.png', images: ['./assets/images/desktop.png', './assets/images/setup.jpg'],
        image_roles: [{ url: './assets/images/desktop.png', role: 'promo' }],
        specs: 'AMD Ryzen 9 7900\nGeForce RTX 4070 12GB\n64GB DDR5 · 2TB NVMe SSD'
    },
    {
        id: 'demo-prebuilt-004', name: 'Forge Compact Gaming PC', category: 'prebuilt', price: 319000, stock: 1,
        image: './assets/images/pc.jpg', images: ['./assets/images/pc.jpg', './assets/images/setup.jpg'],
        specs: 'AMD Ryzen 5 7600\nGeForce RTX 4060 Ti 8GB\n32GB DDR5 · 1TB NVMe SSD'
    },
    {
        id: 'demo-gpu-001', name: 'ASUS Dual GeForce RTX 4070 SUPER 12GB', category: 'gpu', price: 285000, stock: 2, isFeatured: true,
        image: './assets/images/rtx 4070.jpg', images: ['./assets/images/rtx 4070.jpg', './assets/images/gpu.jpg'],
        specs: '12GB GDDR6X memory\nDLSS 3 · PCI Express 4.0'
    },
    {
        id: 'demo-gpu-002', name: 'MSI GeForce RTX 4060 Ti Ventus 16GB', category: 'gpu', price: 219000, stock: 4,
        image: './assets/images/rtx3060.jpg', images: ['./assets/images/rtx3060.jpg', './assets/images/gpu.jpg'],
        specs: '16GB GDDR6 memory\nDual-fan cooling · PCI Express 4.0'
    },
    {
        id: 'demo-gpu-003', name: 'Gigabyte GeForce RTX 3060 12GB', category: 'gpu', price: 164000, stock: 0,
        image: './assets/images/gpu.jpg', images: ['./assets/images/gpu.jpg', './assets/images/rtx3060.jpg'],
        specs: '12GB GDDR6 memory\nWINDFORCE 2X cooling'
    },
    {
        id: 'demo-gpu-004', name: 'Sapphire Pulse Radeon RX 7800 XT 16GB', category: 'gpu', price: 272000, stock: 1,
        image: './assets/images/rtx 4070.jpg', images: ['./assets/images/rtx 4070.jpg', './assets/images/gpu.jpg'],
        specs: '16GB GDDR6 memory\nDual-X cooling · PCI Express 4.0'
    },
    {
        id: 'demo-cpu-001', name: 'AMD Ryzen 7 7800X3D', category: 'cpu', price: 195000, stock: 2, isFeatured: true,
        image: './assets/images/ryzen.jpg', images: ['./assets/images/ryzen.jpg', './assets/images/images.jpg'],
        specs: '8 cores · 16 threads\nAM5 · 4.2GHz base clock'
    },
    {
        id: 'demo-cpu-002', name: 'AMD Ryzen 5 7600', category: 'cpu', price: 92000, stock: 5,
        image: './assets/images/ryzen.jpg', specs: '6 cores · 12 threads\nAM5 · 65W TDP'
    },
    {
        id: 'demo-cpu-003', name: 'Intel Core i7-14700K', category: 'cpu', price: 178000, stock: 1,
        image: './assets/images/i9.jpg', images: ['./assets/images/i9.jpg', './assets/images/images.jpg'],
        specs: '20 cores · 28 threads\nLGA1700 · Unlocked'
    },
    {
        id: 'demo-cpu-004', name: 'Intel Core i5-14400F', category: 'cpu', price: 86000, stock: 0,
        image: './assets/images/i9.jpg', specs: '10 cores · 16 threads\nLGA1700 · 65W base power'
    },
    {
        id: 'demo-mb-001', name: 'ASUS TUF Gaming B650-PLUS WIFI', category: 'motherboard', price: 95000, stock: 2,
        image: './assets/images/mb.jpg', images: ['./assets/images/mb.jpg', './assets/images/images.jpg'],
        specs: 'AMD B650 · AM5 socket\nDDR5 · Wi-Fi 6 · ATX'
    },
    {
        id: 'demo-mb-002', name: 'MSI B550 Gaming Plus', category: 'motherboard', price: 68000, stock: 3,
        image: './assets/images/mb.jpg', specs: 'AMD B550 · AM4 socket\nDDR4 · ATX · 2x M.2'
    },
    {
        id: 'demo-mb-003', name: 'Gigabyte Z790 UD AX', category: 'motherboard', price: 116000, stock: 1,
        image: './assets/images/mb.jpg', specs: 'Intel Z790 · LGA1700\nDDR5 · Wi-Fi 6E · ATX'
    },
    {
        id: 'demo-mb-004', name: 'MSI PRO H610M-G DDR4', category: 'motherboard', price: 42000, stock: 0,
        image: './assets/images/mb.jpg', specs: 'Intel H610 · LGA1700\nDDR4 · Micro-ATX'
    },
    {
        id: 'demo-ram-001', name: 'Corsair Vengeance 32GB DDR5 6000MHz', category: 'ram', price: 60000, stock: 5,
        image: './assets/images/ram1.jpg', images: ['./assets/images/ram1.jpg', './assets/images/images.jpg'],
        specs: '2x16GB kit · DDR5\n6000MHz · CL36'
    },
    {
        id: 'demo-ram-002', name: 'Kingston Fury Beast 32GB DDR4 3200MHz', category: 'ram', price: 29500, stock: 3,
        image: './assets/images/ram1.jpg', specs: '2x16GB kit · DDR4\n3200MHz · CL16'
    },
    {
        id: 'demo-ram-003', name: 'Crucial Pro 64GB DDR5 5600MHz', category: 'ram', price: 98500, stock: 1,
        image: './assets/images/ram1.jpg', specs: '2x32GB kit · DDR5\n5600MHz · CL46'
    },
    {
        id: 'demo-storage-001', name: 'WD Black SN850X 2TB NVMe SSD', category: 'storage', price: 82500, stock: 2,
        image: './assets/images/ssd.jpg', images: ['./assets/images/ssd.jpg', './assets/images/hdd.jpg'],
        specs: 'PCIe 4.0 x4 · M.2 2280\nUp to 7,300MB/s read'
    },
    {
        id: 'demo-storage-002', name: 'Samsung 990 EVO 1TB NVMe SSD', category: 'storage', price: 51500, stock: 4,
        image: './assets/images/ssd.jpg', specs: 'PCIe 4.0 x4 · M.2 2280\nUp to 5,000MB/s read'
    },
    {
        id: 'demo-storage-003', name: 'Crucial MX500 1TB SATA SSD', category: 'storage', price: 36500, stock: 0,
        image: './assets/images/ssd.jpg', specs: '2.5-inch SATA III\nUp to 560MB/s read'
    },
    {
        id: 'demo-storage-004', name: 'Seagate Barracuda 2TB HDD', category: 'storage', price: 19500, stock: 6,
        image: './assets/images/hdd.jpg', specs: '3.5-inch SATA III\n7200RPM · 256MB cache'
    },
    {
        id: 'demo-psu-001', name: 'Corsair RM850e 850W 80+ Gold', category: 'psu', price: 39500, stock: 2,
        image: './assets/images/pc accessories.webp', specs: 'Fully modular · ATX 3.0\n80 PLUS Gold certified'
    },
    {
        id: 'demo-psu-002', name: 'Cooler Master MWE 650 Bronze V2', category: 'psu', price: 21800, stock: 4,
        image: './assets/images/ pc.jpg', specs: '650W · 80 PLUS Bronze\n120mm HDB fan'
    },
    {
        id: 'demo-case-001', name: 'DeepCool CH560 Digital Airflow Case', category: 'case', price: 37500, stock: 1,
        image_roles: [{ url: './assets/images/desktop.png', role: 'promo' }],
        image: './assets/images/desktop.png', specs: 'Mid-tower · ATX\nFour pre-installed ARGB fans'
    },
    {
        id: 'demo-case-002', name: 'Montech Air 100 ARGB Micro-ATX Case', category: 'case', price: 24800, stock: 3,
        image: './assets/images/pc.jpg', specs: 'Micro-ATX · Tempered glass\nFour pre-installed ARGB fans'
    },
    {
        id: 'demo-keyboard-001', name: 'Redragon K552 Mechanical Keyboard', category: 'keyboard', price: 12800, stock: 0,
        image: './assets/images/keyboard.jpg', images: ['./assets/images/keyboard.jpg', './assets/images/keyboard 1.jpg', './assets/images/keyboard 2.jpg'],
        specs: 'TKL layout · Outemu switches\nRed LED backlight · USB'
    },
    {
        id: 'demo-mouse-001', name: 'Logitech G305 Lightspeed Wireless Mouse', category: 'mouse', price: 18200, stock: 7,
        image: './assets/images/mouse.jpg', images: ['./assets/images/mouse.jpg', './assets/images/mouse 1.jpg', './assets/images/mouse 2.jpg'],
        specs: '12,000 DPI HERO sensor\n2.4GHz wireless · 250-hour battery'
    },
    {
        id: 'demo-headset-001', name: 'HyperX Cloud Stinger 2 Gaming Headset', category: 'headset', price: 26500, stock: 2,
        image: './assets/images/headset 1.jpg', images: ['./assets/images/headset 1.jpg', './assets/images/headset 2.jpg', './assets/images/headset 3.jpg'],
        specs: 'Closed-back over-ear\n50mm drivers · Swivel-to-mute mic'
    }
];
