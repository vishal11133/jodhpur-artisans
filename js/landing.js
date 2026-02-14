(function () {
  var container = document.getElementById('trending-products');
  var newsletterForm = document.getElementById('newsletter-form');
  var newsletterMessage = document.getElementById('newsletter-message');

  function formatPrice(n) {
    var x = Number(n);
    if (isNaN(x)) return '0';
    return x % 1 === 0 ? String(Math.round(x)) : x.toFixed(2);
  }

  function renderProductCard(p) {
    var badge = p.badge === 'new_arrival' ? '<span class="absolute top-4 left-4 bg-white/90 backdrop-blur text-primary text-xs font-bold px-2 py-1 rounded">NEW ARRIVAL</span>' : (p.badge === 'best_seller' ? '<span class="absolute top-4 left-4 bg-accent-gold text-white text-xs font-bold px-2 py-1 rounded">BEST SELLER</span>' : '');
    return (
      '<div class="w-full min-w-0 relative bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-xl transition-shadow duration-300 group">' +
        '<a href="product.html?id=' + encodeURIComponent(p.id) + '" class="block">' +
          '<div class="relative aspect-[4/5] overflow-hidden rounded-t-xl bg-gray-100">' +
            '<img alt="" class="w-full h-full object-cover" src="' + (p.image_url || '') + '"/>' + badge +
          '</div>' +
          '<div class="p-6">' +
            '<h3 class="font-bold text-lg text-gray-900 dark:text-white mb-1">' + (p.name || '') + '</h3>' +
            '<p class="text-sm text-gray-500 mb-3">' + (p.category || '') + '</p>' +
            '<div class="flex items-center justify-between">' +
              '<span class="text-primary font-bold text-lg">₹' + formatPrice(p.price) + '</span>' +
            '</div>' +
          '</div>' +
        '</a>' +
        '<button type="button" class="absolute bottom-4 right-4 bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center translate-y-14 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 shadow-lg add-to-cart-btn z-10" data-product-id="' + p.id + '">' +
          '<span class="material-icons text-sm">add_shopping_cart</span>' +
        '</button>' +
      '</div>'
    );
  }

  function renderProducts(products) {
    if (!container) return;
    if (!products || products.length === 0) {
      container.innerHTML = '<p class="text-gray-500 dark:text-gray-400 py-8">No products at the moment. <a href="collection.html" class="text-primary hover:underline">Browse collection</a></p>';
      return;
    }
    container.innerHTML = products.map(renderProductCard).join('');
    container.querySelectorAll('.add-to-cart-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-product-id');
        if (id && window.addToCart) window.addToCart(id, 1);
      });
    });
  }

  if (window.supabase && container) {
    window.supabase.from('products').select('id, name, category, price, image_url, badge').limit(8).order('created_at', { ascending: false })
      .then(function (_ref) {
        var data = _ref.data;
        var err = _ref.error;
        if (err || !data || data.length === 0) {
          renderProducts([]);
        } else {
          renderProducts(data);
        }
      })
      .catch(function () {
        renderProducts([]);
      });
  } else if (container) {
    renderProducts([]);
  }

  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = newsletterForm.querySelector('input[name="email"]');
      var email = input && input.value ? input.value.trim() : '';
      if (!email) return;
      if (newsletterMessage) newsletterMessage.textContent = 'Subscribing…';
      if (window.supabase) {
        window.supabase.from('newsletter_subscribers').insert({ email: email }).then(function (_ref) {
          var err = _ref.error;
          if (newsletterMessage) newsletterMessage.textContent = err ? 'Something went wrong. Try again.' : 'Thank you for subscribing!';
          if (!err) input.value = '';
        }).catch(function () {
          if (newsletterMessage) newsletterMessage.textContent = 'Something went wrong. Try again.';
        });
      } else {
        if (newsletterMessage) newsletterMessage.textContent = 'Thank you for your interest! We’ll be in touch.';
        input.value = '';
      }
    });
  }
})();
