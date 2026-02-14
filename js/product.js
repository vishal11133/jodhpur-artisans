(function () {
  var loadingEl = document.getElementById('product-loading');
  var notFoundEl = document.getElementById('product-not-found');
  var blockEl = document.getElementById('product-block');
  var imageEl = document.getElementById('product-image');
  var badgeEl = document.getElementById('product-badge');
  var nameEl = document.getElementById('product-name');
  var categoryEl = document.getElementById('product-category');
  var priceEl = document.getElementById('product-price');
  var descriptionEl = document.getElementById('product-description');
  var addBtn = document.getElementById('product-add-to-cart');

  var FETCH_TIMEOUT_MS = 10000;

  function formatPrice(n) {
    var x = Number(n);
    if (isNaN(x)) return '0';
    return x % 1 === 0 ? String(Math.round(x)) : x.toFixed(2);
  }

  function show(el, show) {
    if (el) el.classList.toggle('hidden', !show);
  }

  function showNotFound() {
    show(loadingEl, false);
    show(blockEl, false);
    show(notFoundEl, true);
  }

  var params = new URLSearchParams(window.location.search);
  var id = params.get('id');
  if (!id && window.location.pathname) {
    var m = window.location.pathname.match(/\/product\/?([^/]+)/);
    if (m) id = m[1];
  }
  if (id === 'undefined' || id === 'null' || id === '') id = null;

  if (!id) {
    showNotFound();
    return;
  }

  if (!window.supabase) {
    showNotFound();
    return;
  }

  var timeoutPromise = new Promise(function (_, reject) {
    setTimeout(function () {
      reject(new Error('timeout'));
    }, FETCH_TIMEOUT_MS);
  });

  var fetchPromise = window.supabase
    .from('products')
    .select('id, name, category, price, description, image_url, badge')
    .eq('id', id)
    .single();

  Promise.race([fetchPromise, timeoutPromise])
    .then(function (_ref) {
      var data = _ref.data;
      var err = _ref.error;
      show(loadingEl, false);
      if (err || !data) {
        showNotFound();
        return;
      }
      show(notFoundEl, false);
      show(blockEl, true);
      if (imageEl) imageEl.src = data.image_url || '';
      if (nameEl) nameEl.textContent = data.name || '';
      if (categoryEl) categoryEl.textContent = data.category || '';
      if (priceEl) priceEl.textContent = '₹' + formatPrice(data.price);
      if (descriptionEl) {
        descriptionEl.textContent = data.description || '';
        descriptionEl.classList.toggle('hidden', !data.description);
      }
      if (badgeEl) {
        if (data.badge === 'new_arrival') {
          badgeEl.textContent = 'NEW ARRIVAL';
          badgeEl.className = 'absolute top-4 left-4 bg-white/90 backdrop-blur text-primary text-xs font-bold px-2 py-1 rounded';
          badgeEl.classList.remove('hidden');
        } else if (data.badge === 'best_seller') {
          badgeEl.textContent = 'BEST SELLER';
          badgeEl.className = 'absolute top-4 left-4 bg-accent-gold text-white text-xs font-bold px-2 py-1 rounded';
          badgeEl.classList.remove('hidden');
        } else {
          badgeEl.classList.add('hidden');
        }
      }
      if (addBtn) {
        addBtn.addEventListener('click', function () {
          if (window.addToCart) window.addToCart(data.id, 1);
        });
      }
    })
    .catch(function () {
      showNotFound();
    });
})();
