---
name: blood-rain-red
description: Blood Rain drops made visibly red (PR #390, 2026-10-21) + the offline WebGL arena probe recipe that worked
metadata:
  type: project
  modified: 2026-10-21T02:11:06.560Z
---
PR #390 merged 2026-10-21 (token 20261021-bloodrain-01-cors, zip r2-sync/ENTROPY_WARS_SYNC_20261021-0210.zip, screenshot /mnt/project-files/blood-rain/).
- Cause: three-vfx.js `_RAIN_CFG.bloodRain` drops 1.2 units wide (tile = 128 units) = sub-pixel at battle zoom, dark red partial alpha → no colour. Now 4.5 x 40-70, `dropOpacity` 0.95 (new cfg key; others 0.7). Other rains (thunderstorm 1.5, hurricane 2) are equally thin; mondo only asked about blood.
- Probe that worked: playwright from an npm dir in scratchpad, launch with `proxy:{server:HTTPS_PROXY,bypass:'localhost,127.0.0.1'}`, route cdn.jsdelivr.net /npm/<pkg>@v/<path> to the npm-installed pkg (three 0.186.1 etc.), cdn.socket.io to socket.io-client dist, cdn.entropywars.net *.js from the repo. `_goToVsCpu()`, set `_msSelectedMap`/`_msSelectedGM`, `_msConfirm()`, then `applyPartyBuild(false); state.teamLockedIn=true; startMatch()` (party builder doesn't advance by clicking). Force weather: `state.activeWeather=[{type:'bloodRain',tiles:allWeatherBoardTiles(),global:true,remaining:4,id:'x'}]`. Frame with `_cineHardCut`. DPR 2 screenshots time out under swiftshader.
Related: [[lava-water-stone]], [[element-terrain]].
