# D.O.O.R. — MASTER FILE
### Story bible + integration design + build log — rev 12 (2026-09-04 — HQ Phase 3 complete: Code Red, Keys, promotions)

This file MERGES the two earlier DOOR documents and supersedes both:
- `entropy_wars_claude_brief.md` (the ChatGPT-assisted story/world brief, 2026-09) → Part A
- `DOOR_DESIGN.md` rev 6 (the integration design + build log, 2026-09-02) → Parts B and D

Both old files are now one-paragraph stubs pointing here. Where the two
disagreed, Part C records the conflict and the decision (or the open
question). **The HEADQUARTERS itself — rooms, doors, the walkable/clickable
hub that replaces the Play menu — lives in its own build plan:
`DOOR_HQ_BUILD_PLAN.md`.** Read CLAUDE.md first (delivery rules), then this
file, then the HQ plan when working on the facility.

Precedence when writing new material: (1) the user's explicit decisions in
Part C, (2) Part A canon, (3) Part B integration rules, (4) taste. Deliberate
contradictions about memory, mottos and institutional history are Mandela
effects and are allowed; every other contradiction is a bug.

---

# PART A — CANON (the world)

## A1. Core concept

*Entropy Wars* is a satirical, esoteric, conspiratorial, psychedelic,
nostalgic and spiritual adventure with a retro PlayStation-era aesthetic,
built on a 4-versus-4 turn-based tactical JRPG fought on 8×8 grids (the
hand-authored Δ boards) with larger 6v6/8v8 "deep crossing" maps behind them.

The player is recruited by **D.O.O.R., the Department of Orthogonal
Realities**, a secret bureaucracy claiming jurisdiction over **Canon
Reality** (its name for baseline Earth). Recruitment standards have collapsed
because reality breaches are multiplying: the player is "what remains of our
standards".

**Orthogonality doctrine.** DOOR rejects "parallel universes": parallel
lines never meet, so parallel realities could not interact. Realities meet at
right angles. Orthogonal lines make corners; corners make doors. This is why
DOOR facilities are round, why employees treat square objects as hazards, and
why "Do not stand in corners" is a safety rule.

> "Parallel realities are a comforting fiction. Parallel lines never meet.
> Adjacent realities meet at right angles — at corners. Every corner in every
> room is a potential door. This is why Department facilities are round."

Uncontrolled thresholds now connect Earth to alternate dimensions, fiction,
folklore, cryptid habitats, alien worlds, Heaven, Hell, the past and the
future. Their inhabitants leak into Canon Reality; the escalating global
conflict is the **Entropy Wars**. In the engine the wars are fought
"everywhen" (every battle happens somewhen between 12500 BC and 3333 AD —
the loading screen already says so) by the SPACE, TIME and CHAOS factions
using vessels pulled through doors, and **entropy is a literal resource**:
the team gauge that fills as a battle rages and discharges as the ENTROPY
STRIKE (battle.js ~8676). That mechanic is the lore.

DOOR officially denies the existence of ogres and elves. They never appear;
the institution considers them offensively overused. (The roster's *machine
elves* are, per DOOR, "not elves. There is a form.")

## A2. DOOR's role, and the secret underneath

**What DOOR says it is depends on which department you ask** — but one
canonical spine holds underneath:

| Asked of… | The answer | True? |
|---|---|---|
| Customs & Admissions (the public face) | **Peacekeepers / referees.** "We do not fight the war. We process it. Every crossing is inspected; every entity is filed." | True as far as the clerks know. The battle IS the inspection: an entity's processing is the match. |
| Records (the Codex) | **Archivists.** "We only keep the file." | True and useless. |
| The Shop / declassification | **Arms dealers**, by any honest reading: DOOR hands officers ever-stranger entities to fight each other with, for Hazard Pay. | True. The memo calls it "asset reassignment". |
| Bureau of Continuity ("the Canon Office") | **Janitors.** They clean up the drift (the Mandela Effect) that entropy leaves in reality. | True. They are the only department that suspects WHY there is so much to clean. |
| The Openers (the hidden hand) | **Profiteers — not in Hazard Pay.** A customs agency collects a duty on every crossing. DOOR's duty is paid in entropy. | The institutional truth. **"Every crossing pays a duty. The duty is entropy."** |

