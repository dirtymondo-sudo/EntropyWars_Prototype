# D.O.O.R. — STORY (outline + scripts)
### The hand-authored story home — rev 1 (2026-09-06 — the CAST is written: twenty entries, Chapter 1's four beats and the misc notes, all hand-authored by the user; Claude added the "in the building" column (what shipped in the HQ) and §5's reconciliation list. Bands L1–L6 beyond Chapter 1 are still open.)

Canon rules and the authoring process live in `DOOR_MASTER.md` **A0 + A14**
— read those first. This file is where the USER writes; Claude only wires
finished material into the engine (chapters → `DOOR_TEXT.CHAPTERS`, scenes
→ `playCutscene` scripts, memos → `DOOR_TEXT.MEMOS`, the cast → data.js
`DOOR_CAST` + sprites.js `DOOR_CAST_MODELS`). Everything marked **USER**
is canon; everything marked *[Claude]* is a build note or a proposal and
has no precedence. Claude may draft here ONLY when the user asks for a
draft, and drafts stay marked `[DRAFT — Claude]` until approved.

The fixed anchors this file builds on (DOOR_MASTER A0):
1. Recruited after lowered standards + an ANONYMOUS REFERRAL ("one foot
   in the door").
2. Parents died mysteriously (house fire / home invasion); both were DOOR
   agents on opposite Opener/Closer sides; DOOR falsified the aftermath —
   the cover-up is the crime.
3. The global door crisis = the ENTROPY WARS.
4. One straight hallway/section under HQ (H-Wing), found late game.
5. Ending seed: the player becomes the Doorman; the Doorman was the
   janitor all along.
6. **(2026-09-06)** The cast sheet in §2 — names, roles, allegiances and
   the arcs as written there.
7. **(2026-09-06)** Chapter 1's four beats (§3, Band L1).
8. **(2026-09-06)** H-Wing's nature (§2 #19) and Room 64 (§2 #20).

---

## 1. Spine questions (~1 page — answering these IS the story)

Status after the cast sheet (2026-09-06). **USER** = answered by the
user's notes; *[Claude]* = a reading of those notes, not a decision.

1. **Who sent the anonymous referral, and what do they want from the
   player?**
   > OPEN. *[Claude: the cast now offers four candidates with a motive —
   > Locke (was close with the mother), Glass (owes the father a life),
   > the Janitor/Doorman (has a key to every room and a closet to spare),
   > Dorian (needs someone inside who will mistrust DOOR). Pick one; the
   > other three become red herrings for free.]*
2. **What does the player want — externally and internally?**
   > **USER:** needs money (external); wants to discover the truth of
   > their parents' deaths (internal). Faction: undecided — the
   > player's own choice is the story.
3. **What is escalating across the game?**
   > **USER (from the notes):** the wave of doorways opening worldwide
   > (the Entropy Wars); Dorian Gates' conquest — invading worlds through
   > the father's weaponised backdoor network; H-Wing growing under HQ,
   > accelerated by Dorian's uncontrolled doors; the player's mistrust of
   > DOOR, especially after finding H-Wing; the party placed on
   > administrative leave for ignoring orders.
4. **What did each parent actually do the night they died, and what did
   they leave behind?**
   > **Superseded 2026-11-24 by §7** (Locke orders the executions: the mother pushed back through the door into the collapsing reality, the father into the Void Door; Dorian stays silent; August escapes to the future Bayside Mall). The text below is history.
   > **USER:** the MOTHER (a Closer) could have escaped the house fire
   > through a door and chose to keep it closed, sacrificing herself so
   > what was on the other side could not come through. The FATHER (an
   > Opener) built a secret network of backdoors for creatures seeking
   > refuge; when it was discovered he held a door open for the refugees
   > and stayed behind to fight the Closers; Agent Glass — a double agent
   > in that Closer raid — shot him, with the father's permission, to
   > keep his cover and the network. Left behind: the backdoor network
   > itself (now Dorian's weapon), Glass's secret, Locke's memory of the
   > mother. An object or file: OPEN.
5. **What is H-Wing evidence of, and what waits inside it?**
   > **USER:** the accumulated consequence of DOOR's Closer policies —
   > every permanent closure displaces dimensional pressure, which has
   > collected beneath headquarters for decades and physically manifested
   > as a fractal, repeating H-shaped corridor: perfectly straight, right
   > angles, doors to realities that officially "no longer exist". Dorian's
   > uncontrolled doors are accelerating/rupturing it. The Doorman knows
   > and is trying to manage it. (The childhood-home door inside H-Wing
   > stays scaffolding.)
6. **What does DOOR collect entropy FOR?**
   > OPEN. *[Claude: the Doorman "wants to maintain a consistent level of
   > entropy" — so the duty may be a THERMOSTAT, not a hoard: DOOR
   > collects entropy to spend it where the next unavoidable breach should
   > land. That is the HINGE reading of A2; it needs the user's yes.]*
7. **What is the final choice or closing image?**
   > PARTLY. The janitor-Doorman seed stands. **USER (implicit in the
   > parents):** one parent died holding a door SHUT, the other holding a
   > door OPEN — the game's question in one image. *[Claude: Locke's
   > first-day line "Door opened or closed?" is the natural last line of
   > the game, asked of the new Doorman. Which answer, or whether the
   > player gets to give one, is the user's.]*
8. **Who performed the parents' cover-up — how high does it go, and who
   still knows?**
   > **Superseded 2026-11-24 by §7** (Locke orders the executions: the mother pushed back through the door into the collapsing reality, the father into the Void Door; Dorian stays silent; August escapes to the future Bayside Mall). The text below is history.
   > PARTLY. **USER:** Glass was in the Closer raid that killed the
   > father; Dorian witnessed "how they murdered the Player's father";
   > Locke was close with the mother and hints at knowing both parents;
   > Belle switched sides after Ringer's death (unrelated mission). Who
   > FILED the false reports, and whether the Doorman signed them: OPEN
   > (see §5, item 1).

---

## 2. Cast sheet — **USER, 2026-09-06 (canon)**

Twenty entries. The "In the building" column is *[Claude]*: what shipped
in the headquarters on 2026-09-06 (data.js `DOOR_CAST`, sprites.js
`DOOR_CAST_MODELS`; the 15 rigged Meshy models in R2
`Assets/Sprites/Races/maincharacters/`). Poses are shared-library clips
retargeted onto each model (see DOOR_HQ_BUILD_PLAN §9).

| # | Name | Dept / role | Faction (hidden?) | Wants | Lies about | Link to the parents | In the building *[Claude]* |
|---|---|---|---|---|---|---|---|
| 1 | **The Player** | newest recruit; office = the janitor's closet | Undecided | money; the truth of the parents' deaths | — | their child | **the avatar** — you walk the HQ as the Player model (was: most-played vessel) |
| 2 | **D.O.O.R.** | Department of Orthogonal Realities | Closer (opens more doors than it admits) | control of canon reality | how many doors it opens | employed both | the building itself |
| 3 | **The Mother** | DOOR agent, died in a house fire | Closer | — | — | held a door SHUT | model wired (`mother`), flashbacks only |
| 4 | **The Father** | DOOR agent, died in a "home invasion" | Opener (built the backdoor network) | refuge for creatures | — | held a door OPEN; shot by Glass at his own request | model wired (`father`), flashbacks only |
| 5 | **Agent Locke** | the player's direct superior; orientation + training | Closer (loyal to the mission statement) | the book followed, whichever version | how well she knew the parents | close with the mother | briefing the half-ring table, `hqTalk`; her two lines ship |
| 6 | **Agent Belle** | colleague, potential love interest | Closer (formerly Opener); later betrays the player by locking them in a room | containment — "good intentions without containment get innocent people killed" | her old side | Ringer's daughter | seated at the round desk or on the couch (`hqSit`), where she can see every door |
| 7 | **Agent Glass** | cocky agent; instant dislike | SECRET Opener under a Closer facade | to finish what the father started | that he shot the father | the father's friend and killer, later sacrifices himself | by the water cooler, arms folded (`hqArms`) |
| 8 | **Agent Knox** | friend; started a few months earlier; timid in the field | Undecided ("always knocks first") | to prove himself | his nerves | — | on a chair under the Training Room's east booth (`hqSit`), or waiting outside your office — he knocked |
| 9 | **Rhonda** | receptionist; intake for interdimensional species | Opener (reluctantly breaks protocol; big heart, deadpan) | nobody deported | where the paperwork went | — | SEATED behind the reception counter (`hqSit`), reachable across it; a "conveniently misfiled" stack on the desk |
| 10 | **Agent Ringer** | Belle's father; respected veteran; dies on a routine mission | Unimportant | — | — | — | Training Room, east walkway, watching the grid (`hqArms`) |
| 11 | **Elle Vator** | rich mogul who funds DOOR; unannounced quality visits | Money (late-stage capitalism across realities) | profit from the Entropy Wars | why doors to poor realities close | — | mezzanine, BY THE ELEVATOR, on the phone (`hqPhone`); present about half the time; "Business is booming!" ships |
| 12 | **Dorian Gates** | formerly Agent Gates; rogue; opening doors everywhere | RADICAL Opener (wants to write canon himself) | to unite every reality under himself | "liberation" (it is conquest) | helped the father build the network; called his methods timid; witnessed his murder | model wired (`dorian`); never in the building |
| 13 | **Otto Matic** | maintenance man; renovations, new doors, the trap door in your closet | Opener (Dorian's man inside); switches back late | proof DOOR is destabilising reality | who he works for | — | mezzanine, KNEELING at the Canon Office door or a new door beside Arcane Engineering (`hqFix`), a crate beside him |
| 14 | **The Doorman** | the elusive director; orders missions and renovations | HINGE in all but name: both radical sides are necessary; keep entropy consistent; knows H-Wing | — | that he is the Janitor | — | model wired (`doorman`); never seen as himself |
| 15 | **The Janitor** | contract cleaner, $15/hr, no benefits, a key to every room; IS the Doorman | (see 14) | messes cleaned up — between realities | who he is | (the ending) | mopping outside your office (`hqPush`, mop by the bucket) — or, sometimes, in YOUR office getting supplies (`hqReach`), which is awkward |
| 16 | **Kit** | refugee catgirl saved on the first mission; cleared to stay when Rhonda "loses" the paperwork | Opener (wants doors open, never enters them; scratches them) | the option | — | — | crouched at the reception counter (`hqCrouch`) waiting on her intake — or scratching at the Records door |
| 17 | **Agent Forrest** (Woody Forrest) | gentle-giant bigfoot; slips between dimensions undetected | Closer (his woods were invaded by cameras) | privacy | — | — | mezzanine, FACING THE WALL (the roster bigfoot model; no photographs) |
| 18 | **Sedaniel** | sentient four-door sedan / killer robot; your company vehicle; paid in oil changes; bugged by Otto, overrides it at the pivotal moment | Unaligned (his doors open and close) | the open road | — | — | PARKED in Bay 1 · Terrestrial ("everything on this corridor has a parking lot") as the roster Honda Civic; both his lines ship |
| 19 | **H-Wing** | the fractal H corridor under HQ | — (a consequence, not a person) | — | — | — | not built (late game; geometry is buildable, contents are not) |
| 20 | **Room 64** | the Training Room: the only authorised square room; 8×8; "totally safe", keeps leaking | — | — | — | — | SHIPPED as the label of the walkable Training Room + its egress door |

### 2b. The cast, in full — **USER's notes verbatim (2026-09-06)**, with *[Claude]* build notes

1. **Player** — The newest recruit of D.O.O.R., who hired them after it
   lowered its recruitment standards. Their office is in the janitor's
   closet with a shabby wooden door that squeaks. Both of the player's
   parents died under mysterious circumstances. Needs money. Wants to
   discover the truth of their parents' deaths. — *Undecided Faction.*
   *[Claude: `DOOR_CAST_MODELS.player` is the HQ avatar now (map.js
   `_hqAvatar`; console `EW_HQ_AVATAR = 'vessel'` restores the old
   most-played-vessel rule). The squeak is not yet a sound — see §5.]*
2. **D.O.O.R.** — Department of Orthogonal Realities. A mysterious secret
   organization that controls canon reality. They monitor and control
   doorways between universes. It's orthogonal realities because parallel
   universes are stupid and inconsequential — parallel lines never meet.
   Orthogonal ones do though. Don't ask about other angles. D.O.O.R. fears
   right angles and issues a standard protractor to every new recruit. They
   operate out of a round facility to avoid reality leaks. Round tables,
   round computer monitors, even a round vending machine. They quite
   literally cut corners, ripping corners off of every official paper
   document to reduce orthogonality. They lowered their recruiting
   standards after a huge wave of doorways between alternative dimensions
   began opening up. The onslaught of creatures coming through and causing
   chaos in the world is called the Entropy Wars. — *Closer faction, but
   they open more doors than they'd like to admit.*
   *[Claude: all of this is already institutional canon (DOOR_MASTER A1,
   A2, A5, A8). New here: "ripping corners off every official document"
   — a paper-kit detail worth shipping (torn corners on memos).]*
3. **Player's Mother** — A DOOR agent who died in a house fire. — *Closer.*
   She could have escaped the house fire through a door, but chose to keep
   it closed and sacrifice herself to prevent what was on the other side
   from coming through.
4. **Player's Father** — A DOOR agent who died in a home invasion. He
   tried to fight off the invader but got killed. — *Opener.* He helped
   create a secret network of backdoors for creatures to seek refuge. He
   sacrificed himself after the network was discovered by keeping a door
   open to allow safe passage of refugee creatures as he stayed behind to
   fight the Closers.
5. **Agent Locke** — The Player's direct superior. A no-nonsense woman who
   does things strictly by the book, which keeps changing due to the
   Mandela Effect. Despite her serious nature, she can't stop making door
   puns. "You can trust me, I'm an open door." / "You mean book?" /
   "...Yes." She gives the player their job orientation and initial
   training. After showing the player their office, she asks on her way
   out, "Door opened or closed?" She hints at knowing the player's parents.
   — *Closer, stays loyal to the mission statement of DOOR. Was close with
   the player's mother.*
   *[Claude: both quoted lines ship as her HQ dialogue (`DOOR_CAST.locke
   .lines`). She stands at the briefing half-ring, talking.]*
6. **Agent Belle** — The Player's colleague and potential love interest.
   She ends up betraying the player by locking him in a room. — *Closer,
   formerly an Opener when it was fairies and mermaids she was saving, but
   chose to switch sides after seeing her father, Agent Ringer, die during
   a routine DOOR mission where apocalyptic monsters came through the door
   and dismembered him. She believes that good intentions without
   containment get innocent people killed.*
7. **Agent Glass** — A cocky male DOOR agent who takes an immediate
   disliking to the player. His ego is easily shattered. He also seems to
   have a past with the player's parents. — *Secret Opener, was close with
   the player's father but shot him to maintain his double agent facade as
   a Closer. The player initially dislikes and mistrusts him, even hates
   him after finding out he killed his father. Then Glass sacrifices
   himself for the Player late game. It's revealed that Glass was part of
   the Closer group that raids the backdoor network. He reluctantly raises
   the gun to shoot the player's father. The other Closers around him are
   questioning his hesitation and allegiance. The player's father gives
   him permission to shoot him, knowing protecting the Opener network is
   more important than his life or blowing Glass's cover.*
8. **Agent Knox** — A male DOOR agent and the player's friend. He only
   started a few months before the player did. He is eager to prove
   himself but is timid and shy out in the field. He bravely stands up for
   the player in times of need though. — *Undecided, he always knocks
   first.*
9. **Rhonda** — The DOOR receptionist. She does intake for
   interdimensional species like a routine office job. — *Opener, she
   reluctantly breaks protocol to grant refuge to species due to her big
   heart, despite her mundane and deadpan personality. Conveniently
   misfiles paperwork. Schedules hearings several centuries into the
   future. Declares dangerous creatures "emotional support anomalies".*
   *[Claude: seated behind the RECEPTION · INTAKE counter on the clerk's
   chair (`Sitting_Idle_Loop`), talk radius widened to 3.4 m so you can
   speak to her across the counter; a misfiled notebook stack added to
   the desk. The roster already talks about her ("Still haven't heard
   back from Rhonda yet").]*
10. **Agent Ringer** — Belle's father. Respected veteran agent. Main
    purpose is to die to be the catalyst to make Belle switch factions
    from Opener to Closer. — *Affiliation Unimportant.*
11. **Elle Vator** — A rich female mogul who funds DOOR. She makes
    unexpected visits to HQ to make sure quality is up to standards.
    Threatens to pull funding if her demands are not met. — *Allegiance to
    money, she does late stage capitalism in multiple realities and closes
    the doors to realities that are too poor or broken to buy her
    products. Profiting off of the Entropy Wars. Later revealed to be
    Dorian Gates' love interest. "Business is booming!"*
    *[Claude: on the mezzanine beside the ELEVATOR, on the phone — present
    on roughly half of your visits (the "unexpected" part is a 0.5 weight).
    The roster already knows her purse ("Every time Ms. Vator visits…").]*
12. **Dorian Gates** — Formerly Agent Gates, a disgruntled DOOR employee
    who grew resentful for never receiving the promotion he wanted. He
    also witnessed DOOR closing the door on a reality that he was from, as
    well as how they murdered the Player's father. He has gone rogue and
    is opening doorways throughout reality. Dorian believes no
    organization should have the authority to declare one reality "canon"
    and treat every other world as expendable. He initially helped the
    player's father create a backdoor network for interdimensional
    refugees, but considered the father's methods timid and ineffective.
    After the father's death, Dorian concluded that liberation without
    power was temporary. Dorian now intends to destroy DOOR's canon system
    and unite every accessible reality under his leadership. He invades
    vulnerable worlds and offers their inhabitants an ultimatum: join him
    and receive passage to Earth, or resist and risk having their reality
    destabilized by uncontrolled doorways. He calls this radical
    liberation; in practice, it is interdimensional conquest. Nearly
    impossible to capture, Dorian has weaponized the father's backdoor
    network to transport followers, invade realities, and evade DOOR. —
    *Radical Opener. Dorian doesn't truly want to abolish canon. He wants
    to write it himself.*
13. **Otto Matic** — DOOR's maintenance man. Constantly seen working on
    renovations or installing new doors. Acts as a plot device to seal off
    certain areas of the facility to the player until the story
    progresses. He is later revealed to be working for Dorian Gates. At
    one point he installs a trap door inside the player's closet office. —
    *Opener, Dorian's man on the inside of DOOR HQ. He distrusts DOOR HQ
    after discovering H-Wing, an underground corridor that is completely
    straight, with more and more doors and straight rooms popping up.
    Dorian convinces Otto that H-Wing proves DOOR is secretly destabilizing
    reality. Otto becomes Dorian's inside man, sabotaging headquarters and
    bugging Sedaniel. Late in the game, he discovers that Dorian's
    uncontrolled doorways are actually causing H-Wing to grow. Realizing
    he has been used, Otto switches sides and employs his extensive
    knowledge of DOOR's architecture to help the player navigate and
    escape the expanding facility.*
    *[Claude: kneeling with tools (`Fixing_Kneeling`) at the Bureau of
    Continuity door or at "the fourth door that wasn't there yesterday"
    beside Arcane Engineering, a crate beside him — the same two doors the
    story will have him seal and unseal. The roster already complains to
    him ("Would it kill Otto to install a swimming pool?").]*
14. **The Doorman** — The mysterious and elusive director of DOOR.
    Missions and facility renovations are ordered directly by him. —
    *Understands that both radical Openers and Radical Closers are
    necessary and the conflict is moot. Wants to maintain a consistent
    level of entropy. He knows about H-Wing, and is trying to manage it.*
15. **The Janitor** — An ordinary janitor that is contracted to clean DOOR
    HQ. He has a key to every room. He gets paid $15 per hour, no
    benefits. He is sometimes seen grabbing cleaning supplies from inside
    the player's office, which makes things awkward. He is later revealed
    to be the Doorman. His job is quite literally to clean up messes, as
    any good program manager does. His messes are between realities
    though.
    *[Claude: mopping outside your office door (`Push_Loop` against the
    mop by the bucket) seven visits in ten; the other three he is INSIDE
    your office at the shelves (`PickUp_Table`, rummaging). The Doorman
    and Janitor models are wired at the same height on purpose.]*
16. **Kit** — A refugee catgirl the player saves on their first mission.
    After being captured and transferred to DOOR HQ, she was scheduled for
    deportation, but Rhonda miraculously loses the paperwork and she is
    cleared to stay. This shows Rhonda's convenient forgetfulness and warm
    personality from the very beginning. — *Opener, she wants doors open
    but never enters them; she just likes the option. And scratching on
    them.*
    *[Claude: crouched (`Crouch_Idle_Loop`) at the public side of the
    reception counter, or scratching at the Records door. Her model is
    petite (0.88, the roster catgirl's height). As a PARTY MEMBER she is
    not wired yet — see §5.]*
17. **Agent Forrest** — Full name Woody Forrest, he is a gentle giant
    bigfoot creature that hates being photographed because he is self
    conscious. He has worked for DOOR for several years after being
    recruited for his uncanny ability to slip into other dimensions and
    avoid detection. — *Closer, his childhood home (the woods) was
    repeatedly invaded by people hoping to take pictures of him. He
    loathes paparazzi and flock cameras. Values his privacy.*
    *[Claude: no dedicated GLB in `maincharacters/` — he wears the roster
    bigfoot model, on the mezzanine, facing the wall. The cryptids' shared
    "no pictures" roster pool (A15) already agrees with him.]*
18. **Sedaniel** — A sentient 4 door sedan that can transform into a
    killer robot. He was issued to the player as a company vehicle. He is
    paid in oil changes from Otto. Otto eventually bugs him at some point
    to get info on the player, but he overrides the programming at a
    pivotal moment. — *Unaligned, his doors can open and close. "I drive a
    lonely road." "She's for the streets."*
    *[Claude: the roster's Honda Civic (car form), parked in Bay 1 ·
    Terrestrial; both lines ship. Whether Sedaniel IS the roster unit or a
    separate character is §5, item 3.]*
19. **H-Wing** — H-Wing is the accumulated consequence of DOOR's Closer
    policies. A fractal repeating H-shaped corridor. Every time DOOR
    permanently closes a reality, the displaced dimensional pressure has to
    go somewhere. Over decades, it has collected beneath headquarters and
    physically manifested as H-Wing: an expanding network of perfectly
    straight corridors, right angles, and doors leading to realities that
    officially "no longer exist." Closer policies originally created the
    accumulated dimensional pressure. Dorian's uncontrolled doors are
    accelerating or rupturing that existing formation.
20. **Room 64** — The Training Room and only authorized square room in the
    facility. An 8×8 square grid for battle simulations. Home of the
    tutorial and training exercises. Deemed to be totally safe yet
    creatures keep leaking through it.
    *[Claude: shipped as the Training Room's plate ("ROOM 64 · ORTHOGONAL
    GEOMETRY EXPOSURE AREA") and the egress door's description.]*

---

## 3. Outline — six bands on the rank ladder (2–3 chapters each)

Per band, before its chapters: what DOOR now trusts you with · what part
of the building opens · which lie you believed at the previous rank gets
replaced with a better lie · which parent-thread clue lands. The parents'
file reveal sits naturally around L3–L4; H-Wing behind L5–L6.

Chapter template (copy once per chapter):

```
#### Chapter N — "<title>"
- SP threshold (rough):
- Field requirement (`requires`):
- Promotes to (if any):
- Scenes (3–6 one-liners, who + where):
- Ambient: motto form · memos landing (stamp: DENY/ADMIT/HOLD) · building change:
- What the player believes at the end that they didn't before:
```

### Band L1 — DOORMAT
- Trusted with / building opens: *(open)*
- The lie you believe: *(open)*
- Parent-thread clue: *(open — Locke "hints at knowing the player's parents" during orientation, per the cast sheet)*

#### Chapter 1 — *(untitled)* — **USER's beats, 2026-09-06 (canon)**
- Beats (in order):
  1. Onboarding VHS video.
  2. Training / Tutorial.
  3. Reality leak / first mission. Saves the catgirl after the battle.
  4. Rhonda deems her an emotional support anomaly and Kit joins the
     player's party.
- SP threshold (rough): *(open)*
- Field requirement (`requires`): *(open)*
- Promotes to (if any): *(open)*
- Scenes: *(open — the user writes them)*
- Ambient: *(open)*
- What the player believes at the end that they didn't before: *(open)*
- *[Claude — where each beat already has a home in the engine: 1 = the
  orientation tape on the CRT beside the RANGE console in Room 64 (the
  VHS mechanism is buildable; its narration is the user's); 2 = the
  Training Room board `prebuilt_training` launched from that console;
  3 = a scripted directive match (B3) — a leak THROUGH Room 64 fits the
  "keeps leaking" note, with Kit on the field to be saved (a rescue
  objective, or Kit pinned to the far side of the board); 4 = a
  reception scene at Rhonda's counter, where Kit already crouches.]*

### Band L2 — DOORSTOP
- Trusted with / building opens:
- The lie you believe:
- Parent-thread clue:

### Band L3 — KNOCKER
- Trusted with / building opens:
- The lie you believe:
- Parent-thread clue:

### Band L4 — KEYHOLDER
- Trusted with / building opens:
- The lie you believe:
- Parent-thread clue:

### Band L5 — GATEKEEPER
- Trusted with / building opens:
- The lie you believe:
- Parent-thread clue:

### Band L6 — THE DOORMAN
- Trusted with / building opens:
- The lie you believe:
- Parent-thread clue / the ending:

---

## 4. Misc notes — **USER, 2026-09-06 (canon unless marked)**

- The player slowly grows suspicious and mistrusting of DOOR over time,
  especially after discovering H-Wing.
- At some point the player and their allies are placed on administrative
  leave after ignoring mission orders. They must take matters into their
  own hands.
- "They named the orb Silvia?" *(a line looking for its scene and
  speaker)*

---

## 5. Reconciliation — *[Claude, 2026-09-06]* — items that need the user's yes/no

Also recorded as DOOR_MASTER Part C rows 17–21. Nothing here changes the
cast; it flags where the notes rub against the older canon or the engine.

1. **Glass shot the father in a Closer raid — vs A0 #2 "DOOR did not
   order either death".** Both can stand if the raid was the CLOSERS'
   operation (the hidden hand, never named in official documents) rather
   than a Department directive, and DOOR's crime stays the falsified
   aftermath. But Dorian's line — he witnessed "how THEY murdered the
   Player's father" — reads as DOOR itself. Proposal: the raid was
   Closer-run with the Doorman's knowledge and without his order; the
   cover-up was signed above Locke. Your call on how high it goes.
2. **The office door.** The notes say "a shabby wooden door that
   squeaks"; the shipped L1 rank door is the warped janitor's-closet leaf
   (there is also a `leaf_shabby_wood` in the kit, on the Fairy Forest
   threshold and the Condemned Crossing). Options: keep the closet leaf
   and add the squeak (a door-creak SFX on the office door only — new
   `playDoorSfx` recipe), or swap L1 to the shabby wood leaf. Proposal:
   keep the leaf, add the squeak — it is the only door in the building
   that makes a sound, which is a joke that pays off at L2.
3. **Sedaniel = the roster Honda Civic?** Placed as one (car form). If he
   is a separate named character he needs his own GLB (car + robot) —
   nothing in `maincharacters/` yet. Proposal: he IS the roster unit; the
   Honda Civic dossier gets a D.O.O.R. ANNOTATION naming him and the
   transform-to-robot is already built.
4. **Kit as a party member.** The engine has a `catgirl` race with its own
   model; Kit has her own GLB. Two routes: (a) Kit's model becomes the
   catgirl race's story skin when Kit is in the party (a per-unit model
   override, like the werewolf's day form), or (b) Kit is a distinct
   locked unit that Chapter 1 unlocks. Proposal: (a) — no new race, no
   balance work, and "the catgirl" on the roster simply IS Kit once you
   have met her.
5. **The referral (A0 #1).** Untouched by the cast sheet; see §1 Q1.
6. **HINGE has no face in the cast except the Doorman.** That is fine and
   probably right — the third faction should be one person, and he is the
   ending. Noted so nobody adds a HINGE character to fill the A14 "minimum
   bench".

---

## 6. Scripts (one chapter at a time)

Scene format (maps 1:1 onto `playCutscene`):

```
### C2-S3 · "<title>" (~60s)
LOCATION: <room / context>
SPEAKERS: NAME (race), NAME (race)
[location_card]
NAME: line
NAME: line
```

*(none written yet)*

---

## 7. The parents' death + the Bayside Mall — **USER, 2026-11-24 (canon, verbatim)**

mondo, 2026-11-24 (thread "Flesh out story arcs and side quests"): "The parent's death is supposed to go more like this. It would
be a late game cutscene or mission". This REPLACES the older accounts of the parents' deaths where they differ: the house fire,
the "home invasion", Glass shooting the father (§1 Q4 + Q8, §2 #3, #4, #7, #12) and the 11-24 morning answer "Dorian does it to
protect his cover" (Locke gives the order; Dorian stays SILENT to keep his cover). Those older lines are kept above as history.
Claude's notes on it (questions, suggestions for the four "Unresolved" points) live in the doc "Story arcs in detail"
(https://claude.ai/artifact/MGAzmypWQUqxdAPhBq1btX), never here.

### SEQUENCE 1 — THE PARENTS' EXECUTION (late game cutscene or mission)

Characters: The player's mother, the player's father, Dorian Gates, Locke, August, Chronocult refugees, DOOR agents, Shadow Beings.

Dramatic purpose: Establish DOOR's brutality, the parents' involvement in an underground rescue network, Dorian's complicity through silence, and the temporal accident that leads to the mall incident.

#### Scene 1 — Escape from the dying reality
1. A reality is collapsing. Darkness is consuming the environment. The situation is urgent and increasingly hopeless.
2. The player's mother and father lead a group of Chronocult refugees toward safety. They are secretly participating in an interdimensional underground railroad, helping people escape realities scheduled for deletion.
3. August is among the refugees. The group moves through a series of corridors and doorways, attempting to escape the encroaching darkness.
4. The group passes through a doorway into another room or corridor. They believe they are escaping the doomed reality.

Directorial emphasis: Establish the physical doorway they just came through. It will become the mother's execution door.

#### Scene 2 — Locke's interception
5. Locke and several DOOR agents are waiting for them. Dorian Gates is also present.
6. The refugees realize they've been intercepted. The rescue operation has been exposed.
7. Locke confronts the parents and identifies them as traitors to DOOR. Their attempt to save people from a reality scheduled for deletion is treated as a crime.
8. Dorian remains silent. He has secretly been working with the parents to help refugees escape, but revealing that now would expose him.

Directorial emphasis: Dorian's silence matters. His reaction should convey that he understands what's happening but chooses to preserve his cover.

#### Scene 3 — The mother's execution
9. Locke orders DOOR agents to force the mother back through the doorway the refugees just used.
10. The agents push her through into the collapsing reality. The darkness is still consuming everything beyond the threshold.
11. The door is shut. Her screams and frantic knocking are audible from the other side.
12. Her screams and knocking gradually fade.

Directorial emphasis: The horror is in the closed door and the sounds behind it. The audience doesn't need to see exactly what happens to her.

#### Scene 4 — The father's execution
13. The father rushes forward, trying to save his wife.
14. DOOR agents quickly place a different, freestanding door directly in his path. This is the Void Door, not the doorway the mother was forced through.
15. The father rushes through the Void Door.
16. He falls into an endless black void. There is no visible floor or destination.
17. The agents close the Void Door, trapping him inside.

Directorial emphasis: Make the distinction between the two doors unmistakable. The mother is sent back into the collapsing reality. The father is sent into an apparently bottomless void.

#### Scene 5 — August's desperate escape
18. Meanwhile, August is attempting to escape the confrontation. He has jellyfish oil, a substance that allows temporal travel through doorways.
19. August rubs jellyfish oil onto the doorknob of a physical door.
20. He opens the door. Instead of a normal destination, it reveals a different time period.
21. The destination is unsuitable. August shuts the door and tries again.
22. Each time August opens and closes the door, it connects to a different era. Possible glimpses include prehistoric Earth, dinosaurs, or other periods unsuitable for escape.
23. August becomes increasingly frantic. He cannot reliably control the destination under pressure.

Directorial emphasis: Intercut August's repeated attempts with the parents' executions. These events overlap in time; August isn't waiting for the executions to finish before attempting escape.

#### Scene 6 — The Shadow Beings emerge
24. After the father is sent into the Void Door and the mother's screams subside, Shadow Beings burst into the room.
25. The room erupts into chaos. The Shadow Beings disrupt the confrontation between DOOR and the refugees.

Unresolved: The Shadow Beings emerge from either the mother's collapsing-reality doorway or the father's Void Door. Their precise origin has not yet been chosen.

#### Scene 7 — The doorway to the future
26. August opens his time-shifting door again.
27. This time, the doorway reveals Bayside Mall, years in the future. The contrast between the deadly corridor and the ordinary shopping mall should be immediately recognizable.
28. August and at least some Chronocult refugees escape through the doorway.
29. The Shadow Beings also pass through into Bayside Mall.
30. Dorian catches a glimpse of the future mall. He sees enough to recognize where and when the doorway leads.
31. The temporal doorway closes. August, the surviving refugees, and the Shadow Beings are now in the future.
32. Dorian remains behind with Locke and the DOOR agents. He has witnessed the parents' executions and knows that August has escaped into the future.

Directorial emphasis: Dorian's glimpse is a crucial setup. He will use the information to intercept August at Bayside Mall years later.

Unresolved: The exact visual clue that tells Dorian the date and location of the future mall.

### SEQUENCE 2 — THE BAYSIDE MALL INCIDENT
PRESENT — OPENING OF THE MAIN GAME

Setting: DOOR headquarters, followed by Bayside Mall.

Characters: The player, Locke, Dorian Gates, DOOR personnel, police, Men in Black, August, Chronocult refugees, Shadow Beings.

Dramatic purpose: Introduce the player to DOOR, establish the rivalry between DOOR and the Men in Black, deliver the first major combat encounter, reveal Dorian's betrayal, introduce the Mini Black Cube, and set up the door gun.

#### Scene 8 — Day One: DOOR orientation
33. The player arrives at DOOR headquarters for orientation. The player has joined the agency as an adult, motivated by the disappearance of their parents during childhood.
34. The player meets Locke. She is a senior DOOR official and will become the player's superior.
35. The player meets Dorian Gates. At this point, he is still publicly a DOOR employee.
36. The player begins learning how the agency operates. DOOR regulates crossings between realities and responds to unauthorized doorways.

Dramatic irony: The player possesses a photograph of their parents wearing DOOR jackets and believes they died in the line of duty. The player doesn't know that Locke ordered their executions or that Dorian was involved in their attempted rescue.

#### Scene 9 — Day Two: Unauthorized doorway detected
37. DOOR detects an unauthorized doorway at Bayside Mall.
38. Locke and Dorian accompany the player on their first field mission.
39. The team travels to Bayside Mall to investigate the breach.

Directorial emphasis: This is the player's first real operation, so the mission can function as an introduction to DOOR fieldwork and combat.

#### Scene 10 — The mall perimeter
40. The team arrives to find the mall surrounded by police cars and black SUVs.
41. Police officers and Men in Black have cordoned off the area. The situation has already attracted a major response.
42. DOOR's arrival creates a jurisdictional confrontation. The Men in Black are a separate, rival organization, and Locke particularly dislikes them.
43. The player must fight through police and Men in Black to gain entry to the mall.
44. Locke and Dorian may participate as party members.

Directorial emphasis: Play the contrast between an apparent public emergency and the absurdity of rival secret agencies fighting over jurisdiction. The Men in Black are not part of DOOR.

#### Scene 11 — Inside Bayside Mall
45. The player enters the mall.
46. Shadow Beings are attacking inside. These are the same creatures that passed through August's temporal doorway during the parents' execution scene years earlier.
47. The player fights the Shadow Beings. This is a major early supernatural combat encounter.
48. The team investigates the ongoing chaos. August and surviving Chronocult members are somewhere inside the mall.

Dramatic irony: The player is fighting creatures directly connected to the event that caused their parents' disappearance, but has no idea.

#### Scene 12 — The Mini Black Cube manifests
49. The temporal breach causes severe instability in reality. Unlike an ordinary doorway between orthogonal realities, August's time travel has violated the causal structure the Saturnian Black Cube maintains.
50. A Mini Black Cube manifests automatically at Bayside Mall. It is a response from the larger Black Cube Apparatus, attempting to stabilize the temporal inconsistency.
51. DOOR recovers the Mini Cube during or after the incident. Its stabilizing properties will allow the agency to finish its experimental door-gun prototype.

Directorial emphasis: The Cube should feel uncanny and fundamentally different from the surrounding chaos: perfectly geometric, controlled, and seemingly indifferent to the humans fighting around it.

Unresolved: Its exact appearance, the moment of manifestation, and how DOOR physically secures it. This scene can be intercut with the combat or placed after Dorian's escape.

#### Scene 13 — Dorian finds August
52. Dorian spots August amid the chaos. Dorian recognizes him from the failed evacuation years earlier.
53. Dorian takes August hostage, or appears to do so. He uses August to force his escape.
54. Dorian points a gun at Locke. His betrayal becomes public.
55. The confrontation reveals that Dorian is no longer acting as a loyal DOOR employee.

Directorial emphasis: This should be a sharp reversal. Dorian, who accompanied the player as an ally, suddenly becomes the central threat in the room.

Unresolved: How much August knows about Dorian's intentions and whether he is genuinely being held against his will or cooperating.

#### Scene 14 — The closet escape
56. Dorian takes August into a closet inside the mall.
57. Using August's temporal abilities, they turn the closet doorway into an escape route through time.
58. Dorian and August escape into the future.
59. The doorway closes, leaving Locke and the player behind.

Directorial emphasis: An ordinary mall closet becoming a time-travel doorway is a strong visual payoff for the game's central mechanic.

#### Scene 15 — Aftermath and the door gun
60. DOOR regains control of the immediate situation at Bayside Mall. Dorian has escaped, and the agency has recovered the Mini Black Cube.
61. DOOR uses the Mini Cube's stabilizing properties to complete its first functional door-gun prototype. The gun was already under development; the Cube supplies the missing breakthrough.
62. Locke gives the prototype door gun to the player. It becomes a core gameplay tool that the player will upgrade throughout the game.
63. Dorian, meanwhile, uses August to reach a future period where the door gun has been fully developed.
64. Dorian obtains the completed future door gun. He now possesses the technology necessary to open large numbers of doorways as part of his campaign to destabilize the Black Cube Apparatus.

Directorial emphasis: The player and Dorian now possess different stages of the same technology. The player begins with a limited prototype; Dorian has its fully developed future counterpart.

---

## Change log
- rev 0 — 2026-09-04 — empty worksheet created (DOOR_MASTER A14).
- rev 1 — 2026-09-06 — the USER wrote the cast (20 entries), Chapter 1's
  four beats and the misc notes; Claude recorded them verbatim (§2b),
  compressed them into the cast table (§2), marked the spine questions
  they answer (§1), placed the fifteen rigged models in the headquarters
  (the "in the building" column; build detail in DOOR_HQ_BUILD_PLAN §9
  and DOOR_MASTER Part D) and listed the reconciliation items (§5).
- rev 2 — 2026-11-24 — the USER wrote the parents' execution and the Bayside Mall incident (§7, verbatim, 15 scenes); it replaces the older death accounts in §1 Q4/Q8 and §2 where they differ (marked there, nothing deleted).
