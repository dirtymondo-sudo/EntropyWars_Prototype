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
