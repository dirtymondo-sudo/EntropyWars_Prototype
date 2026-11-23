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

## The neon, the chain marks, the billboards (step 3, 11-20)
- **THE NEON.** A `BRAND` row with `{ neon: '#colour' }` makes its sign a lit tube: an eighth field `n` on the key, the part at glow 1, a board
  under it turned dark. three-renderer.js `_hqArchSignTex` draws a soft halo, a pale core and (a boardless sign) a dark plate with a thin
  tube frame behind the words only, on a canvas twice as fine. On: every food, club and show sign of Entertainment and Bayside's seafront
  shops + the hotel. Always lit (no day / night switch, no flicker: nothing runs per frame). A small script sign smears as neon: the
  chapel's stays paint.
- **THE CHAIN MARKS.** three-renderer.js `HQ_CHAIN_MARKS`: `bolt` Act of God, `bank` Calamity Mutual, `burst` Kaboom! Cola, `mid` Mid Records
  (a level meter with every bar in the middle), `flame` Phoenix, `wing` Icarus, `burger` Meltdown, `cup` Jitters, `crate` Pandora. Flat SVG
  paths in the sign's own letter colour; named as the key's seventh field (`mark:` on a `BRAND` row), like the city seal.
- **THE BILLBOARDS.** `docs/disaster-city/billboards.js`, run by the city bake: per district (`PER`: E 4 found of 7 wanted, B 1, F 2) the
  flat-roofed buildings with the most storeys get two lit boards, one at each long edge of the roof reading outward, each an advert
  (`ADS`: name, line, colours, face, mark). One new arch row a building (`bb:<building id>`); no district file edited. Most Entertainment
  and Bayside buildings have pitched roofs or domes and take none: more boards need street-side poles or wall-mounted boards (next pass).
- Seen in the game at night, HEAD 43619a9: Snake Eyes in red neon under the Act of God board, Landslide Realty over Bayside, Kaboom!
  Cola and the hill sign from above. Not looked at: each of the other 19 neon signs, the Financial boards.
- A probe sets the night with a view's `"eval": "window._hqClockHour=function(){return 23;}"` (it takes hold from the second view on).

