/**
 * ChoiceWomen Reverse-Engineered Interactions & EasySell COD Checkout
 * Maison Santos
 */

let allProductsData = [];
let activeCategory = 'all';
let isShowingAll = true;
let cardImageIndices = {};

// COD Checkout State
let currentCodItem = null;
let selectedBundleQty = 1;
let appliedDiscountPercent = 0;
let appliedCouponCode = '';

// Moroccan Major Cities
const MOROCCAN_CITIES = [
  "Casablanca", "Rabat", "Marrakech", "Tanger", "Fès", "Agadir",
  "Meknès", "Oujda", "Kénitra", "Tétouan", "Safi", "Mohammédia",
  "El Jadida", "Béni Mellal", "Nador", "Khouribga", "Settat",
  "Témara", "Salé", "Berrechid", "Khemisset", "Larache", "Guelmim"
];

// Initialize on DOM Ready or immediately if DOM is already ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initChoiceExperience();
  });
} else {
  initChoiceExperience();
}

async function initChoiceExperience() {
  try {
    const res = await fetch('santos_real_products.json');
    allProductsData = await res.json();
    window.allProductsData = allProductsData;
    if (!window.realProducts || window.realProducts.length === 0) {
      window.realProducts = allProductsData;
    }
  } catch (e) {
    console.error('Failed to load santos_real_products.json:', e);
    return;
  }

  // Populate city dropdown in COD modal
  populateCitySelect();

  // Render initial cards in product section (index.html)
  renderChoiceSection();

  // Wire up COD Modal Listeners
  initCodModalListeners();
}

function populateCitySelect() {
  const citySelect = document.getElementById('cod-city-select');
  if (!citySelect) return;
  citySelect.innerHTML = `
    <option value="" disabled selected>Sélectionnez votre ville</option>
    ${MOROCCAN_CITIES.map(c => `<option value="${c}">${c}</option>`).join('')}
    <option value="Autre">Autre ville au Maroc</option>
  `;
}

/**
 * Filter & Render Products
 */
