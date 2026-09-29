'use strict';

const categories = {
    prebuilt: 'Prebuilt PC', cpu: 'Processor', gpu: 'Graphics card', ram: 'Memory (RAM)',
    storage: 'Storage', motherboard: 'Motherboard', psu: 'Power supply', case: 'PC case',
    cooling: 'Cooling', mouse: 'Mouse', keyboard: 'Keyboard', headset: 'Headset / audio',
    monitor: 'Monitor', accessory: 'Accessories'
};
const $ = selector => document.querySelector(selector);
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const money = value => `${Number(value || 0).toLocaleString('en-DZ', { maximumFractionDigits: 2 })} DZD`;
const safeImage = value => {
    try { const url = new URL(value, location.href); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; }
    catch { return ''; }
};
const state = { products: [], orders: [], page: 1, orderPage: 1, pageSize: 12, ordersLoaded: false };

function showMessage(message, error = false) {
    const element = $('#adminMessage');
    element.textContent = message;
    element.classList.toggle('error', error);
    element.hidden = !message;
}
function responseError(status, data) {
    return status === 401
        ? 'Your admin session is invalid. Log in again before retrying; your form has been kept.'
        : data?.error || `Request failed (${status}). Please try again.`;
}
async function adminRequest(url, options = {}) {
    const response = await fetch(url, { ...options, headers: { ...options.headers, Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}` } });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(responseError(response.status, data));
    if (data === null) throw new Error('The server returned an unreadable response. Refresh and try again.');
    return data;
}
function uploadRequest(url, method, data, onProgress) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('adminToken') || ''}`);
        xhr.upload.onprogress = event => onProgress(event.lengthComputable ? Math.round(event.loaded / event.total * 100) : null);
        xhr.upload.onload = () => onProgress(100);
        xhr.onerror = () => reject(new Error('Connection lost. Your form has been kept; check your connection and retry.'));
        xhr.onabort = () => reject(new Error('Upload cancelled. Your form has been kept.'));
        xhr.onload = () => {
            let result;
            try { result = JSON.parse(xhr.responseText); } catch { result = null; }
            if (xhr.status < 200 || xhr.status >= 300) return reject(new Error(responseError(xhr.status, result)));
            if (!result) return reject(new Error('The server returned an unreadable response. Check inventory before retrying.'));
            resolve(result);
        };
        xhr.send(data);
    });
}

