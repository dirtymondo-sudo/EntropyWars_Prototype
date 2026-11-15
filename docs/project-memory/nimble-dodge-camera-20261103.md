---
name: nimble-dodge-camera-20261103
description: PR #879 (11-03) Nimble Dodge floating landing (hidden rock cells) + escape action camera rebuilt; teleport kind flagged same risk
metadata:
  type: project
  modified: 2026-11-03T16:58:55.248Z
---
mondo 11-03 (Catgirl showcase video): Nimble Dodge landed floating over a building; camera slid/vanished/zoomed on empty start tile/swung 180 to her back. PR #879 merged, token 20261103-dodgecam-01-cors, uploaded map/battle/three-renderer/online to R2.

- Landing: room arena rock cells ('#', `fieldCellRock`) are hidden solid columns; canOccupy/canOccupy3D/canOccupyIgnoringUnits/_escapeOpenIgnoringBody now refuse them.
- Camera: escapes face the landing, run waits for the shot cut; self-moving shots (`_selfLand`) beat 1 behind caster, beat 2 rides along then CUTS to front 3/4 (an eased swing went through a wall). blink family: travelling escapes use c.stockHit(). Frame guard keepCaster.
- FOLLOW-UP PR #881 (mondo said yes 11-03): teleports (blink = vanish+cut, leap/swing = ride along), grapple self reel on the cut, teleport landings refuse rock cells, post-shot return CUTS when turning >60 deg (camera._returnCut). Token 20261103-blinkcam-01-cors. Proof videos/units/fixes/CATGIRL_TELEPORTS_GRAPPLE_RETURN_1080p30.mp4.
- OPEN SKY PR #884 (mondo 11-03: flyers must fly over outdoor walls/rocks; walls only reach a ceiling indoors): open-room (shell.open) terrain fields' rock squares are as tall as drawn (data.js hqFieldSkyApply, field.sky/skyTops); airborne flyers cross/hover (map.js unitCanTraverse + battle.js fieldCellSky); walk/climb/land/teleport still refused; trees/gaps/indoor keep tall column. Token 20261103-opensky-02-cors. Proof videos/units/fixes/FLYER_OVER_BUILDING_EDGE_CYBERPUNK_1080p30.mp4.
- CAPTURE GOTCHA: never set camera.zoom from a null value (NaN zoom kills the view); set c.zoom=c._tz, c.tilt=c._tt, c.yaw=c._tyaw then ThreeCamera.snapImmediate()+camera._apply().
- CAPTURE GOTCHA: never set globalThis.__frozen=false on a frozen cap.js page (re-freeze empties the rAF queue, render loop dies silently).
- Capture rig fix: videos/tools/unit_show.js cast() must latch `_actionExecuting` or the HUD menu shows mid-shot (artifact). Proof video videos/units/fixes/CATGIRL_NIMBLE_DODGE_BEFORE_AFTER_1080p30.mp4.
Related [[gameplay-video-capture-20261103]] [[spell-camera-hit-20261029]]
