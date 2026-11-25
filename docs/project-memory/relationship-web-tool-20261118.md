---
name: relationship-web-tool-20261118
description: The Relationship Web story-planning tool: where it lives, owner-account live link, features, and the 11-18 board-loss lesson (never republish blind)
metadata:
  type: project
  modified: 2026-11-18T11:32:17.253Z
---
The Relationship Web (story planning, not in the game) was built by the associate account (PR #2124) and extended for mondo in PR #2127/#2129/#2130 ((thread in the owner project)).

- Source: `docs/plans/story-web/` (README has the rules); code = `build/app.js` + `build/template.html`, `node build/build.js` writes `relationship-web.html` (pull `build/roster.json` back out of the built page's `const EW_DATA` line).
- Live link on the OWNER account: https://claude.ai/artifact/GWefCFyrBLAPfanNL5TUYv (republish the same file path). The associate's first copy (8fUwyEP4Vqkj8UZdZaihvq) can't be edited from this account.
- Features: lasso, Alt-drag tied group, + Group pills (Place or Faction, 12 colours), toolbar Places|Factions with a layout per kind (`B.org`, `B.lay`), Arrange > Sort into groups, home group = first joined, group-to-group ties. No hint text in panels.

**IN THE GAME (PR #2131, 11-18):** mondo works on 2 computers (different Claude accounts), so the web lives in the game: Settings > Developer > Relationship Web opens https://entropywars-prototype.onrender.com/dev/relationship-web; boards save on the game server (`/api/story-web`, D1 `story_web_docs`), no account, 10 s pull. THAT is his board now; read it with `curl .../api/story-web`. Race/cast nodes take a story Name (`nick`; export `names`). Later same day: secret group memberships (PR #2138), unit copies in every non-home place + places inside places (`parent`) + Map button with the game's zones/districts/plots (PR #2141). Boards > Board: in the game now (PR #2144, build/spawns.js reads data.js). Another thread added a web PASSWORD (x-web-key; SET by mondo by 15:25 UTC 11-18): I can't read/write the live boards without it, never pick it for him. He edits the live board actively (249 nodes 11-18): test on a COPY of `/api/story-web`, never write to it.

**BOARD LOSS 11-18 (his anger):** his Main board lived only in the page's browser storage (the page's online store, ArtifactData collection `boards`, stayed EMPTY: a page opened top-level gets `use('db') = null`). My republish (v3) dropped it. I rebuilt it from his chat paste into `boards/main` (ArtifactData set) + `/mnt/project-files/relationship-web/main_board_recovered_backup.json`; his paste was cut by the chat size limit (~50 KB), not the copy button.

**How to apply:** BEFORE any republish, `ArtifactData list boards` on the live link: if his boards are not there, do not publish until he has saved a backup file (Export > Save a backup > Save file, works outside the viewer since PR #2130) or confirms. Never ask him to paste board JSON into chat; ask for the file as an attachment or read `boards` directly. Related [[associate-review-20261116]].

**Story threads read (11-18, (thread in the owner project)):** the live board is password-locked; I used the 11:40 backup (151 nodes) and asked him for an Export file. Never go around the password via D1.

11-19 PR #2145: districts nested in zone parts (Heaven/Hell/Vatican, Moon/Mars/Saturn/Singularity; one-time board fix `pfix`), non-district rooms as places (Volcano Island etc.), world map behind Places sort (`B.mapK`), type-to-pick "Add to a place" / "Add a unit". Answered: web is planning only; in game a zone walk-in table rolls across the whole zone room(s), hand-placed NPCs stand exactly, city residents have a home district.
11-19 PR #2160: build/fresh.js + server route add new AVAILABLE_RACES units automatically (portrait/sprite head from CDN).
11-22 PR #2450: world map behind Places board drew 93 px (renderMapBg scale was a boolean); now B.mapK, toggle shows/switches to Places/sorts, Map dialog 651 px. Proof /mnt/project-files/relationship-web-map/.
