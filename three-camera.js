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

        if (cam._cineKeepSubject && dirY > 1e-4 && focalY > camFloorY && targetPosY < camFloorY) {
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
            /* ── default floor collision (free-look, board view) ──
               Clamp ONLY the eye so it rides just above the ground it is orbiting;
               the look target is rebuilt from the preserved view direction, so a
               floored free-look camera keeps craning its gaze up to reveal the sky
               dome instead of being yanked back down to stare at the board. */
            const floorY = Math.max(0, focalY) + groundClearance;
            if (targetPosY < floorY) targetPosY = floorY;
            targetLookX = targetPosX + dist * dirX;
            targetLookY = targetPosY + dist * dirY;
            targetLookZ = targetPosZ + dist * dirZ;
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

    function screenToTile(screenX, screenY, canvas, terrainGroup, objectGroup) {
        if (!threeCamera || !terrainGroup) return null;

        const rect = canvas.getBoundingClientRect();
        const ndc = new THREE.Vector2(
            ((screenX - rect.left) / rect.width)  *  2 - 1,
            -((screenY - rect.top)  / rect.height) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
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

        const raycaster = new THREE.Raycaster();
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

        const raycaster = new THREE.Raycaster();
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
