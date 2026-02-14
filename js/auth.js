(function () {
  var signupLink = document.querySelector('a[href="signup.html"]');
  var loginLink = document.querySelector('a[href="login.html"]');
  var accountLink = document.getElementById('nav-account');
  var adminLink = document.getElementById('nav-admin');
  var logoutBtn = document.getElementById('nav-logout');

  function setNavForUser(isLoggedIn, isAdmin) {
    if (signupLink) signupLink.style.display = isLoggedIn ? 'none' : '';
    if (loginLink) loginLink.style.display = isLoggedIn ? 'none' : '';
    if (accountLink) {
      accountLink.style.display = isLoggedIn ? '' : 'none';
      accountLink.classList.toggle('hidden', !isLoggedIn);
    }
    if (logoutBtn) {
      logoutBtn.style.display = isLoggedIn ? '' : 'none';
      logoutBtn.classList.toggle('hidden', !isLoggedIn);
    }
    if (signupLink) signupLink.classList.toggle('hidden', isLoggedIn);
    if (loginLink) loginLink.classList.toggle('hidden', isLoggedIn);
    if (adminLink) {
      adminLink.style.display = isAdmin ? '' : 'none';
      adminLink.classList.toggle('hidden', !isAdmin);
    }
  }

  function checkAuth() {
    if (!window.supabase) {
      setNavForUser(false, false);
      return null;
    }
    window.supabase.auth.getSession().then(function (_ref) {
      var data = _ref.data;
      var session = data.session;
      if (!session) {
        setNavForUser(false, false);
        return;
      }
      setNavForUser(true, false);
      window.supabase.from('profiles').select('role').eq('id', session.user.id).single().then(function (p) {
        var role = (p && p.data && p.data.role) ? p.data.role : 'user';
        setNavForUser(true, role === 'admin');
      }).catch(function () {
        setNavForUser(true, false);
      });
    }).catch(function () {
      setNavForUser(false, false);
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      if (window.supabase) {
        window.supabase.auth.signOut().then(function () {
          setNavForUser(false);
          window.location.reload();
        });
      }
    });
  }

  window.requireAuth = function (redirectUrl) {
    redirectUrl = redirectUrl || 'login.html';
    if (!window.supabase) {
      window.location.href = redirectUrl;
      return Promise.reject(new Error('No Supabase'));
    }
    return window.supabase.auth.getSession().then(function (_ref) {
      var data = _ref.data;
      if (!data.session) {
        window.location.href = redirectUrl + (redirectUrl.indexOf('?') !== -1 ? '&' : '?') + 'redirect=' + encodeURIComponent(window.location.href);
        return null;
      }
      return data.session;
    });
  };

  window.requireAdmin = function (redirectToLoginUrl) {
    redirectToLoginUrl = redirectToLoginUrl || 'login.html';
    if (!window.supabase) {
      window.location.href = redirectToLoginUrl;
      return Promise.reject(new Error('No Supabase'));
    }
    return window.requireAuth(redirectToLoginUrl).then(function (session) {
      if (!session) return null;
      return window.supabase.from('profiles').select('role').eq('id', session.user.id).single().then(function (res) {
        var profile = res && res.data ? res.data : null;
        var role = profile && profile.role ? profile.role : 'user';
        if (role !== 'admin') {
          window.location.href = 'index.html';
          return null;
        }
        return { session: session, profile: profile };
      });
    }).catch(function () {
      return null;
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuth);
  } else {
    checkAuth();
  }
})();
