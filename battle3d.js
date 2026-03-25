// ============================================================
// ENTROPY WARS — 3D BATTLE RENDERER (Phase 1 Proof of Concept)
// A presentation layer that reads existing game state and
// renders an isometric 3D battlefield with cinematic cut-ins.
// ============================================================
// Dependencies: Three.js r128+ (loaded via CDN in HTML)
// Integration: call Battle3D.init(containerEl) then Battle3D.sync(state)
// ============================================================

const Battle3D = (() => {
  'use strict';

  // ── CONFIG ──
  const TILE_SIZE = 1.2;
  const TILE_GAP = 0.08;
  const TILE_HEIGHT = 0.18;
  const UNIT_HEIGHT = 0.9;
  const UNIT_RADIUS = 0.28;
  const CAM_DISTANCE = 14;
  const CAM_ANGLE = Math.PI / 5;    // ~36° from horizontal
  const CAM_ORBIT = Math.PI / 6;    // slight rotation off center
  const CINEMATIC_DURATION = 1800;   // ms for attack cut-in
  const CINEMATIC_HOLD = 600;        // ms to hold on impact before returning

  // ── TERRAIN COLORS ──
  const TERRAIN_COLORS = {
    grass:    { top: 0x4a7a3a, side: 0x3a6030, height: 0 },
    water:    { top: 0x2a6090, side: 0x1a4060, height: -0.12 },
    mountain: { top: 0x6a6a72, side: 0x505058, height: 0.7 },
    desert:   { top: 0xb8a060, side: 0x907840, height: 0.02 }
  };

  const TEAM_COLORS = { 1: 0x4488ff, 2: 0xff4444 };
  const TEAM_EMISSIVE = { 1: 0x2244aa, 2: 0xaa2222 };

  // ── STATE ──
  let scene, camera, renderer, container;
  let tacticalCamera = { target: null, distance: CAM_DISTANCE, angle: CAM_ANGLE, orbit: CAM_ORBIT };
  let tileMeshes = [];        // flat array: [y * boardSize + x]
  let unitMeshes = new Map(); // unitId -> mesh group
  let boardSize = 0;
  let boardCenter = { x: 0, z: 0 };
  let animationId = null;
  let active = false;
  let cinematicActive = false;
  let cinematicQueue = [];
  let savedCameraState = null;
  let clock = null;

  // ── INIT ──
  function init(containerEl) {
    if (!window.THREE) {
      console.warn('Battle3D: Three.js not loaded. Skipping init.');
      return false;
    }
    container = containerEl;
    if (!container) return false;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080c14);
    scene.fog = new THREE.FogExp2(0x080c14, 0.018);

    // Camera
    const aspect = container.clientWidth / Math.max(1, container.clientHeight);
    camera = new THREE.PerspectiveCamera(38, aspect, 0.5, 100);
    updateTacticalCamera();

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);
    renderer.domElement.style.borderRadius = '16px';

    // Lights
    const ambient = new THREE.AmbientLight(0x8090b0, 0.5);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffe8c0, 1.2);
    sun.position.set(8, 14, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 40;
    sun.shadow.camera.left = -12;
    sun.shadow.camera.right = 12;
    sun.shadow.camera.top = 12;
    sun.shadow.camera.bottom = -12;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0x6080c0, 0.3);
    fill.position.set(-6, 8, -4);
    scene.add(fill);

    // Ground plane (subtle)
    const groundGeo = new THREE.PlaneGeometry(60, 60);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x0a0e18, roughness: 0.95 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    clock = new THREE.Clock();
    active = true;

    // Resize handler
    const onResize = () => {
      if (!active || !container || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    animate();
    return true;
  }

  // ── COORDINATE MAPPING ──
  function tileWorldPos(gx, gy) {
    const step = TILE_SIZE + TILE_GAP;
    return {
      x: (gx - (boardSize - 1) / 2) * step,
      z: (gy - (boardSize - 1) / 2) * step
    };
  }

  // ── BUILD BOARD ──
  function buildBoard(terrain, size) {
    // Clear old
    for (const m of tileMeshes) { if (m) scene.remove(m); }
    tileMeshes = [];
    boardSize = size;
    boardCenter = { x: 0, z: 0 };

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const terrainType = terrain?.[y]?.[x] || 'grass';
        const tc = TERRAIN_COLORS[terrainType] || TERRAIN_COLORS.grass;
        const h = TILE_HEIGHT + (tc.height || 0);

        const geo = new THREE.BoxGeometry(TILE_SIZE, Math.max(0.05, h), TILE_SIZE);
        const mat = new THREE.MeshStandardMaterial({
          color: tc.top,
          roughness: 0.85,
          metalness: 0.05,
          flatShading: true
        });
        const mesh = new THREE.Mesh(geo, mat);
        const pos = tileWorldPos(x, y);
        mesh.position.set(pos.x, h / 2 - 0.1, pos.z);
        mesh.receiveShadow = true;
        mesh.castShadow = terrainType === 'mountain';
        mesh.userData = { gx: x, gy: y, terrain: terrainType };

        // Side color tint
        if (terrainType === 'water') {
          mesh.material.emissive = new THREE.Color(0x102030);
          mesh.material.emissiveIntensity = 0.3;
        }

        scene.add(mesh);
        tileMeshes[y * size + x] = mesh;
      }
    }
  }

  // ── UNITS ──
  function createUnitMesh(unit) {
    const group = new THREE.Group();
    const teamColor = TEAM_COLORS[unit.player] || 0xffffff;
    const emissive = TEAM_EMISSIVE[unit.player] || 0x000000;

    // Body capsule
    const bodyGeo = new THREE.CylinderGeometry(UNIT_RADIUS, UNIT_RADIUS * 0.85, UNIT_HEIGHT, 8);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: teamColor,
      roughness: 0.6,
      metalness: 0.15,
      emissive: emissive,
      emissiveIntensity: 0.15,
      flatShading: true
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = UNIT_HEIGHT / 2;
    body.castShadow = true;
    group.add(body);

    // Head sphere
    const headGeo = new THREE.SphereGeometry(UNIT_RADIUS * 0.7, 6, 5);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xf0d8b0,
      roughness: 0.7,
      flatShading: true
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = UNIT_HEIGHT + UNIT_RADIUS * 0.35;
    head.castShadow = true;
    group.add(head);

    // Team ring at base
    const ringGeo = new THREE.RingGeometry(UNIT_RADIUS * 1.1, UNIT_RADIUS * 1.4, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: teamColor, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    group.add(ring);

    // HP bar (billboard)
    const barWidth = TILE_SIZE * 0.7;
    const barGeo = new THREE.PlaneGeometry(barWidth, 0.08);
    const barBgMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a, transparent: true, opacity: 0.8 });
    const barBg = new THREE.Mesh(barGeo, barBgMat);
    barBg.position.y = UNIT_HEIGHT + UNIT_RADIUS * 1.3;
    group.add(barBg);

    const hpPct = Math.max(0, Math.min(1, (unit.hp || 1) / (unit.maxHp || 1)));
    const hpGeo = new THREE.PlaneGeometry(barWidth * hpPct, 0.06);
    const hpColor = hpPct > 0.5 ? 0x55d38a : hpPct > 0.25 ? 0xf8d66d : 0xff6b6b;
    const hpMat = new THREE.MeshBasicMaterial({ color: hpColor });
    const hpBar = new THREE.Mesh(hpGeo, hpMat);
    hpBar.position.y = UNIT_HEIGHT + UNIT_RADIUS * 1.3;
    hpBar.position.x = -(barWidth * (1 - hpPct)) / 2;
    hpBar.name = 'hpBar';
    group.add(hpBar);

    // Dead units
    if (unit.dead) {
      group.rotation.z = Math.PI / 2;
      group.position.y = -0.2;
      body.material.opacity = 0.3;
      body.material.transparent = true;
      head.material.opacity = 0.3;
      head.material.transparent = true;
    }

    group.userData = { unitId: unit.id, player: unit.player, cls: unit.cls };
    return group;
  }

  function syncUnits(units) {
    if (!scene) return;
    const currentIds = new Set();

    for (const unit of units) {
      currentIds.add(unit.id);
      let mesh = unitMeshes.get(unit.id);

      if (!mesh) {
        mesh = createUnitMesh(unit);
        scene.add(mesh);
        unitMeshes.set(unit.id, mesh);
      }

      // Update position
      const pos = tileWorldPos(unit.x, unit.y);
      const tileIdx = unit.y * boardSize + unit.x;
      const tile = tileMeshes[tileIdx];
      const baseY = tile ? (tile.position.y + TILE_HEIGHT / 2) : 0;

      if (!unit.dead) {
        mesh.position.set(pos.x, baseY, pos.z);
        mesh.rotation.z = 0;
        mesh.visible = true;
      } else {
        mesh.position.set(pos.x, baseY - 0.15, pos.z);
        mesh.rotation.z = Math.PI / 2.5;
        mesh.visible = true;
      }

      // Update HP bar
      const hpBar = mesh.getObjectByName('hpBar');
      if (hpBar && unit.maxHp) {
        const pct = Math.max(0, Math.min(1, unit.hp / unit.maxHp));
        const barWidth = TILE_SIZE * 0.7;
        hpBar.geometry.dispose();
        hpBar.geometry = new THREE.PlaneGeometry(barWidth * pct, 0.06);
        hpBar.position.x = -(barWidth * (1 - pct)) / 2;
        const col = pct > 0.5 ? 0x55d38a : pct > 0.25 ? 0xf8d66d : 0xff6b6b;
        hpBar.material.color.setHex(col);
      }
    }

    // Remove units no longer in state
    for (const [id, mesh] of unitMeshes) {
      if (!currentIds.has(id)) {
        scene.remove(mesh);
        unitMeshes.delete(id);
      }
    }
  }

  // ── TACTICAL CAMERA ──
  function updateTacticalCamera(centerX, centerZ) {
    if (!camera) return;
    const cx = centerX ?? boardCenter.x;
    const cz = centerZ ?? boardCenter.z;
    const d = tacticalCamera.distance;
    const a = tacticalCamera.angle;
    const o = tacticalCamera.orbit;

    camera.position.set(
      cx + d * Math.cos(a) * Math.sin(o),
      d * Math.sin(a),
      cz + d * Math.cos(a) * Math.cos(o)
    );
    camera.lookAt(cx, 0.5, cz);
  }

  function focusTacticalCamera(gx, gy, smooth = true) {
    const pos = tileWorldPos(gx, gy);
    // For smooth: we'll just snap for now (phase 2 would lerp)
    updateTacticalCamera(pos.x, pos.z);
  }

  // ── CINEMATIC CAMERA ──
  function playCinematic(actorUnit, targetUnit, actionType, onComplete) {
    if (!scene || !camera || cinematicActive) {
      if (onComplete) onComplete();
      return;
    }

    cinematicActive = true;

    // Save current camera
    savedCameraState = {
      pos: camera.position.clone(),
      lookAt: boardCenter
    };

    const actorPos = tileWorldPos(actorUnit.x, actorUnit.y);
    const targetPos = tileWorldPos(targetUnit.x, targetUnit.y);
    const midX = (actorPos.x + targetPos.x) / 2;
    const midZ = (actorPos.z + targetPos.z) / 2;

    // Direction from actor to target
    const dx = targetPos.x - actorPos.x;
    const dz = targetPos.z - actorPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz) || 1;
    const nx = dx / dist;
    const nz = dz / dist;

    // Perpendicular for over-shoulder offset
    const px = -nz;
    const pz = nx;

    const startTime = performance.now();
    const totalMs = CINEMATIC_DURATION + CINEMATIC_HOLD;

    // Determine camera template
    const isRanged = actionType === 'ranged' || actionType === 'spell';
    const isMelee = actionType === 'melee' || actionType === 'attack';
    const isSupport = actionType === 'heal' || actionType === 'support';

    // VFX: attack flash
    let flashMesh = null;
    const flashTime = CINEMATIC_DURATION * 0.6;

    function cinematicFrame() {
      if (!cinematicActive || !renderer) return;

      const elapsed = performance.now() - startTime;
      const t = Math.min(1, elapsed / CINEMATIC_DURATION);

      // Smooth ease
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      let camX, camY, camZ, lookX, lookY, lookZ;

      if (isMelee) {
        // Chase camera: starts behind actor, swings to side at impact
        camX = actorPos.x - nx * 3 * (1 - ease) + px * 2.5 * ease;
        camY = 2.0 + ease * 0.5;
        camZ = actorPos.z - nz * 3 * (1 - ease) + pz * 2.5 * ease;
        lookX = actorPos.x * (1 - ease) + targetPos.x * ease;
        lookY = 0.8;
        lookZ = actorPos.z * (1 - ease) + targetPos.z * ease;
      } else if (isRanged) {
        // Over-shoulder: stays behind actor, framing target
        camX = actorPos.x - nx * 2.5 + px * 1.8;
        camY = 2.2;
        camZ = actorPos.z - nz * 2.5 + pz * 1.8;
        lookX = targetPos.x;
        lookY = 0.7 + (1 - ease) * 0.5;
        lookZ = targetPos.z;
      } else {
        // Support: two-shot from the side
        camX = midX + px * 4;
        camY = 2.5;
        camZ = midZ + pz * 4;
        lookX = midX;
        lookY = 0.6;
        lookZ = midZ;
      }

      camera.position.set(camX, camY, camZ);
      camera.lookAt(lookX, lookY, lookZ);

      // Attack flash effect at 60% through
      if (elapsed >= flashTime && !flashMesh) {
        const flashGeo = new THREE.SphereGeometry(0.5, 8, 6);
        const flashMat = new THREE.MeshBasicMaterial({
          color: isSupport ? 0x55ff88 : 0xffaa44,
          transparent: true,
          opacity: 0.9
        });
        flashMesh = new THREE.Mesh(flashGeo, flashMat);
        flashMesh.position.set(targetPos.x, 0.8, targetPos.z);
        scene.add(flashMesh);
      }

      // Fade flash
      if (flashMesh) {
        const flashElapsed = elapsed - flashTime;
        const flashT = Math.min(1, flashElapsed / 400);
        flashMesh.material.opacity = Math.max(0, 0.9 * (1 - flashT));
        flashMesh.scale.setScalar(1 + flashT * 2);
        if (flashT >= 1) {
          scene.remove(flashMesh);
          flashMesh.geometry.dispose();
          flashMesh.material.dispose();
          flashMesh = null;
        }
      }

      // Hold phase — keep camera still
      if (elapsed < totalMs) {
        animationId = requestAnimationFrame(cinematicFrame);
      } else {
        // Return to tactical
        cinematicActive = false;
        if (savedCameraState) {
          camera.position.copy(savedCameraState.pos);
          updateTacticalCamera();
          savedCameraState = null;
        }
        if (flashMesh) {
          scene.remove(flashMesh);
          flashMesh.geometry.dispose();
          flashMesh.material.dispose();
          flashMesh = null;
        }
        if (onComplete) onComplete();
      }
    }

    cinematicFrame();
  }

  // ── PROJECTILE ──
  function playProjectile3D(fromUnit, toUnit, kind, durationMs, onImpact) {
    if (!scene) { if (onImpact) onImpact(); return; }

    const from = tileWorldPos(fromUnit.x, fromUnit.y);
    const to = tileWorldPos(toUnit.x, toUnit.y);

    const geo = new THREE.SphereGeometry(0.12, 6, 4);
    const color = kind === 'heal' ? 0x55ff88 : kind === 'spell' ? 0xaa66ff : 0xffaa44;
    const mat = new THREE.MeshBasicMaterial({ color });
    const proj = new THREE.Mesh(geo, mat);
    proj.position.set(from.x, 1.0, from.z);
    scene.add(proj);

    const startTime = performance.now();
    const dur = durationMs || 500;

    function step() {
      const t = Math.min(1, (performance.now() - startTime) / dur);
      const ease = t;
      proj.position.x = from.x + (to.x - from.x) * ease;
      proj.position.z = from.z + (to.z - from.z) * ease;
      proj.position.y = 1.0 + Math.sin(t * Math.PI) * 1.5; // arc

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        scene.remove(proj);
        proj.geometry.dispose();
        proj.material.dispose();
        if (onImpact) onImpact();
      }
    }
    step();
  }

  // ── TILE HIGHLIGHTS ──
  let highlightMeshes = [];
  function clearHighlights() {
    for (const m of highlightMeshes) scene.remove(m);
    highlightMeshes = [];
  }

  function highlightTiles(tiles, color = 0x4488ff, opacity = 0.25) {
    clearHighlights();
    for (const { x, y } of tiles) {
      const pos = tileWorldPos(x, y);
      const tileIdx = y * boardSize + x;
      const tile = tileMeshes[tileIdx];
      const baseY = tile ? tile.position.y + TILE_HEIGHT / 2 + 0.01 : 0.01;

      const geo = new THREE.PlaneGeometry(TILE_SIZE * 0.92, TILE_SIZE * 0.92);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(pos.x, baseY, pos.z);
      scene.add(mesh);
      highlightMeshes.push(mesh);
    }
  }

  // ── MAIN RENDER LOOP ──
  function animate() {
    if (!active || !renderer || !scene || !camera) return;
    animationId = requestAnimationFrame(animate);

    // Gentle idle bob for units
    if (!cinematicActive) {
      const t = clock ? clock.getElapsedTime() : 0;
      for (const [id, mesh] of unitMeshes) {
        if (mesh.userData.dead) continue;
        const baseY = mesh.position.y;
        // Very subtle breath effect
        mesh.children.forEach((child, i) => {
          if (child.name === 'hpBar') return;
          if (i === 0) { // body
            child.scale.y = 1 + Math.sin(t * 1.5 + mesh.position.x) * 0.015;
          }
        });
      }
    }

    renderer.render(scene, camera);
  }

  // ── SYNC FROM GAME STATE ──
  function sync(gameState) {
    if (!scene || !active) return;

    const bs = gameState.boardSize || 8;
    const terrain = gameState.boardTerrain;
    const units = gameState.units || [];

    // Rebuild board if size changed
    if (bs !== boardSize) {
      buildBoard(terrain, bs);
    }

    syncUnits(units);

    // Focus on active unit if available
    const activeUnit = units.find(u => u.id === gameState.selectedUnitId && !u.dead);
    if (activeUnit && !cinematicActive) {
      focusTacticalCamera(activeUnit.x, activeUnit.y);
    }
  }

  // ── ACTION PACKET SYSTEM ──
  // Creates a structured event from a resolved action
  function createActionPacket(actor, target, type, result) {
    return {
      actorId: actor?.id,
      actorPos: actor ? { x: actor.x, y: actor.y } : null,
      targetId: target?.id,
      targetPos: target ? { x: target.x, y: target.y } : null,
      actionType: type,      // 'attack', 'spell', 'heal', 'combo', 'item'
      damage: result?.damage || 0,
      heal: result?.heal || 0,
      crit: result?.crit || false,
      killed: result?.killed || false,
      statusApplied: result?.statusApplied || [],
      spellName: result?.spellName || null,
      damageType: result?.damageType || 'physical',
      timestamp: performance.now()
    };
  }

  // Play a full action sequence: cinematic → projectile → return
  function playAction(packet, onComplete) {
    if (!active || cinematicActive) {
      if (onComplete) onComplete();
      return;
    }

    const actor = packet.actorPos ? { x: packet.actorPos.x, y: packet.actorPos.y } : null;
    const target = packet.targetPos ? { x: packet.targetPos.x, y: packet.targetPos.y } : null;
    if (!actor || !target) { if (onComplete) onComplete(); return; }

    const type = packet.actionType || 'attack';
    const isRanged = type === 'spell' || type === 'ranged';
    const isSupport = type === 'heal' || type === 'support';

    playCinematic(
      { x: actor.x, y: actor.y },
      { x: target.x, y: target.y },
      isSupport ? 'support' : isRanged ? 'ranged' : 'melee',
      onComplete
    );
  }

  // ── CAMERA CONTROLS ──
  function zoomIn() { tacticalCamera.distance = Math.max(6, tacticalCamera.distance - 2); updateTacticalCamera(); }
  function zoomOut() { tacticalCamera.distance = Math.min(24, tacticalCamera.distance + 2); updateTacticalCamera(); }
  function orbitLeft() { tacticalCamera.orbit -= 0.15; updateTacticalCamera(); }
  function orbitRight() { tacticalCamera.orbit += 0.15; updateTacticalCamera(); }
  function resetCamera() {
    tacticalCamera.distance = CAM_DISTANCE;
    tacticalCamera.angle = CAM_ANGLE;
    tacticalCamera.orbit = CAM_ORBIT;
    updateTacticalCamera();
  }

  // ── CLEANUP ──
  function destroy() {
    active = false;
    if (animationId) cancelAnimationFrame(animationId);
    if (renderer) {
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    }
    // Dispose geometries and materials
    for (const m of tileMeshes) {
      if (m) { m.geometry?.dispose(); m.material?.dispose(); }
    }
    for (const [, m] of unitMeshes) {
      m.traverse(child => { child.geometry?.dispose(); child.material?.dispose(); });
    }
    tileMeshes = [];
    unitMeshes.clear();
    scene = null;
    camera = null;
    renderer = null;
    container = null;
  }

  function isActive() { return active; }
  function isCinematicPlaying() { return cinematicActive; }

  // ── PUBLIC API ──
  return {
    init,
    sync,
    destroy,
    isActive,
    isCinematicPlaying,
    playCinematic,
    playProjectile3D,
    playAction,
    createActionPacket,
    highlightTiles,
    clearHighlights,
    focusTacticalCamera,
    zoomIn,
    zoomOut,
    orbitLeft,
    orbitRight,
    resetCamera
  };
})();
