# NPC ENCOUNTERS, STEP 1A: Bayside, for mondo to mark up (2026-11-17, Fable)

**REV 2 (2026-11-17, after mondo read rev 1):** the Bayside list was wrong and is fixed in the game first (his words and the pass over all 157 races: `RACE-HOMES.md`). The Homosapien is gone; the Lifeguard, the Skater and Florida Man live here; the Ghost never leaves the hotel. The tables below are redone for that list. The pictures are from rev 1 and still show the marks rightly.

Design only. Nothing of the encounter system is built. Every row is a PROPOSAL until you mark it.
Plan: `PLAN.md` (rev 6) beside this file. Your answers of 11-17 are followed as written.

**How to mark it:** write OK, or the change, beside any row. The seven questions at the end are the ones I could not
settle from your answers; my pick is first on each.

## 0. The short version

- **Who lives in Bayside** (data.js, after today's fix): 16 people of 9 races. Chef × 2, Hippie × 3, Police Officer × 2,
  Pirate × 2, Lifeguard × 2, Skater × 2, Florida Man × 1, Popstar × 1, Ghost × 1.
- **Tempers:** 8 Civilians (Chef, Hippie, Skater, Popstar), 4 Guards (Police Officer, Lifeguard), 3 Opportunists (Pirate,
  Florida Man), 1 Territorial (Ghost). No Brute, no Coward, no Protector lives here.
- **Only four people in Bayside can start a fight on their own:** the two Pirates and Florida Man (the mugging) and the
  Ghost (inside the Waterfront hotel at night, after one warning).
- **The marks:** the battle's own eye, closed and open, and one red exclamation mark. Pictures in section 5.
- **A lost fight costs 8 gold × the strongest enemy's level**, never more than you hold. A Chef 40, a Pirate 72, the
  Ghost 144. A retreat costs nothing.
- **12 spoken lines** in all for Bayside, plus 7 button words.

Two things the data showed that the plan did not know:

1. **The Popstar is level 13 and the Ghost is level 18.** Bayside is "level 5 to 10" for its common and uncommon
   people only; the rare and very rare tiers sit above it. The Ghost can kill a new party.
2. **People from other districts walk through Bayside.** The picture run met a level 36 Firefighter and a level 19
   Police Officer at the Street market on their way to work. Question 6.

## 1. The tempers (plan 3.1)

Levels and places are read from `HQ_CITY_RESIDENTS` and `hqSpawnLevel` on main today.

| Unit | How many | Level | Where its day puts it | Temper | Why | Roles |
|---|---|---|---|---|---|---|
| Chef | 2 | 5 | Food hall (work), Street market, home | **Civilian** | Works a kitchen. Runs, then talks, then fights. | none |
| Hippie | 3 | 6 to 8 | Street market (work), the beach, home | **Civilian** | Peaceful by nature. The plan's own example. | none |
| Skater | 2 | 5 to 10 | The skate park by the boardwalk | **Civilian** | The plan's own example. | none |
| Popstar | 1 | 13 | Sleeps at the Waterfront hotel; works in Entertainment | **Civilian** | Famous, not a fighter by habit. In Bayside she is only at the hotel or passing. | none |
| Police Officer | 2 | 7 | Police staging (one day shift, one night shift), then walks the district | **Guard** | Your rule: cops protect civilians. Fights on the first strike. | none |
| Lifeguard | 2 | 5 to 10 | The beach, by day | **Guard** | On watch over the beach. The plan's own example. | none |
| Pirate | 2 | 9 | West shops by day, the beach by night | **Opportunist** | Robs you when you look weak, talks first. This is Bayside's mugger. | none |
| Florida Man | 1 | 8 to 12 | The beach from the afternoon into the night | **Opportunist** | The plan's own example. Bayside's other mugger. | none |
| Ghost | 1 | 18 | Inside the Waterfront hotel at every hour (your word: it never leaves); seen walking its halls from 22:00 to 05:00 | **Territorial** | It haunts one place. It warns once, then fights if you stay. | none |

Notes on the picks:

- **Nobody in Bayside is a Brute.** That fits the story's first district: nothing attacks on sight.
- **The Ghost as Territorial, not Brute:** a level 18 Brute in the first district would kill new players with no
  warning. Territorial gives one warning and lets them leave. Question 2.
- **No `boss`, `unique` or `wildlife` role** fits anyone here. The spawn system has no one-of-a-kind in Bayside.
- **A Police Officer asleep at home** is cornered (plan 4.2): it skips straight to Talk like anyone woken up. I did
  not make it a Civilian off duty; one rule is simpler. Say so if you want the off-duty change.

## 2. The groups (plan 3.2)

Three rules, the first two from the plan, the third yours (answer 12):

1. **Same race:** units of one race are a group by themselves.
2. **Named groups:** from the plan's draft, only the rows a Bayside unit is in.
3. **A Guard defends the Civilians of its district.** Exceptions are rows; **none is written.**

| Unit | Named group | Who steps in when you hit it, in Bayside |
|---|---|---|
| Chef | none | A Police Officer who sees it (rule 3). The other Chef runs. |
| Hippie | none | A Police Officer who sees it. The other Hippies run. |
| Skater | none | A Police Officer or Lifeguard who sees it. The other Skater runs. |
| Popstar | Show people | A Police Officer who sees it. No other Show people live here. |
| Police Officer | Emergency | The other Police Officer, and a Lifeguard (same group), if they see it. |
| Lifeguard | Emergency | The other Lifeguard, and a Police Officer, if they see it. |
| Florida Man | Street | Nobody. No other of Street lives here, and he is an Opportunist himself. |
| Pirate | none | Nobody. The other Pirate is an Opportunist: it never joins (your round 2, answer 7); it may come for you afterwards if you came out weak. |
| Ghost | The dead | Nobody. No other of The dead live here. |

- **Whether a group member steps in goes through its temper** (plan 3.2). A Civilian never joins; it runs or watches.
- **The Pirate is in no named group.** The plan's "Street" group is Gangster, Goblin, Florida Man. I left the Pirate
  out, so a cop who sees you hit a Pirate does nothing, and a Pirate has no friends but Pirates. Question 3.
- **Before step 8 (joining) is built,** "steps in" means: the Police Officer comes for you and starts its own fight
  when it reaches you. From step 8 it joins the fight that is running.

## 3. The room mix for Bayside (plan 3.3)

In Disaster City the people are fixed rows with homes and days, so the mix is not rolled. It is what the rows give:

| Temper | People | Share | Starts a fight on its own |
|---|---|---|---|
| Civilian | 8 | 50 % | never |
| Guard | 4 | 25 % | only after it sees you strike a Civilian or one of its group |
| Opportunist | 3 | 19 % | when you look weak (the mugging) |
| Territorial | 1 | 6 % | when you stay on its ground after the warning |
| Brute, Coward, Protector | 0 | 0 % | |

PROPOSAL for the data row (step 1b): a district's row holds only what differs from the rows above it. For Bayside:

| Setting | Value | Why |
|---|---|---|
| Who may start a fight | Pirate, Florida Man, Ghost | Read from the tempers; nothing extra to write. |
| The Ghost's ground | The Waterfront hotel (its home building, where its patrol already is) | Territorial needs a place. |
| "You look weak" (the Pirate's test) | The first shift is at half health or less, **and** the party's level is not above the Pirate's | Stops a mugging every time a full-health party walks by. Question 4. |
| One try a game day | A Pirate that mugged you (paid or fought) does not try again until the next game day | Your words: "enough to feel alive, never annoying". Uses the day's memory of plan 4.7. |
| The level gap | 8 (your answer) | A level 17 party is never mugged by a level 9 Pirate. The Ghost stops warning and fighting a party of level 26 or more. |

Nothing changes who lives in Bayside. That is the spawn system thread's row.

## 4. The lines (you approve every one)

The fewest the system needs for these nine units: 12 spoken lines. Short and plain on purpose. Change any of them.

**Talk, after the second strike or when you press E first.** One line a race. Buttons: `BACK OFF` / `FIGHT`.

| Unit | Line |
|---|---|
| Chef | “Hey! What was that for?” |
| Hippie | “Not cool, man.” |
| Skater | “What is your problem?” |
| Popstar | “Do you know who I am?” |
| Pirate | “You want a fight? Say so.” |
| Florida Man | “You want some? Come on.” |

**Warning.** Said once, over the head, no panel.

| Unit | When | Line |
|---|---|---|
| Police Officer | It sees you strike someone and has not reached you yet | “Hands off. Now.” |
| Lifeguard | The same | “Hey! Leave them alone.” |
| Ghost | You step into the hotel at night | “Get out.” |

**The mugging.** The Pirate walks up and Talks. Buttons: `PAY 72` / `FIGHT` (72 = 8 gold × its level 9).

| Unit | Line |
|---|---|
| Pirate | “Nice shoes. Empty your pockets.” |
| Florida Man | “Give me your wallet.” |

**Giving up.** One line shared by every unit, shown when you Talk to a unit that gave up.
Buttons: `TAKE THE PAY-OFF` / `ARREST` / `LET IT GO`.

| Unit | Line |
|---|---|
| Everyone | “Stop. I give up.” |

Not written, because nothing needs them yet: shouts from onlookers (step 7a), a line per race for giving up, a second
mugging line, anything for the Police Officer's Talk (a Guard fights on the first strike, so it has none).

## 5. The three marks (mock-up, not built)

Your words: symbols only, keep it simple, reuse the battle's eye, add one red mark.

**The eye that exists:** three-renderer.js `_buildPlateDom`, class `tp-eye`: the 👁 character, amber `#f0d060` with a
glow when an enemy sees your unit; green `#7fd8a0` with a slash through it (`tp-eye-slash`) when you are hidden.
The mock-up uses that same character and that same CSS, only bigger. So the walk and the battle read the same way:

| Mark | Looks like | Means on the walk |
|---|---|---|
| Eye closed | The green slashed eye | It has not seen you. |
| Eye open | The amber eye | It sees you. |
| Red mark | A red `!` with a black edge | It is coming for you, or it will step in if you swing. |

Pictures (real Bayside on build HEAD `27b5528`, `[EW BUILD]` FRESH; the marks are drawn on top by the probe):

![the three marks](step-1a-marks-sheet.png)

![the Bayside street, 16:00](step-1a-marks-street.jpg)

![the same picture, closer](step-1a-marks-street-close.jpg)

- `step-1a-marks-sheet.png`: the three marks alone, large, and at the pictures' size on sky, road and night.
- `step-1a-marks-street.jpg`: the street by the Street market at 16:00. A Chef (eye open) and a Hippie (eye closed) on
  the right, a second Chef up the road (red mark), a Hippie behind the market wall on the left (eye closed).
- `step-1a-marks-street-close.jpg`: the same picture, cut closer.

What is real and what is mocked:

- Real: the street, the people, and the marks following their heads.
- For show only: which person wears which mark. A Chef would not wear the red mark by its temper.
- The mock draws a mark through a wall (the left Hippie). The built one hides it.
- The marks sit about a head too high in the mock. The built ones sit just over the head.
- The walker's spread arms are the probe dropping him onto the road, not the game.
- In the cloud browser the eye draws as a pixel outline. On your Mac the battle's eye may draw as the full emoji. The
  build reuses the battle's own classes, so what you see in battle is what you get on the walk.
- Not photographed: a Police Officer wearing the red mark at night. The second run (14:00, by the Police staging)
  lost its browser and I did not spend a third run on it.

Rules I propose for the marks:

| Rule | Proposal |
|---|---|
| Who wears a mark | Every NPC you can strike, within 25 m. Question 1. |
| Where | Over the head, one mark at a time. The red mark replaces the eye. |
| Size | The same on screen at any distance (as in the pictures). |
| Words | None. No temper word, no level, no list. The aim prompt keeps its name and level line as today. |
| Story cast, agents, Men in Black | No mark: they cannot be struck. |

## 6. What a lost fight costs

Your rule (11-17): "every loss should lose you money".

**PROPOSAL: 8 gold × the level of the strongest enemy in the fight, never more than you hold.**

| You lose to | Level | Gold lost |
|---|---|---|
| Chef | 5 | 40 |
| Police Officer, Hippie, Lifeguard, Skater | about 7 | 56 |
| Pirate | 9 | 72 |
| Popstar | 13 | 104 |
| Ghost | 18 | 144 |
| Superhero (for scale) | 50 | 400 |

Why this number:

- It is the pay-off table turned round (plan 4.4): an NPC that gives up pays you 8 × its level; one that beats you
  takes 8 × its level. The mugging's price is the same number. One table, three uses.
- It scales with where you are. Bayside is cheap to lose in; Civic Center is not.
- For scale: a Healing Potion is about 40 gold, a capture bounty pays 40 / 80 / 160, a Reinforced Door is 300.

The details:

| Case | Proposal |
|---|---|
| A retreat (Team escape) | Costs nothing. It is not a loss. This makes escaping worth doing. |
| You hold less than the cost | You lose what you hold. Never below 0, no debt. |
| A lost mugging | The same 8 × level, once. Losing is not cheaper than paying, and paying keeps you where you stand. |
| Quest fights | The same rule. Question 5. |
| Where it shows | One row on the loss screen: `LOST 56 GOLD`. A UI change: its mock-up comes with step 4. |
| The party is still healed at the ward | Unchanged (`lossRestore`). |

**One thing to know:** story gold and the gold that unlocks units are the same wallet (`profile.account.gold`, a unit
is 5,000). So a lost story fight takes a little from what you save for units. With an account, the server owns that
wallet, so step 4 must take the gold on the server side too. Online play is not touched.

## 7. Questions (my pick first). ANSWERED 2026-11-17: `PLAN.md` section 0, round 3

In short: 1 the 8-body limit is raised to 20 (who wears a mark: the pick stands); 2 Territorial inside the hotel; 3 no group; 4 a flat chance per game day; 5 yes; 6 yes; 7 the first way (8 gold x level). Still waiting: his OK on the lines (section 4) and on the marks' pictures (section 5).

1. **Who wears a mark?** Pick: every NPC you can strike within 25 m, so you always know who has seen you (at most 8
   bodies are drawn, so at most 8 marks). Other way: only the ones that can start or join a fight (in Bayside: Police
   Officer, Lifeguard, Pirate, Florida Man, Ghost), which is quieter but hides who is a witness.
2. **The Ghost:** it never leaves the hotel (your word, built). Territorial inside it, one warning? Pick: yes. Other
   way: Brute (attacks on sight, level 18, in the first district).
3. **The Pirate in no named group?** Pick: yes, no group; cops do not defend Pirates. Other way: add it to "Street"
   with the Gangster.
4. **When does a Pirate mug you?** Pick: your first shift is at half health or less and your level is not above its
   level, one try a game day per Pirate. Other way: a flat chance per game day whatever your health.
5. **Does a lost quest fight cost gold too?** Pick: yes, "every loss". The first quest's fight is safe either way: you
   hold 0 gold then.
6. **People passing through from other districts** (the level 36 Firefighter, the level 19 Police Officer): give them
   the plan's example tempers now (Police Officer = Guard, Firefighter = Protector), so the Bayside test plays right?
   Pick: yes, for every race that already has an example in plan 3.1; the full pass over the other eight districts
   still waits for after the gate. Know that a level 36 Firefighter stepping in will flatten a level 5 party; the red
   mark is the warning.
7. **The lost-fight cost:** 8 gold × the strongest enemy's level? Pick: yes. Other way: a share of what you hold
   (say 10 %), which hurts a rich player more and a broke player not at all.

## 8. What happens next

Nothing is built until you mark this. With your marks: step 1b writes the tempers, groups and the Bayside row into
data.js (nothing reads them yet), and step 2 builds awareness and the marks once you have OK'd the pictures.
