'use strict';

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const searchInput = document.getElementById('shopSearchInput');
    const searchForm = document.getElementById('shopSearchForm');
    const categoryFilter = document.getElementById('categoryFilter');
    const sortSelect = document.getElementById('sortProducts');
    const productGrid = document.getElementById('productGrid');
    const emptyState = document.getElementById('noProducts');
    const loading = document.getElementById('loading');
    const itemCount = document.getElementById('itemCount');
    const pageTitle = document.getElementById('pageTitle');

    let products = [];
    let category = params.get('cat') || 'all';
    let search = params.get('search') || '';
    let sort = params.get('sort') || 'latest';
    searchInput.value = search;
    categoryFilter.value = category;
    sortSelect.value = ['latest', 'price-asc', 'price-desc'].includes(sort) ? sort : 'latest';
    sort = sortSelect.value;

    const updateUrl = () => {
        const next = new URL(window.location.href);
        category === 'all' ? next.searchParams.delete('cat') : next.searchParams.set('cat', category);
        search ? next.searchParams.set('search', search) : next.searchParams.delete('search');
        sort === 'latest' ? next.searchParams.delete('sort') : next.searchParams.set('sort', sort);
        window.history.replaceState({}, '', next);
    };

    const renderProducts = () => {
        const filtered = window.TkiStorefront.filterProducts(products, { category, search, sort });
        const categoryName = window.TkiStorefront.categoryLabel(category);
        const titles = { prebuilt: 'Prebuilt PCs', gpu: 'GPUs', cpu: 'CPUs', ram: 'RAM', storage: 'Storage', peripherals: 'Accessories', motherboard: 'Motherboards' };
        pageTitle.textContent = search ? 'Search results' : category === 'all' ? 'Hardware' : titles[category] || categoryName;
        document.getElementById('pageDescription').textContent = search ? 'Find the hardware for your next setup.' : category === 'prebuilt' ? 'Gaming desktops ready to order.' : 'Components for your next setup.';
        window.TkiShell?.setActiveCategory(category);
        itemCount.textContent = `${filtered.length} ${filtered.length === 1 ? 'product' : 'products'}${search ? ` matching “${search}”` : ''}`;
        emptyState.hidden = filtered.length > 0;
        productGrid.innerHTML = filtered.map(product => window.TkiStorefront.renderProductCard(product)).join('');
        document.querySelectorAll('[data-category]').forEach(link => {
            const isActive = link.dataset.category === category;
            link.classList.toggle('active', isActive);
            if (isActive) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
        });
        window.TkiStorefront.bindProductCardGalleries(productGrid);
    };

    searchForm.addEventListener('submit', event => {
        event.preventDefault();
        search = searchInput.value.trim();
        updateUrl();
        renderProducts();
    });
    searchInput.addEventListener('input', () => {
        search = searchInput.value.trim();
        updateUrl();
        renderProducts();
    });
    categoryFilter.addEventListener('change', () => {
        category = categoryFilter.value;
        updateUrl();
        renderProducts();
    });
    sortSelect.addEventListener('change', () => {
        sort = sortSelect.value;
        updateUrl();
        renderProducts();
    });
    document.querySelectorAll('[data-category]').forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            category = link.dataset.category;
            categoryFilter.value = category;
            updateUrl();
            renderProducts();
        });
    });

    try {
        products = await window.TkiStorefront.getProducts();
        renderProducts();
    } catch (error) {
        console.error('Unable to load Tki Tec inventory.', error);
        itemCount.textContent = 'Inventory could not be loaded.';
        productGrid.innerHTML = '<p class="store-message" role="alert">Please refresh the page to try again.</p>';
    } finally {
        loading.hidden = true;
    }
});
