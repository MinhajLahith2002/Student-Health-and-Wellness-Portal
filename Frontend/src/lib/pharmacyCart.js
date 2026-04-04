import { resolveAssetUrl } from './api';

const CART_KEY = 'pharmacy_cart';

const curatedFallbackImages = {
  amoxicillin: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=900',
  cetirizine: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&q=80&w=900',
  ibuprofen: 'https://images.unsplash.com/photo-1631549916768-4119cb8e0f72?auto=format&fit=crop&q=80&w=900',
  paracetamol: 'https://images.unsplash.com/photo-1599806112334-d01d17564103?auto=format&fit=crop&q=80&w=900',
  vitamins: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=900',
  allergy: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&q=80&w=900',
  antibiotics: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=900',
  pain: 'https://images.unsplash.com/photo-1631549916768-4119cb8e0f72?auto=format&fit=crop&q=80&w=900',
  firstaid: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&q=80&w=900',
  wellness: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?auto=format&fit=crop&q=80&w=900',
  personalcare: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=900',
  hygiene: 'https://images.unsplash.com/photo-1583947582886-f40ec95dd752?auto=format&fit=crop&q=80&w=900'
};

function normalizeLookupText(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '');
}

export function getProductFallbackImage(product = {}) {
  const normalizedName = normalizeLookupText(product.name);
  const normalizedCategory = normalizeLookupText(product.category);

  for (const [key, image] of Object.entries(curatedFallbackImages)) {
    if (normalizedName.includes(key) || normalizedCategory.includes(key)) {
      return image;
    }
  }

  return '';
}

export function getProductPlaceholderImage(product = {}) {
  const title = String(product.name || 'Campus Pharmacy').slice(0, 28);
  const subtitle = String(product.category || 'Wellness item').slice(0, 30);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#eef8fa"/>
          <stop offset="55%" stop-color="#dff1f6"/>
          <stop offset="100%" stop-color="#c6e6ee"/>
        </linearGradient>
      </defs>
      <rect width="600" height="600" rx="48" fill="url(#bg)"/>
      <circle cx="300" cy="220" r="92" fill="#14748B" opacity="0.12"/>
      <rect x="208" y="158" width="184" height="124" rx="28" fill="#14748B" opacity="0.18"/>
      <rect x="272" y="120" width="56" height="200" rx="20" fill="#14748B"/>
      <rect x="200" y="192" width="200" height="56" rx="20" fill="#14748B"/>
      <text x="300" y="408" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="700" fill="#102438">${title}</text>
      <text x="300" y="452" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="22" fill="#557082">${subtitle}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function getProductImage(product = {}) {
  const resolvedImage = resolveAssetUrl(product.image || product.imageUrl || '');
  return resolvedImage || getProductFallbackImage(product) || getProductPlaceholderImage(product);
}

function normalizeCartItem(item = {}) {
  return {
    ...item,
    image: getProductImage(item)
  };
}

export function getCartItems() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.map(normalizeCartItem) : [];
  } catch {
    return [];
  }
}

export function saveCartItems(items) {
  localStorage.setItem(CART_KEY, JSON.stringify((items || []).map(normalizeCartItem)));
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
}

export function getCartCount() {
  return getCartItems().reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
}

export function addItemToCart(product, quantity = 1) {
  const currentItems = getCartItems();
  const productId = product._id || product.id;
  const normalizedProduct = normalizeCartItem(product);

  const nextItems = currentItems.some((item) => (item._id || item.id) === productId)
    ? currentItems.map((item) =>
        (item._id || item.id) === productId
          ? { ...item, quantity: (Number(item.quantity) || 1) + quantity }
          : item
      )
    : [...currentItems, { ...normalizedProduct, quantity }];

  saveCartItems(nextItems);
  return nextItems;
}
