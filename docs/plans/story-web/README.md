# The Relationship Web (11-18)

A story-planning tool, not part of the game. Portraits are nodes; you draw labelled ties between units
(defends, allied, rivals, hunts, fears, serves, owes, family, …) and it shows who comes to whose defence and why,
to feed story ideas and the encounter system's "who defends who".

- **Live copy:** https://claude.ai/artifact/GWefCFyrBLAPfanNL5TUYv (owner account, 11-18, with the lasso). The first copy, https://claude.ai/artifact/8fUwyEP4Vqkj8UZdZaihvq, sits on the other account and has no lasso; move boards across with Export > Save a backup, then Load a backup. Both save to the page's own store and to the browser.
- **This folder:** `relationship-web.html` is the same single self-contained page (open it in any browser; boards then save to that browser only). `relationship-web.png` is a screenshot.
- **Roster:** every race in `AVAILABLE_RACES` (two-gender races as separate male / female nodes), plus the story cast from `DOOR_CAST`, the orientation-tape squad from `TUTORIAL_LESSONS` and the two `BOSS_DEFS` entries. Faction ring = the race's `types`.
- **Game export:** a JSON of ties keyed by exact race keys (gender as its own field) and cast ids, shaped to be baked into data.js later. Nothing reads it yet.

## Moving groups (11-18, mondo's ask)

- **Lasso** (toolbar, or G; or hold Alt / Option and drag on empty board): draw a loop; every unit and idea card
  inside it is picked (red ring). Drag any picked one and they all move. Click empty board or Escape to let go.
- **Alt / Option-drag a unit**: moves everything tied to it, through any chain of ties.
- **Group nodes** (`+ Group`, 11-18): a named, coloured pill (The Circus, DOOR, a faction). Tie a unit to it the usual way
  (red handle or Shift-drag onto the pill) and it joins: a thin line in the group's colour and a soft shade around
  the members, no tie needed between them. Drag the pill and its members come along (Alt-drag moves the pill alone).
  Stored as a custom node with `shape: 'group'` + `col`, members as ties of type `member` (unit -> group); Alt-drag
  of a unit does not travel through member ties. The game export lists them under `boardGroups`, not `relations`
  or `groups` (what a group means in a fight is not decided).
- **Places and Factions** (11-18, second ask): every group is a Place (filled pill) or a Faction (outlined pill), set
  with its colour in the group's panel (`gk`, `col`; 12 colours). The board is organised by one kind at a time (toolbar
  Places | Factions, `B.org`): that kind gets the shaded areas and drags its members; the other kind shows as coloured
  dots under each unit and its pills sit in a row on top. Each kind keeps its own layout (`B.lay`), so switching back
  restores where things were. Arrange > Sort into groups lays it out: one area per group, units in none at the end.
  A unit's home group of a kind is the first one it joined; areas hold only home members, other memberships are a
  dashed line, so areas never pile on each other. Member lines show only when the group or unit is picked; picking a
  group dims everyone outside it. A tie from group to group is an ordinary tie (rival factions).
- No hint text in the panels (mondo hates helper text); the button title says it.

## Rebuilding after the roster changes

Scripts in `build/` read the repo's `data.js` / `sprites.js`. Portraits are fetched read-only from the R2 bucket
(`fetch.sh`, `dl.py`, `dl2.py`; Cloudflare auth comes from the environment, never from a file), face-cropped
(`faces.py`, `faces2.py`) and, for 3D-only cast, rendered from their GLBs (`render.js` + `render.html`, headless Chromium).

Order: `node extract.js`, `node urls.js`, `python3 dl.py`, `python3 faces.py`, `node roster.js`, then the second pass
(`extract2.js`, `urls2.js`, `dl2.py`, `render.js`, `faces2.py`, `roster2.js`), then `node build.js` writes the page.
Downloaded art and intermediate JSON are not committed. To change only the code (`app.js` / `template.html`)
without the art, pull `build/roster.json` back out of the built page (the `const EW_DATA = …;` line) and run `node build.js`.

