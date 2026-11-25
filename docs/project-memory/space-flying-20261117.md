---
name: space-flying-20261117
description: Outer Space One World (11-17): ONE solar-system room you FLY the Spaceship through; shipped PR #1959; nav-console travel is NOT flying
metadata:
  type: project
  modified: 2026-11-17T11:09:56.557Z
---
Thread (owner-project id). mondo 11-17: "pressing a button and walking out of the ship is not flying"; OK'd flying plan /mnt/project-files/space-one-world/outer_space_flying_plan.png; rule "smaller than Disaster City = one room, don't ask".
SHIPPED PR #1959 (merged + R2 upload 11-17): site_prebuilt_moon_plots = whole solar system 12x12 plots (Moon 0,0 / Mars 7,0 / Saturn 0,8 / Singularity 8,8 blocks on planet balls, Low Orbit berth at 5,6, void between). Ship `spaceship_fly` vehicle 'ship': W/S thrust, A/D turn, SPACE/C up/down; fly into a gold beacon (10 districts + orbit) to land. Bridge stick -> berth aboard. Mars/Saturn/Singularity plot rooms retired. Notes areas-complexes.md "OUTER SPACE, THE SOLAR SYSTEM". Proof pics /mnt/project-files/space-one-world/proof/.
NOT BUILT (later per plan): floating outside ship, space fights, asteroids to dodge.
**Why:** space travel must be piloted by hand.
**How to apply:** Outer Space/Spaceship work builds on bake-space.js THE ONE ROOM + three-renderer.js THE SPACESHIP; see [[one-world-map-20261116]].

ROUND PLANETS (11-17, (thread in the owner project)): mondo asked "fix outer space + start new planets" and pasted a design doc (cube-sphere planet, 6 NxN faces, 4-neighbour seams). Proposed: every world a walk-all-round cube-sphere (Moon 24/face ~53 m radius), corners = landing pads, Meshy Earth/Sun; new planet card (Jupiter + Planet X recommended / Venus + Pluto / all). Mock-ups /mnt/project-files/space-round-planets/. mondo PICKED "None yet, round worlds first" (no new planets yet). ROUND MOON SHIPPED PR #1964 (merged + R2 11-17): Moon = 6x4-plot cube net bent to a ball (R 53.5 m, at 110,20,0), draw-only bend (three-renderer THE ROUND WORLDS), walk stays flat. ROUND MARS/SATURN/SINGULARITY + ROOM 24x15 PLOTS SHIPPED PR #1981 (merged + R2 11-17): flat maps wrapped onto balls (docs/plans/world-zones/space-ball.js, bake-space.js toBall); Mars 9x6 R80, Saturn 12x8 R107 + ring, Singularity 9x6 R80 obsidian + disc. Walk draws max 8 ground sheets; nets must not touch. STOPPED 11-17: mondo moved Outer Space to his other session (Fable) to fix planets too close together; claims row freed PR #1986. Proof /mnt/project-files/space-round-planets/proof/. Known: Saturn cloud deck outside Hexagon unreachable; WebGL2 fallback shows some dark sky panels; the compact solar system looms close from the tiny Moon; lighting uses flat normals.
