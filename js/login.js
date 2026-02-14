(function () {
  var form = document.getElementById('login-form');
  var errorEl = document.getElementById('login-error');
  var btn = document.getElementById('login-btn');

  function showError(msg) {
    if (errorEl) {
      errorEl.textContent = msg || '';
      errorEl.classList.toggle('hidden', !msg);
    }
  }

  var params = new URLSearchParams(window.location.search);
  var msg = params.get('message');
  if (msg) {
    var successEl = document.getElementById('login-success');
    if (successEl) {
      successEl.textContent = msg;
      successEl.classList.remove('hidden');
    }
  }

  document.querySelectorAll('.toggle-password').forEach(function (b) {
    b.addEventListener('click', function () {
      var input = document.getElementById('password');
      var icon = b.querySelector('.material-icons');
      if (input.type === 'password') {
        input.type = 'text';
        if (icon) icon.textContent = 'visibility_off';
      } else {
        input.type = 'password';
        if (icon) icon.textContent = 'visibility';
      }
    });
  });

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      showError('');
      if (!window.supabase) {
        showError('Service not configured. Please set Supabase URL and key in js/config.js');
        return;
      }
      var email = (form.querySelector('#email') || {}).value || '';
      var password = (form.querySelector('#password') || {}).value || '';
      if (!email || !password) {
        showError('Please enter email and password.');
        return;
      }
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Signing in…';
      }
      window.supabase.auth.signInWithPassword({ email: email, password: password })
        .then(function (_ref) {
          var data = _ref.data;
          var error = _ref.error;
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Log in';
          }
          if (error) {
            showError(error.message || 'Invalid email or password.');
            return;
          }
          var redirect = params.get('redirect') || 'index.html';
          window.location.href = redirect;
        })
        .catch(function (err) {
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Log in';
          }
          showError(err.message || 'Something went wrong.');
        });
    });
  }
})();
