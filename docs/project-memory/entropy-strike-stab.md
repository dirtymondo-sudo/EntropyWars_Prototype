---
name: entropy-strike-stab
description: 2026-10-23 Entropy Strike STAB investigation — STAB x1.25 vs weak x1.30 makes caster's type win the picker; fix options A-D, awaiting mondo's pick
metadata:
  type: project
  modified: 2026-10-23T09:08:28.742Z
---
mondo 10-23: caster-type Entropy Strike nearly always BEST even when another type is weak on 2 of 3; wants the strike's matchup to matter more but keep STAB.
Findings (code as of b3622bd): STAB_MULTIPLIER 1.25 (data.js), weak 1.30 / resist 0.75 (state.js getTypeDamageMultiplier), applied ONCE, from the TRIGGERING unit only; strike raw = 150 + 0.55 x team ATK, same for all 6 types. Off-type must be weak on >83% of visible enemies to beat a neutral STAB strike. Strike ends turn (no press reward), hits all visible, dual types cancel weaknesses.
Page: https://claude.ai/artifact/Aku7dMdTx5eFG3bP6FTUNC. Options: A strike-only STAB x1.15 (recommended, threshold >50%), A' x1.10, B global STAB 1.15, C strike weak 1.5/resist 0.6, D team STAB share. Side notes: picker shows per-enemy range not total; trigger's range falloff/high ground ride the team strike.
**How to apply:** no code changed; build only the option mondo picks. Any change must keep doEntropyStrike applyHit, getEntropyStrikeForecast, getEntropyStrikeBestType, ai.js scoreEntropyStrike and hud.js STAB chip in step.
Related: [[element-share]] [[press-refund-20261023]]
