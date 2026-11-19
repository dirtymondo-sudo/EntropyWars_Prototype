# THE WORLD AUDIT, the numbers (2026-11-19)

Written by `node docs/plans/world-polish/audit.js`; do not edit by hand. What each column means is in that file's header; what to do about it is in `PLAN.md`. Every plot: `plots.csv`. The picture: `need-map.svg`.

**Scores:** 0 good to 3 bad. S = space (does an 8 x 8 board fit), V = height (is there any), A = dressing (does anything stand there). NEED = S + V + A, 0 to 9.

## 1. Every place

| Place | Zone | Plots | Size (m) | Walkable | Path width (squares) | Board fits (of 64) | Plots no board | Relief a plot (m) | Whole span (m) | Dead-flat plots | Pieces a plot | Bare plots | Free plots beside it | NEED |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| THE LONG TUNNEL `hollow_earth_ow_long` | cavern | 10 | 42 x 420 | 29 % | 3.1 | 30 | 10 | 0 | 0 | 10 | 2 | 10 | 20 | **9** |
| THE TUNNEL-WAY TUNNEL `hollow_earth_ow_tunnelway` | cavern | 34 | 420 x 588 | 30 % | 3.1 | 33 | 34 | 0 | 0 | 34 | 3 | 34 | 57 | **8.8** |
| THE WEST TUNNEL `hollow_earth_ow_west` | cavern | 18 | 294 x 462 | 30 % | 3.1 | 33 | 18 | 0 | 0 | 18 | 2 | 18 | 31 | **8.8** |
| THE SNOWY PINES `camelot_ow_pines` | camelot | 8 | 84 x 294 | 31 % | 2.8 | 32 | 7 | 0 | 0 | 8 | 23 | 0 | 14 | **6.9** |
| THE FOREST `camelot_ow_forest` | camelot | 9 | 168 x 210 | 31 % | 2.7 | 35 | 8 | 0 | 1 | 9 | 37 | 1 | 15 | **5.6** |
| DISASTER CITY · THE SEWERS `downtown_underworld` | sewers | 65 | 714 x 672 | 37 % | 3.4 | 38 | 31 | 0 | 23 | 41 | 26 | 38 | 72 (+7 sea) | **5.4** |
| HEAVEN `heaven_plots` | heaven | 26 | 294 x 336 | 51 % | 4.9 | 44 | 10 | 0 | 25 | 15 | 3 | 20 | off the map | **5.4** |
| THE FROZEN SEA `bermuda_ow_frozen` | beach | 3 | 168 x 84 | 49 % | 4.4 | 53 | 1 | 0.6 | 1 | 1 | 5 | 2 | 6 (+4 sea) | **5.3** |
| THE D.U.M.B. `dumb_base` | dumb | 49 | 294 x 294 | 50 % | 4.5 | 48 | 18 | 0 | 19 | 41 | 11 | 25 | 21 | **5.2** |
| THE CATACOMBS `vatican_under` | catacombs | 6 | 126 x 84 | 48 % | 3 | 53 | 1 | 0.9 | 4 | 3 | 6 | 4 | off the map | **5.2** |
| AGARTHA `hollow_earth_ow_agartha` | cavern | 15 | 210 x 168 | 70 % | 7.5 | 53 | 4 | 0 | 7 | 13 | 8 | 4 | 15 | **5.1** |
| THE NORTH POLE `northpole_plots` | mountains | 16 | 168 x 168 | 47 % | 3.1 | 49 | 8 | 0.5 | 3 | 9 | 29 | 1 | off the map | **4.9** |
| THE INTERNET `internet_web` | internet | 71 | 378 x 378 | 64 % | 5.2 | 59 | 11 | 0 | 23 | 56 | 8 | 35 | off the map | **4.6** |
| THE ASTRAL REALM `lookingglass_realm` | astral | 45 | 420 x 546 | 44 % | 3.4 | 49 | 11 | 0.2 | 36 | 24 | 10 | 11 | off the map | **4.6** |
| PIRATES' COVE `bermuda_ow_cove` | beach | 5 | 126 x 126 | 37 % | 4.8 | 36 | 2 | 0.8 | 3 | 1 | 7 | 2 | 4 (+4 sea) | **4.4** |
| THE LOOKING-GLASS GARDEN `camelot_ow_garden` | camelot | 6 | 168 x 126 | 48 % | 2.9 | 45 | 2 | 0 | 0 | 6 | 59 | 0 | 9 | **4.3** |
| THE DESERT HIGHWAY `site_ow_dh3` | routes | 18 | 294 x 168 | 89 % | 11.5 | 63 | 0 | 0.4 | 1 | 16 | 17 | 0 | 16 | **4** |
| THE BERMUDA TRIANGLE `bermuda_ow_triangle` | beach | 10 | 378 x 294 | 33 % | 4.9 | 26 | 8 | 0.8 | 5 | 5 | 22 | 1 | 0 (+24 sea) | **4** |
| CAME A LOT KINGDOM `camelot_kingdom` | camelot | 36 | 252 x 252 | 70 % | 4.7 | 49 | 12 | 0 | 7 | 22 | 23 | 3 | 16 | **4** |
| THE DESERT HIGHWAY `site_ow_dh2` | routes | 14 | 168 x 210 | 89 % | 11.8 | 63 | 0 | 0.4 | 1 | 13 | 19 | 4 | 13 | **3.9** |
| THE RITUAL GROUND `fairy_forest_ow_ritual` | woods | 18 | 252 x 378 | 48 % | 3.8 | 53 | 0 | 0.9 | 10 | 4 | 28 | 9 | 23 | **3.8** |
| LEYLINES · THE LINE `gobekli_ow_line` | leylines | 18 | 504 x 126 | 100 % | 14.6 | 64 | 0 | 0.9 | 7 | 9 | 9 | 6 | 23 | **3.8** |
| OUTER SPACE `moon_plots` | space | 95 | 1932 x 798 | 100 % | 88.8 | 64 | 0 | 2.2 | 29 | 9 | 3 | 83 | off the map | **3.6** |
| THE OLD ROAD `site_ow_r4` | routes | 26 | 462 x 210 | 87 % | 9.9 | 62 | 0 | 0.4 | 1 | 25 | 32 | 4 | 14 | **3.5** |
| THE BEACH `bermuda_beach` | beach | 20 | 336 x 420 | 54 % | 6.2 | 44 | 6 | 0.6 | 4 | 8 | 26 | 2 | 11 (+12 sea) | **3.5** |
| AREA 51 `area51_desert` | desert | 16 | 168 x 168 | 94 % | 9.2 | 61 | 0 | 0.1 | 11 | 13 | 24 | 0 | 12 | **3.4** |
| GIZA `area51_ow_giza` | desert | 16 | 168 x 168 | 100 % | 24.2 | 64 | 0 | 0.1 | 12 | 10 | 19 | 5 | 8 | **3.4** |
| THE DESERT HIGHWAY `site_ow_dh1` | routes | 20 | 336 x 168 | 90 % | 15.8 | 64 | 0 | 0.5 | 1 | 16 | 23 | 0 | 15 | **3.3** |
| THE DEEP · THE SEA FLOOR `atlantis_ow_floor` | deep | 9 | 126 x 126 | 100 % | 18.5 | 64 | 0 | 3.7 | 17 | 2 | 7 | 4 | 0 (+11 sea) | **3.3** |
| HELL `hell_plots` | hell | 16 | 168 x 168 | 83 % | 9.4 | 58 | 4 | 12.4 | 25 | 0 | 4 | 11 | off the map | **3.3** |
| THE CAVERN `hollow_earth_cavern` | cavern | 24 | 252 x 252 | 67 % | 6 | 59 | 2 | 0.9 | 22 | 12 | 17 | 2 | 18 | **3.3** |
| MOUNT OLYMPUS `shasta_ow_olympus` | olympus | 19 | 420 x 252 | 53 % | 3.5 | 52 | 5 | 2.4 | 28 | 0 | 14 | 9 | 26 | **3.3** |
| ANTARCTICA `antarctica_plots` | antarctica | 36 | 252 x 252 | 72 % | 6.8 | 55 | 1 | 2.6 | 21 | 0 | 11 | 16 | off the map | **3.2** |
| THE FAIRY FOREST `camelot_ow_fairy` | camelot | 6 | 168 x 126 | 40 % | 3.1 | 42 | 2 | 1.3 | 4 | 3 | 54 | 0 | 4 | **3.2** |
| THE CLEARING `fairy_forest_ow_clearing` | woods | 19 | 504 x 210 | 48 % | 3.9 | 50 | 6 | 0.9 | 19 | 3 | 30 | 1 | 24 | **3.2** |
| LEYLINES · BABEL + TECHNOTICLAN `gobekli_ow_babel` | leylines | 29 | 294 x 336 | 100 % | 22 | 64 | 0 | 4.9 | 30 | 5 | 7 | 17 | 22 (+5 sea) | **3.2** |
| THE DESERT HIGHWAY `site_ow_dh4` | routes | 22 | 252 x 294 | 89 % | 12.6 | 63 | 0 | 0.4 | 1 | 18 | 25 | 0 | 14 | **3.1** |
| THE STONE PATH `site_ow_r12` | routes | 8 | 126 x 126 | 88 % | 15 | 64 | 0 | 0.5 | 1 | 8 | 33 | 0 | 7 | **3.1** |
| THE POLAR TRAIL `site_ow_r5` | routes | 36 | 546 x 294 | 91 % | 20 | 64 | 0 | 0.7 | 1 | 12 | 21 | 0 | 36 | **3.1** |
| THE BADLANDS HIGHWAY `site_ow_r9` | routes | 18 | 84 x 378 | 88 % | 9.8 | 63 | 0 | 0.5 | 2 | 10 | 24 | 2 | 18 | **3.1** |
| THE SKI LODGE · THE SNOWY PASS `shasta_ow_lodge` | mountains | 29 | 420 x 378 | 68 % | 5 | 55 | 7 | 1.7 | 20 | 3 | 24 | 6 | 39 | **3** |
| THE VALLEY ROAD `site_ow_r6` | routes | 26 | 504 x 126 | 90 % | 17.2 | 64 | 0 | 0.5 | 2 | 20 | 30 | 1 | 25 | **2.9** |
| THE CIRCUS `area51_ow_circus` | desert | 9 | 126 x 126 | 92 % | 6 | 61 | 0 | 0.1 | 1 | 8 | 46 | 0 | 6 | **2.9** |
| THE RIVER ROAD `site_ow_r1` | routes | 38 | 336 x 504 | 89 % | 14.2 | 63 | 0 | 0.5 | 2 | 23 | 32 | 2 | 36 | **2.8** |
| THE PILGRIM WAY `site_ow_r3` | routes | 10 | 126 x 168 | 89 % | 16 | 64 | 0 | 0.5 | 1 | 8 | 40 | 0 | 9 | **2.8** |
| MOUNT SHASTA `shasta_ow_shasta` | mountains | 20 | 294 x 294 | 43 % | 2.8 | 45 | 11 | 2.4 | 25 | 2 | 38 | 0 | 20 | **2.8** |
| THE TRAIL · WEST TO CAME A LOT `site_ow_l4` | routes | 3 | 126 x 42 | 80 % | 7.8 | 64 | 0 | 0.5 | 1 | 2 | 38 | 0 | 2 | **2.7** |
| BUG COLONY `gobekli_ow_bugs` | leylines | 15 | 294 x 210 | 93 % | 13.7 | 64 | 0 | 0.5 | 49 | 8 | 28 | 0 | 17 | **2.7** |
| THE TRAIL · THE SNOWLINE TO THE TREE LINE `site_ow_l3` | routes | 5 | 42 x 210 | 81 % | 8.6 | 64 | 0 | 0.4 | 1 | 3 | 39 | 0 | 10 | **2.6** |
| THE VOLCANO ISLAND `bermuda_ow_volcano` | beach | 10 | 252 x 252 | 57 % | 11.5 | 50 | 2 | 1.9 | 16 | 3 | 26 | 1 | 14 (+5 sea) | **2.6** |
| THE ESTATE `skinwalker_ow_lake` | estate | 47 | 210 x 756 | 89 % | 10.7 | 62 | 0 | 0.5 | 5 | 24 | 49 | 0 | 37 | **2.6** |
| THE COAST ROAD `site_ow_r10` | routes | 38 | 126 x 714 | 91 % | 20.1 | 64 | 0 | 0.6 | 2 | 18 | 28 | 0 | 19 (+11 sea) | **2.5** |
| THE DEEP · ATLANTIS + THE TRENCH `atlantis_deep` | deep | 31 | 336 x 672 | 99 % | 31.5 | 64 | 0 | 5.6 | 27 | 1 | 7 | 17 | 0 (+30 sea) | **2.5** |
| THE TRAIL · THE PINES TO THE SKI LODGE `site_ow_l6` | routes | 8 | 126 x 252 | 82 % | 9.1 | 64 | 0 | 0.8 | 2 | 2 | 32 | 0 | 15 | **2.4** |
| WESTERN TOWN `area51_ow_town` | desert | 16 | 168 x 168 | 96 % | 10.5 | 63 | 0 | 0.1 | 11 | 11 | 37 | 0 | 10 | **2.4** |
| THE REDWOOD TRAIL `fairy_forest_ow_redwood` | woods | 9 | 84 x 336 | 56 % | 3.9 | 52 | 2 | 2.1 | 23 | 0 | 27 | 0 | 11 | **2.3** |
| THE VATICAN `vatican_plots` | vatican | 33 | 252 x 294 | 90 % | 9.3 | 61 | 2 | 2.6 | 15 | 4 | 13 | 9 | 18 | **2.3** |
| THE DELTA CAUSEWAY `site_ow_r11` | routes | 8 | 168 x 126 | 87 % | 12.5 | 64 | 0 | 0.9 | 2 | 1 | 34 | 0 | 6 | **1.9** |
| THE RANCH ROAD `site_ow_r8` | routes | 23 | 336 x 252 | 90 % | 17.4 | 64 | 0 | 0.9 | 2 | 1 | 32 | 0 | 18 | **1.9** |
| STONEHENGE `gobekli_ow_henge` | leylines | 9 | 126 x 126 | 100 % | 18.5 | 64 | 0 | 1.8 | 4 | 1 | 29 | 0 | 10 | **1.8** |
| DISASTER CITY `downtown_streets` | city | 183 | 728 x 756 | 94 % | 12.4 | 62 | 0 | 1.8 | 54 | 63 | 41 | 7 | 42 | **1.5** |
| THE HAUNTED HOUSE `skinwalker_ow_house` | estate | 9 | 126 x 252 | 100 % | 27.2 | 64 | 0 | 3.2 | 5 | 0 | 49 | 0 | 13 | **0.8** |