class ProductEditor {
    constructor(host, product = null) {
        this.product = product;
        this.images = [];
        this.dirty = false;
        this.busy = false;
        this.form = $('#formTemplate').content.firstElementChild.cloneNode(true);
        this.form.id = product ? 'editProductForm' : 'productForm';
        host.replaceChildren(this.form);
        this.input = this.form.querySelector('[name=images]');
        this.input.id = product ? 'editProductImages' : 'productImages';
        this.preview = this.form.querySelector('.image-preview');
        if (!product) this.preview.id = 'imagePreview';
        const select = this.form.elements.category;
        for (const [value, label] of Object.entries(categories)) select.add(new Option(label, value));
        if (product) {
            if (!categories[product.category]) select.add(new Option(product.category, product.category));
            for (const key of ['name', 'price', 'stock', 'category', 'specs']) this.form.elements[key].value = product[key] ?? (key === 'stock' ? 0 : '');
            this.form.elements.isFeatured.checked = Boolean(product.isFeatured);
            this.form.querySelector('.submit-button').textContent = 'Save changes';
            const urls = [...new Set(product.images?.length ? product.images : [product.main_image || product.image].filter(Boolean))];
            this.images = urls.map((url, i) => ({ url, label: `image ${i + 1}`, preview: safeImage(url) }));
            const main = this.images.findIndex(image => image.url === (product.main_image || product.image));
            if (main > 0) this.images.unshift(this.images.splice(main, 1)[0]);
        }
        this.form.addEventListener('input', () => { this.dirty = true; });
        this.input.addEventListener('change', () => this.addFiles([...this.input.files]));
        const zone = this.form.querySelector('.drop-zone');
        zone.addEventListener('dragover', event => { event.preventDefault(); if (!this.busy) zone.classList.add('dragging'); });
        zone.addEventListener('dragleave', () => zone.classList.remove('dragging'));
        zone.addEventListener('drop', event => {
            event.preventDefault(); zone.classList.remove('dragging');
            if (!this.busy) this.addFiles([...event.dataTransfer.files]);
        });
        this.preview.addEventListener('click', event => {
            if (this.busy) return;
            const button = event.target.closest('button');
            if (!button) return;
            const index = Number(button.dataset.index);
            if (button.dataset.action === 'remove') {
                const [removed] = this.images.splice(index, 1);
                if (removed.file) URL.revokeObjectURL(removed.preview);
            } else {
                this.images.unshift(this.images.splice(index, 1)[0]);
            }
            this.dirty = true;
            this.renderImages();
        });
        this.form.addEventListener('submit', event => { event.preventDefault(); this.save(); });
        this.renderImages();
    }
    message(text, error = false) {
        const node = this.form.querySelector('.form-message');
        node.textContent = text;
        node.classList.toggle('error', error);
        node.hidden = !text;
    }
    addFiles(files) {
        if (this.busy) return;
        const errors = [];
        for (const file of files) {
            if (!file.type.startsWith('image/')) { errors.push(`${file.name} is not an image.`); continue; }
            if (file.size > 8 * 1024 * 1024) { errors.push(`${file.name} exceeds 8 MB.`); continue; }
            if (this.images.length >= 10) { errors.push('A product can have up to 10 images.'); break; }
            if (this.images.some(image => image.file && image.file.name === file.name && image.file.size === file.size && image.file.lastModified === file.lastModified)) continue;
            this.images.push({ file, label: file.name, preview: URL.createObjectURL(file) });
            this.dirty = true;
        }
        this.message(errors.join(' '), errors.length > 0);
        this.renderImages();
    }
    renderImages() {
        this.preview.innerHTML = this.images.map((image, index) => `
            <div class="preview-item">
                <button type="button" class="thumbnail" data-action="main" data-index="${index}" aria-label="Set ${escapeHTML(image.label)} as main image" aria-pressed="${index === 0}">
                    <img src="${escapeHTML(image.preview)}" alt="${escapeHTML(image.label)}"><span>${index === 0 ? '✓ Main image' : 'Set as main'}</span>
                </button>
                <button type="button" class="remove-image" data-action="remove" data-index="${index}" aria-label="Remove ${escapeHTML(image.label)}">×</button>
            </div>`).join('');
        this.form.querySelector('.gallery-count').textContent = `${this.images.length} / 10`;
        // Keep native file input in sync for retries and assistive technology.
        const transfer = new DataTransfer();
        for (const image of this.images) if (image.file) transfer.items.add(image.file);
        this.input.files = transfer.files;
    }
    data() {
        const data = new FormData(this.form);
        data.delete('images');
        const manifest = [];
        let index = 0;
        for (const image of this.images) {
            if (image.file) {
                data.append('images', image.file);
                manifest.push({ upload: index++ });
            } else manifest.push({ url: image.url });
        }
        if (this.product) data.set('imageManifest', JSON.stringify(manifest));
        return data;
    }
    async save() {
        if (this.busy || !this.form.reportValidity()) return;
        if (!this.images.length) { this.message('Choose at least one product image.', true); this.input.focus(); return; }
        const data = this.data(); // Build before disabling form controls.
        const button = this.form.querySelector('.submit-button');
        this.busy = true;
        this.form.querySelector('fieldset').disabled = true;
        button.textContent = this.product ? 'Saving…' : 'Publishing…';
        this.form.querySelector('.upload-progress').hidden = false;
        const updateProgress = percent => {
            const progress = this.form.querySelector('progress');
            if (percent === null || percent === 100) progress.removeAttribute('value');
            else progress.value = percent;
            this.form.querySelector('.progress-text').textContent = percent === 100 ? 'Saving product…' : 'Uploading images…';
            this.form.querySelector('.progress-percent').textContent = percent === null || percent === 100 ? '' : `${percent}%`;
        };
        updateProgress(this.images.some(image => image.file) ? 0 : 100);
        this.message('');
        try {
            const updated = await uploadRequest(this.product ? `/api/products/${encodeURIComponent(this.product.id)}` : '/api/products', this.product ? 'PATCH' : 'POST', data, updateProgress);
            this.dirty = false;
            const success = this.product ? 'Product changes saved.' : 'Product published successfully.';
            showMessage(success);
            this.message(success);
            if (this.product) {
                const position = state.products.findIndex(product => String(product.id) === String(this.product.id));
                if (position >= 0) state.products[position] = updated;
                renderProducts();
                $('#editDialog').close();
            } else {
                this.disposeImages();
                this.form.reset();
                this.renderImages();
                if ($('#createDialog').open) $('#createDialog').close();
            }
            await refreshProducts();
        } catch (error) {
            const message = `${this.product ? 'Changes were not saved' : 'Product was not published'}: ${error.message}`;
            this.message(message, true);
            showMessage(message, true);
        } finally {
            this.busy = false;
            this.form.querySelector('fieldset').disabled = false;
            button.textContent = this.product ? 'Save changes' : 'Publish Product';
            this.form.querySelector('.upload-progress').hidden = true;
        }
    }
    disposeImages() {
        for (const image of this.images) if (image.file) URL.revokeObjectURL(image.preview);
        this.images = [];
    }
}

