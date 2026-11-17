// v10 page: head + the new sections + the kept Seas / Underground / Beyond sections from v8
const fs = require('fs'); const d = require('./mapdata.json');
const v8 = fs.readFileSync(__dirname + '/page_v8.src.html', 'utf8').split('\n');
const head = v8.slice(0, 57).join('\n');
const take = (a, b) => v8.slice(a - 1, b).join('\n');
const seas = take(145, 163).split('\n').filter(l => !l.includes('Avalon')).join('\n');
const under = `
  <section>
    <div class="eyebrow">Sheet 4 · below</div>
    <h2>The Underground, spread out</h2>
    <div class="sheet">{{underground}}</div>
    <p>The same pass as the surface. Each underground zone’s districts now sit under the surface place they belong to, so a way down lands you where the story says it should. Tunnels you <b>walk</b> are the zone’s own plots, one plot wide. Long links are lines you <b>ride</b> (a train or a sub between stations), so they cost no plots and are quick to cross.</p>
    <div class="tbl"><table>
      <thead><tr><th>Zone</th><th>Its districts and where they sit now</th></tr></thead>
      <tbody>
<tr><td>The Sewers</td><td>Kept under Disaster City, because it is the city’s undercity. Spread under its districts: the main Sewers in the middle, the Holding Cells under Civic Center, the Radioactive Drain under Industrial, the Old Workings under Southside, the Running Tunnels down to Level P3.</td></tr>
<tr><td>The Catacombs + Hell</td><td>Under the Vatican. The Catacombs lead down to Hell under the Colosseum. Hell stays one pit (the Rim, the Descent, the Bowl and the Walkways are rings of one bowl), so it does not split.</td></tr>
<tr><td>The Cavern</td><td>The Cavern under Dead Man’s Cave and the Estate’s wells, Hollow Earth at the centre under its inner sun, Agartha under the Redwood Trail at the foot of Lemuria’s adit. Cave tunnels join all three; the deep road still runs from Hollow Earth to Technoticlan.</td></tr>
<tr><td>The D.U.M.B.</td><td>Now a network of bases, the way the conspiracy tells it: Level P3 just south of the city (the Maglev station), Command under Area 51, Research under the Estate’s Ranch, Sub-Level 7 deep under Shasta, and CERN’s Ring under the plain by Stonehenge. The tube rides between them.</td></tr>
<tr><td>The Deep</td><td>Atlantis (the Citadel and the Rings, kept together as one city) under the Bermuda Triangle, the Sea Floor off the Harbour under the Dutchman’s hold, the Trench far out towards the rim. A sub runs between them.</td></tr>
      </tbody>
    </table></div>
    <p style="margin-top:10px"><b>New ways down</b> <i>(mine)</i>: a barn hatch at the Ranch to Research, a quarry shaft at Stonehenge to the Ring, a lift on Shasta to Sub-Level 7, the vortex in the Triangle down to Atlantis, plus the tube and the sub. The Lemuria adit, the Estate’s wells, the tunnel way at Dead Man’s Cave, the Vatican’s stairs, the hangar at Area 51, the Polar Opening and the Dutchman’s hold are kept and re-pointed.</p>
    <p style="margin-top:10px"><b>Plots:</b> the districts keep their ${d.UG.rooms} plots; the walked tunnels add ${d.UG.walk} (${d.UG.loops} of them for the new loops, ${d.UG.secret} for the secret Bone Passage). The Maglev becomes a ride, so its 62 plots drop out of the total.</p>
    <div class="sheet">{{section}}</div>
  </section>`;
const beyond = `
  <section>
    <div class="eyebrow">Sheet 5 · beyond</div>
    <h2>Beyond the Map, spread out</h2>
    <div class="sheet">{{beyond}}</div>
    <ul class="why">
      <li><b>Outer Space:</b> each world’s districts are separate landing sites on its globe instead of one block. The Spaceship lands at each in turn: the Moon’s Mare, Crater and Far Side; Mars’ Cydonia, Canyon and Rover Bay; Saturn’s Hexagon and Ring Shard; the Singularity’s Accretion Rim and the Drop. The flight is the travel, so the space between costs no plots.</li>
      <li><b>Heaven:</b> the Stairway climbs from Olympus to the Gate; the Cloud Fields and the City float on clouds of their own further out, joined by cloud paths.</li>
      <li><b>The Astral Realm:</b> the Sea of Possibility, the Library and the Nightmare each get an island far apart in the void, with two crossings between them (your limit is two or three).</li>
      <li><b>The Internet</b> and <b>DOOR HQ</b> are unchanged: DOOR HQ stays handmade, with a door into every layer.</li>
    </ul>
    <p style="margin-top:10px">These are layouts on the sheet only. Spreading Heaven and the Astral Realm on their real plot grids, and the cloud paths and crossings, would be the next step if you like this.</p>
  </section>`;
