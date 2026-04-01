// Конфигурация приложения
export const CONFIG = {
  // API для товаров (Google Apps Script)
  API_URL: 'https://script.google.com/macros/s/AKfycbzd6XxxJJ2nPuk_63xg7QK48QlizJXhNRs5fWcgWSSjUJ_VYX_I7FLJdQkAfyxl0_Xl3Q/exec',
  
  // Telegram – замените на свои значения!
  TG_TOKEN: '',   // токен бота (например, '123456:ABC...')
  TG_CHAT_ID: '', // ID чата (например, '123456789')
  
  // Валюты
  exchangeRates: {
    VND: 1,
    USDT: 0.00004,
    RUB: 0.0039
  },
  currentCurrency: 'VND',
  
  // Пагинация
  PER_PAGE: 12,
  
  // Пароль админа (для демо, измените)
  ADMIN_PASSWORD: 'admin123'
};