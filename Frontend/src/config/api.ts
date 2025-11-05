// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://meta-drip.onrender.com';

export const API_ENDPOINTS = {
  products: `${API_BASE_URL}/api/products`,
  admin: `${API_BASE_URL}/api/admin`,
  wishlist: `${API_BASE_URL}/api/wishlist`,
  reviews: `${API_BASE_URL}/api/reviews`,
  health: `${API_BASE_URL}/api/health`,
};
