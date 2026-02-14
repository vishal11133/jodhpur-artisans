(function () {
  var loadingEl = document.getElementById('admin-loading');
  var dashboardEl = document.getElementById('admin-dashboard');
  var statsEl = document.getElementById('dashboard-stats');

  function showDashboard() {
    if (loadingEl) loadingEl.classList.add('hidden');
    if (dashboardEl) dashboardEl.classList.remove('hidden');
  }

  function hideDashboard() {
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (dashboardEl) dashboardEl.classList.add('hidden');
  }

  window.requireAdmin('login.html?redirect=' + encodeURIComponent('admin.html')).then(function (result) {
    if (!result) {
      hideDashboard();
      return;
    }
    showDashboard();
    if (!window.supabase || !statsEl) return;
    Promise.all([
      window.supabase.from('products').select('id', { count: 'exact', head: true }),
      window.supabase.from('orders').select('id', { count: 'exact', head: true })
    ]).then(function (results) {
      var productCount = (results[0] && results[0].count != null) ? results[0].count : 0;
      var orderCount = (results[1] && results[1].count != null) ? results[1].count : 0;
      statsEl.textContent = productCount + ' products · ' + orderCount + ' orders';
    }).catch(function () {
      statsEl.textContent = 'Could not load stats.';
    });
  }).catch(function () {
    hideDashboard();
  });
})();
