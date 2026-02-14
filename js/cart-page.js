(function () {
  var cartItemsEl = document.getElementById('cart-items');
  var cartEmptyEl = document.getElementById('cart-empty');
  var cartFooterEl = document.getElementById('cart-footer');
  var cartSubtotalEl = document.getElementById('cart-subtotal');

  function formatPrice(n) {
    var x = Number(n);
    if (isNaN(x)) return '0';
    return x % 1 === 0 ? String(Math.round(x)) : x.toFixed(2);
  }

  function loadCartPage() {
    var items = window.getCart ? window.getCart() : [];
    if (items.length === 0) {
      if (cartItemsEl) cartItemsEl.innerHTML = '';
      if (cartEmptyEl) cartEmptyEl.classList.remove('hidden');
      if (cartFooterEl) cartFooterEl.classList.add('hidden');
      return;
    }
    if (cartEmptyEl) cartEmptyEl.classList.add('hidden');
    if (cartFooterEl) cartFooterEl.classList.remove('hidden');

    var ids = items.map(function (i) { return i.productId; });
    function renderWithProducts(productsMap) {
      var total = 0;
      var html = items.map(function (item) {
        var p = productsMap[item.productId] || {};
        var price = p.price != null ? Number(p.price) : 0;
        var qty = item.quantity || 1;
        total += price * qty;
        return (
          '<div class="flex gap-6 py-6 border-b border-gray-200 dark:border-gray-700 cart-row" data-product-id="' + item.productId + '">' +
            '<div class="w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">' +
              '<img alt="" class="w-full h-full object-cover" src="' + (p.image_url || '') + '"/>' +
            '</div>' +
            '<div class="flex-grow min-w-0">' +
              '<h3 class="font-bold text-gray-900 dark:text-white">' + (p.name || 'Product') + '</h3>' +
              '<p class="text-primary font-semibold mt-1">₹' + formatPrice(price) + '</p>' +
              '<div class="mt-2 flex items-center gap-2">' +
                '<label class="text-sm text-gray-500">Qty</label>' +
                '<input type="number" min="1" class="cart-qty w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="' + qty + '" data-product-id="' + item.productId + '"/>' +
                '<button type="button" class="text-red-600 hover:text-red-700 text-sm cart-remove" data-product-id="' + item.productId + '">Remove</button>' +
              '</div>' +
            '</div>' +
            '<div class="font-semibold text-gray-900 dark:text-white">₹' + formatPrice(price * qty) + '</div>' +
          '</div>'
        );
      }).join('');
      if (cartItemsEl) cartItemsEl.innerHTML = html;
      if (cartSubtotalEl) cartSubtotalEl.textContent = '₹' + formatPrice(total);

      cartItemsEl.querySelectorAll('.cart-qty').forEach(function (input) {
        input.addEventListener('change', function () {
          var id = input.getAttribute('data-product-id');
          var val = parseInt(input.value, 10);
          if (window.setCartQuantity && id) window.setCartQuantity(id, isNaN(val) ? 1 : Math.max(1, val));
          loadCartPage();
        });
      });
      cartItemsEl.querySelectorAll('.cart-remove').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-product-id');
          if (window.removeFromCart && id) window.removeFromCart(id);
          loadCartPage();
        });
      });
    }

    if (window.supabase && ids.length > 0) {
      window.supabase.from('products').select('id, name, price, image_url').in('id', ids).then(function (_ref) {
        var data = _ref.data;
        var map = {};
        (data || []).forEach(function (p) { map[p.id] = p; });
        renderWithProducts(map);
      }).catch(function () {
        renderWithProducts({});
      });
    } else {
      renderWithProducts({});
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCartPage);
  } else {
    loadCartPage();
  }
})();