## In the game, one board for every computer (2026-11-18)
mondo works on two computers. Settings > Developer > **Relationship Web** (map.js) opens `/dev/relationship-web`,
which server.js serves from `relationship-web.html` (wrapped in a page skeleton). There the boards save on the game
server (`/api/story-web`, D1 table `story_web_docs`, migration 005): no account, no export; every computer that
opens it from the game loads the same boards and picks up the other one's changes every 10 s and on focus
(app.js `serverInit`). The claude.ai artifact copy keeps its own save.

Race and story-character nodes take a story **Name** (`nick`, e.g. the Cult Leader = August Tomorrow); the game
name shows under it, and the game export lists them in `names`.

## Secret groups (2026-11-18)
A membership can be secret (`secret: true` on the member tie): the group's Members list has a **secret** switch
per member. A secret group is never the unit's home group (no shaded area, the group pill does not drag it); it
shows as a hollow dot under the unit, a "secretly" chip in its Groups, and a dotted line only when one end is
selected. Export: `boardGroups[...].secretMembers`. Example: the Pope in Vatican (place), Christianity
(faction) and secretly the Illuminati (faction).

## One unit in many places, places inside places, the game's map (2026-11-18)
- **Copies:** a unit in more groups of the board's kind than its home one shows a copy of its icon in each other group
  (`copyList`; spot kept on the member tie as `cx, cy`). A copy is the same unit: click it to open the unit, drag it
  alone. When the unit is selected, dotted lines join it to its copies. Secret groups get no copy.
- **Places inside places:** a group's `parent` (inspector: Inside). The parent's shaded area takes in its children's,
  dragging its pill moves them, Sort into groups rings the children round the parent.
- **Map** (toolbar): every zone, district and Disaster City plot from data.js `HQ_ZONE_MAP` + the hub labels, with the
  world map; Add puts it on the board as a place group nested in its zone / district (`src: map:<zone>[:<district>[:<plot>]]`).
  A place group already on the board with the same name ("Sewers" = "The Sewers") is reused. build.js reads data.js
  at build time (`places()`), so rebuild after the map changes.

## The "In the game now" board (2026-11-18)
Boards > **Board: in the game now** makes (or brings up to date) board `game_spawns`: where the game puts every unit today,
read from data.js at build time by `build/spawns.js` (Disaster City residents in their home district, every `npcSpots` NPC
with a race (in the city by its plot), the `HQ_AREA_ENCOUNTERS` walk-in tables per zone, the story cast in DOOR HQ). A unit
in several places gets a copy in each. Other boards are not touched. Rebuild the page after the game's spawns change.

