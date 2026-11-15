---
name: meshy-separate-parts-20261112
description: 11-12 assessment: which Meshy models give separate clothes (T2 yes, T2.5 no, 7.1 + Auto Split), why Meshy heads can't take MPFB face shapes; route 2 picked; cowboy/knight/wizard remade looks in game PR #1153
metadata:
  type: project
  modified: 2026-11-12T00:37:04.732Z
---
mondo 11-12 (thread in the owner project): asked if Meshy's new models make separate parts/clothes and if old Meshy units
can be remade to get clothes + heads wired to the MPFB mouth/eye shapes. Tested live on the cowboy (85 credits; balance after 15,292).

- Existing unit GLBs = one fused mesh (cowboy: 1 island).
- Image to 3D from a front render of the old unit, `model_type: smart-topology`, `ai_model: meshy-t2`, `texture_model: meshy-n1`,
  `pose_mode: a-pose` (15 credits, ~1 min): ONE GLB object but loose shells (Blender separate by loose parts) = hat, trousers, each boot,
  belt, buckle, holster, gun, hands, eyeballs. Coat + shirt = one shell; head sometimes fused into it (varies per run).
- `meshy-t2.5` does NOT separate (only hat/hands/gun loose). Docs say the same: T2 "parts kept separate".
- `meshy-7.1` + Auto Split `POST /openapi/v1/print/split` (`mode: by_parts`, prompt naming ≤10 parts, `keep_texture: true`, 10 credits,
  not for T2/T2.5 inputs): 12 named objects, but closed print solids, ~600k faces; needs remesh.
- HEADS: Meshy heads have sealed mouth, no teeth/tongue/lids -> MPFB's 67 shapes can't drive them. Path = MPFB head made to look like
  the unit (sliders/custom shape + hair/beard/hat pieces).
- PILOT 11-12: route 1 (MPFB head on Meshy unit) vs route 2 (T2 clothes on MPFB body), Blender stills, same folder.
- mondo 11-12 01:07 PICKED ROUTE 2 ("i like route 2 better"; collar looked messed up; route 1 neck seam visible; "try it with a couple more
  different characters"). Done same night on cowboy + knight (female) + wizard: route2_three_characters.jpg, scripts/unit.py (general:
  eye-shell scale, skin flood-fill cut, wig/hat fit + scalp push, limb aim, ray mask, weights + un-skin), gen2.py (Meshy call). 15 credits/unit.
  Known: T2 hairlines high / no fringe under hats (use pack hair), stock faces, skirts/capes no sway. Details plan row 21d.
- IN THE GAME 11-12 PR #1153 (mondo "Go" 01:27): bake-outfit.py (repo root; unit.py + bake-clothes write_glb, solid pieces on 5 bodies) ->
  ewm_t2cowboy_hat/outfit, ewm_t2knight_outfit, ewm_t2wizard_hat/outfit (Armour + Hats tabs). sprites.js RACE_REMADE_LOOKS + forge buttons
  USE THE REMADE <RACE> LOOK / REMADE LOOK. Cowboy = his saved look's body + face + remade clothes; saved cowboy look untouched; Meshy default.
  Proof: remade_looks_in_game.jpg (forge stage, WebGL2), NOT seen in a battle. Gotchas: Blender UV v = 1 - glTF v; robes need RAY_LEG;
  race default idle crouches creator rigs for knight/wizard (looks use Idle_11); probe = scripts/look.js (EWCharViewer.mount on a div).
- FIXES PR #1154 (his first look 02:15: button only on cowboy; boots distort on walk; spikes behind boots): button gate dropped; one-sided
  shells never loose, footwear toe weight -> foot, spur horns flattened (SPURS=0 keeps). Wizard look is male only, knight female only.
- ROUND 3 PR #1155 (02:40: wizard robe points near seat, elbows backwards, knight calf slivers): SLEEVE TEST by mesh edges from the upper
  arm (ray test + forearm aim tried, both broke cuffs/shoulders); leg segment 70% covered = hidden whole. Elbows not reproduced. JUDGE FROM
  4 SIDES + WALK (probe look.js TURN=1), not one front still.
- STATUS: WAITING on mondo's look at the three in game, then which units next. Open: softer than originals, light face shaping on
  knight/wizard, no cape/skirt sway, small boot pokes through wizard robe. No mass remake without his OK.
Related [[meshy-api-pieces]] [[meshy-creator-pieces-20261103]] [[face-lab-20261111]] [[character-models-plan-doc]] [[meshy-default-20261103]]
- R4 PR #1156: wizard boots through robe = skirt weights (cloth over a leg follows that leg, LOOSESIDE); cutting boot tops showed bare shin, dropped.