const NAME = { np: 'North Pole village', mtn: 'The Mountains', shasta: '(Mount Shasta, part of the Mountains)', hills: 'The Hollywood Hills (city district N)', city: 'Disaster City', vat: 'The Vatican', col: 'The Colosseum', cam: 'Camelot Kingdom', woods: 'The Woods', estate: 'The Estate', circus: 'Desert: the Circus', wt: 'Desert: Western Town', a51: 'Desert: Area 51', giza: 'Desert: Giza', beach: 'The Beach', ley: 'Leylines (north part)', ley2: 'Leylines (south part)', stone: 'Stonehenge', ant: 'Antarctica' };
const zname = id => d.DNAME[id] ? ({ woods: 'The Woods', cam: 'Camelot Kingdom', estate: 'The Estate', mtn: 'The Mountains', ley: 'Leylines' }[d.ZONEOF[id]] + ': ' + d.DNAME[id]) : NAME[id];
const zrows = d.SURF.map(z => `<tr><td>${zname(z.id)}</td><td class="mono">${z.x}, ${z.y}</td><td class="num">${z.w} × ${z.h}</td></tr>`).join('\n') +
  d.ISL.map(z => `<tr><td>${{ volcano: 'Volcano Island', tri: 'Bermuda Triangle', cove: 'Pirates’ Cove', frozen: 'The Frozen Sea' }[z.id]}</td><td class="mono">${z.x}, ${z.y}</td><td class="num">${z.w} × ${z.h}</td></tr>`).join('\n');
