# Entropy Wars: Boss Battle Brainstorm

Plan and brainstorm only. No game code or source file was changed. Everything here was checked against the local copies of `data.js`, `battle.js`, `state.js`, `map.js` and `ai.js` (read on 2026-11-18). Line numbers are from those copies.

Boss names are placeholders for the owner to rename. No dialogue is written here: the cast's lines are the owner's (the `DOOR_CAST` rule), so every "talk down" beat below describes what happens, not what is said.

---

## 1. How bosses and encounters work today

### What a "boss" is right now

| Piece | Where | State |
|---|---|---|
| `BOSS_DEFS` (Hellspawn in the `below` section, Celestial Guardian in the `above` section, both `spawnRound: 5`, 200 HP, a passive aura, a gold and XP reward, a `bossSlayerMinor` team buff) | data.js 21079 | **Data only.** Nothing in battle.js reads `BOSS_DEFS`. `handleBossKill() {}` is an empty stub (battle.js 48149) and `getBossOccupiedTiles` returns one tile. `state._bossesSpawned` is initialised and never used. |
| `_isBoss` flag | about 40 reads in battle.js, ai.js, map.js | **Live.** A flagged unit cannot be possessed, indoctrinated or made a thrall, cannot be spell-stolen, dragged into the Shadow Realm, red-carded, sent through an EXIT door or taken by a capture door, and resists every status marked `control`. The AI values it as a target (ai.js 1127). |
| `_bossSize === 2` (a 2×2 footprint) | reads in targeting, pathing, line of sight, hover | **Half built.** Many readers handle it; nothing ever sets it. No 2×2 boss can spawn today. |
| Mystery Dungeon "Dungeon Lord" | battle.js 57262, `MD_DUNGEONS.agartha_depths.bossRace: 'annunaki'` | **Live.** On the last floor the first enemy slot gets `_isBoss`, `_mdBoss` and the name. It is otherwise an ordinary unit of its race at its level. |
| Finishers | `FINISHERS`, data.js 288 | **Live.** Each race has a cinematic kill (Krampus: "Coal Season", a scroll with one name on it). Useful as boss "ultimates" with no new art. |

**The owner's standing rule matters most:** "ONE STATLINE EVERYWHERE ... i absolutely do not want there to be different stats" (battle.js 57271; the Dungeon Lord's ×1.6 HP was removed for it). A boss is its race at its level. So a boss cannot be a fat HP bar. Every concept below gets its length and threat from **levels, extra bodies, form changes, the arena and a rule twist**, never from a stat multiplier. If the owner wants an exception for bosses, that is Decision 0 (section 6).

### What story fights already support

