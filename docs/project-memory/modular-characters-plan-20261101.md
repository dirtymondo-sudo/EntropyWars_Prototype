---
name: modular-characters-plan-20261101
description: 11-01 research (no code) on rebuilding every character from creator parts with swaying clothes + talking mouths; report + open calls for mondo
metadata:
  type: project
  modified: 2026-11-01T04:54:13.415Z
---
mondo asked 11-01 whether to rebuild every character as modular parts (bodies, clothes, hats, horns, eyes, hair) so the creator
can make the whole cast, with clothes that sway/collide and mouths that talk; which process (Claude, Meshy, Blender, edit Meshy,
edit GLBs). Research only. Report = Claude Doc https://claude.ai/artifact/RKFPXXHKcruZtWtR9xSQHr ; renders of all 161 rigged
models (front/side/back) in /mnt/project-files/character-models-plan/every_model_00..06.jpg.

Facts measured: all 161 rigged files (125 race 3D + 21 cast + dupes) are ONE fused mesh, ~14.8k tris, 24 or 28 joints (fingers
only priest, bligblog, frankenstein, swamp monster), ZERO morph targets, NO jaw/face bones, no cape/hair/tail bones. 9 races
2D-only. Split: ~101 person-in-clothes, ~47 humanoid creatures (need heavy/thin/short bodies + heads/skins), 13 one-offs
(dino, dragon, kaiju, kraken, nessie, jellyfish, starfish, deep sea fish, voidweaver, civic, seraphim x2, occulus; + unicorn, chess).
bpy 5.2.3 installable from the sandbox = Claude can run Blender headless in the cloud (no device). quaternius.com blocked.

Recommendation given: (1) spring-bone sway pilot on 5 existing models, no new art; (2) pick base bodies on the one skeleton;
(3) one full test character (cowboy) vs Meshy; (4) parts in batches (Meshy for solid pieces, CC0 kit/Blender for clothes; Claude
fits in cloud Blender); (5) creator pickers + race presets; (6) mouths last (jaw bone / texture swap, driven by dialogue text).
11-01 later, mondo decided: MPFB2 (MakeHuman) for base bodies + facial expressions; NOT Quaternius ("too fortnite");
mouths not top priority but if separate heads are needed get it right from the start; Claude runs Blender in the cloud
and tells him what to make on Meshy. MPFB2 = one continuous body+head mesh with visemes01 (22), visemes02 (15 Meta/
Oculus), faceunits01 (ARKit) shape-key packs, propagated to clothes on export -> no separate head needed for humans.
MPFB2 BODIES BUILT 11-01 (thread in the owner project): bake-mpfb.py + 5 GLBs (male/female/heavy/thin/short,
27.7k tris, Meshy bone names, 12 expression-unit morphs, procedural 512px skin) on branch claude/project-thread-au91u0 (unmerged)
+ /mnt/project-files/mpfb2-bodies/ (README). MPFB2 repo git-clones fine (works headless as a bpy extension). Handed to thread
"Test MPFB2 bodies in the game" (thread in the owner project) for the real-animation check + packs.
NETWORK: the project uses mondo's "R2" environment (Limited/custom list incl. cdn.entropywars.net); a second env made 11-01
lacked the CDN. Threads started in the wrong env can't playtest or build sync zips.
SWAY TEST SHIPPED: PR #724 (token 20261101-sway-01-cors), zip r2-sync/ENTROPY_WARS_SYNC_20261101-0524.zip: superhero
male cape, 5 chains; bake-sway.py + three-renderer.js THE SWAY (notes models-assets.md "THE SWAY"). Proof image
character-models-plan/superhero_cape_sway_before_after.png. Next pilots proposed: King Arthur cape, cowboy coat,
werewolf tail, bunny ears (need new presets in bake-sway.py).
Related [[character-creator]] [[custom-anim-proposal-20261026]] [[visual-rules]]
