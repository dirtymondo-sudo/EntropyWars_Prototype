---
name: quick-list-jitter-20261026
description: PR #539 (10-26) fixed the quick action list flipping layout every frame (hud.js _listRoom rounding loop); not seen with default settings
metadata:
  type: project
  modified: 2026-10-26T08:14:56.470Z
---
mondo reported (10-26): one of his units' quick action list jittered back and forth each time he clicked it, starting after a few rounds.

Cause found and fixed in PR #539: hud.js `_listRoom` (runs every frame) has a "do all rows fit" test that read up to ~2px off. With a bigger selected-row grow, the list flipped between .ew-fits and .ew-room every frame. On default UI Maker settings (grow 1.08) nothing visible happened in 7 harness rounds. The jitter only appeared when I forced grow 1.3 with fractional row heights, so mondo's own UI Maker MOTION settings are probably what set it off. That is not confirmed: he hasn't said which unit or which settings.

**How to apply:** if he reports the list still shaking after uploading the 20261026-0814 zip, ask for his UI Maker Motion values (selected grow/tilt) and which unit it was. Related: [[ui-maker]] [[hud-rules]]