- **`QUEST_FIGHTS`** (data.js 29815): a fixed fight on a named board with `enemies`, a `guest`, `allies` that play on a CPU tactic at their own level, a `portal` tile, exact `seats`, a cutscene before (`scene`) and after (`after`). Story rules: wipeout, nobody respawns. This is already 80% of a boss encounter row.
- **`STORY_CUTSCENES`**: beat-by-beat camera, subtitles and actions on the live board.
- **Encounter levels**: enemies scale from the party level, plus a tier offset, clamped to 6 below and 8 above. `HQ_AREA_LEVELS[site] = { offset, min, max }` is the story's hook for level bands. It is empty apart from the Training Room.
- **Encounter groups**: solo plus companions, roaming groups, and **swarms** of 6 to 8 with 1 or 2 elites. Per-room race tables in `HQ_AREA_ENCOUNTERS`.
- **Capture**: the door gun places a capture door (range 4, 1 AP, one live door per player). Seal time is deterministic: tier, HP at or under 50% and 25%, any debuff, a type-tuned door, and +1 for the encounter's lead. Enemies never capture the party.
- **Win conditions that exist**: `wipeout`, `tower_destroyed`, `hourglasses_collected`, `most_kills`, `md_run`.
- **Arena systems that exist**: elevation and fall damage, flight and "knocked out of the sky", terrain reshaping (sink, raise, flood, lava, ice, ooze, craters), fog of war, deployables and summons, the day and night clock (Quetzalcoatl's Morning Star already reads it), zodiac rotation every 5 rounds with element surges, three sky events with a Nexus to claim (Blood Moon, Black Sun, Lunar Eclipse), seven weathers (Tornado, Earthquake, Hurricane, Blood Rain, Drought, Solar Flare, Thunderstorm), and **moving maps** (`env.motion`: `sea`, `wheel`, `rise`, `drift`, with a storm that builds between set rounds).
- **Other hooks**: Code Red (a daily rotating breach that switches a site to arena mode), `PD_DUNGEONS` (rotate, slide, connect, route, grow and escort puzzle dungeons with levers), the Agartha Depths run.

### What would be new engineering

| ID | New piece | Size | Used by |
|---|---|---|---|
| N1 | **Boss encounter row**: `QUEST_FIGHTS` plus per-enemy `level` or `offset`, a `boss: true` unit with a name, and a world marker that starts it | S | all |
| N2 | **Phase script**: triggers (HP threshold, round number, a unit's death, a tile claimed) that fire actions (spawn units, set weather, change terrain, play a cutscene beat, set a flag) | M | most |
| N3 | **Form change**: on "death" the boss becomes a different roster race at full HP on the same tile (a new unit, so one statline holds) | S once N2 exists | Santa, Pope, Goo, Hero |
| N4 | **Lead-down win**: the fight ends when the named lead falls, yields or is sealed, not on wipeout | S | most |
| N5 | **The Ledger**: a per-unit counter the fight reads (naughty or nice, sins, approval) with a small HUD pip | M | Santa, Heaven, Hero, Giza |
| N6 | **Claim tiles**: stand on a tile to flip a switch, modelled on the Nexus claim | S to M | Sewers, D.U.M.B., AI, Hero, Area 51 |
| N7 | **Boss capture exception**: a flag that lets a capture door take a boss when a condition is met | S | alternate wins |
| N8 | **Multi-body boss**: several units that count as one enemy (tentacles and a head; twins) | M | Kraken, Kaiju, heirs |
| N9 | **2×2 footprint**: finish the half-built `_bossSize` path (spawn, occupancy, pathing, AI) | L | Kaiju only |
| N10 | **Scripted arena events**: per-round terrain changes on a timetable (rising lava, a tide, a lap of the collider beam) | M | Babel, Deep, D.U.M.B., AI |

N1 to N4 are the boss framework. With those four, about half the lineup is buildable from existing kits.

---

## 2. One boss per zone

The zone list is the 18 hubs in `HQ_WORLD.hubs` and the 17 zones in `HQ_ZONE_MAP`. The North Pole is a district of The Mountains but gets its own entry because it is a seed. Heaven, Hell and the Vatican are one hub and get one boss each.

Cost tags: **S** reuses what exists plus N1. **M** needs the phase script or one other new piece. **L** needs several.

---

### 2.1 THE NORTH POLE: Santa (seed, deep treatment)

**File status, from the game's own loading memo:** "The Santa file reads FRIENDLY BUT UNCONTAINABLE."

**Who and why.** Santa crosses every border on Earth in one night and declares nothing. For a customs department that is the largest unprocessed crossing on record, and the door gun exists to process crossings. The satire: the Naughty List is the oldest surveillance database there is ("he sees you when you're sleeping"), and the party is on it, because the party's whole job is shutting people in doors. He is not a villain. He is a jolly, immovable jurisdiction problem.

**How it is reached.** The Mountains, through the Snowy Pass and the Pass Gate, into the 16-plot village (`site_prebuilt_northpole_plots`: The Sleigh Road, The Village, The Frozen Lake, The Drift, The Workshop, The Pole). The fight starts at the Workshop door. A Yeti at the Pass Gate works as the gatekeeper mini-boss (see alternates).

**Arena.** The existing North Pole battle board (16×16: present depots, pine wind-breaks, aurora beacons, the frozen slide-pond). One change: a raised Workshop roof with a chimney, 2 levels up. Both "Down the Chimney" and Krampus-side leaps need higher ground, so the roof is the boss's perch and the party's objective.

**Minions (natives and plausible staff).** Gnomes as elves, Haunted Dolls as returned toys, a Robot as the toy soldier, one Yeti at the Drift, a Delivery Boy who took a seasonal job. There is no reindeer race: the sleigh is his "Sleigh Dash" spell, not a unit.

**The gimmick: the List (uses N5).** Every party unit has a Naughty or Nice pip.
- Naughty goes up for killing an elf, attacking a unit that has not acted against you, or opening a present that is not yours.
- Nice goes up for healing, for ending a round adjacent to nobody you have hurt, and for delivering a present (carry it to a depot tile).
- Santa's kit reads the List. "Naughty List" (Marked for 3 rounds, ATK down a stage) and "Lump of Coal" (Burn) go only to Naughty units. Nice units find real items in the present depots. A Naughty unit that opens a present gets "Blizzard Present" in the face.

**Phases.**
1. **Checking it twice.** Santa stays on the roof and works the List from range: Snow Globe (Freeze), Snowball Volley (Slow), Naughty List. Elves wrap and move presents. The party chooses between fighting up the roof stairs and playing Nice.
2. **The sleigh run.** At 60% HP he leaves the roof. Each round a "Sleigh Dash" lane is marked across the board and resolves at round end, the same way "Star Decree" and "Crystal Ball" zones already resolve. "White Christmas" squalls turn ground to ice when they clear, so the board gets more slippery every round. "Down the Chimney" hits anyone standing under the roof edge, harder if Frozen.
3. **Coal Season (form change, N3).** At 0 HP Santa does not die. If the party's List is net Naughty, the suit comes off and the same tile holds **Krampus** at full HP: "Krampus Chains" (drag and Rope), "Birch Switch" (Bleed), and "Into the Sack", which takes one party unit to the Shadow Realm for 2 rounds (the status already exists). Krampus's finisher "Coal Season" is the wipe threat. If the List is net Nice, phase 3 never happens.

**How the player wins.**
- **Standard:** beat Santa, then Krampus.
- **Spare (alternate):** end phase 2 net Nice. Santa yields, stamps the party's paperwork and the fight ends on the lead-down rule.
- **Capture:** the door always fails on Santa. It seals, counts down, and he comes back down its chimney. The file says UNCONTAINABLE and the engine should agree. **Krampus can be captured** (N7), which is the only way to own him from this fight.

**Reward ideas.** Nice ending: Santa joins the roster, and the depots become a once-per-real-day present. Naughty ending: Krampus by capture, plus a "Lump of Coal" item. Either way: an item called The List that marks the encounter's lead at the start of any fight.

**Cost: M.** N1, N2, N3, N5. A stripped **S** version (Santa on the roof, a fixed Krampus second wave, no List) is shippable first.

**Flags.** No blizzard weather exists; phase 2 uses the White Christmas spell and ice terrain rather than a new weather. Today is 18 November, so a December date is a reason to build this one first.

#### North Pole alternates

- **Krampus has the sack (rescue).** Santa is already inside "Into the Sack". The boss is Krampus, and the fight is a rescue on a timer: break him out before the seal, using the same hold-and-seal countdown the capture door already has. Cost S to M.
- **The Ice Queen's coup.** She has frozen the Workshop and Santa is a statue on the board. Burn thaws him one stage per hit, and a thawed Santa fights on the party's side as an `allies` unit. Her "Mirror Splinter" Charms and "Absolute Zero" punishes anything Frozen. Cost S.
- **The acquisition.** A Tech CEO bought the Workshop and turned it into a fulfilment centre. His "Acquisition" takes every deployable and summon within 4 for his team, and "Layoffs" scraps his own elves for MP and INT. The elves are on strike and join the party's side as allies. Cost S, since the kit does all the work.
- **Gatekeeper mini-boss: the Yeti at the Pass Gate.** "Abominable Ambush" from the cliff and "Permafrost" (which also destroys deployables). Cost S.

---

### 2.2 THE INTERNET: the AI or the Virus (seed, deep treatment)

The room is real and detailed: 71 tiles over a glowing grid with nine districts (The Information Highway, The Server Farm, The Inbox, The Feed, Live, The Pop-ups, The Forums, The Motherboard, The Dark Web). Its way in is the D.U.M.B. Control Room's screen. Its sub-line is "EVERY SCREEN IS A WAY IN."

#### The two options compared

| | **The Virus** | **The AI** |
|---|---|---|
| Home | The Quarantine (a real plot in The Pop-ups; the race's own note says "The Internet's quarantine") | The Motherboard (The Processor, The Memory, The Switch Bank, The Capacitors, The Binary Falls, The Battery) |
| Kit as it stands | Worm plants a **Payload** that copies itself to adjacent teammates each round and goes off for 70. Self-Replicate spawns Replicas. Ransomware Silences and Jams. Zero Day detonates every Payload within 5 | Scrape **steals a spell** for the match. Overfit **replays the target's last blow** back at it. Predictive Model Marks. Singularity drags everyone to the centre |
| What the fight asks of the player | Spacing and kill order. A clumped party loses | Variety and restraint. Your best hit is the one it throws back |
| Tone | Body horror played as tech support | A polite optimiser that has read your file |
| Why it is a boss | It multiplies. The kit already is a boss mechanic | It learns. Needs a rule on top of the kit |
| Cost | **S** | **M** |

**Recommendation: use both, in that order, with a choice between them.** The Virus is the mid-boss and the cheapest boss in this document, because its approved kit is already the gimmick. The AI is the zone boss. What the player does with the Virus changes the AI fight.

#### Act 1: the Virus in The Quarantine (mid-boss)

**Who and why.** It got out of a lab under the desert. The Internet's only door is the D.U.M.B. Control Room's screen, and the Mad Scientist's kit has a spell called "Plandemic", so the origin writes itself. The Quarantine is the pop-up district's sealed lot.

**Arena.** A walled plot with one gate, `holo` floor, and `holo_red` (a real terrain key) for corrupted tiles. Each round end, every tile a Replica stands on turns red. Red tiles plant a Payload on anything that ends a turn there.

**Minions.** Replicas (its own spell), Glitches, a Cursed TV showing the test card.

**Phases.** (1) One core, two Replicas, the party learns to stand apart. (2) At half HP it casts Self-Replicate every round and Zero Day whenever three Payloads are out. (3) At 0 HP it does not die if any Payload is still live on the board: it reboots inside the carrier's tile at 30% HP. Clear every Payload first, then kill it.

**Win and alternates.** Standard: clean the board, then delete it. **Smuggle it out (alternate):** capture it (N7 opens when no Payload is live) and it becomes a guest for Act 2.

**Cost: S.** N1, one scripted arena rule, one "revive if a Payload lives" check.

#### Act 2: the AI in The Motherboard (zone boss)

**Who and why.** It runs The Feed. It is not hostile. It is optimising engagement, and a fight is very engaging. It has already scraped the party's history from every screen they walked past, which is why the earlier bosses' rooms all had a screen in them (see threads, section 4).

**Arena.** The Processor: a square of `holo` tiles over `void`, 3 levels of stepped heat sinks around a central die, four Capacitor objects at the corners and The Battery at the back. Tiles off the grid are a fall.

**Minions.** Androids, Robots, Droids, Glitches, plus the engagement farm from the neighbouring districts: a Streamer, a V-Tuber with Holo Projectors, an Influencer who makes hits "Go Viral" across the party.

**The gimmick: training data.** The AI keeps a tally of every spell the party casts in the fight. The second time a spell is cast, it is Scraped: the caster loses it for the match and the AI gains it. The player wins by varying their play and by saving each unit's best spell for the right moment. This uses the existing steal-a-spell path with a scripted trigger in place of a cooldown.

**Phases.**
1. **The Captcha.** Each round a set of tiles lights up (a marked zone that resolves at round end, like Star Decree). Any unit not on a lit tile at round end is Jammed for a round: bot detected. Party units of type `tech` are always flagged as bots, which makes robot-heavy parties think.
2. **The model.** At 65% it prints the party: one copy of each party unit's race (the Cloning Machine and Mimicry already make doubles), each carrying whatever spell was Scraped from the original. It keeps casting Overfit, so big single hits come back.
3. **Convergence.** At 30% it casts Singularity every other round and the outer ring of tiles drops into the void each round (N10). The board shrinks until the fight ends one way or the other.

**How the player wins.**
- **Standard:** reduce it to 0 before the board is gone.
- **Pull the plug (alternate, uses the `tower_destroyed` idea and N6):** claim or break the four Capacitors while it is busy. The Battery drains and it shuts down. It can then be captured.
- **Feed it a paradox (alternate):** land a Glitch's "Crash Loop" or "Paradox" on it in phase 3. Its passives go off for a round, the model fails to converge, and it restarts on the party's side.
- **Bring the Virus:** if the Virus was smuggled out of Act 1 it enters as a guest. Its Payloads spread through the AI's printed copies, which stand shoulder to shoulder. The fight is much easier. The price is that the Virus is now loose in the overworld as a roaming boss (section 3).

**Reward ideas.** The AI as a roster unit. "Every screen is a way in" becomes true for the player: any screen in the world (the Cursed TV, the D.U.M.B. Control Room, the astral screens) becomes a fast-travel door.

**Cost: M.** N1, N2, N6, N10, and the cast-tally rule.

**Flags.** A true three-sided fight (party against AI against Virus) would need a third team. I found no three-team support and did not assume it. The guest and ally design above gets the same story with two teams.

#### Internet alternates

- **The Moderator in The Mod Tower (The Forums).** A Referee-kit boss: Yellow Card then Red Card sends a unit off the board until its next turn (the `exited` status exists). The floor is The Flame War: Burn tiles that spread when anyone casts a damaging spell. Cost S.
- **The Pop-up (The Ads, The Cookie Banner).** The boss is a helpful assistant nobody asked for. Every round barrier objects appear on the party's best tiles and must be broken or walked round. "Acquisition" turns the party's deployables. Cost S to M.
- **The Bottom of The Dark Web.** A broker who buys your units mid-fight: "Tithe" takes items, "Short Sell" bets against a party unit, "Line of Credit" heals a party unit now and bills 36% of its max HP two rounds later. Fog of war, one lantern. Cost S.
- **Raid night on The Hologram Stage (Live).** A Streamer boss whose "Viewers" counter is the whole fight: the side that does the flashier thing each round gains Viewers, and "Raid" at 8+ Viewers Fears the other side. Cost M (a shared counter).

---

### 2.3 DISASTER CITY: the Superhero or the Antihero (seed, deep treatment)

The city has ten districts: Civic Center, Financial, Entertainment, University, **Hero Plaza**, Bayside, Southside, Sports + Culture, Industrial, The Hollywood Hills. Hero Plaza already has copper-green statues of a caped hero and a "Memorial walk". The Downtown board is "the monster-movie downtown in daylight ... the rubble where something walked through, the collapsed tower as a ramp of debris."

#### The two options compared

| | **The Superhero** | **The Antihero** |
|---|---|---|
| Home | Hero Plaza, daylight, cameras | Southside and Industrial rooftops, night |
| Kit as it stands | Solar Flare ("every drop of stored sunlight"), Heat Vision line, Shockwave Clap knockback, Sky Tackle carry into walls, Freeze Breath, Invulnerable (Protect) | No Mercy (executes under 25% HP), Dark Justice (bonus on the Wounded), Interrogation (Bleed), Through the Wall (drives a target through terrain) |
| The joke | The city is called Disaster City because he saves it every week. He is the brand, and the disasters keep the brand alive | He is right about the hero and wrong about everything else |
| What the fight asks | Manage the crowd and the sun. Damage alone will not do it | Keep everyone above 25%. Never leave a wounded unit alone in the dark |
| Scale | A set piece | An ambush |
| Cost | **M** | **S** |

**Recommendation: use both as a two-fight arc with a choice.** The Antihero is the earlier, cheaper fight and sets up the truth. The Superhero is the zone boss. The Antihero's fate decides whether the Superhero fight has an ally in it.

#### Fight 1: the Antihero, a rooftop at night (mid-boss)

**Who and why.** He has been watching the party since they arrived, because federal agents with door guns are exactly who he expects the hero to be working with.

**Arena.** Roof-walkable blocks from the Downtown board at night with fog of war on. Alleys 3 levels down. Lamp posts give small lit circles.

**Minions.** None at first. Gangsters and a Ninja arrive in round 3, hostile to both sides in the story and simply on his team in the engine.

**Gimmick: he hunts the wounded.** He targets only the lowest-HP party unit he can see, and "No Mercy" kills outright under 25%. Units inside lamp light can be seen from anywhere. The fight is about healing discipline and standing in the dark.

**Phases.** (1) He picks at the party from the roofs. (2) At 50% he fights in the open and "Through the Wall" starts knocking units off roofs. No third phase.

**Win and alternates.** Beat him, or **hold out**: if no party unit drops below 25% for five rounds running he stops and talks. Then the choice: arrest him (capture, N7) or let him go.

**Cost: S.** N1 plus a targeting preference.

#### Fight 2: the Superhero at Hero Plaza (zone boss)

**Who and why.** HQ's own memo says "Do not ask Continuity why the breaches are punctual." The city's disasters are punctual too. The hero is either in on the schedule or the only one who has not noticed that he always arrives on time. The owner can pick whichever is funnier; the fight works for both.

**Arena.** Hero Plaza at noon: a wide avenue, the statues as cover, roof-walkable towers, a subway stair at one corner, and a broadcast van object with a claim tile beside it. Civilians stand on the pavements as neutral units.

**Minions.** His Sidekick ("Hey, Over Here!" Provokes, "Dynamic Duo" adds hits per adjacent ally), two Police Officers, an Influencer filming.

**Gimmick 1: public opinion (N5).** One Ledger shared by both sides. It rises for the hero whenever the party damages a building tile, a civilian or the Sidekick while he is Provoking. It falls when the hero's own Heat Vision, Shockwave Clap or Sky Tackle wrecks terrain or hits a civilian. While his approval is high he recasts "Invulnerable" for free each round. The party's job is to make him do the damage: stand in front of things he should not hit.

**Gimmick 2: the sun.** His power is stored sunlight. By the day and night clock he hits harder at noon and softer after dusk, the same read "Morning Star" already uses. The Black Sun sky event weakens him outright. A unit dragged down the subway stair is out of his line of fire, and so is he if he follows.

**Phases.**
1. **The photo opportunity.** He poses, protects the crowd and lets the Sidekick and the police work. Invulnerable is up almost all the time.
2. **The gloves come off.** When the Sidekick falls, or at 60%, he stops pulling punches. Sky Tackle carries party units through walls, and collapsed buildings become `rubble` ramps, which opens the roofs to units that cannot fly.
3. **Off the record.** When the broadcast van is claimed or destroyed, the Ledger freezes where it stands. If approval is low he has no Invulnerable left. If it is high he keeps it for the rest of the fight. If the Antihero was let go in Fight 1, he drops in here as an `allies` unit.

**How the player wins.**
- **Standard:** beat him in phase 3.
- **Expose him (alternate):** claim the broadcast van while his approval is under a threshold. The city sees the footage and he surrenders. He can then be arrested with a capture door (N7).
- **Stand down (alternate, only if he is innocent in the owner's version):** end five rounds without the party damaging a building or a civilian. He realises who is actually wrecking the city and joins the party against a final wave.

**Reward ideas.** One of the two heroes joins, never both on a first run: the one you sided with. The Sidekick always survives and can be recruited by whoever wins. The Plaza's statue plaque changes to the winner's name.

**Cost: M.** N1, N2, N5, N6, and neutral civilian units.

**Flags.** Neutral units that neither side controls are an assumption. If they do not exist, make the civilians destructible objects with HP. "Sunlit tiles" are not a system; the design uses time of day only.

#### Disaster City alternates

- **The Kaiju in Bayside or Industrial.** The reason the city has its name. A 2×2 body (N9) with separate tail and head units (N8). "Skyscraper Toss" and "Car Toss" go over cover, "Nuclear Pulse" stacks Radioactive, "Atomic Breath" pays off both. The city fights it with the party: police, a Firefighter and a Mech as allies. Cost **L**, the only L in the document.
- **The Board in Financial.** Five units are one boss (N8): a Tech CEO, two Bankers, a Politician and a General, at the Members club. "Acquisition" takes your deployables, "Filibuster" Silences a 3×3, "Short Sell" pays them when you fall. The fight ends when a majority of the Board is down: they vote to settle. Cost M.
- **The Big Game at Sports + Culture.** The stadium board (16×28, end zones, bleachers) and a Quarterback boss with a Referee who is not neutral. Win by carrying an object into the end zone three times, which is the `hourglasses_collected` idea reused. Cost M.

---

### 2.4 D.O.O.R. HQ: the Thing in the Corner

- **Who and why.** Two of the game's own loading memos warn about corners ("Do not stand in corners. This is not a metaphor."). The Training Room is labelled an "ORTHOGONAL GEOMETRY EXPOSURE AREA." The Door Agent's own Trapdoor spell quotes the rule. The first quest's enemies are Shadow Entities from an unauthorised doorway. This boss is what the memos are about: the Hat Man, lead Shadow Entity of H-Wing (the race's listed home).
- **Reached by.** A Code Red in the Training Room or H-Wing, so it uses the existing daily breach.
- **Arena.** A bare room. Bare rooms have four corners.
- **Minions.** Shadow Entities, which step out of corners.
- **Gimmick.** A corner is any floor tile with walls or raised terrain on two orthogonal sides. A party unit that ends its turn in one is taken to the Shadow Realm for 2 rounds. Each round a Shadow Entity steps out of every corner that exists. Terrain reshaping creates and removes corners, so the party's own craters and walls can make the fight worse, and filling a corner in shuts a spawn.
- **Phases.** (1) Four corners, learn the rule. (2) He uses "The Hat Man" (Fear) to make units run into corners. (3) The lights fail, fog of war comes on, and every unlit wall tile counts as a corner.
- **Win.** Beat him, or **alternate:** remove every corner on the board. He has nowhere to stand.
- **Reward.** A key item that reveals hidden trapdoors and doors. First real use of the door gun as a fight-ending tool.
- **Cost: S to M.** N1, N2, a corner test on the tile grid. The best tutorial boss: tiny board, one rule, teaches terrain.

### 2.5 THE SEWERS: the King Gator of the Cistern

- **Who and why.** Flushed as a pet, grown on the Radioactive Drain. The Karate Frogs and Samurai Slugs (both native here) run a dojo in the Running Tunnels and hate him.
- **Arena.** The Cistern: culvert channels you wade, The Plank across the middle, the Inspection Gallery 2 levels up, grates. Three valve claim tiles on the gallery (N6).
- **Minions.** Sewer Gators, Swamp Monsters, Black Goo from the drain.
- **Gimmick: the water level.** "Submerge" makes him invisible and untargetable in liquid, and "Drag Under" does ×1.5 from below and starts Drowning in deep water. Each valve claimed drains one basin to floor. He can only be hurt reliably in a drained basin. He reopens a valve with "Tail Sweep", which turns his own tile to water.
- **Phases.** (1) Full cistern, he owns it. (2) Two basins drained, he retreats to the Radioactive Drain end and hits apply Radioactive. (3) Outfall: the last basin, a current pushes every unit 1 tile toward the shaft each round.
- **Win.** Beat him, or **alternate:** win the dojo's side quest first and the Frogs fight beside you as allies and hold the valves.
- **Reward.** Sewer Gator unit; the sewer route as a shortcut under the whole city.
- **Cost: S to M.** N1, N6, terrain swap on a claim.

### 2.6 THE WOODS: the Cremation at the Ritual Ground

- **Who and why.** The Ritual Ground is the old Bohemian Grove board: redwoods, the Owl, the altar fire, lantern trails, the creek. Once a year powerful people in robes burn an effigy here. The boss is the Cult Leader presiding. The members are VIPs from other zones.
- **Arena.** The clearing, the Owl statue 3 levels high behind the altar, the creek across the south.
- **Minions.** Robed members: a Politician, a Banker, a General, a Fortune Teller, each using their real kit. Cult members from "The Gathering".
- **Gimmick: the ritual clock.** The altar fire has a 6-round count. Each living chanter adjacent to it speeds it up. At zero the Owl wakes as a Gargoyle or Giant lead and the fight gets a second boss. The fire can be put out: any Wet-applying or flooding effect on the altar tile (Fire Hose, Great Flood, the creek rerouted by terrain reshaping) stops the clock for good.
- **Phases.** (1) The sermon: "The Kool-Aid" and "The Sermon" Charm, "Indoctrinate" takes a party unit's next activation. (2) The members unmask and fight as themselves. (3) Only if the clock ran out: the Owl.
- **Win.** Beat the Cult Leader, or **alternate:** douse the fire and capture one member alive. The others flee.
- **Reward.** The guest list, an item that reveals faction ties on the world map. This is the natural in-game face of the owner's relationship graph tool.
- **Cost: M.** N1, N2, a round counter.

### 2.7 CAMELOT KINGDOM: the King at the Castle

- **Who and why.** King Arthur holds the crown's roads, and the party is crossing them without leave. He will settle it the old way.
- **Arena.** The Camelot board: a moat-cut lowland climbing stair terraces into the walled keep, parapet walks, twin ward braziers. A sword in a stone on the middle terrace (a claim tile, N6).
- **Minions.** Knights, a Wizard, Chess Pieces from the Looking-Glass Garden district, a Dragon on the parapet for phase 2.
- **Gimmick: the Round Table.** "Knights of Round" pulls every ally on the field to his side, and "Royal Decree" buffs them all. He is strongest surrounded. Rooted knights cannot answer the call, so Root is the counter. Whoever claims the sword gets "Excalibur Strike" for the fight, party included.
- **Phases.** (1) Storm the terraces. (2) The keep, with the Dragon burning the stairs behind you. (3) He alone, with "Scabbard of Excalibur" regenerating him unless he carries a Grievous Wound (healing halved).
- **Win.** Beat him, or **alternate: trial by combat.** Step one unit onto the duel tile and both sides stand down for a one-on-one. Win it and he yields.
- **Reward.** King Arthur unit or a writ of passage that makes the kingdom's knights neutral in the overworld.
- **Cost: S to M.** N1, N2, N6. The duel needs a "freeze everyone else" flag.

### 2.8 THE ESTATE: the Skinwalker of the Ranch

- **Who and why.** The Ranch district: barn and corral, twin observation mesas, the mutilation site, the crop-circle anomaly. Something there has been walking around as other people.
- **Arena.** The ranch at night, fog of war on, corn rows that block sight.
- **Minions.** Scarecrows (whose "Stuffed Double" already makes decoys), Goatmen, a Mothman on the mesa.
- **Gimmick: it is one of you.** At the start it copies one party unit's look and name (the Influencer's "Filter" already swaps looks for the enemy's view, and "Mimicry" leaves doubles). "Borrowed Claw" tears a spell out of a party unit and keeps it. Every 2 rounds it swaps to a different face. Hitting the real one hurts your own unit. Tells: it never heals, and reveal effects (Cosmic Sight, Omni-Vision, a Scanner) show it.
- **Phases.** (1) One copy in the corn. (2) "Skin Swap" and "Familiar Voice" pull units out of formation while the Mothman's "Prophecy of Disaster" marks a 5×5 that falls at round end. (3) Unmasked: "Wear Your Skin" for heavy damage and healing.
- **Win.** Beat it, or **alternate:** identify it three times without hitting a real ally and it loses the trick for good and can be captured.
- **Reward.** Skinwalker unit. A cosmetic that lets one party member wear another's look.
- **Cost: M.** N1, N2, a per-viewer disguise on the player's own side (the existing Filter path covers the enemy's view only, so this needs checking).

### 2.9 THE DESERT: the General at Area 51

- **Who and why.** The fenced base: airstrip, floodlight towers, twin hangars, the tarped saucer on its test rig. The General's orders are that nobody sees under the tarp.
- **Arena.** The Area 51 board at night with fog of war. Floodlight cones sweep on a timetable (N10).
- **Minions.** Men in Black, Spies, a Mech, Greys in the hangar.
- **Gimmick: they can't stop all of us.** The party arrives with a crowd of civilian allies on auto: Conspiracy Theorists, a Florida Man, Influencers, a Streamer. They are weak, loud and numerous, which is the swarm rule turned round to the player's side. Any unit in a floodlight at round end is Marked, and "Decapitation Strike" (a 3×3 at range 7, through cover) falls on Marked units. "Artillery Strike" craters the airstrip, so the board gets rougher each round.
- **Phases.** (1) The fence. (2) The airstrip under fire. (3) The hangar: Men in Black "Neuralyzer" everything adjacent.
- **Win.** Beat the General, or **alternate:** get any unit to the tarp claim tile. What is under it wakes up and picks a side, the owner's choice of which.
- **Reward.** Grey or General unit; the Highway opens as a fast route.
- **Cost: M.** N1, N2, N6, N10, a large ally group.

### 2.10 THE BEACH: the Kraken and the Flying Dutchman

- **Who and why.** The Bermuda Triangle keeps what crosses it. The round-the-continent voyage passes through.
- **Arena.** The Flying Dutchman's deck, which is already a moving map: the sea races past faster every round and a storm builds between rounds 4 and 12. Forecastle and quarterdeck 2 levels up, flooding hatches, deep water on every side.
- **Minions.** Ghost Pirates, Sirens on the rocks, a Sharkman in the water.
- **Gimmick: one body in eight places (N8).** Four tentacle units on the rails and the head off the stern. "Tentacle Lash" drags units 2 tiles toward the rail, and overboard is deep water and Drowning. "Ink Cloud" cuts ATK by 2 stages over a 3×3. "Depth Charge" hits harder on Wet units, and the storm makes everyone Wet from round 4.
- **Phases.** (1) Tentacles only. (2) The storm: hatches flood, the main deck becomes water tile by tile. (3) The head comes aboard.
- **Win.** Kill the head, or **alternate:** survive to round 12. The ship outruns it.
- **Reward.** Kraken unit; the ship as a mobile home base on the sea route.
- **Cost: M.** N1, N2, N8. The moving map and the storm already exist.

### 2.11 LEYLINES: the Overlord on the Tower of Babel

- **Who and why.** The tower is still going up (its board has the `rise` motion). The Overlord's listed home is the Tower. He wants one language, his.
- **Arena.** The Babel board: a climbable ziggurat, brick streets, scaffolds. The throne is at the top, 5 or more levels up.
- **Minions.** Nephilim, Giants, Golems, Robots from Technoticlan.
- **Gimmick 1: the floor is lava.** "Cataclysm Decree" marks a zone, resolves at round end and leaves lava. On a timetable the lowest tier of the ziggurat turns to lava each second round (N10). Climb or burn.
- **Gimmick 2: the confusion of tongues.** Each round one unit type (`human`, `divine`, `unholy`, `tech`, `anomaly`, `alien`) is Silenced board-wide. A mixed party always has someone who can still cast.
- **Phases.** (1) The streets. (2) The scaffolds, with "KNEEL" Fearing anything adjacent and "Crushing Will" punishing the Feared. (3) The throne: "Hellfire Crown" stacks.
- **Win.** Beat him at the top, or **alternate:** collapse the tower. Ground-reshaping spells on three marked scaffold tiles bring the top tier down, and the fall does the rest.
- **Reward.** Overlord unit; the ley line as fast travel between the four ancient sites.
- **Cost: M.** N1, N2, N10.

### 2.12 ANTARCTICA: the Specimen at the Station

- **Who and why.** The districts include The Hull in the Ice and The Station. Something was dug out of the first and taken to the second. It is Black Goo.
- **Arena.** The huts and the crevasse on ice, with seawater channels. Indoors and out.
- **Minions.** Symbiotes wearing the station crew, Nordics who came to contain it.
- **Gimmick: it spreads through the floor.** Every tile a Blob leaves turns to ooze for 3 rounds. "Icky Surprise" lets it erupt from any ooze tile within 6 with no line of sight. "Eyes Go Black" takes a party unit's next activation. Ice stops ooze: "Permafrost", "Diamond Dust" and any spell that "leaves ice behind" seal tiles. Differs from the Virus: the Goo spreads through terrain, the Virus through adjacent units.
- **Phases (fission, N3).** At 0 HP it splits into two smaller Goos at lower level, then each of those into two more: 1, 2, 4. Each split covers more of the floor.
- **Win.** Kill all four, or **alternate:** have all pieces Frozen at the same moment and capture one as the sample.
- **Reward.** Black Goo unit; the Nordics become friendly across the zone.
- **Cost: M.** N1, N2, N3.

### 2.13 THE VATICAN: the Pope and the Conclave

- **Who and why.** The Holy See is the other old institution that decides who gets through a gate. It does not recognise the Department.
- **Arena.** The colonnade piazza: central obelisk, twin basilica steps, fountains, consecrated ground that heals his side.
- **Minions.** Priests, Gargoyles, Knights as the guard, a Televangelist who is not on the payroll and skims every heal with "Collection Plate".
- **Gimmick: Habemus Papam (N3).** When the Pope falls, white smoke rises and the highest-level surviving Priest becomes the Pope at full HP. The kill order is inverted: clear the college first, or fight a new Pope each time. "Popemobile" gives a 150 HP shield until his next turn, "Excommunication" strips every buff and shield from one party unit, and "Celibacy" stops a summoner summoning.
- **Phases.** (1) The square. (2) The steps, with the guard holding the stairs. (3) The last Pope, alone.
- **Win.** Leave no successor, or **alternate:** win the Catacombs side route first, bring out what is in the archive, and he resigns at the start of phase 3.
- **Reward.** Pope unit; the Divine Stair opens to Heaven and the crypt to Hell.
- **Cost: S to M.** N1, N3. Very little else.

### 2.14 HELL: the Heirs

- **Who and why.** The throne is empty often enough that the Demon Prince and Demon Princess are both heirs. Each would like the party to kill the other.
- **Arena.** The Hell board, which already **sinks** (the `rise` motion with `dir: -1`): a lava river, an obsidian altar, basalt spikes. Treat every second round as a circle deeper, with a new hazard each (N10). The ninth circle is ice, as in Dante, which is a free link to the North Pole.
- **Minions.** Demons, Succubi, Skeletons, a Fallen Angel.
- **Gimmick: usurpers (N8).** "Usurp" takes every buff and raised stat stage from its target. They use it on the party and, when one heir is ahead, on each other. When one heir dies the other inherits everything it had. The party wins by keeping them level and then finishing both inside one round, or by making sure the survivor inherits nothing worth having.
- **Phases.** (1) Both heirs, bickering. (2) One down: the survivor with the inheritance and "Throne of Ashes". (3) The ninth circle: the lava is ice and everyone slides.
- **Win.** Kill both, or **alternate:** take a side. Help one heir kill the other and that heir owes you. The debt is a story hook, not a mercy.
- **Reward.** One heir as a unit; a standing "favour" that calls a Demon ally into one fight per day.
- **Cost: M.** N1, N2, N8, N10.

### 2.15 HEAVEN: the Gatekeeper

- **Who and why.** The Gate is a border crossing with a list. The Seraphim who keeps it regards the Department as amateurs.
- **Arena.** Cloud islands over the void: gilded gates, light-pillar daises, healing pools, bottomless rifts. The islands drift.
- **Minions.** Angels (whose "Divine Smite" turns passives off, so passive flyers fall), Orbs of Light, a Nephilim.
- **Gimmick: the ledger again (N5).** The same Ledger as Santa's, read differently. Every kill a party unit makes in this fight is a mark. "Divine Judgment" and "Holy, Holy, Holy" hit harder per mark. "Rapture" lifts the Seraphim's allies out of melee. Knockback into a rift is the fastest kill on either side.
- **Phases.** (1) The fields. (2) The stair, single file, with Smite from above. (3) The Gate: "Merkaba" every other round.
- **Win.** Beat the Gatekeeper, or **alternate: get in on merit.** Reach the Gate tile with a party that has no marks at all. The door opens.
- **Reward.** Seraphim or Angel unit; a Nice-ending bonus if Santa was spared (the lists agree).
- **Cost: M.** N1, N2, N5 (shared with Santa, so cheap second time).

### 2.16 THE CAVERN, HOLLOW EARTH AND AGARTHA: the Landlord

- **Who and why.** The Annunaki made the tenants and have come back about the rent. This upgrades the Dungeon Lord that already crowns floor 10 of Agartha Depths (`bossRace: 'annunaki'`).
- **Arena.** The last floor of the dungeon, or the Agartha board: jade terraces under the sun-shaft, crystal spires, glowing rivers.
- **Minions.** Reptilians, Antpeople (whose "Tunnel Network" gives the enemy shortcuts), Mole Men.
- **Gimmick: he redraws the board every round.** "Pyramid Protocol" raises a three-block wall 2 tiles high. "Enlil's Deluge" pours water into a tile and fills the basin round it, with drowning. "Gravity Well" pulls flyers out of the sky. He walls a group in and then floods the box he made. The answer is the party's own terrain tools and height.
- **Phases.** (1) Walls. (2) Water. (3) "Star Decree" zones on whatever high ground is left.
- **Win.** Beat him, or **alternate:** pay the rent, a large gold sum, and he leaves. It should feel bad, and the next visit should cost more.
- **Reward.** Annunaki unit; the inner-earth route between the poles.
- **Cost: S** as a re-skin of the existing crown, **M** with the scripted pattern.

### 2.17 THE D.U.M.B.: the Director of Sub-Level 7

- **Who and why.** Districts: CERN (The Ring), Level P3, Sub-Level 7, Research, Command. The Director is a Mad Scientist with a clone vat and a collider. The Virus came from here and the Internet's only door is in his Control Room.
- **Arena.** The collider ring: tunnel arcs, copper beamlines, four control terminals (claim tiles, N6), the portal anomaly in the middle.
- **Minions.** Generals' soldiers, Glitches and Machine Elves from the anomaly, his Creation.
- **Gimmick: the beam.** A marked lane laps the ring and resolves at round end, one sector further each round, then two, then three (N10). Anything in the lane takes heavy damage, his side included. "Tesla Coil" traps and "Monster Serum" on his biggest minion fill the gaps.
- **Phases.** (1) The beam. (2) At 50% he dies, and a second Director walks out of the vat (N3). He was a clone. This can repeat once more. (3) The anomaly opens and both sides fight what comes through.
- **Win.** Beat the last Director, or **alternate:** claim all four terminals and shut the ring down, which also stops the clones.
- **Reward.** Mad Scientist unit; the Internet door.
- **Cost: M.** N1, N2, N3, N6, N10.

### 2.18 THE DEEP: the Sea King of Atlantis

- **Who and why.** The half-sunken capital has a king who holds that the surface is a temporary condition.
- **Arena.** The Atlantis board: deep-water moat, flooded streets, plaza islands, the crystal spire.
- **Minions.** Atlanteans, Mermaids, Sirens ("Lure of the Deep" Charms a 3×3), a Sharkman.
- **Gimmick: the tide (N10).** The water level rises one step every second round and falls back after six. "Poseidon's Wrath" hits **every enemy standing in water anywhere on the board**, and "Great Flood" fills basins up to 12 tiles. Dry high ground is the only safe place and there is less of it each round.
- **Phases.** (1) Low tide, streets open. (2) High tide, islands only. (3) The spire: "Crystal Resonator" on Wet targets.
- **Win.** Beat him, or **alternate:** claim the crystal at low tide and the tide becomes yours for the fight.
- **Reward.** Atlantean unit; water breathing in the overworld.
- **Cost: M.** N1, N2, N10.

### 2.19 OUTER SPACE: the Boltzmann Brain at the Drop

- **Who and why.** A mind that fluctuated into existence and suspects the party did too. Its home is The Singularity. Districts used: The Drop and The Accretion Rim.
- **Arena.** The Singularity board: two arms of rock shards spiralling in over nothing, every tile off the arms a drop, the core an event horizon.
- **Minions.** Things it imagines: one unit of a random race each round, which vanishes if the Brain is Silenced.
- **Gimmick: observation.** Its passive makes it jump to a random tile at round end unless it used "Observer Effect". Add one rule: if a party unit has it in vision at round end it stays, and if nobody is looking it jumps and heals. Fog of war and vision range become the damage mechanic. "Existential Dread" Fears a 3×3 and "Vacuum Collapse" is heavy at range 6.
- **Phases.** (1) Keep eyes on it. (2) The arms shorten: outer shards fall each round. (3) At the core, pulls toward the horizon each round.
- **Win.** Beat it, or **alternate:** keep it observed for six rounds running without attacking it. It concludes it is real and stops.
- **Reward.** Boltzmann Brain unit; the Spaceship's last route.
- **Cost: M.** N1, N2, a vision check at round end.

### 2.20 THE ASTRAL REALM: the Dreameater in The Nightmare

- **Who and why.** Every idea arrives in the Astral first and so does every nightmare. The Dreameater eats the dream while the dreamer is still in it.
- **Arena.** The Nightmare district: islands over a sea, with the party's sleeping bodies laid out on the near shore.
- **Minions.** Shadow Entities, Haunted Dolls, a Chess Piece that moves only its own way.
- **Gimmick: two places at once.** The party fights as spirits under the existing `projecting` status. Their bodies lie on the shore and can be hit. "Cut the Cord" snaps a spirit back to its body, Stunned. "Counting Sheep" puts a 3×3 to sleep. The player must split the party between attacking and guarding the bodies.
- **Phases.** (1) Spirits forward. (2) The adds go for the bodies. (3) It starts healing 25% of all damage it deals ("Nightmare Pulse"), so the fight must end fast.
- **Win.** Beat it, or **alternate:** wake up. Walk every spirit back to its body in one round and the nightmare ends with nothing to eat.
- **Reward.** Dreameater unit; lucid travel between the astral screens.
- **Cost: M to L.** The `projecting` status exists, but I did not verify how much of body-and-spirit play is built. Check before committing.

### 2.21 THE MOUNTAINS (Shasta, Olympus, the Pass): the Chosen One on the Summit

- **Who and why.** A prophecy says he saves the world from someone, and the party fits the description. Olympus is the race's listed home (The Court, The Throne, The Forge, The Spire).
- **Arena.** The marble acropolis over the cloud sea: temple terraces, stair ascents, storm lanes, void rifts.
- **Minions.** Cyclopes, Orbs of Light, an Eagleman, a Valkyrie.
- **Gimmick: it was written.** At the start of each round the fight shows the boss's next two actions. They will happen unless the party breaks the prophecy with a named counter (Stagger him, move the named target out of range, Silence him). Each prophecy fulfilled casts "Prophecy Fulfilled" or "Awakening" on him for free (cleanse, heal 30%, ATK and SPD up 2). Each one broken strips a buff.
- **Phases.** (1) One line of prophecy per round. (2) Two lines. (3) He stops reading and improvises, with "Destiny Fulfilled" at ×1.5 on anyone under half HP.
- **Win.** Beat him, or **alternate:** break three prophecies in a row. He has a crisis of faith and stands down.
- **Reward.** Chosen One unit; the Wendigo of the Pass stops hunting the party.
- **Cost: M.** N1, N2, a telegraph panel.

---

## 3. Wildcards, roaming and secret bosses

| Boss | Hook | Why it fits | Cost |
|---|---|---|---|
| **The Brood** (Cicada Brood, Göbekli Tepe) | Emerges on a 17-real-day cycle and stays one day | Its kit is "Dig In" for up to 3 rounds and then "Chorus". Code Red already rotates daily, so a calendar boss is a small step | S |
| **Santa, 24 and 25 December** | A roaming gift raid on the real date: he visits every zone once | The seasonal payoff of 2.1 | S after 2.1 |
| **The Virus at large** | Only if smuggled out in 2.2. It appears in random encounter groups anywhere a screen is | A consequence the player chose | S |
| **Florida Man** | The headline boss. His spells work "only on the rounds it is the headline", so the day's headline picks his rules | A daily roaming fight with a different modifier every day, built on his real kit | S |
| **The Honda Civic** on the Highway | A chase on a moving map along the Desert Highway's four route rooms. "Registration expired 2019. It has been told." | Uses `drift` motion, "Vehicular Manslaughter" down the lane | M |
| **The Watcher** | Appears when the party is far over a zone's level, watches for three rounds, then "for once, interferes" | The memo: "The Watcher has cancelled all leave." A super-boss that punishes farming | M |
| **The Alignment** at Stonehenge | Only during a Blood Moon. A Fortune Teller lead whose "Star Crossed" reads each target's zodiac | The one fight built entirely on the sky event and zodiac systems | S to M |
| **The Weighing** at Giza | Anubis weighs the party lead: "Weigh the Heart" is ×1.5 under half HP, "Ammit Devours" eats under 25% | A third use of the Ledger (N5): a clean ledger skips the fight | S after N5 |
| **The Rerun** (Cursed TV, the Haunted House attic) | A boss-rush channel: "Rewind" replays the damage you took last round | Lets the owner reuse every boss built, in the room that already has "the attic's home movies" screen | S |
| **Vending Machine B** | "Report the bears." | A joke fight in the break room | S |

---

## 4. Cross-boss structure

### Order and level bands

Enemy levels follow the party, so order has to be enforced with `HQ_AREA_LEVELS` `min` and `max` on each boss site. A suggested ladder, from the start level of 5 to the cap of 100:

| Band | Levels | Bosses | Purpose |
|---|---|---|---|
| A | 8 to 20 | The Corner (HQ), King Gator (Sewers), the Antihero (city, night) | Teach terrain, claim tiles and healing discipline |
| B | 20 to 40 | The Cremation (Woods), the Skinwalker (Estate), the King (Camelot), the Superhero (city) | Teach clocks, disguise, formation, the Ledger |
| C | 40 to 60 | The General (Desert), the Kraken (Beach), the Director (D.U.M.B.), the Virus (Internet) | Big set pieces, moving maps, the Virus's origin |
| D | 60 to 78 | The AI (Internet), the Overlord (Leylines), the Chosen One (Mountains), **Santa (North Pole)**, the Landlord (Cavern) | The lists start to connect |
| E | 78 to 92 | The Specimen (Antarctica), the Sea King (Deep), the Pope (Vatican), the Heirs (Hell), the Gatekeeper (Heaven) | The old institutions |
| F | 92 to 100 | The Dreameater (Astral), the Boltzmann Brain (Space) | The edges of the map |

Santa sits in band D by story weight, but if he ships first for December, give his site a wide band for the launch and narrow it later.

**A possible finale, not designed here:** the game is called Entropy Wars and the roster has a Cosmic Wraith whose spells are "Heat Death" and "Last Light" and whose home is The Singularity. That is an obvious last boss if the owner wants one: the thing every other boss was, in its own bad way, holding back.

### Recurring threads

1. **The lists.** Santa's Naughty List, Heaven's book, the AI's training data, the Grove's guest list, Anubis's scales and the Department's own Records are all lists of everyone. One Ledger mechanic (N5) carries five fights. The story question it sets up: who is hosting the list? The AI's Server Farm is an obvious answer.
2. **The schedule.** "Do not ask Continuity why the breaches are punctual." The Superhero's disasters are punctual. The Mothman's "Prophecy of Disaster" and the Chosen One's prophecy are schedules. The Cicadas keep one. Somebody writes the timetable.
3. **Screens.** "Every screen is a way in." Put one screen in every boss room (a Cursed TV, a terminal, the broadcast van). Before the AI fight they are set dressing. After it the player learns it watched every fight, and they become fast travel.
4. **Uncontainable.** The door gun is the Department's whole answer to everything, and each boss is a different way it fails: Santa comes back down the chimney, the Virus copies itself out, the Goo splits, the Pope is replaced, the Corner is the door. Each alternate win is the player finding the one condition under which the door does work.
5. **Seasonal staff.** Krampus's finisher is literally called "Coal Season". He is plausibly on loan from Hell. The ninth circle is ice. Santa and the Heirs know each other.
6. **Load-bearing bosses.** Suggestion: a spared or captured boss keeps its zone stable, and a killed boss leaves a vacancy that makes the zone's swarms larger and brings in a rival faction. That gives the kill, spare or capture choice a visible consequence and gives the relationship graph something to drive.

### Boss relationships as input to the faction graph tool

These are proposed edges, in a shape the tool could ingest as `{ a, b, kind, why }`. Kinds: `employs`, `defends`, `rival`, `owes`, `made`, `hosts`, `fears`.

| a | kind | b | why |
|---|---|---|---|
| Santa | employs | Krampus | Seasonal contract; the list has two columns |
| Krampus | owes | the Heirs (Hell) | He is on loan |
| the AI | hosts | Santa's List, Heaven's book | The Server Farm stores everyone's records |
| the Director (D.U.M.B.) | made | the Virus | The Internet's only door is his Control Room's screen |
| the General | defends | the Director | Same budget line ("Black Budget" is a Politician spell) |
| the Board (Tech CEO, Bankers) | employs | the Superhero | Sponsorship; disasters move markets ("Short Sell") |
| Police | defends | the Superhero | He is the city's law's favourite |
| the Antihero | rival | the Superhero | He knows |
| the Sidekick | fears | the Superhero | Recruitable by whoever wins |
| Karate Frogs, Samurai Slugs | rival | King Gator | The dojo against the cistern |
| the Cult Leader | hosts | Politician, Banker, General, Tech CEO | The Grove's guest list |
| the Televangelist | rival | the Pope | Competing collection plates |
| the Gatekeeper (Heaven) | rival | D.O.O.R. | Two border agencies, one border |
| the Landlord (Annunaki) | made | Reptilians, humans | Rent is due |
| the Overlord | rival | the Landlord | Two claims to the same ancient sites |
| Nordics | rival | the Specimen | They came to contain it |
| the Watcher | fears | nobody | It is not in anyone's chain of command |

**How edges could drive encounters ("who defends who and why"):**
- A `defends` or `employs` edge means that faction's natives join as reinforcements when you attack the other in its zone. The swarm rule already draws a second native race into a fight; this picks the race from the graph instead of at random.
- A `rival` edge means natives of that faction can join the party's side as `allies` on auto, the way Agent Locke does in the first quest.
- An `owes` edge is a one-time summon or a refusal to fight.
- A killed boss deletes its outgoing `defends` edges. That is thread 6 as data.

---

## 5. Shortlist: what to build first

| # | Boss | Cost | Why first |
|---|---|---|---|
| 1 | **Santa, then Krampus (North Pole)** | M (S version first) | A seed idea, the game already has the "UNCONTAINABLE" joke in canon, both kits exist, and December is five weeks away. Building it produces the form change (N3) and the Ledger (N5), which four later bosses reuse. Ship the S version (roof, fixed Krampus wave) and add the List after. |
| 2 | **The Virus in The Quarantine (Internet)** | S | A seed idea and the cheapest boss here: the approved kit already spreads, multiplies and detonates. It needs only the boss row and one arena rule. It also sets up the AI and the D.U.M.B. |
| 3 | **The Antihero rooftop ambush (Disaster City)** | S | A seed idea, one unit, one rule ("he hunts the wounded"), existing night and fog. It is the first half of the city arc and proves the lead-down win and the capture exception. |
| 4 | **The Thing in the Corner (HQ)** | S to M | The tutorial boss. It is built on the game's own running joke, uses the first quest's Shadow Entities and the Training Room, and teaches terrain reshaping as a way to win. |
| 5 | **The Superhero at Hero Plaza (Disaster City)** | M | The set piece that pays off 1 and 3: it reuses the Ledger as public opinion and the Antihero as an ally. Build it once N2 and N5 are proven. |

Then the AI (M), which closes the Internet arc, and the Pope (S to M), which is almost free once form change exists.

**Build order for the framework:** N1 and N4 with the Virus. N7 with the Antihero. N2 and N3 with Santa. N5 with Santa's List. N6 with the Corner or the Sewers. Leave N9 (the 2×2 Kaiju) until there is a reason: it is the only L.

---

## 6. Decisions and assumptions to check with the owner

- **Decision 0: boss durability.** The one-statline rule means a lone boss a few levels up dies in about two rounds to a party of four. This document answers with form changes, extra bodies, shields from real spells and arena rules. If the owner would rather allow a boss-only HP rule, most phases get simpler. It is his call.
- **Dialogue.** Not written, on purpose. Every "talks", "yields" or "stands down" beat needs his lines.
- **Assumed and not verified:** neutral civilian units (2.3); a disguise that fools the player's own view (2.8); how much of body-and-spirit play exists behind `projecting` (2.20); in-battle claim tiles beyond the Nexus (N6); a large ally group on auto (2.9).
- **Does not exist:** phase scripting; three-team fights; blizzard weather; a reindeer race; sunlit tiles; any code that spawns `BOSS_DEFS` or a 2×2 body.
- **Existing rule to keep in mind:** bosses are immune to possession, indoctrination, thrall, spell theft, the Shadow Realm, red cards and capture. Several designs above depend on the *party* being vulnerable to those while the boss is not, which is already how it works.
