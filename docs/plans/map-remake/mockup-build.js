const fs = require('fs'), p = require('path');
const src = fs.readFileSync(p.join(__dirname, 'mockup.src.html'), 'utf8'), data = fs.readFileSync(p.join(__dirname, 'data.json'), 'utf8');
const page = src.replace('/*DATA*/null', data);
fs.writeFileSync(p.join(__dirname, 'map-remake-mockup.html'), page);
fs.writeFileSync(p.join(__dirname, 'local.html'), '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0;font:14px system-ui}</style></head><body>' + page + '</body></html>');
console.log('built', page.length);
