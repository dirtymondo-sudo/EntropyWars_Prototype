const ThreeCamera = (function () {
    'use strict';

    const DEG2RAD = Math.PI / 180;
    /* MUST match ELEV_STEP_RATIO in three-renderer.js (1 height level = 1 full
       tile) and window._getElevationPx in ui.js — the focal height fed to
       lookAt() lives in the renderer's world space. */
    const ELEV_STEP_RATIO = 1.0;

    let baseDist = 800;
    const FOV = 45;
    const NEAR = 1;
    const FAR = 20000;

    const SMOOTH_TIME      = 0.12;
    const SMOOTH_TIME_FAST = 0.06;

    let threeCamera = null;
    let tileSize = 128;

    let _smoothPosX = 0, _smoothPosY = 0, _smoothPosZ = 0;
    let _smoothLookX = 0, _smoothLookY = 0, _smoothLookZ = 0;
    let _initialized = false;
    let _lastSyncTime = 0;
    let _smoothOverride = 0;
    /* Focal height latched while the user hand-pans the board — see sync(). */
    let _panFocalY = null;

    function create(width, height) {
        threeCamera = new THREE.PerspectiveCamera(FOV, width / height, NEAR, FAR);
        _initialized = false;
        return threeCamera;
    }

    function resize(width, height) {
        if (!threeCamera) return;
        threeCamera.aspect = width / height;
        threeCamera.updateProjectionMatrix();
    }

    function setTileSize(ts) { tileSize = ts; }
    function setBaseDist(d) { baseDist = d; }
    function getBaseDist() { return baseDist; }

    function markUserInput() {
        _smoothOverride = 10;
    }

    function snapImmediate() {
        _initialized = false;
    }

    function _damp(current, target, smoothTime, dt) {

        const factor = 1 - Math.exp(-dt / Math.max(smoothTime, 0.001));
        return current + (target - current) * factor;
    }

    /* World-space ground height under a world (X,Z) point — the height field
       the third-person collision camera slides against so it can never drop
       through the map. */
    function _groundYWorld(wx, wz) {
        if (typeof getHeightAt !== 'function') return 0;
        const tx = Math.floor(wx / tileSize);
        const tz = Math.floor(wz / tileSize);
        let h = 0;
        try { h = getHeightAt(tx, tz); } catch (e) { h = 0; }
        return (h > 0 ? h : 0) * tileSize * ELEV_STEP_RATIO;
    }

    function sync(cam) {
        if (!threeCamera) return;

        const ts = tileSize;
        const elevStep = ts * ELEV_STEP_RATIO;

        const focalX = cam.x * ts + ts / 2;
        const focalZ = cam.y * ts + ts / 2;

        let focalY = 0;
        /* Trust the controller's focal height whenever it has one — including
           0: while the hand-pan latch (battle.js _apply) holds the height
           frozen at ground level, re-deriving it from getHeightAt() here would
           re-introduce the drag-over-hills bob this rig is meant to prevent.
           The getHeightAt fallback only covers the frames before _apply has
           run at all. */
        if (Number.isFinite(cam._computedElevZ) && cam._computedElevZ >= 0) {
            focalY = cam._computedElevZ;
        } else if (typeof getHeightAt === 'function') {
            const rx = Math.round(cam.x);
            const ry = Math.round(cam.y);
            const h = getHeightAt(rx, ry);
            if (h > 0) focalY = h * elevStep;
        }

        /* While the user is hand-panning the board (right/middle-drag), freeze
           the focal height to whatever it was when the drag began. The camera
           orbits its focal point at a fixed distance, so letting focalY track
           the terrain under the cursor dollies the eye UP over hills and DOWN
           into valleys — and because this is a perspective camera that reads
           as an unwanted zoom-in/out, forcing the player to re-zoom after every
           pan. Latching focalY keeps a drag purely horizontal; normal tracking
           resumes (smoothly, via the damping below) the moment the drag ends. */
        if (typeof state !== 'undefined' && state && state._userPanning) {
            if (_panFocalY === null) _panFocalY = focalY;
            focalY = _panFocalY;
        } else {
            _panFocalY = null;
        }

        const dist = baseDist / Math.max(cam.zoom, 0.05);
        const tiltRad = cam.tilt * DEG2RAD;
        const yawRad  = cam.yaw  * DEG2RAD;

        /* View DIRECTION the camera faces (eye → scene), from pitch/yaw alone.
           This is the key to looking at the sky: at tilt 0 we stare straight
           down (dirY = -1); at tilt 90 we look dead level at the horizon
           (dirY = 0); PAST 90 the gaze pitches UP into the sky (dirY > 0). We
           keep this direction even when the eye is later clamped to the floor,
           so craning past the horizon reveals the sky dome instead of the
           underside of the board. */
        const dirX = -Math.sin(tiltRad) * Math.sin(yawRad);
        const dirY = -Math.cos(tiltRad);
        const dirZ = -Math.sin(tiltRad) * Math.cos(yawRad);

        /* Ideal orbit eye: the focal point pushed back along -dir by `dist`.
           (Algebraically identical to the old focal + dist·sin/cos rig.) */
        let targetPosX = focalX - dist * dirX;
        let targetPosY = focalY - dist * dirY;
        let targetPosZ = focalZ - dist * dirZ;
        let targetLookX, targetLookY, targetLookZ;

        const groundClearance = ts * 0.35;

        /* True ground height under the focal tile — used by the 3rd-person floor
           response below. (The focal HEIGHT itself can be lifted well above the
           board by a cinematic shot, so it is not a valid ground reference.) */
        let groundY = 0;
        if (typeof getHeightAt === 'function') {
            const gh = getHeightAt(Math.round(cam.x), Math.round(cam.y));
            if (gh > 0) groundY = gh * elevStep;
        }
        const camFloorY = groundY + groundClearance;

        if (cam._tpsCollide) {
            /* ══ TRUE THIRD-PERSON CAMERA (Strike Mode / hub free-roam) ══
               A real over-the-shoulder rig: orbit a PIVOT at the character's
               head, and — the whole point — never let the eye or the line
               between eye and pivot pass through the terrain. The engine's
               default board camera has no such collision, which is why
               mouse-look used to sink the eye straight through the map.

               Pivot = focal lifted to head height. March from the pivot out
               to the ideal orbit eye; the moment the ray dips below the ground
               height-field, stop and place the eye there (dolly in toward the
               character), then hard-floor the eye above ground. This is the
               standard "camera pulls in when a wall/hill is behind you" TPS
               behaviour, done against the height field so it is cheap and
               cannot fall through.

               The pivot height is anchored to the SUBJECT's own ground tile
               (cam._tpsSubject, the walker's float position), not the focal:
               the focal is the over-the-shoulder point — often a NEIGHBOURING
               tile at a different terrain height — and the stock focal-height
               machinery also adds a unit-lift only when a unit happens to
               stand on the rounded focal. Both made the shot ride at a
               different height depending on where the shoulder offset landed.
               Ground under the character + a per-model shoulder lift
               (cam._tpsHeadLift, set from the model's real rendered height)
               = one consistent frame for every character, short or tall. */
            const headLift = cam._tpsHeadLift || (ts * 0.9);
            const subj = cam._tpsSubject;
            const pivGroundY = subj
                ? _groundYWorld(subj.x * ts + ts / 2, subj.y * ts + ts / 2)
                : _groundYWorld(focalX, focalZ);
            const pivX = focalX, pivY = pivGroundY + headLift, pivZ = focalZ;
            let eyeX = pivX - dist * dirX;
            let eyeY = pivY - dist * dirY;
            let eyeZ = pivZ - dist * dirZ;
            const clear = ts * 0.45;

            const STEPS = 12;
            let f = 1;
            for (let i = 1; i <= STEPS; i++) {
                const tt = i / STEPS;
                const px = pivX + (eyeX - pivX) * tt;
                const py = pivY + (eyeY - pivY) * tt;
                const pz = pivZ + (eyeZ - pivZ) * tt;
                if (py < _groundYWorld(px, pz) + clear) { f = (i - 1) / STEPS; break; }
            }
            if (f < 0.14) f = 0.14;   // never jam the lens into the character
            eyeX = pivX + (eyeX - pivX) * f;
            eyeY = pivY + (eyeY - pivY) * f;
            eyeZ = pivZ + (eyeZ - pivZ) * f;
            const eg = _groundYWorld(eyeX, eyeZ) + clear;
            if (eyeY < eg) eyeY = eg;

            /* Aim ALONG the view direction, not AT the pivot. The old
               lookAt(pivot) capped the gaze at eye level: once the eye is
               floored on the ground, staring back at the character's head can
               never pitch into the sky no matter how far the player cranes
               up. Aiming at a point AHEAD of the pivot along the view ray is
               identical while the eye sits unobstructed on the orbit ray
               (eye, pivot and the ahead-point are colinear), but lets
               tilt > 90° genuinely look up — the character simply rides the
               lower part of the frame, exactly like every modern TPS. It also
               keeps the aim direction constant when terrain collision pulls
               the eye in, so the reticle never jumps. */
            const ahead = ts * 2.5;
            targetPosX = eyeX; targetPosY = eyeY; targetPosZ = eyeZ;
            targetLookX = pivX + dirX * ahead;
            targetLookY = pivY + dirY * ahead;
            targetLookZ = pivZ + dirZ * ahead;
        } else if (cam._cineKeepSubject && dirY > 1e-4 && focalY > camFloorY && targetPosY < camFloorY) {
            /* ── 3RD-PERSON floor collision (cinematic shots only) ──
               A ground-standing subject has NO eye position below it, so craning
               the gaze straight up at a sky target would put the eye underground.
               The default response (raise the eye, keep the up-pitched gaze) flings
               the look-point past the subject into the sky and drops the subject
               off the bottom of frame — the classic "my character vanished when I
               looked up" bug. Instead we PULL THE EYE IN along the view ray until
               it rides just above the ground, and keep looking straight AT the
               focal. The subject stays screen-centred while the camera genuinely
               cranes up — exactly how a real 3rd-person camera handles looking up
               (it dollies in toward the player rather than losing them). */
            const dPull = (focalY - camFloorY) / dirY;   // eye.Y == camFloorY along -dir
            targetPosX = focalX - dPull * dirX;
            targetPosY = camFloorY;
            targetPosZ = focalZ - dPull * dirZ;
            targetLookX = focalX;
            targetLookY = focalY;
            targetLookZ = focalZ;
        } else {
            /* ── default free-look (board view): pure orbit, no floor clamp ──
               The eye is allowed to ride BELOW the floor / the focal unit when
               the player cranes past the horizon (tilt > 90°). The old clamp
               pinned the eye to the ground and re-aimed the gaze up the view
               ray, which slid the camera away from the focal point — "looking
               up made the camera drift off my character". Orbiting freely
               keeps the focal (the player's unit) dead-centred; briefly seeing
               the board's underside is the intended trade-off. */
            targetLookX = focalX;
            targetLookY = focalY;
            targetLookZ = focalZ;
        }

        const now = performance.now() / 1000;
        const dt = _lastSyncTime > 0 ? Math.min(now - _lastSyncTime, 0.05) : 0.016;
        _lastSyncTime = now;

        if (!_initialized) {

            _smoothPosX = targetPosX;
            _smoothPosY = targetPosY;
            _smoothPosZ = targetPosZ;
            _smoothLookX = targetLookX;
            _smoothLookY = targetLookY;
            _smoothLookZ = targetLookZ;
            _initialized = true;
        } else {
            const st = _smoothOverride > 0 ? SMOOTH_TIME_FAST : SMOOTH_TIME;
            if (_smoothOverride > 0) _smoothOverride--;

            _smoothPosX  = _damp(_smoothPosX,  targetPosX, st, dt);
            _smoothPosY  = _damp(_smoothPosY,  targetPosY, st, dt);
            _smoothPosZ  = _damp(_smoothPosZ,  targetPosZ, st, dt);
            _smoothLookX = _damp(_smoothLookX, targetLookX, st, dt);
            _smoothLookY = _damp(_smoothLookY, targetLookY, st, dt);
            _smoothLookZ = _damp(_smoothLookZ, targetLookZ, st, dt);
        }

        threeCamera.position.set(_smoothPosX, _smoothPosY, _smoothPosZ);
        threeCamera.lookAt(_smoothLookX, _smoothLookY, _smoothLookZ);
    }

    /* One shared Raycaster for all picking — these run on every mousemove AND
       every camera-move frame, so per-call allocation was pure GC churn. */
    let _pickRaycaster = null;
    function _getPickRaycaster() {
        if (!_pickRaycaster) _pickRaycaster = new THREE.Raycaster();
        return _pickRaycaster;
    }

    function screenToTile(screenX, screenY, canvas, terrainGroup, objectGroup) {
        if (!threeCamera || !terrainGroup) return null;

        const rect = canvas.getBoundingClientRect();
        const ndc = new THREE.Vector2(
            ((screenX - rect.left) / rect.width)  *  2 - 1,
            -((screenY - rect.top)  / rect.height) * 2 + 1
        );

        const raycaster = _getPickRaycaster();
        raycaster.setFromCamera(ndc, threeCamera);

        const hits = raycaster.intersectObjects(terrainGroup.children, true);
        if (objectGroup) {
            const objHits = raycaster.intersectObjects(objectGroup.children, true);
            for (let i = 0; i < objHits.length; i++) { objHits[i]._ew_objHit = true; hits.push(objHits[i]); }
            if (hits.length > 1) hits.sort(function(a, b) { return a.distance - b.distance; });
        }
        if (hits.length === 0) return null;

        /* Side-face correctness: a hit on the side wall of a raised cube lands
           EXACTLY on the boundary between two tiles, so a bare floor() used to
           resolve the east/south faces to the NEIGHBOURING tile. Push the hit
           point a hair INTO the surface (against the face normal) before
           flooring so every face — top or side — resolves to the cube that was
           actually struck. The face normal is also reported so callers can do
           Minecraft-style placement against the clicked wall. */
        const hit = hits[0];
        const p = hit.point;
        const ts = tileSize;
        let nx = 0, ny = 1, nz = 0;
        if (hit.face && hit.face.normal && hit.object) {
            const n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
            nx = n.x; ny = n.y; nz = n.z;
        }
        const eps = ts * 0.01;
        const res = {
            tileX: Math.floor((p.x - nx * eps) / ts),
            tileY: Math.floor((p.z - nz * eps) / ts),
            faceNX: nx, faceNY: ny, faceNZ: nz,
            /* true when the closest hit was terrain (a cube face), not a prop/object mesh */
            isTerrainHit: !hit._ew_objHit,
            /* for a cube-wall hit, the open tile IN FRONT of the struck wall */
            isSideFace: false, sideTileX: null, sideTileY: null
        };
        /* A wall hit has a horizontal normal AND straddles a tile boundary —
           props (tree planes, torch sticks…) also have horizontal normals but
           their hit points sit inside the tile, so both floors agree. */
        if (Math.abs(ny) < 0.5 && (Math.abs(nx) > 0.5 || Math.abs(nz) > 0.5)) {
            const sx = Math.floor((p.x + nx * eps) / ts);
            const sy = Math.floor((p.z + nz * eps) / ts);
            if (sx !== res.tileX || sy !== res.tileY) {
                res.isSideFace = true;
                res.sideTileX = sx;
                res.sideTileY = sy;
            }
        }
        return res;
    }

    /* Resolve a board tile by intersecting the pointer ray with a flat ground
       plane at world-height planeY (default 0), independent of any terrain
       mesh. The mesh-based screenToTile() returns null over empty/blank tiles
       (no geometry to hit), which made single clicks fail in the map editor —
       this fallback always resolves the tile under the cursor so click-to-place
       works on empty cells. */
    function screenToTilePlane(screenX, screenY, canvas, planeY) {
        if (!threeCamera) return null;

        const rect = canvas.getBoundingClientRect();
        const ndc = new THREE.Vector2(
            ((screenX - rect.left) / rect.width)  *  2 - 1,
            -((screenY - rect.top)  / rect.height) * 2 + 1
        );

        const raycaster = _getPickRaycaster();
        raycaster.setFromCamera(ndc, threeCamera);

        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -(planeY || 0));
        const pt = new THREE.Vector3();
        if (!raycaster.ray.intersectPlane(plane, pt)) return null;

        const ts = tileSize;
        return {
            tileX: Math.floor(pt.x / ts),
            tileY: Math.floor(pt.z / ts)
        };
    }

    function screenToUnit(screenX, screenY, canvas, unitGroup) {
        if (!threeCamera || !unitGroup || unitGroup.children.length === 0) return null;

        const rect = canvas.getBoundingClientRect();
        const ndc = new THREE.Vector2(
            ((screenX - rect.left) / rect.width)  *  2 - 1,
            -((screenY - rect.top)  / rect.height) * 2 + 1
        );

        const raycaster = _getPickRaycaster();
        raycaster.setFromCamera(ndc, threeCamera);

        const hits = raycaster.intersectObjects(unitGroup.children, true);
        for (let i = 0; i < hits.length; i++) {

            let obj = hits[i].object;
            /* Pixel-accurate pick: a sprite quad's transparent padding must not
               eat clicks aimed at the unit visible behind/above it (stacked or
               airborne units). Meshes carrying _ew_alphaPickTest (attached by
               three-renderer) veto hits whose sampled texel is transparent. */
            if (obj && obj._ew_alphaPickTest && hits[i].uv
                && !obj._ew_alphaPickTest(hits[i].uv, obj)) continue;
            while (obj) {
                if (obj._ew_unitId !== undefined) return { unitId: obj._ew_unitId };
                obj = obj.parent;
            }
        }
        return null;
    }

    function screenDeltaToWorldXZ(dxPx, dyPx) {
        if (!threeCamera) return null;

        const right = new THREE.Vector3();
        const up    = new THREE.Vector3();
        threeCamera.getWorldDirection(new THREE.Vector3());
        right.setFromMatrixColumn(threeCamera.matrixWorld, 0);
        up.setFromMatrixColumn(threeCamera.matrixWorld, 1);

        right.y = 0;
        up.y    = 0;
        const rLen = right.length();
        const uLen = up.length();

        if (uLen < 0.001) {
            const fwd = new THREE.Vector3();
            threeCamera.getWorldDirection(fwd);
            fwd.y = 0;
            if (fwd.length() > 0.001) fwd.normalize();
            up.copy(fwd);
        } else {
            up.normalize();
        }
        if (rLen > 0.001) right.normalize();

        const focalDist = Math.sqrt(
            (_smoothPosX - _smoothLookX) ** 2 +
            (_smoothPosY - _smoothLookY) ** 2 +
            (_smoothPosZ - _smoothLookZ) ** 2
        );
        const vFovRad = (threeCamera.fov / 2) * DEG2RAD;
        const halfHeight = focalDist * Math.tan(vFovRad);
        const screenH = threeCamera.aspect ? (2 * halfHeight / (window.innerHeight || 800)) : 1;

        const wx = (right.x * dxPx - up.x * dyPx) * screenH;
        const wz = (right.z * dxPx - up.z * dyPx) * screenH;

        return { wx, wz };
    }

    function getCamera() { return threeCamera; }

    /* The camera's live (smoothed) look-at point in world space — what the
       player is actually focused on. ThreePost projects this to screen space
       to place the tilt-shift DoF's sharp band. */
    function getFocalWorld() {
        if (!_initialized) return null;
        return { x: _smoothLookX, y: _smoothLookY, z: _smoothLookZ };
    }

    return {
        create,
        resize,
        sync,
        screenToTile,
        screenToTilePlane,
        screenToUnit,
        screenDeltaToWorldXZ,
        setTileSize,
        setBaseDist,
        getBaseDist,
        getCamera,
        getFocalWorld,
        markUserInput,
        snapImmediate,
        FOV,
        NEAR,
        FAR
    };
})();
