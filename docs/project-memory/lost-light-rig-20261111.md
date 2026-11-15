---
name: lost-light-rig-20261111
description: Story rooms pitch black on WebGPU default (barbershop, puddle rooms) = session light rig dropped by the reflector's lent children; fixed PR #1149
metadata:
  type: project
---
mondo 11-11: "interiors of rooms in exploration mode completely dark ... Occam's barbershop pitch black", wanted the root cause for every room. Thread (thread in the owner project).

- Cause: node renderer only (default since PR #1124). `_ewRigTick` (THE ONE RIG) masks every room light and draws through one lamp group; it trusted `group.parent`. Rooms with a reflector (barber_mirror, any puddle decal: sewers, tunnels, Haunted cellar, drains/manholes) lend `scene.children` to a ClippingGroup in `_hqTickReflectors`, so the rig was pushed on the temp list and lost. Classic WebGL unaffected.
- Fix PR #1149: rig must be in the child list (`scene._ew_lentKids` while lent); reflector hands back what joined. Token 20261112-lostrig-02-cors, three-renderer.js a1496b02. Proof /mnt/project-files/dark-rooms-20261111/.
- Different from the mall fix [[mall-bounce-light-20261109]]. Not seen on real WebGPU, only node renderer on WebGL 2.
- Harness: headless Chromium here DOES reach the CDN through the agent proxy, so the host-resolver stand-in in [[headless-hq-proof-gotchas-20261108]] is bypassed (runs silently test the LIVE files). Serve repo scripts with `context.route` on `cdn.entropywars.net/<file>.js` only; rooms load in ~2-3 min at 320x200.
- Seen, not threaded: rain falls inside site_prebuilt_haunted_cellar.
