// Run at build time to inject Supabase env into js/config.js (e.g. on Vercel or local .env)
var fs = require('fs');
var path = require('path');

var envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  var lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  lines.forEach(function (line) {
    line = line.trim();
    if (!line || line.charAt(0) === '#') return;
    var eq = line.indexOf('=');
    if (eq === -1) return;
    var key = line.slice(0, eq).trim();
    var value = line.slice(eq + 1).trim();
    if (value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') value = value.slice(1, -1);
    if (value.charAt(0) === "'" && value.charAt(value.length - 1) === "'") value = value.slice(1, -1);
    process.env[key] = value;
  });
}

var url = process.env.SUPABASE_URL || '';
var key = process.env.SUPABASE_ANON_KEY || '';
if (!url || !key || url === 'https://your-project.supabase.co' || key === 'your-anon-key') {
  console.warn('Warning: SUPABASE_URL or SUPABASE_ANON_KEY is missing or still placeholder. Check .env in project root and run this script again.');
}
var out = path.join(__dirname, '..', 'js', 'config.js');
var content = '// Injected at build time. Do not commit real keys.\n' +
  'window.__SUPABASE_URL__ = "' + url.replace(/"/g, '\\"') + '";\n' +
  'window.__SUPABASE_ANON_KEY__ = "' + key.replace(/"/g, '\\"') + '";\n';
fs.writeFileSync(out, content, 'utf8');
console.log('Wrote js/config.js with Supabase config');
