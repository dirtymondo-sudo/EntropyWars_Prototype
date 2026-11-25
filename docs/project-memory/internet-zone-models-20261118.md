---
name: internet-zone-models-20261118
description: Internet zone real models SHIPPED PR #2067 (11-18): 15 Meshy props + 9 extruded icons replace box props; prop y>=1 is ABSOLUTE height
metadata:
  type: project
---
Thread (owner-project id). PR #2067 merged, token 20261118-netmodels-01-cors, data.js + manifest uploaded.
R2 Assets/world/props/meshy/internet/ (vr_headset, dialup_modem, wifi_router, cpu_fan, ram_stick, capacitor, coin_battery, toggle_switch, cyber_dish, ring_light, gaming_chair, stream_mic, holo_projector, shopping_cart, magnifier) + Assets/world/props/internet_icons/icon_* (envelope, speech_bubble, folder, heart, like, pointer, document, picture, bell). xmas_cookie_round = Christmas pack cookie.
mondo rules: desktop icons = flat icons extruded (SunGraphica pack + Phosphor MIT), not Meshy. Cart + magnifier reusable in Disaster City.
Gotchas: room prop `y` >= 1 is an ABSOLUTE height (max with ground), so floating props use base + lift. Untextured GLB baseColorFactor goes grey in game: give icons a tiny colour texture. `npm i --no-save X` prunes other no-save deps (reinstall together).
Folder /mnt/project-files/internet-models/ (concepts, models, icons_glb/extrude.py, proof/). Units (vtuber, egirl+streamer, virus) = separate thread.
