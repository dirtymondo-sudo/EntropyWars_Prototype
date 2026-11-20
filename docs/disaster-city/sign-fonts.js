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
     way Oswald · cinzel Cinzel · bebas Bebas Neue · archivo Archivo Black · playfair Playfair Display · monoton Monoton
     righteous Righteous · pacifico Pacifico (drawn in Title Case) · bungee Bungee · limelight Limelight · alfa Alfa Slab One
     staat Staatliches · fell IM Fell English SC · grad Graduate · stencil Saira Stencil One · dot DotGothic16 · marc Marcellus SC · rye Rye
     THE BRANDING PASS (11-20): tilt Tilt Neon · yellow Yellowtail · dafoe Mr Dafoe · fasc Fascinate · abril Abril Fatface · dela Dela Gothic One
     · frak UnifrakturMaguntia (yellow / dafoe / frak are drawn in Title Case). NO BANGERS (mondo 11-20: "No Bangers font"). */
'use strict';
const one = /^[A-Z]$/, num = /^\d+$/;
/* the same in every district: exits, gates, sections, bays, floor numbers, room names, warning plates, back-of-house boards */
const WAY = /^(EXIT|\d+|[A-Z]|GATE [A-Z]|SEC \d+|BAY [A-Z]|STAGE \d+|SOUTH GATE|PARKING|PAY HERE|SECURITY|STEWARDS|PRESS|OFFICE|FRONT DESK|LOCKER ROOMS?|MAIN HALL|BEDROOM|TROPHY ROOM|ROTUNDA|MENU|OPEN|SCAN|KEYS|MAIL|CASHIER|STOP|ON AIR|KEEP CLEAR|NO SMOKING|EYE PROTECTION|DANGER HIGH VOLTAGE|MAX LOAD .*|AUTHORISED STAFF ONLY|SHIFT ROTA|LOADING (DOCK|BAY|OFFICE)|(ARENA )?DELIVERIES|STAGE (DOOR|CREW)|EQUIPMENT DEPOT|DISPATCH|CONTROL ROOM|CLEAN ROOM|CANTEEN|(SPORTS )?CLINIC|HARBOUR MASTER|LIFEGUARD)$/;
const DISTRICT = {
    C: { rows: [[/^(FIRE STATION|CIVIL RECORDS|CITY HALL|COUNCIL ANNEX|COURTHOUSE|POLICE|TIME BUREAU|MILITARY OFFICES|PERMIT OFFICES)$/, 'cinzel']], base: 'bebas' },
    H: { rows: [[/^NEWS$/, 'playfair'], [/^(COFFEE|SNACKS)$/, 'limelight'], [/^(DISPATCH|DELIVERIES)$/, 'archivo']], base: 'archivo' },
    F: { rows: [[/^(ARCHIVE|VAULT|ARCADE)$/, 'marc'], [/^(TAXI|GARAGE)$/, 'way']], base: 'playfair' },
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
/* THE CITY MARKS (2026-11-15, mondo: "establish Disaster City as a municipality, like have D.C.P.D. and D.C.F.D. and a disaster city
   branding/logo for certain buildings"; his OK on the branding sheet). The department names are HIS: D.C.P.D., D.C.F.D. A seventh field
   on the key names the mark drawn left of the words (three-renderer.js _hqSignMark: seal, shield, pd, fd). Per district: [match, { words
   = the board's new wording, mark, font, fg (only on a coloured board) }]. A boardless sign (letters alone) takes no seal. */
/* THE BRANDING PASS (2026-11-20, mondo: "There should be actual names/franchises/businesses/branding ... real plausible in universe names"; his OK
   the same day on the brand book, with "Calamity Mutual, Too Big to Fail" for the bank and "Disaster Hills"). A district file keeps writing the plain
   word (BANK, CASINO, HOTEL); this table gives the sign its business name at the bake: [the word on the sign, { words = the name, font }].
   The chains stand in several districts (Jitters Coffee, Kwik Panic, Hock & Awe, The Daily Disaster, Loose Screw Hardware, Sunk Cost Marine).
   Wayfinding (EXIT, GATE B, PARKING, room names, warning plates) is never renamed. Mid Records is mondo's own name. The Civic Center's shops
   (COURT CAFE, BAIL BONDS, NOTARY + COPIES, WATCHMAKER) wait: its district file is the second side's row. The full list with the alternates
   that lost: docs/notes/branding.md. An apostrophe in a name is the curved one (’): the bake writes keys in single quotes. A long name on a board cut for a short word stands on two lines (three-renderer.js THE TWO-LINE FIT). */
const N = (re, words, font, x) => [re, Object.assign({ words, font }, x || {})];
const BRAND = {
    C: [[/^POLICE$/, { words: 'D.C.P.D.', mark: 'pd', font: 'way' }],
        [/^FIRE STATION$/, { words: 'D.C.F.D.', mark: 'fd', font: 'way' }],
        [/^(CITY HALL|COURTHOUSE|COUNCIL ANNEX|PERMIT OFFICES|CIVIL RECORDS)$/, { mark: 'seal', board: true }]],
    H: [N(/^NEWS$/, 'THE DAILY DISASTER', 'frak'), N(/^HERO$/, 'HERO ENERGY', 'archivo'), N(/^HERO WORKSHOP$/, 'CAPE & COWL OUTFITTERS', 'archivo'),
        N(/^TRAINING HALL$/, 'SIDEKICK ACADEMY', 'archivo'), N(/^COFFEE$/, 'JITTERS COFFEE', 'pacifico'), N(/^SNACKS$/, 'HOT MESS HOT DOGS', 'limelight')],
    F: [N(/^BANK$/, 'CALAMITY MUTUAL', 'playfair'), N(/^EXCHANGE$/, 'DISASTER CITY EXCHANGE', 'playfair'), N(/^LOANS$/, 'QUICKSAND LOANS', 'alfa'),
        N(/^PAWN$/, 'HOCK & AWE', 'alfa'), N(/^ARCADE$/, 'THE FARTHING ARCADE', 'playfair'), N(/^GARAGE$/, 'PARK & PRAY', 'way'), N(/^NEWS$/, 'THE DAILY DISASTER', 'frak')],
    R: [N(/^BOXING$/, 'GLASS JAW BOXING CLUB', 'staat'), N(/^HOT MEALS$/, 'MERCY KITCHEN', 'staat'), N(/^ENGINES REBUILT$/, 'FENDER BENDER AUTO BODY', 'alfa'),
        N(/^HARDWARE$/, 'LOOSE SCREW HARDWARE', 'alfa'), N(/^PAWN$/, 'HOCK & AWE', 'alfa'), N(/^WE BUY GOLD$/, 'FOOL’S GOLD EXCHANGE', 'playfair'),
        N(/^TOOL AND DIE$/, 'MURPHY’S TOOL & DIE', 'stencil')],
    E: [N(/^CASINO$/, 'SNAKE EYES', 'fasc', { neon: '#ff3b3b' }), N(/^FILM STUDIO$/, 'CALAMITY PICTURES', 'limelight'), N(/^CINEMA$/, 'THE AFTERSHOCK', 'limelight', { neon: '#ffd21f' }),
        N(/^RECORDING STUDIO$/, 'MID RECORDS', 'dela', { neon: '#f2f2f2' }), N(/^CABARET$/, 'THE VELVET ROPE', 'yellow', { neon: '#c79bff' }), N(/^WEDDING CHAPEL$/, 'TILL DEATH WEDDING CHAPEL', 'dafoe', { neon: '#ff8ac0' }),
        N(/^COMEDY TONIGHT$/, 'THE PUNCHLINE', 'tilt', { neon: '#ffb03a' }), N(/^LIVE MUSIC$/, 'THE FEEDBACK', 'tilt', { neon: '#4fe3ff' }), N(/^BAR$/, 'CLUB AFTERMATH', 'dafoe', { neon: '#ff4fb8' }),
        N(/^ARCADE$/, 'GAME OVER', 'bungee', { neon: '#4fe3ff' }), N(/^BURGERS$/, 'MELTDOWN BURGER', 'bungee', { neon: '#ffe14a' }), N(/^RAMEN$/, 'SLURP CITY RAMEN', 'pacifico', { neon: '#ff6a3a' }),
        N(/^NOODLES$/, 'SLURP CITY', 'pacifico', { neon: '#ff6a3a' }), N(/^KEBAB\b.*$/, 'KEBABYLON  OPEN 24H', 'pacifico', { neon: '#7dff9a' }), N(/^TRATTORIA$/, 'MAMMA MAYHEM’S', 'pacifico', { neon: '#ff5a5a' }),
        N(/^BAKERY$/, 'UPPER CRUST BAKERY', 'pacifico'), N(/^ROOFTOP GRILL$/, 'SCORCHED EARTH GRILL', 'pacifico', { neon: '#ff8a1f' }), N(/^DUMPLINGS$/, 'LUCKY DUMPLING', 'pacifico', { neon: '#ff4040' }),
        N(/^COSTUMES$/, 'CENTRAL MISCASTING', 'limelight'), N(/^MASKS \+ WIGS$/, 'ALTER EGO', 'limelight'), N(/^TAILOR$/, 'A STITCH IN TIME', 'limelight'),
        N(/^MAGIC \+ JOKES$/, 'SMOKE & MIRRORS', 'limelight', { neon: '#c79bff' }), N(/^PAWN$/, 'HOCK & AWE', 'alfa', { neon: '#ffd21f' })],
    B: [N(/^HOTEL$/, 'THE CALM BEFORE', 'monoton', { neon: '#ff4fb8' }), N(/^SURF SHOP$/, 'WIPEOUT SURF CO.', 'pacifico', { neon: '#4fe3ff' }), N(/^ICE CREAM$/, 'BRAIN FREEZE', 'yellow', { neon: '#9ff5ff' }),
        N(/^JUICE$/, 'MAIN SQUEEZE', 'pacifico', { neon: '#ffb03a' }), N(/^FLOWERS$/, 'PETAL PUSHERS', 'pacifico', { neon: '#ff8ac0' }), N(/^BAIT$/, 'HOOK, LINE & SINKER', 'righteous', { neon: '#ffd21f' }),
        N(/^BOAT REPAIR$/, 'SUNK COST MARINE', 'righteous'), N(/^CAFE$/, 'JITTERS COFFEE', 'pacifico', { neon: '#ffd9a0' }),
        N(/^LIFEGUARD$/, 'D.C. BEACH PATROL', 'way', { mark: 'seal', board: true })],
    U: [N(/^BOOKS$/, 'DOG-EARED BOOKS', 'grad'), N(/^BIKE REPAIR$/, 'SPOKE TOO SOON', 'grad'), N(/^CAFE$/, 'THE DAILY GRIND', 'grad'),
        N(/^CORNER STORE$/, 'KWIK PANIC', 'archivo'), N(/^LIBRARY$/, 'ASHFALL MEMORIAL LIBRARY', 'fell'), N(/^DORMITORY$/, 'FALLOW HALL', 'fell'),
        N(/^SCIENCE MUSEUM$/, 'MUSEUM OF NATURAL DISASTERS', 'fell'), N(/^NEWS$/, 'THE DAILY DISASTER', 'frak')],
    S: [N(/^CITY STADIUM$/, 'CALAMITY MUTUAL FIELD', 'grad'), N(/^TRAINING GYM$/, 'NO PAIN NO GAIN GYM', 'grad')],
    I: [N(/^WAREHOUSE$/, 'PANDORA SHIPPING & STORAGE', 'alfa'), N(/^POWER STATION$/, 'DISASTER CITY LIGHT & POWER', 'stencil'),
        N(/^AEROSPACE LAB$/, 'ICARUS AEROSPACE', 'righteous'), N(/^HANGAR$/, 'ICARUS HANGAR', 'righteous'), N(/^WELDING$/, 'SPARKS & SONS WELDING', 'stencil'),
        N(/^FORKLIFT REPAIR$/, 'UPLIFT FORKLIFT', 'stencil'), N(/^RAIL SERVICE$/, 'D.C. & WESTERN RAILROAD', 'stencil'),
        N(/^HARDWARE$/, 'LOOSE SCREW HARDWARE', 'alfa'), N(/^BOAT REPAIR$/, 'SUNK COST MARINE', 'righteous'), N(/^CORNER STORE$/, 'KWIK PANIC', 'archivo')]
};
function brandFor(d, words, bg) {
    const rows = BRAND[d] || [], w = String(words).trim();
    for (const r of rows) if (r[0].test(w) && (!r[1].board || bg)) return r[1];
    return null;
}
function fontFor(d, words) {
    const D = DISTRICT[d], w = String(words).trim();
    if (D) for (const r of D.rows) if (r[0].test(w)) return r[1];
    if (WAY.test(w)) return 'way';
    return D ? D.base : 'way';
}
/* rows = the room's rows; districtOf(row) = its district letter. Returns { signs, byFont }. */
function apply(rows, districtOf, words) {
    const out = { signs: 0, byFont: {} }; if (words) out.words = words;   // (`SIGNS_DUMP=1 node bake-disaster-city.js --dry-run` lists every sign's words by district, with its board's width / height)
    const walk = (o, d) => {
        if (!o || typeof o !== 'object') return;
        if (Array.isArray(o)) { for (const v of o) walk(v, d); return; }
        for (const k in o) {
            const v = o[k];
            if (typeof v === 'string' && v.indexOf('txt:') === 0) {
                const q = v.slice(4).split('|'); while (q.length < 5) q.push('');
                if (q[4] !== 'v') { if (out.words) { const W = out.words[d || '-'] = out.words[d || '-'] || {}, wk = q[0] + (q[2] ? '' : '  (no board)'); (W[wk] = W[wk] || []).push(+q[3] || 0); }
                    const br = q[6] ? null : brandFor(d, q[0], q[2]);
                    if (br) { if (br.words) { q[0] = br.words; out.names = (out.names || 0) + 1; } if (br.font) q[5] = br.font; if (br.mark) { while (q.length < 7) q.push(''); q[6] = br.mark; out.marks = (out.marks || 0) + 1; }
                        /* THE NEON (11-20): `neon: '#colour'` on a row = the sign is a lit tube in that colour on a dark plate (an eighth field 'n'; three-renderer.js draws it), full glow */
                        if (br.neon) { q[1] = br.neon; if (q[2]) q[2] = '#0b0a10';   /* (a neon sign's board is dark: pink tube on a pink board cannot be read) */ while (q.length < 8) q.push(''); q[7] = 'n'; if (k === 'key') o.glow = Math.max(+o.glow || 0, 1); out.neon = (out.neon || 0) + 1; } }
                    if (!q[5]) q[5] = fontFor(d, q[0]); o[k] = 'txt:' + q.join('|'); out.signs++; out.byFont[q[5]] = (out.byFont[q[5]] || 0) + 1; }
            } else if (v && typeof v === 'object') walk(v, d);
        }
    };
    for (const r of rows) walk(r, districtOf(r));
    return out;
}
module.exports = { apply, fontFor, brandFor, DISTRICT, WAY, BRAND };
