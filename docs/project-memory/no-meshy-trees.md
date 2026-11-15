---
name: no-meshy-trees
description: mondo 2026-10-04: never use the Meshy tree models anywhere; trees are the retro pack (PR #91)
metadata:
  type: feedback
  modified: 2026-10-04T23:24:41.055Z
---

mondo (2026-10-04): "i dont even want to use that meshy tree anywhere in the game." PR #91 swapped the four Meshy trees (dead_snag, hollow_dead_tree, pine, hollow_tree catalogue rows) to retro-pack files (`base: 'rt'`), near settings use `_nrTree`; the tree ways keep their procedural trunk with the hole.

**Why:** he dislikes the Meshy trees; the retro tree pack is his tree style.
**How to apply:** any new tree anywhere = a retro-pack tree (rt: names / HQ_TREE_KINDS), never a Meshy tree GLB. Also PR #90 (same thread): late GLBs in near groups got the horizon altitude fog (flat fog-colour silhouettes); `_ew_hzNearRoot` fixes it. He says this was never a WebGL vs WebGPU issue. See [[renderer-plan]].
