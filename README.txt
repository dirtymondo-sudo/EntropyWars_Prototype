ENTROPY WARS — THE SPELL DIRECTOR (plan + Phase 1) — 2026-09-23

UPLOAD TO R2 (then the cache-bust below makes them live):
  battle.js        the director layer (all three camera rigs run ONE director per cast)
  online.js        the self-cast camera relay carries the resolved spell id (RULE #2)

REDEPLOY ON RENDER:
  index.html       cache-bust token 20260923-elements-01-cors -> 20260923-spell-director-01-cors

REPO ONLY (sync so future sessions start from them):
  SPELL_DIRECTOR_PLAN.md       THE plan: diagnosis, the look bible, phases 1-7, the 30 animations to create
  check-spell-presentation.js  the census tool (node check-spell-presentation.js)
  spell-director.test.js       the Phase 1 tests (runs in npm test)
  playtest_spellcam.js         probe: LEGACY=1 A/B, CAST_AT=x,y, a DIRECTOR log line, Stadium default
  CLAUDE.md                    the new SPELL DIRECTOR section
  SPELL_CINEMATICS.md          pointer to the new plan
  PLAYTEST_NOTES.md            probe notes

A/B IN THE BROWSER CONSOLE:
  window.EW_DISABLE_SPELL_DIRECTOR = true    -> the old layering, exactly
  window.SpellDirector.log                   -> what directed the last 40 casts
  window.SpellDirector.resolve('raceBoo')    -> which director a spell gets
