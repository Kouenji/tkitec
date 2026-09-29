'use strict';

document.addEventListener('DOMContentLoaded', async () => {
    const contactUrl = window.createWhatsAppOrderUrl('Hello, I would like to ask about your PC hardware.');
    document.querySelectorAll('[data-whatsapp-contact]').forEach(link => { link.href = contactUrl; });

    const prebuiltGrid = document.getElementById('prebuiltProducts');
    const componentGrid = document.getElementById('componentProducts');
    const heroImage = document.getElementById('heroProductImage');
    const heroLink = document.getElementById('heroProductLink');
    const heroProduct = document.querySelector('.hero-product');

    try {
        const products = await window.TkiStorefront.getProducts();

        const featured = products.filter(product => product.isFeatured === true || product.isFeatured === 'true');
        const leadProduct = featured[0] || products[0];

        if (leadProduct && window.TkiStorefront.productImages(leadProduct)[0]) {
            const heroImageUrl = window.TkiStorefront.productImages(leadProduct)[0];
            heroProduct.classList.toggle('hero-product--prebuilt', String(leadProduct.category || '').toLowerCase() === 'prebuilt');
            heroImage.src = heroImageUrl;
            window.TkiStorefront.bindProductImages(heroProduct);
            heroImage.alt = leadProduct.name || 'Featured Tki Tec hardware';
            heroLink.href = `product.html?id=${encodeURIComponent(String(leadProduct.id || ''))}`;
            document.getElementById('heroProductName').textContent = leadProduct.name || 'Featured hardware';
            document.getElementById('heroProductPrice').textContent = window.TkiStorefront.formatPrice(leadProduct.price);
        } else {
            heroProduct.hidden = true;
        }

        const prebuiltProducts = window.TkiStorefront.filterProducts(products, { category: 'prebuilt' });
        const componentProducts = products.filter(product => String(product.category || '').toLowerCase() !== 'prebuilt');

        prebuiltGrid.innerHTML = prebuiltProducts.length
            ? window.TkiStorefront.renderProductShelf(prebuiltProducts.slice(0, 8), { label: 'Prebuilt PCs' })
            : '<p class="store-message">No PCs available. <a href="#components" class="text-link">Browse components</a></p>';
        componentGrid.innerHTML = componentProducts.length
            ? window.TkiStorefront.renderProductShelf(componentProducts.slice(0, 8), { label: 'Components in stock' })
            : '<p class="store-message">No components available.</p>';

        window.TkiStorefront.bindProductCardGalleries(prebuiltGrid);
        window.TkiStorefront.bindProductCardGalleries(componentGrid);
        window.TkiStorefront.bindProductShelves(prebuiltGrid);
        window.TkiStorefront.bindProductShelves(componentGrid);
    } catch (error) {
        console.error('Unable to load Tki Tec products.', error);
        prebuiltGrid.innerHTML = '<p class="store-message" role="alert">Prebuilt PCs could not be loaded. Please try again shortly.</p>';
        componentGrid.innerHTML = '<p class="store-message" role="alert">Components could not be loaded. Please try again shortly.</p>';
    }
});
