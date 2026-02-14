(function () {
  var form = document.getElementById('signup-form');
  var errorEl = document.getElementById('signup-error');
  var btn = document.getElementById('signup-btn');

  function showError(msg) {
    if (errorEl) {
      errorEl.textContent = msg || '';
      errorEl.classList.toggle('hidden', !msg);
    }
  }

  document.querySelectorAll('.toggle-password').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = document.getElementById('password');
      var icon = btn.querySelector('.material-icons');
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
      var fullname = (form.querySelector('#fullname') || {}).value || '';
      var email = (form.querySelector('#email') || {}).value || '';
      var phone = (form.querySelector('#phone') || {}).value || '';
      var password = (form.querySelector('#password') || {}).value || '';
      if (!email || !password) {
        showError('Please enter email and password.');
        return;
      }
      if (password.length < 8) {
        showError('Password must be at least 8 characters.');
        return;
      }
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Creating…';
      }
      window.supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: { full_name: fullname, phone: phone }
        }
      }).then(function (_ref) {
        var data = _ref.data;
        var error = _ref.error;
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Create Account';
        }
        if (error) {
          showError(error.message || 'Sign up failed. Try again.');
          return;
        }
        showError('');
        window.location.href = 'login.html?message=Account created. Please sign in.';
      }).catch(function (err) {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Create Account';
        }
        showError(err.message || 'Something went wrong. Try again.');
      });
    });
  }
})();
