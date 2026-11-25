---
name: alien-ships-meshy-20261120
description: 11-20 one Meshy spaceship per alien race: 11 models SHIPPED PR #2313 as catalogue rows ship_<race> (R2 Assets/world/props/meshy/ships/); not UFO forms or placed yet
metadata:
  type: project
  modified: 2026-11-20T12:26:23.887Z
---
Thread (owner-project id) (mondo 11-20 12:21Z): own ship for annunaki, mantid, cosmic wraith, grey, nordic, reptilian, martian, astronaut (shuttle), bligblog, barbarella; old saucer + triangle "could look better".
Folder /mnt/project-files/alien-ships/: ships.json (prompts, keys ship_<race>), gen.py (`python3 <abs>/gen.py <keys|all> _suffix`), models.py (uses _2 concept if present), sheet.py (`best`), sheet_concepts.jpg. Redos _2: mantid (v1 was a bug + loose head), cosmic wraith (v1 loose shards), bligblog (v1 had a pilot).
Lore used: annunaki = inverted ziggurat (Pyramid Scheme finisher); grey = Roswell saucer (replaces saucer); reptilian = black triangle (replaces triangle; martian had it); martian = War of the Worlds manta + cobra heat ray (Tripod Sweep/Heat Ray); nordic = Pleiadian bell scout ship; barbarella = 60s pop-art + mirror ball (Space Disco).
Hook in game: sprites.js UFO_CRAFT_BY_RACE (alien UFO form; unlisted races use UFO_FORM_3D triangle).
Meshy balance 447 -> 330 after concepts -> 189 after 7 models.
12:30Z he OK'd all but asked 2nd options Nordic + Martian (_2, prompt2 in ships.json) and Barbarella ball separate (ship_barbarella_2 with socket + ship_barbarella_ball). sheet_concepts_2.jpg posted, waits picks. 7 models done (annunaki mantid wraith grey reptilian astronaut bligblog) models/*.glb, models_sheet.jpg (render: /tmp r.js copy of render_current). Annunaki lost some gold detail; bligblog dome opaque (make glass in code). Next: his picks -> models (~15 each) -> renders -> his OK -> R2 + catalogue + MODEL_LIST PR.

12:35Z picks: Nordic B (_2), Martian A (_1, ships.json concept field), Barbarella _2 + ball. All 11 models done (models/*.glb; reptilian = 3rd try from concept _2, v1/v2 kept as _v1/_v2). models_sheet_2.jpg. Balance 90. Next: his OK -> R2 + catalogue + MODEL_LIST PR (+ UFO_CRAFT_BY_RACE?).
SHIPPED 11-20 PR #2313 + R2 upload (token 20261120-alienships-01-cors): data.js ship_* rows, MODEL_LIST, notes models-assets.md "THE ALIEN SHIPS", prompts docs/plans/alien-ships/ships.json. He'll have a chat on another PC use them. Not wired as UFO forms.
