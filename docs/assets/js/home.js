'use strict';

document.addEventListener('DOMContentLoaded', async () => {
    const contactUrl = window.createWhatsAppOrderUrl('Hello, I would like to ask about your PC hardware.');
    document.querySelectorAll('[data-whatsapp-contact]').forEach(link => { link.href = contactUrl; });

    const prebuiltGrid = document.getElementById('prebuiltProducts');
    const componentGrid = document.getElementById('componentProducts');

    try {
        const products = await window.TkiStorefront.getProducts();

        const prebuiltProducts = window.TkiStorefront.filterProducts(products, { category: 'prebuilt' });
        const componentProducts = products.filter(product => String(product.category || '').toLowerCase() !== 'prebuilt');

        const renderGrid = (inventory, label) => `<div class="homepage-product-grid${inventory.length < 4 ? ' homepage-product-grid--sparse' : ''}" aria-label="${label}">${inventory.slice(0, 8).map((product, index) => window.TkiStorefront.renderProductCard(product, { eager: index === 0 })).join('')}</div>`;
        prebuiltGrid.innerHTML = prebuiltProducts.length
            ? window.TkiStorefront.renderProductShelf(prebuiltProducts, { label: 'Featured gaming PCs' })
            : '<p class="store-message">No PCs available. <a href="#components" class="text-link">Browse components</a></p>';
        componentGrid.innerHTML = componentProducts.length
            ? renderGrid(componentProducts, 'Components')
            : '<p class="store-message">No components available.</p>';

        window.TkiStorefront.bindProductCardGalleries(prebuiltGrid);
        window.TkiStorefront.bindProductShelves(prebuiltGrid);
        window.TkiStorefront.bindProductCardGalleries(componentGrid);
    } catch (error) {
        console.error('Unable to load Tki Tec products.', error);
        prebuiltGrid.innerHTML = '<p class="store-message" role="alert">Prebuilt PCs could not be loaded. Please try again shortly.</p>';
        componentGrid.innerHTML = '<p class="store-message" role="alert">Components could not be loaded. Please try again shortly.</p>';
    }
});
