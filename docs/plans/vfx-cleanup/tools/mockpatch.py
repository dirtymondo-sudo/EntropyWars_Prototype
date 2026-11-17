# TEMPORARY mock-up patch for the plan's "after" frames. Never committed.
p='/home/user/EntropyWars_Prototype/three-vfx-effects.js'; s=open(p).read()
def rep(a,b,cnt=1):
    global s
    assert s.count(a)>=1, a[:80]
    s=s.replace(a,b,cnt)
Q="{bladeWaltz:1,dragonSlash:1,swordBeam:1}"
# 1 stage burst: quiet
a="""        var cfg2 = _cfg(), ts = cfg2.tileSize || 128;
        var p = _post();
        /* physical hits land with impact language"""
rep(a, a.replace("var p = _post();","var p = _post();\n        if (("+Q+")[spellId]) { _stageGrade(spellId, 'burst', params, info); if (T.shake && typeof window.shakeBoard === 'function') _shake(T.shake); return; }"))
# 2 noise wash + wind pass skip
rep("        if (!el || !_NZ[el] || d.type !== 'damage') return;","        if (!el || !_NZ[el] || d.type !== 'damage') return;\n        if (("+Q+")[spellId]) return;")
rep("        var d = _spellDefFor(spellId); if (!d || d.element !== 'wind') return;","        var d = _spellDefFor(spellId); if (!d || d.element !== 'wind') return;\n        if (("+Q+")[spellId]) return;")
# 3 crescent glint off on request
rep("            glintMat.opacity = Math.max(0, 1 - t * 1.8);","            glintMat.opacity = opts.noGlint ? 0 : Math.max(0, 1 - t * 1.8);")
# 4 blade waltz: no white crescent, no white end burst
rep("                        color: s3 === 2 ? 0xffffff : color,","                        color: color, noGlint: true,")
rep("""                _sigShockRing3D(tx, ty, { color: color, r1: ts * 1.6 });
                _sigSpeedBurst3D(tx, ty, { color: 0xffffff });
                _sigScreenFlash('#bbddff', 120, 0.18);""","")
# 5 slash combo heavy finisher: no white
rep("""                        _sigScreenFlash('#ffffff', 120, opts.flashPeak != null ? opts.flashPeak : 0.26);""","""                        if (!opts.vcClean) _sigScreenFlash('#ffffff', 120, opts.flashPeak != null ? opts.flashPeak : 0.26);""")
rep("""                        _sigSpeedBurst3D(tx, ty, { color: 0xffffff });
                        _sigSpeedLinesFx({ color: _sigCss(color), ms: 340, peak: 0.3 });""","""                        if (!opts.vcClean) { _sigSpeedBurst3D(tx, ty, { color: 0xffffff });
                        _sigSpeedLinesFx({ color: _sigCss(color), ms: 340, peak: 0.3 }); }""")
rep("""                            color: 0xffffff, yaw: hYaw + 1.1, dir: -p.dir, ms: 300, size: ts * 1.3,""","""                            color: opts.vcClean ? color : 0xffffff, noGlint: !!opts.vcClean, yaw: hYaw + 1.1, dir: -p.dir, ms: 300, size: ts * 1.3,""")
rep("""            ringTiles: 1.9, flashPeak: 0.3,
        }); },""","""            ringTiles: 1.9, flashPeak: 0.3, vcClean: true,
        }); },""")
# 6 blade tiles without flash / sparks
rep("""    EFFECTS['bladeWaltz_aoe']  = { aoeRadius: 1, impactTileEffect: 'guardSlash_impact' };""","""    EFFECTS['vcBladeTile'] = { layers: (EFFECTS['guardSlash_impact'].layers || []).filter(function (L) { return L.sprite !== 'flash' && L.sprite !== 'steel-spark'; }) };
    EFFECTS['bladeWaltz_aoe']  = { aoeRadius: 1, impactTileEffect: 'vcBladeTile' };""")
rep("""                                   impactTileEffect: 'guardSlash_impact' };
    SPELL_MAP['swordBeam']""","""                                   impactTileEffect: 'vcBladeTile', vcNoLaser: true };
    SPELL_MAP['swordBeam']""")
# 7 no laser / charge flash
rep("        if (chargeMs > 0) {\n            var cPx = tilePx(fromX, fromY);","        if (chargeMs > 0 && !beamDef.vcNoLaser) {\n            var cPx = tilePx(fromX, fromY);")
rep("            var _laserOk = _spawnLaserBeam3D(fromX, fromY, _lastTile.x, _lastTile.y, {","            var _laserOk = beamDef.vcNoLaser ? true : _spawnLaserBeam3D(fromX, fromY, _lastTile.x, _lastTile.y, {")
# 8 sword wave: the swordmaster's orange-red, no white core
a="""        var color = 0x99ccff;
        var g = new THREE.Group();
        g.position.set(fw.x, fw.y + ts * 0.7, fw.z);"""
rep(a, a.replace("0x99ccff","0xff5a2a"))
rep("        var coreMat = _sigMat(0xffffff, { map: _sigCrescentTex() });\n        var core = new THREE.Mesh(new THREE.PlaneGeometry(ts * 1.0, ts * 1.0), coreMat);\n        core.rotation.z = Math.PI / 2;","        var coreMat = _sigMat(0xffa060, { map: _sigCrescentTex() });\n        var core = new THREE.Mesh(new THREE.PlaneGeometry(ts * 1.0, ts * 1.0), coreMat);\n        core.rotation.z = Math.PI / 2;")
open(p,'w').write(s); print('patched')
