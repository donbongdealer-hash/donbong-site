import { initNavigation, initDefaultPage } from './navigation.js';
import { updateBadges } from './cart.js';
import { fetchProducts } from './products.js';

async function init() {
  initNavigation();
  await fetchProducts();
  updateBadges();
  initDefaultPage();
}

document.addEventListener('DOMContentLoaded', init);