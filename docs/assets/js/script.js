'use strict';

/**
 * TKI TEC - MASTER SCRIPT (LEGENDARY EDITION)
 * Handles: Mobile Navbar, Sticky Header, Slider, Secret Shortcut, Cart Badge, and Elite Notifications
 */

document.addEventListener('DOMContentLoaded', () => {

    /**
     * 1. NAVBAR TOGGLE (Mobile Menu)
     * Handles the opening and closing of the mobile sidebar menu
     */
    const navbar = document.querySelector("[data-navbar]");
    const overlay = document.querySelector("[data-overlay]");
    const navOpenBtn = document.querySelector("[data-nav-open-btn]");
    const navCloseBtn = document.querySelector("[data-nav-close-btn]");

    const toggleNavbar = () => {
        navbar?.classList.toggle("active");
        overlay?.classList.toggle("active");
        document.body.classList.toggle("nav-active");
    };

    if (navOpenBtn && navCloseBtn) {
        [navOpenBtn, navCloseBtn, overlay].forEach(btn => {
            btn?.addEventListener("click", toggleNavbar);
        });
    }


    /**
     * 2. STICKY HEADER & GO TOP BUTTON
     * Activates a more compact header style after scrolling 80px
     */
    const header = document.querySelector("[data-header]");
    const goTopBtn = document.querySelector("[data-go-top]");

    window.addEventListener("scroll", () => {
        if (window.scrollY >= 80) {
            header?.classList.add("active");
            goTopBtn?.classList.add("active");
        } else {
            header?.classList.remove("active");
            goTopBtn?.classList.remove("active");
        }
    });


    /**
     * 3. PREBUILT PC SLIDER (Home Page)
     * Controls the left/right navigation for the featured rigs slider
     */
    const pcSlider = document.getElementById('pcSlider');
    const slideNext = document.getElementById('slideNext');
    const slidePrev = document.getElementById('slidePrev');

    if (pcSlider && slideNext && slidePrev) {
        const scrollAmount = 320; // Width of card + gap

        slideNext.addEventListener('click', () => {
            pcSlider.scrollLeft += scrollAmount;
        });

        slidePrev.addEventListener('click', () => {
            pcSlider.scrollLeft -= scrollAmount;
        });
    }


    /**
     * 4. SECRET ADMIN SHORTCUT (Ctrl + Shift + A)
     * Secure entry to the login page hidden from normal users
     */
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && (e.code === 'KeyA' || e.key === 'A')) {
            e.preventDefault();
            window.location.href = 'login.html';
        }
    });


    /**
     * 5. CART BADGE UPDATE LOGIC (Global)
     * Keeps the red number badge in the header in sync with LocalStorage
     */
    window.updateCartBadge = function() {
        const cart = JSON.parse(localStorage.getItem('tki_cart')) || [];
        const badge = document.getElementById('cartBadge');
        
        // Sum total quantities of all items in cart
        const totalItems = cart.reduce((acc, item) => acc + (item.qty || 1), 0);

        if (badge) {
            badge.innerText = totalItems;
            if (totalItems > 0) {
                badge.classList.add('active');
            } else {
                badge.classList.remove('active');
            }
        }
    };


    /**
     * 6. LEGENDARY NOTIFICATION ENGINE (ToastManager)
     * Internal class to handle animated notifications and stacking
     */
    class TkiToastManager {
        constructor() {
            this.container = null;
            this.duration = 4500;
            // Web Audio API Context for tech sound effects
            this.audioCtx = null;
        }

        initContainer() {
            this.container = document.getElementById('notification-container');
            if (!this.container) {
                this.container = document.createElement('div');
                this.container.id = 'notification-container';
                document.body.appendChild(this.container);
            }
        }

        playSound(type) {
            try {
                if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                
                if (type === 'success') {
                    osc.frequency.setValueAtTime(880, this.audioCtx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(440, this.audioCtx.currentTime + 0.1);
                } else {
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(110, this.audioCtx.currentTime);
                }
                gain.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.2);
                osc.start(); osc.stop(this.audioCtx.currentTime + 0.2);
            } catch(e) { /* Audio blocked or not supported */ }
        }

        show(message, type = 'success', subtext = "Tki Tec System Protocol") {
            this.initContainer();
            const id = 'toast-' + Date.now();
            const toastEl = document.createElement('div');
            toastEl.className = `toast toast-${type}`;
            toastEl.id = id;

            // Animated SVG Icon Logic
            let iconHtml = type === 'success' 
                ? `<svg class="toast-icon" viewBox="0 0 52 52"><circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/><path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/></svg>`
                : `<svg class="toast-icon" viewBox="0 0 52 52"><circle class="checkmark__circle" style="stroke:#ff4757" cx="26" cy="26" r="25" fill="none"/><path class="cross__path" fill="none" d="M16 16L36 36"/><path class="cross__path" fill="none" d="M36 16L16 36"/></svg>`;

            toastEl.innerHTML = `
                <div class="toast-icon">${iconHtml}</div>
                <div class="toast-body">
                    <div class="toast-title">${message}</div>
                    <div class="toast-subtext">${subtext}</div>
                </div>
                <div class="toast-progress">
                    <div class="toast-progress-fill" style="animation: shrinkToast ${this.duration}ms linear forwards"></div>
                </div>
            `;

            // Inject animation style once
            if (!document.getElementById('toast-anim-logic')) {
                const s = document.createElement('style'); s.id = 'toast-anim-logic';
                s.innerHTML = `@keyframes shrinkToast { from { transform: scaleX(1); } to { transform: scaleX(0); } }`;
                document.head.appendChild(s);
            }

            this.container.appendChild(toastEl);
            this.playSound(type);

            // Hover to pause logic
            toastEl.onmouseenter = () => toastEl.querySelector('.toast-progress-fill').style.animationPlayState = 'paused';
            toastEl.onmouseleave = () => toastEl.querySelector('.toast-progress-fill').style.animationPlayState = 'running';

            setTimeout(() => this.remove(id), this.duration);
        }

        remove(id) {
            const el = document.getElementById(id);
            if (el) {
                el.classList.add('removing');
                setTimeout(() => el.remove(), 450);
            }
        }
    }

    const tkiToast = new TkiToastManager();

    'use strict';

