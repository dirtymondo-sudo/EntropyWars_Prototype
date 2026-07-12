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

    /* Runtime FOV (deg). Camera view presets use this: a slightly wider FOV
       for the pulled-back tactical preset, a tighter one for the close view.
       Clamped to a sane game range; no-ops when unchanged. */
    function setFOV(deg) {
        const f = Math.max(25, Math.min(90, Number(deg) || FOV));
        if (threeCamera && Math.abs(threeCamera.fov - f) > 0.01) {
            threeCamera.fov = f;
            threeCamera.updateProjectionMatrix();
        }
    }
    function getFOV() { return threeCamera ? threeCamera.fov : FOV; }

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
       the collision camera slides against so it can never drop through the
       map. Prefers the game's camera ground helper (terrain + walkable
       roofs, battle.js window._camGroundPx) so structures units stand on
       count as ground; falls back to the bare terrain height field. */
    function _groundYWorld(wx, wz) {
        const tx = Math.floor(wx / tileSize);
        const tz = Math.floor(wz / tileSize);
        if (typeof window !== 'undefined' && typeof window._camGroundPx === 'function') {
            try { return Math.max(0, window._camGroundPx(tx, tz)); } catch (e) {}
        }
        if (typeof getHeightAt !== 'function') return 0;
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

        /* ══ UNIFIED COLLISION ORBIT RIG ══
           ONE behaviour for every camera mode — the eye can NEVER pass below
           the terrain surface, in any mode, at any pitch. (The old free-look
           branch deliberately let the eye dive under the board when the
           player or a sky cinematic craned past the horizon, which meant
           "looking at the sky" showed the dirt underside of the map. That
           trade-off is gone.)

           • Third-person (Strike Mode free-roam via cam._tpsCollide, and the
             cinematic/turn shots via cam._cineTps): pivot at the SUBJECT's
             shoulder — ground under the character (cam._tpsSubject) plus the
             model's real rendered shoulder lift (cam._tpsHeadLift) — so a
             fairy and a bigfoot get the same frame. Gaze rides ALONG the view
             direction, so craning past 90° genuinely shows the sky with the
             character in the lower frame, like every modern TPS.
           • Board / tactical free look: pivot at the focal point. Looking
             down or level keeps the classic look-at-the-focal orbit; craning
             PAST the horizon switches the aim to ride the view direction from
             just above the ground, so the player sees their unit against the
             SKY instead of the camera sinking under the map.
           • Cinematic keep-subject shots (cam._cineKeepSubject) keep looking
             straight AT the (possibly lifted) focal while the ground clamp
             dollies the eye in along the ray — the subject stays framed while
             the camera cranes up at a sky target.

           Collision is a cheap march against the tile height-field: walk from
           the pivot out to the ideal orbit eye; the moment the boom dips
           below ground+clearance, stop there (dolly in), then hard-floor the
           eye above the ground actually under it. */
        const isTps = !!(cam._tpsCollide || cam._cineTps);
        let pivX = focalX, pivY = focalY, pivZ = focalZ;
        if (isTps) {
            const headLift = cam._tpsHeadLift || (ts * 0.9);
            const subj = cam._tpsSubject;
            const pivGroundY = subj
                ? _groundYWorld(subj.x * ts + ts / 2, subj.y * ts + ts / 2)
                : _groundYWorld(focalX, focalZ);
            pivY = pivGroundY + headLift;
        }

        /* ══ FIRST-PERSON EYE (Strike Mode) ══
           cam._fpEye puts the eye AT the TPS pivot (the character's head) and
           aims straight along the view direction — no boom, no boom collision,
           no shoulder offset. The character's own model is hidden by the
           renderer (window._ewFpHideUid) so there's nothing to frame; a small
           ground clearance keeps the eye from clipping into the floor when
           standing in shallow dips. Snappier smoothing: an FP reticle can't
           afford the TPS boom's ~120ms glide. */
        if (isTps && cam._fpEye) {
            let fpEyeY = pivY;
            const fpFloor = _groundYWorld(pivX, pivZ) + ts * 0.18;
            if (fpEyeY < fpFloor) fpEyeY = fpFloor;
            targetPosX = pivX;
            targetPosY = fpEyeY;
            targetPosZ = pivZ;
            const aheadFp = ts * 3;
            targetLookX = pivX + dirX * aheadFp;
            targetLookY = fpEyeY + dirY * aheadFp;
            targetLookZ = pivZ + dirZ * aheadFp;

            const nowFp = performance.now() / 1000;
            const dtFp = _lastSyncTime > 0 ? Math.min(nowFp - _lastSyncTime, 0.05) : 0.016;
            _lastSyncTime = nowFp;
            if (!_initialized) {
                _smoothPosX = targetPosX; _smoothPosY = targetPosY; _smoothPosZ = targetPosZ;
                _smoothLookX = targetLookX; _smoothLookY = targetLookY; _smoothLookZ = targetLookZ;
                _initialized = true;
            } else {
                const stFp = 0.028;   // tight — mouse aim must feel 1:1
                _smoothPosX  = _damp(_smoothPosX,  targetPosX,  stFp, dtFp);
                _smoothPosY  = _damp(_smoothPosY,  targetPosY,  stFp, dtFp);
                _smoothPosZ  = _damp(_smoothPosZ,  targetPosZ,  stFp, dtFp);
                _smoothLookX = _damp(_smoothLookX, targetLookX, stFp, dtFp);
                _smoothLookY = _damp(_smoothLookY, targetLookY, stFp, dtFp);
                _smoothLookZ = _damp(_smoothLookZ, targetLookZ, stFp, dtFp);
            }
            threeCamera.position.set(_smoothPosX, _smoothPosY, _smoothPosZ);
            threeCamera.lookAt(_smoothLookX, _smoothLookY, _smoothLookZ);
            return;
        }
        let eyeX = pivX - dist * dirX;
        let eyeY = pivY - dist * dirY;
        let eyeZ = pivZ - dist * dirZ;
        const clear = isTps ? ts * 0.45 : ts * 0.35;

        /* Boom collision — only for the modes that FRAME A SUBJECT up close
           (TPS shots, keep-subject cine shots). The wide tactical view
           deliberately skips it: a ridge clipping the low start of a long
           boom would otherwise yank the whole board view in close.

           Response = DOLLY IN, exactly like every standard third-person
           game (Skyrim / Fortnite / GTA / Minecraft): pull the camera in
           along the boom so it sits IN FRONT of the first blocker, in clear
           air, still looking at the character. A wall right at the
           character's back gives a tight over-the-shoulder shot of the
           CHARACTER — never a close-up of the wall, never a camera perched
           on top of the cliff, never a crane over it. Partial blockers the
           spread rays catch are additionally made see-through by
           three-renderer's occlusion fade, which keeps the active unit
           visible every frame. The character is framed in third person
           every single time. */
        /* CINEMATIC shots (cam._cineTps without Strike Mode's per-frame
           controller) deliberately SKIP boom collision: the renderer's
           occlusion fade already makes any terrain/prop between the camera
           and the two shot subjects see-through, so a wall right behind a
           subject should be clipped THROUGH (and faded), not dodged — the
           dolly-in response here slammed those shots into a super-closeup
           whenever the caster or victim stood against a wall/cliff. Strike
           Mode free-roam keeps real collision (the player drives that
           camera and expects it to behave physically). */
        const skipBoomCollide = !!(cam._cineTps && !cam._tpsCollide);
        if ((isTps || cam._cineKeepSubject) && !skipBoomCollide) {
            const STEPS = 12;
            let f = 1;
            for (let i = 1; i <= STEPS; i++) {
                const tt = i / STEPS;
                const px = pivX + (eyeX - pivX) * tt;
                const py = pivY + (eyeY - pivY) * tt;
                const pz = pivZ + (eyeZ - pivZ) * tt;
                if (py < _groundYWorld(px, pz) + clear) { f = (i - 1) / STEPS; break; }
            }
            // never inside the character model itself (~⅓ tile), otherwise
            // hug whatever clear air exists in front of the wall
            const fMin = Math.min(1, (ts * 0.35) / Math.max(dist, 1));
            if (f < fMin) f = fMin;
            if (f < 1) {
                eyeX = pivX + (eyeX - pivX) * f;
                eyeY = pivY + (eyeY - pivY) * f;
                eyeZ = pivZ + (eyeZ - pivZ) * f;
            }
        }
        /* Hard floor — the eye must not sink BELOW the map:
           • board/tactical view: always (it has no boom collision).
           • subject-framing modes: only while the gaze is pitched UP past
             the horizon (sky look) — that is the genuine below-the-map
             case. For level/down gazes the dolly already handled terrain,
             and force-lifting a wall-adjacent eye onto the top of that wall
             was the "camera standing on the clifftop staring at dirt
             instead of my unit" bug. */
        if (dirY > 1e-4 || !(isTps || cam._cineKeepSubject)) {
            const eg = _groundYWorld(eyeX, eyeZ) + clear;
            if (eyeY < eg) eyeY = eg;
            /* ── SKY-GAZE LIFT (board/tactical modes only) ──
               The hard floor above parks the eye a mere ⅓ tile over the
               ground, so every look UP at the sky (the zodiac/celestial
               cinematic, the intro's map-name crane, free-look past the
               horizon) was shot from ankle height — any raised tile or prop
               nearby jutted into what should be an open-sky view. As the
               gaze pitches toward the sky, RAISE that floor smoothly so the
               camera ends up hovering well above the battlefield looking up
               at a clean firmament. The ramp starts a little BEFORE the
               horizon so a continuous crane (sky cinematic up/down, intro
               beat 6) glides through the transition instead of dipping to
               the dirt at 90° and popping back up. Subject-framing modes
               (TPS, keep-subject cine shots) keep their own dolly response —
               they WANT to stay at the character's shoulder. */
            if (!isTps && !cam._cineKeepSubject && dirY > -0.35) {
                const t01 = Math.min(1, (dirY + 0.35) / 0.8);
                const skyF = t01 * t01 * (3 - 2 * t01);
                const skyBase = Math.max(_groundYWorld(eyeX, eyeZ), focalY);
                const skyFloor = skyBase + clear + ts * 9 * skyF;
                if (eyeY < skyFloor) eyeY = skyFloor;
            }
        }

        targetPosX = eyeX; targetPosY = eyeY; targetPosZ = eyeZ;

        if (isTps) {
            /* Aim ALONG the view direction, not AT the pivot. lookAt(pivot)
               caps the gaze at eye level: once the eye is floored on the
               ground, staring back at the subject can never pitch into the
               sky. Aiming at a point AHEAD of the pivot along the view ray is
               identical while the eye sits unobstructed on the orbit ray
               (eye, pivot and the ahead-point are colinear), but lets
               tilt > 90° genuinely look up — the subject simply rides the
               lower part of the frame. It also keeps the aim direction
               constant when terrain collision pulls the eye in, so the
               reticle/framing never jumps. */
            const ahead = ts * 2.5;
            targetLookX = pivX + dirX * ahead;
            targetLookY = pivY + dirY * ahead;
            targetLookZ = pivZ + dirZ * ahead;
        } else if (dirY > 1e-4 && !cam._cineKeepSubject) {
            /* Board free-look / cinematic SKY gaze: aim along the view
               direction FROM THE CLAMPED EYE, not from the ground pivot.
               With the sky-gaze lift above, an aim point derived from the
               (ground-level) pivot could land BELOW the raised eye and pitch
               the camera back down at the terrain — aiming from the eye
               keeps the gaze direction exactly (dirX,dirY,dirZ) no matter
               how far the floor lifted it, so the sky subject stays framed. */
            const ahead = ts * 6;
            targetLookX = eyeX + dirX * ahead;
            targetLookY = eyeY + dirY * ahead;
            targetLookZ = eyeZ + dirZ * ahead;
        } else {
            /* Level/downward gaze (and keep-subject cine shots): classic
               orbit — the focal stays dead-centred. When the ground clamp
               pulled the eye in, looking AT the focal reproduces the old
               keep-subject dolly-in response exactly. */
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
        /* Canopy blocks hidden by the cutaway (three-renderer fades them out
           around the active unit) must not swallow the pick — skip them so the
           ray lands on the floor visible through the hole. (Merged-terrain
           pick proxies hide the ROOT, not the run mesh, so they still hit.) */
        let hit = null;
        for (let hi = 0; hi < hits.length; hi++) {
            const ho = hits[hi].object;
            if (ho && ho._ew_canopy && !ho.visible) continue;
            hit = hits[hi];
            break;
        }
        if (!hit) return null;
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
            /* world-space height of the hit point — lets multi-floor callers
               resolve WHICH surface of the column was actually clicked */
            hitY: p.y,
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
            /* Raycaster doesn't honour object.visible — a HIDDEN unit (the
               first-person player's own body, a fogged enemy) must not eat
               the pick aimed at whatever is visible behind it. */
            let hidden = false;
            while (obj) {
                if (obj.visible === false) hidden = true;
                if (obj._ew_unitId !== undefined) {
                    if (hidden) break;
                    return { unitId: obj._ew_unitId };
                }
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
        setFOV,
        getFOV,
        getCamera,
        getFocalWorld,
        markUserInput,
        snapImmediate,
        FOV,
        NEAR,
        FAR
    };
})();
