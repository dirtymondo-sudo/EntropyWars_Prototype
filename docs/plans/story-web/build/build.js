const fs = require('fs'), d = __dirname;
let t = fs.readFileSync(d + '/template.html', 'utf8');
const roster = fs.readFileSync(d + '/roster.json', 'utf8').replace(/</g, '\\u003c');
const app = fs.readFileSync(d + '/app.js', 'utf8');
if (/<\/script/i.test(app)) throw new Error('script close in app');
t = t.replace('/*__ROSTER__*/null', () => roster).replace('/*__APP__*/', () => app);
fs.writeFileSync(d + '/../relationship-web.html', t);
// a wrapped copy for local testing, in the same skeleton the publisher adds
fs.writeFileSync(d + '/test.html', '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>' + t + '</body></html>');
console.log('built', fs.statSync(d + '/../relationship-web.html').size);
