# THE BRANDING: names, typefaces and marks for every sign (started 2026-11-20)

mondo 11-20: "I want to do a pass on all of the fonts and signage in the game in all zones. There should be neon signs and billboards in
disaster city, with the streets that have nightlife looking like a major city. There should be actual names/franchises/businesses/branding.
Treat this pass like a marketing agent or branding agent ... All of these need real plausible in universe names."

The proposal sheet (the brand book, with the logo sketches and the neon mock-up) went to him the same day. His answers, word for word:
- "No Bangers font." (no sign may use it; the id is gone from `HQ_SIGN_FONTS` and `sign-fonts.js`. The fight UI's comic numbers still use it: ask before touching those.)
- "Disaster Hills is good" (the Hollywood Hills' new name).
- "Calamity Mutual, Too Big to Fail (no again)" (the bank and its line).
- "The rest is all good for now" (every other pick below).
- "If there is a recording studio or record label in the game i want it to be called Mid Records."

## The rules of the pass
- A parody of the real world, in the register of Men in Slacks and Came A Lot: a joke a real business could still trade under.
- Disaster is the city's surname (Calamity Mutual, Act of God Insurance, Phoenix Reconstruction).
- A dozen CHAINS repeat across districts and on billboards; the rest are one-off shops.
- Wayfinding is never renamed: EXIT, GATE B, PARKING, room names, warning plates, trail and run names keep their words and the Oswald face.
- Marks are drawn in code from flat shapes (as the city seal is). No generated images. The DOOR logo is his files, untouched.
- Display text only. Room ids, plot ids, district file names and saves never change (`districts/N.js` is still the Hills' file).

## How a sign gets its name (Disaster City)
A district file keeps writing the plain word (`sign('BANK', ...)`). `docs/disaster-city/sign-fonts.js` `BRAND` holds, per district,
`N(/^BANK$/, 'CALAMITY MUTUAL', 'playfair')`; `bake-disaster-city.js` runs it over every `txt:` key, so a rename is one row + one bake.
- An apostrophe in a name is the curved one (’): the bake writes keys in single quotes.
- A long name on a board cut for a short word stands on two lines (three-renderer.js THE TWO-LINE FIT in `_hqArchSignTex`: used when
  one line would leave the letters under about a third of the board and two lines are 1.3 times larger).
- `SIGNS_DUMP=1 node bake-disaster-city.js --dry-run` lists every sign's words by district with its board's width / height.
- New typeface ids (11-20): `tilt` Tilt Neon, `yellow` Yellowtail, `dafoe` Mr Dafoe, `fasc` Fascinate, `abril` Abril Fatface,
  `dela` Dela Gothic One, `frak` UnifrakturMaguntia. The three scripts and the blackletter are drawn in Title Case.
- A sign drawn before the Google font sheet arrived kept the fallback face for good (`fonts.check` says yes to a family with no rule yet). Since 11-20 a typeface counts only when a loaded face of that family exists, and the sign asks again every 1.5 s (three-renderer.js, same function).
- Seen in the game 11-20 (HEAD b983684 + the font fix): CALAMITY MUTUAL on the bank's pediment (two lines), Snake Eyes on the casino's awning, Till Death Wedding Chapel in script, The Daily Disaster on the Press Court board.
- Signs spelled one letter a quad (the casino's and the cinema's tall letters, the hotel's fin) still spell the plain word.

## Where the pass stands
| Step | State |
|---|---|
| 1. Disaster Hills (district name, map label, the Canyon Trail's way sign) | BUILT 11-20 |
| 2. Disaster City's shop signs take their names (all districts but Civic) | BUILT 11-20 |
| 2b. Civic's shops (Grounds for Appeal, Out By Noon Bail Bonds, Sign Here Notary, Borrowed Time) | waits: `districts/C.js` is the second side's row |
| 3. Chain marks beside the words (`_hqSignMark`), neon tube signs and lit billboards on the two night streets (Entertainment, Bayside) | not started |
| 4. The Western Town, the ski mountain | not started (the Mountains are held by world polish thread 5) |
| 5. Every other zone | not started |

## The approved names
**Chains** (several districts + billboards): Calamity Mutual ("Too big to fail.") · Act of God Insurance ("Not covered.") · Jitters Coffee ·
Meltdown Burger · Kwik Panic (24 h convenience) · The Daily Disaster + DCN 4 News · Mid Records ("It's fine.") · Phoenix Reconstruction
("We rebuild. Again.") · Icarus Aerospace ("Aim higher.") · Pandora Shipping & Storage ("We never open the box.") · Calamity Motors ·
Kaboom! Cola · Dino-Might Gas · Babel Telecom · Landslide Realty ("Homes that move you.") · Hock & Awe (pawn) · Loose Screw Hardware.
**The city's own:** D.C.P.D., D.C.F.D. (his, 11-15); proposed D.C.T.A. (transit), D.C.P.W. (public works), Disaster City Light & Power,
Port of Disaster City, D.C. Beach Patrol, Hail Mary Cab Co.

**Disaster City, sign today -> name** (built unless marked):
- Hero Plaza: NEWS -> The Daily Disaster · HERO -> Hero Energy · HERO WORKSHOP -> Cape & Cowl Outfitters · TRAINING HALL -> Sidekick Academy · COFFEE -> Jitters Coffee · SNACKS -> Hot Mess Hot Dogs
- Financial: BANK -> Calamity Mutual · EXCHANGE -> Disaster City Exchange · LOANS -> Quicksand Loans · PAWN -> Hock & Awe · ARCADE -> The Farthing Arcade · GARAGE -> Park & Pray · NEWS -> The Daily Disaster. Not built: Act of God Insurance's office, Faust & Associates' plate, the Financial HOTEL (no name proposed yet).
- Southside: BOXING -> Glass Jaw Boxing Club · HOT MEALS -> Mercy Kitchen · ENGINES REBUILT -> Fender Bender Auto Body · HARDWARE -> Loose Screw Hardware · PAWN -> Hock & Awe · WE BUY GOLD -> Fool's Gold Exchange · TOOL AND DIE -> Murphy's Tool & Die
- Entertainment: CASINO -> Snake Eyes · FILM STUDIO -> Calamity Pictures · CINEMA -> The Aftershock · RECORDING STUDIO -> Mid Records · CABARET -> The Velvet Rope · WEDDING CHAPEL -> Till Death Wedding Chapel · COMEDY TONIGHT -> The Punchline · LIVE MUSIC -> The Feedback · BAR -> Club Aftermath · ARCADE -> Game Over · BURGERS -> Meltdown Burger · RAMEN / NOODLES -> Slurp City · KEBAB -> Kebabylon · TRATTORIA -> Mamma Mayhem's · BAKERY -> Upper Crust Bakery · ROOFTOP GRILL -> Scorched Earth Grill · DUMPLINGS -> Lucky Dumpling · COSTUMES -> Central Miscasting · MASKS + WIGS -> Alter Ego · TAILOR -> A Stitch in Time · MAGIC + JOKES -> Smoke & Mirrors · PAWN -> Hock & Awe
- Bayside: HOTEL -> The Calm Before · SURF SHOP -> Wipeout Surf Co. · ICE CREAM -> Brain Freeze · JUICE -> Main Squeeze · FLOWERS -> Petal Pushers · BAIT -> Hook, Line & Sinker · BOAT REPAIR -> Sunk Cost Marine · CAFE -> Jitters Coffee · LIFEGUARD -> D.C. Beach Patrol (city seal). Not built: Bloomingdoom's (the mall's DEPARTMENT STORE: the mall is world polish thread 20's row), Epicenter (a new club).
- University: BOOKS -> Dog-Eared Books · BIKE REPAIR -> Spoke Too Soon · CAFE -> The Daily Grind · CORNER STORE -> Kwik Panic · LIBRARY -> Ashfall Memorial Library · DORMITORY -> Fallow Hall · SCIENCE MUSEUM -> Museum of Natural Disasters · NEWS -> The Daily Disaster. Campus name: Disaster City University, "Lux et Calamitas", the DCU Aftershocks (no sign yet).
- Sports + Culture: CITY STADIUM -> Calamity Mutual Field (home of the Disaster City Wrecking Crew) · TRAINING GYM -> No Pain No Gain Gym. Not built: D.C.M.A. (the gallery; its GALLERY signs are room labels), Lucha Calamidad.
- Industrial: WAREHOUSE -> Pandora Shipping & Storage · POWER STATION -> Disaster City Light & Power · AEROSPACE LAB / HANGAR -> Icarus Aerospace / Icarus Hangar · WELDING -> Sparks & Sons Welding · FORKLIFT REPAIR -> Uplift Forklift · RAIL SERVICE -> D.C. & Western Railroad · HARDWARE -> Loose Screw Hardware · BOAT REPAIR -> Sunk Cost Marine · CORNER STORE -> Kwik Panic. Not built: Calamity Motors Works, Phoenix Reconstruction + Domino Demolition hoardings.
- Disaster Hills: Disaster Hills Observatory, Catastrophe Drive, Landslide Realty boards (none built).

**The Western Town** (none built): the town is NOWHERE ("Welcome to the middle of Nowhere · Pop. 51"). The Thirsty Vulture Saloon · The
Grand Mirage Hotel · First Bank of Nowhere ("Robbed weekly.") · Slim Pickings Mercantile · Nowhere County Sheriff · Digby & Sons,
Undertakers ("You stab 'em, we slab 'em.") · Doc Sawbones, M.D. · Close Shave · Fool's Gold Assay Office · Hold Your Horses Livery · Iron
Will Blacksmith · Western Onion Telegraph Co. · The Lost Cause Mine · Rotgut Reserve / Old Tumbleweed Lager · The Tumbleweed Motel ·
Dino-Might Gas ("Last gas for 51 miles.") · Calamity Bros. Circus · Pyramid Scheme Tours (Giza) · REDACTED Corp. (Area 51's contractor;
its logo is a black bar). Faces: Rye, Sancreek, Ewert.

**The ski mountain** (none built): Mount Olympus Ski Resort ("Ski like a god") · The Ambrosia Lodge · The Nectar Bar · Winged Heel Ski &
Board · Borrowed Boards (rentals) · Olympus Ski Patrol · Prometheus Warming Hut · Hephaestus Hot Springs · North Pole Toy Works · Dasher &
Sons Sleighs. The runs and chairs keep their names.

**Other zones** (none built): Disaster County Parks & Wreckreation (the Woods' ranger station) · Timber! Lumber Co. · Cobb Family Farms +
Lake Inferior (the Estate) · The Holey Grail Inn + Lance-A-Lot Arms (Came A Lot, blackletter) · Kaiju Ramen, Kazan Onsen, Sleeping Dragon
Sake (Katana Island; brush face Yuji Syuku, red seal marks) · Katana Line Ferries + Penny Dreadful Arcade (the Harbour) · D.C.P.W. plates
(the Sewers) · REDACTED Corp. (the D.U.M.B.) · Icarus Aerospace Lunar Division + Red Dust Mining Co. (Outer Space) · the Internet's
SPONSORED tiles carry the city's chains · Faust & Associates (Hell) · Pearly Gates, a gated community (Heaven) · Cold Shoulder Research
Station (Antarctica). Atlantis, the Deep, the Cavern and Leylines get no brands (carved names only).

## Still open with mondo
- "Skinwalker Ranch" is a real place name: keep, or parody it (Shapeshifter Ranch)?
- Code-drawn marks for the chains, or his own art as with DOOR?
- How cheeky (alternates held back: Master Bait & Tackle, The Sword & Stoned).
- A name for the Financial district's HOTEL.
