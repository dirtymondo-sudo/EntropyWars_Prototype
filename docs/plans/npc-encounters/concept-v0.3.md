# NPC Encounter System, design plan v0.3 (mondo's concept, as he uploaded it, 2026-11-17)

Converted word for word from `NPC_Encounter_System_Design_Plan_v0.3.docx` (made with another AI that did not know the game). The game-fitted plan is `PLAN.md` beside this file; read that one.

Session design plan \| Version 0.1 \| November 2026

# 1. Design goals

-   Player can attack virtually any NPC, including civilians, merchants,
    enemies, guards, and allies (with special ally handling).

-   NPCs respond to aggression with Flee, Talk, or Fight; not every
    attack automatically starts tactical combat.

-   Exploration and combat share the same physical world and grid.
    Combat begins and ends seamlessly without relocating characters.

-   Use a small number of reusable behavior presets and straightforward
    rules rather than extensive per-NPC statistics.

-   Make negotiations, retreat, and NPC roles meaningful while
    preserving predictable encounter pacing.

# 2. Core model: detection, disposition, response

Awareness: whether an NPC detects or knows the player's location.
Hostility: willingness to threaten or harm the player. These are
conceptually independent axes. Confidence is a situational assessment of
likely success, not necessarily a stored stat; HP, allies, danger, and
escape routes can influence it.

Awareness and hostility govern ordinary behavior (ignore, observe,
approach, threaten, attack). Once threatened or engaged, the NPC chooses
a response using its preset, current escalation stage, and situation.

Flee / Talk / Fight are actions, not three fixed regions on an
awareness-hostility graph. A hostile but outmatched NPC may flee or
negotiate; a normally peaceful NPC may defend itself when repeatedly
attacked.

# 3. Exploration attack escalation --- established rule

Exploration attack animations provoke NPC reactions; they do not
currently deal HP damage. The most reluctant non-ally NPC has a maximum
three-hit escalation:

  -----------------------------------------------------------------------
  Attack                  Response                Outcome
  ----------------------- ----------------------- -----------------------
  1                       Flee                    NPC runs away in
                                                  exploration, slower
                                                  than the player.

  2                       Talk                    NPC stops to confront,
                                                  plead, warn, or
                                                  negotiate.

  3                       Fight                   Tactical combat begins
                                                  at current world
                                                  positions.
  -----------------------------------------------------------------------

Presets can skip earlier stages: Talk → Fight (two hits), or Fight
immediately (one hit). The maximum is three hits for standard
non-allies; repeated fleeing does not continue indefinitely. An NPC
already at Talk or Fight does not reset during the same confrontation.
The player may accept an offer or back down during Talk.

Important: This is an escalation sequence, not a requirement that all
NPCs always flee first. Ally attacks use special rules to be designed.

# 4. Initial behavior presets

  -----------------------------------------------------------------------
  Preset                  Ordinary behavior       Attack escalation
  ----------------------- ----------------------- -----------------------
  Civilian                Routine; generally      Flee → Talk → Fight
                          avoids trouble          

  Merchant                Trades / offers         Talk → Fight
                          services                

  Guard                   Patrols, watches,       Fight (or warning when
                          enforces rules          context calls for it)

  Typical enemy           Approaches or           Talk → Fight
                          challenges player       

  Aggressor               Initiates combat on     Fight immediately
                          sight or when in range  

  Territorial             Defends a zone; warns   Warn / Talk → Fight
                          trespassers             

  Protector               Intervenes when         Fight on intervention
                          protected NPC or place  
                          is threatened           

  Opportunist             Approaches when         Talk → Fight; may
                          advantage seems         retreat when outmatched
                          favorable               
  -----------------------------------------------------------------------

Special roles / variants, not necessarily separate AI systems: Boss
(often Aggressor or Territorial with encounter-specific rules), Ally
(party-following and friendly-fire handling), Wildlife (nonverbal
warning/flee/fight), Pacifist or Coward (uses maximum escalation). Roles
can be combined with a base preset.

# 5. Normal NPC presence and initiation

-   Seeing the player does not force an interaction: NPCs can ignore,
    observe, avoid, greet, approach, warn, or attack.

-   Awareness can depend on line of sight and other detection cues;
    hostility does not require current visual contact.

-   Hostile NPCs may initiate encounters. If an NPC commits to attacking
    the player, tactical combat starts; the player may subsequently
    escape using the existing line-of-sight rule.

