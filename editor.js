/* ══ editor.js — THE EDITOR (EDITOR_PLAN.md, phase E0 — 2026-09-29) ══════════════════════════════════════════════════════
   mondo's world, built by hand inside the game. His ruling when E0 started (the plan's §1): "I don't even want to start
   with the current world map, I literally just wanna start from a flat empty world and hand carve and place and design
   everything myself." So NEW WORLD is one flat empty ground (Room 1) and everything in it is something he placed; data.js's
   rooms are a LIBRARY to look at and COPY INTO the world.

   One R2 file (fork 1), loaded by a script tag the first time the editor opens (map.js _goToEditor) — the player's game never
   downloads it. What it writes is what the game reads (R1): a room doc IS a DOOR_HQ.rooms object (data.js hqWorldDoc*); the
   viewport IS the room the renderer builds for the walk (ThreeRenderer.hq.enter with `edit`), so what mondo sees is what the
   player gets. The editor adds only its own overlay (the grid, the pick proxies, the gizmo, the selection boxes) in a group the
   player's game never creates, and PLAY HERE drops the walker into the real game (map.js _hqEnter) — ESC comes back.

   E0 = THE DOCUMENT + THE SHELL: the fly camera, pick + the gizmo (move / rotate / size), the outliner, the inspector for every
   field of every row, the ADD list (every row kind, every catalogue prop, a door to any of his rooms), NEW WORLD / NEW ROOM,
   the LIBRARY (open a built-in room, COPY INTO WORLD), undo / redo (200 steps), autosave to IndexedDB, EXPORT (one zip laid
   out at the bucket's paths, only what changed since the last export), IMPORT (that zip, or the published world on R2).
   E1+ turn the ADD list into the real tools (EDITOR_PLAN §8). Nothing on `state`, nothing relayed (RULE #2): offline tool.
   ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';
    var W = (typeof window !== 'undefined') ? window : {};

    /* ══ THE CORE — pure (world-doc.test.js runs it headless through window.EWEditorCore) ════════════════════════════════ */
    var Core = (function () {
        function clone(v) { return (v === undefined) ? undefined : JSON.parse(JSON.stringify(v)); }
        /* a runtime cache is never written (`_own`, `_terrainInfo`, `_landing` …: every key that starts with `_`) */
        function cleanExport(v) { return JSON.parse(JSON.stringify(v, function (k, x) { return (k && k.charAt(0) === '_') ? undefined : x; })); }
        function utf8(s) { if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(s); var b = unescape(encodeURIComponent(s)), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
        function utf8dec(u) { if (typeof TextDecoder !== 'undefined') return new TextDecoder().decode(u); var s = ''; for (var i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return decodeURIComponent(escape(s)); }
        /* ── the zip: STORE (no library; mondo's uploads are small JSON) ── */
        var CRC = null;
        function crc32(u) {
            if (!CRC) { CRC = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1); CRC[n] = c >>> 0; } }
            var x = 0xffffffff; for (var i = 0; i < u.length; i++) x = CRC[(x ^ u[i]) & 255] ^ (x >>> 8); return (x ^ 0xffffffff) >>> 0;
        }
        function zipStore(files, when) {
            var d = when || new Date(), dt = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xffff, dd = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xffff;
            var parts = [], central = [], off = 0;
            files.forEach(function (f) {
                var name = utf8(f.name), data = f.data, crc = crc32(data);
                var h = new DataView(new ArrayBuffer(30));
                h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
                h.setUint16(10, dt, true); h.setUint16(12, dd, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true);
                h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
                parts.push(new Uint8Array(h.buffer), name, data);
                var c = new DataView(new ArrayBuffer(46));
                c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
                c.setUint16(12, dt, true); c.setUint16(14, dd, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true);
                c.setUint16(28, name.length, true); c.setUint32(42, off, true);
                central.push(new Uint8Array(c.buffer), name);
                off += 30 + name.length + data.length;
            });
            var cSize = central.reduce(function (s, p) { return s + p.length; }, 0);
            var e = new DataView(new ArrayBuffer(22));
            e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cSize, true); e.setUint32(16, off, true);
            var all = parts.concat(central, [new Uint8Array(e.buffer)]), len = all.reduce(function (s, p) { return s + p.length; }, 0), out = new Uint8Array(len), o = 0;
            all.forEach(function (p) { out.set(p, o); o += p.length; });
            return out;
        }
        /* the zip's entries from its central directory: { name, method, data (raw — deflated when method 8) } */
        function unzip(u) {
            var v = new DataView(u.buffer, u.byteOffset, u.byteLength), eo = -1;
            for (var i = u.length - 22; i >= Math.max(0, u.length - 65557); i--) if (v.getUint32(i, true) === 0x06054b50) { eo = i; break; }
            if (eo < 0) throw new Error('not a zip');
            var n = v.getUint16(eo + 10, true), p = v.getUint32(eo + 16, true), out = [];
            for (var k = 0; k < n; k++) {
                if (v.getUint32(p, true) !== 0x02014b50) throw new Error('bad zip directory');
                var method = v.getUint16(p + 10, true), csize = v.getUint32(p + 20, true), nl = v.getUint16(p + 28, true), xl = v.getUint16(p + 30, true), cl = v.getUint16(p + 32, true), lo = v.getUint32(p + 42, true);
                var name = utf8dec(u.subarray(p + 46, p + 46 + nl));
                var lnl = v.getUint16(lo + 26, true), lxl = v.getUint16(lo + 28, true), ds = lo + 30 + lnl + lxl;
                out.push({ name: name, method: method, data: u.subarray(ds, ds + csize) });
                p += 46 + nl + xl + cl;
            }
            return out;
        }
        /* ── THE COMMAND STACK: a patch = { path: [...], before, after } on the world doc (undefined = absent: an array index
           inserts / removes, an object key is added / deleted). Every tool, stroke and inspector edit is one step (R9). ── */
        function _parent(root, path) { var o = root; for (var i = 0; i < path.length - 1; i++) { if (o == null) return null; o = o[path[i]]; } return o; }
        function _put(root, path, before, after) {
            var par = _parent(root, path); if (par == null) throw new Error('patch: no parent at ' + path.join('.'));
            var key = path[path.length - 1];
            if (Array.isArray(par) && typeof key === 'number') {
                if (before === undefined && after !== undefined) par.splice(key, 0, clone(after));
                else if (after === undefined) par.splice(key, 1);
                else par[key] = clone(after);
            } else if (after === undefined) delete par[key];
            else par[key] = clone(after);
        }
        function patchDo(root, p) { _put(root, p.path, p.before, p.after); }
        function patchUndo(root, p) { _put(root, p.path, p.after, p.before); }
        function stepDo(root, step) { step.forEach(function (p) { patchDo(root, p); }); }
        function stepUndo(root, step) { for (var i = step.length - 1; i >= 0; i--) patchUndo(root, step[i]); }
        /* the rooms a step touched ('rooms' paths) */
        function stepRooms(step) { var o = {}; step.forEach(function (p) { if (p.path[0] === 'rooms' && p.path[1] != null) o[p.path[1]] = 1; }); return Object.keys(o); }

        /* ── A ROW IN SPACE: every place-like field of the compiler's rows (x east, z south, metres; yaw clockwise from north) ── */
        var PAIRS = [['x', 'z'], ['x0', 'z0'], ['x1', 'z1']];
        var PT_LISTS = ['pts', 'quad'];
        var DIRS = ['front'];                 // a vector: turned, never moved
        var YAWS = ['face', 'rot', 'a0', 'a1', 'yaw'];   // `yaw` = a prefab / kit placement's turn (E1)
        var YS = ['y', 'h0', 'h1', 'y0', 'y1'];
        function rowAnchor(row) {
            if (!row) return { x: 0, z: 0 };
            if (isFinite(row.x) && isFinite(row.z)) return { x: +row.x, z: +row.z };
            if (isFinite(row.x0) && isFinite(row.x1)) return { x: (row.x0 + row.x1) / 2, z: ((+row.z0 || 0) + (+row.z1 || 0)) / 2 };
            var P = Array.isArray(row.pts) ? row.pts : (Array.isArray(row.quad) ? row.quad : null);
            if (P && P.length) { var sx = 0, sz = 0; P.forEach(function (q) { sx += +q[0] || 0; sz += +q[1] || 0; }); return { x: sx / P.length, z: sz / P.length }; }
            if (isFinite(row.x)) return { x: +row.x, z: 0 };
            if (isFinite(row.z)) return { x: 0, z: +row.z };
            return { x: 0, z: 0 };
        }
        /* t = { dx, dy, dz, rot (deg clockwise), sx, sy, sz, px, pz (the pivot), axis ('x' | 'z' | null: a wall door slides on one) } */
        function rowTransform(row, t) {
            var r = clone(row), rot = (t.rot || 0) * Math.PI / 180, c = Math.cos(rot), s = Math.sin(rot);
            var px = t.px || 0, pz = t.pz || 0, sx = (t.sx != null) ? t.sx : 1, sy = (t.sy != null) ? t.sy : 1, sz = (t.sz != null) ? t.sz : 1;
            var dx = t.axis === 'z' ? 0 : (t.dx || 0), dz = t.axis === 'x' ? 0 : (t.dz || 0);
            var R4 = function (v) { return Math.round(v * 10000) / 10000; };
            var mv = function (x, z) {   // scale about the pivot, turn about it, then move
                var ux = (x - px) * sx, uz = (z - pz) * sz;
                return [R4(px + ux * c - uz * s + dx), R4(pz + ux * s + uz * c + dz)];
            };
            PAIRS.forEach(function (pq) {
                var a = pq[0], b = pq[1], hasA = isFinite(r[a]), hasB = isFinite(r[b]);
                if (hasA && hasB) { var q = mv(+r[a], +r[b]); r[a] = q[0]; r[b] = q[1]; }
                else if (hasA && t.axis !== 'z') r[a] = R4(+r[a] + dx);   // a wall door's x (n / s walls)
                else if (hasB && t.axis !== 'x') r[b] = R4(+r[b] + dz);   // a wall door's z (e / w walls)
            });
            PT_LISTS.forEach(function (k) { if (Array.isArray(r[k])) r[k] = r[k].map(function (q) { return Array.isArray(q) ? mv(+q[0] || 0, +q[1] || 0).concat(q.slice(2)) : q; }); });
            DIRS.forEach(function (k) { if (Array.isArray(r[k]) && rot) { var x = +r[k][0] || 0, z = +r[k][1] || 0; r[k] = [R4(x * c - z * s), R4(x * s + z * c)]; } });
            if (rot && !t.axis) YAWS.forEach(function (k) { if (isFinite(r[k]) || (k === 'face' && (r.k === 'climb' || r.key || r.wall === 'free')) || (k === 'yaw' && (r.k === 'prefab' || r.k === 'kit')) || (k === 'rot' && r.k === 'texbuilding')) { var v = ((+r[k] || 0) + t.rot) % 360; if (v < 0) v += 360; r[k] = R4(v); } });
            if (rot && !t.axis && r.arc && typeof r.arc === 'object') { var ac = mv(+r.arc.x || 0, +r.arc.z || 0); r.arc.x = ac[0]; r.arc.z = ac[1]; r.arc.a0 = R4((+r.arc.a0 || 0) + t.rot); r.arc.a1 = R4((+r.arc.a1 || 0) + t.rot); }
            else if (!t.axis && r.arc && typeof r.arc === 'object' && (t.dx || t.dz)) { r.arc.x = R4((+r.arc.x || 0) + (t.dx || 0)); r.arc.z = R4((+r.arc.z || 0) + (t.dz || 0)); }
            if (t.dy) YS.forEach(function (k) { if (isFinite(r[k])) r[k] = R4(+r[k] + t.dy); });
            if (t.dy && r.key && !isFinite(row.y) && !r.k) r.y = R4(t.dy);   // a prop lifted off the ground
            if (sx !== 1 || sy !== 1 || sz !== 1) {
                var sxz = (sx + sz) / 2;
                ['r', 'rz', 'r0', 'r1'].forEach(function (k) { if (isFinite(r[k])) r[k] = R4(Math.max(0.05, r[k] * sxz)); });
                if (isFinite(r.w) && r.k === 'opening') r.w = R4(Math.max(0.3, r.w * sx));
                else if (isFinite(r.w)) r.w = R4(Math.max(0.05, r.w * (isFinite(r.d) ? sx : sxz)));
                if (isFinite(r.d)) r.d = R4(Math.max(0.05, r.d * sz));
                if (isFinite(r.h) && r.k) r.h = R4(r.h * sy);
                if (isFinite(r.t)) r.t = R4(Math.max(0.05, r.t * sxz));
                if (r.key && !r.k) { if (isFinite(r.h)) r.h = R4(r.h * sy); else if (sy !== 1) r.h = null; }
                if (r.h === null) delete r.h;
            }
            return r;
        }
        /* ── the proxy boxes a row is picked by (metres): { cx, cz, y0, y1, w (across), L (along), yaw (rad, three's y turn) } ── */
        function segBox(x0, z0, x1, z1, w, y0, y1) {
            var dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz) || 0.2;
            return { cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, w: Math.max(0.2, w), L: L, y0: y0, y1: Math.max(y0 + 0.1, y1), yaw: Math.atan2(dx, dz) };
        }
        function rectBox(x, z, w, d, rotDeg, y0, y1) { return { cx: x, cz: z, w: Math.max(0.2, w), L: Math.max(0.2, d), y0: y0, y1: Math.max(y0 + 0.1, y1), yaw: -(rotDeg || 0) * Math.PI / 180, rect: true }; }
        function rowShape(row, ground, expand) {
            var g = function (x, z) { var v = ground ? ground(x, z) : 0; return isFinite(v) ? v : 0; };
            var k = row && row.k, out = [];
            if (!k) return out;
            var num = function (v, d) { return isFinite(v) ? +v : d; };
            /* E1: a prefab / kit placement is picked by the boxes of the rows it expands to (the editor hands the expansion in) */
            if ((k === 'prefab' || k === 'kit') && expand) { (expand(row) || []).forEach(function (r2) { if (r2 && r2.k !== 'prefab' && r2.k !== 'kit') rowShape(r2, ground).forEach(function (b) { out.push(b); }); }); if (!out.length && isFinite(row.x) && isFinite(row.z)) out.push(rectBox(+row.x, +row.z, 2, 2, 0, g(+row.x, +row.z), g(+row.x, +row.z) + 2)); return out; }
            if (k === 'texbuilding' && isFinite(row.x) && isFinite(row.z)) { var gb = isFinite(row.y) ? +row.y : g(+row.x, +row.z); out.push(rectBox(+row.x, +row.z, num(row.w, 8), num(row.d, 8), row.rot, gb, gb + Math.max(1, Math.round(num(row.storeys, 2))) * 3.5 + 0.45)); return out; }
            if (k === 'opening') return out;   // the editor boxes it on its wall
            var seg = isFinite(row.x0) && isFinite(row.x1) && isFinite(row.z0) && isFinite(row.z1);
            if (seg) {
                var gm = Math.max(g(row.x0, row.z0), g(row.x1, row.z1), g((row.x0 + row.x1) / 2, (row.z0 + row.z1) / 2)), gn = Math.min(g(row.x0, row.z0), g(row.x1, row.z1));
                if (k === 'wall') out.push(segBox(row.x0, row.z0, row.x1, row.z1, num(row.t, 0.35), gn - 0.1, isFinite(row.y) ? row.y : gm + num(row.h, 3)));
                else if (k === 'rail') out.push(segBox(row.x0, row.z0, row.x1, row.z1, 0.3, gn, gm + num(row.h, 0.98)));
                else if (k === 'ramp') out.push(segBox(row.x0, row.z0, row.x1, row.z1, num(row.w, 2), Math.min(gn, num(row.h0, 0), num(row.h1, 0)), Math.max(num(row.h0, 0), num(row.h1, 0)) + 0.15));
                else if (k === 'deck' || k === 'bridge') { var yb = num(row.y, gm); out.push(segBox(row.x0, row.z0, row.x1, row.z1, num(row.w, 2), yb - Math.max(0.3, num(row.thick, 0.3)), yb + 0.15)); }
                else out.push(segBox(row.x0, row.z0, row.x1, row.z1, num(row.w, 0.5), gn, gm + 1));
                return out;
            }
            var pts = Array.isArray(row.pts) ? row.pts : null;
            if (pts && pts.length > 1) {
                for (var i = 0; i + 1 < pts.length; i++) {
                    var a = pts[i], b = pts[i + 1], ga = Math.min(g(a[0], a[1]), g(b[0], b[1])), gb = Math.max(g(a[0], a[1]), g(b[0], b[1]));
                    if (k === 'ridge') out.push(segBox(a[0], a[1], b[0], b[1], num(row.w, 4), ga - 0.1, gb + Math.max(0.3, num(row.h, 1))));
                    else if (k === 'stream') out.push(segBox(a[0], a[1], b[0], b[1], num(row.w, 2), num(row.y, 0) - num(row.depth, 0.6), num(row.y, 0) + 0.15));
                    else out.push(segBox(a[0], a[1], b[0], b[1], num(row.w, 1.5), ga - 0.05, gb + 0.15));
                }
                return out;
            }
            if (!isFinite(row.x) || !isFinite(row.z)) return out;   // a room-wide grove / scatter: the outliner picks it
            var x = +row.x, z = +row.z, g0 = g(x, z);
            if (k === 'plateau') { if (row.r) out.push(rectBox(x, z, 2 * row.r, 2 * (row.rz || row.r), row.rot, g0 - 0.1, num(row.h, 1))); else out.push(rectBox(x, z, num(row.w, 4), num(row.d, 4), row.rot, Math.min(g0 - 0.1, num(row.h, 1) - 0.3), num(row.h, 1))); }
            else if (k === 'hill') out.push(rectBox(x, z, 2 * num(row.r, 4), 2 * num(row.rz, num(row.r, 4)), row.rot, g0 - 0.1, g0 + Math.max(0.3, num(row.h, 1) * 0.5)));
            else if (k === 'dip') out.push(rectBox(x, z, 2 * num(row.r, 4), 2 * num(row.rz, num(row.r, 4)), row.rot, g0 - 0.2, g0 + 0.2));
            else if (k === 'pool') out.push(rectBox(x, z, 2 * num(row.r, 3), 2 * num(row.rz, num(row.r, 3)), row.rot, num(row.y, g0) - num(row.depth, 0.8), num(row.y, g0) + 0.15));
            else if (k === 'spiral') out.push(rectBox(x, z, 2 * num(row.r1, 4), 2 * num(row.r1, 4), 0, Math.min(num(row.h0, 0), num(row.h1, 0)) - 0.1, Math.max(num(row.h0, 0), num(row.h1, 0)) + 0.2));
            else if (k === 'grove' || k === 'scatter') out.push(rectBox(x, z, 2 * num(row.r, 5), 2 * num(row.r, 5), 0, g0 - 0.05, g0 + 0.25));
            else if (k === 'tree') out.push(rectBox(x, z, 1.4, 1.4, 0, g0, g0 + num(row.h, 6)));
            else if (k === 'climb') out.push(rectBox(x, z, num(row.w, 0.8), 0.8, row.face, num(row.y0, g0), isFinite(row.y1) ? row.y1 : g0 + 3));
            else out.push(rectBox(x, z, 1, 1, 0, g0, g0 + 1));
            return out;
        }
        /* ── THE ADD LIST: the compiler's row kinds (EDITOR_PLAN §4.2) with the row each places at (x, z) ── */
        var KINDS = [
            { id: 'wall', label: 'Wall', row: function (x, z) { return { k: 'wall', x0: x - 2, z0: z, x1: x + 2, z1: z, h: 3, t: 0.35, key: 'urban:ConcreteStriped2c' }; } },
            { id: 'rail', label: 'Rail (grind)', row: function (x, z) { return { k: 'rail', x0: x - 2, z0: z, x1: x + 2, z1: z }; } },
            { id: 'ramp', label: 'Ramp', row: function (x, z) { return { k: 'ramp', x0: x, z0: z + 3, x1: x, z1: z - 3, w: 3, h0: 0, h1: 2 }; } },
            { id: 'stairs', label: 'Stairs (a stepped ramp)', row: function (x, z) { return { k: 'ramp', x0: x, z0: z + 3, x1: x, z1: z - 3, w: 2, h0: 0, h1: 2, stairs: true }; } },
            { id: 'kicker', label: 'Kicker (skate)', row: function (x, z) { return { k: 'ramp', x0: x, z0: z + 1.3, x1: x, z1: z - 1.3, w: 2.6, h0: 0, h1: 0.9, edge: 0.01, kicker: true }; } },
            { id: 'spiral', label: 'Spiral ramp', row: function (x, z) { return { k: 'spiral', x: x, z: z, r0: 2, r1: 4, a0: 0, a1: 270, h0: 0, h1: 4 }; } },
            { id: 'deck', label: 'Deck (raised floor)', row: function (x, z) { return { k: 'deck', x0: x - 3, z0: z, x1: x + 3, z1: z, w: 2, y: 2 }; } },
            { id: 'bridge', label: 'Bridge / floating platform', row: function (x, z) { return { k: 'bridge', x0: x - 4, z0: z, x1: x + 4, z1: z, w: 3, y: 3 }; } },
            { id: 'plateau', label: 'Plateau (a tier)', row: function (x, z) { return { k: 'plateau', x: x, z: z, w: 8, d: 8, h: 2 }; } },
            { id: 'hill', label: 'Hill', row: function (x, z) { return { k: 'hill', x: x, z: z, r: 8, h: 3 }; } },
            { id: 'dip', label: 'Dip', row: function (x, z) { return { k: 'dip', x: x, z: z, r: 6, h: 1.5 }; } },
            { id: 'ridge', label: 'Ridge', row: function (x, z) { return { k: 'ridge', pts: [[x - 8, z], [x + 8, z]], w: 6, h: 2 }; } },
            { id: 'pool', label: 'Pool (water)', row: function (x, z) { return { k: 'pool', x: x, z: z, r: 4, y: -0.2, depth: 0.8 }; } },
            { id: 'stream', label: 'Stream (water)', row: function (x, z) { return { k: 'stream', pts: [[x - 8, z - 2], [x, z], [x + 8, z + 2]], w: 2.4, y: -0.3, depth: 0.6 }; } },
            { id: 'path', label: 'Path (painted)', row: function (x, z) { return { k: 'path', pts: [[x - 8, z], [x + 8, z]], w: 1.8 }; } },
            { id: 'tree', label: 'Tree', row: function (x, z) { return { k: 'tree', x: x, z: z, kind: 'tree' }; } },
            { id: 'grove', label: 'Grove (trees in a disc)', row: function (x, z) { return { k: 'grove', x: x, z: z, r: 8, n: 10, kinds: ['tree', 'tree_2', 'tree_3'], seed: 1 }; } },
            { id: 'scatter', label: 'Scatter (props in a disc)', row: function (x, z) { return { k: 'scatter', key: 'fern', x: x, z: z, r: 6, n: 8, seed: 1 }; } },
            { id: 'climb', label: 'Climb (ladder, rope …)', row: function (x, z) { return { k: 'climb', x: x, z: z, face: 0, look: 'ladder' }; } },
            /* E1: the building pieces (the draw tools make most of these by dragging; the ADD list drops a default one) */
            { id: 'slab', label: 'Floor slab (walk on it, walk under it)', row: function (x, z) { return { k: 'bridge', x0: x - 3, z0: z, x1: x + 3, z1: z, w: 6, y: 3, thick: 0.28, plain: true, rails: false }; } },
            { id: 'texbuilding', label: 'Building (textured block)', row: function (x, z) { return { k: 'texbuilding', x: x, z: z, w: 10, d: 8, rot: 0, storeys: 3 }; } },
            { id: 'pillar', label: 'Pillar (round)', row: function (x, z) { return { k: 'kit', fn: 'hqRoundBlock', args: { r: 0.6, y: 4, n: 16, key: 'urban:ConcreteStriped2c' }, x: x, z: z, yaw: 0 }; } },
            { id: 'fence', label: 'Fence (a low wall)', row: function (x, z) { return { k: 'wall', x0: x - 3, z0: z, x1: x + 3, z1: z, h: 1.1, t: 0.12, key: 'wood' }; } },
        ];
        function kindRow(id, x, z) { for (var i = 0; i < KINDS.length; i++) if (KINDS[i].id === id) return KINDS[i].row(Math.round(x * 4) / 4, Math.round(z * 4) / 4); return null; }
        function snap(v, s) { return s > 0 ? Math.round(v / s) * s : v; }
        function rowLabel(list, row) {
            if (!row) return '?';
            if (list === 'props') return (row.key || 'prop') + (row.label ? ' · ' + row.label : '');
            if (list === 'doors') return 'door ' + (row.id || '') + (row.action && row.action.room ? ' → ' + row.action.room : '') + (row.wall ? ' (' + row.wall + ')' : '');
            if (row.k === 'prefab') return 'prefab · ' + (row.pf || '?');
            if (row.k === 'kit') return 'kit · ' + String(row.fn || '?').replace(/^hq/, '');
            if (row.k === 'opening') return 'opening · ' + (row.glaze ? 'window' : (row.sill > 0.05 ? 'window gap' : 'door gap')) + ' in ' + (row.wall || '?');
            if (row.k === 'texbuilding') return 'building · ' + (row.storeys || 2) + ' storeys' + (row.style ? ' · ' + row.style : '');
            if (row.k === 'bridge' && row.plain) return 'floor slab · y ' + row.y;
            if (row.k) return row.k + (row.kicker ? ' (kicker)' : row.stairs ? ' (stairs)' : '') + (row.key ? ' · ' + row.key : '') + (row.kind ? ' · ' + row.kind : '') + (row.look ? ' · ' + row.look : '');
            return list;
        }
        function isOwnPf(id) { return /^w_pf\d+$/.test(String(id || '')); }
        function nextPfId(doc) { var n = 1; while (doc && doc.prefabs && doc.prefabs['w_pf' + n]) n++; return 'w_pf' + n; }
        return { isOwnPf: isOwnPf, nextPfId: nextPfId, clone: clone, cleanExport: cleanExport, utf8: utf8, utf8dec: utf8dec, crc32: crc32, zipStore: zipStore, unzip: unzip,
                 patchDo: patchDo, patchUndo: patchUndo, stepDo: stepDo, stepUndo: stepUndo, stepRooms: stepRooms,
                 rowAnchor: rowAnchor, rowTransform: rowTransform, rowShape: rowShape, KINDS: KINDS, kindRow: kindRow, snap: snap, rowLabel: rowLabel };
    })();
    W.EWEditorCore = Core;
    if (typeof document === 'undefined' || typeof THREE === 'undefined') return;   // headless (the tests): the core only

    /* ══ THE STATE ══════════════════════════════════════════════════════════════════════════════════════════════════════ */
    var UNDO_MAX = 200;
    var ED = {
        open: false, playing: false, mode: 'world',   // 'world' = his rooms, editable; 'library' = a data.js room, read only
        project: null, doc: null, exported: null,     // the project's name, its world doc, the shas of the last export
        roomId: null, libRoom: null,
        sel: [], undo: [], redo: [], dirty: false, savedAt: 0,
        cam: { x: 0, y: 14, z: 30, yaw: 0, pitch: -0.45, speed: 10 },
        keys: {}, rmb: false, mmb: false, orbit: null, last: { x: 0, y: 0 },
        snap: 0.5, rotSnap: 15, grid: true, tool: 'translate',
        view: null, group: null, gridObj: null, spawnObj: null, boxes: [], proxies: [], tc: null, tcDragging: false, tcStart: null, pivot: null,
        cursor: null, cursorAt: 0, mouse: { x: 0, y: 0, in: false },
        reloadTimer: null, saveTimer: null, statusAt: 0, flags: null, hook: null, ready: false,
        /* E1: the draw tool ({ tool, a, chain, preview }), its options, the prefab being edited */
        draw: null, pfId: null,
        opts: { wallH: 3, wallT: 0.25, wallKey: 'urban:ConcreteStriped2c', wallKeyIn: 'urban:PlasterWallPainted1a', height: 3, floorKey: 'urban:ConcreteStriped1b', storeys: 3 },
    };
    var PF_ROOM = '__ed_prefab';   // the room the editor lays a prefab out in while it is edited (never saved, never exported)
    var U = function () { return (ED.view && ED.view.units) || (typeof DOOR_HQ !== 'undefined' && DOOR_HQ.units) || 73; };
    var $ = function (id) { return document.getElementById(id); };
    var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
    function room() { return ED.roomId ? (ED.mode === 'world' ? (ED.doc && ED.doc.rooms[ED.roomId]) : (DOOR_HQ.rooms || {})[ED.roomId]) : null; }
    function editable() { return (ED.mode === 'world' || (ED.mode === 'prefab' && !!(ED.doc && ED.doc.prefabs[ED.pfId]))) && !!room(); }
    /* where this view's rows live in the doc: a room of his, or the prefab being edited (E1) */
    function basePath() { return ED.mode === 'prefab' ? ['prefabs', ED.pfId] : ['rooms', ED.roomId]; }
    function toast(msg, ms) {
        var t = $('edToast'); if (!t) return;
        t.textContent = msg; t.style.display = ''; t.classList.add('on');
        clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('on'); t.style.display = 'none'; }, ms || 2600);
    }

    /* ══ STORAGE: IndexedDB `ew_editor` (projects), never localStorage (R9: 5 MB) ═══════════════════════════════════════ */
    var _db = null;
    function idb() {
        if (_db) return _db;
        _db = new Promise(function (res, rej) {
            if (typeof indexedDB === 'undefined') { rej(new Error('no IndexedDB')); return; }
            var q = indexedDB.open('ew_editor', 1);
            q.onupgradeneeded = function () { var db = q.result; if (!db.objectStoreNames.contains('projects')) db.createObjectStore('projects', { keyPath: 'name' }); if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta'); };
            q.onsuccess = function () { res(q.result); };
            q.onerror = function () { rej(q.error); };
        });
        _db.catch(function () { _db = null; });
        return _db;
    }
    function idbDo(store, mode, fn) {
        return idb().then(function (db) { return new Promise(function (res, rej) {
            var tx = db.transaction(store, mode), st = tx.objectStore(store), r = fn(st);
            tx.oncomplete = function () { res(r && r.result !== undefined ? r.result : undefined); };
            tx.onerror = function () { rej(tx.error); }; tx.onabort = function () { rej(tx.error); };
        }); });
    }
    function saveNow() {
        if (!ED.project || !ED.doc) return Promise.resolve(false);
        var rec = { name: ED.project, doc: Core.cleanExport(ED.doc), exported: ED.exported || null, savedAt: Date.now(), cam: Object.assign({}, ED.cam), roomId: ED.mode === 'world' ? ED.roomId : null };
        return idbDo('projects', 'readwrite', function (st) { return st.put(rec); })
            .then(function () { return idbDo('meta', 'readwrite', function (st) { return st.put(ED.project, 'last'); }); })
            .then(function () { ED.dirty = false; ED.savedAt = Date.now(); status(); return true; })
            .catch(function (e) { console.warn('[editor] autosave failed', e); toast('AUTOSAVE FAILED · ' + (e && e.message || e), 5000); return false; });
    }
    function saveSoon() { ED.dirty = true; clearTimeout(ED.saveTimer); ED.saveTimer = setTimeout(saveNow, 600); }
    function projectList() { return idbDo('projects', 'readonly', function (st) { return st.getAll(); }).then(function (a) { return (a || []).sort(function (x, y) { return (y.savedAt || 0) - (x.savedAt || 0); }); }); }
    function projectLoad(name) { return idbDo('projects', 'readonly', function (st) { return st.get(name); }); }
    function lastProject() { return idbDo('meta', 'readonly', function (st) { return st.get('last'); }).catch(function () { return null; }); }

    /* ══ THE DOC IN THE GAME: his rooms are laid into DOOR_HQ.rooms by reference (hqWorldDocApply), so PLAY HERE and every door
       read them; a room the doc drops is taken out again ═══════════════════════════════════════════════════════════════ */
    function docPrepare(doc) {
        doc.rooms = doc.rooms || {}; doc.prefabs = doc.prefabs || {}; doc.retire = doc.retire || []; doc.zones = doc.zones || {}; doc.links = doc.links || []; doc.dungeons = doc.dungeons || {};
        Object.keys(doc.prefabs).forEach(function (id) { var pf = doc.prefabs[id]; pf.id = id; pf.terrain = pf.terrain || {}; pf.terrain.features = pf.terrain.features || []; pf.terrain.marks = pf.terrain.marks || []; pf.props = pf.props || []; W.hqWorldDocRowIds(pf); });
        Object.keys(doc.rooms).forEach(function (id) { W.hqWorldDocRowIds(doc.rooms[id]); if (!doc.rooms[id].edit) doc.rooms[id].edit = { grid: 1, snapDeg: 15, layers: {}, hidden: [], cam: null, notes: '' }; });
        if (!doc.start || !doc.rooms[doc.start.room]) { var first = Object.keys(doc.rooms)[0]; doc.start = first ? { room: first, at: { x: 0, z: 0, face: 0 } } : null; }
        return doc;
    }
    /* THE PREFABS IN THE GAME (E1): HQ_PREFABS holds his prefab docs by reference; the prefab being edited is laid out in PF_ROOM
       (a flat ground whose rows ARE the prefab's arrays) */
    function prefabSync() {
        var P = W.HQ_PREFABS; if (!P || !ED.doc) return;
        Object.keys(P).forEach(function (k) { if (Core.isOwnPf(k) && !ED.doc.prefabs[k]) delete P[k]; });
        Object.keys(ED.doc.prefabs).forEach(function (k) { var pf = ED.doc.prefabs[k]; pf.terrain = pf.terrain || {}; pf.terrain.features = pf.terrain.features || []; pf.terrain.marks = pf.terrain.marks || []; pf.props = pf.props || []; P[k] = pf; });
        if (ED.mode === 'prefab' && ED.doc.prefabs[ED.pfId]) {
            var pf = ED.doc.prefabs[ED.pfId], w = W.hqWorldDocNewRoom(PF_ROOM, { w: 64, d: 64, label: pf.label || ED.pfId });
            w.terrain.features = pf.terrain.features; w.terrain.marks = pf.terrain.marks; w.props = pf.props; w.label = (pf.label || ED.pfId);
            var old = DOOR_HQ.rooms[PF_ROOM]; if (old && old.edit && old.edit.cam) w.edit.cam = old.edit.cam;
            DOOR_HQ.rooms[PF_ROOM] = w;
        }
    }
    /* the rooms a step touched: 'rooms' paths, and every room placing a prefab when a prefab changed */
    function stepTouched(step) {
        var ids = Core.stepRooms(step);
        if (step.some(function (p) { return p.path[0] === 'prefabs'; })) {
            Object.keys(ED.doc.rooms).forEach(function (id) { if (ids.indexOf(id) < 0 && (listOf(ED.doc.rooms[id], 'terrain.features') || []).some(function (f) { return f && f.k === 'prefab'; })) ids.push(id); });
            if (ED.mode === 'prefab') ids.push(PF_ROOM);
        }
        return ids;
    }
    function docSync(ids) {
        prefabSync();
        var R = DOOR_HQ.rooms;
        (ids || Object.keys(ED.doc.rooms)).forEach(function (id) {
            var r = ED.doc.rooms[id];
            if (id === PF_ROOM) { if (R[id] && R[id]._terrainInfo) delete R[id]._terrainInfo; return; }
            if (r) { if (R[id] !== r) R[id] = r; if (r._terrainInfo) delete r._terrainInfo; }
            else if (R[id] && W.hqWorldDocIsOwn(id)) W.hqWorldDocRemoveRoom(id);
        });
        try { W.hqWorldDocRebuild((ids || []).filter(function (x) { return x !== PF_ROOM; })); } catch (e) { console.warn('[editor] rebuild', e); }
    }
    function docLoad(doc, name) {
        /* the previous project's rooms leave DOOR_HQ first */
        if (ED.doc) Object.keys(ED.doc.rooms).forEach(function (id) { if (!doc.rooms || !doc.rooms[id]) { try { W.hqWorldDocRemoveRoom(id); } catch (e) {} } });
        ED.doc = docPrepare(doc); ED.project = name; ED.undo = []; ED.redo = []; ED.sel = [];
        if (ED.mode === 'prefab') { ED.mode = 'world'; ED.pfId = null; }
        prefabSync();
        var res = W.hqWorldDocApply({ rooms: ED.doc.rooms });
        if (res.bad.length) toast('ROOMS REFUSED · ' + res.bad.map(function (b) { return b.id + ' (' + b.why + ')'; }).join(', '), 6000);
    }

    /* ══ COMMIT: one undo step ══════════════════════════════════════════════════════════════════════════════════════════ */
    function commit(step, label, o) {
        if (!step || !step.length) return;
        try { Core.stepDo(ED.doc, step); } catch (e) { console.warn('[editor] the edit failed', e); toast('THAT EDIT FAILED · ' + e.message, 4000); return; }
        step.label = label || 'edit';
        ED.undo.push(step); if (ED.undo.length > UNDO_MAX) ED.undo.shift();
        ED.redo = [];
        afterStep(step, o);
    }
    function afterStep(step, o) {
        var ids = stepTouched(step);
        docSync(ids);
        if (ED.mode === 'prefab' && !ED.doc.prefabs[ED.pfId]) { ED.mode = 'world'; ED.pfId = null; var f0 = Object.keys(ED.doc.rooms)[0]; if (f0) { enterRoom(f0, 'world'); panels(); return; } }
        saveSoon();
        ED.sel = ED.sel.filter(selRow);
        if (ids.indexOf(ED.roomId) >= 0 && !(o && o.noReload)) reloadSoon();
        if (ED.mode === 'world' && ED.roomId && !ED.doc.rooms[ED.roomId]) { var first = Object.keys(ED.doc.rooms)[0]; if (first) enterRoom(first, 'world'); }
        panels();
    }
    function undo() { var s = ED.undo.pop(); if (!s) return; try { Core.stepUndo(ED.doc, s); } catch (e) { toast('UNDO FAILED · ' + e.message); return; } ED.redo.push(s); afterStep(s); toast('UNDO · ' + s.label, 1200); }
    function redo() { var s = ED.redo.pop(); if (!s) return; try { Core.stepDo(ED.doc, s); } catch (e) { toast('REDO FAILED · ' + e.message); return; } ED.undo.push(s); afterStep(s); toast('REDO · ' + s.label, 1200); }

    /* ══ ROWS: selection = [{ list, id }] ('spawn' and 'room' are the room's own) ═══════════════════════════════════════ */
    var LISTS = ['terrain.features', 'props', 'doors', 'counters', 'npcSpots', 'agents'];
    function listOf(r, list) { return (r && W.hqWorldDocList) ? W.hqWorldDocList(r, list) : null; }
    function rowPath(list, i) { return basePath().concat(list.split('.'), [i]); }
    function findRow(list, id) { var L = listOf(room(), list); if (!L) return null; for (var i = 0; i < L.length; i++) if (L[i] && L[i].id === id) return { row: L[i], i: i, list: list }; return null; }
    function selRow(s) { if (!s) return null; if (s.list === 'spawn') return room() ? { row: room().spawn || { x: 0, z: 0, face: 0 }, list: 'spawn' } : null; return findRow(s.list, s.id); }
    function isSel(list, id) { return ED.sel.some(function (s) { return s.list === list && s.id === id; }); }
    function select(list, id, add) {
        if (!list) { ED.sel = []; }
        else if (add) { if (isSel(list, id)) ED.sel = ED.sel.filter(function (s) { return !(s.list === list && s.id === id); }); else ED.sel.push({ list: list, id: id }); }
        else ED.sel = [{ list: list, id: id }];
        gizmoAttach(); panels();
    }
    /* the ensure-list patches: an absent list is created first (one step with the insert) */
    function ensureList(list, step) {
        var r = ED.mode === 'prefab' ? ED.doc.prefabs[ED.pfId] : room(), parts = list.split('.'), o = r, path = basePath();
        for (var i = 0; i < parts.length; i++) {
            path = path.concat([parts[i]]);
            if (o[parts[i]] == null) { step.push({ path: path.slice(), before: undefined, after: (i === parts.length - 1) ? [] : {} }); o = (i === parts.length - 1) ? [] : {}; }
            else o = o[parts[i]];
        }
        return Array.isArray(o) ? o.length : 0;
    }
    function nextId(r) {
        var max = 0;
        LISTS.concat(['terrain.marks', 'onlineSpots']).forEach(function (l) { (listOf(r, l) || []).forEach(function (x) { var m = /^r(\d+)$/.exec(String(x && x.id || '')); if (m) max = Math.max(max, +m[1]); }); });
        return 'r' + (max + 1);
    }
    function addRow(list, row, label, o) {
        if (!editable()) { toast('THE LIBRARY IS READ ONLY · COPY INTO WORLD first'); return null; }
        if (ED.mode === 'prefab' && list !== 'terrain.features' && list !== 'props') { toast('A PREFAB HOLDS SHAPES AND PROPS ONLY'); return null; }
        var step = [], n = ensureList(list, step);
        row = Core.clone(row); if (row.id == null) row.id = nextId(room());
        step.push({ path: rowPath(list, n), before: undefined, after: row });
        commit(step, label || ('add ' + Core.rowLabel(list, row)));
        if (!(o && o.noSelect)) select(list, row.id);
        return row;
    }
    function replaceRows(pairs, label, o) {   // pairs = [{ list, i, before, after }]
        if (!editable() || !pairs.length) return;
        commit(pairs.map(function (p) { return { path: rowPath(p.list, p.i), before: p.before, after: p.after }; }), label, o);
    }
    function deleteSel() {
        if (!editable() || !ED.sel.length) return;
        var hits = ED.sel.map(selRow).filter(function (h) { return h && h.list !== 'spawn'; });
        hits.sort(function (a, b) { return a.list === b.list ? b.i - a.i : (a.list < b.list ? -1 : 1); });   // highest index first: the undo re-inserts in reverse
        var step = hits.map(function (h) { return { path: rowPath(h.list, h.i), before: Core.clone(h.row), after: undefined }; });
        ED.sel = [];
        commit(step, 'delete ' + hits.length);
    }
    function duplicateSel() {
        if (!editable() || !ED.sel.length) return;
        var hits = ED.sel.map(selRow).filter(function (h) { return h && h.list !== 'spawn' && h.list !== 'doors'; });
        if (!hits.length) return;
        var step = [], r = room(), max = +nextId(r).slice(1) - 1, sel = [];
        var ends = {};
        hits.forEach(function (h) {
            if (ends[h.list] == null) ends[h.list] = (listOf(r, h.list) || []).length;
            var copy = Core.rowTransform(h.row, { dx: Math.max(ED.snap, 1), dz: Math.max(ED.snap, 1), px: 0, pz: 0 });
            copy.id = 'r' + (++max);
            step.push({ path: rowPath(h.list, ends[h.list]++), before: undefined, after: copy });
            sel.push({ list: h.list, id: copy.id });
        });
        commit(step, 'duplicate ' + hits.length);
        ED.sel = sel; gizmoAttach(); panels();
    }

    /* ══ THE VIEWPORT ═══════════════════════════════════════════════════════════════════════════════════════════════════ */
    ED.hook = { play: false, tick: function (dt, H) { tick(dt, H); } };
    function enterRoom(id, mode, o) {
        o = o || {};
        var prevRoom = ED.roomId, prevMode = ED.mode;
        ED.mode = mode || (W.hqWorldDocIsOwn(id) && ED.doc.rooms[id] ? 'world' : 'library');
        ED.roomId = id; ED.libRoom = ED.mode === 'library' ? id : null;
        if (prevRoom !== id || prevMode !== ED.mode) { ED.sel = []; if (!o.keepCam) camHome(o.at); }
        ED.ready = false;
        ED.hook.play = false;
        clearTimeout(ED.reloadTimer); ED.reloadTimer = null;
        var ok = W._hqEditEnter({ room: id, edit: ED.hook, onReady: function () { ED.ready = true; rebuildProxies(); status(); }, onEscape: null });
        if (!ok) { toast('THE ROOM DID NOT BUILD · ' + id, 5000); return false; }
        if (!ED.rmb) lookLock(false);   // THE POINTER: a lock the walk carried back from PLAY HERE goes
        overlayBuild();
        panels();
        return true;
    }
    function reloadSoon() { clearTimeout(ED.reloadTimer); ED.reloadTimer = setTimeout(function () { ED.reloadTimer = null; if (ED.open && !ED.playing && ED.roomId) enterRoom(ED.roomId, ED.mode, { keepCam: true }); }, 220); }
    function camHome(at) {
        var r = room(); if (!r) return;
        if (r.edit && r.edit.cam && !at) { Object.assign(ED.cam, r.edit.cam); return; }
        var sp = at || r.spawn || { x: 0, z: 0, face: 0 }, S = r.shell || {};
        var yaw = ((sp.face || 0) * Math.PI) / 180, back = Math.min(18, Math.max(6, (S.d || 20) * 0.25));
        ED.cam.x = (+sp.x || 0) - Math.sin(yaw) * back; ED.cam.z = (+sp.z || 0) + Math.cos(yaw) * back;
        ED.cam.y = (+sp.y || 0) + Math.min(14, back * 0.7) + 1.7; ED.cam.yaw = yaw; ED.cam.pitch = -0.5;
    }
    function frameSel() {
        var o = ED.sel.map(selRow).filter(Boolean)[0]; if (!o) return;
        var a = Core.rowAnchor(o.row), g = ground(a.x, a.z), d = 10;
        ED.cam.x = a.x - Math.sin(ED.cam.yaw) * d; ED.cam.z = a.z + Math.cos(ED.cam.yaw) * d; ED.cam.y = g + 6; ED.cam.pitch = -0.5;
    }
    /* THE GROUND the editor builds on: the room's height field (hills, plateaus, a building's roof) — never a wall's walkable top
       or a floor slab (the walker's surface stands ON a wall: a wall's pick box, a new wall at its end, a door gap all floated a
       wall's height up) */
    function ground(x, z) {
        try {
            var r = room(), ti = r && r.terrain && r._terrainInfo;
            if (ti && typeof W.hqTerrainHeight === 'function') { var h = W.hqTerrainHeight(ti, x, z); if (isFinite(h)) return h; }
            var v = ThreeRenderer.hq.surface(x, z); return (v == null || !isFinite(v)) ? 0 : v;
        } catch (e) { return 0; }
    }
    /* the overlay: an `editor` group the player's game never creates (the grid, the spawn mark, the proxies, the boxes, the gizmo) */
    function overlayBuild() {
        ED.view = ThreeRenderer.hq.editView();
        if (!ED.view) return;
        var u = U(), sc = ED.view.scene, r = ED.view.room || {};
        var G = new THREE.Group(); G.name = 'editor'; G.renderOrder = 10; sc.add(G); ED.group = G;
        var S = r.shell || {}, size = Math.max(8, Math.ceil(Math.max(S.w || 40, S.d || 40) / 2) * 2 + 8), step = Math.max(0.25, ED.snap >= 1 ? ED.snap : 1);
        var grid = new THREE.GridHelper(size * u, Math.round(size / step), 0x6fd3ff, 0x2a4a5a);
        grid.material.transparent = true; grid.material.opacity = 0.35; grid.material.depthWrite = false; grid.material.fog = false;
        grid.position.y = 0.03 * u; grid.visible = ED.grid; grid.renderOrder = 11; G.add(grid); ED.gridObj = grid;
        /* the spawn: a cone pointing where the walker faces (picked as 'spawn') */
        var sp = new THREE.Mesh(new THREE.ConeGeometry(0.35 * u, 1.1 * u, 12), new THREE.MeshBasicMaterial({ color: 0x57f287, transparent: true, opacity: 0.85, depthTest: false, fog: false }));
        sp.rotation.x = Math.PI / 2; var spW = new THREE.Group(); spW.add(sp); spW.userData.edSel = { list: 'spawn' }; G.add(spW); ED.spawnObj = spW; spawnPlace();
        if (ED.mode === 'prefab') { spW.visible = false; ED.spawnObj = null; }   // a prefab has no spawn
        ED.pivot = new THREE.Object3D(); G.add(ED.pivot);
        tcBuild();
        rebuildProxies();
        ED.view.camera.near = 0.05 * u; ED.view.camera.far = Math.max(400, Math.hypot(S.w || 100, S.d || 100) * 2) * u; ED.view.camera.updateProjectionMatrix();
    }
    function spawnPlace() {
        var r = room(), o = ED.spawnObj; if (!o || !r) return;
        var sp = r.spawn || { x: 0, z: 0, face: 0 }, u = U(), yaw = ((sp.face || 0) * Math.PI) / 180;
        o.position.set((+sp.x || 0) * u, (ground(+sp.x || 0, +sp.z || 0) + 0.8) * u, (+sp.z || 0) * u);
        o.rotation.y = -yaw + Math.PI; o.children[0].rotation.x = -Math.PI / 2;
    }
    var _proxyMat = null;
    function rebuildProxies() {
        if (!ED.group) return;
        ED.proxies.forEach(function (p) { if (p.obj && p.own && p.obj.parent) { p.obj.parent.remove(p.obj); p.obj.traverse(function (m) { if (m.geometry) m.geometry.dispose(); }); } });
        ED.proxies = [];
        var r = room(); if (!r) return;
        var u = U(), V = ThreeRenderer.hq.editView() || ED.view; ED.view = V;
        if (!_proxyMat) _proxyMat = new THREE.MeshBasicMaterial({ visible: false });
        (listOf(r, 'terrain.features') || []).forEach(function (row) {
            var boxes = Core.rowShape(row, ground, function (r2) { try { return W.hqRowExpand ? W.hqRowExpand(r2) : []; } catch (e) { return []; } });
            if (row.k === 'opening') boxes = openingBoxes(r, row);
            if (!boxes.length) return;
            var grp = new THREE.Group(); grp.userData.edSel = { list: 'terrain.features', id: row.id };
            boxes.forEach(function (b) {
                var m = new THREE.Mesh(new THREE.BoxGeometry(b.w * u, (b.y1 - b.y0) * u, b.L * u), _proxyMat);
                m.position.set(b.cx * u, (b.y0 + b.y1) / 2 * u, b.cz * u); m.rotation.y = b.yaw; grp.add(m);
            });
            ED.group.add(grp);
            ED.proxies.push({ obj: grp, own: true, sel: grp.userData.edSel });
        });
        (V.props || []).forEach(function (p) { if (p.row && p.row.id && p.grp) { p.grp.userData.edSel = { list: 'props', id: p.row.id }; ED.proxies.push({ obj: p.grp, own: false, sel: p.grp.userData.edSel }); } });
        (V.doors || []).forEach(function (d) { if (d.door && d.door.id && d.group && (r.doors || []).some(function (x) { return x && x.id === d.door.id; })) { d.group.userData.edSel = { list: 'doors', id: d.door.id }; ED.proxies.push({ obj: d.group, own: false, sel: d.group.userData.edSel }); } });
        if (ED.spawnObj) ED.proxies.push({ obj: ED.spawnObj, own: false, sel: { list: 'spawn' } });
        boxesUpdate();
    }
    /* an opening's box: on its wall, `at` metres from the wall's start, sill → sill + h, a little thicker than the wall */
    function openingBoxes(r, o) {
        var w = null; (listOf(r, 'terrain.features') || []).forEach(function (f) { if (f && f.id === o.wall && f.k === 'wall') w = f; });
        if (!w) return [];
        var L = Math.hypot(w.x1 - w.x0, w.z1 - w.z0) || 1, ux = (w.x1 - w.x0) / L, uz = (w.z1 - w.z0) / L, at = +o.at || 0, hw = (+o.w || 1.2) / 2;
        var gm = Math.max(ground(w.x0, w.z0), ground(w.x1, w.z1)), y0 = gm + (+o.sill || 0);
        var a = { x: w.x0 + ux * (at - hw), z: w.z0 + uz * (at - hw) }, b = { x: w.x0 + ux * (at + hw), z: w.z0 + uz * (at + hw) };
        var dx = b.x - a.x, dz = b.z - a.z;
        return [{ cx: (a.x + b.x) / 2, cz: (a.z + b.z) / 2, w: (+w.t || 0.35) + 0.3, L: Math.hypot(dx, dz), y0: y0, y1: y0 + (+o.h || 2.2), yaw: Math.atan2(dx, dz) }];
    }
    function objFor(s) { for (var i = 0; i < ED.proxies.length; i++) { var p = ED.proxies[i]; if (p.sel.list === s.list && p.sel.id === s.id) return p.obj; } return null; }
    /* the selection's yellow boxes (re-fit every frame: a GLB lands, a live drag) */
    function boxesUpdate() {
        ED.boxes.forEach(function (b) { if (b.parent) b.parent.remove(b); b.geometry.dispose(); });
        ED.boxes = [];
        if (!ED.group) return;
        ED.sel.forEach(function (s) {
            var o = objFor(s); if (!o) return;
            var h = new THREE.BoxHelper(o, 0xffd84a); h.material.depthTest = false; h.material.transparent = true; h.material.fog = false; h.renderOrder = 12; h._edFor = o;
            ED.group.add(h); ED.boxes.push(h);
        });
    }
    /* ── THE GIZMO (three r128's TransformControls, from the examples folder index.html already loads from) ── */
    var TC_URL = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/TransformControls.js';
    var _tcLoading = null;
    function tcEnsure() {
        if (THREE.TransformControls) return Promise.resolve(true);
        if (_tcLoading) return _tcLoading;
        _tcLoading = new Promise(function (res) { var s = document.createElement('script'); s.src = TC_URL; s.onload = function () { res(!!THREE.TransformControls); }; s.onerror = function () { res(false); }; document.head.appendChild(s); });
        return _tcLoading;
    }
    function tcBuild() {
        if (ED.tc) { try { ED.tc.detach(); if (ED.tc.parent) ED.tc.parent.remove(ED.tc); ED.tc.dispose(); } catch (e) {} ED.tc = null; }
        if (!THREE.TransformControls || !ED.view) return;
        var tc = new THREE.TransformControls(ED.view.camera, ED.view.canvas);
        tc.setSpace('world'); tc.setSize(0.9);
        tc.addEventListener('dragging-changed', function (e) { ED.tcDragging = !!e.value; if (e.value) dragStart(); else dragEnd(); });
        tc.addEventListener('objectChange', function () { dragMove(); });
        tc.traverse(function (o) { if (o.material) { o.material.fog = false; } });
        ED.view.scene.add(tc); ED.tc = tc;
        tcMode(ED.tool);
        gizmoAttach();
    }
    function tcMode(m) {
        ED.tool = m;
        if (!ED.tc) return;
        ED.tc.setMode(m);
        ED.tc.showX = m !== 'rotate'; ED.tc.showZ = m !== 'rotate'; ED.tc.showY = true;
        ED.tc.setTranslationSnap(ED.snap > 0 ? ED.snap * U() : null);
        ED.tc.setRotationSnap(ED.rotSnap > 0 ? ED.rotSnap * Math.PI / 180 : null);
        ED.tc.setScaleSnap(0.05);
        panels();
    }
    function gizmoAttach() {
        boxesUpdate();
        if (!ED.tc || !ED.pivot) return;
        var hits = ED.sel.map(selRow).filter(Boolean);
        if (!hits.length || !editable()) { ED.tc.detach(); return; }
        var a = Core.rowAnchor(hits[0].row), u = U(), o = objFor(ED.sel[0]), row = hits[0].row;
        var y = isFinite(row.y) && hits[0].list === 'terrain.features' ? +row.y : ground(a.x, a.z);   // a shape: its top where the walker stands
        if (o && hits[0].list !== 'terrain.features' && hits[0].list !== 'spawn') { var bb = new THREE.Box3().setFromObject(o); if (isFinite(bb.min.y)) y = bb.min.y / u; }
        ED.pivot.position.set(a.x * u, y * u, a.z * u); ED.pivot.rotation.set(0, 0, 0); ED.pivot.scale.set(1, 1, 1); ED.pivot.updateMatrixWorld(true);
        ED.tc.attach(ED.pivot);
    }
    /* the live drag: the selected objects follow the pivot (a prop / a door moves itself; a shape's proxy stands in) */
    function dragStart() {
        var u = U(), P = ED.pivot;
        ED.tcStart = { p: P.position.clone(), ry: P.rotation.y, objs: ED.sel.map(function (s) { var o = objFor(s); return o ? { o: o, p: o.position.clone(), ry: o.rotation.y, s: o.scale.clone() } : null; }).filter(Boolean) };
    }
    function dragDelta() {
        var S = ED.tcStart, P = ED.pivot, u = U(); if (!S) return null;
        return { dx: (P.position.x - S.p.x) / u, dy: (P.position.y - S.p.y) / u, dz: (P.position.z - S.p.z) / u, rot: -(P.rotation.y - S.ry) * 180 / Math.PI, sx: P.scale.x, sy: P.scale.y, sz: P.scale.z, px: S.p.x / u, pz: S.p.z / u };
    }
    function dragMove() {
        var S = ED.tcStart, d = dragDelta(); if (!S || !d) return;
        var u = U(), c = Math.cos(-d.rot * Math.PI / 180), s = Math.sin(-d.rot * Math.PI / 180);
        S.objs.forEach(function (e) {
            var rx = e.p.x - S.p.x, rz = e.p.z - S.p.z;
            e.o.position.set(S.p.x + rx * c + rz * s + d.dx * u, e.p.y + d.dy * u, S.p.z - rx * s + rz * c + d.dz * u);
            e.o.rotation.y = e.ry - d.rot * Math.PI / 180;
            if (ED.tool === 'scale') e.o.scale.set(e.s.x * d.sx, e.s.y * d.sy, e.s.z * d.sz);
        });
        ED.boxes.forEach(function (b) { b.update(); });
        status();
    }
    function dragEnd() {
        var d = dragDelta(), S = ED.tcStart; ED.tcStart = null;
        if (!d || !S) return;
        var moved = Math.abs(d.dx) + Math.abs(d.dy) + Math.abs(d.dz) > 1e-4, turned = Math.abs(d.rot) > 1e-3, sized = Math.abs(d.sx - 1) + Math.abs(d.sy - 1) + Math.abs(d.sz - 1) > 1e-4;
        if (!moved && !turned && !sized) return;
        var pairs = [], spawn = null, liveOnly = true;
        ED.sel.forEach(function (s) {
            var h = selRow(s); if (!h) return;
            var t = { dx: d.dx, dy: d.dy, dz: d.dz, rot: d.rot, sx: d.sx, sy: d.sy, sz: d.sz, px: d.px, pz: d.pz };
            if (h.list === 'doors' && h.row.wall && h.row.wall !== 'free') { t.axis = (h.row.wall === 'n' || h.row.wall === 's') ? 'x' : 'z'; t.rot = 0; t.dy = 0; }
            if (h.list === 'spawn') { spawn = Core.rowTransform(h.row, t); return; }
            var after = Core.rowTransform(h.row, t);
            if (h.row.k === 'opening') {   // a door gap / window slides along its wall (clamped to it)
                var wl = findRow('terrain.features', h.row.wall), ww = wl && wl.row;
                if (ww) { var L = Math.hypot(ww.x1 - ww.x0, ww.z1 - ww.z0) || 1, hw = (+after.w || 1.2) / 2; after.at = Core.snap(Math.max(hw, Math.min(L - hw, (+h.row.at || 0) + (d.dx * (ww.x1 - ww.x0) + d.dz * (ww.z1 - ww.z0)) / L)), 0.05); }
            }
            if (!(h.list === 'props' && !d.dy && !sized)) liveOnly = false;
            pairs.push({ list: h.list, i: h.i, before: Core.clone(h.row), after: after });
        });
        var step = pairs.map(function (p) { return { path: rowPath(p.list, p.i), before: p.before, after: p.after }; });
        if (spawn) step.push({ path: ['rooms', ED.roomId, 'spawn'], before: Core.clone(room().spawn), after: { x: spawn.x, z: spawn.z, face: spawn.face || 0, level: spawn.level || 0 } });
        commit(step, (ED.tool === 'rotate' ? 'turn ' : ED.tool === 'scale' ? 'size ' : 'move ') + step.length, { noReload: liveOnly });
        if (liveOnly) { rebuildProxies(); spawnPlace(); }
        gizmoAttach();
    }

    /* ── THE FLY CAMERA: RIGHT MOUSE held = look + W A S D Q E; the arrows always; wheel = speed (held) / dolly; ALT + LEFT orbits,
       MIDDLE pans. The editor's own eye (the walker stands still; the player never has it — R6) ── */
    function tick(dt, H) {
        if (!ED.open || ED.playing) return;
        var c = ED.cam, k = ED.keys, fly = ED.rmb, sp = c.speed * (k.shift ? 3 : 1) * (k.ctrl ? 0.25 : 1);
        var fx = Math.sin(c.yaw) * Math.cos(c.pitch), fy = Math.sin(c.pitch), fz = -Math.cos(c.yaw) * Math.cos(c.pitch), rx = Math.cos(c.yaw), rz = Math.sin(c.yaw);
        var mf = ((fly && k.w) || k.up ? 1 : 0) - ((fly && k.s) || k.down ? 1 : 0), mr = ((fly && k.d) || k.right ? 1 : 0) - ((fly && k.a) || k.left ? 1 : 0), mu = ((fly && k.e) || k.pgup ? 1 : 0) - ((fly && k.q) || k.pgdn ? 1 : 0);
        c.x += (fx * mf + rx * mr) * sp * dt; c.y += (fy * mf + mu) * sp * dt; c.z += (fz * mf + rz * mr) * sp * dt;
        var cam = H.camera, u = U();
        cam.position.set(c.x * u, c.y * u, c.z * u);
        cam.rotation.order = 'YXZ'; cam.rotation.set(c.pitch, -c.yaw, 0);
        cam.updateMatrixWorld(true);
        /* the walker's rig stays out of the picture; in his own rooms it stands under the eye, so the shadow frustum and the
           streaming follow where mondo looks (a library room in a zone keeps it put: its stage would cross) */
        var pl = H.player;
        if (pl) {
            if (pl.entry && pl.entry.group) pl.entry.group.visible = false;
            if (ED.mode === 'world' && !H.stage) { var g = ground(c.x, c.z); pl.x = c.x; pl.z = c.z; pl.y = g; pl.visY = g; }
        }
        for (var i = 0; i < ED.boxes.length; i++) ED.boxes[i].update();
        var now = performance.now();
        if (ED.mouse.in && now - ED.cursorAt > 90) { ED.cursorAt = now; ED.cursor = rayGround(ED.mouse.x, ED.mouse.y); }
        if (now - ED.statusAt > 250) status();
    }
    var _ray = null;
    function rayFrom(mx, my) {
        if (!ED.view) return null;
        var cv = ED.view.canvas, rc = cv.getBoundingClientRect();
        if (!_ray) _ray = new THREE.Raycaster();
        _ray.setFromCamera({ x: ((mx - rc.left) / rc.width) * 2 - 1, y: -((my - rc.top) / rc.height) * 2 + 1 }, ED.view.camera);
        return _ray;
    }
    /* the cursor on the ground: march the ray over the walkable surface (the same one the walker reads) */
    function rayGround(mx, my) {
        var r = rayFrom(mx, my); if (!r) return null;
        var u = U(), o = r.ray.origin.clone().multiplyScalar(1 / u), d = r.ray.direction;
        var t = 0, stepM = 0.5, maxT = 600, prev = null;
        for (; t < maxT; t += stepM) {
            var x = o.x + d.x * t, y = o.y + d.y * t, z = o.z + d.z * t, g = ground(x, z);
            if (y <= g) {
                if (prev) { var lo = prev, hi = t; for (var i = 0; i < 8; i++) { var m = (lo + hi) / 2, gm = ground(o.x + d.x * m, o.z + d.z * m); if (o.y + d.y * m <= gm) hi = m; else lo = m; } t = hi; }
                return { x: o.x + d.x * t, y: ground(o.x + d.x * t, o.z + d.z * t), z: o.z + d.z * t };
            }
            prev = t;
            if (t > 40) stepM = 1.5;
        }
        if (d.y < -1e-3) { var tf = -o.y / d.y; return { x: o.x + d.x * tf, y: 0, z: o.z + d.z * tf }; }
        return null;
    }
    function pickAt(mx, my) {
        var r = rayFrom(mx, my); if (!r) return null;
        var objs = ED.proxies.map(function (p) { return p.obj; });
        var hits = r.intersectObjects(objs, true), shape = null, shapeD = 0;
        /* a shape's proxy is an invisible box round the whole shape (a hill, a ridge) and often holds the props and doors placed
           on it: a thing you can SEE (a prop, a door, the spawn) under the cursor always wins; the outliner picks the shape */
        for (var i = 0; i < hits.length; i++) {
            for (var o = hits[i].object; o; o = o.parent) if (o.userData && o.userData.edSel) {
                var sel = o.userData.edSel;
                if (sel.list !== 'terrain.features') return sel;
                if (!shape) { shape = sel; shapeD = hits[i].distance; }
                break;
            }
        }
        return shape;
    }
    function spot() {   // where a new row goes: the cursor on the ground, else the ground in front of the eye
        if (ED.cursor) return ED.cursor;
        var c = ED.cam, x = c.x + Math.sin(c.yaw) * 10, z = c.z - Math.cos(c.yaw) * 10;
        return { x: x, z: z, y: ground(x, z) };
    }


    /* ══ THE DRAW TOOLS (E1, EDITOR_PLAN §5.3): drag or click on the ground, snapped; each finished piece is one undo step ═════
       WALL    click the start, click every corner (a run of walls, each end joined); ENTER, ESC or a click on the first point ends it
       ROOM    drag a rectangle: four walls drawn clockwise, the INSIDE SHEET (keyIn) on their inner faces
       FLOOR   drag a rectangle: a floor slab at HEIGHT (a second storey: walk on it, walk under it)
       STAIRS  drag from the foot to the head: a stair up to HEIGHT (RAMP the same, smooth)
       BUILDING drag a rectangle: a textured block of the city's buildings (its front = the side you dragged last toward)
       DOOR / WINDOW  click on a wall: an opening in it (a gap with a lintel; a window has a sill and glass) */
    var DRAWS = {
        wall:     { label: 'WALL', how: 'chain', tip: 'Click the start, click each corner. ENTER / ESC ends the run.' },
        room:     { label: 'ROOM', how: 'rect', tip: 'Drag a rectangle: four walls, the inside sheet facing in.' },
        slab:     { label: 'FLOOR', how: 'rect', tip: 'Drag a rectangle: a floor slab at HEIGHT (walk on it and under it).' },
        stairs:   { label: 'STAIRS', how: 'line', tip: 'Drag from the foot to the head: stairs up to HEIGHT.' },
        ramp:     { label: 'RAMP', how: 'line', tip: 'Drag from the foot to the head: a ramp up to HEIGHT.' },
        building: { label: 'BUILDING', how: 'rect', tip: 'Drag a rectangle: a textured building of STOREYS floors.' },
        door:     { label: 'DOOR GAP', how: 'wall', tip: 'Click on a wall: a door-sized gap with a lintel.' },
        window:   { label: 'WINDOW', how: 'wall', tip: 'Click on a wall: a window (a sill, glass, a lintel).' },
    };
    function drawSet(tool) {
        drawPreview(null);
        ED.draw = tool ? { tool: tool, a: null, chain0: null, b: null } : null;
        if (tool) { select(null); toast(DRAWS[tool] ? DRAWS[tool].tip : ('PLACE · click on the ground'), 3200); }
        panels();
    }
    /* a ground point under the mouse, snapped: to a wall's end within 0.6 m (walls join), else to the grid (SNAP, 0.25 m at least);
       SHIFT from an anchor locks the direction to 45° steps */
    function drawPt(mx, my, e) {
        var c = rayGround(mx, my); if (!c) return null;
        var p = { x: c.x, z: c.z }, best = 0.6, hit = null;
        (listOf(room(), 'terrain.features') || []).forEach(function (f) { if (!f || f.k !== 'wall') return; [[f.x0, f.z0], [f.x1, f.z1]].forEach(function (q) { var d = Math.hypot(q[0] - p.x, q[1] - p.z); if (d < best) { best = d; hit = q; } }); });
        if (ED.draw && ED.draw.chain0 && Math.hypot(ED.draw.chain0.x - p.x, ED.draw.chain0.z - p.z) < 0.6) hit = [ED.draw.chain0.x, ED.draw.chain0.z];
        if (hit) return { x: hit[0], z: hit[1], joined: true };
        var sn = Math.max(0.25, ED.snap || 0);
        var a = ED.draw && ED.draw.a;
        if (a && e && e.shiftKey) {
            var dx = p.x - a.x, dz = p.z - a.z, L = Math.hypot(dx, dz), q = Math.round(Math.atan2(dz, dx) / (Math.PI / 4)) * (Math.PI / 4);
            L = Core.snap(L, sn); return { x: Core.snap(a.x + Math.cos(q) * L, 0.0001), z: Core.snap(a.z + Math.sin(q) * L, 0.0001) };
        }
        return { x: Core.snap(p.x, sn), z: Core.snap(p.z, sn) };
    }
    var _pvMat = null;
    function drawPreview(boxes) {
        var D = ED.draw;
        if (ED._pv) { ED._pv.traverse(function (m) { if (m.geometry) m.geometry.dispose(); }); if (ED._pv.parent) ED._pv.parent.remove(ED._pv); ED._pv = null; }
        if (!boxes || !boxes.length || !ED.group) return;
        if (!_pvMat) _pvMat = new THREE.MeshBasicMaterial({ color: 0xffd84a, transparent: true, opacity: 0.45, depthTest: false, fog: false });
        var u = U(), G = new THREE.Group(); G.renderOrder = 13;
        boxes.forEach(function (b) { var m = new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.05, b.w) * u, Math.max(0.05, b.y1 - b.y0) * u, Math.max(0.05, b.L) * u), _pvMat); m.position.set(b.cx * u, (b.y0 + b.y1) / 2 * u, b.cz * u); m.rotation.y = b.yaw || 0; m.renderOrder = 13; G.add(m); });
        ED.group.add(G); ED._pv = G;
    }
    function segPv(a, b, w, y0, y1) { var dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz); return { cx: (a.x + b.x) / 2, cz: (a.z + b.z) / 2, w: w, L: Math.max(0.05, L), y0: y0, y1: y1, yaw: Math.atan2(dx, dz) }; }
    function rectOf(a, b) { return { x0: Math.min(a.x, b.x), x1: Math.max(a.x, b.x), z0: Math.min(a.z, b.z), z1: Math.max(a.z, b.z) }; }
    function drawShow(p) {
        var D = ED.draw; if (!D || !p) { drawPreview(null); return; }
        var how = DRAWS[D.tool] ? DRAWS[D.tool].how : 'click', O = ED.opts, g = ground(p.x, p.z), a = D.a, out = [];
        out.push({ cx: p.x, cz: p.z, w: 0.3, L: 0.3, y0: g, y1: g + 0.6 });   // the cursor's post
        if (a && how === 'chain') out.push(segPv(a, p, O.wallT, g, g + O.wallH));
        if (a && how === 'line') out.push(segPv(a, p, 2, g, g + Math.max(0.3, O.height)));
        if (a && how === 'rect') {
            var R = rectOf(a, p), top = D.tool === 'slab' ? O.height : D.tool === 'building' ? g + O.storeys * 3.5 : g + O.wallH, bot = D.tool === 'slab' ? O.height - 0.28 : g;
            if (D.tool === 'room') { var c = [{ x: R.x0, z: R.z0 }, { x: R.x1, z: R.z0 }, { x: R.x1, z: R.z1 }, { x: R.x0, z: R.z1 }]; for (var i = 0; i < 4; i++) out.push(segPv(c[i], c[(i + 1) % 4], O.wallT, bot, top)); }
            else out.push({ cx: (R.x0 + R.x1) / 2, cz: (R.z0 + R.z1) / 2, w: R.x1 - R.x0, L: R.z1 - R.z0, y0: bot, y1: top });
        }
        drawPreview(out);
        var st = $('edStatus'); if (st && a) { var span = Math.hypot(p.x - a.x, p.z - a.z); ED._drawInfo = (how === 'rect' ? (Math.abs(p.x - a.x)).toFixed(2) + ' × ' + (Math.abs(p.z - a.z)).toFixed(2) + ' m' : span.toFixed(2) + ' m'); } else ED._drawInfo = '';
    }
    function wallRow(a, b) { var O = ED.opts, r = { k: 'wall', x0: a.x, z0: a.z, x1: b.x, z1: b.z, h: O.wallH, t: O.wallT, key: O.wallKey || null }; if (O.wallKeyIn && O.wallKeyIn !== O.wallKey) r.keyIn = O.wallKeyIn; return r; }
    /* one finished piece → rows, as ONE undo step */
    function drawRows(rows, label) {
        if (!editable()) { toast('THE LIBRARY IS READ ONLY · COPY INTO WORLD first'); return; }
        var step = [], n = ensureList('terrain.features', step), r = room(), max = +nextId(r).slice(1) - 1;
        rows.forEach(function (row, i) { row.id = 'r' + (++max); step.push({ path: rowPath('terrain.features', n + i), before: undefined, after: row }); });
        commit(step, label);
        return rows;
    }
    function drawDown(e) {
        var D = ED.draw, p = drawPt(e.clientX, e.clientY, e); if (!D || !p) return;
        var how = DRAWS[D.tool] ? DRAWS[D.tool].how : 'click';
        if (how === 'rect' || how === 'line') { D.a = p; D.b = p; return; }
    }
    function drawUp(e) {
        var D = ED.draw; if (!D) return;
        var how = DRAWS[D.tool] ? DRAWS[D.tool].how : 'click', O = ED.opts, p = drawPt(e.clientX, e.clientY, e);
        if (how === 'click') {   // a shape from the ADD list, dropped where clicked
            var c = rayGround(e.clientX, e.clientY); if (!c) return;
            var row = D.row ? Core.clone(D.row) : Core.kindRow(D.tool, c.x, c.z);
            if (D.row) { row.x = Core.snap(c.x, Math.max(0.25, ED.snap || 0)); row.z = Core.snap(c.z, Math.max(0.25, ED.snap || 0)); }
            drawSet(null); if (row) addRow(D.list || 'terrain.features', row, D.label);
            return;
        }
        if (how === 'wall') { openingAt(e, D.tool === 'window'); return; }
        if (!p) return;
        if (how === 'chain') {
            if (!D.a) { D.a = p; D.chain0 = p; drawShow(p); return; }
            if (Math.hypot(p.x - D.a.x, p.z - D.a.z) < 0.2) return;
            drawRows([wallRow(D.a, p)], 'wall');
            var closed = D.chain0 && Math.hypot(p.x - D.chain0.x, p.z - D.chain0.z) < 0.01;
            if (closed) { D.a = null; D.chain0 = null; drawPreview(null); toast('WALL RUN CLOSED', 1200); } else D.a = p;
            return;
        }
        if (!D.a) return;
        var a = D.a; D.a = null; drawPreview(null);
        if (how === 'line') {
            var L = Math.hypot(p.x - a.x, p.z - a.z); if (L < 0.5) return;
            var g0 = ground(a.x, a.z), h1 = Math.max(0.2, O.height), stairs = D.tool === 'stairs';
            if (stairs && L < 2.2 * (h1 - g0) - 0.01) toast('STAIRS THAT STEEP ARE REFUSED BY THE WALKER · make them at least ' + (2.2 * (h1 - g0)).toFixed(1) + ' m long', 5000);
            var rr = { k: 'ramp', x0: a.x, z0: a.z, x1: p.x, z1: p.z, w: 2, h0: Core.snap(g0, 0.01), h1: h1 }; if (stairs) rr.stairs = true;
            drawRows([rr], stairs ? 'stairs' : 'ramp');
            return;
        }
        var R = rectOf(a, p), w = R.x1 - R.x0, d = R.z1 - R.z0; if (w < 0.5 || d < 0.5) return;
        var cx = (R.x0 + R.x1) / 2, cz = (R.z0 + R.z1) / 2;
        if (D.tool === 'room') {
            var c4 = [{ x: R.x0, z: R.z0 }, { x: R.x1, z: R.z0 }, { x: R.x1, z: R.z1 }, { x: R.x0, z: R.z1 }];   // clockwise: the inside on each wall's right
            drawRows([0, 1, 2, 3].map(function (i) { return wallRow(c4[i], c4[(i + 1) % 4]); }), 'room walls');
        } else if (D.tool === 'slab') {
            var row = w >= d ? { k: 'bridge', x0: R.x0, z0: cz, x1: R.x1, z1: cz, w: d } : { k: 'bridge', x0: cx, z0: R.z0, x1: cx, z1: R.z1, w: w };
            Object.assign(row, { y: O.height, thick: 0.28, plain: true, rails: false }); if (O.floorKey) row.key = O.floorKey;
            drawRows([row], 'floor slab');
        } else if (D.tool === 'building') {
            /* the front faces the way the drag ended (the lot's +z): dragged down = south, up = north, … */
            var rot = Math.abs(p.z - a.z) >= Math.abs(p.x - a.x) ? (p.z >= a.z ? 0 : 180) : (p.x >= a.x ? 270 : 90), turned = rot === 90 || rot === 270;
            drawRows([{ k: 'texbuilding', x: cx, z: cz, w: turned ? d : w, d: turned ? w : d, rot: rot, storeys: Math.max(1, Math.round(O.storeys)) }], 'building');
        }
    }
    function drawKey(k) {   // → true when the draw tool took the key
        var D = ED.draw; if (!D) return false;
        if (k === 'escape' || k === 'enter') { if (D.a) { D.a = null; D.chain0 = null; drawPreview(null); } else drawSet(null); return true; }
        return false;
    }
    /* DOOR / WINDOW on the wall under the cursor: the opening row names the wall by id, `at` metres along it from its start */
    function openingAt(e, win) {
        var r = rayFrom(e.clientX, e.clientY); if (!r) return;
        var hits = r.intersectObjects(ED.proxies.filter(function (q) { return q.sel.list === 'terrain.features'; }).map(function (q) { return q.obj; }), true);
        for (var i = 0; i < hits.length; i++) {
            var o = hits[i].object; while (o && !(o.userData && o.userData.edSel)) o = o.parent;
            var h = o && findRow('terrain.features', o.userData.edSel.id); if (!h || h.row.k !== 'wall') continue;
            var w = h.row, u = U(), pt = hits[i].point, px = pt.x / u, pz = pt.z / u, L = Math.hypot(w.x1 - w.x0, w.z1 - w.z0);
            var at = Core.snap(Math.max(0, Math.min(L, ((px - w.x0) * (w.x1 - w.x0) + (pz - w.z0) * (w.z1 - w.z0)) / (L || 1))), 0.25);
            var S = W.HQ_SHAPE_RULES || {}, ow = win ? (S.winW || 1.4) : (S.doorW || 1.2);
            at = Math.max(ow / 2, Math.min(L - ow / 2, at));
            var row = win ? { k: 'opening', wall: w.id, at: at, w: ow, h: S.winH || 1.2, sill: S.winSill || 0.9, glaze: true } : { k: 'opening', wall: w.id, at: at, w: ow, h: S.doorH || 2.2, sill: 0 };
            drawRows([row], win ? 'window' : 'door gap');
            return;
        }
        toast('CLICK ON A WALL (a wall you drew — a building\'s block takes no opening)', 2500);
    }

    /* ══ INPUT (the editor's own; the room's handlers stand down while `edit` is on) ════════════════════════════════════ */
    var KEYMAP = { arrowup: 'up', arrowdown: 'down', arrowleft: 'left', arrowright: 'right', pageup: 'pgup', pagedown: 'pgdn' };
    function typing(e) { var t = e.target; return !!(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)); }
    function onKeyDown(e) {
        if (!ED.open || ED.playing) return;
        if ($('edModal') && $('edModal').style.display !== 'none') { if (e.key === 'Escape') { modalClose(); e.preventDefault(); } return; }
        if (typing(e)) return;
        if (e.target && e.target.tagName === 'BUTTON' && (e.key === ' ' || e.key === 'Enter')) e.preventDefault();   // a focused panel button never re-fires on SPACE / ENTER
        var key = (e.key || '').toLowerCase(), k = KEYMAP[key] || key;
        if (drawKey(k)) { e.preventDefault(); return; }
        ED.keys.shift = e.shiftKey; ED.keys.ctrl = e.ctrlKey || e.metaKey;
        var mod = e.ctrlKey || e.metaKey;
        if (mod && k === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
        if (mod && k === 'y') { e.preventDefault(); redo(); return; }
        if (mod && k === 's') { e.preventDefault(); saveNow().then(function (ok) { if (ok) toast('SAVED · ' + ED.project); }); return; }
        if (mod && k === 'd') { e.preventDefault(); duplicateSel(); return; }
        if (mod) return;
        if (['w', 'a', 's', 'd', 'q', 'e', 'up', 'down', 'left', 'right', 'pgup', 'pgdn'].indexOf(k) >= 0) {
            ED.keys[k] = true;
            if (!ED.rmb && KEYMAP[key] == null && ['w', 'e', 'r'].indexOf(k) >= 0) { tcMode(k === 'w' ? 'translate' : k === 'e' ? 'rotate' : 'scale'); }
            if (KEYMAP[key]) e.preventDefault();
            return;
        }
        if (k === 'r') { tcMode('scale'); return; }
        if (k === 'escape') { select(null); return; }
        if (k === 'v') { drawSet(null); return; }
        if (k === 'delete' || k === 'backspace') { e.preventDefault(); deleteSel(); return; }
        if (k === 'f') { frameSel(); return; }
        if (k === 'home') { camHome(); return; }
        if (k === 'g') { ED.grid = !ED.grid; if (ED.gridObj) ED.gridObj.visible = ED.grid; return; }
        if (k === 'p') { playHere(); return; }
        if (k === '[' || k === ']') { turnSel(k === ']' ? ED.rotSnap || 15 : -(ED.rotSnap || 15)); return; }
        if (k === '?' || k === 'h') { help(); return; }
    }
    function onKeyUp(e) {
        if (!ED.open) return;
        var key = (e.key || '').toLowerCase(), k = KEYMAP[key] || key;
        ED.keys[k] = false; ED.keys.shift = e.shiftKey; ED.keys.ctrl = e.ctrlKey || e.metaKey;
    }
    function onBlur() { ED.keys = {}; ED.rmb = false; ED.mmb = false; ED.orbit = null; lookLock(false); }
    /* THE POINTER (E1, 2026-09-29 — mondo: "clicking in the entry fields takes control of my pointer and I have to press escape"):
       the editor holds the pointer ONLY while the RIGHT button is held over the 3D view (the fly look), and gives it back on the
       release. Any other lock that lands while the editor is open (a late request from a room re-entering, the walk's lock carried
       back from PLAY HERE) is released at once, so a click on a field, a menu or the view never loses the mouse. */
    function lookLock(on) {
        var cv = ED.view && ED.view.canvas;
        try {
            if (on) { if (cv && document.pointerLockElement !== cv && cv.requestPointerLock) { var p = cv.requestPointerLock(); if (p && typeof p.catch === 'function') p.catch(function () {}); } }
            else if (document.pointerLockElement) document.exitPointerLock();
        } catch (e) {}
    }
    function onLockChange() {
        if (!ED.open || ED.playing) return;
        if (document.pointerLockElement && !ED.rmb) { try { document.exitPointerLock(); } catch (e) {} }
    }
    var _down = null;
    function onMouseDown(e) {
        if (!ED.open || ED.playing || !ED.view || e.target !== ED.view.canvas) return;
        ED.last.x = e.clientX; ED.last.y = e.clientY;
        if (e.button === 2) { ED.rmb = true; e.preventDefault(); lookLock(true); return; }
        if (e.button === 1) { ED.mmb = true; e.preventDefault(); return; }
        if (e.button === 0 && e.altKey) { var o = ED.sel.map(selRow).filter(Boolean)[0], a = o ? Core.rowAnchor(o.row) : spot(); ED.orbit = { x: a.x, z: a.z, y: ground(a.x, a.z) }; e.preventDefault(); return; }
        if (e.button === 0) { _down = { x: e.clientX, y: e.clientY, tc: !!(ED.tc && ED.tc.axis) }; if (ED.draw) { e.preventDefault(); drawDown(e); } }
    }
    function onMouseMove(e) {
        if (!ED.open || ED.playing) return;
        var locked = !!(ED.view && document.pointerLockElement === ED.view.canvas);
        var dx = locked ? (e.movementX || 0) : e.clientX - ED.last.x, dy = locked ? (e.movementY || 0) : e.clientY - ED.last.y;
        if (locked) { if (ED.rmb) { var c0 = ED.cam; c0.yaw += dx * 0.0042; c0.pitch = Math.max(-1.55, Math.min(1.55, c0.pitch - dy * 0.0042)); } return; }
        ED.last.x = e.clientX; ED.last.y = e.clientY;
        ED.mouse.x = e.clientX; ED.mouse.y = e.clientY; ED.mouse.in = !!(ED.view && e.target === ED.view.canvas);
        var c = ED.cam;
        if (ED.rmb) { c.yaw += dx * 0.0042; c.pitch = Math.max(-1.55, Math.min(1.55, c.pitch - dy * 0.0042)); return; }
        if (ED.mmb) { var sp = Math.max(0.02, Math.abs(c.y) * 0.0025 + 0.02); c.x -= (Math.cos(c.yaw) * dx) * sp; c.z -= (Math.sin(c.yaw) * dx) * sp; c.y += dy * sp; return; }
        if (ED.orbit) {
            var O = ED.orbit, vx = c.x - O.x, vz = c.z - O.z, vy = c.y - O.y, R = Math.max(1, Math.hypot(vx, vy, vz));
            var yaw = Math.atan2(vx, -vz) + dx * 0.006, el = Math.max(-1.4, Math.min(1.4, Math.asin(vy / R) + dy * 0.006));
            c.x = O.x + Math.sin(yaw) * Math.cos(el) * R; c.z = O.z - Math.cos(yaw) * Math.cos(el) * R; c.y = O.y + Math.sin(el) * R;
            c.yaw = Math.atan2(O.x - c.x, -(O.z - c.z)); c.pitch = Math.atan2(O.y - c.y, Math.hypot(O.x - c.x, O.z - c.z));
        }
        if (ED.draw && ED.mouse.in) { var D = ED.draw, how = DRAWS[D.tool] ? DRAWS[D.tool].how : 'click'; drawShow(how === 'click' || how === 'wall' ? null : drawPt(e.clientX, e.clientY, e)); }
    }
    function onMouseUp(e) {
        if (!ED.open || ED.playing) return;
        if (e.button === 2) { ED.rmb = false; lookLock(false); }
        if (e.button === 1) ED.mmb = false;
        if (e.button === 0) {
            ED.orbit = null;
            var d = _down; _down = null;
            if (ED.draw && d && !d.tc && ED.view && e.target === ED.view.canvas) { drawUp(e); return; }
            if (!d || d.tc || ED.tcDragging || !ED.view || e.target !== ED.view.canvas) return;
            if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 4) return;
            var hit = pickAt(e.clientX, e.clientY);
            if (hit) select(hit.list, hit.id, e.shiftKey); else if (!e.shiftKey) select(null);
        }
    }
    function onWheel(e) {
        if (!ED.open || ED.playing || !ED.view || e.target !== ED.view.canvas) return;
        e.preventDefault();
        var c = ED.cam;
        if (ED.rmb) { c.speed = Math.max(1, Math.min(200, c.speed * (e.deltaY < 0 ? 1.2 : 1 / 1.2))); toast('FLY SPEED ' + c.speed.toFixed(1) + ' m/s', 900); return; }
        var m = (e.deltaY < 0 ? 1 : -1) * Math.max(1, c.speed * 0.25);
        c.x += Math.sin(c.yaw) * Math.cos(c.pitch) * m; c.y += Math.sin(c.pitch) * m; c.z += -Math.cos(c.yaw) * Math.cos(c.pitch) * m;
    }
    function onContext(e) { if (ED.open && !ED.playing && ED.view && e.target === ED.view.canvas) e.preventDefault(); }
    function bind(on) {
        var f = on ? 'addEventListener' : 'removeEventListener';
        window[f]('keydown', onKeyDown, true); window[f]('keyup', onKeyUp, true); window[f]('blur', onBlur);
        window[f]('mousedown', onMouseDown, true); window[f]('mousemove', onMouseMove); window[f]('mouseup', onMouseUp, true);
        window[f]('wheel', onWheel, { passive: false }); window[f]('contextmenu', onContext, true);
        document[f]('pointerlockchange', onLockChange);
    }
    function turnSel(deg) {
        var hits = ED.sel.map(selRow).filter(Boolean); if (!hits.length || !editable()) return;
        var a = Core.rowAnchor(hits[0].row), step = [];
        hits.forEach(function (h) {
            if (h.list === 'doors' && h.row.wall && h.row.wall !== 'free') return;
            var after = Core.rowTransform(h.row, { rot: deg, px: a.x, pz: a.z });
            if (h.list === 'spawn') step.push({ path: ['rooms', ED.roomId, 'spawn'], before: Core.clone(room().spawn), after: after });
            else step.push({ path: rowPath(h.list, h.i), before: Core.clone(h.row), after: after });
        });
        commit(step, 'turn ' + deg + '°');
    }

    /* ══ PLAY HERE: the walker at the cursor, the game's own entry (every system live); ESC comes back ══════════════════ */
    function playHere() {
        if (!ED.roomId) return;
        var p = spot(), face = Math.round(((ED.cam.yaw * 180 / Math.PI) % 360 + 360) % 360);
        ED.playing = true; ED.hook.play = true;
        document.body.classList.add('ed-playing');
        saveNow();
        W._hqEnter({ room: ED.roomId, at: { x: p.x, z: p.z, y: p.y, face: face }, quiet: true, from: 'walk' });
        toast('PLAY HERE · ESC comes back to the editor', 3200);
    }
    function backFromPlay() {
        if (!ED.playing) return;
        var rid = null, pos = null;
        try { rid = ThreeRenderer.hq.room(); pos = ThreeRenderer.hq.pos(); } catch (e) {}
        ED.playing = false; ED.hook.play = false;
        document.body.classList.remove('ed-playing');
        if (ED.mode === 'prefab' && ED.pfId && ED.doc.prefabs[ED.pfId] && (!rid || rid === PF_ROOM)) {
            if (pos) { ED.cam.x = pos.x - Math.sin(ED.cam.yaw) * 6; ED.cam.z = pos.z + Math.cos(ED.cam.yaw) * 6; ED.cam.y = (pos.y || 0) + 4; ED.cam.pitch = -0.4; }
            prefabSync(); enterRoom(PF_ROOM, 'prefab', { keepCam: !!pos }); return;
        }
        var mine = !!(rid && ED.doc.rooms[rid]);
        var id = rid && DOOR_HQ.rooms[rid] ? rid : ED.roomId;
        if (pos) { ED.cam.x = pos.x - Math.sin(ED.cam.yaw) * 6; ED.cam.z = pos.z + Math.cos(ED.cam.yaw) * 6; ED.cam.y = (pos.y || 0) + 4; ED.cam.pitch = -0.4; }
        enterRoom(id, mine ? 'world' : 'library', { keepCam: !!pos });
    }

    /* ══ ROOMS ══════════════════════════════════════════════════════════════════════════════════════════════════════════ */
    function newRoom() {
        ask('NEW ROOM', [{ name: 'w', label: 'Width (m, east–west)', value: 128, type: 'number' }, { name: 'd', label: 'Depth (m, north–south)', value: 128, type: 'number' }], function (v) {
            var id = W.hqWorldDocNextRoomId(ED.doc), r = W.hqWorldDocNewRoom(id, { w: +v.w, d: +v.d });
            commit([{ path: ['rooms', id], before: undefined, after: r }], 'new room');
            enterRoom(id, 'world');
            toast(r.label.toUpperCase() + ' · a flat empty ground');
        });
    }
    function deleteRoom() {
        if (!editable()) return;
        var ids = Object.keys(ED.doc.rooms);
        if (ids.length < 2) { toast('THE WORLD KEEPS ONE ROOM AT LEAST'); return; }
        var r = room();
        if (!confirm('Delete ' + (r.label || ED.roomId) + '? (UNDO brings it back)')) return;
        var id = ED.roomId, step = [];
        /* the doors of his that led into it go with it (as one step, so UNDO restores them too) */
        ids.forEach(function (oid) {
            if (oid === id) return;
            var ds = ED.doc.rooms[oid].doors || [];
            for (var i = ds.length - 1; i >= 0; i--) if (ds[i] && ds[i].action && ds[i].action.room === id) step.push({ path: ['rooms', oid, 'doors', i], before: Core.clone(ds[i]), after: undefined });
        });
        step.push({ path: ['rooms', id], before: Core.clone(r), after: undefined });
        if (ED.doc.start && ED.doc.start.room === id) { var other = ids.filter(function (x) { return x !== id; })[0]; step.push({ path: ['start'], before: Core.clone(ED.doc.start), after: { room: other, at: { x: 0, z: 0, face: 0 } } }); }
        commit(step, 'delete room');
        enterRoom(ids.filter(function (x) { return x !== id; })[0], 'world');
    }
    function duplicateRoom() {
        if (!editable()) return;
        var id = W.hqWorldDocNextRoomId(ED.doc), r = Core.clone(Core.cleanExport(room())), n = W.hqWorldDocRoomNo(id);
        r.label = 'Room ' + n; r.doors = [];
        commit([{ path: ['rooms', id], before: undefined, after: r }], 'duplicate room');
        enterRoom(id, 'world');
        toast('DUPLICATED AS ' + r.label.toUpperCase() + ' (its doors stay with the original)');
    }
    function copyIntoWorld() {
        if (ED.mode !== 'library' || !ED.roomId) return;
        var keep = {}; Object.keys(ED.doc.rooms).forEach(function (k) { keep[k] = 1; });
        var id = W.hqWorldDocNextRoomId(ED.doc), c = W.hqWorldDocCopyRoom(ED.roomId, id, keep);
        if (!c) { toast('THAT ROOM CANNOT BE COPIED'); return; }
        commit([{ path: ['rooms', id], before: undefined, after: c.room }], 'copy ' + ED.roomId);
        enterRoom(id, 'world', { keepCam: true });
        toast('COPIED INTO YOUR WORLD AS ' + c.room.label.toUpperCase() + (c.dropped ? ' · ' + c.dropped + ' door(s) that led outside your world were left out' : ''), 5000);
    }
    function setStart() {
        if (!editable()) return;
        var r = room(), sp = r.spawn || { x: 0, z: 0, face: 0 };
        commit([{ path: ['start'], before: Core.clone(ED.doc.start), after: { room: ED.roomId, at: { x: sp.x || 0, z: sp.z || 0, face: sp.face || 0 } } }], 'set start');
        toast('THE WORLD STARTS IN ' + String(r.label || ED.roomId).toUpperCase() + ' (after THE SWAP)');
    }

    /* ══ DOORS: both ends at once (RETURN DOOR), plates are the runtime's (on the door, eye level, '?' until visited — R7) ══ */
    function addDoor() {
        if (!editable()) { toast('THE LIBRARY IS READ ONLY'); return; }
        var ids = Object.keys(ED.doc.rooms), p = spot(), leaves = Object.keys(DOOR_HQ.catalogue).filter(function (k) { return DOOR_HQ.catalogue[k].leaf; }).sort();
        ask('ADD DOOR', [
            { name: 'to', label: 'Leads to', type: 'select', value: ids.filter(function (x) { return x !== ED.roomId; })[0] || ED.roomId, options: ids.map(function (x) { return [x, (ED.doc.rooms[x].label || x) + ' (' + x + ')']; }) },
            { name: 'where', label: 'Stands', type: 'select', value: 'free', options: [['free', 'Free-standing, at the cursor'], ['n', 'On the north edge'], ['s', 'On the south edge'], ['e', 'On the east edge'], ['w', 'On the west edge']] },
            { name: 'leaf', label: 'Leaf', type: 'select', value: 'leaf_office', options: leaves.map(function (x) { return [x, x]; }) },
            { name: 'back', label: 'Return door in the far room', type: 'checkbox', value: true },
        ], function (v) {
            var to = v.to, r = room(), far = ED.doc.rooms[to]; if (!far) return;
            var myId = nextId(r), step = [];
            var face = Math.round(((ED.cam.yaw * 180 / Math.PI + 180) % 360 + 360) % 360);   // a free door faces the eye
            var mine = v.where === 'free' ? { id: myId, wall: 'free', x: Math.round(p.x * 4) / 4, z: Math.round(p.z * 4) / 4, face: face, leaf: v.leaf, action: { room: to } }
                                          : { id: myId, wall: v.where, leaf: v.leaf, action: { room: to } };
            if (v.where === 'n' || v.where === 's') mine.x = Math.round(p.x * 4) / 4; else if (v.where === 'e' || v.where === 'w') mine.z = Math.round(p.z * 4) / 4;
            var farId = null;
            if (v.back) {
                farId = to === ED.roomId ? 'r' + (+myId.slice(1) + 1) : nextId(far);
                var sp = far.spawn || { x: 0, z: 0, face: 0 }, ff = ((sp.face || 0) + 180) % 360, fr = (sp.face || 0) * Math.PI / 180;
                var back = { id: farId, wall: 'free', x: Math.round(((+sp.x || 0) + Math.sin(fr) * 4) * 4) / 4, z: Math.round(((+sp.z || 0) - Math.cos(fr) * 4) * 4) / 4, face: ff, leaf: v.leaf, action: { room: ED.roomId, at: myId } };
                mine.action.at = farId;
                var fn = (far.doors || []).length;
                if (!far.doors) step.push({ path: ['rooms', to, 'doors'], before: undefined, after: [] });
                step.push({ path: ['rooms', to, 'doors', fn + (to === ED.roomId ? 1 : 0)], before: undefined, after: back });
            }
            var n = ensureList('doors', step);
            step.splice(step.length - (v.back ? 1 : 0), 0, { path: rowPath('doors', n), before: undefined, after: mine });
            commit(step, 'add door');
            if (to !== ED.roomId) docSync([to]);
            select('doors', myId);
            toast(v.back ? 'DOOR ADDED · its return door stands 4 m in front of ' + (far.label || to) + '\'s spawn' : 'DOOR ADDED (one way)', 4000);
        });
    }
    function doorRetarget(h) {
        var ids = Object.keys(ED.doc.rooms);
        ask('DOOR LEADS TO', [
            { name: 'to', label: 'Room', type: 'select', value: (h.row.action && h.row.action.room) || ids[0], options: ids.map(function (x) { return [x, (ED.doc.rooms[x].label || x) + ' (' + x + ')']; }) },
            { name: 'at', label: 'Arrive at door (id, empty = the spawn)', type: 'text', value: (h.row.action && h.row.action.at) || '' },
        ], function (v) {
            var after = Core.clone(h.row); after.action = { room: v.to }; if (v.at) after.action.at = v.at;
            replaceRows([{ list: 'doors', i: h.i, before: Core.clone(h.row), after: after }], 'door target');
        });
    }

    /* ══ EXPORT / IMPORT: one zip at the bucket's paths, only what changed since the last export (the shas are kept) ═════ */
    function sha10(u8) {
        if (!(W.crypto && W.crypto.subtle)) return Promise.resolve(('00000000' + Core.crc32(u8).toString(16)).slice(-8) + 'cc');
        return W.crypto.subtle.digest('SHA-256', u8).then(function (b) { return Array.from(new Uint8Array(b)).map(function (x) { return ('0' + x.toString(16)).slice(-2); }).join('').slice(0, 10); });
    }
    function download(u8, name) {
        var a = document.createElement('a'), url = URL.createObjectURL(new Blob([u8], { type: 'application/zip' }));
        a.href = url; a.download = name; document.body.appendChild(a); a.click();
        setTimeout(function () { URL.revokeObjectURL(url); if (a.parentNode) a.parentNode.removeChild(a); }, 2000);
    }
    function exportZip(all) {
        var doc = ED.doc, ids = Object.keys(doc.rooms).sort(), prev = (ED.exported && ED.exported.rooms) || {}, files = [], index = { v: 1, made: new Date().toISOString(), rooms: {}, prefabs: {}, retire: doc.retire || [], zones: doc.zones || {}, links: doc.links || [], dungeons: doc.dungeons || {}, start: doc.start || null, live: !!doc.live };
        var prevPf = (ED.exported && ED.exported.prefabs) || {};
        return Promise.all(ids.map(function (id) {
            var u8 = Core.utf8(JSON.stringify(Core.cleanExport(doc.rooms[id])));
            return sha10(u8).then(function (sha) { index.rooms[id] = [u8.length, sha]; if (all || prev[id] !== sha) files.push({ name: 'Assets/World/rooms/' + id + '.json', data: u8 }); });
        }).concat(Object.keys(doc.prefabs || {}).sort().map(function (id) {
            var u8 = Core.utf8(JSON.stringify(Core.cleanExport(doc.prefabs[id])));
            return sha10(u8).then(function (sha) { index.prefabs[id] = [u8.length, sha]; if (all || prevPf[id] !== sha) files.push({ name: 'Assets/World/prefabs/' + id + '.json', data: u8 }); });
        }))).then(function () {
            var wj = Core.utf8(JSON.stringify(index, null, 1));
            return sha10(wj).then(function (wid) {
                var gone = Object.keys(prev).filter(function (id) { return !doc.rooms[id]; }).map(function (g) { return 'Assets/World/rooms/' + g + '.json'; }).concat(Object.keys(prevPf).filter(function (id) { return !doc.prefabs[id]; }).map(function (g) { return 'Assets/World/prefabs/' + g + '.json'; }));
                var note = ['ENTROPY WARS · THE WORLD FILE (the editor\'s export, ' + index.made + ')', '',
                    'Upload everything under Assets/World/ to the R2 bucket at the same paths (npm run deploy -- --world Assets/World does it).',
                    'World id: ' + wid + '  (deploy.js --world writes it into index.html as window._EW_WORLD_ID; the game reads the world only when it is named there — until THE SWAP nothing in the player\'s game leads into it).',
                    all ? 'This zip holds EVERY room and prefab.' : 'This zip holds only the rooms and prefabs that changed since the last export (' + (files.length) + ' file(s)); world.json always.',
                    gone.length ? 'DELETE from the bucket (no longer in the world): ' + gone.join(', ') : 'Nothing to delete.', ''].join('\n');
                files.unshift({ name: 'Assets/World/world.json', data: wj });
                files.push({ name: 'Assets/World/README_EXPORT.txt', data: Core.utf8(note) });
                var zip = Core.zipStore(files);
                download(zip, 'ENTROPY_WARS_WORLD.zip');
                var shas = function (o) { return Object.keys(o || {}).reduce(function (a, k) { a[k] = o[k][1]; return a; }, {}); };
                ED.exported = { rooms: shas(index.rooms), prefabs: shas(index.prefabs), world: wid, at: Date.now() };
                saveNow();
                toast('EXPORTED · ' + (files.length - 2) + ' room / prefab file(s) + world.json · world id ' + wid + (gone.length ? ' · see README for files to delete' : ''), 6000);
                return { files: files.map(function (f) { return f.name; }), id: wid };
            });
        });
    }
    function inflate(e) {
        if (e.method === 0) return Promise.resolve(e.data);
        if (e.method === 8 && typeof DecompressionStream !== 'undefined') return new Response(new Blob([e.data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer().then(function (b) { return new Uint8Array(b); });
        return Promise.reject(new Error('zip method ' + e.method + ' not supported'));
    }
    function importZip() {
        var inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.zip,application/zip';
        inp.onchange = function () {
            var f = inp.files && inp.files[0]; if (!f) return;
            f.arrayBuffer().then(function (buf) {
                var ents = Core.unzip(new Uint8Array(buf));
                var wj = ents.filter(function (e) { return /(^|\/)world\.json$/.test(e.name); })[0];
                if (!wj) throw new Error('no world.json in the zip');
                return Promise.all(ents.map(function (e) { return inflate(e).then(function (d) { e.text = Core.utf8dec(d); }); })).then(function () {
                    var index = JSON.parse(wj.text), rooms = {}, missing = [];
                    var pfs = {};
                    ents.forEach(function (e) { var m = /rooms\/(.+)\.json$/.exec(e.name); if (m) rooms[m[1]] = JSON.parse(e.text); var mp = /prefabs\/(.+)\.json$/.exec(e.name); if (mp) pfs[mp[1]] = JSON.parse(e.text); });
                    var doc = Core.clone(ED.doc || W.hqWorldDocNew());
                    Object.keys(index.rooms || {}).forEach(function (id) { if (rooms[id]) doc.rooms[id] = rooms[id]; else if (!doc.rooms[id]) missing.push(id); });
                    Object.keys(doc.rooms).forEach(function (id) { if (index.rooms && !index.rooms[id]) delete doc.rooms[id]; });
                    doc.prefabs = doc.prefabs || {};
                    Object.keys(index.prefabs || {}).forEach(function (id) { if (pfs[id]) doc.prefabs[id] = pfs[id]; else if (!doc.prefabs[id]) missing.push(id); });
                    Object.keys(doc.prefabs).forEach(function (id) { if (index.prefabs && !index.prefabs[id]) delete doc.prefabs[id]; });
                    ['retire', 'zones', 'links', 'dungeons', 'start', 'live'].forEach(function (k) { if (index[k] !== undefined) doc[k] = index[k]; });
                    docLoad(doc, ED.project || 'World 1');
                    saveNow();
                    enterRoom((doc.start && doc.rooms[doc.start.room]) ? doc.start.room : Object.keys(doc.rooms)[0], 'world');
                    toast('IMPORTED · ' + Object.keys(rooms).length + ' room file(s)' + (missing.length ? ' · MISSING (not in this zip, not in this project): ' + missing.join(', ') : ''), 6000);
                });
            }).catch(function (e) { toast('IMPORT FAILED · ' + (e && e.message || e), 6000); });
        };
        inp.click();
    }
    function importR2() {
        if (!confirm('Replace this project with the world published on R2? (UNDO cannot bring the project back — EXPORT it first if you want a copy)')) return;
        toast('FETCHING THE PUBLISHED WORLD…', 8000);
        W.hqWorldDocFetch(null, true).then(function (doc) {
            docLoad(doc, ED.project || 'World 1'); saveNow();
            enterRoom((doc.start && doc.rooms[doc.start.room]) ? doc.start.room : Object.keys(doc.rooms)[0], 'world');
            toast('IMPORTED FROM R2 · ' + Object.keys(doc.rooms).length + ' room(s)', 4000);
        }).catch(function (e) { toast('NOTHING PUBLISHED YET (or the bucket is out of reach) · ' + (e && e.message || e), 6000); });
    }
    function newWorld() {
        projectList().then(function (list) {
            var n = 1, names = {}; list.forEach(function (p) { names[p.name] = 1; }); while (names['World ' + n]) n++;
            var name = 'World ' + n;
            if (!confirm('Start ' + name + ': a flat empty world? (' + (ED.project || 'this world') + ' stays saved; FILE → OPEN brings it back)')) return;
            saveNow().then(function () { docLoad(W.hqWorldDocNew(), name); ED.exported = null; saveNow(); enterRoom(ED.doc.start.room, 'world'); toast(name.toUpperCase() + ' · FLAT AND EMPTY'); });
        });
    }
    function openProject() {
        projectList().then(function (list) {
            pick('OPEN A WORLD', list.map(function (p) { return { label: p.name, sub: Object.keys((p.doc && p.doc.rooms) || {}).length + ' room(s) · saved ' + new Date(p.savedAt || 0).toLocaleString(), value: p.name }; }), function (name) {
                projectLoad(name).then(function (rec) { if (!rec) return; saveNow().then(function () { docLoad(rec.doc, rec.name); ED.exported = rec.exported || null; if (rec.cam) Object.assign(ED.cam, rec.cam); enterRoom(rec.roomId && rec.doc.rooms[rec.roomId] ? rec.roomId : rec.doc.start.room, 'world', { keepCam: !!rec.cam }); }); });
            });
        });
    }
    function saveAs() {
        ask('SAVE AS', [{ name: 'name', label: 'Name', value: '', type: 'text' }], function (v) {
            var name = String(v.name || '').trim(); if (!name) return;
            ED.project = name; saveNow().then(function (ok) { if (ok) toast('SAVED AS ' + name); panels(); });
        });
    }

    /* ══ THE LIBRARY: data.js rooms to look at and copy (the ruling: never the starting point) ══════════════════════════ */
    function library() {
        var R = DOOR_HQ.rooms, items = Object.keys(R).filter(function (k) { var r = R[k]; return r && k !== PF_ROOM && !W.hqWorldDocIsOwn(k) && !r.land; }).map(function (k) {
            var r = R[k], S = r.shell || {};
            return { label: String(r.label || k), sub: k + ' · ' + roomSize(r) + (r.terrain ? ' · terrain' : '') + (r.terrain && r.terrain.gen ? ' (generated)' : '') + ' · ' + (r.props || []).length + ' props', value: k };
        }).sort(function (a, b) { return a.label < b.label ? -1 : 1; });
        pick('THE LIBRARY · a built-in room to look at (COPY INTO WORLD makes it yours)', items, function (k) { enterRoom(k, 'library'); toast('LIBRARY · READ ONLY · COPY INTO WORLD (top bar) makes it a room of yours', 4000); });
    }

    /* ══ THE ADD LIST (E0; E1 / E2 make these the real tools) ═══════════════════════════════════════════════════════════ */
    function addShape(id) { var p = spot(), row = Core.kindRow(id, p.x, p.z); if (row) addRow('terrain.features', row); }
    function addProp() {
        var C = DOOR_HQ.catalogue, items = Object.keys(C).filter(function (k) { return !C[k].leaf; }).sort().map(function (k) {
            var c = C[k]; return { label: k, sub: (c.proc ? 'built · ' + c.proc : (c.file || '').replace(/^Meshy_AI_/, '').slice(0, 60)) + (c.light ? ' · LIGHT' : '') + (c.h ? ' · ' + c.h + ' m' : ''), value: k };
        });
        pick('ADD A PROP (the catalogue: every model the rooms use)', items, function (k) {
            var p = spot(); addRow('props', { key: k, x: Math.round(p.x * 4) / 4, z: Math.round(p.z * 4) / 4, face: Math.round(((ED.cam.yaw * 180 / Math.PI + 180) % 360 + 360) % 360) }, 'add ' + k);
        });
    }


    /* ══ PREFABS + KITS (E1, EDITOR_PLAN §5.2): a prefab = his own group of shapes + props, placed as ONE row ({ k:'prefab', pf, x, z,
       yaw, mirror }); editing the prefab changes every placement. A kit = one of the game's builders (HQ_KIT_FORMS) with its form ══ */
    function prefabUses(id) { var n = 0; Object.keys(ED.doc.rooms).forEach(function (rid) { (listOf(ED.doc.rooms[rid], 'terrain.features') || []).forEach(function (f) { if (f && f.k === 'prefab' && f.pf === id) n++; }); }); Object.keys(ED.doc.prefabs).forEach(function (pid) { (ED.doc.prefabs[pid].terrain.features || []).forEach(function (f) { if (f && f.k === 'prefab' && f.pf === id) n++; }); }); return n; }
    function enterPrefab(id) {
        if (!ED.doc.prefabs[id]) return;
        saveCam();
        if (ED.mode !== 'prefab') ED.pfBack = ED.mode === 'world' ? ED.roomId : null;
        ED.mode = 'prefab'; ED.pfId = id; prefabSync();
        ED.cam.x = 0; ED.cam.y = 9; ED.cam.z = 14; ED.cam.yaw = 0; ED.cam.pitch = -0.55;
        enterRoom(PF_ROOM, 'prefab', { keepCam: true });
        toast('EDITING ' + String(ED.doc.prefabs[id].label || id).toUpperCase() + ' · every placement follows · DONE (top) goes back', 4000);
    }
    function leavePrefab() {
        var back = ED.pfBack && ED.doc.rooms[ED.pfBack] ? ED.pfBack : ((ED.doc.start && ED.doc.rooms[ED.doc.start.room]) ? ED.doc.start.room : Object.keys(ED.doc.rooms)[0]);
        ED.pfId = null; ED.mode = 'world';
        var r = ED.doc.rooms[back], c = r && r.edit && r.edit.cam; if (c) Object.assign(ED.cam, c);
        enterRoom(back, 'world', { keepCam: !!c });
    }
    function newPrefab() {
        var id = Core.nextPfId(ED.doc), pf = { id: id, label: 'Prefab ' + id.slice(4), terrain: { features: [], marks: [] }, props: [] };
        commit([{ path: ['prefabs', id], before: undefined, after: pf }], 'new prefab');
        enterPrefab(id);
    }
    /* the picked shapes + props become one prefab, and one placement stands where they stood (one undo step) */
    function selToPrefab() {
        if (!editable()) return;
        if (ED.mode === 'prefab') { toast('SAVE AS PREFAB works in a room (this is a prefab already)'); return; }
        var hits = ED.sel.map(selRow).filter(function (h) { return h && (h.list === 'terrain.features' || h.list === 'props'); });
        if (!hits.length) { toast('PICK SHAPES / PROPS FIRST (SHIFT + click adds)'); return; }
        var walls = {}; hits.forEach(function (h) { if (h.row.k === 'wall') walls[h.row.id] = 1; });
        (listOf(room(), 'terrain.features') || []).forEach(function (f, i) { if (f && f.k === 'opening' && walls[f.wall] && !hits.some(function (h) { return h.row === f; })) hits.push({ row: f, i: i, list: 'terrain.features' }); });   // a wall's openings go with it
        var sx = 0, sz = 0; hits.forEach(function (h) { var a = Core.rowAnchor(h.row); sx += a.x || 0; sz += a.z || 0; });
        var cx = Core.snap(sx / hits.length, 0.25), cz = Core.snap(sz / hits.length, 0.25);
        var id = Core.nextPfId(ED.doc), label = 'Prefab ' + id.slice(4);
        var pf = W.hqPrefabFromRows(id, label, hits.filter(function (h) { return h.list === 'terrain.features'; }).map(function (h) { return h.row; }), hits.filter(function (h) { return h.list === 'props'; }).map(function (h) { return h.row; }), cx, cz);
        var step = [{ path: ['prefabs', id], before: undefined, after: pf }];
        hits.slice().sort(function (a, b) { return a.list === b.list ? b.i - a.i : (a.list < b.list ? -1 : 1); }).forEach(function (h) { step.push({ path: rowPath(h.list, h.i), before: Core.clone(h.row), after: undefined }); });
        var L = listOf(room(), 'terrain.features') || [], n = L.length - hits.filter(function (h) { return h.list === 'terrain.features'; }).length, pid = nextId(room());
        step.push({ path: rowPath('terrain.features', n), before: undefined, after: { id: pid, k: 'prefab', pf: id, x: cx, z: cz, yaw: 0 } });
        ED.sel = [];
        commit(step, 'save as ' + label);
        select('terrain.features', pid);
        toast(label.toUpperCase() + ' · ' + hits.length + ' row(s) · the placement stands where they stood (EDIT PREFAB changes every copy)', 5000);
    }
    function roomToPrefab() {
        var r = room(); if (!r || ED.mode === 'prefab') return;
        var feats = (listOf(r, 'terrain.features') || []).filter(Boolean), props = (r.props || []).filter(Boolean);
        if (!feats.length && !props.length) { toast('THIS ROOM HAS NO SHAPES OR PROPS'); return; }
        var id = Core.nextPfId(ED.doc), pf = W.hqPrefabFromRows(id, 'Prefab ' + id.slice(4), feats, props, 0, 0);
        commit([{ path: ['prefabs', id], before: undefined, after: pf }], 'room as prefab');
        toast(pf.label.toUpperCase() + ' · ' + feats.length + ' shape(s), ' + props.length + ' prop(s) (its doors stay with the room) · ADD → PREFAB places it', 5000);
    }
    function deletePrefab(id) {
        var n = prefabUses(id); if (n) { toast('PLACED ' + n + ' TIME(S) · bake or delete the placements first'); return; }
        if (ED.mode === 'prefab' && ED.pfId === id) leavePrefab();
        commit([{ path: ['prefabs', id], before: Core.clone(ED.doc.prefabs[id]), after: undefined }], 'delete prefab');
    }
    function placeRow(row, label, list) { if (!editable()) { toast('THE LIBRARY IS READ ONLY · COPY INTO WORLD first'); return; } drawSet('place'); ED.draw.row = row; ED.draw.label = label; ED.draw.list = list || 'terrain.features'; toast('CLICK ON THE GROUND to place ' + label + ' · ESC cancels', 4000); }
    function addPrefab() {
        var ids = Object.keys(ED.doc.prefabs).filter(function (id) { return !(ED.mode === 'prefab' && id === ED.pfId); });
        if (!ids.length) { toast('NO PREFABS YET · pick rows then EDIT → SAVE SELECTION AS PREFAB, or PREFABS → + NEW'); return; }
        pick('PLACE A PREFAB', ids.map(function (id) { var p = ED.doc.prefabs[id]; return { label: p.label || id, sub: id + ' · ' + p.terrain.features.length + ' shape(s) · ' + p.props.length + ' prop(s)', value: id }; }), function (id) { placeRow({ k: 'prefab', pf: id, yaw: 0 }, ED.doc.prefabs[id].label || id); });
    }
    function addKit() {
        var F = W.HQ_KIT_FORMS || {};
        pick('ADD A KIT (the game\'s own builders; the inspector edits its args)', Object.keys(F).map(function (fn) { return { label: F[fn].label, sub: fn + (F[fn].marks ? ' · paint' : ''), value: fn }; }), function (fn) { placeRow({ k: 'kit', fn: fn, args: Core.clone(F[fn].args), yaw: 0 }, F[fn].label); });
    }
    /* BAKE: a placement becomes its rows (one level: a prefab inside stays a prefab), fresh ids, openings keep their wall */
    function bakeSel() {
        var h = ED.sel.map(selRow).filter(Boolean)[0]; if (!h || !editable() || (h.row.k !== 'prefab' && h.row.k !== 'kit')) return;
        var row = h.row, P = { x: +row.x || 0, z: +row.z || 0, y: +row.y || 0, yaw: +row.yaw || 0, mirror: row.mirror || null }, feats = [], marks = [], props = [];
        if (row.k === 'prefab') { var pf = ED.doc.prefabs[row.pf] || (W.HQ_PREFABS || {})[row.pf]; if (!pf) { toast('THAT PREFAB IS MISSING'); return; } feats = (pf.terrain.features || []).map(function (f) { return W.hqRowPlace(f, P); }); marks = (pf.terrain.marks || []).map(function (f) { return W.hqRowPlace(f, P); }); props = (pf.props || []).map(function (f) { return W.hqRowPlace(f, P); }); }
        else { var F = (W.HQ_KIT_FORMS || {})[row.fn]; if (!F) { toast('NOT A KIT THE GAME HAS'); return; } var out = W.hqKitRows(row.fn, row.args || {}) || []; out = out.map(function (f) { return W.hqRowPlace(f, P); }); if (F.marks) marks = out; else feats = out; }
        var step = [{ path: rowPath('terrain.features', h.i), before: Core.clone(row), after: undefined }], r = room(), max = +nextId(r).slice(1) - 1, map = {};
        feats.forEach(function (f) { var nid = 'r' + (++max); if (f.id) map[f.id] = nid; f.id = nid; delete f.from; });
        feats.forEach(function (f) { if (f.k === 'opening' && map[f.wall]) f.wall = map[f.wall]; });
        var nf = (listOf(r, 'terrain.features') || []).length - 1;
        feats.forEach(function (f, i) { step.push({ path: rowPath('terrain.features', nf + i), before: undefined, after: f }); });
        if (marks.length) { var nm = ensureList('terrain.marks', step); marks.forEach(function (m, i) { m.id = 'r' + (++max); step.push({ path: rowPath('terrain.marks', nm + i), before: undefined, after: m }); }); }
        if (props.length) { var np = ensureList('props', step); props.forEach(function (p, i) { p.id = 'r' + (++max); delete p.from; step.push({ path: rowPath('props', np + i), before: undefined, after: p }); }); }
        ED.sel = [];
        commit(step, 'bake');
        toast('BAKED · ' + feats.length + ' shape(s), ' + marks.length + ' mark(s), ' + props.length + ' prop(s) · plain rows now', 3500);
    }

    /* ══ ARRAY + MIRROR (E1): copies of the pick in a row / round a centre; a mirror flips the pick about its anchor ═════════ */
    function selAnchor(hits) { var sx = 0, sz = 0; hits.forEach(function (h) { var a = Core.rowAnchor(h.row); sx += a.x || 0; sz += a.z || 0; }); return { x: sx / hits.length, z: sz / hits.length }; }
    function pickRows() {
        var hits = ED.sel.map(selRow).filter(function (h) { return h && (h.list === 'terrain.features' || h.list === 'props'); });
        if (!hits.length || !editable()) { toast('PICK SHAPES / PROPS FIRST'); return null; }
        return hits;
    }
    function placeAbout(row, a, P) { return W.hqRowPlace(W.hqRowPlace(row, { x: -a.x, z: -a.z }), Object.assign({ x: a.x, z: a.z }, P)); }
    function mirrorSel(ax) {
        var hits = pickRows(); if (!hits) return;
        var a = selAnchor(hits);
        replaceRows(hits.map(function (h) { var after = placeAbout(h.row, a, { mirror: ax }); after.id = h.row.id; return { list: h.list, i: h.i, before: Core.clone(h.row), after: after }; }), 'mirror ' + ax.toUpperCase());
    }
    function arraySel() {
        var hits = pickRows(); if (!hits) return;
        ask('ARRAY · copies of the pick (one undo step)', [
            { name: 'n', label: 'Copies (not counting the pick)', value: 3, type: 'number' },
            { name: 'dx', label: 'Each copy moves east (m)', value: 4, type: 'number' },
            { name: 'dz', label: 'Each copy moves south (m)', value: 0, type: 'number' },
            { name: 'dyaw', label: 'Each copy turns (°, about the pick)', value: 0, type: 'number' },
        ], function (v) {
            var n = Math.max(1, Math.min(200, Math.round(+v.n || 0))), dx = +v.dx || 0, dz = +v.dz || 0, dyaw = +v.dyaw || 0, a = selAnchor(hits);
            var r = room(), max = +nextId(r).slice(1) - 1, step = [], ends = {}, sel = [];
            for (var c = 1; c <= n; c++) {
                var map = {}, rows = hits.map(function (h) { var after = placeAbout(h.row, a, { yaw: dyaw * c }); after = W.hqRowPlace(after, { x: dx * c, z: dz * c }); var nid = 'r' + (++max); map[h.row.id] = nid; after.id = nid; return { list: h.list, row: after }; });
                rows.forEach(function (x) {
                    if (x.row.k === 'opening') { if (!map[x.row.wall]) return; x.row.wall = map[x.row.wall]; }   // an opening goes with its wall only
                    if (ends[x.list] == null) ends[x.list] = (listOf(r, x.list) || []).length;
                    step.push({ path: rowPath(x.list, ends[x.list]++), before: undefined, after: x.row }); sel.push({ list: x.list, id: x.row.id });
                });
            }
            commit(step, 'array ' + n);
            ED.sel = sel; gizmoAttach(); panels();
        });
    }

    /* ══ THE TEXTURE PICKER (E1): every sheet the game has, as swatches (the terrain sheets, the urban pack by family, the HQ's own) ══ */
    function texSources() {
        var out = [];
        try { Object.keys(TERRAIN_SPRITES).forEach(function (k) { var v = TERRAIN_SPRITES[k]; out.push({ key: k, url: Array.isArray(v) ? v[0] : v, fam: 'TERRAIN' }); }); } catch (e) {}
        try { Object.keys(URBAN_TEX_FAMILIES).forEach(function (fam) { URBAN_TEX_FAMILIES[fam].forEach(function (n) { out.push({ key: 'urban:' + n, url: URBAN_TEXTURES[n], fam: fam }); }); }); } catch (e) {}
        try { var base = (DOOR_HQ.assets && DOOR_HQ.assets.textures) || ''; Object.keys(DOOR_HQ.textures || {}).forEach(function (k) { out.push({ key: k, url: base + DOOR_HQ.textures[k], fam: 'HQ' }); }); } catch (e) {}
        return out;
    }
    function texUrl(key) { var s = texSources(); for (var i = 0; i < s.length; i++) if (s[i].key === key) return s[i].url; return null; }
    function texPick(cur, onPick) {
        var all = texSources();
        modalOpen('<div class="ed-hd">PICK A TEXTURE' + (cur ? ' · now ' + esc(cur) : '') + '</div><input type="text" class="ed-search" id="edSearch" placeholder="search (concrete, brick, grass, urban:…)"><div class="ed-swatches" id="edList"></div><div class="ed-acts"><button class="ed-btn" id="edTexNone">NONE (the default)</button><button class="ed-btn" id="edCancel">CANCEL</button></div>');
        var draw = function () {
            var q = ($('edSearch').value || '').toLowerCase(), h = '', fam = null, n = 0;
            all.forEach(function (t, i) {
                if (q && (t.key + ' ' + t.fam).toLowerCase().indexOf(q) < 0) return; if (n++ > 400) return;
                if (t.fam !== fam) { fam = t.fam; h += '<div class="ed-sub ed-swfam">' + esc(fam) + '</div>'; }
                h += '<button class="ed-sw' + (t.key === cur ? ' on' : '') + '" data-i="' + i + '" title="' + esc(t.key) + '"><img loading="lazy" src="' + esc(t.url || '') + '" alt=""><span>' + esc(t.key.replace(/^urban:/, '')) + '</span></button>';
            });
            $('edList').innerHTML = h || '<div class="ed-note">Nothing matches.</div>';
            $('edList').querySelectorAll('[data-i]').forEach(function (b) { b.onclick = function () { modalClose(); onPick(all[+b.getAttribute('data-i')].key); }; });
        };
        $('edSearch').oninput = draw; $('edCancel').onclick = modalClose; $('edTexNone').onclick = function () { modalClose(); onPick(''); }; draw(); setTimeout(function () { $('edSearch').focus(); }, 0);
    }

    /* ══ THE BUILD PALETTE (the left panel's top): SELECT + the draw tools, the tool's options under them ══════════════════ */
    var OPT_FIELDS = {
        wall: [['wallH', 'Height (m)'], ['wallT', 'Thickness (m)'], ['wallKey', 'Outside sheet', 1], ['wallKeyIn', 'Inside sheet', 1]],
        room: [['wallH', 'Height (m)'], ['wallT', 'Thickness (m)'], ['wallKey', 'Outside sheet', 1], ['wallKeyIn', 'Inside sheet', 1]],
        slab: [['height', 'Floor height (m, absolute)'], ['floorKey', 'Floor sheet', 1]],
        stairs: [['height', 'Top height (m, absolute)']],
        ramp: [['height', 'Top height (m, absolute)']],
        building: [['storeys', 'Storeys']],
    };
    function paletteHtml() {
        if (!editable()) return '';
        var D = ED.draw, h = '<div class="ed-sec ed-pal"><div class="ed-hd">BUILD</div><div class="ed-palb">';
        h += '<button class="ed-btn' + (!D ? ' on' : '') + '" data-draw="" title="Pick and move (V)">SELECT</button>';
        Object.keys(DRAWS).forEach(function (k) { h += '<button class="ed-btn' + (D && D.tool === k ? ' on' : '') + '" data-draw="' + k + '" title="' + esc(DRAWS[k].tip) + '">' + DRAWS[k].label + '</button>'; });
        h += '</div>';
        if (D && DRAWS[D.tool]) {
            h += '<div class="ed-note">' + esc(DRAWS[D.tool].tip) + '</div>';
            var F = OPT_FIELDS[D.tool] || [];
            if (F.length) h += '<div class="ed-form" data-scope="opts">' + F.map(function (f) {
                var v = ED.opts[f[0]];
                if (f[2]) return '<label class="ed-f"><span>' + esc(f[1]) + '</span><input type="text" data-o="' + f[0] + '" value="' + esc(v || '') + '" list="edDlTex"><button class="ed-btn ed-texb" data-otex="' + f[0] + '" title="Pick a texture"' + texSwatchStyle(v) + '>…</button></label>';
                return '<label class="ed-f"><span>' + esc(f[1]) + '</span><input type="number" step="any" data-o="' + f[0] + '" value="' + esc(v) + '"></label>';
            }).join('') + '</div>';
        }
        return h + '</div>';
    }
    function texSwatchStyle(key) { var u = key && texUrl(key); return u ? ' style="background-image:url(\'' + esc(u) + '\')"' : ''; }
    function paletteWire(L) {
        L.querySelectorAll('[data-draw]').forEach(function (b) { b.onclick = function () { var t = b.getAttribute('data-draw'); drawSet(t || null); }; });
        L.querySelectorAll('[data-o]').forEach(function (el) { el.onchange = function () { var k = el.getAttribute('data-o'); ED.opts[k] = el.type === 'number' ? (isFinite(parseFloat(el.value)) ? parseFloat(el.value) : ED.opts[k]) : el.value.trim(); saveOpts(); }; });
        L.querySelectorAll('[data-otex]').forEach(function (b) { b.onclick = function () { var k = b.getAttribute('data-otex'); texPick(ED.opts[k], function (v) { ED.opts[k] = v; saveOpts(); panels(); }); }; });
    }
    function saveOpts() { try { localStorage.setItem('ew_editor_opts', JSON.stringify(ED.opts)); } catch (e) {} }
    function loadOpts() { try { var o = JSON.parse(localStorage.getItem('ew_editor_opts') || 'null'); if (o && typeof o === 'object') Object.keys(ED.opts).forEach(function (k) { if (o[k] != null && typeof o[k] === typeof ED.opts[k]) ED.opts[k] = o[k]; }); } catch (e) {} }
    function prefabsHtml() {
        if (!ED.doc) return '';
        var ids = Object.keys(ED.doc.prefabs), h = '<div class="ed-sec"><div class="ed-hd">PREFABS · ' + ids.length + '</div>';
        ids.forEach(function (id) { var p = ED.doc.prefabs[id], u = prefabUses(id); h += '<div class="ed-rowx"><button class="ed-row' + (ED.mode === 'prefab' && ED.pfId === id ? ' on' : '') + '" data-pf="' + esc(id) + '" title="Edit it (every placement follows)">' + esc(p.label || id) + '<span>' + esc(id) + ' · placed ' + u + '×</span></button>' + (u ? '' : '<button class="ed-btn ed-x" data-pfdel="' + esc(id) + '" title="Delete this unused prefab">✕</button>') + '</div>'; });
        return h + '<button class="ed-row ed-add" data-act="newpf">+ NEW PREFAB</button></div>';
    }
    function prefabsWire(L) {
        L.querySelectorAll('[data-pf]').forEach(function (b) { b.onclick = function () { enterPrefab(b.getAttribute('data-pf')); }; });
        L.querySelectorAll('[data-pfdel]').forEach(function (b) { b.onclick = function () { deletePrefab(b.getAttribute('data-pfdel')); }; });
        L.querySelectorAll('[data-act="newpf"]').forEach(function (b) { b.onclick = newPrefab; });
    }

    /* ══ THE DOM ════════════════════════════════════════════════════════════════════════════════════════════════════════ */
    var MENUS = {
        FILE: [['New world (flat, empty)', newWorld], ['Open…', openProject], ['Save', function () { saveNow().then(function (ok) { if (ok) toast('SAVED · ' + ED.project); }); }], ['Save as…', saveAs], null,
               ['Export zip (what changed)', function () { exportZip(false); }], ['Export zip (everything)', function () { exportZip(true); }], ['Import zip…', importZip], ['Import from R2 (the published world)', importR2], null,
               ['Old voxel map editor', function () { close(); setTimeout(function () { W._goToVoxelEditor(); }, 50); }], ['Close the editor', function () { close(); }]],
        EDIT: [['Undo  (Ctrl Z)', undo], ['Redo  (Ctrl Y)', redo], null, ['Duplicate  (Ctrl D)', duplicateSel], ['Delete  (Del)', deleteSel], ['Turn −' + '15°  ([)', function () { turnSel(-(ED.rotSnap || 15)); }], ['Turn +15°  (])', function () { turnSel(ED.rotSnap || 15); }], null,
               ['Array… (copies in a row / round)', arraySel], ['Mirror east–west', function () { mirrorSel('x'); }], ['Mirror north–south', function () { mirrorSel('z'); }], null,
               ['Save selection as prefab', selToPrefab], ['Bake the prefab / kit into rows', bakeSel], null, ['Deselect  (Esc)', function () { select(null); }]],
        ADD: function () { return [['Prefab…', addPrefab], ['Kit (the game\'s builders)…', addKit], ['Prop (the catalogue)…', addProp], ['Door…', addDoor], null].concat(Core.KINDS.map(function (K) { return [K.label, function () { addShape(K.id); }]; })); },   // the draw tools live on the BUILD palette
        ROOM: [['New room (flat, empty)…', newRoom], ['Duplicate this room', duplicateRoom], ['Delete this room', deleteRoom], ['The world starts here', setStart], ['This room as a prefab', roomToPrefab], null, ['New prefab (empty)', newPrefab], null, ['The library (built-in rooms)…', library], ['Copy this library room into the world', copyIntoWorld]],
        VIEW: [['Grid  (G)', function () { ED.grid = !ED.grid; if (ED.gridObj) ED.gridObj.visible = ED.grid; }], ['Frame the selection  (F)', frameSel], ['To the spawn  (Home)', camHome], ['Reload the room', function () { enterRoom(ED.roomId, ED.mode, { keepCam: true }); }]],
    };
    function build() {
        if ($('edRoot')) return;
        var root = document.createElement('div'); root.id = 'edRoot'; root.className = 'ed-root';
        root.innerHTML =
            '<div class="ed-top" id="edTop"><b class="ed-brand">EDITOR</b><span class="ed-menus" id="edMenus"></span>' +
            '<span class="ed-tools" id="edTools"></span><span class="ed-sp"></span>' +
            '<button class="ed-btn ed-play" id="edPlay" title="PLAY HERE (P): the walker at the cursor, the real game; ESC comes back">▶ PLAY HERE</button>' +
            '<button class="ed-btn" id="edHelp" title="Keys (H)">?</button><button class="ed-btn" id="edClose" title="Close the editor">✕</button></div>' +
            '<div class="ed-banner" id="edBanner" style="display:none"></div>' +
            '<div class="ed-left" id="edLeft"></div><div class="ed-right" id="edRight"></div>' +
            '<div class="ed-status" id="edStatus"></div><div class="ed-menu" id="edMenu" style="display:none"></div>' +
            '<div class="ed-modal" id="edModal" style="display:none"><div class="ed-card" id="edCard"></div></div>' +
            '<div class="ed-toast" id="edToast" style="display:none"></div><div class="ed-playtag" id="edPlayTag">PLAY HERE · ESC back to the editor</div>';
        document.body.appendChild(root);
        var menus = $('edMenus');
        Object.keys(MENUS).forEach(function (name) {
            var b = document.createElement('button'); b.className = 'ed-btn ed-menubtn'; b.textContent = name; b.onclick = function (e) { e.stopPropagation(); menuOpen(name, b); }; menus.appendChild(b);
        });
        $('edPlay').onclick = playHere; $('edHelp').onclick = help; $('edClose').onclick = function () { close(); };
        document.addEventListener('mousedown', function (e) { var m = $('edMenu'); if (m && m.style.display !== 'none' && !m.contains(e.target)) m.style.display = 'none'; }, true);
    }
    function menuOpen(name, btn) {
        var m = $('edMenu'), items = typeof MENUS[name] === 'function' ? MENUS[name]() : MENUS[name];
        m.innerHTML = '';
        items.forEach(function (it) {
            if (!it) { var hr = document.createElement('div'); hr.className = 'ed-hr'; m.appendChild(hr); return; }
            var b = document.createElement('button'); b.className = 'ed-mi'; b.textContent = it[0];
            b.onclick = function () { m.style.display = 'none'; try { it[1](); } catch (e) { console.error('[editor]', e); toast('FAILED · ' + e.message, 4000); } };
            m.appendChild(b);
        });
        var r = btn.getBoundingClientRect(); m.style.left = r.left + 'px'; m.style.top = (r.bottom + 2) + 'px'; m.style.display = '';
    }
    function toolsBar() {
        var t = $('edTools'); if (!t) return;
        var snaps = [0, 0.25, 0.5, 1, 1.75], rs = [0, 5, 15, 45, 90];
        t.innerHTML = ['translate', 'rotate', 'scale'].map(function (m) { return '<button class="ed-btn' + (ED.tool === m ? ' on' : '') + '" data-tool="' + m + '" title="' + { translate: 'MOVE (W)', rotate: 'TURN (E)', scale: 'SIZE (R)' }[m] + '">' + { translate: 'MOVE', rotate: 'TURN', scale: 'SIZE' }[m] + '</button>'; }).join('') +
            '<label class="ed-lab">SNAP <select id="edSnap">' + snaps.map(function (s) { return '<option value="' + s + '"' + (s === ED.snap ? ' selected' : '') + '>' + (s ? s + ' m' : 'off') + '</option>'; }).join('') + '</select></label>' +
            '<label class="ed-lab"><select id="edRSnap">' + rs.map(function (s) { return '<option value="' + s + '"' + (s === ED.rotSnap ? ' selected' : '') + '>' + (s ? s + '°' : 'free') + '</option>'; }).join('') + '</select></label>' +
            (ED.mode === 'library' ? '<button class="ed-btn ed-copy" id="edCopy" title="Make this built-in room a room of yours">COPY INTO WORLD</button>' : '');
        t.querySelectorAll('[data-tool]').forEach(function (b) { b.onclick = function () { tcMode(b.getAttribute('data-tool')); }; });
        $('edSnap').onchange = function () { ED.snap = +this.value; tcMode(ED.tool); };
        $('edRSnap').onchange = function () { ED.rotSnap = +this.value; tcMode(ED.tool); };
        if ($('edCopy')) $('edCopy').onclick = copyIntoWorld;
    }
    /* ── THE OUTLINER: the world (his rooms), then this room's rows by list ── */
    function outliner() {
        var L = $('edLeft'); if (!L || !ED.doc) return;
        var h = '<div class="ed-sec"><div class="ed-hd">WORLD · ' + esc(ED.project) + '</div>';
        Object.keys(ED.doc.rooms).sort(function (a, b) { return (W.hqWorldDocRoomNo(a) || 0) - (W.hqWorldDocRoomNo(b) || 0); }).forEach(function (id) {
            var r = ED.doc.rooms[id];
            h += '<button class="ed-row' + (ED.mode === 'world' && id === ED.roomId ? ' on' : '') + '" data-room="' + esc(id) + '">' + esc(r.label || id) + (ED.doc.start && ED.doc.start.room === id ? ' <i>START</i>' : '') + '<span>' + esc(id) + ' · ' + roomSize(r) + '</span></button>';
        });
        h += '<button class="ed-row ed-add" data-act="newroom">+ NEW ROOM</button></div>';
        h = paletteHtml() + h + prefabsHtml();
        if (ED.mode === 'library') h += '<div class="ed-sec"><div class="ed-hd">LIBRARY · READ ONLY</div><div class="ed-note">' + esc((room() || {}).label || ED.roomId) + '<br>' + esc(ED.roomId) + '</div></div>';
        var r = room();
        if (r) {
            var groups = [['terrain.features', 'SHAPES'], ['props', 'PROPS'], ['doors', 'DOORS'], ['counters', 'COUNTERS'], ['npcSpots', 'PEOPLE'], ['agents', 'AGENTS']];
            h += '<div class="ed-sec"><div class="ed-hd">' + esc(String(r.label || ED.roomId).toUpperCase()) + '</div>';
            if (ED.mode !== 'prefab') h += '<button class="ed-row' + (isSel('spawn') ? ' on' : '') + '" data-list="spawn">spawn<span>x ' + ((r.spawn && r.spawn.x) || 0) + ' z ' + ((r.spawn && r.spawn.z) || 0) + '</span></button>';
            groups.forEach(function (g) {
                var list = listOf(r, g[0]) || []; if (!list.length) return;
                h += '<div class="ed-sub">' + g[1] + ' · ' + list.length + '</div>';
                list.slice(0, 400).forEach(function (row) { if (!row) return; h += '<button class="ed-row' + (isSel(g[0], row.id) ? ' on' : '') + '" data-list="' + g[0] + '" data-id="' + esc(row.id) + '">' + esc(Core.rowLabel(g[0], row)) + '<span>' + esc(row.id || '') + '</span></button>'; });
                if (list.length > 400) h += '<div class="ed-note">… ' + (list.length - 400) + ' more</div>';
            });
            if (r.terrain && r.terrain.gen) h += '<div class="ed-note">This room\'s floor plan is GENERATED (terrain.gen · ' + esc(r.terrain.gen.kind || '') + '): its walls come from the generator, not from rows (FREEZE comes in E5).</div>';
            h += '</div>';
        }
        var sc = L.scrollTop; L.innerHTML = h; L.scrollTop = sc;
        paletteWire(L); prefabsWire(L);
        L.querySelectorAll('[data-room]').forEach(function (b) { b.onclick = function () { saveCam(); enterRoom(b.getAttribute('data-room'), 'world'); }; });
        L.querySelectorAll('[data-act="newroom"]').forEach(function (b) { b.onclick = newRoom; });
        L.querySelectorAll('[data-list]').forEach(function (b) { b.onclick = function (e) { select(b.getAttribute('data-list'), b.getAttribute('data-id'), e.shiftKey); if (!e.shiftKey) frameSel(); }; });
    }
    function roomSize(r) { var S = (r && r.shell) || {}; if (S.w > 0 && S.d > 0) return Math.round(S.w) + '×' + Math.round(S.d) + ' m'; var R = S.radius || S.r; return R > 0 ? 'r ' + Math.round(R) + ' m' : (r && r.kind) || ''; }
    function saveCam() { var r = room(); if (r && editable() && r.edit) r.edit.cam = { x: ED.cam.x, y: ED.cam.y, z: ED.cam.z, yaw: ED.cam.yaw, pitch: ED.cam.pitch, speed: ED.cam.speed }; }
    /* ── THE INSPECTOR: every field of the selected row (numbers, text, texture / catalogue / leaf keys, switches, JSON for the rest);
       nothing selected = the room itself ── */
    var TEX_KEYS = ['key', 'floor', 'cliff', 'path', 'wall', 'dado', 'trim', 'ceiling', 'apron', 'skirt', 'keyIn'];
    function texList() {
        if (texList._c) return texList._c;
        var o = [];
        try { if (typeof TERRAIN_SPRITES !== 'undefined') o = o.concat(Object.keys(TERRAIN_SPRITES)); } catch (e) {}
        try { if (typeof URBAN_TEXTURES !== 'undefined') o = o.concat((Array.isArray(URBAN_TEXTURES) ? URBAN_TEXTURES : Object.keys(URBAN_TEXTURES)).map(function (n) { return 'urban:' + n; })); } catch (e) {}
        try { o = o.concat(Object.keys(DOOR_HQ.textures || {})); } catch (e) {}
        return (texList._c = o);
    }
    function datalists() {
        if ($('edDlTex')) return;
        var d = document.createElement('div'); d.style.display = 'none';
        var C = DOOR_HQ.catalogue;
        d.innerHTML = '<datalist id="edDlTex">' + texList().map(function (k) { return '<option value="' + esc(k) + '">'; }).join('') + '</datalist>' +
            '<datalist id="edDlProp">' + Object.keys(C).filter(function (k) { return !C[k].leaf; }).map(function (k) { return '<option value="' + esc(k) + '">'; }).join('') + '</datalist>' +
            '<datalist id="edDlLeaf">' + Object.keys(C).filter(function (k) { return C[k].leaf; }).map(function (k) { return '<option value="' + esc(k) + '">'; }).join('') + '</datalist>' +
            '<datalist id="edDlLook">' + (W.HQ_CLIMB_LOOKS || []).map(function (k) { return '<option value="' + esc(k) + '">'; }).join('') + '</datalist>';
        $('edRoot').appendChild(d);
    }
    function fieldHtml(key, val, list) {
        var id = 'edF_' + key.replace(/[^a-z0-9_]/gi, '_');
        var tex = TEX_KEYS.indexOf(key) >= 0 && !(key === 'key' && list && list !== 'terrain.features' && list !== 'terrain.marks');
        if (tex && (typeof val === 'string' || val == null)) return '<label class="ed-f"><span>' + esc(key) + '</span><input type="text" data-k="' + esc(key) + '" data-t="str" value="' + esc(val || '') + '" list="edDlTex" id="' + id + '"><button class="ed-btn ed-texb" data-tex="' + esc(key) + '" title="Pick a texture"' + texSwatchStyle(val) + '>…</button></label>';
        if (typeof val === 'boolean') return '<label class="ed-f"><span>' + esc(key) + '</span><input type="checkbox" data-k="' + esc(key) + '" data-t="bool"' + (val ? ' checked' : '') + '></label>';
        if (typeof val === 'number') return '<label class="ed-f"><span>' + esc(key) + '</span><input type="number" step="any" data-k="' + esc(key) + '" data-t="num" value="' + esc(val) + '"></label>';
        if (typeof val === 'string') {
            var dl = key === 'key' && list === 'props' ? 'edDlProp' : key === 'leaf' ? 'edDlLeaf' : key === 'look' ? 'edDlLook' : '';
            return '<label class="ed-f"><span>' + esc(key) + '</span><input type="text" data-k="' + esc(key) + '" data-t="str" value="' + esc(val) + '"' + (dl ? ' list="' + dl + '"' : '') + ' id="' + id + '"></label>';
        }
        return '<label class="ed-f ed-fj"><span>' + esc(key) + '</span><textarea data-k="' + esc(key) + '" data-t="json" rows="' + Math.min(8, 1 + Math.ceil(JSON.stringify(val).length / 38)) + '">' + esc(JSON.stringify(val)) + '</textarea></label>';
    }
    function inspector() {
        var P = $('edRight'); if (!P) return;
        datalists();
        var r = room(); if (!r) { P.innerHTML = ''; return; }
        var ro = !editable();
        var hits = ED.sel.map(selRow).filter(Boolean);
        var h = '';
        if (!hits.length && ED.mode === 'prefab') {
            var pf = ED.doc.prefabs[ED.pfId] || {};
            h += '<div class="ed-hd">THIS PREFAB</div><div class="ed-note">' + esc(ED.pfId) + ' · placed ' + prefabUses(ED.pfId) + '× · its 0, 0 is where a placement stands</div>';
            h += '<div class="ed-form" data-scope="pf">' + fieldHtml('label', String(pf.label || '')) + '</div>';
            h += '<div class="ed-acts"><button class="ed-btn ed-copy" data-a="pfdone">DONE</button>' + (prefabUses(ED.pfId) ? '' : '<button class="ed-btn ed-danger" data-a="pfdel">DELETE PREFAB</button>') + '</div>';
            h += '<div class="ed-note">A prefab holds shapes and props. Draw them with BUILD (left), or ADD. Every room that places it changes with it.</div>';
        } else if (!hits.length) {
            var S = r.shell || {}, T = r.terrain || {};
            h += '<div class="ed-hd">' + (ro ? 'LIBRARY ROOM' : 'THIS ROOM') + '</div><div class="ed-note">' + esc(ED.roomId) + (ro ? ' · read only' : '') + '</div>';
            h += '<div class="ed-form" data-scope="room">' + fieldHtml('label', String(r.label || '')) + fieldHtml('sub', String(r.sub || '')) + '</div>';
            var shellKeys = Object.keys(S).filter(function (k) { return k !== 'sky' && k !== 'mood' && k.charAt(0) !== '_' && (typeof S[k] !== 'object' || S[k] === null); });
            shellKeys.sort(function (a, b) { var o = ['w', 'd', 'r', 'radius', 'h', 'open', 'edge', 'floor']; var ia = o.indexOf(a), ib = o.indexOf(b); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || (a < b ? -1 : 1); });
            h += '<div class="ed-sub">THE SHELL</div><div class="ed-form" data-scope="shell">' + shellKeys.map(function (k) { return fieldHtml(k, S[k]); }).join('') + '</div>';
            if (r.terrain) h += '<div class="ed-sub">THE GROUND</div><div class="ed-form" data-scope="terrain">' + fieldHtml('floor', String(T.floor || '')) + fieldHtml('cliff', String(T.cliff || '')) + fieldHtml('path', String(T.path || '')) + fieldHtml('base', +T.base || 0) + '</div>';
            h += '<div class="ed-sub">THE SKY (E6 brings the picker)</div><div class="ed-form" data-scope="shell">' + fieldHtml('sky', S.sky || null) + fieldHtml('mood', S.mood || null) + '</div>';
            if (r.edit) h += '<div class="ed-sub">NOTES</div><div class="ed-form" data-scope="edit"><label class="ed-f ed-fj"><textarea data-k="notes" data-t="str" rows="3">' + esc(r.edit.notes || '') + '</textarea></label></div>';
            if (!ro) h += '<div class="ed-acts"><button class="ed-btn" data-a="dup">DUPLICATE ROOM</button><button class="ed-btn" data-a="start">WORLD STARTS HERE</button><button class="ed-btn ed-danger" data-a="del">DELETE ROOM</button></div>';
            else h += '<div class="ed-acts"><button class="ed-btn ed-copy" data-a="copy">COPY INTO WORLD</button></div>';
            h += '<div class="ed-sub">BUILD</div><div class="ed-note">BUILD (left) draws walls, rooms, floors, stairs, buildings, door gaps and windows on the ground. ADD (top bar) puts a shape, a prefab, a kit, a prop or a door at the cursor. Click a thing to pick it; SHIFT + click adds to the pick.</div>';
        } else if (hits.length > 1) {
            h += '<div class="ed-hd">' + hits.length + ' PICKED</div><div class="ed-note">' + hits.map(function (x) { return esc(Core.rowLabel(x.list, x.row)); }).join('<br>') + '</div><div class="ed-note">The gizmo moves / turns them together. DEL deletes, CTRL D duplicates.</div>';
            if (!ro) h += '<div class="ed-acts"><button class="ed-btn" data-a="array">ARRAY…</button><button class="ed-btn" data-a="mirx">MIRROR E–W</button><button class="ed-btn" data-a="mirz">MIRROR N–S</button>' + (ED.mode !== 'prefab' ? '<button class="ed-btn ed-copy" data-a="topf">SAVE AS PREFAB</button>' : '') + '</div>';
        } else {
            var x = hits[0], row = x.row;
            h += '<div class="ed-hd">' + esc(Core.rowLabel(x.list, row).toUpperCase()) + '</div><div class="ed-note">' + esc(x.list) + (row.id ? ' · ' + esc(row.id) : '') + (ro ? ' · read only' : '') + '</div>';
            h += '<div class="ed-form" data-scope="row">';
            var keys = Object.keys(row).filter(function (k) { return k !== 'id' && k.charAt(0) !== '_'; });
            keys.sort(function (a, b) { var o = ['k', 'key', 'kind', 'look', 'wall', 'x', 'z', 'y', 'x0', 'z0', 'x1', 'z1', 'w', 'd', 'h', 'r', 'face', 'rot']; var ia = o.indexOf(a), ib = o.indexOf(b); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || (a < b ? -1 : 1); });
            keys.forEach(function (k) { h += fieldHtml(k, row[k], x.list); });
            if (x.list === 'terrain.features' && row.k === 'wall' && !('keyIn' in row)) h += fieldHtml('keyIn', '', x.list);
            h += '</div>';
            if (!ro) {
                h += '<div class="ed-addf"><input type="text" id="edNewK" placeholder="field"><input type="text" id="edNewV" placeholder="value (JSON)"><button class="ed-btn" id="edNewAdd">+ FIELD</button></div>';
                h += '<div class="ed-acts">' + (x.list === 'doors' ? '<button class="ed-btn" data-a="target">LEADS TO…</button>' : '') +
                    (row.k === 'prefab' ? '<button class="ed-btn ed-copy" data-a="pfedit">EDIT PREFAB</button>' : '') + (row.k === 'prefab' || row.k === 'kit' ? '<button class="ed-btn" data-a="bake">BAKE TO ROWS</button>' : '') +
                    '<button class="ed-btn" data-a="dupr">DUPLICATE</button><button class="ed-btn ed-danger" data-a="delr">DELETE</button></div>';
                if (x.list === 'terrain.features' || x.list === 'props') h += '<div class="ed-acts"><button class="ed-btn" data-a="array">ARRAY…</button><button class="ed-btn" data-a="mirx">MIRROR E–W</button><button class="ed-btn" data-a="mirz">MIRROR N–S</button>' + (ED.mode !== 'prefab' ? '<button class="ed-btn" data-a="topf">SAVE AS PREFAB</button>' : '') + '</div>';
                if (row.k === 'wall') h += '<div class="ed-note">key = the outside sheet, keyIn = the inside (the right-hand face walking start → end). BUILD → DOOR GAP / WINDOW cuts an opening.</div>';
                if (row.k === 'opening') h += '<div class="ed-note">An opening in wall ' + esc(row.wall) + ', at = metres from the wall\'s start (MOVE slides it). sill 0 = a door gap; glaze = glass.</div>';
                if (row.k === 'kit') h += '<div class="ed-note">A kit: the game\'s ' + esc(row.fn) + ' builder; args are its form (metres, degrees, about its own 0, 0).</div>';
                h += '<div class="ed-sub">RAW</div><textarea class="ed-raw" id="edRaw" rows="6">' + esc(JSON.stringify(row, null, 1)) + '</textarea><button class="ed-btn" id="edRawApply">APPLY RAW</button>';
            }
            if (x.list === 'props') { var cat = DOOR_HQ.catalogue[row.key]; if (cat) h += '<div class="ed-sub">CATALOGUE · ' + esc(row.key) + '</div><div class="ed-note">' + esc(JSON.stringify(cat).slice(0, 400)) + '</div>'; }
        }
        /* THE FOCUS: a re-render keeps the field he was in (ENTER stays, TAB moves on) */
        var ae = document.activeElement, want = ED._focus || (ae && P.contains(ae) && ae.getAttribute('data-k') ? { k: ae.getAttribute('data-k'), d: 0 } : null); ED._focus = null;
        var sc = P.scrollTop; P.innerHTML = h; P.scrollTop = sc;
        if (ro) P.querySelectorAll('input,textarea,select,.ed-texb').forEach(function (el) { el.disabled = true; });
        var fields = Array.prototype.slice.call(P.querySelectorAll('.ed-form [data-k]'));
        fields.forEach(function (el, i) {
            el.onchange = function () { fieldCommit(el); };
            el.onkeydown = function (e) {
                if (e.key === 'Tab') { e.preventDefault(); ED._focus = { k: el.getAttribute('data-k'), d: e.shiftKey ? -1 : 1 }; if (!fieldCommit(el)) { var nx = fields[i + ED._focus.d]; ED._focus = null; if (nx) { nx.focus(); if (nx.select) nx.select(); } } }
                else if (e.key === 'Enter' && el.tagName === 'INPUT') { e.preventDefault(); ED._focus = { k: el.getAttribute('data-k'), d: 0 }; if (!fieldCommit(el)) ED._focus = null; }
                else if (e.key === 'Escape') { el.value = el.type === 'checkbox' ? el.value : el.defaultValue; el.blur(); }
            };
        });
        if (want) { for (var fi = 0; fi < fields.length; fi++) if (fields[fi].getAttribute('data-k') === want.k) { var tg = fields[fi + want.d] || fields[fi]; tg.focus(); if (tg.select) tg.select(); break; } }
        P.querySelectorAll('[data-tex]').forEach(function (b) { b.onclick = function (e) { e.preventDefault(); var el = b.parentNode.querySelector('[data-k]'); texPick(el.value, function (v) { el.value = v; fieldCommit(el); }); }; });
        var act = function (a, fn) { P.querySelectorAll('[data-a="' + a + '"]').forEach(function (b) { b.onclick = fn; }); };
        act('dup', duplicateRoom); act('start', setStart); act('del', deleteRoom); act('copy', copyIntoWorld);
        act('dupr', duplicateSel); act('delr', deleteSel); act('array', arraySel); act('mirx', function () { mirrorSel('x'); }); act('mirz', function () { mirrorSel('z'); });
        act('topf', selToPrefab); act('bake', bakeSel); act('pfedit', function () { if (hits[0] && hits[0].row.pf) enterPrefab(hits[0].row.pf); }); act('pfdone', leavePrefab); act('pfdel', function () { deletePrefab(ED.pfId); }); act('target', function () { if (hits[0]) doorRetarget(hits[0]); });
        if ($('edNewAdd')) $('edNewAdd').onclick = function () {
            var k = ($('edNewK').value || '').trim(), vs = $('edNewV').value; if (!k || !hits[0]) return;
            var v; try { v = JSON.parse(vs); } catch (e) { v = vs; }
            var after = Core.clone(hits[0].row); after[k] = v; rowReplace(hits[0], after, 'field ' + k);
        };
        if ($('edRawApply')) $('edRawApply').onclick = function () {
            var v; try { v = JSON.parse($('edRaw').value); } catch (e) { toast('NOT JSON · ' + e.message); return; }
            if (!v || typeof v !== 'object') return;
            if (hits[0].row.id && !v.id) v.id = hits[0].row.id;
            rowReplace(hits[0], v, 'raw edit');
        };
    }
    function rowReplace(h, after, label) {
        if (h.list === 'spawn') { commit([{ path: ['rooms', ED.roomId, 'spawn'], before: Core.clone(room().spawn), after: after }], label, { noReload: true }); spawnPlace(); return; }
        replaceRows([{ list: h.list, i: h.i, before: Core.clone(h.row), after: after }], label);
    }
    function fieldCommit(el) {
        var k = el.getAttribute('data-k'), t = el.getAttribute('data-t'), scope = el.closest('[data-scope]').getAttribute('data-scope'), v;
        if (t !== 'bool' && el.value === el.defaultValue) return false;   // nothing changed: no undo step
        if (t === 'bool') v = !!el.checked; else if (t === 'num') { v = parseFloat(el.value); if (!isFinite(v)) { toast('NOT A NUMBER'); return false; } }
        else if (t === 'json') { try { v = JSON.parse(el.value); } catch (e) { toast('NOT JSON · ' + e.message); return false; } } else v = el.value;
        el.defaultValue = el.value;
        if (scope === 'row') {
            var h = ED.sel.map(selRow).filter(Boolean)[0]; if (!h) return false;
            var after = Core.clone(h.row);
            if (v === '' && t === 'str' && TEX_KEYS.indexOf(k) >= 0) delete after[k]; else after[k] = v;
            rowReplace(h, after, k);
            return true;
        }
        if (scope === 'pf') { var pf = ED.doc.prefabs[ED.pfId]; if (!pf) return false; commit([{ path: ['prefabs', ED.pfId, k], before: pf[k], after: v }], k, { noReload: true }); return true; }
        if (!editable()) return false;
        var base = scope === 'room' ? [] : [scope], r = room(), cur = scope === 'room' ? r : r[scope];
        if (scope === 'shell' && (k === 'w' || k === 'd')) { v = Math.max(8, Math.min(W.HQ_WORLD_DOC_RULES.maxRoomM, v)); }
        if (scope === 'shell' && k === 'w' && r.terrain) { /* the ground follows */ }
        commit([{ path: ['rooms', ED.roomId].concat(base, [k]), before: cur ? Core.clone(cur[k]) : undefined, after: v }], k, { noReload: scope === 'edit' || (scope === 'room' && k !== 'label') });
        return true;
    }
    function status() {
        ED.statusAt = performance.now();
        var s = $('edStatus'); if (!s) return;
        var r = room(), c = ED.cursor, perf = null, lights = 0;
        try { perf = ThreeRenderer.hq.perf ? ThreeRenderer.hq.perf() : null; } catch (e) {}
        if (r) (r.props || []).forEach(function (p) { var cat = DOOR_HQ.catalogue[p && p.key]; if (cat && cat.light) lights++; });
        var cap = W.HQ_PROP_LIGHT_MAX || (typeof HQ_PROP_LIGHT_MAX !== 'undefined' ? HQ_PROP_LIGHT_MAX : null);
        s.innerHTML = [
            '<b>' + esc(ED.mode === 'library' ? 'LIBRARY' : ED.mode === 'prefab' ? 'PREFAB' : ED.project || '') + '</b>',
            esc((r && r.label) || ED.roomId || ''),
            c ? 'x ' + c.x.toFixed(2) + ' z ' + c.z.toFixed(2) + ' ground ' + c.y.toFixed(2) + ' m' : 'the cursor is off the ground',
            ED.draw ? '<b>' + esc(DRAWS[ED.draw.tool] ? DRAWS[ED.draw.tool].label : 'PLACE') + '</b>' + (ED._drawInfo ? ' ' + esc(ED._drawInfo) : '') : '',
            'eye ' + ED.cam.x.toFixed(1) + ', ' + ED.cam.y.toFixed(1) + ', ' + ED.cam.z.toFixed(1) + ' · ' + ED.cam.speed.toFixed(0) + ' m/s',
            ED.ready ? 'READY' : 'BUILDING…',
            'lights ' + lights + (cap ? ' / ' + cap : ''),
            perf && perf.fps ? Math.round(perf.fps) + ' fps' : '',
            ED.undo.length + ' undo',
            ED.dirty ? 'SAVING…' : (ED.savedAt ? 'saved' : ''),
        ].filter(Boolean).map(function (x) { return '<span>' + x + '</span>'; }).join('');
    }
    function banner() {
        var b = $('edBanner'); if (!b) return;
        if (ED.mode === 'library') { b.style.display = ''; b.innerHTML = 'LIBRARY · ' + esc((room() || {}).label || ED.roomId) + ' · READ ONLY — <button class="ed-btn ed-copy" id="edBanCopy">COPY INTO WORLD</button> <button class="ed-btn" id="edBanBack">BACK TO MY WORLD</button>'; $('edBanCopy').onclick = copyIntoWorld; $('edBanBack').onclick = function () { enterRoom((ED.doc.start && ED.doc.rooms[ED.doc.start.room]) ? ED.doc.start.room : Object.keys(ED.doc.rooms)[0], 'world'); }; }
        else if (ED.mode === 'prefab' && ED.doc.prefabs[ED.pfId]) { b.style.display = ''; b.innerHTML = 'PREFAB · ' + esc(ED.doc.prefabs[ED.pfId].label || ED.pfId) + ' · placed ' + prefabUses(ED.pfId) + '× · every placement follows these edits — <button class="ed-btn ed-copy" id="edBanDone">DONE</button>'; $('edBanDone').onclick = leavePrefab; }
        else b.style.display = 'none';
    }
    function panels() { toolsBar(); outliner(); inspector(); banner(); status(); }

    /* ── the pick list and the small form (plain DOM) ── */
    function modalOpen(html) { var m = $('edModal'); $('edCard').innerHTML = html; m.style.display = ''; }
    function modalClose() { var m = $('edModal'); if (m) m.style.display = 'none'; }
    function pick(title, items, onPick) {
        modalOpen('<div class="ed-hd">' + esc(title) + '</div><input type="text" class="ed-search" id="edSearch" placeholder="search…"><div class="ed-list" id="edList"></div><div class="ed-acts"><button class="ed-btn" id="edCancel">CANCEL</button></div>');
        var draw = function () {
            var q = ($('edSearch').value || '').toLowerCase(), n = 0, h = '';
            items.forEach(function (it, i) { if (q && (it.label + ' ' + (it.sub || '')).toLowerCase().indexOf(q) < 0) return; if (n++ > 500) return; h += '<button class="ed-row" data-i="' + i + '">' + esc(it.label) + '<span>' + esc(it.sub || '') + '</span></button>'; });
            $('edList').innerHTML = h || '<div class="ed-note">Nothing matches.</div>';
            $('edList').querySelectorAll('[data-i]').forEach(function (b) { b.onclick = function () { modalClose(); onPick(items[+b.getAttribute('data-i')].value); }; });
        };
        $('edSearch').oninput = draw; $('edCancel').onclick = modalClose; draw(); setTimeout(function () { $('edSearch').focus(); }, 0);
    }
    function ask(title, fields, onOk) {
        var h = '<div class="ed-hd">' + esc(title) + '</div><div class="ed-form">';
        fields.forEach(function (f) {
            if (f.type === 'select') h += '<label class="ed-f"><span>' + esc(f.label) + '</span><select data-n="' + f.name + '">' + f.options.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === f.value ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>';
            else if (f.type === 'checkbox') h += '<label class="ed-f"><span>' + esc(f.label) + '</span><input type="checkbox" data-n="' + f.name + '"' + (f.value ? ' checked' : '') + '></label>';
            else h += '<label class="ed-f"><span>' + esc(f.label) + '</span><input type="' + (f.type || 'text') + '" data-n="' + f.name + '" value="' + esc(f.value) + '"></label>';
        });
        h += '</div><div class="ed-acts"><button class="ed-btn ed-primary" id="edOk">OK</button><button class="ed-btn" id="edCancel">CANCEL</button></div>';
        modalOpen(h);
        $('edCancel').onclick = modalClose;
        $('edOk').onclick = function () { var v = {}; $('edCard').querySelectorAll('[data-n]').forEach(function (el) { v[el.getAttribute('data-n')] = el.type === 'checkbox' ? el.checked : el.value; }); modalClose(); onOk(v); };
    }
    function help() {
        modalOpen('<div class="ed-hd">THE KEYS</div><div class="ed-help">' + [
            ['RIGHT MOUSE held', 'look; with W A S D fly, Q E down / up, SHIFT fast, CTRL slow, wheel = fly speed'],
            ['Arrows · PgUp PgDn', 'fly without the mouse'], ['Wheel', 'dolly forward / back'], ['ALT + LEFT drag', 'orbit the pick'], ['MIDDLE drag', 'pan'],
            ['LEFT click', 'pick (SHIFT adds) · the gizmo moves it'], ['W · E · R', 'MOVE · TURN · SIZE'], ['[ · ]', 'turn the pick by the angle snap'],
            ['F · Home · G', 'frame the pick · to the spawn · the grid'], ['DEL · CTRL D', 'delete · duplicate'],
            ['BUILD (left)', 'WALL: click the corners (ENTER / ESC ends, a click on the first point closes it) · ROOM, FLOOR, BUILDING: drag a rectangle · STAIRS, RAMP: drag foot → head · DOOR GAP, WINDOW: click a wall'],
            ['SHIFT while drawing', 'lock the line to 45° steps (ends snap to wall ends within 0.6 m, else to the grid)'], ['V · Esc', 'back to SELECT · end the run / drop the pick'], ['CTRL Z · CTRL Y · CTRL S', 'undo · redo · save (it autosaves anyway)'],
            ['P', 'PLAY HERE: the walker at the cursor, the real game; ESC comes back'], ['Esc', 'drop the pick'],
        ].map(function (r) { return '<div><b>' + r[0] + '</b><span>' + r[1] + '</span></div>'; }).join('') +
        '</div><div class="ed-note">Your world starts flat and empty. BUILD draws the architecture; EDIT → SAVE SELECTION AS PREFAB makes a reusable group (PREFABS, left, edits it: every copy follows); EDIT → ARRAY / MIRROR copy and flip. ADD puts shapes, prefabs, kits, props and doors at the cursor; the inspector edits every field; ROOM → THE LIBRARY opens a built-in room to look at or copy. FILE → EXPORT makes the zip for the bucket (Assets/World/). Everything autosaves in this browser.</div><div class="ed-acts"><button class="ed-btn" id="edCancel">CLOSE</button></div>');
        $('edCancel').onclick = modalClose;
    }

    /* ══ OPEN / CLOSE ═══════════════════════════════════════════════════════════════════════════════════════════════════ */
    function open(opts) {
        opts = opts || {};
        if (typeof DOOR_HQ === 'undefined' || typeof W.hqWorldDocNew !== 'function' || typeof W._hqEditEnter !== 'function') { alert('The editor needs data.js / map.js from the same delivery (hqWorldDoc*, _hqEditEnter).'); return; }
        build(); loadOpts();
        if (!ED.flags) ED.flags = { batch: W.EW_HQ_NO_BATCH, inst: W.EW_HQ_NO_INSTANCE };
        W.EW_HQ_NO_BATCH = true; W.EW_HQ_NO_INSTANCE = true;   // the pieces stay pieces while editing (a live drag moves the real prop); a look-only difference, never the player's
        ED.open = true; ED.playing = false;
        document.body.classList.add('ed-on'); document.body.classList.remove('ed-playing');
        $('edRoot').style.display = '';
        bind(true);
        tcEnsure().then(function (ok) { if (ok && ED.view && !ED.tc) tcBuild(); if (!ok) toast('THE GIZMO DID NOT LOAD (jsdelivr) · the inspector still moves things', 5000); });
        var start = function () {
            var want = opts.room && DOOR_HQ.rooms[opts.room] ? opts.room : null;
            var at = opts.at || null;
            if (want && ED.doc.rooms[want]) enterRoom(want, 'world', { at: at });
            else if (want) enterRoom(want, 'library', { at: at });
            else enterRoom(ED.roomId && ED.doc.rooms[ED.roomId] ? ED.roomId : ED.doc.start.room, 'world', { keepCam: !!ED.roomId });
        };
        if (ED.doc) { start(); return; }
        lastProject().then(function (name) { return name ? projectLoad(name) : null; }).catch(function () { return null; }).then(function (rec) {
            if (rec && rec.doc) { docLoad(rec.doc, rec.name); ED.exported = rec.exported || null; if (rec.cam) Object.assign(ED.cam, rec.cam); if (rec.roomId && ED.doc.rooms[rec.roomId]) ED.roomId = rec.roomId; }
            else { docLoad(W.hqWorldDocNew(), 'World 1'); saveNow(); toast('WORLD 1 · FLAT AND EMPTY · H for the keys', 5000); }
            start();
        });
    }
    function close() {
        if (ED.draw) { ED.draw = null; drawPreview(null); }
        saveCam(); saveNow();
        ED.open = false; ED.playing = false;
        bind(false);
        if (ED.tc) { try { ED.tc.detach(); ED.tc.dispose(); } catch (e) {} ED.tc = null; }
        ED.view = null; ED.group = null; ED.proxies = []; ED.boxes = [];
        document.body.classList.remove('ed-on', 'ed-playing');
        if ($('edRoot')) $('edRoot').style.display = 'none';
        if (ED.flags) { W.EW_HQ_NO_BATCH = ED.flags.batch; W.EW_HQ_NO_INSTANCE = ED.flags.inst; ED.flags = null; }
        W._hqEditLeave();
    }
    W.EWEditor = {
        open: open, close: close,
        playing: function () { return ED.open && ED.playing; },
        backFromPlay: backFromPlay,
        core: Core,
        /* the probes' reads (playtest_editor.js): the state as data, never the objects */
        state: function () { return { tcAxis: ED.tc ? ED.tc.axis : undefined, tcDragging: ED.tcDragging, pivot: ED.pivot ? { x: ED.pivot.position.x / U(), y: ED.pivot.position.y / U(), z: ED.pivot.position.z / U() } : null, open: ED.open, playing: ED.playing, mode: ED.mode, room: ED.roomId, project: ED.project, rooms: ED.doc ? Object.keys(ED.doc.rooms) : [], sel: ED.sel.slice(), undo: ED.undo.length, redo: ED.redo.length, ready: ED.ready, proxies: ED.proxies.length, gizmo: !!ED.tc, cam: Object.assign({}, ED.cam), cursor: ED.cursor }; },
        doc: function () { return ED.doc; },
        cam: function (o) { if (o) Object.assign(ED.cam, o); return Object.assign({}, ED.cam); },
        w2s: function (x, y, z) { if (!ED.view) return null; var u = U(), v = new THREE.Vector3(x * u, y * u, z * u).project(ED.view.camera), rc = ED.view.canvas.getBoundingClientRect(); return { x: rc.left + (v.x + 1) / 2 * rc.width, y: rc.top + (1 - v.y) / 2 * rc.height, vis: v.z < 1 }; },
        draw: function () { return ED.draw ? { tool: ED.draw.tool, a: ED.draw.a, info: ED._drawInfo } : null; },
        act: { addShape: addShape, addRow: addRow, select: select, undo: undo, redo: redo, deleteSel: deleteSel, duplicateSel: duplicateSel, turnSel: turnSel, exportZip: exportZip, newRoom: function (w, d) { var id = W.hqWorldDocNextRoomId(ED.doc), r = W.hqWorldDocNewRoom(id, { w: w, d: d }); commit([{ path: ['rooms', id], before: undefined, after: r }], 'new room'); enterRoom(id, 'world'); return id; },
               drawSet: drawSet, drawUp: drawUp, drawDown: drawDown, enterPrefab: enterPrefab, leavePrefab: leavePrefab, newPrefab: newPrefab, selToPrefab: selToPrefab, roomToPrefab: roomToPrefab, bakeSel: bakeSel, mirrorSel: mirrorSel, placeRow: placeRow, texPick: texPick, arrayRows: function (n, dx, dz, dyaw) { var ask0 = ask; ask = function (t, f, ok) { ok({ n: n, dx: dx, dz: dz, dyaw: dyaw }); }; try { arraySel(); } finally { ask = ask0; } },
               enter: enterRoom, playHere: playHere, library: function (id) { enterRoom(id, 'library'); }, copyIntoWorld: copyIntoWorld, pickAt: pickAt, frame: frameSel,
               moveSel: function (dx, dz) { var hits = ED.sel.map(selRow).filter(Boolean), a = hits[0] ? Core.rowAnchor(hits[0].row) : { x: 0, z: 0 }; replaceRows(hits.filter(function (h) { return h.list !== 'spawn'; }).map(function (h) { return { list: h.list, i: h.i, before: Core.clone(h.row), after: Core.rowTransform(h.row, { dx: dx, dz: dz, px: a.x, pz: a.z }) }; }), 'move'); } },
    };
})();
