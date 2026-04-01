import { CONFIG } from './config.js';

// Экранирование HTML
export function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// Форматирование цены с учетом текущей валюты
export function formatPrice(price) {
  if (price === undefined || price === null) return 'On Request';
  const rate = CONFIG.exchangeRates[CONFIG.currentCurrency];
  const converted = price * rate;
  if (CONFIG.currentCurrency === 'VND') {
    return new Intl.NumberFormat('vi-VN').format(Math.round(converted)) + ' ₫';
  } else if (CONFIG.currentCurrency === 'USDT') {
    return '$ ' + converted.toFixed(2);
  } else {
    return new Intl.NumberFormat('ru-RU').format(Math.round(converted)) + ' ₽';
  }
}

// Показ уведомления
export function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

// Закрыть модальное окно
export function closeModal() {
  document.querySelectorAll('.overlay').forEach(m => m.classList.remove('open'));
  document.body.style.overflow = '';
}

// Получить звёзды рейтинга
export function getStarsHtml(rating) {
  const full = Math.round(rating);
  return Array.from({ length: 5 }, (_, i) => {
    return `<span class="${i < full ? 'star-lit' : 'star-dim'}">★</span>`;
  }).join('');
}