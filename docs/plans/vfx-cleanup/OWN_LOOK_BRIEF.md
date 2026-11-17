# OWN LOOKS: every spell with no look of its own gets one

mondo, 2026-11-17: "any spells that dont have a look of their own need one, start a thread or multiple threads to give them."

**The job.** 240 castable spells have no look of their own: at the hit they only draw the shared stage burst (a ring, a
flash, sparks in their archetype's colour) plus, some of them, a plain particle recipe. Each one gets a look that says
what THIS spell is: its name, its line of description, its race, its weapon or prop, its element.
(75 more are waiting for the beam kit and the portal kit, plan batches B3 / B4 / B5; they are not in these lists.)

**Your list:** `docs/plans/vfx-cleanup/own-look/<L1..L6>.txt` (spell ids, one a line). Each spell's row (race, element,
stage look, weight, what it draws today) is in `docs/plans/vfx-cleanup/SPELL_TABLE.md`; its rules and description are its
row in data.js (`node -e` through `load-data.js`, never regex-scrape).

| Thread | List | What | Spells |
|---|---|---|---|
| L1 | `own-look/L1.txt` | Ground and growth: earth, nature, poison, water, ice | 49 |
| L2 | `own-look/L2.txt` | Metal and machines: metal, tech, rig, lightning | 48 |
| L3 | `own-look/L3.txt` | Bodies: kinetic, human, grapple, skyfall, ki | 39 |
| L4 | `own-look/L4.txt` | Blessings and curses: aura, heal, divine, hex | 46 |
| L5 | `own-look/L5.txt` | Mind and dark: psychic, unholy, arcane, anomaly, blood, mind | 41 |
| L6 | `own-look/L6.txt` | Fire, wind and sound | 17 |

## Read first
1. `CLAUDE.md` (RULE #1 delivery, #1b token, #1c browser runs, #1d fresh check, #2 online), `docs/notes/owner-rules.md`,
   `docs/notes/claims.md` (take your row: "VFX own looks, L<n>").
2. `docs/plans/vfx-cleanup/VFX_CLEANUP_PLAN.md` sections 2, 3 and 10, and `docs/notes/spells-vfx.md`
   "THE VFX CLEANUP, B0 + B1", "THE RIOT PASS", "THE CLEAR BODIES", "THE HIT BLINK", the element passes (fire, ice, water,
   nature, wind, metal, earth, blood, sonic) and the spell look audit FX-1 ... FX-4: those are the house style and they
   show how a signature is written and wired.

## How a look is built
- In `three-vfx-effects.js`, in your OWN block at the end of the passes ("THE OWN LOOKS, L<n>"). A signature is a function
  wired the way the newest passes wire theirs (`_FX2_BURST[id]`, a G-O `_GO_SIG[id]`, or a `pzSig` recipe). Once a spell
  has one, `_vcOwn(id)` is true by itself and its generic stage burst stops: check that happened.
- Reuse what is there before drawing new: the shared signature helpers (`_sig*`), the element passes' own pieces, the
  craft pieces (`_cr*`), the noise sheets, and IN-GAME MODELS for a prop (search `MODEL_LIST.md` first, owner-rules
  section 1; a model the game lacks = no prop, never a stand-in).
- Do NOT edit the shared helpers or the cleanup block (the VFX cleanup thread holds them, claims.md). Never a new game
  .js file.

## The look rules (mondo's, all of them bind)
- The spell's own shape and colour. Nothing that would look the same on any other spell.
- No generic near-white layers. **White is not banned**: a thing that is white because it is the thing (snow, a holy
  light's own shape) is fine. THE HIT BLINK (the victim's body flashing white) is never touched.
- **Every square an area spell hits flashes** (it shows where the damage lands); the flash takes the spell's colour.
- No rune / magic circle on the ground unless the spell is magic that draws one (arcane, unholy, hex, blood, divine), and
  never under the noise wash on the hit squares. A heal or a buff gets no rune.
- Never hide the caster, the target, the hit or the number. No full-screen flash. Bloom + fog stay off.
- Own side cyan-blue / enemy pink-orange stay the team reads (the rims); do not paint a spell in them.
- A simple spell gets a simple look. Not every spell needs a big moment; it needs to be recognisably itself.
- Never invent, rename or remove a spell; no rule changes; looks only.
- Online: every layer rides `fire()` / the stage beats (already relayed). Nothing on `state`, nothing decided by a
  random roll that the guest would roll differently.

## How to work
- `git fetch origin main && git merge origin/main`, `node fresh-check.js` first, and again before every capture run.
- Small PRs: 8 to 15 spells each, merged and uploaded the normal way (RULE #1: PR, merge, `?v=` bump,
  `node sync-zip.js --upload`). Five other threads edit the same file: merge main before every PR, keep both sides.
- `node --check three-vfx-effects.js` before each PR. No tests.
- Look at your work: `bash docs/plans/vfx-cleanup/tools/harness/setup.sh` once, then
  `node /tmp/sv/sv-run.js --only <id,id,...> --out /tmp/sv/<name>` and `python3 /tmp/sv/sv-report.py /tmp/sv/<name>`.
  Open the frames yourself; fix what reads badly; one run for several spells.
- Notes: a short section per PR in `docs/notes/spells-vfx.md` ("THE OWN LOOKS, L<n>, part k": the spells and one line
  each on what they now draw). Tick the spells off in your claims row.
- Reply at the end of each PR: the spells done, the after frames (saved under `docs/plans/vfx-cleanup/img/own-look/`),
  the `[EW BUILD]` HEAD, the uploaded files + sha256[:8], and what is left on the list.