## Zones in their parts, the map behind, the pickers (2026-11-19)
- Districts of a zone with parts sit in their part: Heaven / Hell / The Vatican (the Catacombs and the Colosseum are the Vatican's),
  and Outer Space's Moon / Mars / Saturn / Singularity. A board made before this is fixed once on load (`pfix`): a map district that sat
  right in its zone moves into its part (his own Heaven / Hell / Vatican group by name, else a new one). Nothing is deleted.
- The game's rooms that are not districts are places too (build.js `places()`): Volcano Island, Pirates' Cove, the Frozen Sea, the
  Spaceship and its rooms, Hangar 18, inside the Great Pyramid, the Haunted House's rooms, the Castle in the Sky, the city's Mall...
- Sort into groups on Places stands each place where it is on the world map (pushed apart only to not overlap) and draws the map under
  it (`B.mapK` = board px a map square; Arrange > Show or hide the world map). Places off the map line up to the right.
- Unit inspector "Add to a place or a faction" and group inspector "Add a unit": type to pick; game places not on the board yet and
  roster units not pinned yet are added on the spot.

## New units show up by themselves (2026-11-19)
`build/fresh.js` adds every race in data.js `AVAILABLE_RACES` the baked roster lacks (and a gender a race gained), read from data.js +
sprites.js: name, types, role, families, biomes, temper, lines, and the portrait (or the sprite, shown head and shoulders: `ip`) from
cdn.entropywars.net. build.js runs it, and server.js runs it on the page it serves (cached per file change), so a unit added to the game
appears after the next deploy with no rebuild. Board ids are unchanged.

## The portrait refresh + the ideas board (2026-11-19)
- `build/refresh.js` then `python3 -I build/refresh-faces.py` (run from `build/`) then `node build.js`: every race + gender's picture
  is cut again from the game's art today (sprites.js RACE_PORTRAITS / sprites, from cdn.entropywars.net). Needs only the built
  page, no other intermediate files. 11-19 run: the new Shaman M, Golem and Seraphim (eye-wheel, cut whole: `face_overrides.json`),
  the Streamers' new sprites in place of their 3D renders. Story cast keep their 3D renders.
- `IDEAS_2026-11-19.md` + `ideas-board-2026-11-19.json` (load as extra boards): a read-through of mondo's board with ties and story cards.

## The views (2026-11-19, mondo's pick 1 2 4 6 7)
A view lays out part of the board for looking at; it keeps its own spots (app.js `VIEW.pos`), nothing on the board moves or saves,
and the bar's Close (or Escape) brings the board back. Dragging in a view moves things in the view only; ties cannot be drawn there.
- **Show connections** (unit or group panel): that unit in the middle, everyone tied to it in rings 1, 2 or 3 steps out (bar buttons);
  on the first ring friends sit left, enemies right. Membership in a place or faction is not a tie here.
- **Find the way to…** (unit panel, or Path to… on the bar): then tap another unit or its roster tile; shows every shortest chain of ties
  between the two (up to 6). If no chain of ties joins them it goes through shared groups and says so.
- Arrange > **View: places, factions inside**: every top place (its places inside folded in), its units split into their factions,
  "No faction" last; a unit stands in its first place and first faction only. Picking a unit shows its ties.
- Arrange > **View: chain of command**: serves / worships (actor under target) and employs (employee under employer) as org charts.
- Arrange > **View: family trees**: created (maker above) and family (side by side) as trees.

## The group web + the timeline (2026-11-21)
mondo: "a way for me to see and group the faction relationships without the individual links showing ... and some sort of timeline feature
so I can place events and link them to factions or groups/places or characters".
- **Group web** (toolbar, or W; also Arrange > View: group web): a view with only the factions (or places: the bar's Factions | Places) on it.
  Every tie between their members is summed onto ONE line a kind between the two groups (`hates ×2`, thicker the more there are; a tag shows
  when there are 2 or more, or when one end is picked); a tie straight from group to group (or a unit to a group) counts the same way.
  Click a line: the panel lists the member ties in it. A unit in two factions counts for both; secret memberships do not count; ties inside
  one group are left out. Bar: All ties | Friendly | Hostile, **Loners** (units in no group of that kind shown as themselves), **Fold inside**
  (a group inside another counts as that one), **Spread out** (lays it out again: friends pull together, enemies push apart).
  **Grouping groups:** set a faction's Inside (its panel) to another faction: in the web it sits in that faction's shade and moves with it.
  Pills drag; their spots are kept per board and kind (`B.gweb[kind][id] = [x, y]`), apart from the board's own layout. Ties can be drawn
  between pills here (red handle / Shift-drag), unlike the other views.
- **Timeline** (toolbar, or T): a dock along the bottom of the board. Events are per board (`B.events[id] = { title, when, t, text, refs, col }`;
  `when` is free text, Year 0, before the Fall; the ORDER is `t`, set by dragging a card sideways or Earlier / Later in its panel).
  Rows: One row | By faction | By place (an event sits in the row of every group it names and the home group of every unit it names).
  The event panel links anything: a faction, place, unit or story character on the board, a roster unit (pinned on the spot) or a place from
  the game's map (added as on the map). Picking an event lights what it names on the board (members of a named group too) and dims the rest;
  picking a unit or group lights its events in the dock, and its panel lists them with **+ Event with …**. Export for the game lists them
  under `events`. A deleted unit leaves the events it was in.

## The other kind stays off the board (2026-11-21)
mondo: switching to Factions laid every place out in one huge row along the top. Now the groups of the kind the board is NOT
organised by (the places when on Factions, the factions when on Places) are not drawn on the board at all (app.js `offK`): not
fitted, picked, lassoed, and ties to them are not drawn. Units still wear them as coloured dots, the unit and group panels still
reach them, and Sort into groups no longer lines them up. The views (group web, places-factions-inside, ...) are unchanged.

## The pick list + zooming out (2026-11-21)
- mondo: typing "fortune teller" in a group's Add a unit found nothing. The browser's own datalist only matched the start of a word
  (and behaved differently per browser), so a unit with a story name never came up. The three pickers (Add a unit, Add to a place or a
  faction, an event's Link) now use our own list (app.js `pickList`): every typed word may sit anywhere in the name, the game name, the
  race key or the cast id; arrows + Enter or a click pick; best matches first, 60 at most.
- Zoom out and Fit now go down to 0.02 (was 0.15), so the biggest boards fit on the screen whole.

## The world map fix (2026-11-22)
Arrange > Show or hide the world map: the map behind a Places board drew at 1 board pixel a square (renderMapBg's scale was a
boolean), so it was a 93 px dot under a 5,000 px board and the toggle seemed dead. It now draws at `B.mapK`, Fit takes the map in,
and showing it switches to Places / leaves the group web / sorts by places first when the board was never laid on the map. The Map
dialog's map is drawn at 7 px a square, up to 651 px wide (was 465).

## The Story planner (2026-11-22)
mondo: "a Chapter/Quest planner, where I can add chapters with multiple quests, and the game map on the screen so I can plan the route
the player is meant to take and how the story will play out", then "make the planner easy for me to plan the quests" from the
chapter-by-chapter guide (https://claude.ai/artifact/ScTxXgtDrPMEyjTMnTrhPv). Toolbar **Story planner** opens it over the web (app.js
"THE STORY PLANNER"); **◂ Relationship Web** goes back. ONE plan for every board, saved as doc `story/plan` beside the boards (server.js
`STORY_WEB_PATH`, same password, same 10 s pull; newest `t` wins) and in the browser (`S.story`).
- **Map:** chapters (left, drag to reorder, drag a quest onto another chapter) and their quests; the world painted from the game's own
  ground pictures (`Assets/ui/map/<room>.png` from cdn.entropywars.net, map.js `_zmPaint`'s look; build.js `storyData()` places the rooms);
  a numbered pin a quest in its chapter's colour, arrows in story order, dashed = side quest, dotted = underground leg; Surface /
  Underground; **World at Ch N** shades the zones no chapter up to N names; places off the map (DOOR HQ, Space, Astral, Internet) in a box.
  Drag = pan, wheel = zoom, drag a pin = move it; **On map** then a click places a quest, a step (⌖) or a chapter's zone.
- **Chapter card** = the guide's beat-chart fields: band L1-L6, the nine story steps, goal (Escape / Explore / Learn / Choice), zone,
  enemies (type to pick, or click who lives in that zone today: the "in the game now" spawns, or a whole faction of the current board),
  mechanics used (a chapter's NEW ones are found by themselves), boss, reward, clues (plant here, pays off in a later chapter), what DOOR
  trusts you with, the lie you believe, notes. **Quest card:** main / side, where, summary, steps (own pins), characters, cutscenes
  (Cutscene or Played), reward, notes.
- **Beat chart:** the table built from the chapters (empty = red), THINGS THE CHART NOTICED (two chapters with no new mechanic, three
  with the same goal, a band going down, clues never paid off, no boss, story steps with no chapter, a chapter with no main quest), the
  mechanics grid (intro / repeat / combined), and the guide's seven "answer these first" questions with answer boxes.
- **Spine:** the six bands (trust, zone, lie, clue about your parents) and every chapter's questions from the guide (answers shared
  with the beat chart's boxes).
- Chapter 1 starts as the game's ORIENTATION quest (data.js STORY_QUESTS: steps, cutscene titles, Kit as reward); nothing else is filled
  for him. Units are roster ids, places map refs ('hq', 'z:<zone>', 'd:<zone>:<district>'). **Export the plan** = JSON; nothing in the game
  reads it yet.
- **Add from a file** (2026-11-24, mondo: "let's go ahead and add these to the story planner"): app.js `storyImport` /
  `storyAddJSON`. A file `{ kind: 'entropy-wars-story-plan-add', chapters, clues }` in the plan's own shape is ADDED to the plan;
  a chapter, quest or clue whose id is already there is skipped (loading twice adds nothing), nothing of his changes. Used to hand
  him drafted chapters when the live plan is behind his password. The 11-24 file (9 chapters, 19 quests, 6 clues from the storylines
  doc https://claude.ai/artifact/94AJKBFP4o9keE9X4Mi9aL) = `/mnt/project-files/story-planner-add/Entropy_Wars_Story_Plan_Add_2026-11-24.json`.
  REVISED DRAFTS (2026-11-24, the synthesis): a file chapter may carry `was` = the exact copy an earlier file added. If his chapter
  still equals it (sanitized), the new version replaces it in place; if he changed anything his chapter stays and only quests it lacks
  are added (`was` may be a list: every earlier copy). The toast says added / updated / kept. Newest file covering both: `Entropy_Wars_Story_Plan_Update_2026-11-24b.json`. The synthesis file = `.../Entropy_Wars_Story_Plan_Synthesis_2026-11-24.json`
  (doc "Story arcs in detail" https://claude.ai/artifact/MGAzmypWQUqxdAPhBq1btX).

## The places as they stand now (2026-11-23)
mondo: "If the game has a place but the board doesnt, that means something is wrong with the board."
- **The Flying Dutchman** is on the Map, at the Beach (her rooms have no world place, so `build.js` zoneOfRoom puts `site_prebuilt_revenge_*`
  in the beach zone). The Game spawns board names her The Flying Dutchman (was "The Revenge", the room id), under The Beach.
- **One name, Bohemian Grove** (mondo's pick on 11-23): the Woods' district G was "The Ritual Ground", the old Grove room was folded
  into it on 11-16. app.js `PLACE_RENAMES` renames a board group made from the map while it still carries the old name.
- **Printed homes**: `build.js` maps each unit's home through data.js `DOOR_TEXT.POINT_OF_ENTRY_NOW` (Mount Shasta -> The Mountains,
  The Lodge / The Strip / Football Stadium / Downtown -> Disaster City's districts). POINT_OF_ENTRY itself is unchanged: its labels are
  the keys `doorSiteCrossings` matches against the old site boards.

## The Character Sheets (2026-11-25)
mondo: "a Character Sheet tool alongside the relationship web and story planner ... a full one that goes more in depth and has more
structured and useful info", then "add a family section ... add the sheets for pretty much every character mentioned in the story ...
ill go back in and give them specific names or delete them if its a group". A fourth tab of the Story planner screen (**Character
sheets**; also the web's toolbar button and **Open the full character sheet** in a unit's side panel). app.js "THE CHARACTER SHEETS".
- **Saved** as doc `story/cast` beside the boards and the plan (server.js `STORY_WEB_PATH`, the same password, the same 10 s pull) and in
  the browser (`S.cast`). One set for every board. Each sheet has its own `t`; `mergeCast` keeps the newer copy of each sheet, so two
  computers editing different sheets both keep their work. `del[id]` = time of a delete (minus = a restore); Delete only hides a sheet,
  its text stays and **Deleted** lists it with **Bring back**. Nothing on a board is deleted from here.
- **The story cast is worked out, not stored** (`storyCastIds`): every story character (DOOR_CAST), every unit a chapter or quest of the
  plan names (enemies, boss, characters), every unit a timeline event names, every unit or character with a note or a story name on a
  board, every unit whose game name appears in the boards' notes, events, tie labels or the plan's text, and every sheet with typing in it.
  11-25: 113 from his board. **All units** lists every roster unit; typing on one makes it part of the story list.
- **Sections:** header (portrait, story name = the board's `nick` on the open board, game name, places and factions from the board,
  status, one-line pitch), Overview, Inside (want, need, fear, flaw, the lie, lines they won't cross), Family (family + created ties from
  the board, and his own rows: relation, a unit picked or a typed name, notes), Secrets (who knows, planted, revealed; the chapter list
  is offered), History (the backstory IS the board node's note on the open board, the same field as the side panel; a unit not on the
  board keeps `back` on the sheet; the timeline events), Arc (Start, a row per chapter they are in from the plan, End: where they stand,
  what changes), Ties (from the board + what they think of you), Voice (way of speaking, catchphrase, sample lines by mood), In the game
  (read-only from EW_DATA: race or cast facts, spells, quotes, finisher, chapters), Questions (what the sheet noticed + his own).
  **+ Add a field** in every section (`extra`), **Hide empty fields**, **Export sheets** (JSON), **Print this sheet**.
- Left list: find, Story | All units | Deleted, A-Z | Least done; the bar = how much of the core is filled (`scDone`).

## The story toolkit (2026-11-25)
mondo: "What other tools or features or ui would be nice to add ... How does a AAA game studio write their stories and keep track of
everything", then, on the plan (https://claude.ai/artifact/VATSqHLywWbGkeYfn4ANhz, file `/mnt/project-files/story-tools-plan/`):
"Yeah yeah do all of that". app.js "THE STORY TOOLKIT". Everything is stored in the plan doc (`story/plan`; `kitSanitize` keeps the
new fields), so it saves and syncs like the chapters.
- **Facts** tab (step A): STORY FACTS, `P.facts`: what can be true in the world (Witcher 3's facts database, articy's global variables).
  A fact is a plain sentence (its id stays hidden; mondo did not pick, the default was plain sentences); kinds yes/no, a number, one of a
  few (`opts`); the start value; a number can be a faction's standing (`fac` = the faction's name). The table shows how many things
  change it and check it (red / amber = loose ends); the side panel lists them and opens the quest.
- **The quest card** (step A): Status (idea / draft / locked / in the game), Given by (+ where they stand), **Opens when** (all of:
  chapter reached, quest finished (with an ending), a fact, party level, has been to a place, is alive / dead / has joined),
  party level at least (`lvl`), **Closes when** (any of), **Endings** (`ends`: name, tone, facts it changes, who dies, who joins,
  places it opens, reward). "+ A new fact…" in any fact pick makes one on the spot. The chapter card has the expected party level
  (`lv`; mondo did not pick, the default: level gates check both the party level and the chapter's level) and a status.
- **Checks** tab (step A): `storyChecks()` reads the plan, the facts, the open board and the sheets: facts nothing changes / nothing
  checks, gates on later chapters or deleted things, places not reached by then, level gates against the chapter's level, side quests
  with no gate, a main quest that does not open on the first path (`simRun`), characters an earlier ending kills, chapters with no zone
  or quests elsewhere, timeline events with no chapter (the event panel has **Happens in the story at**, `ev.ch`) or out of order,
  and the beat chart's own notices. The tab shows the number of problems.
- Ties carry `from` / `until` (chapter ids) and events `ch`: kept by `sanitizeBoard`.
- **Mysteries** tab (step B): THE MYSTERY LEDGER. Every plan clue is a secret: its row runs across the chapters; plant = the first
  hint, pay = the reveal, `steps` = the ladder between (seen without knowing / hint / suspected / revealed, each in a chapter, a quest,
  how), `truth` (the whole answer, for him), `kind` (a real secret or a red herring), `about` (characters), `knows` (who knows it from
  which chapter; the view picker shows one character's knowledge), `words` (tell-tale words: the checks warn when a chapter says them
  before the first hint), `fact` (a fact that becomes true at the reveal). Click a square to add a step there. The bottom rows count
  open mysteries and reveals per chapter. A character sheet's secret can be tracked here (`Track it here`: a clue with `from` = the
  sheet; the sheet row keeps `k` and shows a "ledger" link). The checks add: reveals with no hint before them, 3+ reveals in one
  chapter, hinted secrets never revealed, tell-tale words said early, sheet secrets not in the ledger.
- **Ties over time** (step B): a tie's panel has **In the story** from Ch N / ends in Ch N (`from`, `until`); the web's toolbar
  **Story at** select draws only the ties that stand at that chapter (`S.ui.storyAt`, app.js `tieOn`).
- **World** tab (step C): THE WORLD BY CHAPTER. Places mode = every place a quest happens (by zone) x the chapters, the quests in
  each square (side quests pink dashed), ░ = a zone no chapter has opened yet, and a line of the zones no chapter uses. Characters
  mode = everyone in a quest's cast or giving one x the chapters, where they are; ✝ once an earlier ending kills them (✝? = only some
  endings do), red when a dead character still turns up. Click a quest to open it.
- **Flow** tab (step C): THE FLOW CHART. The whole story: chapters as columns, an arrow from a quest to every quest whose gate it
  feeds (its ending, or a fact one of its endings changes; red dashed = it closes it), and how many different runs the endings make.
  Pick a quest (or click one): what opens it, its steps, its endings (coloured by tone, what each changes, who dies or joins) and the
  quests each ending opens or closes. app.js `feeds()`, `flowQuest`, `flowAll`.
- **Play it** tab (step D): PLAY IT THROUGH. One path through the story: every quest that opens takes the ending picked for it
  (the first by default, or Skip it); a locked quest says why (the gates that fail at that moment). The side panel is the world after
  the chosen chapter: who joined, who died, the FACTION STANDING table (every number fact with a faction, `fac`, chapter by chapter),
  every fact's value, what the player knows (revealed / hinted secrets), the places reached. **Try every path** plays 400 random
  paths: quests no path opens, main quests some paths lock (dead ends), how many different ends. The checks run 120 such paths
  (cached on `P.t`). The picks are not saved. app.js `simRun`, `renderPlay`, `randomPaths`.
- **Lore** tab (step D): THE LORE GLOSSARY, `P.lore`: name, kind (object / idea / group / event / word), other names, canon, still
  open, the secret it belongs to; "Mentioned in" is found by the names in the chapters, quests, secrets and the board's timeline.
  Checks: mentioned but no canon, open questions.
- **Pitches** tab (step D): SIDE QUEST PITCHES, `P.pitches`: the idea, where, faction, level, mood. "Make it a quest in…" adds a side
  quest (status Idea, the idea as its summary) to that chapter and the pitch keeps the link (`q`).
- **The cutscene links** (2026-11-25; mondo asked where the cutscene editor fits: it stays its own tool, linked by scene). build.js
  exports every game cutscene with its spoken lines (`SD.cuts`, from data.js STORY_CUTSCENES). A quest's scene row picks the game
  scene it is (`id`; a scene named like a game scene links by itself), **Plays when** (conditions) and **Changes a fact**; "Read its
  lines" shows the words, with mondo's cutscene-editor edits (localStorage `ew_scene_editor_v1`, same site) on top in teal. The
  checks read the lines: a character an earlier ending kills who still speaks, a secret's tell-tale word said before its first hint,
  a game cutscene in no quest, a link to a scene that is gone; the lore search reads them too. Dialogue with choices, later, is a
  choice inside the cutscene editor, not here.
