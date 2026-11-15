---
name: auto-attack-push-20261026
description: PR #538 auto attack — enemy pushed/pulled into the driver's own unit takes that unit's opportunity attack instead of a crash; calls flagged to mondo
metadata:
  type: project
  modified: 2026-10-26T07:59:23.558Z
---
mondo's rule (2026-10-26): when your push/pull drives an enemy into one of YOUR units, your unit auto attacks it, like an opportunity attack. If the enemy is driven into its OWN team, it's the usual crash/chain. Shipped in PR #538, zip ENTROPY_WARS_SYNC_20261026-0759.

- Code: battle.js resolveForcedSlide unit step → `_slideAutoAttacker` / `_slideAutoAttack`. Shared gate `_oppStrikeCanReach` (basic reach + sight, not stunned/frozen/asleep/climbing) and `_oppStrikeDamage` (half ATK power less DEF).
- Calls I made, flagged to mondo and not yet confirmed: the auto attack always lands (no roll, Shank's ×1.5 doesn't apply); no crash either way; the body stops against your unit (no knock-on, no bounce); a unit that can't swing falls back to the crash; your own ally pushed into an enemy still crashes; storm flings and bomb throws count because they carry their caster; the caster itself counts as "your unit"; spell collision riders (collisionBonus, pin) still fire.
- Online: the opportunity-attack banner is now relayed to the guest (showOppStrikeBanner → 'opp-banner', fog-gated).
- Related: [[forced-movement]] [[forced-movement-rules]]
