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
            if (rot && !t.axis) YAWS.forEach(function (k) { if (isFinite(r[k]) || (k === 'face' && (r.k === 'climb' || r.k === 'tree' || r.key || r.wall === 'free')) || (k === 'yaw' && (r.k === 'prefab' || r.k === 'kit')) || (k === 'rot' && (r.k === 'texbuilding' || r.k === 'space'))) { var v = ((+r[k] || 0) + t.rot) % 360; if (v < 0) v += 360; r[k] = R4(v); } });
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
            if (k === 'space') { out.push(rectBox(x, z, num(row.w, 6), num(row.d, num(row.w, 6)), row.rot, g0 - 0.05, g0 + 0.25)); return out; }   // E5: a layout room / clearing, picked by its floor
            if (k === 'plateau') { if (row.r) out.push(rectBox(x, z, 2 * row.r, 2 * (row.rz || row.r), row.rot, g0 - 0.1, num(row.h, 1))); else out.push(rectBox(x, z, num(row.w, 4), num(row.d, 4), row.rot, Math.min(g0 - 0.1, num(row.h, 1) - 0.3), num(row.h, 1))); }
            else if (k === 'hill') out.push(rectBox(x, z, 2 * num(row.r, 4), 2 * num(row.rz, num(row.r, 4)), row.rot, g0 - 0.1, g0 + Math.max(0.3, num(row.h, 1) * 0.5)));
            else if (k === 'dip') out.push(rectBox(x, z, 2 * num(row.r, 4), 2 * num(row.rz, num(row.r, 4)), row.rot, g0 - 0.2, g0 + 0.2));
            else if (k === 'pool') out.push(rectBox(x, z, 2 * num(row.r, 3), 2 * num(row.rz, num(row.r, 3)), row.rot, num(row.y, g0) - num(row.depth, 0.8), num(row.y, g0) + 0.15));
            else if (k === 'spiral') out.push(rectBox(x, z, 2 * num(row.r1, 4), 2 * num(row.r1, 4), 0, Math.min(num(row.h0, 0), num(row.h1, 0)) - 0.1, Math.max(num(row.h0, 0), num(row.h1, 0)) + 0.2));
            else if (k === 'grove' || k === 'scatter') out.push(rectBox(x, z, 2 * num(row.r, 5), 2 * num(row.r, 5), 0, g0 - 0.05, g0 + 0.25));
            else if (k === 'tree') { var th = num(row.h, row.kind === 'tree_4' ? 5.6 : 2.9) * 1.75; out.push(rectBox(x, z, Math.max(1.2, th * 0.3), Math.max(1.2, th * 0.3), 0, g0, g0 + th)); }
            else if (k === 'climb') out.push(rectBox(x, z, num(row.w, 0.8), 0.8, row.face, num(row.y0, g0), isFinite(row.y1) ? row.y1 : g0 + 3));
            else out.push(rectBox(x, z, 1, 1, 0, g0, g0 + 1));
            return out;
        }
        /* ── THE ADD LIST: the compiler's row kinds (EDITOR_PLAN §4.2) with the row each places at (x, z) ── */
        var KINDS = [
            { id: 'wall', label: 'Wall', row: function (x, z) { return { k: 'wall', x0: x - 2, z0: z, x1: x + 2, z1: z, h: 3, t: 0.35, key: 'urban:ConcreteStriped2c' }; } },
            { id: 'rail', label: 'Rail (grind)', row: function (x, z) { return { k: 'rail', x0: x - 2, z0: z, x1: x + 2, z1: z }; } },
            { id: 'ramp', label: 'Ramp', row: function (x, z) { return { k: 'ramp', x0: x, z0: z + 3, x1: x, z1: z - 3, w: 3, h0: 0, h1: 2 }; } },
            { id: 'stairs', label: 'Solid ramp (built, with sides)', row: function (x, z) { return { k: 'ramp', x0: x, z0: z + 3, x1: x, z1: z - 3, w: 2, h0: 0, h1: 2, stairs: true, built: true }; } },   // 2026-10-05: no stepped stairs anywhere — a smooth solid ramp
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
            /* E5: THE LAYOUT (the LAYOUT tab draws these; the room's look says walls, trees or rock round them) */
            { id: 'space', label: 'Layout room / clearing', row: function (x, z) { return { k: 'space', x: x, z: z, w: 10, d: 8 }; } },
            { id: 'hall', label: 'Layout hallway / path', row: function (x, z) { return { k: 'hall', pts: [[x - 6, z], [x + 6, z]], w: 2.6 }; } },
            { id: 'fence', label: 'Fence (a low wall)', row: function (x, z) { return { k: 'wall', x0: x - 3, z0: z, x1: x + 3, z1: z, h: 1.1, t: 0.12, key: 'wood' }; } },
        ];
        function kindRow(id, x, z) { for (var i = 0; i < KINDS.length; i++) if (KINDS[i].id === id) return KINDS[i].row(Math.round(x * 4) / 4, Math.round(z * 4) / 4); return null; }
        function snap(v, s) { return s > 0 ? Math.round(v / s) * s : v; }
        function rowLabel(list, row) {
            if (!row) return '?';
            if (list === 'props') return (row.key || 'prop') + (row.label ? ' · ' + row.label : '');
            if (list === 'doors') return 'door ' + (row.id || '') + (row.action && row.action.room ? ' → ' + row.action.room : '') + (row.wall ? ' (' + row.wall + ')' : '') + (row.secret ? ' · secret' : '') + (+row.minClearance ? ' · L' + row.minClearance : '') + (+row.requiresKeys ? ' · ' + row.requiresKeys + ' keys' : '');
            if (row.k === 'prefab') return 'prefab · ' + (row.pf || '?');
            if (row.k === 'kit') return 'kit · ' + String(row.fn || '?').replace(/^hq/, '');
            if (row.k === 'opening') return 'opening · ' + (row.glaze ? 'window' : (row.sill > 0.05 ? 'window gap' : 'door gap')) + ' in ' + (row.wall || '?');
            if (row.k === 'texbuilding') return 'building · ' + (row.storeys || 2) + ' storeys' + (row.style ? ' · ' + row.style : '');
            if (row.k === 'bridge' && row.plain) return 'floor slab · y ' + row.y;
            if (row.k === 'space') return (row.label ? row.label + ' · ' : '') + (row.round ? 'round room' : 'room') + ' · ' + (+row.w || 6) + ' × ' + (+row.d || +row.w || 6) + ' m';   // E5: the layout
            if (row.k === 'hall') return (row.label ? row.label + ' · ' : '') + 'hallway · ' + (+row.w || 2.6) + ' m wide';
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
                brushR: 4, brushS: 0.5, brushFall: 'smooth', terraceH: 1, cliffH: 3, setH: 0, paintKey: '', paintErase: false, waterKey: 'water', waterDepth: 0.8, streamW: 2.4,
                /* E5: the layout */
                planLook: 'walls', hallW: 2.6,
                /* E6: the size a placed tree / model takes (treeSize m tall, 0 = the game's own; treeVary = ±20 %; propX = × the catalogue) */
                treeSize: 0, treeVary: true, propX: 1 },
        /* E3: a brush stroke in progress, the level band, the audits */
        stroke: null, band: { on: false, y0: -0.5, y1: 3.2 }, clipMats: [], clipPlane: null, ring: null,
        audit: { walls: false, pockets: false, fight: false, sight: false, patch: false },   // E7: SIGHT, FIELD (was 8×8) auditRes: {}, auditObjs: [], fightAt: 0, fightKey: '',
        /* E6: THE ROOFS (C): off = the ceilings and roofs hidden and everything `h` m over the floor cut away, so he sees in */
        roof: { off: false, h: 3 }, roofHidden: [], grab: null,
        /* THE CREATIVE CONTROLS (2026-10-05, mondo: "like in minecraft creative mode … why the fuck do i have to hold down right click
           to move around"): `look` = the mouse is captured and turns the eye (a click on the view, E or ESC frees it), `vel` = the fly's
           eased velocity (m/s), `hot` = the hotbar (1-9: the tools and tiles last used) */
        look: false, vel: { x: 0, y: 0, z: 0 }, sprint: false, wTap: 0, hot: [], hotI: -1,
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
            var q = indexedDB.open('ew_editor', 3);   // v2 (E2): the palette's thumbnails; v3 (E4) added a store for the land's tiles (the land was cut 2026-09-29, ZONES_PLAN Z0; the version stays so old databases still open)
            q.onupgradeneeded = function () { var db = q.result; if (!db.objectStoreNames.contains('projects')) db.createObjectStore('projects', { keyPath: 'name' }); if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta'); if (!db.objectStoreNames.contains('thumbs')) db.createObjectStore('thumbs'); };
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
        ED.doc = docPrepare(doc); ED.project = name; ED.undo = []; ED.redo = []; ED.sel = []; ED.stepNo = (ED.stepNo || 0) + 1;
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
        ED.stepNo = (ED.stepNo || 0) + 1;   // E7: the LEADS TO tab redraws on a change
        var ids = stepTouched(step);
        docSync(ids);
        if (ED.mode === 'prefab' && !ED.doc.prefabs[ED.pfId]) { ED.mode = 'world'; ED.pfId = null; var f0 = Object.keys(ED.doc.rooms)[0]; if (f0) { enterRoom(f0, 'world'); panels(); return; } }
        saveSoon();
        ED.sel = ED.sel.filter(selRow);
        if (ids.indexOf(ED.roomId) >= 0 && !(o && o.noReload)) reloadSoon();
        if (ED.mode === 'world' && ED.roomId && !ED.doc.rooms[ED.roomId]) { if (step.lib && DOOR_HQ.rooms[step.lib]) { enterRoom(step.lib, 'library', { keepCam: true }); panels(); return; } var first = Object.keys(ED.doc.rooms)[0]; if (first) enterRoom(first, 'world'); }
        panels();
    }
    function undo() { var s = ED.undo.pop(); if (!s) return; try { Core.stepUndo(ED.doc, s); } catch (e) { toast('UNDO FAILED · ' + e.message); return; } ED.redo.push(s); afterStep(s); toast('UNDO · ' + s.label, 1200); }
    function redo() { var s = ED.redo.pop(); if (!s) return; try { Core.stepDo(ED.doc, s); } catch (e) { toast('REDO FAILED · ' + e.message); return; } ED.undo.push(s); afterStep(s); toast('REDO · ' + s.label, 1200); }

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
        if (!own()) return null;
        if (ED.mode === 'prefab' && list !== 'terrain.features' && list !== 'props') { toast('A PREFAB HOLDS SHAPES AND PROPS ONLY'); return null; }
        var step = [], n = ensureList(list, step);
        row = Core.clone(row); if (row.id == null) row.id = nextId(room());
        step.push({ path: rowPath(list, n), before: undefined, after: row });
        commit(step, label || ('add ' + Core.rowLabel(list, row)));
        if (!(o && o.noSelect)) select(list, row.id);
        return row;
    }
    function replaceRows(pairs, label, o) {   // pairs = [{ list, i, before, after }]
        if (!pairs.length || !own()) return;
        commit(pairs.map(function (p) { return { path: rowPath(p.list, p.i), before: p.before, after: p.after }; }), label, o);
    }
    function deleteSel() {
        if (!ED.sel.length || !own()) return;
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
    function duplicateSel(to) {   // to = a ground point: the copy's anchor lands there (RIGHT click places a copy of the pick)
        if (to && W.Event && to instanceof W.Event) to = null;   // a button's click passes its event
        if (!ED.sel.length || !own()) return;
        var hits = ED.sel.map(selRow).filter(function (h) { return h && h.list !== 'spawn' && h.list !== 'doors'; });
        if (!hits.length) { if (to) toast('THE SPAWN AND DOORS ARE NOT COPIED (a door: the DOOR tool)', 2000); return; }
        var off = { dx: Math.max(ED.snap, 1), dz: Math.max(ED.snap, 1) };
        if (to) { var an = Core.rowAnchor(hits[0].row), sn = Math.max(0.25, ED.snap || 0); off = { dx: Core.snap(to.x, sn) - an.x, dz: Core.snap(to.z, sn) - an.z }; }
        var step = [], r = room(), max = +nextId(r).slice(1) - 1, sel = [];
        var ends = {};
        hits.forEach(function (h) {
            if (ends[h.list] == null) ends[h.list] = (listOf(r, h.list) || []).length;
            var copy = Core.rowTransform(h.row, { dx: off.dx, dz: off.dz, px: 0, pz: 0 });
            copy.id = 'r' + (++max);
            step.push({ path: rowPath(h.list, ends[h.list]++), before: undefined, after: copy });
            sel.push({ list: h.list, id: copy.id });
        });
        commit(step, (to ? 'place a copy of ' : 'duplicate ') + hits.length);
        ED.sel = sel; gizmoAttach(); panels();
    }

    /* ══ THE VIEWPORT ═══════════════════════════════════════════════════════════════════════════════════════════════════ */
    ED.hook = { play: false, tick: function (dt, H) { tick(dt, H); } };
    function enterRoom(id, mode, o) {
        o = o || {};
        var prevRoom = ED.roomId, prevMode = ED.mode;
        ED.mode = mode || (W.hqWorldDocIsOwn(id) && ED.doc.rooms[id] ? 'world' : 'library');
        ED.roomId = id; ED.libRoom = ED.mode === 'library' ? id : null;
        if (ED.mode === 'library') libIds(DOOR_HQ.rooms[id]);   // a game room picks like one of his (its rows had no ids: nothing picked)
        if (prevRoom !== id || prevMode !== ED.mode) { ED.sel = []; if (!o.keepCam) camHome(o.at); }
        ED.ready = false;
        ED.hook.play = false;
        clearTimeout(ED.reloadTimer); ED.reloadTimer = null;
        ED.stroke = null; ED.auditRes = {};
        var ok = W._hqEditEnter({ room: id, edit: ED.hook, onReady: function () { ED.ready = true; rebuildProxies(); ED.roofHidden = []; roofHide(); bandClip(); auditSoon(); status(); }, onEscape: null });
        if (!ok) { toast('THE ROOM DID NOT BUILD · ' + id, 5000); return false; }
        if (!ED.rmb && !ED.look) lookLock(false);   // THE POINTER: a lock the walk carried back from PLAY HERE goes (flying keeps it)
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
        grid.position.y = 0.03 * u; grid.visible = ED.grid; grid.renderOrder = 11; G.add(grid); ED.gridObj = grid;
        /* the spawn: a cone pointing where the walker faces (picked as 'spawn') */
        var sp = new THREE.Mesh(new THREE.ConeGeometry(0.35 * u, 1.1 * u, 12), new THREE.MeshBasicMaterial({ color: 0x57f287, transparent: true, opacity: 0.85, depthTest: false, fog: false }));
        sp.rotation.x = Math.PI / 2; var spW = new THREE.Group(); spW.add(sp); spW.userData.edSel = { list: 'spawn' }; G.add(spW); ED.spawnObj = spW; spawnPlace();
        if (ED.mode === 'prefab') { spW.visible = false; ED.spawnObj = null; }   // a prefab has no spawn
        ED.pivot = new THREE.Object3D(); G.add(ED.pivot);
        /* E3: the brush's ring (it follows the ground under the cursor while a ground tool is armed) */
        var rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(65 * 3), 3));
        ED.ring = new THREE.Line(rg, new THREE.LineBasicMaterial({ color: 0xffd84a, transparent: true, opacity: 0.95, depthTest: false, fog: false })); ED.ring.renderOrder = 14; ED.ring.visible = false; ED.ring.frustumCulled = false; G.add(ED.ring);
        ED.auditObjs = []; ED.fightObj = null; ED.fightKey = '';
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
            if (ED.band.on && !boxes.some(function (b) { return bandHas(b.y0, b.y1); })) return;   // E3: the level band — only the rows in it pick
            var grp = new THREE.Group(); grp.userData.edSel = { list: 'terrain.features', id: row.id };
            boxes.forEach(function (b) {
                var m = new THREE.Mesh(new THREE.BoxGeometry(b.w * u, (b.y1 - b.y0) * u, b.L * u), _proxyMat);
                m.position.set(b.cx * u, (b.y0 + b.y1) / 2 * u, b.cz * u); m.rotation.y = b.yaw; grp.add(m);
            });
            ED.group.add(grp);
            ED.proxies.push({ obj: grp, own: true, sel: grp.userData.edSel });
        });
        var mine = new Set(), mineId = new Set(); (listOf(r, 'props') || []).forEach(function (q) { if (q) { mine.add(q); if (q.id != null) mineId.add(String(q.id)); } });
        (V.props || []).forEach(function (p) { if (p.row && p.row.id != null && (mine.has(p.row) || mineId.has(String(p.row.id))) && p.grp && objInBand(p.grp)) { p.grp.userData.edSel = { list: 'props', id: p.row.id }; ED.proxies.push({ obj: p.grp, own: false, sel: p.grp.userData.edSel }); } });
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
            if (sized && (h.list === 'props' || (h.list === 'terrain.features' && (h.row.k === 'tree' || h.row.k === 'grove')))) {   // E6: a prop / a tree sizes by its height (the catalogue's when it has none)
                var fz = [d.sx, d.sy, d.sz].reduce(function (m, v) { return Math.abs(v - 1) > Math.abs(m - 1) ? v : m; }, 1);
                after = sizeRow(h, fz) || after;
            }
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

    /* ── THE FLY (2026-10-05, Minecraft's creative flight; mondo: "why the fuck do i have to hold down right click to move around"):
       W A S D (or the arrows) fly level with the ground wherever the eye looks, SPACE up, SHIFT down, W twice quickly = sprint (×3 until
       W is let go); the eye eases in and out. The mouse turns the eye while it is captured (`look`: a click on empty ground or E; E or
       ESC frees it) or while the RIGHT button is held. Wheel = fly speed while looking, a dolly otherwise. ALT + LEFT orbits, MIDDLE
       pans. The editor's own eye (the walker stands still; the player never has it — R6) ── */
    function flyDown() {   // SHIFT = down, unless it is busy: SHIFT + a key or a click, the 45° lock of a piece being drawn, a brush's flip
        var k = ED.keys, D = ED.draw;
        if (!k.shift || k.shiftUsed || ED.stroke) return false;
        return !(D && (D.a || (D.pts && D.pts.length)));
    }
    function tick(dt, H) {
        if (!ED.open || ED.playing) return;
        var c = ED.cam, k = ED.keys, V = ED.vel, t = Math.min(0.25, dt);
        if (!(k.w || k.up)) ED.sprint = false;
        var sp = c.speed * (ED.sprint ? 3 : 1), rx = Math.cos(c.yaw), rz = Math.sin(c.yaw);
        var mf = (k.w || k.up ? 1 : 0) - (k.s || k.down ? 1 : 0), mr = (k.d || k.right ? 1 : 0) - (k.a || k.left ? 1 : 0), mu = (k.space || k.pgup ? 1 : 0) - (flyDown() || k.pgdn ? 1 : 0);
        var n = Math.hypot(mf, mr) || 1, ease = Math.min(1, t * 10);
        V.x += ((rz * mf + rx * mr) / n * sp - V.x) * ease; V.z += ((-rx * mf + rz * mr) / n * sp - V.z) * ease; V.y += (mu * sp - V.y) * ease;
        if (Math.abs(V.x) + Math.abs(V.y) + Math.abs(V.z) < 0.01) V.x = V.y = V.z = 0;
        var moving = !!(V.x || V.y || V.z);
        c.x += V.x * t; c.y += V.y * t; c.z += V.z * t;
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
        /* the crosshair while the mouse is captured: the point every click works at; flying moves what it is aiming (a grab, a ghost) */
        if (ED.look && lockedNow()) { var ce = ptr(null); ED.mouse.x = ce.clientX; ED.mouse.y = ce.clientY; ED.mouse.in = true; if (moving) hover(ce); }
        for (var i = 0; i < ED.boxes.length; i++) ED.boxes[i].update();
        var now = performance.now();
        /* E3: a brush held on the ground works every frame (the cursor re-read each frame: the ground under it is moving) */
        if (ED.stroke && ED.stroke.tool !== 'gramp' && ED.mouse.in) { var sc = rayGround(ED.mouse.x, ED.mouse.y); if (sc) { ED.cursor = sc; ED.cursorAt = now; strokeDab(ED.stroke, sc, Math.min(0.05, dt)); } }
        else if (ED.mouse.in && now - ED.cursorAt > 90) { ED.cursorAt = now; ED.cursor = rayGround(ED.mouse.x, ED.mouse.y); }
        ringUpdate();
        if (ED.audit.fight && now - ED.fightAt > 200) { ED.fightAt = now; fightShow(); }
        if ((ED.band.on || ED.roof.off) && now - (ED.bandAt || 0) > 1000) { ED.bandAt = now; bandClip(false); roofHide(); }   // the models that load late are cut too (E6: and the roofs)
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
        /* E5 (EDITOR_PLAN §5.7 + mondo's ask): THE LAYOUT — rooms and the hallways between them; the room's LOOK makes the rest solid
           (walls to the ceiling, a forest of trees, or rock) */
        lroom:    { label: 'ROOM', how: 'rect', tab: 'layout', tip: 'Drag a rectangle: a room (in a forest, a clearing). Everything you have not drawn is solid.' },
        lround:   { label: 'ROUND ROOM', how: 'rect', tab: 'layout', tip: 'Drag a rectangle: a round room or clearing that fills it.' },
        lhall:    { label: 'HALLWAY', how: 'course', tab: 'layout', tip: 'Click along it, from room to room; ENTER ends it (ESC drops it, BACKSPACE takes a point back). In a forest it is a dirt path.' },
        lamp:     { label: '+ LAMP', how: 'click', tab: 'sky', tip: 'Click where a lamp goes: a lamp mast outdoors (lit at night), a ceiling fluorescent indoors. The SKY tab lists them.' },   // E6
        stream:   { label: 'STREAM', how: 'course', tab: 'ground', tip: 'Click along its course; ENTER ends it (ESC drops it): a stream, its level just under the lowest ground along it.' },
    };
    function drawSet(tool) {
        drawPreview(null);
        if (ED.stroke) strokeEnd();
        ED.draw = tool ? { tool: tool, a: null, chain0: null, b: null, pts: null } : null;
        if (tool) { select(null); if (DRAWS[tool]) toast(DRAWS[tool].tip, 3200); }
        panels(); hotUi();
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
        var cw = D.tool === 'lhall' ? O.hallW : O.streamW;
        if (how === 'course' && D.pts && D.pts.length) { for (var ci = 0; ci + 1 < D.pts.length; ci++) out.push(segPv(D.pts[ci], D.pts[ci + 1], cw, ground(D.pts[ci].x, D.pts[ci].z) - 0.1, ground(D.pts[ci].x, D.pts[ci].z) + 0.1)); out.push(segPv(D.pts[D.pts.length - 1], p, cw, g - 0.1, g + 0.1)); }
        if (a && how === 'rect') {
            var R = rectOf(a, p), top = (D.tool === 'slab' || D.tool === 'platform' || D.tool === 'deck') ? O.height : D.tool === 'building' ? g + O.storeys * 3.5 : g + O.wallH, bot = D.tool === 'slab' ? O.height - 0.28 : D.tool === 'platform' ? O.height - 0.8 : D.tool === 'deck' ? O.height - 0.3 : g;
            if (D.tool === 'lroom' || D.tool === 'lround') { top = g + 0.35; bot = g - 0.05; }   // E5: a floor footprint
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
        if (!own()) return;
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
        if (how === 'course') { if (p) { D.pts = D.pts || []; var lp = D.pts[D.pts.length - 1]; if (!lp || Math.hypot(p.x - lp.x, p.z - lp.z) > 0.3) D.pts.push(p); if (D.tool === 'lhall') D.a = p; drawShow(p); } return; }   // (a hallway's SHIFT keeps 45° from its last point)
        if (how === 'disc') { var a0 = D.a; D.a = null; drawPreview(null); ED._disc = null; if (a0 && p) poolAt(a0, Math.hypot(p.x - a0.x, p.z - a0.z)); return; }
        if (how === 'click') {   // a shape from the ADD list, dropped where clicked
            var c = rayGround(e.clientX, e.clientY); if (!c) return;
            if (D.entry) { palDrop(D, c); return; }   // E2: a palette tile
            if (D.tool === 'lamp') { lampAt(c); return; }   // E6: the tool stays armed for more
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
            var rr = { k: 'ramp', x0: a.x, z0: a.z, x1: p.x, z1: p.z, w: 2, h0: Core.snap(g0, 0.01), h1: h1 }; if (stairs) { rr.stairs = true; rr.built = true; }
            drawRows([rr], stairs ? 'stairs' : 'ramp');
            return;
        }
        var R = rectOf(a, p), w = R.x1 - R.x0, d = R.z1 - R.z0; if (w < 0.5 || d < 0.5) return;
        var cx = (R.x0 + R.x1) / 2, cz = (R.z0 + R.z1) / 2;
        if (D.tool === 'lroom' || D.tool === 'lround') {
            var sp = { k: 'space', x: Core.snap(cx, 0.01), z: Core.snap(cz, 0.01), w: Core.snap(w, 0.01), d: Core.snap(d, 0.01) }; if (D.tool === 'lround') sp.round = true;
            layoutAdd([sp], D.tool === 'lround' ? 'round room' : 'room');
        } else if (D.tool === 'room') {
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
        if (D.tool === 'lhall' && D.pts && D.pts.length) {   // E5: a hallway ends on ENTER (two points at least), goes on ESC, loses its last point on BACKSPACE
            if (k === 'backspace') { D.pts.pop(); D.a = D.pts[D.pts.length - 1] || null; drawShow(ED.cursor ? { x: ED.cursor.x, z: ED.cursor.z } : D.a); return true; }
            if (k === 'enter' || k === 'escape') { var hp = D.pts; D.pts = null; D.a = null; drawPreview(null); if (k === 'enter') { if (hp.length > 1) layoutAdd([{ k: 'hall', pts: hp.map(function (q) { return [Core.snap(q.x, 0.01), Core.snap(q.z, 0.01)]; }), w: Math.max(0.6, ED.opts.hallW) }], 'hallway'); else toast('A HALLWAY NEEDS TWO POINTS AT LEAST'); } return true; }
        }
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
        if (ED.mode === 'library') { own(); return; }   // the copy builds first; the next press brushes it
        if (ED.mode !== 'world' || !editable()) { toast('THE GROUND BRUSHES WORK IN YOUR OWN ROOMS (not a prefab)'); return; }
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
        if (ED.mode === 'library' && room() && room().terrain && room().terrain[which] && !own()) return;
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
        var V = ED.view; if (!V || !(ED.band.on || ED.roof.off) || ED.playing) return;
        if (!ED.clipPlane) ED.clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
        ED.clipPlane.constant = Math.min(ED.band.on ? ED.band.y1 * U() + 0.3 : Infinity, ED.roof.off ? roofCutY() * U() : Infinity);   // E6: the roofs' cut too
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
       FIGHT = the battle field a fight at the cursor would take — the room's whole lattice, or its 24 × 24 crop round the cursor
       (hqFieldFrame, EXPLORATION_BATTLES_PLAN §3: green = a seat, the lighter the higher, yellow = a cover, red = rock, blue =
       water / lava) ═════════════════════════════════════════════════════════════════════════════════ */
    function auditClear() {
        (ED.auditObjs || []).forEach(function (o) { if (o.parent) o.parent.remove(o); try { o.geometry.dispose(); o.material.dispose(); } catch (e) {} });
        ED.auditObjs = [];
    }
    function auditSoon() {
        clearTimeout(ED.auditTimer); auditClear(); ED.auditRes = {}; ED.fightKey = '';
        if (ED.audit.walls || ED.audit.pockets || ED.audit.sight || ED.audit.patch) ED.auditTimer = setTimeout(auditRun, 350);
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
        if (r && (ED.audit.sight || ED.audit.patch)) zoneAudit(r);   // E7: over the layout rows (no compile needed)
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
        if (!ED.audit.fight || !ED.ready || !ED.roomId || !(W.hqFieldFrame || W.hqFieldWindow)) { hide(); return; }
        var c = ED.cursor; if (!c) { hide(); return; }
        var key = ED.roomId + ':' + Math.round(c.x) + ',' + Math.round(c.z) + ':' + ED.undo.length;
        if (key === ED.fightKey && FO && FO.parent === ED.group) return;
        ED.fightKey = key;
        var win = null;
        try { win = W.hqFieldFrame ? W.hqFieldFrame(ED.roomId, [{ x: c.x, z: c.z }, { x: c.x, z: c.z }]) : W.hqFieldWindow(ED.roomId, { x: c.x, z: c.z }, { x: c.x, z: c.z }); } catch (e) { win = null; }
        if (!win || !win.raster || !ED.group) { hide(); ED.auditRes.fight = null; return; }
        var R = win.raster, FW = R.W || R.S || 8, FH = R.H || R.S || 8, C = win.board.C, u = U(), x0 = (R.x0 != null) ? R.x0 : win.board.x0, z0 = (R.z0 != null) ? R.z0 : win.board.z0;
        if (!FO || FO.parent !== ED.group || FO.count !== FW * FH) {
            if (FO && FO.parent) FO.parent.remove(FO);
            var geo = new THREE.PlaneGeometry(1, 1); geo.rotateX(-Math.PI / 2);
            FO = ED.fightObj = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false, fog: false, side: THREE.DoubleSide }), FW * FH);
            FO.frustumCulled = false; FO.renderOrder = 13; ED.group.add(FO);
        }
        var m4 = new THREE.Matrix4(), col = new THREE.Color(), n = 0, ins = 0, seats = 0, maxT = 1;
        for (var y = 0; y < FH; y++) for (var x = 0; x < FW; x++) { var cc = R.cells[y] && R.cells[y][x]; if (cc && cc.in) maxT = Math.max(maxT, cc.tile || 0); }
        for (var yy = 0; yy < FH; yy++) for (var xx = 0; xx < FW; xx++) {
            var cl = R.cells[yy] && R.cells[yy][xx], cx = x0 + (xx + 0.5) * C, cz = z0 + (yy + 0.5) * C;
            var top = cl && cl.in && isFinite(cl.top) ? +cl.top : ground(cx, cz);
            m4.makeScale(C * 0.9 * u, 1, C * 0.9 * u); m4.setPosition(cx * u, (top + 0.09) * u + 0.3, cz * u); FO.setMatrixAt(n, m4);
            if (cl && cl.in && cl.seat === false) { ins++; col.setHex(0xffd84a); }
            else if (cl && cl.in) { ins++; seats++; var t = Math.max(0, cl.tile || 0) / maxT; col.setRGB(0.2 + 0.5 * t, 0.75 + 0.25 * t, 0.35 + 0.5 * t); }
            else if (cl && cl.hazard) col.setHex(0x3aa0ff); else col.setHex(0xff3344);
            FO.setColorAt(n, col); n++;
        }
        FO.instanceMatrix.needsUpdate = true; if (FO.instanceColor) FO.instanceColor.needsUpdate = true; FO.visible = true;
        ED.auditRes.fight = { ins: ins, seats: seats, n: FW * FH, w: FW, h: FH, crop: !!win.crop };
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

    /* ══ INPUT (the editor's own; the room's handlers stand down while `edit` is on) ════════════════════════════════════
       THE CREATIVE CONTROLS (2026-10-05, mondo: "need to make the editor more intuative and simple controls like in minecraft
       creative mode … none of it makes any fucking sense"). Two ways to hold the mouse, one set of keys:
         FLYING (the mouse captured, a crosshair; a click on empty ground or E starts it, E or ESC ends it): the mouse turns the eye,
           LEFT picks what the crosshair is on (hold and turn = drag it over the ground), RIGHT places (the armed tile, else a copy of
           the pick), MIDDLE takes the thing in hand (picks it: RIGHT then stamps copies), the wheel sets the fly speed.
         THE CURSOR (the panels, the gizmo): LEFT picks / drags / draws at the cursor, RIGHT click places, RIGHT drag turns the eye,
           MIDDLE drag pans, the wheel dollies.
       Always: W A S D fly, SPACE up, SHIFT down, W W sprint; 1-9 the hotbar (the tools and tiles last used), 0 / V the empty hand. */
    var KEYMAP = { arrowup: 'up', arrowdown: 'down', arrowleft: 'left', arrowright: 'right', pageup: 'pgup', pagedown: 'pgdn', ' ': 'space' };
    var MOVE_KEYS = ['w', 'a', 's', 'd', 'space', 'up', 'down', 'left', 'right', 'pgup', 'pgdn'];
    function typing(e) { var t = e.target; return !!(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)); }
    function lockedNow() { return !!(ED.view && document.pointerLockElement === ED.view.canvas); }
    /* the point a mouse action works at: the cursor, or the middle of the view (the crosshair) while flying */
    function ptr(e) {
        if (e && !(ED.look && lockedNow())) return e;
        var cv = ED.view && ED.view.canvas, rc = cv ? cv.getBoundingClientRect() : { left: 0, top: 0, width: innerWidth, height: innerHeight };
        return { clientX: rc.left + rc.width / 2, clientY: rc.top + rc.height / 2, shiftKey: !!(e && e.shiftKey), altKey: !!(e && e.altKey), ctrlKey: !!(e && e.ctrlKey), metaKey: !!(e && e.metaKey),
                 button: e ? e.button : 0, target: cv, preventDefault: function () { try { if (e) e.preventDefault(); } catch (x) {} } };
    }
    function onKeyDown(e) {
        if (!ED.open || ED.playing) return;
        if ($('edModal') && $('edModal').style.display !== 'none') { if (e.key === 'Escape') { modalClose(); e.preventDefault(); } return; }
        if (typing(e)) return;
        if (e.target && e.target.tagName === 'BUTTON' && (e.key === ' ' || e.key === 'Enter')) e.preventDefault();   // a focused panel button never re-fires on SPACE / ENTER
        var key = (e.key || '').toLowerCase(), k = KEYMAP[key] || key;
        if (k === 'shift') { if (!e.repeat) ED.keys.shiftUsed = false; ED.keys.shift = true; return; }
        if (e.shiftKey) ED.keys.shiftUsed = true;   // SHIFT + a key belongs to that key (SHIFT R turns back), not to the fly's down
        if (drawKey(k)) { e.preventDefault(); return; }
        ED.keys.shift = e.shiftKey; ED.keys.ctrl = e.ctrlKey || e.metaKey;
        var mod = e.ctrlKey || e.metaKey;
        if (mod && k === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
        if (mod && k === 'y') { e.preventDefault(); redo(); return; }
        if (mod && k === 's') { e.preventDefault(); saveNow().then(function (ok) { if (ok) toast('SAVED · ' + ED.project); }); return; }
        if (mod && k === 'd') { e.preventDefault(); duplicateSel(); return; }
        if (mod) return;
        if (MOVE_KEYS.indexOf(k) >= 0) {
            if (k === 'w' && !ED.keys.w && !e.repeat) { var now = performance.now(); if (now - ED.wTap < 320) ED.sprint = true; ED.wTap = now; }   // W W = sprint (Minecraft's)
            ED.keys[k] = true; e.preventDefault();
            return;
        }
        if (k === 'e') { lookSet(!ED.look); return; }
        if (/^[1-9]$/.test(k)) { hotUse(+k - 1); return; }
        if (k === '0') { drawSet(null); return; }
        /* E6 (mondo, 2026-09-29: "click on an object and be able to move it and rotate it. Like R to rotate 45 degrees at a time"):
           R turns the pick 45° clockwise, SHIFT R back; - / = size it (SHIFT: a bigger step); T is the gizmo's SIZE; C hides the roofs */
        if (k === 'r') { turnSel(e.shiftKey ? -45 : 45); return; }
        if (k === 't') { tcMode(ED.tool === 'scale' ? 'translate' : 'scale'); return; }
        if (k === '-' || k === '_') { sizeSel(1 / (k === '_' ? 1.25 : 1.1)); return; }
        if (k === '=' || k === '+') { sizeSel(k === '+' ? 1.25 : 1.1); return; }
        if (k === 'c') { roofSet({ off: !ED.roof.off }); return; }
        if (k === 'escape') { if (ED.look) { lookSet(false); return; } select(null); return; }
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
        if (k === 'shift') ED.keys.shiftUsed = false;
    }
    function onBlur() { if (ED.grab) grabEnd(); ED.keys = {}; ED.vel.x = ED.vel.y = ED.vel.z = 0; ED.rmb = false; ED.mmb = false; ED.orbit = null; ED.look = false; lookLock(false); lookUi(); if (ED.stroke) strokeEnd(); }
    /* THE POINTER (E1, 2026-09-29 — mondo: "clicking in the entry fields takes control of my pointer and I have to press escape"):
       the editor holds the pointer only while FLYING (a click on empty ground in the view, or E) or while the RIGHT button is held over
       the 3D view, and gives it back on E, ESC or the release. A panel field, a menu or a modal never takes it; any other lock that
       lands while the editor is open (a late request from a room re-entering, the walk's lock carried back from PLAY HERE) is let go. */
    function lookLock(on) {
        var cv = ED.view && ED.view.canvas;
        try {
            if (on) { if (cv && document.pointerLockElement !== cv && cv.requestPointerLock) { var p = cv.requestPointerLock(); if (p && typeof p.catch === 'function') p.catch(lockRefused); } }
            else if (document.pointerLockElement) document.exitPointerLock();
        } catch (e) {}
    }
    function lockRefused() { if (ED.look && !lockedNow()) { ED.look = false; lookUi(); toast('THE BROWSER KEPT THE MOUSE · click the view (or E) again to fly', 2600); } }
    function onLockChange() {
        if (!ED.open || ED.playing) return;
        var locked = lockedNow();
        if (!locked) { if (ED.look) { ED.look = false; ED.keys = {}; lookUi(); } if (ED.grab && !ED.rmb) grabEnd(); return; }   // ESC (the browser's own) freed it
        if (!ED.look && !ED.rmb) { try { document.exitPointerLock(); } catch (e) {} }
        lookUi();
    }
    /* FLYING on / off (E, a click on empty ground; ESC or E ends it) */
    function lookSet(on) {
        on = !!on && !!ED.view && !ED.playing;
        if (on && $('edModal') && $('edModal').style.display !== 'none') return;
        ED.look = on;
        if (on) { var m = $('edMenu'); if (m) m.style.display = 'none'; if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); lookLock(true); }
        else if (!ED.rmb) lookLock(false);
        lookUi();
    }
    function lookUi() {
        var on = !!(ED.look && ED.open && !ED.playing);
        document.body.classList.toggle('ed-look', on);
        if (ED.tc) ED.tc.enabled = !on;   // the gizmo is a cursor tool: while flying, LEFT held on a thing drags it
        var h = $('edHint'); if (!h) return;
        h.innerHTML = on ? '<b>E</b> or <b>ESC</b> frees the mouse · <b>LEFT</b> pick (hold to drag) · <b>RIGHT</b> place · <b>MIDDLE</b> take in hand · <b>WHEEL</b> speed ' + ED.cam.speed.toFixed(0) + ' m/s'
                         : '<b>W A S D</b> fly · <b>SPACE</b> up · <b>SHIFT</b> down · <b>E</b> or a click on empty ground = mouse look · <b>RIGHT</b> click places · <b>H</b> all keys';
    }
    /* RIGHT = place (Minecraft): the armed tile or tool where the crosshair / cursor is; nothing armed = a copy of the pick there */
    function placeAt(e) {
        var D = ED.draw;
        if (D) {
            var how = DRAWS[D.tool] ? DRAWS[D.tool].how : 'click';
            if (how === 'click' || how === 'doorway' || how === 'wall' || how === 'chain' || how === 'course' || D.tool === 'paint') { drawUp(e); return; }
            toast((DRAWS[D.tool] ? DRAWS[D.tool].label : 'THIS TOOL') + ' DRAWS WITH THE LEFT BUTTON (hold and drag)', 1800); return;
        }
        if (!ED.sel.length) { toast('NOTHING IN HAND · pick a tile (1-9 or the palette) or click a thing, then RIGHT click places it', 2600); return; }
        var c = rayGround(e.clientX, e.clientY); if (!c) return;
        duplicateSel(c);
    }
    /* MIDDLE while flying = take the thing under the crosshair in hand (it is picked: RIGHT stamps copies, R turns, DEL deletes) */
    function pickBlock(e) {
        var hit = pickAt(e.clientX, e.clientY);
        if (!hit) { toast('NOTHING THERE', 900); return; }
        drawSet(null); select(hit.list, hit.id);
        var h = selRow(ED.sel[0]); toast('IN HAND · ' + (h ? Core.rowLabel(h.list, h.row) : '') + ' · RIGHT click places copies', 1800);
    }
    var _down = null;
    function onMouseDown(e0) {
        if (!ED.open || ED.playing || !ED.view || e0.target !== ED.view.canvas) return;
        var fly = ED.look && lockedNow(), e = ptr(e0);
        if (e0.shiftKey) ED.keys.shiftUsed = true;
        ED.last.x = e0.clientX; ED.last.y = e0.clientY;
        if (fly) {
            if (e0.button === 2) { e0.preventDefault(); placeAt(e); return; }
            if (e0.button === 1) { e0.preventDefault(); pickBlock(e); return; }
        } else {
            if (e0.button === 2) { ED.rmb = true; ED.rmbMove = 0; ED.rmbAt = { clientX: e0.clientX, clientY: e0.clientY, shiftKey: e0.shiftKey, button: 2, target: e0.target }; e0.preventDefault(); lookLock(true); return; }
            if (e0.button === 1) { ED.mmb = true; e0.preventDefault(); return; }
            if (e0.button === 0 && e0.altKey) { var o = ED.sel.map(selRow).filter(Boolean)[0], a = o ? Core.rowAnchor(o.row) : spot(); ED.orbit = { x: a.x, z: a.z, y: ground(a.x, a.z) }; e0.preventDefault(); return; }
        }
        if (e0.button === 0) {
            _down = { x: e.clientX, y: e.clientY, mv: 0, fly: fly, tc: !fly && !!(ED.tc && ED.tc.axis) }; if (ED.draw) { e0.preventDefault(); drawDown(e); return; }
            /* E6: THE GRAB — press on a thing and drag it: it follows the cursor (or the crosshair) over the ground (the grid snap). A
               thing you can see (a prop, a door, a person's post, the spawn) grabs at once; a shape's box only when it is already picked */
            if (!_down.tc && (editable() || ED.mode === 'library') && ED.pivot) { var gh = pickAt(e.clientX, e.clientY); if (gh && (gh.list !== 'terrain.features' || isSel(gh.list, gh.id))) _down.grab = gh; }
        }
    }
    function grabStart(d, e) {
        var gh = d.grab;
        if (!isSel(gh.list, gh.id)) select(gh.list, gh.id, e.shiftKey);
        if (ED.mode === 'library') { if (!own()) { d.grab = null; return; } d.wait = true; return; }   // a game room: the copy builds first, then the drag goes on
        d.grab = null; d.wait = false;
        if (!ED.sel.length || !ED.pivot || !ED.tc || !ED.tc.object) return;
        var g0 = rayGround(d.x, d.y); if (!g0) return;
        dragStart(); ED.grab = { g0: g0, p0: ED.pivot.position.clone() }; ED.tcDragging = true;
    }
    function grabMove(e) {
        var G = ED.grab, g = rayGround(e.clientX, e.clientY); if (!G || !g) return;
        var u = U(), sn = ED.snap > 0 ? ED.snap : 0, dx = g.x - G.g0.x, dz = g.z - G.g0.z;
        if (sn) { dx = Core.snap(dx, sn); dz = Core.snap(dz, sn); }
        ED.pivot.position.set(G.p0.x + dx * u, G.p0.y, G.p0.z + dz * u); ED.pivot.updateMatrixWorld(true);
        dragMove();
    }
    function grabEnd() { if (!ED.grab) return; ED.grab = null; var t = ED.tool; ED.tool = 'translate'; dragEnd(); ED.tool = t; ED.tcDragging = false; }
    /* what the cursor / the crosshair is over: a grab follows it, a draw tool's ghost shows there */
    function hover(e) {
        if (_down && _down.grab && (_down.fly ? _down.mv > 6 : Math.hypot(e.clientX - _down.x, e.clientY - _down.y) > 4)) {
            if (!_down.wait) grabStart(_down, e);
            if (_down && _down.wait && ED.ready && ED.mode !== 'library') { _down.wait = false; if (_down.fly) { _down.x = e.clientX; _down.y = e.clientY; } grabStart(_down, e); }   // the copy stands: the drag starts here
        }
        if (ED.grab) { grabMove(e); return; }
        if (ED.draw && ED.mouse.in) {
            var D = ED.draw, how = DRAWS[D.tool] ? DRAWS[D.tool].how : 'click';
            if (how === 'doorway' || (how === 'click' && (D.entry || D.row) && D.tool !== 'paint')) placeShow(rayGround(e.clientX, e.clientY));
            else drawShow(how === 'click' || how === 'wall' ? null : drawPt(e.clientX, e.clientY, e));
        }
    }
    function turnEye(dx, dy) { var c = ED.cam; c.yaw += dx * 0.0042; c.pitch = Math.max(-1.55, Math.min(1.55, c.pitch - dy * 0.0042)); }
    function onMouseMove(e0) {
        if (!ED.open || ED.playing) return;
        var locked = lockedNow();
        var dx = locked ? (e0.movementX || 0) : e0.clientX - ED.last.x, dy = locked ? (e0.movementY || 0) : e0.clientY - ED.last.y;
        if (ED.rmb) ED.rmbMove = (ED.rmbMove || 0) + Math.abs(dx) + Math.abs(dy);
        if (locked) {
            if (ED.look || ED.rmb) turnEye(dx, dy);
            if (!ED.look) return;   // the right-button look: the cursor waits where it was
            if (_down) _down.mv += Math.abs(dx) + Math.abs(dy);
            var e = ptr(e0); ED.mouse.x = e.clientX; ED.mouse.y = e.clientY; ED.mouse.in = true;
            hover(e); return;
        }
        ED.last.x = e0.clientX; ED.last.y = e0.clientY;
        ED.mouse.x = e0.clientX; ED.mouse.y = e0.clientY; ED.mouse.in = !!(ED.view && e0.target === ED.view.canvas);
        if (_down) _down.mv += Math.abs(dx) + Math.abs(dy);
        var c = ED.cam;
        if (ED.rmb) { turnEye(dx, dy); return; }
        if (ED.mmb) { var sp = Math.max(0.02, Math.abs(c.y) * 0.0025 + 0.02); c.x -= (Math.cos(c.yaw) * dx) * sp; c.z -= (Math.sin(c.yaw) * dx) * sp; c.y += dy * sp; return; }
        if (ED.orbit) {
            var O = ED.orbit, vx = c.x - O.x, vz = c.z - O.z, vy = c.y - O.y, R = Math.max(1, Math.hypot(vx, vy, vz));
            var yaw = Math.atan2(vx, -vz) + dx * 0.006, el = Math.max(-1.4, Math.min(1.4, Math.asin(vy / R) + dy * 0.006));
            c.x = O.x + Math.sin(yaw) * Math.cos(el) * R; c.z = O.z - Math.cos(yaw) * Math.cos(el) * R; c.y = O.y + Math.sin(el) * R;
            c.yaw = Math.atan2(O.x - c.x, -(O.z - c.z)); c.pitch = Math.atan2(O.y - c.y, Math.hypot(O.x - c.x, O.z - c.z));
        }
        hover(e0);
    }
    function onMouseUp(e0) {
        if (!ED.open || ED.playing) return;
        var e = ptr(e0);
        if (e0.button === 2 && ED.rmb) {
            ED.rmb = false; if (!ED.look) lookLock(false);
            var at = ED.rmbAt; ED.rmbAt = null;
            if (at && (ED.rmbMove || 0) < 5) placeAt(at);   // a RIGHT click (no turn) places
            return;
        }
        if (e0.button === 1) ED.mmb = false;
        if (e0.button === 0) {
            ED.orbit = null;
            if (ED.grab) { _down = null; grabEnd(); return; }   // E6: the grab lands (one undo step)
            if (ED.stroke && !(ED.view && e0.target === ED.view.canvas)) { _down = null; strokeEnd(e); return; }   // E3: a stroke let go off the view still ends
            var d = _down; _down = null;
            if (d && d.wait) return;   // a game room's copy still building under a drag: the drag is dropped
            if (ED.draw && d && !d.tc && ED.view && e0.target === ED.view.canvas) { drawUp(e); return; }
            if (!d || d.tc || ED.tcDragging || !ED.view || e0.target !== ED.view.canvas) return;
            if (d.fly ? d.mv > 6 : Math.hypot(e.clientX - d.x, e.clientY - d.y) > 4) return;
            var hit = pickAt(e.clientX, e.clientY);
            if (hit) select(hit.list, hit.id, e.shiftKey);
            else if (!e.shiftKey) { if (ED.sel.length || d.fly) select(null); else lookSet(true); }   // empty ground: drop the pick; nothing to drop = fly (Minecraft's click into the game)
        }
    }
    function onWheel(e) {
        if (!ED.open || ED.playing || !ED.view || e.target !== ED.view.canvas) return;
        e.preventDefault();
        var c = ED.cam;
        if (ED.rmb || ED.look) { c.speed = Math.max(1, Math.min(200, c.speed * (e.deltaY < 0 ? 1.2 : 1 / 1.2))); toast('FLY SPEED ' + c.speed.toFixed(1) + ' m/s', 900); lookUi(); return; }
        var m = (e.deltaY < 0 ? 1 : -1) * Math.max(1, c.speed * 0.25);
        c.x += Math.sin(c.yaw) * Math.cos(c.pitch) * m; c.y += Math.sin(c.pitch) * m; c.z += -Math.cos(c.yaw) * Math.cos(c.pitch) * m;
    }
    function onContext(e) { if (ED.open && !ED.playing && ED.view && e.target === ED.view.canvas) e.preventDefault(); }
    function onLockError() { lockRefused(); }
    function bind(on) {
        var f = on ? 'addEventListener' : 'removeEventListener';
        window[f]('keydown', onKeyDown, true); window[f]('keyup', onKeyUp, true); window[f]('blur', onBlur);
        window[f]('mousedown', onMouseDown, true); window[f]('mousemove', onMouseMove); window[f]('mouseup', onMouseUp, true);
        window[f]('wheel', onWheel, { passive: false }); window[f]('contextmenu', onContext, true);
        document[f]('pointerlockchange', onLockChange); document[f]('pointerlockerror', onLockError);
    }
    /* THE HOTBAR (Minecraft's): nine slots holding the tools and tiles he used last; 1-9 takes one up again, 0 / V = the empty hand
       (SELECT). A tool or tile picked from the panels goes in the first empty slot, else in the slot in use. Kept in this browser. */
    function hotKeyOf(it) { return it ? (it.t === 'draw' ? 'draw:' + it.tool : 'pal:' + it.id) : ''; }
    function hotSave() { try { localStorage.setItem('ew_editor_hot', JSON.stringify(ED.hot.map(function (q) { return q ? { t: q.t, tool: q.tool, id: q.id, label: q.label } : null; }))); } catch (e) {} }
    function hotLoad() { try { var a = JSON.parse(localStorage.getItem('ew_editor_hot') || 'null'); if (Array.isArray(a)) ED.hot = a.slice(0, 9).map(function (q) { return q && (q.tool || q.id) ? q : null; }); } catch (e) {} }
    function hotPush(it) {
        var key = hotKeyOf(it), i;
        for (i = 0; i < 9; i++) if (hotKeyOf(ED.hot[i]) === key) { ED.hotI = i; hotUi(); return; }
        for (i = 0; i < 9; i++) if (!ED.hot[i]) break;
        if (i >= 9) i = ED.hotI >= 0 ? ED.hotI : 0;
        ED.hot[i] = it; ED.hotI = i; hotSave(); hotUi();
    }
    /* a palette entry by its id, across the tabs */
    function palFind(id) {
        var P = palData(), tabs = Object.keys(P).concat(['textures', 'kits']);
        for (var t = 0; t < tabs.length; t++) { var L = tabs[t] === 'textures' || tabs[t] === 'kits' ? palEntries(tabs[t]) : P[tabs[t]]; if (!Array.isArray(L)) continue; for (var i = 0; i < L.length; i++) if (L[i] && L[i].id === id) return L[i]; }
        return null;
    }
    function hotUse(i) {
        var it = ED.hot[i]; ED.hotI = i;
        if (!it) { drawSet(null); hotUi(); return; }
        if (it.t === 'draw') { if (!(ED.draw && ED.draw.tool === it.tool)) drawSet(it.tool); hotUi(); return; }
        var e = palFind(it.id);
        if (!e) { toast('THAT TILE IS NOT IN THIS GAME ANY MORE', 1600); ED.hot[i] = null; hotSave(); hotUi(); return; }
        var D = ED.draw; if (!(D && ((D.entry && D.entry.id === e.id) || (D.key && e.tex === D.key)))) palPick(e);
        hotUi();
    }
    function hotUi() {
        var B = $('edHot'); if (!B) return;
        var D = ED.draw, cur = D ? (D.entry ? 'pal:' + D.entry.id : D.entry0 ? 'pal:' + D.entry0.id : D.key ? 'pal:tex:' + D.key : DRAWS[D.tool] ? 'draw:' + D.tool : '') : '';
        var h = '';
        for (var i = 0; i < 9; i++) {
            var it = ED.hot[i], on = it ? hotKeyOf(it) === cur : (!D && ED.hotI === i);
            h += '<button class="ed-hs' + (on ? ' on' : '') + (it ? '' : ' empty') + '" data-hot="' + i + '" title="' + esc(it ? it.label : 'empty: the hand (SELECT)') + '"><i>' + (i + 1) + '</i>' + esc(it ? it.label : '') + '</button>';
        }
        if (B._h === h) return; B._h = h; B.innerHTML = h;
        B.querySelectorAll('[data-hot]').forEach(function (b) { b.onclick = function () { hotUse(+b.getAttribute('data-hot')); }; });
    }
    function turnSel(deg) {
        if (ED.sel.length && !own()) return;
        var hits = ED.sel.map(selRow).filter(Boolean); if (!editable()) return;
        if (!hits.length) { toast('CLICK A THING FIRST, THEN R TURNS IT', 1600); return; }
        var a = Core.rowAnchor(hits[0].row), step = [], live = true;
        hits.forEach(function (h) {
            if (h.list === 'doors' && h.row.wall && h.row.wall !== 'free') return;
            var after = Core.rowTransform(h.row, { rot: deg, px: a.x, pz: a.z });
            if (h.list !== 'props') live = false;
            if (h.list === 'spawn') step.push({ path: ['rooms', ED.roomId, 'spawn'], before: Core.clone(room().spawn), after: after });
            else step.push({ path: rowPath(h.list, h.i), before: Core.clone(h.row), after: after });
        });
        if (!step.length) { toast('A DOOR IN A WALL TURNS WITH ITS WALL', 1600); return; }
        /* E6: props turn in place at once (no rebuild of the room): the same turn the gizmo's live drag makes */
        if (live) {
            var u = U(), c = Math.cos(-deg * Math.PI / 180), s = Math.sin(-deg * Math.PI / 180);
            ED.sel.forEach(function (sl) { var o = objFor(sl); if (!o) { live = false; return; } var rx = o.position.x - a.x * u, rz = o.position.z - a.z * u; o.position.x = a.x * u + rx * c + rz * s; o.position.z = a.z * u - rx * s + rz * c; o.rotation.y -= deg * Math.PI / 180; });
        }
        commit(step, 'turn ' + deg + '°', { noReload: live });
        if (live) { rebuildProxies(); gizmoAttach(); }
        toast('TURN ' + (deg > 0 ? '+' : '') + deg + '°', 700);
    }
    /* E6: SIZE (- / =, the inspector's SIZE): a prop by its height (or its span, when the catalogue sizes it by span), a tree by
       its height (its trunk's blocker follows), a grove by its trees' height, a shape by scaling it about its middle. People,
       doors, signs and the spawn keep their size. → the row at f × its size, or null */
    /* a tree row's `h` is in the terrain's TILES (1.75 m; the renderer's _nrTree also varies each tree 0.85-1.3 ×): SIZE shows metres */
    function treeTile() { return (W.HQ_TERRAIN_RULES && +W.HQ_TERRAIN_RULES.tile) || 1.75; }
    function treeDefH(row) { var dead = false; try { dead = W.hqTreeDead ? W.hqTreeDead(row.kind || 'tree') : false; } catch (e) {} return row.kind === 'tree_4' ? 5.6 : dead ? 2.3 : 2.9; }
    function sizeOf(h) {   // the size shown: { v (m), what }
        var row = h.row;
        if (h.list === 'props') { var cat = DOOR_HQ.catalogue[row.key] || {}, sp = row.span != null || (cat.span != null && cat.h == null); return sp ? { v: +(row.span || cat.span || 1), what: 'wide' } : { v: +(row.h || cat.h || 1), what: 'tall' }; }
        if (h.list === 'terrain.features' && (row.k === 'tree' || row.k === 'grove')) return { v: +(row.h || treeDefH(row)) * treeTile(), what: 'tall (about)' };
        return null;
    }
    function sizeRow(h, f) {
        var row = h.row, a = Core.clone(row), R2 = function (v) { return Math.round(v * 100) / 100; }, cl = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };
        if (h.list === 'props') { var z = sizeOf(h); if (z.what === 'wide') a.span = R2(cl(z.v * f, 0.05, 200)); else a.h = R2(cl(z.v * f, 0.05, 200)); return a; }
        if (h.list !== 'terrain.features' || row.k === 'opening' || row.k === 'prefab' || row.k === 'kit') return null;
        if (row.k === 'tree' || row.k === 'grove') { a.h = R2(cl((+row.h || treeDefH(row)) * f, 0.3, 40)); if (row.k === 'tree') a.r = R2(cl((+row.r || 0.38) * f, 0.12, 4)); return a; }
        var an = Core.rowAnchor(row); return Core.rowTransform(row, { sx: f, sy: f, sz: f, px: an.x, pz: an.z });
    }
    function sizeSel(f, label) {
        if (ED.sel.length && !own()) return;
        var hits = ED.sel.map(selRow).filter(Boolean); if (!editable()) return;
        if (!hits.length) { toast('CLICK A THING FIRST, THEN - / = SIZE IT', 1600); return; }
        var pairs = [];
        hits.forEach(function (h) { if (h.list === 'spawn') return; var after = sizeRow(h, f); if (after) pairs.push({ list: h.list, i: h.i, before: Core.clone(h.row), after: after }); });
        if (!pairs.length) { toast('THAT KEEPS ITS SIZE (people, doors, signs, openings; a prefab: edit the prefab)', 2400); return; }
        replaceRows(pairs, label || ('size ×' + f.toFixed(2)));
        var z = hits.length === 1 ? sizeOf(Object.assign({}, hits[0], { row: pairs[0].after })) : null;
        toast(z ? 'SIZE ' + z.v.toFixed(2) + ' m ' + z.what : 'SIZE ×' + f.toFixed(2), 900);
    }
    /* E6: THE ROOFS (C, the top bar's ROOFS): every ceiling / roof the shells tag (`_ew_hqPart === 'ceil'`) is hidden, and a cut at
       the floor + h m (the spawn's floor) takes off whatever else roofs the room: a dome, a cave's rock, a hall's ceiling, the upper
       walls. The view only: nothing in the room changes. Kept per browser (localStorage `ew_editor_roof`). */
    function roofCutY() { var r = room(), sp = (r && r.spawn) || { x: 0, z: 0 }, g = ground(+sp.x || 0, +sp.z || 0); return (isFinite(g) ? g : 0) + (+ED.roof.h || 3); }
    function roofShow() { ED.roofHidden.forEach(function (o) { o.visible = true; }); ED.roofHidden = []; }
    function roofHide() {
        var V = ED.view; if (!V || !ED.roof.off || ED.playing) return;
        [V.shellGroup, V.propGroup].forEach(function (G) { if (G) G.traverse(function (o) { if (o._ew_hqPart === 'ceil' && o.visible) { o.visible = false; ED.roofHidden.push(o); } }); });
    }
    function roofSet(o) {
        Object.assign(ED.roof, o || {});
        ED.roof.h = Math.max(0.5, Math.min(60, +ED.roof.h || 3));
        try { localStorage.setItem('ew_editor_roof', JSON.stringify(ED.roof)); } catch (e) {}
        roofShow(); roofHide(); bandClip(true); panels();
        toast(ED.roof.off ? 'ROOFS HIDDEN · cut at ' + ED.roof.h + ' m over the floor (C shows them)' : 'ROOFS SHOWN', 1400);
    }

    /* ══ PLAY HERE: the walker at the cursor, the game's own entry (every system live); ESC comes back ══════════════════ */
    function playHere() {
        if (!ED.roomId) return;
        var p = spot(), face = Math.round(((ED.cam.yaw * 180 / Math.PI) % 360 + 360) % 360);
        if (ED.stroke) strokeEnd(); bandClipOff(); roofShow(); if (ED.clockH != null) clockPreview(null);
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
        zoneMovePatches(id, null, step);   // E7: out of its zone with it
        step.push({ path: ['rooms', id], before: Core.clone(r), after: undefined });
        if (ED.doc.start && ED.doc.start.room === id) { var other = ids.filter(function (x) { return x !== id; })[0]; step.push({ path: ['start'], before: Core.clone(ED.doc.start), after: { room: other, at: { x: 0, z: 0, face: 0 } } }); }
        commit(step, 'delete room');
        enterRoom(ids.filter(function (x) { return x !== id; })[0], 'world');
    }
    function duplicateRoom() {
        if (!editable()) return;
        var id = W.hqWorldDocNextRoomId(ED.doc), r = Core.clone(Core.cleanExport(room())), n = W.hqWorldDocRoomNo(id);
        r.label = 'Room ' + n; r.doors = [];
        var zd = zoneOf(ED.roomId), st = [{ path: ['rooms', id], before: undefined, after: r }];
        if (zd) zoneMovePatches(id, zd, st);   // E7: the copy stands in the same zone
        commit(st, 'duplicate room');
        enterRoom(id, 'world');
        toast('DUPLICATED AS ' + r.label.toUpperCase() + ' (its doors stay with the original)');
    }
    function copyIntoWorld() { if (ED.mode === 'library' && ED.roomId) own(); }   // the game room becomes his copy (the same as its first change)
    /* A GAME ROOM IS EDITED AS YOUR COPY (2026-10-05, mondo: "i loaded a map from the game to try to edit it, clicking on an object
       does absolutely nothing"). The library's rows had no ids, so not one of them picked. Now a library room's rows get ids the moment
       it opens (NOT enumerable: the game's own room object never carries them into a JSON copy or the survey), every tool works in it,
       and the first change copies it into his world (COPY INTO WORLD, at once, keeping the eye and the pick: the copy takes the same
       ids) and lands on the copy. The game's room is not touched; his copy goes live with the swap, like every room of his. */
    function libIds(r) {
        if (!r) return;
        var used = {}, max = 0, lists = (W.HQ_WORLD_DOC_RULES && W.HQ_WORLD_DOC_RULES.rowLists) || LISTS;
        lists.forEach(function (p) { (listOf(r, p) || []).forEach(function (x) { if (x && x.id != null) { used[String(x.id)] = 1; var m = /^r(\d+)$/.exec(String(x.id)); if (m) max = Math.max(max, +m[1]); } }); });
        lists.forEach(function (p) { (listOf(r, p) || []).forEach(function (x) {
            if (!x || typeof x !== 'object' || x.id != null) return;
            var id; do { id = 'r' + (++max); } while (used[id]);
            used[id] = 1; try { Object.defineProperty(x, 'id', { value: id, enumerable: false, configurable: true, writable: true }); } catch (e) {}
        }); });
    }
    /* his copy of a game room, if he made one (the copy remembers where it came from) */
    function copyOf(src) { var R = (ED.doc && ED.doc.rooms) || {}; for (var k in R) if (R[k] && R[k].edit && R[k].edit.from === src) return k; return null; }
    /* → true when the view can be edited now (a library room becomes his copy first) */
    function own() {
        if (ED.mode !== 'library') return editable();
        var src = ED.roomId; if (!src || !ED.doc) return false;
        var mine = copyOf(src);
        if (mine) { toast('YOU HAVE A COPY OF THIS ROOM ALREADY · ' + String(ED.doc.rooms[mine].label || mine).toUpperCase() + ' · editing that one', 4000); enterRoom(mine, 'world', { keepCam: true }); return false; }
        var keep = {}; Object.keys(ED.doc.rooms).forEach(function (k) { keep[k] = 1; });
        var id = W.hqWorldDocNextRoomId(ED.doc), c = W.hqWorldDocCopyRoom(src, id, keep), lib = DOOR_HQ.rooms[src];
        if (!c) { toast('THAT ROOM CANNOT BE COPIED'); return false; }
        /* the copy keeps the library's row ids (the doors keep their own), so what is picked stays picked */
        ((W.HQ_WORLD_DOC_RULES && W.HQ_WORLD_DOC_RULES.rowLists) || LISTS).forEach(function (p) {
            if (p === 'doors') return;
            var A = listOf(lib, p), B = listOf(c.room, p); if (!A || !B || A.length !== B.length) return;
            for (var i = 0; i < A.length; i++) if (A[i] && B[i] && A[i].id != null) B[i].id = String(A[i].id);
        });
        var name = String((lib && lib.label) || src);
        var sel = ED.sel.slice(), step = [{ path: ['rooms', id], before: undefined, after: c.room }];
        step.lib = src;   // its undo goes back to the game's room
        commit(step, 'edit ' + name.toLowerCase());
        enterRoom(id, 'world', { keepCam: true });
        ED.sel = sel.filter(function (q) { return !!selRow(q); }); gizmoAttach(); panels();
        toast('EDITING YOUR COPY OF ' + name.toUpperCase() + ' (' + String(c.room.label).toUpperCase() + ') · the game\'s room stays as it is until your world goes live' + (c.dropped ? ' · ' + c.dropped + ' door(s) to rooms outside your world were left out' : ''), 6000);
        return editable();
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
            delete doc.land;   // an old export's land block (the land was cut 2026-09-29, ZONES_PLAN Z0)
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
        var R = DOOR_HQ.rooms, items = Object.keys(R).filter(function (k) { var r = R[k]; return r && k !== PF_ROOM && !W.hqWorldDocIsOwn(k); }).map(function (k) {
            var r = R[k], S = r.shell || {};
            return { label: String(r.label || k), sub: k + ' · ' + roomSize(r) + (r.terrain ? ' · terrain' : '') + (r.terrain && r.terrain.gen ? ' (generated)' : '') + ' · ' + (r.props || []).length + ' props', value: k };
        }).sort(function (a, b) { return a.label < b.label ? -1 : 1; });
        pick('THE LIBRARY · a game room to look at or edit (your first change makes it your own copy)', items, function (k) {
            var mine = copyOf(k); if (mine) { enterRoom(mine, 'world'); toast('YOUR COPY OF ' + String(DOOR_HQ.rooms[k].label || k).toUpperCase() + ' · ' + String(ED.doc.rooms[mine].label || mine).toUpperCase(), 3500); return; }
            enterRoom(k, 'library'); toast('GAME ROOM · click things to pick them; the first change makes it your own copy', 4000);
        });
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
    function placeRow(row, label, list) { if (!own()) return; drawSet('place'); ED.draw.row = row; ED.draw.label = label; ED.draw.list = list || 'terrain.features'; toast('CLICK ON THE GROUND to place ' + label + ' · ESC cancels', 4000); }
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
        if (ED.sel.length && !own()) return null;
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

    /* ══ THE LAYOUT (E5, EDITOR_PLAN §5.7 + mondo's ask 2026-09-29: "rooms of different sizes and connect them with hallways … for a
       forest 'dungeon' the walls are the trees … a dirt pathway while you're surrounded by trees; clearings the rooms, paths the
       hallways"). A room with a layout (terrain.gen { kind: 'plan', look }) is SOLID except the `space` rows (rooms, clearings) and the
       `hall` rows (hallways, paths) drawn on the LAYOUT tab; data.js _hqTGenerate makes the solid WALLS to the ceiling, TREES the
       walker never walks into (the game's own trees, a trunk line on every edge), or ROCK. DUNGEONS groups rooms as levels
       (world.json `dungeons`); FREEZE turns a copied room's generated plan into these rows ═════════════════════════════════════ */
    var LOOKS = [['walls', 'WALLS', 'Rooms and hallways inside walls that reach the ceiling: a dungeon, a building\'s floor.'],
                 ['trees', 'TREES', 'Clearings joined by dirt paths; everything else is forest the walker cannot enter.'],
                 ['rock', 'ROCK', 'Caves: the solid is a rock bank too high to climb.']];
    var DUNGEON_LOOKS = {
        walls: { floor: 'dungeon', wall: 'bricks_3', path: 'cobblestone', open: false, h: 4, mood: { light: 0xffe2b8, ambient: 0.38 } },
        trees: { floor: 'grass_dark_fantasy', wall: 'rocks_1', path: 'dirt', open: true, h: 8, forest: true, mood: { light: 0xfff0d8, ambient: 0.45 } },
        rock:  { floor: 'cave_floor', wall: 'rock_wall_1', path: 'dirt_2', open: false, h: 6, mood: { light: 0xd8e0ff, ambient: 0.32 } },
    };
    function planOf(r) { var g = r && r.terrain && r.terrain.gen; return (g && g.kind === 'plan') ? g : null; }
    function layoutGenNew(look) { var g = { kind: 'plan', look: look || ED.opts.planLook || 'walls' }; if (g.look === 'walls' && ED.opts.wallKey) g.wallKey = ED.opts.wallKey; return g; }
    /* drawn layout pieces → rows, as ONE undo step (the room's first piece also gives it its layout; a generated plan is replaced) */
    function layoutAdd(rows, label) {
        if (!own()) return;
        var r = room(), step = [];
        if (ED.mode !== 'prefab') {
            if (!r.terrain) { toast('THIS ROOM HAS NO GROUND TO LAY OUT'); return; }
            var g = r.terrain.gen;
            if (!g || g.kind !== 'plan') {
                step.push({ path: basePath().concat(['terrain', 'gen']), before: Core.clone(g), after: layoutGenNew() });
                if (g) toast('THE GENERATED FLOOR PLAN (' + String(g.kind || '').toUpperCase() + ') IS REPLACED BY YOUR LAYOUT · UNDO brings it back · FREEZE keeps its rooms', 6000);
                else toast('THIS ROOM IS NOW A LAYOUT (' + String(ED.opts.planLook || 'walls').toUpperCase() + '): everything you have not drawn is solid', 4000);
            }
        }
        var n = ensureList('terrain.features', step), max = +nextId(r).slice(1) - 1;
        rows.forEach(function (row, i) { row.id = 'r' + (++max); step.push({ path: rowPath('terrain.features', n + i), before: undefined, after: row }); });
        commit(step, label);
    }
    /* the room's layout settings: one field → one undo step (path under terrain) */
    function layoutSet(key, val, label) {
        if (!editable() || ED.mode === 'prefab') return;
        var r = room(), g = planOf(r), step = [];
        if (key === 'look') {
            var ng = g ? Core.clone(g) : layoutGenNew(val); ng.look = val;
            step.push({ path: basePath().concat(['terrain', 'gen']), before: Core.clone(r.terrain.gen), after: ng });
            /* a forest wants the forest's ground (mondo's ruling: forest floor grass_dark_fantasy, trails dirt) — only over the untouched defaults */
            if (val === 'trees' && (!r.terrain.floor || r.terrain.floor === 'grass_2')) {
                step.push({ path: basePath().concat(['terrain', 'floor']), before: r.terrain.floor, after: 'grass_dark_fantasy' });
                if (r.terrain.path !== 'dirt') step.push({ path: basePath().concat(['terrain', 'path']), before: r.terrain.path, after: 'dirt' });
                toast('THE FOREST FLOOR IS grass_dark_fantasy, ITS PATHS dirt (the room\'s floor and path sheets)', 4000);
            }
            ED.opts.planLook = val; saveOpts();
            commit(step, 'layout look ' + val); return;
        }
        if (key === 'floor' || key === 'path') { if (r.terrain[key] === val) return; commit([{ path: basePath().concat(['terrain', key]), before: r.terrain[key], after: val }], label || key); return; }
        if (!g) return;
        var cur = g[key];
        if (val === '' || val == null) { if (cur === undefined) return; commit([{ path: basePath().concat(['terrain', 'gen', key]), before: Core.clone(cur), after: undefined }], label || key); return; }
        if (JSON.stringify(cur) === JSON.stringify(val)) return;
        commit([{ path: basePath().concat(['terrain', 'gen', key]), before: Core.clone(cur), after: val }], label || key);
    }
    /* REMOVE LAYOUT: the plan and every room / hallway row go (one step) */
    function layoutRemove() {
        if (!editable() || ED.mode === 'prefab') return;
        var r = room(), F = listOf(r, 'terrain.features') || [], step = [];
        for (var i = F.length - 1; i >= 0; i--) if (F[i] && (F[i].k === 'space' || F[i].k === 'hall')) step.push({ path: rowPath('terrain.features', i), before: Core.clone(F[i]), after: undefined });
        if (planOf(r)) step.push({ path: basePath().concat(['terrain', 'gen']), before: Core.clone(r.terrain.gen), after: undefined });
        if (!step.length) return;
        if (!confirm('Remove the layout (its rooms and hallways) from ' + (r.label || ED.roomId) + '? UNDO brings it back.')) return;
        commit(step, 'remove layout');
    }
    /* FREEZE (§5.8): a generated plan (clearings + paths, rooms + corridors) → layout rows */
    function layoutFreeze() {
        if (ED.mode === 'library') own();
        if (!editable() || ED.mode === 'prefab') return;
        var r = room(), g = r.terrain && r.terrain.gen, info = termInfo(), fz = null;
        try { fz = W.hqPlanFreeze ? W.hqPlanFreeze(info, g) : null; } catch (e) { fz = null; }
        if (!fz) { toast('ONLY A ROOMS OR HALLS PLAN FREEZES (a cave, a city and the ley lines have no rooms to hand over)', 5000); return; }
        var step = [{ path: basePath().concat(['terrain', 'gen']), before: Core.clone(g), after: fz.gen }];
        var n = ensureList('terrain.features', step), max = +nextId(r).slice(1) - 1;
        fz.rows.forEach(function (row, i) { row.id = 'r' + (++max); step.push({ path: rowPath('terrain.features', n + i), before: undefined, after: row }); });
        commit(step, 'freeze the plan');
        toast('FROZEN · ' + fz.rows.length + ' rooms and hallways, look ' + fz.gen.look.toUpperCase(), 4000);
    }
    /* THE READOUT (the compiled room): pieces, trees, cold pieces (no walk from the spawn or a door reaches them), cut door paths */
    function layoutReport() { var info = termInfo(); try { return (info && W.hqPlanReport) ? W.hqPlanReport(info) : null; } catch (e) { return null; } }
    /* DUNGEONS (world.json `dungeons` = { label, look, levels: [{ room, y }] }): a new dungeon is its Level 1 room, dressed for its look,
       with one room drawn round the spawn; + LEVEL adds the next one (join them with the DOOR tool) */
    function dungeonRoom(id, look, label, n) {
        var L = DUNGEON_LOOKS[look] || DUNGEON_LOOKS.walls, r = W.hqWorldDocNewRoom(id, { w: 96, d: 96, floor: L.floor, label: label });
        var S = r.shell; S.open = L.open; if (L.open) S.edge = 'open'; else delete S.edge; S.h = L.h; S.wallH = L.h; S.wall = L.wall; S.ceiling = L.wall; S.skirt = L.path; S.dado = L.path; S.mood = Core.clone(L.mood);
        if (L.forest) S.forest = true;
        r.terrain.floor = L.floor; r.terrain.cliff = L.wall; r.terrain.path = L.path;
        r.terrain.gen = { kind: 'plan', look: look };
        if (look === 'walls') r.terrain.gen.wallKey = L.wall;
        r.terrain.features = [{ id: 'r1', k: 'space', x: 0, z: 0, w: 14, d: 12 }];
        return r;
    }
    function dungeonNew() {
        if (ED.mode !== 'world') { toast('DUNGEONS LIVE IN YOUR WORLD'); return; }
        ask('NEW DUNGEON', [{ name: 'look', label: 'Look', type: 'select', value: ED.opts.planLook || 'walls', options: LOOKS.map(function (l) { return [l[0], l[1] + ' · ' + l[2]]; }) }], function (v) {
            var n = 1; while (ED.doc.dungeons['w_dg' + n]) n++;
            var did = 'w_dg' + n, id = W.hqWorldDocNextRoomId(ED.doc), look = v.look || 'walls', r = dungeonRoom(id, look, 'Dungeon ' + n + ' Level 1');
            commit([{ path: ['rooms', id], before: undefined, after: r }, { path: ['dungeons', did], before: undefined, after: { label: 'Dungeon ' + n, look: look, levels: [{ room: id, y: 0 }] } }], 'new dungeon');
            ED.opts.planLook = look; ED.opts.tab = 'layout'; saveOpts();
            enterRoom(id, 'world');
            toast('DUNGEON ' + n + ' · LEVEL 1 · draw its rooms and hallways on the LAYOUT tab', 5000);
        });
    }
    function dungeonLevel(did) {
        var D = ED.doc.dungeons[did]; if (!D) return;
        var lv = (D.levels || []).filter(function (l) { return l && ED.doc.rooms[l.room]; }), m = lv.length + 1, y = lv.length ? Math.min.apply(null, lv.map(function (l) { return +l.y || 0; })) - 6 : 0;
        var id = W.hqWorldDocNextRoomId(ED.doc), r = dungeonRoom(id, D.look || 'walls', D.label + ' Level ' + m);
        var levels = Core.clone(D.levels || []); levels.push({ room: id, y: y });
        commit([{ path: ['rooms', id], before: undefined, after: r }, { path: ['dungeons', did, 'levels'], before: Core.clone(D.levels), after: levels }], 'add a level');
        enterRoom(id, 'world');
        toast(String(r.label).toUpperCase() + ' · join it to the level above with the DOOR tool (DOORS tab)', 5000);
    }
    function dungeonDel(did) {
        var D = ED.doc.dungeons[did]; if (!D) return;
        if (!confirm('Take ' + D.label + ' off the dungeon list? Its rooms stay in your world. (UNDO brings it back)')) return;
        commit([{ path: ['dungeons', did], before: Core.clone(D), after: undefined }], 'drop ' + D.label);
    }
    function dungeonsHtml() {
        if (!ED.doc) return '';
        var ids = Object.keys(ED.doc.dungeons || {}), h = '<div class="ed-sub">DUNGEONS · ' + ids.length + '</div>';
        ids.forEach(function (did) {
            var D = ED.doc.dungeons[did];
            h += '<div class="ed-rowx"><span class="ed-note" style="flex:1">' + esc(D.label || did) + ' · ' + esc(String(D.look || 'walls').toUpperCase()) + '</span><button class="ed-btn" data-dglv="' + esc(did) + '" title="A new room under the last level">+ LEVEL</button><button class="ed-btn ed-x" data-dgdel="' + esc(did) + '" title="Take it off the list (its rooms stay)">✕</button></div>';
            (D.levels || []).forEach(function (l, i) { var rr = ED.doc.rooms[l.room]; if (!rr) return; h += '<button class="ed-row' + (ED.roomId === l.room ? ' on' : '') + '" data-dgroom="' + esc(l.room) + '">Level ' + (i + 1) + '<span>' + esc(rr.label || l.room) + ' · y ' + (+l.y || 0) + '</span></button>'; });
        });
        return h + '<button class="ed-row ed-add" data-lact="dgnew">+ NEW DUNGEON</button>';
    }
    function layoutHtml() {
        var r = room(), g = planOf(r), T = (r && r.terrain) || {}, look = g ? (g.look || 'walls') : (ED.opts.planLook || 'walls'), h = '';
        var pf = ED.mode === 'prefab';
        h += '<div class="ed-sub">LOOK' + (g ? '' : ' · for the first piece you draw') + '</div><div class="ed-palb">';
        LOOKS.forEach(function (l) { h += '<button class="ed-btn' + (look === l[0] ? ' on' : '') + '" data-llook="' + l[0] + '" title="' + esc(l[2]) + '"' + (pf ? ' disabled' : '') + '>' + l[1] + '</button>'; });
        h += '</div><div class="ed-note">' + esc((LOOKS.filter(function (l) { return l[0] === look; })[0] || LOOKS[0])[2]) + '</div>';
        if (pf) h += '<div class="ed-note">In a prefab the rooms and hallways are pieces: the room you place it in takes its own look.</div>';
        if (T.gen && !g && !pf) h += '<div class="ed-note">This room\'s floor plan is GENERATED (' + esc(T.gen.kind || '') + '). FREEZE turns its rooms and paths into layout pieces you can move; drawing a piece replaces it.</div><div class="ed-acts"><button class="ed-btn" data-lact="freeze">FREEZE</button></div>';
        var fld = function (key, label, val, kind, ph) {
            if (kind === 'tex') return '<label class="ed-f"><span>' + esc(label) + '</span><input type="text" data-lk="' + key + '" value="' + esc(val || '') + '" list="edDlTex" placeholder="' + esc(ph || '') + '"><button class="ed-btn ed-texb" data-ltex="' + key + '" title="Pick a texture"' + texSwatchStyle(val) + '>…</button></label>';
            return '<label class="ed-f"><span>' + esc(label) + '</span><input type="' + (kind === 'text' ? 'text' : 'number') + '" step="any" data-lk="' + key + '" value="' + esc(val == null ? '' : val) + '" placeholder="' + esc(ph || '') + '"></label>';
        };
        if (g) {
            var K = (W.HQ_TERRAIN_GEN && W.HQ_TERRAIN_GEN.plan) || {};
            h += '<div class="ed-form" data-scope="layout">';
            if (look === 'walls') { h += fld('wallH', 'Wall height (m)', g.wallH, 'num', (r.shell && r.shell.open) ? String(K.wallH || 4) : 'to the ceiling'); h += fld('wallKey', 'Wall sheet', g.wallKey, 'tex', 'the room\'s wall'); h += fld('wallT', 'Wall thickness (m)', g.wallT, 'num', String(K.wallT || 0.5)); }
            if (look === 'trees') {
                h += fld('kinds', 'Trees (TREES tab kinds, commas)', (g.kinds || []).join(', '), 'text', (K.kinds || []).join(', '));
                h += fld('treeGap', 'Trunks along the edge (m apart)', g.treeGap, 'num', String(K.treeGap));
                h += fld('depth', 'Forest depth behind the edge (m)', g.depth, 'num', String(K.depth));
                h += fld('maxTrees', 'Most trees', g.maxTrees, 'num', String(K.maxTrees));
                h += fld('treeH', 'Tree height min, max (m)', (g.treeH || []).join(', '), 'text', (K.treeH || []).join(', '));
            }
            if (look === 'rock') h += fld('wallH', 'Rock height (m)', g.wallH, 'num', String(K.rockH || 3.2));
            h += fld('floor', 'Floor sheet (the room\'s)', T.floor, 'tex');
            if (look !== 'walls') h += fld('path', 'Path sheet (the hallways' + (look === 'trees' ? '; a clearing with dirt on' : '') + ')', T.path, 'tex');
            h += '</div>';
            var rep = layoutReport();
            if (rep) {
                h += '<div class="ed-note">' + rep.spaces + ' room' + (rep.spaces === 1 ? '' : 's') + ' · ' + rep.halls + ' hallway' + (rep.halls === 1 ? '' : 's') + (look === 'trees' ? ' · ' + rep.trees + ' trees' : look === 'walls' ? ' · ' + rep.walls + ' wall pieces' : '') + '</div>';
                if (rep.cold.length) h += '<div class="ed-note ed-warn">NOT JOINED to the spawn or a door: ' + rep.cold.map(function (id) { return '<button class="ed-btn" data-lsel="' + esc(id) + '">' + esc(id) + '</button>'; }).join(' ') + '</div>';
                if (rep.cut) h += '<div class="ed-note ed-warn">' + rep.cut + ' door(s) no room reached: a way was cut to ' + (rep.cut > 1 ? 'them' : 'it') + ' (draw a hallway to it to choose the way)</div>';
            }
            h += '<div class="ed-acts"><button class="ed-btn ed-danger" data-lact="remove">REMOVE LAYOUT</button></div>';
        }
        if (!pf) h += dungeonsHtml();
        return h;
    }
    function layoutWire(L) {
        L.querySelectorAll('[data-llook]').forEach(function (b) { b.onclick = function () { var v = b.getAttribute('data-llook'); if (planOf(room())) layoutSet('look', v); else { ED.opts.planLook = v; saveOpts(); panels(); } }; });
        L.querySelectorAll('[data-lk]').forEach(function (el) {
            el.onchange = function () {
                var k = el.getAttribute('data-lk'), raw = el.value.trim(), v;
                if (k === 'kinds') v = raw ? raw.split(/[\s,]+/).filter(Boolean) : '';
                else if (k === 'treeH') { var a = raw.split(/[\s,]+/).map(parseFloat).filter(isFinite); v = a.length === 2 ? [Math.min(a[0], a[1]), Math.max(a[0], a[1])] : ''; }
                else if (el.type === 'number') v = raw === '' ? '' : (isFinite(parseFloat(raw)) ? parseFloat(raw) : null);
                else v = raw;
                if (v === null) return;
                layoutSet(k, v, 'layout ' + k);
            };
        });
        L.querySelectorAll('[data-ltex]').forEach(function (b) { b.onclick = function () { var k = b.getAttribute('data-ltex'), r = room(), cur = (k === 'floor' || k === 'path') ? r.terrain[k] : (planOf(r) || {})[k]; texPick(cur, function (v) { layoutSet(k, v, 'layout ' + k); }); }; });
        L.querySelectorAll('[data-lsel]').forEach(function (b) { b.onclick = function () { select('terrain.features', b.getAttribute('data-lsel')); frameSel(); }; });
        L.querySelectorAll('[data-lact]').forEach(function (b) { b.onclick = function () { var a = b.getAttribute('data-lact'); if (a === 'remove') layoutRemove(); else if (a === 'freeze') layoutFreeze(); else if (a === 'dgnew') dungeonNew(); }; });
        L.querySelectorAll('[data-dglv]').forEach(function (b) { b.onclick = function () { dungeonLevel(b.getAttribute('data-dglv')); }; });
        L.querySelectorAll('[data-dgdel]').forEach(function (b) { b.onclick = function () { dungeonDel(b.getAttribute('data-dgdel')); }; });
        L.querySelectorAll('[data-dgroom]').forEach(function (b) { b.onclick = function () { saveCam(); enterRoom(b.getAttribute('data-dgroom'), 'world'); }; });
    }

    /* ══ THE ZONE TOOLS (E7, ZONES_PLAN §8.2): the door's FLAGS (SECRET, ONE WAY, LOCKED), a room's SITE and ZONE, ZONES (his rooms
       grouped, each a node on the world map once his world is live: data.js hqWorldDocApply), the LEADS TO tab (hqWorldGraph for his
       rooms, drawn), and two audits: SIGHT (§2.2: two exits in a straight line of sight, or in one room) and FIELD (§2.3 as amended by
       EXPLORATION_BATTLES_PLAN §7: a room of the layout with too few battle seats). Each edit is one undo step ═════════════════════════════════════════════════════════════ */
    var ZONE_COLORS = ['#6fd3ff', '#57f287', '#ffd84a', '#ff9f43', '#c792ea', '#ff6b9d', '#4ecdc4', '#b8e986'];
    function byRoomNo(a, b) { return (W.hqWorldDocRoomNo(a) || 0) - (W.hqWorldDocRoomNo(b) || 0); }
    function zoneNo(id) { var m = /(\d+)$/.exec(String(id || '')); return m ? +m[1] : 0; }
    function zoneIds() { var Z = (ED.doc && ED.doc.zones) || {}; return Object.keys(Z).filter(function (z) { return W.hqWorldDocIsOwnZone(Z[z]); }).sort(function (a, b) { return zoneNo(a) - zoneNo(b); }); }
    function zoneOf(rid) { return (ED.doc && W.hqWorldDocZoneOf) ? W.hqWorldDocZoneOf(ED.doc, rid) : null; }
    function zoneColor(zid) { var i = zoneIds().indexOf(zid); return i < 0 ? '#8a96a8' : (ED.doc.zones[zid].color || ZONE_COLORS[i % ZONE_COLORS.length]); }
    function zoneLabel(zid) { var Z = zid && ED.doc.zones[zid]; return Z ? String(Z.label || zid) : ''; }
    /* the patches that move room `rid` into zone `zid` (null = out of every zone), appended to `step` */
    function zoneMovePatches(rid, zid, step) {
        var cur = zoneOf(rid);
        if (cur === zid) return step;
        if (cur) {
            var Z = ED.doc.zones[cur], left = Z.rooms.filter(function (x) { return x !== rid; });
            step.push({ path: ['zones', cur, 'rooms'], before: Core.clone(Z.rooms), after: left });
            if (Z.anchor === rid) step.push({ path: ['zones', cur, 'anchor'], before: Z.anchor, after: left[0] });
        }
        if (zid) {
            var N = ED.doc.zones[zid];
            step.push({ path: ['zones', zid, 'rooms'], before: Core.clone(N.rooms), after: N.rooms.concat([rid]) });
            if (!N.anchor || !ED.doc.rooms[N.anchor]) step.push({ path: ['zones', zid, 'anchor'], before: N.anchor, after: rid });
        }
        return step;
    }
    function zoneCommit(step, label) { commit(step, label, { noReload: true }); auditSoon(); }
    function zoneSet(rid, zid) {
        if (zid === '__new') { zoneNew(rid); return; }
        var step = zoneMovePatches(rid, zid || null, []);
        if (step.length) zoneCommit(step, zid ? 'into ' + zoneLabel(zid) : 'out of ' + zoneLabel(zoneOf(rid)));
    }
    function zoneNew(rid) {
        if (!ED.doc) return;
        var zid = W.hqWorldDocNextZoneId(ED.doc);
        ask('NEW ZONE', [{ name: 'label', label: 'Name', value: 'Zone ' + zoneNo(zid) }], function (v) {
            var step = [{ path: ['zones', zid], before: undefined, after: { label: String(v.label || '').trim() || ('Zone ' + zoneNo(zid)), rooms: [] } }];
            if (rid) {
                var cur = zoneOf(rid);
                if (cur) { var Z = ED.doc.zones[cur], left = Z.rooms.filter(function (x) { return x !== rid; }); step.push({ path: ['zones', cur, 'rooms'], before: Core.clone(Z.rooms), after: left }); if (Z.anchor === rid) step.push({ path: ['zones', cur, 'anchor'], before: Z.anchor, after: left[0] }); }
                step.push({ path: ['zones', zid, 'rooms'], before: [], after: [rid] }, { path: ['zones', zid, 'anchor'], before: undefined, after: rid });
            }
            zoneCommit(step, 'new zone');
            toast(String(step[0].after.label).toUpperCase() + (rid ? ' · ' + String((ED.doc.rooms[rid] || {}).label || rid).toUpperCase() + ' is in it' : ' · pick it in a room\'s ZONE (the inspector)'), 3500);
        });
    }
    /* a zone's name, its node on the map (its own, or an existing place's: the Woods' node …), the room the node opens on, its
       spot on the WORLD sheet (blank = the ring round the building), and DELETE (its rooms stay, in no zone) */
    function zoneEdit(zid) {
        var Z = ED.doc.zones[zid]; if (!Z) return;
        var H = (typeof DOOR_HQ !== 'undefined' && DOOR_HQ.hubs) || {}, hubs = Object.keys(H).filter(function (k) { return k !== 'hq' && !W.hqWorldDocIsOwn(k); });
        var rooms = Z.rooms.filter(function (r) { return ED.doc.rooms[r]; }).sort(byRoomNo);
        ask('ZONE · ' + String(Z.label || zid).toUpperCase(), [
            { name: 'label', label: 'Name', value: Z.label || '' },
            { name: 'hub', label: 'On the map', type: 'select', value: Z.hub || '', options: [['', 'A node of its own']].concat(hubs.map(function (k) { return [k, 'Joins ' + String(H[k].label || k) + ' (' + k + ')']; })) },
            { name: 'anchor', label: 'The node opens on', type: 'select', value: Z.anchor || rooms[0] || '', options: rooms.length ? rooms.map(function (r) { return [r, (ED.doc.rooms[r].label || r) + ' (' + r + ')']; }) : [['', 'no rooms yet']] },
            { name: 'sx', label: 'Map spot x (blank = the ring)', value: Z.slot && isFinite(Z.slot.x) ? Z.slot.x : '' },
            { name: 'sy', label: 'Map spot y (north is −)', value: Z.slot && isFinite(Z.slot.y) ? Z.slot.y : '' },
            { name: 'color', label: 'Colour (#rrggbb, blank = the list\'s)', value: Z.color || '' },
            { name: 'del', label: 'Delete this zone (its rooms stay)', type: 'checkbox', value: false },
        ], function (v) {
            if (v.del) { zoneCommit([{ path: ['zones', zid], before: Core.clone(Z), after: undefined }], 'delete ' + (Z.label || zid)); return; }
            var after = Core.clone(Z), sx = parseFloat(v.sx), sy = parseFloat(v.sy);
            after.label = String(v.label || '').trim() || Z.label || zid;
            if (v.hub) after.hub = v.hub; else delete after.hub;
            if (v.anchor) after.anchor = v.anchor;
            if (isFinite(sx) && isFinite(sy)) after.slot = { x: sx, y: sy }; else delete after.slot;
            if (/^#[0-9a-f]{6}$/i.test(String(v.color || '').trim())) after.color = String(v.color).trim(); else delete after.color;
            zoneCommit([{ path: ['zones', zid], before: Core.clone(Z), after: after }], 'zone ' + after.label);
        });
    }
    /* SITE (§8.2.2): the battle map, population and encounter table the room belongs to (EW_MAP_META); without one no fight starts */
    function siteList() {
        if (siteList._c) return siteList._c;
        var M = []; try { M = (typeof EW_MAP_META !== 'undefined' ? EW_MAP_META : W.EW_MAP_META) || []; } catch (e) {}
        return (siteList._c = M.filter(function (m) { return m && m.id; }).map(function (m) { return [m.id, String(m.label || m.id)]; }).sort(function (a, b) { return a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0; }));
    }
    function siteLabel(id) { var s = siteList().filter(function (x) { return x[0] === id; })[0]; return s ? s[1] : id; }
    function siteSet(v) {
        var r = room(); if (!r || ED.mode !== 'world') return;
        var after = v || undefined; if (r.site === after) return;
        commit([{ path: ['rooms', ED.roomId, 'site'], before: r.site, after: after }], after ? 'site ' + siteLabel(after) : 'no site', { noReload: true });
    }
    function zoneSiteHtml(r) {
        var z = zoneOf(ED.roomId), zs = zoneIds();
        var h = '<div class="ed-sub">ZONE AND SITE</div><div class="ed-form">' +
            '<label class="ed-f"><span>zone</span><select id="edZone"><option value="">no zone</option>' + zs.map(function (id) { return '<option value="' + esc(id) + '"' + (id === z ? ' selected' : '') + '>' + esc(zoneLabel(id)) + '</option>'; }).join('') + '<option value="__new">a new zone…</option></select></label>' +
            '<label class="ed-f"><span>site</span><select id="edSite"><option value="">none (no fights here)</option>' + siteList().map(function (s) { return '<option value="' + esc(s[0]) + '"' + (s[0] === r.site ? ' selected' : '') + '>' + esc(s[1]) + '</option>'; }).join('') + '</select></label></div>';
        h += '<div class="ed-note">ZONE = which of your zones this room belongs to (the outliner groups them; the world map shows a zone as one place). SITE = the battle map, the people and the encounters this room uses' + (r.site ? ' (now ' + esc(siteLabel(r.site)) + ')' : '; with none, no fight can start here') + '.</div>';
        return h;
    }
    function zoneSiteWire(P) {
        if ($('edZone')) $('edZone').onchange = function () { zoneSet(ED.roomId, this.value); };
        if ($('edSite')) $('edSite').onchange = function () { siteSet(this.value); };
    }

    /* ── THE DOOR'S FLAGS (§8.2.1). SECRET = a draught on both ends of the pair (no leaf, no plate, the wall's own panel; the runtime's
       `secret`); ONE WAY = no door leads back (the far end's door goes, you arrive at the spawn); off = a door back in front of the
       far spawn (the DOOR tool's RETURN DOOR). LOCKED = `minClearance` (the clearance level) and `requiresKeys` (Keys held). ── */
    function doorFlagsHtml(row) {
        var da = row.action || {}, partners = W.hqDoorPartners(ED.doc, ED.roomId, row.id), farMine = !!(da.room && ED.doc.rooms[da.room]);
        var lv = [[0, 'open to all']].concat([2, 3, 4, 5, 6].map(function (l) { return [l, 'clearance L' + l]; }));
        return '<div class="ed-sub">FLAGS</div><div class="ed-form">' +
            '<label class="ed-f"><span>secret</span><input type="checkbox" data-df="secret"' + (row.secret ? ' checked' : '') + '></label>' +
            '<label class="ed-f"><span>one way</span><input type="checkbox" data-df="oneway"' + (!partners.length ? ' checked' : '') + (farMine ? '' : ' disabled') + '></label>' +
            '<label class="ed-f"><span>locked</span><select data-df="minClearance">' + lv.map(function (l) { return '<option value="' + l[0] + '"' + ((+row.minClearance || 0) === l[0] ? ' selected' : '') + '>' + l[1] + '</option>'; }).join('') + '</select></label>' +
            '<label class="ed-f"><span>keys needed</span><input type="number" min="0" step="1" data-df="requiresKeys" value="' + (+row.requiresKeys || 0) + '"></label></div>' +
            '<div class="ed-note">SECRET: a draught, the wall\'s own panel with no leaf or plate, found with the protractor; on the map dashed once both sides are walked (both ends change). ONE WAY: no door back, you arrive at the far room\'s spawn (off: a door back stands in front of its spawn). LOCKED: the clearance and the Keys the walker needs.</div>';
    }
    function doorFlagsWire(P, h) {
        P.querySelectorAll('[data-df]').forEach(function (el) {
            el.onchange = function () { var k = el.getAttribute('data-df'); doorFlag(h, k, el.type === 'checkbox' ? el.checked : el.value); };
        });
    }
    function doorFlag(h, k, v) {
        if (!h || ED.mode !== 'world' || !editable()) return;
        var row = h.row, step = [], after = Core.clone(row);
        if (k === 'secret') {
            if (v) after.secret = true; else delete after.secret;
            step.push({ path: rowPath('doors', h.i), before: Core.clone(row), after: after });
            W.hqDoorPartners(ED.doc, ED.roomId, row.id).forEach(function (q) {
                if (q.room === ED.roomId && q.i === h.i) return;
                var d = ED.doc.rooms[q.room].doors[q.i], a2 = Core.clone(d); if (v) a2.secret = true; else delete a2.secret;
                step.push({ path: ['rooms', q.room, 'doors', q.i], before: Core.clone(d), after: a2 });
            });
            commit(step, v ? 'secret door' : 'not secret');
            return;
        }
        if (k === 'oneway') {
            var to = row.action && row.action.room, far = to && ED.doc.rooms[to]; if (!far) { toast('THAT DOOR LEADS OUTSIDE YOUR WORLD'); return; }
            if (v) {
                var ps = W.hqDoorPartners(ED.doc, ED.roomId, row.id).sort(function (a, b) { return a.room === b.room ? b.i - a.i : (a.room < b.room ? -1 : 1); });
                after.action = { room: to };
                step.push({ path: rowPath('doors', h.i), before: Core.clone(row), after: after });
                ps.forEach(function (q) { var d = ED.doc.rooms[q.room].doors[q.i]; step.push({ path: ['rooms', q.room, 'doors', q.i], before: Core.clone(d), after: undefined }); });
                commit(step, 'one way');
                toast('ONE WAY · you arrive at ' + String(far.label || to).toUpperCase() + '\'s spawn' + (ps.length ? ' · its door back went (UNDO brings it back)' : ''), 4000);
                return;
            }
            var backId = to === ED.roomId ? nextId(room()) : nextId(far);
            var P = W.hqDoorPair({ rooms: ED.doc.rooms }, { room: ED.roomId, x: 0, z: 0, face: 0 }, { room: to, door: null }, { leaf: row.leaf, way: row.way, back: true, ids: { a: row.id, b: backId } });
            if (!P || !P.back) return;
            after.action = P.mine.action;
            if (row.secret) P.back.secret = true;
            step.push({ path: rowPath('doors', h.i), before: Core.clone(row), after: after });
            step.push({ path: ['rooms', to, 'doors', farDoors(step, to, far)], before: undefined, after: P.back });
            commit(step, 'two way');
            toast('A DOOR BACK stands ' + W.HQ_PALETTE_RULES.returnAhead + ' m in front of ' + String(far.label || to).toUpperCase() + '\'s spawn', 4000);
            return;
        }
        var n = Math.max(0, Math.round(parseFloat(v) || 0));
        if (n) after[k] = n; else delete after[k];
        if ((+row[k] || 0) === n) return;
        rowReplace(h, after, k === 'minClearance' ? (n ? 'locked L' + n : 'unlocked') : n + ' keys');
    }

    /* ── LEADS TO (§8.2.4): the runtime's own door graph (hqWorldGraph) for his rooms — a node per room (his, coloured by zone; a
       built-in room it leads to, grey), an edge per pair of rooms: dashed = secret, an arrow = one way, red = a door that leads
       nowhere, L / K = locked. Click a room to go there. ── */
    var LEADS = { key: '', g: null };
    function leadsGraph() {
        var key = (ED.stepNo || 0) + ':' + ED.project;
        if (LEADS.key === key && LEADS.g) return LEADS.g;
        var R = DOOR_HQ.rooms || {}, mine = {}, nodes = {}, order = [];
        Object.keys(ED.doc.rooms).forEach(function (id) { mine[id] = 1; });
        var node = function (id) { if (!nodes[id]) { var r = R[id]; nodes[id] = { id: id, label: String((r && r.label) || id), mine: !!mine[id], zone: mine[id] ? zoneOf(id) : null, gone: !r }; order.push(id); } return nodes[id]; };
        Object.keys(ED.doc.rooms).sort(byRoomNo).forEach(node);
        var G = null; try { G = W.hqWorldGraph(); } catch (e) { console.warn('[editor] the door graph', e); }
        var bad = {}; (ED.doorBad || []).forEach(function (b) { bad[b.room + '|' + b.door] = b.why; });
        var pairs = {}, edges = [], seen = {};
        var edge = function (a, b, door) {
            var d = ((ED.doc.rooms[a] || {}).doors || []).filter(function (x) { return x && x.id === door; })[0] || {};
            var k = a < b ? a + '|' + b : b + '|' + a, P = pairs[k] || (pairs[k] = { a: a < b ? a : b, b: a < b ? b : a, ab: 0, ba: 0, secret: 0, n: 0, bad: 0, lock: '' });
            if (a === P.a) P.ab++; else P.ba++;
            P.n++; if (d.secret) P.secret++; if (bad[a + '|' + door] || !R[b]) P.bad++;
            var lk = (+d.minClearance ? 'L' + d.minClearance : '') + (+d.requiresKeys ? (d.minClearance ? ' ' : '') + d.requiresKeys + 'K' : ''); if (lk && !P.lock) P.lock = lk;
            seen[a + '|' + door] = 1;
        };
        (G ? G.edges : []).forEach(function (e) { if (!mine[e.from] || !e.door || !e.to) return; node(e.to); edge(e.from, e.to, e.door); });
        /* the doors the graph could not follow (their room is gone) */
        Object.keys(ED.doc.rooms).forEach(function (id) { (ED.doc.rooms[id].doors || []).forEach(function (d) { if (!d || !d.action || !d.action.room || seen[id + '|' + d.id]) return; node(d.action.room); edge(id, d.action.room, d.id); }); });
        Object.keys(pairs).forEach(function (k) { edges.push(pairs[k]); });
        /* the layout: a ring, zones together, then springs (deterministic) */
        var N = order.length, pos = {};
        order.sort(function (a, b) { var za = nodes[a].zone || (nodes[a].mine ? '~' : '~~'), zb = nodes[b].zone || (nodes[b].mine ? '~' : '~~'); return za < zb ? -1 : za > zb ? 1 : byRoomNo(a, b); });
        order.forEach(function (id, i) { var t = 2 * Math.PI * i / Math.max(1, N); pos[id] = { x: Math.cos(t) * 100, y: Math.sin(t) * 100 }; });
        for (var it = 0; it < 240 && N > 1; it++) {
            var F = {}; order.forEach(function (id) { F[id] = { x: -pos[id].x * 0.01, y: -pos[id].y * 0.01 }; });
            for (var i = 0; i < N; i++) for (var j = i + 1; j < N; j++) {
                var A = pos[order[i]], B = pos[order[j]], dx = A.x - B.x, dy = A.y - B.y, d2 = Math.max(25, dx * dx + dy * dy), f = 900 / d2, dl = Math.sqrt(d2);
                if (nodes[order[i]].zone && nodes[order[i]].zone === nodes[order[j]].zone) f -= dl * 0.004;   // a zone's rooms keep together
                F[order[i]].x += dx / dl * f; F[order[i]].y += dy / dl * f; F[order[j]].x -= dx / dl * f; F[order[j]].y -= dy / dl * f;
            }
            edges.forEach(function (e) { var A = pos[e.a], B = pos[e.b]; if (!A || !B) return; var dx = B.x - A.x, dy = B.y - A.y, dl = Math.max(1, Math.hypot(dx, dy)), f = (dl - 45) * 0.05; F[e.a].x += dx / dl * f; F[e.a].y += dy / dl * f; F[e.b].x -= dx / dl * f; F[e.b].y -= dy / dl * f; });
            var cool = 1 - it / 260;
            order.forEach(function (id) { var f = F[id], m = Math.hypot(f.x, f.y), lim = 8 * cool; if (m > lim) { f.x *= lim / m; f.y *= lim / m; } pos[id].x += f.x; pos[id].y += f.y; });
        }
        LEADS.key = key; LEADS.g = { nodes: nodes, order: order, edges: edges, pos: pos };
        return LEADS.g;
    }
    function leadsSvg(g, Wd, Hd, big) {
        var xs = g.order.map(function (id) { return g.pos[id].x; }), ys = g.order.map(function (id) { return g.pos[id].y; });
        var x0 = Math.min.apply(null, xs.concat([0])), x1 = Math.max.apply(null, xs.concat([0])), y0 = Math.min.apply(null, ys.concat([0])), y1 = Math.max.apply(null, ys.concat([0]));
        var pad = big ? 60 : 26, s = Math.min((Wd - 2 * pad) / Math.max(1, x1 - x0), (Hd - 2 * pad) / Math.max(1, y1 - y0), big ? 3 : 1.6);
        var P = function (id) { var p = g.pos[id]; return { x: pad + (p.x - x0) * s + ((Wd - 2 * pad) - (x1 - x0) * s) / 2, y: pad + (p.y - y0) * s + ((Hd - 2 * pad) - (y1 - y0) * s) / 2 }; };
        var fs = big ? 12 : 8, r = big ? 9 : 5, mid = big ? 'edArrB' : 'edArrS';
        var h = '<svg width="100%" viewBox="0 0 ' + Wd + ' ' + Hd + '" style="display:block;background:rgba(0,0,0,0.25);border-radius:4px"><defs><marker id="' + mid + '" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="' + (big ? 8 : 6) + '" markerHeight="' + (big ? 8 : 6) + '" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#d8e4f0"/></marker></defs>';
        g.edges.forEach(function (e) {
            var A = P(e.a), B = P(e.b), dx = B.x - A.x, dy = B.y - A.y, L = Math.max(1, Math.hypot(dx, dy)), ux = dx / L, uy = dy / L;
            var ax = A.x + ux * (r + 1), ay = A.y + uy * (r + 1), bx = B.x - ux * (r + 2), by = B.y - uy * (r + 2);
            var col = e.bad ? '#ff3344' : '#9fb4c8', one = !!(e.ab) !== !!(e.ba);
            h += '<line x1="' + ax.toFixed(1) + '" y1="' + ay.toFixed(1) + '" x2="' + bx.toFixed(1) + '" y2="' + by.toFixed(1) + '" stroke="' + col + '" stroke-width="' + (big ? 2 : 1.3) + '"' + (e.secret ? ' stroke-dasharray="' + (big ? '6 5' : '3 3') + '"' : '') +
                (one ? (e.ab ? ' marker-end="url(#' + mid + ')"' : ' marker-start="url(#' + mid + ')"') : '') + '><title>' + esc((g.nodes[e.a].label) + ' ⇄ ' + g.nodes[e.b].label + ' · ' + e.n + ' door' + (e.n > 1 ? 's' : '') + (e.secret ? ' · secret' : '') + (one ? ' · one way' : '') + (e.lock ? ' · locked ' + e.lock : '') + (e.bad ? ' · LEADS NOWHERE' : '')) + '</title></line>';
            if (e.lock) h += '<text x="' + ((ax + bx) / 2).toFixed(1) + '" y="' + ((ay + by) / 2 - 3).toFixed(1) + '" fill="#ffd84a" font-size="' + fs + '" text-anchor="middle">' + esc(e.lock) + '</text>';
        });
        g.order.forEach(function (id) {
            var n = g.nodes[id], p = P(id), fill = n.gone ? '#ff3344' : n.mine ? (n.zone ? zoneColor(n.zone) : '#d8e4f0') : '#5a6676', here = id === ED.roomId;
            h += '<g data-lnode="' + esc(id) + '" style="cursor:pointer"><circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + r + '" fill="' + fill + '" stroke="' + (here ? '#ffffff' : 'rgba(0,0,0,0.6)') + '" stroke-width="' + (here ? 2.5 : 1) + '"><title>' + esc(n.label + ' (' + id + ')' + (n.zone ? ' · ' + zoneLabel(n.zone) : '') + (n.gone ? ' · NOT THERE' : n.mine ? '' : ' · built-in')) + '</title></circle>' +
                '<text x="' + p.x.toFixed(1) + '" y="' + (p.y + r + fs + 1).toFixed(1) + '" fill="' + (n.mine ? '#d8e4f0' : '#8a96a8') + '" font-size="' + fs + '" text-anchor="middle">' + esc(n.gone ? 'NOWHERE' : (big ? n.label : n.label.slice(0, 14))) + '</text></g>';
        });
        return h + '</svg>';
    }
    function leadsLegend() {
        return '<div class="ed-note">A dot is a room (coloured by its zone; grey = a built-in room it leads to; white ring = here). A line is the doors between two rooms: dashed = secret, an arrow = one way, red = leads nowhere, L / K = locked. Click a room to go there.</div>';
    }
    function leadsHtml() {
        if (!ED.doc || ED.mode === 'prefab') return '<div class="ed-note">LEADS TO shows the rooms of your world.</div>';
        var g = leadsGraph(), mine = g.order.filter(function (id) { return g.nodes[id].mine; }).length, one = g.edges.filter(function (e) { return !!e.ab !== !!e.ba; }).length, sec = g.edges.filter(function (e) { return e.secret; }).length;
        var h = '<div class="ed-sub">LEADS TO · ' + mine + ' room' + (mine === 1 ? '' : 's') + ' · ' + g.edges.length + ' way' + (g.edges.length === 1 ? '' : 's') + (sec ? ' · ' + sec + ' secret' : '') + (one ? ' · ' + one + ' one way' : '') + '</div>';
        h += leadsSvg(g, 246, 246, false) + '<div class="ed-acts"><button class="ed-btn" data-lead="big">OPEN BIG</button></div>' + leadsLegend();
        var bad = ED.doorBad || [];
        if (bad.length) h += '<div class="ed-sub ed-warnt">' + bad.length + ' DOOR' + (bad.length > 1 ? 'S LEAD' : ' LEADS') + ' NOWHERE</div>' + bad.map(function (b) { return '<button class="ed-row" data-ldoor="' + esc(b.room + '|' + b.door) + '">' + esc(String((ED.doc.rooms[b.room] || {}).label || b.room) + ' · door ' + b.door) + '<span>' + esc(b.why === 'no door' ? 'its door there is gone' : 'its room is gone') + '</span></button>'; }).join('');
        return h;
    }
    function leadsGo(id) { if (!id || !DOOR_HQ.rooms[id]) { toast('THAT ROOM IS NOT THERE'); return; } saveCam(); enterRoom(id, ED.doc.rooms[id] ? 'world' : 'library'); }
    function leadsWire(L) {
        L.querySelectorAll('[data-lnode]').forEach(function (b) { b.onclick = function () { if ($('edModal') && $('edModal').contains(b)) modalClose(); leadsGo(b.getAttribute('data-lnode')); }; });
        L.querySelectorAll('[data-lead="big"]').forEach(function (b) { b.onclick = leadsBig; });
        L.querySelectorAll('[data-ldoor]').forEach(function (b) { b.onclick = function () { var v = b.getAttribute('data-ldoor').split('|'); leadsGo(v[0]); if (ED.roomId === v[0]) select('doors', v[1]); }; });
    }
    function leadsBig() {
        var g = leadsGraph();
        modalOpen('<div class="ed-hd">LEADS TO · ' + esc(String(ED.project || '').toUpperCase()) + '</div><div style="overflow:auto">' + leadsSvg(g, 960, 600, true) + '</div>' + leadsLegend() + '<div class="ed-acts"><button class="ed-btn" id="edCancel">CLOSE</button></div>');
        $('edCard').style.width = 'min(1000px, 94vw)';
        $('edCancel').onclick = modalClose;
        leadsWire($('edCard'));
    }

    /* ── THE SIGHT CHECK and THE FIELD (AUDIT SIGHT / FIELD; §8.2.5–6, data.js hqPlanSightCheck / hqPlanFieldSeats). An EXIT is a door
       out of the room's zone (every door when the room is in no zone). SIGHT: blue posts on the exits, a red line between two in a
       straight line of sight through open ground, orange when they open into the same room. FIELD (EXPLORATION_BATTLES_PLAN §7, was
       the 8×8 patch): green = a room with enough battle seats in one connected region (HQ_FIELD_RULES.fieldMinSeats), red = under it,
       amber = bigger than a fight's 24 × 24 (the fight takes a crop). Layout rooms only. ── */
    function exitsOf(rid) {
        var r = (ED.mode === 'world' && ED.doc.rooms[rid]) || room(), z = ED.mode === 'world' ? zoneOf(rid) : null;
        return ((r && r.doors) || []).filter(function (d) { return d && d.id != null && d.action && d.action.room && (!z || zoneOf(d.action.room) !== z); }).map(function (d) { return d.id; });
    }
    function auditLine(a, b, color) {
        if (!a || !b || !ED.group) return;
        var u = U(), ya = ground(a[0], a[1]) + 1.2, yb = ground(b[0], b[1]) + 1.2, geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([a[0] * u, ya * u, a[1] * u, b[0] * u, yb * u, b[1] * u]), 3));
        var L = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.95, depthTest: false, fog: false }));
        L.renderOrder = 14; L.frustumCulled = false; ED.group.add(L); ED.auditObjs.push(L);
    }
    function auditArea(x, z, w, d, rot, color, op, round) {
        if (!ED.group) return;
        var u = U(), geo = round ? new THREE.CircleGeometry(0.5, 32) : new THREE.PlaneGeometry(1, 1);
        geo.rotateX(-Math.PI / 2); geo.scale(w * u, 1, d * u);
        var M = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: op, depthWrite: false, fog: false, side: THREE.DoubleSide }));
        M.position.set(x * u, (ground(x, z) + 0.12) * u + 0.3, z * u); M.rotation.y = -(rot || 0) * Math.PI / 180; M.renderOrder = 13; M.frustumCulled = false;
        ED.group.add(M); ED.auditObjs.push(M);
    }
    function zoneAudit(r) {
        if (ED.audit.sight) {
            var ex = exitsOf(ED.roomId), res = null;
            try { res = W.hqPlanSightCheck(r, ex); } catch (e) { console.warn('[editor] the sight check', e); }
            ED.auditRes.sight = res ? { exits: ex.length, sight: res.sight.length, same: res.same.length } : { none: true };
            if (res) {
                auditMarks(ex.map(function (id) { var p = res.spots[id]; return p ? { x: p[0], z: p[1], y: ground(p[0], p[1]) } : null; }).filter(Boolean), 0x6fd3ff, true);
                res.sight.forEach(function (q) { auditLine(res.spots[q[0]], res.spots[q[1]], 0xff3344); });
                res.same.forEach(function (q) { auditLine(res.spots[q[0]], res.spots[q[1]], 0xff9f43); });
                ED.auditRes.sightDoors = res.sight.concat(res.same).map(function (q) { return q[0] + ' + ' + q[1] + (q[2] ? ' (one room)' : ''); });
            }
        }
        if (ED.audit.patch) {
            var pt = null; try { pt = W.hqPlanFieldSeats ? W.hqPlanFieldSeats(r) : null; } catch (e) { console.warn('[editor] the field check', e); }
            var nm = function (p) { return (p.label || ('room ' + p.no)) + ' (' + p.region + ' seats)'; };
            ED.auditRes.patch = pt ? { n: pt.length, bad: pt.filter(function (p) { return !p.ok; }).map(nm), big: pt.filter(function (p) { return p.ok && p.crop; }).map(function (p) { return (p.label || ('room ' + p.no)) + ' (' + p.tiles.w + '×' + p.tiles.d + ')'; }),
                                        min: (W.HQ_FIELD_RULES && W.HQ_FIELD_RULES.fieldMinSeats) || 48 } : { none: true };
            if (pt) pt.forEach(function (p) { auditArea(p.x, p.z, p.w, p.d, p.rot, !p.ok ? 0xff3344 : p.crop ? 0xff9f43 : 0x57f287, !p.ok ? 0.3 : 0.22, p.round); });
        }
    }
    function zoneAuditStatus() {
        var A = ED.auditRes, out = [];
        if (ED.audit.sight) { var s = A.sight; out.push(!s ? 'sight …' : s.none ? 'sight: no layout here' : (s.sight + s.same) ? '<b class="ed-warn" title="' + esc((A.sightDoors || []).join(' · ')) + '">SIGHT: ' + (s.sight ? s.sight + ' EXIT PAIR' + (s.sight > 1 ? 'S' : '') + ' IN VIEW' : '') + (s.sight && s.same ? ' · ' : '') + (s.same ? s.same + ' IN ONE ROOM' : '') + '</b>' : 'sight: ' + s.exits + ' exit' + (s.exits === 1 ? '' : 's') + ', none in view'); }
        if (ED.audit.patch) { var p = A.patch; out.push(!p ? 'field …' : p.none ? 'field: no layout here' : p.bad.length ? '<b class="ed-warn" title="' + esc(p.bad.join(' · ')) + '">' + p.bad.length + ' ROOM' + (p.bad.length > 1 ? 'S' : '') + ' UNDER ' + p.min + ' SEATS</b>' : 'field: every room (' + p.n + ')' + (p.big.length ? ' · <span title="' + esc(p.big.join(' · ')) + '">' + p.big.length + ' fight on a crop</span>' : '')); }
        return out.join(' · ');
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
        /* E5 */
        lhall: [['hallW', 'Hallway width (m)']],
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
        if (tab === 'layout') h += layoutHtml();   // E5
        return h;
    }
    function texSwatchStyle(key) { var u = key && texUrl(key); return u ? ' style="background-image:url(\'' + esc(u) + '\')"' : ''; }
    function paletteWire(L) {
        L.querySelectorAll('[data-draw]').forEach(function (b) { b.onclick = function () { var t = b.getAttribute('data-draw'); drawSet(t || null); if (t && DRAWS[t]) hotPush({ t: 'draw', tool: t, label: DRAWS[t].label }); }; });
        L.querySelectorAll('[data-o]').forEach(function (el) { el.onchange = function () { var k = el.getAttribute('data-o'); ED.opts[k] = el.type === 'number' ? (isFinite(parseFloat(el.value)) ? parseFloat(el.value) : ED.opts[k]) : el.value.trim(); saveOpts(); }; });
        L.querySelectorAll('[data-otex]').forEach(function (b) { b.onclick = function () { var k = b.getAttribute('data-otex'); texPick(ED.opts[k], function (v) { ED.opts[k] = v; saveOpts(); panels(); }); }; });
        groundWire(L);
        layoutWire(L);   // E5
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
    /* ══ THE SKY AND THE LIGHT (E6, EDITOR_PLAN §5.9): the SKY tab edits the open room's `shell` keys the runtime reads — the sky
       (`shell.sky`: day, night, clouds, stars, nebula, tint, fog, scenery, landmarks, lock, and `clock` = on the world clock), the post
       look (`shell.look` = a HQ_ROOM_LOOKS row, stored whole), the key light (`shell.rig`), the lamps (`shell.lights`, masts outdoors,
       fluorescents indoors), `shell.mood`, the indoor fog (`shell.fog`) and the air (`shell.atmos`). A sky needs an OUTDOOR room
       (`shell.open`). The sliders marked live move the view as they are dragged (the dome reads them every frame) and land as ONE undo
       step on the release; everything else rebuilds the room. The CLOCK previews an hour in a room on the world clock (the view only:
       the player's saved hour is not touched). ══════════════════════════════════════════════════════════════════════════════ */
    var SKY_SCENERY = ['none', 'cosmic', 'divine', 'infernal', 'ruins', 'pyramids', 'crystals', 'orbs', 'eyes', 'islands', 'city', 'space', 'dark', 'sea', 'wreckage', 'wonder', 'holosim'];
    var SKY_MARKS = ['mountain', 'tower', 'gate', 'dome', 'peak', 'castle', 'skycastle', 'stairway', 'waterspout', 'whale', 'eye'];
    var SKY_ATMOS = ['dust', 'embers', 'fireflies', 'snow', 'rain', 'spores', 'ash', 'motes'];
    var SKY_LIVE = { 'sky.day': 1, 'sky.clouds': 1, 'sky.stars': 1, 'sky.nebula': 1, 'sky.tintAmt': 1, 'sky.fog.amount': 1, 'sky.fog.top': 1, 'sky.fog.band': 1, 'sky.fog.density': 1 };
    var SKY_DEFAULT = { night: 0, day: 1, clouds: 0.3, stars: 0.3, nebula: 0.2, tint: 0x9fc4e8, tintAmt: 0.3, fog: { color: 0xb4c6d8, amount: 0.45, top: 0.04, band: 0.5, density: 0.004 }, scenery: 'none', density: 0 };
    var RIG_DEFAULT = { az: 300, el: 58, color: 0xfff1dc, intensity: 0.34 };
    function hexCss(v, d) { var n = isFinite(v) ? +v : d; return '#' + ('000000' + (n >>> 0).toString(16)).slice(-6); }
    function skyGet(S, path) { var o = S; for (var i = 0; i < path.length; i++) { if (o == null) return undefined; o = o[path[i]]; } return o; }
    function skySetIn(o, path, v) { for (var i = 0; i < path.length - 1; i++) { if (o[path[i]] == null || typeof o[path[i]] !== 'object') o[path[i]] = {}; o = o[path[i]]; } if (v === undefined) delete o[path[path.length - 1]]; else o[path[path.length - 1]] = v; }
    /* one shell key (its top: sky, rig, mood, fog, look, atmos, lights, open) before → after = ONE undo step */
    function shellPut(top, after, label, live) {
        if (!own()) return;
        var S = room() && room().shell; if (!S || !editable()) return;
        var before = (ED._skB && ED._skB.top === top) ? ED._skB.v : (S[top] === undefined ? undefined : Core.clone(S[top]));
        ED._skB = null;
        commit([{ path: basePath().concat(['shell', top]), before: before, after: after }], label, { noReload: !!live });
    }
    function skyCommit(key, v, live) {
        var S = room() && room().shell; if (!S) return;
        var path = key.split('.'), top = path[0];
        if (path.length === 1) { shellPut(top, v, key, live); return; }
        var cur = (ED._skB && ED._skB.top === top) ? ED._skB.v : S[top], after = (cur && typeof cur === 'object') ? Core.clone(cur) : {};
        skySetIn(after, path.slice(1), v);
        shellPut(top, after, key, live);
    }
    /* a live slider: the value goes straight onto the room the view draws (and its fog), the undo step lands on the release */
    function skyLive(key, v) {
        var r = room(), S = r && r.shell; if (!S) return;
        var path = key.split('.'), top = path[0];
        if (!ED._skB || ED._skB.top !== top) ED._skB = { top: top, v: S[top] === undefined ? undefined : Core.clone(S[top]) };
        if (S[top] == null || typeof S[top] !== 'object') S[top] = {};
        skySetIn(S[top], path.slice(1), v);
        var V = ED.view; if (V && V.room && V.room.shell && V.room.shell !== S) { if (!V.room.shell[top] || typeof V.room.shell[top] !== 'object') V.room.shell[top] = {}; skySetIn(V.room.shell[top], path.slice(1), v); }
        if (key === 'sky.fog.density' && V && V.scene && V.scene.fog && V.scene.fog.density != null) V.scene.fog.density = Math.max(0.00001, v) / U();
    }
    function lookKeyOf(S) {
        var L = W.HQ_ROOM_LOOKS || (typeof HQ_ROOM_LOOKS !== 'undefined' ? HQ_ROOM_LOOKS : {}), lk = S && S.look;
        if (!lk || typeof lk !== 'object') return '';
        for (var k in L) if (L[k] === lk || (L[k] && lk.name && L[k].name === lk.name)) return k;
        return '?';
    }
    function skyPresets() {
        var out = [];
        Object.keys(DOOR_HQ.rooms || {}).forEach(function (id) { var r = DOOR_HQ.rooms[id], S = r && r.shell; if (id.charAt(0) === '_' || !S || !S.open || !S.sky) return; out.push([id, (r.label || id) + (W.hqWorldDocIsOwn && W.hqWorldDocIsOwn(id) ? ' (yours)' : '')]); });
        out.sort(function (a, b) { return a[1] < b[1] ? -1 : 1; });
        return out;
    }
    function skyHtml() {
        var r = room(); if (!r) return '';
        if (ED.mode === 'prefab') return '<div class="ed-note">A prefab has no sky: the room you place it in has.</div>';
        var S = r.shell || {}, sky = S.sky || null, fg = (sky && sky.fog) || {}, h = '';
        var rng = function (label, key, min, max, step, val, tip) { var v = isFinite(val) ? +val : min; return '<label class="ed-f" title="' + esc(tip || '') + '"><span>' + esc(label) + (SKY_LIVE[key] ? '' : ' ·') + '</span><input type="range" data-sk="' + key + '" data-t="num" min="' + min + '" max="' + max + '" step="' + step + '" value="' + v + '" style="flex:1;min-width:0"><b class="ed-skv" style="width:44px;text-align:right">' + v + '</b></label>'; };
        var col = function (label, key, val, d) { return '<label class="ed-f"><span>' + esc(label) + ' ·</span><input type="color" data-sk="' + key + '" data-t="col" value="' + hexCss(val, d) + '"></label>'; };
        var sel = function (label, key, opts, val) { return '<label class="ed-f"><span>' + esc(label) + ' ·</span><select data-sk="' + key + '" data-t="str">' + opts.map(function (o) { var ov = Array.isArray(o) ? o[0] : o, ol = Array.isArray(o) ? o[1] : o; return '<option value="' + esc(ov) + '"' + (String(ov) === String(val) ? ' selected' : '') + '>' + esc(ol) + '</option>'; }).join('') + '</select></label>'; };
        var chk = function (label, key, val, tip) { return '<label class="ed-f" title="' + esc(tip || '') + '"><span>' + esc(label) + ' ·</span><input type="checkbox" data-sk="' + key + '" data-t="bool"' + (val ? ' checked' : '') + '></label>'; };
        h += '<div class="ed-palb"><button class="ed-btn' + (!ED.draw ? ' on' : '') + '" data-draw="" title="Pick and move (V)">SELECT</button><button class="ed-btn' + (ED.draw && ED.draw.tool === 'lamp' ? ' on' : '') + '" data-draw="lamp" title="' + esc(DRAWS.lamp.tip) + '">+ LAMP</button></div>';
        h += '<div class="ed-note">Sliders without a dot move the view as you drag. The ones with a dot (·) rebuild the room when you let go.</div>';
        /* OUTDOOR / INDOOR */
        if (!S.open) {
            h += '<div class="ed-sub">AN INDOOR ROOM</div><div class="ed-note">It has a ceiling, so it has no sky. Its light is below. MAKE IT OUTDOOR takes the ceiling off and gives it a day sky.</div><div class="ed-acts"><button class="ed-btn" data-ska="outdoor">MAKE IT OUTDOOR</button></div>';
            h += '<div class="ed-sub">THE ROOM\'S FOG</div><div class="ed-form">' + col('colour', 'fog.color', (S.fog || {}).color, 0x0d0e12) + rng('density', 'fog.density', 0, 0.06, 0.001, (S.fog || {}).density != null ? S.fog.density : 0.012, 'per metre: 0.012 is the default haze, 0.05 is thick') + '</div>';
        } else {
            h += '<div class="ed-sub">THE SKY</div>';
            var pr = skyPresets();
            h += '<div class="ed-form"><label class="ed-f"><span>take from</span><select data-ska="preset"><option value="">a room\'s sky…</option>' + pr.map(function (p) { return '<option value="' + esc(p[0]) + '">' + esc(p[1]) + '</option>'; }).join('') + '</select></label></div>';
            if (!sky) h += '<div class="ed-note">No sky yet.</div><div class="ed-acts"><button class="ed-btn" data-ska="daysky">A DAY SKY</button><button class="ed-btn" data-ska="nightsky">A NIGHT SKY</button></div>';
            else {
                h += '<div class="ed-form">' +
                    rng('day', 'sky.day', 0, 1, 0.05, sky.day || 0, 'the blue day dome and the sun (0 = deep space)') +
                    rng('night', 'sky.night', 0, 1, 1, sky.night ? 1 : 0, 'the night lights: moonlight, lamps on') +
                    rng('clouds', 'sky.clouds', 0, 1, 0.05, sky.clouds || 0) +
                    rng('stars', 'sky.stars', 0, 1.5, 0.05, sky.stars != null ? sky.stars : 1) +
                    rng('nebula', 'sky.nebula', 0, 2, 0.05, sky.nebula != null ? sky.nebula : 1) +
                    col('tint', 'sky.tint', sky.tint, 0x000000) + rng('tint amount', 'sky.tintAmt', 0, 1, 0.02, sky.tintAmt || 0) +
                    '</div><div class="ed-sub">THE FOG</div><div class="ed-form">' +
                    col('colour', 'sky.fog.color', fg.color, 0x0d0e12) +
                    rng('density', 'sky.fog.density', 0, 0.06, 0.0005, fg.density || 0, 'per metre: 0.0003 is the open land, 0.03 the woods, 0.05 the abyss') +
                    rng('horizon', 'sky.fog.amount', 0, 1, 0.05, fg.amount || 0, 'the haze on the sky at the horizon') +
                    rng('haze top', 'sky.fog.top', 0, 1, 0.02, fg.top || 0) + rng('haze band', 'sky.fog.band', 0, 1, 0.05, fg.band != null ? fg.band : 0.5) +
                    '</div><div class="ed-sub">WHAT FLOATS IN IT</div><div class="ed-form">' +
                    sel('scenery', 'sky.scenery', SKY_SCENERY, sky.scenery || 'cosmic') +
                    rng('how many', 'sky.density', 0, 1.5, 0.05, sky.density != null ? sky.density : 1) +
                    chk('floating doors', 'sky.doors', sky.doors !== false, 'the three lone doors in the sky') + '</div>';
                /* the landmarks */
                var lm = sky.landmarks || [];
                h += '<div class="ed-sub">LANDMARKS ON THE HORIZON</div>';
                lm.forEach(function (m, i) {
                    h += '<div class="ed-form ed-skm" data-lmi="' + i + '"><label class="ed-f"><span>' + (i + 1) + '</span><select data-lm="kind">' + SKY_MARKS.map(function (k) { return '<option' + (k === m.kind ? ' selected' : '') + '>' + k + '</option>'; }).join('') + '</select><button class="ed-btn ed-danger" data-lmdel="' + i + '" title="Take it away">✕</button></label>' +
                        [['deg', 'bearing °', m.deg || 0, 5], ['dist', 'distance', m.dist != null ? m.dist : 0.9, 0.05], ['y', 'height', m.y != null ? m.y : -0.03, 0.01], ['s', 'size', m.s || 1, 0.1]].map(function (f) { return '<label class="ed-f"><span>' + f[1] + '</span><input type="number" step="' + f[3] + '" data-lm="' + f[0] + '" value="' + f[2] + '"></label>'; }).join('') + '</div>';
                });
                h += '<div class="ed-acts"><button class="ed-btn" data-ska="addmark" title="On the horizon where you are looking">+ LANDMARK</button></div>';
                /* the clock */
                var C = null; try { C = W.hqRoomClock ? W.hqRoomClock(ED.roomId) : null; } catch (e) {}
                h += '<div class="ed-sub">THE CLOCK</div><div class="ed-form">' + chk('world clock', 'sky.clock', sky.clock === true, 'The room\'s light follows the game\'s hour: dawn, day, dusk, night') +
                    sel('pinned hour', 'sky.lock', [['', 'none (the clock runs)'], ['true', 'its own light']].concat(Array.apply(null, Array(24)).map(function (_, k) { return [String(k), k + ':00']; })), sky.lock == null || sky.lock === false ? '' : String(sky.lock)) + '</div>';
                if (C && !C.locked) h += '<div class="ed-form"><label class="ed-f"><span>preview</span><input type="range" id="edClockH" min="0" max="24" step="0.25" value="' + (ED.clockH != null ? ED.clockH : 12) + '" style="flex:1;min-width:0"><b id="edClockV" style="width:44px;text-align:right">' + (ED.clockH != null ? clockTxt(ED.clockH) : 'live') + '</b></label></div><div class="ed-acts"><button class="ed-btn' + (ED.clockH == null ? ' on' : '') + '" data-ska="clocklive">THE GAME\'S HOUR</button></div><div class="ed-note">Drag PREVIEW to see any hour here (the view only).</div>';
                else h += '<div class="ed-note">' + (C && C.locked ? 'Pinned: the light stays at its hour (the sun and the moon still move on the dome).' : 'Its own light: the sky stays as set here. Tick WORLD CLOCK to put it on the game\'s hour.') + '</div>';
            }
            h += '<div class="ed-acts"><button class="ed-btn" data-ska="indoor" title="A ceiling over it (no sky)">MAKE IT INDOOR</button></div>';
        }
        /* the look */
        var LK = W.HQ_ROOM_LOOKS || {}, lkey = lookKeyOf(S);
        h += '<div class="ed-sub">THE LOOK (the picture\'s grade)</div><div class="ed-form">' + sel('look', 'look', [['', 'none']].concat(lkey === '?' ? [['?', 'its own']] : []).concat(Object.keys(LK)), lkey) + '</div>';
        /* the light */
        var rig = S.rig || null, mood = S.mood || {};
        h += '<div class="ed-sub">THE LIGHT</div><div class="ed-form">' + chk('own key light', 'rigOn', !!rig, 'The main light\'s direction, colour and strength (else the game\'s)');
        if (rig) h += rng('from °', 'rig.az', 0, 360, 5, rig.az != null ? rig.az : RIG_DEFAULT.az, 'where it comes from, clockwise from north') + rng('height °', 'rig.el', 5, 89, 1, rig.el != null ? rig.el : RIG_DEFAULT.el) + col('colour', 'rig.color', rig.color, RIG_DEFAULT.color) + rng('strength', 'rig.intensity', 0, 2, 0.02, rig.intensity != null ? rig.intensity : RIG_DEFAULT.intensity);
        h += col('lamp colour', 'mood.light', mood.light, S.open ? 0xfff0d0 : 0xe6eeff);
        if (!S.open) h += rng('brightness', 'mood.ambient', 0.5, 2, 0.05, mood.ambient != null ? mood.ambient : 1, 'the whole room lighter or darker');
        var at = S.atmos === false ? 'none' : (S.atmos && S.atmos.kind) || '';
        h += sel('in the air', 'atmos', [['', 'the game\'s pick'], ['none', 'nothing']].concat(SKY_ATMOS), at) + '</div>';
        var lamps = S.lights || [];
        h += '<div class="ed-note">LAMPS (' + lamps.length + '): ' + (S.open ? 'lamp masts, lit at night' : 'ceiling fluorescents') + '. + LAMP, then click where one goes.</div>';
        if (lamps.length) h += '<div class="ed-tiles">' + lamps.map(function (L, i) { return '<button class="ed-btn" data-lampdel="' + i + '" title="Take this lamp away">' + (+L.x).toFixed(1) + ', ' + (+L.z).toFixed(1) + ' ✕</button>'; }).join('') + '</div>';
        return h;
    }
    function clockTxt(h) { var hh = Math.floor(h) % 24, mm = Math.round((h - Math.floor(h)) * 60); return (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm; }
    function clockPreview(h) {
        if (h == null) { if (ED._clkFn) { window._hqClockHour = ED._clkFn; ED._clkFn = null; } ED.clockH = null; }
        else { if (!ED._clkFn) ED._clkFn = window._hqClockHour || function () { return (typeof HQ_WORLD_CLOCK !== 'undefined') ? HQ_WORLD_CLOCK.start : 12; }; ED.clockH = h; window._hqClockHour = function () { return ED.clockH; }; }
        try { ThreeRenderer.hq.clockSnap(); } catch (e) {}
    }
    function skyWire(L) {
        L.querySelectorAll('[data-sk]').forEach(function (el) {
            var key = el.getAttribute('data-sk'), t = el.getAttribute('data-t');
            var val = function () { if (t === 'bool') return !!el.checked; if (t === 'col') return parseInt(el.value.slice(1), 16); if (t === 'num') return parseFloat(el.value); return el.value; };
            if (t === 'num') el.oninput = function () { var v = val(), b = el.parentNode.querySelector('.ed-skv'); if (b) b.textContent = v; if (SKY_LIVE[key]) skyLive(key, v); };
            el.onchange = function () {
                var v = val();
                if (key === 'rigOn') { shellPut('rig', v ? Core.clone(RIG_DEFAULT) : undefined, 'key light'); return; }
                if (key === 'look') { if (v === '?') return; shellPut('look', v ? Core.clone(W.HQ_ROOM_LOOKS[v]) : undefined, 'look'); return; }
                if (key === 'atmos') { shellPut('atmos', v === '' ? undefined : v === 'none' ? false : { kind: v }, 'the air'); return; }
                if (key === 'sky.lock') v = v === '' ? undefined : v === 'true' ? true : +v;
                if (key === 'sky.clock') v = v ? true : undefined;
                if (key === 'sky.night') v = v ? 1 : 0;
                if (key === 'sky.doors') v = v ? undefined : false;
                skyCommit(key, v, !!SKY_LIVE[key]);
            };
        });
        L.querySelectorAll('[data-ska]').forEach(function (el) {
            var a = el.getAttribute('data-ska'), S = room() && room().shell; if (!S) return;
            if (a === 'preset') { el.onchange = function () { var src = DOOR_HQ.rooms[el.value]; if (!src || !src.shell || !src.shell.sky) return; var sk = Core.clone(src.shell.sky); delete sk.landmarks; delete sk.lock; if (sk.fog) sk.fog = Core.clone(sk.fog); var step = [{ path: basePath().concat(['shell', 'sky']), before: S.sky === undefined ? undefined : Core.clone(S.sky), after: sk }]; if (src.shell.look && typeof src.shell.look === 'object') step.push({ path: basePath().concat(['shell', 'look']), before: S.look === undefined ? undefined : Core.clone(S.look), after: Core.clone(src.shell.look) }); commit(step, 'sky from ' + (src.label || el.value)); toast('THE SKY OF ' + String(src.label || el.value).toUpperCase(), 1500); }; return; }
            el.onclick = function () {
                if (a === 'daysky') shellPut('sky', Core.clone(SKY_DEFAULT), 'a day sky');
                else if (a === 'nightsky') shellPut('sky', { night: 1, day: 0, clouds: 0.1, stars: 1, nebula: 0.6, tint: 0x0a1428, tintAmt: 0.4, fog: { color: 0x060a14, amount: 0.5, top: 0.04, band: 0.5, density: 0.006 }, scenery: 'none', density: 0 }, 'a night sky');
                else if (a === 'outdoor') commit([{ path: basePath().concat(['shell', 'open']), before: S.open, after: true }].concat(S.sky ? [] : [{ path: basePath().concat(['shell', 'sky']), before: undefined, after: Core.clone(SKY_DEFAULT) }]), 'outdoor');
                else if (a === 'indoor') commit([{ path: basePath().concat(['shell', 'open']), before: S.open, after: false }], 'indoor');
                else if (a === 'addmark') { var lm = (S.sky.landmarks || []).slice(); lm.push({ kind: 'mountain', deg: Math.round(((ED.cam.yaw * 180 / Math.PI) % 360 + 360) % 360), dist: 0.9, y: -0.03, s: 1 }); skyCommit('sky.landmarks', lm); }
                else if (a === 'clocklive') { clockPreview(null); panels(); }
            };
        });
        L.querySelectorAll('[data-lmi]').forEach(function (box) {
            var i = +box.getAttribute('data-lmi');
            box.querySelectorAll('[data-lm]').forEach(function (el) { el.onchange = function () { var S = room().shell, lm = Core.clone(S.sky.landmarks || []); if (!lm[i]) return; var k = el.getAttribute('data-lm'), v = k === 'kind' ? el.value : parseFloat(el.value); if (k !== 'kind' && !isFinite(v)) { toast('NOT A NUMBER'); return; } lm[i][k] = v; skyCommit('sky.landmarks', lm); }; });
        });
        L.querySelectorAll('[data-lmdel]').forEach(function (b) { b.onclick = function () { var S = room().shell, lm = Core.clone(S.sky.landmarks || []); lm.splice(+b.getAttribute('data-lmdel'), 1); skyCommit('sky.landmarks', lm.length ? lm : undefined); }; });
        L.querySelectorAll('[data-lampdel]').forEach(function (b) { b.onclick = function () { var S = room().shell, ls = Core.clone(S.lights || []); ls.splice(+b.getAttribute('data-lampdel'), 1); shellPut('lights', ls.length ? ls : undefined, 'lamp away'); }; });
        var ck = $('edClockH'); if (ck) ck.oninput = function () { var v = parseFloat(ck.value); clockPreview(v); var b = $('edClockV'); if (b) b.textContent = clockTxt(v); };
    }
    function lampAt(c) {
        if (!own()) return;
        var r = room(), S = r && r.shell; if (!S || !c || !editable()) return;
        var sn = Math.max(0.25, ED.snap || 0), ls = Core.clone(S.lights || []);
        ls.push({ x: Core.snap(c.x, sn), z: Core.snap(c.z, sn) });
        shellPut('lights', ls, 'lamp');
    }

    var PAL_TABS = [['build', 'BUILD'], ['layout', 'LAYOUT'], ['ground', 'GROUND'], ['models', 'MODELS'], ['people', 'PEOPLE'], ['trees', 'TREES'], ['doors', 'DOORS'], ['lights', 'LIGHTS'], ['sky', 'SKY'], ['markers', 'MARKERS'], ['textures', 'TEXTURES'], ['kits', 'KITS'], ['leads', 'LEADS TO']];   // E7: LEADS TO
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
        if (!editable() && ED.mode !== 'library') { B.innerHTML = ''; return; }
        var tab = ED.opts.tab || 'build';
        var h = '<div class="ed-sec ed-pal"><div class="ed-tabs">' + PAL_TABS.map(function (t) { return '<button class="ed-tab' + (tab === t[0] ? ' on' : '') + '" data-tab="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>';
        if (tab === 'build' || tab === 'ground' || tab === 'layout') h += buildHtml(tab);
        else if (tab === 'sky') h += skyHtml();   // E6
        else if (tab === 'leads') h += leadsHtml();   // E7
        else h += sizeStrip(tab) + '<input type="text" class="ed-search ed-palq" id="edPalQ" placeholder="search ' + tab + '…" value="' + esc(ED.palQ[tab] || '') + '"><div class="ed-palbody" id="edPalBody"></div>' + palHint(tab);
        h += '</div>';
        /* the same palette again (every edit and every re-enter calls panels()) keeps its elements: a click that lands while the
           room reloads is not lost to a rebuilt button */
        if (B._h === h && B.firstChild) { if (tab === 'build' || tab === 'ground' || tab === 'layout') { paletteWire(B); return; } if (tab === 'sky' || tab === 'leads') return; palBody(); return; }
        B._h = h; B.innerHTML = h;
        B.querySelectorAll('[data-psz]').forEach(function (b) { b.onclick = function () { var v = b.getAttribute('data-psz').split(':'); if (v[0] === 'vary') ED.opts.treeVary = !ED.opts.treeVary; else ED.opts[v[0]] = +v[1]; saveOpts(); palette(); }; });
        B.querySelectorAll('[data-tab]').forEach(function (b) { b.onclick = function () { ED.opts.tab = b.getAttribute('data-tab'); saveOpts(); palette(); }; });
        if (tab === 'build' || tab === 'ground' || tab === 'layout') { paletteWire(B); return; }
        if (tab === 'sky') { paletteWire(B); skyWire(B); return; }   // E6
        if (tab === 'leads') { leadsWire(B); return; }   // E7
        $('edPalQ').oninput = function () { ED.palQ[tab] = this.value; palBody(); };
        $('edPalQ').onkeydown = function (e) { if (e.key === 'Escape') { this.value = ''; ED.palQ[tab] = ''; this.blur(); palBody(); } };
        palBody();
    }
    /* E6: the size the next tree / model goes down at (mondo: "make sure I can place different sized trees") */
    var TREE_SIZES = [[0, 'GAME'], [3, 'SMALL 3 m'], [5, 'MEDIUM 5 m'], [8, 'LARGE 8 m'], [12, 'HUGE 12 m'], [18, 'GIANT 18 m']], PROP_XS = [0.5, 0.75, 1, 1.5, 2, 3];
    function sizeStrip(tab) {
        var O = ED.opts;
        if (tab === 'trees') return '<div class="ed-sub">TREE SIZE</div><div class="ed-palb ed-wrap">' + TREE_SIZES.map(function (t) { return '<button class="ed-btn' + ((+O.treeSize || 0) === t[0] ? ' on' : '') + '" data-psz="treeSize:' + t[0] + '" title="' + (t[0] ? 'Trees go down about ' + t[0] + ' m tall' : 'The game\'s own size (about 5 m)') + '">' + t[1] + '</button>'; }).join('') +
            '<button class="ed-btn' + (O.treeVary ? ' on' : '') + '" data-psz="vary" title="Each tree a little taller or shorter (±20 %)">VARY</button></div><div class="ed-note">A placed tree is picked: - / = size it, R turns it, drag moves it.</div>';
        if (tab === 'models') return '<div class="ed-sub">MODEL SIZE</div><div class="ed-palb ed-wrap">' + PROP_XS.map(function (x) { return '<button class="ed-btn' + ((+O.propX || 1) === x ? ' on' : '') + '" data-psz="propX:' + x + '">×' + x + '</button>'; }).join('') + '</div>';
        return '';
    }
    function palHint(tab) {
        var t = { models: 'Click a tile, then click on the ground (again for more copies). It faces you. What you placed is picked: R turns it 45°, - / = size it, drag it to move it. ESC stops placing.',
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
        if (!own()) return;
        var D = ED.draw;
        if (D && ((D.entry && D.entry.id === e.id) || (D.key && e.tex === D.key))) { drawSet(null); return; }   // the armed tile again = stop
        if (e.tex) { drawSet('paint'); ED.draw.key = e.tex; hotPush({ t: 'pal', id: e.id, label: e.label }); toast('PAINT ' + e.tex + ' · click a face (a wall\'s side, a floor, a block) · ESC stops', 3500); palMark(); return; }
        if (e.kit) { var F = W.HQ_KIT_FORMS[e.kit]; placeRow({ k: 'kit', fn: e.kit, args: Core.clone(F.args), yaw: 0 }, F.label); if (ED.draw) { ED.draw.entry0 = e; hotPush({ t: 'pal', id: e.id, label: e.label }); } return; }
        if (e.pf) { placeRow({ k: 'prefab', pf: e.pf, yaw: 0 }, e.label); if (ED.draw) { ED.draw.entry0 = e; hotPush({ t: 'pal', id: e.id, label: e.label }); } return; }
        if (ED.mode === 'prefab' && e.list !== 'terrain.features' && e.list !== 'props') { toast('A PREFAB HOLDS SHAPES AND PROPS ONLY'); return; }
        if (e.list === 'doors') { drawSet('doorway'); ED.draw.entry = e; hotPush({ t: 'pal', id: e.id, label: e.label }); toast('DOOR · ' + e.label + ' · click a wall you drew, or the ground · ESC cancels', 4000); palMark(); return; }
        drawSet('place'); ED.draw.entry = e; ED.draw.repeat = e.list !== 'spawn';
        if (e.list !== 'spawn') hotPush({ t: 'pal', id: e.id, label: e.label });
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
        var row = W.hqPaletteRow(e, x, z, faceEye()), O = ED.opts;
        /* E6: the size it goes down at (the TREES tab: SIZE and VARY; MODELS: SIZE ×) */
        if (row.k === 'tree' || row.k === 'grove') {
            var th = (+O.treeSize || 0) ? +O.treeSize / treeTile() : (row.k === 'tree' ? treeDefH(row) : 0);   // tiles
            if (th) { if (O.treeVary && row.k === 'tree') th *= 0.8 + Math.random() * 0.4; row.h = Math.round(th * 100) / 100; if (row.k === 'tree' && +O.treeSize) row.r = Math.round(Math.max(0.25, Math.min(1.6, 0.38 * th / 2.9)) * 100) / 100; }
        } else if (e.list === 'props' && +O.propX && +O.propX !== 1) row = sizeRow({ list: 'props', row: row }, +O.propX) || row;
        /* the thing just placed is picked (R turns it, - / = size it, drag moves it) while the tile stays armed for more */
        addRow(e.list, row, 'add ' + e.label);
        if (!D.repeat) drawSet(null);
    }
    /* the ghost at the cursor while placing: the thing's size (the catalogue's foot / h / span; a person, a tree, a door) */
    function placeShow(c) {
        var D = ED.draw; if (!D || !c) { drawPreview(null); return; }
        var e = D.entry, g = c.y || ground(c.x, c.z), w = 0.8, d = 0.8, h = 1.2;
        if (D.tool === 'doorway') { w = 1.2; d = 0.3; h = 2.2; }
        else if (e && e.list === 'props') { var cat = DOOR_HQ.catalogue[e.row.key] || {}, px = +ED.opts.propX || 1; w = d = Math.max(0.3, (cat.foot ? cat.foot * 2 : (cat.span || 0.8)) * px); h = (cat.h || (cat.span ? Math.min(cat.span, 3) : 1)) * px; }
        else if (e && (e.list === 'npcSpots' || e.list === 'agents' || e.list === 'onlineSpots')) { w = d = 0.6; h = 1.8; }
        else if (e && e.row && e.row.k === 'tree') { h = +ED.opts.treeSize || treeDefH(e.row) * treeTile(); w = d = Math.max(1.2, h * 0.3); }
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
        own();
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
        ADD: function () { return [['Prefab…', addPrefab], ['Kit (the game\'s builders)…', addKit], ['Prop (the catalogue)…', addProp], ['Door…  (click a wall or the ground)', function () { own(); if (!editable() || ED.mode !== 'world') { toast('DOORS GO IN ROOMS OF YOUR WORLD'); return; } drawSet('doorway'); }], null].concat(Core.KINDS.map(function (K) { return [K.label, function () { addShape(K.id); }]; })); },   // the draw tools live on the BUILD palette
        ROOM: [['New room (flat, empty)…', newRoom], ['Duplicate this room', duplicateRoom], ['Delete this room', deleteRoom], ['The world starts here', setStart], ['This room as a prefab', roomToPrefab], null, ['New prefab (empty)', newPrefab], null, ['The library (built-in rooms)…', library], ['Copy this library room into the world', copyIntoWorld]],
        VIEW: [['Grid  (G)', function () { ED.grid = !ED.grid; if (ED.gridObj) ED.gridObj.visible = ED.grid; }], ['Frame the selection  (F)', frameSel], ['To the spawn  (Home)', camHome], ['Reload the room', function () { enterRoom(ED.roomId, ED.mode, { keepCam: true }); }], null,
               ['The level band on / off  (L)', function () { bandSet({ on: !ED.band.on }); }], ['The level band up a floor  (Shift L)', function () { bandStep(1); }], ['The level band down a floor', function () { bandStep(-1); }], null,
               ['Audit: invisible walls', function () { auditToggle('walls'); }], ['Audit: pockets (ground nobody reaches)', function () { auditToggle('pockets'); }], ['Audit: the fight field at the cursor', function () { auditToggle('fight'); }], ['Audit: exits in sight of each other', function () { auditToggle('sight'); }], ['Audit: the battle seats in each room', function () { auditToggle('patch'); }]],
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
            '<div class="ed-left" id="edLeft"><div id="edPalBox"></div><div id="edOutl"></div></div><div class="ed-right" id="edRight"></div>' +
            '<div class="ed-status" id="edStatus"></div><div class="ed-menu" id="edMenu" style="display:none"></div>' +
            '<div class="ed-modal" id="edModal" style="display:none"><div class="ed-card" id="edCard"></div></div>' +
            '<div class="ed-toast" id="edToast" style="display:none"></div><div class="ed-playtag" id="edPlayTag">PLAY HERE · ESC back to the editor</div>' +
            '<div class="ed-cross" id="edCross"></div><div class="ed-hint" id="edHint"></div><div class="ed-hot" id="edHot"></div>';
        document.body.appendChild(root);
        var menus = $('edMenus');
        Object.keys(MENUS).forEach(function (name) {
            var b = document.createElement('button'); b.className = 'ed-btn ed-menubtn'; b.textContent = name; b.onclick = function (e) { e.stopPropagation(); menuOpen(name, b); }; menus.appendChild(b);
        });
        $('edPlay').onclick = playHere; $('edHelp').onclick = help; $('edClose').onclick = function () { close(); };
        document.addEventListener('mousedown', function (e) { var m = $('edMenu'); if (m && m.style.display !== 'none' && !m.contains(e.target)) m.style.display = 'none'; }, true);
    }
    function menuOpen(name, btn) {
        if (ED.look) lookSet(false);
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
        t.innerHTML = ['translate', 'rotate', 'scale'].map(function (m) { return '<button class="ed-btn' + (ED.tool === m ? ' on' : '') + '" data-tool="' + m + '" title="' + { translate: 'MOVE · or drag the thing itself', rotate: 'TURN · R turns 45°, SHIFT R back', scale: 'SIZE (T) · - / = size the pick' }[m] + '">' + { translate: 'MOVE', rotate: 'TURN', scale: 'SIZE' }[m] + '</button>'; }).join('') +
            '<label class="ed-lab">SNAP <select id="edSnap">' + snaps.map(function (s) { return '<option value="' + s + '"' + (s === ED.snap ? ' selected' : '') + '>' + (s ? s + ' m' : 'off') + '</option>'; }).join('') + '</select></label>' +
            '<label class="ed-lab"><select id="edRSnap">' + rs.map(function (s) { return '<option value="' + s + '"' + (s === ED.rotSnap ? ' selected' : '') + '>' + (s ? s + '°' : 'free') + '</option>'; }).join('') + '</select></label>' +
            /* E6: the roofs */
            '<button class="ed-btn' + (ED.roof.off ? ' on' : '') + '" id="edRoof" title="HIDE THE ROOFS AND CEILINGS (C): see inside a room; everything higher than the number (metres over the floor) is cut away in the view. Nothing in the room changes">' + (ED.roof.off ? 'ROOFS HIDDEN' : 'HIDE ROOFS') + '</button>' +
            (ED.roof.off ? '<input type="number" step="0.5" min="0.5" id="edRoofH" value="' + ED.roof.h + '" style="width:48px" title="the cut: metres over the floor">' : '') +
            /* E3: the level band and the audits */
            '<label class="ed-lab" title="THE LEVEL BAND (L): only what overlaps it picks; everything above its top is cut away in the view"><input type="checkbox" id="edBand"' + (ED.band.on ? ' checked' : '') + '>LEVEL</label>' +
            '<input type="number" step="0.5" id="edBandY0" value="' + ED.band.y0 + '" style="width:52px" title="the band\'s bottom (m)"><input type="number" step="0.5" id="edBandY1" value="' + ED.band.y1 + '" style="width:52px" title="the band\'s top (m)">' +
            '<button class="ed-btn" id="edBandDn" title="The band down a floor">▼</button><button class="ed-btn" id="edBandUp" title="The band up a floor (Shift L)">▲</button>' +
            '<span class="ed-lab">AUDIT</span>' + [['walls', 'WALLS', 'Invisible walls: a step the walker is refused with nothing drawn there (red posts)'], ['pockets', 'POCKETS', 'Ground nobody reaches from the spawn or a door (yellow)'], ['fight', 'FIGHT', 'The battle field a fight at the cursor would take: the whole room, or its 24 × 24 crop (yellow = cover)'], ['sight', 'SIGHT', 'Exits of a layout room in a straight line of sight of each other, or in one room (an exit = a door out of the zone)'], ['patch', 'FIELD', 'Each room of the layout: enough battle seats in one region (green), too few (red), bigger than a 24 × 24 fight (amber)']].map(function (a) { return '<button class="ed-btn' + (ED.audit[a[0]] ? ' on' : '') + '" data-aud="' + a[0] + '" title="' + a[2] + '">' + a[1] + '</button>'; }).join('') +
            (ED.mode === 'library' ? '<button class="ed-btn ed-copy" id="edCopy" title="Make your own copy of this game room now (your first change does it anyway)">MAKE MY COPY</button>' : '');
        t.querySelectorAll('[data-tool]').forEach(function (b) { b.onclick = function () { tcMode(b.getAttribute('data-tool')); }; });
        $('edSnap').onchange = function () { ED.snap = +this.value; tcMode(ED.tool); };
        $('edRSnap').onchange = function () { ED.rotSnap = +this.value; tcMode(ED.tool); };
        if ($('edCopy')) $('edCopy').onclick = function () { own(); };
        $('edRoof').onclick = function () { roofSet({ off: !ED.roof.off }); };
        if ($('edRoofH')) $('edRoofH').onchange = function () { var v = parseFloat(this.value); if (isFinite(v)) roofSet({ h: v }); };
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
        /* E7: the rooms under their zones, then the rooms in no zone */
        var roomBtn = function (id, zid) {
            var r = ED.doc.rooms[id];
            return '<button class="ed-row' + (ED.mode === 'world' && id === ED.roomId ? ' on' : '') + '" data-room="' + esc(id) + '"' + (zid ? ' style="border-left:3px solid ' + zoneColor(zid) + '"' : '') + '>' + esc(r.label || id) + (ED.doc.start && ED.doc.start.room === id ? ' <i>START</i>' : '') + (r.site ? ' <i>' + esc(siteLabel(r.site)) + '</i>' : '') + '<span>' + esc(id) + ' · ' + roomSize(r) + '</span></button>';
        };
        var zs = zoneIds(), inZ = {};
        zs.forEach(function (zid) {
            var Z = ED.doc.zones[zid], zr = Z.rooms.filter(function (id) { return ED.doc.rooms[id]; }).sort(byRoomNo);
            h += '<div class="ed-rowx"><span class="ed-sub" style="flex:1;color:' + zoneColor(zid) + '">' + esc(String(Z.label || zid).toUpperCase()) + ' · ' + zr.length + '</span><button class="ed-btn" data-zedit="' + esc(zid) + '" title="Its name, its node on the map, delete">✎</button></div>';
            zr.forEach(function (id) { inZ[id] = 1; h += roomBtn(id, zid); });
        });
        var loose = Object.keys(ED.doc.rooms).filter(function (id) { return !inZ[id]; }).sort(byRoomNo);
        if (zs.length && loose.length) h += '<div class="ed-sub">NO ZONE · ' + loose.length + '</div>';
        loose.forEach(function (id) { h += roomBtn(id, null); });
        h += '<button class="ed-row ed-add" data-act="newroom">+ NEW ROOM</button><button class="ed-row ed-add" data-act="newzone" title="A group of your rooms: one place on the world map">+ NEW ZONE</button></div>';
        h = h + prefabsHtml();
        if (ED.mode === 'library') h += '<div class="ed-sec"><div class="ed-hd">GAME ROOM · your first change makes your copy</div><div class="ed-note">' + esc((room() || {}).label || ED.roomId) + '<br>' + esc(ED.roomId) + '</div></div>';
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
            if (r.terrain && r.terrain.gen && r.terrain.gen.kind !== 'plan') h += '<div class="ed-note">This room\'s floor plan is GENERATED (terrain.gen · ' + esc(r.terrain.gen.kind || '') + '): its walls come from the generator, not from rows. The LAYOUT tab\'s FREEZE turns a rooms or halls plan into pieces you can move.</div>';
            h += '</div>';
        }
        var sc = L.scrollTop; L.innerHTML = h; L.scrollTop = sc;
        prefabsWire(L);
        L.querySelectorAll('[data-room]').forEach(function (b) { b.onclick = function () { saveCam(); enterRoom(b.getAttribute('data-room'), 'world'); }; });
        L.querySelectorAll('[data-act="newroom"]').forEach(function (b) { b.onclick = newRoom; });
        L.querySelectorAll('[data-act="newzone"]').forEach(function (b) { b.onclick = function () { zoneNew(ED.mode === 'world' ? ED.roomId : null); }; });   // E7
        L.querySelectorAll('[data-zedit]').forEach(function (b) { b.onclick = function () { zoneEdit(b.getAttribute('data-zedit')); }; });
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
        var r = room(); if (!r) { P.innerHTML = ''; return; }
        var lib = ED.mode === 'library', ro = !editable() && !lib;   // a game room edits like his own: the first change makes it his copy
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
            h += '<div class="ed-hd">' + (lib ? 'GAME ROOM' : 'THIS ROOM') + '</div><div class="ed-note">' + esc(ED.roomId) + (lib ? ' · the first change you make edits your own copy of it (the game\'s room is not touched)' : ro ? ' · read only' : '') + '</div>';
            h += '<div class="ed-form" data-scope="room">' + fieldHtml('label', String(r.label || '')) + fieldHtml('sub', String(r.sub || '')) + '</div>';
            if (!ro && ED.mode === 'world') h += zoneSiteHtml(r);   // E7
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
            h += '<div class="ed-sub">THE SKY AND THE LIGHT (the SKY tab, left, edits them)</div><div class="ed-form" data-scope="shell">' + fieldHtml('sky', S.sky || null) + fieldHtml('mood', S.mood || null) + '</div>';
            if (r.edit) h += '<div class="ed-sub">NOTES</div><div class="ed-form" data-scope="edit"><label class="ed-f ed-fj"><textarea data-k="notes" data-t="str" rows="3">' + esc(r.edit.notes || '') + '</textarea></label></div>';
            if (!ro && !lib) h += '<div class="ed-acts"><button class="ed-btn" data-a="dup">DUPLICATE ROOM</button><button class="ed-btn" data-a="start">WORLD STARTS HERE</button><button class="ed-btn ed-danger" data-a="del">DELETE ROOM</button></div>';
            else h += '<div class="ed-acts"><button class="ed-btn ed-copy" data-a="copy">COPY INTO WORLD</button></div>';
            h += '<div class="ed-sub">BUILD</div><div class="ed-note">BUILD (left) draws walls, rooms, floors, stairs, buildings, door gaps and windows on the ground. ADD (top bar) puts a shape, a prefab, a kit, a prop or a door at the cursor. Click a thing to pick it; SHIFT + click adds to the pick. Drag a thing to move it; R turns it 45° (SHIFT R back); - / = size it. C (or HIDE ROOFS, top bar) takes the roofs and ceilings off so you can see in.</div>';
        } else if (hits.length > 1) {
            h += '<div class="ed-hd">' + hits.length + ' PICKED</div><div class="ed-note">' + hits.map(function (x) { return esc(Core.rowLabel(x.list, x.row)); }).join('<br>') + '</div><div class="ed-note">The gizmo moves / turns them together. DEL deletes, CTRL D duplicates.</div>';
            if (!ro) h += '<div class="ed-acts"><button class="ed-btn" data-a="array">ARRAY…</button><button class="ed-btn" data-a="mirx">MIRROR E–W</button><button class="ed-btn" data-a="mirz">MIRROR N–S</button>' + (ED.mode !== 'prefab' ? '<button class="ed-btn ed-copy" data-a="topf">SAVE AS PREFAB</button>' : '') + '</div>';
        } else {
            var x = hits[0], row = x.row;
            h += '<div class="ed-hd">' + esc(Core.rowLabel(x.list, row).toUpperCase()) + '</div><div class="ed-note">' + esc(x.list) + (row.id ? ' · ' + esc(row.id) : '') + (ro ? ' · read only' : '') + '</div>';
            if (!ro && x.list !== 'spawn' && sizeRow(x, 1)) {   // E6: SIZE and TURN, the simple way
                var zs = sizeOf(x);
                h += '<div class="ed-sub">SIZE AND TURN</div><div class="ed-acts ed-sizeb">' + (zs ? '<input type="number" step="0.1" min="0.05" id="edSizeV" value="' + (Math.round(zs.v * 100) / 100) + '" style="width:64px" title="metres ' + zs.what + '"> m ' + zs.what + ' ' : '') +
                    '<button class="ed-btn" data-sz="0.5">×½</button><button class="ed-btn" data-sz="0.9091" title="smaller (-)">−</button><button class="ed-btn" data-sz="1.1" title="bigger (=)">+</button><button class="ed-btn" data-sz="2">×2</button>' +
                    '<button class="ed-btn" data-turn="-45" title="SHIFT R">⟲ 45°</button><button class="ed-btn" data-turn="45" title="R">⟳ 45°</button></div>';
            }
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
                if (row.k === 'tree' || row.k === 'grove') h += '<div class="ed-note">h is in ground tiles (1.75 m each); SIZE above is in metres. r = the trunk the walker bumps into. face = which way it turns (R).</div>';
                if (row.k === 'kit') h += '<div class="ed-note">A kit: the game\'s ' + esc(row.fn) + ' builder; args are its form (metres, degrees, about its own 0, 0).</div>';
                h += '<div class="ed-sub">RAW</div><textarea class="ed-raw" id="edRaw" rows="6">' + esc(JSON.stringify(row, null, 1)) + '</textarea><button class="ed-btn" id="edRawApply">APPLY RAW</button>';
            }
            if (x.list === 'doors') {
                var da = row.action || {}, far = da.room ? DOOR_HQ.rooms[da.room] : null, dbad = (ED.doorBad || []).filter(function (b) { return b.room === ED.roomId && b.door === row.id; })[0];
                h += '<div class="ed-sub">LEADS TO</div><div class="ed-note' + (dbad ? ' ed-warnt' : '') + '">' + (far ? esc(far.label || da.room) + ' (' + esc(da.room) + ') · ' + (da.at ? 'you arrive at its door ' + esc(da.at) : 'you arrive at its spawn') : 'NOWHERE: that room is not in your world') + (dbad && dbad.why === 'no door' ? ' · THAT DOOR IS NOT THERE (LEADS TO… fixes it)' : '') + '</div>';
                if (!ro && ED.mode === 'world') h += doorFlagsHtml(row);   // E7
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
        zoneSiteWire(P); if (hits.length === 1 && hits[0].list === 'doors') doorFlagsWire(P, hits[0]);   // E7
        P.querySelectorAll('[data-sz]').forEach(function (b) { b.onclick = function () { sizeSel(+b.getAttribute('data-sz')); }; });
        P.querySelectorAll('[data-turn]').forEach(function (b) { b.onclick = function () { turnSel(+b.getAttribute('data-turn')); }; });
        if ($('edSizeV')) $('edSizeV').onchange = function () { var h0 = hits[0], z0 = h0 && sizeOf(h0), v = parseFloat(this.value); if (z0 && isFinite(v) && v > 0 && Math.abs(v - z0.v) > 1e-3) sizeSel(v / z0.v, 'size ' + v + ' m'); };
        act('dup', duplicateRoom); act('start', setStart); act('del', deleteRoom); act('copy', function () { own(); });
        act('dupr', function () { duplicateSel(); }); act('delr', deleteSel); act('array', arraySel); act('mirx', function () { mirrorSel('x'); }); act('mirz', function () { mirrorSel('z'); });
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
        if (ED.mode === 'library' && !own()) return false;   // a game room: the change goes to his copy
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
            esc((r && r.label) || ED.roomId || '') + (ED.mode === 'world' && zoneOf(ED.roomId) ? ' · ' + esc(zoneLabel(zoneOf(ED.roomId))) : ''),
            c ? 'x ' + c.x.toFixed(2) + ' z ' + c.z.toFixed(2) + ' ground ' + c.y.toFixed(2) + ' m' : 'the cursor is off the ground',
            ED.draw ? '<b>' + esc(DRAWS[ED.draw.tool] ? DRAWS[ED.draw.tool].label : 'PLACE') + '</b>' + (ED._drawInfo ? ' ' + esc(ED._drawInfo) : '') : '',
            'eye ' + ED.cam.x.toFixed(1) + ', ' + ED.cam.y.toFixed(1) + ', ' + ED.cam.z.toFixed(1) + ' · ' + ED.cam.speed.toFixed(0) + ' m/s',
            ED.ready ? 'READY' : 'BUILDING…',
            'lights ' + lights + (cap ? ' / ' + cap : ''),
            perf && perf.fps ? Math.round(perf.fps) + ' fps' : '',
            (ED.doorBad && ED.doorBad.length) ? '<b class="ed-warn" title="' + esc(ED.doorBad.map(function (b) { return b.room + ' ' + b.door + ': ' + b.why; }).join(' · ')) + '">' + ED.doorBad.length + ' DOOR' + (ED.doorBad.length > 1 ? 'S LEAD' : ' LEADS') + ' NOWHERE</b>' : '',
            (function () { var lr = (ED.mode === 'world' || ED.mode === 'prefab') && planOf(r) ? layoutReport() : null; if (!lr) return ''; return 'layout ' + lr.spaces + ' / ' + lr.halls + (lr.cold.length ? ' · <b class="ed-warn">' + lr.cold.length + ' NOT JOINED</b>' : ''); })(),   // E5
            ED.band.on ? '<b>LEVEL ' + ED.band.y0 + ' → ' + ED.band.y1 + ' m</b>' : '',
            ED.roof.off ? '<b>ROOFS HIDDEN (C)</b>' : '',
            ED.audit.walls ? (ED.auditRes.none ? 'walls: no ground here' : ED.auditRes.walls == null ? 'walls …' : (ED.auditRes.walls ? '<b class="ed-warn">' + ED.auditRes.walls + ' INVISIBLE WALL' + (ED.auditRes.walls > 1 ? 'S' : '') + '</b>' : 'no invisible walls')) : '',
            ED.audit.pockets ? (ED.auditRes.none ? '' : ED.auditRes.pockets == null ? 'pockets …' : (ED.auditRes.pockets ? '<b class="ed-warn">POCKETS ' + ED.auditRes.pocketM + ' m² nobody reaches</b>' : 'no pockets')) : '',
            zoneAuditStatus(),   // E7
            ED.audit.fight ? (ED.auditRes.fight ? 'fight field: ' + ED.auditRes.fight.w + '×' + ED.auditRes.fight.h + (ED.auditRes.fight.crop ? ' (a crop)' : '') + ' · ' + ED.auditRes.fight.seats + ' seats · ' + ED.auditRes.fight.ins + ' tiles' : 'fight field: none here') : '',
            ED.undo.length + ' undo',
            ED.dirty ? 'SAVING…' : (ED.savedAt ? 'saved' : ''),
        ].filter(Boolean).map(function (x) { return '<span>' + x + '</span>'; }).join('');
    }
    function banner() {
        var b = $('edBanner'); if (!b) return;
        if (ED.mode === 'library') { b.style.display = ''; b.innerHTML = 'GAME ROOM · ' + esc((room() || {}).label || ED.roomId) + ' · edit away: your first change makes it your own copy — <button class="ed-btn ed-copy" id="edBanCopy">MAKE MY COPY NOW</button> <button class="ed-btn" id="edBanBack">BACK TO MY WORLD</button>'; $('edBanCopy').onclick = function () { own(); }; $('edBanBack').onclick = function () { enterRoom((ED.doc.start && ED.doc.rooms[ED.doc.start.room]) ? ED.doc.start.room : Object.keys(ED.doc.rooms)[0], 'world'); }; }
        else if (ED.mode === 'prefab' && ED.doc.prefabs[ED.pfId]) { b.style.display = ''; b.innerHTML = 'PREFAB · ' + esc(ED.doc.prefabs[ED.pfId].label || ED.pfId) + ' · placed ' + prefabUses(ED.pfId) + '× · every placement follows these edits — <button class="ed-btn ed-copy" id="edBanDone">DONE</button>'; $('edBanDone').onclick = leavePrefab; }
        else b.style.display = 'none';
    }
    function panels() { var LS = $('edLeft'), lsc = LS ? LS.scrollTop : 0; panels0(); if (LS) LS.scrollTop = lsc; }
    function panels0() { try { ED.doorBad = (ED.doc && W.hqWorldDocDoorCheck) ? W.hqWorldDocDoorCheck(ED.doc) : []; } catch (e) { ED.doorBad = []; } toolsBar(); palette(); outliner(); inspector(); banner(); status(); }

    /* ── the pick list and the small form (plain DOM) ── */
    function modalOpen(html) { if (ED.look) lookSet(false); var m = $('edModal'); $('edCard').style.width = ''; $('edCard').innerHTML = html; m.style.display = ''; }
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
            ['W A S D · SPACE · SHIFT', 'fly (like Minecraft\'s creative mode): level with the ground wherever you look · up · down. W twice quickly = sprint. The arrows and PgUp / PgDn fly too'],
            ['E · a click on empty ground', 'MOUSE LOOK: the mouse turns the view, a crosshair in the middle (E or ESC gives the mouse back for the panels)'],
            ['While looking', 'LEFT pick what the crosshair is on (hold and turn to drag it) · RIGHT place the tool / tile in hand (nothing armed: a copy of the pick) · MIDDLE take the thing in hand · wheel = fly speed'],
            ['1 – 9 · 0', 'the hotbar (bottom): the tools and tiles you used last · 0 or V = the empty hand (pick and drag)'],
            ['With the cursor', 'LEFT click pick (SHIFT adds) · LEFT drag a thing to move it · RIGHT click place · RIGHT drag turn the view · MIDDLE drag pan · wheel dolly · ALT + LEFT drag orbit the pick'],
            ['R · SHIFT R', 'turn the pick 45° · back'], ['- · =', 'the pick smaller · bigger (SHIFT: a bigger step); the inspector\'s SIZE takes metres'],
            ['C', 'hide / show the roofs and ceilings (the top bar\'s HIDE ROOFS; its number = the cut in metres over the floor)'], ['T', 'the gizmo: SIZE / MOVE (the top bar: MOVE · TURN · SIZE)'], ['[ · ]', 'turn the pick by the angle snap'],
            ['F · Home · G', 'frame the pick · to the spawn · the grid'], ['DEL · CTRL D', 'delete · duplicate'],
            ['BUILD (left)', 'WALL: click the corners (ENTER / ESC ends, a click on the first point closes it) · ROOM, FLOOR, BUILDING: drag a rectangle · STAIRS, RAMP: drag foot → head · DOOR GAP, WINDOW: click a wall'],
            ['SHIFT while drawing', 'lock the line to 45° steps (ends snap to wall ends within 0.6 m, else to the grid)'], ['V · Esc', 'back to SELECT · end the run / drop the pick'], ['CTRL Z · CTRL Y · CTRL S', 'undo · redo · save (it autosaves anyway)'],
            ['The palette tabs (left)', 'MODELS · PEOPLE · TREES · DOORS · LIGHTS · MARKERS · TEXTURES · KITS: click a tile, then click on the ground (again for more copies; it faces you). ESC or V stops. The armed tile again stops too'],
            ['DOOR (BUILD or DOORS)', 'click a wall you drew (a gap is cut, the door stands in it) or the ground; then pick the room it leads to and where you arrive (a new door back, its spawn, or one of its doors)'],
            ['TEXTURES', 'click a sheet, then a face: a wall\'s outside / inside, a floor, a block; the open ground = the room\'s floor'],
            ['GROUND (left)', 'RAISE, LOWER, SMOOTH, FLATTEN, TERRACE, CLIFF, SET: hold the left mouse over the ground ([ ] size the brush, SHIFT turns RAISE into LOWER) · RAMP: drag foot → head · PAINT: pick a sheet (+ SHEET), then paint (8 sheets a room) · POOL: drag middle → rim · STREAM: click its course, ENTER ends it'],
            ['PLATFORM · DECK (BUILD)', 'drag a rectangle: a floating platform / a railed deck at HEIGHT'],
            ['L · Shift L', 'the level band on / off · up a floor (the top bar: its bottom, its top, ▼ ▲): only what overlaps it picks, everything above it is cut away'],
            ['AUDIT (top bar)', 'WALLS: red posts where the walker is stopped by nothing you can see · POCKETS: yellow ground nobody reaches from the spawn or a door · FIGHT: the battle field at the cursor (the whole room, or its 24 × 24 crop)'],
            ['ZONES (the outliner)', '+ NEW ZONE groups rooms (a room\'s ZONE in the inspector); ✎ names it, joins it to a place on the map or gives it its own spot, deletes it'],
            ['SITE (a room\'s inspector)', 'the battle map, the people and the encounters the room uses; with none, no fight starts there'],
            ['A door\'s FLAGS', 'SECRET (a draught, both ends) · ONE WAY (no door back) · LOCKED (clearance, Keys)'],
            ['LEADS TO (left tab)', 'your rooms and the doors between them: dashed = secret, an arrow = one way, red = nowhere; click a room to go there; OPEN BIG'],
            ['AUDIT SIGHT · FIELD', 'SIGHT: two exits of a layout room in a straight line of sight (red) or in one room (orange) · FIELD: enough battle seats in each room (green), too few (red), bigger than a 24 × 24 fight (amber)'],
            ['P', 'PLAY HERE: the walker at the cursor, the real game; ESC comes back'], ['Esc', 'give the mouse back · drop the pick'],
            ['A game room (ROOM → THE LIBRARY, or EDIT in the pause menu)', 'picks and edits like yours: the first change makes it your own copy (the game\'s room is not touched until your world goes live)'],
        ].map(function (r) { return '<div><b>' + r[0] + '</b><span>' + r[1] + '</span></div>'; }).join('') +
        '</div><div class="ed-note">Your world starts flat and empty. BUILD draws the architecture; EDIT → SAVE SELECTION AS PREFAB makes a reusable group (PREFABS, left, edits it: every copy follows); EDIT → ARRAY / MIRROR copy and flip. ADD puts shapes, prefabs, kits, props and doors at the cursor; the inspector edits every field; ROOM → THE LIBRARY opens a game room to look at or edit (as your copy). FILE → EXPORT makes the zip for the bucket (Assets/World/). Everything autosaves in this browser.</div><div class="ed-acts"><button class="ed-btn" id="edCancel">CLOSE</button></div>');
        $('edCancel').onclick = modalClose;
    }

    /* ══ OPEN / CLOSE ═══════════════════════════════════════════════════════════════════════════════════════════════════ */
    function open(opts) {
        opts = opts || {};
        if (typeof DOOR_HQ === 'undefined' || typeof W.hqWorldDocNew !== 'function' || typeof W._hqEditEnter !== 'function') { alert('The editor needs data.js / map.js from the same delivery (hqWorldDoc*, _hqEditEnter).'); return; }
        build(); loadOpts(); hotLoad(); hotUi(); ED.look = false; ED.keys = {}; lookUi();
        try { var bo = JSON.parse(localStorage.getItem('ew_editor_band') || 'null'); if (bo && isFinite(bo.y0) && isFinite(bo.y1)) { ED.band.y0 = +bo.y0; ED.band.y1 = +bo.y1; ED.band.on = !!bo.on; } } catch (e) {}
        try { var rfo = JSON.parse(localStorage.getItem('ew_editor_roof') || 'null'); if (rfo) { ED.roof.off = !!rfo.off; if (isFinite(rfo.h)) ED.roof.h = +rfo.h; } } catch (e) {}
        try { var ao = JSON.parse(localStorage.getItem('ew_editor_audit') || 'null'); if (ao) ['walls', 'pockets', 'fight', 'sight', 'patch'].forEach(function (k) { ED.audit[k] = !!ao[k]; }); } catch (e) {}
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
            else if (want && copyOf(want)) enterRoom(copyOf(want), 'world', { at: at });   // he edited this game room already: his copy
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
        if (ED.draw) { ED.draw = null; drawPreview(null); }
        bandClipOff(); roofShow(); if (ED.clockH != null) clockPreview(null); clearTimeout(ED.auditTimer);
        saveCam(); saveNow();
        ED.open = false; ED.playing = false; ED.look = false; lookLock(false); lookUi();
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
               layoutAdd: layoutAdd, layoutSet: layoutSet, layoutFreeze: layoutFreeze, layoutRemove: layoutRemove, layoutReport: layoutReport, dungeonNew: dungeonNew, dungeonLevel: dungeonLevel,   // E5
               drawSet: drawSet, drawUp: drawUp, drawDown: drawDown, enterPrefab: enterPrefab, leavePrefab: leavePrefab, newPrefab: newPrefab, selToPrefab: selToPrefab, roomToPrefab: roomToPrefab, bakeSel: bakeSel, mirrorSel: mirrorSel, placeRow: placeRow, texPick: texPick, arrayRows: function (n, dx, dz, dyaw) { var ask0 = ask; ask = function (t, f, ok) { ok({ n: n, dx: dx, dz: dz, dyaw: dyaw }); }; try { arraySel(); } finally { ask = ask0; } },
               palPick: palPick, palEntries: palEntries, palData: palData, doorWrite: doorWrite, doorFollow: doorFollow, thumbs: function () { return { have: Object.keys(TH.mem).filter(function (k) { return !!TH.mem[k]; }).length, none: Object.keys(TH.mem).filter(function (k) { return TH.mem[k] === null; }).length, want: TH.want.length, off: TH.off }; },
               zoneNew: zoneNew, zoneSet: zoneSet, zoneEdit: zoneEdit, siteSet: siteSet, doorFlag: function (id, k, v) { doorFlag(findRow('doors', id), k, v); }, leadsGraph: leadsGraph, leadsBig: leadsBig, exitsOf: exitsOf, auditToggle: auditToggle, auditRes: function () { return JSON.parse(JSON.stringify(ED.auditRes || {})); },   // E7
               sizeSel: sizeSel, roofSet: roofSet, skyCommit: skyCommit, shellPut: shellPut, clockPreview: clockPreview, lampAt: lampAt, palette: function (tab) { ED.opts.tab = tab; palette(); },   // E6
               enter: enterRoom, playHere: playHere, library: function (id) { enterRoom(id, 'library'); }, copyIntoWorld: copyIntoWorld, pickAt: pickAt, frame: frameSel,
               moveSel: function (dx, dz) { var hits = ED.sel.map(selRow).filter(Boolean), a = hits[0] ? Core.rowAnchor(hits[0].row) : { x: 0, z: 0 }; replaceRows(hits.filter(function (h) { return h.list !== 'spawn'; }).map(function (h) { return { list: h.list, i: h.i, before: Core.clone(h.row), after: Core.rowTransform(h.row, { dx: dx, dz: dz, px: a.x, pz: a.z }) }; }), 'move'); } },
    };
})();
