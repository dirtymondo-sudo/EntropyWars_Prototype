#!/bin/bash
# the slice's proof pictures: the probe's PNGs as 1280-wide JPGs in docs/plans/one-world/proof/
S=/home/user/EntropyWars_Prototype/shots/city; F=/home/user/EntropyWars_Prototype/shots/fight_l8; O=/home/user/EntropyWars_Prototype/docs/plans/one-world/proof
c() { [ -f "$1" ] && convert "$1" -resize 1024x -quality 74 "$O/slice_$2.jpg" && echo "slice_$2.jpg"; }
C=$S/site_prebuilt_fairy_forest_ow_clearing; K=$S/site_prebuilt_fairy_forest_ow_creek; N=$S/site_prebuilt_skinwalker_ow_corn; R=$S/site_ow_r7_3_14; T=$S/site_ow_l8; L=$S/site_prebuilt_skinwalker_ow_lake
c ${C}_cross.png clearing_crossroads; c ${C}_fence.png clearing_fence_line; c ${C}_m_after_turn.png clearing_looking_east; c ${C}_above2.png clearing_above
c ${K}_culvert.png creek_culvert; c ${K}_bed2.png creek_bed_city_ahead; c ${K}_rim2.png creek_ravine_rim; c ${K}_in_ravine.png creek_sewer_mouth; c ${K}_above2.png creek_above
c ${N}_lane_n2.png corn_lane_north; c ${N}_lane_mid.png corn_lane_middle; c ${N}_hub_s.png corn_lane_from_south; c ${N}_above2.png corn_above
c ${R}_bend2.png lane_bend; c ${R}_south2.png lane_salt_flat; c ${R}_above2.png lane_above
c ${T}_mid.png trail_l8
c ${L}_north.png lake_north_shore; c ${L}_back2.png lake_looking_north; c ${L}_east2.png lake_looking_east; c ${L}_south2.png lake_looking_south; c ${L}_above2.png lake_above
c $F/1_walk_before.png fight_1_before; c $F/3_fight.png fight_2_board; c $F/4_debrief.png fight_3_debrief; c $F/5_back.png fight_4_back
du -sh $O
