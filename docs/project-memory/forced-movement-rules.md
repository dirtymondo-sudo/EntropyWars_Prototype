---
name: forced-movement-rules
description: Forced movement + lift-and-throw + edge force field rules from mondo
metadata:
  type: feedback
---
FORCED MOVEMENT: one shared system for push/pull/knockback/fling/slide/ice/bombs/tornado (N,E,S,W by round); airborne skip traps/bombs; preview draws whole chain. LIFT-AND-THROW (To the Moon, Abduction Beam, Dragon Toss, Infernal Hurl, PR #356): any lit tile incl. fog; right-click/BACK/ESC sets target down, uncast, MP refunded. Slam into board's OUTER edge = cyan hex force field ripple, visual only, ~0.8 s; edge SLAM! pop now shows on the unit (PR #389, 10-21; not checked on WebGPU).
PR #1003 (11-07, A1/A3): pushes with no direction pick go straight away from the caster (no `|| 1`; shared column = straight N/S), incl. CPU forecast + previews. Any pull with stopBefore = the caster re-aims at the caster every step (resolveForcedSlide treats stopBefore as `toward`) and stops beside them; a wall on the way in pins the body (slam, no rebound). Open question for mondo (not built): should pulls only aim on the 8 lines?
