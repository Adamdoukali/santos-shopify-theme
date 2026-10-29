/**
 * Santos Haute Couture — Official Shopify Theme Engine
 */

(function () {
  'use strict';

  // --- Mobile Navigation ---
  window.toggleMobileNav = function () {
    const nav = document.getElementById('mobile-nav');
    const burger = document.getElementById('burger-btn');
    if (!nav) return;
    const isOpen = nav.classList.toggle('is-open');
    if (burger) burger.setAttribute('aria-expanded', isOpen);
    nav.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };

  // --- Cart Drawer ---
  window.openCart = function () {
    const drawer = document.getElementById('cart-drawer');
    if (!drawer) return;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (window.refreshCartDrawer) window.refreshCartDrawer();
  };

  window.closeCart = function () {
    const drawer = document.getElementById('cart-drawer');
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  // --- Search Drawer / Overlay ---
  window.openSearch = function () {
    const overlay = document.getElementById('search-overlay');
    if (!overlay) return;
    overlay.classList.add('is-active');
    overlay.setAttribute('aria-hidden', 'false');
    overlay.style.display = 'block';
    const input = document.getElementById('search-input');
    if (input) setTimeout(() => input.focus(), 60);
  };

  window.closeSearch = function () {
    const overlay = document.getElementById('search-overlay');
    if (!overlay) return;
    overlay.classList.remove('is-active');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.display = 'none';
  };

  window.quickFilter = function (query) {
    const input = document.getElementById('search-input');
    if (input) {
      input.value = query;
      window.performSearch(query);
    }
  };

  window.performSearch = function (query) {
    const resultsBox = document.getElementById('search-results-box');
    if (!resultsBox) return;
    const q = query.trim().toLowerCase();
    if (!q) {
      resultsBox.innerHTML = '';
      return;
    }

    // Use Shopify search suggest API
    fetch(`/search/suggest.json?q=${encodeURIComponent(q)}&resources[type]=product&resources[limit]=6`)
      .then(res => res.json())
      .then(data => {
        const products = data.resources?.results?.products || [];
        if (products.length === 0) {
          resultsBox.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #888; padding: 20px 0;">Aucune création trouvée pour "${query}"</p>`;
          return;
        }
        resultsBox.innerHTML = products.map(p => `
          <article class="product-card">
            <a href="${p.url}" class="product-card__thumbnail">
              <img class="product-card__img" src="${p.image}" alt="${p.title}">
            </a>
            <div class="product-card__content">
              <h3 class="product-card__title"><a href="${p.url}" style="color:inherit;text-decoration:none;">${p.title}</a></h3>
              <p class="product-card__price">${p.price}</p>
            </div>
          </article>
        `).join('');
      })
      .catch(() => {
        resultsBox.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #888; padding: 20px 0;"><a href="/search?q=${encodeURIComponent(q)}" class="btn --link">Voir les résultats pour "${query}"</a></p>`;
      });
  };

  // --- Quick View Modal ---
  window.openQuickView = function (handle) {
    if (!handle) return;
    fetch(`/products/${handle}.js`)
      .then(res => res.json())
      .then(product => {
        const modal = document.getElementById('quick-view-modal');
        if (!modal) {
          window.location.href = `/products/${handle}`;
          return;
        }

        const modalTitle = document.getElementById('modal-product-title');
        const modalPrice = document.getElementById('modal-product-price');
        const modalImg = document.getElementById('modal-main-image');
        const modalLink = document.getElementById('modal-product-link');
        const modalDesc = document.getElementById('modal-product-desc');
        const modalVariantId = document.getElementById('modal-variant-id');

        if (modalTitle) modalTitle.textContent = product.title;
        if (modalPrice) modalPrice.textContent = (product.price / 100).toFixed(2) + ' MAD';
        if (modalImg && product.featured_image) modalImg.src = product.featured_image;
        if (modalLink) modalLink.href = product.url;
        if (modalDesc) modalDesc.innerHTML = product.description || 'Création couture exclusive Santos confectionnée avec les plus nobles matières.';
        if (modalVariantId && product.variants && product.variants.length > 0) {
          modalVariantId.value = product.variants[0].id;
        }

        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      })
      .catch(() => {
        window.location.href = `/products/${handle}`;
      });
  };

  window.closeQuickView = function () {
    const modal = document.getElementById('quick-view-modal');
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  // --- AJAX Cart Management ---
  window.refreshCartDrawer = function () {
    fetch('/cart.js')
      .then(res => res.json())
      .then(cart => {
        const headerBadge = document.getElementById('header-cart-count');
        if (headerBadge) headerBadge.textContent = cart.item_count;
        const drawerCount = document.getElementById('cart-drawer-count');
        if (drawerCount) drawerCount.textContent = cart.item_count;

        const subtotal = document.getElementById('cart-drawer-subtotal');
        if (subtotal) {
          subtotal.textContent = (cart.total_price / 100).toFixed(2) + ' MAD';
        }

        const container = document.getElementById('cart-items-container');
        if (!container) return;

        if (cart.items.length === 0) {
          container.innerHTML = `
            <div style="text-align: center; padding: 48px 20px; color: #888;">
              <p style="font-size: 15px; margin-bottom: 16px;">Votre panier est actuellement vide.</p>
              <button type="button" class="btn --link" onclick="closeCart()">Découvrir nos créations</button>
            </div>
          `;
          return;
        }

        let html = `
          <div style="display: flex; justify-content: flex-end; padding: 6px 16px;">
            <button type="button" class="cart-clear-btn" onclick="clearCartAjax()">Vider le panier</button>
          </div>
        `;

        cart.items.forEach(item => {
          const itemPrice = (item.final_line_price / 100).toFixed(2);
          html += `
            <div class="cart-item" data-key="${item.key}">
              <img src="${item.image || ''}" alt="${item.title}">
              <div class="cart-item__info">
                <h4>${item.product_title || item.title}</h4>
                ${item.variant_title && item.variant_title !== 'Default Title' ? `<div class="cart-item__meta">${item.variant_title}</div>` : ''}
                <div class="cart-item__actions">
                  <div class="cart-item__qty">
                    <button type="button" onclick="updateItemQtyAjax('${item.key}', ${item.quantity - 1})" aria-label="Diminuer">−</button>
                    <span>${item.quantity}</span>
                    <button type="button" onclick="updateItemQtyAjax('${item.key}', ${item.quantity + 1})" aria-label="Augmenter">+</button>
                  </div>
                  <button type="button" class="cart-item__remove" onclick="removeItemAjax('${item.key}')" aria-label="Supprimer">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M9 3L3 9M3 3L9 9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
                    Supprimer
                  </button>
                </div>
              </div>
              <div class="cart-item__price">${itemPrice} MAD</div>
            </div>
          `;
        });

        container.innerHTML = html;
      })
      .catch(err => console.error('Error refreshing cart:', err));
  };

  window.removeItemAjax = function (key) {
    fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: key, quantity: 0 })
    })
      .then(res => res.json())
      .then(() => {
        window.showToast('Article retiré du panier.');
        window.refreshCartDrawer();
      })
      .catch(err => {
        console.error('Error removing item:', err);
        window.showToast('Erreur lors de la suppression.');
      });
  };

  window.updateItemQtyAjax = function (key, qty) {
    fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: key, quantity: Math.max(0, qty) })
    })
      .then(res => res.json())
      .then(() => {
        window.refreshCartDrawer();
      })
      .catch(err => console.error('Error updating qty:', err));
  };

  window.clearCartAjax = function () {
    if (!confirm('Voulez-vous vraiment vider l\'ensemble de votre panier ?')) return;
    fetch('/cart/clear.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
      .then(res => res.json())
      .then(() => {
        window.showToast('Votre panier a été vidé.');
        window.refreshCartDrawer();
      })
      .catch(err => console.error('Error clearing cart:', err));
  };

  // --- AJAX Add to Cart ---
  window.addToCartAjax = function (variantId, qty = 1) {
    fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: variantId, quantity: qty })
    })
      .then(res => res.json())
      .then(item => {
        window.closeQuickView();
        window.showToast(`« ${item.title} » ajouté au panier Santos.`);
        window.refreshCartDrawer();
        window.openCart();
      })
      .catch(err => {
        console.error('Cart add error:', err);
        window.showToast('Article ajouté au panier.');
      });
  };

  // --- Toast Notification ---
  window.showToast = function (msg) {
    let toast = document.getElementById('toast-msg');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast-msg';
      toast.className = 'toast-notification';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('is-visible');
    setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 3000);
  };

  // --- Header Scroll Inversion ---
  const header = document.getElementById('site-header');
  if (header && header.classList.contains('header-inverted')) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        header.classList.remove('header-inverted');
        header.classList.add('header-scrolled');
      } else {
        header.classList.add('header-inverted');
        header.classList.remove('header-scrolled');
      }
    }, { passive: true });
  }

  // --- EasySell COD Handlers for Theme ---
  window.buyShopifyModalItemCod = function () {
    const titleEl = document.getElementById('modal-product-title');
    const priceEl = document.getElementById('modal-product-price');
    const imgEl = document.getElementById('modal-main-image');
    if (!titleEl) return;

    const title = titleEl.textContent;
    const priceText = priceEl ? priceEl.textContent.replace(/[^\d.]/g, '') : '0';
    const price = parseFloat(priceText) || 0;
    const img = imgEl ? imgEl.src : '';

    if (typeof closeQuickView === 'function') closeQuickView();
    if (typeof openCodCheckout === 'function') {
      openCodCheckout({
        title: title,
        price: price,
        img: img,
        size: 'Standard',
        color: 'Unique'
      });
    }
  };

  window.handleShopifyCodCheckout = function () {
    fetch('/cart.js')
      .then(res => res.json())
      .then(cart => {
        if (!cart || cart.item_count === 0) {
          alert('Votre panier est actuellement vide.');
          return;
        }
        if (typeof closeCart === 'function') closeCart();

        const items = (cart.items || []).map(it => ({
          name: it.product_title || it.title,
          price: (it.final_price || it.price) / 100,
          qty: it.quantity,
          img: it.featured_image ? it.featured_image.url : (it.image || ''),
          size: it.variant_title || 'Unique',
          color: ''
        }));

        window.cart = items;
        if (typeof openCodCheckout === 'function') {
          openCodCheckout();
        }
      })
      .catch(() => {
        if (typeof closeCart === 'function') closeCart();
        if (typeof openCodCheckout === 'function') openCodCheckout();
      });
  };

  // --- Keyboard Shortcuts (ESC to close) ---
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.closeCart();
      window.closeSearch();
      window.closeQuickView();
      if (typeof closeCodCheckout === 'function') closeCodCheckout();
      const nav = document.getElementById('mobile-nav');
      if (nav && nav.classList.contains('is-open')) window.toggleMobileNav();
    }
  });

})();
