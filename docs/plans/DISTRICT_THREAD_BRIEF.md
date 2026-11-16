# THE DISTRICT THREAD BRIEF — one thread, one district, five passes, no questions (mondo 2026-11-16)

Every district thread on the second side reads this first. Its own prompt names the zone, the district, the file and
what is known to be thin. Where this file and a newer word from mondo disagree, his newer word wins.

## His order (2026-11-16, before a nap), word for word

"I just want all of the districts at least prototyped when I wake up, don't have to ask me for permission or get my
okay, im going to always have some revisions for you anyway, so just do each district with all of the interior exterior
polish passes etc and screenshot and be its own judge like I am and keep going until it has a respectable district, like
at least 75% of the detail disasterr city has, and then I will wake up and come back and we will edit from there. ...
but don't let any thread do more than 5 individual passes, after that it stops until I have seen it."

What that means for you:
- **Do not ask, do not wait.** Where you would ask him, decide the way his rules (docs/notes/owner-rules.md) and the
  zone's pilot district point, build it, and write the decision on a DECISIONS MADE FOR MONDO list (in your district's
  section of areas-complexes.md and in your final reply) so he can overrule it in one line. Plans that say "waits
  mondo's OK" for something inside your district are released by this order.
- **Be your own judge.** Every pass: build, run a probe, LOOK at the pictures (Read tool), list what is wrong, fix it,
  look again. The bar: at least 75 % of the detail of a finished Disaster City district (compare with a city district's
  file and pictures: docs/disaster-city/districts/, docs/plans/disaster-city/). Empty plots, bare walls, unlit insides,
  floating or clipping props, untextured shapes and placeholder boxes all fail the bar.
- **At most FIVE passes, then stop.** A pass = one merged PR of district work. The order: 1 exteriors, 2 interiors,
  3 dressing, 4 atmosphere (light, air, particles, night), 5 polish. A district that has no insides spends that pass on
  more exterior + landmark work. Passes a thread made BEFORE this order count toward its five. After the fifth, or
  earlier once the bar is met, stop: set your board row to "N passes live, STOPPED, waits mondo's look" and write the
  final reply. Do not start a sixth for any reason.
- **The final reply** (he reads it when he wakes): pictures first (SendUserFile, the best 3 to 6 views, with the
  `[EW BUILD]` HEAD line), then one line per pass, the FPS before and after, the DECISIONS MADE FOR MONDO list, the
  NEEDS A MODEL list, and what you would do next. Short, plain words.

## Go through ALL the lists before you place anything (mondo 11-16)

His words: "they need to look at the model list and prop list and asset list or whatever. all of it to see what would
fit". Before pass 1, and again before the dressing pass, read these END TO END (they are long: read them in parts, do
not grep three words and stop) and write a FITS THIS DISTRICT shortlist into your district's notes section: every model,
prop, animal, foliage piece, texture and decal that suits the place, with its catalogue key.
- `MODEL_LIST.md`, the whole file: §6 every room / editor prop (data.js `DOOR_HQ.catalogue`, about 1,800 rows), §7 spell
  props, sky models, animals, foliage, §8 the code-built stand-ins (avoid these), §10 decor still missing, §12b the Pizza
  Doggy PSX mega pack, §13 every model file on R2 that is NOT wired yet (over 3,000: a file here can be given a catalogue
  row and used; say which you wired).
- The live catalogue through load-data.js (`DOOR_HQ.catalogue`, `DOOR_HQ.textures`, `DOOR_HQ.decals`): the keys you can
  place today, with their sizes (`docs/disaster-city/prop-sizes.json`, `measure-props.js`).
- `node list-models.js --r2` and `ASSET_MANIFEST.json`: what is in the bucket right now.
- `docs/disaster-city/pack-claims.md` (which pack pieces the city's districts already use, so zones do not all wear the
  same props) and your zone's kit section in areas-complexes.md.
A model nobody has placed yet is worth more than one every district already has. Wiring an R2 file that has no
catalogue row is allowed and wanted (add its row, rerun `node list-models.js`, commit MODEL_LIST.md in the same PR).

## Limits this order does NOT lift
- No new game rules or mechanics, no invented names, characters or puzzles; list the idea instead of building it.
- No new art: reuse what is on R2 (MODEL_LIST.md, `node list-models.js --r2`, packs first, the zone kit). No Meshy, no
  downloads, no generated logos or SFX. What is missing goes on the NEEDS A MODEL list, never in as a placeholder.
- Never delete content he did not name. Never touch a row the OWNER side holds (Disaster City's own districts and
  tool, Camelot's Castle K + the palace room, DOOR HQ) or another thread's district file.
- CLAUDE.md in full: RULE #1 (PR, merge, `node sync-zip.js --upload`, the token bump with every R2 file), no tests,
  no new game .js files, `node --check` every JS file you edit, RULE #1d (fetch + merge main first and before every
  probe), every probe through probe-fast.js (PLAYTEST_NOTES.md "THE FAST PROBE"), one probe at a time, several views a run.

## Working beside twenty other threads
- **Only your district file.** The zone's tool + shared pieces (bake tool, layout.json, heights, ways out, sky) are
  their own board row. If your district cannot reach the bar without a tool change, take that row in the same PR, make
  the smallest change, leave a dated note at the bottom of docs/notes/claims.md saying exactly what changed, and free
  the row again. Ways out and link ends never move.
- **claims.md, data.js and index.html change under you every few minutes.** Before every commit and again before every
  merge: `git fetch origin main && git merge origin/main`. On a conflict keep BOTH sides; for data.js, take main's
  copy and RERUN your zone's bake tool (never hand-merge baked rows); for the `?v=` token, re-bump after the merge. If a
  merge is refused because main moved, merge main again and retry. After the merge, upload; if another thread's files
  also differ, the upload carries them: that is expected.
- First PR: set your district's board row to side second, "held by the <district> thread, branch <name>, pass 0 of 5".
  Update the pass count in every pass's PR.
- Each pass's PR also adds to your district's section in docs/notes/areas-complexes.md and to the zone kit section
  (what the next thread can reuse).
- Frame rate: a friend plays on a weak Chrome PC. Measure your proof view before your first pass and after each pass;
  if a pass costs more than about 3 FPS, win it back (fewer lights, instanced props, LOD) before the next.

## Rules of the look (from owner-rules.md; read the file, these are the ones that bite)
One tile per 3.5 m square; barriers and blockers centred on whole squares, walkways whole cells wide, decor off centre.
Buildings unique, recognisable, walk-in with working swinging doors, real geometry, varied materials; big windows,
dark glass. Generated shapes always textured; no placeholder geometry, no procedural stairs, no grass blades. Trees
only on grass, dirt, sand or in planters. Cliffs `rocks_5`; lawns `grass_2`; forest floor `grass_dark_fantasy` /
`dirt_2`. Bloom and fog OFF by default; real lights. Never the old flat gold. Fewer people, none blocking a path.