## 2. Every district

| Place | District | Plots | Walkable | Path width | Board fits | No board | Relief a plot | Span | Dead flat | Ledges a plot | Slopes a plot | Ramps + stairs | Bridges | Falls | Water rows | Mounds | Rails | Hard ground | Pieces a plot | Bare | S | V | A | NEED |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ANTARCTICA | The Crevasse | 6 | 71 % | 5.8 | 48 | 1 | 4.7 | 5 | 0 | 12 | 58 | 0 | 0 | 0 | 0 | 0 | 0 | 1 % | 5 | 4 | 0.8 | 0 | 2.7 | **3.5** |
| ANTARCTICA | The Hull in the Ice | 6 | 69 % | 4.9 | 57 | 0 | 1.1 | 4 | 0 | 0 | 37 | 0 | 0 | 0 | 0 | 0 | 0 | 11 % | 5 | 2 | 0.2 | 1.7 | 2.3 | **4.2** |
| ANTARCTICA | The Ice Wall | 6 | 46 % | 6.2 | 48 | 0 | 0.8 | 1 | 0 | 0 | 35 | 0 | 0 | 0 | 0 | 0 | 1 | 0 % | 4 | 5 | 0.8 | 2 | 2.8 | **5.7** |
| ANTARCTICA | The Polar Openings | 4 | 77 % | 5 | 58 | 0 | 4.6 | 9 | 0 | 0 | 84 | 0 | 0 | 0 | 0 | 0 | 1 | 0 % | 10 | 2 | 0 | 0 | 2.3 | **2.3** |
| ANTARCTICA | The Shelf Ice | 6 | 66 % | 4.9 | 56 | 0 | 2.4 | 4 | 0 | 1 | 43 | 0 | 0 | 0 | 0 | 0 | 0 | 0 % | 6 | 3 | 0.2 | 1 | 2.5 | **3.7** |
| ANTARCTICA | The Station | 8 | 98 % | 20.1 | 64 | 0 | 3.8 | 9 | 0 | 0 | 95 | 0 | 0 | 0 | 0 | 0 | 1 | 28 % | 29 | 0 | 0 | 0 | 0.5 | **0.5** |
| THE ASTRAL REALM | The Library of Unthought Things | 10 | 54 % | 3.8 | 58 | 0 | 0.7 | 11 | 5 | 1 | 6 | 11 | 0 | 0 | 0 | 73 | 0 | 100 % | 12 | 0 | 0.2 | 1.9 | 1.7 | **3.8** |
| THE ASTRAL REALM | The Nightmare | 13 | 44 % | 3.4 | 48 | 3 | 0.2 | 11 | 8 | 0 | 5 | 12 | 0 | 0 | 2 | 83 | 0 | 15 % | 5 | 7 | 0.8 | 2 | 2.5 | **5.3** |
| THE ASTRAL REALM | The Sea of Possibility | 22 | 39 % | 3.1 | 44 | 8 | 0.7 | 28 | 11 | 0 | 5 | 24 | 0 | 0 | 2 | 156 | 62 | 44 % | 12 | 4 | 1.1 | 1.7 | 1.7 | **4.6** |
| THE BEACH | The Harbour | 8 | 35 % | 3.9 | 32 | 5 | 2.8 | 4 | 4 | 1 | 3 | 6 | 2 | 0 | 0 | 1 | 19 | 87 % | 25 | 2 | 2 | 0.8 | 1.6 | **4.4** |
| THE BEACH | The Ocean | 2 | 27 % | 4.4 | 27 | 1 | 0.6 | 1 | 1 | 0 | 18 | 0 | 0 | 0 | 0 | 0 | 0 | 0 % | 12 | 0 | 1.5 | 1 | 1.5 | **4** |
| THE BEACH | The Shore | 10 | 75 % | 8.3 | 57 | 0 | 0.8 | 4 | 3 | 3 | 33 | 0 | 0 | 0 | 0 | 5 | 4 | 3 % | 29 | 0 | 0.2 | 1.6 | 0.9 | **2.7** |
| PIRATES' COVE | The Ocean | 5 | 37 % | 4.8 | 36 | 2 | 0.8 | 3 | 1 | 1 | 34 | 0 | 0 | 0 | 0 | 0 | 0 | 0 % | 7 | 2 | 1.2 | 1 | 2.2 | **4.4** |
| THE FROZEN SEA | The Ocean | 3 | 49 % | 4.4 | 53 | 1 | 0.6 | 1 | 1 | 0 | 24 | 0 | 0 | 0 | 0 | 0 | 0 | 0 % | 5 | 2 | 0.7 | 2 | 2.7 | **5.3** |
| THE BERMUDA TRIANGLE | The Bermuda Triangle | 10 | 33 % | 4.9 | 26 | 8 | 0.8 | 5 | 5 | 1 | 28 | 2 | 0 | 0 | 0 | 2 | 6 | 3 % | 22 | 1 | 2.2 | 0.8 | 1 | **4** |
| THE VOLCANO ISLAND | The Ocean | 10 | 57 % | 11.5 | 50 | 2 | 1.9 | 16 | 3 | 18 | 27 | 0 | 0 | 18 | 0 | 0 | 2 | 0 % | 26 | 1 | 0.7 | 0.9 | 1 | **2.6** |
| CAME A LOT KINGDOM | The Castle | 8 | 96 % | 11.8 | 64 | 0 | 7 | 7 | 2 | 18 | 5 | 2 | 0 | 0 | 0 | 2 | 8 | 75 % | 22 | 1 | 0 | 0.6 | 1 | **1.6** |
| CAME A LOT KINGDOM | The Village | 28 | 63 % | 3.7 | 45 | 12 | 0 | 7 | 20 | 3 | 2 | 5 | 16 | 0 | 2 | 1 | 24 | 25 % | 23 | 2 | 1.6 | 2 | 1.1 | **4.6** |
| THE FAIRY FOREST | The Fairy Forest | 6 | 40 % | 3.1 | 42 | 2 | 1.3 | 4 | 3 | 1 | 8 | 0 | 1 | 0 | 2 | 2 | 0 | 0 % | 54 | 0 | 1.3 | 1.8 | 0 | **3.2** |
| THE FOREST | The Forest | 9 | 31 % | 2.7 | 35 | 8 | 0 | 1 | 9 | 0 | 1 | 0 | 0 | 0 | 0 | 2 | 1 | 6 % | 37 | 1 | 2.2 | 2.8 | 0.6 | **5.6** |
| THE LOOKING-GLASS GARDEN | The Looking-Glass Garden | 6 | 48 % | 2.9 | 45 | 2 | 0 | 0 | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 79 % | 59 | 0 | 1.2 | 3 | 0.2 | **4.3** |
| THE SNOWY PINES | The Snowy Pines | 8 | 31 % | 2.8 | 32 | 7 | 0 | 0 | 8 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0 % | 23 | 0 | 2.6 | 3 | 1.3 | **6.9** |
| THE CATACOMBS | The Catacombs | 6 | 48 % | 3 | 53 | 1 | 0.9 | 4 | 3 | 0 | 9 | 3 | 0 | 0 | 2 | 4 | 0 | 100 % | 6 | 4 | 0.5 | 2 | 2.7 | **5.2** |
| THE CAVERN | Hollow Earth | 11 | 82 % | 10.3 | 62 | 0 | 0 | 7 | 7 | 5 | 13 | 7 | 1 | 1 | 19 | 5 | 0 | 0 % | 11 | 2 | 0.1 | 2.1 | 1.7 | **3.9** |
| THE CAVERN | The Cavern | 13 | 54 % | 3.9 | 56 | 2 | 0.9 | 16 | 5 | 2 | 13 | 6 | 2 | 1 | 27 | 17 | 7 | 77 % | 22 | 0 | 0.5 | 1.5 | 0.8 | **2.7** |
| AGARTHA | Agartha | 12 | 81 % | 8.6 | 59 | 1 | 0 | 7 | 10 | 5 | 4 | 6 | 1 | 1 | 14 | 7 | 0 | 75 % | 9 | 1 | 0.3 | 2.1 | 2.1 | **4.5** |
| AGARTHA | the tunnel | 3 | 28 % | 3 | 31 | 3 | 0 | 0 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 0 | 100 % | 2 | 3 | 2.7 | 2 | 3 | **7.7** |
| THE LONG TUNNEL | the tunnel | 10 | 29 % | 3.1 | 30 | 10 | 0 | 0 | 10 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 100 % | 2 | 10 | 3 | 3 | 3 | **9** |
| THE TUNNEL-WAY TUNNEL | the tunnel | 34 | 30 % | 3.1 | 33 | 34 | 0 | 0 | 34 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 100 % | 3 | 34 | 2.8 | 3 | 3 | **8.8** |
| THE WEST TUNNEL | the tunnel | 18 | 30 % | 3.1 | 33 | 18 | 0 | 0 | 18 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 100 % | 2 | 18 | 2.8 | 3 | 3 | **8.8** |
| DISASTER CITY | Bayside | 16 | 94 % | 14.5 | 63 | 0 | 2.3 | 11 | 5 | 15 | 23 | 15 | 8 | 0 | 0 | 7 | 26 | 99 % | 39 | 0 | 0 | 1.1 | 0 | **1.1** |
| DISASTER CITY | Civic Center | 16 | 93 % | 9.3 | 62 | 0 | 0.8 | 11 | 8 | 17 | 14 | 19 | 4 | 0 | 0 | 5 | 34 | 97 % | 39 | 0 | 0 | 1.8 | 0.4 | **2.1** |
| DISASTER CITY | Entertainment | 16 | 90 % | 7 | 61 | 0 | 0.9 | 16 | 4 | 15 | 29 | 25 | 4 | 0 | 0 | 3 | 26 | 98 % | 51 | 0 | 0.1 | 1.3 | 0 | **1.4** |
| DISASTER CITY | Financial | 16 | 96 % | 12 | 62 | 0 | 0 | 15 | 9 | 17 | 13 | 22 | 4 | 0 | 0 | 4 | 43 | 99 % | 40 | 0 | 0 | 1.7 | 0.3 | **1.9** |
| DISASTER CITY | Hero Plaza | 16 | 96 % | 13.2 | 63 | 0 | 0.9 | 21 | 6 | 18 | 16 | 25 | 2 | 0 | 0 | 4 | 32 | 99 % | 48 | 0 | 0 | 1.5 | 0.2 | **1.7** |
| DISASTER CITY | Industrial | 16 | 92 % | 7.9 | 62 | 0 | 0 | 9 | 10 | 9 | 7 | 16 | 4 | 0 | 0 | 3 | 51 | 100 % | 59 | 0 | 0 | 1.9 | 0 | **1.9** |
| DISASTER CITY | Southside | 16 | 94 % | 10.3 | 63 | 0 | 1.5 | 15 | 7 | 18 | 24 | 24 | 4 | 0 | 1 | 5 | 19 | 63 % | 50 | 0 | 0 | 1.3 | 0.2 | **1.4** |
| DISASTER CITY | Sports + Culture | 16 | 93 % | 25.7 | 61 | 0 | 1.5 | 18 | 8 | 20 | 13 | 23 | 4 | 0 | 0 | 7 | 27 | 61 % | 29 | 4 | 0 | 1.3 | 0.8 | **2.1** |
| DISASTER CITY | The Hollywood Hills | 39 | 96 % | 30.5 | 63 | 0 | 9.7 | 54 | 0 | 42 | 103 | 0 | 0 | 0 | 3 | 0 | 27 | 57 % | 28 | 3 | 0 | 0 | 0.7 | **0.7** |
| DISASTER CITY | University | 16 | 88 % | 9.2 | 61 | 0 | 0.9 | 21 | 6 | 19 | 26 | 23 | 5 | 0 | 0 | 10 | 25 | 67 % | 46 | 0 | 0.1 | 1.3 | 0.3 | **1.8** |
| THE DEEP · ATLANTIS + THE TRENCH | Atlantis, the Citadel | 9 | 97 % | 19.9 | 63 | 0 | 7.2 | 10 | 1 | 40 | 9 | 0 | 0 | 0 | 0 | 0 | 0 | 71 % | 14 | 1 | 0 | 0.3 | 1.8 | **2.1** |
| THE DEEP · ATLANTIS + THE TRENCH | Atlantis, the Rings | 12 | 100 % | 48 | 64 | 0 | 3.6 | 4 | 0 | 28 | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 61 % | 5 | 8 | 0 | 0 | 2.7 | **2.7** |
| THE DEEP · ATLANTIS + THE TRENCH | The Trench | 10 | 100 % | 34.7 | 64 | 0 | 26.6 | 27 | 0 | 45 | 42 | 0 | 0 | 0 | 0 | 0 | 0 | 0 % | 4 | 8 | 0 | 0 | 2.8 | **2.8** |
| THE DEEP · THE SEA FLOOR | The Sea Floor | 9 | 100 % | 18.5 | 64 | 0 | 3.7 | 17 | 2 | 16 | 55 | 0 | 0 | 0 | 0 | 0 | 2 | 3 % | 7 | 4 | 0 | 0.9 | 2.4 | **3.3** |
| AREA 51 | Area 51 | 16 | 94 % | 9.2 | 61 | 0 | 0.1 | 11 | 13 | 4 | 4 | 1 | 0 | 0 | 0 | 18 | 8 | 27 % | 24 | 0 | 0 | 2.3 | 1.1 | **3.4** |
| THE CIRCUS | The Circus | 9 | 92 % | 6 | 61 | 0 | 0.1 | 1 | 8 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 33 | 4 % | 46 | 0 | 0.1 | 2.8 | 0 | **2.9** |
| GIZA | Giza | 16 | 100 % | 24.2 | 64 | 0 | 0.1 | 12 | 10 | 15 | 19 | 5 | 0 | 0 | 1 | 30 | 3 | 37 % | 19 | 5 | 0 | 1.9 | 1.5 | **3.4** |
| WESTERN TOWN | Western Town | 16 | 96 % | 10.5 | 63 | 0 | 0.1 | 11 | 11 | 10 | 6 | 3 | 1 | 0 | 1 | 22 | 29 | 3 % | 37 | 0 | 0 | 2 | 0.4 | **2.4** |
| THE D.U.M.B. | CERN, The Ring | 22 | 33 % | 3.8 | 33 | 18 | 0 | 4 | 21 | 1 | 0 | 1 | 1 | 0 | 0 | 23 | 0 | 100 % | 3 | 19 | 2.5 | 1.9 | 2.8 | **7.2** |
| THE D.U.M.B. | Command | 7 | 65 % | 5 | 63 | 0 | 0 | 1 | 6 | 0 | 5 | 0 | 0 | 0 | 1 | 7 | 0 | 100 % | 11 | 1 | 0 | 1.9 | 1.9 | **3.7** |
| THE D.U.M.B. | Level P3 | 7 | 59 % | 4.6 | 58 | 0 | 0 | 0 | 7 | 0 | 0 | 0 | 0 | 0 | 0 | 7 | 1 | 100 % | 4 | 5 | 0.3 | 2 | 2.7 | **5** |
| THE D.U.M.B. | Research | 7 | 64 % | 5.4 | 59 | 0 | 0 | 3 | 5 | 2 | 2 | 2 | 3 | 0 | 0 | 7 | 1 | 100 % | 31 | 0 | 0.3 | 2 | 1.3 | **3.6** |
| THE D.U.M.B. | Sub-Level 7 | 6 | 67 % | 4.6 | 60 | 0 | 5.3 | 14 | 2 | 13 | 7 | 13 | 4 | 0 | 0 | 5 | 0 | 100 % | 28 | 0 | 0 | 0.8 | 0.5 | **1.3** |
| THE HAUNTED HOUSE | The Haunted House + Graveyard | 9 | 100 % | 27.2 | 64 | 0 | 3.2 | 5 | 0 | 35 | 45 | 1 | 0 | 0 | 0 | 1 | 0 | 6 % | 49 | 0 | 0 | 0.1 | 0.7 | **0.8** |
| THE ESTATE | The Corn Fields | 12 | 70 % | 4.8 | 58 | 0 | 0.1 | 0 | 12 | 0 | 1 | 0 | 0 | 0 | 0 | 2 | 25 | 0 % | 86 | 0 | 0 | 2.8 | 0 | **2.8** |
| THE ESTATE | The Lake | 9 | 100 % | 20.2 | 64 | 0 | 1.6 | 2 | 0 | 5 | 32 | 0 | 5 | 0 | 3 | 0 | 2 | 5 % | 33 | 0 | 0 | 1 | 0.4 | **1.4** |
| THE ESTATE | The Ranch | 26 | 95 % | 14.4 | 64 | 0 | 0.6 | 4 | 12 | 0 | 11 | 0 | 0 | 0 | 0 | 0 | 35 | 1 % | 37 | 0 | 0 | 2.3 | 0.5 | **2.8** |
| HEAVEN | The City | 4 | 88 % | 9.2 | 64 | 0 | 0 | 0 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 % | 7 | 0 | 0 | 2.8 | 2 | **4.8** |
| HEAVEN | The Cloud Fields | 4 | 84 % | 6.3 | 60 | 0 | 0 | 4 | 3 | 11 | 4 | 3 | 0 | 0 | 0 | 24 | 0 | 0 % | 4 | 4 | 0.3 | 1.5 | 3 | **4.8** |
| HEAVEN | The Gate | 4 | 61 % | 5.2 | 57 | 0 | 8.8 | 12 | 1 | 0 | 3 | 1 | 0 | 0 | 0 | 8 | 0 | 0 % | 4 | 3 | 0 | 0.8 | 2.8 | **3.5** |
| HEAVEN | The Rim | 6 | 15 % | 2.2 | 16 | 6 | 0 | 9 | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 5 | 0 | 0 % | 0 | 6 | 3 | 2.3 | 3 | **8.3** |
| HEAVEN | The Stairway | 8 | 37 % | 3.3 | 41 | 4 | 3.5 | 16 | 1 | 0 | 8 | 4 | 0 | 0 | 1 | 34 | 0 | 0 % | 2 | 7 | 1.5 | 0.5 | 2.9 | **4.9** |
| HELL | The Bowl | 4 | 81 % | 9.5 | 57 | 1 | 5.4 | 23 | 0 | 24 | 3 | 2 | 1 | 0 | 1 | 20 | 0 | 0 % | 5 | 2 | 0.8 | 0 | 2.5 | **3.3** |
| HELL | The Descent | 3 | 100 % | 24 | 64 | 0 | 12.4 | 23 | 0 | 30 | 3 | 1 | 0 | 0 | 0 | 0 | 0 | 0 % | 5 | 2 | 0 | 0 | 2.7 | **2.7** |
| HELL | The Rim | 5 | 100 % | 17.6 | 64 | 0 | 17.6 | 22 | 0 | 38 | 5 | 4 | 0 | 0 | 0 | 1 | 0 | 0 % | 4 | 4 | 0 | 0 | 2.8 | **2.8** |
| HELL | The Walkways | 4 | 51 % | 3.1 | 46 | 3 | 12.3 | 25 | 0 | 7 | 0 | 1 | 5 | 0 | 1 | 11 | 0 | 0 % | 4 | 3 | 1.5 | 0 | 2.8 | **4.3** |
| THE INTERNET | Live | 6 | 67 % | 4.6 | 64 | 0 | 0.2 | 7 | 4 | 0 | 6 | 7 | 0 | 0 | 0 | 28 | 0 | 100 % | 7 | 2 | 0 | 2 | 2.3 | **4.3** |
| THE INTERNET | The Dark Web | 9 | 52 % | 3.7 | 58 | 1 | 0.2 | 13 | 5 | 1 | 6 | 12 | 0 | 0 | 0 | 63 | 0 | 100 % | 6 | 3 | 0.2 | 1.9 | 2.3 | **4.4** |
| THE INTERNET | The Feed | 9 | 71 % | 5 | 64 | 0 | 0 | 6 | 7 | 1 | 6 | 8 | 0 | 0 | 0 | 22 | 0 | 100 % | 6 | 5 | 0 | 2 | 2.6 | **4.6** |
| THE INTERNET | The Forums | 7 | 64 % | 4.7 | 60 | 1 | 0 | 5 | 6 | 0 | 4 | 6 | 0 | 0 | 0 | 27 | 0 | 100 % | 9 | 2 | 0.3 | 2 | 2.1 | **4.4** |
| THE INTERNET | The Inbox | 5 | 58 % | 4.3 | 63 | 0 | 0 | 5 | 5 | 0 | 4 | 4 | 3 | 0 | 0 | 19 | 0 | 100 % | 4 | 4 | 0 | 2 | 2.8 | **4.8** |
| THE INTERNET | The Information Highway | 12 | 44 % | 3.9 | 42 | 9 | 0 | 2 | 8 | 0 | 2 | 3 | 0 | 0 | 0 | 31 | 0 | 100 % | 3 | 11 | 1.8 | 1.9 | 2.9 | **6.7** |
| THE INTERNET | The Motherboard | 6 | 79 % | 6.8 | 64 | 0 | 0 | 7 | 6 | 1 | 3 | 4 | 1 | 0 | 0 | 8 | 0 | 100 % | 8 | 3 | 0 | 2 | 2.3 | **4.3** |
| THE INTERNET | The Pop-ups | 8 | 63 % | 4.3 | 64 | 0 | 0.2 | 7 | 6 | 1 | 7 | 11 | 0 | 0 | 0 | 28 | 0 | 100 % | 6 | 4 | 0 | 1.9 | 2.5 | **4.4** |
| THE INTERNET | The Server Farm | 9 | 90 % | 16.8 | 64 | 0 | 0 | 1 | 9 | 0 | 1 | 0 | 0 | 0 | 0 | 9 | 0 | 100 % | 24 | 1 | 0 | 2 | 0.6 | **2.6** |
| LEYLINES · BABEL + TECHNOTICLAN | Babel | 12 | 100 % | 22.4 | 64 | 0 | 14 | 30 | 3 | 26 | 6 | 5 | 0 | 0 | 0 | 17 | 0 | 22 % | 6 | 6 | 0 | 1 | 2.5 | **3.5** |
| LEYLINES · BABEL + TECHNOTICLAN | Technoticlan | 15 | 100 % | 24.3 | 64 | 0 | 4.9 | 23 | 0 | 18 | 48 | 7 | 5 | 0 | 20 | 8 | 0 | 55 % | 6 | 11 | 0 | 0.3 | 2.5 | **2.8** |
| LEYLINES · BABEL + TECHNOTICLAN | the road | 2 | 100 % | 12 | 64 | 0 | 0.1 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0 % | 12 | 0 | 0 | 3 | 1.5 | **4.5** |
| BUG COLONY | Bug Colony | 9 | 100 % | 19.6 | 64 | 0 | 0.7 | 48 | 4 | 23 | 20 | 4 | 0 | 0 | 0 | 33 | 0 | 7 % | 23 | 0 | 0 | 1.7 | 1.1 | **2.8** |
| BUG COLONY | the road | 6 | 82 % | 8.8 | 64 | 0 | 0.5 | 1 | 4 | 0 | 3 | 0 | 0 | 0 | 0 | 0 | 2 | 0 % | 37 | 0 | 0 | 2.5 | 0 | **2.5** |
| STONEHENGE | Stonehenge | 9 | 100 % | 18.5 | 64 | 0 | 1.8 | 4 | 1 | 0 | 98 | 0 | 0 | 0 | 0 | 9 | 2 | 13 % | 29 | 0 | 0 | 0.9 | 0.9 | **1.8** |
| LEYLINES · THE LINE | Göbekli Tepe | 9 | 100 % | 19.9 | 64 | 0 | 5.4 | 7 | 0 | 1 | 97 | 2 | 0 | 0 | 0 | 6 | 0 | 2 % | 10 | 3 | 0 | 0.2 | 2 | **2.2** |
| LEYLINES · THE LINE | The Ley Line | 9 | 100 % | 11.5 | 64 | 0 | 0.1 | 0 | 9 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 38 % | 8 | 3 | 0 | 3 | 2.3 | **5.3** |
| THE NORTH POLE | The North Pole village | 16 | 47 % | 3.1 | 49 | 8 | 0.5 | 3 | 9 | 0 | 6 | 0 | 0 | 0 | 0 | 0 | 4 | 0 % | 29 | 1 | 1.2 | 2.4 | 1.4 | **4.9** |
| THE SKI LODGE · THE SNOWY PASS | The Ski Lodge + slopes | 12 | 98 % | 8 | 64 | 0 | 3.8 | 20 | 1 | 5 | 102 | 9 | 0 | 0 | 0 | 0 | 9 | 0 % | 31 | 1 | 0 | 0.4 | 1 | **1.4** |
| THE SKI LODGE · THE SNOWY PASS | The Snowy Pass | 12 | 37 % | 2.6 | 42 | 7 | 1.5 | 16 | 1 | 0 | 14 | 0 | 0 | 0 | 0 | 0 | 13 | 0 % | 26 | 0 | 1.7 | 1.4 | 0.8 | **3.9** |
| THE SKI LODGE · THE SNOWY PASS | Wild link L9 | 5 | 68 % | 4.9 | 64 | 0 | 0.6 | 3 | 1 | 0 | 20 | 0 | 0 | 0 | 0 | 0 | 0 | 0 % | 4 | 5 | 0 | 1.8 | 3 | **4.8** |
| MOUNT SHASTA | Mount Shasta | 20 | 43 % | 2.8 | 45 | 11 | 2.4 | 25 | 2 | 1 | 25 | 0 | 1 | 0 | 3 | 0 | 9 | 0 % | 38 | 0 | 1.4 | 1 | 0.4 | **2.8** |
| MOUNT OLYMPUS | Mount Olympus | 12 | 44 % | 2.8 | 45 | 5 | 3.8 | 26 | 0 | 0 | 29 | 0 | 0 | 0 | 0 | 0 | 0 | 66 % | 21 | 2 | 1.2 | 0.3 | 1.2 | **2.7** |
| MOUNT OLYMPUS | Wild link L10 | 2 | 67 % | 4.8 | 64 | 0 | 0.8 | 2 | 0 | 0 | 19 | 0 | 0 | 0 | 0 | 0 | 0 | 0 % | 3 | 2 | 0 | 2 | 3 | **5** |
| MOUNT OLYMPUS | Wild link L11 | 5 | 68 % | 4.9 | 64 | 0 | 1.7 | 12 | 0 | 0 | 37 | 0 | 0 | 0 | 0 | 0 | 0 | 0 % | 4 | 5 | 0 | 1.2 | 3 | **4.2** |
| THE DESERT HIGHWAY | the road | 20 | 90 % | 15.8 | 64 | 0 | 0.5 | 1 | 16 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 12 | 27 % | 23 | 0 | 0 | 2.8 | 0.5 | **3.3** |
| THE DESERT HIGHWAY | the road | 14 | 89 % | 11.8 | 63 | 0 | 0.4 | 1 | 13 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 12 | 28 % | 19 | 4 | 0 | 2.9 | 1 | **3.9** |
| THE DESERT HIGHWAY | the road | 18 | 89 % | 11.5 | 63 | 0 | 0.4 | 1 | 16 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 10 | 27 % | 17 | 0 | 0 | 2.9 | 1.1 | **4** |
| THE DESERT HIGHWAY | the road | 22 | 89 % | 12.6 | 63 | 0 | 0.4 | 1 | 18 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 10 | 26 % | 25 | 0 | 0 | 2.8 | 0.3 | **3.1** |
| THE TRAIL · THE SNOWLINE TO THE TREE LINE | the road | 5 | 81 % | 8.6 | 64 | 0 | 0.4 | 1 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0 % | 39 | 0 | 0 | 2.6 | 0 | **2.6** |
| THE TRAIL · WEST TO CAME A LOT | the road | 3 | 80 % | 7.8 | 64 | 0 | 0.5 | 1 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0 % | 38 | 0 | 0 | 2.7 | 0 | **2.7** |
| THE TRAIL · THE PINES TO THE SKI LODGE | the road | 8 | 82 % | 9.1 | 64 | 0 | 0.8 | 2 | 2 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 0 % | 32 | 0 | 0 | 2.3 | 0.1 | **2.4** |
| THE RIVER ROAD | the road | 38 | 89 % | 14.2 | 63 | 0 | 0.5 | 2 | 23 | 0 | 1 | 0 | 1 | 0 | 1 | 0 | 5 | 9 % | 32 | 2 | 0 | 2.6 | 0.2 | **2.8** |
| THE COAST ROAD | the road | 38 | 91 % | 20.1 | 64 | 0 | 0.6 | 2 | 18 | 0 | 4 | 0 | 0 | 0 | 0 | 0 | 1 | 0 % | 28 | 0 | 0 | 2.4 | 0.1 | **2.5** |
| THE DELTA CAUSEWAY | the road | 8 | 87 % | 12.5 | 64 | 0 | 0.9 | 2 | 1 | 0 | 4 | 0 | 0 | 0 | 0 | 0 | 1 | 0 % | 34 | 0 | 0 | 1.9 | 0 | **1.9** |
| THE STONE PATH | the road | 8 | 88 % | 15 | 64 | 0 | 0.5 | 1 | 8 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0 % | 33 | 0 | 0 | 3 | 0.1 | **3.1** |
| THE PILGRIM WAY | the road | 10 | 89 % | 16 | 64 | 0 | 0.5 | 1 | 8 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0 % | 40 | 0 | 0 | 2.8 | 0 | **2.8** |
| THE OLD ROAD | the road | 26 | 87 % | 9.9 | 62 | 0 | 0.4 | 1 | 25 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 13 | 31 % | 32 | 4 | 0 | 3 | 0.5 | **3.5** |
| THE POLAR TRAIL | the road | 36 | 91 % | 20 | 64 | 0 | 0.7 | 1 | 12 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 2 | 0 % | 21 | 0 | 0 | 2.3 | 0.8 | **3.1** |
| THE VALLEY ROAD | the road | 26 | 90 % | 17.2 | 64 | 0 | 0.5 | 2 | 20 | 0 | 3 | 0 | 1 | 0 | 1 | 0 | 7 | 0 % | 30 | 1 | 0 | 2.7 | 0.3 | **2.9** |
| THE RANCH ROAD | the road | 23 | 90 % | 17.4 | 64 | 0 | 0.9 | 2 | 1 | 0 | 11 | 0 | 0 | 0 | 0 | 1 | 1 | 0 % | 32 | 0 | 0 | 1.8 | 0.1 | **1.9** |
| THE BADLANDS HIGHWAY | the road | 18 | 88 % | 9.8 | 63 | 0 | 0.5 | 2 | 10 | 0 | 6 | 0 | 0 | 0 | 0 | 0 | 9 | 29 % | 24 | 2 | 0 | 2.4 | 0.6 | **3.1** |
| DISASTER CITY · THE SEWERS | The Holding Cells | 2 | 54 % | 3 | 56 | 0 | 3.6 | 5 | 1 | 9 | 2 | 1 | 1 | 0 | 0 | 6 | 2 | 100 % | 120 | 0 | 0 | 1 | 0 | **1** |
| DISASTER CITY · THE SEWERS | The Old Workings | 2 | 55 % | 4.1 | 58 | 0 | 22.6 | 23 | 1 | 10 | 19 | 2 | 0 | 0 | 2 | 6 | 11 | 100 % | 91 | 0 | 0 | 1 | 0 | **1** |
| DISASTER CITY · THE SEWERS | The Radioactive Drain | 2 | 42 % | 2.4 | 35 | 1 | 0 | 7 | 2 | 1 | 0 | 1 | 0 | 1 | 4 | 1 | 0 | 100 % | 68 | 0 | 2 | 2 | 0 | **4** |
| DISASTER CITY · THE SEWERS | The Running Tunnels | 6 | 47 % | 3.8 | 51 | 0 | 0 | 6 | 4 | 1 | 3 | 2 | 0 | 0 | 0 | 1 | 143 | 100 % | 76 | 0 | 0.7 | 2.7 | 0 | **3.3** |
| DISASTER CITY · THE SEWERS | The Sewers | 18 | 41 % | 3.7 | 42 | 5 | 1 | 21 | 3 | 3 | 35 | 4 | 1 | 3 | 83 | 23 | 3 | 100 % | 32 | 3 | 1.1 | 1.3 | 0.5 | **2.9** |
| DISASTER CITY · THE SEWERS | U | 35 | 30 % | 3.2 | 32 | 25 | 0 | 15 | 30 | 1 | 1 | 7 | 0 | 0 | 0 | 15 | 0 | 100 % | 3 | 35 | 2.4 | 2.2 | 3 | **7.5** |
| OUTER SPACE | Cydonia | 12 | 100 % | 44.9 | 64 | 0 | 6.5 | 28 | 0 | 43 | 7 | 1 | 0 | 0 | 0 | 0 | 0 | 0 % | 1 | 12 | 0 | 0.1 | 3 | **3.1** |
| OUTER SPACE | The Accretion Rim | 12 | 100 % | 96 | 64 | 0 | 2.2 | 4 | 2 | 2 | 40 | 0 | 0 | 0 | 0 | 0 | 0 | 0 % | 2 | 11 | 0 | 1.3 | 2.9 | **4.3** |
| OUTER SPACE | The Canyon | 6 | 100 % | 101.2 | 64 | 0 | 5.9 | 12 | 0 | 32 | 19 | 0 | 1 | 0 | 0 | 0 | 0 | 0 % | 2 | 6 | 0 | 0 | 3 | **3** |
| OUTER SPACE | The Crater | 9 | 100 % | 72 | 64 | 0 | 3.7 | 11 | 0 | 10 | 99 | 0 | 0 | 0 | 0 | 0 | 0 | 0 % | 2 | 9 | 0 | 0.2 | 3 | **3.2** |
| OUTER SPACE | The Drop | 4 | 100 % | 1152 | 64 | 0 | 4.3 | 5 | 0 | 0 | 123 | 0 | 0 | 0 | 0 | 0 | 0 | 0 % | 3 | 4 | 0 | 0 | 3 | **3** |
| OUTER SPACE | The Far Side | 4 | 100 % | 16.5 | 64 | 0 | 1.1 | 2 | 2 | 0 | 31 | 0 | 0 | 0 | 0 | 0 | 0 | 0 % | 3 | 3 | 0 | 2 | 2.8 | **4.8** |
| OUTER SPACE | The Hexagon | 24 | 100 % | 6912 | 64 | 0 | 3.5 | 8 | 0 | 11 | 22 | 0 | 0 | 0 | 0 | 0 | 0 | 0 % | 1 | 23 | 0 | 0.6 | 3 | **3.5** |
| OUTER SPACE | The Mare | 8 | 100 % | 32 | 64 | 0 | 0.4 | 3 | 5 | 2 | 18 | 0 | 0 | 0 | 0 | 0 | 0 | 7 % | 13 | 2 | 0 | 2.1 | 2 | **4.1** |
| OUTER SPACE | The Ring Shard | 9 | 100 % | 2592 | 64 | 0 | 2.2 | 10 | 0 | 14 | 17 | 0 | 0 | 0 | 0 | 0 | 0 | 0 % | 1 | 8 | 0 | 0.6 | 2.9 | **3.4** |
| OUTER SPACE | The Rover Bay | 7 | 100 % | 2016 | 64 | 0 | 1.1 | 12 | 0 | 3 | 40 | 0 | 0 | 0 | 0 | 0 | 0 | 5 % | 3 | 5 | 0 | 1.4 | 2.7 | **4.1** |
| THE VATICAN | The Basilica | 6 | 98 % | 24.2 | 64 | 0 | 1.8 | 2 | 0 | 17 | 12 | 1 | 0 | 0 | 0 | 0 | 0 | 100 % | 31 | 0 | 0 | 1 | 0.2 | **1.2** |
| THE VATICAN | The Cloister | 3 | 96 % | 6.8 | 63 | 0 | 8.8 | 13 | 0 | 13 | 7 | 0 | 0 | 0 | 1 | 0 | 0 | 66 % | 7 | 1 | 0 | 0 | 2.3 | **2.3** |
| THE VATICAN | The Colosseum | 9 | 71 % | 6.6 | 57 | 2 | 2.6 | 14 | 2 | 20 | 2 | 5 | 156 | 0 | 0 | 0 | 0 | 78 % | 13 | 0 | 0.6 | 0.4 | 1.6 | **2.6** |
| THE VATICAN | The Gardens | 4 | 100 % | 19.5 | 64 | 0 | 8.8 | 9 | 0 | 51 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 13 % | 13 | 1 | 0 | 0 | 1.5 | **1.5** |
| THE VATICAN | The Palace | 3 | 97 % | 13.1 | 63 | 0 | 8.8 | 11 | 0 | 39 | 19 | 3 | 0 | 0 | 0 | 0 | 10 | 100 % | 15 | 0 | 0 | 0 | 1.3 | **1.3** |
| THE VATICAN | The Square | 8 | 95 % | 6.7 | 62 | 0 | 8.8 | 9 | 2 | 11 | 3 | 0 | 0 | 0 | 2 | 0 | 0 | 100 % | 3 | 7 | 0 | 0.6 | 2.9 | **3.5** |
| THE CLEARING | Dead Man's Cave | 9 | 47 % | 3.8 | 48 | 4 | 1.8 | 10 | 2 | 9 | 10 | 2 | 0 | 0 | 3 | 16 | 5 | 0 % | 25 | 0 | 1.1 | 1.3 | 1 | **3.4** |
| THE CLEARING | L | 1 | 53 % | 4.3 | 64 | 0 | 0.8 | 1 | 0 | 0 | 18 | 0 | 0 | 0 | 0 | 0 | 0 | 0 % | 4 | 1 | 0 | 2 | 3 | **5** |
| THE CLEARING | The Clearing | 9 | 49 % | 4 | 51 | 2 | 0.9 | 16 | 1 | 2 | 12 | 1 | 0 | 0 | 0 | 0 | 10 | 0 % | 38 | 0 | 0.6 | 1.9 | 0.2 | **2.7** |
| THE REDWOOD TRAIL | The Redwood Trail | 9 | 56 % | 3.9 | 52 | 2 | 2.1 | 23 | 0 | 12 | 19 | 0 | 2 | 1 | 12 | 34 | 6 | 0 % | 27 | 0 | 0.8 | 1 | 0.6 | **2.3** |
| THE RITUAL GROUND | L | 9 | 44 % | 3.7 | 52 | 0 | 0.8 | 5 | 3 | 0 | 7 | 0 | 0 | 0 | 0 | 0 | 0 | 0 % | 4 | 9 | 0.8 | 2.3 | 3 | **6.1** |
| THE RITUAL GROUND | The Ritual Ground | 9 | 52 % | 3.8 | 54 | 0 | 1.6 | 8 | 1 | 3 | 21 | 2 | 2 | 0 | 2 | 3 | 7 | 0 % | 51 | 0 | 0.2 | 1.2 | 0 | **1.4** |

