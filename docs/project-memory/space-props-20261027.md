---
name: space-props-20261027
description: PR #622 (10-27) astronaut space-prop spells — Space Laser, Lunar Rover, Space Debris, Shuttle Launch + station on Orbital Strike; calls flagged to mondo
metadata:
  type: project
---
PR #622 merged 2026-10-27. mondo's Assets/misc uploads (satellite, space shuttle, space station) + existing lunar_lander (mondo: "i meant the lunar lander" — PR #623 replaced the Mars rover) + hullplate (the "debris with wires") drive 4 new astronaut Mission Control spells.

Calls flagged to mondo, awaiting his OK:
- Space Laser: T2, fire, 90 magic, R6, Burn 2.
- Lunar Lander (was Lunar Rover): T2, metal, dash 4, 80 per body, Stagger 1.
- Space Debris: T3, metal, 125 physical, R5 3×3, ×1.5 vs Stagger.
- Shuttle Launch: T4, fire, 160 magic, self r1, ×1.5 vs Burn, cooldown 2.
- Station appears only in the Orbital Strike look.
- Orbital Strike overlaps Space Laser; nothing was removed.

Lander = flying vehicle mount (three-renderer `_MOUNT_VEHICLES` fly/stand/flip, `mountUnit({vehicle})`); porch flipped to the back so the cabin never hides him. Close battle camera: prop altitudes must use `_framedRise` with a low min (about 2 tiles), or the prop goes off the top of the screen. Proof shots: /mnt/project-files/space-props/.
