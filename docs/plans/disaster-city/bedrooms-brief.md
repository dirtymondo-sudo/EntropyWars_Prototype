# Disaster City residents: the bedrooms brief (mondo's OK 2026-11-14 02:21, "District threads add them")

Thread: "Populate Disaster City with NPC routines" (PR #1357 shipped the 44 residents and their day on the world clock).
Today a sleeping resident "goes in through the front door" (hidden). Next: each one sleeps in a real bed in its home.
Mock-ups: mock_3_bedroom_homes.png (which homes), mock_4_bedroom_plan.png (a typical ground floor).

## What each district thread builds (in its own docs/disaster-city/districts/<LETTER>.js)
- Open the home as a WALK-IN with the city swing door (hollow texbuilding / your kit's `solid(..., { walkin: true })`).
  KEEP its plan building id (the row id stays `dc:<id>`): the residents find their home by that id.
- A BEDROOM ON THE GROUND FLOOR (no new stairs needed): one bed per resident listed below.
  Grid rule (mondo 11-13): bed, wardrobe, dresser, counter, table, sofa each centred on a whole 3.5 m square; the walk
  from the door whole squares wide; lamps, plants, rugs free decor off centre.
- Beds = catalogue keys already on R2: psx_bed_1/_2/_4_*/_5_* (singles), couples_bed / meshy_couples_bed, dorm_bed /
  meshy_dorm_bed, cot, royal_bed. The residents' code picks up ANY prop whose key matches /bed|cot/ (not hospital_bed,
  track_bed, bedside tables) standing inside the home's footprint at ground level, one sleeper per bed (a couples_bed = 2).
- A home your district CANNOT open (a roof-route building, a pack model): choose another residential walk-in in your
  district (its own plan building id), give it the beds, and tell the residents thread that building id (message_thread).
- Then bake (node bake-disaster-city.js) and deliver as usual (PR, merge, sync-zip --upload).

## UPDATE 02:40: the green homes too
The five "green" walk-in homes have a LOBBY on their ground floor (the tower lobby, the apartment stair's mailboxes, the hotel
lobby, the penthouse stair). A bed in a lobby is wrong, so those residents also need a ground-floor bedroom (a room
partitioned off the lobby, or another walk-in nearby) from the district thread: Penthouse stair (Financial), Superhero
Tower + Apartment stair (Hero Plaza), Waterfront hotel (Bayside). The Crew house already has its dorm beds: nothing to do.
The residents thread builds no beds itself; it builds the sleeping that uses them.

## The homes, by district (id: residents, beds)
### Southside (R)
- P00-01-B2 Southside apartments: Priest (male). 1 single.
- P00-02-B2 Southside apartments: Nun (the priest female). 1 single.
- P02-01-B1 Tenement: Conspiracy theorist. 1 single.
- P03-00-B2 Southside residence: Firefighter. 1 single.
- CANNOT OPEN, pick another walk-in: P01-00-B1 Townhouses (roof route): Ki fighter + Swordfighter (2 singles);
  P02-01-B2 Walk-up flats (roof route): Cult leader (1); P01-03-B1/B2 Homes row (pack houses): Gangster + Homosapien (2).
### Financial (F)
- P11-00-B2 Bankers' terrace: Goblin. 1.   - P10-01-B2 Bankers' terrace: Men in black. 1.
- P11-02-B2 Bankers' terrace: Spy. 1.      - P09-03-B2 Bankers' terrace: General + Time cop. 2 singles.
- GREEN (now yours too: a bedroom off the lobby): P10-03-B1 Penthouse stair: Halfdemon.
- CANNOT OPEN: P08-00-B1 Luxury hotel (roof route): Politician (1; a hotel room is fine).
### University (U)
- P03-04-B1 Faculty homes: Professor + Mad scientist + Reptilian. 3 singles.
- P00-04-B1 Dorm: Telepath + Zombie. 2 dorm_bed.
### Hero Plaza (H)
- P07-04-B2 Apartments A: Sidekick + Police officer. 2 singles.
- GREEN (now yours too: a bedroom off the lobby): P06-04-B1 Superhero Tower (Superhero + Eagleman), P04-06-B1 Apartment stair (Antihero).
- CANNOT OPEN: P04-05-B2 Hero Plaza residence (pack model): Nephilim (1).
### Entertainment (E)
- GREEN (now yours too: a bedroom off the lobby): P10-07-B1 Crew house (Clown + Mime + Ringmaster).
- CANNOT OPEN: P11-04-B2 Lofts (roof route): Bunny girl (1).
### Industrial (I)
- P02-09-B2 Industrial house: Knight. 1.   - P01-11-B2 Industrial house: Astronaut. 1.
- P00-09-B2 Industrial house: Marksman. 1.
### Sports + Culture (S)
- P06-09-B2 Sports residence: Quarterback. 1.  - P07-08-B2: Luchador. 1.  - P07-10-B2: Juggernaut. 1.
- (King Kong sleeps on the stadium field P05-09: nothing to build.)
### Bayside (B)
- P10-09-B2 Staff apartments: Pirate + Chef + Hippie. 3 singles.
- GREEN (now yours too: a bedroom off the lobby): P08-08-B1 Waterfront hotel (Popstar; the Ghost haunts it, no bed).
### Civic (C): no homes.
