export const formatCurrency = (value) =>
  `${Math.round(Number(value || 0)).toLocaleString('vi-VN')}đ`;

export const sum = (items = []) => items.reduce((total, item) => total + Number(item || 0), 0);

export const toNumeric = (value) => {
  const numeric = Number(String(value).replace(/\D/g, '')) || 0;
  return Number.isFinite(numeric) ? numeric : 0;
};

export const sanitizeText = (text = '') => String(text).trim();