function renderProducts() {
    const query = $('#productSearch').value.trim().toLocaleLowerCase();
    const category = $('#categoryFilter').value;
    const filtered = state.products.filter(product => (category === 'all' || product.category === category) && `${product.name} ${product.specs || ''}`.toLocaleLowerCase().includes(query));
    const pages = Math.max(1, Math.ceil(filtered.length / state.pageSize));
    state.page = Math.min(state.page, pages);
    const start = (state.page - 1) * state.pageSize;
    $('#productCount').textContent = `${state.products.length} product${state.products.length === 1 ? '' : 's'}`;
    $('#invList').innerHTML = filtered.slice(start, start + state.pageSize).map(product => `
        <article class="product-card">
            <div class="product-image"><img src="${escapeHTML(safeImage(product.main_image || product.image))}" alt="${escapeHTML(product.name)}" loading="lazy">${product.isFeatured ? '<span class="featured-badge">★ Featured</span>' : ''}</div>
            <div class="product-info"><h3 title="${escapeHTML(product.name)}">${escapeHTML(product.name)}</h3><p class="product-price">${money(product.price)}</p>
                <div class="product-meta"><span>${escapeHTML(categories[product.category] || product.category)}</span><span>${Number(product.stock) || 0} in stock</span></div>
                <p class="product-desc">${escapeHTML(product.specs || 'No description added.')}</p>
                <div class="card-actions"><button class="button" data-edit="${escapeHTML(product.id)}" aria-label="Edit ${escapeHTML(product.name)}">Edit</button><button class="button danger" data-delete="${escapeHTML(product.id)}" aria-label="Delete ${escapeHTML(product.name)}">Delete</button></div>
            </div>
        </article>`).join('');
    const empty = $('#inventoryState');
    empty.hidden = filtered.length > 0;
    empty.innerHTML = state.products.length ? '<span class="empty-symbol" aria-hidden="true">⌕</span><h3>No matching products</h3><p>Try a different search or category.</p>' : '<span class="empty-symbol" aria-hidden="true">▦</span><h3>Your inventory starts here</h3><p>Add your first product to publish it in your store.</p>';
    $('#pageSummary').textContent = filtered.length ? `Showing ${start + 1}–${Math.min(start + state.pageSize, filtered.length)} of ${filtered.length} products` : '0 products';
    $('#pageNumber').textContent = `${state.page} / ${pages}`;
    $('#prevPage').disabled = state.page === 1;
    $('#nextPage').disabled = state.page === pages;
}
let productLoading = false;
async function refreshProducts() {
    if (productLoading) return;
    productLoading = true;
    $('#refreshProducts').disabled = true;
    try {
        const products = await adminRequest('/api/products');
        if (!Array.isArray(products)) throw new Error('The server returned an invalid inventory.');
        state.products = products;
        renderProducts();
    } catch (error) {
        showMessage(`Could not refresh inventory: ${error.message}`, true);
        if (!state.products.length) {
            $('#inventoryState').hidden = false;
            $('#inventoryState').innerHTML = '<h3>Inventory could not load</h3><p>Use Refresh to try again.</p>';
        }
    } finally { productLoading = false; $('#refreshProducts').disabled = false; }
}