## 3. The plots that score worst, place by place (NEED 6 and up; at most 12 a place)

**THE LONG TUNNEL** (10 of 10): P00-06 The Long Tunnel (3/3/3); P00-04 The Long Tunnel (3/3/3); P00-03 The Long Tunnel (3/3/3); P00-00 The Long Tunnel (3/3/3); P00-05 The Long Tunnel (3/3/3); P00-02 The Long Tunnel (3/3/3); P00-09 The Long Tunnel (3/3/3); P00-08 The Long Tunnel (3/3/3); P00-01 The Long Tunnel (3/3/3); P00-07 The Long Tunnel (3/3/3)

**THE TUNNEL-WAY TUNNEL** (34 of 34): P05-11 The Bone Passage (3/3/3); P05-02 The Bone Passage (3/3/3); P05-08 The Bone Passage (3/3/3); P03-00 The Bone Passage (3/3/3); P05-03 The Bone Passage (3/3/3); P05-07 The Bone Passage (3/3/3); P05-10 The Bone Passage (3/3/3); P00-11 The Tunnel-Way Tunnel (3/3/3); P00-09 The Tunnel-Way Tunnel (3/3/3); P01-06 The Tunnel-Way Tunnel (3/3/3); P07-05 The Cells Tunnel (3/3/3); P08-05 The Cells Tunnel (3/3/3); …

