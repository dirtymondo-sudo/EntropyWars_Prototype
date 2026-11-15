---
name: disaster-city-residents-20261114
description: Disaster City residents (44 city units, home + day on the world clock, sleep in beds) SHIPPED PR #1357-#1373 11-14; 41/44 in beds; waits his Mac check
metadata:
  type: project
---
Thread (thread in the owner project) "Populate Disaster City with NPC routines" (mondo 11-14).
- He picked "Routines now, bedrooms next". SHIPPED PR #1357 (merged, R2 live, token 20261114-res01-cors): data.js HQ_CITY_RESIDENTS (44: his AREA UNITS table + plan cast; priest m+f; Honda Civic = car on roads; King Kong outdoors, no bus; Door Agent left out, no walker rig), hqCityGrid (3.5 m walk map), hqResidentTimeline/hqResidentAt; three-renderer.js THE RESIDENTS (nearest 8 / 4 low-PC drawn within 70 m, doors swing for them, rounds extras/travellers off in this room). Asleep = in through the front door for now. Roof patrols became street patrols. Notes: docs/notes/areas-complexes.md "DISASTER CITY, THE RESIDENTS". Plan files /mnt/project-files/disaster-city-residents/.
- BEDROOMS: he picked 'District threads add them' (11-14 02:21). Brief /mnt/project-files/disaster-city-residents/bedrooms-brief.md sent to Southside/University/Hero Plaza/Entertainment/Industrial/Bayside pass-2 threads; Financial + Sports (threads failed) via coordinator. Green homes' ground floors are lobbies -> district threads add bedrooms there too. Crew house has 10 dorm beds already. SLEEPING SHIPPED PR #1360 (token 20261114-res02-cors): beds found by /bed|cot/ on walk-in ground floor, hqSleep = LayToIdle first 0.05 s, unseen on screen. Moves: Bunny girl -> P11-06-B2. As threads report new home ids, edit HQ_CITY_RESIDENTS home + homeName. 79 walk-ins, no home has a bed (Crew stair P10-07-B1 has dorm_beds, clinic hospital_beds). Beds: psx_bed_*, couples_bed, dorm_bed, cot. Sleep pose UAL2 LayToIdle frame 0.
- Not playtested in browser (repo rule); his Mac check owed.
Related [[disaster-city-144-20261113]]

- DONE 11-14 03:15: all district bedrooms landed; 41 of 44 sleep in a bed (not Civic car, King Kong, Ghost noBed). Moves: Bunny girl P11-06-B2; Ki fighter+Swordfighter P03-00-B2; Cult leader P02-01-B1; Gangster+Homosapien P00-01-B2; Nephilim P07-04-B2. Final PR #1373 token 20261114-res07-cors. Sleep pose + beds never seen on screen (his check). Southside saw beds in P00-01-B2 dropped by the prop static batch headless (draw with EW_HQ_NO_PROP_BATCH) - not fixed.
