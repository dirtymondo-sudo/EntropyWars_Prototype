---
name: map-pass-natural-scenic-skate-20261116
description: World-wide realism / scenic / skateboarding audit of all 21 plot-built rooms (mondo 11-16); findings + fix list posted, waits his OK, nothing built
metadata:
  type: project
  modified: 2026-11-16T12:12:45.205Z
---
Thread (owner-project id). mondo 11-16: pass over all zones/districts/plots for 1) realism + naturalness within the 3.5 m grid, 2) scenery / elevation, 3) skateboarding (ramps + rails usable). Map design = plan first, his OK before building.

Audit doc: https://claude.ai/artifact/8LpynxgRa5htHZeDwmnqCA . Pictures + the audit scripts: /mnt/project-files/map-pass/ (tools/audit.js = per-room JSON via load-data.js + hqTerrainInfo/Feet/RunUps/RunUpOffenders/Pockets; draw.py = top-down map). Downtown takes ~6 min to audit.

Findings (11-16, main 788e313): only 5 skate pieces in the plot world (city street court P03-03: 2 quarter_pipes side by side same facing, bench/hydrant/bin/boxes in lanes; DUMB QP 3 m run-up; Ski Lodge 2 risers 3 m run-up). Catalogue ramp props = quarter_pipe, riser_1/2/3 only; rail prop = railing_1m; no skate models in MODEL_LIST. 11 city kickers blocked (ambulance on ramp ~178,75; Bayside pool loungers; planters; pizzeria). Desert/Beach/Woods/Leylines kickers blocked by props. 10 rails < 2.5 m; Beach rails 1.44 m (> 1.3 ollie). 6 city palms on bare ConcreteSlab. Unreachable ground: Heaven ~50% (float stairs; may be audit limit), Hell 24%, Mars 21%, Moon 18%. Desert 96% one flat level; Camelot/Leylines 73%; North Pole range 2.8 m.

Proposal: city skate park on the street court, clear lanes (move props, never delete), fix rails, one skate line per zone; dunes/fields/terraces. Decision card asked build order (recommended city first). Other zones belong to the second account's (mostly stopped) district threads: take rows on docs/notes/claims.md before touching them. Related [[skate-invisible-walls-20261115]] [[associate-review-20261116]].

SKATE PARK BUILT 11-16 (mondo "yeah add a skatepark"): PR #1873, data.js 4655b323, token 20261116-skatepark-02-cors. Bayside beach beside the boardwalk (B.js skatePark(), home squares cx146-150 cy99-110; room x 259-276.5, z -73.5..-31.5): pad, bowl, funbox+rail, flat bar, 2 QPs, bank+handrail, sign. Skater unit (new units thread) reads its pipe `rail` rows + city_bench. Waits his look. Next if he OKs: 11 blocked city kickers, 6 palms on concrete. Map remake (styled like the audit maps) = (thread in the owner project).
