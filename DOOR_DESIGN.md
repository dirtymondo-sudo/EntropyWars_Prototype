# D.O.O.R. — Department of Orthogonal Realities
### Integration design (rev 3, 2026-09-02) — build-order step 1 SHIPPED, see §7

Read CLAUDE.md first. This is the anti-"start over" memory for the DOOR
fiction: what DOOR is, its role in the Entropy Wars, where it plugs into
surfaces that ALREADY exist (with file:line hooks), a mode-agnostic story
track that online PvP feeds, and an honest asset split (what the user must
draw vs. what Claude can build).

**Rev 2 decisions (from the user):**
- Closers vs Openers is the spine. Keep it.
- **Do NOT rename the game.** Victory is Victory, Defeat is Defeat, the Shop
  is the Shop, the Codex is the Codex. DOOR is a *layer* (stamps, seals,
  memos, voice) on top of a turn-based fighting game, not a replacement
  vocabulary. Dropped: "deputized assets", "requisitions", "hazard pay",
  "petty cash", "processing event", renamed menu buttons.
- Stamps stay — as visuals that land NEXT TO the real words.
- Story must be advanceable from online PvP as well as solo play (hit a
  threshold → cutscene right after the match). Primary single-player mode
  is still undecided, so the story track must not depend on one.

---

## 0. Pitch

