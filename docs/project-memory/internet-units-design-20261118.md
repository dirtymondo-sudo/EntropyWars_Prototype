---
name: internet-units-design-20261118
description: Internet zone battle units (Virus shipped PR #2069; Streamer/E-Girl one race, V-Tuber next) — plan approved by mondo 11-18
metadata:
  type: project
  modified: 2026-11-18T02:52:53.955Z
---
Thread (owner-project id). mondo 11-18: E-girl + Streamer = female/male of ONE race with slightly different spells (RACE_GENDER_SPELLS like Priest/Nun); Virus needs its own moving-part body (like Seraphim / Cursed TV); plus V-Tuber.
Plan doc https://claude.ai/artifact/RoRGimCmFiCsn275fkWLzp, copy /mnt/project-files/internet-units/PLAN.md. mondo OK'd 11-18 ("sounds good"); V-Tuber female only for now, Payload visible to both sides, labels Streamer/E-Girl/V-Tuber/Virus.
VIRUS DONE PR #2069: he said Payload sounded like Hexed, so PAYLOAD = spreads at round end to adjacent teammates, bursts 70 when it runs out (never reads carrier actions). Spells Worm/Self-Replicate (Replica summon)/Ransomware/Zero Day (hits only carriers). Boneless rig `virusBody` in three-renderer.js; GLB Assets/characters/races/virus/male/virus.glb; files /mnt/project-files/internet-units/virus/.
STREAMER/E-GIRL DONE PR #2076 (11-18). **How to apply:** next V-Tuber (cast from 2 holo projectors, castFromDoors pattern). One PR each with proof pictures. Concepts from [[internet-zone-models-20261118]].
V-TUBER LOOK (11-18): Catgirl-like first concept rejected; mondo picked option 1 POP IDOL (/mnt/project-files/internet-units/vtuber_options.jpg, concepts/vt_idol.png) — change the Miku-like cyan twin tails.
STREAMER/E-GIRL: race key 'streamer', labelFemale 'E-Girl'. mondo 11-18: Meshy rigged models are the DEFAULT (RACE_MODELS_3D.streamer), MPFB look stays pickable (party builder race look + Remade Race Looks dev switch) — his rule for units: Meshy default, creator look selectable.
V-TUBER DONE PR #2082 (11-18); full Meshy model default PR #2126 (old MPFB look = Remade Race Looks / party builder): Holo Projectors = state.turrets projector rows, cast origins via doorCastOrigins/_castsFromAfar (no rear rider); kind projectorSwap; Collab Stream projectorPulse; look MPFB + Meshy wig ewm_vtwig (silver side ponytail, bangs trimmed). Lines fire from her own square only. No Sprite AI pixel sprites yet for streamer/vtuber.
