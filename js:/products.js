import { CONFIG } from './config.js';
import { formatPrice, escapeHtml, showToast, getStarsHtml } from './utils.js';
import { addToCart } from './cart.js';
import { toggleFavorite, isFavorite } from './favorites.js';

export let allProducts = [];
let filteredProducts = [];
let currentPage = 1;

export async function fetchProducts() {
  try {
    if (!CONFIG.API_URL || CONFIG.API_URL.includes('YOUR_DEPLOYMENT_ID')) {
      console.warn('⚠️ Google Apps Script API не настроен. Используются демо-данные.');
      loadDemoProducts();
      return;
    }
    console.log('📥 Загрузка товаров из Google Sheets...');
    const res = await fetch(CONFIG.API_URL + '?action=all');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    if (!data.products || !Array.isArray(data.products)) throw new Error('Invalid response format');
    
    allProducts = data.products.map(p => ({
      id: String(p.id || Math.random()),
      name: p.name || 'Unnamed Product',
      category: p.category || 'Accessories',
      brand: p.brand || 'Don Bong',
      price: parseFloat(p.price) || 0,
      oldPrice: parseFloat(p.oldPrice) || 0,
      description: p.description || p.briefDesc || 'Premium quality product',
      image: p.imageUrl || 'https://placehold.co/300x300/1a1a1a/1FDF67?text=Product',
      gallery: p.gallery && Array.isArray(p.gallery) ? p.gallery.filter(url => url && url.trim()) : [],
      inStock: true, // временно, пока из таблицы не приходит stock
      stockQty: 999,
      sku: p.id || '',
      rating: 0
    }));
    
    console.log(`✅ Загружено ${allProducts.length} товаров`);
    updateFiltersUI();
    applyFilters();
  } catch (e) {
    console.error('❌ Ошибка загрузки товаров:', e);
    loadDemoProducts();
  }
}

function loadDemoProducts() {
  allProducts = [
    { id: '1', name: 'River Bongs & Bubble', category: 'Bongs', brand: 'Don Bong', price: 2500000, oldPrice: 2800000, description: 'Premium glass bong with advanced percolation', image: 'https://placehold.co/300x300/1a1a1a/1FDF67?text=River+Bong', gallery: [], inStock: true, stockQty: 10, sku: '001', rating: 4.5 },
    { id: '2', name: 'Gravity Bongs & Smoke', category: 'Bongs', brand: 'Don Bong', price: 3790000, oldPrice: 4200000, description: 'Innovative gravity-based smoking device', image: 'https://placehold.co/300x300/1a1a1a/1FDF67?text=Gravity+Bong', gallery: [], inStock: true, stockQty: 8, sku: '002', rating: 4.8 },
    { id: '3', name: 'Phoenix Bongs & Smoke', category: 'Bongs', brand: 'Don Bong', price: 2200000, oldPrice: 2500000, description: 'Luxury smoking accessory with premium design', image: 'https://placehold.co/300x300/1a1a1a/1FDF67?text=Phoenix+Bong', gallery: [], inStock: true, stockQty: 12, sku: '003', rating: 4.2 },
    { id: '4', name: 'DaBM Vaporizers', category: 'Vaporizers', brand: 'Don Bong', price: 8100000, oldPrice: 9000000, description: 'Advanced electronic vaporizer with temperature control', image: 'https://placehold.co/300x300/1a1a1a/1FDF67?text=Vaporizer', gallery: [], inStock: true, stockQty: 5, sku: '004', rating: 5.0 },
    { id: '5', name: 'Bulldo Grinders', category: 'Grinders', brand: 'Don Bong', price: 5000, oldPrice: 6000, description: 'Precision grinding for perfect preparation', image: 'https://placehold.co/300x300/1a1a1a/1FDF67?text=Grinder', gallery: [], inStock: true, stockQty: 20, sku: '005', rating: 4.0 },
    { id: '6', name: 'Steel Cleaning Tools', category: 'Cleaning', brand: 'Don Bong', price: 1000, oldPrice: 1500, description: 'Professional cleaning kit for maintenance', image: 'https://placehold.co/300x300/1a1a1a/1FDF67?text=Cleaning+Kit', gallery: [], inStock: true, stockQty: 30, sku: '006', rating: 4.3 }
  ];
  updateFiltersUI();
  applyFilters();
}

function updateFiltersUI() {
  const cats = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
  const brands = [...new Set(allProducts.map(p => p.brand).filter(Boolean))];
  const catSel = document.getElementById('categoryFilter');
  if (catSel) catSel.innerHTML = '<option value="">All Categories</option>' + cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  const brSel = document.getElementById('brandFilter');
  if (brSel) brSel.innerHTML = '<option value="">All Brands</option>' + brands.map(b => `<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`).join('');
}

