---
name: financial-skyline-20261123
description: Financial district towers (Shard 150, Grater 135, Walkie 130, Pickle 95, Act of God 85) + mid-rise fill shipped 11-23, PR #2485; where the code lives, Pickle site change
metadata:
  type: project
  modified: 2026-11-23T18:31:49.285Z
---
Part of [[disaster-city-skyline-plan-20261123]]. Shipped 11-23 (PR #2485, live, data.js 50155bed, token 20261123-fintowers-07-cors). Thread (owner-project id).
- Code: docs/disaster-city/districts/F-towers.js (tower builders, own `dc:<id>:tower` arch row each, throws if >4 materials), called from F.js; lobbies = F-inside.js `lobby()`.
- Sites: Shard P11-01-B1, Grater P09-02-B3, Walkie P10-01-B1 (clock tower kept), Act of God P09-00-B1, Pickle = Executive court P11-00-B1 raised to 95 m (NOT P11-00-B2: that's the bankers' terrace home; avoided two gherkins side by side). Hotel P08-00-B1 outside left to Hotel thread.
- Mid-rise fill: terraces `T.up`, shops `o.up`, workshop `o.up`, MID_BACK back lots in F.js. Roof-route plateaus P09-00-B2/B3 kept low.
- Not done: far LOD for towers (arch rows have none).
