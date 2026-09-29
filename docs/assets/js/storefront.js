'use strict';

(function() {
    const categoryNames = {
        cpu: 'CPU',
        gpu: 'GPU',
        motherboard: 'Motherboard',
        ram: 'RAM',
        storage: 'Storage',
        psu: 'Power supply',
        case: 'PC case',
        prebuilt: 'Prebuilt PC',
        mouse: 'Mouse',
        keyboard: 'Keyboard',
        headset: 'Headset',
        monitor: 'Monitor',
        accessory: 'Accessory'
    };

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, character => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[character]);
    }

    function formatPrice(price) {
        return `${Number(price || 0).toLocaleString('en-US')} DZD`;
    }

    function isDemoPreviewEnabled() {
        try {
            const requestedMode = new URLSearchParams(window.location.search).get('preview');
            if (requestedMode === 'demo') window.sessionStorage.setItem('tki-storefront-preview', 'demo');
            if (requestedMode === 'live') window.sessionStorage.removeItem('tki-storefront-preview');
            return window.sessionStorage.getItem('tki-storefront-preview') === 'demo';
        } catch {
            return false;
        }
    }

    function showDemoPreviewNotice() {
        if (document.querySelector('.demo-preview-banner')) return;
        const notice = document.createElement('aside');
        notice.className = 'demo-preview-banner';
        notice.setAttribute('role', 'status');
        notice.innerHTML = '<strong>DEMO PREVIEW</strong><span>30 sample products; not live inventory.</span><a href="index.html?preview=live">Exit preview</a>';
        document.body.prepend(notice);
    }

    async function getProducts() {
        if (isDemoPreviewEnabled()) {
            if (!Array.isArray(window.TkiDemoProducts)) throw new Error('Demo product fixture is unavailable');
            showDemoPreviewNotice();
            return window.TkiDemoProducts;
        }

        const response = await fetch('/api/products');
        if (!response.ok) throw new Error(`Product request failed (${response.status})`);
        const products = await response.json();
        if (!Array.isArray(products)) throw new Error('Product response was not a list');
        return products;
    }

    function productImages(product, { includePromotional = true } = {}) {
        const images = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
        const explicitMain = product.main_image || product.image || '';
        const allImages = [...new Set([explicitMain, product.image, ...images].filter(Boolean))];
        const imageRoles = new Map((Array.isArray(product.image_roles) ? product.image_roles : [])
            .filter(entry => entry && entry.url && entry.role)
            .map(entry => [String(entry.url), String(entry.role).toLowerCase().trim().replace(/^promotional$/, 'promo')]));

        if (!imageRoles.size) return allImages;

        const roleRank = role => role === 'main' ? 0 : role === 'clean' ? 1 : role === 'promo' ? 3 : 2;
        const ordered = allImages.map((url, index) => ({ url, index, role: imageRoles.get(String(url)) || 'gallery' }))
            .filter(image => includePromotional || image.role !== 'promo');
        ordered.sort((first, second) => roleRank(first.role) - roleRank(second.role) || first.index - second.index);

        const explicitMainRole = imageRoles.get(String(explicitMain));
        const preferredMain = product.main_image && explicitMainRole !== 'promo'
            ? product.main_image
            : ordered.find(image => image.role === 'main')?.url
                || (explicitMain && explicitMainRole !== 'promo' ? explicitMain : '')
                || ordered.find(image => image.role !== 'promo')?.url || ordered[0]?.url;

        return [preferredMain, ...ordered.map(image => image.url).filter(url => url !== preferredMain)].filter(Boolean);
    }

    function categoryLabel(category) {
        const key = String(category || '').toLowerCase();
        return categoryNames[key] || key.replace(/[_-]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase()) || 'Hardware';
    }

    function isDemoProduct(product) {
        return String(product?.id || '').startsWith('demo-');
    }

    function filterProducts(products, options = {}) {
        const category = String(options.category || 'all').toLowerCase();
        const searchTerms = String(options.search || '').toLowerCase().trim().split(/\s+/).filter(Boolean);
        const peripheralCategories = new Set(['mouse', 'keyboard', 'headset', 'monitor', 'accessory', 'accessories', 'peripheral']);
        const filtered = (Array.isArray(products) ? products : []).filter(product => {
            const productCategory = String(product.category || '').toLowerCase();
            const matchesCategory = category === 'all' || productCategory === category || (category === 'peripherals' && peripheralCategories.has(productCategory));
            const searchable = `${product.name || ''} ${product.category || ''} ${product.specs || ''}`.toLowerCase();
            return matchesCategory && searchTerms.every(term => searchable.includes(term));
        });

        if (options.sort === 'price-asc') filtered.sort((first, second) => Number(first.price) - Number(second.price));
        if (options.sort === 'price-desc') filtered.sort((first, second) => Number(second.price) - Number(first.price));
        return filtered;
    }

    function renderProductCard(product, options = {}) {
        const name = escapeHtml(product.name || 'Hardware product');
        const category = escapeHtml(categoryLabel(product.category));
        const images = productImages(product, { includePromotional: false });
        const mainImage = images[0] || '';
        const stockAvailable = Number(product.stock) > 0;
        const prebuiltProduct = String(product.category || '').toLowerCase() === 'prebuilt';
        const cardClass = prebuiltProduct ? 'product-card--prebuilt' : 'product-card--component';
        const imageClass = prebuiltProduct ? 'product-card__image-frame--photo' : 'product-card__image-frame--packshot';
        const firstSpec = String(product.specs || 'Tki Tec verified hardware').split(/\r?\n/)[0].trim();
        const shortSpec = firstSpec.length > 112 ? `${firstSpec.slice(0, 109)}...` : firstSpec;
        const demoProduct = isDemoProduct(product);
        const detailUrl = `product.html?id=${encodeURIComponent(String(product.id || ''))}`;
        const orderMessage = window.createProductOrderMessage(product, options.quantity || 1);
        const orderUrl = window.createWhatsAppOrderUrl(orderMessage);
        const orderAction = isDemoProduct(product)
            ? `<span class="product-card__order product-card__order--preview" aria-disabled="true"><ion-icon name="eye-outline" aria-hidden="true"></ion-icon><span>Preview only</span></span>`
            : `<a class="product-card__order" href="${orderUrl}" target="_blank" rel="noopener noreferrer"${stockAvailable ? '' : ' aria-disabled="true"'}>
                        <ion-icon name="logo-whatsapp" aria-hidden="true"></ion-icon>
                        <span>${stockAvailable ? 'Order via WhatsApp' : 'Ask about availability'}</span>
                    </a>`;
        const thumbnails = images.map((image, index) => `
            <button class="product-card__thumb${index === 0 ? ' is-active' : ''}" type="button"
                data-gallery-src="${escapeHtml(image)}" aria-label="Show ${name}, image ${index + 1}"
                aria-pressed="${index === 0}">
                <img src="${escapeHtml(image)}" alt="" loading="lazy" decoding="async">
            </button>`).join('');

        return `
            <article class="product-card ${cardClass}">
                <div class="product-card__media">
                    <a class="product-card__image-link" href="${detailUrl}" aria-label="View ${name} details">
                        <figure class="product-card__image-frame ${imageClass} photo-stage">
                            <span class="photo-stage__placeholder"${mainImage ? ' hidden' : ''}>Photo unavailable</span>
                            <img class="product-card__image" ${mainImage ? `src="${escapeHtml(mainImage)}"` : ''} alt="${name}"
                                loading="${options.eager ? 'eager' : 'lazy'}" decoding="async"
                                ${options.eager ? 'fetchpriority="high"' : ''}>
                        </figure>
                    </a>
                    ${images.length > 1 ? `<div class="product-card__gallery" aria-label="${name} image gallery">${thumbnails}</div>` : '<div class="product-card__gallery" aria-hidden="true"></div>'}
                </div>
                <div class="product-card__content">
                    <span class="product-card__category">${category}</span>
                    <${demoProduct ? 'div' : 'a'} class="product-card__title-link${demoProduct ? ' product-card__title-link--preview' : ''}"${demoProduct ? '' : ` href="${detailUrl}"`}><h3 class="product-card__title">${name}</h3></${demoProduct ? 'div' : 'a'}>
                    <p class="product-card__price">${formatPrice(product.price)}</p>
                    <p class="product-card__stock ${stockAvailable ? 'is-available' : 'is-unavailable'}">
                        <span aria-hidden="true"></span>${stockAvailable ? 'Available' : 'Out of stock'}
                    </p>
                    <p class="product-card__specs">${escapeHtml(shortSpec)}</p>
                    ${orderAction}
                </div>
            </article>`;
    }

    function renderProductShelf(products, options = {}) {
        const label = escapeHtml(options.label || 'Products');
        const cards = (Array.isArray(products) ? products : [])
            .map((product, index) => renderProductCard(product, { eager: index === 0 }))
            .join('');

        return `
            <div class="product-shelf" data-product-shelf aria-label="${label}">
                <div class="product-shelf__track product-grid" data-shelf-track tabindex="0" aria-label="Swipe through ${label.toLowerCase()}">
                    ${cards || '<p class="store-message">No products are available right now.</p>'}
                </div>
                <div class="product-shelf__footer">
                    <progress class="product-shelf__progress" data-shelf-progress max="100" value="0" aria-label="${label} scroll progress"></progress>
                    <div class="product-shelf__controls">
                        <button type="button" class="product-shelf__control" data-shelf-direction="-1" aria-label="Previous ${label.toLowerCase()}" disabled>
                            <ion-icon name="arrow-back-outline" aria-hidden="true"></ion-icon>
                        </button>
                        <button type="button" class="product-shelf__control" data-shelf-direction="1" aria-label="Next ${label.toLowerCase()}" disabled>
                            <ion-icon name="arrow-forward-outline" aria-hidden="true"></ion-icon>
                        </button>
                    </div>
                </div>
            </div>`;
    }

    function bindProductShelves(container) {
        if (!container) return;
        container.querySelectorAll('[data-product-shelf]').forEach(shelf => {
            if (shelf.dataset.shelfBound) return;
            shelf.dataset.shelfBound = 'true';
            const track = shelf.querySelector('[data-shelf-track]');
            const progress = shelf.querySelector('[data-shelf-progress]');
            const controls = [...shelf.querySelectorAll('[data-shelf-direction]')];
            if (!track) return;

            const updateState = () => {
                const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
                if (progress) progress.value = maxScroll ? Math.round(track.scrollLeft / maxScroll * 100) : 0;
                controls.forEach(button => {
                    const direction = Number(button.dataset.shelfDirection);
                    button.disabled = maxScroll === 0 || (direction < 0 ? track.scrollLeft <= 1 : track.scrollLeft >= maxScroll - 1);
                });
            };

            controls.forEach(button => button.addEventListener('click', () => {
                const firstCard = track.querySelector('.product-card');
                const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
                const distance = firstCard ? firstCard.getBoundingClientRect().width + gap : track.clientWidth;
                const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
                track.scrollBy({ left: distance * Number(button.dataset.shelfDirection), behavior: reducedMotion ? 'auto' : 'smooth' });
            }));
            track.addEventListener('scroll', updateState, { passive: true });
            if ('ResizeObserver' in window) new ResizeObserver(updateState).observe(track);
            updateState();
        });
    }

    function bindTouchSwipe(element, onSwipe) {
        if (!element || typeof onSwipe !== 'function') return;
        let startX = 0;
        let startY = 0;
        let active = false;
        element.addEventListener('touchstart', event => {
            if (event.touches.length !== 1) return;
            startX = event.touches[0].clientX;
            startY = event.touches[0].clientY;
            active = true;
        }, { passive: true });
        element.addEventListener('touchend', event => {
            if (!active || !event.changedTouches.length) return;
            active = false;
            const deltaX = event.changedTouches[0].clientX - startX;
            const deltaY = event.changedTouches[0].clientY - startY;
            if (Math.abs(deltaX) < 44 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return;
            onSwipe(deltaX < 0 ? 1 : -1);
        }, { passive: true });
        element.addEventListener('touchcancel', () => { active = false; }, { passive: true });
    }

    function bindProductCardGalleries(container) {
        bindProductImages(container);
        if (!container || container.dataset.galleryBound) return;
        container.dataset.galleryBound = 'true';
        container.addEventListener('click', event => {
            const thumbnail = event.target.closest('.product-card__thumb');
            if (!thumbnail || !container.contains(thumbnail)) return;
            const card = thumbnail.closest('.product-card');
            const image = card?.querySelector('.product-card__image');
            if (!image) return;
            setProductImage(image, thumbnail.dataset.gallerySrc);
            card.querySelectorAll('.product-card__thumb').forEach(button => {
                const isActive = button === thumbnail;
                button.classList.toggle('is-active', isActive);
                button.setAttribute('aria-pressed', String(isActive));
            });
        });
    }

    // Observe only presentation state; original image URLs and pixels are untouched.
    function bindProductImages(container) {
        if (!container) return;
        container.querySelectorAll('.photo-stage > img').forEach(image => {
            if (image.dataset.photoBound) return;
            image.dataset.photoBound = 'true';
            const stage = image.closest('.photo-stage');
            const update = () => {
                const ready = Boolean(image.getAttribute('src')) && image.complete && image.naturalWidth > 0;
                const failed = !image.getAttribute('src') || (image.complete && !image.naturalWidth);
                stage.dataset.photoState = ready ? 'ready' : failed ? 'error' : 'loading';
                stage.setAttribute('aria-busy', String(!ready && !failed));
                const placeholder = stage.querySelector('.photo-stage__placeholder');
                if (placeholder) placeholder.hidden = !failed;
            };
            image.addEventListener('load', update);
            image.addEventListener('error', update);
            update();
        });
    }

    function setProductImage(image, source) {
        const stage = image.closest('.photo-stage');
        if (stage) {
            stage.dataset.photoState = 'loading';
            stage.setAttribute('aria-busy', 'true');
            const placeholder = stage.querySelector('.photo-stage__placeholder');
            if (placeholder) placeholder.hidden = true;
        }
        image.src = source;
    }

    window.TkiStorefront = Object.freeze({
        escapeHtml,
        formatPrice,
        getProducts,
        isDemoProduct,
        productImages,
        categoryLabel,
        filterProducts,
        renderProductCard,
        renderProductShelf,
        bindProductShelves,
        bindTouchSwipe,
        bindProductImages,
        setProductImage,
        bindProductCardGalleries
    });
})();