-   Territorial NPCs react to entry into restricted areas. Protectors
    react when an ally or protected target is attacked. Opportunists
    react to perceived advantage.

# 6. Tactical combat and return to exploration

-   The battlefield uses existing world geometry and grid positions;
    avoid artificial repositioning.

-   Implemented player escape rule: player and/or party members can
    escape by getting out of enemy line of sight, subject to the game's
    current escape logic.

-   Planned NPC escape: enemies should eventually be able to break line
    of sight and leave tactical combat, then continue fleeing in
    exploration.

-   A previously engaged, fleeing NPC should retain encounter history so
    re-engagement does not create an endless flee-reset loop. Exact
    re-engagement rule remains open.

-   Nearby NPC participation, reinforcements, and behavior of
    nonparticipants during turns require prototyping.

# 7. In-combat negotiation and offers

NPCs can initiate Talk during tactical combat, particularly when
wounded, outnumbered, cornered, or otherwise losing. The player can
accept the offer or continue attacking. Low HP is a possible trigger,
not a universal mandatory threshold.

  -----------------------------------------------------------------------
  NPC                     Example offer           Possible result
  ----------------------- ----------------------- -----------------------
  Merchant                Discount                Shop prices change;
                                                  combat ends if
                                                  agreement holds

  Bandit                  Join party              Recruitment; may alter
                                                  allegiance during a
                                                  group fight

  Wizard                  Teach a spell           Player learns an
                                                  ability

  Bartender               Reveal information      Quest clue, secret, or
                                                  location becomes known
  -----------------------------------------------------------------------

Offers should reflect actual NPC capabilities and persist in the world
where practical. A negotiation may apply to one NPC or an entire group;
define scope per offer. Whether dialogue pauses combat or consumes an
NPC turn is still undecided.

# 8. Minimal implementation structure

## NPC data

-   Preset ID (Civilian, Merchant, Guard, Enemy, Aggressor, Territorial,
    Protector, Opportunist).

-   Optional role tags (Boss, Ally, Wildlife) and relationships
    (protected target, faction, territory).

-   Awareness / current detection state; hostility or disposition;
    situational confidence computed from context if needed.

-   Escalation stage / confrontation history; combat state; current HP
    (for in-combat decisions).

-   Optional offer definitions: condition, dialogue, acceptance effect,
    scope, and one-time flags.

## Simple decision order

1\. Detect player or relevant event → 2. Determine normal response using
preset and context → 3. On exploration attack, advance escalation and
choose Flee / Talk / Fight → 4. If Fight, enter grid combat in place →
5. During combat, evaluate attack / negotiate / retreat → 6. On
agreement or successful escape, return to exploration while preserving
relevant state.

# 9. Prototype milestones

  -----------------------------------------------------------------------
  Phase                   Deliverable             Success check
  ----------------------- ----------------------- -----------------------
  1                       Three-hit escalation +  All standard NPCs reach
                          1/2-hit presets         combat in ≤3 attacks

  2                       Normal awareness /      NPCs can see player
                          hostility behaviors     without auto-triggering
                                                  encounters

  3                       Territorial, protector, Context changes whether
                          opportunist triggers    NPC initiates conflict

  4                       In-combat offer         Merchant discount /
                          framework               wizard spell persists
                                                  after combat

  5                       NPC tactical escape +   No infinite
                          re-engagement           flee/restart loops

  6                       Group intervention and  Consistent behavior in
                          ally special cases      crowded encounters
  -----------------------------------------------------------------------

# 10. Open decisions / playtest questions

-   Exact rules for NPC re-engagement after escaping tactical combat.

-   Whether NPC negotiation consumes a turn or pauses combat.

-   How allies respond to friendly attacks, repeated attacks, and
    betrayal.

-   How to treat unarmed or noncombatant NPCs once the third attack
    forces combat (defend, surrender, or minimal combat actions).

-   How additional NPCs enter an ongoing grid battle and what outsiders
    do while turns resolve.

-   How long hostility / escalation persists after apologies, escape, or
    time passing.

-   Whether confidence needs an explicit stored value or can remain
    computed from context.

Design principle: Few presets, few universal reactions, clear escalation
limits, and persistent consequences. Favor combinations of simple rules
over more NPC-specific systems.

# 11. World reactions and witnesses

