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
        if (cam._computedElevZ > 0) {

            focalY = cam._computedElevZ;
        } else if (typeof getHeightAt === 'function') {
            const rx = Math.round(cam.x);
            const ry = Math.round(cam.y);
            const h = getHeightAt(rx, ry);
            if (h > 0) focalY = h * elevStep;
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
        const targetPosX = focalX - dist * dirX;
        let   targetPosY = focalY - dist * dirY;
        const targetPosZ = focalZ - dist * dirZ;

        /* ── AAA floor collision ──
           As the pitch cranes up toward (and past) the horizon the orbit eye
           drops to ground level and would sink THROUGH the board ("below the
           map"). Clamp ONLY the eye so it rides just above the ground it is
           orbiting. The look target below is rebuilt from the preserved view
           direction — so a floored camera keeps tilting its gaze up at the sky
           instead of being yanked back down to stare at the board. */
        const groundClearance = ts * 0.35;
        const floorY = Math.max(0, focalY) + groundClearance;
        if (targetPosY < floorY) targetPosY = floorY;

        /* Look target = eye + viewDir · dist. When the eye is unclamped this is
           exactly the ground focal point (classic orbit framing); when the eye
           has been floored, the gaze still rides the original up-pitched
           direction, craning toward the sky. */
        const targetLookX = targetPosX + dist * dirX;
        const targetLookY = targetPosY + dist * dirY;
        const targetLookZ = targetPosZ + dist * dirZ;

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
            for (let i = 0; i < objHits.length; i++) hits.push(objHits[i]);
            if (hits.length > 1) hits.sort(function(a, b) { return a.distance - b.distance; });
        }
        if (hits.length === 0) return null;

        const p = hits[0].point;
        const ts = tileSize;
        return {
            tileX: Math.floor(p.x / ts),
            tileY: Math.floor(p.z / ts)
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

    return {
        create,
        resize,
        sync,
        screenToTile,
        screenToUnit,
        screenDeltaToWorldXZ,
        setTileSize,
        setBaseDist,
        getBaseDist,
        getCamera,
        markUserInput,
        snapImmediate,
        FOV,
        NEAR,
        FAR
    };
})();