function renderChoiceSection() {
  const grid = document.getElementById('choice-product-grid');
  if (!grid) return;

  // Filter products by active category
  let filtered = allProductsData;
  if (activeCategory === 'nouveautes') {
    filtered = allProductsData.slice(0, 8);
  } else if (activeCategory.toUpperCase() === 'JEANS') {
    filtered = allProductsData.filter(p => (p.category === 'JEANS') || (p.tags && p.tags.includes('jeans')) || p.title.toLowerCase().includes('jean'));
  } else if (activeCategory !== 'all') {
    filtered = allProductsData.filter(p => (p.category || '').toUpperCase() === activeCategory.toUpperCase());
  }

  // Limit display if not showing all
  const displayList = isShowingAll ? filtered : filtered.slice(0, 8);

  if (displayList.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #777;">
        <p style="font-size: 15px; text-transform: uppercase; letter-spacing: 0.05em;">Aucune création trouvée dans cette catégorie.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = displayList.map(product => createChoiceCardHtml(product)).join('');

  // Update "TOUT" button state
  const toutBtn = document.getElementById('choice-tout-btn');
  if (toutBtn) {
    if (filtered.length <= 8) {
      toutBtn.style.display = 'none';
    } else {
      toutBtn.style.display = 'inline-block';
      toutBtn.textContent = isShowingAll ? 'RÉDUIRE' : 'TOUT';
    }
  }

  // Update tab counts
  updateTabCounts();
}

function createChoiceCardHtml(p) {
  const images = (p.images && p.images.length > 0) ? p.images : [p.img];
  const currentIdx = cardImageIndices[p.id] || 0;
  const currentImg = images[currentIdx] || p.img;
  const comparePrice = p.compare_at_price || Math.round(p.price * 1.25);
  const isOnSale = comparePrice > p.price;

  // Swatches
  const colors = p.colors_data || [];
  let swatchesHtml = '';
  if (colors.length > 0) {
    const visibleColors = colors.slice(0, 4);
    const extraCount = colors.length - visibleColors.length;

    swatchesHtml = `
      <div class="choice-card__swatches" onclick="event.stopPropagation()">
        ${visibleColors.map((c, idx) => `
          <span 
            class="choice-swatch ${idx === 0 ? 'is-active' : ''}" 
            style="background-color: ${c.hex};" 
            title="${c.name}"
            onclick="switchCardColor(${p.id}, ${idx}, '${c.name}', this)"
          ></span>
        `).join('')}
        ${extraCount > 0 ? `<span class="choice-swatch-more" onclick="openChoiceQuickView(${p.id})">+${extraCount}</span>` : ''}
      </div>
    `;
  }

  return `
    <article class="choice-card" data-id="${p.id}" onclick="openChoiceQuickView(${p.id})">
      <div class="choice-card__media">
        ${isOnSale ? `<span class="choice-card__badge">Promo</span>` : ''}
        
        <img 
          id="choice-card-img-${p.id}" 
          class="choice-card__img" 
          src="${currentImg}" 
          alt="${p.title}" 
          loading="lazy"
        >

        ${images.length > 1 ? `
          <button 
            type="button" 
            class="choice-card__nav choice-card__nav--prev" 
            aria-label="Image précédente" 
            onclick="event.stopPropagation(); cycleCardImage(${p.id}, -1);"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <button 
            type="button" 
            class="choice-card__nav choice-card__nav--next" 
            aria-label="Image suivante" 
            onclick="event.stopPropagation(); cycleCardImage(${p.id}, 1);"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        ` : ''}

        <button 
          type="button" 
          class="choice-card__quick-add" 
          onclick="event.stopPropagation(); openChoiceQuickView(${p.id});"
        >
          Aperçu Rapide
        </button>
      </div>

      <div class="choice-card__info">
        <h3 class="choice-card__title" title="${p.title}">${p.title}</h3>
        
        <div class="choice-card__price-row">
          ${isOnSale ? `
            <span class="choice-card__price-compare">${comparePrice.toFixed(2)} dh</span>
            <span class="choice-card__price-sale">${p.price.toFixed(2)} dh</span>
          ` : `
            <span class="choice-card__price-regular">${p.price.toFixed(2)} dh</span>
          `}
        </div>

        ${swatchesHtml}
      </div>
    </article>
  `;
}

/**
 * Image Carousel on Card Hover/Click
 */
function cycleCardImage(productId, direction) {
  const list = window.allProductsData || allProductsData || window.realProducts || [];
  const p = list.find(item => item.id === productId);
  if (!p || !p.images || p.images.length <= 1) return;

  const currentIdx = cardImageIndices[productId] || 0;
  let nextIdx = currentIdx + direction;
  if (nextIdx < 0) nextIdx = p.images.length - 1;
  if (nextIdx >= p.images.length) nextIdx = 0;

  cardImageIndices[productId] = nextIdx;
  const imgEl = document.getElementById(`choice-card-img-${productId}`);
  if (imgEl) {
    imgEl.style.opacity = '0.7';
    imgEl.src = p.images[nextIdx];
    setTimeout(() => {
      imgEl.style.opacity = '1';
    }, 150);
  }
}

/**
 * Color Swatch Click on Card
 */
function switchCardColor(productId, colorIdx, colorName, swatchEl) {
  const list = window.allProductsData || allProductsData || window.realProducts || [];
  const p = list.find(item => item.id === productId);
  if (!p) return;

  // Update active state on swatch
  const parent = swatchEl.parentElement;
  if (parent) {
    parent.querySelectorAll('.choice-swatch').forEach(s => s.classList.remove('is-active'));
    swatchEl.classList.add('is-active');
  }

  // Switch image if color mapped
  if (p.colors_data && p.colors_data[colorIdx]) {
    const targetImgIdx = p.colors_data[colorIdx].img_idx;
    if (p.images && p.images[targetImgIdx]) {
      cardImageIndices[productId] = targetImgIdx;
      const imgEl = document.getElementById(`choice-card-img-${productId}`);
      if (imgEl) {
        imgEl.style.opacity = '0.7';
        imgEl.src = p.images[targetImgIdx];
        setTimeout(() => { imgEl.style.opacity = '1'; }, 150);
      }
    }
  }
}

/**
 * Filter Tabs Switching
 */
function setChoiceCategory(cat, tabEl) {
  activeCategory = cat;
  document.querySelectorAll('.choice-filter-tab').forEach(t => t.classList.remove('is-active'));
  if (tabEl) tabEl.classList.add('is-active');
  renderChoiceSection();
}

function toggleChoiceShowAll() {
  isShowingAll = !isShowingAll;
  renderChoiceSection();
}

function updateTabCounts() {
  const totalCount = allProductsData.length;
  const manteauxCount = allProductsData.filter(p => p.category === 'MANTEAUX').length;
  const ensemblesCount = allProductsData.filter(p => p.category === 'ENSEMBLES').length;
  const robesCount = allProductsData.filter(p => p.category === 'ROBES').length;
  const jeansCount = allProductsData.filter(p => (p.category === 'JEANS' || p.title.toLowerCase().includes('jean'))).length;

  const countAll = document.getElementById('count-all');
  if (countAll) countAll.textContent = `(${totalCount})`;

  const countManteaux = document.getElementById('count-manteaux');
  if (countManteaux) countManteaux.textContent = `(${manteauxCount})`;

  const countEnsembles = document.getElementById('count-ensembles');
  if (countEnsembles) countEnsembles.textContent = `(${ensemblesCount})`;

  const countRobes = document.getElementById('count-robes');
  if (countRobes) countRobes.textContent = `(${robesCount})`;

  const countJeans = document.getElementById('count-jeans');
  if (countJeans) countJeans.textContent = `(${jeansCount})`;
}

/**
 * Quick View (Opens Product Quick View with Choice Styling)
 */
function openChoiceQuickView(productId) {
  const list = window.allProductsData || allProductsData || window.realProducts || [];
  const idx = list.findIndex(p => p.id === productId);
  if (idx !== -1 && typeof openProductModalByIndex === 'function') {
    openProductModalByIndex(idx);
  }
}

/**
 * EasySell Cash on Delivery (COD) Checkout System
 */
function openCodCheckout(itemData = null) {
  const isCartCheckout = (!itemData && typeof cart !== 'undefined' && cart.length > 0);
  const bundleContainer = document.querySelector('.choice-cod-bundle-section');
  if (bundleContainer) {
    bundleContainer.style.display = isCartCheckout ? 'none' : 'block';
  }

  // If specific product passed, use it
  if (itemData) {
    currentCodItem = {
      title: itemData.title,
      price: itemData.price,
      img: itemData.img,
      size: itemData.size || 'M',
      color: itemData.color || (itemData.colors_data && itemData.colors_data[0] ? itemData.colors_data[0].name : 'Unique'),
      isCart: false
    };
  } else if (isCartCheckout) {
    // Take first item or aggregated total from cart
    const first = cart[0];
    const totalCartPrice = cart.reduce((sum, it) => sum + (it.price * it.qty), 0);
    currentCodItem = {
      title: cart.length === 1 ? cart[0].name : `${cart[0].name} + ${cart.length - 1} autre(s)`,
      price: totalCartPrice,
      img: first.img,
      size: cart.length === 1 ? (first.size || 'M') : 'Tailles sélectionnées',
      color: cart.length === 1 ? (first.color || '') : 'Coloris sélectionnés',
      isCart: true,
      cartItems: [...cart]
    };
  } else if (allProductsData.length > 0) {
    // Default fallback to first signature product
    const p = allProductsData[0];
    currentCodItem = {
      title: p.title,
      price: p.price,
      img: p.img,
      size: 'M',
      color: p.colors_data && p.colors_data[0] ? p.colors_data[0].name : 'Noir',
      isCart: false
    };
  }

  selectedBundleQty = 1;
  appliedDiscountPercent = 0;
  appliedCouponCode = '';

  // Render COD Item summary & bundles
  updateCodDisplay();

  // Reset form & hide success state
  const formBox = document.getElementById('choice-cod-form-container');
  const successBox = document.getElementById('choice-cod-success');
  if (formBox) formBox.style.display = 'block';
  if (successBox) successBox.classList.remove('is-visible');

  // Open modal
  const modal = document.getElementById('choice-cod-modal-overlay');
  if (modal) {
    modal.classList.add('is-active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
}

function closeCodCheckout() {
  const modal = document.getElementById('choice-cod-modal-overlay');
  if (modal) {
    modal.classList.remove('is-active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}

function updateCodDisplay() {
  if (!currentCodItem) return;

  const isCartCheckout = Boolean(currentCodItem.isCart);

  // Thumbnail & Title
  const thumbEl = document.getElementById('cod-item-thumb');
  if (thumbEl) thumbEl.src = currentCodItem.img;

  const titleEl = document.getElementById('cod-item-title');
  if (titleEl) titleEl.textContent = currentCodItem.title;

  const variantEl = document.getElementById('cod-item-variant');
  if (variantEl) {
    const varText = [currentCodItem.color, currentCodItem.size].filter(Boolean).join(' / ');
    variantEl.textContent = varText || 'Standard';
  }

  const badgeEl = document.getElementById('cod-item-qty-badge');
  if (badgeEl) badgeEl.textContent = isCartCheckout ? (currentCodItem.cartItems ? currentCodItem.cartItems.reduce((s, i) => s + i.qty, 0) : 1) : selectedBundleQty;

  const unitPrice = currentCodItem.price;

  // Bundle pricing (for single item purchases)
  const price1 = unitPrice;
  const price2 = (unitPrice * 2) * 0.85;
  const price3 = (unitPrice * 3) * 0.80;

  const bPrice1 = document.getElementById('bundle-price-1');
  if (bPrice1) bPrice1.textContent = `${price1.toFixed(2)} dh`;

  const bPrice2 = document.getElementById('bundle-price-2');
  if (bPrice2) bPrice2.textContent = `${price2.toFixed(2)} dh`;

  const bPrice3 = document.getElementById('bundle-price-3');
  if (bPrice3) bPrice3.textContent = `${price3.toFixed(2)} dh`;

  // Calculate Active Totals
  let rawTotal = isCartCheckout ? unitPrice : (unitPrice * selectedBundleQty);
  let bundleDiscount = 0;

  if (!isCartCheckout) {
    if (selectedBundleQty === 2) {
      bundleDiscount = rawTotal * 0.15;
    } else if (selectedBundleQty >= 3) {
      bundleDiscount = rawTotal * 0.20;
    }
  }

  let subtotalAfterBundle = rawTotal - bundleDiscount;

  // Coupon discount
  let couponDiscount = 0;
  if (appliedDiscountPercent > 0) {
    couponDiscount = subtotalAfterBundle * (appliedDiscountPercent / 100);
  }

  const totalDiscount = bundleDiscount + couponDiscount;
  const subtotal = rawTotal;
  const shipping = subtotalAfterBundle >= 500 ? 0 : 19.00;
  const finalTotal = subtotal - totalDiscount + shipping;

  // Update Item Price in Card Header
  const itemPriceEl = document.getElementById('cod-item-price');
  if (itemPriceEl) {
    itemPriceEl.textContent = `${rawTotal.toFixed(2)} dh`;
  }

  // Update Summary Subtotal
  const summarySubtotalEl = document.getElementById('cod-summary-subtotal');
  if (summarySubtotalEl) {
    summarySubtotalEl.textContent = `${subtotal.toFixed(2)} dh`;
  }

  const legacySubtotalEl = document.getElementById('cod-subtotal');
  if (legacySubtotalEl && legacySubtotalEl !== itemPriceEl) {
    legacySubtotalEl.textContent = `${subtotal.toFixed(2)} dh`;
  }

  const discountRow = document.getElementById('cod-discount-row');
  const discountEl = document.getElementById('cod-discount-val');
  if (discountRow && discountEl) {
    if (totalDiscount > 0) {
      discountRow.style.display = 'flex';
      discountEl.textContent = `-${totalDiscount.toFixed(2)} dh`;
    } else {
      discountRow.style.display = 'none';
    }
  }

  const shippingEl = document.getElementById('cod-shipping');
  if (shippingEl) {
    shippingEl.textContent = shipping === 0 ? 'Gratuit' : `${shipping.toFixed(2)} dh`;
  }

  const totalEl = document.getElementById('cod-total');
  if (totalEl) totalEl.textContent = `${finalTotal.toFixed(2)} dh`;

  // Update Green CTA button text
  const submitBtn = document.getElementById('cod-submit-btn');
  if (submitBtn) {
    submitBtn.textContent = `Terminez votre achat - ${finalTotal.toFixed(2)} dh`;
  }
}

function selectBundle(qty, cardEl) {
  selectedBundleQty = qty;
  document.querySelectorAll('.choice-bundle-card').forEach(c => c.classList.remove('is-active'));
  if (cardEl) cardEl.classList.add('is-active');
  updateCodDisplay();
}

function applyCodCoupon() {
  const input = document.getElementById('cod-coupon-input');
  if (!input) return;
  const code = input.value.trim().toUpperCase();

  if (code === 'SANTOS10' || code === 'CHOICE10') {
    appliedDiscountPercent = 10;
    appliedCouponCode = code;
    showChoiceToast('Code promo appliqué : -10% de remise supplémentaire !');
    updateCodDisplay();
  } else if (code) {
    showChoiceToast('Code promo non valide ou expiré.');
  }
}

/**
 * Submit COD Order Form
 */
function submitCodOrder(e) {
  if (e) e.preventDefault();

  const firstName = (document.getElementById('cod-first-name')?.value || '').trim();
  const lastName = (document.getElementById('cod-last-name')?.value || '').trim();
  const phone = (document.getElementById('cod-phone')?.value || '').trim();
  const city = (document.getElementById('cod-city-select')?.value || '').trim();
  const address = (document.getElementById('cod-address')?.value || '').trim();

  if (!firstName || !lastName || !phone || !city || !address) {
    showChoiceToast('Veuillez remplir tous les champs obligatoires.');
    return;
  }

  const submitBtn = document.getElementById('cod-submit-btn');
  if (submitBtn) {
    submitBtn.textContent = 'Traitement en cours...';
    submitBtn.disabled = true;
  }

  setTimeout(() => {
    // Generate order ID
    const orderNum = 'SN-' + Math.floor(100000 + Math.random() * 900000);
    const totalText = document.getElementById('cod-total')?.textContent || '0.00 dh';

    // Store in localStorage
    const newOrder = {
      orderId: orderNum,
      date: new Date().toISOString(),
      customer: { firstName, lastName, phone, city, address },
      item: currentCodItem,
      quantity: selectedBundleQty,
      total: totalText
    };

    const existingOrders = JSON.parse(localStorage.getItem('santos_orders') || '[]');
    existingOrders.push(newOrder);
    localStorage.setItem('santos_orders', JSON.stringify(existingOrders));

    // Show Success View
    const formBox = document.getElementById('choice-cod-form-container');
    const successBox = document.getElementById('choice-cod-success');
    if (formBox) formBox.style.display = 'none';
    if (successBox) {
      successBox.classList.add('is-visible');
      document.getElementById('success-order-num').textContent = orderNum;
      document.getElementById('success-order-total').textContent = totalText;
      document.getElementById('success-order-client').textContent = `${firstName} ${lastName} (${phone}, ${city})`;

      // WhatsApp link with prefilled Moroccan confirmation message
      let itemDescription = '';
      if (currentCodItem.cartItems && currentCodItem.cartItems.length > 0) {
        itemDescription = currentCodItem.cartItems.map(it => `${it.qty}x ${it.name} (${it.size || 'M'}${it.color ? ', ' + it.color : ''})`).join(', ');
      } else {
        itemDescription = `${currentCodItem.title} (${currentCodItem.size}${currentCodItem.color ? ', ' + currentCodItem.color : ''}, Quantité: ${selectedBundleQty})`;
      }

      const msg = `Bonjour Maison Santos, je confirme ma commande *#${orderNum}* pour : ${itemDescription} d'un montant de *${totalText}*. Client: ${firstName} ${lastName}, Téléphone: ${phone}, Ville: ${city}, Adresse: ${address}.`;
      const waUrl = `https://wa.me/212600000000?text=${encodeURIComponent(msg)}`;
      const waBtn = document.getElementById('success-wa-btn');
      if (waBtn) waBtn.href = waUrl;

      // Clear cart if order placed from cart
      if (currentCodItem.cartItems && typeof cart !== 'undefined') {
        cart = [];
        if (typeof updateCartDisplay === 'function') updateCartDisplay();
      }
    }

    if (submitBtn) {
      submitBtn.disabled = false;
    }
  }, 700);
}

function initCodModalListeners() {
  const overlay = document.getElementById('choice-cod-modal-overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeCodCheckout();
    });
  }
}

function showChoiceToast(msg) {
  if (typeof showToast === 'function') {
    showToast(msg);
    return;
  }
  let toast = document.getElementById('toast-msg');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-msg';
    toast.className = 'toast-msg';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('is-visible');
  setTimeout(() => {
    toast.classList.remove('is-visible');
  }, 2800);
}

/**
 * Export Stored Orders to Delivery Tracking CSV
 */
function exportDeliveryCsv() {
  const orders = JSON.parse(localStorage.getItem('santos_orders') || '[]');
  if (orders.length === 0) {
    showChoiceToast('Aucune commande enregistrée en local. Utilisez santos_delivery_tracking.csv.');
    window.location.href = 'santos_delivery_tracking.csv';
    return;
  }

  const headers = [
    'Tracking_Number', 'Order_ID', 'Date', 'Customer_Name', 'Phone',
    'City', 'Address', 'Product', 'Quantity', 'COD_Amount_MAD',
    'Carrier', 'Delivery_Status', 'Payment_Status', 'Notes'
  ];

  const rows = orders.map((o, idx) => {
    const trk = 'SN-TRK-' + (784024 + idx);
    const client = `${o.customer?.firstName || ''} ${o.customer?.lastName || ''}`.trim();
    let productDesc = '';
    if (o.item) {
      if (o.item.cartItems && o.item.cartItems.length > 0) {
        productDesc = o.item.cartItems.map(it => `${it.qty}x ${it.name} (${it.size || 'M'}, ${it.color || ''})`).join(' + ');
      } else {
        productDesc = `${o.item.title || ''} (${o.item.size || 'M'}, ${o.item.color || ''})`;
      }
    }
    const cleanTotal = (o.total || '0').replace(/[^\d.]/g, '');

    return [
      trk,
      o.orderId || ('SN-' + (100000 + idx)),
      o.date ? new Date(o.date).toISOString().replace('T', ' ').slice(0, 16) : '',
      `"${client.replace(/"/g, '""')}"`,
      `"${o.customer?.phone || ''}"`,
      `"${o.customer?.city || ''}"`,
      `"${(o.customer?.address || '').replace(/"/g, '""')}"`,
      `"${productDesc.replace(/"/g, '""')}"`,
      o.quantity || 1,
      cleanTotal,
      'Cathedis Express',
      'En attente de confirmation',
      'À encaisser à la livraison',
      '"Commande passée via EasySell COD"'
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `santos_livraisons_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Global Exports
window.createChoiceCardHtml = createChoiceCardHtml;
window.initChoiceExperience = initChoiceExperience;
window.renderChoiceSection = renderChoiceSection;
window.openCodCheckout = openCodCheckout;
window.closeCodCheckout = closeCodCheckout;
window.selectBundle = selectBundle;
window.applyCodCoupon = applyCodCoupon;
window.submitCodOrder = submitCodOrder;
window.cycleCardImage = cycleCardImage;
window.switchCardColor = switchCardColor;
window.setChoiceCategory = setChoiceCategory;
window.toggleChoiceShowAll = toggleChoiceShowAll;
window.openChoiceQuickView = openChoiceQuickView;
window.exportDeliveryCsv = exportDeliveryCsv;
