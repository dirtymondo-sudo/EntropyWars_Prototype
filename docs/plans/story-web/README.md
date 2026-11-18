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
- No hint text in the panels (mondo hates helper text); the button title says it.

## Rebuilding after the roster changes

Scripts in `build/` read the repo's `data.js` / `sprites.js`. Portraits are fetched read-only from the R2 bucket
(`fetch.sh`, `dl.py`, `dl2.py`; Cloudflare auth comes from the environment, never from a file), face-cropped
(`faces.py`, `faces2.py`) and, for 3D-only cast, rendered from their GLBs (`render.js` + `render.html`, headless Chromium).

Order: `node extract.js`, `node urls.js`, `python3 dl.py`, `python3 faces.py`, `node roster.js`, then the second pass
(`extract2.js`, `urls2.js`, `dl2.py`, `render.js`, `faces2.py`, `roster2.js`), then `node build.js` writes the page.
Downloaded art and intermediate JSON are not committed. To change only the code (`app.js` / `template.html`)
without the art, pull `build/roster.json` back out of the built page (the `const EW_DATA = …;` line) and run `node build.js`.
