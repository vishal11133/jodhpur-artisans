// Run at build time to inject Supabase env into js/config.js (e.g. on Vercel)
var fs = require('fs');
var path = require('path');
var url = process.env.SUPABASE_URL || '';
var key = process.env.SUPABASE_ANON_KEY || '';
var out = path.join(__dirname, '..', 'js', 'config.js');
var content = '// Injected at build time. Do not commit real keys.\n' +
  'window.__SUPABASE_URL__ = "' + url.replace(/"/g, '\\"') + '";\n' +
  'window.__SUPABASE_ANON_KEY__ = "' + key.replace(/"/g, '\\"') + '";\n';
fs.writeFileSync(out, content, 'utf8');
console.log('Wrote js/config.js with Supabase config');