**THE WEST TUNNEL** (18 of 18): P04-09 The West Tunnel (3/3/3); P06-09 The West Tunnel (3/3/3); P05-09 The West Tunnel (3/3/3); P00-03 The West Tunnel (3/3/3); P00-00 The West Tunnel (3/3/3); P03-09 The West Tunnel (3/3/3); P00-06 The West Tunnel (3/3/3); P00-05 The West Tunnel (3/3/3); P00-04 The West Tunnel (3/3/3); P00-02 The West Tunnel (3/3/3); P00-10 The West Tunnel (3/3/3); P02-09 The West Tunnel (3/3/3); …

**THE SNOWY PINES** (7 of 8): P00-03 The Snowfield, west (3/3/2); P01-02 The Snowy Pines, east (3/3/2); P01-03 The Snowy Pines, west (3/3/2); P00-05 The Sleigh Road (3/3/1); P01-00 Snowy pines, north-east (3/3/1); P00-04 The Snowfield, east (2/3/2); P01-01 Snowy pines, north-west (3/3/0)

**THE FOREST** (4 of 9): P02-02 The Forest Road, east (3/3/1); P00-01 The Forest Road (3/3/1); P03-03 The Forest Trail, the camp (1/3/3); P00-04 The Dead Tree's Hole (3/3/0)

