# Race letter grades: even ranges vs bell curve (2026-11-08)

**SHIPPED in PR #1064** (token 20261108-grades-01-cors). The shipped cuts use a tie-aware rule (each cut sits where the share of races comes closest to the target), so they differ by a few points from the bell column below: hp 1500/1180/880/678 · mp 225/200/115/90 · atk 160/122/65/23 · int 195/159/60/20 · def 170/130/79/42 · mdef 181/146/68/33 · crt 30/26/19/13 (13/27/53/27/13 races on most stats; CRT 1/56/35/30/12). The per-race table at the bottom shows the SHIPPED letters.

Roster: the 134 playable races (data.js AVAILABLE_RACES), base stats on main after balance pass 5 (PR #1063). Grades read the race's BASE stat (data.js `statGrade` + `STAT_GRADE_BANDS`), so this is the letter a race shows in the party builder, the codex dossier, the battle INFO card, the inspect card / pause sheet and the race editor.

## What the numbers say

Counts are S / A / B / C / F out of 134.

| stat | today's cuts (S A B C) | today | even ranges (min..max in 5) | even | bell cuts | bell (10/20/40/20/10) |
|---|---|---|---|---|---|---|
| HP | 1507 1190 885 593 | 12/25/53/35/9 | 1510 1211 911 612 | 12/20/51/42/9 | 1480 1170 870 678 | 14/29/53/25/13 |
| MP | 220 170 130 95 | 27/32/23/31/21 | 216 172 128 84 | 27/29/26/39/13 | 225 200 110 90 | 15/28/59/19/13 |
| ATK | 161 120 80 39 | 12/31/40/29/22 | 184 138 92 46 | 4/21/50/35/24 | 159 122 65 23 | 14/27/53/27/13 |
| M.ATK | 161 120 80 39 | 37/18/27/27/25 | 174 130 87 43 | 32/19/25/29/29 | 194 158 60 20 | 14/28/52/27/13 |
| DEF | 163 124 86 47 | 18/28/42/29/17 | 160 123 85 48 | 20/27/43/26/18 | 169 130 79 42 | 14/27/53/27/13 |
| M.DEF | 163 124 86 47 | 26/27/29/31/21 | 162 124 86 48 | 26/27/29/30/22 | 180 144 68 33 | 14/27/53/27/13 |
| CRT % | 24 20 16 12 | 67/21/20/19/7 | 26 22 18 14 | 57/21/19/20/17 | 27 26 19 15 | 1/56/35/21/21 |
| SPD | 163 126 88 49 | 15/39/39/32/9 | (keep: letter = move tiles) | | | |
| VISION | 6 5 4 3 | 6/9/20/49/50 | (keep: letter = tiles seen) | | | |

1. **Today's bands already are even ranges.** The 10-06 cuts sit within a few points of "roster min to max in five equal steps" for HP, DEF, M.DEF and SPD.
2. **The balance loop did not bunch the letters.** Against today's cuts it flipped 59 of 670 race-stat letters (HP, ATK, M.ATK, DEF, M.DEF), and the S/A/B/C/F shape of each stat stayed almost the same (HP 12/29/46/40/7 before, 12/25/53/35/9 after). It changed win rates, not the spread of stats.
3. **Even ranges give each stat a different meaning for S.** HP comes out bell-shaped on its own (S = 9 %), but M.ATK has 37 S races (28 %), M.DEF 26, MP 27, and CRT has 67 S races, half the roster, because 56 races sit on exactly 26 %.
4. **A bell curve makes every letter mean the same thing on every stat:** S = top ~10 % of the roster, A = next 20 %, B = middle 40 %, C = next 20 %, F = bottom ~10 %. Ties share a letter, so CRT can't be split evenly: 56 races crit 26 %, so 26 % reads A and only the one 30 % race reads S.
5. **Cost of the bell:** 338 of 938 letters change (about 2.5 per race), almost all by one step (10 two-step moves). Top casters slide S to A on M.ATK (wizard 185, men in black 181, fairy 173); a few lows rise (robot M.DEF F to C, priest HP C to B).

## Recommendation

* Bell curve (10/20/40/20/10 by rank) for HP, MP, ATK, M.ATK, DEF, M.DEF and CRT, baked as fixed numbers in STAT_GRADE_BANDS (not recomputed live, so one race's patch never moves another race's letter). Re-cut after a balance pass.
* Leave SPD and VISION alone. SPD letters ARE movement tiles (MOVE_SPD_RULE follow = true: F walks 1 ... S walks 5), so moving SPD cuts would change how far races walk, which is a rule change. VISION's letter is one per tile seen (2..6).
* Same PR: the ring around the letter fills by the race's rank in the roster (today it fills val/100, so every stat of 100+ shows a full ring, over half the roster), a BELL CURVE button beside SPREAD EVENLY in the race editor's GRADES tab, and the band numbers in the stat tooltips.
* Display only: no damage, move, AI or balance number changes.

## Every race (value, today's letter → bell letter where it changes)

| race | HP | MP | ATK | M.ATK | DEF | M.DEF | CRT |
|---|---|---|---|---|---|---|---|
| ai | 1010 B | 224 S→A | 2 F | 200 S | 97 B | 186 S | 26 S→A |
| android | 678 C | 140 B | 104 B | 83 B | 69 C | 118 B | 26 S→A |
| angel | 740 C | 220 S→A | 42 C | 183 S→A | 130 A | 181 S | 26 S→A |
| annunaki | 1330 A | 135 B | 117 B | 124 A→B | 78 C | 46 F→C | 26 S→A |
| antihero | 1050 B | 115 C→B | 208 S | 60 C→B | 152 A | 72 C→B | 25 S→B |
| antperson | 1650 S | 100 C | 138 A | 112 B | 180 S | 101 B | 16 B→C |
| anubis | 470 F | 200 A | 98 B | 155 A→B | 44 F→C | 191 S | 25 S→B |
| astronaut | 1520 S | 180 A→B | 15 F | 199 S | 163 S→A | 100 B | 26 S→A |
| atlantean | 1010 B | 190 A→B | 112 B | 88 B | 66 C | 66 C | 20 A→B |
| barbarella | 1180 B→A | 145 B | 137 A | 63 C→B | 104 B | 129 A→B | 26 S→A |
| bee queen | 1200 A | 220 S→A | 118 B | 134 A→B | 150 A | 91 B | 25 S→B |
| bigfoot | 1160 B | 80 F | 130 A | 18 F | 164 S→A | 98 B | 15 C |
| black goo | 1060 B | 125 C→B | 100 B | 101 B | 113 B | 138 A→B | 20 A→B |
| bligblog | 1270 A | 200 A | 50 C | 204 S | 118 B | 149 A | 26 S→A |
| bunny girl | 1420 A | 200 A | 96 B | 160 A | 104 B | 123 B | 26 S→A |
| catgirl | 980 B | 110 C | 171 S | 49 C | 87 B | 56 C | 26 S→A |
| chef | 1140 B | 180 A→B | 84 B | 114 B | 110 B | 95 B | 24 S→B |
| chess piece | 1670 S | 200 A | 230 S | 40 C | 155 A | 70 C→B | 16 B→C |
| chosen one | 312 F | 170 A→B | 158 A | 111 B | 42 F→C | 127 A→B | 26 S→A |
| clown | 1420 A | 130 B | 194 S | 78 C→B | 86 B | 69 C→B | 26 S→A |
| conspiracy theorist | 1230 A | 195 A→B | 20 F | 164 S→A | 75 C | 157 A | 26 S→A |
| cosmic wraith | 1350 A | 140 B | 101 B | 94 B | 41 F | 61 C | 26 S→A |
| cowboy | 840 C | 150 B | 107 B | 36 F→C | 72 C | 42 F→C | 26 S→A |
| crystal guardian | 1050 B | 120 C→B | 119 B | 120 A→B | 165 S→A | 160 A | 20 A→B |
| cult leader | 1070 B | 220 S→A | 47 C | 212 S | 110 B | 152 A | 26 S→A |
| cyborg | 1200 A | 100 C | 89 B | 102 B | 144 A | 55 C | 15 C |
| cyclops | 1678 S | 65 F | 182 S | 46 C | 181 S | 38 F→C | 20 A→B |
| deep sea fish | 1070 B | 180 A→B | 174 S | 83 B | 130 A | 53 C | 25 S→B |
| demon | 690 C | 190 A→B | 141 A | 101 B | 73 C | 87 B | 15 C |
| demon prince | 1141 B | 165 B | 78 C→B | 135 A→B | 22 F | 126 A→B | 24 S→B |
| demon princess | 640 C→F | 180 A→B | 55 C | 111 B | 58 C | 176 S→A | 24 S→B |
| dinosaur | 1130 B | 60 F | 131 A | 11 F | 125 A→B | 35 F→C | 15 C |
| djinn | 650 C→F | 240 S | 94 B | 158 A→B | 39 F | 183 S | 19 B |
| door agent | 1030 B | 170 A→B | 73 C→B | 102 B | 124 A→B | 97 B | 26 S→A |
| dragon | 910 B | 150 B | 114 B | 64 C→B | 108 B | 95 B | 15 C |
| dreameater | 870 C | 225 S | 68 C→B | 160 A | 63 C | 189 S | 26 S→A |
| droid | 983 B | 220 S→A | 37 F→C | 189 S→A | 120 B | 197 S | 19 B |
| eagleman | 1040 B | 130 B | 160 A→S | 71 C→B | 97 B | 83 C→B | 30 S |
| fairy | 1060 B | 220 S→A | 3 F | 173 S→A | 51 C | 151 A | 26 S→A |
| fallen angel | 740 C | 180 A→B | 54 C | 158 A→B | 60 C | 192 S | 14 C |
| firefighter | 1260 A | 100 C | 77 C→B | 80 B | 130 A | 93 B | 24 S→B |
| flesheater | 1090 B | 90 F→C | 116 B | 23 F→C | 130 A | 60 C | 22 A→B |
| fortune teller | 1260 A | 210 A | 7 F | 194 S→A | 53 C | 168 S→A | 26 S→A |
| gangster | 880 C→B | 100 C | 134 A | 16 F | 134 A | 67 C | 24 S→B |
| gargoyle | 960 B | 90 F→C | 112 B | 28 F→C | 169 S→A | 121 B | 26 S→A |
| general | 1650 S | 95 C | 133 A | 39 C | 171 S | 97 B | 14 C |
| ghost | 460 F | 240 S | 0 F | 110 B | 10 F | 33 F→C | 26 S→A |
| ghoul | 750 C | 110 C | 92 B | 19 F | 120 B | 86 B | 24 S→B |
| giant | 1190 A | 60 F | 123 A | 5 F | 198 S | 117 B | 11 F |
| glitch | 800 C | 170 A→B | 70 C→B | 188 S→A | 49 C | 149 A | 19 B |
| gnome | 1520 S | 205 A | 142 A | 89 B | 183 S | 180 S→A | 26 S→A |
| goatman | 1260 A | 90 F→C | 133 A | 57 C | 123 B | 51 C | 14 C |
| goblin | 1030 B | 120 C→B | 148 A | 77 C→B | 101 B | 47 C | 26 S→A |
| golem | 1160 B | 130 B | 157 A | 3 F | 160 A | 104 B | 11 F |
| grey | 870 C | 220 S→A | 28 F→C | 197 S | 45 F→C | 195 S | 26 S→A |
| halfdemon | 680 C | 135 B | 128 A | 87 B | 77 C | 131 A→B | 26 S→A |
| hippie | 1270 A | 230 S | 10 F | 170 S→A | 62 C | 141 A→B | 23 A→B |
| honda civic | 860 C | 90 F→C | 114 B | 15 F | 178 S | 16 F | 12 C→F |
| ice queen | 730 C | 205 A | 13 F | 156 A→B | 40 F | 178 S→A | 23 A→B |
| jack o lantern | 1270 A | 200 A | 57 C | 173 S→A | 109 B | 113 B | 19 B |
| jellyfish | 1170 B | 180 A→B | 65 C→B | 162 S→A | 150 A | 158 A | 21 A→B |
| juggernaut | 1250 A | 40 F | 92 B | 2 F | 125 A→B | 55 C | 11 F |
| kaiju | 690 C | 110 C | 92 B | 44 C | 100 B | 13 F | 10 F |
| ki fighter | 1080 B | 120 C→B | 125 A | 101 B | 127 A→B | 52 C | 14 C |
| king arthur | 1120 B | 80 F | 108 B | 52 C | 95 B | 66 C | 23 A→B |
| king kong | 1270 A | 75 F | 158 A | 31 F→C | 117 B | 27 F | 13 C |
| knight | 1150 B | 70 F | 105 B | 55 C | 140 A | 80 C→B | 13 C |
| kraken | 900 B | 205 A | 184 S | 112 B | 117 B | 155 A | 23 A→B |
| krampus | 1150 B | 110 C | 136 A | 96 B | 110 B | 54 C | 18 B→C |
| loch ness monster | 1220 A | 95 C | 119 B | 43 C | 197 S | 83 C→B | 10 F |
| luchador | 1480 A | 90 F→C | 111 B | 26 F→C | 155 A | 41 F→C | 18 B→C |
| machine elves | 1050 B | 220 S→A | 47 C | 183 S→A | 121 B | 175 S→A | 26 S→A |
| mad scientist | 580 F | 230 S | 46 C | 147 A→B | 33 F | 25 F | 26 S→A |
| mantid | 860 C | 190 A→B | 164 S | 192 S→A | 80 C→B | 92 B | 26 S→A |
| marksman | 392 F | 120 C→B | 144 A | 10 F | 19 F | 12 F | 26 S→A |
| martian | 910 B | 140 B | 29 F→C | 130 A→B | 93 B | 81 C→B | 26 S→A |
| mech | 980 B | 110 C | 109 B | 65 C→B | 177 S | 19 F | 18 B→C |
| men in black | 850 C | 145 B | 63 C | 181 S→A | 83 C→B | 178 S→A | 26 S→A |
| mermaid | 790 C | 225 S | 50 C | 181 S→A | 100 B | 188 S | 23 A→B |
| mime | 1100 B | 160 B | 145 A | 95 B | 85 C→B | 95 B | 26 S→A |
| minotaur | 1160 B | 100 C | 99 B | 8 F | 126 A→B | 44 F→C | 13 C |
| mothman | 840 C | 215 A | 88 B | 179 S→A | 52 C | 161 A | 26 S→A |
| mummy | 890 B | 210 A | 60 C | 125 A→B | 120 B | 150 A | 18 B→C |
| mushroom girl | 1090 B | 220 S→A | 23 F→C | 152 A→B | 95 B | 146 A | 22 A→B |
| necromancer | 580 F | 250 S | 26 F→C | 175 S→A | 18 F | 174 S→A | 22 A→B |
| nephilim | 1120 B | 90 F→C | 88 B | 50 C | 158 A | 50 C | 13 C |
| nordic | 1420 A | 200 A | 49 C | 200 S | 76 C | 163 S→A | 18 B→C |
| occulus | 1150 B | 200 A | 36 F→C | 193 S→A | 47 C | 164 S→A | 26 S→A |
| orb of light | 480 F | 180 A→B | 33 F→C | 190 S→A | 16 F | 200 S | 26 S→A |
| overlord | 910 B | 75 F | 71 C→B | 68 C→B | 115 B | 32 F | 13 C |
| pirate | 1170 B | 100 C | 106 B | 42 C | 98 B | 68 C→B | 22 A→B |
| police officer | 860 C | 110 C | 110 B | 23 F→C | 100 B | 58 C | 26 S→A |
| politician | 1810 S | 200 A | 11 F | 200 S | 141 A | 144 A→B | 26 S→A |
| popstar | 880 C→B | 230 S | 18 F | 180 S→A | 110 B | 140 A→B | 20 A→B |
| priest | 880 C→B | 230 S | 16 F | 211 S | 107 B | 177 S→A | 22 A→B |
| professor | 1200 A | 240 S | 44 C | 200 S | 79 C→B | 143 A→B | 26 S→A |
| quarterback | 1060 B | 100 C | 120 A→B | 21 F→C | 59 C | 18 F | 26 S→A |
| rabbit | 1300 A | 160 B | 97 B | 185 S→A | 112 B | 120 B | 26 S→A |
| reptilian | 1080 B | 130 B | 172 S | 101 B | 92 B | 49 C | 26 S→A |
| ringmaster | 1660 S | 180 A→B | 59 C | 200 S | 118 B | 107 B | 26 S→A |
| robinhood | 680 C | 110 C | 125 A | 20 F→C | 32 F | 24 F | 26 S→A |
| robot | 1624 S | 50 F | 95 B | 7 F | 192 S | 36 F→C | 17 B→C |
| santa clause | 980 B | 160 B | 79 C→B | 117 B | 140 A | 134 A→B | 17 B→C |
| scarecrow | 1500 A→S | 150 B | 72 C→B | 76 C→B | 166 S→A | 106 B | 12 C→F |
| seraphim | 840 C | 260 S | 24 F→C | 176 S→A | 110 B | 194 S | 21 A→B |
| shadow entity | 710 C | 169 B | 172 S | 151 A→B | 60 C | 138 A→B | 26 S→A |
| shaman | 1030 B | 250 S | 55 C | 217 S | 58 C | 147 A | 21 A→B |
| sharkman | 1300 A | 90 F→C | 146 A | 29 F→C | 138 A | 30 F | 17 B→C |
| sheriff | 890 B | 110 C | 91 B | 24 F→C | 130 A | 63 C | 26 S→A |
| sidekick | 1010 B | 130 B | 133 A | 86 B | 154 A | 76 C→B | 26 S→A |
| siren | 922 B | 220 S→A | 26 F→C | 177 S→A | 50 C | 171 S→A | 21 A→B |
| skeleton | 740 C | 120 C→B | 53 C | 99 B | 74 C | 96 B | 12 C→F |
| skinwalker | 398 F | 160 B | 151 A | 176 S→A | 29 F | 112 B | 26 S→A |
| spy | 793 C | 138 B | 159 A | 84 B | 84 C→B | 91 B | 26 S→A |
| starfish | 1510 S | 220 S→A | 63 C | 200 S | 170 S | 132 A→B | 17 B→C |
| succubus | 620 C→F | 220 S→A | 65 C→B | 121 A→B | 46 F→C | 172 S→A | 21 A→B |
| super sentai | 1617 S | 120 C→B | 122 A | 37 F→C | 175 S | 75 C→B | 26 S→A |
| superhero | 1160 B | 90 F→C | 174 S | 140 A→B | 172 S | 10 F | 12 C→F |
| swamp monster | 1170 B | 120 C→B | 101 B | 53 C | 130 A | 90 B | 16 B→C |
| swordfighter | 1180 B→A | 95 C | 111 B | 41 C | 147 A | 58 C | 16 B→C |
| symbiote | 810 C | 125 C→B | 122 A | 72 C→B | 90 B | 90 B | 26 S→A |
| telepath | 650 C→F | 225 S | 21 F | 195 S | 24 F | 185 S | 26 S→A |
| time cop | 760 C | 110 C | 93 B | 29 F→C | 100 B | 58 C | 26 S→A |
| tree person | 1200 A | 160 B | 125 A | 47 C | 160 A | 130 A→B | 12 C→F |
| undead | 790 C | 100 C | 102 B | 45 C | 110 B | 70 C→B | 26 S→A |
| unicorn | 940 B | 225 S | 90 B | 192 S→A | 107 B | 160 A | 23 A→B |
| valkraye | 1180 B→A | 80 F | 124 A | 67 C→B | 120 B | 73 C→B | 16 B→C |
| vampire | 720 C | 200 A | 88 B | 70 C→B | 120 B | 89 B | 26 S→A |
| voidweaver | 870 C | 195 A→B | 166 S | 116 B | 85 C→B | 154 A | 26 S→A |
| watcher | 885 B | 210 A | 67 C→B | 159 A | 70 C | 166 S→A | 26 S→A |
| werewolf | 1340 A | 80 F | 46 C | 13 F | 121 B | 22 F | 16 B→C |
| wizard | 480 F | 255 S | 5 F | 185 S→A | 40 F | 198 S | 16 B→C |
| yeti | 1070 B | 120 C→B | 120 A→B | 85 B | 137 A | 103 B | 10 F |
| zombie | 1605 S | 70 F | 85 B | 0 F | 194 S | 15 F | 11 F |
