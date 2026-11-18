// THE SUBWAY: station plan mock-up. The city's nine districts stand as in docs/disaster-city/move.js (C F E / U H B / R S I), the Hills north.
const fs = require('fs'); const W = 1500, H = 1000;
const X0 = 470, Y0 = 250, B = 190;   // block size px (a district = 4 x 4 plots)
const blocks = [['Civic Center', 0, 0], ['Financial', 1, 0], ['Entertainment', 2, 0], ['University', 0, 1], ['Hero Plaza', 1, 1], ['Bayside', 2, 1], ['Sports + Culture', 0, 2], ['Southside', 1, 2], ['Industrial', 2, 2]];
// stations at their plots (col, row inside the 12 x 12 grid, 0-based from the city's north-west corner)
const px = (c, r) => [X0 + (c + 0.5) * B / 4, Y0 + (r + 0.5) * B / 4];
const ST = { civic: { p: px(0, 3), name: 'CIVIC CENTER', sub: 'Transit square · the stair that stands today' }, hero: { p: px(6, 6), name: 'HERO PLAZA', sub: 'Transit court · two stair heads stand there' },
  bay: { p: px(11, 7), name: 'BAYSIDE', sub: 'by the boardwalk' }, ind: { p: px(11, 11), name: 'INDUSTRIAL', sub: 'Rail service' }, sport: { p: px(0, 10), name: 'SPORTS + CULTURE', sub: 'Bus stop court' } };
const HQ = [170, 300], GHOST = [170, 640], DUMB = [170, 860];
let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Verdana, Arial, sans-serif"><rect width="${W}" height="${H}" fill="#000"/>`;
s += `<text x="${W / 2}" y="58" text-anchor="middle" font-size="30" font-weight="700" fill="#fff">THE SUBWAY · STATION PLAN</text><text x="${W / 2}" y="92" text-anchor="middle" font-size="18" fill="#9aa3b2">one loop under Disaster City · a spur to DOOR HQ · the Freight Line to the D.U.M.B. (late game)</text>`;
s += `<rect x="${X0}" y="${Y0 - 70}" width="${B * 3}" height="58" fill="#12161c" stroke="#4b5563"/><text x="${X0 + B * 1.5}" y="${Y0 - 34}" text-anchor="middle" font-size="17" fill="#6b7280">THE HOLLYWOOD HILLS (no station)</text>`;
blocks.forEach(b => { const x = X0 + b[1] * B, y = Y0 + b[2] * B; s += `<rect x="${x}" y="${y}" width="${B}" height="${B}" fill="#15171c" stroke="#4b5563" stroke-width="1.5"/><text x="${x + 12}" y="${y + 24}" text-anchor="start" font-size="15" fill="#6b7280">${b[0]}</text>`; });
s += `<rect x="${X0 + B * 3}" y="${Y0}" width="210" height="${B * 3}" fill="#0b2233" stroke="#4b5563"/><text x="${X0 + B * 3 + 105}" y="${Y0 + 40}" text-anchor="middle" font-size="16" fill="#3b82a6">THE SEA</text><text x="${X0 + B * 3 + 105}" y="${Y0 + 62}" text-anchor="middle" font-size="14" fill="#3b82a6">(the Beach)</text>`;
const L = '#f2d21a';
const order = ['civic', 'hero', 'bay', 'ind', 'sport'];
const c = ST.civic.p, h = ST.hero.p, by = ST.bay.p, i = ST.ind.p, sp = ST.sport.p;
const d = `M${c[0]},${c[1]} L${h[0]},${c[1]} L${h[0]},${h[1]} L${by[0]},${h[1]} L${by[0]},${by[1]} L${i[0]},${i[1]} L${sp[0]},${i[1]} L${sp[0]},${sp[1]} L${c[0]},${c[1]}`;
s += `<path d="${d}" fill="none" stroke="${L}" stroke-width="7" stroke-linejoin="round"/>`;
s += `<path d="M${HQ[0] + 90},${HQ[1]} L${ST.civic.p[0]},${ST.civic.p[1]}" fill="none" stroke="${L}" stroke-width="7"/>`;
s += `<path d="M${ST.sport.p[0]},${ST.sport.p[1]} L${GHOST[0] + 90},${GHOST[1]}" fill="none" stroke="#8a7a2a" stroke-width="5" stroke-dasharray="10 8"/>`;
s += `<path d="M${GHOST[0]},${GHOST[1] + 34} L${DUMB[0]},${DUMB[1] - 34}" fill="none" stroke="#b9f27c" stroke-width="5" stroke-dasharray="4 8"/>`;
const box = (p, t, sub, col) => `<rect x="${p[0] - 110}" y="${p[1] - 34}" width="220" height="68" fill="#000" stroke="${col}" stroke-width="3"/><text x="${p[0]}" y="${p[1] - 4}" text-anchor="middle" font-size="18" font-weight="700" fill="${col}">${t}</text><text x="${p[0]}" y="${p[1] + 20}" text-anchor="middle" font-size="13" fill="#9aa3b2">${sub}</text>`;
s += box(HQ, 'DOOR HQ', 'the platform under the building', '#fff') + box(GHOST, 'THE GHOST STATION', 'the Sewers · on foot along the track', '#8a7a2a') + box(DUMB, 'THE D.U.M.B.', 'the Freight Line · clearance L6', '#b9f27c');
const lab = { civic: [18, -36, 'start'], hero: [-18, 32, 'end'], bay: [22, -2, 'start'], ind: [22, -2, 'start'], sport: [20, -30, 'start'] };
order.forEach(k => { const st = ST[k], o = lab[k]; s += `<circle cx="${st.p[0]}" cy="${st.p[1]}" r="12" fill="#000" stroke="${L}" stroke-width="5"/><text x="${st.p[0] + o[0]}" y="${st.p[1] + o[1]}" text-anchor="${o[2]}" font-size="18" font-weight="700" fill="#fff">${st.name}</text><text x="${st.p[0] + o[0]}" y="${st.p[1] + o[1] + 19}" text-anchor="${o[2]}" font-size="13" fill="#9aa3b2">${st.sub}</text>`; });
s += `<g font-size="16"><line x1="60" y1="${H - 40}" x2="120" y2="${H - 40}" stroke="${L}" stroke-width="7"/><text x="132" y="${H - 34}" fill="${L}">the train (a station opens once you have walked to it)</text><line x1="640" y1="${H - 40}" x2="700" y2="${H - 40}" stroke="#8a7a2a" stroke-width="5" stroke-dasharray="10 8"/><text x="712" y="${H - 34}" fill="#8a7a2a">dead track, walked</text><line x1="930" y1="${H - 40}" x2="990" y2="${H - 40}" stroke="#b9f27c" stroke-width="5" stroke-dasharray="4 8"/><text x="1002" y="${H - 34}" fill="#b9f27c">the Freight Line (secret, late game)</text></g>`;
s += '</svg>'; fs.writeFileSync(process.argv[2], s); console.log('ok');
