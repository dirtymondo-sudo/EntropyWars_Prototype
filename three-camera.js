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
    /* THE ENCOUNTER (HQ plan 9.4 seam 2, 2026-09-15): the first battle frame is
       the WALKER's own eye. seedPose(seed, easeS) parks a pending pose — the
       eye in TILE units ({ tx, tz, up = tiles above the ground under it, dx /
       dy / dz = the gaze, look = tiles ahead }); the next sync() starts the
       smoothed state THERE instead of snapping to the ideal frame and eases
       toward it over ~easeS (a slow damp), so the cut from the building to the
       board is one continuous move. snapImmediate() is IGNORED while the seed
       eases (a match start snaps the camera home; the seed must survive it). */
    let _seed = null, _seedUntil = 0, _seedSt = 0;
    /* Phase 9 polish (2026-09-16): THE SWOOP — while the seed eases, the camera is TWEENED from the seed pose
       (`_seedFrom`) to the frame's ideal with an ease-in-out over the window (a damp started fast and settled
       slow, which read as a jump then a drift; a smoothstep reads as one continuous crane from the walker's eye
       up to the board's angle). After the window the ordinary damp takes over. */
    let _seedFrom = null, _seedT0 = 0, _seedEase = 0;
    /* THE ARRIVAL (2026-09-22): THE CRANE — the swoop is a designed camera move, not a straight lerp. The GAZE runs
       ahead of the body (`lookLead` — the pan lands before the dolly, as an operator does it), the EYE lifts over
       the straight line by `bow` × its travel on a half-sine (a boom up and over the two figures, never a dolly
       out), the LENS holds the walker's focal length and tightens to the board's only over the last (1 − fovLate)
       of the move (a slow push as the boom settles), all on an ease-in-out cubic (a longer dwell at both ends
       than the smoothstep). seedPose's third argument shapes it (data.js HQ_ENCOUNTER_RULES.arrival.crane); no
       opts = the straight tween as before. */
    let _seedCrane = null;
    function _seedEaseK(u) { u = Math.max(0, Math.min(1, u)); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; }
    /* THE SEAMLESS FIELD (2026-09-22): seedHold(true) parks THE SWOOP at its seed — the room's held frame still covers the
       canvas while the party's rigs land; the crane starts the frame the fade does, so the reveal never shows a camera
       already half-way up. The window is pushed forward every held frame (snapImmediate stays ignored under it). */
    let _seedHoldOn = false;
    function seedHold(on) { _seedHoldOn = !!on; }
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
        /* Floor 10 (was 25): the sniper POV's scope zoom (battle.js
           cineSniperPov) narrows the lens by DISTANCE and needs the room;
           the view presets never ask under 28. */
        const f = Math.max(10, Math.min(90, Number(deg) || FOV));
        /* THE ARRIVAL: while the swoop's lens tween runs, a preset's FOV becomes its DESTINATION — never a write
           on the live lens (getCameraMode re-applies the preset every turn; it used to pop the walker's 52° to 45°
           mid-crane) */
        if (_seedFrom && _seedFrom.fov) { _seedFrom.fovTo = f; return; }
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
        if (_seedUntil > performance.now() / 1000) return;   // the encounter's seed is easing — never cut it
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
            /* Math.max(0, NaN) is NaN — a poisoned height field must not
               reach the camera, so only trust a finite answer. */
            try {
                const g = window._camGroundPx(tx, tz);
                if (Number.isFinite(g)) return Math.max(0, g);
            } catch (e) {}
        }
        if (typeof getHeightAt !== 'function') return 0;
        let h = 0;
        try { h = getHeightAt(tx, tz); } catch (e) { h = 0; }
        return (Number.isFinite(h) && h > 0 ? h : 0) * tileSize * ELEV_STEP_RATIO;
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

        /* ── Gimbal-safe UP vector ──
           lookAt() with the default world-up (0,1,0) degenerates when the
           view direction runs (anti)parallel to it — i.e. the straight-down
           top-down gaze (tilt→0). THREE then falls back to an arbitrary
           basis, so panning while directly above the board made the view
           wiggle and snap-flip 180°. Derive up analytically from tilt/yaw
           instead: for any tilt in (0°,180°) this is EXACTLY the vector
           lookAt would pick anyway (world-up projected perpendicular to the
           gaze), and at the vertical poles it stays yaw-continuous — no
           wiggle, no flip, no behavior change at normal pitches. */
        threeCamera.up.set(
            -Math.cos(tiltRad) * Math.sin(yawRad),
             Math.sin(tiltRad),
            -Math.cos(tiltRad) * Math.cos(yawRad)
        );

        /* Ideal orbit eye: the focal point pushed back along -dir by `dist`.
           (Algebraically identical to the old focal + dist·sin/cos rig.) */
        let targetPosX = focalX - dist * dirX;
        let targetPosY = focalY - dist * dirY;
        let targetPosZ = focalZ - dist * dirZ;
        let targetLookX, targetLookY, targetLookZ;

        /* ══ UNIFIED ORBIT RIG ══
           ONE behaviour for every camera mode.

           • Third-person (Strike Mode free-roam via cam._tpsCollide, and the
             cinematic/turn shots via cam._cineTps): pivot at the SUBJECT's
             shoulder — ground under the character (cam._tpsSubject) plus the
             model's real rendered shoulder lift (cam._tpsHeadLift) — so a
             fairy and a bigfoot get the same frame. Gaze rides ALONG the view
             direction, so craning past 90° genuinely shows the sky with the
             character in the lower frame, like every modern TPS.
           • Board / tactical free look: pivot at the focal point. Looking
             down or level keeps the classic look-at-the-focal orbit; craning
             PAST the horizon parks the eye at the horizon pose and turns the
             gaze up in place (head turn), so the player sees the SKY without
             the camera sliding in toward the unit or sinking under the map.
           • Cinematic keep-subject shots (cam._cineKeepSubject) keep looking
             straight AT the (possibly lifted) focal while the floor clamp
             dollies the eye in along the ray — the subject stays framed while
             the camera cranes up at a sky target.

           Terrain between the camera and the subject is NOT dodged: the boom
           passes straight through hills and walls (the renderer's occlusion
           fade ghosts whatever the eye looks through), and the only hard
           limit is a FLAT FLOOR at the subject's own footing (see below).
           Strike Mode's player-driven rig alone keeps a physical boom
           collision (dolly in front of the blocker). */
        const isTps = !!(cam._tpsCollide || cam._cineTps);
        let pivX = focalX, pivY = focalY, pivZ = focalZ;
        /* Ground under the third-person subject — also the flat floor the
           TPS eye may never sink below (see FLAT FLOOR). */
        let pivGroundY = 0;
        if (isTps) {
            const headLift = cam._tpsHeadLift || (ts * 0.9);
            const subj = cam._tpsSubject;
            pivGroundY = subj
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
            /* ── NaN firewall (see the main branch below) ── */
            if (!isFinite(targetPosX + targetPosY + targetPosZ + targetLookX + targetLookY + targetLookZ)) return;
            if (_initialized && !isFinite(_smoothPosX + _smoothPosY + _smoothPosZ + _smoothLookX + _smoothLookY + _smoothLookZ)) _initialized = false;
            const seededFp = _seed ? _consumeSeed(nowFp) : false;   // the seeded frame renders the seed itself
            if (!_initialized) {
                _smoothPosX = targetPosX; _smoothPosY = targetPosY; _smoothPosZ = targetPosZ;
                _smoothLookX = targetLookX; _smoothLookY = targetLookY; _smoothLookZ = targetLookZ;
                _initialized = true;
            } else if (!seededFp) {
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
        /* ══ WHO OWNS THE CAMERA THIS FRAME ══
           handHeld: the PLAYER owns it — a live hand drag/orbit
           (state._userPanning) or the post-drag height latch
           (cam._panElevLatch, battle.js; cleared by the next programmatic
           move). A hand-held camera pivots in place like a head turning; it
           must never be auto-craned into the air just because the gaze
           pitched up — that lift is a CINEMATIC framing device (intro
           map-name crane, zodiac/celestial shot), not a free-look behavior.
           subjectLook: the focal itself hangs well above the ground under it
           — an airborne flyer the controller's focal height is tracking.
           Looking up at that subject behaves like a normal orbit camera: eye
           stays low, gaze stays ON the subject, the flyer reads against the
           sky. */
        const handHeld = !!((typeof state !== 'undefined' && state && (state._userPanning || state._userOrbiting))
            || (cam._panElevLatch !== null && cam._panElevLatch !== undefined));
        const focalGroundY = _groundYWorld(focalX, focalZ);
        const subjectLook = !isTps && !cam._cineKeepSubject
            && (focalY - focalGroundY) > ts * 0.85;
        /* Cinematic sky crane (see SKY-GAZE LIFT below): programmatic board
           shots that pitch at the sky get lifted well above the battlefield. */
        const skyCrane = !isTps && !cam._cineKeepSubject && !handHeld && !subjectLook;

        /* ══ HEAD TURN PAST THE HORIZON (2026-09-02) ══
           Orbiting is only meaningful while the gaze points at or below the
           horizon. Past it, the orbit eye would keep swinging UNDER the pivot
           — every frame the floor then caught it and slid it along the ground
           IN toward the character as the tilt rose, which read as the camera
           zooming in on its own whenever the player tried to look at the sky.
           Instead the eye now PARKS at the horizon pose (the tilt-90 orbit
           point, `dist` away at pivot height) and only the GAZE keeps
           pitching up — a head turning in place, the way every third-person
           camera handles looking up. Bit-identical at tilt 90 (same eye, same
           aim), so crossing the horizon is seamless. The cinematic sky crane,
           the flyer subject-look and the keep-subject action shots keep their
           own deliberate past-horizon responses. */
        const headTurn = dirY > 1e-4 && !skyCrane && !subjectLook && !cam._cineKeepSubject;
        const dirHX = -Math.sin(yawRad);
        const dirHZ = -Math.cos(yawRad);
        let eyeX, eyeY, eyeZ;
        if (headTurn) {
            eyeX = pivX - dist * dirHX;
            eyeY = pivY;
            eyeZ = pivZ - dist * dirHZ;
        } else {
            eyeX = pivX - dist * dirX;
            eyeY = pivY - dist * dirY;
            eyeZ = pivZ - dist * dirZ;
        }
        const clear = isTps ? ts * 0.45 : ts * 0.35;

        /* Boom collision — Strike Mode's player-driven third-person rig ONLY
           (cam._tpsCollide). Response = DOLLY IN, exactly like every standard
           third-person shooter: pull the camera in along the boom so it sits
           IN FRONT of the first blocker, in clear air, still looking at the
           character. Partial blockers the spread rays catch are additionally
           made see-through by three-renderer's occlusion fade. */
        /* CINEMATIC shots (cam._cineTps without Strike Mode's per-frame
           controller) deliberately SKIP boom collision: the renderer's
           occlusion fade already makes any terrain/prop between the camera
           and the two shot subjects see-through, so a wall right behind a
           subject should be clipped THROUGH (and faded), not dodged — the
           dolly-in response here slammed those shots into a super-closeup
           whenever the caster or victim stood against a wall/cliff. */
        const skipBoomCollide = !!(cam._cineTps && !cam._tpsCollide);
        if (isTps && !skipBoomCollide) {
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

        /* ══ FLAT FLOOR (2026-09-02) ══
           The floor the eye may never sink below is a PLANE at the SUBJECT's
           own footing — the ground under the character / focal point — NOT
           the terrain under the eye. The old per-frame "lift the eye over
           whatever tile it is above" clamp made a zoomed-in orbit around a
           character SNAP up and down every time the boom swept across a
           raised neighbour: pure jank, and pointless — the renderer's
           occlusion fade already ghosts any terrain/prop between the camera
           and the subject (and a block the eye sits INSIDE is back-face
           culled), so passing the boom THROUGH a hill or wall is the normal,
           standard camera trick. The flat floor only stops the camera from
           diving under the map / the platform the subject stands on.
             • Third-person rigs: the subject's ground.
             • Board / tactical: the lower of the focal height and the ground
               under the focal, so an airborne flyer can still be looked up
               at from ground level, and a hand-pan height latch never bobs
               the floor as the focal crosses hills. */
        const floorBase = isTps ? pivGroundY : Math.min(focalY, focalGroundY);
        const floorY = floorBase + clear;
        if (eyeY < floorY) eyeY = floorY;
        /* ── SKY-GAZE LIFT (cinematic board shots only) ──
           The flat floor parks a sky-gazing eye a mere ⅓ tile over the
           ground, so a programmatic look UP at the sky (the zodiac/celestial
           cinematic, the intro's map-name crane) would be shot from ankle
           height — any raised tile or prop nearby jutting into what should
           be an open-sky view. As the gaze pitches toward the sky, RAISE that
           floor smoothly so the camera ends up hovering well above the
           battlefield looking up at a clean firmament. The ramp starts a
           little BEFORE the horizon so a continuous crane (sky cinematic
           up/down, intro beat 6) glides through the transition instead of
           dipping to the dirt at 90° and popping back up. Hand-held free
           look never takes this (it head-turns instead, above). */
        if (skyCrane && dirY > -0.35) {
            const t01 = Math.min(1, (dirY + 0.35) / 0.8);
            const skyF = t01 * t01 * (3 - 2 * t01);
            const skyBase = Math.max(_groundYWorld(eyeX, eyeZ), focalY);
            const skyFloor = skyBase + clear + ts * 9 * skyF;
            if (eyeY < skyFloor) eyeY = skyFloor;
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
               reticle/framing never jumps. Past the horizon the eye is
               parked (head turn), so the ray is cast FROM THE EYE — at
               tilt 90 both forms are the same ray, hence seamless. */
            const ahead = ts * 2.5;
            if (headTurn) {
                targetLookX = eyeX + dirX * ahead;
                targetLookY = eyeY + dirY * ahead;
                targetLookZ = eyeZ + dirZ * ahead;
            } else {
                targetLookX = pivX + dirX * ahead;
                targetLookY = pivY + dirY * ahead;
                targetLookZ = pivZ + dirZ * ahead;
            }
        } else if (dirY > 1e-4 && !cam._cineKeepSubject) {
            if (subjectLook) {
                /* Raised focal (airborne flyer): NORMAL ORBIT past the
                   horizon — the eye is floored near the ground and the gaze
                   stays pinned to the subject, so craning up frames the
                   flyer against the sky instead of whipping past it into
                   empty firmament. Continuous with the level/down branch
                   below (both aim at the focal). */
                targetLookX = focalX;
                targetLookY = focalY;
                targetLookZ = focalZ;
            } else {
                /* Board free-look (head turn) / cinematic SKY gaze: aim
                   along the view direction FROM THE EYE, not from the ground
                   pivot — with the sky crane an aim point derived from the
                   (ground-level) pivot could land BELOW the raised eye and
                   pitch the camera back down at the terrain; aiming from the
                   eye keeps the gaze direction exactly (dirX,dirY,dirZ).
                   BLENDED in from the focal-aim the level branch uses: a
                   hard switch at 90° flicked the gaze from "at the focal" to
                   "level into the sky" in ONE frame whenever the floor had
                   lifted the eye off the orbit ray. Fully sky-aimed by
                   ~100°, so the cinematic cranes (tilt 164+) are
                   bit-identical. */
                const ahead = ts * 6;
                const bl = Math.min(1, dirY / 0.18);
                const bs = bl * bl * (3 - 2 * bl);
                const sx = eyeX + dirX * ahead;
                const sy = eyeY + dirY * ahead;
                const sz = eyeZ + dirZ * ahead;
                targetLookX = focalX + (sx - focalX) * bs;
                targetLookY = focalY + (sy - focalY) * bs;
                targetLookZ = focalZ + (sz - focalZ) * bs;
            }
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

        /* ── NaN firewall ── _damp() can never recover from a non-finite
           input: NaN carries through `current + (target-current)*factor`
           on every later frame, the view matrix goes NaN, and the whole
           scene renders as black until a reload. If any target went
           non-finite this frame (bad zoom/tilt, poisoned height field…),
           HOLD the last good frame instead of damping toward it; if the
           smoothed state itself is already poisoned, drop _initialized so
           the branch below re-snaps it to the (verified finite) target. */
        if (!isFinite(targetPosX + targetPosY + targetPosZ + targetLookX + targetLookY + targetLookZ)) return;
        if (_initialized && !isFinite(_smoothPosX + _smoothPosY + _smoothPosZ + _smoothLookX + _smoothLookY + _smoothLookZ)) _initialized = false;
        const seeded = _seed ? _consumeSeed(now) : false;   // the seeded frame renders the seed itself
        /* THE ARRIVAL: a swoop whose window elapsed between two frames LANDS here — the deferred lens written, the
           record dropped (it used to linger, and setFOV's guard would then defer every later preset for good) */
        if (_seedFrom && !seeded && !_seedHoldOn && now >= _seedUntil) {
            if (_seedFrom.fov && _seedFrom.fovTo && threeCamera && Math.abs(threeCamera.fov - _seedFrom.fovTo) > 0.01) { threeCamera.fov = _seedFrom.fovTo; threeCamera.updateProjectionMatrix(); }
            _seedFrom = null; _seedCrane = null;
        }

        if (!_initialized) {

            _smoothPosX = targetPosX;
            _smoothPosY = targetPosY;
            _smoothPosZ = targetPosZ;
            _smoothLookX = targetLookX;
            _smoothLookY = targetLookY;
            _smoothLookZ = targetLookZ;
            _initialized = true;
        } else if (!seeded && _seedFrom && (_seedHoldOn || now < _seedUntil) && _seedEase > 0) {
            /* THE SWOOP: the tween from the seed to the ideal (the target may still drift — the blend reads it live) */
            if (_seedHoldOn) { _seedT0 = now; _seedUntil = now + _seedEase; }   // held: the clock starts when the hold lifts
            const u = Math.max(0, Math.min(1, (now - _seedT0) / _seedEase));
            const C = _seedCrane;
            const k = C ? _seedEaseK(u) : u * u * (3 - 2 * u);
            const kl = C ? _seedEaseK(u * C.lookLead) : k;   // the gaze ahead of the body
            /* the bow: the eye's lift over the straight line — a share of its travel (read live: the target may drift) */
            const bow = C && C.bow ? Math.sin(Math.PI * u) * C.bow * Math.hypot(targetPosX - _seedFrom.px, targetPosY - _seedFrom.py, targetPosZ - _seedFrom.pz) : 0;
            _smoothPosX  = _seedFrom.px + (targetPosX  - _seedFrom.px) * k;
            _smoothPosY  = _seedFrom.py + (targetPosY  - _seedFrom.py) * k + bow;
            _smoothPosZ  = _seedFrom.pz + (targetPosZ  - _seedFrom.pz) * k;
            _smoothLookX = _seedFrom.lx + (targetLookX - _seedFrom.lx) * kl;
            _smoothLookY = _seedFrom.ly + (targetLookY - _seedFrom.ly) * kl;
            _smoothLookZ = _seedFrom.lz + (targetLookZ - _seedFrom.lz) * kl;
            if (_seedFrom.fov && threeCamera) {
                const kf = C ? _seedEaseK((u - C.fovLate) / Math.max(0.05, 1 - C.fovLate)) : k;   // the lens tightens late
                const f = _seedFrom.fov + (_seedFrom.fovTo - _seedFrom.fov) * kf;
                if (Math.abs(threeCamera.fov - f) > 0.01) { threeCamera.fov = f; threeCamera.updateProjectionMatrix(); }
            }
            if (u >= 1) { _seedFrom = null; _seedCrane = null; }
        } else if (!seeded) {
            const st = (now < _seedUntil) ? _seedSt : (_smoothOverride > 0 ? SMOOTH_TIME_FAST : SMOOTH_TIME);
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
            /* Occlusion-ghosted blocks (the action-cam / selected-unit fade in
               three-renderer swaps in a transparent clone and tags the mesh
               _ew_occOrig) are see-through ON SCREEN, so they must be
               see-through to the POINTER too — otherwise the ghosted wall in
               front of the camera eats every hover/click aimed at the tiles
               the player can actually see behind it. Skip while mostly faded;
               a block fading back in (>50% opaque) picks normally again. */
            if (ho && ho._ew_occOrig) {
                const fm = Array.isArray(ho.material) ? ho.material[0] : ho.material;
                if (fm && fm.opacity < 0.5) continue;
            }
            /* Props hidden along with their canopy floor (tagged by the
               cutaway in three-renderer) must not eat the pick either — the
               raycaster ignores `visible`, so walk up for the root tag. */
            let anc = ho, cutHidden = false;
            while (anc) {
                if (anc._ew_canopyHiddenObj) { cutHidden = true; break; }
                anc = anc.parent;
            }
            if (cutHidden) continue;
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
        const _ax = (p.x - nx * eps) / ts;
        const _ay = (p.z - nz * eps) / ts;
        const res = {
            tileX: Math.floor(_ax),
            tileY: Math.floor(_ay),
            /* fractional position of the hit WITHIN the tile (0..1 each axis) —
               lets the map editor's wall tool pick the nearest tile EDGE. */
            fracX: _ax - Math.floor(_ax),
            fracY: _ay - Math.floor(_ay),
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
        const _px = pt.x / ts, _py = pt.z / ts;
        return {
            tileX: Math.floor(_px),
            tileY: Math.floor(_py),
            /* same fields as screenToTile so editor edge-picking (wall tool)
               works over empty/void tiles too */
            fracX: _px - Math.floor(_px),
            fracY: _py - Math.floor(_py),
            faceNX: 0, faceNY: 1, faceNZ: 0,
            hitY: pt.y,
            isTerrainHit: true,
            isSideFace: false, sideTileX: null, sideTileY: null
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

    /* THE ENCOUNTER (9.4 seam 2): park the walker's eye as the next frame's start — see the note by _seed */
    function seedPose(seed, easeS) {
        if (!seed || !isFinite(seed.tx + seed.tz + seed.up + seed.dx + seed.dy + seed.dz)) { _seed = null; return false; }
        _seed = { tx: +seed.tx, tz: +seed.tz, up: +seed.up, dx: +seed.dx, dy: +seed.dy, dz: +seed.dz, look: (isFinite(seed.look) && seed.look > 0) ? +seed.look : 3,
                  fov: (isFinite(seed.fov) && seed.fov > 0) ? +seed.fov : null };   // rev 3: the walker's lens — the frame starts at it and the swoop tweens it to the board's
        const ease = (isFinite(easeS) && easeS > 0) ? +easeS : 1.2;
        _seedSt = ease / 3;   // a damp settles ~95 % in three time constants
        _seedEase = ease; _seedFrom = null;
        /* THE ARRIVAL: the crane's shape rides as a third argument { bow, lookLead, fovLate } (see _seedCrane) */
        const co = arguments[2];
        _seedCrane = (co && typeof co === 'object') ? { bow: isFinite(+co.bow) ? Math.max(0, +co.bow) : 0, lookLead: (isFinite(+co.lookLead) && +co.lookLead >= 1) ? +co.lookLead : 1, fovLate: isFinite(+co.fovLate) ? Math.max(0, Math.min(0.9, +co.fovLate)) : 0 } : null;
        _seedUntil = performance.now() / 1000 + ease;
        return true;
    }
    function _consumeSeed(nowS) {
        const S = _seed; _seed = null;
        const ts = tileSize;
        const ex = S.tx * ts, ez = S.tz * ts;
        const ey = _groundYWorld(ex, ez) + S.up * ts;
        const L = S.look * ts;
        const lx = ex + S.dx * L, ly = ey + S.dy * L, lz = ez + S.dz * L;
        if (!isFinite(ex + ey + ez + lx + ly + lz)) { _seedUntil = 0; return false; }
        _smoothPosX = ex; _smoothPosY = ey; _smoothPosZ = ez;
        _smoothLookX = lx; _smoothLookY = ly; _smoothLookZ = lz;
        _initialized = true;
        if (nowS > _seedUntil) _seedUntil = nowS + _seedSt * 3;   // seeded long before the first sync: the ease starts now
        /* THE SWOOP starts from this very frame and lands at the window's end */
        _seedFrom = { px: ex, py: ey, pz: ez, lx: lx, ly: ly, lz: lz, fov: null, fovTo: null }; _seedT0 = nowS; _seedEase = Math.max(0.05, _seedUntil - nowS);
        if (S.fov && threeCamera) { _seedFrom.fov = S.fov; _seedFrom.fovTo = threeCamera.fov; threeCamera.fov = S.fov; threeCamera.updateProjectionMatrix(); }
        return true;
    }
    /* the seed's state for probes: { pending, easing, until } */
    function seedState() { const n = performance.now() / 1000; return { pending: !!_seed, easing: n < _seedUntil, until: _seedUntil, crane: !!_seedCrane }; }

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
        seedHold,
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
        seedPose,
        seedState,
        FOV,
        NEAR,
        FAR
    };
})();