**DISASTER CITY · THE SEWERS** (36 of 65): P05-07 The Loop Culvert (3/3/3); P06-08 The Loop Culvert (3/3/3); P07-08 The Loop Culvert (3/3/3); P04-09 The Workings Culvert (3/3/3); P03-09 The Workings Culvert (3/3/3); P02-09 The Workings Culvert (3/3/3); P16-04 The Outfall Pipe (3/3/3); P08-12 The Gantry Tunnel (3/3/3); P08-13 The Gantry Tunnel (3/3/3); P08-14 The Gantry Tunnel (3/3/3); P07-15 The Gantry Tunnel (3/3/3); P06-15 The Gantry Tunnel (3/3/3); …

**HEAVEN** (12 of 26): P01-03 The Cloud Path, west (3/3/3); P03-01 The City Path, west (3/3/3); P04-01 The City Path, east (3/2/3); P02-03 The Cloud Path, middle (3/2/3); P00-05 The Cloud Bridge (3/2/3); P03-03 The Cloud Path, east (3/2/3); P03-07 The Fall (3/1/3); P02-07 The Long Way (3/0/3); P03-06 The Fall, north (3/0/3); P02-06 The Long Way, north (3/0/3); P05-02 The Cloud Paths (1/2/3); P01-04 The Gate, west (0/3/3)