// 1. UNIVERSAL NOTIFICATION SYSTEM
window.showNotification = function(message, type = 'success') {
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        document.body.appendChild(container);
    }

    const id = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.id = id;

    const icon = type === 'success' ? 'checkmark-done-outline' : 'alert-circle-outline';
    
    toast.innerHTML = `
        <div class="toast-icon">
            <svg viewBox="0 0 52 52" style="width:40px; height:40px;">
                <circle cx="26" cy="26" r="25" fill="none" stroke="${type==='success'?'#00d4ff':'#ff4757'}" stroke-width="2"/>
                <path fill="none" stroke="${type==='success'?'#00d4ff':'#ff4757'}" stroke-width="3" d="${type==='success'?'M14.1 27.2l7.1 7.2 16.7-16.8':'M16 16L36 36M36 16L16 36'}"/>
            </svg>
        </div>
        <div class="toast-body">
            <div class="toast-title">${type.toUpperCase()}</div>
            <div class="toast-subtext">${message}</div>
        </div>
        <div class="toast-progress"><div class="toast-progress-fill" style="animation: shrinkToast 4000ms linear forwards"></div></div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'toastSlideOut 0.5s forwards';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
};

// 2. GLOBAL CART BADGE SYNC
window.updateCartBadge = function() {
    const cart = JSON.parse(localStorage.getItem('tki_cart')) || [];
    const badge = document.getElementById('cartBadge');
    const count = cart.reduce((acc, item) => acc + (item.qty || 1), 0);
    if (badge) {
        badge.innerText = count;
        count > 0 ? badge.classList.add('active') : badge.classList.remove('active');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Mobile Nav
    const navOpen = document.querySelector("[data-nav-open-btn]");
    const navClose = document.querySelector("[data-nav-close-btn]");
    const navbar = document.querySelector("[data-navbar]");
    const overlay = document.querySelector("[data-overlay]");
    const toggle = () => { navbar?.classList.toggle("active"); overlay?.classList.toggle("active"); };
    [navOpen, navClose, overlay].forEach(btn => btn?.addEventListener("click", toggle));

    // Admin Shortcut (Ctrl+Shift+A)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'S') window.location.href = 'login.html';
    });

    // Global Search Toggle
    window.toggleSearch = function() {
        document.getElementById('searchWrapper').classList.toggle('active');
        document.getElementById('searchInput')?.focus();
    };

    updateCartBadge();
});
});
window.activateAutoScroll = function() {
    // Select all potential horizontal scroll containers
    const containers = document.querySelectorAll('.filter-list, .sidebar-card');

    containers.forEach(list => {
        // Clear any existing intervals to prevent double-speed bugs
        if (list.dataset.intervalSet) return; 
        list.dataset.intervalSet = "true";

        setInterval(() => {
            // Check if there is actually space to scroll
            if (list.scrollWidth > list.clientWidth) {
                const maxScroll = list.scrollWidth - list.clientWidth;
                
                // If we are at the end, reset to 0
                if (list.scrollLeft >= maxScroll - 10) {
                    list.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    // Nudge right by 150px
                    list.scrollBy({ left: 150, behavior: 'smooth' });
                }
            }
        }, 5000); // 5 Seconds
    });
};

// Start trying to run it immediately
document.addEventListener('DOMContentLoaded', window.activateAutoScroll);