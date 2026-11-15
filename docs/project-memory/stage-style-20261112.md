---
name: stage-style-20261112
description: Entropy Style (grade + ink) on the party builder / creator stage, PR #1214; which 3D views have the style and which were left plain
metadata:
  type: project
  modified: 2026-11-12T14:58:03.816Z
---
mondo 11-12: "make sure the 2 new shaders (ink and the color grade) are on in the party builder as well. The 3d models dont have it". Thread (thread in the owner project). Related [[shader-style-20261112]].

- SHIPPED PR #1214 (?v=20261112-stagestyle-01-cors; three-post.js 1ffdba31, three-renderer.js c7cd24c9 live). The party builder / creator / intake / codex stage (EWCharViewer) is its OWN WebGL renderer, so the board chain never reached it. `ThreePost.styleDraw(r, scene, cam)` styles it with the same shader + settings (line = Ink Lines x Unit Lines width). Off live: `window.EW_NO_STAGE_STYLE = true`.
- ALREADY STYLED (ThreePost.renderScene): DOOR HQ, menu room, team room. LEFT PLAIN (told him, offered): ID-card photo, editor 96 px prop thumbnails, UI Maker dock tile / float-text previews.
- Seen: party builder headless classic WebGL, proof /mnt/project-files/party-builder-style/. NOT seen: his Mac, creator face close-up, spell preview on the stage. At small stage size the ink puts dark flecks on the face (nose / chin) and wing feathers; if he says lines are heavy on the stage, give the stage its own width factor in styleDraw.
- HARNESS LESSON: this container reaches cdn.entropywars.net + jsdelivr through the proxy; Playwright needs `proxy: { server: HTTPS_PROXY, bypass: 'localhost,127.0.0.1' }` (without the bypass localhost answers 405 and nothing loads), route cdn .js/.css to the repo files, `npm install` first, playwright from the global npm root. Party builder: `window._goToTeamBuilder()` then click NEW TEAM.
