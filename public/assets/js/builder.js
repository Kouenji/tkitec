document.addEventListener('DOMContentLoaded', async () => {
    const modalOverlay = document.getElementById('modalOverlay');
    const dynamicList = document.getElementById('dynamicItemsList');
    const totalPriceDisplay = document.getElementById('total-price');
    const closeBtn = document.querySelector('.close-modal'); // Select the X button
    
    let allProducts = [];
    let currentCategory = '';
    
    // 1. Initial State
    let buildSelections = {
        cpu: { name: 'None', price: 0 },
        gpu: { name: 'None', price: 0 },
        ram: { name: 'None', price: 0 },
        storage: { name: 'None', price: 0 },
        motherboard: { name: 'None', price: 0 },
        cooling: { name: 'None', price: 0 },
        case: { name: 'None', price: 0 },
        psu: { name: 'None', price: 0 }
    };

    // 2. Fetch Products
    try {
        const res = await fetch('/api/products');
        allProducts = await res.json();
    } catch (e) { console.error("Database connection failed"); }

    // 3. OPEN MODAL & FILTER
    document.querySelectorAll('.open-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentCategory = btn.dataset.target;
            document.getElementById('modalTitle').innerText = "Select " + currentCategory.toUpperCase();
            
            const filteredItems = allProducts.filter(p => p.category.toLowerCase() === currentCategory);
            
            if(filteredItems.length === 0) {
                dynamicList.innerHTML = `<p style="text-align:center; padding:20px; color:#8b949e;">No ${currentCategory} found in shop inventory.</p>`;
            } else {
                dynamicList.innerHTML = filteredItems.map(p => `
                    <button class="modal-item" onclick="selectComponent('${p.name.replace(/'/g, "\\'")}', ${p.price})">
                        <div style="display:flex; align-items:center; gap:10px">
                            <img src="${p.image}" style="width:40px; height:40px; object-fit:contain; background:white; border-radius:4px;">
                            <span>${p.name}</span>
                        </div>
                        <strong>${p.price.toLocaleString()} DZD</strong>
                    </button>
                `).join('');
            }
            modalOverlay.classList.add('active');
        });
    });

    // --- 4. CLOSE MODAL LOGIC (THE FIX) ---
    
    // Close when X is clicked
    if (closeBtn) {
        closeBtn.onclick = () => modalOverlay.classList.remove('active');
    }

    // Close when clicking outside the modal content
    window.onclick = (event) => {
        if (event.target == modalOverlay) {
            modalOverlay.classList.remove('active');
        }
    };

    // Close when pressing 'Escape' key
    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape") modalOverlay.classList.remove('active');
    });

    // --- 5. SELECTION & TOTALS ---

    window.selectComponent = (name, price) => {
        buildSelections[currentCategory] = { name, price };
        document.getElementById(`selected-${currentCategory}-name`).innerText = name;
        modalOverlay.classList.remove('active');
        updateTotal();
    };

    function updateTotal() {
        let total = Object.values(buildSelections).reduce((sum, item) => sum + item.price, 0);
        totalPriceDisplay.textContent = total.toLocaleString() + " DZD";
        return total;
    }

    // 6. BUILD BUNDLING
    function bundleBuild() {
        const total = updateTotal();
        if (buildSelections.cpu.price === 0 || buildSelections.motherboard.price === 0) {
            alert("Please select at least a CPU and Motherboard!");
            return null;
        }

        const specs = Object.entries(buildSelections)
            .filter(([key, val]) => val.price > 0)
            .map(([key, val]) => `${key.toUpperCase()}: ${val.name}`)
            .join("\n");

        return {
            id: "BUILD-" + Date.now(),
            name: "Custom Configured PC",
            price: total,
            qty: 1,
            image: "./assets/images/pc.jpg",
            specs: specs
        };
    }

    // Cart Buttons
    document.getElementById('add-to-cart-build').onclick = () => {
        const build = bundleBuild();
        if(!build) return;
        let cart = JSON.parse(localStorage.getItem('tki_cart')) || [];
        cart.push(build);
        localStorage.setItem('tki_cart', JSON.stringify(cart));
        if(window.updateCartBadge) window.updateCartBadge();
        alert("✅ Build saved to cart!");
    };

    document.getElementById('buy-now-build').onclick = () => {
        const build = bundleBuild();
        if(!build) return;
        let cart = JSON.parse(localStorage.getItem('tki_cart')) || [];
        cart.push(build);
        localStorage.setItem('tki_cart', JSON.stringify(cart));
        window.location.href = "shop.html?checkout_cart=true";
    };
});