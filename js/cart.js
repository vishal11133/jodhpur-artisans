window.CART_KEY = 'house_of_crafts_cart';

function getCart() {
  try {
    var raw = localStorage.getItem(window.CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(window.CART_KEY, JSON.stringify(items));
}

function getCartCount() {
  var items = getCart();
  return items.reduce(function (sum, item) { return sum + (item.quantity || 1); }, 0);
}

function addToCart(productId, quantity) {
  quantity = quantity || 1;
  var items = getCart();
  var found = items.find(function (item) { return item.productId === productId; });
  if (found) {
    found.quantity = (found.quantity || 1) + quantity;
  } else {
    items.push({ productId: productId, quantity: quantity });
  }
  saveCart(items);
  updateCartCountInNav();
}

function removeFromCart(productId) {
  var items = getCart().filter(function (item) { return item.productId !== productId; });
  saveCart(items);
  updateCartCountInNav();
}

function setCartQuantity(productId, quantity) {
  if (quantity <= 0) {
    removeFromCart(productId);
    return;
  }
  var items = getCart();
  var found = items.find(function (item) { return item.productId === productId; });
  if (found) {
    found.quantity = quantity;
  } else {
    items.push({ productId: productId, quantity: quantity });
  }
  saveCart(items);
  updateCartCountInNav();
}

function updateCartCountInNav() {
  var el = document.getElementById('nav-cart-count');
  if (el) {
    var n = getCartCount();
    el.textContent = n;
    el.style.display = n ? 'flex' : 'none';
  }
}

// Run on load so nav shows current count
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateCartCountInNav);
} else {
  updateCartCountInNav();
}
