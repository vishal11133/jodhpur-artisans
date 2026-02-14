(function () {
  var loadingEl = document.getElementById('admin-loading');
  var contentEl = document.getElementById('admin-orders-content');
  var ordersListEl = document.getElementById('orders-list');
  var ordersEmptyEl = document.getElementById('orders-empty');
  var messageEl = document.getElementById('orders-message');

  function setMessage(msg) {
    if (messageEl) {
      messageEl.textContent = msg || '';
      messageEl.classList.toggle('hidden', !msg);
    }
  }

  function showContent() {
    if (loadingEl) loadingEl.classList.add('hidden');
    if (contentEl) contentEl.classList.remove('hidden');
  }

  function formatDate(createdAt) {
    if (!createdAt) return '—';
    try {
      return new Date(createdAt).toLocaleDateString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch (e) {
      return createdAt;
    }
  }

  function formatPrice(n) {
    var x = Number(n);
    if (isNaN(x)) return '0';
    return x % 1 === 0 ? String(Math.round(x)) : x.toFixed(2);
  }

  function addressStr(addr) {
    if (!addr) return '—';
    var parts = [addr.name, addr.street, addr.city, addr.state, addr.pincode, addr.country].filter(Boolean);
    return parts.join(', ') || '—';
  }

  function renderOrder(order, items) {
    var addr = order.shipping_address || {};
    var status = order.status || 'pending';
    var statusOptions = ['pending', 'confirmed', 'shipped', 'cancelled'].map(function (s) {
      return '<option value="' + s + '"' + (s === status ? ' selected' : '') + '>' + s + '</option>';
    }).join('');
    var itemsHtml = '';
    if (items && items.length > 0) {
      itemsHtml = '<ul class="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">' +
        items.map(function (oi) {
          var name = (oi.products && oi.products.name) ? oi.products.name : 'Product';
          var qty = oi.quantity || 1;
          var price = formatPrice(oi.price_at_order);
          return '<li>' + name + ' × ' + qty + ' @ ₹' + price + '</li>';
        }).join('') +
        '</ul>';
    } else {
      itemsHtml = '<p class="mt-2 text-sm text-gray-500">No items</p>';
    }
    return (
      '<div class="order-card border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-white dark:bg-gray-800" data-order-id="' + order.id + '">' +
        '<div class="flex flex-wrap justify-between items-start gap-4">' +
          '<div class="min-w-0">' +
            '<p class="font-mono text-sm text-gray-500 dark:text-gray-400">' + (order.id || '') + '</p>' +
            '<p class="text-lg font-bold text-gray-900 dark:text-white mt-1">₹' + formatPrice(order.total) + '</p>' +
            '<p class="text-sm text-gray-500 mt-1">' + formatDate(order.created_at) + '</p>' +
            '<p class="text-sm text-gray-500 mt-1">Customer: ' + (order.user_id ? order.user_id.substring(0, 8) + '…' : '—') + '</p>' +
            '<p class="text-sm text-gray-500 dark:text-gray-400 mt-2">' + addressStr(addr) + '</p>' +
            itemsHtml +
          '</div>' +
          '<div class="flex items-center gap-2">' +
            '<label class="text-sm text-gray-600 dark:text-gray-400">Status</label>' +
            '<select class="order-status px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" data-order-id="' + order.id + '">' +
              statusOptions +
            '</select>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function loadOrders() {
    if (!window.supabase) return;
    setMessage('');
    window.supabase.from('orders').select('id, user_id, status, total, shipping_address, created_at').order('created_at', { ascending: false }).then(function (ordersRes) {
      if (ordersRes.error) {
        setMessage(ordersRes.error.message || 'Failed to load orders.');
        if (ordersListEl) ordersListEl.innerHTML = '';
        if (ordersEmptyEl) ordersEmptyEl.classList.remove('hidden');
        return;
      }
      var orders = ordersRes.data || [];
      if (orders.length === 0) {
        if (ordersListEl) ordersListEl.innerHTML = '';
        if (ordersEmptyEl) ordersEmptyEl.classList.remove('hidden');
        return;
      }
      if (ordersEmptyEl) ordersEmptyEl.classList.add('hidden');
      var orderIds = orders.map(function (o) { return o.id; });
      window.supabase.from('order_items').select('order_id, quantity, price_at_order, products(name)').in('order_id', orderIds).then(function (itemsRes) {
        var itemsByOrder = {};
        (itemsRes.data || []).forEach(function (row) {
          if (!itemsByOrder[row.order_id]) itemsByOrder[row.order_id] = [];
          itemsByOrder[row.order_id].push(row);
        });
        var html = orders.map(function (o) {
          return renderOrder(o, itemsByOrder[o.id] || []);
        }).join('');
        if (ordersListEl) ordersListEl.innerHTML = html;
        ordersListEl.querySelectorAll('.order-status').forEach(function (select) {
          select.addEventListener('change', function () {
            var orderId = select.getAttribute('data-order-id');
            var newStatus = select.value;
            var btn = select;
            btn.disabled = true;
            window.supabase.from('orders').update({ status: newStatus }).eq('id', orderId).then(function (upRes) {
              btn.disabled = false;
              if (upRes.error) {
                setMessage(upRes.error.message || 'Failed to update status.');
                return;
              }
              setMessage('Status updated.');
            }).catch(function () {
              btn.disabled = false;
              setMessage('Failed to update status.');
            });
          });
        });
      }).catch(function () {
        var html = orders.map(function (o) { return renderOrder(o, []); }).join('');
        if (ordersListEl) ordersListEl.innerHTML = html;
        ordersListEl.querySelectorAll('.order-status').forEach(function (select) {
          select.addEventListener('change', function () {
            var orderId = select.getAttribute('data-order-id');
            var newStatus = select.value;
            var btn = select;
            btn.disabled = true;
            window.supabase.from('orders').update({ status: newStatus }).eq('id', orderId).then(function (upRes) {
              btn.disabled = false;
              if (upRes.error) setMessage(upRes.error.message || 'Failed to update status.');
              else setMessage('Status updated.');
            }).catch(function () {
              btn.disabled = false;
              setMessage('Failed to update status.');
            });
          });
        });
      });
    }).catch(function () {
      setMessage('Failed to load orders.');
      if (ordersListEl) ordersListEl.innerHTML = '';
      if (ordersEmptyEl) ordersEmptyEl.classList.remove('hidden');
    });
  }

  window.requireAdmin('login.html?redirect=' + encodeURIComponent('admin-orders.html')).then(function (result) {
    if (!result) return;
    showContent();
    loadOrders();
  });
})();
