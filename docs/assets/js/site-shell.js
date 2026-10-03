'use strict';
// One storefront header and category navigation, shared by every public route.
(function () {
    const mount = document.querySelector('[data-store-shell]');
    if (!mount) return;
    mount.outerHTML = `
  <header class="header" data-header>
    <div class="container header-inner">
      <a href="index.html" class="logo" aria-label="Tki Tec home">
        <img src="./assets/images/logo.png" alt=""><span class="store-wordmark">TKI <span class="store-wordmark-accent">TEC</span></span>
      </a>
      <form class="header-search" action="shop.html" method="get" role="search">
        <ion-icon name="search-outline" aria-hidden="true"></ion-icon>
        <input type="search" name="search" placeholder="Search PCs, GPUs, CPUs, RAM and more..." aria-label="Search products">
        <button type="submit" aria-label="Search products"><ion-icon name="search-outline" aria-hidden="true"></ion-icon></button>
      </form>
      <button class="nav-open-btn" data-nav-open-btn aria-label="Open menu" aria-expanded="false" aria-controls="storeNavigation"><ion-icon name="menu-outline"></ion-icon></button>
      <a class="mobile-whatsapp" data-whatsapp-contact href="https://wa.me/" target="_blank" rel="noopener noreferrer" aria-label="Contact TKI TEC on WhatsApp"><ion-icon name="logo-whatsapp" aria-hidden="true"></ion-icon></a>
      <nav class="navbar" id="storeNavigation" data-navbar aria-label="Main navigation">
        <div class="overlay" data-overlay></div>
        <button class="nav-close-btn" data-nav-close-btn aria-label="Close menu"><ion-icon name="close-outline"></ion-icon></button>
        <ul class="navbar-list">
          <li><a href="index.html" class="navbar-link">Home</a></li>
          <li><a href="shop.html?cat=all" class="navbar-link">Shop</a></li>
          <li><a href="shop.html?cat=prebuilt" class="navbar-link">Prebuilt PCs</a></li>
          <li class="navbar-item dropdown">
            <a href="shop.html?cat=all" class="navbar-link">Categories <ion-icon name="chevron-down-outline"></ion-icon></a>
            <ul class="dropdown-list">
              <li><a href="shop.html?cat=prebuilt" class="dropdown-link">Prebuilt PCs</a></li>
              <li><a href="shop.html?cat=gpu" class="dropdown-link">GPUs</a></li>
              <li><a href="shop.html?cat=cpu" class="dropdown-link">CPUs</a></li>
              <li><a href="shop.html?cat=motherboard" class="dropdown-link">Motherboards</a></li>
              <li><a href="shop.html?cat=ram" class="dropdown-link">RAM</a></li>
              <li><a href="shop.html?cat=storage" class="dropdown-link">Storage</a></li>
              <li><a href="shop.html?cat=peripherals" class="dropdown-link">Accessories</a></li>
            </ul>
          </li>
          <li><a href="build.html" class="navbar-link">PC Builder</a></li>
        </ul>
        <a class="header-whatsapp" data-whatsapp-contact href="https://wa.me/" target="_blank" rel="noopener noreferrer">
          <ion-icon name="logo-whatsapp" aria-hidden="true"></ion-icon><span>WhatsApp</span>
        </a>
      </nav>
    </div>
  </header>
  <nav class="store-category-nav" aria-label="Main product categories"><div class="container">
    <a href="shop.html?cat=prebuilt">Prebuilt PCs</a><a href="shop.html?cat=gpu">GPUs</a><a href="shop.html?cat=cpu">CPUs</a><a href="shop.html?cat=ram">RAM</a><a href="shop.html?cat=storage">Storage</a><a href="shop.html?cat=peripherals">Accessories</a>
  </div></nav>
`;
    const setActiveCategory = category => {
        const peripheral = new Set(['mouse','keyboard','headset','monitor','accessory','accessories','peripheral']);
        category = peripheral.has(category) ? 'peripherals' : category;
        document.querySelectorAll('.store-category-nav a').forEach(link => {
            const active = new URL(link.href).searchParams.get('cat') === category;
            link.classList.toggle('is-active', active);
            active ? link.setAttribute('aria-current', 'page') : link.removeAttribute('aria-current');
        });
    };
    window.TkiShell = Object.freeze({ setActiveCategory });
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelector('.header-search input').value = new URLSearchParams(location.search).get('search') || '';
    const navigation = document.querySelector('[data-navbar]');
    const menuButton = document.querySelector('[data-nav-open-btn]');
    const mobileLayout = window.matchMedia('(max-width: 992px)');
    const syncNavigation = () => {
        const open = navigation.classList.contains('active');
        menuButton.setAttribute('aria-expanded', String(open));
        navigation.inert = mobileLayout.matches && !open;
    };
    new MutationObserver(syncNavigation).observe(navigation, { attributes: true, attributeFilter: ['class'] });
    mobileLayout.addEventListener('change', syncNavigation);
    syncNavigation();
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && mobileLayout.matches && navigation.classList.contains('active')) {
            navigation.querySelector('[data-nav-close-btn]').click();
            menuButton.focus();
        }
    });

        setActiveCategory(document.body.dataset.storeCategory || new URLSearchParams(location.search).get('cat') || (document.body.classList.contains('catalog-page') ? 'all' : document.body.classList.contains('builder-page') ? 'all' : 'prebuilt'));
        document.querySelectorAll('[data-whatsapp-contact]').forEach(link => { link.href = window.createWhatsAppOrderUrl('Hello, I would like to ask about your PC hardware.'); });
    });
})();
