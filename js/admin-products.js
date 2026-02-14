(function () {
  var loadingEl = document.getElementById('admin-loading');
  var contentEl = document.getElementById('admin-products-content');
  var tbody = document.getElementById('products-tbody');
  var messageEl = document.getElementById('products-message');
  var formContainer = document.getElementById('product-form-container');
  var formTitle = document.getElementById('product-form-title');
  var form = document.getElementById('product-form');
  var formError = document.getElementById('product-form-error');
  var productIdInput = document.getElementById('product-id');
  var btnAdd = document.getElementById('btn-add-product');
  var btnSlugFromName = document.getElementById('btn-slug-from-name');
  var btnCancel = document.getElementById('product-form-cancel');
  var submitBtn = document.getElementById('product-form-submit');
  var imageFileInput = document.getElementById('product-image-file');
  var imagePreviewEl = document.getElementById('product-image-preview');
  var imagePreviewImg = document.getElementById('product-image-preview-img');
  var BUCKET_PRODUCT_IMAGES = 'product-images';

  function slugFromName(name) {
    return (name || '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  function showContent() {
    if (loadingEl) loadingEl.classList.add('hidden');
    if (contentEl) contentEl.classList.remove('hidden');
  }

  function hideForm() {
    if (formContainer) formContainer.classList.add('hidden');
    if (form) form.reset();
    if (productIdInput) productIdInput.value = '';
    if (imageFileInput) imageFileInput.value = '';
    if (imagePreviewEl) { imagePreviewEl.classList.add('hidden'); if (imagePreviewImg) imagePreviewImg.src = ''; }
    if (formError) { formError.textContent = ''; formError.classList.add('hidden'); }
  }

  function showForm(title, product) {
    if (formTitle) formTitle.textContent = title || 'Add product';
    if (productIdInput) productIdInput.value = product ? product.id : '';
    if (imageFileInput) imageFileInput.value = '';
    if (form) {
      form.querySelector('#product-name').value = product ? product.name || '' : '';
      form.querySelector('#product-slug').value = product ? product.slug || '' : '';
      form.querySelector('#product-category').value = product ? product.category || '' : '';
      form.querySelector('#product-price').value = product != null && product.price != null ? product.price : '';
      form.querySelector('#product-description').value = product ? product.description || '' : '';
      form.querySelector('#product-badge').value = product && product.badge ? product.badge : '';
    }
    if (imagePreviewEl && imagePreviewImg) {
      if (product && product.image_url) {
        imagePreviewImg.src = product.image_url;
        imagePreviewEl.classList.remove('hidden');
      } else {
        imagePreviewImg.src = '';
        imagePreviewEl.classList.add('hidden');
      }
    }
    if (formContainer) formContainer.classList.remove('hidden');
    if (formError) { formError.textContent = ''; formError.classList.add('hidden'); }
  }

  function setError(msg) {
    if (formError) {
      formError.textContent = msg || '';
      formError.classList.toggle('hidden', !msg);
    }
  }

  function formatPrice(n) {
    var x = Number(n);
    if (isNaN(x)) return '0';
    return x % 1 === 0 ? String(Math.round(x)) : x.toFixed(2);
  }

  function setMessage(msg) {
    if (messageEl) {
      messageEl.textContent = msg || '';
      messageEl.classList.toggle('hidden', !msg);
    }
  }

  function showImagePreview(fileOrUrl) {
    if (!imagePreviewEl || !imagePreviewImg) return;
    if (typeof fileOrUrl === 'string') {
      imagePreviewImg.src = fileOrUrl;
      imagePreviewEl.classList.remove('hidden');
    } else if (fileOrUrl && fileOrUrl instanceof File) {
      var url = URL.createObjectURL(fileOrUrl);
      imagePreviewImg.src = url;
      imagePreviewEl.classList.remove('hidden');
    } else {
      imagePreviewImg.src = '';
      imagePreviewEl.classList.add('hidden');
    }
  }

  function uploadProductImage(file) {
    var ext = (file.name || '').split('.').pop() || 'jpg';
    var safeName = (file.name || 'image').replace(/[^a-zA-Z0-9.-]/g, '_');
    var path = 'products/' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now()) + '-' + safeName;
    return window.supabase.storage.from(BUCKET_PRODUCT_IMAGES).upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false }).then(function (uploadRes) {
      if (uploadRes.error) throw uploadRes.error;
      var publicUrl = window.supabase.storage.from(BUCKET_PRODUCT_IMAGES).getPublicUrl(uploadRes.data.path).data.publicUrl;
      return publicUrl;
    });
  }

  function renderProducts(products) {
    if (!tbody) return;
    if (!products || products.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">No products yet. Add one above.</td></tr>';
      return;
    }
    tbody.innerHTML = products.map(function (p) {
      var img = p.image_url
        ? '<img class="w-12 h-12 object-cover rounded" src="' + p.image_url + '" alt=""/>'
        : '<span class="w-12 h-12 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded text-gray-500 text-xs">—</span>';
      var badge = p.badge ? p.badge.replace('_', ' ') : '—';
      return (
        '<tr class="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750">' +
          '<td class="px-4 py-3">' + img + '</td>' +
          '<td class="px-4 py-3 text-gray-900 dark:text-white">' + (p.name || '') + '</td>' +
          '<td class="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">' + (p.slug || '') + '</td>' +
          '<td class="px-4 py-3 text-gray-600 dark:text-gray-400">' + (p.category || '') + '</td>' +
          '<td class="px-4 py-3 font-semibold text-gray-900 dark:text-white">₹' + formatPrice(p.price) + '</td>' +
          '<td class="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">' + badge + '</td>' +
          '<td class="px-4 py-3">' +
            '<button type="button" class="product-edit mr-2 text-primary hover:underline text-sm" data-id="' + p.id + '">Edit</button>' +
            '<button type="button" class="product-delete text-red-600 hover:underline text-sm" data-id="' + p.id + '">Delete</button>' +
          '</td>' +
        '</tr>'
      );
    }).join('');
    tbody.querySelectorAll('.product-edit').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-id');
        var p = products.find(function (x) { return x.id === id; });
        if (p) showForm('Edit product', p);
      });
    });
    tbody.querySelectorAll('.product-delete').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-id');
        if (!window.confirm('Delete this product? If it is in any orders, delete will fail.')) return;
        window.supabase.from('products').delete().eq('id', id).then(function (res) {
          if (res.error) {
            setMessage(res.error.message || 'Could not delete. Product may be in use.');
            return;
          }
          setMessage('Product deleted.');
          loadProducts();
        }).catch(function () {
          setMessage('Could not delete product.');
        });
      });
    });
  }

  var products = [];

  function loadProducts() {
    if (!window.supabase) return;
    window.supabase.from('products').select('id, name, slug, category, price, description, image_url, badge, created_at').order('created_at', { ascending: false }).then(function (res) {
      if (res.error) {
        setMessage(res.error.message || 'Failed to load products.');
        products = [];
        renderProducts([]);
        return;
      }
      products = res.data || [];
      setMessage('');
      renderProducts(products);
    }).catch(function () {
      setMessage('Failed to load products.');
      renderProducts([]);
    });
  }

  window.requireAdmin('login.html?redirect=' + encodeURIComponent('admin-products.html')).then(function (result) {
    if (!result) return;
    showContent();
    loadProducts();
  });

  if (btnAdd) {
    btnAdd.addEventListener('click', function () {
      hideForm();
      showForm('Add product', null);
    });
  }
  if (btnSlugFromName) {
    btnSlugFromName.addEventListener('click', function () {
      var name = form && form.querySelector('#product-name').value;
      var slugEl = form && form.querySelector('#product-slug');
      if (slugEl) slugEl.value = slugFromName(name);
    });
  }
  if (form) {
    form.querySelector('#product-name').addEventListener('input', function () {
      if (productIdInput && productIdInput.value) return;
      var slugEl = form.querySelector('#product-slug');
      if (slugEl && !slugEl.value) slugEl.value = slugFromName(this.value);
    });
  }
  if (btnCancel) {
    btnCancel.addEventListener('click', hideForm);
  }
  if (imageFileInput) {
    imageFileInput.addEventListener('change', function () {
      var file = this.files && this.files[0];
      showImagePreview(file || null);
    });
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      setError('');
      var id = productIdInput && productIdInput.value ? productIdInput.value.trim() : '';
      var name = (form.querySelector('#product-name') || {}).value || '';
      var slug = (form.querySelector('#product-slug') || {}).value || '';
      var category = (form.querySelector('#product-category') || {}).value || '';
      var price = parseFloat((form.querySelector('#product-price') || {}).value, 10);
      var description = (form.querySelector('#product-description') || {}).value || '';
      var imageFile = imageFileInput && imageFileInput.files && imageFileInput.files[0];
      var badge = (form.querySelector('#product-badge') || {}).value || '';
      if (!name || !slug || !category || isNaN(price) || price < 0) {
        setError('Name, slug, category, and price (≥ 0) are required.');
        return;
      }
      var existingImageUrl = id ? (products.find(function (p) { return p.id === id; }) || {}).image_url : null;
      if (!id && !imageFile) {
        setError('Product image is required. Please select an image file.');
        return;
      }
      if (id && !imageFile && !existingImageUrl) {
        setError('Product image is required. Please select an image file.');
        return;
      }
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Saving…'; }
      function doSave(image_url) {
        var payload = { name: name, slug: slug, category: category, price: price };
        if (description) payload.description = description;
        if (image_url) payload.image_url = image_url;
        if (badge) payload.badge = badge;
        if (id) {
          window.supabase.from('products').update(payload).eq('id', id).then(function (res) {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Save'; }
            if (res.error) {
              setError(res.error.message || 'Update failed.');
              return;
            }
            setMessage('Product updated.');
            hideForm();
            loadProducts();
          }).catch(function () {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Save'; }
            setError('Update failed.');
          });
        } else {
          window.supabase.from('products').insert(payload).then(function (res) {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Save'; }
            if (res.error) {
              setError(res.error.message || 'Insert failed.');
              return;
            }
            setMessage('Product added.');
            hideForm();
            loadProducts();
          }).catch(function () {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Save'; }
            setError('Insert failed.');
          });
        }
      }
      if (imageFile) {
        uploadProductImage(imageFile).then(function (publicUrl) {
          doSave(publicUrl);
        }).catch(function (err) {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Save'; }
          var msg = err && err.message ? err.message : 'Image upload failed.';
          if (msg.toLowerCase().indexOf('bucket') !== -1 && msg.toLowerCase().indexOf('not found') !== -1) {
            msg = 'Storage bucket "product-images" not found. Create it in Supabase Dashboard → Storage (see docs/STORAGE_SETUP.md).';
          }
          setError(msg);
        });
      } else {
        doSave(existingImageUrl);
      }
    });
  }
})();
