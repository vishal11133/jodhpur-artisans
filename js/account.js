(function () {
  var loadingEl = document.getElementById('account-loading');
  var loginRequiredEl = document.getElementById('account-login-required');
  var ordersListEl = document.getElementById('orders-list');
  var ordersEmptyEl = document.getElementById('orders-empty');

  function formatPrice(n) {
    var x = Number(n);
    if (isNaN(x)) return '0';
    return x % 1 === 0 ? String(Math.round(x)) : x.toFixed(2);
  }

  function show(el, show) {
    if (el) el.classList.toggle('hidden', !show);
  }

  window.requireAuth('login.html?redirect=' + encodeURIComponent('account.html')).then(function (session) {
    if (!session) return;
    show(loginRequiredEl, false);
    if (!window.supabase) {
      show(loadingEl, false);
      show(ordersEmptyEl, true);
      return;
    }
    window.supabase.from('orders').select('id, status, total, shipping_address, created_at, order_items(products(image_url))').order('created_at', { ascending: false }).then(function (_ref) {
      var data = _ref.data;
      var err = _ref.error;
      show(loadingEl, false);
      if (err || !data || data.length === 0) {
        show(ordersListEl, false);
        show(ordersEmptyEl, true);
        return;
      }
      show(ordersEmptyEl, false);
      show(ordersListEl, true);
      var html = data.map(function (o) {
        var addr = o.shipping_address || {};
        var addrStr = [addr.street, addr.city, addr.state, addr.pincode, addr.country].filter(Boolean).join(', ');
        var dateStr = o.created_at ? new Date(o.created_at).toLocaleDateString() : '';
        var firstItem = o.order_items && o.order_items[0];
        var imgUrl = (firstItem && firstItem.products && firstItem.products.image_url) ? firstItem.products.image_url : '';
        var thumbHtml = imgUrl
          ? '<img src="' + imgUrl + '" alt="" class="w-20 h-20 rounded-lg object-cover flex-shrink-0 bg-gray-100"/>'
          : '<div class="w-20 h-20 rounded-lg bg-gray-200 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center"><span class="material-icons text-gray-400 text-2xl">inventory_2</span></div>';
        return (
          '<div class="border border-gray-200 dark:border-gray-700 rounded-xl p-6 flex gap-4">' +
            '<div class="flex-shrink-0">' + thumbHtml + '</div>' +
            '<div class="flex-1 min-w-0">' +
              '<div class="flex flex-wrap justify-between items-start gap-4">' +
                '<div>' +
                  '<p class="font-mono text-sm text-gray-500 dark:text-gray-400">' + (o.id || '') + '</p>' +
                  '<p class="text-lg font-bold text-gray-900 dark:text-white mt-1">₹' + formatPrice(o.total) + '</p>' +
                  '<p class="text-sm text-gray-500 mt-1">' + dateStr + ' · ' + (o.status || 'pending') + '</p>' +
                '</div>' +
                '<a href="order-confirmation.html?id=' + encodeURIComponent(o.id) + '" class="text-primary font-medium text-sm hover:underline">View</a>' +
              '</div>' +
              (addrStr ? '<p class="text-sm text-gray-500 dark:text-gray-400 mt-3">' + addrStr + '</p>' : '') +
            '</div>' +
          '</div>'
        );
      }).join('');
      ordersListEl.innerHTML = html;
    }).catch(function () {
      show(loadingEl, false);
      show(ordersEmptyEl, true);
    });
  }).catch(function () {
    show(loadingEl, false);
    show(loginRequiredEl, true);
  });
})();