const RINFO = {
  R1: ['Vatican · Disaster City', 'Follows the Tiber down its valley: the city’s road to Rome, crossing into Civic Center by the bridge.'],
  R2: ['Hollywood Hills · Shasta', 'Climbs a canyon behind the sign to the pass at Shasta’s foot; a ranger station.'],
  R3: ['Colosseum · Olympus', 'The pilgrims’ climb from Rome to the gods, shrines on the way up.'],
  R4: ['Camelot · Vatican (fork to the Woods)', 'The oldest road: kingdom to Rome through the forest, with the market town and the crossroads inn where the fork leaves for the Woods.'],
  R5: ['The Snowy Pass · North Pole', 'Through the range’s one high pass, over the tundra, past the frozen lake and the reindeer camp.'],
  R6: ['The Woods · Disaster City', 'Down the Tiber valley past the water mill and over the covered bridge to the city.'],
  R7: ['The Woods · The Estate', 'A farm lane through the heartland to the Salt Lake.'],
  R8: ['The Estate · Western Town', 'Cattle country down to the Desert’s west side.'],
  R9: ['Disaster City · the Circus', 'The city’s highway south over the badlands: the chain gas station, the motel, Exit 1.'],
  R10: ['The Beach · Giza', 'Along the east-coast cliffs to the Nile.'],
  R11: ['Giza · Leylines', 'Over the Nile delta’s wetland on a causeway, beside the ley line.'],
  R12: ['Stonehenge · Camelot', 'Up the west river onto the stone plain.'],
};
const CLS = { major: 'Highway', regional: 'Road', trail: 'Trail' };
const rrows = d.ROUTES.filter(r => r[1]).map(([id, nm]) => `<tr><td class="mono">${id}</td><td>${nm}</td><td>${CLS[d.ROADCLASS[id]]}</td><td>${RINFO[id][0]}</td><td class="num">${d.COUNTS[id]}</td><td>${RINFO[id][1]}</td></tr>`).join('\n');
const routeTotal = Object.values(d.COUNTS).reduce((a, b) => a + b, 0);
const TR = d.TRAILS, trailTotal = Object.values(TR).reduce((a, b) => a + b, 0);
const MAG = 0, HWNEW = Math.max(0, d.HW - 87), NEW = routeTotal + trailTotal + d.UG.walk + HWNEW + 60 + 9 + 36;
const ZN = { woods: 'The Woods', cam: 'Camelot Kingdom', estate: 'The Estate', mtn: 'The Mountains', ley: 'Leylines' };
const srows = Object.keys(ZN).map(zk => `<tr><td>${ZN[zk]}</td><td>${Object.keys(d.DNAME).filter(id => d.ZONEOF[id] === zk).map(id => { const z = d.SURF.find(q => q.id === id); return d.DNAME[id] + ' <span class="mono">' + (z.plots ? z.plots.length + ' plots, a path' : z.w + '×' + z.h) + '</span>'; }).join(', ')}</td><td class="num">${TR[zk]}</td></tr>`).join('\n');
const KIND = { farm: 'farms', town: 'town', monastery: 'monastery', mill: 'mill', camp: 'camp', ruin: 'ruin', fish: 'fishing', mine: 'works', dam: 'water', wind: 'power', well: 'water', oasis: 'water', port: 'port' };
const WHY = { 'vineyards': 'Rome’s wine, on the slopes south of the Vatican', 'monastery': 'a small religious house in the foothills above the Colosseum', 'market town': 'where the Old Road meets the fork; farmers sell to Camelot and Rome', 'water mill': 'grinds the heartland’s grain on the Tiber', 'logging camp': 'timber out of the western forest', 'homestead': 'a lone farm at the forest edge', 'abandoned village': 'emptied woods village (for the Woods’ ghosts)', 'fishing village': 'feeds the coast towns', 'silver mine': 'in the foothills under Shasta', 'reservoir': 'the city’s water, dammed in a Hills canyon; the canal runs from it', 'wind farm': 'power for the city, on the open grassland', 'grain farms': 'the heartland that feeds the city', 'well': 'water on the Desert Highway', 'caravan stop': 'rest on the road between Giza and the Circus', 'oasis': 'water by the Nile', 'stone quarry': 'where the pyramids’ stone came from', 'salt works': 'salt from the Salt Lake', 'port': 'Leylines’ harbour on the Round Voyage', 'whaling station': 'on the Pole’s coast', 'reindeer camp': 'herders on the tundra', 'ski village': 'beds and shops below the Ski Lodge', 'lumber mill': 'saws the forest’s timber by Camelot’s bay' };
const seen = new Set(); const prows = d.PLACES.filter(p => { const k = p[0] + p[3]; if (seen.has(k)) return false; seen.add(k); return true; }).map(([n]) => `<tr><td>${n}</td><td>${WHY[n] || ''}</td></tr>`).join('\n');
const body = `
<div class="wrap">
  <div class="note"><b>CONCEPT · NOT BUILT.</b> Version 13: the same size as version 12 (radius 44 plots, frozen until the walk is tested). The Woods, Camelot, the Estate and the Mountains are now laid out plot by plot, so each district is a path through the wild that doubles as another way across, and the underground gets three loops. A design proposal for your OK. Rooms keep their real built sizes. One small square on the master map is one plot (12 × 12 battle squares, 42 m); a thick line is 12 plots. Names marked <i>mine</i> are placeholders.</div>

  <header class="title">
    <div class="eyebrow">Entropy Wars · the world, redrawn</div>
    <h1>One World</h1>
    <p class="lead">One continent on a flat disc inside the Ice Wall, at the battle grid’s real scale: <b>radius 44 plots = 528 battle squares, about 1.85 km; 3.7 km across</b>. The land between the famous places is real country now: ground that changes plot by plot, farms and mills and mines that keep the cities going, and roads that run where the land lets them. The map comes in three views, so each one stays readable.</p>
  </header>

  <section>
    <h2>Version 13: districts as paths, and loops below</h2>
    <p>Until now every district was a solid block that I moved whole. This time I laid out the Woods, Camelot, the Estate and the Mountains one plot at a time. Each district keeps exactly the same number of plots and everything in them, but its plots now run as a path or a ring through the wild. So walking through a district is also a way across the map, beside the roads.</p>
    <ul>
      <li><p><b>Dead Man’s Cave is the creek.</b> It runs east from the Clearing as a dry creek bed: Culvert, Rocks, Hollow, Gully, Sewer Mouth, ending at the Storm Drain by the city. It is a second way between the Woods and Disaster City beside the Valley Road, and the tunnel way down is in its bed.</p></li>
      <li><p><b>The Redwood Trail is the way up to the mountains.</b> It climbs north from the Clearing through the old trees and the falls to the Snowline, and a wild link carries on to the foot of the Snowy Pass.</p></li>
      <li><p><b>The Corn Fields are the walk to the Estate.</b> The corn runs south from the Woods’ Fence Line to the Hub, beside County Lane, and the wells come down at the Hub.</p></li>
      <li><p><b>The Ritual Ground is a ring</b> round a small lake, with the Stage on its east side. Wild links join it to the Clearing, to Camelot’s Forest and down to the Haunted House.</p></li>
      <li><p><b>The Haunted House is a drive</b> from the Iron Gate down past the house to the graveyard and the Crypt. <b>The Ranch</b> runs south from its gate; the barn hatch to Research is in the Barn.</p></li>
      <li><p><b>Camelot’s districts leave the castle in four directions.</b> The Snowy Pines run north towards the Ski Lodge, the Looking-Glass Garden west to the coast, the Fairy Forest east to a Spring where it meets the Woods, and the Forest south towards the Ritual Ground.</p></li>
      <li><p><b>The Mountains are climbs.</b> Olympus runs from its Twelve Thrones down to the Pilgrim Stair. The Snowy Pass is one long climb from the Tree Line to the Ridge. The Ski Lodge is its runs, then the lodge at the bottom. Shasta climbs from its summit down switchbacks to the Upper Shelf.</p></li>
    </ul>
    <p>The <b>wild links</b> join each district’s nearest plot to the next district’s nearest plot, one plot wide. They also cross between zones (the Woods to the Snowy Pass, Camelot’s Fairy Forest to the Woods, the Ritual Ground to the Haunted House, Camelot’s Snowy Pines to the Ski Lodge). Leylines’ districts are moved but not reshaped yet. Plot names inside a district are working names from what the district already is <i>(mine)</i>.</p>
    <div class="sheet">{{closeup}}</div>
    <p><b>Underground loops</b> <i>(mine)</i>, from the critique: <b>the Bone Passage</b>, a secret walk from the Catacombs to Hollow Earth, so Hell, the Catacombs and the Cavern form a loop; <b>the Outfall</b>, a walk from the Sewers out to the Sea Floor, joining the city’s undercity to the Deep; and <b>the Freight Line</b>, a late-game ride from the Radioactive Drain to Sub-Level 7, a bypass between the Sewers and the D.U.M.B. that opens after the D.U.M.B. The Holding Cells also now reach the tunnel way in the creek, so the Woods, the Sewers and the Cavern form a second loop.</p>
    <p><b>Size stays frozen.</b> No more changes to the dimensions until a test slice is walked.</p>
  </section>

  <section>
    <h2>Version 11: the districts spread out</h2>
    <p>The Woods had all four districts in one small square of a forest ten times its size. Now each district of the Woods, Camelot, the Estate, the Mountains and Leylines stands in its own part of that zone’s country, the way the Desert’s already did. Every district keeps its plots and its contents; only where it stands changes. Between a zone’s districts runs a <b>zone trail</b>, one plot wide, which belongs to the zone. Disaster City and the Vatican stay compact because they are cities. The Beach stays at the city because its Shore is the city’s beach.</p>
    <div class="tbl"><table>
      <thead><tr><th>Zone</th><th>Its districts, now apart (size in plots)</th><th>Wild link plots</th></tr></thead>
      <tbody>
${srows}
      </tbody>
    </table></div>
    <p style="margin-top:10px">Where they went: <b>the Woods</b> has the Clearing and the HQ Stair in the middle, the Redwood Trail up under the range, the Ritual Ground deep in the western forest and Dead Man’s Cave down by the river towards the city. <b>Camelot</b> keeps the castle and the walled village together; the Snowy Pines go north under the mountains, the Looking-Glass Garden west to the coast, the Fairy Forest east and the Forest south. <b>The Estate</b> keeps the Lake at the Salt Lake; the Haunted House sits alone at the forest edge, the Corn Fields out on the farmland and the Ranch south towards the Desert. <b>The Mountains</b> run along the range: the Ski Lodge in the west, Olympus over the Vatican, the Snowy Pass at the top (the Polar Trail leaves from it) and Shasta in the east. <b>Leylines</b> stand round its plateau, and the ley line now runs from the Great Pyramid through all of them.</p>

    <h3 style="margin-top:18px">How much gets built</h3>
    <p>Only the plots you can walk get built: districts, routes and zone trails. The rest of the land is <b>scenery</b>: what you see past a plot’s edge, drawn by the horizon builders the way Disaster City’s mountains and sea are drawn today. So the forest between the Woods’ districts is real on the map and in view, but you walk it on the trail, not across every plot of it.</p>
    <p>How it gets built: the zones are already written by code (one bake tool per zone, from a layout file and one file per district). The routes and zone trails would work the same way. One generator dresses each trail plot from its ground kind on the Land sheet (forest, scrub, snow), and the places on the way (a well, a mill, a camp) are made by hand. The generator is my proposal; nothing like it exists yet.</p>
    <p>Travel time: the world is about 3.7 km across, so walking from one side to the other takes roughly 15 to 25 minutes, depending on the walk speed. The map’s GO to a zone stays the way to travel far; the walk is for the stretches between near neighbours.</p>
  </section>

  <section>
    <h2>What changed after the critique, point by point</h2>
    <ol class="rules">
      <li><p><b>Scale: back to the smaller world.</b> Version 10 doubled the distances; that was too big, so version 12 returns to radius 44 plots and keeps everything else. Every place keeps its size, and every map plot is still a real 42 m plot on the battle grid, so the map is literal, not a drawing.</p></li>
      <li><p><b>The land changes gradually.</b> Every land plot is one of 18 ground kinds, worked out from two numbers: its height and how wet it is. Because the same two numbers make every region, there is always a band between them: snow peaks, bare rock, alpine slopes, foothills, then the valleys; forest, open woodland, grassland, dry scrub, badlands, desert, dunes. Rivers get meadows, the Nile mouth a wetland, the Salt Lake its salt flats, and the coast has sand where it is low and cliffs where it is high.</p></li>
      <li><p><b>The ordinary world.</b> ${d.PLACES.length} working places now sit between the landmarks: farms, vineyards, mills, a market town, logging and lumber, mines, a quarry and salt works, wells and a caravan stop, fishing villages, ports, a reservoir and a wind farm. They are seen from the routes, and any of them can become a stop you walk into. All are my ideas with plain names.</p></li>
      <li><p><b>Roads with a reason.</b> Three kinds. <b>Highways</b> join the four cities (Disaster City, Vatican City, Camelot, Western Town). <b>Roads</b> reach towns, farms and ports and follow valleys and the coast. <b>Trails</b> climb to wild places and through passes. Each route says below why it runs where it does.</p></li>
      <li><p><b>A real coastline.</b> Camelot’s bay is the mouth of a western river; the south coast has headlands and coves; the north has a fjord; the east coast bends round the Beach; shallows ring the land, and there is a reef chain in the south-west and skerries in the north-east.</p></li>
      <li><p><b>Three views instead of one.</b> <b>The Land</b> shows only geography. <b>Travel</b> shows roads, towns and ports over a muted land (the player’s map). <b>The Master</b> keeps every room, route band and grid number (the builder’s map). The dotted white ring is the Round Voyage, now in the key.</p></li>
      <li><p><b>Why these places are together.</b> The world is a parody of the real one, each place the ultimate form of its idea. So the map is a squashed parody of Earth’s: the Old World’s legends in the west and north (Camelot and Stonehenge for Britain, Rome and the Vatican, Olympus for Greece); America in the middle and east (Hollywood and Disaster City on the coast, the Skinwalker ranch Estate, Area 51 and Western Town in the desert, the Bermuda Triangle off the east coast); Egypt and the ancient world to the south-east; the poles at the top and bottom of a flat earth inside its Ice Wall. That reading of the layout is mine.</p></li>
    </ol>
  </section>

  <section>
    <div class="eyebrow">Sheet 1 · the land</div>
    <h2>The Land</h2>
    <div class="sheet">{{terrain}}</div>
    <p>Geography only: what each plot is made of, the rivers, the lakes and the sea. No rooms, no roads. The North Range runs right across the top with one high pass; below it the forest country in the west, the Tiber valley and the heartland’s farms in the middle, the badlands then the Great Desert in the south, the Nile delta and the Ley plateau in the south-east.</p>
  </section>

  <section>
    <div class="eyebrow">Sheet 2 · travel</div>
    <h2>Travel</h2>
    <div class="sheet">{{travel}}</div>
    <p>The player’s map: highways, roads and trails, the towns and working places, the ports where the Round Voyage stops, the storm belt round the Triangle, the inside passage off Camelot's coast and the reefs.</p>
  </section>

  <section>
    <div class="eyebrow">Sheet 3 · the master</div>
    <h2>The Master Map</h2>
    <div class="sheet">{{surface}}</div>
    <p>The builder’s map: every room at its real size, every route as its 2-plot band, the grid numbered in battle squares from the centre.</p>
  </section>

  <section>
    <h2>The routes</h2>
    <p>Every route is a walkable band 2 plots wide, counted plot by plot on the grid. The kind sets how it looks (asphalt, dirt road, footpath) and what is on it.</p>
    <div class="tbl"><table>
      <thead><tr><th>Id</th><th>Name (mine)</th><th>Kind</th><th>Joins</th><th>Plots</th><th>Why it runs there</th></tr></thead>
      <tbody>
${rrows}
<tr><td class="mono">DH</td><td>Desert Highway</td><td>Highway</td><td>The Desert’s four districts, in a loop</td><td class="num">${d.HW}</td><td>The loop needs ${d.HW} plots; the Desert already has 87 Highway plots, so it needs none new. Wells and a caravan stop on it.</td></tr>
<tr><td class="mono">U1</td><td>The Maglev</td><td>Underground</td><td>Sewers · D.U.M.B.</td><td class="num">ride</td><td>The Sewers’ Running Tunnels end at Level P3’s station; from there the Maglev is a ride to Command under Area 51 (no plots).</td></tr>
      </tbody>
    </table></div>
  </section>

  <section>
    <h2>The ordinary world</h2>
    <p>What feeds, supplies and links the famous places. Seen from the routes; any of them can become a stop.</p>
    <div class="tbl"><table>
      <thead><tr><th>Place (mine)</th><th>What it is for</th></tr></thead>
      <tbody>
${prows}
      </tbody>
    </table></div>
  </section>

${seas}

  <section>
    <h2>Where every room stands</h2>
    <p>In plots from Disaster City’s north-west corner (x east, y south). The city, its Hills and its Beach stay where they are; everything else moved out with the grow, and the spread districts are listed one by one.</p>
    <div class="tbl"><table>
      <thead><tr><th>Room</th><th>Corner</th><th>Size</th></tr></thead>
      <tbody>
${zrows}
      </tbody>
    </table></div>
  </section>

${under}

${beyond}

  <section>
    <h2>After your OK</h2>
    <p>First a <b>test slice</b>, as the critique suggests: the southern Woods (the Clearing and Dead Man’s Cave), County Lane and the Estate’s Lake, with their zone trails. That shows whether the walking, the fights on trail plots and the spacing feel right before anything else moves. Then, smallest first, each its own PR: (1) the new places in data.js HQ_ZONE_MAP and the map sheets, (2) the zone edges and horizons, so each room looks out on the right ground kind and its true neighbours, (3) the route kit with its three looks (highway, road, trail), then R1, R6 and R8, (4) the other routes and the Desert Highway, (5) the Volcano Island’s move and growth, the Triangle’s move and the Round Voyage, (6) the new islands, (7) the Colosseum, the Maglev and the Internet, (8) the working places, as scenery first.</p>
    <p style="margin-top:10px"><b>Totals:</b> ${routeTotal} route plots on the surface, ${trailTotal} zone trail plots, ${d.UG.walk} walked tunnel plots underground (the Maglev and the Freight Line are rides), 60 new island plots, 9 for the Colosseum and 36 for the Internet. That is <b>${NEW} new plots</b>. Nothing is deleted. The big version had 1,377; the first version, 414.</p>
  </section>
</div>`;
fs.writeFileSync(__dirname + '/page.src.html', head + body);
const s = JSON.parse(fs.readFileSync(__dirname + '/svgs.json')); let h = head + body; for (const k in s) h = h.replace('{{' + k + '}}', s[k]);
fs.writeFileSync(__dirname + '/world-map-redesign.html', h);
console.log('page ok', { routeTotal, MAG, HW: d.HW, HWNEW, NEW, places: d.PLACES.length });
