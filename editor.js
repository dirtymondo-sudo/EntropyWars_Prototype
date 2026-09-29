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
        opts: { wallH: 3, wallT: 0.25, wallKey: 'urban:ConcreteStriped2c', wallKeyIn: 'urban:PlasterWallPainted1a', height: 3, floorKey: 'urban:ConcreteStriped1b', storeys: 3, tab: 'build', doorLeaf: 'leaf_office',
                /* E3: the ground brushes, the paint, the water */
                brushR: 4, brushS: 0.5, brushFall: 'smooth', terraceH: 1, cliffH: 3, setH: 0, paintKey: '', paintErase: false, waterKey: 'water', waterDepth: 0.8, streamW: 2.4 },
        /* E3: a brush stroke in progress, the level band, the audits */
        stroke: null, band: { on: false, y0: -0.5, y1: 3.2 }, clipMats: [], clipPlane: null, ring: null,
        audit: { walls: false, pockets: false, fight: false }, auditRes: {}, auditObjs: [], fightAt: 0, fightKey: '',
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
            var q = indexedDB.open('ew_editor', 3);   // v2 (E2): the palette's thumbnails; v3 (E4): the land's tiles
            q.onupgradeneeded = function () { var db = q.result; if (!db.objectStoreNames.contains('projects')) db.createObjectStore('projects', { keyPath: 'name' }); if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta'); if (!db.objectStoreNames.contains('thumbs')) db.createObjectStore('thumbs'); if (!db.objectStoreNames.contains('land')) db.createObjectStore('land'); };
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
    function undo() { var s = ED.undo.pop(); if (!s) return; try { Core.stepUndo(ED.doc, s); if (s.land && ED.land) landSnapsApply(s.land, 'before'); } catch (e) { toast('UNDO FAILED · ' + e.message); return; } ED.redo.push(s); if (isLandStep(s)) landAfter(s); else afterStep(s); toast('UNDO · ' + s.label, 1200); }
    function redo() { var s = ED.redo.pop(); if (!s) return; try { Core.stepDo(ED.doc, s); if (s.land && ED.land) landSnapsApply(s.land, 'after'); } catch (e) { toast('REDO FAILED · ' + e.message); return; } ED.undo.push(s); if (isLandStep(s)) landAfter(s); else afterStep(s); toast('REDO · ' + s.label, 1200); }

    /* ══ ROWS: selection = [{ list, id }] ('spawn' and 'room' are the room's own) ═══════════════════════════════════════ */
    var LISTS = ['terrain.features', 'props', 'doors', 'counters', 'npcSpots', 'agents', 'onlineSpots'];
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
        LISTS.concat(['terrain.marks']).forEach(function (l) { (listOf(r, l) || []).forEach(function (x) { var m = /^r(\d+)$/.exec(String(x && x.id || '')); if (m) max = Math.max(max, +m[1]); }); });
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
        var step = [], gone = {};
        hits.forEach(function (h) { if (h.list === 'doors') gone[ED.roomId + '|' + h.row.id] = 1; });
        /* E2: a door of a pair goes alone — the far end keeps leading here, to the spawn now (its `at` named the door that went) */
        if (ED.mode === 'world') hits.forEach(function (h) {
            if (h.list !== 'doors') return;
            W.hqDoorPartners(ED.doc, ED.roomId, h.row.id).forEach(function (q) { if (gone[q.room + '|' + q.id]) return; var d = ED.doc.rooms[q.room].doors[q.i]; step.push({ path: ['rooms', q.room, 'doors', q.i, 'action'], before: Core.clone(d.action), after: { room: d.action.room } }); });
        });
        hits.forEach(function (h) { step.push({ path: rowPath(h.list, h.i), before: Core.clone(h.row), after: undefined }); });
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
        if (prevMode === 'land' && ED.land && ED.land.stroke) landStrokeEnd();
        if (prevMode === 'land') ED.landCam = Object.assign({}, ED.cam);
        ED.mode = mode || (W.hqWorldDocIsOwn(id) && ED.doc.rooms[id] ? 'world' : 'library');
        if (prevMode === 'land' && ED.mode !== 'land') landUninstall();   // E4: the game's own land comes back
        if (ED.mode === 'land' && !DOOR_HQ.rooms[LAND_ROOM]) landRoom();
        ED.roomId = id; ED.libRoom = ED.mode === 'library' ? id : null;
        if (prevRoom !== id || prevMode !== ED.mode) { ED.sel = []; if (!o.keepCam) camHome(o.at); }
        ED.ready = false;
        ED.hook.play = false;
        clearTimeout(ED.reloadTimer); ED.reloadTimer = null;
        ED.stroke = null; ED.auditRes = {};
        var ok = W._hqEditEnter({ room: id, edit: ED.hook, onReady: function () { ED.ready = true; rebuildProxies(); bandClip(); auditSoon(); status(); }, onEscape: null });
        if (!ok) { toast('THE ROOM DID NOT BUILD · ' + id, 5000); return false; }
        if (!ED.rmb) lookLock(false);   // THE POINTER: a lock the walk carried back from PLAY HERE goes
        overlayBuild();
        landMapShow();
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
        if (ED.mode === 'land' && ED.land) return W.hqLandEdHeight(ED.land.E, x, z);   // E4: his land, straight from memory
        try {
            var r = room(), ti = r && r.terrain && r._terrainInfo;
            if (ti && typeof W.hqTerrainHeight === 'function') { var h = W.hqTerrainHeight(ti, x, z); if (isFinite(h)) return h + strokeDelta(ti, x, z); }
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
        grid.position.y = 0.03 * u; grid.visible = ED.grid && ED.mode !== 'land'; grid.renderOrder = 11; G.add(grid); ED.gridObj = grid;
        /* the spawn: a cone pointing where the walker faces (picked as 'spawn') */
        var sp = new THREE.Mesh(new THREE.ConeGeometry(0.35 * u, 1.1 * u, 12), new THREE.MeshBasicMaterial({ color: 0x57f287, transparent: true, opacity: 0.85, depthTest: false, fog: false }));
        sp.rotation.x = Math.PI / 2; var spW = new THREE.Group(); spW.add(sp); spW.userData.edSel = { list: 'spawn' }; G.add(spW); ED.spawnObj = spW; spawnPlace();
        if (ED.mode === 'prefab' || ED.mode === 'land') { spW.visible = false; ED.spawnObj = null; }   // a prefab (and the land) has no spawn
        ED.pivot = new THREE.Object3D(); G.add(ED.pivot);
        /* E3: the brush's ring (it follows the ground under the cursor while a ground tool is armed) */
        var rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(65 * 3), 3));
        ED.ring = new THREE.Line(rg, new THREE.LineBasicMaterial({ color: 0xffd84a, transparent: true, opacity: 0.95, depthTest: false, fog: false })); ED.ring.renderOrder = 14; ED.ring.visible = false; ED.ring.frustumCulled = false; G.add(ED.ring);
        ED.auditObjs = []; ED.fightObj = null; ED.fightKey = '';
        tcBuild();
        rebuildProxies();
        if (ED.mode === 'land') { if (ED.land) ED.land.lineObj = null; return; }   // E4: the land's near camera is the renderer's (the far pass draws past it)
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
            if (ED.band.on && !boxes.some(function (b) { return bandHas(b.y0, b.y1); })) return;   // E3: the level band — only the rows in it pick
            var grp = new THREE.Group(); grp.userData.edSel = { list: 'terrain.features', id: row.id };
            boxes.forEach(function (b) {
                var m = new THREE.Mesh(new THREE.BoxGeometry(b.w * u, (b.y1 - b.y0) * u, b.L * u), _proxyMat);
                m.position.set(b.cx * u, (b.y0 + b.y1) / 2 * u, b.cz * u); m.rotation.y = b.yaw; grp.add(m);
            });
            ED.group.add(grp);
            ED.proxies.push({ obj: grp, own: true, sel: grp.userData.edSel });
        });
        (V.props || []).forEach(function (p) { if (p.row && p.row.id && p.grp && objInBand(p.grp)) { p.grp.userData.edSel = { list: 'props', id: p.row.id }; ED.proxies.push({ obj: p.grp, own: false, sel: p.grp.userData.edSel }); } });
        (V.doors || []).forEach(function (d) { if (d.door && d.door.id && d.group && objInBand(d.group) && (r.doors || []).some(function (x) { return x && x.id === d.door.id; })) { d.group.userData.edSel = { list: 'doors', id: d.door.id }; ED.proxies.push({ obj: d.group, own: false, sel: d.group.userData.edSel }); } });
        if (ED.spawnObj) ED.proxies.push({ obj: ED.spawnObj, own: false, sel: { list: 'spawn' } });
        /* E2: the people's spots, the agents, the online spots and the signs, as posts */
        ['npcSpots', 'agents', 'onlineSpots', 'counters'].forEach(function (list) { (listOf(r, list) || []).forEach(function (row) { if (!row || row.id == null || !isFinite(row.x) || !isFinite(row.z)) return; var m = markerObj(list, row); if (!objInBand(m)) return; ED.group.add(m); ED.proxies.push({ obj: m, own: true, sel: m.userData.edSel }); }); });
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
            if ((ED.mode === 'world' || ED.mode === 'land') && !H.stage) { var g = ground(c.x, c.z); pl.x = c.x; pl.z = c.z; pl.y = g; pl.visY = g; }
        }
        for (var i = 0; i < ED.boxes.length; i++) ED.boxes[i].update();
        var now = performance.now();
        /* E3: a brush held on the ground works every frame (the cursor re-read each frame: the ground under it is moving) */
        if (ED.mode === 'land' && ED.land && ED.land.stroke) {   // E4: a land brush held (the 3D cursor re-read; the map's comes from its own mouse)
            if (ED.opts.landView !== 'map' && ED.mouse.in) { var lc = rayGround(ED.mouse.x, ED.mouse.y); if (lc) { ED.cursor = lc; ED.land.stroke.at = lc; } }
            landDab(Math.min(0.05, dt));
        }
        else if (ED.stroke && ED.stroke.tool !== 'gramp' && ED.mouse.in) { var sc = rayGround(ED.mouse.x, ED.mouse.y); if (sc) { ED.cursor = sc; ED.cursorAt = now; strokeDab(ED.stroke, sc, Math.min(0.05, dt)); } }
        else if (ED.mouse.in && now - ED.cursorAt > 90) { ED.cursorAt = now; ED.cursor = rayGround(ED.mouse.x, ED.mouse.y); }
        ringUpdate();
        if (ED.audit.fight && now - ED.fightAt > 200) { ED.fightAt = now; fightShow(); }
        if (ED.band.on && now - (ED.bandAt || 0) > 1000) { ED.bandAt = now; bandClip(false); }   // the models that load late are cut too
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
        var t = 0, stepM = 0.5, maxT = ED.mode === 'land' ? 6000 : 600, prev = null;
        for (; t < maxT; t += stepM) {
            var x = o.x + d.x * t, y = o.y + d.y * t, z = o.z + d.z * t, g = ground(x, z);
            if (y <= g) {
                if (prev) { var lo = prev, hi = t; for (var i = 0; i < 8; i++) { var m = (lo + hi) / 2, gm = ground(o.x + d.x * m, o.z + d.z * m); if (o.y + d.y * m <= gm) hi = m; else lo = m; } t = hi; }
                return { x: o.x + d.x * t, y: ground(o.x + d.x * t, o.z + d.z * t), z: o.z + d.z * t };
            }
            prev = t;
            if (t > 40) stepM = 1.5;
            if (t > 300 && ED.mode === 'land') stepM = t > 1500 ? 16 : 6;
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
        doorway:  { label: 'DOOR', how: 'doorway', tip: 'Click a wall you drew (the door stands in a gap) or the ground (free-standing); then pick where it leads.' },
        /* E3 (EDITOR_PLAN §5.4): the floating pieces on BUILD; the ground's brushes, paint and water on GROUND */
        platform: { label: 'PLATFORM', how: 'rect', tip: 'Drag a rectangle: a floating platform at HEIGHT (its top is ground, nothing joins it to the floor; reach it by stairs, a ramp or a climb).' },
        deck:     { label: 'DECK', how: 'rect', tip: 'Drag a rectangle: a deck with rails at HEIGHT (walk on it and under it).' },
        raise:    { label: 'RAISE', how: 'brush', tab: 'ground', tip: 'Hold the left mouse: the ground rises under the brush. SHIFT lowers.' },
        lower:    { label: 'LOWER', how: 'brush', tab: 'ground', tip: 'Hold the left mouse: the ground sinks under the brush. SHIFT raises.' },
        smooth:   { label: 'SMOOTH', how: 'brush', tab: 'ground', tip: 'Hold the left mouse: bumps and edges even out.' },
        flatten:  { label: 'FLATTEN', how: 'brush', tab: 'ground', tip: 'Hold the left mouse: the ground goes to the height where the stroke started.' },
        terrace:  { label: 'TERRACE', how: 'brush', tab: 'ground', tip: 'Hold the left mouse: the ground steps into levels STEP m apart.' },
        gramp:    { label: 'RAMP', how: 'brush', tab: 'ground', tip: 'Drag from the foot to the head: an even incline between the two grounds, as wide as the brush.' },
        cliff:    { label: 'CLIFF', how: 'brush', tab: 'ground', tip: 'Hold the left mouse: the ground rises CLIFF m over where the stroke started, with a sheer face the walker cannot climb.' },
        set:      { label: 'SET', how: 'brush', tab: 'ground', tip: 'Hold the left mouse: the ground goes to HEIGHT (absolute).' },
        gpaint:   { label: 'PAINT', how: 'brush', tab: 'ground', tip: 'Pick a sheet below, then hold the left mouse: it goes on the ground under the brush (up to 8 sheets a room). ERASE takes it off.' },
        pool:     { label: 'POOL', how: 'disc', tab: 'ground', tip: 'Drag from the middle to the rim: a pond, its surface just under the lowest ground round it.' },
        stream:   { label: 'STREAM', how: 'course', tab: 'ground', tip: 'Click along its course; ENTER ends it (ESC drops it): a stream, its level just under the lowest ground along it.' },
    };
    function drawSet(tool) {
        drawPreview(null);
        if (ED.stroke) strokeEnd();
        ED.draw = tool ? { tool: tool, a: null, chain0: null, b: null, pts: null } : null;
        if (tool) { select(null); if (DRAWS[tool]) toast(DRAWS[tool].tip, 3200); }
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
        if (how === 'brush') {   // E3: the ring is the brush's preview; the ground RAMP also shows its run while dragged
            var S0 = ED.stroke; drawPreview(S0 && S0.tool === 'gramp' && S0.a ? [segPv(S0.a, p, 2 * O.brushR, Math.min(S0.a.y, g) - 0.05, Math.max(S0.a.y, g) + 0.05)] : null);
            ED._drawInfo = S0 && S0.tool === 'gramp' && S0.a ? rampInfo(S0.a, p) : ''; return;
        }
        out.push({ cx: p.x, cz: p.z, w: 0.3, L: 0.3, y0: g, y1: g + 0.6 });   // the cursor's post
        if (a && how === 'chain') out.push(segPv(a, p, O.wallT, g, g + O.wallH));
        if (a && how === 'line') out.push(segPv(a, p, 2, g, g + Math.max(0.3, O.height)));
        if (how === 'course' && D.pts && D.pts.length) { for (var ci = 0; ci + 1 < D.pts.length; ci++) out.push(segPv(D.pts[ci], D.pts[ci + 1], O.streamW, ground(D.pts[ci].x, D.pts[ci].z) - 0.1, ground(D.pts[ci].x, D.pts[ci].z) + 0.1)); out.push(segPv(D.pts[D.pts.length - 1], p, O.streamW, g - 0.1, g + 0.1)); }
        if (a && how === 'rect') {
            var R = rectOf(a, p), top = (D.tool === 'slab' || D.tool === 'platform' || D.tool === 'deck') ? O.height : D.tool === 'building' ? g + O.storeys * 3.5 : g + O.wallH, bot = D.tool === 'slab' ? O.height - 0.28 : D.tool === 'platform' ? O.height - 0.8 : D.tool === 'deck' ? O.height - 0.3 : g;
            if (D.tool === 'room') { var c = [{ x: R.x0, z: R.z0 }, { x: R.x1, z: R.z0 }, { x: R.x1, z: R.z1 }, { x: R.x0, z: R.z1 }]; for (var i = 0; i < 4; i++) out.push(segPv(c[i], c[(i + 1) % 4], O.wallT, bot, top)); }
            else out.push({ cx: (R.x0 + R.x1) / 2, cz: (R.z0 + R.z1) / 2, w: R.x1 - R.x0, L: R.z1 - R.z0, y0: bot, y1: top });
        }
        drawPreview(out);
        if (how === 'disc' && a) ED._disc = { x: a.x, z: a.z, r: Math.hypot(p.x - a.x, p.z - a.z) }; else ED._disc = null;
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
        if (how === 'rect' || how === 'line' || how === 'disc') { D.a = p; D.b = p; return; }
        if (how === 'brush') strokeStart(e);
    }
    function drawUp(e) {
        var D = ED.draw; if (!D) return;
        var how = DRAWS[D.tool] ? DRAWS[D.tool].how : 'click', O = ED.opts, p = drawPt(e.clientX, e.clientY, e);
        if (how === 'doorway') { doorClick(e); return; }
        if (D.tool === 'paint') { paintAt(e); return; }
        if (how === 'brush') { strokeEnd(e); return; }
        if (how === 'course') { if (p) { D.pts = D.pts || []; var lp = D.pts[D.pts.length - 1]; if (!lp || Math.hypot(p.x - lp.x, p.z - lp.z) > 0.3) D.pts.push(p); drawShow(p); } return; }
        if (how === 'disc') { var a0 = D.a; D.a = null; drawPreview(null); ED._disc = null; if (a0 && p) poolAt(a0, Math.hypot(p.x - a0.x, p.z - a0.z)); return; }
        if (how === 'click') {   // a shape from the ADD list, dropped where clicked
            var c = rayGround(e.clientX, e.clientY); if (!c) return;
            if (D.entry) { palDrop(D, c); return; }   // E2: a palette tile
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
        } else if (D.tool === 'platform') {
            drawRows([{ k: 'plateau', x: cx, z: cz, w: w, d: d, h: O.height, float: true }], 'floating platform');
        } else if (D.tool === 'deck') {
            var dk = w >= d ? { k: 'bridge', x0: R.x0, z0: cz, x1: R.x1, z1: cz, w: d } : { k: 'bridge', x0: cx, z0: R.z0, x1: cx, z1: R.z1, w: w };
            dk.y = O.height; if (O.floorKey) dk.key = O.floorKey;
            drawRows([dk], 'deck');
        } else if (D.tool === 'building') {
            /* the front faces the way the drag ended (the lot's +z): dragged down = south, up = north, … */
            var rot = Math.abs(p.z - a.z) >= Math.abs(p.x - a.x) ? (p.z >= a.z ? 0 : 180) : (p.x >= a.x ? 270 : 90), turned = rot === 90 || rot === 270;
            drawRows([{ k: 'texbuilding', x: cx, z: cz, w: turned ? d : w, d: turned ? w : d, rot: rot, storeys: Math.max(1, Math.round(O.storeys)) }], 'building');
        }
    }
    function drawKey(k) {   // → true when the draw tool took the key
        var D = ED.draw; if (!D) return false;
        if (D.tool === 'stream' && (k === 'enter' || k === 'escape') && D.pts && D.pts.length) { var pts = D.pts; D.pts = null; drawPreview(null); if (k === 'enter') streamOf(pts); return true; }
        if (DRAWS[D.tool] && DRAWS[D.tool].how === 'brush' && (k === '[' || k === ']')) { ED.opts.brushR = Math.max(0.5, Math.min(60, Math.round(ED.opts.brushR * (k === ']' ? 1.25 : 0.8) * 4) / 4)); saveOpts(); toast('BRUSH ' + ED.opts.brushR + ' m', 900); panels(); return true; }
        if (k === 'escape' || k === 'enter') { if (D.a) { D.a = null; D.chain0 = null; drawPreview(null); } else drawSet(null); return true; }
        return false;
    }
    /* DOOR / WINDOW on the wall under the cursor: the opening row names the wall by id, `at` metres along it from its start */
    /* ══ THE GROUND (E3, EDITOR_PLAN §5.4): the brushes write the room's HEIGHT grid (terrain.hmap, a delta over the rows) and its
       PAINT grid (terrain.paint, a sheet per node) on the compiled field's own lattice (data.js hqGrid*). A stroke moves the field
       mesh live while the button is held and lands as ONE undo step on the release (the room then rebuilds from the grids) ═══ */
    var FALL = { smooth: function (t) { var q = 1 - t * t; return q * q; }, linear: function (t) { return 1 - t; }, hard: function () { return 1; } };
    var PAINT_MAX = 8;
    function termInfo() { var r = room(); if (!r || !r.terrain) return null; try { return r._terrainInfo || (W.hqTerrainInfo ? W.hqTerrainInfo(ED.roomId) : null); } catch (e) { return null; } }
    /* the live stroke's height change at (x, z) (the cursor and the ring ride the moving ground); 0 with no height stroke */
    function strokeDelta(ti, x, z) {
        var S = ED.stroke; if (!S || !S.Dw || S.info !== ti) return 0;
        var fx = (x - ti.x0) / ti.res, fz = (z - ti.z0) / ti.res, i = Math.floor(fx), j = Math.floor(fz);
        if (i < 0 || j < 0 || i >= ti.nx - 1 || j >= ti.nz - 1) return 0;
        var tx = fx - i, tz = fz - j, nx = ti.nx, k = j * nx + i, d = function (q) { return S.Dw[q] - S.D0[q]; };
        return (d(k) * (1 - tx) + d(k + 1) * tx) * (1 - tz) + (d(k + nx) * (1 - tx) + d(k + nx + 1) * tx) * tz;
    }
    /* the field's meshes (one, or its tiles) with the lattice block each holds (a tile's vertices run row by row over its block) */
    function fieldMeshes(info) {
        var out = [], u = U(), G = ED.view && ED.view.shellGroup; if (!G) return out;
        G.traverse(function (o) {
            if (!o._ew_hqTerrain || !o.geometry || !o.geometry.attributes || !o.geometry.attributes.position) return;
            var P = o.geometry.attributes.position.array, n = P.length / 3, i0 = Infinity, j0 = Infinity, i1 = -Infinity, j1 = -Infinity;
            for (var v = 0; v < n; v++) { var i = Math.round((P[v * 3] / u - info.x0) / info.res), j = Math.round((P[v * 3 + 2] / u - info.z0) / info.res); if (i < i0) i0 = i; if (i > i1) i1 = i; if (j < j0) j0 = j; if (j > j1) j1 = j; }
            var bw = i1 - i0 + 1; if (bw * (j1 - j0 + 1) !== n) return;   // not the lattice
            out.push({ g: o.geometry, i0: i0, j0: j0, i1: i1, j1: j1, bw: bw });
        });
        return out;
    }
    function strokeStart(e) {
        var D = ED.draw; if (!D) return;
        if (ED.mode !== 'world' || !editable()) { toast('THE GROUND BRUSHES WORK IN YOUR OWN ROOMS (not a prefab, not the library)'); return; }
        var r = room(), info = termInfo();
        if (!r || !r.terrain || !info || !ED.ready) { toast('THE ROOM IS STILL BUILDING'); return; }
        var c = rayGround(e.clientX, e.clientY); if (!c) return;
        var n = info.nx * info.nz, S = { tool: D.tool, info: info, h0: c.y, a: c, meshes: fieldMeshes(info), any: false };
        if (D.tool === 'gpaint') {
            var T = r.terrain, pal = (T.paint && Array.isArray(T.paint.pal)) ? T.paint.pal.slice() : [];
            if (ED.opts.paintErase) S.val = 0;
            else {
                var key = ED.opts.paintKey; if (!key) { toast('PICK A SHEET FIRST (+ SHEET, below the tools)'); return; }
                var pi = pal.indexOf(key);
                if (pi < 0) { if (pal.length >= PAINT_MAX) { toast('THIS ROOM HAS ' + PAINT_MAX + ' SHEETS · remove one first'); return; } pal.push(key); pi = pal.length - 1; }
                S.val = pi + 1;
            }
            S.pal = pal;
            S.P0 = (info.paint && info.paint.P) ? info.paint.P : new Uint8Array(n); S.Pw = new Uint8Array(S.P0);
            /* live only when the field was built with that sheet in its material (a new sheet shows once the stroke lands) */
            S.live = !!(info.paint && info.paint.pal && info.paint.pal.length >= S.val && S.meshes.length && S.meshes[0].g.attributes.aPaintA);
            if (!S.live && S.val > 0) toast('A NEW SHEET · it shows when you let go', 1600);
        } else {
            var dec = r.terrain.hmap && W.hqGridDecode ? W.hqGridDecode(r.terrain.hmap) : null, D0 = new Float32Array(n);
            if (dec) for (var j = 0; j < info.nz; j++) for (var i = 0; i < info.nx; i++) D0[j * info.nx + i] = W.hqGridHeightAt(dec, info.x0 + i * info.res, info.z0 + j * info.res);
            S.H = info.H; S.D0 = D0; S.Dw = new Float32Array(D0);
        }
        ED.stroke = S;
        if (S.tool !== 'gramp') strokeDab(S, c, 1 / 60);
    }
    function strokeDab(S, c, dt) {
        if (!S || S.tool === 'gramp') return;
        var info = S.info, O = ED.opts, R = Math.max(0.25, +O.brushR || 4), res = info.res, nx = info.nx, nz = info.nz;
        var str = Math.max(0.02, Math.min(1, +O.brushS || 0.5)), fall = FALL[O.brushFall] || FALL.smooth;
        var i0 = Math.max(0, Math.floor((c.x - R - info.x0) / res)), i1 = Math.min(nx - 1, Math.ceil((c.x + R - info.x0) / res));
        var j0 = Math.max(0, Math.floor((c.z - R - info.z0) / res)), j1 = Math.min(nz - 1, Math.ceil((c.z + R - info.z0) / res));
        if (i0 > i1 || j0 > j1) return;
        var T = S.tool, touched = [], cur = function (k) { return S.H[k] + S.Dw[k] - S.D0[k]; }, avg = null, bw = i1 - i0 + 1, i, j, k;
        if (T === 'smooth') {   // the 3 × 3 mean of the ground as it stands before this dab
            avg = new Float32Array(bw * (j1 - j0 + 1));
            for (j = j0; j <= j1; j++) for (i = i0; i <= i1; i++) {
                var s = 0, m = 0; for (var dj = -1; dj <= 1; dj++) for (var di = -1; di <= 1; di++) { var ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= nx || jj >= nz) continue; s += cur(jj * nx + ii); m++; }
                avg[(j - j0) * bw + (i - i0)] = s / m;
            }
        }
        for (j = j0; j <= j1; j++) for (i = i0; i <= i1; i++) {
            var x = info.x0 + i * res, z = info.z0 + j * res, d = Math.hypot(x - c.x, z - c.z); if (d > R) continue;
            var f = fall(d / R); k = j * nx + i;
            if (T === 'gpaint') { if (f < 0.3) continue; if (S.Pw[k] !== S.val) { S.Pw[k] = S.val; touched.push(k); } continue; }
            var h = cur(k), tgt = null;
            if (T === 'raise' || T === 'lower') { S.Dw[k] += ((T === 'raise') !== !!ED.keys.shift ? 1 : -1) * 4 * str * f * dt; touched.push(k); continue; }
            if (T === 'cliff') { tgt = S.h0 + (+O.cliffH || 3); if (h < tgt - 1e-4) { S.Dw[k] += tgt - h; touched.push(k); } continue; }   // a hard edge: the face is as sheer as the lattice
            if (T === 'smooth') tgt = avg[(j - j0) * bw + (i - i0)];
            else if (T === 'flatten') tgt = S.h0;
            else if (T === 'terrace') { var st = Math.max(0.1, +O.terraceH || 1); tgt = Math.round(h / st) * st; }
            else if (T === 'set') tgt = +O.setH || 0;
            if (tgt == null || Math.abs(tgt - h) < 1e-4) continue;
            S.Dw[k] += (tgt - h) * Math.min(1, str * f * dt * 10); touched.push(k);
        }
        if (touched.length) { S.any = true; meshLive(S, touched); }
    }
    /* the stroke on the mesh: the vertices' heights (and their light) or their painted sheet */
    function meshLive(S, touched) {
        var u = U(), nx = S.info.nx, paint = S.tool === 'gpaint';
        if (paint && !S.live) return;
        S.meshes.forEach(function (M) {
            var g = M.g, P = g.attributes.position, PA = paint ? [g.attributes.aPaintA, g.attributes.aPaintB, g.attributes.aPaintC] : null, hit = false;
            if (paint && !PA[0]) return;
            for (var t = 0; t < touched.length; t++) {
                var k = touched[t], i = k % nx, j = (k - i) / nx; if (i < M.i0 || i > M.i1 || j < M.j0 || j > M.j1) continue;
                var v = (j - M.j0) * M.bw + (i - M.i0); hit = true;
                if (paint) { for (var q = 0; q < 3; q++) { var ar = PA[q].array; ar[v * 3] = ar[v * 3 + 1] = ar[v * 3 + 2] = 0; } var val = S.Pw[k]; if (val > 0) { var qq = val - 1; PA[(qq / 3) | 0].array[v * 3 + (qq % 3)] = 1; } }
                else P.array[v * 3 + 1] = (S.H[k] + S.Dw[k] - S.D0[k]) * u;
            }
            if (!hit) return;
            if (paint) PA.forEach(function (a) { a.needsUpdate = true; });
            else { P.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere(); g.computeBoundingBox(); }
        });
    }
    /* the ground RAMP: an even incline from the foot (where the drag began) to the head, as wide as the brush, a metre's ease each side */
    function rampApply(S, p) {
        var info = S.info, a = S.a, R = Math.max(0.25, +ED.opts.brushR || 4), res = info.res, nx = info.nx;
        var dx = p.x - a.x, dz = p.z - a.z, L = Math.hypot(dx, dz); if (L < 0.5) return;
        var ux = dx / L, uz = dz / L, yb = ground(p.x, p.z), ya = a.y, pad = R + 1, touched = [];
        var i0 = Math.max(0, Math.floor((Math.min(a.x, p.x) - pad - info.x0) / res)), i1 = Math.min(nx - 1, Math.ceil((Math.max(a.x, p.x) + pad - info.x0) / res));
        var j0 = Math.max(0, Math.floor((Math.min(a.z, p.z) - pad - info.z0) / res)), j1 = Math.min(info.nz - 1, Math.ceil((Math.max(a.z, p.z) + pad - info.z0) / res));
        for (var j = j0; j <= j1; j++) for (var i = i0; i <= i1; i++) {
            var x = info.x0 + i * res, z = info.z0 + j * res, s = (x - a.x) * ux + (z - a.z) * uz, v = Math.abs(-(x - a.x) * uz + (z - a.z) * ux);
            if (s < 0 || s > L || v > pad) continue;
            var k = j * nx + i, w = v <= R ? 1 : 1 - (v - R), tgt = ya + (yb - ya) * (s / L), h = S.H[k] + S.Dw[k] - S.D0[k];
            S.Dw[k] += (tgt - h) * w; touched.push(k);
        }
        if (touched.length) S.any = true;
    }
    function rampInfo(a, p) {
        var run = Math.hypot(p.x - a.x, p.z - a.z), rise = ground(p.x, p.z) - a.y, info = termInfo(), max = info && info.rules ? info.rules.maxSlope : 1;
        var gr = run > 0.01 ? Math.abs(rise) / run : 0;
        return 'run ' + run.toFixed(1) + ' m · rise ' + rise.toFixed(2) + ' m · grade ' + gr.toFixed(2) + (gr > max ? ' · TOO STEEP TO WALK' : '');
    }
    function strokeEnd(e) {
        var S = ED.stroke; if (!S) return; ED.stroke = null;
        var r = room(); if (!r || !r.terrain || ED.mode !== 'world' || !editable()) return;
        var info = S.info, T = r.terrain, base = basePath().concat(['terrain']), label = (DRAWS[S.tool] ? DRAWS[S.tool].label : S.tool).toLowerCase();
        if (S.tool === 'gramp') { var p = (e && isFinite(e.clientX) ? rayGround(e.clientX, e.clientY) : null) || ED.cursor; if (p) rampApply(S, p); ED._drawInfo = ''; drawPreview(null); }
        if (!S.any) return;
        if (S.tool === 'gpaint') {
            var g = W.hqGridEncode('u8', S.Pw, info.nx, info.nz, info.x0, info.z0, info.res);
            var after = g ? Object.assign({ pal: S.pal }, g) : (S.pal.length ? { pal: S.pal } : undefined);
            commit([{ path: base.concat(['paint']), before: T.paint ? Core.clone(T.paint) : undefined, after: after }], S.val ? 'paint the ground' : 'erase paint');
            return;
        }
        var gh = W.hqGridEncode('i16', S.Dw, info.nx, info.nz, info.x0, info.z0, info.res);
        if (!gh && !T.hmap) { reloadSoon(); return; }
        commit([{ path: base.concat(['hmap']), before: T.hmap ? Core.clone(T.hmap) : undefined, after: gh || undefined }], label);
    }
    /* the ring: the brush's reach on the ground under the cursor (or a pond's rim while it is dragged) */
    function ringUpdate() {
        var RG = ED.ring; if (!RG) return;
        var D = ED.draw, how = D && DRAWS[D.tool] ? DRAWS[D.tool].how : null, c = ED.cursor, at = null, rad = 0;
        if (how === 'brush' && c && (ED.mouse.in || ED.stroke)) { at = c; rad = +ED.opts.brushR || 4; }
        else if (ED.mode === 'land' && ED.land && LAND_TOOLS[landTool()].how === 'brush' && c && (ED.mouse.in || ED.land.stroke)) { at = c; rad = +ED.opts.landR || 40; }
        else if (how === 'disc' && ED._disc && ED._disc.r > 0.05) { at = ED._disc; rad = ED._disc.r; }
        if (!at) { RG.visible = false; return; }
        var P = RG.geometry.attributes.position, u = U();
        for (var i = 0; i <= 64; i++) { var an = i / 64 * Math.PI * 2, x = at.x + Math.cos(an) * rad, z = at.z + Math.sin(an) * rad; P.setXYZ(i, x * u, (ground(x, z) + 0.08) * u + 0.3, z * u); }
        P.needsUpdate = true; RG.visible = true;
    }
    /* THE WATER: a pond from its middle to its rim, a stream along its course — each sits just under the lowest ground round it */
    function poolAt(a, rad) {
        if (!(rad >= 0.5)) { toast('DRAG FROM THE MIDDLE OUT TO THE RIM'); return; }
        var lo = Infinity, O = ED.opts; rad = Math.round(rad * 4) / 4;
        for (var i = 0; i < 32; i++) { var an = i / 32 * Math.PI * 2; lo = Math.min(lo, ground(a.x + Math.cos(an) * rad, a.z + Math.sin(an) * rad)); }
        var row = { k: 'pool', x: Math.round(a.x * 4) / 4, z: Math.round(a.z * 4) / 4, r: rad, y: Math.round((lo - 0.1) * 100) / 100, depth: Math.max(0.2, +O.waterDepth || 0.8) };
        if (O.waterKey && O.waterKey !== 'water') row.key = O.waterKey;
        drawRows([row], 'pool');
    }
    function streamOf(pts) {
        if (!pts || pts.length < 2) { toast('A STREAM NEEDS TWO POINTS OR MORE'); return; }
        var lo = Infinity, O = ED.opts;
        for (var i = 0; i + 1 < pts.length; i++) for (var t = 0; t <= 8; t++) { var x = pts[i].x + (pts[i + 1].x - pts[i].x) * t / 8, z = pts[i].z + (pts[i + 1].z - pts[i].z) * t / 8; lo = Math.min(lo, ground(x, z)); }
        var row = { k: 'stream', pts: pts.map(function (p) { return [Math.round(p.x * 4) / 4, Math.round(p.z * 4) / 4]; }), w: Math.max(0.5, +O.streamW || 2.4), y: Math.round((lo - 0.15) * 100) / 100, depth: Math.max(0.2, +O.waterDepth || 0.6) };
        if (O.waterKey && O.waterKey !== 'water') row.key = O.waterKey;
        drawRows([row], 'stream');
    }
    /* the room's sheets: add one (it goes in the palette at once, so a stroke with it shows live), remove one (the painted nodes
       of that sheet go back to the floor, the later sheets move down one), clear a grid */
    function sheetAdd() {
        var r = room(); if (!r || !r.terrain || ED.mode !== 'world' || !editable()) return;
        texPick(ED.opts.paintKey, function (key) {
            if (!key) return;
            ED.opts.paintKey = key; ED.opts.paintErase = false; saveOpts();
            var T = r.terrain, pal = (T.paint && T.paint.pal) || [];
            if (pal.indexOf(key) >= 0) { panels(); return; }
            if (pal.length >= PAINT_MAX) { toast('THIS ROOM HAS ' + PAINT_MAX + ' SHEETS · remove one first'); panels(); return; }
            var after = T.paint ? Core.clone(T.paint) : {}; after.pal = pal.concat([key]);
            commit([{ path: basePath().concat(['terrain', 'paint']), before: T.paint ? Core.clone(T.paint) : undefined, after: after }], 'add sheet ' + key);
        });
    }
    function sheetRemove(key) {
        var r = room(); if (!r || !r.terrain || !r.terrain.paint || !editable()) return;
        var P = r.terrain.paint, q = (P.pal || []).indexOf(key); if (q < 0) return;
        var pal = P.pal.filter(function (k, i) { return i !== q; }), dec = W.hqGridDecode(P), after = { pal: pal };
        if (dec) {
            var v = new Uint8Array(dec.a.length); for (var i = 0; i < v.length; i++) { var x = dec.a[i]; v[i] = x === q + 1 ? 0 : x > q + 1 ? x - 1 : x; }
            var g = W.hqGridEncode('u8', v, dec.nx, dec.nz, dec.x0, dec.z0, dec.res); if (g) Object.assign(after, g);
        }
        if (ED.opts.paintKey === key) { ED.opts.paintKey = pal[0] || ''; saveOpts(); }
        commit([{ path: basePath().concat(['terrain', 'paint']), before: Core.clone(P), after: pal.length ? after : undefined }], 'remove sheet ' + key);
    }
    function groundClear(which) {
        var r = room(); if (!r || !r.terrain || !editable() || !r.terrain[which]) { toast('NOTHING TO CLEAR'); return; }
        var T = r.terrain, after;
        if (which === 'paint') after = (T.paint.pal && T.paint.pal.length) ? { pal: T.paint.pal.slice() } : undefined;
        commit([{ path: basePath().concat(['terrain', which]), before: Core.clone(T[which]), after: after }], which === 'hmap' ? 'clear the heights' : 'clear the paint');
    }
    function groundHtml() {
        var r = room(), T = (r && r.terrain) || {}, O = ED.opts, D = ED.draw, pal = (T.paint && T.paint.pal) || [], h = '';
        if (D && D.tool === 'gpaint') {
            h += '<div class="ed-sub">SHEETS · ' + pal.length + ' / ' + PAINT_MAX + '</div><div class="ed-palb">';
            pal.forEach(function (k) { h += '<button class="ed-btn' + (!O.paintErase && O.paintKey === k ? ' on' : '') + '" data-gsheet="' + esc(k) + '" title="' + esc(k) + '"' + texSwatchStyle(k) + '>' + esc(k.replace(/^urban:/, '')) + '</button>'; });
            h += '<button class="ed-btn" data-gact="add" title="Pick a sheet from the game\'s textures">+ SHEET</button><button class="ed-btn' + (O.paintErase ? ' on' : '') + '" data-gact="erase" title="Take the paint off (back to the room\'s floor)">ERASE</button>';
            if (!O.paintErase && O.paintKey && pal.indexOf(O.paintKey) >= 0) h += '<button class="ed-btn ed-danger" data-gact="del" title="Remove this sheet from the room (its paint goes)">✕ SHEET</button>';
            h += '</div>';
        }
        h += '<div class="ed-acts"><button class="ed-btn" data-gact="clrh"' + (T.hmap ? '' : ' disabled') + '>CLEAR HEIGHTS</button><button class="ed-btn" data-gact="clrp"' + (T.paint && T.paint.d ? '' : ' disabled') + '>CLEAR PAINT</button></div>';
        return h;
    }
    function groundWire(L) {
        L.querySelectorAll('[data-gsheet]').forEach(function (b) { b.onclick = function () { ED.opts.paintKey = b.getAttribute('data-gsheet'); ED.opts.paintErase = false; saveOpts(); panels(); }; });
        L.querySelectorAll('[data-gact]').forEach(function (b) {
            b.onclick = function () {
                var a = b.getAttribute('data-gact');
                if (a === 'add') sheetAdd(); else if (a === 'erase') { ED.opts.paintErase = !ED.opts.paintErase; saveOpts(); panels(); }
                else if (a === 'del') sheetRemove(ED.opts.paintKey); else if (a === 'clrh') groundClear('hmap'); else if (a === 'clrp') groundClear('paint');
            };
        });
    }

    /* ══ THE LEVEL BAND (E3, §5.4): only the rows whose height overlaps the band pick; everything above its top is cut away in the
       view (a clipping plane on the room's own materials), so a floor of a building is worked on from above ══════════════ */
    function bandHas(y0, y1) { return !ED.band.on || (y1 >= ED.band.y0 && y0 <= ED.band.y1); }
    var _bb = null;
    function objInBand(obj) {
        if (!ED.band.on || !obj) return true;
        try { obj.updateMatrixWorld(true); _bb = _bb || new THREE.Box3(); _bb.setFromObject(obj); if (_bb.isEmpty()) return true; var u = U(); return bandHas(_bb.min.y / u, _bb.max.y / u); } catch (e) { return true; }
    }
    function rowInBand(row) {
        if (!ED.band.on) return true;
        var b = []; try { b = Core.rowShape(row, ground, function (r2) { try { return W.hqRowExpand ? W.hqRowExpand(r2) : []; } catch (e) { return []; } }); } catch (e) {}
        return !b.length || b.some(function (x) { return bandHas(x.y0, x.y1); });
    }
    function bandClipOff() {
        ED.clipMats.forEach(function (c) { try { c.m.clippingPlanes = c.prev; c.m.needsUpdate = true; } catch (e) {} });
        ED.clipMats = []; ED.clipSet = null;
    }
    /* full = drop what it cut and cut again (a new band, a rebuilt room); else only the materials that arrived since (a model loading) */
    function bandClip(full) {
        if (full !== false) bandClipOff();
        var V = ED.view; if (!V || !ED.band.on || ED.playing) return;
        if (!ED.clipPlane) ED.clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
        ED.clipPlane.constant = ED.band.y1 * U() + 0.3;
        if (V.renderer) V.renderer.localClippingEnabled = true;
        var seen = ED.clipSet || (ED.clipSet = new Set());
        [V.shellGroup, V.propGroup, V.doorGroup, V.charGroup].forEach(function (G) {
            if (G) G.traverse(function (o) { var M = o.material; if (!M) return; (Array.isArray(M) ? M : [M]).forEach(function (m) { if (!m || seen.has(m)) return; seen.add(m); ED.clipMats.push({ m: m, prev: m.clippingPlanes }); m.clippingPlanes = [ED.clipPlane]; m.needsUpdate = true; }); });
        });
    }
    function bandSet(o) {
        Object.assign(ED.band, o || {});
        if (!(ED.band.y1 > ED.band.y0 + 0.1)) ED.band.y1 = ED.band.y0 + 0.5;
        try { localStorage.setItem('ew_editor_band', JSON.stringify(ED.band)); } catch (e) {}
        select(null); rebuildProxies(); bandClip(true); panels();
    }
    function bandStep(dir) { var h = Math.max(0.5, ED.band.y1 - ED.band.y0); bandSet({ on: true, y0: Math.round((ED.band.y0 + dir * h) * 100) / 100, y1: Math.round((ED.band.y1 + dir * h) * 100) / 100 }); toast('LEVEL ' + ED.band.y0 + ' → ' + ED.band.y1 + ' m', 1200); }

    /* ══ THE AUDITS (E3, §5.4): marks in the view, never a gate. WALLS = an invisible wall (a step the walker is refused with
       nothing drawn there: data.js hqTerrainWallAudit), POCKETS = ground nobody can reach from the spawn or a door (hqTerrainPockets),
       FIGHT = the 8 × 8 battle window a fight would take at the cursor (hqFieldWindow: green = a tile, the lighter the higher,
       red = rock, blue = water / lava) ═════════════════════════════════════════════════════════════════════════════════ */
    function auditClear() {
        (ED.auditObjs || []).forEach(function (o) { if (o.parent) o.parent.remove(o); try { o.geometry.dispose(); o.material.dispose(); } catch (e) {} });
        ED.auditObjs = [];
    }
    function auditSoon() {
        clearTimeout(ED.auditTimer); auditClear(); ED.auditRes = {}; ED.fightKey = '';
        if (ED.audit.walls || ED.audit.pockets) ED.auditTimer = setTimeout(auditRun, 350);
    }
    function auditMarks(pts, color, post, size) {
        if (!pts.length || !ED.group) return;
        var u = U(), geo = post ? new THREE.BoxGeometry(0.14 * u, 1.4 * u, 0.14 * u) : new THREE.PlaneGeometry(size * 0.85 * u, size * 0.85 * u);
        if (!post) geo.rotateX(-Math.PI / 2);
        var M = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: post ? 0.9 : 0.5, depthWrite: false, fog: false, side: THREE.DoubleSide }), pts.length), m4 = new THREE.Matrix4();
        pts.forEach(function (p, i) { m4.makeTranslation(p.x * u, (p.y + (post ? 0.7 : 0.07)) * u + 0.3, p.z * u); M.setMatrixAt(i, m4); });
        M.instanceMatrix.needsUpdate = true; M.frustumCulled = false; M.renderOrder = 13;
        ED.group.add(M); ED.auditObjs.push(M);
    }
    function auditRun() {
        if (!ED.open || ED.playing || !ED.ready) return;
        auditClear(); ED.auditRes = {};
        var r = room(), info = termInfo();
        if (!info) { ED.auditRes.none = true; status(); return; }
        if (ED.audit.walls) {
            var walls = []; try { walls = W.hqTerrainWallAudit(info, { step: info.halfW * info.halfD > 4000 ? 1 : 0.5 }); } catch (e) { console.warn('[editor] the wall audit', e); }
            ED.auditRes.walls = walls.length; auditMarks(walls, 0xff3344, true);
        }
        if (ED.audit.pockets) {
            var from = []; if (r.spawn) from.push(r.spawn);
            (r.doors || []).forEach(function (d) { try { from.push(W.hqTerrainDoorLanding(r, d)); } catch (e) {} });
            if (!from.length) from.push({ x: 0, z: 0 });
            var pk = null; try { pk = W.hqTerrainPockets(info, from); } catch (e) { console.warn('[editor] the pockets', e); }
            ED.auditRes.pockets = pk ? pk.lost : 0; ED.auditRes.pocketM = pk ? Math.round(pk.lost * pk.cell) : 0;
            if (pk) auditMarks(pk.pts, 0xffd84a, false, Math.max(1, Math.round(1 / info.res)) * info.res);
        }
        status();
    }
    function fightShow() {
        var FO = ED.fightObj;
        var hide = function () { if (ED.fightObj) ED.fightObj.visible = false; };
        if (!ED.audit.fight || !ED.ready || !ED.roomId || !W.hqFieldWindow) { hide(); return; }
        var c = ED.cursor; if (!c) { hide(); return; }
        var key = ED.roomId + ':' + Math.round(c.x) + ',' + Math.round(c.z) + ':' + ED.undo.length;
        if (key === ED.fightKey && FO && FO.parent === ED.group) return;
        ED.fightKey = key;
        var win = null; try { win = W.hqFieldWindow(ED.roomId, { x: c.x, z: c.z }, { x: c.x, z: c.z }); } catch (e) { win = null; }
        if (!win || !win.raster || !ED.group) { hide(); ED.auditRes.fight = null; return; }
        var R = win.raster, N = R.S || 8, C = win.board.C, u = U(), x0 = (R.x0 != null) ? R.x0 : win.board.x0, z0 = (R.z0 != null) ? R.z0 : win.board.z0;
        if (!FO || FO.parent !== ED.group || FO.count !== N * N) {
            if (FO && FO.parent) FO.parent.remove(FO);
            var geo = new THREE.PlaneGeometry(1, 1); geo.rotateX(-Math.PI / 2);
            FO = ED.fightObj = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false, fog: false, side: THREE.DoubleSide }), N * N);
            FO.frustumCulled = false; FO.renderOrder = 13; ED.group.add(FO);
        }
        var m4 = new THREE.Matrix4(), col = new THREE.Color(), n = 0, ins = 0, maxT = 1;
        for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) { var cc = R.cells[y] && R.cells[y][x]; if (cc && cc.in) maxT = Math.max(maxT, cc.tile || 0); }
        for (var yy = 0; yy < N; yy++) for (var xx = 0; xx < N; xx++) {
            var cl = R.cells[yy] && R.cells[yy][xx], cx = x0 + (xx + 0.5) * C, cz = z0 + (yy + 0.5) * C;
            var top = cl && cl.in && isFinite(cl.top) ? +cl.top : ground(cx, cz);
            m4.makeScale(C * 0.9 * u, 1, C * 0.9 * u); m4.setPosition(cx * u, (top + 0.09) * u + 0.3, cz * u); FO.setMatrixAt(n, m4);
            if (cl && cl.in) { ins++; var t = (cl.tile || 0) / maxT; col.setRGB(0.2 + 0.5 * t, 0.75 + 0.25 * t, 0.35 + 0.5 * t); }
            else if (cl && cl.hazard) col.setHex(0x3aa0ff); else col.setHex(0xff3344);
            FO.setColorAt(n, col); n++;
        }
        FO.instanceMatrix.needsUpdate = true; if (FO.instanceColor) FO.instanceColor.needsUpdate = true; FO.visible = true;
        ED.auditRes.fight = { reach: win.reach, ins: ins, n: N * N };
    }
    function auditToggle(k) {
        ED.audit[k] = !ED.audit[k];
        try { localStorage.setItem('ew_editor_audit', JSON.stringify(ED.audit)); } catch (e) {}
        if (k === 'fight') { ED.fightKey = ''; fightShow(); } else auditSoon();
        panels();
    }

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
        if (landKey(k, e)) { e.preventDefault(); return; }   // E4
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
        if (k === 'l') { if (e.shiftKey) bandStep(1); else bandSet({ on: !ED.band.on }); return; }
        if (k === 'p') { playHere(); return; }
        if (k === '[' || k === ']') { turnSel(k === ']' ? ED.rotSnap || 15 : -(ED.rotSnap || 15)); return; }
        if (k === '?' || k === 'h') { help(); return; }
    }
    function onKeyUp(e) {
        if (!ED.open) return;
        var key = (e.key || '').toLowerCase(), k = KEYMAP[key] || key;
        ED.keys[k] = false; ED.keys.shift = e.shiftKey; ED.keys.ctrl = e.ctrlKey || e.metaKey;
    }
    function onBlur() { ED.keys = {}; ED.rmb = false; ED.mmb = false; ED.orbit = null; lookLock(false); if (ED.stroke) strokeEnd(); }
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
        if (e.button === 0 && ED.mode === 'land' && ED.land) {   // E4: a brush starts, anything else is a click (on the release)
            if (LAND_TOOLS[landTool()].how === 'brush') { if (landStrokeStart(rayGround(e.clientX, e.clientY), e.shiftKey)) e.preventDefault(); return; }
            _down = { x: e.clientX, y: e.clientY, land: true }; return;
        }
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
        if (ED.draw && ED.mouse.in) {
            var D = ED.draw, how = DRAWS[D.tool] ? DRAWS[D.tool].how : 'click';
            if (how === 'doorway' || (how === 'click' && (D.entry || D.row) && D.tool !== 'paint')) placeShow(rayGround(e.clientX, e.clientY));
            else drawShow(how === 'click' || how === 'wall' ? null : drawPt(e.clientX, e.clientY, e));
        }
    }
    function onMouseUp(e) {
        if (!ED.open || ED.playing) return;
        if (e.button === 2) { ED.rmb = false; lookLock(false); }
        if (e.button === 1) ED.mmb = false;
        if (e.button === 0) {
            ED.orbit = null;
            if (ED.stroke && !(ED.view && e.target === ED.view.canvas)) { _down = null; strokeEnd(e); return; }   // E3: a stroke let go off the view still ends
            var d = _down; _down = null;
            if (ED.mode === 'land' && ED.land) {
                if (ED.land.stroke && ED.opts.landView !== 'map') { landStrokeEnd(); return; }
                if (d && d.land && ED.view && e.target === ED.view.canvas && Math.hypot(e.clientX - d.x, e.clientY - d.y) <= 4) landClick(rayGround(e.clientX, e.clientY));
                return;
            }
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
        if (ED.stroke) strokeEnd(); bandClipOff();
        if (ED.land && ED.land.stroke) landStrokeEnd();
        if (ED.mode === 'land') { var cv0 = $('edMap'); if (cv0) cv0.style.display = 'none'; landSaveNow(); }
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
        if (rid === LAND_ROOM || (!rid && ED.roomId === LAND_ROOM)) {   // E4: back over his land
            if (pos) { ED.cam.x = pos.x - Math.sin(ED.cam.yaw) * 30; ED.cam.z = pos.z + Math.cos(ED.cam.yaw) * 30; ED.cam.y = (pos.y || 0) + 25; ED.cam.pitch = -0.4; }
            ED.landCam = null; landInstall(); enterRoom(LAND_ROOM, 'land', { keepCam: true }); return;
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
        if (ED.land && ED.land.stroke) landStrokeEnd();
        return landExport(all).catch(function (e) { console.error('[editor] the land export', e); toast('THE LAND DID NOT EXPORT · ' + (e && e.message || e), 6000); return null; }).then(function (LX) { return exportZip0(all, LX); });
    }
    function exportZip0(all, LX) {
        var doc = ED.doc, ids = Object.keys(doc.rooms).sort(), prev = (ED.exported && ED.exported.rooms) || {}, files = [], index = { v: 1, made: new Date().toISOString(), rooms: {}, prefabs: {}, retire: doc.retire || [], zones: doc.zones || {}, links: doc.links || [], dungeons: doc.dungeons || {}, start: doc.start || null, live: !!doc.live };
        var prevPf = (ED.exported && ED.exported.prefabs) || {};
        return Promise.all(ids.map(function (id) {
            var u8 = Core.utf8(JSON.stringify(Core.cleanExport(doc.rooms[id])));
            return sha10(u8).then(function (sha) { index.rooms[id] = [u8.length, sha]; if (all || prev[id] !== sha) files.push({ name: 'Assets/World/rooms/' + id + '.json', data: u8 }); });
        }).concat(Object.keys(doc.prefabs || {}).sort().map(function (id) {
            var u8 = Core.utf8(JSON.stringify(Core.cleanExport(doc.prefabs[id])));
            return sha10(u8).then(function (sha) { index.prefabs[id] = [u8.length, sha]; if (all || prevPf[id] !== sha) files.push({ name: 'Assets/World/prefabs/' + id + '.json', data: u8 }); });
        }))).then(function () {
            if (LX) { index.land = LX.block; LX.files.forEach(function (f) { files.push(f); }); }   // E4: his land (Assets/World/land/)
            var wj = Core.utf8(JSON.stringify(index, null, 1));
            return sha10(wj).then(function (wid) {
                var gone = Object.keys(prev).filter(function (id) { return !doc.rooms[id]; }).map(function (g) { return 'Assets/World/rooms/' + g + '.json'; }).concat(Object.keys(prevPf).filter(function (id) { return !doc.prefabs[id]; }).map(function (g) { return 'Assets/World/prefabs/' + g + '.json'; }), LX ? LX.gone : []);
                var landN = LX ? LX.files.filter(function (f) { return /\/tiles\//.test(f.name); }).length : 0;
                var note = ['ENTROPY WARS · THE WORLD FILE (the editor\'s export, ' + index.made + ')', '',
                    'Upload everything under Assets/World/ to the R2 bucket at the same paths (npm run deploy -- --world Assets/World does it).',
                    'World id: ' + wid + '  (deploy.js --world writes it into index.html as window._EW_WORLD_ID; the game reads the world only when it is named there — until THE SWAP nothing in the player\'s game leads into it).',
                    all ? 'This zip holds EVERY room and prefab.' : 'This zip holds only the rooms and prefabs that changed since the last export (' + (files.length) + ' file(s)); world.json always.',
                    LX ? 'THE LAND (Assets/World/land/, bake id ' + LX.block.id + '): ' + landN + ' changed tile(s) of ' + LX.block.tiles + ', land.json and land-map.png always, sea.bin when it changed. The game walks it from THE SWAP (E8); until then it is read by the editor only.' : 'No land yet.',
                    gone.length ? 'DELETE from the bucket (no longer in the world): ' + gone.join(', ') : 'Nothing to delete.', ''].join('\n');
                files.unshift({ name: 'Assets/World/world.json', data: wj });
                files.push({ name: 'Assets/World/README_EXPORT.txt', data: Core.utf8(note) });
                var zip = Core.zipStore(files);
                download(zip, 'ENTROPY_WARS_WORLD.zip');
                var shas = function (o) { return Object.keys(o || {}).reduce(function (a, k) { a[k] = o[k][1]; return a; }, {}); };
                ED.exported = { rooms: shas(index.rooms), prefabs: shas(index.prefabs), world: wid, at: Date.now(), land: LX ? LX.land : ((ED.exported && ED.exported.land) || null) };
                saveNow();
                toast('EXPORTED · ' + (files.length - 2 - (LX ? LX.files.length : 0)) + ' room / prefab file(s)' + (LX ? ' + the land (' + landN + ' tile(s))' : '') + ' + world.json · world id ' + wid + (gone.length ? ' · see README for files to delete' : ''), 6000);
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
                return Promise.all(ents.map(function (e) { return inflate(e).then(function (d) { e.bytes = d; if (!/\.(bin|png)$/.test(e.name)) e.text = Core.utf8dec(d); }); })).then(function () {
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
                    var lj = ents.filter(function (e) { return /land\/land\.json$/.test(e.name); })[0], ltiles = {};
                    ents.forEach(function (e) { var m = /land\/tiles\/(t_\d+_\d+)\.bin$/.exec(e.name); if (m) ltiles[m[1]] = e.bytes.buffer.slice(e.bytes.byteOffset, e.bytes.byteOffset + e.bytes.byteLength); });
                    if (ED.mode === 'land') enterRoom(ED.doc.start.room, 'world');
                    var oldLand = ED.land;
                    docLoad(doc, ED.project || 'World 1');
                    saveNow();
                    var landJob = Promise.resolve(null);
                    if (lj) landJob = landImportFiles(JSON.parse(lj.text), ltiles, oldLand);
                    return landJob.then(function (nl) {
                        enterRoom((doc.start && doc.rooms[doc.start.room]) ? doc.start.room : Object.keys(doc.rooms)[0], 'world');
                        toast('IMPORTED · ' + Object.keys(rooms).length + ' room file(s)' + (nl != null ? ' · the land (' + nl + ' tile(s) in the zip)' : '') + (missing.length ? ' · MISSING (not in this zip, not in this project): ' + missing.join(', ') : ''), 6000);
                    });
                });
            }).catch(function (e) { toast('IMPORT FAILED · ' + (e && e.message || e), 6000); });
        };
        inp.click();
    }
    function importR2() {
        if (!confirm('Replace this project with the world published on R2? (UNDO cannot bring the project back — EXPORT it first if you want a copy)')) return;
        toast('FETCHING THE PUBLISHED WORLD…', 8000);
        if (ED.mode === 'land') enterRoom(ED.doc.start.room, 'world');
        W.hqWorldDocFetch(null, true).then(function (doc) {
            var block = doc.land; delete doc.land;
            docLoad(doc, ED.project || 'World 1'); saveNow();
            return (block ? landImportR2(block).catch(function (e) { toast('THE LAND DID NOT COME · ' + (e && e.message || e), 6000); return null; }) : Promise.resolve(null)).then(function (nl) {
                enterRoom((doc.start && doc.rooms[doc.start.room]) ? doc.start.room : Object.keys(doc.rooms)[0], 'world');
                toast('IMPORTED FROM R2 · ' + Object.keys(doc.rooms).length + ' room(s)' + (nl ? ' · the land (' + nl + ' tile(s))' : ''), 4000);
            });
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
        doorway: [['doorLeaf', 'Leaf', 'leaf']],
        /* E3 */
        platform: [['height', 'Top height (m, absolute)']],
        deck: [['height', 'Deck height (m, absolute)'], ['floorKey', 'Deck sheet', 1]],
        raise: [['brushR', 'Brush radius (m) · [ ]'], ['brushS', 'Strength (0 – 1)'], ['brushFall', 'Falloff', 'fall']],
        lower: [['brushR', 'Brush radius (m) · [ ]'], ['brushS', 'Strength (0 – 1)'], ['brushFall', 'Falloff', 'fall']],
        smooth: [['brushR', 'Brush radius (m) · [ ]'], ['brushS', 'Strength (0 – 1)'], ['brushFall', 'Falloff', 'fall']],
        flatten: [['brushR', 'Brush radius (m) · [ ]'], ['brushS', 'Strength (0 – 1)'], ['brushFall', 'Falloff', 'fall']],
        terrace: [['brushR', 'Brush radius (m) · [ ]'], ['brushS', 'Strength (0 – 1)'], ['terraceH', 'Step (m)']],
        gramp: [['brushR', 'Half width (m) · [ ]']],
        cliff: [['brushR', 'Brush radius (m) · [ ]'], ['cliffH', 'Cliff height (m)']],
        set: [['brushR', 'Brush radius (m) · [ ]'], ['brushS', 'Strength (0 – 1)'], ['brushFall', 'Falloff', 'fall'], ['setH', 'Height (m, absolute)']],
        gpaint: [['brushR', 'Brush radius (m) · [ ]']],
        pool: [['waterKey', 'Liquid', 'liquid'], ['waterDepth', 'Depth (m)']],
        stream: [['streamW', 'Width (m)'], ['waterDepth', 'Depth (m)'], ['waterKey', 'Liquid', 'liquid']],
    };
    function buildHtml(tab) {
        var D = ED.draw, h = '<div class="ed-palb">';
        tab = tab || 'build';
        h += '<button class="ed-btn' + (!D ? ' on' : '') + '" data-draw="" title="Pick and move (V)">SELECT</button>';
        Object.keys(DRAWS).forEach(function (k) { if ((DRAWS[k].tab || 'build') !== tab) return; h += '<button class="ed-btn' + (D && D.tool === k ? ' on' : '') + '" data-draw="' + k + '" title="' + esc(DRAWS[k].tip) + '">' + DRAWS[k].label + '</button>'; });
        h += '</div>';
        if (D && DRAWS[D.tool]) {
            h += '<div class="ed-note">' + esc(DRAWS[D.tool].tip) + '</div>';
            var F = OPT_FIELDS[D.tool] || [];
            if (F.length) h += '<div class="ed-form" data-scope="opts">' + F.map(function (f) {
                var v = ED.opts[f[0]];
                if (f[2] === 'fall' || f[2] === 'liquid') { var ops = f[2] === 'fall' ? [['smooth', 'smooth'], ['linear', 'linear'], ['hard', 'hard']] : [['water', 'water'], ['deep_water', 'deep water'], ['lava', 'lava']]; return '<label class="ed-f"><span>' + esc(f[1]) + '</span><select data-o="' + f[0] + '">' + ops.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === v ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>'; }
                if (f[2] === 'leaf') return '<label class="ed-f"><span>' + esc(f[1]) + '</span><input type="text" data-o="' + f[0] + '" value="' + esc(v || '') + '" list="edDlLeaf"></label>';
                if (f[2]) return '<label class="ed-f"><span>' + esc(f[1]) + '</span><input type="text" data-o="' + f[0] + '" value="' + esc(v || '') + '" list="edDlTex"><button class="ed-btn ed-texb" data-otex="' + f[0] + '" title="Pick a texture"' + texSwatchStyle(v) + '>…</button></label>';
                return '<label class="ed-f"><span>' + esc(f[1]) + '</span><input type="number" step="any" data-o="' + f[0] + '" value="' + esc(v) + '"></label>';
            }).join('') + '</div>';
        }
        if (tab === 'ground') h += groundHtml();
        return h;
    }
    function texSwatchStyle(key) { var u = key && texUrl(key); return u ? ' style="background-image:url(\'' + esc(u) + '\')"' : ''; }
    function paletteWire(L) {
        L.querySelectorAll('[data-draw]').forEach(function (b) { b.onclick = function () { var t = b.getAttribute('data-draw'); drawSet(t || null); }; });
        L.querySelectorAll('[data-o]').forEach(function (el) { el.onchange = function () { var k = el.getAttribute('data-o'); ED.opts[k] = el.type === 'number' ? (isFinite(parseFloat(el.value)) ? parseFloat(el.value) : ED.opts[k]) : el.value.trim(); saveOpts(); }; });
        L.querySelectorAll('[data-otex]').forEach(function (b) { b.onclick = function () { var k = b.getAttribute('data-otex'); texPick(ED.opts[k], function (v) { ED.opts[k] = v; saveOpts(); panels(); }); }; });
        groundWire(L);
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

    /* ══ THE PALETTE (E2, EDITOR_PLAN §5.2 + §5.5): the left panel's tabs, built from the game's registries at run time (data.js
       hqPalette): MODELS (the catalogue), PEOPLE (the races, the cast, the agents), TREES (the foliage models, groves, scatter),
       DOORS (the leaves and the ways: the door tool, both ends at once), LIGHTS, MARKERS (the spawn, a sign, a roster spot, an
       online spot), TEXTURES (paint a sheet onto a face) and KITS (the game's builders and his prefabs). A tile arms the tool:
       click on the ground to place (again and again; ESC or V stops). Thumbnails are live renders cached in IndexedDB ═══════ */
    var PAL_TABS = [['build', 'BUILD'], ['ground', 'GROUND'], ['models', 'MODELS'], ['people', 'PEOPLE'], ['trees', 'TREES'], ['doors', 'DOORS'], ['lights', 'LIGHTS'], ['markers', 'MARKERS'], ['textures', 'TEXTURES'], ['kits', 'KITS']];
    var PAL_GLYPH = { props: 'M', npcSpots: 'P', agents: 'A', onlineSpots: 'O', counters: 'S', doors: 'D', spawn: '▲', 'terrain.features': 'T' };
    ED.palQ = {}; ED.palOpen = {}; ED.pal = null; ED.palShown = []; ED.palScroll = {};
    function palData() {
        if (ED.pal) return ED.pal;
        var races = [], genders = {}, cast = [], poses = [];
        try { if (typeof RACE_MODELS_3D !== 'undefined') { races = Object.keys(RACE_MODELS_3D); races.forEach(function (r) { genders[r] = Object.keys(RACE_MODELS_3D[r] || {}); }); } } catch (e) {}
        try { if (typeof DOOR_CAST_MODELS !== 'undefined') cast = Object.keys(DOOR_CAST_MODELS); } catch (e) {}
        try { if (typeof _CAST_POSES !== 'undefined') poses = Object.keys(_CAST_POSES); } catch (e) {}
        ED.pal = W.hqPalette({ races: races, genders: genders, cast: cast, poses: poses });
        return ED.pal;
    }
    /* the entries of a tab: the palette's lists, the texture sheets, the kits + his prefabs */
    function palEntries(tab) {
        if (tab === 'textures') return texSources().map(function (t) { return { id: 'tex:' + t.key, label: t.key.replace(/^urban:/, ''), sub: t.key, group: t.fam, tex: t.key, url: t.url }; });
        if (tab === 'kits') {
            var F = W.HQ_KIT_FORMS || {}, out = Object.keys(F).map(function (fn) { return { id: 'kit:' + fn, label: F[fn].label, sub: fn + (F[fn].marks ? ' · paint' : ''), group: 'Kits (the game\'s builders)', kit: fn }; });
            Object.keys((ED.doc && ED.doc.prefabs) || {}).forEach(function (id) { if (ED.mode === 'prefab' && id === ED.pfId) return; var p = ED.doc.prefabs[id]; out.push({ id: 'pf:' + id, label: p.label || id, sub: id + ' · ' + p.terrain.features.length + ' shape(s) · ' + p.props.length + ' prop(s)', group: 'Your prefabs', pf: id }); });
            return out;
        }
        return palData()[tab] || [];
    }
    function palette() {
        var B = $('edPalBox'); if (!B) return;
        var ae = document.activeElement;
        if (ae && B.contains(ae) && ae.id === 'edPalQ') { palMark(); return; }   // typing in the search: the body only
        if (ED.mode === 'land') { var lh = landPaletteHtml(); if (B._h !== lh) { B._h = lh; B.innerHTML = lh; } landPaletteWire(B); return; }   // E4: the land's tools
        if (!editable()) { B.innerHTML = ''; return; }
        var tab = ED.opts.tab || 'build';
        var h = '<div class="ed-sec ed-pal"><div class="ed-tabs">' + PAL_TABS.map(function (t) { return '<button class="ed-tab' + (tab === t[0] ? ' on' : '') + '" data-tab="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>';
        if (tab === 'build' || tab === 'ground') h += buildHtml(tab);
        else h += '<input type="text" class="ed-search ed-palq" id="edPalQ" placeholder="search ' + tab + '…" value="' + esc(ED.palQ[tab] || '') + '"><div class="ed-palbody" id="edPalBody"></div>' + palHint(tab);
        h += '</div>';
        /* the same palette again (every edit and every re-enter calls panels()) keeps its elements: a click that lands while the
           room reloads is not lost to a rebuilt button */
        if (B._h === h && B.firstChild) { if (tab === 'build' || tab === 'ground') { paletteWire(B); return; } palBody(); return; }
        B._h = h; B.innerHTML = h;
        B.querySelectorAll('[data-tab]').forEach(function (b) { b.onclick = function () { ED.opts.tab = b.getAttribute('data-tab'); saveOpts(); palette(); }; });
        if (tab === 'build' || tab === 'ground') { paletteWire(B); return; }
        $('edPalQ').oninput = function () { ED.palQ[tab] = this.value; palBody(); };
        $('edPalQ').onkeydown = function (e) { if (e.key === 'Escape') { this.value = ''; ED.palQ[tab] = ''; this.blur(); palBody(); } };
        palBody();
    }
    function palHint(tab) {
        var t = { models: 'Click a tile, then click on the ground (again for more copies). It faces you; [ ] turns it. ESC stops.',
                  people: 'Races stand where you click (a native of this room); the cast are the story\'s models; agents take a pose.',
                  trees: 'A tree where you click. GROVE / SCATTER fill a disc (the inspector: kinds, n, r, seed).',
                  doors: 'Pick a leaf or a way, then click a wall you drew (a door in a gap) or the ground (a free-standing door), then pick where it leads.',
                  lights: 'Lamps carry a real light (the cap is in the status line). Glows only glow.',
                  markers: 'SPAWN moves the room\'s arrival point. A SIGN is read with the action key. Roster / online spots are where people stand.',
                  textures: 'Click a sheet, then click a shape: a wall\'s outside or inside face, a floor, a block. The open ground takes it as the room\'s floor.',
                  kits: 'The game\'s own builders and your prefabs: click one, then the ground.' }[tab];
        return t ? '<div class="ed-note">' + esc(t) + '</div>' : '';
    }
    function palBody() {
        var P = $('edPalBody'); if (!P) return;
        var tab = ED.opts.tab, all = palEntries(tab), q = String(ED.palQ[tab] || '').toLowerCase().trim(), groups = [], byG = {};
        all.forEach(function (e, i) { if (q && (e.label + ' ' + (e.sub || '') + ' ' + (e.group || '')).toLowerCase().indexOf(q) < 0) return; var g = e.group || ''; if (!byG[g]) { byG[g] = []; groups.push(g); } byG[g].push(i); });
        var few = all.length <= 40, h = '', shown = 0; ED.palShown = all;
        groups.forEach(function (g) {
            var key = tab + '|' + g, open = !!q || few || !!ED.palOpen[key];
            h += '<button class="ed-palg' + (open ? ' on' : '') + '" data-pg="' + esc(key) + '">' + (open ? '▾ ' : '▸ ') + esc(g) + ' <span>' + byG[g].length + '</span></button>';
            if (!open) return;
            h += '<div class="ed-tiles">';
            byG[g].forEach(function (i) { if (shown++ > 240) return; h += tileHtml(all[i], i); });
            h += '</div>';
        });
        if (shown > 240) h += '<div class="ed-note">… ' + (shown - 240) + ' more: type to narrow it</div>';
        h = h || '<div class="ed-note">Nothing matches.</div>';
        var sig = h.replace(/<(img|b) [^>]*data-thk="([^"]*)"[^>]*>([^<]*<\/b>)?/g, '[$2]');   // a thumbnail landing in place is not a change
        if (P._h === sig) { palMark(); return; }
        P._h = sig; P.innerHTML = h;
        P.scrollTop = ED.palScroll[tab] || 0; P.onscroll = function () { ED.palScroll[tab] = P.scrollTop; };
        P.querySelectorAll('[data-pg]').forEach(function (b) { b.onclick = function () { var k = b.getAttribute('data-pg'); ED.palOpen[k] = !ED.palOpen[k]; palBody(); }; });
        P.querySelectorAll('[data-pe]').forEach(function (b) { b.onclick = function () { palPick(ED.palShown[+b.getAttribute('data-pe')]); }; });
        palMark();
        thumbFill(P);
    }
    function tileHtml(e, i) {
        var img = '', t = e.thumb;
        if (e.url) img = '<img loading="lazy" src="' + esc(e.url) + '" alt="">';
        else if (t && t.kind === 'portrait') { var pu = portraitUrl(t.key); img = pu ? '<img loading="lazy" src="' + esc(pu) + '" alt="">' : ''; }
        else if (t) { var tk = thumbKey(t), got = TH.mem[tk]; img = got ? '<img data-thk="' + esc(tk) + '" src="' + got + '" alt="">' : got === null ? '<b class="ed-thg" data-thk="' + esc(tk) + '">' + esc(PAL_GLYPH[e.list] || '·') + '</b>' : '<b class="ed-thw" data-th="' + esc(tk) + '" data-thk="' + esc(tk) + '">…</b>'; }
        if (!img) img = '<b class="ed-thg">' + esc(PAL_GLYPH[e.list] || (e.kit ? 'K' : e.pf ? 'F' : '·')) + '</b>';
        return '<button class="ed-tile" data-pe="' + i + '" data-pid="' + esc(e.id) + '" title="' + esc(e.label + (e.sub ? ' — ' + e.sub : '')) + '">' + img + '<span>' + esc(e.label) + '</span></button>';
    }
    function portraitUrl(race) { try { var P = (typeof RACE_PORTRAITS !== 'undefined') ? RACE_PORTRAITS[race] : null; return P ? (P.male || P.female || null) : null; } catch (e) { return null; } }
    /* the armed tile wears `on` (no re-render while he types) */
    function palMark() {
        var B = $('edPalBox'); if (!B) return;
        var D = ED.draw, cur = D && (D.entry ? D.entry.id : D.key ? 'tex:' + D.key : null);
        B.querySelectorAll('[data-pid]').forEach(function (b) { b.classList.toggle('on', !!cur && b.getAttribute('data-pid') === cur); });
    }
    /* a tile → its tool */
    function palPick(e) {
        if (!e) return;
        if (!editable()) { toast('THE LIBRARY IS READ ONLY · COPY INTO WORLD first'); return; }
        var D = ED.draw;
        if (D && ((D.entry && D.entry.id === e.id) || (D.key && e.tex === D.key))) { drawSet(null); return; }   // the armed tile again = stop
        if (e.tex) { drawSet('paint'); ED.draw.key = e.tex; toast('PAINT ' + e.tex + ' · click a face (a wall\'s side, a floor, a block) · ESC stops', 3500); palMark(); return; }
        if (e.kit) { var F = W.HQ_KIT_FORMS[e.kit]; placeRow({ k: 'kit', fn: e.kit, args: Core.clone(F.args), yaw: 0 }, F.label); return; }
        if (e.pf) { placeRow({ k: 'prefab', pf: e.pf, yaw: 0 }, e.label); return; }
        if (ED.mode === 'prefab' && e.list !== 'terrain.features' && e.list !== 'props') { toast('A PREFAB HOLDS SHAPES AND PROPS ONLY'); return; }
        if (e.list === 'doors') { drawSet('doorway'); ED.draw.entry = e; toast('DOOR · ' + e.label + ' · click a wall you drew, or the ground · ESC cancels', 4000); palMark(); return; }
        drawSet('place'); ED.draw.entry = e; ED.draw.repeat = e.list !== 'spawn';
        toast(e.list === 'spawn' ? 'CLICK WHERE THE WALKER ARRIVES (facing away from you)' : ('PLACE ' + e.label.toUpperCase() + ' · click on the ground, again for more · ESC stops'), 3200);
        palMark();
    }
    /* the eye's heading turned round: what a placed thing faces (degrees clockwise from north) */
    function faceEye() { return Math.round(((ED.cam.yaw * 180 / Math.PI + 180) % 360 + 360) % 360); }
    function palDrop(D, c) {
        var e = D.entry, sn = Math.max(0.25, ED.snap || 0), x = Core.snap(c.x, sn), z = Core.snap(c.z, sn);
        if (e.list === 'spawn') {
            var r = room(); if (!r || ED.mode === 'prefab') return;
            var face = Math.round(((ED.cam.yaw * 180 / Math.PI) % 360 + 360) % 360);
            commit([{ path: basePath().concat(['spawn']), before: Core.clone(r.spawn), after: { x: x, z: z, face: face, level: 0 } }], 'move the spawn', { noReload: true });
            spawnPlace(); drawSet(null); return;
        }
        var row = W.hqPaletteRow(e, x, z, faceEye());
        addRow(e.list, row, 'add ' + e.label, { noSelect: !!D.repeat });
        if (!D.repeat) drawSet(null);
    }
    /* the ghost at the cursor while placing: the thing's size (the catalogue's foot / h / span; a person, a tree, a door) */
    function placeShow(c) {
        var D = ED.draw; if (!D || !c) { drawPreview(null); return; }
        var e = D.entry, g = c.y || ground(c.x, c.z), w = 0.8, d = 0.8, h = 1.2;
        if (D.tool === 'doorway') { w = 1.2; d = 0.3; h = 2.2; }
        else if (e && e.list === 'props') { var cat = DOOR_HQ.catalogue[e.row.key] || {}; w = d = Math.max(0.3, cat.foot ? cat.foot * 2 : (cat.span || 0.8)); h = cat.h || (cat.span ? Math.min(cat.span, 3) : 1); }
        else if (e && (e.list === 'npcSpots' || e.list === 'agents' || e.list === 'onlineSpots')) { w = d = 0.6; h = 1.8; }
        else if (e && e.row && e.row.k === 'tree') { w = d = 1.2; h = 6; }
        else if (e && e.row && (e.row.k === 'grove' || e.row.k === 'scatter')) { w = d = 2 * (e.row.r || 6); h = 0.3; }
        else if (D.row && D.row.k === 'kit') { w = d = 4; h = 2; }
        var sn = Math.max(0.25, ED.snap || 0), x = Core.snap(c.x, sn), z = Core.snap(c.z, sn), f = faceEye() * Math.PI / 180;
        drawPreview([{ cx: x, cz: z, w: w, L: d, y0: g, y1: g + h, yaw: -f }, { cx: x + Math.sin(f) * (d / 2 + 0.3), cz: z - Math.cos(f) * (d / 2 + 0.3), w: 0.18, L: 0.6, y0: g, y1: g + 0.12, yaw: -f }]);
    }

    /* ── THE DOOR TOOL (§5.5): click a wall of his (a gap is cut and the door stands in it, facing the side he clicked from) or the
       ground (a free-standing door facing him); then WHERE IT LEADS: a room of his (or a new one) and where he arrives there — a new
       door in front of its spawn that leads back (RETURN DOOR), its spawn (one way), or one of its doors (re-pointed back here).
       One undo step for the whole thing. The plate is the runtime's (on the door, eye level, '?' until visited — R7). ── */
    function doorClick(e) {
        var D = ED.draw, ent = D.entry || { id: 'leaf:' + (ED.opts.doorLeaf || 'leaf_office'), label: ED.opts.doorLeaf || 'leaf_office', row: { wall: 'free', leaf: ED.opts.doorLeaf || 'leaf_office' } };
        var sp = null, r = rayFrom(e.clientX, e.clientY);
        if (r && !ent.row.way) {
            var hits = r.intersectObjects(ED.proxies.filter(function (q) { return q.sel.list === 'terrain.features'; }).map(function (q) { return q.obj; }), true);
            for (var i = 0; i < hits.length && !sp; i++) {
                var o = hits[i].object; while (o && !(o.userData && o.userData.edSel)) o = o.parent;
                var hw = o && findRow('terrain.features', o.userData.edSel.id); if (!hw || hw.row.k !== 'wall') continue;
                var w = hw.row, u = U(), pt = hits[i].point, px = pt.x / u, pz = pt.z / u, L = Math.hypot(w.x1 - w.x0, w.z1 - w.z0) || 1, ux = (w.x1 - w.x0) / L, uz = (w.z1 - w.z0) / L;
                var cat = DOOR_HQ.catalogue[ent.row.leaf] || {}, S = W.HQ_SHAPE_RULES || {}, ow = cat.wide ? 2.4 : (S.doorW || 1.2);
                if (L < ow + 0.1) { toast('THAT WALL IS SHORTER THAN THE DOOR (' + ow + ' m)'); return; }
                var at = Math.max(ow / 2, Math.min(L - ow / 2, Core.snap((px - w.x0) * ux + (pz - w.z0) * uz, 0.25)));
                var cx = w.x0 + ux * at, cz = w.z0 + uz * at, nx = -uz, nz = ux;   // the right-hand normal (walking x0 → x1)
                if ((ED.cam.x - cx) * nx + (ED.cam.z - cz) * nz < 0) { nx = -nx; nz = -nz; }   // the side he clicked from
                sp = { x: cx, z: cz, face: Math.round(((Math.atan2(nx, -nz) * 180 / Math.PI) % 360 + 360) % 360), wallId: w.id, at: at, ow: ow, oh: S.doorH || 2.2 };
            }
        }
        if (!sp) { var c = rayGround(e.clientX, e.clientY); if (!c) return; var sn = Math.max(0.25, ED.snap || 0); sp = { x: Core.snap(c.x, sn), z: Core.snap(c.z, sn), face: faceEye() }; }
        drawSet(null);
        doorModal(null, function (v) { doorWrite(sp, ent, v); });
    }
    /* WHERE IT LEADS: `cur` = the door being re-targeted (null = a new one). → onOk({ to, arrive }) with arrive '' (a new return
       door), '__spawn' (one way, at the spawn) or a door id there */
    function doorModal(cur, onOk) {
        var ids = Object.keys(ED.doc.rooms).sort(function (a, b) { return (W.hqWorldDocRoomNo(a) || 0) - (W.hqWorldDocRoomNo(b) || 0); });
        var to0 = (cur && cur.action && cur.action.room && ED.doc.rooms[cur.action.room]) ? cur.action.room : (ids.filter(function (x) { return x !== ED.roomId; })[0] || '__new');
        modalOpen('<div class="ed-hd">' + (cur ? 'DOOR ' + esc(cur.id) + ' LEADS TO' : 'THE DOOR LEADS TO') + '</div><div class="ed-form">' +
            '<label class="ed-f"><span>Room</span><select id="edDTo">' + ids.map(function (x) { return '<option value="' + esc(x) + '"' + (x === to0 ? ' selected' : '') + '>' + esc((ED.doc.rooms[x].label || x) + ' (' + x + ')' + (x === ED.roomId ? ' · this room' : '')) + '</option>'; }).join('') + (cur ? '' : '<option value="__new"' + (to0 === '__new' ? ' selected' : '') + '>A new room (flat, empty)</option>') + '</select></label>' +
            '<label class="ed-f"><span>You arrive at</span><select id="edDAt"></select></label></div>' +
            '<div class="ed-note" id="edDNote"></div><div class="ed-acts"><button class="ed-btn ed-primary" id="edOk">OK</button><button class="ed-btn" id="edCancel">CANCEL</button></div>');
        var fill = function () {
            var to = $('edDTo').value, far = to === '__new' ? null : ED.doc.rooms[to], ds = (far && far.doors) || [];
            var cat = (cur && cur.action && cur.action.room === to) ? (cur.action.at || '__spawn') : '';
            var opts = [['', 'A new door in front of its spawn, leading back here'], ['__spawn', 'Its spawn (one way: no door back)']];
            ds.forEach(function (d) { if (!d || (cur && to === ED.roomId && d.id === cur.id)) return; opts.push([d.id, 'Door ' + d.id + (d.action && d.action.room ? ' (now to ' + ((ED.doc.rooms[d.action.room] || {}).label || d.action.room) + ')' : '') + ' · it will lead back here']); });
            $('edDAt').innerHTML = opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === cat ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('');
            $('edDNote').textContent = to === '__new' ? 'A new flat empty room is made with the door.' : '';
        };
        $('edDTo').onchange = fill; fill();
        $('edCancel').onclick = modalClose;
        $('edOk').onclick = function () { var v = { to: $('edDTo').value, arrive: $('edDAt').value }; modalClose(); onOk(v); };
    }
    /* the far room's doors path + its next index, creating the list in the step when it is absent */
    function farDoors(step, to, far, extra) { if (!far.doors) step.push({ path: ['rooms', to, 'doors'], before: undefined, after: [] }); return (far.doors || []).length + (extra || 0); }
    function doorWrite(sp, ent, v) {
        if (!editable() || ED.mode !== 'world') { toast('DOORS GO IN ROOMS OF YOUR WORLD'); return; }
        var r = room(), step = [], n0 = +nextId(r).slice(1), openId = sp.wallId ? 'r' + n0 : null, mineId = 'r' + (n0 + (sp.wallId ? 1 : 0));
        var to = v.to, fresh = null;
        if (to === '__new') { to = W.hqWorldDocNextRoomId(ED.doc); fresh = W.hqWorldDocNewRoom(to); step.push({ path: ['rooms', to], before: undefined, after: fresh }); }
        var far = fresh || ED.doc.rooms[to]; if (!far) return;
        var backId = to === ED.roomId ? 'r' + (+mineId.slice(1) + 1) : (fresh ? 'r1' : nextId(far));
        var docv = { rooms: Object.assign({}, ED.doc.rooms) }; docv.rooms[to] = far;
        var P = W.hqDoorPair(docv, { room: ED.roomId, x: sp.x, z: sp.z, face: sp.face }, { room: to, door: (v.arrive && v.arrive !== '__spawn') ? v.arrive : null },
                             { leaf: ent.row.leaf, way: ent.row.way, back: v.arrive !== '__spawn', ids: { a: mineId, b: backId } });
        if (!P) return;
        if (openId) { var nf = ensureList('terrain.features', step); step.push({ path: rowPath('terrain.features', nf), before: undefined, after: { id: openId, k: 'opening', wall: sp.wallId, at: sp.at, w: sp.ow, h: sp.oh, sill: 0 } }); }
        var nd = ensureList('doors', step);
        step.push({ path: rowPath('doors', nd), before: undefined, after: P.mine });
        if (P.back) step.push({ path: ['rooms', to, 'doors', farDoors(step, to, far, to === ED.roomId ? 1 : 0)], before: undefined, after: P.back });
        if (P.relink) { var fi = (far.doors || []).findIndex(function (d) { return d && d.id === P.relink.id; }); if (fi >= 0) step.push({ path: ['rooms', to, 'doors', fi, 'action'], before: Core.clone(far.doors[fi].action), after: P.relink.action }); }
        commit(step, 'add door');
        if (to !== ED.roomId) docSync([to]);
        select('doors', mineId);
        toast('DOOR ADDED → ' + (far.label || to).toUpperCase() + (P.back ? ' · its return door stands ' + W.HQ_PALETTE_RULES.returnAhead + ' m in front of the spawn there' : P.relink ? ' · door ' + P.relink.id + ' there leads back' : ' · one way'), 4500);
    }
    /* LEADS TO… on a picked door: the same question, written onto it */
    function doorRetarget(h) {
        doorModal(h.row, function (v) {
            var step = [], to = v.to, far = ED.doc.rooms[to]; if (!far) return;
            var r = room(), backId = to === ED.roomId ? nextId(r) : nextId(far);
            var docv = { rooms: ED.doc.rooms };
            var P = W.hqDoorPair(docv, { room: ED.roomId, x: 0, z: 0, face: 0 }, { room: to, door: (v.arrive && v.arrive !== '__spawn') ? v.arrive : null }, { leaf: h.row.leaf, way: h.row.way, back: v.arrive !== '__spawn', ids: { a: h.row.id, b: backId } });
            if (!P) return;
            var after = Core.clone(h.row); after.action = P.mine.action;
            if (h.row.action && h.row.action.room === to && h.row.action.at && !v.arrive) { toast('KEPT · it already leads there'); return; }
            step.push({ path: rowPath('doors', h.i), before: Core.clone(h.row), after: after });
            if (P.back) { var bx = Core.clone(P.back); if (h.row.wall === 'free') { /* the return door stands at the far spawn */ } step.push({ path: ['rooms', to, 'doors', farDoors(step, to, far)], before: undefined, after: bx }); }
            if (P.relink) { var fi = (far.doors || []).findIndex(function (d) { return d && d.id === P.relink.id; }); if (fi >= 0) step.push({ path: ['rooms', to, 'doors', fi, 'action'], before: Core.clone(far.doors[fi].action), after: P.relink.action }); }
            commit(step, 'door target');
            if (to !== ED.roomId) docSync([to]);
        });
    }
    /* GO THROUGH: the editor follows the door into the room it leads to, the eye behind where he arrives */
    function doorFollow(h) {
        var a = h.row.action || {}, to = a.room; if (!to || !DOOR_HQ.rooms[to]) { toast('THAT DOOR LEADS NOWHERE'); return; }
        var far = DOOR_HQ.rooms[to], d = a.at ? (far.doors || []).filter(function (x) { return x && x.id === a.at; })[0] : null, at = null;
        if (d && d.wall === 'free' && isFinite(d.x)) { var f = (+d.face || 0) * Math.PI / 180; at = { x: d.x + Math.sin(f) * 2, z: d.z - Math.cos(f) * 2, face: d.face || 0 }; }
        saveCam(); enterRoom(to, ED.doc.rooms[to] ? 'world' : 'library', { at: at || undefined });
        if (d) select('doors', d.id);
    }

    /* ── TEXTURES: PAINT a sheet onto the face under the cursor (a wall's outside = `key`, its inside = `keyIn`; a kit's `args.key`;
       any other shape's `key`); the open ground takes it as the room's floor. One undo step a click; the tool stays armed ── */
    var PAINTS = { wall: 1, plateau: 1, bridge: 1, deck: 1, ramp: 1, spiral: 1, kit: 1, pool: 0 };
    function paintAt(e) {
        var D = ED.draw, key = D && D.key; if (!key) return;
        var r = rayFrom(e.clientX, e.clientY); if (!r) return;
        var hits = r.intersectObjects(ED.proxies.filter(function (q) { return q.sel.list === 'terrain.features'; }).map(function (q) { return q.obj; }), true);
        for (var i = 0; i < hits.length; i++) {
            var o = hits[i].object; while (o && !(o.userData && o.userData.edSel)) o = o.parent;
            var h = o && findRow('terrain.features', o.userData.edSel.id); if (!h || !PAINTS[h.row.k]) continue;
            var after = Core.clone(h.row), field = 'key';
            if (h.row.k === 'kit') { after.args = after.args || {}; after.args.key = key; field = 'args.key'; }
            else if (h.row.k === 'wall') {
                var u = U(), p = hits[i].point, mx = (h.row.x0 + h.row.x1) / 2, mz = (h.row.z0 + h.row.z1) / 2, dx = h.row.x1 - h.row.x0, dz = h.row.z1 - h.row.z0;
                field = ((p.x / u - mx) * -dz + (p.z / u - mz) * dx) > 0 ? 'keyIn' : 'key';   // the right-hand face = the inside
                after[field] = key;
            } else after.key = key;
            replaceRows([{ list: 'terrain.features', i: h.i, before: Core.clone(h.row), after: after }], 'paint ' + field);
            toast('PAINTED ' + Core.rowLabel('terrain.features', h.row) + ' · ' + field + ' = ' + key, 1600);
            return;
        }
        var rm = room(); if (!rm || !rm.terrain || ED.mode === 'prefab') { toast('CLICK A SHAPE'); return; }
        commit([{ path: basePath().concat(['terrain', 'floor']), before: rm.terrain.floor, after: key }], 'paint the floor');
        toast('THE ROOM\'S FLOOR = ' + key, 1600);
    }

    /* ── THE MARKERS IN THE VIEW: every person's spot, agent, online spot and sign gets a post the editor draws (and picks by), so
       a spot shows even when nobody stands on it (a roster spot with no vessel unlocked, the cast switched off) ── */
    var MK_COLOR = { npcSpots: 0x6fd3ff, agents: 0x9aa4ff, onlineSpots: 0xc58cff, counters: 0xffd84a };
    var _mkMat = {};
    function markerObj(list, row) {
        var u = U(), g = new THREE.Group(), col = MK_COLOR[list];
        if (!_mkMat[list]) _mkMat[list] = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.42, depthWrite: false, fog: false });
        var sign = list === 'counters', hgt = sign ? (+row.plateY || 1.8) : 1.8;
        var body = sign ? new THREE.Mesh(new THREE.BoxGeometry(0.7 * u, 0.5 * u, 0.12 * u), _mkMat[list]) : new THREE.Mesh(new THREE.CylinderGeometry(0.28 * u, 0.28 * u, hgt * u, 10), _mkMat[list]);
        body.position.y = (sign ? hgt : hgt / 2) * u; g.add(body);
        if (sign) { var post = new THREE.Mesh(new THREE.CylinderGeometry(0.04 * u, 0.04 * u, hgt * u, 6), _mkMat[list]); post.position.y = hgt / 2 * u; g.add(post); }
        var nose = new THREE.Mesh(new THREE.ConeGeometry(0.16 * u, 0.45 * u, 8), _mkMat[list]); nose.rotation.x = -Math.PI / 2; nose.position.set(0, 0.25 * u, -0.45 * u); g.add(nose);
        var gy = ground(+row.x, +row.z) + (list === 'agents' && isFinite(row.y) ? +row.y : 0);
        g.position.set(+row.x * u, gy * u, +row.z * u); g.rotation.y = -((+row.face || 0) * Math.PI / 180);
        g.userData.edSel = { list: list, id: row.id };
        return g;
    }

    /* ── THE THUMBNAILS: a tile's picture is the thing itself, built the way the room builds it (ThreeRenderer.hq.propPreview /
       treePreview), rendered once at 96 px by a small renderer of the editor's own and cached in IndexedDB (`thumbs`, keyed by the
       file, so a renamed upload draws again). One at a time, newest ask first; a thing that cannot be built keeps its label ── */
    var TH = { mem: {}, want: [], busy: false, r: null, sc: null, cam: null, off: false };
    function thumbKey(t) { return t.kind + ':' + t.key; }
    function thumbStoreKey(k) {
        var p = k.split(':'), kind = p[0], key = p.slice(1).join(':');
        if (kind === 'prop') { var c = DOOR_HQ.catalogue[key] || {}; return k + '|' + (c.file || c.proc || ''); }
        if (kind === 'tree') { var T = (W.HQ_TREE_KINDS || {})[key]; return k + '|' + (T ? T.model : ''); }
        return k;
    }
    function thumbFill(P) { P.querySelectorAll('[data-th]').forEach(function (b) { thumbWant(b.getAttribute('data-th')); }); }
    function thumbWant(k) {
        if (TH.off || !k || TH.mem[k] || TH.mem[k] === null) return;
        var i = TH.want.indexOf(k); if (i >= 0) TH.want.splice(i, 1);
        TH.want.push(k); thumbPump();
    }
    function thumbShow(k) {
        var url = TH.mem[k], B = $('edPalBox'); if (!B) return;
        B.querySelectorAll('[data-th="' + k.replace(/"/g, '\\"') + '"]').forEach(function (b) {
            if (url) { var im = document.createElement('img'); im.src = url; im.alt = ''; im.setAttribute('data-thk', k); b.parentNode.replaceChild(im, b); }
            else { b.textContent = PAL_GLYPH.props; b.className = 'ed-thg'; b.removeAttribute('data-th'); }
        });
    }
    function thumbPump() {
        if (W.EW_ED_NO_THUMBS) TH.off = true;   /* console switch */
        if (TH.off || TH.busy || !TH.want.length || !ED.open || ED.playing || !ED.ready) return;
        TH.busy = true;
        var k = TH.want.pop(), sk = thumbStoreKey(k), done = function (url) { TH.mem[k] = url || null; thumbShow(k); TH.busy = false; setTimeout(thumbPump, 60); };
        idbDo('thumbs', 'readonly', function (st) { return st.get(sk); }).catch(function () { return null; }).then(function (hit) {
            if (hit && hit.url) { done(hit.url); return; }
            var p = k.split(':'), kind = p[0], key = p.slice(1).join(':'), H = ThreeRenderer.hq;
            var fn = kind === 'prop' ? H.propPreview : kind === 'tree' ? H.treePreview : null;
            if (!fn) { done(null); return; }
            fn(key, function (obj) {
                var url = obj ? thumbRender(obj) : null;
                if (url) idbDo('thumbs', 'readwrite', function (st) { return st.put({ url: url, at: Date.now() }, sk); }).catch(function () {});
                done(url);
            });
        });
    }
    function thumbRender(obj) {
        if (!TH.r) {
            try {
                var cv = document.createElement('canvas'); cv.width = cv.height = 96;
                TH.r = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true, preserveDrawingBuffer: true });
                TH.r.setPixelRatio(1); TH.r.setSize(96, 96, false); TH.r.setClearColor(0x000000, 0);
                TH.sc = new THREE.Scene(); TH.sc.add(new THREE.AmbientLight(0xffffff, 0.8));
                var dl = new THREE.DirectionalLight(0xffffff, 0.8); dl.position.set(3, 5, 4); TH.sc.add(dl);
                TH.cam = new THREE.PerspectiveCamera(30, 1, 0.01, 1e7);
            } catch (e) { TH.off = true; console.warn('[editor] the thumbnails are off (no second WebGL context)', e); return null; }
        }
        var holder = new THREE.Group(); holder.add(obj); TH.sc.add(holder);
        try {
            holder.updateMatrixWorld(true);
            var bb = new THREE.Box3().setFromObject(holder); if (bb.isEmpty()) return null;
            var c = bb.getCenter(new THREE.Vector3()), sz = bb.getSize(new THREE.Vector3()), R = Math.max(sz.x, sz.y, sz.z) * 0.62 || 1;
            var d = R / Math.sin(15 * Math.PI / 180), dir = new THREE.Vector3(0.75, 0.55, 1.2).normalize();
            TH.cam.position.copy(c).addScaledVector(dir, d); TH.cam.near = d / 50; TH.cam.far = d * 6; TH.cam.updateProjectionMatrix(); TH.cam.lookAt(c);
            TH.r.render(TH.sc, TH.cam);
            return TH.r.domElement.toDataURL('image/png');
        } catch (e) { return null; }
        finally { TH.sc.remove(holder); }
    }

    /* ══ THE DOM ════════════════════════════════════════════════════════════════════════════════════════════════════════ */
    var MENUS = {
        FILE: [['New world (flat, empty)', newWorld], ['Open…', openProject], ['Save', function () { saveNow().then(function (ok) { if (ok) toast('SAVED · ' + ED.project); }); }], ['Save as…', saveAs], null,
               ['Export zip (what changed)', function () { exportZip(false); }], ['Export zip (everything)', function () { exportZip(true); }], ['Import zip…', importZip], ['Import from R2 (the published world)', importR2], null,
               ['Old voxel map editor', function () { close(); setTimeout(function () { W._goToVoxelEditor(); }, 50); }], ['Close the editor', function () { close(); }]],
        EDIT: [['Undo  (Ctrl Z)', undo], ['Redo  (Ctrl Y)', redo], null, ['Duplicate  (Ctrl D)', duplicateSel], ['Delete  (Del)', deleteSel], ['Turn −' + '15°  ([)', function () { turnSel(-(ED.rotSnap || 15)); }], ['Turn +15°  (])', function () { turnSel(ED.rotSnap || 15); }], null,
               ['Array… (copies in a row / round)', arraySel], ['Mirror east–west', function () { mirrorSel('x'); }], ['Mirror north–south', function () { mirrorSel('z'); }], null,
               ['Save selection as prefab', selToPrefab], ['Bake the prefab / kit into rows', bakeSel], null, ['Deselect  (Esc)', function () { select(null); }]],
        ADD: function () { return [['Prefab…', addPrefab], ['Kit (the game\'s builders)…', addKit], ['Prop (the catalogue)…', addProp], ['Door…  (click a wall or the ground)', function () { if (!editable() || ED.mode !== 'world') { toast('DOORS GO IN ROOMS OF YOUR WORLD'); return; } drawSet('doorway'); }], null].concat(Core.KINDS.map(function (K) { return [K.label, function () { addShape(K.id); }]; })); },   // the draw tools live on the BUILD palette
        ROOM: [['New room (flat, empty)…', newRoom], ['Duplicate this room', duplicateRoom], ['Delete this room', deleteRoom], ['The world starts here', setStart], ['This room as a prefab', roomToPrefab], null, ['New prefab (empty)', newPrefab], null, ['The library (built-in rooms)…', library], ['Copy this library room into the world', copyIntoWorld]],
        VIEW: [['The land (the world map)', landOpen], ['The land: MAP / 3D  (TAB)', function () { if (ED.mode === 'land') landView(ED.opts.landView === 'map' ? '3d' : 'map'); else landOpen(); }], null,
               ['Grid  (G)', function () { ED.grid = !ED.grid; if (ED.gridObj) ED.gridObj.visible = ED.grid && ED.mode !== 'land'; }], ['Frame the selection  (F)', frameSel], ['To the spawn  (Home)', camHome], ['Reload the room', function () { enterRoom(ED.roomId, ED.mode, { keepCam: true }); }], null,
               ['The level band on / off  (L)', function () { bandSet({ on: !ED.band.on }); }], ['The level band up a floor  (Shift L)', function () { bandStep(1); }], ['The level band down a floor', function () { bandStep(-1); }], null,
               ['Audit: invisible walls', function () { auditToggle('walls'); }], ['Audit: pockets (ground nobody reaches)', function () { auditToggle('pockets'); }], ['Audit: the fight window at the cursor', function () { auditToggle('fight'); }]],
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
            '<canvas class="ed-map" id="edMap" style="display:none"></canvas>' +
            '<div class="ed-left" id="edLeft"><div id="edPalBox"></div><div id="edOutl"></div></div><div class="ed-right" id="edRight"></div>' +
            '<div class="ed-status" id="edStatus"></div><div class="ed-menu" id="edMenu" style="display:none"></div>' +
            '<div class="ed-modal" id="edModal" style="display:none"><div class="ed-card" id="edCard"></div></div>' +
            '<div class="ed-toast" id="edToast" style="display:none"></div><div class="ed-playtag" id="edPlayTag">PLAY HERE · ESC back to the editor</div>';
        document.body.appendChild(root);
        var menus = $('edMenus');
        Object.keys(MENUS).forEach(function (name) {
            var b = document.createElement('button'); b.className = 'ed-btn ed-menubtn'; b.textContent = name; b.onclick = function (e) { e.stopPropagation(); menuOpen(name, b); }; menus.appendChild(b);
        });
        $('edPlay').onclick = playHere; $('edHelp').onclick = help; $('edClose').onclick = function () { close(); };
        mapBind($('edMap'));
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
            /* E3: the level band and the audits */
            '<label class="ed-lab" title="THE LEVEL BAND (L): only what overlaps it picks; everything above its top is cut away in the view"><input type="checkbox" id="edBand"' + (ED.band.on ? ' checked' : '') + '>LEVEL</label>' +
            '<input type="number" step="0.5" id="edBandY0" value="' + ED.band.y0 + '" style="width:52px" title="the band\'s bottom (m)"><input type="number" step="0.5" id="edBandY1" value="' + ED.band.y1 + '" style="width:52px" title="the band\'s top (m)">' +
            '<button class="ed-btn" id="edBandDn" title="The band down a floor">▼</button><button class="ed-btn" id="edBandUp" title="The band up a floor (Shift L)">▲</button>' +
            '<span class="ed-lab">AUDIT</span>' + [['walls', 'WALLS', 'Invisible walls: a step the walker is refused with nothing drawn there (red posts)'], ['pockets', 'POCKETS', 'Ground nobody reaches from the spawn or a door (yellow)'], ['fight', 'FIGHT', 'The 8 × 8 battle window a fight at the cursor would take']].map(function (a) { return '<button class="ed-btn' + (ED.audit[a[0]] ? ' on' : '') + '" data-aud="' + a[0] + '" title="' + a[2] + '">' + a[1] + '</button>'; }).join('') +
            (ED.mode === 'library' ? '<button class="ed-btn ed-copy" id="edCopy" title="Make this built-in room a room of yours">COPY INTO WORLD</button>' : '');
        t.querySelectorAll('[data-tool]').forEach(function (b) { b.onclick = function () { tcMode(b.getAttribute('data-tool')); }; });
        $('edSnap').onchange = function () { ED.snap = +this.value; tcMode(ED.tool); };
        $('edRSnap').onchange = function () { ED.rotSnap = +this.value; tcMode(ED.tool); };
        if ($('edCopy')) $('edCopy').onclick = copyIntoWorld;
        $('edBand').onchange = function () { bandSet({ on: this.checked }); };
        $('edBandY0').onchange = function () { var v = parseFloat(this.value); if (isFinite(v)) bandSet({ y0: v }); };
        $('edBandY1').onchange = function () { var v = parseFloat(this.value); if (isFinite(v)) bandSet({ y1: v }); };
        $('edBandDn').onclick = function () { bandStep(-1); }; $('edBandUp').onclick = function () { bandStep(1); };
        t.querySelectorAll('[data-aud]').forEach(function (b) { b.onclick = function () { auditToggle(b.getAttribute('data-aud')); }; });
    }
    /* ── THE OUTLINER: the world (his rooms), then this room's rows by list ── */
    function outliner() {
        var L = $('edOutl'); if (!L || !ED.doc) return;
        var h = '<div class="ed-sec"><div class="ed-hd">WORLD · ' + esc(ED.project) + '</div>';
        Object.keys(ED.doc.rooms).sort(function (a, b) { return (W.hqWorldDocRoomNo(a) || 0) - (W.hqWorldDocRoomNo(b) || 0); }).forEach(function (id) {
            var r = ED.doc.rooms[id];
            h += '<button class="ed-row' + (ED.mode === 'world' && id === ED.roomId ? ' on' : '') + '" data-room="' + esc(id) + '">' + esc(r.label || id) + (ED.doc.start && ED.doc.start.room === id ? ' <i>START</i>' : '') + '<span>' + esc(id) + ' · ' + roomSize(r) + '</span></button>';
        });
        h += '<button class="ed-row ed-add" data-act="newroom">+ NEW ROOM</button>';
        h += '<button class="ed-row ed-land' + (ED.mode === 'land' ? ' on' : '') + '" data-act="land">THE LAND<span>the world map · ' + ((ED.doc.landEd && ED.doc.landEd.places && ED.doc.landEd.places.length) || 0) + ' place(s)</span></button></div>';
        if (ED.mode === 'land') h += '<div class="ed-sec"><div class="ed-hd">ON THE LAND</div>' + landOutlinerHtml() + '</div>';
        h = h + prefabsHtml();
        if (ED.mode === 'land') { var sc0 = L.scrollTop; L.innerHTML = h; L.scrollTop = sc0; prefabsWire(L); L.querySelectorAll('[data-room]').forEach(function (b) { b.onclick = function () { enterRoom(b.getAttribute('data-room'), 'world'); }; }); L.querySelectorAll('[data-act="newroom"]').forEach(function (b) { b.onclick = newRoom; }); L.querySelectorAll('[data-lk]').forEach(function (b) { b.onclick = function () { var k = b.getAttribute('data-lk'), i = b.getAttribute('data-li'); ED.land.sel = { kind: k, id: k === 'coasts' ? +i : i }; landFrame(ED.land.sel); panels(); }; }); return; }
        if (ED.mode === 'library') h += '<div class="ed-sec"><div class="ed-hd">LIBRARY · READ ONLY</div><div class="ed-note">' + esc((room() || {}).label || ED.roomId) + '<br>' + esc(ED.roomId) + '</div></div>';
        var r = room();
        if (r) {
            var groups = [['terrain.features', 'SHAPES'], ['props', 'PROPS'], ['doors', 'DOORS'], ['counters', 'SIGNS'], ['npcSpots', 'PEOPLE'], ['agents', 'AGENTS'], ['onlineSpots', 'ONLINE SPOTS']];
            h += '<div class="ed-sec"><div class="ed-hd">' + esc(String(r.label || ED.roomId).toUpperCase()) + '</div>';
            if (ED.mode !== 'prefab') h += '<button class="ed-row' + (isSel('spawn') ? ' on' : '') + '" data-list="spawn">spawn<span>x ' + ((r.spawn && r.spawn.x) || 0) + ' z ' + ((r.spawn && r.spawn.z) || 0) + '</span></button>';
            groups.forEach(function (g) {
                var list = listOf(r, g[0]) || []; if (!list.length) return;
                h += '<div class="ed-sub">' + g[1] + ' · ' + list.length + '</div>';
                list.slice(0, 400).forEach(function (row) { if (!row) return; if (ED.band.on && g[0] === 'terrain.features' && !rowInBand(row)) return; h += '<button class="ed-row' + (isSel(g[0], row.id) ? ' on' : '') + '" data-list="' + g[0] + '" data-id="' + esc(row.id) + '">' + esc(Core.rowLabel(g[0], row)) + '<span>' + esc(row.id || '') + '</span></button>'; });
                if (list.length > 400) h += '<div class="ed-note">… ' + (list.length - 400) + ' more</div>';
            });
            if (r.terrain && r.terrain.gen) h += '<div class="ed-note">This room\'s floor plan is GENERATED (terrain.gen · ' + esc(r.terrain.gen.kind || '') + '): its walls come from the generator, not from rows (FREEZE comes in E5).</div>';
            h += '</div>';
        }
        var sc = L.scrollTop; L.innerHTML = h; L.scrollTop = sc;
        prefabsWire(L);
        L.querySelectorAll('[data-room]').forEach(function (b) { b.onclick = function () { saveCam(); enterRoom(b.getAttribute('data-room'), 'world'); }; });
        L.querySelectorAll('[data-act="newroom"]').forEach(function (b) { b.onclick = newRoom; });
        L.querySelectorAll('[data-act="land"]').forEach(function (b) { b.onclick = function () { if (ED.mode !== 'land') landOpen(); }; });
        L.querySelectorAll('[data-lk]').forEach(function (b) { b.onclick = function () { var k = b.getAttribute('data-lk'), i = b.getAttribute('data-li'); ED.land.sel = { kind: k, id: k === 'coasts' ? +i : i }; landFrame(ED.land.sel); panels(); }; });
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
            '<datalist id="edDlLook">' + (W.HQ_CLIMB_LOOKS || []).map(function (k) { return '<option value="' + esc(k) + '">'; }).join('') + '</datalist>' +
            /* E2: the palette's registries */
            ['Race:races', 'Cast:cast', 'Pose:poses'].map(function (x) { var p = x.split(':'), P = palData(), src = p[1] === 'races' ? P.people.filter(function (e) { return e.row.race; }).map(function (e) { return e.row.race; }) : p[1] === 'cast' ? P.people.filter(function (e) { return e.row.cast; }).map(function (e) { return e.row.cast; }) : P.people.filter(function (e) { return e.row.pose; }).map(function (e) { return e.row.pose; }); return '<datalist id="edDl' + p[0] + '">' + src.map(function (k) { return '<option value="' + esc(k) + '">'; }).join('') + '</datalist>'; }).join('') +
            '<datalist id="edDlTree">' + Object.keys(W.HQ_TREE_KINDS || {}).map(function (k) { return '<option value="' + esc(k) + '">'; }).join('') + '</datalist>' +
            '<datalist id="edDlWay">' + Object.keys(DOOR_HQ.ways || {}).map(function (k) { return '<option value="' + esc(k) + '">'; }).join('') + '</datalist>';
        $('edRoot').appendChild(d);
    }
    function fieldHtml(key, val, list) {
        var id = 'edF_' + key.replace(/[^a-z0-9_]/gi, '_');
        var tex = TEX_KEYS.indexOf(key) >= 0 && !(key === 'key' && list && list !== 'terrain.features' && list !== 'terrain.marks');
        if (tex && (typeof val === 'string' || val == null)) return '<label class="ed-f"><span>' + esc(key) + '</span><input type="text" data-k="' + esc(key) + '" data-t="str" value="' + esc(val || '') + '" list="edDlTex" id="' + id + '"><button class="ed-btn ed-texb" data-tex="' + esc(key) + '" title="Pick a texture"' + texSwatchStyle(val) + '>…</button></label>';
        if (typeof val === 'boolean') return '<label class="ed-f"><span>' + esc(key) + '</span><input type="checkbox" data-k="' + esc(key) + '" data-t="bool"' + (val ? ' checked' : '') + '></label>';
        if (typeof val === 'number') return '<label class="ed-f"><span>' + esc(key) + '</span><input type="number" step="any" data-k="' + esc(key) + '" data-t="num" value="' + esc(val) + '"></label>';
        if (typeof val === 'string') {
            var dl = key === 'key' && list === 'props' ? 'edDlProp' : key === 'leaf' ? 'edDlLeaf' : key === 'look' ? 'edDlLook' : key === 'race' ? 'edDlRace' : key === 'cast' ? 'edDlCast' : key === 'pose' ? 'edDlPose' : key === 'way' ? 'edDlWay' : (key === 'kind' && list === 'terrain.features') ? 'edDlTree' : '';
            return '<label class="ed-f"><span>' + esc(key) + '</span><input type="text" data-k="' + esc(key) + '" data-t="str" value="' + esc(val) + '"' + (dl ? ' list="' + dl + '"' : '') + ' id="' + id + '"></label>';
        }
        return '<label class="ed-f ed-fj"><span>' + esc(key) + '</span><textarea data-k="' + esc(key) + '" data-t="json" rows="' + Math.min(8, 1 + Math.ceil(JSON.stringify(val).length / 38)) + '">' + esc(JSON.stringify(val)) + '</textarea></label>';
    }
    function inspector() {
        var P = $('edRight'); if (!P) return;
        datalists();
        if (ED.mode === 'land') { P.innerHTML = landInspectorHtml(); landInspectorWire(P); return; }   // E4
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
            if (r.terrain) {
                h += '<div class="ed-sub">THE GROUND</div><div class="ed-form" data-scope="terrain">' + fieldHtml('floor', String(T.floor || '')) + fieldHtml('cliff', String(T.cliff || '')) + fieldHtml('path', String(T.path || '')) + fieldHtml('base', +T.base || 0) + '</div>';
                /* E3: the sea (one water level over the whole room), the floating ground (no ground round it, a rock underside), the grids */
                var sea = T.sea || null, fl = T.float || null;
                h += '<div class="ed-form" data-scope="ground">' + fieldHtml('sea', !!sea) + (sea ? fieldHtml('seaY', +sea.y || 0) + fieldHtml('seaKey', String(sea.key || 'water')) + fieldHtml('seaUnder', !!sea.under) : '') +
                     fieldHtml('floating', !!fl) + (fl ? fieldHtml('floatDepth', +(fl.depth || 14)) : '') + '</div>';
                var hm = T.hmap, pt = T.paint;
                h += '<div class="ed-note">sea = water over everything below seaY (seaUnder: you swim under it) · floating = the room hangs in the air: no ground runs on past its edge, rock hangs under it floatDepth m.<br>HEIGHTS: ' + (hm ? hm.nx + ' × ' + hm.nz + ' nodes at ' + hm.res + ' m' : 'none') + ' · PAINT: ' + (pt && pt.pal && pt.pal.length ? pt.pal.map(esc).join(', ') : 'none') + ' (the GROUND tab, left)</div>';
                if (!ro) h += '<div class="ed-acts"><button class="ed-btn" data-gact="clrh"' + (hm ? '' : ' disabled') + '>CLEAR HEIGHTS</button><button class="ed-btn" data-gact="clrp"' + (pt && pt.d ? '' : ' disabled') + '>CLEAR PAINT</button></div>';
            }
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
                h += '<div class="ed-acts">' + (x.list === 'doors' ? '<button class="ed-btn" data-a="target">LEADS TO…</button><button class="ed-btn" data-a="follow" title="Open the room it leads to">GO THROUGH</button>' : '') +
                    (row.k === 'prefab' ? '<button class="ed-btn ed-copy" data-a="pfedit">EDIT PREFAB</button>' : '') + (row.k === 'prefab' || row.k === 'kit' ? '<button class="ed-btn" data-a="bake">BAKE TO ROWS</button>' : '') +
                    '<button class="ed-btn" data-a="dupr">DUPLICATE</button><button class="ed-btn ed-danger" data-a="delr">DELETE</button></div>';
                if (x.list === 'terrain.features' || x.list === 'props') h += '<div class="ed-acts"><button class="ed-btn" data-a="array">ARRAY…</button><button class="ed-btn" data-a="mirx">MIRROR E–W</button><button class="ed-btn" data-a="mirz">MIRROR N–S</button>' + (ED.mode !== 'prefab' ? '<button class="ed-btn" data-a="topf">SAVE AS PREFAB</button>' : '') + '</div>';
                if (row.k === 'wall') h += '<div class="ed-note">key = the outside sheet, keyIn = the inside (the right-hand face walking start → end). BUILD → DOOR GAP / WINDOW cuts an opening.</div>';
                if (row.k === 'opening') h += '<div class="ed-note">An opening in wall ' + esc(row.wall) + ', at = metres from the wall\'s start (MOVE slides it). sill 0 = a door gap; glaze = glass.</div>';
                if (row.k === 'kit') h += '<div class="ed-note">A kit: the game\'s ' + esc(row.fn) + ' builder; args are its form (metres, degrees, about its own 0, 0).</div>';
                h += '<div class="ed-sub">RAW</div><textarea class="ed-raw" id="edRaw" rows="6">' + esc(JSON.stringify(row, null, 1)) + '</textarea><button class="ed-btn" id="edRawApply">APPLY RAW</button>';
            }
            if (x.list === 'doors') {
                var da = row.action || {}, far = da.room ? DOOR_HQ.rooms[da.room] : null, dbad = (ED.doorBad || []).filter(function (b) { return b.room === ED.roomId && b.door === row.id; })[0];
                h += '<div class="ed-sub">LEADS TO</div><div class="ed-note' + (dbad ? ' ed-warnt' : '') + '">' + (far ? esc(far.label || da.room) + ' (' + esc(da.room) + ') · ' + (da.at ? 'you arrive at its door ' + esc(da.at) : 'you arrive at its spawn') : 'NOWHERE: that room is not in your world') + (dbad && dbad.why === 'no door' ? ' · THAT DOOR IS NOT THERE (LEADS TO… fixes it)' : '') + '</div>';
            }
            if (x.list === 'npcSpots') h += '<div class="ed-note">race = who stands here (a native of this room) · cast = one of the story\'s models · neither = one of your vessels (up to 3 a room) · say = what they say (a line, or a list: one a day).</div>';
            if (x.list === 'agents') h += '<div class="ed-note">pose = a building pose (sit, phone, arms folded …) · patrol = walks a loop · line = what the agent says.</div>';
            if (x.list === 'counters') h += '<div class="ed-note">A sign: label and sub are its plate, desc is what reading it shows; verb is the prompt (READ).</div>';
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
        groundWire(P);
        act('dup', duplicateRoom); act('start', setStart); act('del', deleteRoom); act('copy', copyIntoWorld);
        act('dupr', duplicateSel); act('delr', deleteSel); act('array', arraySel); act('mirx', function () { mirrorSel('x'); }); act('mirz', function () { mirrorSel('z'); });
        act('topf', selToPrefab); act('bake', bakeSel); act('pfedit', function () { if (hits[0] && hits[0].row.pf) enterPrefab(hits[0].row.pf); }); act('pfdone', leavePrefab); act('pfdel', function () { deletePrefab(ED.pfId); }); act('target', function () { if (hits[0]) doorRetarget(hits[0]); }); act('follow', function () { if (hits[0]) doorFollow(hits[0]); });
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
        if (scope === 'ground') {   // E3: the sea and the floating ground (whole objects under terrain)
            var TG = room().terrain; if (!TG) return false;
            var gk = /^sea/.test(k) ? 'sea' : 'float', gb = TG[gk], ga;
            if (k === 'sea') ga = v ? { y: 0, key: 'water' } : undefined;
            else if (k === 'floating') ga = v ? { depth: 14 } : undefined;
            else if (k === 'floatDepth') ga = Object.assign({}, typeof gb === 'object' && gb ? gb : {}, { depth: Math.max(2, v) });
            else ga = Object.assign({ y: 0 }, gb || {}, k === 'seaY' ? { y: v } : k === 'seaKey' ? { key: v || 'water' } : { under: !!v });
            commit([{ path: basePath().concat(['terrain', gk]), before: gb === undefined ? undefined : Core.clone(gb), after: ga }], gk);
            return true;
        }
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
            ED.mode === 'land' ? '<b>LAND · ' + esc(LAND_TOOLS[landTool()].label) + '</b> · ' + (ED.opts.landView === 'map' ? 'MAP' : '3D') + (ED.land ? ' · ' + ED.land.E.grid.filter(Boolean).length + ' tile(s) shaped' : '') : '',
            (ED.mode === 'land' && ED.land) ? (function () { var ck = landCheck(); return ck.length ? '<b class="ed-warn" title="' + esc(ck.join(' · ')) + '">' + ck.length + ' PLACE WARNING' + (ck.length > 1 ? 'S' : '') + '</b>' : ''; })() : '',
            ED.draw ? '<b>' + esc(DRAWS[ED.draw.tool] ? DRAWS[ED.draw.tool].label : 'PLACE') + '</b>' + (ED._drawInfo ? ' ' + esc(ED._drawInfo) : '') : '',
            'eye ' + ED.cam.x.toFixed(1) + ', ' + ED.cam.y.toFixed(1) + ', ' + ED.cam.z.toFixed(1) + ' · ' + ED.cam.speed.toFixed(0) + ' m/s',
            ED.ready ? 'READY' : 'BUILDING…',
            'lights ' + lights + (cap ? ' / ' + cap : ''),
            perf && perf.fps ? Math.round(perf.fps) + ' fps' : '',
            (ED.doorBad && ED.doorBad.length) ? '<b class="ed-warn" title="' + esc(ED.doorBad.map(function (b) { return b.room + ' ' + b.door + ': ' + b.why; }).join(' · ')) + '">' + ED.doorBad.length + ' DOOR' + (ED.doorBad.length > 1 ? 'S LEAD' : ' LEADS') + ' NOWHERE</b>' : '',
            ED.band.on ? '<b>LEVEL ' + ED.band.y0 + ' → ' + ED.band.y1 + ' m</b>' : '',
            ED.audit.walls ? (ED.auditRes.none ? 'walls: no ground here' : ED.auditRes.walls == null ? 'walls …' : (ED.auditRes.walls ? '<b class="ed-warn">' + ED.auditRes.walls + ' INVISIBLE WALL' + (ED.auditRes.walls > 1 ? 'S' : '') + '</b>' : 'no invisible walls')) : '',
            ED.audit.pockets ? (ED.auditRes.none ? '' : ED.auditRes.pockets == null ? 'pockets …' : (ED.auditRes.pockets ? '<b class="ed-warn">POCKETS ' + ED.auditRes.pocketM + ' m² nobody reaches</b>' : 'no pockets')) : '',
            ED.audit.fight ? (ED.auditRes.fight ? 'fight window: ' + ED.auditRes.fight.ins + ' / ' + ED.auditRes.fight.n + ' tiles · reach ' + ED.auditRes.fight.reach : 'fight window: none here') : '',
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
    function panels() { var LS = $('edLeft'), lsc = LS ? LS.scrollTop : 0; panels0(); if (LS) LS.scrollTop = lsc; }
    function panels0() { try { ED.doorBad = (ED.doc && W.hqWorldDocDoorCheck) ? W.hqWorldDocDoorCheck(ED.doc) : []; } catch (e) { ED.doorBad = []; } toolsBar(); palette(); outliner(); inspector(); banner(); status(); }

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
            ['The palette tabs (left)', 'MODELS · PEOPLE · TREES · DOORS · LIGHTS · MARKERS · TEXTURES · KITS: click a tile, then click on the ground (again for more copies; it faces you). ESC or V stops. The armed tile again stops too'],
            ['DOOR (BUILD or DOORS)', 'click a wall you drew (a gap is cut, the door stands in it) or the ground; then pick the room it leads to and where you arrive (a new door back, its spawn, or one of its doors)'],
            ['TEXTURES', 'click a sheet, then a face: a wall\'s outside / inside, a floor, a block; the open ground = the room\'s floor'],
            ['GROUND (left)', 'RAISE, LOWER, SMOOTH, FLATTEN, TERRACE, CLIFF, SET: hold the left mouse over the ground ([ ] size the brush, SHIFT turns RAISE into LOWER) · RAMP: drag foot → head · PAINT: pick a sheet (+ SHEET), then paint (8 sheets a room) · POOL: drag middle → rim · STREAM: click its course, ENTER ends it'],
            ['PLATFORM · DECK (BUILD)', 'drag a rectangle: a floating platform / a railed deck at HEIGHT'],
            ['L · Shift L', 'the level band on / off · up a floor (the top bar: its bottom, its top, ▼ ▲): only what overlaps it picks, everything above it is cut away'],
            ['AUDIT (top bar)', 'WALLS: red posts where the walker is stopped by nothing you can see · POCKETS: yellow ground nobody reaches from the spawn or a door · FIGHT: the 8 × 8 battle window at the cursor'],
            ['THE LAND (outliner, VIEW)', 'your world map: MAP (wheel zooms, right drag pans) or 3D (TAB / M switches). BRUSHES and PAINT: hold the left mouse ([ ] size) · LINES: click the points, ENTER ends (BACKSPACE takes one back) · PLACE: pick a room, click where it stands · SELECT: click a thing to edit or DELETE it'],
            ['P', 'PLAY HERE: the walker at the cursor, the real game; ESC comes back'], ['Esc', 'drop the pick'],
        ].map(function (r) { return '<div><b>' + r[0] + '</b><span>' + r[1] + '</span></div>'; }).join('') +
        '</div><div class="ed-note">Your world starts flat and empty. BUILD draws the architecture; EDIT → SAVE SELECTION AS PREFAB makes a reusable group (PREFABS, left, edits it: every copy follows); EDIT → ARRAY / MIRROR copy and flip. ADD puts shapes, prefabs, kits, props and doors at the cursor; the inspector edits every field; ROOM → THE LIBRARY opens a built-in room to look at or copy. FILE → EXPORT makes the zip for the bucket (Assets/World/). Everything autosaves in this browser.</div><div class="ed-acts"><button class="ed-btn" id="edCancel">CLOSE</button></div>');
        $('edCancel').onclick = modalClose;
    }

    /* ══ THE LAND (E4, EDITOR_PLAN §5.5 + §5.6): his land in memory (data.js hqLandEd*), seen two ways — the MAP (top-down, the
       bake's shading, the vector layers) and 3D (the renderer streams the land from memory, HQ_LAND_STORE.src). It starts flat
       and empty (a disc with the ice wall round it); the old land is never imported. BRUSHES shape the 2 m lattice; LINES stamp
       ridges, valleys, plateaus, rivers, roads, the coast and lakes; PLACES stand his rooms on levelled pads; REGIONS and REVEALS
       are the map's areas and its first-seen points; SIGHT shows what is seen from a point (information only). Every stamp and
       every stroke is ONE undo step: the doc's vector patches + `step.land` (each touched tile before and after). The lattice
       lives in IndexedDB (store 'land', one record a tile), the vectors in the project's doc (doc.landEd). EXPORT writes
       Assets/World/land/ (land.json, land-map.png, sea.bin, the tiles that changed) + world.json `land`. ═════════════════════ */
    var LAND_ROOM = '__ed_land';
    ED.land = null;
    var LAND_TOOLS = {
        pick:    { label: 'SELECT',   how: 'pick',  grp: 'mark',  tip: 'Click a place, a route, a river, a lake, a region or a reveal on the MAP to edit it (the inspector, right).' },
        raise:   { label: 'RAISE',    how: 'brush', grp: 'brush', tip: 'Hold the left mouse: the ground rises (SHIFT lowers).' },
        lower:   { label: 'LOWER',    how: 'brush', grp: 'brush', tip: 'Hold the left mouse: the ground sinks.' },
        smooth:  { label: 'SMOOTH',   how: 'brush', grp: 'brush', tip: 'Hold the left mouse: bumps and edges even out.' },
        flatten: { label: 'FLATTEN',  how: 'brush', grp: 'brush', tip: 'Hold the left mouse: the ground eases to the height where the stroke began.' },
        terrace: { label: 'TERRACE',  how: 'brush', grp: 'brush', tip: 'Hold the left mouse: the slope steps (STEP m a step).' },
        set:     { label: 'SET',      how: 'brush', grp: 'brush', tip: 'Hold the left mouse: the ground goes to HEIGHT (m, absolute).' },
        cliff:   { label: 'CLIFF',    how: 'brush', grp: 'brush', tip: 'Hold the left mouse: a hard-edged block at HEIGHT (a steep face is a cliff: drawn as rock, the walker cannot climb it).' },
        roughen: { label: 'ROUGHEN',  how: 'brush', grp: 'brush', tip: 'Hold the left mouse: a hand stroke of noise (the only noise in the editor).' },
        mat:     { label: 'MATERIAL', how: 'brush', grp: 'paint', tip: 'Hold the left mouse: paint the ground (pick one of the 24 below).' },
        forest:  { label: 'FOREST',   how: 'brush', grp: 'paint', tip: 'Hold the left mouse: trees (DENSITY 0 – 1; 0 clears them). The game places them as you walk.' },
        water:   { label: 'WATER',    how: 'brush', grp: 'paint', tip: 'Hold the left mouse: standing water at LEVEL over the ground under it.' },
        dry:     { label: 'DRY',      how: 'brush', grp: 'paint', tip: 'Hold the left mouse: the water goes.' },
        clear:   { label: 'CLEAR',    how: 'brush', grp: 'paint', tip: 'Hold the left mouse: back to the flat start (height, paint, trees, water).' },
        ridge:   { label: 'RIDGE',    how: 'line',  grp: 'line',  tip: 'Click its course, ENTER ends it: a raised band (WIDTH, HEIGHT).' },
        valley:  { label: 'VALLEY',   how: 'line',  grp: 'line',  tip: 'Click its course, ENTER ends it: a sunk band (WIDTH, DEPTH = HEIGHT).' },
        plateau: { label: 'PLATEAU',  how: 'poly',  grp: 'line',  tip: 'Click its outline, ENTER closes it: level ground at HEIGHT, eased down over EDGE.' },
        river:   { label: 'RIVER',    how: 'line',  grp: 'line',  tip: 'Click from the source down, ENTER ends it: the bed is carved, the water runs downhill (a falls where it drops).' },
        road:    { label: 'ROUTE',    how: 'line',  grp: 'line',  tip: 'Click its course, ENTER ends it: graded, flat across, a bridge where the ground falls away, rails where it drops.' },
        lane:    { label: 'LANE',     how: 'line',  grp: 'line',  tip: 'A narrower dirt road, steeper allowed. Click its course, ENTER ends it.' },
        trail:   { label: 'TRAIL',    how: 'line',  grp: 'line',  tip: 'A footpath. Click its course, ENTER ends it.' },
        coast:   { label: 'COAST',    how: 'poly',  grp: 'line',  tip: 'Click round your land, ENTER closes it: outside every coast is the sea (a beach, then deep water). Draw more for islands.' },
        lake:    { label: 'LAKE',     how: 'poly',  grp: 'line',  tip: 'Click its shore, ENTER closes it: a bed at LEVEL − DEPTH, the water at LEVEL.' },
        place:   { label: 'PLACE',    how: 'click', grp: 'mark',  tip: 'Pick one of your rooms, then click where it stands: its pad is levelled under it (FLOAT skips the pad).' },
        region:  { label: 'REGION',   how: 'poly',  grp: 'mark',  tip: 'Click its outline, ENTER closes it: an area of the map (Area N).' },
        reveal:  { label: 'REVEAL',   how: 'click', grp: 'mark',  tip: 'Click: a point that shows its region on the map when the player first stands there.' },
        sight:   { label: 'SIGHT',    how: 'click', grp: 'mark',  tip: 'Click: what is seen from there (green on the map). Information only. ESC clears it.' },
    };
    var LAND_OPTS = {
        brush: [['landR', 'Radius (m) · [ ]'], ['landS', 'Strength (0 – 1)'], ['landHard', 'Hard edge (0 – 0.95)']],
        set: [['landH', 'Height (m, absolute)']], cliff: [['landH', 'Height (m, absolute)']], terrace: [['landStep', 'Step (m)']],
        forest: [['landForest', 'Density (0 – 1)']], water: [['landWater', 'Level (m)']],
        ridge: [['ridgeW', 'Width (m)'], ['ridgeH', 'Height (m)']], valley: [['ridgeW', 'Width (m)'], ['ridgeH', 'Depth (m)']],
        plateau: [['plateauH', 'Height (m, absolute)'], ['plateauEdge', 'Edge (m)']],
        river: [['riverW0', 'Width at the source (m)'], ['riverW1', 'Width at the mouth (m)'], ['riverD', 'Depth (m)']],
        lake: [['lakeLevel', 'Level (m)'], ['lakeDepth', 'Depth (m)']],
    };
    Object.assign(ED.opts, { landTool: 'pick', landR: 40, landS: 0.5, landHard: 0.3, landH: 12, landStep: 5, landMat: 'grass', landForest: 0.8, landWater: 1.5,
        ridgeW: 90, ridgeH: 30, plateauH: 20, plateauEdge: 30, riverW0: 6, riverW1: 16, riverD: 2.2, lakeLevel: 1.5, lakeDepth: 4, landView: 'map' });
    function landDoc() {
        var D = ED.doc.landEd || (ED.doc.landEd = {});
        ['coasts', 'places', 'regions', 'reveals', 'roads', 'rivers', 'lakes', 'lines'].forEach(function (k) { if (!Array.isArray(D[k])) D[k] = []; });
        return D;
    }
    function landHas() { var D = ED.doc && ED.doc.landEd; if (ED.land && ED.land.E.grid.some(Boolean)) return true; return !!(D && ['coasts', 'places', 'regions', 'reveals', 'roads', 'rivers', 'lakes', 'lines'].some(function (k) { return D[k] && D[k].length; })); }
    function landTool() { return LAND_TOOLS[ED.opts.landTool] ? ED.opts.landTool : 'pick'; }
    /* the lattice in IndexedDB: one record a tile ('<project>|<index>'), written as they change */
    function landKeyRange(name) { return IDBKeyRange.bound(name + '|', name + '|￿'); }
    function landLoadRaster(name) {
        return idbDo('land', 'readonly', function (st) { return st.getAll(landKeyRange(name)); }).then(function (a) { return a || []; }).catch(function () { return []; });
    }
    function landSaveSoon() { clearTimeout(ED.landSaveTimer); ED.landSaveTimer = setTimeout(landSaveNow, 1500); }
    function landSaveNow() {
        var L = ED.land; if (!L || !ED.project || !L.unsaved.size) return Promise.resolve(true);
        var keys = Array.from(L.unsaved), name = ED.project; L.unsaved.clear();
        return idbDo('land', 'readwrite', function (st) {
            keys.forEach(function (k) { var t = L.E.grid[k], id = name + '|' + k; if (t) st.put({ k: k, h: t.h, mat: t.mat, forest: t.forest, water: t.water }, id); else st.delete(id); });
        }).catch(function (e) { keys.forEach(function (k) { L.unsaved.add(k); }); console.warn('[editor] the land did not save', e); toast('THE LAND DID NOT SAVE · ' + (e && e.message || e), 5000); });
    }
    function landRasterClear(name) { return idbDo('land', 'readwrite', function (st) { return st.delete(landKeyRange(name)); }).catch(function () {}); }
    function landTileFrom(E, k, v) {
        var ti = k % E.per, tj = Math.floor(k / E.per), t = E.grid[k];
        if (!t) { var b = W.hqLandEdBlank(E, ti, tj); t = { ti: ti, tj: tj, S: b.S, x0: b.x0, z0: b.z0, h: new Float32Array(b.h.length), mat: new Uint8Array(b.h.length), forest: new Uint8Array(b.h.length), water: null, used: 0, bytes: b.h.length * 6 }; E.grid[k] = t; }
        t.h.set(v.h); t.mat.set(v.mat); t.forest.set(v.forest);
        if (v.water) { if (!t.water) t.water = new Float32Array(v.water.length); t.water.set(v.water); t.bytes = t.h.length * 10; } else if (t.water) { t.water = null; t.bytes = t.h.length * 6; }
        return t;
    }
    /* the land of this project (made once, from IndexedDB) */
    function landEnsure() {
        if (ED.land && ED.land.project === ED.project) return Promise.resolve(ED.land);
        var E = W.hqLandEdNew(), D = landDoc();
        if (D.coasts.length) { E.coasts = Core.clone(D.coasts); E.cD = W.hqLandEdCoastField(E, E.coasts); }
        ED.land = { project: ED.project, E: E, W: null, unsaved: new Set(), pend: new Set(), liveAt: 0, stroke: null, pts: [], sel: null, sight: null, map: { cx: 0, cz: 0, s: 4 }, img: null, imgData: null, mapDirty: true, exported: null };
        var L = ED.land;
        return landLoadRaster(ED.project).then(function (rows) {
            rows.forEach(function (v) { if (v && v.h && v.k >= 0 && v.k < E.per * E.per) landTileFrom(E, v.k, v); });
            E.changed.clear();
            L.W = W.hqLandEdWorld(E);
            return L;
        });
    }
    function landRoom() {
        var src = (DOOR_HQ.rooms || {}).land, S = src ? Core.clone(src.shell) : { w: 5600, d: 5600, h: 600, open: true, edge: 'open', floor: 'grass' };
        DOOR_HQ.rooms[LAND_ROOM] = { id: LAND_ROOM, label: 'THE LAND', sub: String(ED.project || '').toUpperCase(), kind: 'box', land: true, shell: S, doors: [], props: [], spawn: { x: 0, z: 0, face: 0 } };
    }
    function landOv() { return W.hqLandEdIndex(ED.land.E, landDoc(), { tiles: [] }); }
    function landInstall() { landRoom(); W.hqLandEdInstall(ED.land.E, landOv(), ED.land.W); }
    function landUninstall() { try { W.hqLandEdUninstall(); } catch (e) { console.warn('[editor] the land did not let go', e); } }
    /* the vectors changed: the runtime re-reads the places, the roads, the rivers, the regions */
    function landReindex(o) {
        if (!ED.land) return;
        try { W.hqLandEdInstall(ED.land.E, landOv(), ED.land.W); } catch (e) { console.warn('[editor] the land index', e); }
        if (ED.mode === 'land') { try { ThreeRenderer.hq.landEdited([], o || { roads: true, falls: true }); } catch (e) {} }
    }
    function landOpen() {
        if (!ED.doc) return;
        saveCam();
        landEnsure().then(function () {
            landInstall();
            var first = !ED.landCamSet; ED.landCamSet = true;
            if (first && !(ED.landCam)) Object.assign(ED.cam, { x: 0, y: 140, z: 320, yaw: 0, pitch: -0.42, speed: 60 });
            else if (ED.landCam) Object.assign(ED.cam, ED.landCam);
            enterRoom(LAND_ROOM, 'land', { keepCam: true });
            landMapShow();
        }).catch(function (e) { console.error('[editor] the land', e); toast('THE LAND DID NOT OPEN · ' + (e && e.message || e), 6000); });
    }
    /* ── THE STROKE (a brush held down, in either view) ── */
    function landStrokeStart(at, shift) {
        var L = ED.land, tool = landTool(); if (!L || !at || LAND_TOOLS[tool].how !== 'brush') return false;
        if (tool === 'raise' && shift) tool = 'lower';
        L.E.touch = new Map();
        L.stroke = { tool: tool, at: at, h0: W.hqLandEdHeight(L.E, at.x, at.z), box: null };
        return true;
    }
    function landDab(dt) {
        var L = ED.land, S = L && L.stroke; if (!S || !S.at) return;
        var O = ED.opts, t = S.tool, o = { r: +O.landR || 40, hard: +O.landHard || 0 }, str = Math.max(0.02, Math.min(1, +O.landS || 0.5));
        if (t === 'raise' || t === 'lower') { o.s = 1; o.amt = 14 * str * dt; }
        else if (t === 'roughen') { o.s = 1; o.amt = 10 * str * dt; }
        else o.s = Math.min(1, str * dt * 5);
        if (t === 'set' || t === 'cliff') o.h = +O.landH;
        if (t === 'flatten') o.h = S.h0;
        if (t === 'terrace') o.step = +O.landStep || 5;
        if (t === 'mat') o.mat = W.hqLandEdMatId(O.landMat);
        if (t === 'forest') { o.f = Math.max(0, Math.min(1, +O.landForest)); o.s = Math.min(1, str * dt * 6); }
        if (t === 'water') o.h = +O.landWater;
        var tl = W.hqLandEdBrush(L.E, t, S.at.x, S.at.z, o);
        tl.forEach(function (k) { L.pend.add(k); });
        var r = o.r; S.box = S.box ? [Math.min(S.box[0], S.at.x - r), Math.min(S.box[1], S.at.z - r), Math.max(S.box[2], S.at.x + r), Math.max(S.box[3], S.at.z + r)] : [S.at.x - r, S.at.z - r, S.at.x + r, S.at.z + r];
        if (performance.now() - L.liveAt > 150) landLive();
    }
    function landStrokeEnd() {
        var L = ED.land, S = L && L.stroke; if (!S) return;
        L.stroke = null;
        landLive();
        landCommit([], LAND_TOOLS[S.tool] ? LAND_TOOLS[S.tool].label.toLowerCase() : S.tool, landTake(), { far: true });
    }
    /* the tiles this step changed: before (filed on their first write) and after */
    function landSnap(t) { return t ? { h: t.h.slice(), mat: t.mat.slice(), forest: t.forest.slice(), water: t.water ? t.water.slice() : null } : null; }
    function landTake() {
        var L = ED.land, E = L.E, out = [];
        if (E.touch) E.touch.forEach(function (before, k) { out.push({ k: k, before: before, after: landSnap(E.grid[k]) }); });
        E.touch = null;
        return out;
    }
    function snapBytes(s) { return s ? s.h.byteLength + s.mat.byteLength + s.forest.byteLength + (s.water ? s.water.byteLength : 0) : 0; }
    function landSnapsApply(snaps, which) {
        var E = ED.land.E;
        snaps.forEach(function (s) { var v = s[which]; if (v) landTileFrom(E, s.k, v); else E.grid[s.k] = null; ED.land.unsaved.add(s.k); });
    }
    /* THE LIVE VIEW: the tiles a stroke touched so far go to the renderer, the map and the 8 m world */
    function landLive() {
        var L = ED.land; if (!L) return;
        L.liveAt = performance.now();
        var list = Array.from(L.pend); L.pend.clear(); if (!list.length) return;
        if (ED.mode === 'land') { try { ThreeRenderer.hq.landEdited(list); } catch (e) {} }
        landPatch(list);
    }
    function landBoxOf(list) {
        var E = ED.land.E, b = [Infinity, Infinity, -Infinity, -Infinity];
        list.forEach(function (k) { var ti = k % E.per, tj = Math.floor(k / E.per), x0 = -E.ext + ti * E.tile, z0 = -E.ext + tj * E.tile; b[0] = Math.min(b[0], x0); b[1] = Math.min(b[1], z0); b[2] = Math.max(b[2], x0 + E.tile); b[3] = Math.max(b[3], z0 + E.tile); });
        return b;
    }
    function landPatch(list, all) {
        var L = ED.land, E = L.E;
        if (all || !list.length) { L.W = W.hqLandEdWorld(E, L.W); L.mapDirty = true; }
        else {
            var b = landBoxOf(list);
            W.hqLandEdWorld(E, L.W, b);
            if (L.imgData) { var px = W.HQ_LAND_EDIT_RULES.map, i0 = Math.floor((b[0] + E.ext) / px) - 1, j0 = Math.floor((b[1] + E.ext) / px) - 1, i1 = Math.ceil((b[2] + E.ext) / px) + 1, j1 = Math.ceil((b[3] + E.ext) / px) + 1; W.hqLandEdMapRGBA(E, L.imgData.data, [i0, j0, i1, j1]); L.imgCtx.putImageData(L.imgData, 0, 0, Math.max(0, i0), Math.max(0, j0), i1 - i0 + 1, j1 - j0 + 1); }
        }
        mapDraw();
    }
    /* ONE UNDO STEP on the land: the doc's patches (the vectors) + the tiles' snapshots */
    var LAND_UNDO_BYTES = 256 * 1048576;
    function landCommit(step, label, snaps, o) {
        step = step || [];
        if (!step.length && !(snaps && snaps.length)) return;
        try { Core.stepDo(ED.doc, step); } catch (e) { console.warn('[editor] the land edit failed', e); toast('THAT EDIT FAILED · ' + e.message, 4000); return; }
        step.label = label || 'land'; step.land = (snaps && snaps.length) ? snaps : null; step.landO = o || {};
        step.landBytes = (snaps || []).reduce(function (a, s) { return a + snapBytes(s.before) + snapBytes(s.after); }, 0);
        ED.undo.push(step); ED.redo = [];
        var tot = ED.undo.reduce(function (a, s) { return a + (s.landBytes || 0); }, 0);
        while ((ED.undo.length > UNDO_MAX || tot > (W.HQ_LAND_EDIT_RULES.undoMB || 256) * 1048576) && ED.undo.length > 1) { tot -= ED.undo[0].landBytes || 0; ED.undo.shift(); }
        landAfter(step);
    }
    function isLandStep(s) { return !!(s && (s.land || s.some(function (p) { return p.path[0] === 'landEd'; }))); }
    function landAfter(step) {
        var L = ED.land; if (!L) { saveSoon(); panels(); return; }
        var o = step.landO || {}, keys = (step.land || []).map(function (s) { return s.k; }), vec = step.some(function (p) { return p.path[0] === 'landEd'; });
        keys.forEach(function (k) { L.unsaved.add(k); });
        if (step.some(function (p) { return p.path[0] === 'landEd' && p.path[1] === 'coasts'; })) {
            var E = L.E; E.coasts = Core.clone(landDoc().coasts); E.cD = W.hqLandEdCoastField(E, E.coasts); E.plain = null; E.blank.clear();
            keys = []; for (var k = 0; k < E.per * E.per; k++) keys.push(k); o = Object.assign({}, o, { far: true });
        }
        if (vec) landReindex({ roads: true, falls: true });
        if (ED.mode === 'land') { try { ThreeRenderer.hq.landEdited(keys, { far: !!o.far || keys.length > 24 }); } catch (e) {} }
        landPatch(keys, keys.length > 60);
        saveSoon(); landSaveSoon();
        if (L.sel && !landSelRow(L.sel)) L.sel = null;
        panels();
    }
    /* ── THE LINES: points clicked, ENTER finishes ── */
    function landNo(list, prefix) { var n = 1, ids = {}; list.forEach(function (r) { ids[r.id] = 1; }); while (ids[prefix + n]) n++; return n; }
    function landFinish() {
        var L = ED.land, tool = landTool(), T = LAND_TOOLS[tool], pts = L.pts.map(function (p) { return [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]; }), O = ED.opts, D = landDoc(), E = L.E;
        L.pts = []; landLineShow();
        if (!T || pts.length < (T.how === 'poly' ? 3 : 2)) { mapDraw(); return; }
        var step = [], label = T.label.toLowerCase(), res, o = {};
        E.touch = new Map();
        try {
            if (tool === 'ridge' || tool === 'valley' || tool === 'plateau') {
                if (tool === 'plateau') W.hqLandEdPlateau(E, pts, { h: +O.plateauH, edge: +O.plateauEdge });
                else W.hqLandEdRidge(E, pts, { w: +O.ridgeW, h: +O.ridgeH, valley: tool === 'valley' });
                var nl = landNo(D.lines, tool);
                step.push({ path: ['landEd', 'lines', D.lines.length], before: undefined, after: { id: tool + nl, label: T.label.charAt(0) + T.label.slice(1).toLowerCase() + ' ' + nl, kind: tool, pts: pts, w: +O.ridgeW, h: tool === 'plateau' ? +O.plateauH : +O.ridgeH } });
            } else if (tool === 'river') {
                res = W.hqLandEdRiver(E, pts, { w0: +O.riverW0, w1: +O.riverW1, depth: +O.riverD });
                var nr = landNo(D.rivers, 'river');
                step.push({ path: ['landEd', 'rivers', D.rivers.length], before: undefined, after: Object.assign({ id: 'river' + nr, label: 'River ' + nr }, res.row) });
            } else if (tool === 'road' || tool === 'lane' || tool === 'trail') {
                res = W.hqLandEdRoad(E, pts, { type: tool });
                var pre = { road: 'Route ', lane: 'Lane ', trail: 'Trail ' }[tool], nn = 1, used = {};
                D.roads.forEach(function (r) { used[r.label] = 1; }); while (used[pre + nn]) nn++;
                step.push({ path: ['landEd', 'roads', D.roads.length], before: undefined, after: Object.assign({ id: tool + '_' + landNo(D.roads, tool + '_'), label: pre + nn, bridges: res.bridges }, res.row) });
            } else if (tool === 'lake') {
                res = W.hqLandEdLake(E, pts, { level: +O.lakeLevel, depth: +O.lakeDepth });
                var nk = landNo(D.lakes, 'lake');
                step.push({ path: ['landEd', 'lakes', D.lakes.length], before: undefined, after: Object.assign({ id: 'lake' + nk, label: 'Lake ' + nk }, res.row) });
            } else if (tool === 'coast') {
                var nc = D.coasts.concat([pts]);
                W.hqLandEdCoast(E, nc);
                step.push({ path: ['landEd', 'coasts'], before: Core.clone(D.coasts), after: nc });
                o.far = true;
            } else if (tool === 'region') {
                var ng = landNo(D.regions, 'area');
                step.push({ path: ['landEd', 'regions', D.regions.length], before: undefined, after: { id: 'area' + ng, label: 'Area ' + ng, pts: pts } });
            }
        } catch (e) { console.error('[editor] the stamp', e); toast('THAT STAMP FAILED · ' + e.message, 4000); }
        landCommit(step, label, landTake(), Object.assign({ far: true }, o));
    }
    function landClick(at) {
        var L = ED.land, tool = landTool(), T = LAND_TOOLS[tool], D = landDoc();
        if (!at) return;
        if (T.how === 'line' || T.how === 'poly') { L.pts.push([at.x, at.z]); landLineShow(); mapDraw(); return; }
        if (tool === 'pick') { var hit = landHit(at.x, at.z, landPickR()); L.sel = hit; panels(); mapDraw(); return; }
        if (tool === 'reveal') { var nv = landNo(D.reveals, 'v'); landCommit([{ path: ['landEd', 'reveals', D.reveals.length], before: undefined, after: { id: 'v' + nv, label: 'Reveal ' + nv, at: [Math.round(at.x), Math.round(at.z)] } }], 'reveal'); return; }
        if (tool === 'sight') {
            if (!L.W) L.W = W.hqLandEdWorld(L.E);
            L.sight = W.hqLandEdSight(L.E, L.W, at.x, at.z);
            var seen = 0, tot = 0; L.sight.rays.forEach(function (r) { r.forEach(function (s) { seen += s[1] - s[0]; }); tot += L.sight.maxD; });
            toast('SIGHT from ' + Math.round(at.x) + ', ' + Math.round(at.z) + ' (eye ' + L.sight.y.toFixed(1) + ' m) · ' + Math.round(seen / tot * 100) + '% of the rays reach the ground they cross · ESC clears', 5000);
            mapDraw(); return;
        }
        if (tool === 'place') landPlaceAt(at);
    }
    function landPickR() { return ED.opts.landView === 'map' ? 12 * ED.land.map.s : 20; }
    /* PLACES: one of his rooms at a spot; its pad (the room's half-size) levelled at the ground there */
    function landPlaceAt(at) {
        var D = landDoc(), placed = {}; D.places.forEach(function (p) { placed[p.room] = 1; });
        var items = Object.keys(ED.doc.rooms).filter(function (id) { return !placed[id]; }).map(function (id) { var r = ED.doc.rooms[id]; return { label: String(r.label || id), sub: id + ' · ' + roomSize(r), value: id }; });
        if (!items.length) { toast('EVERY ROOM OF YOURS IS ALREADY ON THE LAND (ROOM → NEW ROOM makes another)', 4000); return; }
        pick('WHICH ROOM STANDS HERE? (x ' + Math.round(at.x) + ', z ' + Math.round(at.z) + ')', items, function (rid) {
            var r = ED.doc.rooms[rid], S = (r && r.shell) || {}, half = Math.ceil(Math.max(S.w || 40, S.d || 40, (S.radius || S.r || 0) * 2) / 2);
            var y = Math.round(W.hqLandEdHeight(ED.land.E, at.x, at.z) * 10) / 10, np = landNo(D.places, 'w_p');
            var row = { id: 'w_p' + np, label: String(r.label || ('Area ' + np)), room: rid, kind: 'site', at: [Math.round(at.x), Math.round(at.z)], padY: y, pad: half, float: false, rot: 0 };
            ED.land.E.touch = new Map();
            W.hqLandEdPad(ED.land.E, row.at[0], row.at[1], row.pad, row.padY);
            landCommit([{ path: ['landEd', 'places', D.places.length], before: undefined, after: row }], 'place ' + row.label, landTake(), { far: true });
            ED.land.sel = { kind: 'places', id: row.id }; panels();
        });
    }
    /* the inspector moved / re-levelled a place: the new pad stamped in the same step (the old pad's ground stays: SMOOTH it) */
    function landPlaceSet(i, after, label) {
        var D = landDoc(), before = D.places[i]; if (!before) return;
        ED.land.E.touch = new Map();
        if (!after.float) W.hqLandEdPad(ED.land.E, after.at[0], after.at[1], after.pad, after.padY);
        landCommit([{ path: ['landEd', 'places', i], before: Core.clone(before), after: after }], label || 'place', landTake(), { far: true });
    }
    /* ── WHAT IS UNDER A POINT (the SELECT tool) ── */
    var LAND_LISTS = [['places', 'PLACES'], ['roads', 'ROUTES'], ['rivers', 'RIVERS'], ['lakes', 'LAKES'], ['regions', 'REGIONS'], ['reveals', 'REVEALS'], ['lines', 'SHAPES'], ['coasts', 'COASTS']];
    function landSelRow(s) { var D = landDoc(), L = D[s.kind] || []; if (s.kind === 'coasts') return L[s.id] ? { row: { pts: L[s.id], label: 'Coast ' + (s.id + 1) }, i: s.id } : null; for (var i = 0; i < L.length; i++) if (L[i] && L[i].id === s.id) return { row: L[i], i: i }; return null; }
    function segD(px, pz, P, closed) {
        var d = Infinity, n = P.length;
        for (var k = 0; k < n - (closed ? 0 : 1); k++) { var a = P[k], b = P[(k + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], ll = dx * dx + dz * dz || 1e-9, t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / ll)); d = Math.min(d, Math.hypot(px - a[0] - dx * t, pz - a[1] - dz * t)); }
        return d;
    }
    function landHit(x, z, r) {
        var D = landDoc(), best = null, bd = r;
        var cand = function (kind, id, d) { if (d < bd) { bd = d; best = { kind: kind, id: id }; } };
        D.places.forEach(function (p) { var h = p.pad || 20; cand('places', p.id, Math.max(0, Math.max(Math.abs(x - p.at[0]), Math.abs(z - p.at[1])) - h) * 0.5); });
        D.reveals.forEach(function (v) { cand('reveals', v.id, Math.hypot(x - v.at[0], z - v.at[1])); });
        D.roads.forEach(function (rd) { cand('roads', rd.id, segD(x, z, rd.pts, false)); });
        D.rivers.forEach(function (rv) { cand('rivers', rv.id, segD(x, z, rv.pts, false)); });
        D.lakes.forEach(function (lk) { cand('lakes', lk.id, segD(x, z, lk.pts, true)); });
        D.lines.forEach(function (ln) { cand('lines', ln.id, segD(x, z, ln.pts, ln.kind === 'plateau')); });
        D.regions.forEach(function (rg) { cand('regions', rg.id, segD(x, z, rg.pts, true)); });
        D.coasts.forEach(function (c, i) { cand('coasts', i, segD(x, z, c, true)); });
        return best;
    }
    function landFrame(s) {
        var h = landSelRow(s); if (!h) return;
        var P = h.row.at ? [h.row.at] : (h.row.pts || []); if (!P.length) return;
        var x = 0, z = 0; P.forEach(function (p) { x += p[0]; z += p[1]; }); x /= P.length; z /= P.length;
        ED.land.map.cx = x; ED.land.map.cz = z; mapDraw();
        var g = W.hqLandEdHeight(ED.land.E, x, z); ED.cam.x = x; ED.cam.z = z + 120; ED.cam.y = g + 90; ED.cam.yaw = 0; ED.cam.pitch = -0.6;
    }
    function landDelete(s) {
        var D = landDoc(), h = landSelRow(s); if (!h) return;
        if (s.kind === 'coasts') { var nc = D.coasts.filter(function (c, i) { return i !== s.id; }); ED.land.E.touch = new Map(); W.hqLandEdCoast(ED.land.E, nc); landCommit([{ path: ['landEd', 'coasts'], before: Core.clone(D.coasts), after: nc }], 'delete coast', landTake(), { far: true }); }
        else landCommit([{ path: ['landEd', s.kind, h.i], before: Core.clone(h.row), after: undefined }], 'delete ' + (h.row.label || s.kind));
        ED.land.sel = null; panels();
    }
    /* the checks shown in the status line (never blocking): places that overlap, a place whose room is gone, one past the wall */
    function landCheck() {
        var D = landDoc(), out = [], P = D.places, wr = W.HQ_LAND_EDIT_RULES.wall.r;
        P.forEach(function (p, i) {
            if (!ED.doc.rooms[p.room]) out.push(p.label + ': its room is gone');
            if (Math.hypot(p.at[0], p.at[1]) + (p.pad || 0) > wr) out.push(p.label + ': past the ice wall');
            for (var j = i + 1; j < P.length; j++) { var q = P[j]; if (!p.float && !q.float && Math.abs(p.at[0] - q.at[0]) < (p.pad || 0) + (q.pad || 0) && Math.abs(p.at[1] - q.at[1]) < (p.pad || 0) + (q.pad || 0)) out.push(p.label + ' overlaps ' + q.label); }
        });
        return out;
    }
    /* ── THE 3D VIEW'S LINE (the points clicked so far) ── */
    function landLineShow() {
        var L = ED.land; if (!ED.group) return;
        if (L.lineObj) { ED.group.remove(L.lineObj); try { L.lineObj.geometry.dispose(); } catch (e) {} L.lineObj = null; }
        if (!L.pts.length || ED.mode !== 'land') return;
        var u = U(), a = [];
        L.pts.forEach(function (p) { a.push(p[0] * u, (W.hqLandEdHeight(L.E, p[0], p[1]) + 1.5) * u, p[1] * u); });
        if (LAND_TOOLS[landTool()].how === 'poly' && L.pts.length > 2) a.push(a[0], a[1], a[2]);
        var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(a), 3));
        L.lineObj = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xffd84a, depthTest: false, fog: false })); L.lineObj.renderOrder = 15; L.lineObj.frustumCulled = false;
        ED.group.add(L.lineObj);
    }
    /* ── THE MAP (a canvas over the 3D view: the land image at 4 m a pixel + the vectors) ── */
    function landMapImage() {
        var L = ED.land, E = L.E, n = W.hqLandEdMapSize(E);
        if (!L.img) { L.img = document.createElement('canvas'); L.img.width = n; L.img.height = n; L.imgCtx = L.img.getContext('2d'); L.imgData = L.imgCtx.createImageData(n, n); L.mapDirty = true; }
        if (L.mapDirty) { W.hqLandEdMapRGBA(E, L.imgData.data); L.imgCtx.putImageData(L.imgData, 0, 0); L.mapDirty = false; }
        return L.img;
    }
    function landMapShow() {
        var cv = $('edMap'), on = ED.mode === 'land' && ED.opts.landView === 'map';
        if (!cv) return;
        cv.style.display = on ? '' : 'none';
        if (on) mapDraw();
    }
    function mapXY(e) { var cv = $('edMap'), rc = cv.getBoundingClientRect(), M = ED.land.map; return { x: M.cx + (e.clientX - rc.left - rc.width / 2) * M.s, z: M.cz + (e.clientY - rc.top - rc.height / 2) * M.s, sx: e.clientX - rc.left, sy: e.clientY - rc.top }; }
    var _mapRaf = 0;
    function mapDraw() { if (_mapRaf || !ED.land || ED.mode !== 'land' || ED.opts.landView !== 'map') return; _mapRaf = requestAnimationFrame(function () { _mapRaf = 0; try { mapDraw0(); } catch (e) { console.warn('[editor] the map', e); } }); }
    function mapDraw0() {
        var cv = $('edMap'); if (!cv || cv.style.display === 'none') return;
        var L = ED.land, E = L.E, M = L.map, dpr = W.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
        if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
        var c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
        c.fillStyle = '#0c1a2a'; c.fillRect(0, 0, w, h);
        var sx = function (x) { return w / 2 + (x - M.cx) / M.s; }, sy = function (z) { return h / 2 + (z - M.cz) / M.s; };
        var img = landMapImage(), px = W.HQ_LAND_EDIT_RULES.map;
        c.imageSmoothingEnabled = M.s > px * 0.75;
        c.drawImage(img, sx(-E.ext), sy(-E.ext), 2 * E.ext / M.s, 2 * E.ext / M.s);
        var path = function (P, closed) { c.beginPath(); P.forEach(function (p, k) { if (k) c.lineTo(sx(p[0]), sy(p[1])); else c.moveTo(sx(p[0]), sy(p[1])); }); if (closed) c.closePath(); };
        var D = landDoc(), sel = L.sel, isSel = function (kind, id) { return sel && sel.kind === kind && sel.id === id; };
        var label = function (t, x, z, col) { c.font = '11px monospace'; c.fillStyle = 'rgba(0,0,0,0.7)'; var tw = c.measureText(t).width; c.fillRect(sx(x) - tw / 2 - 3, sy(z) - 8, tw + 6, 14); c.fillStyle = col || '#fff'; c.textAlign = 'center'; c.fillText(t, sx(x), sy(z) + 3); };
        /* the ice wall */
        c.strokeStyle = 'rgba(230,240,250,0.6)'; c.lineWidth = 1; c.beginPath(); c.arc(sx(0), sy(0), W.HQ_LAND_EDIT_RULES.wall.r / M.s, 0, Math.PI * 2); c.stroke();
        D.regions.forEach(function (rg) { path(rg.pts, true); c.setLineDash([6, 4]); c.strokeStyle = isSel('regions', rg.id) ? '#ffd84a' : 'rgba(255,255,255,0.75)'; c.lineWidth = 1.5; c.stroke(); c.setLineDash([]); var cx = 0, cz = 0; rg.pts.forEach(function (p) { cx += p[0]; cz += p[1]; }); label(rg.label, cx / rg.pts.length, cz / rg.pts.length, '#dfe'); });
        D.coasts.forEach(function (cs, i) { path(cs, true); c.strokeStyle = isSel('coasts', i) ? '#ffd84a' : 'rgba(255,255,255,0.5)'; c.lineWidth = 1; c.stroke(); });
        D.lines.forEach(function (ln) { path(ln.pts, ln.kind === 'plateau'); c.strokeStyle = isSel('lines', ln.id) ? '#ffd84a' : 'rgba(255,220,160,0.55)'; c.lineWidth = 1; c.setLineDash([2, 3]); c.stroke(); c.setLineDash([]); });
        D.lakes.forEach(function (lk) { path(lk.pts, true); c.strokeStyle = isSel('lakes', lk.id) ? '#ffd84a' : '#9fd4ff'; c.lineWidth = 1.5; c.stroke(); var cx = 0, cz = 0; lk.pts.forEach(function (p) { cx += p[0]; cz += p[1]; }); if (M.s < 8) label(lk.label, cx / lk.pts.length, cz / lk.pts.length, '#bfe4ff'); });
        D.rivers.forEach(function (rv) { path(rv.pts, false); c.strokeStyle = isSel('rivers', rv.id) ? '#ffd84a' : '#5fb4ff'; c.lineWidth = Math.max(1.5, (rv.w0 + rv.w1) / M.s); c.stroke(); });
        D.roads.forEach(function (rd) { path(rd.pts, false); c.strokeStyle = isSel('roads', rd.id) ? '#ffd84a' : rd.type === 'trail' ? '#c9a070' : rd.type === 'lane' ? '#a88a64' : '#3a3a40'; c.lineWidth = Math.max(rd.type === 'trail' ? 1.2 : 2, rd.w / M.s); c.stroke(); (rd.bridges || []).forEach(function (b) { path(b.pts, false); c.strokeStyle = '#e8e6da'; c.lineWidth = Math.max(1, rd.w / M.s * 0.5); c.stroke(); }); var m = rd.pts[Math.floor(rd.pts.length / 2)]; if (m && M.s < 8) label(rd.label, m[0], m[1], '#ffe9b0'); });
        D.reveals.forEach(function (v) { var x = sx(v.at[0]), y = sy(v.at[1]); c.fillStyle = isSel('reveals', v.id) ? '#ffd84a' : '#c58cff'; c.beginPath(); c.moveTo(x, y - 6); c.lineTo(x + 6, y); c.lineTo(x, y + 6); c.lineTo(x - 6, y); c.closePath(); c.fill(); });
        D.places.forEach(function (p) { var hh = (p.pad || 20) / M.s; c.strokeStyle = isSel('places', p.id) ? '#ffd84a' : p.float ? '#9aa4ff' : '#57f287'; c.lineWidth = 2; c.strokeRect(sx(p.at[0]) - hh, sy(p.at[1]) - hh, hh * 2, hh * 2); label(p.label, p.at[0], p.at[1] + (p.pad || 20) + 10 * M.s, '#bff5cf'); });
        /* the sight: every ray's seen runs in green */
        if (L.sight) {
            var S = L.sight; c.strokeStyle = 'rgba(87,242,135,0.55)'; c.lineWidth = 1.2; c.beginPath();
            S.rays.forEach(function (runs, r) { var a = r / S.rays.length * Math.PI * 2, dx = Math.cos(a), dz = Math.sin(a); runs.forEach(function (s) { c.moveTo(sx(S.x + dx * s[0]), sy(S.z + dz * s[0])); c.lineTo(sx(S.x + dx * s[1]), sy(S.z + dz * s[1])); }); });
            c.stroke(); c.fillStyle = '#57f287'; c.beginPath(); c.arc(sx(S.x), sy(S.z), 4, 0, Math.PI * 2); c.fill();
        }
        /* the line being drawn */
        if (L.pts.length) { var poly = LAND_TOOLS[landTool()].how === 'poly', P = L.pts.slice(); if (L.mapCur) P.push([L.mapCur.x, L.mapCur.z]); path(P, poly); c.strokeStyle = '#ffd84a'; c.lineWidth = 2; c.stroke(); L.pts.forEach(function (p) { c.fillStyle = '#ffd84a'; c.fillRect(sx(p[0]) - 2.5, sy(p[1]) - 2.5, 5, 5); }); }
        /* the brush ring and the 3D eye */
        if (L.mapCur && LAND_TOOLS[landTool()].how === 'brush') { c.strokeStyle = '#ffd84a'; c.lineWidth = 1.2; c.beginPath(); c.arc(L.mapCur.sx, L.mapCur.sy, (+ED.opts.landR || 40) / M.s, 0, Math.PI * 2); c.stroke(); }
        var ex = sx(ED.cam.x), ez = sy(ED.cam.z); c.fillStyle = '#6fd3ff'; c.beginPath(); c.moveTo(ex + Math.sin(ED.cam.yaw) * 10, ez - Math.cos(ED.cam.yaw) * 10); c.lineTo(ex + Math.cos(ED.cam.yaw) * 5, ez + Math.sin(ED.cam.yaw) * 5); c.lineTo(ex - Math.cos(ED.cam.yaw) * 5, ez - Math.sin(ED.cam.yaw) * 5); c.closePath(); c.fill();
        c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(8, h - 22, 190, 16); c.fillStyle = '#dfe6ee'; c.font = '11px monospace'; c.textAlign = 'left';
        c.fillText('MAP · ' + (M.s < 1 ? (1 / M.s).toFixed(1) + ' px/m' : M.s.toFixed(1) + ' m/px') + (L.mapCur ? ' · ' + Math.round(L.mapCur.x) + ', ' + Math.round(L.mapCur.z) : ''), 12, h - 10);
    }
    function mapBind(cv) {
        var drag = null;
        cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
        cv.addEventListener('mousedown', function (e) {
            if (!ED.land) return;
            var p = mapXY(e); e.preventDefault();
            if (e.button === 1 || e.button === 2 || (e.button === 0 && e.altKey)) { drag = { x: e.clientX, y: e.clientY, cx: ED.land.map.cx, cz: ED.land.map.cz }; return; }
            if (e.button !== 0) return;
            var at = { x: p.x, z: p.z, y: W.hqLandEdHeight(ED.land.E, p.x, p.z) };
            if (LAND_TOOLS[landTool()].how === 'brush') { landStrokeStart(at, e.shiftKey); return; }
            landClick(at);
        });
        cv.addEventListener('mousemove', function (e) {
            if (!ED.land) return;
            var p = mapXY(e), L = ED.land;
            L.mapCur = p;
            if (drag) { L.map.cx = drag.cx - (e.clientX - drag.x) * L.map.s; L.map.cz = drag.cz - (e.clientY - drag.y) * L.map.s; }
            if (L.stroke) L.stroke.at = { x: p.x, z: p.z };
            ED.cursor = { x: p.x, z: p.z, y: W.hqLandEdHeight(L.E, p.x, p.z) };
            mapDraw();
        });
        cv.addEventListener('mouseleave', function () { if (ED.land) { ED.land.mapCur = null; mapDraw(); } });
        window.addEventListener('mouseup', function () { drag = null; if (ED.land && ED.land.stroke && ED.opts.landView === 'map') landStrokeEnd(); });
        cv.addEventListener('wheel', function (e) {
            if (!ED.land) return; e.preventDefault();
            var M = ED.land.map, p = mapXY(e), k = e.deltaY < 0 ? 1 / 1.25 : 1.25, s = Math.max(0.25, Math.min(8, M.s * k));
            M.cx = p.x - (p.x - M.cx) * s / M.s; M.cz = p.z - (p.z - M.cz) * s / M.s; M.s = s; mapDraw();
        }, { passive: false });
        cv.addEventListener('dblclick', function (e) { if (!ED.land) return; var T = LAND_TOOLS[landTool()]; if (T.how === 'line' || T.how === 'poly') { e.preventDefault(); ED.land.pts.pop(); landFinish(); } });
    }
    function landView(v) {
        ED.opts.landView = v; saveOpts();
        if (v === '3d' && ED.land && ED.land.mapCur) { /* the eye goes where the map was looked at */ }
        landMapShow(); landLineShow(); panels();
    }
    function landKey(k, e) {   // → true when the land took the key
        if (ED.mode !== 'land' || !ED.land) return false;
        var L = ED.land, T = LAND_TOOLS[landTool()];
        if (k === 'tab' || k === 'm') { landView(ED.opts.landView === 'map' ? '3d' : 'map'); return true; }
        if ((T.how === 'line' || T.how === 'poly') && L.pts.length) {
            if (k === 'enter') { landFinish(); return true; }
            if (k === 'escape') { L.pts = []; landLineShow(); mapDraw(); return true; }
            if (k === 'backspace') { L.pts.pop(); landLineShow(); mapDraw(); return true; }
        }
        if (T.how === 'brush' && (k === '[' || k === ']')) { var R = W.HQ_LAND_EDIT_RULES.brush; ED.opts.landR = Math.max(R.rMin, Math.min(R.rMax, Math.round((+ED.opts.landR || 40) * (k === ']' ? 1.25 : 0.8)))); saveOpts(); toast('BRUSH ' + ED.opts.landR + ' m', 900); panels(); mapDraw(); return true; }
        if (k === 'escape' && L.sight) { L.sight = null; mapDraw(); return true; }
        if (k === 'escape' && L.sel) { L.sel = null; panels(); mapDraw(); return true; }
        if ((k === 'delete') && L.sel) { landDelete(L.sel); return true; }
        if (k === 'escape' && landTool() !== 'pick') { ED.opts.landTool = 'pick'; saveOpts(); panels(); return true; }
        return false;
    }
    /* ── THE PANELS in land mode ── */
    function landPaletteHtml() {
        var tool = landTool(), O = ED.opts, h = '<div class="ed-sec ed-pal"><div class="ed-hd">THE LAND · ' + esc(ED.project) + '</div>';
        h += '<div class="ed-palb"><button class="ed-btn' + (O.landView === 'map' ? ' on' : '') + '" data-lview="map" title="The map (TAB or M)">MAP</button><button class="ed-btn' + (O.landView === '3d' ? ' on' : '') + '" data-lview="3d" title="Fly over it (TAB or M)">3D</button></div>';
        [['mark', 'MARKS'], ['brush', 'BRUSHES'], ['paint', 'PAINT'], ['line', 'LINES AND AREAS']].forEach(function (g) {
            h += '<div class="ed-sub">' + g[1] + '</div><div class="ed-palb">';
            Object.keys(LAND_TOOLS).forEach(function (k) { var T = LAND_TOOLS[k]; if (T.grp !== g[0]) return; h += '<button class="ed-btn' + (tool === k ? ' on' : '') + '" data-ltool="' + k + '" title="' + esc(T.tip) + '">' + T.label + '</button>'; });
            h += '</div>';
        });
        var T = LAND_TOOLS[tool];
        h += '<div class="ed-note">' + esc(T.tip) + '</div>';
        var F = [].concat(T.how === 'brush' ? LAND_OPTS.brush : [], LAND_OPTS[tool] || []);
        if (F.length) h += '<div class="ed-form">' + F.map(function (f) { return '<label class="ed-f"><span>' + esc(f[1]) + '</span><input type="number" step="any" data-lo="' + f[0] + '" value="' + esc(O[f[0]]) + '"></label>'; }).join('') + '</div>';
        if (tool === 'mat') {
            h += '<div class="ed-lmats">' + W.HQ_LAND_EDIT_RULES.mats.map(function (m, i) { var c = W.HQ_LAND_MAP_COL[i] || [128, 128, 128]; return '<button class="ed-lmat' + (O.landMat === m ? ' on' : '') + '" data-lmat="' + m + '" title="' + m + '"><i style="background:rgb(' + c.join(',') + ')"></i>' + m + '</button>'; }).join('') + '</div>';
        }
        if (T.how === 'line' || T.how === 'poly') h += '<div class="ed-note">' + (ED.land && ED.land.pts.length ? ED.land.pts.length + ' point(s) · ENTER finishes · BACKSPACE takes the last back · ESC drops it' : 'Click the first point.') + '</div>';
        h += '<div class="ed-note">MAP: wheel zooms, right or middle drag pans. 3D: fly as in a room. P walks here (PLAY HERE). Your rooms stand on the land in the game from THE SWAP (E8); here they are marked by their pads.</div></div>';
        return h;
    }
    function landPaletteWire(B) {
        B.querySelectorAll('[data-lview]').forEach(function (b) { b.onclick = function () { landView(b.getAttribute('data-lview')); }; });
        B.querySelectorAll('[data-ltool]').forEach(function (b) { b.onclick = function () { ED.opts.landTool = b.getAttribute('data-ltool'); if (ED.land) { ED.land.pts = []; landLineShow(); } saveOpts(); panels(); mapDraw(); }; });
        B.querySelectorAll('[data-lo]').forEach(function (el) { el.onchange = function () { var v = parseFloat(el.value); if (isFinite(v)) { ED.opts[el.getAttribute('data-lo')] = v; saveOpts(); } }; });
        B.querySelectorAll('[data-lmat]').forEach(function (b) { b.onclick = function () { ED.opts.landMat = b.getAttribute('data-lmat'); saveOpts(); panels(); }; });
    }
    function landOutlinerHtml() {
        var D = landDoc(), sel = ED.land && ED.land.sel, h = '';
        LAND_LISTS.forEach(function (g) {
            var list = D[g[0]] || []; if (!list.length) return;
            h += '<div class="ed-sub">' + g[1] + ' · ' + list.length + '</div>';
            list.forEach(function (row, i) {
                var id = g[0] === 'coasts' ? i : row.id, lab = g[0] === 'coasts' ? 'Coast ' + (i + 1) : row.label || row.id;
                var sub = g[0] === 'places' ? ((ED.doc.rooms[row.room] || {}).label || row.room) + ' · pad ' + row.padY + ' m' : g[0] === 'roads' ? row.type + (row.bridges && row.bridges.length ? ' · ' + row.bridges.length + ' bridge(s)' : '') : '';
                h += '<button class="ed-row' + (sel && sel.kind === g[0] && sel.id === id ? ' on' : '') + '" data-lk="' + g[0] + '" data-li="' + esc(String(id)) + '">' + esc(lab) + '<span>' + esc(sub) + '</span></button>';
            });
        });
        return h || '<div class="ed-note">Nothing on the land yet: shape it with the BRUSHES, draw with LINES, stand a room on it with PLACE.</div>';
    }
    function landInspectorHtml() {
        var L = ED.land, s = L && L.sel, h = '';
        if (!s || !landSelRow(s)) {
            var n = L ? L.E.grid.filter(Boolean).length : 0, chk = landCheck();
            h += '<div class="ed-hd">THE LAND</div><div class="ed-note">' + n + ' tile(s) shaped (256 m each) · ' + landDoc().places.length + ' place(s). It started flat and empty; the old land is never brought in.</div>';
            if (chk.length) h += '<div class="ed-note ed-warn">' + chk.map(esc).join('<br>') + '</div>';
            h += '<div class="ed-note">FILE → EXPORT writes the land with the world (Assets/World/land/): the tiles that changed, sea.bin, land.json, land-map.png.</div>';
            return h;
        }
        var hr = landSelRow(s), row = hr.row, kind = s.kind;
        h += '<div class="ed-hd">' + esc(String(row.label || '').toUpperCase()) + '</div><div class="ed-form" data-scope="land">';
        if (kind !== 'coasts') h += '<label class="ed-f"><span>label</span><input type="text" data-lf="label" value="' + esc(row.label || '') + '"></label>';
        if (kind === 'places') {
            var rooms = Object.keys(ED.doc.rooms).map(function (id) { return [id, (ED.doc.rooms[id].label || id)]; });
            h += '<label class="ed-f"><span>room</span><select data-lf="room">' + rooms.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === row.room ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>';
            h += '<label class="ed-f"><span>kind</span><select data-lf="kind">' + ['site', 'hub', 'poi', 'dungeon', 'door', 'sea'].map(function (k) { return '<option' + (row.kind === k ? ' selected' : '') + '>' + k + '</option>'; }).join('') + '</select></label>';
            [['x', row.at[0]], ['z', row.at[1]], ['padY', row.padY], ['pad', row.pad], ['rot', row.rot || 0]].forEach(function (f) { h += '<label class="ed-f"><span>' + f[0] + (f[0] === 'pad' ? ' (half-side m)' : f[0] === 'rot' ? ' (quarter turns)' : f[0] === 'padY' ? ' (m)' : '') + '</span><input type="number" step="any" data-lf="' + f[0] + '" value="' + esc(f[1]) + '"></label>'; });
            h += '<label class="ed-f"><span>float (no pad)</span><input type="checkbox" data-lf="float"' + (row.float ? ' checked' : '') + '></label>';
        }
        if (kind === 'lakes') h += '<div class="ed-note">level ' + row.level + ' m · depth ' + row.depth + ' m</div>';
        if (kind === 'roads') h += '<div class="ed-note">' + row.type + ' · ' + row.w + ' m wide · ' + (row.bridges || []).length + ' bridge(s) · ' + (row.rails || []).length / 2 + ' rail run(s)</div>';
        if (kind === 'rivers') h += '<div class="ed-note">' + (row.w0 * 2).toFixed(1) + ' → ' + (row.w1 * 2).toFixed(1) + ' m wide · falls where it drops</div>';
        h += '</div><div class="ed-acts">' + (kind === 'places' && !row.float ? '<button class="ed-btn" data-la="relevel">RE-LEVEL THE PAD</button>' : '') + '<button class="ed-btn" data-la="frame">GO TO IT</button><button class="ed-btn ed-danger" data-la="del">DELETE</button></div>';
        if (kind !== 'places' && kind !== 'regions' && kind !== 'reveals') h += '<div class="ed-note">DELETE takes the line off the map; the ground it shaped stays (UNDO takes both back).</div>';
        if (kind === 'places') h += '<div class="ed-note">Moving it levels a new pad there; the old pad\'s ground stays (SMOOTH it). The room stands here in the game from THE SWAP (E8).</div>';
        return h;
    }
    function landInspectorWire(P) {
        var L = ED.land, s = L && L.sel; if (!s) return;
        P.querySelectorAll('[data-lf]').forEach(function (el) {
            el.onchange = function () {
                var hr = landSelRow(s); if (!hr) return;
                var k = el.getAttribute('data-lf'), v = el.type === 'checkbox' ? el.checked : el.type === 'number' ? parseFloat(el.value) : el.value;
                if (el.type === 'number' && !isFinite(v)) { toast('NOT A NUMBER'); return; }
                if (s.kind === 'places') {
                    var a = Core.clone(hr.row);
                    if (k === 'x') a.at[0] = v; else if (k === 'z') a.at[1] = v; else if (k === 'rot') a.rot = ((Math.round(v) % 4) + 4) % 4; else if (k === 'pad') a.pad = Math.max(4, v); else a[k] = v;
                    if (['x', 'z', 'padY', 'pad', 'float'].indexOf(k) >= 0) { landPlaceSet(hr.i, a, k); return; }
                    landCommit([{ path: ['landEd', 'places', hr.i], before: Core.clone(hr.row), after: a }], k);
                    return;
                }
                landCommit([{ path: ['landEd', s.kind, hr.i, k], before: hr.row[k], after: v }], k);
            };
        });
        P.querySelectorAll('[data-la]').forEach(function (b) {
            b.onclick = function () {
                var a = b.getAttribute('data-la'), hr = landSelRow(s); if (!hr) return;
                if (a === 'del') landDelete(s); else if (a === 'frame') landFrame(s); else if (a === 'relevel') landPlaceSet(hr.i, Core.clone(hr.row), 're-level');
            };
        });
    }
    /* ── EXPORT: Assets/World/land/ (the tiles that changed since the last export, sea.bin, land.json, land-map.png) → { files,
       block (world.json `land`) } ── */
    function landExport(all) {
        if (!ED.doc) return Promise.resolve(null);
        return landEnsure().then(function (L) {
            if (!landHas() && !(ED.exported && ED.exported.land)) return null;   // flat and empty, never exported: no land yet
            var E = L.E, D = landDoc(), R = W.HQ_LAND_EDIT_RULES, dir = 'Assets/World/' + R.dir, prev = (ED.exported && ED.exported.land) || {}, prevT = prev.tiles || {}, files = [], shas = {};
            var listed = W.hqLandEdListed(E);
            var ov = W.hqLandEdIndex(E, D, { tiles: listed });
            delete ov.bake.id;
            L.W = W.hqLandEdWorld(E, L.W);
            var sea = W.hqLandEdSeaBytes(L.W);
            L.mapDirty = true; var img = landMapImage();
            return new Promise(function (res) { img.toBlob(function (b) { res(b); }, 'image/png'); }).then(function (blob) { return blob.arrayBuffer(); }).then(function (pngBuf) {
                var png = new Uint8Array(pngBuf), body = Core.utf8(JSON.stringify(ov)), both = new Uint8Array(body.length + png.length); both.set(body, 0); both.set(png, body.length);
                return sha10(both).then(function (id) {
                    ov.bake.id = id;
                    var jobs = listed.map(function (t) {
                        var u8 = W.hqLandEdTileBytes(W.hqLandEdView(E, t[0], t[1])), name = 't_' + t[0] + '_' + t[1];
                        return sha10(u8).then(function (sha) { shas[name] = sha; if (all || prevT[name] !== sha) files.push({ name: dir + 'tiles/' + name + '.bin', data: u8 }); });
                    });
                    return Promise.all(jobs).then(function () { return sha10(sea); }).then(function (seaSha) {
                        if (all || prev.sea !== seaSha) files.push({ name: dir + 'sea.bin', data: sea });
                        files.push({ name: dir + 'land.json', data: Core.utf8(JSON.stringify(ov)) }, { name: dir + 'land-map.png', data: png });
                        var gone = Object.keys(prevT).filter(function (n) { return !shas[n]; }).map(function (n) { return dir + 'tiles/' + n + '.bin'; });
                        var zone = { label: 'THE LAND', ground: 'land', hub: 'land', sky: 'land', clock: true, parts: { land: { x: 0, z: 0, y: 0, rot: 0 } }, joins: [] };
                        D.places.forEach(function (p) { if (!ED.doc.rooms[p.room]) return; zone.parts[p.room] = { place: p.id, rot: p.rot || 0 }; if (p.float) zone.parts[p.room].float = true; else zone.joins.push({ a: 'land', b: p.room, kind: 'island', pad: true }); });
                        var block = { id: id, dir: R.dir, ext: E.ext, live: !!ED.doc.live, tiles: listed.length, places: ov.places, zone: zone };
                        L.exported = { tiles: shas, sea: seaSha, id: id };
                        return { files: files, block: block, gone: gone, land: L.exported };
                    });
                });
            });
        });
    }
    /* IMPORT: his land from its files (a zip's Assets/World/land/, or R2) — the lattice replaces this project's */
    function landImportFiles(ov, tiles, old) {
        var r = W.hqLandEdFromFiles(ov, tiles), name = ED.project;
        /* a delta zip holds only the tiles that changed: the rest come from this project's land (when it is loaded) */
        if (old && old.E) (ov.tiles || []).forEach(function (t) { var k = t[1] * r.E.per + t[0]; if (!r.E.grid[k] && old.E.grid[k]) r.E.grid[k] = old.E.grid[k]; });
        ED.doc.landEd = r.doc;
        return landRasterClear(name).then(function () {
            ED.land = { project: name, E: r.E, W: W.hqLandEdWorld(r.E), unsaved: new Set(), pend: new Set(), liveAt: 0, stroke: null, pts: [], sel: null, sight: null, map: { cx: 0, cz: 0, s: 4 }, img: null, imgData: null, mapDirty: true };
            r.E.grid.forEach(function (t, k) { if (t) ED.land.unsaved.add(k); });
            return landSaveNow();
        }).then(function () { saveNow(); return Object.keys(tiles).length; });
    }
    function landImportR2(block) {
        if (!block || !block.id) return Promise.resolve(0);
        var base = W.HQ_WORLD_DOC_RULES.base + (block.dir || 'land/'), q = '?b=' + block.id;
        return fetch(base + 'land.json' + q, { mode: 'cors', credentials: 'omit', cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error('land.json HTTP ' + r.status); return r.json(); }).then(function (ov) {
            var tiles = {};
            return Promise.all((ov.tiles || []).map(function (t) { var n = 't_' + t[0] + '_' + t[1]; return fetch(base + 'tiles/' + n + '.bin' + q, { mode: 'cors', credentials: 'omit' }).then(function (r) { if (!r.ok) throw new Error(n + ' HTTP ' + r.status); return r.arrayBuffer(); }).then(function (b) { tiles[n] = b; }); }))
                .then(function () { return landImportFiles(ov, tiles); });
        });
    }

    /* ══ OPEN / CLOSE ═══════════════════════════════════════════════════════════════════════════════════════════════════ */
    function open(opts) {
        opts = opts || {};
        if (typeof DOOR_HQ === 'undefined' || typeof W.hqWorldDocNew !== 'function' || typeof W._hqEditEnter !== 'function') { alert('The editor needs data.js / map.js from the same delivery (hqWorldDoc*, _hqEditEnter).'); return; }
        build(); loadOpts();
        try { var bo = JSON.parse(localStorage.getItem('ew_editor_band') || 'null'); if (bo && isFinite(bo.y0) && isFinite(bo.y1)) { ED.band.y0 = +bo.y0; ED.band.y1 = +bo.y1; ED.band.on = !!bo.on; } } catch (e) {}
        try { var ao = JSON.parse(localStorage.getItem('ew_editor_audit') || 'null'); if (ao) ['walls', 'pockets', 'fight'].forEach(function (k) { ED.audit[k] = !!ao[k]; }); } catch (e) {}
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
        if (ED.stroke) strokeEnd();
        if (ED.land && ED.land.stroke) landStrokeEnd();
        if (ED.mode === 'land') { ED.landCam = Object.assign({}, ED.cam); landUninstall(); ED.mode = 'world'; ED.roomId = ED.doc && ED.doc.start ? ED.doc.start.room : null; }
        if (ED.land) landSaveNow();
        if ($('edMap')) $('edMap').style.display = 'none';
        if (ED.draw) { ED.draw = null; drawPreview(null); }
        bandClipOff(); clearTimeout(ED.auditTimer);
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
               palPick: palPick, palEntries: palEntries, palData: palData, doorWrite: doorWrite, doorFollow: doorFollow, thumbs: function () { return { have: Object.keys(TH.mem).filter(function (k) { return !!TH.mem[k]; }).length, none: Object.keys(TH.mem).filter(function (k) { return TH.mem[k] === null; }).length, want: TH.want.length, off: TH.off }; },
               land: { open: landOpen, view: landView, tool: function (t) { ED.opts.landTool = t; panels(); }, click: landClick, finish: landFinish, pts: function (p) { ED.land.pts = p; }, strokeStart: landStrokeStart, dab: landDab, strokeEnd: landStrokeEnd, doc: landDoc, get: function () { return ED.land; }, export: landExport },
               enter: enterRoom, playHere: playHere, library: function (id) { enterRoom(id, 'library'); }, copyIntoWorld: copyIntoWorld, pickAt: pickAt, frame: frameSel,
               moveSel: function (dx, dz) { var hits = ED.sel.map(selRow).filter(Boolean), a = hits[0] ? Core.rowAnchor(hits[0].row) : { x: 0, z: 0 }; replaceRows(hits.filter(function (h) { return h.list !== 'spawn'; }).map(function (h) { return { list: h.list, i: h.i, before: Core.clone(h.row), after: Core.rowTransform(h.row, { dx: dx, dz: dz, px: a.x, pz: a.z }) }; }), 'move'); } },
    };
})();
