/* THE SIGN FONTS (2026-11-15, mondo: "do a font pass on all of the buildings that have text"; his OK on the mock-up sheets 11-15).
   Every lettered sign of the city is an arch part whose key is 'txt:WORDS|fg|bg|aspect' (three-renderer.js _hqArchSignTex), and every one
   was drawn in Arial Black. This pass gives each sign a typeface by what it is and where it stands: a sixth field on the key,
   'txt:WORDS|fg|bg|aspect|<v>|<font id>', read by the renderer's HQ_SIGN_FONTS table (same ids as below).
   A district file keeps writing the plain key; bake-disaster-city.js runs `apply` over every row at the end, so a new sign is styled by
   itself on the next bake. A key that already carries a font id is left alone (a district may pick its own).

   The order for one sign: its district's own rows (first match) -> the citywide wayfinding / safety list -> the district's default.
   Districts and the real cities they follow: C Civic = Washington DC, H Hero Plaza = New York, F Financial = London, R Southside = Detroit,
   E Entertainment = Los Angeles, B Bayside = Miami, U University = Yale, S Sports + Culture, I Industrial.

   Font ids -> families (all Google Fonts, Open Font License; linked in index.html):
     way Oswald · cinzel Cinzel · bebas Bebas Neue · archivo Archivo Black · bangers Bangers · playfair Playfair Display · monoton Monoton
     righteous Righteous · pacifico Pacifico (drawn in Title Case) · bungee Bungee · limelight Limelight · alfa Alfa Slab One
     staat Staatliches · fell IM Fell English SC · grad Graduate · stencil Saira Stencil One · dot DotGothic16 · marc Marcellus SC · rye Rye */
'use strict';
const one = /^[A-Z]$/, num = /^\d+$/;
/* the same in every district: exits, gates, sections, bays, floor numbers, room names, warning plates, back-of-house boards */
const WAY = /^(EXIT|\d+|[A-Z]|GATE [A-Z]|SEC \d+|BAY [A-Z]|STAGE \d+|SOUTH GATE|PARKING|PAY HERE|SECURITY|STEWARDS|PRESS|OFFICE|FRONT DESK|LOCKER ROOMS?|MAIN HALL|BEDROOM|TROPHY ROOM|ROTUNDA|MENU|OPEN|SCAN|KEYS|MAIL|CASHIER|STOP|ON AIR|KEEP CLEAR|NO SMOKING|EYE PROTECTION|DANGER HIGH VOLTAGE|MAX LOAD .*|AUTHORISED STAFF ONLY|SHIFT ROTA|LOADING (DOCK|BAY|OFFICE)|(ARENA )?DELIVERIES|STAGE (DOOR|CREW)|EQUIPMENT DEPOT|DISPATCH|CONTROL ROOM|CLEAN ROOM|CANTEEN|(SPORTS )?CLINIC|HARBOUR MASTER|LIFEGUARD)$/;
const DISTRICT = {
    C: { rows: [[/^(FIRE STATION|CIVIL RECORDS|CITY HALL|COUNCIL ANNEX|COURTHOUSE|POLICE|TIME BUREAU|MILITARY OFFICES|PERMIT OFFICES)$/, 'cinzel']], base: 'bebas' },
    H: { rows: [[/^NEWS$/, 'playfair'], [/^(HERO WORKSHOP|TRAINING HALL)$/, 'bangers'], [/^(COFFEE|SNACKS)$/, 'limelight'], [/^(DISPATCH|DELIVERIES)$/, 'archivo']], base: 'archivo' },
    F: { rows: [], base: 'playfair' },
    R: { rows: [[/^(BOXING|HOT MEALS)$/, 'staat']], base: 'alfa' },
    E: { rows: [[one, 'bungee'],
                [/^(CASINO|FILM STUDIO|CABARET|WEDDING CHAPEL|COSTUMES|MASKS \+ WIGS|TAILOR|RECORDING STUDIO|PROP STORE|SCENERY WORKSHOP)$/, 'limelight'],
                [/^(BAKERY|FRESH BREAD|TRATTORIA|BURGERS|RAMEN|NOODLES|ROOFTOP GRILL|KEBAB\b.*)$/, 'pacifico']], base: 'bungee' },
    B: { rows: [[one, 'monoton'], [/^HOTEL$/, 'monoton'],
                [/^(SURF SHOP|ICE CREAM|SUNDAES\b.*|JUICE|FLOWERS|BAIT|COFFEE\b.*|GRILL\b.*|POPCORN\b.*)$/, 'pacifico']], base: 'righteous' },
    U: { rows: [[/^(DORMITORY|OBSERVATORY|LECTURE HALL|LIBRARY|SCIENCE MUSEUM|PSYCHOLOGY|FOSSIL)$/, 'fell'],
                [/^(BOOKS|BIKE REPAIR|NEWS|CAFE|CORNER STORE|TICKETS)$/, 'grad']], base: 'way' },
    S: { rows: [[/^(HOME\b.*|QTR\b.*)$/, 'dot'],
                [/^(MUSEUM OF THE CITY|GALLERY|PAINTING GALLERY|ANTIQUITY|ARMS HALL|ROTUNDA|DINOSAUR|MAIN HALL|ART SUPPLIES|SCULPTORS WORKSHOP)$/, 'marc'],
                [/^(LUCHA LIBRE|WRESTLING TONIGHT|THE BIG TOP ARENA|LIVE TONIGHT)$/, 'rye'],
                [/^(FRUIT|FISH|BREAD|FLOWERS)$/, 'alfa'],
                [/^(CITY STADIUM|TRAINING GYM|CLUBHOUSE|HALL OF FAME|BOXING\b.*|NO PAIN NO GAIN|BOX OFFICE|TICKETS)$/, 'grad']], base: 'way' },
    I: { rows: [[one, 'stencil'], [num, 'stencil'],
                [/^(WAREHOUSE|HANGAR|POWER STATION|FREIGHT GATE|CUSTOMS|WELDING|AEROSPACE LAB|FORKLIFT REPAIR|RAIL SERVICE|BOAT REPAIR|HARDWARE)$/, 'stencil']], base: 'way' }
};
function fontFor(d, words) {
    const D = DISTRICT[d], w = String(words).trim();
    if (D) for (const r of D.rows) if (r[0].test(w)) return r[1];
    if (WAY.test(w)) return 'way';
    return D ? D.base : 'way';
}
/* rows = the room's rows; districtOf(row) = its district letter. Returns { signs, byFont }. */
function apply(rows, districtOf) {
    const out = { signs: 0, byFont: {} };
    const walk = (o, d) => {
        if (!o || typeof o !== 'object') return;
        if (Array.isArray(o)) { for (const v of o) walk(v, d); return; }
        for (const k in o) {
            const v = o[k];
            if (typeof v === 'string' && v.indexOf('txt:') === 0) {
                const q = v.slice(4).split('|'); while (q.length < 5) q.push('');
                if (q[4] !== 'v') { if (!q[5]) q[5] = fontFor(d, q[0]); o[k] = 'txt:' + q.join('|'); out.signs++; out.byFont[q[5]] = (out.byFont[q[5]] || 0) + 1; }
            } else if (v && typeof v === 'object') walk(v, d);
        }
    };
    for (const r of rows) walk(r, districtOf(r));
    return out;
}
module.exports = { apply, fontFor, DISTRICT, WAY };