let confirmResolve;
function confirmAction(title, text, action) {
    $('#confirmTitle').textContent = title;
    $('#confirmText').textContent = text;
    $('#acceptConfirm').textContent = action;
    $('#confirmDialog').showModal();
    $('#cancelConfirm').focus();
    return new Promise(resolve => { confirmResolve = resolve; });
}
$('#cancelConfirm').onclick = () => $('#confirmDialog').close('cancel');
$('#acceptConfirm').onclick = () => $('#confirmDialog').close('accept');
$('#confirmDialog').addEventListener('close', () => { confirmResolve?.($('#confirmDialog').returnValue === 'accept'); confirmResolve = null; });
$('#confirmDialog').addEventListener('cancel', () => { $('#confirmDialog').returnValue = 'cancel'; });

let editEditor = null;
const createEditor = new ProductEditor($('#createHost'));
function openEdit(product) {
    editEditor?.disposeImages();
    editEditor = new ProductEditor($('#editHost'), product);
    $('#editDialog').showModal();
    editEditor.form.elements.name.focus();
}
async function closeEditor(dialog, editor) {
    if (editor?.busy) return;
    if (editor?.dirty && !await confirmAction('Discard changes?', 'Your unsaved changes will be lost.', 'Discard changes')) return;
    if (editor === createEditor && editor.dirty) {
        editor.disposeImages(); editor.form.reset(); editor.renderImages(); editor.dirty = false; editor.message('');
    }
    dialog.close();
}
$('#closeEdit').onclick = () => closeEditor($('#editDialog'), editEditor);
$('#closeCreate').onclick = () => closeEditor($('#createDialog'), createEditor);
$('#editDialog').addEventListener('cancel', event => { event.preventDefault(); closeEditor($('#editDialog'), editEditor); });
$('#createDialog').addEventListener('cancel', event => { event.preventDefault(); closeEditor($('#createDialog'), createEditor); });
$('#editDialog').addEventListener('close', () => editEditor?.disposeImages());
$('#openCreate').onclick = () => { $('#mobileCreateHost').append(createEditor.form); $('#createDialog').showModal(); createEditor.form.elements.name.focus(); };
$('#createDialog').addEventListener('close', () => $('#createHost').append(createEditor.form));
$('#invList').addEventListener('click', async event => {
    const edit = event.target.closest('[data-edit]');
    if (edit) return openEdit(state.products.find(product => String(product.id) === edit.dataset.edit));
    const button = event.target.closest('[data-delete]');
    if (!button || button.disabled) return;
    const product = state.products.find(item => String(item.id) === button.dataset.delete);
    if (!await confirmAction('Delete product?', `“${product.name}” and its images will be permanently removed.`, 'Delete product')) return;
    button.disabled = true;
    try {
        await adminRequest(`/api/products/${encodeURIComponent(product.id)}`, { method: 'DELETE' });
        state.products = state.products.filter(item => item !== product);
        renderProducts(); showMessage('Product deleted.');
    } catch (error) { showMessage(`Could not delete product: ${error.message}`, true); button.disabled = false; }
});
for (const [value, label] of Object.entries(categories)) $('#categoryFilter').add(new Option(label, value));
$('#productSearch').oninput = () => { state.page = 1; renderProducts(); };
$('#categoryFilter').onchange = () => { state.page = 1; renderProducts(); };
$('#prevPage').onclick = () => { state.page--; renderProducts(); $('#inventoryTitle').scrollIntoView({ block: 'nearest' }); };
$('#nextPage').onclick = () => { state.page++; renderProducts(); $('#inventoryTitle').scrollIntoView({ block: 'nearest' }); };
$('#refreshProducts').onclick = refreshProducts;

