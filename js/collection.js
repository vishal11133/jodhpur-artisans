(function () {
  var grid = document.getElementById('products-grid');
  var titleEl = document.getElementById('page-title');
  var subtitleEl = document.getElementById('page-subtitle');

  function formatPrice(n) {
    var x = Number(n);
    if (isNaN(x)) return '0';
    return x % 1 === 0 ? String(Math.round(x)) : x.toFixed(2);
  }

  var categoryLabels = {
    furniture: 'Furniture',
    decor: 'Decor',
    textiles: 'Textiles',
    bone_inlay: 'Bone Inlay',
    metal_decor: 'Metal Decor',
    woodwork: 'Antique Woodwork',
    'Bedroom Furniture': 'Bedroom Furniture',
    'Living Room': 'Living Room',
    'Wall Decor': 'Wall Decor',
    Seating: 'Seating'
  };

  function getQuery() {
    var params = new URLSearchParams(window.location.search);
    return {
      category: params.get('category') || '',
      badge: params.get('badge') || ''
    };
  }

  function renderProduct(p) {
    var badge = p.badge === 'new_arrival'
      ? '<span class="absolute top-4 left-4 bg-white/90 backdrop-blur text-primary text-xs font-bold px-2 py-1 rounded">NEW ARRIVAL</span>'
      : (p.badge === 'best_seller' ? '<span class="absolute top-4 left-4 bg-accent-gold text-white text-xs font-bold px-2 py-1 rounded">BEST SELLER</span>' : '');
    return (
      '<div class="max-w-sm w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-xl transition-shadow duration-300 group">' +
        '<div class="relative aspect-[4/5] overflow-hidden rounded-t-xl bg-gray-100">' +
          '<img alt="" class="w-full h-full object-cover" src="' + (p.image_url || '') + '"/>' + badge +
          '<button type="button" class="absolute bottom-4 right-4 bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center translate-y-14 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 shadow-lg add-to-cart" data-product-id="' + p.id + '">' +
            '<span class="material-icons text-sm">add_shopping_cart</span>' +
          '</button>' +
        '</div>' +
        '<div class="p-6">' +
          '<h3 class="font-bold text-lg text-gray-900 dark:text-white mb-1">' + (p.name || '') + '</h3>' +
          '<p class="text-sm text-gray-500 mb-3">' + (p.category || '') + '</p>' +
          '<div class="flex items-center justify-between">' +
            '<span class="text-primary font-bold text-lg">₹' + formatPrice(p.price) + '</span>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function render(products) {
    if (!grid) return;
    if (!products || products.length === 0) {
      grid.innerHTML = '<p class="text-gray-500 col-span-full py-12">No products found.</p>';
      return;
    }
    grid.innerHTML = products.map(renderProduct).join('');
    grid.querySelectorAll('.add-to-cart').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-product-id');
        if (id && window.addToCart) window.addToCart(id, 1);
      });
    });
  }

  var q = getQuery();
  if (q.category && titleEl) titleEl.textContent = categoryLabels[q.category] || q.category;
  if (q.badge && titleEl) titleEl.textContent = (q.badge === 'new_arrival' ? 'New Arrivals' : 'Best Sellers');

  if (window.supabase) {
    var query = window.supabase.from('products').select('id, name, category, price, image_url, badge');
    if (q.category) {
      query = query.or('category.eq.' + q.category + ',category.ilike.%' + q.category + '%');
    }
    if (q.badge) {
      query = query.eq('badge', q.badge);
    }
    query.order('created_at', { ascending: false }).then(function (_ref) {
      var data = _ref.data;
      var err = _ref.error;
      if (err) {
        render([]);
        return;
      }
      render(data || []);
    }).catch(function () {
      render([]);
    });
  } else {
    render([]);
  }
})();