## Street level + the Western Town (step 4, 11-20)
- **THE WALL BOARDS + THE POSTERS** (mondo 11-20: "do the street level wall mounted boards"; `billboards.js` second half). Every building of
  Entertainment and Bayside wears, on each face that looks onto open ground (the spot 5 m out lies in no building's footprint): a lit board
  on its top storey (two storeys or more: up to two faces; one storey: one board from 2.3 m to just over the eave) and two eye-level
  POSTERS (2.4 x 1.5 m, 0.9 m over the pavement), one near each end of the wall. One `bbw:<building id>` arch row a building. The city now
  carries 55 boards and 218 posters. **Not looked at in the game** (mondo: "skip the pictures"): a poster may sit over a side window or a
  prop against the wall; the hotel's tower is left out. To thin them: `WALLS`, or the poster loop in `apply`.
- **THE WESTERN TOWN IS NOWHERE** (`docs/areas/desert/districts/W.js`, room `site_prebuilt_area51_ow_town`): every front carries its
  business's name (The Thirsty Vulture, The Grand Mirage Hotel, First Bank of Nowhere, Slim Pickings Mercantile, Nowhere County Sheriff,
  Digby & Sons Undertakers, Close Shave / Teeth Pulled, Fool's Gold Assay Office, Hold Your Horses Livery, Iron Will Blacksmith, Western
  Onion Telegraph Co., The Lost Cause Mine; Rotgut Reserve on the saloon's side wall), and a ranch gate over Main Street's west end reads
  WELCOME TO THE MIDDLE OF NOWHERE · POP. 51. `western()` takes `o.font` (rye, sancreek, ewert). Seen in the game 11-20 (the gate, the bank,
  the street). Not built: Doc Sawbones (no doctor's building stands), the motel, Dino-Might Gas, the circus and Giza names (other districts).

## THE SIGNAGE PASS (11-22): a front is the tenant's, an advert hangs on a blank wall, no sign in a wall
mondo 11-22 (his picture: Bayside's round flower shop wearing Icarus Aerospace, Meltdown Burger and Jitters Coffee): "We added these signs
for businesses and stuff but they are all messed up. Why does this one building have icarus aerospace, hotdogs, and burgers?? And the
signs are clipping into stuff. Please fix. The signs should make logical sense. Billboards, street level signs, whatever. You need to think
like an actual city planner".
- **WHAT IT WAS.** Step 4 dealt the twelve adverts in turn onto every open wall of Entertainment and Bayside (55 boards, 218 posters), hung
  on each building's bounding box. So every shop wore up to ten other firms' names, the boards covered the shops' own signs (Upper Crust
  Bakery, Kebabylon, Mid Records, Game Over, A Stitch in Time, Petal Pushers were under one), and on a round or stepped building the
  boards stood in the air or inside an awning.
- **THE PLANNER'S RULES** (`docs/disaster-city/billboards.js`, its head lists them): (1) a face with the building's own sign or doorway
  takes no advert; (2) an advert hangs only on a blank wall: the wall itself within 30 cm behind every part of it (never glass, a shutter,
  a door, a sign), 2.5 m of clear air in front, no tree, and at eye level no prop; it slides along the wall to the first clear stretch; (3)
  one upper board (two storeys or more) and one pair of posters a building at most; (4) a roof board only on a roof edge that looks onto a
  street within 40 m or onto 16 m of open ground, and never where a parapet or roof hut stands; (5) a chain's own building advertises
  itself (Snake Eyes, Meltdown Burger, Mid Records, Jitters), a place that sells food takes no other food or drink advert, otherwise the
  advert whose nearest twin is farthest away. The city now carries 16 boards (6 on roofs, 10 on walls) and 46 posters (23 pairs). More adverts = more blank walls or new
  roadside structures, never the fronts.
- **THE SIGN CHECK** (`docs/disaster-city/sign-check.js`, run by the city bake after every district and the billboards, ALL districts): it
  knows every drawn surface (arch boxes, cylinders, polys, standing quads, skinned buildings) in the renderer's own frames. A sign that sits
  inside a wall or flush behind a surface is drawn out along its own facing to 1 cm past it (97 signs: COAL AND ICE, The Daily Disaster,
  Ashfall Memorial Library, Museum of Natural Disasters, Calamity Pictures, the food hall's two menu boards, Calamity Mutual Field, the
  lantern lane's blade letters, which faced INTO their blades). A surface standing off a sign (a colonnade) is listed, not moved. THE
  TWINS: a smaller lettering lying under a larger one on the same face is taken out (the cinema's fin was lettered twice: C over N over
  I). The list is `docs/disaster-city/sign-check.txt`; its LEFT lines are for the district threads (the fire station's sign inside its
  marble block, the stadium kiosks' HOT FOOD / DRINKS / RENTALS drawn as ring copies inside their drums).
- **A QUAD'S FACING:** `ry` 0 looks +z, 180 -z, 270 +x, 90 -x (in the row's frame, then the row's `rot`); a quad is one-sided. The lane
  blades and a Sports blade had the two the wrong way round.
- A district thread that adds a sign just rebakes: the check runs on it. `SIGNS_DUMP=1 node bake-disaster-city.js --dry-run` prints the
  `BILLBOARD` and `SIGNCHECK` lines.
- Probing the city: the whole room no longer fits the cloud browser's memory with its models; `node playtest_city.js <room> <views> --nogltf
  --flags=EW_HQ_NO_SURVEY,EW_HQ_NO_ENCOUNTER,EW_NO_FLORA,EW_HQ_NO_RESIDENTS,EW_NO_HQ_GRASS,EW_NO_GRASS_FIELD,EW_NO_ANIMALS` is ready in a
  minute (buildings, signs and code-drawn props; no model files).

## Where the pass stands
| Step | State |
|---|---|
| 1. Disaster Hills (district name, map label, the Canyon Trail's way sign) | BUILT 11-20 |
| 2. Disaster City's shop signs take their names (all districts but Civic) | BUILT 11-20 |
| 2b. Civic's shops (Grounds for Appeal, Out By Noon Bail Bonds, Sign Here Notary, Borrowed Time) | waits: `districts/C.js` is the second side's row |
| 3. Chain marks, neon tube signs on the two night streets (Entertainment, Bayside), lit rooftop billboards | BUILT 11-20 (first pass: 21 neon signs, 14 billboards on 7 roofs) |
| 4. Street-level boards + posters; the Western Town | BUILT 11-20; the boards and posters re-laid by THE SIGNAGE PASS 11-22 (blank walls only). The ski mountain: not started (the Mountains are held by world polish thread 5) |
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

**The Western Town** (the town's own fronts built 11-20): the town is NOWHERE ("Welcome to the middle of Nowhere · Pop. 51"). The Thirsty Vulture Saloon · The
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

## THE ZONE FLAGS (11-23)
mondo 11-23: "Can we add flags to different zones? ... Katana bay can be a white flag with a red square. The North Pole can be a red flag with a green
cross (like a wrapped christmas gift), Came A Lot can have a sword and shield or maybe dragon or lion ... I want the flags to look a little better than
just perfectly straight rectangles, i dont think we need full on cloth simulation and wind physics, but maybe something in between". Mock-ups: the
Zone Flags artifact (https://claude.ai/artifact/ASbdLqXahFRUu3vksdzuJQ; files /mnt/project-files/zone-flags/). HIS PICKS (17:09Z): motion D (a wave +
the trees' gusts), North Pole B (the bow), Came A Lot A (sword + shield, a Meshy picture, R2 `Assets/world/flags/camelot_crest.jpg`), DOOR HQ (his
Door mark on navy), Nowhere (the Western Town's hollow star), Area 51 (REDACTED black bars), Heaven (the Pearly Gates' gold gate). NO Beach Patrol
flag ("the beach is in the city": it flies the city flag). Hell + Antarctica: round 2 on the same page; he picked A + A (round 3 below).
- **How it is built:** data.js `ZONE_FLAGS` (`flags`: id -> `art` drawn in code (three-renderer.js `HQ_FLAG_ART`) or `img` on R2; `swap`: a room whose
  Meshy `flag_pole` rows fly a zone flag (that model's cloth is part of its mesh); `rows`: the poles it puts up, per room, in metres) + `zoneFlagsApply()`
  at the end of data.js. Catalogue `zone_flag` (8 m pole, 2.4 x 1.6 m cloth) and `zone_flag_hall` (3.4 m brass indoor stand, barely stirs).
  three-renderer.js THE ZONE FLAGS: `_hqFlagCloth` = one 16 x 8 sheet, the wave in the vertex shader on `_EW_WIND` (the trees' clock; WebGPU twin
  `_ewNodeTag` k 'flag' in `_ewNodeSway`). Disaster City's Civic poles: `_hqArchFlagsOut` turns C.js flag()'s box + two `mark:flag` quads into one
  waving sheet of the city flag at build time (no rebake). Off: `EW_HQ_NO_ZONE_FLAGS`, `EW_HQ_NO_FLAG_WAVE`.
- **Where:** DOOR HQ foyer (two hall stands by the double doors), Katana Island (the Landing Square x 2, the castle yard), the North Pole village square,
  Came A Lot (the town square by the lions x 2), Nowhere (by the well), Heaven (either side of the Pearly Gates), Area 51 (its two existing poles).
  A zone thread may move a row in `ZONE_FLAGS.rows` (its room's metres) like any prop.
- **ROUND 3 (11-23, mondo: "Hell A and anarctica a. also the heaven flag poles are just floating on nothing, and camelot still has those red banners
  that dont match the flag. make sure the beach doesnt have those yellow and blue flags either"):**
  - Hell A (horns over a flame, red over black, R2 `Assets/world/flags/hell.jpg`): two poles at THE MOUTH (hell room squares 15,42 + 20,42).
    Antarctica A (the flat-earth map in its Ice Wall, UN blue, R2 `Assets/world/flags/antarctica_flag.jpg`; `antarctica.jpg` = the first, too dark):
    two poles either side of THE STATION's board in the Station Yard. The Flag Line's red route flags (S.js) are route markers and stay.
  - Heaven: the poles stood at the cloud wall's line with a fixed y; they stand on the landing's marble now (squares 22,26 + 25,26, no y).
  - Came A Lot: ONE banner design, the kingdom's arms. bake-camelot.js + bake-camelot-castle.js `royalBanner()` keep the rod and brackets; the cloth is
    one box keyed `mark:banner:camelot` that the renderer hangs as a swaying swallowtail sheet (`_hqBannerCloth`, picture `_hqBannerPaint`: the crest's
    middle band on its own blue, the gold border; id `banner:<flag>:<height/width in quarters>`). The kit's tower flags + the town wall's corner towers
    are `mark:flag:camelot` boxes (waving crest flags). The palace's Meshy `banner` rows become catalogue `zone_banner` (the same rod, the crest cloth)
    through `ZONE_FLAGS.banners` (room -> flag). Any zone can use the three: `mark:flag:<id>` / `mark:banner:<id>` on an architecture box,
    `ZONE_FLAGS.banners` for its Meshy banners.
  - The beach flies the city flag: districts/B.js the lifeguard towers (were aqua / pink / yellow / red), the lifeguard station and the harbour master's
    pole, and the Shore's (beach S.js) lifeguard station + both swim flags (were red over yellow) are `mark:flag:dc` boxes (waving city flags).
    Rebaked with bake-disaster-city.js (the three barrels the bake moves on a fresh main were put back by hand: that drift is not this change's).

## Still open with mondo
- "Skinwalker Ranch" is a real place name: keep, or parody it (Shapeshifter Ranch)?
- Code-drawn marks for the chains, or his own art as with DOOR?
- How cheeky (alternates held back: Master Bait & Tackle, The Sword & Stoned).
- A name for the Financial district's HOTEL.