**THE FROZEN SEA** (1 of 3): P03-01 The Open Ice (2/2/3)

**THE D.U.M.B.** (21 of 49): P00-00 Service Room 1 (3/2/3); P06-00 Service Room 2 (3/2/3); P00-06 Service Room 3 (3/2/3); P06-06 Service Room 4 (3/2/3); P02-00 The Ring 2 (3/2/3); P04-00 The Ring 3 (3/2/3); P05-00 The Ring 4 (3/2/3); P00-01 The Ring 5 (3/2/3); P06-01 The Ring 6 (3/2/3); P00-02 The Ring 7 (3/2/3); P06-02 The Ring 8 (3/2/3); P00-04 The Ring 9 (3/2/3); …

**THE CATACOMBS** (3 of 6): P01-01 The Descent (2/1/3); P00-00 The Loculi (1/3/2); P02-01 The Warm Wall (0/3/3)

**AGARTHA** (4 of 15): P01-00 The Lake (3/2/3); P04-03 The Lemuria Tunnel (3/2/3); P04-02 The Lemuria Tunnel (3/2/3); P04-01 The Lemuria Tunnel (2/2/3)

**THE NORTH POLE** (8 of 16): P02-02 The Sleigh Road (3/2/2); P03-02 The Sleigh Road, east (3/2/2); P01-03 The Snowline, west (2/3/2); P00-00 The Drift (2/3/2); P03-03 The Snowline, east (2/3/2); P02-03 The Snowline (2/3/2); P01-00 The Pole (2/3/1); P00-01 The Drift, south (2/2/2)