export function applyFilters() {
  const cat = document.getElementById('categoryFilter')?.value || '';
  const brand = document.getElementById('brandFilter')?.value || '';
  const sort = document.getElementById('sortSelect')?.value || 'name';
  let f = allProducts.slice();
  if (cat) f = f.filter(p => p.category === cat);
  if (brand) f = f.filter(p => p.brand === brand);
  if (sort === 'price-asc') f.sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') f.sort((a, b) => b.price - a.price);
  else f.sort((a, b) => a.name.localeCompare(b.name));
  filteredProducts = f;
  const countSpan = document.getElementById('productCount');
  if (countSpan) countSpan.innerText = filteredProducts.length;
  currentPage = 1;
  renderProducts();
}

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  const start = (currentPage - 1) * CONFIG.PER_PAGE;
  const items = filteredProducts.slice(start, start + CONFIG.PER_PAGE);
  if (!items.length) {
    grid.innerHTML = '<div style="grid-column:1/-1; text-align:center;padding:60px;">No products found</div>';
    document.getElementById('pagination').innerHTML = '';
    return;
  }
  
  grid.innerHTML = items.map(p => `
    <div class="card" data-id="${p.id}" style="cursor:pointer;" onclick="window.showProductModal('${escapeHtml(p.id)}')">  
      <button class="fav-btn" data-id="${p.id}" style="border-color:${isFavorite(p.id) ? 'var(--accent)' : 'var(--border-light)'}" onclick="event.stopPropagation(); window.toggleFavorite('${escapeHtml(p.id)}')">  
        ${isFavorite(p.id) ? '❤️' : '🤍'}
      </button>
      <img src="${escapeHtml(p.image)}" class="card-img" onerror="this.src='https://placehold.co/300x300/1a1a1a/1FDF67?text=Product'" alt="${escapeHtml(p.name)}">
      <div class="card-body">
        <div class="card-cat">${escapeHtml(p.category)}</div>
        <div class="card-title">${escapeHtml(p.name)}</div>
        <div class="stars">${getStarsHtml(p.rating || 0)}</div>
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
          <div class="card-price">${formatPrice(p.price)}</div>
          <button class="btn-ghost add-btn" data-id="${p.id}" style="padding:6px 16px;" onclick="event.stopPropagation(); window.addToCart({id:'${escapeHtml(p.id)}',name:'${escapeHtml(p.name)}',price:${p.price},image:'${escapeHtml(p.image)}'});">+ Add</button>
        </div>
      </div>
    </div>
  `).join('');
  
  const totalPages = Math.ceil(filteredProducts.length / CONFIG.PER_PAGE);
  const pag = document.getElementById('pagination');
  if (totalPages <= 1) {
    pag.innerHTML = '';
    return;
  }
  pag.innerHTML = Array.from({ length: totalPages }, (_, i) => 
    `<button class="page-btn ${i + 1 === currentPage ? 'active' : ''}" data-page="${i + 1}">${i + 1}</button>`
  ).join('');
  document.querySelectorAll('.page-btn').forEach(b => 
    b.addEventListener('click', () => {
      currentPage = parseInt(b.dataset.page);
      renderProducts();
      window.scrollTo(0, 0);
    })
  );
}

export function showProductModal(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;
  const modal = document.getElementById('productModal');
  const content = document.getElementById('modalContent');
  const galleryHtml = product.gallery && product.gallery.length > 0 
    ? product.gallery.map((img, idx) => `<img src="${escapeHtml(img)}" style="max-width:100%; height:auto; border-radius:12px; margin-bottom:12px; cursor:pointer;" alt="Gallery ${idx + 1}">`).join('')
    : '';
  content.innerHTML = `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:32px; align-items:start;">
      <div>
        <img src="${escapeHtml(product.image)}" style="width:100%; border-radius:16px; margin-bottom:20px;" alt="${escapeHtml(product.name)}">
        ${galleryHtml ? `<div style="border-top:1px solid var(--border-light); padding-top:20px;">${galleryHtml}</div>` : ''}
      </div>
      <div>
        <div style="color:var(--accent); font-size:14px; font-weight:700; margin-bottom:8px;">${escapeHtml(product.category)}</div>
        <h2 style="font-size:32px; margin-bottom:16px;">${escapeHtml(product.name)}</h2>
        <div style="display:flex; gap:16px; align-items:center; margin-bottom:24px;">
          <div style="font-size:24px; color:var(--accent); font-weight:700;">${formatPrice(product.price)}</div>
          ${product.oldPrice ? `<div style="text-decoration:line-through; color:var(--text-tertiary);">${formatPrice(product.oldPrice)}</div>` : ''}
        </div>
        <div style="color:var(--text-secondary); line-height:1.6; margin-bottom:24px;">${escapeHtml(product.description)}</div>
        <div style="display:flex; gap:12px;">
          <button class="btn-primary" style="flex:1;" onclick="window.addToCart({id:'${escapeHtml(product.id)}',name:'${escapeHtml(product.name)}',price:${product.price},image:'${escapeHtml(product.image)}'});window.closeModal();">Add to Cart</button>
          <button class="btn-ghost" style="flex:1;" onclick="window.toggleFavorite('${escapeHtml(product.id)}')">Favorite</button>
        </div>
        <div style="margin-top:24px; padding-top:24px; border-top:1px solid var(--border-light);">
          <div style="font-weight:700; margin-bottom:12px;">Product Details</div>
          <div style="color:var(--text-secondary); font-size:14px;">
            <div>Brand: ${escapeHtml(product.brand)}</div>
            <div>Stock: ${product.stockQty > 0 ? 'In Stock' : 'Out of Stock'}</div>
            <div>SKU: ${escapeHtml(product.sku)}</div>
          </div>
        </div>
      </div>
    </div>
  `;
  modal.classList.add('open');
}