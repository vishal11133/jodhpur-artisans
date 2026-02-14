(function () {
  var form = document.getElementById('checkout-form');
  var authMsg = document.getElementById('checkout-auth-required');
  var errorEl = document.getElementById('checkout-error');
  var placeBtn = document.getElementById('place-order-btn');

  function showError(msg) {
    if (errorEl) {
      errorEl.textContent = msg || '';
      errorEl.classList.toggle('hidden', !msg);
    }
  }

  window.requireAuth('login.html?redirect=' + encodeURIComponent('checkout.html')).then(function (session) {
    if (!session) return;
    if (authMsg) authMsg.classList.add('hidden');
    if (form) form.classList.remove('hidden');

    var cart = window.getCart ? window.getCart() : [];
    if (cart.length === 0) {
      if (authMsg) authMsg.textContent = 'Your cart is empty.';
      if (form) form.classList.add('hidden');
      setTimeout(function () {
        window.location.href = 'cart.html';
      }, 1500);
      return;
    }

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        showError('');
        if (!window.supabase) {
          showError('Service not configured.');
          return;
        }
        var name = (form.querySelector('#name') || {}).value || '';
        var phone = (form.querySelector('#phone') || {}).value || '';
        var street = (form.querySelector('#street') || {}).value || '';
        var city = (form.querySelector('#city') || {}).value || '';
        var state = (form.querySelector('#state') || {}).value || '';
        var pincode = (form.querySelector('#pincode') || {}).value || '';
        var country = (form.querySelector('#country') || {}).value || 'India';
        var shipping = { name, phone, street, city, state, pincode, country };

        var productIds = cart.map(function (i) { return i.productId; });
        window.supabase.from('products').select('id, price').in('id', productIds).then(function (_ref) {
          var products = _ref.data;
          var err = _ref.error;
          if (err || !products || products.length === 0) {
            showError('Could not load product prices. Try again.');
            return;
          }
          var priceMap = {};
          products.forEach(function (p) { priceMap[p.id] = Number(p.price); });
          var total = 0;
          var orderItems = [];
          cart.forEach(function (item) {
            var price = priceMap[item.productId];
            if (price == null) return;
            var qty = item.quantity || 1;
            total += price * qty;
            orderItems.push({ product_id: item.productId, quantity: qty, price_at_order: price });
          });
          if (orderItems.length === 0) {
            showError('No valid items in cart.');
            return;
          }

          if (placeBtn) {
            placeBtn.disabled = true;
            placeBtn.textContent = 'Placing order…';
          }
          window.supabase.from('orders').insert({
            user_id: session.user.id,
            status: 'pending',
            shipping_address: shipping,
            total: total
          }).select('id').single().then(function (orderRes) {
            var orderErr = orderRes.error;
            var order = orderRes.data;
            if (orderErr || !order) {
              if (placeBtn) { placeBtn.disabled = false; placeBtn.textContent = 'Place Order'; }
              showError(orderErr ? orderErr.message : 'Failed to create order.');
              return;
            }
            var rows = orderItems.map(function (item) {
              return {
                order_id: order.id,
                product_id: item.product_id,
                quantity: item.quantity,
                price_at_order: item.price_at_order
              };
            });
            return window.supabase.from('order_items').insert(rows).then(function (itemsRes) {
              if (itemsRes.error) {
                if (placeBtn) { placeBtn.disabled = false; placeBtn.textContent = 'Place Order'; }
                showError('Failed to save order items.');
                return;
              }
              if (window.saveCart) window.saveCart([]);
              window.location.href = 'order-confirmation.html?id=' + encodeURIComponent(order.id);
            });
          }).catch(function (err) {
            if (placeBtn) { placeBtn.disabled = false; placeBtn.textContent = 'Place Order'; }
            showError(err.message || 'Something went wrong.');
          });
        }).catch(function () {
          showError('Could not load products.');
        });
      });
    }
  }).catch(function () {
    if (authMsg) authMsg.textContent = 'Redirecting to login…';
  });
})();
