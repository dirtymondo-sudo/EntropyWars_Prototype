# THE ZONE THREAD BRIEF — put a zone on plots, redesigned, then pilot one district (mondo 2026-11-16)

For the eight zones that were still old handmade rooms on 11-16: Heaven + Hell + Vatican, The D.U.M.B., The Cavern,
Leylines, The Deep, The Astral Realm, Outer Space, Antarctica. One thread a zone. A zone thread's own prompt names its
zone and what is special about it. Read docs/plans/DISTRICT_THREAD_BRIEF.md too: everything in it about judging your own
work, the lists, the limits and working beside other threads holds here as well.

## His words (2026-11-16)

"let's go ahead and start threads for those zones, but most of them I want completely redesigned/reimagined with plots
and districts etc. like we did for disaster city or Camelot. Amend the plan however needs based off the changes we have
made so far. white rooms can go the DUMB. Then move the exits, it's not that big of a deal. Then we will make new models.
yes underwater room, No deep to Area 51. just add some sort of door from th looking garden to the astral sea of
possibility. I don't know where the ship should leave from or how the player access it yet, but let's just get the world
built, we can figure that part out later. I don't know if I want Antarctica to be the late game reveal, I am still
writing the story, that is just a possibility"

And his standing order from earlier the same day: "don't have to ask me for permission or get my okay, im going to
always have some revisions for you anyway ... be its own judge like I am ... at least 75% of the detail disasterr city
has ... don't let any thread do more than 5 individual passes, after that it stops until I have seen it" and "they need
to look at the model list and prop list and asset list ... all of it to see what would fit".

## What a zone thread does, in order

1. **Learn the place.** The zone's old rooms in data.js (through load-data.js: every sub-area name, landmark, prop,
   door and link; `DOOR_TEXT.POINT_OF_ENTRY` and the AREA UNITS tables for who lives there), its first plot plan
   (`docs/plans/world-zones/<zone>-layout.json` + `<zone>_plot_plan.png`, drawn BEFORE most of today's world existed),
   `docs/plans/world-areas/world-areas-proposal.md` (the world vision: each area is the ULTIMATE form of its idea, a
   parody of the real world), `docs/notes/world-layout.md` + `docs/plans/world-zones/world_state_map.png` (what is built
   and how the zones join now), and how the newest zones were made: areas-complexes.md "THE SEWERS ON PLOTS",
   "CAMELOT KINGDOM, PLAN 3", "CAMELOT CASTLE, REDESIGN 2", "DISASTER CITY, THE 144 PLOTS" + the real-cities sections.
2. **Redesign it, do not port it.** The old rooms are the source of names, landmarks and who lives there, not of the
   layout. Reimagine the zone the way Disaster City and Camelot were: districts with one clear idea each, a landmark
   you can see from its paths, real walk-in buildings, streets / paths / lanes whole squares wide, heights, natural
   edges, room to fight on any plot. Every landmark and named place the old rooms had must still exist somewhere in the
   new zone (never delete content he didn't name). Use only names the game already has; a plot with no name gets a
   plain label marked "(label mine)". No invented characters, rules or puzzles.
3. **Draw the new plot plan** (a PNG drawn by a script kept beside it in `docs/plans/world-zones/`, plus the layout
   json), LOOK at it yourself, fix it, and send it to mondo in the chat with five lines on what you changed and why.
   **Then keep going: do not wait for his answer.** If he answers, his word wins and you rework.
4. **Build the zone on plots**: `docs/areas/<zone>/layout.json`, ONE FILE PER DISTRICT in `docs/areas/<zone>/districts/`,
   a `bake-<zone>.js` that reads them (copy the newest tool's shape, bake-sewers.js / bake-estate.js: hooks per district
   file, airZones, the checks), one board row for the tool + shared pieces and one per district. Add the tool's line to
   CLAUDE.md's TOOLING list and a section to areas-complexes.md.
5. **Move the exits** ("it's not that big of a deal"): every door and link of the old rooms lands on a matching spot in
   the new zone; the far ends in other zones are re-pointed too. A far end in a second-side zone: take that zone's tool
   row for the one change, note it on the board, free it. A far end in an OWNER-side room (Disaster City's own districts
   and tool, Camelot's Castle K, DOOR HQ): do not edit it; `DOOR_HQ.retired` already sends the walker to your new room,
   so leave a dated note for that holder at the bottom of claims.md naming the door and where it should land.
6. **Retire the old rooms** in the same PR as the first build (`DOOR_HQ.retired`, hubs, siteRooms, map, saves). A room
   a PvP board is cut from stays in the data, as the others did.
7. **Pilot one district** to the bar (the passes of the district brief: exteriors, interiors, dressing, atmosphere,
   polish; at most five, each seen on screen), writing "THE <ZONE>, THE ZONE KIT" in areas-complexes.md for the district
   threads that follow. The first build of the whole zone is not one of the five.
8. **Stop.** Set the tool row and the pilot's row to STOPPED, leave the other districts' rows `free` with one line on
   what each holds and lacks, update docs/notes/world-layout.md (the zone's rows in A1 + A3, the door check, and redraw
   `world_state_map.png` with `draw-world-state.js`), and write the final reply: pictures first, then what was built,
   the FPS, the DECISIONS MADE FOR MONDO list, the NEEDS A MODEL list ("then we will make new models": he will have
   them made from your list, so make it exact: what, where it goes, how big), and what you would do next.

## The size rule
No single room bigger than Disaster City (144 plots); most zones are 30 to 64. A zone may be several rooms (Heaven +
Hell + Vatican is three stacked). Measure the frame rate of the first build before the pilot starts.

## Limits that stay
No new game mechanics (list the idea). No Meshy, no downloads, no generated art: reuse R2, list what is missing, never
a placeholder box. Never touch owner-side rows. CLAUDE.md in full (RULE #1 delivery + upload + token bump, no tests, no
new game .js files, `node --check`, RULE #1d fresh main, every probe through probe-fast.js). Twenty other threads edit
claims.md, data.js and index.html: merge main before every commit and every merge; on a data.js conflict take main's
copy and rerun your bake.