**THE INTERNET** (11 of 71): P04-03 Bandwidth (3/2/3); P02-04 The Slow Lane (3/2/3); P03-04 The Paywall (3/2/3); P02-08 Page Not Found (2/2/3); P06-08 Lurkers' Corner (2/2/3); P04-02 The On-Ramp (2/2/3); P05-04 Fibre (2/2/3); P06-04 Buffering (2/2/3); P07-04 The Speed Test (2/2/3); P08-04 The Last Mile (2/2/3); P04-05 The Backbone (2/2/3)

**THE ASTRAL REALM** (10 of 45): P05-01 The Cloud Bridge, sea end (3/2/3); P03-01 The Cloud Bridge, far over (3/2/3); P02-01 The Cloud Bridge, library end (3/2/3); P01-05 The Way Down, library end (3/2/3); P01-06 The Way Down (3/2/3); P01-07 The Way Down, nightmare end (3/2/3); P09-00 The Carousel (3/2/2); P04-01 The Cloud Bridge (3/0/3); P06-05 The Spire (2/2/2); P01-12 The Blood (1/2/3)

**PIRATES' COVE** (2 of 5): P01-01 The Lagoon (3/0/3); P01-02 The Mouth (3/0/3)

**THE LOOKING-GLASS GARDEN** (2 of 6): P02-00 The Hedges, north (3/3/1); P02-02 The Hedges, south (3/3/0)

