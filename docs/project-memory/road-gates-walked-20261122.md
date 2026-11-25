---
name: road-gates-walked-20261122
description: mondo 11-22 rulings on zone road gates (walk through, no E; signs face the traveller; road must visibly run on) + how PR #2381 did it
metadata:
  type: project
  modified: 2026-11-22T13:12:15.152Z
---
Thread (owner-project id) "Fix the road from Disaster City to the Desert" (mondo 2026-11-22). Shipped PR #2381, live.

mondo's words: signs "facing backwards"; "i walk through and it doesnt automatically take me to the desert, i have to walk back a little bit and press e, which is really dumb"; "i can't see the road going out, the road just stops and its all desert, which is also really dumb".

RULES TO KEEP (my reading of them):
- A gate between zones is WALKED THROUGH, never a press-E prompt you can overshoot.
- Exit signs must read correctly to the person leaving.
- A road out must visibly continue past the room's line; it must not end at the edge.

**How to apply:** a free `road` link end's `face` = compass heading INTO the room (180 on a south line is back to front). Road ends are passage records now (no prompt). The strip lies on the edge land for 300 m. Notes: docs/notes/areas-complexes.md "THE ROAD OUT IS WALKED". Related: [[one-world-south-routes-20261117]].

Not verified: the arrival spot in the city coming from the Desert (cloud browser dies loading the city as the second room of a run). The dragon + deep sea fish at the Desert gate = a separate NPC thread.

ROUND 2 (PR #2395, live): mondo "why is there a little river stream that the road dips under? an why are there trees blocking the woods exit ... Make them actually look good and not like buggy messes ... we are driving cars not baots". Fixed: no water along the city's south line, the road out is a level raised road with banks + lane lines, the Woods exit stands on its footpath with no trees in it. RULE (my reading): never water across a road; nothing planted in an exit. Open: he has not said whether the Woods exit should become a real street (the city has only a footpath there).

ROUND 3 (PR #2398, live): mondo "its not a road, get rid of the green road sign to the woods ... It just needs a sign or crosspost or something, not a freaking highway exit sign to the woods". The Woods exit now has a wooden signpost "THE WOODS". RULE (my reading): green highway gantries only on real car roads; paths to nature zones get a wooden signpost. He also questioned the name "The Valley Road" (route room site_ow_r6 between the city and the Woods, a dirt road with Trucker + Honda Civic on it since PR #2377); asked him whether to keep name + cars, no answer yet.

ROUND 4 (PR #2399, live): he answered "that's fine for now" (Valley Road stays a dirt road with cars) "but if its a dirt road then this path that leads out of it past the edge needs to be dirt, not this tile pavement". Done: a path out wears the ground of the place it leads to.

ROUND 5 (PR #2401, live): his anger "I cant even walk out of this path??? ... its just an invisible wall. and why is the dirt shiny?? do we even use that dirt anywhere else" (rounds 3-4 shipped a look without re-walking the gate: MY MISS). Fixed + walked city -> site_ow_r6; path dirt = dirt_2 tinted to the Valley Road's own colour, no highlight; the Valley Road's city end is the same footpath + signpost. LESSON: after ANY change at a gate, re-run the walk probe (`"walk":{"key":"w"}` in playtest_city.js), and look at BOTH sides of the gate, before telling him it is done. Not walked: Valley Road -> city direction.

ROUND 6 (PR #2404, live): "can we at least TRY to make the outskirts match whats on the other side??? there should be woods/trees all along that dirt path leading back into the city". RULE (his): both sides of a gate show the SAME country. Done: Valley Road's last 4 columns of plots are a tall wood (docs/areas/routes/R6.js), plots.json letters forest via after-v13.js row 10. Walked both ways. Left: past the Valley Road's east line the city shows as bare tower blocks on grass (the world skyline), not checked for trees.

ROUND 7 (PR #2410, live): his screenshot of the Clearing's Old Road trail, "I dont know why its all black on the edge. Every single entrance/exit in the game needs to look good and natural, use as many threads as you need". Causes: the Clearing's edges.tint 0.5 (removed) + black soft cards and a pale slab across every trail mouth (now off in rooms with land past the line, `openLand` in _hqPassageWay). Coordinator started 4 other threads for the other zones' gates (Desert; forest/kingdom (owner-project id); coast/underground; otherworld); this thread keeps Woods / Valley Road / Disaster City edges.