DOOR is interdimensional customs for Earth. Every entity in the roster is an
undocumented crossing. The player is a newly hired officer whose *vessels*
(the game's existing word) do the field work. DOOR decides canon reality,
scoffs at "parallel" universes (parallel lines never touch; orthogonal ones
do), and has petty jurisdictional beef with the Men in Black (who show up and
take over their scenes) and CERN (who take the credit for the doors and the
Mandela Effect). The joke everyone at DOOR already knows and nobody says out
loud: DOOR opens the doors. It is in the name.

The game already speaks this voice — the intake form says "INTELLIGENCE
DIVISION · NEW FILE / OPERATIVE REGISTRATION / ENTER CALLSIGN", the codex is
a "CLASSIFIED DOSSIER INDEX", the onboarding says "Welcome, operative. The
Division…". DOOR is the name the nameless agency has been waiting for. Most
of the integration is giving the agency a seal and a point of view.

---

## 1. DOOR's role in the Entropy Wars

**The war.** The Entropy Wars are fought everywhen ("every battle happens
somewhen between 12500 BC and 3333 AD" — the loading screen already says
so) by the SPACE, TIME and CHAOS factions, using vessels pulled through
doors. In the engine, entropy is a literal resource: the team gauge that
fills as a battle rages and discharges as the ENTROPY STRIKE (battle.js
~8676). That mechanic is the lore.

**DOOR's answer to "what are you?" depends on which department you ask** —
that is the VFD move — but there is one canonical spine underneath:

| Asked of… | The answer | Is it true? |
|---|---|---|
| The public face (Customs & Admissions) | **Peacekeepers / referees.** "We do not fight the war. We process it. Every crossing is inspected; every entity is filed." | True, as far as the clerks know. Battles are literally the inspection: an entity's "processing" IS the match. |
| Records / the Codex | **Archivists.** Neutral. "We only keep the file." | True and useless. |
| The Shop / declassification | **Arms dealers**, by any honest reading: DOOR hands officers ever-stranger entities to fight each other with, for gold. | True. Nobody at DOOR uses the phrase. The memo calls it "asset reassignment". |
| The Bureau of Continuity (Canon Office) | **Janitors.** They clean up the drift (the Mandela Effect) that entropy leaves in reality. | True. They are the only department that suspects WHY there is so much to clean. |
| The Openers (the hidden hand) | **Profiteers — but not in gold.** A customs agency collects a duty on every crossing. DOOR's duty is paid in entropy. Every door opened, every battle fought, every ENTROPY STRIKE fired generates the stuff, and DOOR collects it. What for is Directive 6's question. | The truth. |

One line for the bible: **"Every crossing pays a duty. The duty is entropy."**

So: officially peacekeepers, structurally facilitators, commercially arms
dealers, secretly profiteers — *all of the above* — and the Closers believe
only the first one. The Closers think the war is a leak they are containing.
The Openers know the leak is the product. The Canon Office is the janitor
for the Openers' mess and is starting to notice the mess has a schedule.

Why the player fights, in-fiction: entities cannot be filed until they have
been "tested in the field". The battle IS the customs form. This is the only
piece of jargon that needs to exist, and it lives in memos, not in the HUD.

---

## 2. The bible (tone + the SHORT vocabulary)

**Tone dials:** satirical (bureaucracy as horror-comedy: forms, stamps,
memos, the break room, cosmic threats handled with a clipboard); esoteric
(thresholds, corners, 90°, "as above so below / as here so there");
psychedelic (what a crossing feels like — the corner of the eye, walking
into a room and forgetting why: you crossed); nostalgic (80s/90s
corporate-government aesthetic — VHS orientation tapes, dot-matrix tractor
feed, fax headers, carbon copies, CRT terminals, a studio ident before the
feature).

**Orthogonality doctrine:**
> "Parallel realities are a comforting fiction. Parallel lines never meet.
> Adjacent realities meet at right angles — at corners. Every corner in every
> room is a potential door. This is why Department facilities are round."

Corollaries: "Do not stand in corners." Agents are trained never to look
directly at a corner. "Orthogonal" is an insult ("a very orthogonal opinion").

**Vocabulary — the only DOOR-specific words the game needs.** Everything
else keeps its plain game name.
| Word | Meaning |
|---|---|
| **crossing / door / threshold** | What CERN calls a portal. DOOR never says "portal"; it gets red-penned in memos. |
| **the Department** | How employees refer to DOOR. |
| **Closers / Openers** | The two hands. Never named in official documents. |
| **DENY / ADMIT** | The two stamps on every desk. Which one a memo bears tells you who wrote it. |
| **canon / non-canon** | The Bureau of Continuity's ruling on what happened. |
| **clearance (L1–L6)** | Story progress on your ID card (NOT your rank — rank stays Iron→Grandmaster). |
| **case file / directive** | Your current story objective and its hand-authored payoff. |
| **vessel / declassify** | Already in the game. Keep. |

**Departments** (hands in everything; the game already names an "Intelligence
Division" and an "Arcane Engineering Division", which become DOOR departments):
Customs & Admissions (the player's desk) · Bureau of Continuity, "the Canon
Office" (owns the Mandela Effect; CANON NOTICES; retcon is a verb) · Arcane
Engineering (spells) · Records (the Codex) · Internal Affairs (the ones who
know; recruit the player late).

**Rivals:** the Men in Black (already a playable race, lore "847 documented
coverups"; DOOR memos call them "the other agency", "the Cufflinks"; they do
PR and memory wipes, DOOR does the paperwork, MIB never file it) · CERN
(already a map with "the crackling portal anomaly at the interaction point";
"the Swiss"; took credit for the door DOOR built under them; the Berenstain
incident) · the Watcher (shelved race with lore "I have watched long enough.
It is time to act… All leave cancelled" — a ready-made whistleblower).

**Canon gags:** DOOR's founding date differs between documents (1947 / 1954
/ 1974 / 1987) and the Canon Office keeps "correcting" it. The loading
screen's random year (battle.js `_lsRandomYear`) gets the label **CANON DATE
· SUBJECT TO REVISION**. The game's own title is DOOR's internal name for the
containment conflict. "As above, so below" (existing tagline) pairs with
DOOR's "As here, so there".

---

## 3. Where DOOR plugs into surfaces that already exist

DOOR is a layer. Each item below adds seal/stamp/memo/voice to a real
surface without renaming it. Ordered by effort.

### 3.1 Employee ID card = the profile (the anti-"signing up for a website")
Hook: `CreateProfileModal` profile.js:1756 (already a "classified intake
form"), profile shape `defaultProfile()` profile.js:26, 3 slots
(`MAX_PROFILES`), profile tabs profile.js:2412.
- The intake modal becomes a laminated card being filled in (CR80 aspect,
  3.375:2.125). Fields: CALLSIGN (the existing input), EMPLOYEE NO. (derived
  from createdAt/hash, no new input), DEPARTMENT: Customs & Admissions,
  CLEARANCE: L1, ISSUED: <canon date>, PHOTO: "PHOTO PENDING" silhouette
  until a vessel is chosen, then that race's portrait (`RACE_PORTRAITS`),
  signature line, barcode, fine print ("LAMINATE BEFORE USE").
- One optional form question, so it feels like a form and not a login:
  **DESK: SPACE / TIME / CHAOS** (the existing factions, `_CODEX_FACTION`
  ui.js:7628). Cosmetic: card colour stripe + seeds showcase/favRaces.
  Optional gag checkbox: "Have you experienced a Mandela Effect? ☐Y ☐N";
  Y prints FLAGGED on the card. Nothing else is asked.
- The "choose your first character" beat already exists: the free-token
  ceremony (ui.js:10298). Reframe the copy as DOOR issuing you a vessel;
  the pick's portrait goes on the card. Two lines of copy.
- Profile overview = the card, front and back. The back collects stamps
  over time (promotions, commendations, and — late — a second stamp when
  the story turns). Three profile slots = three cards on a lanyard. Delete
  confirm fine print: "LOST CARD FEE: 5000 gold".
- **Clearance is story progress, not ELO.** Ranks stay Iron→Grandmaster
  (`getRankInfo` profile.js:1025). Clearance L1–L6 comes from §4.

### 3.2 Codex → still called Codex; the header says DOOR RECORDS
Hook: `_CODEX_LORE` ui.js:7531 (~95 entries already in redacted-file
voice), header index.html:651, doc number `_codexDocNum` ui.js:7724, type
colours `_CODEX_TYPE_COLORS` ui.js:7629. **Lore is DUPLICATED (shortened)
in party-builder.js ~500-560 — edit both.**
- Header sub-line: "D.O.O.R. RECORDS · ENTITY REGISTRY". Seal watermark.
- Every dossier gets a **customs status stamp** from type: human → DOMESTIC ·
  alien → FOREIGN NATIONAL · anomaly → UNDOCUMENTED · divine/unholy →
  DIPLOMATIC (immunity claimed) · tech → IMPORTED. Plus a per-entity
  disposition where it's funny (Santa Clause: NATURALIZED; Honda Civic:
  IMPORTED; Politician: DOMESTIC, "unfortunately").
- **POINT OF ENTRY** per race = one of the existing conspiracy maps (CERN,
  Area 51, Skinwalker Ranch, Hollow Earth, Backrooms, D.U.M.B., Mount
  Shasta…). Ties roster to map roster for free.
- Locked (not yet declassified) entries show stamp + redaction block only.
- Dossiers to give a DOOR pass: men in black, conspiracy theorist, politician,
  general, glitch (Canon Office exhibit A), watcher, machine elves ("Project
  ████████ 1971" → DOOR's first documented crossing).

### 3.3 Loading screen cards (cheapest lore delivery in the game)
Hook: `LS_HINTS` battle.js:31300 — FIELD MANUAL / INTEL FRAGMENT rotate every
match. Add two types:
- **INTEROFFICE MEMORANDUM**: "The break room is not a designated crossing
  point." / "Whoever propped the Hollow Earth door open with a fire
  extinguisher: we know." / "The black sedans in spaces 1–4 are not ours.
  Do not wash them." / "CERN's press release of the 14th is NON-CANON. Do
  not forward."
- **CANON NOTICE** (Bureau of Continuity): "Effective immediately, the
  Berenstein spelling is non-canon. Update your files. Do not discuss." /
  "The Department was founded in 1954. Disregard the memo of the 3rd
  stating 1974."
- A memo's stamp (DENY or ADMIT) quietly tells you which hand wrote it.
  Early on every memo is DENY. ADMIT memos start appearing at L4.

### 3.4 Title + main menu
Hook: title page index.html:578 (logo video), main menu index.html:597-643.
- DOOR ident plays on the title page before the Entropy Wars logo video
  (studio card → feature). Built in code from the seal PNG (§5), no mp4.
- Menu buttons keep their names. The DOOR seal sits in the corner; the
  ELO/wallet strip gains "CLEARANCE L3" next to the rank.
- `mainTheme` in audio.js is defined and NEVER PLAYED — free slot for a
  DOOR menu theme.

### 3.5 Result screen: Victory stays Victory; a stamp lands beside it
Hook: result overlay index.html:1086 (`vicTitle`, `vicGoldBreakdown`, MVP,
CRT scanline layers already present), no-contest path.
- After the title animates in, a rotated rubber stamp thunks down in the
  corner: DOOR seal + **CASE CLOSED** + case number + canon date. Victory =
  green ink, Defeat = red ink, No-contest = **VOID** stamp. The title text
  is untouched.
- Story hook: if a §4 threshold was crossed this match, a "NEW DIRECTIVE"
  tab appears on the stamp and the cutscene fires when the player leaves
  the result screen (or immediately, skippable — see §4.3).
- Online parity: the result overlay is local on both clients, so the stamp
  and the cutscene need no relay and never hold the opponent.

### 3.6 Shop stays Shop
Hook: index.html:684 (current header "INTELLIGENCE DIVISION — REQUISITIONS"),
`_renderShop` ui.js:8246, confirm ui.js:8179. Change the header to
"D.O.O.R. · SHOP" (or just the seal), keep "Declassify". The purchase
confirm becomes a stamped form (DECLASSIFIED). That's it.

### 3.7 PvP has an in-fiction reason
Online = two DOOR field offices claiming the same crossing and "settling it
in the field", or DOOR vs the other agency. One line on the queue screen
("Filing jurisdiction claim…"), DOOR hold music while matchmaking, and the
opponent's ID card on the VS splash (index.html:476 — relayed, RULE #2).

### 3.8 Mystery Dungeon hub = a DOOR field office
Hook: Guild Hub map.js:138-360 (`md_hub`). A seal on the wall, recruits
"on their break", the cave gate is a condemned crossing. Cosmetic.

### 3.9 Tutorial (not built yet) = ORIENTATION, DAY 1
A VHS training tape ("D.O.O.R. ORIENTATION · TAPE 1 OF 1 · 1987 · BE KIND,
REWIND"), tracking lines, chipper narrator, the FIELD MANUAL lines as
on-screen bullets. Mistakes earn a memo, not a fail. Ends with the card
being laminated (SFX) and Directive 1 opening. This is L1.

### 3.10 System text in DOOR voice (cheap, high flavour)
Error toasts ("FORM REJECTED: callsign must be 2–16 characters"),
disconnects ("CROSSING UNSTABLE — re-establishing"), rate limit ("Too many
forms. Please take a number."). Voice, not renaming.

### 3.11 Later: a DOOR officer as a playable race
Human/tech support-controller. DENY ENTRY (knockback), RED TAPE (root),
STAMP (mark: bonus damage), PAPERWORK (AP drain), FORM 90 (turn a tile into
a corner — a mini door that teleports). Clipboard, lanyard, short sleeves +
tie. Not needed for integration.

---

## 4. Story track: mode-agnostic, fed by everything, including online

### 4.1 Shape
Six clearance levels. Each level = one **case file** (a checklist of
thresholds) + one **Priority Directive** (a hand-authored beat: cutscene,
memo, and — where it makes sense — a scripted match). Thresholds are
cumulative counters that ANY mode advances, so the story never depends on
which single-player mode ends up primary, and online PvP counts fully.
Finishing a level's directive = promotion + next memo + a stamp on the card.

The existing `career` counters (profile.js:16, 17 counters), `classStats`,
`raceStats`, achievements, and match history already track most of what's
needed. Story thresholds are mostly reads of data the game already stores.

### 4.2 The arc (what unlocks it, what happens)
| Lvl | Title | Case file (any mode, incl. online) | Directive (the beat) |
|---|---|---|---|
| L1 | PROBATIONARY | Complete Orientation (or, until it exists: play 1 match). | Memo 1: welcome; entities are leaking in; stamp DENY. The card is laminated. |
| L2 | CLERK | Win 5 matches. Defeat 3 *men in black* vessels (any opponent's). | Memo 2: the other agency took your witnesses. **Scripted match vs an all-MIB roster** (Area 51). Memo war begins. |
| L3 | OFFICER | Win 10. Play a match on the CERN map (or 3 on any "site" map). Land 5 Entropy Strikes. | Memo 3: CERN took credit again. **Scripted match on CERN**, "correct the record". First CANON NOTICE you cause (Berenstain). |
| L4 | INSPECTOR | Win 20. Declassify 3 vessels. Reach floor 5 in Mystery Dungeon OR win 5 ranked. | Memo 4 arrives with an **ADMIT** stamp for the first time. The Canon Office notices breaches run on a schedule. Someone has keys. Backrooms / D.U.M.B. |
| L5 | AUDITOR | Win 35. Defeat a *glitch* and a *watcher* (or any anomaly ×10). Reach Gold rank OR clear Gauntlet 50. | The Watcher intervenes (existing lore). Internal Affairs makes contact: the doors are DOOR's. Every crossing pays a duty. |
| L6 | KEYHOLDER | Win 50. 100 matches total. | Your desk gets a second stamp. Choose which one you reach for. Both endings are a memo + which stamp is on the back of your card + a title. (Later: Closers vs Openers as an online faction war.) |

Numbers are placeholders for tuning. Rule of thumb: each level should be
reachable in a normal evening of play of ANY kind, and PvP-only players must
be able to reach L6 without touching a solo mode (hence the OR clauses).

### 4.3 The post-match cutscene (online and offline)
- Check thresholds on the result screen, after the existing achievement
  pass (battle.js ~9930 `bump(...)` region / victory-screen achievement
  grid). Both players evaluate their OWN profile locally — nothing to
  relay, and the opponent is never held.
- If a directive unlocked: the stamp on the result screen grows a "NEW
  DIRECTIVE" tab; on leaving the result screen the cutscene plays via the
  existing `playCutscene(script)` (battle.js:11336). Skippable. The "Find
  Next Match" button waits for the cutscene to end (or the player skips),
  so requeueing can't start a match under a cutscene.
- Directives whose beat is a scripted match (L2, L3) launch it from the
  case-file screen as a VS-CPU match with a fixed map + roster (the
  Challenge run already does fixed-level launches; reuse its plumbing).
  They are never forced immediately after an online match.
- Disconnect / crash safety: `door.pendingDirective` is written to the
  profile BEFORE the cutscene plays, so a missed cutscene replays from the
  case-file screen next time.

### 4.4 The case-file screen (the bulletin board, minus the board)
Reachable from the main menu ("Case File") and the profile card. Shows the
current level, its checklist with live progress bars, the directive (locked
/ ready / done), and the memos received so far (re-readable). Optional later
layer: daily-seeded **Work Orders** (mode × map × roster × twist, small
gold/voucher reward) for the retention cadence ROADMAP §8 says is missing.
The PMD-style corkboard becomes the skin of this screen once the primary
single-player mode is settled.

### 4.5 Data + save shape (for later; no new files)
- `DOOR_DIRECTIVES` table in data.js: `{level, title, thresholds:[{stat,
  n}], memo, cutsceneScript, scriptedMatch?}`.
- Profile: `door: { clearance, memosSeen: [], pendingDirective: null,
  cardStamps: [], choice: null }` backfilled in `defaultProfile()` like
  `account` was.
- Thresholds read `career`/`raceStats`/achievements first; only add a
  counter when none exists (e.g. "MIB defeated" is a per-race kill count —
  check whether `raceStats` already has it).

---

## 5. Assets: what the user must make vs. what Claude builds

Reality check: there is no ffmpeg in the sandbox, but Node 22 is there
(procedural WAV generation works), audio.js already synthesizes with Web
Audio oscillators, the post-processing stack already has grain/scanlines/
chromatic aberration, and stamps/cards/badges/paper all render better as
SVG+CSS than as bitmaps at the sizes the game uses. Most of the list from
rev 1 is therefore Claude's job.

### 5.1 The user MUST make (hand-made, non-negotiable)
1. **The DOOR seal/logo** (in progress). One transparent PNG at 1024² is
   enough; Claude derives the mono, small and watermark versions. If the
   tool exports SVG, include it — everything scales cleaner.
That is the whole mandatory list. Everything below is optional upgrades.

### 5.2 The user SHOULD make eventually (Claude ships a placeholder first)
- **Ident jingle** (3–6 s, DX7-style synth logo sting). Claude's placeholder:
  a procedurally generated WAV (detuned saws, a filter sweep, a tape stop).
  Usable, not iconic.
- **Menu theme** for the empty `mainTheme` slot (muzak / hold-music). Same:
  a generated loop as placeholder; real music later.
- **Handler portrait** (the supervisor who issues directives). Placeholder:
  a CSS/SVG silhouette with a redaction bar over the face and a nameplate.
  Honestly, the placeholder might be the final joke.
- **Ident as video** — not needed. Claude animates the seal PNG in code
  (scale-in, chromatic split, scanline wipe, VHS tracking, the jingle).
  Loads instantly, scales to any screen, no mp4 pipeline.

### 5.3 Claude builds (ship quality or close, all within existing files)
- **Rubber stamps**: SVG text on a rounded box with feTurbulence/
  feDisplacementMap for worn ink, CSS rotation, two ink colours. Any word
  from a single template: CASE CLOSED · VOID · DENY · ADMIT · DECLASSIFIED ·
  DOMESTIC · FOREIGN NATIONAL · UNDOCUMENTED · DIPLOMATIC · IMPORTED · CANON ·
  NON-CANON · RECEIVED (date box) · FLAGGED. Inline in existing CSS/JS.
- **ID card**: HTML/CSS. Holographic strip (animated conic gradient),
  barcode (SVG bars from the employee number), lamination sheen (diagonal
  gradient overlay), three desk-colour stripes, front/back flip, the seal
  PNG as the crest. Exportable to PNG later via canvas.
- **Clearance badges L1–L6** and **five department seals**: simple SVG
  glyphs in the existing palette.
- **Paper kit**: memo letterhead, carbon-copy tints, tractor-feed edge,
  fax header, redaction bars, coffee ring — CSS gradients + SVG noise. Real
  scans can replace them later if the nostalgia dial needs it.
- **VHS overlay** for the orientation tape and memo reveals: CSS/SVG
  tracking bars + the existing post stack.
- **SFX placeholders** as generated WAVs (Node script, no deps): stamp
  thunk, dot-matrix burst, fax handshake, PA chime, DENIED buzzer, security
  door buzz, CRT power-on, VHS insert/eject, lamination roller. Keyed into
  audio.js `_R2_SFX`. These are the kind of sounds procedural synthesis is
  actually good at; several may never need replacing.
- **All text**: memos (~30), canon notices (~20), the six directive scripts,
  customs status + point of entry for all ~95 dossiers, DOOR passes on the
  rival-relevant dossiers, orientation script, system-message voice.
  Redaction rule: never redact the joke.

### 5.4 Nice-to-have, user-side, later
Real VO for hold music lines ("Your crossing is important to us." / "Do
not stand in the corners."), a DOOR officer sprite/GLB (CLAUDE.md recipe),
Closers/Openers marks beyond the two stamps.

New asset files get new filenames (auto cache-bust); any R2 delivery bumps
the `?v=` token in index.html (CLAUDE.md 1b).

---

## 6. Build order (when coding starts)

0. **Strings live inline everywhere** (index.html, ui.js, battle.js,
   profile.js; no i18n). Add a small `DOOR_TEXT` object in data.js for the
   NEW copy (memos, notices, directives, stamps) so it is one place to edit.
   Existing labels are not being renamed, so no mass migration.
1. Seal on title/menu/codex/shop; ID card intake + profile overview; codex
   customs stamps + points of entry (both lore copies); loading-screen
   memo/canon cards; result-screen stamp. (All visual layer, no new systems.)
2. Ident animation + generated SFX + `mainTheme` placeholder.
3. Story track: `door` profile field, thresholds from existing counters,
   post-match check + cutscene hook, case-file screen, Memo 1 → Memo 6.
4. Scripted directive matches (L2 MIB, L3 CERN) via the Challenge-run
   fixed-level plumbing.
5. Orientation tutorial (= L1), then daily Work Orders once the primary
   single-player mode is chosen.

Guardrails: keep every plain game word; edit both lore copies; new asset
paths get new filenames; `npm test` before delivery; every R2 delivery bumps
`?v=`; anything shown mid-match to both players is relayed (the opponent's
ID card on the VS splash is the only such item so far).

---

## 7. Build log (anti-"start over" memory — update on every DOOR session)

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

NOT done yet (next steps, in order): step 2 ident animation + generated SFX
+ `mainTheme`; step 3 story track (thresholds → clearance, post-match
check, case-file screen, memos 1–6 — the `.directive` tab and `door.*`
fields are already waiting for it); §3.7 opponent card on the VS splash
(needs relay); §3.8 hub dressing; §3.9 orientation tape.
