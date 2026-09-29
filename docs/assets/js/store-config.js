'use strict';

window.TKI_STORE_CONFIG = Object.freeze({
    whatsappNumber: '213540993181'
});

window.createWhatsAppOrderUrl = function(message) {
    const number = window.TKI_STORE_CONFIG.whatsappNumber.replace(/\D/g, '');
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
};

window.createProductOrderMessage = function(product, quantity = 1) {
    const lines = [
        'Hello, I want to order:',
        `Product: ${product.name}`
    ];
    if (quantity > 1) lines.push(`Quantity: ${quantity}`);
    lines.push(`Price: ${Number(product.price).toLocaleString('en-US')} DZD`);
    return lines.join('\n');
};

window.createBuildOrderMessage = function(build) {
    return [
        'Hello, I want to order a custom PC:',
        build.specs,
        `Total Price: ${Number(build.price).toLocaleString('en-US')} DZD`
    ].filter(Boolean).join('\n');
};
