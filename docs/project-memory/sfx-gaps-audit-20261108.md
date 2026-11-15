---
name: sfx-gaps-audit-20261108
description: 11-08 audit of battle SFX gaps for elemental casts (no code, no audio made); doc in /mnt/project-files/sfx-audit-20261108/
metadata:
  type: project
  modified: 2026-11-08T12:06:02.956Z
---
mondo 11-08 asked which elemental cast/hit SFX are missing + priority + lengths. Thread "Audit battle SFX gaps for elemental casts"
 (thread in the owner project). Doc: /mnt/project-files/sfx-audit-20261108/SFX_GAPS_ELEMENTAL_20261108.md.
Repo SFX_AUDIT.md (08-03) is stale for elements.

Findings (main 87460d0): router battle.js `_SFX_EL_ALIAS`/`spellLaunchSfx`/`_SFX_THEME_IMPACT` knows only lightning/ice/water/earth
(+fire cast). Fire has NO impact clip (spellDamage). Psychic/poison/sonic/wind/nature/blood casts all play `fireball`, hits `spellDamage`.
Covered: lightning, ice, water, earth. Priority he was given: 1 fireImpact 1.2 s (only needs a map entry), 2 psychic, 3 poison, 4 sonic,
5 wind, 6 nature, 7 blood cast 1.2 s / hit 0.9-1.0 s (each needs router code), 8 status stings 0.4-0.6 s, 9 reaction stings 0.5-0.8 s,
10 weather beds 12-20 s loops. Timings: wind-up 0.90/1.25/1.68/2.03 s by weight, hitstop 90-180 ms, impact hold 1.2 s.
Silent: most R1-R16 reactions, 7 of 10 weathers, uiConfirm-click casts (delayed/zone/trap/deploy kinds). Summon Blizzard/Sandstorm/
Blood Rain burst plays thunderRumble. knife/last_round/last_stand.ogg on R2 unwired.

**How to apply:** when he uploads new SFX, wire them per §5 of the doc (code change = normal delivery workflow).
