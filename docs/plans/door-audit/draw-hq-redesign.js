// DOOR HQ ground floor: BEFORE / AFTER floor plan mock-up (angles are the Main Hall's own door angles from data.js)
const fs = require('fs');
const W = 1700, H = 1000;
const P = (cx, cy, r, deg) => { const a = (deg - 90) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
const arc = (cx, cy, r1, r2, d0, d1) => { const a = P(cx, cy, r2, d0), b = P(cx, cy, r2, d1), c = P(cx, cy, r1, d1), d = P(cx, cy, r1, d0), big = (d1 - d0) > 180 ? 1 : 0;
  return `M${a[0]},${a[1]} A${r2},${r2} 0 ${big} 1 ${b[0]},${b[1]} L${c[0]},${c[1]} A${r1},${r1} 0 ${big} 0 ${d[0]},${d[1]} Z`; };
const K = 10.5;   // px per metre
function plan(cx, cy, title, hall, ring, ringNote, ringFill) {
  let s = `<text x="${cx}" y="62" text-anchor="middle" font-size="30" font-weight="700" fill="#fff">${title}</text>`;
  // the ring (ground floor arc 234 -> 387 deg, r 21.5..25.5 m)
  s += `<path d="${arc(cx, cy, 21.5 * K, 25.5 * K, 234.4, 386.9)}" fill="${ringFill}" stroke="#fff" stroke-width="2"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${21 * K}" fill="#15171c" stroke="#fff" stroke-width="3"/>`;
  s += `<text x="${cx}" y="${cy - 98}" text-anchor="middle" font-size="24" fill="#9aa3b2">THE MAIN HALL</text><text x="${cx}" y="${cy - 68}" text-anchor="middle" font-size="18" fill="#6b7280">ground floor · ${hall.length} doors</text>`;
  hall.forEach(d => { const a = P(cx, cy, 21 * K, d.deg), t = P(cx, cy, 21 * K - 26, d.deg);
    s += `<circle cx="${a[0]}" cy="${a[1]}" r="9" fill="${d.col || '#e5e7eb'}" stroke="#000" stroke-width="2"/>`;
    const right = Math.sin((d.deg) * Math.PI / 180) >= 0, anchor = d.anchor || (Math.abs(Math.sin(d.deg * Math.PI / 180)) < 0.2 ? 'middle' : (right ? 'end' : 'start'));
    const tx = d.off ? a[0] + d.off[0] : t[0], ty = d.off ? a[1] + d.off[1] : t[1] + 6;
    s += `<text x="${tx}" y="${ty}" text-anchor="${anchor}" font-size="17" font-weight="600" fill="${d.col || '#e5e7eb'}">${d.label}</text>`; });
  ring.forEach(d => { const a = P(cx, cy, 25.5 * K, d.deg), t = P(cx, cy, 25.5 * K + 22, d.deg);
    s += `<circle cx="${a[0]}" cy="${a[1]}" r="9" fill="${d.col || '#fbbf24'}" stroke="#000" stroke-width="2"/>`;
    const sn = Math.sin(d.deg * Math.PI / 180), anchor = d.anchor || (Math.abs(sn) < 0.25 ? 'middle' : (sn >= 0 ? 'start' : 'end'));
    s += `<text x="${t[0]}" y="${t[1] + (Math.cos(d.deg * Math.PI / 180) > 0.5 ? -4 : 6)}" text-anchor="${anchor}" font-size="17" font-weight="600" fill="${d.col || '#fbbf24'}">${d.label}</text>`; });
  s += `<text x="${cx}" y="96" text-anchor="middle" font-size="18" fill="#9aa3b2">${ringNote}</text>`;
  return s;
}
const RING = '#22d3ee', OUT = '#4ade80', MOVE = '#fbbf24';
const before = [
  { deg: 0, label: 'BAY 4', col: RING }, { deg: 75, label: 'Cafeteria', col: MOVE }, { deg: 90, label: 'Quartermaster (shop)' }, { deg: 105, label: 'Barbershop', col: MOVE },
  { deg: 120, label: 'Reception' }, { deg: 150, label: 'Your Office', off: [16, 28], anchor: 'start' }, { deg: 180, label: 'Training Room (64)', off: [34, 46], anchor: 'start' },
  { deg: 195, label: 'Foyer (front door)', off: [-8, 40], anchor: 'end' }, { deg: 210, label: 'Medical Wing', col: MOVE, off: [-20, 22], anchor: 'end' },
  { deg: 240, label: 'Records Wing', col: MOVE }, { deg: 255, label: 'Stair to the Woods', col: OUT }, { deg: 270, label: 'BAY 1', col: RING } ];
const after = [
  { deg: 0, label: 'THE RING (north door)', col: RING }, { deg: 90, label: 'Quartermaster (shop)' }, { deg: 120, label: 'Reception' }, { deg: 150, label: 'Your Office', off: [16, 28], anchor: 'start' },
  { deg: 180, label: 'Training Room (64)', off: [0, 36], anchor: 'middle' }, { deg: 210, label: 'Foyer (front door)', off: [-16, 28], anchor: 'end' }, { deg: 240, label: 'Stair to the Woods', col: OUT }, { deg: 270, label: 'THE RING (west door)', col: RING } ];
const ringAfter = [ { deg: 250, label: 'Records Wing' }, { deg: 290, label: 'Medical Wing' }, { deg: 322, label: 'THE SUBWAY (stair down)', col: OUT, anchor: 'end' }, { deg: 352, label: 'Barbershop', anchor: 'middle' }, { deg: 378, label: 'Cafeteria', anchor: 'start' } ];
let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Verdana, Arial, sans-serif"><rect width="${W}" height="${H}" fill="#000"/>`;
svg += plan(430, 540, 'TODAY', before, [], 'the Containment Ring (blue-grey band): empty now, its 12 bay doors are gone', '#1f2937');
svg += plan(1270, 540, 'PROPOSED', after, ringAfter, 'THE RING (gold band): four rooms and the stair down to the subway', '#3b2f0b');
svg += `<line x1="850" y1="90" x2="850" y2="${H - 70}" stroke="#374151" stroke-width="2"/>`;
svg += `<g font-size="17"><circle cx="60" cy="${H - 34}" r="8" fill="${MOVE}"/><text x="76" y="${H - 28}" fill="${MOVE}">moves into the Ring</text><circle cx="300" cy="${H - 34}" r="8" fill="${RING}"/><text x="316" y="${H - 28}" fill="${RING}">door into the Ring</text><circle cx="520" cy="${H - 34}" r="8" fill="${OUT}"/><text x="536" y="${H - 28}" fill="${OUT}">public way out of DOOR HQ</text><circle cx="820" cy="${H - 34}" r="8" fill="#e5e7eb"/><text x="836" y="${H - 28}" fill="#e5e7eb">stays in the Main Hall</text><text x="${W - 30}" y="${H - 28}" text-anchor="end" fill="#6b7280">MOCK-UP · DOOR HQ ground floor · door angles from the game data</text></g>`;
svg += '</svg>';
fs.writeFileSync(process.argv[2], svg); console.log('ok', svg.length);