function renderOrders() {
    const query = $('#orderSearch').value.trim().toLocaleLowerCase();
    const filtered = state.orders.filter(order => `${order.id} ${order.customerName} ${order.customerEmail} ${order.phone} ${order.items}`.toLocaleLowerCase().includes(query));
    const pages = Math.max(1, Math.ceil(filtered.length / state.pageSize));
    state.orderPage = Math.min(state.orderPage, pages);
    const start = (state.orderPage - 1) * state.pageSize;
    $('#orderCount').textContent = `${filtered.length} orders`;
    $('#ordersState').hidden = filtered.length > 0;
    $('#ordersState').textContent = query ? 'No orders match your search.' : 'No orders yet. New customer purchases will appear here.';
    $('#orderList').innerHTML = filtered.slice(start, start + state.pageSize).map(order => {
        const date = new Date(order.date);
        return `<article class="order-card"><header><div><h3>Order #${escapeHTML(order.id)}</h3><p>${Number.isNaN(date.getTime()) ? 'Date unavailable' : escapeHTML(date.toLocaleString())}</p></div><button class="button danger" data-order-delete="${escapeHTML(order.id)}" aria-label="Remove order ${escapeHTML(order.id)}">Remove order</button></header>
            <dl><div><dt>Customer</dt><dd>${escapeHTML(order.customerName)}<br>${escapeHTML(order.customerEmail)}<br>${escapeHTML(order.phone)}</dd></div>
            <div><dt>Delivery</dt><dd>${escapeHTML(order.wilaya)}<br>${escapeHTML(order.address)}<br>${escapeHTML(order.deliveryType)}</dd></div>
            <div><dt>Items</dt><dd>${escapeHTML(order.items)}</dd></div><div><dt>Total</dt><dd><strong class="order-total">${money(order.total)}</strong></dd></div></dl></article>`;
    }).join('');
    $('#orderPageSummary').textContent = filtered.length ? `Showing ${start + 1}–${Math.min(start + state.pageSize, filtered.length)} of ${filtered.length} orders` : '0 orders';
    $('#orderPageNumber').textContent = `${state.orderPage} / ${pages}`;
    $('#prevOrders').disabled = state.orderPage === 1;
    $('#nextOrders').disabled = state.orderPage === pages;
}
let ordersLoading = false;
async function refreshOrders() {
    if (ordersLoading) return;
    ordersLoading = true;
    $('#refreshOrders').disabled = true;
    try {
        const data = await adminRequest('/api/admin/stats');
        if (!Array.isArray(data.orders)) throw new Error('The server returned invalid orders.');
        state.orders = data.orders; state.ordersLoaded = true;
        $('#totalOrders').textContent = data.totalOrders;
        $('#totalRevenue').textContent = money(data.totalRevenue);
        renderOrders();
    } catch (error) {
        showMessage(`Could not refresh orders: ${error.message}`, true);
        $('#ordersState').hidden = false;
        $('#ordersState').textContent = 'Orders could not load. Use Refresh orders to try again.';
    } finally { ordersLoading = false; $('#refreshOrders').disabled = false; }
}
$('#orderSearch').oninput = () => { state.orderPage = 1; renderOrders(); };
$('#prevOrders').onclick = () => { state.orderPage--; renderOrders(); };
$('#nextOrders').onclick = () => { state.orderPage++; renderOrders(); };
$('#refreshOrders').onclick = refreshOrders;
$('#orderList').addEventListener('click', async event => {
    const button = event.target.closest('[data-order-delete]');
    if (!button || button.disabled) return;
    if (!await confirmAction('Remove order?', 'This permanently removes the order record and adjusts sales totals.', 'Remove order')) return;
    button.disabled = true;
    try {
        await adminRequest(`/api/orders/${encodeURIComponent(button.dataset.orderDelete)}`, { method: 'DELETE' });
        await refreshOrders(); showMessage('Order removed.');
    } catch (error) { showMessage(`Could not remove order: ${error.message}`, true); button.disabled = false; }
});
function selectTab(name) {
    for (const tab of ['products', 'orders']) {
        $(`#${tab}Tab`).setAttribute('aria-selected', String(tab === name));
        $(`#${tab}Tab`).tabIndex = tab === name ? 0 : -1;
        $(`#${tab}View`).hidden = tab !== name;
    }
    if (name === 'orders' && !state.ordersLoaded) refreshOrders();
}
$('#productsTab').onclick = () => selectTab('products');
$('#ordersTab').onclick = () => selectTab('orders');
$('.tabs').addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const name = event.key === 'Home' ? 'products' : event.key === 'End' ? 'orders' : $('#productsTab').getAttribute('aria-selected') === 'true' ? 'orders' : 'products';
    selectTab(name); $(`#${name}Tab`).focus();
});
window.addEventListener('beforeunload', event => {
    if (createEditor.dirty || createEditor.busy || ($('#editDialog').open && (editEditor?.dirty || editEditor?.busy))) { event.preventDefault(); event.returnValue = ''; }
});
refreshProducts();
