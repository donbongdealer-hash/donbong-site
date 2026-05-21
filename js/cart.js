import { showToast, formatPrice, closeModal, escapeHtml } from './utils.js';
import { CONFIG } from './config.js';

let cart = JSON.parse(localStorage.getItem('donbong_cart') || '[]');

function saveCart() {
  localStorage.setItem('donbong_cart', JSON.stringify(cart));
  updateBadges();
  renderCartModal();
}

export function updateBadges() {
  const total = cart.reduce((s, i) => s + i.qty, 0);
  const badge = document.getElementById('cartBadge');
  if (badge) {
    badge.textContent = total;
    badge.style.display = total > 0 ? 'flex' : 'none';
  }
  const favCount = document.getElementById('favCount');
  // favCount обновляется в favorites.js
}

export function addToCart(product) {
  const existing = cart.find(i => i.id === product.id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  saveCart();
  showToast(`${product.name} added to cart`);
}

export function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
}

export function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (item) {
    item.qty += delta;
    if (item.qty <= 0) {
      removeFromCart(id);
    } else {
      saveCart();
    }
  }
}

export function renderCartModal() {
  const container = document.getElementById('cartItems');
  const totalSpan = document.getElementById('cartTotal');
  if (!container) return;
  
  if (!cart.length) {
    container.innerHTML = '<p style="text-align:center;padding:40px;">Cart empty</p>';
    totalSpan.innerHTML = '';
    return;
  }
  
  let total = 0;
  container.innerHTML = cart.map(item => {
    total += item.price * item.qty;
    return `
      <div class="cart-item">
        <div>
          <strong>${escapeHtml(item.name)}</strong><br>
          <span style="color:var(--accent);">${formatPrice(item.price)}</span>
        </div>
        <div>
          <button class="cart-qty-btn" data-id="${item.id}" data-delta="-1">-</button>
          <span>${item.qty}</span>
          <button class="cart-qty-btn" data-id="${item.id}" data-delta="1">+</button>
          <button class="cart-remove-btn" data-id="${item.id}">🗑</button>
        </div>
      </div>
    `;
  }).join('');
  
  totalSpan.innerHTML = `Total: ${formatPrice(total)}`;
  
  document.querySelectorAll('.cart-qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      changeQty(btn.dataset.id, parseInt(btn.dataset.delta));
    });
  });
  document.querySelectorAll('.cart-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      removeFromCart(btn.dataset.id);
    });
  });
}

export async function sendOrderTelegram(orderData) {
  const { name, social, address, items, total, currency, orderId } = orderData;
  if (!CONFIG.TG_TOKEN || !CONFIG.TG_CHAT_ID) {
    console.warn('Telegram not configured');
    return false;
  }
  const itemsText = items.map(i => `• ${i.name} (×${i.qty}) — ${formatPrice(i.price * i.qty)}`).join('\n');
  const msg = `🛍 New Order ${orderId}\n👤 ${name}\n📱 ${social}\n📍 ${address}\n\n📦 Items:\n${itemsText}\n💰 Total (${currency}): ${formatPrice(total)}`;
  try {
    await fetch(`https://api.telegram.org/bot${CONFIG.TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CONFIG.TG_CHAT_ID, text: msg, parse_mode: 'Markdown' })
    });
    return true;
  } catch (e) {
    console.error('Telegram error:', e);
    return false;
  }
}

export async function checkout() {
  const name = document.getElementById('customerName')?.value.trim();
  const contact = document.getElementById('customerContact')?.value.trim();
  const address = document.getElementById('customerAddress')?.value.trim();
  if (!name || !contact || !address) {
    showToast('Fill all fields');
    return;
  }
  if (!cart.length) {
    showToast('Cart empty');
    return;
  }
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const orderId = 'DB-' + Date.now();

  const payload = {
    name,
    contact,
    address,
    items: cart,
    total,
    currency: CONFIG.currentCurrency,
    orderId,
    ua: navigator.userAgent,
    ref: document.referrer || null,
  };

  // Prefer local backend at port 3000, fallback to Telegram notification
  const localUrl = `http://${location.hostname}:3000/orders`;
  let postedToLocal = false;
  try {
    const resp = await fetch(localUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (resp.ok) {
      const data = await resp.json().catch(() => ({}));
      if (data && (data.success || data.orderId)) {
        postedToLocal = true;
        // prefer server-provided orderId when present
        payload.orderId = data.orderId || payload.orderId;
      }
    }
  } catch (e) {
    // network error — will fallback
    console.warn('Local order POST failed:', e);
    postedToLocal = false;
  }

  if (postedToLocal) {
    showToast(`Order received — thank you! Order: ${payload.orderId}`);
    cart = [];
    saveCart();
    closeModal();
    renderCartModal();
    return;
  }

  // Fallback: send via Telegram
  const success = await sendOrderTelegram({
    name,
    social: contact,
    address,
    items: cart,
    total,
    currency: CONFIG.currentCurrency,
    orderId
  });
  if (success) {
    showToast('Order sent via Telegram! We will contact you.');
    cart = [];
    saveCart();
    closeModal();
    renderCartModal();
  } else {
    showToast('Error sending order');
  }
}

export function getCart() {
  return cart;
}
