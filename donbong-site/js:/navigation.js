import { fetchProducts, applyFilters, showProductModal, allProducts } from './products.js';
import { renderFavorites, toggleFavorite } from './favorites.js';
import { addToCart, checkout, renderCartModal } from './cart.js';
import { closeModal, showToast } from './utils.js';
import { mountPurityAudit } from '../components/PurityAudit.js';
import { mountSocialHub } from '../components/SocialHub.js';

window.showProductModal = showProductModal;
window.toggleFavorite = toggleFavorite;
window.addToCart = addToCart;
window.closeModal = closeModal;

async function loadPage(pageId, containerId = 'page-container') {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  try {
    const response = await fetch(`pages/${pageId}.html`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    container.innerHTML = html;
    
    if (pageId === 'home') {
      await loadBlocks();
    } else if (pageId === 'shop') {
      await fetchProducts();
      attachShopFilters();
    } else if (pageId === 'favorites') {
      if (allProducts && allProducts.length) {
        renderFavorites(allProducts);
      } else {
        await fetchProducts();
        renderFavorites(allProducts);
      }
    }
  } catch (err) {
    console.error(`Failed to load page ${pageId}:`, err);
    container.innerHTML = `<div class="container" style="padding-top:140px;"><h1>Error loading page</h1><p>${err.message}</p></div>`;
  }
}

async function loadBlocks() {
  const blocks = ['hero', 'why', 'partners', 'science', 'deals', 'testimonials', 'join', 'story', 'social'];
  for (const block of blocks) {
    try {
      const resp = await fetch(`blocks/${block}.html`);
      const html = await resp.text();
      const placeholder = document.getElementById(`${block}-block`);
      if (placeholder) {
        placeholder.innerHTML = html;
        // После вставки HTML с id="purityRoot" монтируем React‑компонент
        if (block === 'science') {
          mountPurityAudit('purityRoot');
        }
        // После вставки блока social монтируем социальную панель
        if (block === 'social') {
          mountSocialHub('socialHubRoot');
        }
      }
    } catch (e) {
      console.warn(`Block ${block} not found`);
    }
  }
}

function attachShopFilters() {
  const catFilter = document.getElementById('categoryFilter');
  const brandFilter = document.getElementById('brandFilter');
  const sortSelect = document.getElementById('sortSelect');
  if (catFilter) catFilter.addEventListener('change', applyFilters);
  if (brandFilter) brandFilter.addEventListener('change', applyFilters);
  if (sortSelect) sortSelect.addEventListener('change', applyFilters);
}

export function showPage(pageId) {
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active-nav'));
  document.querySelectorAll(`.nav-btn[data-page="${pageId}"]`).forEach(btn => btn.classList.add('active-nav'));
  loadPage(pageId);
  const navLinks = document.getElementById('navLinks');
  if (navLinks) navLinks.classList.remove('open');
  window.scrollTo(0, 0);
}

export function initNavigation() {
  document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const page = el.getAttribute('data-page');
      showPage(page);
    });
  });
  
  const cartIcon = document.getElementById('cartIconBtn');
  if (cartIcon) {
    cartIcon.addEventListener('click', () => {
      renderCartModal();
      document.getElementById('cartModal').classList.add('open');
    });
  }
  
  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', checkout);
  }
  
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && e.target !== menuToggle) {
        navLinks.classList.remove('open');
      }
    });
  }
  
  const fabBtn = document.getElementById('rnd-btn');
  const fabMenu = document.getElementById('fab-menu');
  if (fabBtn && fabMenu) {
    fabBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fabMenu.classList.toggle('active');
    });
    document.addEventListener('click', (e) => {
      if (fabMenu && !fabMenu.contains(e.target) && e.target !== fabBtn) {
        fabMenu.classList.remove('active');
      }
    });
  }
  
  const subscribeBtn = document.getElementById('subscribeBtn');
  if (subscribeBtn) {
    subscribeBtn.addEventListener('click', () => {
      const email = document.getElementById('subscribeEmail')?.value.trim();
      if (email) {
        showToast(`Thanks ${email}!`);
        document.getElementById('subscribeEmail').value = '';
      } else {
        showToast('Enter email');
      }
    });
  }
  
  const b2bForm = document.getElementById('b2bForm');
  if (b2bForm) {
    b2bForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Request sent (demo)');
      e.target.reset();
    });
  }
  const b2cForm = document.getElementById('b2cForm');
  if (b2cForm) {
    b2cForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Application sent (demo)');
      e.target.reset();
    });
  }
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Message sent (demo)');
      e.target.reset();
    });
  }
  
  const prevSlide = document.getElementById('prevSlide');
  const nextSlide = document.getElementById('nextSlide');
  const track = document.getElementById('testimonialTrack');
  if (prevSlide && nextSlide && track) {
    let idx = 0;
    const total = track.children.length;
    prevSlide.addEventListener('click', () => {
      idx = (idx - 1 + total) % total;
      track.style.transform = `translateX(-${idx * 100}%)`;
    });
    nextSlide.addEventListener('click', () => {
      idx = (idx + 1) % total;
      track.style.transform = `translateX(-${idx * 100}%)`;
    });
  }
}

export function initDefaultPage() {
  showPage('home');
}