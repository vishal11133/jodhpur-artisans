(function () {
  var url = window.__SUPABASE_URL__;
  var key = window.__SUPABASE_ANON_KEY__;
  var lib = window.supabase;
  window.supabase = url && key && lib && lib.createClient
    ? lib.createClient(url, key)
    : null;
})();
