import { updateBadges } from './cart.js';
import { showToast, formatPrice, getStarsHtml, escapeHtml } from './utils.js';

let favorites = JSON.parse(localStorage.getItem('donbong_favs') || '[]');

function saveFavorites() {
  localStorage.setItem('donbong_favs', JSON.stringify(favorites));
  updateBadges();
  const favCountSpan = document.getElementById('favCount');
  if (favCountSpan) favCountSpan.textContent = favorites.length;
}

export function toggleFavorite(id) {
  const idx = favorites.indexOf(id);
  if (idx > -1) {
    favorites.splice(idx, 1);
    showToast('Removed from favorites');
  } else {
    favorites.push(id);
    showToast('Added to favorites');
  }
  saveFavorites();
}

export function isFavorite(id) {
  return favorites.includes(id);
}

export function getFavorites() {
  return [...favorites];
}

export function renderFavorites(allProducts) {
  const grid = document.getElementById('favsGrid');
  if (!grid) return;
  const favItems = allProducts.filter(p => favorites.includes(p.id));
  if (!favItems.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;">No favourites</div>';
    return;
  }
  grid.innerHTML = favItems.map(p => `
    <div class="card" data-id="${p.id}">
      <button class="fav-btn" data-id="${p.id}" style="border-color:var(--accent)">❤️</button>
      <img src="${escapeHtml(p.image)}" class="card-img" alt="${escapeHtml(p.name)}">
      <div class="card-body">
        <div class="card-cat">${escapeHtml(p.category)}</div>
        <div class="card-title">${escapeHtml(p.name)}</div>
        <div class="stars">${getStarsHtml(p.rating || 0)}</div>
        <div class="card-price">${formatPrice(p.price)}</div>
        <button class="btn-ghost add-btn" data-id="${p.id}" style="margin-top:12px;">Add to Cart</button>
      </div>
    </div>
  `).join('');
  
  // обработчики для кнопок добавления в корзину
  document.querySelectorAll('#favsGrid .add-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const product = allProducts.find(p => p.id === btn.dataset.id);
      if (product) {
        import('./cart.js').then(({ addToCart }) => addToCart(product));
      }
    });
  });
  document.querySelectorAll('#favsGrid .fav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(btn.dataset.id);
      renderFavorites(allProducts);
    });
  });
}