Status: proposed next-phase system. NPCs react to events they perceive
rather than only to direct player attacks. Awareness can come from line
of sight, sound, or being alerted by another NPC. A witnessed event does
not automatically make every NPC hostile.

  -----------------------------------------------------------------------
  World event                         Possible response
  ----------------------------------- -----------------------------------
  Attack witnessed                    Flee, observe, call for help,
                                      intervene

  Help requested                      Approach, defend, alert guards,
                                      ignore

  Nearby combat begins                Spectate, flee, intervene, verbally
                                      react, ignore

  Combatant badly hurt / defeated     Cheer, panic, bargain, join,
                                      retreat

  Combatant escapes                   Pursue, search, return to routine
  -----------------------------------------------------------------------

Preset examples: guards enforce rules; protectors defend specific
people; opportunists exploit distractions; civilians often flee or
observe. Event reactions should be filtered by perception, allegiance,
and local context.

# 12. Spectators and reactive crowds

Status: desired feature; implementation details to prototype. In
suitable encounters, nearby NPCs can become spectators and physically
gather around combat on the existing tactical grid, reminiscent of a
crowd watching a duel. A tavern brawl might draw cheering onlookers; a
monster attack may scatter them.

## Crowd reaction options

-   Spectate: Find an available, reasonably safe viewing tile; face
    combatants; watch and occasionally cheer, boo, or comment.

-   Flee: Move away from danger or toward shelter; optionally alert
    others.

-   Intervene: Join the appropriate side when aware and motivated;
    guards/protectors are likely candidates.

-   Verbal reaction: Warn, shout, call for help, or try to negotiate
    without joining the turn order.

-   Ignore: Continue routine if the conflict is irrelevant or unnoticed.

## Spectator placement and updates

-   Spectators move to reachable, unoccupied tiles near the battle,
    keeping distance from obvious danger. The crowd need not form a
    perfect circle; walls, streets, and obstacles shape its outline.

-   Spectators remain outside the active combat roster until they
    intervene. They should not permanently block routes or trap
    combatants; displacement or stepping aside may be needed.

-   Reevaluate crowd responses on meaningful events (large area attack,
    injury, defeat, guard arrival), not every frame or necessarily every
    turn.

-   If an attack or area effect hits a spectator, that NPC can flee,
    confront, or enter combat under the same encounter rules.

-   After the conflict, spectators disperse and return to routines, with
    any appropriate persistent attitude changes.

# 13. Joining battles and tactical time

Status: major design/technical decision. Nearby NPCs should not
automatically join a fight merely because they are close. They must
become aware of it and decide to intervene according to their preset,
relationship, and situation.

Prototype rule: a noncombatant that chooses Intervene enters the active
combat roster at a defined turn boundary. Determine when it receives its
first turn, and how its position and allegiance are inherited from the
shared world grid.

Open technical issue: define time and movement for nearby
nonparticipants while tactical turns run. One candidate is a shared
tactical-time simulation with passive NPCs making limited updates,
rather than allowing unrestricted real-time motion around turn-based
actors.

# 14. De-escalation, recovery, and memory

Status: proposed necessary complement to escalation. NPCs must have a
way to stop fleeing, searching, or watching and resume normal life when
danger passes. Returning to routine does not necessarily erase what
happened.

-   Routine → Threatened → Safe/Searching → Routine (with possible
    changed attitude).

-   A merchant might reopen but refuse service; a guard may remain
    suspicious; a bandit may warn allies.

-   Retain simple state flags or short-lived memories for assault,
    witnessed violence, promises, and recent pursuit.

-   Define when an NPC considers the threat gone: distance, lost line of
    sight, timeout, help arriving, or negotiated resolution.

-   Keep the three-hit maximum for the most fight-averse non-allies
    within a confrontation; do not silently reset escalation after an
    apology or brief separation.

# 15. NPC-to-NPC encounters

Status: later-phase extension. The same attack, reaction, witness, and
intervention rules can eventually apply to NPCs interacting with other
NPCs. Example: bandit threatens merchant → merchant flees → guard
intervenes → player may watch or choose a side. Do not simulate
unrestricted world-wide conflicts in the first prototype; begin with
authored local situations using reusable behavior rules.

# 16. Revised implementation priorities

1.  Phase 1 --- Preserve current seamless grid transition, player
    line-of-sight escape, and preset-driven Flee → Talk → Fight
    escalation (maximum three exploration attacks for the most unwilling
    non-ally).