**The metaphysical law (the brief's spine, which the duty sits on top of):**
reality conserves both **connectivity** and **orthogonality**.
- DOOR cannot change the total number of connections between realities.
  Seal a passage from A to B and another forms elsewhere; force one open and
  another closes. "When one door closes, another opens" is a literal
  statement of physics.
- The same holds for corners. Removing a corner does not destroy it; the
  orthogonality reappears somewhere else.

This is why the war cannot end: Closers unknowingly create new openings,
Openers unknowingly cause other passages to close, and each side produces
endless evidence that the other is making reality worse. DOOR's greatest
institutional mistake was treating **displacement as elimination**: decades
of renovating a round headquarters did not remove its corners; it
concentrated them beneath the facility (→ H-Wing, A6). DOOR has preserved
Canon Reality by exporting danger elsewhere, and has been collecting the
entropy the traffic generates the whole time. What it collects it FOR is the
late-game question.

Why the player fights, in-fiction: entities cannot be filed until they have
been "tested in the field". The battle is the customs form. That is the only
piece of jargon that needs to exist, and it lives in memos, not the HUD.

## A3. Factions

Two layers, deliberately separate:

**The war factions (existing game data, unchanged):** SPACE / TIME / CHAOS —
the sides vessels fight for; also the optional DESK question on the ID card.

**The ideological factions inside DOOR** (cut across rank; everyone knows the
conflict exists, few admit allegiance; Openers and Closers routinely
sabotage each other's operations):

| Faction | Belief and virtue | Danger and hypocrisy | Stamp |
|---|---|---|---|
| **CLOSE** — Containment and Lockdown of Orthogonal Spatial Events (the **Closers**) | Canon Reality and vulnerable ecosystems must be protected from cross-reality contamination. | Containment condemns innocent outsiders and merely relocates the next breach. | **DENY** |
| **OPEN** — Orthogonal Passages Exploration Network (the **Openers**) | Doors enable refuge, freedom, knowledge and exchange. | Careless contact can destroy both societies; opening one passage silently closes another. | **ADMIT** |
| **HINGE** — Harmonic Interdimensional Neutrality and Gateway Equilibrium | Opening and closing must be balanced because connectivity is conserved. | Secretly choosing WHERE unavoidable disasters land makes HINGE an unaccountable technocracy. | **HOLD** (proposed, see C) |

Closers vs Openers is the spine (rev 2 decision, kept). Closers believe the
peacekeeper story; Openers know the leak is the product; HINGE understands
more than either but is not morally correct by default. The thematic
question is not "open or closed": a working door must do both. The question
is **who gets to operate it, and who bears the consequences.** Every
faction stays sympathetic, compromised and capable of harm.

In documents: a memo's stamp quietly tells you which hand wrote it. Early on
every memo is DENY; ADMIT memos start appearing mid-game; HOLD appears when
HINGE is revealed. Openers and Closers are never named in official documents.

## A4. Rank ladder = clearance L1–L6, and the office door

Ideology is separate from rank. Rank is story progress and is NOT the ELO
rank (Iron→Grandmaster stays). The engine already stores it as
`profile.door.clearance` (1–6) and prints it on the ID card and the
main-menu strip; only the TITLES change (Part C, decision 1 — **DECIDED
2026-09-03**; the shipped strings in data.js `DOOR_TEXT.CLEARANCE` still
read PROBATIONARY…KEYHOLDER until the next data.js delivery, which should
bundle the six-string edit):

| Lvl | Rank | Who they are | Your office door (the promotion you can see) |
|---|---|---|---|
| L1 | **DOORMAT** | interns, probationary hires, disposable assistants | warped janitor's-closet door with a vent (your office is a converted closet) |
| L2 | **DOORSTOP** | junior permanent staff who can obstruct requests but rarely decide | cheap hollow-core door |
| L3 | **KNOCKER** | field agents who investigate new thresholds and make first contact | a proper white office door (the wired-glass double was retired 2026-09-04: one mesh, no swing) |
| L4 | **KEYHOLDER** | trusted staff with meaningful clearance | security door with keycard reader |
| L5 | **GATEKEEPER** | managers who control access to people, information and realities | frosted executive glass (a single leaf since 2026-09-04, so it swings; the double pair is in the pool) |
| L6 | **THE DOORMAN** | the mysterious title of the agency's highest authority | a biometric seamless threshold that barely resembles a door — while the actual Doorman has an ancient battered wooden door nobody comments on |

The reference sheet `docs/door-hq/ref/office_doors_sheet_v1.*` (six doors in
curved-wall panels with a light above) is this ladder, drawn.

## A5. Departments → rooms (canonical table)

This table is the contract between fiction and the HQ build plan. Every
department is a room; every room hosts existing game functions (no renamed
game words — the Shop stays the Shop inside the Quartermaster's office).

| Department / room | Ring | Hosts (existing screens) | Voice |
|---|---|---|---|
| **Central Egress** | Operations | the hub itself; leaderboard wall ("EMPLOYEE OF THE MONTH"); building directory; stairs down; elevator | round hall, DOOR cube hanging overhead, round dispatch desk in the middle |
| **Dispatch (BELL console)** — the central desk | Operations | Quick Play (ranked queue = "a BELL call"); Friendly Match (the desk phone = "call a colleague", room code) | "Filing jurisdiction claim…", hold music |
| **Containment Bays** (6 sector doors off the egress) | Operations | mission doors = VS CPU on a launch map with that map's native entity pool; later Code Red events | thresholds that look like absurdly wrong doors |
| **Customs & Admissions / Quartermaster** | Operations | Shop (declassify vessels); Party Builder (manifests, the locker) | the player's original desk; "asset reassignment" |
| **Reception / Intake (HR)** | Support | Profile = employee ID card; the three profile slots on a lanyard; onboarding | forms, laminator, LOST CARD FEE |
| **Records / Archives** | Support | Codex (entity dossiers, later site files); Replay (the tape library); Community Maps ("unfiled sites") | "We only keep the file." |
| **Medical** | Support | Challenge-run services (the campaign shop's Services tab: revives, retries); where EXITED operatives are processed | classic JRPG church / Pokémon Center, DOOR-style |
| **Arcane Engineering / Cartography** | Operations | Map Editor; Spell Library (dev); balance lab | research offices, the fourth door that wasn't there yesterday |
| **Your office** | Support (L1–L3) → Executive (L4+) | Case file / story progress; memos (in-tray, fax); achievements as wall plaques; stats | starts as the janitor's closet (cot, mop bucket, CRT, phone, drain) |
| **Bureau of Continuity ("Canon Office")** | Executive | canon notices; the motto plaque (reality barometer); late-game Internal Affairs contact | the only department that suspects the schedule |
| **Training Facility** (downstairs) | Training | **the Training Room** (tutorial / Orientation / practice; the ONLY approved square room — an 8×8 grid, notoriously leaky); Challenge (Gauntlet, Survival); Mystery Dungeon (a condemned crossing = the existing Guild Hub field office) | "ORTHOGONAL GEOMETRY EXPOSURE AREA · MAX OCCUPANCY 45 MINUTES" |
| **H-Wing** | sub-basement (late game) | the forbidden straight corridor; the childhood-home door; the Backrooms crossing | beige carpet, fluorescent light, cubicles, right angles |
| *(not a room)* Settings | — | stays an overlay (gear / Esc) | you do not walk to Settings |

Rivals with a presence in the building: the **Men in Black** ("the other
agency", "the Cufflinks"; black sedans in spaces 1–4 that are not ours) and
**CERN** ("the Swiss"; took credit for the door DOOR built under them; the
Berenstain incident). The **Watcher** (shelved race, "I have watched long
enough… All leave cancelled") is a ready-made whistleblower.

## A6. The player's story

The player starts as a desperate, underqualified Doormat housed in a
converted janitor's closet. Missions raise their rank, open new parts of
headquarters, and reveal increasingly classified versions of reality.

The player grew up believing both parents died in incidents built around
opposite kinds of doors: one in a house fire because a closed door prevented
escape; the other in a home invasion made possible because he left a door
open. The truth: both worked for DOOR and represented opposing philosophies.
The first was a Closer who knowingly died holding an extradimensional
threshold shut during the "fire". The second was connected to the Openers
and died after letting someone or something through; DOOR recorded it as a
mundane home invasion. **User decision:** DOOR did not order either death —
it falsified the aftermath as routine collateral damage. That is the crime.

Late in the story a door in H-Wing leads to the childhood home. The player
may witness their younger self mourning, or glimpse a reality where both
parents survived. This is the emotional centre, not another conspiracy
reveal. By the climax the player learns no faction can abolish the crisis
and DOOR has preserved Canon Reality by exporting danger elsewhere. The
final conflict forces a decision about responsibility and control, not
"open everything" vs "close everything". **User's favoured ending seed:**
the player becomes the Doorman — and the Doorman was the janitor all along
(which is why the office is a closet, and why the Doorman's door is old).

**H-Wing** is a forbidden straight corridor beneath the facility: perfect
right angles, beige carpet, fluorescent lights, cubicles, many doors — older
and more stable than the round headquarters. It is the physical
accumulation of every corner DOOR removed during decades of institutional
"corner-cutting", proof that the agency displaced the danger rather than
solving it. Its stability raises the question: if right angles cause leaks,
why did DOOR originally operate from a rectangular facility?

## A7. Motto and Mandela effects

There is supposedly one official motto; its wording changes with reality.
Openers preserve archive versions beginning **DO**; Closers preserve equally
convincing versions beginning **DON'T**. Three principal forms:

- Early: **DO Observe Other Realities.**
- Middle: **DON'T. Open. Observe. Report.** (employees insist this was
  taught at orientation)
- Late / crisis: **DO OPEN OUR REALITY.**

The motto appears on posters, plaques, loading screens, manuals and beneath
the seal; its current form is a reality barometer. When asked for the true
motto a HINGE member says, "Depends which side of the door you're asking
from." The official name stays **Department of Orthogonal Realities**;
"Doors Open Other Realities" is a recruitment backronym, and the running
joke is that the D can mean Do or Don't depending on institutional
convenience. Customs & Admissions' departmental slogan (already on the title
page) stays: "EVERY CROSSING IS INSPECTED · EVERY ENTITY IS FILED". "As
above, so below" (the game's tagline) pairs with DOOR's "As here, so there".

Canon gags: DOOR's founding date differs between documents (1947 / 1954 /
1974 / 1987) and the Canon Office keeps "correcting" it; the loading
screen's random year is labelled CANON DATE · SUBJECT TO REVISION (shipped);
the Berenstein spelling is non-canon.

**Unreliable layout.** Headquarters stays perfectly consistent long enough
to be memorised. Then tiny unannounced changes begin: a vending machine
moves, a hallway lengthens, Research gains a fourth door, an employee
insists Containment has always been counterclockwise. Eventually departments
exchange positions. The circular layout makes this hard to verify.

## A8. Vocabulary

**The short list of DOOR words the game needs** (everything else keeps its
plain game name — Victory is Victory, the Shop is the Shop):

| Word | Meaning |
|---|---|
| crossing / door / threshold | what CERN calls a portal. DOOR never says "portal"; it gets red-penned. |
| the Department | how employees refer to DOOR |
| Closers / Openers / HINGE | the hands; never named in official documents |
| DENY / ADMIT (/ HOLD) | the desk stamps; which one a memo bears tells you who wrote it |
| canon / non-canon | the Canon Office's ruling on what happened |
| clearance (L1–L6) = rank | story progress on your ID card (NOT ELO) |
| case file / directive | your current story objective and its payoff |
| vessel / declassify / Hazard Pay | already in the game. Keep. |
| Code Red | an unauthorised character appearing somewhere it does not belong (a doorbell announces it) |
| EXITED | HR classification for an operative stranded in another reality (Extradimensional Incident Transfer) — also the word for a disconnect |

**Acronyms kept** (user: "just the best ones or ones that make sense with
gameplay"): **BELL** (Boundary Event Location and Logging — the sensor
network; "a BELL call" = the ranked queue / a Code Red alert), **KEY**
(Kinetic Extradimensional Yoke — the in-match objective AND the long-term
progression unlock), **LOCK** (Local Orthogonal Containment Key — HINGE's
tool; freezes a threshold's state without closing it), **EXIT/EXITED**
(above). **Reserve, use sparingly or not at all:** KNOCK (incident software),
KNOB (which reality is connected), FRAME (alignment meter), STOP (permit).

Every recruit receives a protractor; veterans still carry theirs. "Check
your corners" is a safety rule and a threat. Exactly 90° provokes fear:
"It's 90 degrees." / "Oh shit."

Aphorisms: "A door that can never open is a wall. A door that can never
close is a hole." · "When one door closes, another opens." · "I wouldn't
mislead you. I'm an open door." / "You mean book?" / "…Yes." Doorbells
signal institutional alerts; slow knocking signals something intimate or
dangerous on the other side. Use door language (lock, key, knob, frame,
doormat, revolving door, trapdoor, cutting corners, unhinged) sparingly
enough that serious scenes keep their weight.

## A9. Arena objectives ↔ the engine (this already fits)

The brief's three victory philosophies map onto Arena's EXISTING win
conditions (state.js `MULTIPLAYER_MODES.arena.winConditions`:
`tower_destroyed`, `hourglasses_collected`, `wipeout`, plus the 3-Nexus
hold). Reskin the layer, not the engine:

| Brief | Engine today | Philosophy | Change needed |
|---|---|---|---|
| **Wipeout** — eliminate the opposing team / invaders; the threshold stays open | `wipeout` | Opener | none |
| **Destroy the Cube** — destroy the Saturnian Black Cube anchoring the threshold | `tower_destroyed` (the tower) | Closer | the tower's model/label becomes the Black Cube (its many corners anchor the threshold) |
| **Secure three Keys** — find the scattered Keys and stabilise the threshold | `hourglasses_collected` (`winHourglasses`) | HINGE | hourglasses become KEYs (model + label); recovered Keys also count toward long-term progression and open restricted HQ doors |
| Hold all 3 Nexus zones | 4th win condition | — | user's proposal: holding the Nexus doubles damage to the Cube instead of winning outright (engine change — decide later, Part C) |

A player should keep useful Key progress even when the match ends another
way. Each map has a native enemy pool (`DOOR_TEXT.POINT_OF_ENTRY` reversed
by `doorSiteCrossings`) — demons in Hell, angels in Heaven — which is what
its mission door spawns. Cleared maps later receive **Code Red** anomalies:
an unauthorised character somewhere it does not belong, announced by a
doorbell, giving a reason to revisit.

## A10. Location anchors ↔ launch maps (the six containment bays)

The 29 launch maps (`EW_MAP_META`, each with a `SITE_FILES` customs file
and a hand-authored 8×8 Δ board) group into six sector bays. Story anchors
in bold. Grouping is a proposal (Part C, decision 4).

| Bay | Door light colour band | Maps |
|---|---|---|
| **TERRESTRIAL** (clandestine / urban) | amber | Nuketown (the suburban closet door), **Area 51** (the MIB's rival account), Skinwalker Ranch, Bohemian Grove, D.U.M.B., **CERN**, Vatican City, Football Stadium |
| **ANCIENT** | amber | Stonehenge, Pyramids of Giza, Tower of Babel, Göbekli Tepe, **Camelot** (the Round Table was early HINGE technology with no privileged side), Technoticlan, Atlantis (the wet submarine bulkhead) |
| **HOLLOW** (inner earth + polar) | amber | Mount Shasta, Hollow Earth, Agartha, **Antarctica** (the first Black Cube DOOR claims to have destroyed), North Pole |
| **CELESTIAL** (space + the far future) | amber | Mars, **the Moon** (a door standing without a wall; footprints from missions that never happened), Cyberpunk City |
| **DIPLOMATIC** (mythic ecosystems, "immunity claimed") | amber | **Heaven**, **Hell**, Mount Olympus, Fairy Forest |
| **QUARANTINED** (astral anomalies) | red until cleared | **Backrooms** (→ H-Wing, C-12), Flat Lands, (the Desert threshold — an isolated absurd door where no structure should exist — is a future map) |

Community/custom maps are "unfiled sites" in Records, not bay doors.

## A11. Story delivery and scope

Chapter 1, **Minimum Qualifications**, is the tutorial (= Orientation, the
VHS tape). After it the full game opens and the story advances through
milestones earned in ANY eligible mode, online PvP included:

**Play matches → earn Story Progress → reach a threshold → post-match scene
→ next milestone (and, at rank milestones, a promotion).**

Story advancement must never REQUIRE PvP victories; winning accelerates.
Baseline scoring (tune later): complete a match +10 · win +5 · complete a
special objective (any non-wipeout win condition, or a Key secured) +3 ·
use a story-relevant character +2. Other valid contributors: XP, turns,
objectives, team combinations, damage/healing/support. Optional scenes react
to favourite characters, pairings, achievements and play history.

Targets: 10–15 chapters, 50–80 core scenes, ideally 60–75 scenes totalling
1.5–2.5 hours. Normal scenes 30–90 s, important scenes 2–3 min, reveals and
finales 3–6 min. Expensive cinematics only for the opening, major reveals,
chapter finales and the ending; everything else uses reusable models,
portraits, animations, environments, camera work, dialogue UI, music,
doorbells and knocks.

### Narrative spine

**Act I — Recruitment and containment.** A battered VHS recruitment tape
explains orthogonal realities with cheerful training graphics (parallel
lines get a JURISDICTION DECLINED stamp; two perpendicular lines form a
door; an entity waves from the intersection; a square sandwich triggers an
alarm). The narrator explains the viewer applied, was referred, was
abducted, or was miscategorised by HR, then welcomes "what remains of our
standards". Three knocks from a darkening corner; "Please do not turn
around." The player turns around: the tutorial breach. The Doormat learns
the three objectives, handles early anomalies, and joins the first
"successful" destruction of a Black Cube in Antarctica. Early clues connect
the parents to DOOR.

**Act II — Competing realities.** Rank rises; locations get more
impossible; faction sabotage makes every mission an internal proxy war.
Area 51 gives the MIB's version (DOOR is the reckless conspiracy). Camelot:
the Round Table was HINGE tech. The Moon: a freestanding door and impossible
footprints. Heaven, Hell, the Backrooms and others broaden the conflict
without a single authoritative cosmology. Headquarters shifts, mastered
doors become shortcuts, Code Reds put characters in the wrong worlds, the
motto changes, and the player starts remembering realities everyone else
has forgotten.

**Act III — The displaced corners.** Evidence points to the conservation
law and HINGE's hidden role in choosing where displaced breaches land. The
player finds H-Wing, learns DOOR's safety measures only exported
orthogonality and suffering, and reaches the childhood-home threshold. The
truth about both parents reframes Openers and Closers as inherited halves
of the player's own conflict. The crisis motto becomes DO OPEN OUR REALITY.
The climax brings all three arena philosophies into the plot and makes the
player confront who is entitled to choose which worlds are connected,
sacrificed or protected.

## A12. Tone rules

1. Play the absurd bureaucracy straight: impossible horrors handled with
   procedural irritation and a clipboard.
2. Comedy supports the danger; parent scenes, refugee dilemmas and faction
   consequences are sincere.
3. Institutional claims sound confident but are not necessarily true. DOOR
   controls the definition of "canon", not objective reality.
4. Reveal lore through altered spaces, props, mission objectives and
   conflicting records — not only exposition.
5. Every faction sympathetic, compromised, capable of harm.
6. Use retro limits on purpose: VHS artefacts, low-poly silhouettes, looping
   office animations, abrupt loading transitions, uncanny reused assets.
7. No ogres, no elves. Their absence is a recurring joke, never a mystery.
8. Keep future writing compatible with a low-budget match-based game: the
   story enriches battles; limited exploration is concentrated in HQ.
9. Redaction rule: never redact the joke.

## A13. Intentionally unresolved (with the user's current leanings)

- Who or what is the Doorman, and why is their door older than headquarters?
  *Leaning: the janitor.*
- Is "Saturnian" the Cubes' true origin or DOOR's esoteric classification?
- Why was the original rectangular facility stable?
- Is Canon Reality special, or just the reality with the bureaucracy
  powerful enough to declare itself canon?
- Mastery of a map: *leaning: win on that map by every win condition, or
  recruit/unlock every creature native to it* (the HQ plan implements the
  first as v1 and can add the second).
- The final choice about where unavoidable breaches are distributed.

---

# PART B — INTEGRATION LAYER (where DOOR plugs into existing surfaces)

## B1. Standing rules (rev 2–4 decisions, all still in force)

- **Do NOT rename the game.** Victory/Defeat/Shop/Codex/Party Builder keep
  their names. DOOR is a *layer* (seals, stamps, memos, voice) on top of a
  turn-based fighting game. Dropped for good: "deputized assets",
  "requisitions", "petty cash", "processing event", renamed menu buttons.
- **The ONE renamed thing is the currency: 'Hazard Pay'.** Every
  player-facing gold label says Hazard Pay; the 💰 icon is the unit mark
  (`💰 +40`, never "HP"). Code identifiers (`account.gold`, `GOLD_PER_KILL`,
  D1 column `gold`), the Gold ELO tier, the Gold achievement rarity and CSS
  colour names are NOT renamed.
- Stamps stay — as visuals that land NEXT TO the real words.
- Story must be advanceable from online PvP as well as solo play.
- Keep every plain game word; edit both lore copies (ui.js `_CODEX_LORE`
  and the shortened copy in party-builder.js); new asset paths get new
  filenames; `npm test` before delivery; every R2 delivery bumps `?v=`;
  anything shown mid-match to both players is relayed (RULE #2).

## B2. Surfaces (status: ✅ shipped · ◐ partly · ○ not started)

- **✅ Employee ID card = the profile.** `CreateProfileModal` profile.js is
  the intake form (CALLSIGN, EMPLOYEE NO. from an FNV hash of createdAt,
  DEPARTMENT, CLEARANCE, ISSUED canon date, PHOTO = most-played race's
  `RACE_PORTRAITS` entry else PHOTO PENDING, DESK SPACE/TIME/CHAOS, the
  Mandela checkbox → FLAGGED). Profile header shows the card (click to
  flip); the back collects stamps; delete confirm carries "LOST CARD FEE:
  5,000 Hazard Pay". Clearance is story progress, never ELO.
- **✅ Codex → header says D.O.O.R. RECORDS · ENTITY REGISTRY.** Every
  dossier has a customs status stamp by type (human DOMESTIC · alien
  FOREIGN NATIONAL · anomaly UNDOCUMENTED · divine/unholy DIPLOMATIC · tech
  IMPORTED, plus per-race overrides — Santa NATURALIZED, Honda Civic
  IMPORTED, Politician DOMESTIC "unfortunately") and a POINT OF ENTRY (one
  of the launch maps). Locked entries show stamp + redaction block only.
  Dossier section 5 = customs disposition + D.O.O.R. ANNOTATION.
- **✅ Loading-screen cards.** `LS_HINTS` (battle.js) rotation gained
  INTEROFFICE MEMORANDUM and CANON NOTICE cards (stamped DENY/ADMIT; ADMIT
  hidden below clearance L4) and now LEADS with the current map's SITE
  FILE. Canon-date label under the random year.
- **✅ Title + main menu.** Seal placements; the 4.3 s CSS ident (studio
  card → feature) with the synthesised sting; CLEARANCE tag on the ELO
  strip. `mainTheme` is real music (setup phase + battle pool) — a DOOR menu
  theme is a NEW track, not a placeholder fill.
- **✅ Result screen.** After the title animates in, a rubber stamp thunks
  down: seal + CASE CLOSED (green ink win / red ink loss) or VOID
  (no-contest), case number, canon date. `.directive` tab for the story
  track is styled and waiting. Local on both clients — no relay.
- **✅ Shop.** Header "D.O.O.R. · SHOP"; purchase confirm is a DECLASSIFIED
  stamped form.
- **✅ Pre-match screens.** match-select.js: the map panel is the SITE FILE
  (case no, FIRST CROSSING date, status stamp, jurisdiction, summary, KNOWN
  CROSSINGS chips); CONFIRM thunks a FILED stamp. party-builder.js: seals,
  MANIFEST sub-label, FILED slot stamps, numbered dossier tabs.
  **Voice rule for site summaries** (user feedback, three drafts): the REAL
  place and its lore, loosely educational, ~300 chars, written by an officer
  with an opinion — one or two dry lines, at most one Department reference.
  Full memo voice = "too wordy and cheesy"; bare facts = "too Wikipedia".
- **○ PvP has an in-fiction reason.** Online = two field offices claiming
  the same crossing and "settling it in the field", or DOOR vs the other
  agency. Queue line "Filing jurisdiction claim…", DOOR hold music (new
  `_R2_MUSIC` key — user-made or synth loop, undecided), the opponent's ID
  card on the VS splash (index.html:476 — relayed, RULE #2).
- **○ Mystery Dungeon hub = a DOOR field office** (map.js `md_hub`
  dressing; cosmetic) — in the HQ plan this becomes the "condemned crossing"
  door in the Training Facility.
- **○ Tutorial = ORIENTATION, DAY 1.** VHS tape ("D.O.O.R. ORIENTATION ·
  TAPE 1 OF 1 · 1987 · BE KIND, REWIND"), tracking lines, chipper narrator,
  FIELD MANUAL bullets; mistakes earn a memo, not a fail; ends with the card
  being laminated and Directive 1. The ident's VHS OSD / tracking CSS is
  reusable. Played in the Training Room (HQ plan).
- **◐ System text in DOOR voice.** Intake errors done; disconnects
  ("CROSSING UNSTABLE — re-establishing"), rate limit ("Too many forms.
  Please take a number.") open. A disconnect is an EXIT event.
- **○ A DOOR officer as a playable race** (later): support-controller —
  DENY ENTRY (knockback), RED TAPE (root), STAMP (mark), PAPERWORK (AP
  drain), FORM 90 (turn a tile into a corner — a mini door that teleports).
- **◐ Headquarters** → `DOOR_HQ_BUILD_PLAN.md`. Phase 1 complete
  (2026-09-03): **Play enters the Central Egress**; the six bay doors
  launch VS-CPU crossings (Arena, 4v4 on the site's Δ board, CPU = the
  site's native entities; DEEP = the full map); every screen's Back and
  the result overlay come back to the building at the door you left
  through; bay lamps go green from real mastery flags written at match
  commit. `?nohq` / Settings toggle keep the classic hub. Phase 2.6
  (2026-09-03): the six bays are walkable corridors with one threshold
  door per site (the site file on its panel). **Phase 3 complete
  (2026-09-04): doors mean something** — Keys (= hourglasses secured)
  gate the elevator and the Canon Office on top of rank; one **Code
  Red** a day puts an entity filed elsewhere behind a stabilized
  threshold (doorbell, strobing lamps, the entity pinned to the CPU
  roster, +200 Hazard Pay on a same-day win); a promotion is acknowledged
  by the building (PA chime, PERSONNEL NOTICE, PROMOTED stamp, the new
  office door).

## B3. Story track (mode-agnostic; reconciled model)

**Hybrid model (user decision 2026-09-03).** The story is single-player
at heart — it lives in the facility — but PvP feeds it. Two kinds of
trigger, both required where a chapter lists both:

- **Story Progress (SP)**: one number, `profile.door.sp`, fed by the A11
  scoring from EVERY mode including online. Chapter thresholds are a table
  in data.js (`DOOR_TEXT.CHAPTERS`, ~12 entries: `{sp, title, scene,
  promoteTo?, requires?}`).
- **Field requirements** (`requires`): things only done in single player
  by moving through headquarters — walk through a specific door (the
  Antarctica threshold), complete a specific mission on its map, visit a
  room (the Canon Office), find H-Wing, secure N Keys. A chapter whose SP
  is reached but whose field work is not shows in the office in-tray as
  **AWAITING FIELD WORK** with the requirement named; its scene fires from
  the facility the moment the requirement completes (at the door, not
  post-match). A PvP-only player therefore banks SP endlessly but must
  walk into the building to cash it in — which is where they land after
  every match anyway.

Reaching an SP threshold (with no `requires`, or with them already met)
sets `door.pendingDirective`; the result screen's stamp grows the NEW
DIRECTIVE tab; on leaving the result screen the scene plays through the
existing `playCutscene(script)` (battle.js:11336 —
`{location, subtitle, speakers:{key:{name, race|sprite}}, lines:[{direction:
'location_card'|'battle_start'|'fade_in'} | {speaker, text, enterNew}]}`),
skippable; "Find Next Match" waits for it. `pendingDirective` is written
BEFORE the scene plays so a crash replays it from the office next time. Both
online players evaluate their OWN profile locally — nothing to relay.

**Rank (clearance L1–L6)** is promoted at chapter milestones (`promoteTo`),
so PvP-only players reach the Doorman without touching a solo mode.
Promotion = `paChime`, a new office door, a stamp on the card back, new HQ
access. **The moment itself shipped 2026-09-04** (HQ plan 3.4): whatever
writes `door.clearance`, the building notices on the next entry
(`door.hq.seenClearance`) and plays the ceremony; the story track only
has to set the number (`window._doorPromote(n)` is the hook).

**Case files** (the rev-6 per-level checklists — win 5, defeat 3 MIB, play
CERN, land 5 Entropy Strikes, declassify 3, reach MD floor 5, Gold rank…)
survive as **commendations**: optional checklists in the office that pay
bonus SP and card stamps. They are accelerators, never gates. Thresholds
read `career` / `raceStats` / achievements / `progress.counters` first; add
a counter only when none exists.

**Scripted directive matches** (the rev-6 beats: an all-MIB roster at Area
51; "correct the record" at CERN) launch from the office as VS-CPU matches
with fixed map + roster via the Challenge run's fixed-level plumbing. Never
forced right after an online match.

**Data shape.** `DOOR_TEXT.CHAPTERS`; profile `door: {clearance, desk,
flagged, memosSeen, pendingDirective, cardStamps, choice}` (shipped) plus
`sp`, `chapter`, `commendations`, `hq` (HQ plan). Backfilled in
`defaultProfile()` like `account` was.

## B4. Assets: what the user makes vs what Claude builds

**User-made (non-negotiable):** the seal (done — four PNG exports on R2
`Assets/door/`), and now the HQ backgrounds + door sprites (spec in the HQ
plan §5). **User-made eventually (Claude ships a placeholder first):** ident
jingle (synth placeholder shipped), DOOR menu/hold muzak, handler portrait
(the CSS silhouette with a redaction bar might be the final joke).
**Claude builds in existing files:** rubber stamps (SVG + `#doorInk`
filter), ID card, clearance badges, department seals, the paper kit (memo
letterhead, carbon tints, tractor-feed edge, fax header, redaction bars,
coffee ring), VHS overlay, the Web Audio SFX kit (`playDoorSfx`: stamp,
denied, laminate, crtOn, vhsEject, dotMatrix, fax, paChime, doorBuzz,
identSting — the last four still unwired, reserved for memo print-out,
directive arrival, promotion, and door/room transitions), all text.

---

# PART C — RECONCILIATION (where the two docs disagreed)

Decisions marked **REC** are Claude's recommendation awaiting the user's
yes/no; **USER** are the user's own calls from the brief.

| # | Topic | Brief said | DOOR_DESIGN said | Resolution |
|---|---|---|---|---|
| 1 | Rank titles | Doormat → Doorstop → Knocker → Keyholder → Gatekeeper → the Doorman | clearance L1–L6: PROBATIONARY, CLERK, OFFICER, INSPECTOR, AUDITOR, KEYHOLDER (shipped strings in data.js `DOOR_TEXT.CLEARANCE`) | **USER 2026-09-03: the brief's six titles, 1:1 onto L1–L6.** Same field, same card, a six-string edit in data.js — bundle it with the next data.js delivery (HQ Phase 1). The office-door ladder is the visible promotion. |
| 2 | Factions | OPEN / CLOSE / HINGE (three, with acronyms) + the conservation law | Closers vs Openers (two hidden hands), DENY/ADMIT | Both: Closers/Openers remain the spine and the two stamps; HINGE is the third, revealed mid-game, with its own stamp. **REC: HINGE's stamp is HOLD** (the LOCK freezes a state without closing it). |
| 3 | DOOR's secret | conservation law; DOOR displaced the danger (H-Wing) | "every crossing pays a duty; the duty is entropy" | Both, layered: the law is the physics, the duty is the motive. What DOOR collects entropy FOR is Act III's question. |
| 4 | Story gating | Story Progress points; never require PvP wins | per-level case-file checklists gate promotion | **USER 2026-09-03: hybrid.** SP is earned in every mode, PvP included, and is the main gate; certain chapters ALSO require single-player field work in the facility (enter a given door, clear a given mission, find a room). The rev-6 checklists become optional commendations. The facility and the story lean single-player; PvP feeds the meter (B3). |
| 5 | Arena objectives | Wipeout / Destroy the Cube / Secure three Keys; Nexus unclear | (not covered) | Reskin, don't re-engineer: tower → Black Cube, hourglasses → Keys (A9). **USER (tentative): Nexus hold → double Cube damage instead of a win** — engine change, schedule separately. |
| 6 | The player | underqualified recruit, Doormat, janitor's closet, DOOR parents | newly hired officer at Customs & Admissions, DESK question | Both: the desk is at Customs & Admissions; the office is the closet; intake form unchanged. |
| 7 | Motto | three shifting forms as a reality barometer | "As here, so there"; customs slogan | Both (A7): the motto is the barometer; the customs slogan is Customs & Admissions' own. |
| 8 | Acronym list | eight (BELL…EXIT), "keep the best" | short vocabulary only | Keep BELL, KEY, LOCK, EXIT; reserve the rest (A8). |
| 9 | Headquarters | the hub: rooms, doors, lights, unreliable layout, H-Wing | a bulletin-board case-file screen; MD hub dressing | The HQ is real and replaces the Play hub → `DOOR_HQ_BUILD_PLAN.md`. The case-file screen becomes the office desk. |
| 10 | Tutorial | VHS recruitment tape; "please do not turn around" | ORIENTATION, DAY 1 (VHS) | Same beat; it plays in the Training Room. |
| 11 | Elves | none, ever | *machine elves* is a roster race with DOOR lore | **REC: keep the race; DOOR's position is "machine elves are not elves; see Form 12"** — the joke, not a rename. |
| 12 | Backrooms | H-Wing "would essentially replace the Backrooms map" | Backrooms is a T3 launch map with a site file | **REC: keep the map; it is what lies beyond the H-Wing door** — the site file gets re-filed as "H-WING (SUBLEVEL)" when H-Wing opens. Decide when Act III is outlined. |
| 13 | Currency | (silent) | Hazard Pay | Hazard Pay stays. |
| 14 | Mastery rule | "probably winning with all win conditions, or recruiting all native creatures" | (not covered) | v1 = all win conditions on that map (HQ plan §3); v2 may add the roster rule. |
| 15 | Rings / vertical layout | (ChatGPT board: Executive / Operations / Support / Training) | (none) | Adopted as the HQ's floor plan (A5). |

---

# PART D — BUILD LOG (anti-"start over" memory — append on every DOOR session)

### 2026-09-02 — step 1 (visual layer) implemented
Seal exports on R2 `Assets/door/` (user-made, 4 PNGs): `DOOR_Colored_Logo_
ForBlackBG.png` (white text — dark bg ONLY), `DOOR_Colored_Logo.png` (black
text — paper/light), `DOOR_ColoredAndBlackLines_Logo.png` (black cube grid —
mid-tone), `DOOR_BlackAndWhite_Logo.png` (all black — gov-doc look AND the
alpha mask for ink-tinted stamps: CSS `mask-image` + `background: currentColor`).
Which one goes where: dark → title/menu/codex/shop headers + onboarding;
light → the ID card crest; mono → result-stamp seal, card-back watermark.

Where the code lives (no new game files — RULE #1):
- **data.js `DOOR_TEXT`** (end of file) — ALL new DOOR copy in one object:
  LOGO urls, DEPARTMENTS, CLEARANCE L1–L6 titles, DESKS, CUSTOMS_BY_TYPE +
  CUSTOMS_OVERRIDES (per-race dispositions), POINT_OF_ENTRY for all 96
  races (site maps), DOSSIER_NOTES (the "D.O.O.R. ANNOTATION" paragraphs),
  MEMOS (`admit:true` = ADMIT-stamped, hidden below clearance L4),
  CANON_NOTICES, ONBOARD / INTAKE / SYSTEM copy, RESULT_STAMP words.
  Helpers: `doorCustomsStatus(race)`, `doorPointOfEntry`, `doorCaseNo(seed)`,
  `doorEmployeeNo(profile)` (FNV hash of createdAt), `doorClearance(profile)`,
  `doorCanonDate`. All on `window.*` too.
- **styles-base.css** (end) — `.door-seal*`, `.door-stamp` (+ `.admit`
  `.void` `.paper` `-sm` `-lg` `.thunk`), `.door-hdr*`, `.door-clearance-tag`,
  the whole `.door-card*` kit (CR80 aspect, cqw units, front/back flip, desk
  stripe via `--desk`, holo strip, sheen, barcode, FLAGGED stamp), intake
  form bits. Worn ink = SVG filter `#doorInk` defined in index.html (an
  element with `filter:url(#doorInk)` needs that def in the same document).
- **styles-cinematic.css** (end) — loading-screen `.ls-memo` / `.ls-canon`
  hint variants + `.ls-hint-stamp`, `.ls-canon` date label, the result
  `.door-result-stamp` (thunks in 1.05s after the title slam; bottom-right,
  above the button bar; `.directive` shows the NEW DIRECTIVE tab — unused
  until the story track).
- **index.html** — title-page static seal (`.door-title-seal`, the animated
  ident is step 2), main-menu seal top-right, codex header sub-line
  "D.O.O.R. RECORDS · ENTITY REGISTRY", shop header "D.O.O.R. · SHOP",
  `#vicDoorStamp` in the result overlay, the `#doorInk` SVG filter.
- **ui.js** — `_codexHeroHtml`: customs stamp beside the faction stamp
  (shown on sealed files too; point of entry redacted when locked), POINT OF
  ENTRY on the doc line; `_codexDoorSection` = dossier section 5 (customs
  disposition + annotation); footer watermark; shop confirm bar = stamped
  form (DECLASSIFIED thunk); onboarding copy from DOOR_TEXT.ONBOARD.
- **party-builder.js** — customs stamp next to the doc number in the forge
  dossier (reads the same DOOR_TEXT, so no second copy of the table).
- **battle.js** — `_lsDoorHints()` merges memo/canon cards into the
  loading rotation (shuffled pool), stamp chip on the tag; `.ls-canon`
  label under the random year; `_lsRandomYear` stores
  `window._lsCanonYear`; `_stampDoorResult(kind)` called from
  `showResultOverlay` (victory/defeat/void). Result overlay is local on both
  clients → no relay needed (RULE #2 satisfied).
- **profile.js** — `door` field (`defaultDoor()` + backfill); `DoorIdCard`
  React component (front/back), `doorCardPortrait` (most-played race's
  `RACE_PORTRAITS` entry, else PHOTO PENDING), `DoorBarcode`;
  `CreateProfileModal` = the intake form: live card preview, DESK
  (SPACE/TIME/CHAOS, optional) + Mandela checkbox (→ FLAGGED on the card),
  DOOR-voiced errors; profile header shows the card (click to flip) with
  rename beneath; delete confirm carries the LOST CARD FEE fine print.
- **map.js** — main-menu ELO strip gains `CLEARANCE L1 · PROBATIONARY`.

### 2026-09-02 (later) — polish pass before step 2
- **Currency label → Hazard Pay** (rev 4 decision). Touched: ui.js (shop
  confirm + disabled-unlock tooltip, Nexus capture/income log lines, dev
  grant button, editor price-tier help), battle.js (bounty banner/log/pop,
  achievement card/toast/banner rewards, kill pop, `_renderVicGoldBreakdown`
  "HAZARD PAY EARNED" + "Hazard Pay Collected", MD + Gauntlet/Challenge
  result tables, retry "not enough", FIELD MANUAL hint), map.js (Challenge
  map/shop stat labels + retry warning), party-builder.js (Plunder passive
  desc), profile.js (unlock error), data.js DOOR_TEXT (memo +
  `SYSTEM.lostCard`), server.js (two API error strings — Render redeploy).
  Identifiers/columns untouched; `npm test` parity still green.
- **Seal sizing pass** — every placement was too small. New sizes:
  title corner `clamp(76px,10vw,132px)` (was 38–56), main-menu corner
  `clamp(150px,18vw,270px)` (was 72–128), codex/shop header 64px (was 30,
  sub-line 9px), onboarding 136px (was 72), ID-card crest 27% wide capped
  at 42% tall (fields/barcode shifted to left:32% to make room), card-back
  watermark 46% (was 32), dossier watermark 52% (was 34), result stamp
  `clamp(176px,22vw,280px)` at aspect 0.96 with the seal at 50% of the box
  (was 36%). Loading-screen `.ls-hint-stamp` has no seal (text only) — left.

### 2026-09-02 (later still) — step 2: ident animation + DOOR sound kit
- **Ident** ("studio card → feature"). index.html: `#doorIdent` overlay
  inside `#titlePage` (grain, CRT line, seal ×3 for the chromatic split, two
  text lines, tracking bar, VCR OSD, skip hint); `#titlePage` starts with
  class `pre-ident`, which hides the title video + sprites (NOT the ENTER
  button / loading bar — the pre-load queued-click path is untouched) until
  the ident has played; the inline boot script clears the class after 20 s
  as a fallback. styles-cinematic.css (end): `.door-ident*` — 4.3 s timeline
  (power-on line 0–0.55 s, seal scale-in + red/blue split 0.3–1.6 s,
  department name types 1.25–2.15 s, tracking sweep + jitter at 1.9 s,
  PRESENTS at 2.35 s, tape-stop squish at 3.15 s, overlay fades), `.reduced`
  variant for prefers-reduced-motion (static card, 1.8 s). ui.js (right
  after `window._gameReady = true`): `doorIdentPlay()` / `doorIdentSkip()` /
  `_doorIdentAfter(fn)`; `DOOR_IDENT_MS = 4300` must match the CSS. Fires
  once per page load when the game JS is ready, unless an early ENTER click
  is queued. Click / Enter / Space / Esc skips (keydown guard sits in front
  of the existing title Enter handler). The window `load` title-theme
  autoplay is deferred through `_doorIdentAfter` so the sting is the only
  audio under the card. Kill-switches: `window.EW_DISABLE_DOOR_IDENT`,
  `?noident`, localStorage `ew_doorIdent='off'`; replay:
  `doorIdentPlay({force:true})`.
- **Sound kit**, audio.js (end): `playDoorSfx(key, {delay, volume,
  allowBeforeUnlock, noLate})` + recipes `stamp denied laminate crtOn
  vhsEject dotMatrix fax paChime doorBuzz identSting`, `stopDoorIdentSting()`
  (tape-stop on skip), `window.doorSfxAudition()` plays the whole kit in
  order from the console. Reuses `_audioCtx`; rides the SFX slider and the
  `audioUnlocked` gate; if the AudioContext is suspended it resumes and
  schedules when that settles (a gesture) or stays silent (cold load).
  On a cold page load the ident is therefore visual-only until the browser
  grants audio — by design, never an error.
- **Wired now:** result-screen CASE CLOSED / VOID stamp → `stamp` at 1.3 s
  (battle.js `_stampDoorResult`, local on both clients); shop confirm bar
  DECLASSIFIED thunk → `stamp` at 0.25 s (ui.js `_shopAskConfirm`); intake
  form rejections → `denied`, card issued → `laminate` (profile.js
  `CreateProfileModal.submit`); ident → `identSting`, skip → `vhsEject`.
  **Defined, not yet wired** (for the story track / HQ): `dotMatrix` (memo
  print-out), `fax` (directive arrival), `paChime` (promotion / clearance
  up), `doorBuzz` (room transitions, scripted-match launch).
- Cache-bust: `?v=20260902e-cors` → `20260902f-cors`. `npm test` green
  (77 pass, server smoke skipped without node_modules).

### 2026-09-02 (later) — match select + party builder DOOR-coded (pre-story pass)
The two pre-match screens were the last un-sealed surfaces before the story
track. Same rule as everywhere: a LAYER on the existing black/minimal
screens, no renamed game words (MODE / MAP / CONFIG / CONFIRM / THE PARTY /
DOSSIER / SEAL YOUR FATE / Codex of Vessels all stay).
- **data.js `DOOR_TEXT.SITE_FILES`** — one customs file per map, keyed by
  the MapForge id (Δ boards share the parent's file). Fields: `tone`
  (stamp ink admit/deny/void), `status` (the rubber stamp: ACTIVE CROSSING,
  DISPUTED, CONDEMNED, DIPLOMATIC, NON-CANON, QUARANTINED, NATURALIZED…),
  `juris` (short), `summary` (1. EXECUTIVE SUMMARY — voice rule in B2).
  The `advisory` and `memo` fields from draft 1 were dropped. Files for all
  30 launch maps + `clash_stage` (Temple) + `prebuilt_custommap` + a
  `_default` for community/unfiled maps. `SITE_FILE_LABELS` holds the
  section titles. Helpers (also on `window`): `doorSiteFile(modeId)`,
  `doorSiteCrossings(label)` (reverse of POINT_OF_ENTRY — every launch map
  has ≥1 entity on file), `doorSiteCanonDate(modeId)` (stable per-site
  "FIRST CROSSING" year in the canon window). Validated with load-data.js:
  every non-Δ map id has a file.
- **match-select.js** — dead `LORE` table replaced by the DOOR helpers.
  Header: seal (44px, `LOGO.onDark`) + "D.O.O.R. · CUSTOMS & ADMISSIONS ·
  FIELD ASSIGNMENT" sub-line, officer chip on the right (callsign +
  CLEARANCE, `.door-officer`). The map panel is the **SITE FILE**: kicker
  with case no (`doorCaseNo(modeId)`) and FIRST CROSSING canon date, site
  name + rotated status stamp, JURISDICTION line, numbered sections 1/2
  (summary / KNOWN CROSSINGS chips from the roster's points of entry, 10
  shown then "+N redacted"), seal watermark (`.door-wm`), and the panel is
  a fixed band (`clamp(300px,46%,420px)`) whose dossier column scrolls so
  the map grid keeps its space. Map cards show the site's status in stamp
  ink instead of the dead PRESET/RANDOM label. Config "SELECTED" slip →
  FIELD ASSIGNMENT with CASE no + SITE STATUS. CONFIRM: a FILED stamp
  thunks onto the button (`playDoorSfx('stamp')`), then the existing
  `_msConfirm` runs 420 ms later (`filedRef` blocks double-clicks; state
  resets after launch because the React root stays mounted between visits).
- **party-builder.js** — `DoorSeal` (falls back to `SigilMark`) in both
  headers (forge + TEAM ARCHIVE locker) with department sub-lines and the
  officer chip; THE PARTY gets a MANIFEST sub-label; a locked slot shows a
  tiny FILED stamp instead of ✓; CONFIRM-slot plays the stamp thunk. The
  DOSSIER tab is the numbered file: 1. EXECUTIVE SUMMARY · 2. CUSTOMS
  DISPOSITION · 3. D.O.O.R. ANNOTATION, seal watermark behind. Roster header
  gains "D.O.O.R. RECORDS · ENTITY REGISTRY"; locked-card tooltip says NOT
  DECLASSIFIED. Locker title gets an ON FILE stamp; footer fine print adds
  "MANIFESTS REMAIN PROPERTY OF THE DEPARTMENT".
- **battle.js** — the loading screen's hint rotation now LEADS with this
  map's site file (`SITE FILE · <MAP>`: the summary, stamped with the
  site's status/tone), then the shuffled pool; `setHint` honours a
  `stampTone` (void → grey). Local on both clients.
- **styles-base.css** — `.door-wm` (generic seal watermark), `.door-file-h`
  / `.door-file-p` / `.door-file-chip` (dossier sections, IBM Plex Mono
  paper voice), `.door-title-stamp` (stamp beside a big serif title),
  `.door-officer`.
- Cache-bust: `?v=20260902f-cors` → `20260902i-cors`. `npm test` green.

### 2026-09-03 — rev 7: docs merged, HQ planned (no game files touched)
- `entropy_wars_claude_brief.md` + `DOOR_DESIGN.md` → this file; both old
  files reduced to stubs. `DOOR_HQ_BUILD_PLAN.md` written (phased plan for
  the facility replacing the Play hub). CLAUDE.md points at both.
- Reconciliation decisions in Part C await the user's yes/no; nothing in
  data.js was renamed yet (the L1–L6 titles are still PROBATIONARY…
  KEYHOLDER until decision C-1 lands).
- Reference art received in chat (5 images, described in the HQ plan §5.1)
  — NOT yet in the repo; the user is asked to commit them under
  `docs/door-hq/ref/` so later sessions can view them.

### 2026-09-03 (later) — user decisions recorded
- C-1 DECIDED: rank titles are DOORMAT / DOORSTOP / KNOCKER / KEYHOLDER /
  GATEKEEPER / THE DOORMAN (data.js strings not yet changed — bundle with
  the next data.js delivery).
- C-4 DECIDED: hybrid story gating (B3 rewritten): SP from every mode incl.
  PvP + per-chapter single-player field requirements inside the facility.
- HQ plan D1 DECIDED, then REVISED the same day (HQ plan rev 2): the
  facility is a walkable 3D place from Phase 1 — procedural shell +
  the user's authored prop kit + DOM overlays for the existing screens.
  The pre-rendered-rooms idea is dropped; the Guild Hub was the prototype.
  The "24×24 hall hits a perf ceiling" claim was wrong: ROADMAP §4's
  object count belongs to the voxel battle-board builder, which the
  facility does not use.

### 2026-09-03 (later) — HQ Phase 1.1 + 1.2 built in ISOLATION (Play untouched)
The Central Egress exists and can be walked: `index.html?hq`, or
`window._hqEnter()` from the main menu, or `?hqdev` once for a sticky
dev pill. Full account in `DOOR_HQ_BUILD_PLAN.md` §9 (2026-09-03, Phase
1.1 + 1.2) and the uploaded-kit inventory in its §5.5. Touched: data.js
(`DOOR_HQ` layout + catalogue + helpers; **C-1 landed** — `DOOR_TEXT.
CLEARANCE` now reads DOORMAT / DOORSTOP / KNOCKER / KEYHOLDER / GATEKEEPER /
THE DOORMAN, each with its office-door leaf), three-renderer.js
(`ThreeRenderer.hq`, own scene + loop), three-post.js (`renderScene`),
map.js (flow + door panels + directory + dispatch), index.html (`#hqPage`,
`?v=20260903a-cors`), styles-base.css (`.hq-*`), state.js (`GS.HQ`), ui.js
(`?hq` autostart), door-hq.test.js (repo tooling). `npm test` 89 pass.
Doors open the existing screens (Records → Codex, Quartermaster → Shop,
Reception → Profile…); the six bay doors show their thresholds' site files
but cannot launch a crossing until HQ 1.3. Nothing mid-match changed → no
relay work (RULE #2). The reference art is committed under
`door_reference_images/` (the HQ plan's §5.1 names map onto it by content).

NOT done yet (next steps, in order): HQ plan Phase 2.6/2.7 (bays as
corridors, the closet interior) and 3.x (mastery checklist + result stamp,
Code Red, promotion door) → story track step 3 (SP meter, thresholds →
chapters, post-match scene, the office as the case-file screen; the
`.directive` tab, the `door.*` fields and the four unwired kit sounds are
already waiting for it) → orientation tape in the Training Room → PvP
opponent card on the VS splash (relay) + queue hold music.

### 2026-09-03 (later) — HQ Phase 1.3 + 1.4 + 1.5: Play enters the building
The isolated egress is now the Play hub. Full account in
`DOOR_HQ_BUILD_PLAN.md` §9 (this date, "Play enters the building"):
`_goToPlayHub` → `_hqEnter`; `_hqReturnOrMenu` at every Back + the result
overlay (button reads D.O.O.R. HQ), re-entering at the last door;
Profile / Leaderboard / Settings keep the building paused underneath;
`_hqLaunchMission` + `window._hqPreselect` → match-select pre-filled (CPU
pinned to the site's natives via `hqMissionPool` / `_hqCpuPool`);
mastery flags `site:<mapId>:<cond>` written in the achievements commit;
synth room tone + `doorBuzz` on doors; `door.hq` on the profile; a
Settings toggle + `?nohq` for the classic hub. Match history finally
records the map id (`_mapPresetId` was never set). Touched: data.js,
state.js, battle.js, profile.js, ui.js, online.js, three-renderer.js,
audio.js, match-select.js, map.js, styles-base.css, index.html
(`?v=20260903b-cors`), doorhq.test.js. `npm test` 92 pass. No mid-match
surface changed → no relay work (RULE #2).

### 2026-09-03 (later) — HQ Phase 2.2 re-homed + 3.1 checklists
The user keeps the procedural dispatch ring; the three "wedge" desk GLBs
(measured from the repo copies — the "45° reception wedge" is actually a
corner reception counter, wedge B a true 45.3° table sector) now dress
the hall: a RECEPTION · INTAKE counter beside the HR door, two mezzanine
clerk stations (Arcane Engineering, Bureau of Continuity), a half-ring
briefing table with folding chairs (`ring` props, three-renderer
`_hqPlaceWedgeRing`). Bay door panels list each threshold's ☑/☐ win
conditions (`hqSiteMastery`, `DOOR_HQ.masteryLabels`); the result stamp
gains a THRESHOLD STABILIZED / FILED tag from the viewer-local flag
(`_stampHqSite`). Full account in `DOOR_HQ_BUILD_PLAN.md` §9 (this date,
"Phase 2.2 … + 3.1"). Touched: data.js, three-renderer.js, map.js,
battle.js, styles-base.css, index.html (`?v=20260903c-cors`),
doorhq.test.js. `npm test` 95 pass / 1 skip. No mid-match surface → no
relay work (RULE #2).

### 2026-09-03 (later) — HQ Phase 2.6: the six bays as corridors
Every containment bay (A10) is now a room you walk: a 4 m curved
corridor off the egress ring with the way out on its inner wall and one
threshold door per launch map along its outer wall, each wearing a leaf
chosen for the site (the Moon's door stands in a bare frame; Atlantis is
the wet bulkhead; the Backrooms is an EXIT door). A threshold's panel is
its site file (customs stamp, jurisdiction, first documented crossing,
entities on file, the mastery checklist) with CROSS / DEEP; post-match
you are re-admitted into that bay at that door. Full account in
`DOOR_HQ_BUILD_PLAN.md` §9 (this date, "Phase 2.6"). Files: data.js
(`bayShell` / `thresholds` / `bays` / `hqBayRoom` → generated
`rooms.bay_*`), three-renderer.js (`_hqBuildBayShell`, side-aware doors),
map.js (`_hqGoRoom`, threshold panel), profile.js, styles-base.css,
index.html (`?v=20260903d-cors`), doorhq.test.js. `npm test` 98 pass /
1 skip. No mid-match surface → no relay work.

### 2026-09-03 (later) — HQ Phase 2.7: the janitor's closet
YOUR OFFICE (A5: the L1 office is a converted janitor's closet) is the
first interior you can walk into: a box room off the egress ring laid out
after the reference (mop and broom on hooks, the sink under shelves of
bottles, the breaker panel, the tanker desk with the beige CRT, rotary
phone, lamp and clipboards, the locker with toilet paper on top, the cot,
the drain, the round rug). The door is the rank (C-1): both sides wear
the clearance ladder's leaf, so a promotion changes your door. The
IN-TRAY on the desk is where the story will arrive (B3) — today it reads
the card on file, the ladder, a pending directive if any, and the last
cases. Full account in `DOOR_HQ_BUILD_PLAN.md` §9 (this date, "Phase
2.7"). Files: data.js (`rooms.office`, procedural catalogue entries),
three-renderer.js (box rooms, procedural props, rank leaf), map.js
(in-tray), styles-base.css, index.html (`?v=20260903e-cors`),
doorhq.test.js. `npm test` 101 pass / 1 skip. No mid-match surface → no
relay work.

### 2026-09-04 — doors fit their frames; rank leaves are exclusive; doors open
User: leaves were different sizes, left gaps, or looked wrong in the
frame; the 18 door GLBs were committed to `/doors` for inspection. All
18 were parsed and rendered offline (single mesh each, unit-scaled, no
animation, three with the frame baked in per face). Findings and fixes:
- **Fit.** The old rule (fit height, clamp width) shrank any leaf whose
  aspect missed the fixed 1.1×2.25 / 2.2×2.45 opening (the L1 warped door
  lost 0.5 m of height; the frosted pair rendered 1.3 m tall) and the
  hollow-core door is authored edge-on (width along Z) so it showed as a
  sliver. Every leaf now carries its measured `aspect` (+ `yaw: 90` for the
  hollow-core), the procedural frame is CUT TO THE LEAF (opening width =
  aspect × height, singles 0.95–1.6 m, wides 1.9–2.5 m; jambs absorb the
  rest of the 2.5 / 3.3 m panel) and the leaf is then fitted on both axes.
  The leaf's catalogue `wide` decides the opening class; the door entry's
  own flag is data hygiene only (a test keeps them agreeing).
- **Rank ladder (C-1) is now exclusive** (catalogue `rank`, test-enforced):
  L1 warped closet · L2 hollow-core · L3 **office door** (was the wired
  double) · L4 security · L5 frosted executive pair · L6 futuristic. No
  other door or threshold may wear these six. Displaced doors were
  re-homed from the pool (reception → plain white closet door, medical →
  grey steel closet door, engineering → suburban six-panel, continuity →
  dark house door with the leaded fanlight, bay 4 → bulkhead, bay 3 →
  wired double, bay 6 → EXIT; thresholds likewise, notes updated).
- **Doors open.** The door you stand at (the interaction target) swings
  open toward you (hinged singles) or pockets into the jamb behind a clip
  plane (the L6 futuristic door, the elevator halves) and closes when you
  walk off; sealed / clearance / code-red doors stay shut. One-mesh
  doubles, the round hatches, the portcullis, the revolving door and the
  bare frame are static (their frame is part of the mesh); the revolving
  door is kept to its one thematic use (Bay 5 · Diplomatic).
Files: data.js (catalogue, CLEARANCE L3, doors, thresholds, `hqBayRoom`
fallback), three-renderer.js (`_hqBuildDoors` fit + motion rig,
`_hqTickDoors`, `_hqFindTarget` reach from the real opening), doorhq.test.js
(+3), DOOR_HQ_BUILD_PLAN.md §9, index.html (`?v=20260904b-cors`). Hub only →
no relay work.

### 2026-09-04 (later still) — HQ Phase 3 complete: Code Red, Keys, the promotion moment
The next three items on the HQ plan's standing list (3.3, 3.2, 3.4), all
⚙, all shipped; the HQ plan §9 entry has the mechanics. What matters for
the fiction:
- **Code Red** (A11 Act II: "Code Reds put characters in the wrong
  worlds") is real: once a day one of the officer's STABILIZED
  thresholds reports an entity whose POINT OF ENTRY is some other site —
  a demon prince at Cyberpunk City, a yeti on Mars — picked from the
  local date + the employee number so the whole day agrees on it. The
  doorbell (a household ding-dong, rung twice, the second flat) sounds
  on the way into the egress; the bay door and the threshold strobe; the
  brief is on the strip; RESPOND crosses with that entity pinned to the
  CPU side; a same-day win clears it, pays a 200 Hazard Pay hazard bonus
  and tags the result stamp CODE RED CLEARED. Nothing is reported until
  at least one lamp is green — the joke is a stabilized door going wrong.
  Voice kept dry ("has no business being there"; "Everyone in the
  building already knows; nobody will mention it.").
- **Keys** are hourglasses (A9), counted for the officer's whole career
  (the `hourglasses` achievement counter) plus anything the Department
  issues later. The elevator wants 12, the Bureau of Continuity 24, each
  on top of its rank — so both restricted doors now say exactly what
  they want. Thresholds and bays never ask for Keys.
- **Promotion** has its ceremony (B3): PA chime, a PERSONNEL NOTICE
  ("EFFECTIVE IMMEDIATELY · <canon date> · DOORSTOP · formerly L1
  DOORMAT · PROMOTED · your office door has been replaced with a hollow
  core door. Do not comment on the old one."), a PROMOTED stamp on the
  card back, the new leaf already hung. Nothing promotes yet; the story
  track (HQ 4.1) only has to write `door.clearance`.
Files: data.js, map.js, battle.js, three-renderer.js, audio.js,
styles-base.css, index.html (`?v=20260904d-cors`), doorhq.test.js (+8),
DOOR_HQ_BUILD_PLAN.md rev 8, this file rev 12. Open for the user: Code
Red SP bonus once the meter exists (rec. +5); whether Code Red may pick
an UNSTABLE site for veterans (rec. no).

### 2026-09-04 (later) — the second door batch
The user generated the wishlist: 14 more single-leaf doors in `/doors`
(barn, saloon, stable, single frosted, bathroom, bathroom stall, cell
with a slot, doorway to hell, glass, glass executive, holographic,
hospital with a porthole, hotel, motel). All measured and catalogued
(`aspect`, hinge from the handle side). L5 GATEKEEPER now wears the
single frosted leaf, so every rung of the ladder opens (L6 slides). New
homes: reception → glass door, medical → hospital door, engineering →
glass executive, Bay 6 · Quarantined → the cell door; thresholds nuketown
→ motel, skinwalker → stable, bohemian grove → saloon, babel → barn,
cyberpunk → holographic (slides), heaven → hotel, hell → the arch (static,
its cracks glow). Bathroom, stall, suburban, plain closet doors and the
frosted pair sit in the pool for later rooms. Files: data.js,
DOOR_HQ_BUILD_PLAN.md §9, index.html (`?v=20260904c-cors`).

### 2026-09-04 (later) — the Training Facility's two boards
The 8×8 Training Room and a second, holographic floor shipped as BATTLE
MAPS (HQ plan 6.1b / 6.1c; the walkable room is 6.1a, next). Canon
consequences: the Training Room is literally the only square room in the
building — a Δ board (the same lava → dirt bed as every crossing, under
the floor) inside solid concrete walls with the signs
from the concept board (ORTHOGONAL GEOMETRY EXPOSURE AREA · MAX OCCUPANCY
45 MINUTES · REALITY LEAKS POSSIBLE), observation booths, red lamps, two
green-lit doors and four scorch stars nobody explains. The **Holo Sim** is
Arcane Engineering's simulation floor: a holographic grid projected over
the raw bed, neon rings and dark monoliths in the void beyond; its in-fiction purpose is open (rec.:
PRACTICE — trying a manifest out before a crossing tries it out on you).
Neither is a site: no file number, no stamp colour but grey (INTERNAL /
SIMULATION), no native entities, no ranked rotation; both are selectable
in match select and friendly rooms. Engine: two new terrains `holo` /
`holo_red`. Files: data.js, sprites.js, three-renderer.js, map.js,
index.html (`?v=20260904f-cors`), DOOR_HQ_BUILD_PLAN.md §4/§5.1/§9.

### 2026-09-04 (later again) — the Training Room made visible
The room had been built but was being dissolved by the default retro fog
(the horizon-altitude haze meant for far scenery); the enclosure is now
exempt and stands solid, the floor is a new `training_floor` terrain (one
warm plaster slab per tile, drawn at load), and two floor cracks join the
scorch stars. No canon change. Files: three-renderer.js, sprites.js,
data.js, map.js, index.html (`?v=20260904i-cors`); HQ plan §9 rev 3 entry.

### 2026-09-04 (rev 4) — see-through walls, black holo floor
Two readability fixes on the facility boards, no canon change. The
Training Room's enclosure now takes part in the renderer's line-of-sight
occlusion fade: a wall (panel, dado, trims, strips and everything hung on
it — doors, signs, clocks, lamps, the booth) is one occluder that fades to
near-invisible whenever it sits between the camera and the grid (the
centre + four inner corner tiles are always subjects there, on top of the
active unit), so units behind it render as themselves instead of the
x-ray holograms the old solid walls forced. The Holo Sim's `holo` plate
was a dark navy that the emissive rim pass and bloom turned into a solid
blue floor under every highlight; the fill is black now, only the cyan rim
glows. Files: three-renderer.js, sprites.js, index.html
(`?v=20260904j-cors`); HQ plan §9 rev 4 entry.

### 2026-09-04 (walkable) — 6.1a: the Training Room you walk into
The Training Facility door in the egress (180°) opens now: `DOOR_HQ.rooms.
training` is the second `kind: 'box'` room — a 20 × 20 m hall with the SAME
8×8 grid the `prebuilt_training` board plays on, flush in the middle of the
floor as walkable geometry (slab tiles, lit seams, scorch stars, maroon
barriers with gaps at the green N/S doors, hazard plates, A–H / 1–8, the
overhead observation booths — always occupied — the signs, the corner
machinery). The RANGE console (a tanker desk with a CRT, and the VHS CRT
beside it cued to TAPE 1 OF 1) launches ORIENTATION → the Training Room
board and PRACTICE → the Holo Sim, both with a free CPU pool and nothing
filed. Canon consequences: Challenge (Medical's long range) and the
condemned Mystery-Dungeon crossing now have their PHYSICAL doors inside
the facility (the egress panel's shortcut buttons are gone); the walkable
grid and the fought grid are established as the same room. Files: data.js,
three-renderer.js, map.js, doorhq.test.js, index.html
(`?v=20260904k-cors`); HQ plan §9 6.1a entry.