**THE BERMUDA TRIANGLE** (3 of 10): P05-03 The Sandbar (3/3/2); P05-02 No Fixed Position (3/0/3); P06-05 The Lagoon (3/1/2)

**CAME A LOT KINGDOM** (12 of 36): P04-05 South Row, east (3/3/2); P02-00 The North Gate (3/3/2); P01-00 North Row, west (3/3/1); P01-05 South Row, west (3/3/1); P03-05 South Row (3/3/1); P03-00 North Row (3/2/2); P04-00 North Row, east (3/2/1); P00-00 The North-West Tower (3/0/3); P05-00 The North-East Tower (3/0/3); P05-02 The East Gate (1/3/2); P00-02 The West Gate (1/3/2); P02-02 The Orchard (0/3/3)

**THE DESERT HIGHWAY** (4 of 14): P02-03 The Desert Highway, Western Town–Area 51, the trailers (0/3/3); P02-04 The Desert Highway, Western Town–Area 51, the trailers, south (0/3/3); P03-03 The Desert Highway, Western Town–Area 51, the trailers, the dish (0/3/3); P03-04 The Desert Highway, Western Town–Area 51, the trailers, the turn-off (0/3/3)

**THE RITUAL GROUND** (8 of 18): P01-07 The trail, the camp (1/3/3); P01-08 The trail, the rest (1/3/3); P05-00 The trail, the rest (1/2/3); P05-01 The trail, the camp (1/2/3); P05-02 The trail, the woodcutter’s stack (1/2/3); P05-03 The trail, the fire watch sign (1/2/3); P04-04 The trail, the camp (1/2/3); P03-04 The trail, the rest (0/3/3)

**LEYLINES · THE LINE** (3 of 18): P06-01 The Great Line (0/3/3); P08-01 The Great Line, east (0/3/3); P09-01 The Forks, east (0/3/3)

**OUTER SPACE** (3 of 95): P39-12 The Bore (0/3/3); P43-13 The Mare, east (0/3/3); P33-17 The Accretion Rim, south-east (0/3/3)

**THE OLD ROAD** (4 of 26): P00-03 Old Road, forest (0/3/3); P06-04 Old Road, forest (0/3/3); P07-04 Old Road, forest (0/3/3); P08-04 Old Road, forest (0/3/3)

**THE BEACH** (3 of 20): P03-03 The Breakwater (3/3/1); P03-06 The Roads (3/0/3); P03-05 The Channel (0/3/3)

**GIZA** (5 of 16): P02-01 Khafre (0/3/3); P02-02 The Great Pyramid, north-west (0/3/3); P03-02 The Great Pyramid, north-east (0/3/3); P02-03 The Great Pyramid, south-west (0/3/3); P03-03 The Great Pyramid, south-east (0/3/3)

**THE DEEP · THE SEA FLOOR** (1 of 9): P00-00 The Kelp Forest (0/3/3)

**THE CAVERN** (1 of 24): P05-04 The Jetty (1/2/3)

**MOUNT OLYMPUS** (2 of 19): P04-00 The Grand Stair (3/1/3); P04-01 The Cloud Line (3/0/3)

**ANTARCTICA** (6 of 36): P00-01 The Ice Wall, far west (1/2/3); P05-01 The Ice Wall, far east (1/2/3); P04-01 The Ice Wall, east (1/2/3); P01-01 The Ice Wall, west (1/2/3); P03-01 The Ice Wall (1/2/3); P00-00 The Drift (1/2/3)

**THE CLEARING** (2 of 19): P11-01 The Storm Drain (3/3/2); P10-02 The Tunnel Way (2/3/1)

**THE SKI LODGE · THE SNOWY PASS** (5 of 29): P09-00 The Ridge, east (3/2/2); P08-04 The Rope Bridge (3/2/2); P07-08 The Tree Line, west (3/3/1); P07-00 The Ridge, west (3/1/2); P06-01 The Traverse, the camp (0/3/3)

**THE RIVER ROAD** (1 of 38): P05-11 River Road, foothills (0/3/3)

**MOUNT SHASTA** (3 of 20): P03-04 The Switchback, upper (3/2/1); P02-05 The Switchback, lower (3/2/1); P00-06 The Upper Shelf (3/3/0)

**THE VOLCANO ISLAND** (2 of 10): P03-01 the waterspout (3/0/3); P05-01 islet (no name) (3/2/1)

**THE REDWOOD TRAIL** (1 of 9): P01-05 The Old Trees, south (3/2/1)

**THE VATICAN** (1 of 33): P04-04 The Square, north-west (0/3/3)

**DISASTER CITY** (2 of 183): P04-10 Practice court (0/3/3); P05-10 Locker rooms (0/3/3)