2.  Phase 2 --- Implement event perception and witness reactions: nearby
    NPCs flee, observe, warn, or intervene.

3.  Phase 3 --- Implement battle participation rules and a minimal
    spectator state with safe viewing-tile selection and post-battle
    dispersal.

4.  Phase 4 --- Implement recovery, short-term memory, and response to
    incidental damage to spectators.

5.  Phase 5 --- Add NPC tactical escapes and NPC-to-NPC encounters after
    turn scheduling and crowd behavior are reliable.

# 17. New playtest questions

-   How close can spectators stand without obstructing tactical movement
    or making area attacks frustrating?

-   Which battle types attract spectators versus cause immediate panic?

-   Can spectators be targeted or hit by area effects, and when do they
    join combat?

-   How do passive NPCs move while active combatants take turns?

-   When and how do guards or protectors enter an ongoing encounter?

-   How quickly do crowds disperse, and which NPCs remember the
    incident?

# 18. Noncombatant timing options and decision

Decision: Reuse the existing end-of-round phase for nearby NPC world
reactions. Do not add a separate phase or independent real-time
simulation.

## Alternatives considered

-   Freeze noncombatants: easiest and tactically predictable, but crowds
    cannot gather or intervene naturally.

-   Give every nearby NPC tactical turns: consistent timing, but
    potentially bloats turn order and slows battles.

-   Allow real-time background movement: lively, but unfair when
    spectators or guards move while the player chooses actions.

-   Hybrid end-of-round updates (chosen): combatants use normal turns;
    noncombatants update together at the existing round boundary.

# 19. End-of-round world reaction rules

-   Evaluate: Nearby NPCs process relevant witnessed or heard events,
    such as attacks, combat starting, explosions, injured allies, calls
    for help, and combat ending.

-   Decide: Use the NPC preset, awareness, hostility, confidence,
    relationships, and current circumstances to choose spectate, flee,
    intervene, investigate, call for help, or ignore.

-   Act: During the existing end-of-round phase, resolve noncombatant
    movement and simple interactions; handle occupied tiles and
    conflicting destinations consistently.

-   Persist decisions: Spectators who have a safe viewing position stay
    there; fleeing civilians keep escaping. Reevaluate primarily on
    meaningful new events, not arbitrarily every round.

-   Immediate feedback: Shouts, flinches, facing changes, hit reactions,
    and short dialogue can play as events occur during a round. Actual
    noncombatant movement and participation changes wait until end of
    round.

-   Joining combat: Guards, protectors, or other interveners who join at
    end of round enter initiative at the start of the next round. They
    do not receive both a world reaction action and a full combat turn
    in the same round.

-   Physical consistency: Spectators occupy actual grid tiles, can be
    targeted or caught in area attacks, and attempt to move away from
    danger. Avoid crowd formations that permanently block tactical
    paths.

-   Battle resolution: When combat ends, spectators disperse and other
    NPCs return to appropriate routines, possibly retaining suspicion,
    fear, injury, or memories of the event.

## Example: Marketplace fight

6.  Combat starts: A merchant and player become combatants. Nearby
    civilians witness the disturbance and may react immediately with
    voices or animations.

7.  End of round 1: Some civilians move to viewing tiles, others flee,
    and a guard begins approaching.

8.  End of round 2: The guard reaches the scene and joins the encounter;
    it receives its first combat turn next round.

9.  After an area attack near the crowd: Spectators flinch immediately,
    then flee or reposition at the next end-of-round update.

10. Combat ends: Noncombatants disperse or recover, and affected NPCs
    retain relevant consequences.

## Implementation checklist and open edge cases

-   Connect the existing round-end hook to a world event queue and
    nearby NPC perception checks.

-   Provide a persistent noncombatant behavior state and a small set of
    movement destinations (viewing tile, safe tile, target to protect,
    investigation point).

-   Resolve simultaneous tile requests deterministically and avoid
    blocking essential paths.

-   Ensure immediate visual reactions do not consume turns or change
    tile positions.

-   Ensure new combatants enter initiative next round without double
    actions.

-   Define how to handle an NPC hit mid-round, a fight ending before
    round-end, multiple simultaneous fights, and spectators who become
    targets.

-   Playtest crowds of different sizes to ensure end-of-round updates
    stay quick and do not overwhelm combat pacing.
