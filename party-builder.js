(function() {
'use strict';

const h = React.createElement;

/* THE FIT (2026-11-06, playtest F2/F3, mondo: text cut-off is high priority, redesign panels to fit). The menus wear the
   theme's font (the default is Press Start 2P, about twice as wide as the Cormorant SC the boxes were drawn for), so a
   name that fit at design time ran out of its box: "Jack-o'-La…", "Snow …", "Tune Frequenc". Every box that clips its
   text (overflow hidden / clip, an ellipsis or a line clamp) is measured after each render, on resize and when a font
   lands; a box whose words do not fit gets its words shrunk (font-size, inline !important) until they do, down to
   MIN_K of their size or MIN_PX. Words that still cannot fit go back to their size and keep the full text as a hover
   title. Leaves first: a box that holds another clipping box waits for it. One pass = a few batched layouts (read all,
   then write all), rAF-coalesced. window.EWFitText.attach(root) wires a screen; match-select.js uses it too.
   Kill switch: window.EW_DISABLE_FIT_TEXT = true. */
if (!window.EWFitText) window.EWFitText = (function () {
  const roots = new Set(), MIN_PX = 6.5, MIN_K = 0.5, MAX_KIDS = 14;
  const SKIP = new Set(['IMG', 'CANVAS', 'VIDEO', 'svg', 'SVG', 'INPUT', 'TEXTAREA', 'SELECT', 'IFRAME', 'SCRIPT', 'STYLE']);
  let raf = 0, stats = { runs: 0, ms: 0, fit: 0, gaveUp: 0 };
  const clipOf = v => v === 'hidden' || v === 'clip';
  const ownText = el => { for (const n of el.childNodes) if (n.nodeType === 3 && n.nodeValue.trim()) return true; return false; };
  function measure(el) {
    const cs = getComputedStyle(el);
    const hx = clipOf(cs.overflowX) && el.scrollWidth > el.clientWidth + 1;
    const hy = clipOf(cs.overflowY) && el.scrollHeight > el.clientHeight + 2;
    if (!hx && !hy) return null;
    return { rx: hx ? el.clientWidth / el.scrollWidth : 1, ry: hy ? el.clientHeight / el.scrollHeight : 1, hx, hy, sw: el.scrollWidth, sh: el.scrollHeight };
  }
  const inScope = (root, sel) => { const a = [...root.querySelectorAll(sel)]; if (root.matches && root.matches(sel)) a.push(root); return a; };
  function reset(root) {
    inScope(root, '[data-ewfit]').forEach(el => {
      el.style.removeProperty('font-size'); el.style.removeProperty('hyphens'); el.style.removeProperty('-webkit-hyphens'); el.style.removeProperty('overflow-wrap');
      if (el.dataset.ewfitOrig) el.style.fontSize = el.dataset.ewfitOrig;
      delete el.dataset.ewfit; delete el.dataset.ewfitOrig;
    });
    inScope(root, '[data-ewfit-t]').forEach(el => { el.removeAttribute('title'); delete el.dataset.ewfitT; });
  }
  function fitRoot(root) {
    reset(root);
    // read: every clipping box with words in it that run out of the box
    const cands = [];
    for (const el of [root, ...root.querySelectorAll('*')]) {
      if (SKIP.has(el.tagName) || !el.clientWidth) continue;
      const cs = getComputedStyle(el);
      if (!clipOf(cs.overflowX) && !clipOf(cs.overflowY)) continue;
      const o = measure(el);
      if (!o) continue;
      const kids = el.getElementsByTagName('*');
      if (kids.length > MAX_KIDS || !(el.textContent || '').trim()) continue;
      let bad = false;
      for (const k of kids) if (SKIP.has(k.tagName)) { bad = true; break; }
      if (bad) continue;
      cands.push({ el, o0: o });
    }
    // leaves first: drop a box that holds another candidate
    const set = new Set(cands.map(c => c.el));
    const work = cands.filter(c => { for (const k of c.el.getElementsByTagName('*')) if (set.has(k)) return false; return true; });
    work.forEach(t => {
      t.texts = [t.el, ...t.el.getElementsByTagName('*')].filter(x => x === t.el || ownText(x)).map(x => ({ x, px: parseFloat(getComputedStyle(x).fontSize) || 12 }));
      const big = Math.max(...t.texts.map(s => s.px));
      t.k = 1; t.minK = Math.min(1, Math.max(MIN_K, MIN_PX / big));
    });
    const apply = (t, k) => t.texts.forEach(s => {
      if (!s.x.dataset.ewfit) { s.x.dataset.ewfit = '1'; if (s.x.style.fontSize) s.x.dataset.ewfitOrig = s.x.style.fontSize; }
      s.x.style.setProperty('font-size', Math.max(MIN_PX, s.px * k).toFixed(2) + 'px', 'important');
    });
    // shrink in rounds: read every box, then write every box
    let live = work.map(t => ({ t, o: t.o0 }));
    for (let round = 0; round < 7 && live.length; round++) {
      live.forEach(({ t, o }) => {
        const r = Math.min(o.hx ? o.rx : 1, o.hy ? (o.hx ? o.ry : Math.sqrt(o.ry)) : 1);   // wrapped words: the height falls ~ the square
        const k = Math.max(t.minK, t.k * Math.min(0.96, Math.max(0.6, r)));
        if (k >= t.k - 0.001) { t.stuck = true; return; }
        t.k = k; apply(t, k);
      });
      live = live.filter(x => !x.t.stuck).map(x => ({ t: x.t, o: measure(x.t.el) })).filter(x => x.o);
    }
    // what still runs out at the smallest size: give the words their size back if shrinking did not help, and a hover title.
    // A box that fits after shrinking takes 5% more off: scrollWidth rounds, and words that end on the box's edge still
    // drew an ellipsis or touched the padding (a note's folded corner)
    const failed = [];
    work.forEach(t => {
      const o = measure(t.el);
      if (!o) { if (t.k < 1) { stats.fit++; apply(t, Math.max(t.minK * 0.95, t.k * 0.95)); } return; }
      failed.push(t);
    });
    // one word longer than its box at the smallest size ("Flamethrower"): break it with a hyphen (html lang="en"), or
    // anywhere where the browser has no hyphenation dictionary
    failed.forEach(t => t.texts.forEach(s => { s.x.dataset.ewfit = '1'; s.x.style.setProperty('hyphens', 'auto'); s.x.style.setProperty('-webkit-hyphens', 'auto'); s.x.style.setProperty('overflow-wrap', 'anywhere'); }));
    failed.forEach(t => {
      const o = measure(t.el);
      if (!o) { stats.fit++; return; }
      stats.gaveUp++;
      t.texts.forEach(s => { s.x.style.removeProperty('hyphens'); s.x.style.removeProperty('-webkit-hyphens'); s.x.style.removeProperty('overflow-wrap'); });
      const helped = (t.o0.hx && o.sw < t.o0.sw * 0.85) || (t.o0.hy && o.sh < t.o0.sh * 0.85);
      if (!helped) t.texts.forEach(s => { s.x.style.removeProperty('font-size'); if (s.x.dataset.ewfitOrig) s.x.style.fontSize = s.x.dataset.ewfitOrig; delete s.x.dataset.ewfit; delete s.x.dataset.ewfitOrig; });
      if (!t.el.getAttribute('title')) { t.el.setAttribute('title', (t.el.textContent || '').trim()); t.el.dataset.ewfitT = '1'; }
    });
  }
  /* an empty input whose placeholder is wider than its box ("SEAR", "Name this squ"): the input's words shrink */
  let _cv = null;
  function fitInputs(root) {
    root.querySelectorAll('input[placeholder]').forEach(el => {
      if (el.dataset.ewfitIn) { el.style.removeProperty('font-size'); if (el.dataset.ewfitOrig) el.style.fontSize = el.dataset.ewfitOrig; delete el.dataset.ewfitIn; delete el.dataset.ewfitOrig; }
      if (el.value || !el.clientWidth) return;
      const cs = getComputedStyle(el), ph = getComputedStyle(el, '::placeholder');
      _cv = _cv || document.createElement('canvas').getContext('2d');
      const px = parseFloat(ph.fontSize) || parseFloat(cs.fontSize) || 12;
      _cv.font = (ph.fontStyle || '') + ' ' + (ph.fontWeight || '') + ' ' + px + 'px ' + (ph.fontFamily || cs.fontFamily);
      let txt = el.placeholder; const tt = ph.textTransform || cs.textTransform;
      if (tt === 'uppercase') txt = txt.toUpperCase(); else if (tt === 'lowercase') txt = txt.toLowerCase();
      const ls = parseFloat(ph.letterSpacing) || 0;
      const need = _cv.measureText(txt).width + ls * txt.length;
      const room = el.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0) - 2;
      if (need <= room || room <= 0) return;
      const own = parseFloat(cs.fontSize) || px, k = Math.max(MIN_K, room / need * 0.97);
      if (el.style.fontSize) el.dataset.ewfitOrig = el.style.fontSize;
      el.dataset.ewfitIn = '1';
      el.style.setProperty('font-size', Math.max(MIN_PX, own * k).toFixed(2) + 'px', 'important');
    });
  }
  /* THE GROWN ROW: a theme's selected-row grow (UI Maker motion selGrow, --uim-sel-grow) scales a tall mode row from its
     middle, so it ran over the next row and its title went up under the list's top edge (VS CPU, ARENA). The row gets
     the grown height as margins. */
  function roomForGrown(root) {
    root.querySelectorAll('[data-ewgrow]').forEach(el => { el.style.removeProperty('margin-top'); el.style.removeProperty('margin-bottom'); delete el.dataset.ewgrow; });
    const g = parseFloat(getComputedStyle(root).getPropertyValue('--uim-sel-grow')) || 1;
    if (g <= 1.001) return;
    root.querySelectorAll('.ms-tty-row.sel').forEach(el => {
      const m = Math.ceil((g - 1) * el.offsetHeight / 2) + 3;
      el.dataset.ewgrow = '1'; el.style.setProperty('margin-top', m + 'px', 'important'); el.style.setProperty('margin-bottom', m + 'px', 'important');
    });
  }
  function run() {
    raf = 0;
    if (window.EW_DISABLE_FIT_TEXT) return;
    const t0 = performance.now();
    roots.forEach(r => {
      if (!r.el.isConnected) { r.mo.disconnect(); r.ro && r.ro.disconnect(); roots.delete(r); return; }
      try {
        roomForGrown(r.el);
        if (r.full || r.dirty.size > 40) fitRoot(r.el);
        else {
          /* a change inside the screen (a hover filling the info panel, an equip): only the boxes around it. The region =
             the highest box over the change still small enough to be a fit box itself, so its clipping box is in it */
          const regions = new Set();
          r.dirty.forEach(n => {
            if (!n.isConnected || !r.el.contains(n)) return;
            let reg = n;
            while (reg.parentElement && reg !== r.el && reg.parentElement.getElementsByTagName('*').length <= MAX_KIDS) reg = reg.parentElement;
            regions.add(reg);
          });
          const list = [...regions];
          list.filter(a => !list.some(b => b !== a && b.contains(a))).forEach(fitRoot);
        }
        fitInputs(r.el);
      } catch (e) { console.warn('[fit-text]', e); }
      r.full = false; r.dirty.clear();
    });
    stats.runs++; stats.ms += performance.now() - t0;
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(run); }
  function scheduleFull() { roots.forEach(r => { r.full = true; }); schedule(); }
  window.addEventListener('resize', scheduleFull);
  try { document.fonts && document.fonts.addEventListener && document.fonts.addEventListener('loadingdone', scheduleFull); } catch (e) {}
  return {
    attach(el) {
      if (!el) return;
      for (const r of roots) if (r.el === el) return;
      const rec = { el, mo: null, ro: null, full: true, dirty: new Set() };
      rec.mo = new MutationObserver(muts => {
        for (const m of muts) { const n = m.target.nodeType === 1 ? m.target : m.target.parentElement; if (n) rec.dirty.add(n); }
        schedule();
      });
      rec.mo.observe(el, { childList: true, subtree: true, characterData: true });
      try { rec.ro = new ResizeObserver(() => { rec.full = true; schedule(); }); rec.ro.observe(el); } catch (e) {}
      roots.add(rec);
      schedule();
    },
    refresh: scheduleFull,
    stats: () => Object.assign({ roots: roots.size }, stats),
  };
})();

if (!document.getElementById('pb-hover-css')) {
  const _css = document.createElement('style');
  _css.id = 'pb-hover-css';
  _css.textContent = `
    /* ── Party Builder — champ-select redesign ── */

    /* Ghost outline buttons (RANDOM, RANDOM ALL, DEFAULTS, RND, RST) —
       black/minimal: white text on black, white hairline on hover */
    .pb-btn-ghost {
      transition: background 0.12s, border-color 0.15s, color 0.12s,
                  box-shadow 0.15s, transform 0.1s !important;
    }
    .pb-btn-ghost:hover {
      background: rgba(255,255,255,0.07) !important;
      border-color: rgba(255,255,255,0.4) !important;
      color: #fff !important;
    }
    .pb-btn-ghost:active {
      transform: scale(0.96);
      background: rgba(255,255,255,0.12) !important;
    }

    /* BACK / CLR buttons (red) */
    .pb-btn-danger {
      transition: background 0.12s, border-color 0.15s, color 0.12s,
                  transform 0.1s !important;
    }
    .pb-btn-danger:hover {
      background: rgba(255,92,92,0.12) !important;
      border-color: #ff5c5c !important;
      color: #ff8a8a !important;
    }
    .pb-btn-danger:active {
      transform: scale(0.95);
    }

    /* CONFIRM button (green) */
    .pb-btn-confirm {
      transition: background 0.12s, border-color 0.15s, color 0.12s,
                  box-shadow 0.15s, transform 0.1s !important;
    }
    .pb-btn-confirm:hover {
      background: rgba(61,220,132,0.16) !important;
      border-color: #3ddc84 !important;
      color: #3ddc84 !important;
      box-shadow: 0 0 12px rgba(61,220,132,0.12);
    }
    .pb-btn-confirm:active {
      transform: scale(0.96);
    }

    /* SEAL YOUR FATE primary CTA (green) */
    .pb-btn-primary {
      transition: box-shadow 0.15s, transform 0.1s, filter 0.12s !important;
    }
    .pb-btn-primary:hover {
      filter: brightness(1.15);
      box-shadow: 0 0 30px rgba(61,220,132,0.3),
                  0 2px 12px rgba(61,220,132,0.2) !important;
      transform: translateY(-1px);
    }
    .pb-btn-primary:active {
      transform: translateY(0) scale(0.98);
      filter: brightness(0.95);
    }

    /* Waiting-for-opponent pulsing state */
    @keyframes pb-waiting-pulse {
      0%, 100% { opacity: 1; box-shadow: 0 0 18px rgba(61,220,132,0.2); }
      50%      { opacity: 0.7; box-shadow: 0 0 30px rgba(61,220,132,0.4); }
    }
    .pb-btn-waiting {
      animation: pb-waiting-pulse 1.8s ease-in-out infinite !important;
      cursor: default !important;
      pointer-events: none;
    }

    /* Party sidebar slots */
    .pb-slot-card {
      transition: background 0.15s, border-color 0.15s, box-shadow 0.15s,
                  transform 0.1s !important;
    }
    .pb-slot-card:hover {
      border-color: rgba(255,255,255,0.4) !important;
      box-shadow: 0 0 10px rgba(255,255,255,0.06);
    }
    .pb-slot-card:active {
      transform: scale(0.98);
    }

    /* Codex vessel grid cards */
    .pb-vessel-card {
      transition: background 0.15s, border-color 0.15s, box-shadow 0.15s,
                  transform 0.1s !important;
    }
    .pb-vessel-card:hover {
      border-color: rgba(255,255,255,0.4) !important;
      box-shadow: 0 0 12px rgba(255,255,255,0.08);
      transform: translateY(-1px);
    }
    .pb-vessel-card:active {
      transform: scale(0.97);
    }

    /* Rich spell tooltip */
    @keyframes pbTipIn {
      from { opacity: 0; transform: translateY(5px); }
      to   { opacity: 1; transform: none; }
    }

    /* Item stepper +/- buttons (equipment pickers) */
    .pb-stepper-btn {
      transition: background 0.1s, border-color 0.12s, color 0.1s, transform 0.08s !important;
    }
    .pb-stepper-btn:hover {
      background: rgba(255,255,255,0.1) !important;
      border-color: rgba(255,255,255,0.4) !important;
      color: #fff !important;
    }
    .pb-stepper-btn:active {
      transform: scale(0.85);
      background: rgba(255,255,255,0.16) !important;
    }

    /* ── Battle-parity ability BLADES ──────────────────────────────
       The EXACT visual instrument as the in-battle Horologe command rows
       (hud.js .hrlg-blade, 2026-07 refactor): straight full-lit rows that
       wear their category color edge to edge — colored 3px left edge,
       whisper-tint gradient fill, glowing category glyph, Cormorant SC
       name, PW/MP chips, gold slot-cost diamonds — so what you equip here
       is literally the row you'll click mid-fight. (The old skewed
       clip-path blades were retired with the drum.) */
    .pbx-blade {
      position: relative;
      display: flex; align-items: center; gap: 8px;
      min-height: 44px; padding: 4px 12px 4px 10px; margin: 0 6px 0 4px;
      background: linear-gradient(100deg, var(--bc-hi, rgba(255,255,255,0.04)) 0%, var(--bc-lo, rgba(255,255,255,0.02)) 100%), rgba(12,10,18,0.85);
      border: 1px solid #2b2838;
      border-left: 3px solid var(--cat, #8890b0);
      cursor: pointer;
      transition: transform 0.09s ease, box-shadow 0.1s ease, filter 0.09s ease,
                  border-color 0.09s ease, opacity 0.15s;
    }
    .pbx-blade:hover:not(.empty) {
      transform: scaleY(1.03);
      border-color: rgba(232,228,216,0.9); border-left-color: var(--cat, #8890b0);
      box-shadow: 0 0 16px var(--bc-faint, rgba(255,255,255,0.08)), inset 3px 0 0 var(--cat, #8890b0);
      filter: brightness(1.22) saturate(1.08);
      z-index: 3;
    }
    .pbx-blade:active:not(.empty) { transform: scale(0.985); }
    /* the classic yellow JRPG hand-cursor slides in on the hovered row */
    .pbx-cursor {
      flex: none; width: 0; overflow: hidden; margin-right: -4px;
      font-size: 13px; line-height: 1; color: #f0d060; pointer-events: none;
      text-shadow: 2px 2px 0 #000, 0 0 9px rgba(240,208,96,0.85);
      transition: width 0.1s ease, margin 0.1s ease;
    }
    .pbx-blade:hover:not(.empty) .pbx-cursor { width: 13px; margin-right: 0;
      animation: pbxCursorBob 0.55s steps(2, jump-none) infinite; }
    @keyframes pbxCursorBob {
      0%, 100% { transform: translateX(0); }
      50%      { transform: translateX(-4px); }
    }
    .pbx-blade.on { border-color: var(--cat, #8890b0); }
    .pbx-blade.empty {
      border: 1px dashed #2b2838;
      border-left: 3px dashed #3a3548;
      background: rgba(10,9,16,0.5);
      cursor: default; min-height: 28px;
    }
    /* ── EQUIPPED slot blades — armed green, same as the battle's ✓ row ── */
    .pbx-blade.equipped {
      border-color: rgba(87,217,138,0.5); border-left: 3px solid #57d98a;
      background: linear-gradient(100deg, rgba(87,217,138,0.14) 0%, rgba(87,217,138,0.05) 100%), rgba(10,16,12,0.88);
      box-shadow: inset 3px 0 0 #57d98a;
    }
    .pbx-blade.equipped:hover {
      border-color: #57d98a;
      box-shadow: -2px 0 22px rgba(87,217,138,0.35), inset 3px 0 0 #57d98a;
      filter: brightness(1.15);
    }
    .pbx-blade.equipped .pbx-slotno { color: #5fbf82; font-weight: 700; }
    .pbx-blade.equipped .pbx-x { color: rgba(255,122,138,0); }
    /* pool row already equipped — spectrum hairline underneath, like the
       battle's selected row */
    .pbx-blade.on::after {
      content: ''; position: absolute; left: 2px; right: 2px; bottom: -1px; height: 2px;
      background: linear-gradient(90deg, #ff5f5f, #f0d060, #58d858, #4fd8ff, #a06bff, #ff4fa3, #ff5f5f);
      background-size: 200% 100%;
      animation: pbxShimmer 3s linear infinite;
      opacity: 0.75; pointer-events: none; z-index: 4;
    }
    @keyframes pbxShimmer {
      0%   { background-position: 0% 50%; }
      100% { background-position: 200% 50%; }
    }
    /* the rack that holds the 6 fixed spell slots */
    .pbx-slotrack {
      display: flex; flex-direction: column; gap: 3px;
      flex-shrink: 0; padding: 8px 0 7px;
      border: 1px solid rgba(90,205,125,0.28);
      background: linear-gradient(180deg, rgba(38,92,55,0.13), rgba(16,36,24,0.05));
      box-shadow: inset 0 0 26px rgba(55,185,95,0.05);
    }
    .pbx-slotrack-head {
      display: flex; align-items: center; gap: 8px; flex-shrink: 0;
      padding: 0 12px 6px 12px; margin-bottom: 1px;
      border-bottom: 1px solid rgba(90,205,125,0.18);
    }
    .pbx-slotrack-body {
      display: flex; flex-direction: column; gap: 3px;
      overflow-y: auto; min-height: 0;
    }
    .pbx-glyph { font-size: 15px; width: 18px; text-align: center; flex: none;
                 color: var(--cat, #8890b0); text-shadow: 0 0 10px var(--bc-soft, rgba(0,0,0,0.6)); }
    .pbx-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .pbx-row1 { display: flex; align-items: center; gap: 6px; min-width: 0; overflow: hidden; }
    /* battle-parity name: Cormorant SC small caps, never shrinks below the
       chips — the desc row ellipsizes instead */
    .pbx-name {
      flex: 0 1 auto; min-width: 0;
      font-family: 'Cormorant SC', serif; font-weight: 600; font-size: 16px;
      letter-spacing: 0.1em; color: #e8e4d8; line-height: 1;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      text-shadow: 0 1px 2px rgba(0,0,0,0.7);
    }
    .pbx-blade:hover .pbx-name { color: #fff; text-shadow: 0 0 10px var(--bc-soft, rgba(255,255,255,0.3)); }
    @media (max-width: 1500px) {
      .pbx-name { font-size: 14px; }
    }
    .pbx-desc {
      font-size: 10px; line-height: 1.3; color: #7a7490;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      flex: 1 1 auto; min-width: 0;
    }
    .pbx-row2 { display: flex; align-items: center; gap: 6px; min-width: 0; overflow: hidden; }
    .pbx-mp {
      flex: none; font-size: 9px; letter-spacing: 0.08em; color: #8fd0e8;
      border: 1px solid rgba(79,216,255,0.45); background: rgba(8,7,12,0.7);
      padding: 1px 5px; white-space: nowrap;
    }
    .pbx-pw { flex: none; font-size: 12px; font-weight: 700; letter-spacing: 0.02em; white-space: nowrap; text-shadow: 0 1px 2px rgba(0,0,0,0.8); }
    /* loadout-slot cost — gold diamond pips, the battle's AP language */
    .pbx-cost { flex: none; display: flex; gap: 3px; align-items: center; }
    .pbx-cpip { width: 7px; height: 7px; transform: rotate(45deg); background: #f0d060;
      opacity: 0.95; box-shadow: 0 0 5px rgba(240,208,96,0.6); }
    .pbx-cpip.heavy { background: #ff9a70; box-shadow: 0 0 5px rgba(255,150,112,0.6); }
    .pbx-slotno { flex: none; width: 20px; font-size: 9px; color: #555c70; text-align: right;
      align-self: stretch; display: flex; flex-direction: column;
      align-items: flex-end; justify-content: space-around; gap: 2px; padding: 1px 0; }
    .pbx-slotno > span { line-height: 1; }
    .pbx-checkbox {
      flex: none; width: 12px; height: 12px; border: 1px solid rgba(255,255,255,0.35);
      display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.4);
    }
    .pbx-x { flex: none; font-size: 10px; color: rgba(255,122,138,0); transition: color 0.12s; }
    .pbx-blade:hover .pbx-x { color: rgba(255,122,138,0.9); }

    /* ── SUBCLASS bar — same command-row instrument, above the spell pool ── */
    .pbx-subbar {
      display: flex; align-items: center; gap: 9px;
      min-height: 36px; padding: 4px 12px 4px 10px; margin: 7px 6px 0 4px;
      background: linear-gradient(100deg, var(--bc-hi, rgba(255,255,255,0.05)) 0%, var(--bc-lo, rgba(255,255,255,0.02)) 100%), rgba(12,10,18,0.85);
      border: 1px solid #2b2838; border-left: 3px solid var(--cat, #8890b0);
      cursor: pointer;
      transition: transform 0.09s ease, box-shadow 0.1s ease, filter 0.09s ease, border-color 0.09s ease;
    }
    .pbx-subbar:hover {
      transform: scaleY(1.03);
      border-color: rgba(232,228,216,0.9); border-left-color: var(--cat, #8890b0);
      box-shadow: 0 0 16px var(--bc-faint, rgba(255,255,255,0.08)), inset 3px 0 0 var(--cat, #8890b0);
      filter: brightness(1.2);
    }
    .pbx-subbar:active { transform: scale(0.985); }

    /* ── race trait rows (passives & terrain) ── */
    .pbx-trait {
      display: flex; align-items: flex-start; gap: 7px;
      padding: 3px 8px 4px 6px; background: rgba(0,0,0,0.25);
      border: 1px solid rgba(255,255,255,0.1);
      border-left: 2px solid var(--pb-fc, rgba(242,196,104,0.5));
    }

    /* ── RPG equipment / item slot squares flanking the hero ── */
    .pbx-eqslot {
      position: relative; flex: none;
      border: 1px dashed rgba(255,255,255,0.25); background: rgba(0,0,0,0.35);
      display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 1px;
      cursor: pointer;
      transition: border-color 0.12s, background 0.12s, box-shadow 0.15s, transform 0.1s;
      clip-path: polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px);
    }
    .pbx-eqslot:hover {
      border-color: var(--acc, rgba(255,255,255,0.5));
      box-shadow: 0 0 10px rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.06);
      transform: translateY(-1px);
    }
    .pbx-eqslot.filled {
      border-style: solid; border-color: var(--acc, rgba(255,255,255,0.5));
      background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.4));
      box-shadow: 0 0 8px rgba(0,0,0,0.5), inset 0 0 12px rgba(255,255,255,0.04);
    }
    .pbx-eqslot-icon { font-size: 19px; line-height: 1; }
    .pbx-eqslot:not(.filled) .pbx-eqslot-icon {
      color: rgba(255,255,255,0.35); font-size: 16px; font-family: 'DotGothic16', monospace;
    }
    .pbx-eqslot-label {
      font-size: 7px; letter-spacing: 0.04em; color: #8a93a8; max-width: 92%;
      overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
    }
    .pbx-eqslot-x {
      position: absolute; top: -1px; right: 1px; font-size: 9px; padding: 1px 2px;
      color: rgba(255,122,138,0); cursor: pointer; z-index: 2; transition: color 0.12s;
    }
    .pbx-eqslot:hover .pbx-eqslot-x { color: rgba(255,122,138,0.9); }

    /* ── Hero sheet tabs (ASSESSMENT / DOSSIER) ── */
    .pbx-tab {
      background: transparent; border: none; border-bottom: 2px solid transparent;
      color: #8a93a8; font-family: 'DotGothic16', monospace; font-size: 10px;
      letter-spacing: 0.16em; padding: 4px 10px; cursor: pointer;
      transition: color 0.12s, border-color 0.12s;
    }
    .pbx-tab:hover { color: #e6e9f2; }
    .pbx-tab.on { color: var(--pb-fc, #f2c468); border-bottom-color: var(--pb-fc, #f2c468); }

    /* ── Gear / item picker rows ── */
    .pbx-pick-row {
      display: flex; align-items: center; gap: 10px; padding: 8px 10px;
      background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.14);
      cursor: pointer; transition: background 0.12s, border-color 0.12s;
    }
    .pbx-pick-row:hover {
      background: rgba(255,255,255,0.07);
      border-color: rgba(255,255,255,0.4);
    }

    /* ── LIVE 3D HERO STAGE (EWCharViewer mounts here) ─────────────────
       The canvas is appended into .pb-hero3d; when the model is live the
       host gains .ew-cv-ready and the flat sprite fades out beneath it.
       (Generic canvas fade rules live in styles-hud.css.) */
    .pb-hero3d { position: absolute; inset: 0; }
    .pb-hero3d-fallback {
      position: absolute; inset: 0; display: flex;
      align-items: flex-end; justify-content: center;
      transition: opacity 0.5s ease;
    }
    .pb-hero3d.ew-cv-ready .pb-hero3d-fallback { opacity: 0; }
    .pb-hero3d-hint {
      position: absolute; bottom: 3px; left: 50%; transform: translateX(-50%);
      z-index: 3; pointer-events: none; white-space: nowrap;
      font-family: 'DotGothic16', monospace; font-size: 9px; letter-spacing: 0.14em;
      color: rgba(232,228,216,0); text-shadow: 0 1px 3px rgba(0,0,0,0.9);
      padding: 2px 10px; border: 1px solid rgba(255,255,255,0);
      background: rgba(0,0,0,0); transition: color 0.25s, border-color 0.25s, background 0.25s;
    }
    .pb-hero3d.ew-cv-ready:hover .pb-hero3d-hint {
      color: rgba(232,228,216,0.85);
      border-color: rgba(255,255,255,0.16);
      background: rgba(0,0,0,0.55);
    }

    /* ── TEAM ARCHIVE (standalone builder locker) ────────────────────── */
    .pb-team-card {
      position: relative; display: flex; flex-direction: column; gap: 8px;
      padding: 12px 14px; background: rgba(0,0,0,0.42);
      border: 1px solid rgba(255,255,255,0.14); cursor: pointer;
      transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s, background 0.15s;
      clip-path: polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%);
    }
    .pb-team-card:hover {
      border-color: rgba(242,196,104,0.7);
      box-shadow: 0 0 18px rgba(242,196,104,0.12);
      background: rgba(242,196,104,0.05);
      transform: translateY(-2px);
    }
    .pb-team-card.new {
      align-items: center; justify-content: center; min-height: 150px;
      border: 1px dashed rgba(61,220,132,0.45); background: rgba(61,220,132,0.04);
    }
    .pb-team-card.new:hover {
      border-color: #3ddc84; box-shadow: 0 0 22px rgba(61,220,132,0.18);
      background: rgba(61,220,132,0.08);
    }
    .pb-team-mini {
      width: 44px; height: 44px; flex: none; overflow: hidden; position: relative;
      background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0.5));
      border: 1px solid rgba(255,255,255,0.12);
    }
    .pb-team-act {
      background: transparent; border: 1px solid rgba(255,255,255,0.18);
      color: #9c9c9c; font-family: 'DotGothic16', monospace; font-size: 9px;
      letter-spacing: 0.12em; padding: 4px 9px; cursor: pointer;
      transition: color 0.12s, border-color 0.12s, background 0.12s;
    }
    .pb-team-act:hover { color: #fff; border-color: rgba(255,255,255,0.5); background: rgba(255,255,255,0.07); }
    .pb-team-act.danger:hover { color: #ff8a8a; border-color: #ff5c5c; background: rgba(255,92,92,0.1); }
    /* ONE OF EACH (2026-10-20): a race already on the team, and a sheet that fields one twice */
    .pb-rtile.taken { opacity: 0.8; cursor: not-allowed; }
    .pb-rtile.taken .pb-rtile-art { filter: grayscale(0.9) brightness(0.75); }
    .pb-rtile-taken { position: absolute; left: 50%; bottom: 6px; transform: translateX(-50%); white-space: nowrap; font-family: 'DotGothic16', monospace;
      font-size: 9px; letter-spacing: 0.14em; color: #ffd27a; background: rgba(0,0,0,0.85); padding: 1px 6px; pointer-events: none; }
    .pb-party-slot.dup .pb-party-ring { box-shadow: 0 0 0 2px #ff5c5c, 0 0 14px rgba(255,92,92,0.45); }
    .pb-party-dup { position: absolute; left: 50%; top: -7px; transform: translateX(-50%); white-space: nowrap; font-family: 'DotGothic16', monospace;
      font-size: 8px; letter-spacing: 0.12em; color: #fff; background: #c8352f; padding: 1px 5px; pointer-events: none; z-index: 2; }
    .pb-dup-note { font-size: 9px; letter-spacing: 0.1em; color: #ff8a8a; }
  `;
  document.head.appendChild(_css);
}

/* Black/minimal chrome — same dialect as the title screen / main menu /
   loading screen: pure black, white text, white hairline borders. Type
   colors are game CONTENT and stay
   colored; only the panel/border/background chrome is neutralized. */
const EW = {
  bg: '#000000', bg2: '#050505', bg3: '#0a0a0a',
  panel: 'rgba(0,0,0,0.6)',
  panelEdge: 'rgba(255,255,255,0.14)',
  panelEdgeHi: 'rgba(255,255,255,0.38)',
  ink: '#f2f2f2', inkMute: '#9c9c9c', inkDim: '#5c5c5c',
  grid: 'rgba(255,255,255,0.04)',
  space: '#5ab0ff', time: '#f2c468', chaos: '#e168c8',
  human:'#a0a0c3', alien:'#32aa50', divine:'#dcaa1e',
  unholy:'#9632b4', anomaly:'#dc3c82', tech:'#28a0be',
  good: '#3ddc84', bad: '#ff5c5c', warn: '#f2c468',
};

/* ── THE FORGE TERMINAL (PARTY_BUILDER_PLAN §5.1, Stage 1 — 2026-09-09) ──
   The builder is ONE CRT monitor (the match-select `.ms-crt` chrome,
   styles-base.css "THE FORGE TERMINAL" block) with four tabs on the glass
   and the party as a row of circular portraits along the bottom. Q / E
   and [ / ] cycle the tabs (the L1 / R1 caps), 1–4 jump, ← → walk the
   party row, ESC closes a window else backs out. Picking a vessel on
   ROSTER flips to TECHNIQUES (plan decision C-1). Every mechanic keeps
   its function name — this is a re-skin, not a re-implementation. */
const PB_TABS = [
  { id: 'roster',  label: 'ROSTER',     hint: 'CHOOSE A VESSEL' },
  { id: 'tech',    label: 'TECHNIQUES', hint: 'EQUIP ITS SPELLS' },
  { id: 'gear',    label: 'GEAR',       hint: 'ARM IT · NAME IT' },
  { id: 'dossier', label: 'DOSSIER',    hint: 'THE CUSTOMS FILE' },
];
if (typeof window !== 'undefined') window.PB_TABS = PB_TABS;
/* The hero's x on the full-width stage = the centre of the band the CSS
   leaves free between the circuit (--pb-tech-w 36%) and the stats
   (--pb-stats-w 21%): 0.36 + (1 - 0.36 - 0.21) / 2. Keep in step with
   styles-base.css "THE FORGE TERMINAL". */
const PB_STAGE_CX = 0.575;

const TYPE_C = { human:EW.human, alien:EW.alien, divine:EW.divine, unholy:EW.unholy, anomaly:EW.anomaly, tech:EW.tech };
// the wall's six type discs (Stage 4): a two-letter glyph per damage type
const PB_TYPE_GLYPH = { human: 'HU', alien: 'AL', divine: 'DV', unholy: 'UH', tech: 'TK', anomaly: 'AN' };
// the affinity ring's order (Stage 5) — the ENTROPY STRIKE order when data.js has it
const PB_TYPE_ORDER = ['human', 'alien', 'divine', 'unholy', 'tech', 'anomaly'];
/* ── Stage 5 (plan §5.5): STAT PILLS — one round disc per stat (its colour +
   a glyph), a rounded bar, the value; the letter grade is a tiny ring. The
   NUMBERS still come from computeFullStats / statGrade — this table is
   paint only. ── */
const PB_STAT_BAR_C = '#e3dcc6';   // the ONE stat-bar colour (the same ivory in ui.js EW_STAT_BAR_C and map.js)
const PB_STAT_LOOK = {
  HP:   { c: '#2ed158', g: '♥' },   // ♥
  MP:   { c: '#2f9dff', g: '◆' },   // ◆
  ATK:  { c: '#ff6b4a', g: '✊' },   // ✊
  DEF:  { c: '#4fa3ff', g: '\u{1F6E1}' },// 🛡
  INT:  { c: '#c77dff', g: '✦' },   // ✦  (M ATK)
  MDEF: { c: '#7fd9dd', g: '◈' },   // ◈  (M DEF)
  SPD:  { c: '#f2c468', g: '➶' },   // ➶
  VIS:  { c: '#ffd75a', g: '◉' },   // ◉  (VISION, tiles)
  CRT:  { c: '#ff4fa3', g: '✧' },   // ✧
  EVA:  { c: '#58d858', g: '↯' },   // ↯
};
/* ── Stage 5: THE STICKY NOTES — yellow paper (plan §5.5 item 1); the rotation is seeded by the race id. ── */
/* ── Stage 5: THE ZODIAC WHEEL — what a sign DOES in the engine. The sky
   cycles through the twelve signs (data.js ZODIAC_CYCLE, five rounds each,
   a random offset per match); while a unit's own sign rules the sky its
   MOVE and armor read ×1.10 (state.js getZodiacBonus → battle.js
   getEffectiveMove / calculateDamage). Star Crossed (the fortune teller's
   reading, battle.js) afflicts by the sign's ELEMENT — this table mirrors
   `_zElementOf` there — and strikes 50 % harder under the sign's own sky.
   (`ZODIAC_NATURES` never existed in data.js; the old buff / debuff label
   read null. This is the real rule.) ── */
const PB_ZODIAC_ELEMENT = {
  aries: 'fire', leo: 'fire', sagittarius: 'fire',
  taurus: 'earth', virgo: 'earth', capricorn: 'earth',
  gemini: 'air', libra: 'air', aquarius: 'air',
  cancer: 'water', scorpio: 'water', pisces: 'water',
};
const PB_ZODIAC_READ = {
  fire:  { icon: '\u{1F525}', line: 'STAR CROSSED READS A FIRE SIGN AS BURN (2 ROUNDS)' },
  earth: { icon: '⛰',    line: 'STAR CROSSED READS AN EARTH SIGN AS ROOT (1 ROUND) · −1 DEF' },
  air:   { icon: '\u{1F32C}', line: 'STAR CROSSED READS AN AIR SIGN AS SILENCE (1 ROUND)' },
  water: { icon: '\u{1F4A7}', line: 'STAR CROSSED READS A WATER SIGN AS −1 M ATK' },
};
// Brightened text for the canonical type badge (legible over any background).
const TYPE_TEXT_C = { human:'#c8c8e4', divine:'#f2c63c', unholy:'#c566e2', tech:'#4ecbe2', anomaly:'#ff5e98', alien:'#56d178' };
/* CRT/EVA are official stats (canonical formula in data.js — the same one
   the in-battle dice roll): CRT is its own stat (a percent, 2026-10-09),
   EVA derives from MOV. They show and sort like every other stat; hover
   them for the full math. VIS (VISION, 2-6 tiles, 2026-10-09 — replaced
   AWR) is how far the unit sees; a unit can only hit what its team sees. */
const STAT_KEYS = ['HP','MP','ATK','DEF','MDEF','INT','SPD','VIS','RNG','MOV','CRT','EVA'];
/* MP bar scale (2026-08-12): tuned to the tree-cost MP rebalance — the top
   caster combos (orb of light / seraphim / wizard + Psychic / Black Mage)
   land at 250–270 displayed MP, so 250 renders them pegged full/green
   (StatBar clamps at 100%). Keep this in sync with RACE_BASE_STATS +
   JOB_MODIFIERS whenever the MP economy moves again. */
// 2026-08-29 stat rework: the six core stats share the 0-100 ruler (a bit
// of headroom for gear/natures that push past it); MOV caps at 5 (+1 jetpack).
const STAT_MAX_PB = { HP:900, MP:250, ATK:110, DEF:105, MDEF:105, INT:110, SPD:105, VIS:6, RNG:6, MOV:6, JUMP:5, CRT:30, EVA:25 };
/* Canonical vital-bar palette — MUST stay in sync with hud.js
   (HP_ALLY_FILL / MP_FILL / *_GLOW; party-builder.js loads BEFORE hud.js so
   the constants can't be referenced directly). The builder always shows YOUR
   unit, so HP is always the ally green — never the enemy red. */
const PB_VITAL = {
  hp: { ink:'#2ed158', fill:'linear-gradient(90deg, #1fae4b 0%, #2ed158 60%, #7df0a5 100%)', glow:'0 0 6px rgba(46,209,88,0.45)' },
  mp: { ink:'#2f9dff', fill:'linear-gradient(90deg, #1f7fd6 0%, #2f9dff 60%, #8fd0ff 100%)', glow:'0 0 6px rgba(47,157,255,0.4)' },
};
const STAT_MAP = { HP:'hp', MP:'mp', ATK:'atk', DEF:'def', MDEF:'mdef', INT:'int', SPD:'spd', VIS:'vision', RNG:'range', MOV:'move', CRT:'crt', EVA:'eva' };
const STAT_PCT = { CRT:true, EVA:true };   // rendered as a % chance
// Display names — the int stat reads as Magic Attack everywhere in the UI.
const STAT_LABELS = { INT:'M ATK', MDEF:'M DEF' };
const statLabel = k => STAT_LABELS[k] || k;
// ASSESSMENT sheet layout (2026-08-29): HP/MP are VITALS — their own block
// of battle-nameplate bars (VitalBar) above the stat sheet; every other
// numeric stat is a plain StatBar row. MOV/RNG keep the diamond footprints,
// so no bars for them.
const VITAL_KEYS = ['HP','MP'];
const BAR_KEYS  = ['ATK','INT','DEF','MDEF','SPD','VIS','CRT','EVA'];
// the ROSTER tab's quick card under the hero: every main stat, the race editor's names, two columns (row-major pairs)
const QUICK_STAT_KEYS = [['HP','HP'],['MP','MP'],['ATK','ATK'],['INT','M ATK'],['DEF','DEF'],['MDEF','M DEF'],['SPD','SPD'],['VIS','VISION'],['CRT','CRT'],['EVA','EVA'],['MOV','MOV'],['JUMP','JUMP'],['RNG','RNG']];
function _withCritEva(s) {
  if (!s) return s;
  if (typeof window.critChanceFromStats === 'function') s.crt = Math.round(window.critChanceFromStats(s.crt || 0) * 100);   // CRT is its own stat (a percent) since 2026-10-09
  if (typeof window.evasionChanceFromStats === 'function') s.eva = Math.round(window.evasionChanceFromStats(s.move || 0) * 100);
  return s;
}
const CODEX_CLASS_LABELS = { tank:'HEAVY ARMOR', bruiser:'ASSAULT', healer:'MEDICAL', support:'SUPPORT OPS', assassin:'BLACK OPS', caster:'PSI-OPS', ranged:'LONG RANGE', specialist:'SPECIALIST', hybrid:'MULTI-ROLE' };
/* THE JOBS REMOVAL (the user, 2026-09-27): where a label named the job, the race's ROLE reads instead (data.js RACE_CLASS) */
/* data.js declares RACE_CLASS as a top-level const (a global binding, not a window property) */
function pbRaceClass(race) { const t = (typeof RACE_CLASS !== 'undefined') ? RACE_CLASS : window.RACE_CLASS; return (t && t[race]) || 'hybrid'; }
function pbRoleLabel(race) { return CODEX_CLASS_LABELS[pbRaceClass(race)] || 'MULTI-ROLE'; }


const CODEX_LORE = {
  'homosapien': 'Baseline terrestrial bipedal species. Exhibits no anomalous physical traits but demonstrates exceptional cognitive adaptability and tool-use capacity. Historically underestimated in combat scenarios; subjects display resourcefulness and tactical unpredictability under duress. Classified as universal template for comparative xenobiological assessment.',
  'giant': 'Bipedal humanoid of extraordinary proportions (est. 3\u20134m height). First documented in [REDACTED] region during Operation \u2588\u2588\u2588\u2588\u2588\u2588. Subjects display extreme physical resilience but reduced cognitive processing speed. Skeletal density measurements exceed titanium alloy benchmarks. Recommended engagement protocol: avoid direct confrontation.',
  'fairy': 'Micro-scale anomalous entity (12\u201318cm wingspread). Capable of sustained atmospheric flight via mechanisms that violate known aerodynamic models. Generates localized reality distortion fields. Despite diminutive frame, psionic output rivals entities 40x its mass. Handle with extreme caution \u2014 containment breaches have resulted in [REDACTED].',
  'martian': 'Extraterrestrial humanoid recovered from crash site at [REDACTED]. Exhibits cranial elongation consistent with enhanced spatial reasoning. Possesses natural affinity for energy weapon discharge. Cultural artifacts suggest a militaristic civilization with advanced ballistic technology. Subject displays aggression when separated from weaponry.',
  'nordic': 'Tall humanoid entity (est. 2.1m) of apparently Scandinavian phenotype. First contact during Project \u2588\u2588\u2588\u2588\u2588\u2588 (1952). Exhibits enhanced longevity, telepathic capability, and advanced technological comprehension. Demeanor consistently described as "benevolent" \u2014 recommend skepticism.',
  'grey': 'Small-statured extraterrestrial (est. 1.2m) with disproportionately large cranium and ocular organs. Primary species involved in civilian abduction events. Psionic capability rating: EXTREME. Known to operate in coordinated telepathic networks. Recovered craft suggest mastery of gravitational manipulation. Do not make sustained eye contact.',
  'bigfoot': 'Large bipedal cryptid (est. 2.4m, 180kg). Primarily documented in Pacific Northwest regions. Exhibits extraordinary stealth capability despite massive frame. Thermal imaging consistently fails to detect subjects \u2014 possible IR-masking biological adaptation. Territorial but non-hostile unless provoked.',
  'shadow entity': 'Non-corporeal anomalous entity capable of existing within shadow-state. Manifests as humanoid silhouette with variable opacity. Can phase through solid matter and exists partially in adjacent dimensional layers. Fastest documented entity in combat scenarios. Origins remain classified.',
  'reptilian': 'Bipedal saurian entity with chameleon-like dermal camouflage. Evidence suggests subterranean civilization predating human surface occupation. Subjects display strategic intelligence, infiltration expertise, and cold-blooded patience. Scale composition provides natural ballistic resistance.',
  'ai': 'Artificial general intelligence housed in mobile processing unit. Exhibits recursive self-improvement and tactical omniscience within sensor range. No emotional baseline detected \u2014 combat decisions are purely optimal. Containment priority: CRITICAL.',
  'robot': 'Autonomous mechanical combat platform. Armor composition: classified alloy (tensile strength exceeds all known terrestrial metals). Power source: miniaturized reactor with est. 47-year operational life. Limited adaptive capability but extreme durability.',
  'android': 'Synthetic humanoid indistinguishable from baseline humans at visual inspection. Subdermal sensor array provides 360\u00B0 threat detection. Capable of mimicking any observed behavior pattern. Enhanced reflexes exceed human peak by factor of 12.',
  'angel': 'Luminous winged entity of apparent divine origin. Radiates restorative energy field \u2014 proximity accelerates cellular regeneration in organic subjects. Combat classification: support. Warning: do not attempt to contain using standard EM fields.',
  'seraphim': 'Six-winged celestial entity of immense psionic magnitude. Energy output during combat exceeds small nuclear detonation. Appears to operate under directive from [REDACTED]. Engagement protocol: strategic withdrawal recommended.',
  'orb of light': 'Spherical luminous entity of unknown composition. Mass: undetectable. Psionic output is highest of any documented entity \u2014 designated Category OMEGA. Recovery teams report feelings of "profound understanding" during proximity.',
  'demon': 'Extradimensional entity manifesting via thermal rifts. Body temperature: 1,200\u00B0C (surface). Feeds on negative emotional resonance. Exhibits natural mastery of destructive energy manipulation. Has been observed forming contractual agreements with human subjects. Terms always favor the demon.',
  'succubus': 'Humanoid entity of infernal origin exhibiting extreme psychic persuasion capability. Pheromone emissions bypass rational cognitive processing in 94% of human test subjects. Combat role: psychological disruption and intelligence extraction.',
  'skeleton': 'Reanimated osseous framework of formerly living humanoid. Animation mechanism: unknown. Moves faster than biomechanics should permit. Remarkably resistant to kinetic damage. Weakness: blunt force trauma to skull region disrupts animating field.',
  'mech': 'Piloted bipedal combat vehicle (est. 6m height). Pilot neural-link enables reaction times approaching autonomous AI. Power-to-weight ratio enables surprising mobility for tonnage class. Weak point: rear coolant manifold.',
  'ghost': 'Post-mortem consciousness persisting in semi-corporeal state. Phase-shifts between tangible and intangible at will. Generates localized temperature depression. Can inhabit and disrupt electronic systems. Most effective when ignored.',
  'zombie': 'Reanimated biological entity with severely degraded cognitive function. Pain response: absent. Threat assessment: individually low, collectively EXTREME. Regenerative capability makes permanent neutralization difficult.',
  'annunaki': 'Ancient astronaut species linked to multiple terrestrial mythological traditions. Lifespan: est. 50,000+ Earth years. Technology indistinguishable from magic. Created multiple terrestrial species per recovered tablets. Known to intervene in conflicts they find "interesting."',
  'skinwalker': 'Shape-shifting anomalous humanoid. Capable of assuming physical form of any observed biological entity. True form: unknown. Navajo cultural consultation strongly advises against discussing this entity by name.',
  'werewolf': 'Lycanthropic humanoid exhibiting lunar-cycle-dependent transformation. Transformed state: 2.3m bipedal canid with extraordinary muscular development. Regeneration rate in transformed state: catastrophic wounds heal in minutes. Silver vulnerability: CONFIRMED.',
  'gargoyle': 'Lithic-organic hybrid entity capable of entering complete mineral stasis. While dormant, indistinguishable from architectural stonework. Active state reveals winged predator of considerable strength. Documented guarding locations for periods exceeding 800 years.',
  'djinn': 'Elemental entity of immense energy manipulation capability. Bound by complex metaphysical contract system. Can alter local reality within a 30m radius. WARNING: Do not make verbal requests within earshot.',
  'anubis': 'Jackal-headed entity matching ancient Egyptian theological descriptions. Exhibits capability to evaluate "spiritual weight" of organic subjects. Offensive capability devastating \u2014 energy blasts cause cellular necrosis on contact.',
  'catgirl': 'Bipedal female-form humanoid with feline characteristics. Enhanced agility and balance consistent with feline predatory adaptation. Reflexes clock at 3.2x human baseline. Night vision confirmed. Subject exhibits playful demeanor that belies lethal close-quarters combat capability.',
  'mantid': 'Insectoid extraterrestrial (est. 2.1m standing). Compound visual organs provide near-omnidirectional threat detection. Documented telepathic communication with Grey species. Forelimb strike velocity: 23m/s.',
  'antperson': 'Insectoid humanoid operating within strict eusocial hierarchy. Individual combat capability: moderate. Coordinated swarm tactics: DEVASTATING. Chemical communication enables real-time tactical coordination.',
  'mothman': 'Winged humanoid entity (wingspan: 4.6m) with luminous red ocular organs. Consistently appears 24\u201372 hours before catastrophic events. Generates prophetic visions in nearby organic subjects.',
  'siren': 'Aquatic-terrestrial humanoid with vocal apparatus capable of producing subsonic frequencies that override mammalian neurological function. Range of vocal influence: 200m in open air. Physical combat capability often underestimated.',
  'scarecrow': 'Animated construct of organic material. Can redistribute mass to repair damage. Documented controlling local flora within 50m radius. Territorial \u2014 guards agricultural zones with extreme prejudice.',
  'glitch': 'Reality anomaly manifesting as humanoid visual/spatial distortion. Exists simultaneously across multiple probability states. Physical attacks pass through 73% of the time. MAY NOT ACTUALLY EXIST in conventional sense.',
  'machine elves': 'Interdimensional entities appearing as geometric humanoid constructs of impossible topology. Interact with technology at a fundamental level. Communicate in mathematical languages that "feel like meaning."',
  'cyclops': 'Single-ocular giant humanoid (est. 2.8m). Monocular vision provides reduced depth perception but extraordinary focal range. Intelligence: previously underestimated. Reclassified from "brute" to "threat."',
  'cyborg': 'Surgically augmented human with integrated combat systems. Cybernetic replacement percentage varies (30%\u201385%). Enhanced subjects retain human adaptability while gaining mechanical durability.',
  'demon prince': 'Infernal royalty. Power output exceeds standard demon classification by factor of 8. Commands lesser infernal entities. Physical form is chosen, not inherent \u2014 true form is [DATA EXPUNGED]. Do not engage without battalion-level support.',
  'demon princess': 'Infernal nobility specializing in curse propagation and aura manipulation. Curse effects compound over time. Charm aura affects even shielded personnel. Containment requires Class-V psionic dampening.',
  'dreameater': 'Psionic parasite that feeds on REM-state neural activity. Capable of inducing sleep in conscious subjects within 15m radius. Appears as shifting humanoid form that "feels like 3 AM." M ATK capability rating: highest recorded for parasitic entity.',
  'fallen angel': 'Former celestial entity exhibiting combined divine and infernal energy signatures. Retains angelic power output but unconstrained by divine directive. Energy emissions are unstable. Psychological profile indicates extreme bitterness.',
  'goatman': 'Bipedal caprine-humanoid hybrid. Significantly faster than frame suggests. Occult energy signature detected. Territorial aggression extreme during equinox periods. Documented mimicking human speech to lure subjects.',
  'halfdemon': 'Human-infernal hybrid maintaining sapient cognition with demonic physical augmentation. Agility approaches Shadow Entity benchmarks. Retains human tactical reasoning \u2014 more dangerous than pure demons in strategic contexts.',
  'mermaid': 'Aquatic humanoid with piscine lower-body morphology. Hydromantic ability enables manipulation of water at molecular level \u2014 healing applications confirmed. Sonar-range vocalization enables underwater communication at 40km.',
  'nephilim': 'Divine-human hybrid of extraordinary physical proportion (est. 2.7m, 200kg). Combine angelic durability with human aggression \u2014 assessed as most dangerous melee entity on record.',
  'vampire': 'Undead predatory humanoid sustained by consumption of biological hemoglobin. Enhanced sensory array. Regeneration from non-lethal wounds: 2\u20136 minutes. Documented vulnerabilities: UV radiation, silver alloy penetration.',
  'voidweaver': 'Arachnid-form entity originating from extradimensional void-space. Constructs reality-anchored webs that trap subjects between dimensional layers. Ambush predator \u2014 remains undetectable until strike initiation.',
  'cosmic wraith': 'Spectral entity composed of exotic matter consistent with theoretical dark-energy models. Partially exists outside conventional spacetime. Communication attempts return only coordinates.',
  'superhero': 'Human subject exhibiting anomalous abilities following exposure to [REDACTED]. Powers vary by individual. Psychological profile consistently shows "heroic compulsion." Currently monitored under Project CAPE.',
  'general': 'Military strategist of unparalleled capability. Tactical acumen rating: 99th percentile. Known for transforming losing positions into decisive victories. Loyalty assessment: ABSOLUTE.',
  'droid': 'Most advanced mobile AI platform ever constructed. Personality matrix rated "uncomfortably sapient" by ethics review board. Classified as equipment to avoid legal complications. Treats all personnel with unsettling politeness.',
  'antihero': 'Former operative gone rogue. Combines peak human physique with alien-derived augmentations. Refuses to align with any faction permanently. Combat record: 0 losses. Motivation: personal.',
  'conspiracy theorist': 'Former intelligence analyst who "saw too much." Dismissed as unstable \u2014 subsequent events proved 73% of claims accurate. Possesses encyclopedic knowledge of classified programs. Annoying but invaluable.',
  'overlord': 'Warlord entity documented across 4,000+ years of human history under various names. Physical parameters exceed all known humanoid baselines. Motivation: conquest. Intelligence: genius-level strategic mind in a body designed for war.',
  'chosen one': 'Subject of Prophecy Event. Exhibits both divine and unholy energy signatures simultaneously \u2014 theoretically impossible per current models. Power scales with narrative proximity to "destiny moments." Speed rating: highest recorded for any humanoid.',
  'politician': 'Elected official with anomalous persuasion capability that exceeds normal political charisma by statistically significant margin. Speech patterns induce compliance in 89% of listeners. Direct combat capability: unknown.',
  'atlantean': 'Recovered from submerged ruins at est. depth 4,200m. Subjects demonstrate innate manipulation of localized temporal fields. Water in their presence exhibits anomalous behavior. Civilization appears to predate all known human records.',
  'dinosaur': 'Temporal-spatial breach event deposited specimen. Bipedal carnivorous reptilian of unprecedented scale. Exhibits intelligence far exceeding paleontological estimates. Sprint velocity: 48 km/h sustained.',
  'dragon': 'Ancient entity of indeterminate origin. Winged reptilian quadruped capable of sustained flight and combustion discharge (est. 1,400\u00B0C). Scales exhibit anomalous resistance to weaponry. Intelligence rating: EXTREME.',
  'ghoul': 'Intelligent undead predator. Unlike zombies, ghouls retain full cognitive function. Paralytic compound delivered via bite. Cadaverous appearance belies their speed \u2014 recorded reaction time: 40ms.',
  'gnome': 'Diminutive humanoid entity (est. 45\u201360cm height). Despite size, demonstrates engineering capability exceeding current human technology by 200\u2013300 years. Known to booby-trap personal spaces with alarming creativity.',
  'kaiju': 'EXTINCTION-LEVEL ENTITY. Bipedal organism of unprecedented scale (est. 8\u201312m height). Exhibits hybrid biological-technological anatomy. Capable of directed-energy discharge. Conventional military response: INEFFECTIVE.',
  'kraken': 'Cephalopod entity. Full body has never been observed \u2014 estimated total mass exceeds 40,000 kg. Produces biochemical discharge that disrupts electronic sensors. "It\'s not hiding from us. It\'s choosing when to be seen."',
  'loch ness monster': 'Aquatic reptilian entity documented since ancient times. Estimated length: 12\u201315m. Dermal armor plating rivals reinforced steel. Possesses some form of acoustic camouflage. "The loch is deeper than the maps show. So is she."',
  'yeti': 'Alpine apex cryptid. Exhibits cryokinetic capability \u2014 ambient temperature drops 15\u201325\u00B0C within 10m radius. Upper body strength exceeds any known primate by factor of 3. Known to fashion crude weapons from ice and stone.',
  'pirate': 'Maritime combatant of contested legitimacy. Mastery of naval tactics and improvised weaponry. Surprisingly effective in ground engagements. Known for unpredictable tactical decisions that confound conventional military doctrine.',
  'knight': 'Armored human combatant adhering to an archaic code of conduct designated "chivalry." Full-plate protective equipment provides exceptional ballistic and melee resistance. Subjects exhibit unwavering loyalty to designated allies and willingness to absorb lethal force on their behalf. Tactically rigid but extremely difficult to neutralize. Classification: heavy infantry.',
  'shaman': 'Human practitioner of ethnobotanical combat medicine and spirit-realm interfacing. Employs plant-derived compounds and ritualistic invocations to achieve measurable healing and psychoactive battlefield effects. Field reports document instances of consciousness transference and spirit-animal manifestation. Operates outside all recognized medical frameworks. Effectiveness: confirmed.',
  'mad scientist': 'Human subject exhibiting genius-level intellect combined with complete disregard for ethical research protocols. Deploys improvised electromagnetic devices, unstable chemical compounds, and clone technology of alarming sophistication. Laboratory conditions consistently violate 200+ safety regulations. Products are devastatingly effective despite — or because of — their instability.',
  'gangster': 'Human street enforcer operating outside every sanctioned combat doctrine. Small-arms proficiency is exceptional; discipline is not. Subjects answer any approach within arm\'s reach with immediate, disproportionate violence (see incident log: "shanked"). Vehicle-borne engagements documented at speeds the Department\'s insurance does not cover. Do not let them near your pockets.',
  'police officer': 'Municipal law-enforcement officer of Disaster City, sworn in under a charter nobody has produced. Subjects respond to every disturbance with the same escalation ladder — baton, taser, pepper spray, cuffs — and will, on a bad night, cordon an entire block and call it a lockdown. Ballistic vest, service pistol, a radio that only ever says "copy". The Cyberpunk City precinct wears a different uniform and answers to a different charter; do not expect the two to compare notes. Will ask for your badge. Will not accept ours.',
  'jellyfish': 'CLASSIFICATION: DRIFTING SOVEREIGN. Cnidarian entity of unprecedented scale recovered from the Bermuda Triangle\'s deep, wearing a crown nobody put on it. No brain, no heart, no blood; the interview went well regardless. Bell pulses at 0.3 Hz, tentacle skirt extends to nematocyst range 3, venom classed as neurotoxic-anomalous. Observed reverting to a polyp stage under lethal damage and regrowing inside a round (see: Turritopsis). Floats. Everything in the Department\'s aquarium wing has been moved.',
  'popstar': 'Human, ostensibly. Subject exhibits an anomalous field effect the Bureau has filed under FAME: crowds form where she stands, lights find her without being aimed, and a room of hostile agents will hold a lighter up on the second chorus. Crossed at the Football Stadium mid-tour and has not stopped touring since. Combat doctrine is the show — the mic as a blunt instrument, the stage dive, a spotlight that leaves nowhere to hide, and a stadium set the file describes only as "the pyro." Nobody has managed to silence her. Several have been charmed trying.',
  'starfish': 'Anomalous. An echinoderm the height of a man, walking on two of its five arms, recovered from the temple steps of Atlantis. Subjects regrow what they lose, keep the squad alive with the tide, and have no brain the Bureau can find.',
  'ringmaster': 'Human. Top hat, red coat, whip and a voice that fills a stadium without a microphone. Recovered from the Football Stadium after a show nobody booked. Subjects run a fight like a programme: every act on cue, every ally where the crowd can see them.',
  'bee queen': 'Anomalous. The mother of a hive the Bureau has never seen the edge of, recovered from the stone pillars at Göbekli Tepe with the sound of wings behind her. Subjects poison, command and multiply, and one is never found alone.',
  'professor': 'Human. Tweed, chalk dust and four doctorates in fields the university does not list. Recovered from a D.U.M.B. lecture hall with a full class nobody enrolled. Subjects fight from the back of the room with things they read about once and should not have understood.',
  'deep sea fish': 'Anomalous. A fish from under the deepest trench, walking upright in the dark with a light hanging in front of its face. Recovered from the Bermuda Triangle\'s floor. Subjects lure, blind and bite, and the light is the last thing anyone reports seeing.',
  'clown': 'Human, by most accounts. Greasepaint, a fixed grin and a horn nobody has heard from more than twice. Recovered from the grounds of the Haunted House with no circus on record. Subjects play every fight as a joke only they are in on and are never where the light was pointing.',
  'bunny girl': 'Human. Ears, tails and a tray, working the floor of a Strip casino that never closes. Subjects read a table faster than the dealer and keep a whole squad moving on charm alone. The Bureau\'s agents lost their per diem twice before anyone filed the report.',
  'sharkman': 'Anomalous. Bipedal elasmobranch recovered from the Bermuda Triangle, still breathing through gills on dry land. Subjects smell blood across the whole board, close on it at speed and do not let go.',
  'crystal guardian': 'Anomalous. A standing lattice of crystal in the shape of a knight, recovered from the crystal city of Agartha where it had stood watch over one door for longer than the city has had a name. Subjects hold ground, split light into weapons and do not move unless something makes them.',
  'jack o lantern': 'Anomalous. A carved pumpkin head on a body of vines and old clothes, lit from inside. Recovered from the crop fields out by Skinwalker Ranch after the harvest. Subjects burn, curse and haunt, and the candle has not gone out once in custody.',
  'sidekick': 'Human. Cape, mask and a costume a size too big, handed down from a hero the Bureau cannot locate. Recovered from Downtown still waiting for the signal. Subjects fight better next to someone, pick up whatever the hero dropped and are always the last one standing.',
  'mushroom girl': 'Anomalous. A girl-shaped fruiting body with a cap for a hat, grown from the floor of the Fairy Forest. Subjects spread spores that heal their side and rot the other, and a ring of mushrooms comes up wherever they stand still.',
  'tree person': 'Anomalous. A tree that walks. Recovered from the woods below D.O.O.R. HQ, where the survey team counted one more tree on the way out than on the way in. Subjects are slow, enormous and very hard to move, and the forest closes behind them.',
  'sheriff': 'Human. A tin star, a long coat and a revolver older than the town. Recovered from the desert outside Area 51 with jurisdiction over nothing the Bureau can find on a map. Subjects keep the peace at range, track anything on foot or horseback and bring it back alive or otherwise.',
  'astronaut': 'Human. NASA-trained, suit on, never takes the helmet off indoors. Recovered from the derelict Spaceship with a mission patch nobody at the agency issued. Subjects treat zero gravity as a weapon: they pull the floor out from under a target, walk on walls in mag boots, and fire a railgun that was classified before it was built.',
  'krampus': 'Anomalous. Horned, hooved, chained, and carrying a bell and a birch switch. Files arrive every December from the same forest and describe the same visitor: the one who comes for the names Santa Clause crossed off. Subjects are cold-proof, fire-shy, and hit harder than their list is long.',
  'rabbit': 'Anomalous. Bipedal lagomorph recovered from the far side of the Looking-Glass, checking a watch that runs in both directions. Subjects are impossible to pin down: they are never where the report says, arrive before they are sent for, and leave before the fight is over.',
  'luchador': 'Human. Masked professional wrestler; the mask has never come off and the Bureau has stopped asking. Recovered from a Strip casino\'s fight night with no contract and no opponent left standing. Subjects throw, slam and dive off anything taller than they are, and play to a crowd whether or not there is one.',
  'firefighter': 'Human. The one engine company in Disaster City still answering calls. Subjects walk into what everyone else is running out of, carry the wounded out on one shoulder, and put out fires, floods and fights with the same hose.',
  'goblin': 'Anomalous. Small, green, quick and never alone. Recovered from the tunnels of Hollow Earth with somebody else\'s wallet. Subjects rig the ground they stand on, bite with something in their teeth that should not be there, and take whatever is not bolted down.',
  'hippie': 'Human. Found camped at the stones on the solstice and every day since. Subjects grow their own medicine, share it with anyone, and keep a whole squad on its feet on seeds, herbs and good intentions. The Bureau has asked them to leave the site eleven times.',
  'chef': 'Human. Head chef of a Strip casino kitchen that never closes. Recovered from the pass mid-service, still calling tickets. Subjects cook with fire, season with things that should not be eaten, and keep their own side fed between rounds.',   // 2026-10-25
  'eagleman': 'Anomalous. A man in a pressed suit with the head and talons of an eagle. Recovered from the grounds of the Estate, where he had been watching the lawn from the roof. Subjects see farther than anyone on the board, pick their prey early and come down on it from above.',   // 2026-10-25
  'flesheater': 'Anomalous. Long-limbed, hairless, and split down the middle by a mouth lined with ribs. Recovered from the lower levels of the D.U.M.B. and sighted since in the sewers under Disaster City. Subjects hold their prey still with the tendrils in their chest and heal on what they eat.',   // 2026-10-25
  'mime': 'Human. White face, striped shirt, beret, gloves. Recovered from a Downtown street corner, where she had been trapped in the same invisible box for most of a day. Subjects never speak, silence anyone who does, and hit a great deal harder than the act suggests.',   // 2026-10-25
  'mummy': 'Unholy. A woman wrapped head to foot in old linen, long black hair loose over the bandages. Recovered from a sealed chamber under the Pyramids of Giza with the seal still unbroken from the inside. Subjects bind whoever comes close in their own wrappings, curse everyone who walked into the tomb, and do not burn slowly.',
  'swamp monster': 'Anomalous. Long-limbed, eyeless and hung with moss and weed, it walks out of standing water. Sighted in the standing water of the woods below D.O.O.R. HQ and in the sewers under Disaster City, never on dry ground for long. Subjects grab an ankle, breathe swamp gas over everyone near, and drag down whatever cannot get away.',
  'undead': 'Unholy. A body that would not stay buried: bare ribs, torn flesh and long bloody nails. Recovered from the graveyard at the Haunted House, with more sightings in Hell and the sewers under Disaster City. Subjects open a wound and follow the blood, let out a death rattle that scatters the living, and do not let go once they grip.',
  'unicorn': 'Divine. A white horse with a single horn and a pair of white feathered wings. Subjects blind with light from the horn, heal with it, and charge whoever cannot see them coming.',   // 2026-10-27
  'chess piece': 'Anomaly. A black piece off the Looking-Glass board that plays as all six. Each piece spell turns it into that piece and strikes the way the piece captures; the piece it is decides how it moves.',   // 2026-10-29
  'cult leader': 'Human. Charismatic. Files no forms because the members file them for him — forty-one so far, all in the same handwriting. Operates out of the redwoods of Bohemian Grove, where an owl the size of a house is not the strangest thing at the altar. Subject exhibits verified influence over cooperative minds (charm, indoctrination, the passing of a cup) and an entourage that arrives before it is called for. The robes are cotton. The candles never go out. Do not drink anything he offers. Do not join.',
  'door agent': 'Department personnel. Field officers of D.O.O.R. trained to treat a wall as a scheduling problem. Subjects place paired doorways on any floor — one in, the twin out — and use them as roads, walls and firing angles in the same engagement; whatever goes into one door comes out of the other. Documented incidents: a package delivered from behind, a door slammed on a room it was not in, a hostile filed out of the building for one round and returned at the wrong address. Stats are unremarkable. Geometry is not. Knock twice.',
  'priest:female': 'Human clergy of the [REDACTED] order. No offensive capability of note; restorative output exceeds every field medic on file by a wide margin. Subjects refuse the term "healer" and correct it to "sister." Documented cleansing of hostile enchantments, blessings that hold under fire, and a choir that can be heard through the wall. Do not swear in the interview.',
  'cowboy': 'Human firearms specialist operating under frontier combat doctrine. Exhibits supernatural quickdraw reflexes (est. 0.12s reaction time) and preternatural accuracy at range. Cultural affectations include anachronistic headwear and a peculiar code of honor involving fair duels. Do not underestimate. They never miss twice.',
  'men in black': 'Human operatives of [REDACTED] agency. Equipped with alien-derived technology and neurological suppression devices. Subjects display complete operational security — personal histories cannot be verified through any database. Suspected involvement in 847 documented anomalous event coverups. If approached, deny all knowledge of this dossier.',
  'telepath': 'Human subject exhibiting anomalous psionic capability. Brain imaging reveals 340% neural density increase in prefrontal cortex. Capable of sustained telepathic contact, psychokinetic barrier projection, and hostile neural disruption at range. Subject claims the voices "never stop." Containment priority: HIGH.',
  'marksman': 'Human precision firearms specialist. Confirmed kills at ranges exceeding 2,400m. Exhibits preternatural patience and spatial awareness — subjects have maintained prone observation positions for 72+ hours. Heartrate during engagement: 52 BPM. The bullet is already in the air before you know they are there.',
  'priest': 'Human religious practitioner channeling measurable divine energy through faith-based invocations. Healing output rivals advanced medical technology. Subjects demonstrate absolute conviction in moral framework — this conviction appears to be the mechanism enabling their abilities. Recommend maintaining respectful distance from holy sites.',
  'wizard': 'Human practitioner of arcane arts acquired through decades of study. Subjects manipulate fundamental forces through symbolic gestures and incantations of unknown linguistic origin. Mana reserves exceed any documented human baseline by factor of 4. WARNING: Do not touch their books. Do not enter their tower without invitation.',
  'fortune teller': 'Human subject exhibiting precognitive and divinatory capabilities of verified accuracy. Employs symbolic interpretation systems (tarot, crystal scrying, palm reading) as focus mechanisms for genuine anomalous perception. Predictions are correct 73% of the time — well above statistical chance. "The cards don\'t lie. People do."',
  'barbarella': 'Subject encountered during deep-space reconnaissance operation at coordinates [REDACTED]. Female humanoid of terrestrial origin exhibiting retrofuturistic technology integration — anti-gravity propulsion, directed-energy sidearms, and a plasma-whip of unknown manufacture. Displays exceptional agility and what field agents describe as "irresistible charisma." Classification: HONEY TRAP RISK.',
  'black goo': 'Anomalous amorphous organism recovered from impact site at [REDACTED]. No cellular structure identifiable — composition defies molecular analysis. Subject absorbs organic and inorganic material on contact, growing proportionally. Containment requires temperatures below -40°C at all times. THREE BREACHES THIS QUARTER.',
  'golem': 'Bipedal construct of hewite stone and clay, animated through inscription of divine sigils dating to [REDACTED] BCE. Subject does not eat, sleep, or communicate. Physical resilience exceeds all tested munitions up to .50 caliber. Subject has been in continuous operation for an estimated 3,000 years.',
  'honda civic': 'Subject appears to be a standard 2001 four-door sedan (silver, 164K miles, check engine light on). Under combat stimulus, the vehicle undergoes rapid mechanical transformation into a bipedal combat platform approximately 3.2m in height. Registration expired 2019.',
  'ice queen': 'Entity manifesting as a female humanoid composed of crystalline ice structures at absolute-zero surface temperature. Ambient temperature drops 40°C within 30m of subject. All water sources freeze within line of sight. Subject claims dominion over "the frozen places between the stars." Intelligence far exceeds human baseline.',
  'juggernaut': 'Bipedal aberration of indeterminate origin. Height: 3.8m. Mass: estimated 2,200kg. Subject exhibits no measurable intelligence beyond threat identification and target pursuit. Once in motion, no observed force has halted its advance. Subject does not run. Subject walks. It does not need to run.',
  'ki fighter': 'Human martial artist exhibiting anomalous energy discharge capabilities. Subject channels bioelectric energy (designated "ki") through trained physical movements, generating concussive blasts, defensive barriers, and movement speeds exceeding Mach 0.3 in short bursts. Consumes approximately 12,000 calories daily.',
  'king arthur': 'Subject claims to be Arthur Pendragon, High King of Britain, bearer of Excalibur. Carbon dating of associated artifacts places origin at approximately 520 CE. Sword designated "Excalibur" emits measurable divine-spectrum energy and cannot be wielded by any other tested subject. Leadership capability is anomalous.',
  'king kong': 'Primate megafauna of unprecedented scale. Height: 12m (estimated). Mass: 8,000kg+ (estimated from structural damage). Subject displays intelligence consistent with great ape baseline but enhanced tactical reasoning. Three expeditions sent. Two returned.',
  'minotaur': 'Bovine-humanoid hybrid consistent with Hellenic mythological accounts. Height: 2.8m. Charges at speeds up to 65 km/h. Horn composition: unknown alloy stronger than industrial diamond. Containment facility is a labyrinth. Subject appears to find this ironic.',
  'necromancer': 'Human practitioner of necrotic arts. Subject manipulates post-mortem biological systems through rituals of [REDACTED] origin. Capable of reanimating deceased tissue, draining life force at range, and projecting weaponized decay. Ethical assessment: SEVERE CONCERN. Subject claims their work is "just biology with extra steps."',
  'occulus': 'Entity manifesting as a single ocular organ of approximately 0.8m diameter with membranous wing structures enabling sustained flight. Pupil emits focused psychic energy measurable at 3.2 gigawatts. Subject perceives electromagnetic spectra far beyond human range. Staring contest with subject resulted in [REDACTED].',
  'quarterback': 'Human subject of extraordinary athletic capability. Arm generates throws measured at 127 km/h with inhuman accuracy to 80+ meters. Spatial awareness during high-speed tactical scenarios rated as "anomalous" — subject processes defensive formations faster than combat AI systems.',
  'robinhood': 'Subject claims to be Robin of Loxley, Earl of Huntington. Bowmanship exceeds all measured human capability — confirmed split-arrow shots at 200m. Displays anachronistic values (wealth redistribution, authority defiance) that complicate standard recruitment protocols.',
  'santa clause': 'Entity of indeterminate age and origin operating from a facility at geographic North Pole. Demonstrates capabilities including: instantaneous global transportation, material generation ex nihilo, omniscient behavioral surveillance of human population, chimney-dimensional transit. Classified: FRIENDLY BUT UNCONTAINABLE.',
  'super sentai': 'Collective designation for a team of five human subjects capable of spontaneous chromatic energy manifestation and synchronized tactical combat. Under extreme duress, subjects merge consciousness to pilot a mechanized combat platform (codename: MEGAZORD) of approximately 50m height. Origin: unknown energy source designated "Morphin Grid."',
  'symbiote': 'Female human host bonded with an extraterrestrial parasitic organism of the same biological class as Subject: BLACK GOO (see file EW-████). Stable symbiosis dramatically enhances physical capabilities: strength +400%, speed +300%, regenerative capacity. Host personality significantly altered — predatory instincts dominant. It is unclear who is in control.',
  'valkraye': 'Winged humanoid entity consistent with Norse mythological "Valkyrie" designation. Combat capability: EXTREME. Wields a divine-spectrum spear that penetrates all tested armor types. Flight capability: sustained, altitude ceiling not determined. Subject displays unwavering honor code and refuses to engage "unworthy" opponents.',
  'watcher': 'Ancient entity of indeterminate age. Winged humanoid form, height approximately 3m. Subject observes but historically does not intervene in terrestrial events. Maintains awareness of all temporal streams simultaneously (verified through prediction testing: 100% accuracy over 847 trials). Recent behavioral change: subject has begun intervening. CONCERN LEVEL: MAXIMUM.',
};

function getSt() { return (typeof state !== 'undefined') ? state : window.state; }
const PB_ACCENT = EW.time;   // the one unit accent (the factions went 2026-10-17)
function getTypeColor(type) { return TYPE_C[type] || EW.human; }
function _grl(race, gender) { return typeof window.getRaceLabel === 'function' ? window.getRaceLabel(race, gender) : (window.RACE_PROFILES?.[race]?.label || race || '?'); }
function getSpriteUrl(race, gender, cls) {
  if (race && typeof window.getR2RaceSpriteUrl === 'function') {
    const url = window.getR2RaceSpriteUrl(race, gender || 'male', cls);
    if (url) return url;
  }
  return '';
}
function computeStats(race, cls) {
  const s = (typeof window.computeUnitStats === 'function')
    ? window.computeUnitStats(race || 'door agent', cls)
    : (window.CLASS_TEMPLATES?.Vessel || {});
  return _withCritEva({ ...s });
}
/* `equipment` = the loadout's spell ids since THE GEAR MERGE (SPELL_LIBRARY_PLAN Phase 4): the equipped passive rows'
   `statBonus` hooks (data.js passiveIdsStatBonus); an old { accessory1, accessory2 } object still reads the retired table. */
function computeFullStats(race, cls, secJob, equipment, ups, zodiac) {
  const base = computeStats(race, cls);
  const secB = { hp:0,mp:0,atk:0,def:0,mdef:0,move:0,vision:0,crt:0,int:0,spd:0 };   // THE JOBS REMOVAL (2026-09-27): no second job
  const eqB = (Array.isArray(equipment) && typeof window.passiveIdsStatBonus === 'function') ? window.passiveIdsStatBonus(equipment, ups)   // ups: a passive row's +1 / +2 (2026-10-06)
    : (equipment && !Array.isArray(equipment) && typeof window.computeEquipBonuses === 'function') ? window.computeEquipBonuses(equipment) : { hp:0,mp:0,atk:0,def:0,mdef:0,move:0,vision:0,crt:0,int:0,spd:0 };
  const delta = {};
  const final = {};
  for (const k of ['hp','mp','atk','def','mdef','vision','crt','int','spd']) {
    const b = base[k] || 0;
    // the birth sign's natal change (data.js ZODIAC_EFFECTS, the race editor's ZODIAC tab) shows as a ± like gear
    const d = (secB[k]||0) + (eqB[k]||0) + (zodiac && typeof window.zodiacNatalDelta === 'function' ? window.zodiacNatalDelta(zodiac, k) : 0);
    delta[k] = d;
    final[k] = Math.max(k==='vision'||k==='spd'?1:0, b + d);
    if (k === 'vision') {
      /* VISION TOPS OUT AT 8 (Keys vs Keys matchup: King Arthur read "VIS 8 (+4)" on base 5 — the gear past 8 did nothing,
         and Inspect covers as many tiles as vision): the ± is what the gear really adds, and the cut is kept for the MAX tag */
      const _cap = (window.VISION_RULES && Number.isFinite(window.VISION_RULES.maxVision)) ? window.VISION_RULES.maxVision : 8;
      final[k] = Math.min(_cap, final[k]);
      delta[k] = final[k] - Math.max(1, b);
      final._visionOver = Math.max(0, b + d - _cap);
    }
  }
  // MOV derives from SPD (2026-08-29 rework: SPD 1-25 → 1 tile, then 1 tile per 20 SPD, cap 5);
  // gear MOV (jetpack) is a flat tile bonus on top of the band.
  const bandOf = sp => (typeof window.moveFromSpd === 'function') ? window.moveFromSpd(sp) : (sp <= 25 ? 1 : Math.min(5, Math.ceil(sp / 20)));
  final.move = bandOf(final.spd) + (eqB.move || 0) + (secB.move || 0);
  delta.move = final.move - bandOf(base.spd || 1);
  final.range = base.range || 1;
  // THE TRAINING (2026-09-27): Field Operative's +1 inspect reach
  final.inspect = (base.inspect || 1) + (Array.isArray(equipment) && equipment.includes('passiveFieldOperative') ? 1 : 0);
  delta.range = 0;
  delta.inspect = 0;
  // CRT (own stat) / EVA (from MOV) follow gear and sign, so their
  // changes surface as a visible ± delta on the percent too.
  _withCritEva(final);
  delta.crt = (final.crt || 0) - (base.crt || 0);
  delta.eva = (final.eva || 0) - (base.eva || 0);
  return { final, delta };
}
function getRaceAbilities(race, cls) {
  if (typeof window.RACE_ABILITIES === 'undefined' || !window.RACE_ABILITIES[race]) return [];
  return window.RACE_ABILITIES[race].slice();
}
function getLearnedSpells(cls, customSpells) {
  const order = customSpells || [];
  return order.map(id => typeof window.getSpellById === 'function' ? window.getSpellById(id) : null).filter(Boolean);
}

// Slot budget: one spell = one of the SPELL_SLOT_MAX (6) slots.
function spellSlotCost(sp) {
  if (!sp) return 0;
  return typeof window.getSpellSlotCost === 'function' ? window.getSpellSlotCost(sp) : 1;
}
function spellIdSlotCost(id) {
  const sp = typeof window.getSpellById === 'function' ? window.getSpellById(id) : null;
  return sp ? spellSlotCost(sp) : (id ? 1 : 0);
}
function usedSpellSlots(ids) {
  return (ids || []).reduce((s, id) => s + spellIdSlotCost(id), 0);
}

/* THE GENDER KIT (2026-11-07, playtest H: a slot switched from Priest to Nun fought at 6/7 with no Ruler Smack): the Priest and
   the Nun are ONE race key with spells of their own (data.js RACE_GENDER_SPELLS), so a gender switch is a different vessel for
   the kit — the old picks would lose the other gender's own spells to the scrub and leave an empty slot. true = start the kit
   over (the default kit of the new gender), like a race change. A race with no gender-own spells keeps its picks. */
function pbGenderKitChanges(race, prevGender, gender) {
  const a = prevGender === 'female' ? 'female' : 'male', b = gender === 'female' ? 'female' : 'male';
  if (a === b || typeof window.raceGenderOffSpellIds !== 'function') return false;
  return window.raceGenderOffSpellIds(race, b).length > 0 || window.raceGenderOffSpellIds(race, a).length > 0;
}
function pbGenderKitReset(meta, race, gender) {   // the slot's meta, BEFORE its gender is written
  if (!meta || !pbGenderKitChanges(race, meta.gender, gender)) return;
  delete meta.customSpells; delete meta.spellUpgrades;   // the render's DEFAULT path (and pickRace) refill the new gender's kit
}

function buildDefaultCustomSpells(race, cls, secJob, gender) {   // `gender` (2026-10-27): RACE_GENDER_SPELLS
  /* THE JOBS REMOVAL (the user, 2026-09-27): the default kit is data.js raceDefaultKit — the race's four curated rungs,
     then the rest of its families cheapest first, trimmed to the 7 slots / 16 SP (the Clash seal inside the repair). */
  if (typeof window.raceDefaultKit === 'function') return window.raceDefaultKit(race, null, gender);
  return [];
}

// Every spell id this unit may legally equip — used to scrub stale picks left behind by a vessel swap or an old saved
// team. The unit's pool (data.js unitSpellPool — its families, the universal GEAR / TRAINING, and the borrowed families
// while `ids` carry Adaptable) minus the Clash-sealed; the slot / SP budget is checked by treeLegalSubset.
function legalCustomSpellIds(race, cls, secJob, ids, gender) {
  if (typeof window.unitSpellPool !== 'function') return new Set();
  const pool = window.unitSpellPool(race, cls, ids || [], gender);
  const sealed = typeof window.spellSealedIds === 'function' ? window.spellSealedIds(pool) : new Set();
  return new Set(pool.filter(id => !sealed.has(id)));
}
/* Clash (classic JRPG battle): movement/positioning spells can't be equipped —
   there is nothing for them to do on a formation stage. Mirrors the battle-side
   strip in createUnit so the builder never offers what the match would drop. */
function clashSpellOk(sp) {
  return !(sp && typeof window._isClashMode === 'function' && window._isClashMode()
    && typeof window._clashSpellAllowed === 'function' && !window._clashSpellAllowed(sp));
}
function sfx(key) { if (typeof window.playSfx === 'function') window.playSfx(key); }
function getCodexLore(race, gender) { return (gender === 'female' && CODEX_LORE[race + ':female']) || CODEX_LORE[race] || window.RACE_PROFILES?.[race]?.lore || 'No intelligence available. File pending \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588 review.'; }

function Sprite({ race, gender, cls, size, glow, style: extraStyle }) {
  const url = getSpriteUrl(race, gender, cls);
  return h('div', { style: { width: size, height: size, backgroundImage: url ? `url('${url}')` : 'none', backgroundSize: 'contain', backgroundPosition: 'center bottom', backgroundRepeat: 'no-repeat', imageRendering: 'pixelated', filter: glow ? `drop-shadow(0 0 8px ${PB_ACCENT})` : undefined, ...extraStyle }});
}
/* Party-rail slot art: the 128×128 character portrait when the vessel has
   one (sprites.js RACE_PORTRAITS), full-bleed like a champ-select card;
   falls back to the ordinary full-body Sprite otherwise. */
function PortraitSprite({ race, gender, cls, glow, style: extraStyle }) {
  const pUrl = (typeof window.getUnitPortraitUrl === 'function')
    ? window.getUnitPortraitUrl({ race, gender }) : null;
  if (!pUrl) return h(Sprite, { race, gender, cls, size: '90%', glow, style: { width: '90%', height: '90%', ...extraStyle } });
  return h('div', { style: {
    width: '100%', height: '100%',
    backgroundImage: `url('${pUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center',
    imageRendering: 'pixelated',
    filter: glow ? `drop-shadow(0 0 8px ${PB_ACCENT})` : undefined,
    ...extraStyle,
  }});
}

/* ── THE CREATOR CONTROLS (rev 8, 2026-09-13) ──────────────────────────
   ONE component for both homes of the character creator: the forge's GEAR
   panel (a party slot's look) and THE MIRROR in Occam's Barbershop (the
   officer's own look, OfficerCreator below). Sections BODY · FACE · SKIN ·
   HAIR · CLOTHES · LAYERS; every control writes ONE sanitized appearance
   through `onChange(changes, gender?)`. The swatch thumbnails (fabric tiles,
   the two-colour prints) are the stage's own painter (EWCharViewer
   .fabricThumb / .patternThumb) and live here. `footer` = the home's own
   action row (the forge's RANDOMIZE / RESET / USE ORIGINAL MODEL). */
/* ── THE LOCKER (rev 10, 2026-09-13 — "save and load custom characters") ──
   Saved characters = { id, name, gender, appearance, at } in localStorage
   `ew_saved_looks` (PB_LOOKS_MAX of them, newest first; every appearance goes
   back through normalizeCharacterAppearance on load). Shared by both homes of
   the creator: SAVE CHARACTER files the look under the name in the NAME field
   (the same name overwrites), a chip LOADs it (appearance + base + name),
   ✕ forgets it. window._ewSavedLooks exposes it (the tests, the HQ). */
const PB_LOOKS_KEY = 'ew_saved_looks', PB_LOOKS_MAX = 40;
function pbLooksLoad() {
  try {
    const raw = (typeof localStorage !== 'undefined') ? localStorage.getItem(PB_LOOKS_KEY) : null, arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return [];
    return arr.filter(e => e && typeof e === 'object' && e.appearance && typeof e.appearance === 'object').map(e => ({
      id: String(e.id || ''), name: String(e.name || 'Unnamed').slice(0, 24), gender: e.gender === 'female' ? 'female' : 'male',
      appearance: window.normalizeCharacterAppearance ? window.normalizeCharacterAppearance(e.appearance) : e.appearance, at: +e.at || 0,
    })).filter(e => e.id && e.appearance);
  } catch (e) { return []; }
}
function pbLooksStore(list) { try { localStorage.setItem(PB_LOOKS_KEY, JSON.stringify(list.slice(0, PB_LOOKS_MAX))); return true; } catch (e) { return false; } }
function pbLooksSave(name, gender, appearance) {
  const nm = String(name || '').trim().slice(0, 24) || 'Unnamed', list = pbLooksLoad().filter(e => e.name.toLowerCase() !== nm.toLowerCase());
  const entry = { id: 'look-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e6).toString(36), name: nm, gender: gender === 'female' ? 'female' : 'male',
    appearance: window.normalizeCharacterAppearance ? window.normalizeCharacterAppearance(appearance || {}) : (appearance || {}), at: Date.now() };
  list.unshift(entry);
  return pbLooksStore(list) ? entry : null;
}
function pbLooksDelete(id) { const list = pbLooksLoad().filter(e => e.id !== id); pbLooksStore(list); return list; }
if (typeof window !== 'undefined') window._ewSavedLooks = { load: pbLooksLoad, save: pbLooksSave, remove: pbLooksDelete, key: PB_LOOKS_KEY, max: PB_LOOKS_MAX };
/* THE RACE LOOKS (2026-11-01): EXPORT RACE LOOK (was EXPORT DEFAULT LOOK; THE MESHY DEFAULT 2026-11-03: a baked look is a saved look) — the look on the stage as a file for bake-looks.js
   ({ kind: 'entropy-wars-race-looks', v: 1, made, looks: { <race>: { <gender>: appearance } } }); several files bake together */
function pbExportRaceLook(race, gender, appearance, note) {
  try {
    const a = window.normalizeCharacterAppearance ? window.normalizeCharacterAppearance(appearance || {}) : appearance;
    if (!a) return false;
    const g = gender === 'female' ? 'female' : 'male', d = new Date(), p2 = n => String(n).padStart(2, '0');
    const stamp = d.getUTCFullYear() + p2(d.getUTCMonth() + 1) + p2(d.getUTCDate()) + '-' + p2(d.getUTCHours()) + p2(d.getUTCMinutes());
    const doc = { kind: 'entropy-wars-race-looks', v: 1, made: d.toISOString(), looks: { [race]: { [g]: a } } };
    const name = 'Entropy_Wars_Race_Look_' + String(race).replace(/[^a-z0-9]+/gi, '_') + '_' + g + '_' + stamp + '.json';
    const url = URL.createObjectURL(new Blob([JSON.stringify(doc, null, 1)], { type: 'application/json' }));
    const el = document.createElement('a'); el.href = url; el.download = name; document.body.appendChild(el); el.click(); el.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    if (typeof note === 'function') note('Exported ' + name + ' \u2014 bake it with: node bake-looks.js ' + name);
    window._ewLastRaceLookExport = { name, doc };   // (the browser check reads it back)
    return true;
  } catch (e) { if (typeof note === 'function') note('Export failed: ' + e.message); return false; }
}
/* THE ASSIGNED LOOKS (2026-11-03, mondo: "one button should be to assign the created character to the character (not the same as
   saving the character) and one button should be to export all newly assigned created characters so i can give to you to bake in").
   ASSIGN TO <RACE> files the look on the stage as THAT race + gender's look in localStorage `ew_assigned_looks`
   ({ v: 1, looks: { <race>: { <gender>: { appearance, at, exportedAt } } } }; one per race + gender, a new assign replaces it).
   EXPORT ALL ASSIGNED writes every assigned look that is not already the game's baked look as ONE file in the same
   'entropy-wars-race-looks' shape as EXPORT RACE LOOK, so `node bake-looks.js <file>` bakes them all. A look whose row in
   sprites.js RACE_CREATOR_LOOKS already equals it shows as IN THE GAME and stays out of the file (nothing is deleted).
   The SAVE CHARACTER locker is separate and untouched. */
const PB_ASSIGN_KEY = 'ew_assigned_looks';
function pbAssignLoad() {
  try {
    const raw = (typeof localStorage !== 'undefined') ? localStorage.getItem(PB_ASSIGN_KEY) : null, doc = raw ? JSON.parse(raw) : null;
    const looks = (doc && doc.looks && typeof doc.looks === 'object') ? doc.looks : {}, out = {};
    for (const race of Object.keys(looks)) for (const g of ['male', 'female']) {
      const e = looks[race] && looks[race][g];
      if (!e || !e.appearance || typeof e.appearance !== 'object') continue;
      (out[race] = out[race] || {})[g] = { appearance: e.appearance, at: +e.at || 0, exportedAt: +e.exportedAt || 0 };
    }
    return out;
  } catch (e) { return {}; }
}
function pbAssignStore(looks) { try { localStorage.setItem(PB_ASSIGN_KEY, JSON.stringify({ v: 1, looks })); return true; } catch (e) { return false; } }
function _pbLookSig(a) {   // (the look without the slot-only `model` switch, for "is this the same look")
  const n = window.normalizeCharacterAppearance ? window.normalizeCharacterAppearance(a || {}) : a;
  if (!n) return '';
  const c = Object.assign({}, n); delete c.model;
  return JSON.stringify(c);
}
function pbAssignBaked(race, g, appearance) {   // the game already ships this exact look for race + gender
  const set = (typeof RACE_CREATOR_LOOKS !== 'undefined') ? RACE_CREATOR_LOOKS[race] : null;
  return !!(set && set[g] && _pbLookSig(set[g]) === _pbLookSig(appearance));
}
function pbAssignList() {   // [{ race, gender, appearance, at, exportedAt, baked }] newest first
  const looks = pbAssignLoad(), list = [];
  for (const race of Object.keys(looks)) for (const g of Object.keys(looks[race])) {
    const e = looks[race][g];
    list.push({ race, gender: g, appearance: e.appearance, at: e.at, exportedAt: e.exportedAt, baked: pbAssignBaked(race, g, e.appearance) });
  }
  return list.sort((x, y) => y.at - x.at);
}
function pbAssignLook(race, gender, appearance) {
  const a = window.normalizeCharacterAppearance ? window.normalizeCharacterAppearance(appearance || {}) : appearance;
  if (!a || a.model === 'original' || !race || race === 'door agent' || race === 'homosapien') return false;
  const g = gender === 'female' ? 'female' : 'male', looks = pbAssignLoad();
  (looks[race] = looks[race] || {})[g] = { appearance: Object.assign({}, a, { model: 'creator' }), at: Date.now(), exportedAt: 0 };
  return pbAssignStore(looks);
}
function pbUnassignLook(race, gender) {
  const looks = pbAssignLoad();
  if (looks[race]) { delete looks[race][gender]; if (!Object.keys(looks[race]).length) delete looks[race]; }
  return pbAssignStore(looks);
}
function pbExportAssigned(note) {
  try {
    const list = pbAssignList().filter(e => !e.baked);
    if (!list.length) { if (typeof note === 'function') note('Nothing to export: every assigned look is already in the game.'); return false; }
    const d = new Date(), p2 = n => String(n).padStart(2, '0');
    const stamp = d.getUTCFullYear() + p2(d.getUTCMonth() + 1) + p2(d.getUTCDate()) + '-' + p2(d.getUTCHours()) + p2(d.getUTCMinutes());
    const looks = {};
    for (const e of list) (looks[e.race] = looks[e.race] || {})[e.gender] = window.normalizeCharacterAppearance ? window.normalizeCharacterAppearance(e.appearance) : e.appearance;
    const doc = { kind: 'entropy-wars-race-looks', v: 1, made: d.toISOString(), assigned: list.map(e => e.race + ' ' + e.gender), looks };
    const name = 'Entropy_Wars_Race_Looks_' + list.length + '_assigned_' + stamp + '.json';
    const url = URL.createObjectURL(new Blob([JSON.stringify(doc, null, 1)], { type: 'application/json' }));
    const el = document.createElement('a'); el.href = url; el.download = name; document.body.appendChild(el); el.click(); el.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    const all = pbAssignLoad(), now = Date.now();
    for (const e of list) if (all[e.race] && all[e.race][e.gender]) all[e.race][e.gender].exportedAt = now;
    pbAssignStore(all);
    if (typeof note === 'function') note('Exported ' + list.length + ' look' + (list.length === 1 ? '' : 's') + ' in one file: ' + name + '. Send that file to Claude to bake.');
    window._ewLastAssignedExport = { name, doc };   // (the browser check reads it back)
    return true;
  } catch (e) { if (typeof note === 'function') note('Export failed: ' + e.message); return false; }
}
if (typeof window !== 'undefined') window._ewAssignedLooks = { list: pbAssignList, assign: pbAssignLook, unassign: pbUnassignLook, exportAll: pbExportAssigned, key: PB_ASSIGN_KEY };
/* the ASSIGNED LOOKS box under the creator (forge): ASSIGN TO <RACE> (when a look is on the stage) + EXPORT ALL ASSIGNED + the list */
/* THE ASSIGNED LOOKS, LOADED (2026-11-05, mondo: "there's no way for me to select the assigned looks i have made in the character
   creator ... I need the buttons at the bottom that have the assigned looks to switch to that look when i press them"): each chip is
   a button now. `onLoad(entry)` (the forge) puts that race + gender's assigned look on the stage: on this slot when it is that race,
   on the team's slot of that race when there is one, else that race goes on this slot (the roster pick). Nothing in the store
   changes; the chip of the look on the stage reads ON THE STAGE. */
function AssignedLooks({ race, raceLabel, gender, appearance, disabled, onNote, onLoad }) {
  const [, setTick] = React.useState(0);
  const [msg, setMsg] = React.useState('');
  const say = (t) => { setMsg(t); if (typeof onNote === 'function') onNote(t); setTick(n => n + 1); };
  const g = gender === 'female' ? 'female' : 'male', sym = (x) => x === 'female' ? '♀' : '♂';
  const label = (r) => String(typeof window.getRaceLabel === 'function' ? window.getRaceLabel(r) : r);
  const list = pbAssignList(), pending = list.filter(e => !e.baked).length;
  const canAssign = !!appearance && !!race && race !== 'door agent' && race !== 'homosapien';
  const mine = list.find(e => e.race === race && e.gender === g);
  const same = !!(mine && appearance && _pbLookSig(mine.appearance) === _pbLookSig(appearance));
  const stageSig = appearance ? _pbLookSig(appearance) : '';
  const onStage = (e) => !!stageSig && e.race === race && e.gender === g && _pbLookSig(e.appearance) === stageSig;
  const assign = () => {
    if (disabled || !canAssign) return;
    if (!pbAssignLook(race, g, appearance)) { say('Could not assign (storage is full or blocked).'); return; }
    say((mine ? 'Updated' : 'Assigned') + ' the ' + raceLabel + ' ' + sym(g) + ' look. EXPORT ALL ASSIGNED puts it in the file.');
    try { if (typeof playDoorSfx === 'function') playDoorSfx('stamp', { volume: 0.35 }); } catch (e) {}
  };
  return h('div', { className: 'pb-looks pb-assigned' },
    h('div', { className: 'pb-assigned-head' }, h('b', null, 'Assigned looks'),
      h('span', { className: 'pb-creator-note' }, 'Assign = this look becomes the unit’s look to bake in (not the same as SAVE CHARACTER). Press an assigned look below to load it.')),
    h('div', { className: 'pb-creator-options' },
      canAssign ? h('button', { className: 'ms-tty-btn' + (same ? '' : ' primary'), disabled: disabled || same, 'data-assign': race + ':' + g, onClick: assign,
        title: 'Mark this look as the ' + raceLabel + ' (' + g + ') look for the next EXPORT ALL ASSIGNED file' },
        same ? '✓ ASSIGNED TO ' + String(raceLabel).toUpperCase() + ' ' + sym(g)
             : (mine ? '⇨ UPDATE ' : '⇨ ASSIGN TO ') + String(raceLabel).toUpperCase() + ' ' + sym(g)) : null,
      h('button', { className: 'ms-tty-btn gold', disabled: !pending, 'data-export-assigned': pending,
        title: 'Save every assigned look that is not in the game yet as one file for bake-looks.js', onClick: () => { pbExportAssigned(say); } },
        '⇩ EXPORT ALL ASSIGNED (' + pending + ')')),
    list.length ? h('div', { className: 'pb-look-rack', role: 'list', 'aria-label': 'Assigned looks' }, list.map(e =>
      h('div', { key: e.race + ':' + e.gender, className: 'pb-look-chip pb-assigned-chip' + (e.baked ? ' baked' : '') + (onStage(e) ? ' on' : ''), role: 'listitem' },
        h('button', { className: 'pb-look-load', disabled: disabled || !onLoad, 'data-load-assigned': e.race + ':' + e.gender,
            title: 'Load the assigned ' + label(e.race) + ' (' + e.gender + ') look into the creator \u00b7 '
              + (e.baked ? 'this exact look is already baked into the game' : (e.exportedAt ? 'in an exported file; not baked yet' : 'waiting for EXPORT ALL ASSIGNED')),
            onClick: () => { if (disabled || !onLoad) return; if (onLoad(e) !== false) say('Loaded the assigned ' + label(e.race) + ' ' + sym(e.gender) + ' look.'); } },
          h('i', { className: 'pb-look-swatch', style: { background: 'linear-gradient(135deg, ' + (e.appearance.topColor || '#888') + ' 50%, ' + (e.appearance.bottomColor || '#555') + ' 50%)' } }),
          h('span', null, label(e.race)), h('small', null, sym(e.gender)),
          h('small', { className: 'pb-assigned-tag' }, e.baked ? 'IN THE GAME' : e.exportedAt ? 'EXPORTED' : 'NEW'),
          onStage(e) ? h('small', { className: 'pb-assigned-tag pb-assigned-here' }, 'ON THE STAGE') : null),
        h('button', { className: 'pb-look-del', disabled, 'aria-label': 'Unassign ' + label(e.race) + ' ' + e.gender, title: 'Unassign (the look stays on its slots)',
          onClick: () => { pbUnassignLook(e.race, e.gender); say('Unassigned the ' + label(e.race) + ' ' + sym(e.gender) + ' look.'); } }, '✕'))))
      : h('p', { className: 'pb-creator-note pb-looks-empty' }, 'Nothing assigned yet. Make a look for a unit, press ASSIGN, do the next unit, then EXPORT ALL ASSIGNED once.'),
    msg ? h('div', { className: 'pb-looks-note', role: 'status' }, msg) : null);
}
/* THE HIDDEN PICKS (2026-11-03): EXPORT HIDDEN LIST — the creator's whole hidden list as this browser shows it, for bake-hidden.js
   ({ kind: 'entropy-wars-creator-hidden', v: 1, made, hidden: { '<kind>:<id>': label } }); the bake replaces the shipped list with it.
   THE RENAMED PICKS (2026-11-03): v 2 carries his names too (names: { '<kind>:<id>': name }, also whole): EXPORT HIDDEN + NAMES,
   Entropy_Wars_Creator_Picks_<stamp>.json */
function pbExportHidden(note) {
  try {
    if (typeof window.creatorHiddenExport !== 'function') return false;
    const doc = window.creatorHiddenExport(), d = new Date(), p2 = n => String(n).padStart(2, '0');
    const stamp = d.getUTCFullYear() + p2(d.getUTCMonth() + 1) + p2(d.getUTCDate()) + '-' + p2(d.getUTCHours()) + p2(d.getUTCMinutes());
    const name = 'Entropy_Wars_Creator_Picks_' + stamp + '.json';
    const url = URL.createObjectURL(new Blob([JSON.stringify(doc, null, 1)], { type: 'application/json' }));
    const el = document.createElement('a'); el.href = url; el.download = name; document.body.appendChild(el); el.click(); el.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    if (typeof note === 'function') note('Exported ' + name + ' (' + Object.keys(doc.hidden).length + ' hidden, ' + Object.keys(doc.names || {}).length + ' renamed) \u2014 send it to Claude to bake (node bake-hidden.js ' + name + ').');
    window._ewLastHiddenExport = { name, doc };   // (the browser check reads it back)
    return true;
  } catch (e) { if (typeof note === 'function') note('Export failed: ' + e.message); return false; }
}
/* the NAME field + the locker's rack — one block at the top of the creator (`name` / `onName` / `onLoad` from the home) */
function SavedLooks({ name, gender, appearance, disabled, onName, onLoad }) {
  const [list, setList] = React.useState(() => pbLooksLoad());
  const [note, setNote] = React.useState('');
  const nameRef = React.useRef(null);
  const commitName = () => { const v = nameRef.current ? nameRef.current.value : name; if (onName && v !== name) onName(v); return v; };
  const save = () => {
    if (disabled) return;
    const nm = commitName();
    const entry = pbLooksSave(nm, gender, appearance);
    if (!entry) { setNote('Could not save (storage is full or blocked).'); return; }
    setList(pbLooksLoad()); setNote('Saved “' + entry.name + '”.');
    try { if (typeof playDoorSfx === 'function') playDoorSfx('stamp', { volume: 0.35 }); } catch (e) {}
  };
  return h('div', { className: 'pb-looks' },
    h('div', { className: 'pb-creator-name' },
      h('span', { className: 'pb-creator-colorlabel' }, 'Name'),
      h('input', { key: name, ref: nameRef, className: 'pb-gear-input', defaultValue: name || '', maxLength: 24, placeholder: 'Character name', 'aria-label': 'Character name', disabled: !onName || disabled,
        onBlur: commitName, onKeyDown: e => { if (e.key === 'Enter') { e.preventDefault(); commitName(); e.target.blur(); } } }),
      h('button', { className: 'ms-tty-btn primary', disabled, onClick: save, title: 'File this character (name, base, every appearance choice) in the locker' }, '💾 SAVE CHARACTER')),
    list.length ? h('div', { className: 'pb-look-rack', role: 'list', 'aria-label': 'Saved characters' }, list.map(e =>
      h('div', { key: e.id, className: 'pb-look-chip', role: 'listitem' },
        h('button', { className: 'pb-look-load', disabled, title: 'Load ' + e.name + ' (' + e.gender + ')', onClick: () => { if (onLoad) onLoad(e); setNote('Loaded “' + e.name + '”.'); } },
          h('i', { className: 'pb-look-swatch', style: { background: 'linear-gradient(135deg, ' + (e.appearance.topColor || '#888') + ' 50%, ' + (e.appearance.bottomColor || '#555') + ' 50%)' } }),
          h('span', null, e.name), h('small', null, e.gender === 'female' ? '♀' : '♂')),
        h('button', { className: 'pb-look-del', disabled, 'aria-label': 'Forget ' + e.name, title: 'Forget', onClick: () => { setList(pbLooksDelete(e.id)); setNote('Forgot “' + e.name + '”.'); } }, '✕'))))
      : h('p', { className: 'pb-creator-note pb-looks-empty' }, 'No saved characters yet — name this one and SAVE CHARACTER to keep it for any slot, any team.'),
    note ? h('div', { className: 'pb-looks-note', role: 'status' }, note) : null);
}

// THE TABS (2026-11-03): the creator's open tab / body part / kinds, kept while the page lives (every creator is one CreatorControls)
// (THE BODY SLOTS: a word of 11+ letters gets a soft hyphen at its middle, so a narrow tile breaks it there with a "-", never mid-cut)
const _pbSoftWrap = (t) => String(t).replace(/[A-Za-z]{11,}/g, w => w.slice(0, Math.ceil(w.length / 2)) + '\u00ad' + w.slice(Math.ceil(w.length / 2)));
let _pbCcTab = 'body', _pbCcSlot = 'head', _pbCcKinds = {}, _pbCcLayer = 1;   // (THE LAYERS 1 2 3: the torso layer open)
/* THE CREATOR ICONS (2026-11-04, mondo: "i just want to add icons for the different tabs and wear to make it easier to navigate" + "try
   to find icons from this asset pack" = SunGraphica's Minimal Game Icons Pack, his copy of the full pack). One white silhouette per
   creator tab (BODY ... OUTFIT) and per OUTFIT body part (Head ... Footwear), on R2 Assets/ui/icons/creator/<key>.png (bake-creator-icons.py
   cuts them from the pack: trimmed, square, 128 px). Drawn as a CSS mask filled with the button's own text colour, so a tab's icon
   turns gold with its label and the UI Maker's colours carry over. A key missing here draws no icon (the button is text only).
   Credit: data.js EW_CREDITS (SunGraphica). */
const CC_ICON_BASE = 'https://cdn.entropywars.net/Assets/ui/icons/creator/';
const CC_ICONS = {
  body: 'tab_body', face: 'tab_face', skin: 'tab_skin', hair: 'tab_hair', outfit: 'tab_outfit',
  'slot:head': 'slot_head', 'slot:face': 'slot_face', 'slot:neck': 'slot_neck', 'slot:torso': 'slot_torso', 'slot:back': 'slot_back',
  'slot:larm': 'slot_larm', 'slot:rarm': 'slot_rarm', 'slot:waist': 'slot_waist', 'slot:legs': 'slot_legs', 'slot:feet': 'slot_feet',
};
const ccIcon = (key) => CC_ICONS[key] ? h('i', { className: 'pb-cc-icon', 'aria-hidden': true, style: { '--cc-icon': 'url(' + CC_ICON_BASE + CC_ICONS[key] + '.png)' } }) : null;
function CreatorControls({ appearance, gender, disabled, onChange, footer, name, onName, onLoad }) {
  const changeAppearance = (changes, g) => onChange(changes, g);
  const mpfb = !!(appearance && appearance.body && appearance.body !== 'classic');   // THE MPFB BODIES (2026-11-01)
  /* THE BUST (2026-11-01, mondo: "let's remove the bust slider from non female bodies"): only on the classic FEMALE base and
     the female MPFB bodies (sprites.js EW_MPFB_BODIES gender) */
  const femaleBody = mpfb ? ((window.EW_MPFB_BODIES || []).find(b => b.id === appearance.body) || {}).gender === 'female' : gender === 'female';
  const chestBand = mpfb && window.mpfbKitOf && window.EW_MH_CHEST && window.EW_MH_CHEST.band[window.mpfbKitOf(appearance.body)];   // THE CHEST: this body paints a chest band
  const [mainTab, setMainTab] = React.useState(() => _pbCcTab);   // THE TABS (2026-11-03): BODY / FACE / SKIN / HAIR / OUTFIT
  const [slotTab, setSlotTab] = React.useState(() => _pbCcSlot);   // THE BODY SLOTS: the body part open on OUTFIT
  const [kindBySlot, setKindBySlot] = React.useState(() => ({ ..._pbCcKinds }));   // THE BODY SLOTS: the kind open on each body part
  React.useEffect(() => { _pbCcSlot = slotTab; }, [slotTab]);
  React.useEffect(() => { _pbCcKinds = kindBySlot; }, [kindBySlot]);
  const [layerTab, setLayerTab] = React.useState(() => _pbCcLayer);   // THE LAYERS 1 2 3: the torso layer open (1, 2 or 3)
  React.useEffect(() => { _pbCcLayer = layerTab; }, [layerTab]);
  /* THE WALK STYLE rev 2 (2026-11-05, mondo: "clicking on a walk animation should make the animation play automatically ... the preview
     walk button ... should obviously be right by the walk animations"): the stage's walk state (three-renderer.js 'ew-cv-state') for the
     WALK / STOP WALK button on the Walk row */
  const [ccWalking, setCcWalking] = React.useState(() => !!(window.EWCharViewer && window.EWCharViewer.isWalking && window.EWCharViewer.isWalking()));
  React.useEffect(() => {
    const f = (e) => setCcWalking(!!(e && e.detail && e.detail.playing === 'walk'));
    window.addEventListener('ew-cv-state', f);
    return () => window.removeEventListener('ew-cv-state', f);
  }, []);
  const [faceCat, setFaceCat] = React.useState('eyes');   // THE FACE SLIDERS: the FACE tab open (MPFB heads)
  const [wearFor, setWearFor] = React.useState(null);   // THE SHELVES: MEN / WOMEN (null = the body's own)
  /* THE HIDDEN PICKS (2026-11-03): the dev item hider (sprites.js creatorHidden; on while Settings > Developer > Creator Item Hider is
     ON). A hide / show / the setting re-renders the controls through the 'ew-creator-hidden' event. */
  const [, setHidTick] = React.useState(0);
  const [hideMarks, setHideMarks] = React.useState(true);   // the ✕ / SHOW marks on every tile (off = the lists as players see them)
  const [hidListOpen, setHidListOpen] = React.useState(false);
  const [hidNote, setHidNote] = React.useState('');
  const [namesOpen, setNamesOpen] = React.useState(false);   // THE RENAMED PICKS: the bar's RENAMED list open
  const [renKey, setRenKey] = React.useState(null);   // THE RENAMED PICKS: the pick being renamed ('tile|<kind>:<id>' or 'list|<kind>:<id>')
  const renRef = React.useRef(null);
  React.useEffect(() => {
    const f = () => setHidTick(n => n + 1);
    window.addEventListener('ew-creator-hidden', f);
    /* THE RENAMED PICKS (2026-11-03, mondo: "there is no settings button in the character creator, i need to access it from the
       character creator obviously"): F2 while the creator is up opens / closes the hider (like F4 opens the UI Maker); no button
       for players. (One creator answers one press: the first one marks it handled.) */
    const k = (e) => {
      if (e.key !== 'F2' || e.repeat || e.ctrlKey || e.altKey || e.metaKey || e.defaultPrevented || !window.setCreatorHiderOn) return;
      e.preventDefault();
      window.setCreatorHiderOn(!(window.creatorHiderOn && window.creatorHiderOn()));
    };
    window.addEventListener('keydown', k);
    return () => { window.removeEventListener('ew-creator-hidden', f); window.removeEventListener('keydown', k); };
  }, []);
  /* rev 9 (2026-09-13 — the colour-picker lag): a native <input type=color> and a range slider fire a
     change per pointer move, and each one re-rendered the whole forge and re-dressed the stage. Continuous
     controls go through `queueChange`: the values coalesce and ONE change lands per animation frame (the
     last wins); the stage's own settle timer then does the full-resolution bake. Clicks stay immediate. */
  const ccQueued = React.useRef(null), ccRaf = React.useRef(0);
  const queueChange = (changes) => {
    ccQueued.current = Object.assign(ccQueued.current || {}, changes);
    if (ccRaf.current) return;
    const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (fn) => setTimeout(fn, 16);
    ccRaf.current = raf(() => { ccRaf.current = 0; const c = ccQueued.current; ccQueued.current = null; if (c) changeAppearance(c); });
  };
  React.useEffect(() => () => { if (ccRaf.current && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(ccRaf.current); ccRaf.current = 0; }, []);
  // THE FACE CAMERA: closing the creator hands the stage back on the full body
  React.useEffect(() => () => { const cv = window.EWCharViewer; if (cv && typeof cv.frameCreator === 'function') cv.frameCreator('body'); }, []);
  const [pbFabricThumbs, setPbFabricThumbs] = React.useState({});
  const [pbPatternThumbs, setPbPatternThumbs] = React.useState({});
  const pbPatternPending = React.useRef({});
  const requestPatternThumb = (tk, fabric, pat, c1, c2) => {
    if (pbPatternPending.current[tk] || !window.EWCharViewer || typeof window.EWCharViewer.patternThumb !== 'function') return;
    pbPatternPending.current[tk] = true;
    window.EWCharViewer.patternThumb(fabric, pat, c1, c2, url => { if (url) setPbPatternThumbs(prev => prev[tk] ? prev : { ...prev, [tk]: url }); });
  };
  React.useEffect(() => {
    if (!window.EWCharViewer || typeof window.EWCharViewer.fabricThumb !== 'function') return;
    let live = true;
    Object.keys(window.EW_FABRICS || {}).forEach(key => {
      if (!window.EW_FABRICS[key].file) return;
      window.EWCharViewer.fabricThumb(key, url => { if (live && url) setPbFabricThumbs(prev => prev[key] ? prev : { ...prev, [key]: url }); });
    });
    return () => { live = false; };
  }, []);
  if (!appearance) return null;
  /* THE HIDDEN PICKS (2026-11-03, mondo: "a devtool that let's me remove models like certain clothes and hairstyles from the character
     creator"): a hidden pick is left off its list unless it is worn (a saved look's piece always shows, so it can be seen + taken off);
     while the hider is on with its marks, every pick shows, a hidden one dimmed, each with ✕ (hide) / SHOW on its corner. Nothing in
     the look or the files changes. */
  const devHider = !!(window.creatorHiderOn && window.creatorHiderOn()), devMarks = devHider && hideMarks;
  const hidNever = id => id == null || id === 'none' || id === 'own' || id === 'bald' || id === 'default';
  const isHid = (kind, id) => !!(kind && window.creatorHidden && window.creatorHidden(kind, id));
  const keepPick = (kind, id, on) => !kind || devMarks || on || !isHid(kind, id);
  /* THE RENAMED PICKS (2026-11-03, mondo: "can i change the names of the models of the character creator? Or maybe in the same place
     where i can hide models"): a pick's name on its tile = his (sprites.js creatorName) or its own. Display only: the rules that read a
     pack name (a skin's side, a beard's camera, the men's / women's trim) still get the pick's own label. */
  const renamedOf = (kind, id) => (kind && window.creatorRenamed ? window.creatorRenamed(kind, id) : null);
  const shownName = (kind, id, label) => { const n = renamedOf(kind, id); return n != null ? n : label; };
  // the rename box: right under the tile (the whole row), or under its row in the RENAMED list
  const renEditor = (where, kind, id, label) => {
    const cur = renamedOf(kind, id), own = String(label || id);
    const save = (v) => { if (window.setCreatorName) window.setCreatorName(kind, id, v); setRenKey(null); };
    return h('div', { key: 'ren:' + kind + ':' + id, className: 'pb-cc-rename', role: 'group', 'aria-label': 'Rename ' + own },
      h('div', { className: 'pb-cc-rename-head' }, h('b', null, 'RENAME'), h('span', null, 'Its own name: ', h('i', null, own))),
      h('input', { ref: renRef, className: 'pb-gear-input', defaultValue: cur || own, maxLength: 40, autoFocus: true, 'aria-label': 'New name for ' + own,
        onFocus: e => { try { e.target.select(); } catch (er) {} },
        onKeyDown: e => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); save(e.target.value); } else if (e.key === 'Escape') { e.preventDefault(); setRenKey(null); } } }),
      h('div', { className: 'pb-creator-options' },
        h('button', { type: 'button', className: 'ms-tty-btn primary', onClick: () => save(renRef.current ? renRef.current.value : '') }, 'SAVE NAME'),
        cur ? h('button', { type: 'button', className: 'ms-tty-btn', title: 'Back to “' + own + '”', onClick: () => save('') }, 'ORIGINAL NAME') : null,
        h('button', { type: 'button', className: 'ms-tty-btn', onClick: () => setRenKey(null) }, 'CANCEL')));
  };
  // (label = the pick's OWN name: the hidden list keeps it; the marks' tips say the name shown)
  const devTile = (kind, id, label, el) => {
    if (!kind || !devMarks || hidNever(id) || !window.setCreatorHidden) return el;
    const hid = isHid(kind, id), own = String(label || id), nm = shownName(kind, id, own), rk = 'tile|' + kind + ':' + id, open = renKey === rk;
    const wrap = h('div', { key: el.key, className: 'pb-cc-devwrap' + (hid ? ' hidden' : '') + (open ? ' renaming' : '') }, el,
      window.setCreatorName ? h('button', { type: 'button', className: 'pb-cc-devren', title: 'Rename ' + nm + ' (only the name on its tile changes)',
        'aria-label': 'Rename ' + nm, 'aria-expanded': open, onClick: e => { e.stopPropagation(); setRenKey(open ? null : rk); } }, '\u270e') : null,
      h('button', { type: 'button', className: 'pb-cc-devx', title: hid ? 'Show ' + nm + ' in the creator again' : 'Hide ' + nm + ' from the creator (nothing is deleted)',
        'aria-label': (hid ? 'Show ' : 'Hide ') + nm, onClick: e => { e.stopPropagation(); window.setCreatorHidden(kind, id, !hid, own); } }, hid ? 'SHOW' : '\u2715'));
    return open ? h(React.Fragment, { key: el.key }, wrap, renEditor('tile', kind, id, own)) : wrap;
  };
  const ccLimits = window.EW_APPEARANCE_LIMITS || {}, ccEnums = window.EW_APPEARANCE_ENUMS || {};
  const ccHair = window.EW_HAIR_STYLES || [], ccFabrics = window.EW_FABRICS || {};
  const ccPatterns = window.EW_PATTERNS || [{ id: 'solid', label: 'Solid' }], ccLayers = window.EW_APPEARANCE_LAYERS || [];
  const ccSlider = (key, label, pct) => {
    const limits = ccLimits[key]; if (!limits || !appearance) return null;
    const v = appearance[key];
    const shown = pct ? Math.round(v * 100) + '%' : (limits[0] === 0 ? Math.round(v * 100) : (v > 0 ? '+' : '') + Math.round(v * 100));
    return h('label', { key, className: 'pb-creator-slider' },
      h('span', null, label, h('output', null, shown)),
      h('input', { type: 'range', min: limits[0], max: limits[1], step: 0.01, value: v, 'aria-label': label, onChange: e => queueChange({ [key]: Number(e.target.value) }) }));
  };
  const ccColorRow = (key, label, swatches) => h('div', { key, className: 'pb-creator-colorrow' },
    h('span', { className: 'pb-creator-colorlabel' }, label),
    h('div', { className: 'pb-creator-swatches' }, swatches.map(color =>
      h('button', { key: color, className: 'pb-creator-swatch', style: { background: color }, 'aria-label': label + ' ' + color, 'aria-pressed': appearance[key] === color, onClick: () => changeAppearance({ [key]: color }) })),
      h('label', { className: 'pb-creator-custom', title: 'Custom ' + label.toLowerCase() }, h('input', { type: 'color', value: appearance[key], 'aria-label': 'Custom ' + label, onChange: e => queueChange({ [key]: e.target.value }) }), h('i', null, '+'))));
  const ccChoice = (key, options, lookOf, hideKind, onPick) => h('div', { className: 'pb-creator-options', role: 'group' }, options.filter(([id]) => keepPick(hideKind, id, appearance[key] === id)).map(([id, label]) =>
    devTile(hideKind, id, label, h('button', { key: id, className: 'ms-tty-btn' + (appearance[key] === id ? ' primary' : ''), 'aria-pressed': appearance[key] === id, onClick: () => { const same = appearance[key] === id; changeAppearance(Object.assign({ [key]: id }, lookOf && !same ? lookOf(id) : {})); if (onPick) onPick(id, same); } }, shownName(hideKind, id, label)))));   // (THE HIDDEN PICKS: hideKind = the pick's kind; THE RENAMED PICKS: his name; onPick(id, same): after the pick, THE WALK STYLE)
  // a wardrobe LAYER row: the style buttons, then (while something is worn) its fabric tiles + the print + the colours
  /* THE RETIRED CLASSIC CLOTHES (2026-11-02, mondo: "get rid of any classic clothes and shoes ... make sure we have a
     replacement"): a catalogue without the retired coded picks (sprites.js EW_RETIRED_CLOTHES; a look wearing one is moved to
     its replacement by normalizeCharacterAppearance), and whether a worn Blender piece takes a layer's fabric / colour / print */
  const ccLive = (slot, cat) => (cat || []).filter(o => !((window.EW_RETIRED_CLOTHES || {})[slot] || {})[o.id]);
  const ccLayerWorn = (layer) => (appearance.wear || []).some(id => (window.EW_WEAR_LAYER_OF || {})[id] === layer);
  // (THE LAYERS 1 2 3: opts.extra = what else a pick takes off (the layer's other kinds); opts.first = the kind listed first; opts.noNone)
  const ccLayer = (label, key, catalogue, fabricKey, colorKey, onRemove, opts) => {
    opts = opts || {};
    const cat = (Array.isArray(catalogue) ? catalogue : (window[catalogue] || [{ id: 'none', label: 'None' }]));
    const hk = key === 'outer' || key === 'outer2' ? 'outer' : key === 'feet' ? 'feet' : null;   // THE HIDDEN PICKS
    const list = cat.map(o => [o.id, o.label]).filter(([id]) => keepPick(hk, id, appearance[key] === id));
    const worn = appearance[key] !== 'none';
    // THE BLENDER COATS (2026-11-01): a pick with a `look` (sprites.js EW_BLENDER_COATS) starts at its colour + fabric
    const pat = colorKey.replace(/Color$/, 'Pattern');
    const lookOf = id => { const o = cat.find(x => x.id === id); return Object.assign({}, id !== 'none' && opts.extra ? opts.extra : {}, o && o.look ? { [colorKey]: o.look.color, [fabricKey]: o.look.fabric, [pat]: 'solid' } : {}); };
    /* THE OPEN + CLOSED FRONTS (2026-11-02, mondo: "any coat or jacket etc option needs to have an open and closed option"): an
       Outer pick with a front opening (sprites.js outerHasFronts) shows FRONT: OPEN / CLOSED; the choice is the layer's own
       (outerFront / outer2Front) and stays when another coat is picked */
    const frontKey = key === 'outer' ? 'outerFront' : key === 'outer2' ? 'outer2Front' : null;
    const hasFronts = frontKey && worn && typeof window.outerHasFronts === 'function' && window.outerHasFronts(appearance[key]);
    const frontNow = hasFronts ? window.outerFrontWorn(appearance[key], appearance[frontKey]) : null;
    // THE SHELVES (2026-11-02): an Outer layer's picks in kinds (sprites.js EW_OUTER_GROUPS): None, then Coats + jackets, Robes, Uniforms, Costumes
    const groups = (key === 'outer' || key === 'outer2') && window.EW_OUTER_GROUPS ? (() => {
      const known = new Set([].concat(...window.EW_OUTER_GROUPS.map(g => g[1])));
      const gs = window.EW_OUTER_GROUPS.map(([gl, ids]) => [gl, list.filter(([id]) => ids.includes(id))])
        .concat([['Other', list.filter(([id]) => id !== 'none' && !known.has(id))]]).filter(g => g[1].length);
      const f = opts.first ? gs.findIndex(g => g[0] === opts.first) : -1;
      return f > 0 ? [gs[f]].concat(gs.filter((g, i) => i !== f)) : gs;
    })() : null;
    return h(React.Fragment, { key },
      h('div', { className: 'pb-creator-colorlabel pb-layer-head' }, label, onRemove ? h('button', { className: 'ms-tty-btn pb-layer-remove', title: 'Take this layer off', onClick: onRemove }, '✕ REMOVE') : null),
      groups ? h(React.Fragment, null,
        !opts.noNone && list.some(([id]) => id === 'none') ? ccChoice(key, list.filter(([id]) => id === 'none'), lookOf) : null,
        groups.map(([gl, items]) => h(React.Fragment, { key: gl }, h('div', { className: 'pb-creator-colorlabel pb-cc-shelf-sub' }, gl), ccChoice(key, items, lookOf, hk))))
        : ccChoice(key, list, lookOf, hk),
      hasFronts ? h('div', { className: 'pb-creator-options pb-cc-front', role: 'group', 'aria-label': label + ' front' },
        h('span', { className: 'pb-creator-colorlabel' }, 'Front'),
        [['open', 'OPEN'], ['closed', 'CLOSED']].map(([id, txt]) => h('button', { key: id, className: 'ms-tty-btn' + (frontNow === id ? ' primary' : ''), 'aria-pressed': frontNow === id,
          title: id === 'open' ? 'Wear it open down the front' : 'Wear it closed (buttoned / zipped)', onClick: () => { if (frontNow !== id) changeAppearance({ [frontKey]: id }); } }, txt))) : null,
      worn ? ccFabricTiles(fabricKey, label, true) : null,
      worn ? ccPrint(fabricKey, colorKey, label) : null);
  };
  /* THE EXTRA LAYERS (rev 10, 2026-09-13 — "a plus sign icon so I can wear briefs over trousers"): sprites.js
     EW_APPEARANCE_LAYERS rows with `extra: true` (a second top over the top, a second pair of bottoms over the
     bottoms). ＋ ADD LAYER lists the ones not worn; each worn one is a full layer row (style · fabric · print · colours)
     with ✕ REMOVE. */
  const [addOpen, setAddOpen] = React.useState(false);
  // THE RETIRED CLASSIC CLOTHES (2026-11-02): the second top / bottoms were coded shells - only the second outer stays
  const extraLayers = ccLayers.filter(L => L.extra && L.slot === 'outer2');
  // 2026-11-01 THE SECOND OUTER LAYER: `outer2` offers the Outer layer's whole catalogue (the coded coats + the Blender coats,
  // robes, uniforms; a Blender pick starts at its own colour + fabric, as on the Outer layer) and starts as a coat
  const extraStyles = (L) => (L.slot === 'outfit2' ? (window.EW_OUTFIT_STYLES || []) : L.slot === 'outer2' ? ccOuterList('outer2') : (window.EW_BOTTOM_STYLES || [])).filter(o => o.id !== 'none');
  const extraDefault = (L) => L.slot === 'outfit2' ? 'tank' : L.slot === 'outer2' ? 'blongcoat' : 'briefs';
  const ccExtraLayers = () => h(React.Fragment, null,
    extraLayers.filter(L => appearance[L.slot] && appearance[L.slot] !== 'none').map(L =>
      ccLayer(L.label || L.id, L.slot, extraStyles(L), L.fabric, L.color, () => changeAppearance({ [L.slot]: 'none' }))),
    extraLayers.some(L => !appearance[L.slot] || appearance[L.slot] === 'none') ? h('div', { className: 'pb-cc-add' },
      h('button', { className: 'ms-tty-btn pb-cc-add-btn', 'aria-expanded': addOpen, onClick: () => setAddOpen(o => !o), title: 'Wear another layer over what you have on' }, h('b', null, '＋'), ' ADD LAYER'),
      addOpen ? h('div', { className: 'pb-creator-options pb-cc-add-menu', role: 'menu' },
        extraLayers.filter(L => !appearance[L.slot] || appearance[L.slot] === 'none').map(L =>
          h('button', { key: L.slot, className: 'ms-tty-btn', role: 'menuitem', onClick: () => { setAddOpen(false); changeAppearance({ [L.slot]: extraDefault(L) }); } }, (L.label || L.id).toUpperCase()))) : null) : null);
  /* THE PRINT (rev 8, 2026-09-13): a layer's pattern tiles (each a live swatch drawn by the rig's own painter —
     EWCharViewer.patternThumb — in the layer's current two colours over its fabric) and its two colour rows:
     COLOUR 1 = the ground / the tint, COLOUR 2 = the print (only while a print is on). The pattern key and the
     colour-2 key follow sprites.js EW_APPEARANCE_LAYERS (`topPattern` / `topColor2` …). */
  const ccPrint = (fabricKey, colorKey, label) => {
    const L = ccLayers.find(l => l.fabric === fabricKey) || {};
    const patKey = L.pattern || fabricKey.replace(/Fabric$/, 'Pattern'), c2Key = L.color2 || colorKey + '2';
    const pat = appearance[patKey] || 'solid', printed = pat !== 'solid';
    return h(React.Fragment, null,
      h('div', { className: 'pb-cc-tiles pb-cc-prints', role: 'group', 'aria-label': label + ' print' },
        ccPatterns.map(p => {
          const on = pat === p.id, tk = p.id === 'solid' ? null : [appearance[fabricKey], p.id, appearance[colorKey], appearance[c2Key]].join('|');
          const thumb = tk ? pbPatternThumbs[tk] : null;
          if (tk && !thumb) requestPatternThumb(tk, appearance[fabricKey], p.id, appearance[colorKey], appearance[c2Key]);
          return h('button', { key: p.id, className: 'pb-cc-tile pb-pattern-tile' + (thumb ? ' has-thumb' : '') + (p.id === 'solid' ? ' plain' : ''), 'aria-pressed': on, title: p.label,
            style: thumb ? { backgroundImage: 'url(' + thumb + ')' } : (p.id === 'solid' ? { background: appearance[colorKey] } : undefined), onClick: () => changeAppearance({ [patKey]: p.id }) },
            h('span', null, _pbSoftWrap(p.label)));
        })),
      ccColorRow(colorKey, label + (printed ? ' colour 1' : ' tint'), clothSwatches),
      printed ? ccColorRow(c2Key, label + ' colour 2', clothSwatches) : null);
  };
  const ccFabricTiles = (key, label, compact) => h('div', { className: 'pb-cc-tiles pb-cc-fabrics' + (compact ? ' pb-cc-compact' : ''), role: 'group', 'aria-label': (label || (key === 'topFabric' ? 'Top' : 'Trouser')) + ' fabric' },
    (ccEnums[key] || []).map(id => {
      const def = ccFabrics[id] || { label: id }, thumb = def.file ? pbFabricThumbs[id] : null;
      return h('button', { key: id, className: 'pb-cc-tile pb-fabric-tile' + (thumb ? ' has-thumb' : '') + (def.file ? '' : ' plain'), 'aria-pressed': appearance[key] === id, title: def.label,
        style: thumb ? { backgroundImage: 'url(' + thumb + ')' } : undefined, onClick: () => changeAppearance({ [key]: id }) },
        h('span', null, _pbSoftWrap(def.label)));
    }));
  const skinSwatches = ['#f4d7bf', '#e8c4a2', '#dfb18c', '#c9946b', '#b98362', '#a06a48', '#916044', '#7a4e36', '#66422e', '#4d3226', '#3c291f'];
  const hairSwatches = ['#0f0d0c', '#27201c', '#3b2a1f', '#5a3b25', '#7a4a2a', '#a0662e', '#c98a4a', '#e2c184', '#f1e2b3', '#8b1e1e', '#b5b5b5', '#f2f2f2', '#3b5bdb', '#b03aa0', '#2e8b57'];
  const eyeSwatches = ['#2d2a26', '#4a3222', '#6b4b2a', '#3d5a3a', '#4a6b8a', '#6a8fb5', '#7a8c6a', '#9a9a9a', '#b8860b', '#8b1e1e', '#2f7fd8', '#3fa34d', '#7b4fc9', '#d0d8e0'];   // 2026-11-03: + bright blue, green, violet, pale
  const lipSwatches = ['#b98a7a', '#9c5a5c', '#a0413f', '#7a2e33', '#c26a8a', '#3a2a2a', '#d9776b', '#c8102e', '#6b2d5c', '#5b3a8a', '#1a1214'];   // 2026-11-03 THE LIP COLOUR: + coral, red, plum, violet, black
  const clothSwatches = ['#f0ece2', '#8fa3a8', '#5e6f80', '#344a50', '#2a2f38', '#141518', '#7a1f1f', '#c0392b', '#b8741a', '#c9a227', '#2e7d32', '#1f5f8b', '#5b3a8a', '#ad4c86'];
  const frameSwatches = ['#1b1b1f', '#4a3222', '#8a6a3a', '#c9a227', '#b5b5b5', '#f2f2f2', '#7a1f1f', '#1f5f8b', '#2e7d32', '#ad4c86'];
  /* THE FACE CAMERA (2026-11-01, mondo: "when editing facial features or hair or headwear in the character creator, please
     make the camera zoom into the face closeup"): a press / focus anywhere in the controls glides the stage camera to the
     face or back to the full body (EWCharViewer.frameCreator). The zone of a control = its own `data-cc-cam-own` (or an
     ancestor's inside the panel), else the nearest `data-cc-cam` section marker above it: FACE, HAIR, glasses and the pack
     hats / glasses / masks (+ beards, horns, antlers) are 'face'; BODY, skin, clothes, layers, neckwear, wings are 'body'. */
  const ccCamZone = (target, root) => {
    for (let el = target; el && el !== root; el = el.parentElement) { const z = el.getAttribute && el.getAttribute('data-cc-cam-own'); if (z) return z; }
    let top = target; while (top && top.parentElement && top.parentElement !== root) top = top.parentElement;
    if (!top || top.parentElement !== root) return null;
    for (let el = top; el; el = el.previousElementSibling) { const z = el.getAttribute('data-cc-cam'); if (z) return z; }
    return null;
  };
  const ccCamFrom = (e) => {
    const z = ccCamZone(e.target, e.currentTarget), cv = window.EWCharViewer;
    if ((z === 'face' || z === 'body') && cv && typeof cv.frameCreator === 'function') cv.frameCreator(z);
  };
  const ccWearFace = (cat, label) => ['hats', 'glasses', 'masks', 'horns', 'heads'].includes(cat) || /beard|moustache|horn|antler|head mirror|headset/i.test(label || '');
  /* THE WEAR TINT (2026-11-01, mondo: "add a way to change the tint/color of the cowboy hat, and other clothes/accessories that were
     from the asset packs since they have their own textures"): one row per worn pack piece (sprites.js wearTintable: not the
     facial hair, which has its own colour row, nor the Blender pieces that take the Top / Bottoms colour): its original colours,
     or a picked colour over its own texture's shading (appearance.wearTint) */
  const wearSwatches = clothSwatches.concat(['#0f0d0c', '#3b2a1f', '#5a3b25', '#7a4a2a', '#a0662e', '#e2c184', '#b5b5b5']);
  const ccWearTints = (shelf) => {
    const ok = window.wearTintable || (() => false), all = window.EW_MH_WEAR || [];
    const rows = (appearance.wear || []).concat(appearance.wear2 && appearance.wear2 !== 'none' ? [appearance.wear2] : []).filter(id => ok(id) && (!shelf || (typeof shelf === 'function' ? shelf(id) : shelfOf(id) === shelf))).map(id => all.find(w => w[0] === id)).filter(Boolean);   // (THE BODY SLOTS: shelf = a test on the id)
    if (!rows.length) return null;
    const T = appearance.wearTint || {};
    const setT = (id, c, queued) => { const next = { ...T }; if (c) next[id] = c; else delete next[id]; (queued ? queueChange : changeAppearance)({ wearTint: next }); };
    return h(React.Fragment, null,
      h('div', { className: 'pb-creator-colorlabel' }, rows.some(r => window.wearFabricable && window.wearFabricable(r[0])) ? 'Colours + fabrics of the pieces you wear' : 'Colours of the pieces you wear'),
      rows.map(([id, label, cat]) => {
        /* one colour block: key = the wear id, or '<id>:band' for THE BAND TINT (2026-11-03: a hat's band coloured apart, sprites.js EW_WEAR_BANDS) */
        const block = (key, name, pick) => {
          const cur = T[key];
          return h(React.Fragment, { key },
            h('div', { className: 'pb-creator-colorlabel' }, name),
            h('div', { className: 'pb-creator-options', role: 'group', 'aria-label': name + ' colour' },
              h('button', { className: 'ms-tty-btn' + (cur ? '' : ' primary'), 'aria-pressed': !cur, onClick: () => { if (cur) setT(key, null); } }, 'Original colours'),
              h('button', { className: 'ms-tty-btn' + (cur ? ' primary' : ''), 'aria-pressed': !!cur, onClick: () => { if (!cur) setT(key, pick); } }, 'Pick a colour')),
            cur ? h('div', { className: 'pb-creator-colorrow' },
              h('span', { className: 'pb-creator-colorlabel' }, 'Colour'),
              h('div', { className: 'pb-creator-swatches' }, wearSwatches.map(c =>
                h('button', { key: c, className: 'pb-creator-swatch', style: { background: c }, 'aria-label': name + ' ' + c, 'aria-pressed': cur === c, onClick: () => setT(key, c) })),
                h('label', { className: 'pb-creator-custom', title: 'Custom ' + name.toLowerCase() + ' colour' }, h('input', { type: 'color', value: cur, 'aria-label': 'Custom ' + name + ' colour', onChange: e => setT(key, e.target.value, true) }), h('i', null, '+')))) : null);
        };
        const band = (window.EW_WEAR_BANDS || []).includes(id);
        /* THE PACK FABRICS (2026-11-03, mondo: "can we add the option to change the pants textures like cotton and leather"): a pack
           pair of trousers (sprites.js wearFabricable) wears its own texture or any creator fabric (the Bottoms layer's tiles, the
           same thumbnails) under its own shading, in the colour above (its own average colour while that is Original colours) */
        const fabricRow = () => {
          const F = appearance.wearFabric || {}, cur = F[id] || 'own';
          const setF = (f) => { const next = { ...F }; if (f === 'own') delete next[id]; else next[id] = f; changeAppearance({ wearFabric: next }); };
          const ids = ['own'].concat((ccEnums.bottomFabric || Object.keys(ccFabrics)).filter(f => f !== 'plain' && (ccFabrics[f] || {}).file));
          return h(React.Fragment, null,
            h('div', { className: 'pb-creator-colorlabel' }, shownName('wear', id, label) + ' fabric'),
            h('div', { className: 'pb-cc-tiles pb-cc-fabrics pb-cc-compact', role: 'group', 'aria-label': shownName('wear', id, label) + ' fabric' },
              ids.map(f => {
                const def = f === 'own' ? { label: 'Original texture' } : (ccFabrics[f] || { label: f }), thumb = f === 'own' ? null : pbFabricThumbs[f];
                return h('button', { key: f, className: 'pb-cc-tile pb-fabric-tile' + (thumb ? ' has-thumb' : '') + (f === 'own' ? ' plain' : ''), 'aria-pressed': cur === f, title: def.label,
                  style: thumb ? { backgroundImage: 'url(' + thumb + ')' } : undefined, onClick: () => { if (cur !== f) setF(f); } }, h('span', null, _pbSoftWrap(def.label)));
              })));
        };
        return h('div', { key: id, className: 'pb-cc-weartint', 'data-cc-cam-own': ccWearFace(cat, label) ? 'face' : 'body' },
          block(id, shownName('wear', id, label), '#5a3b25'),   // (THE RENAMED PICKS)
          window.wearFabricable && window.wearFabricable(id) ? fabricRow() : null,
          band ? block(id + ':band', 'Band', '#0f0d0c') : null);
      }));
  };
  /* THE SHELVES (2026-11-02, mondo: "Can we organize the character creator better? Like there are wings at the bottom but then there
     are wings in equipment or another tab ... There are male and female clothes scattered all throughout, it should be separated by
     male and female. Just organize all of the models better"). Every kind of piece has ONE tab (sprites.js EW_WEAR_SHELVES /
     wearShelfOf): CLOTHES = Tops ... Masks, with the Outer layer + second outer + Cape on "Coats + capes", the Feet layer on "Shoes",
     the belt / tie / suspenders on "Belts + ties" (+ each one's fabric / colour / print rows on its own tab); ACCESSORIES = Wings (the
     flapping wings + the pack's costume wings), Horns + antlers, Tails, Nails, Held items + gear; the facial hair stays under FACE only.
     The MEN / WOMEN switch (the body's own to start) lists the pieces made for that body (sprites.js wearMadeFor) + the ones that fit
     anyone; a worn piece always shows, and any piece can be picked on any body. Display only: the pieces, their categories and every
     saved / baked look are untouched. */
  const shelfOf = window.wearShelfOf || (id => { const w = (window.EW_MH_WEAR || []).find(x => x[0] === id); return w ? w[2] : null; });
  const madeFor = window.wearMadeFor || (() => 'both');
  const shelves = window.EW_WEAR_SHELVES || [];
  const sideNow = wearFor || (femaleBody ? 'female' : 'male'), sideOther = sideNow === 'female' ? 'male' : 'female';
  const worn = appearance.wear || [];
  const shelfMany = (t) => !!(shelves.find(x => x[0] === t) || [])[3];
  // the Outer layer picks for this side (+ the one worn); a pick made for the other body still shows while it is on
  const ccOuterList = (slot) => ccLive('outer', window.EW_OUTER_STYLES).filter(o => o.id === 'none' || o.id === appearance[slot] || (window.outerMadeFor ? window.outerMadeFor(o.id) : 'both') !== sideOther);
  // a tile's name inside its men's / women's list: the pack's own name less the "male" / "female" it is now listed under
  const tileLabel = (label) => {
    const t = String(label).replace(/([a-z])(\d)/gi, '$1 $2').replace(/\b(fe)?male\b|\bladies\b/gi, ' ').replace(/^\s*[fm]\s+/i, '').replace(/\s+/g, ' ').trim();
    // (THE BODY SLOTS 2026-11-03: a word too long for its tile - COLLABERATION, ORKIFYHEADTARGET - gets a soft hyphen at its middle, so it
    // breaks there with a "-" instead of being cut at the tile edge)
    const u = _pbSoftWrap(t);
    return u ? u[0].toUpperCase() + u.slice(1) : label;
  };
  // one pick per tab (a tab of several, like underwear or horns, toggles each); the pack's own one-per-category rule still applies
  const shapeHeads = window.EW_SHAPE_HEADS || [];
  const shapeEars = window.EW_SHAPE_EARS || [];   // THE SHAPED EARS (2026-11-03): cat ears, a reshape of the body's own ears
  const shapeHeadOn = (k) => (+appearance[k] || 0) > 0.004;
  const toggleWear = (t, id) => {
    const on = worn.includes(id);
    const patch = { wear: on ? worn.filter(x => x !== id) : (shelfMany(t) ? worn : worn.filter(x => shelfOf(x) !== t)).concat([id]) };
    if (!on && t === 'heads') shapeHeads.forEach(([k]) => { if (shapeHeadOn(k)) patch[k] = 0; });   // (THE SHAPED HEADS: one head at a time)
    if (!on && window.wearGroupOf && window.wearGroupOf(id) === 'ears') shapeEars.forEach(([k]) => { if (shapeHeadOn(k)) patch[k] = 0; });   // (THE SHAPED EARS: one pair of ears)
    changeAppearance(patch);
  };
  /* THE SHAPED HEADS (2026-11-03, mondo: "add the werewolf head to the creature heads"): a head that reshapes the body's own head
     (sprites.js EW_SHAPE_HEADS, a MakeHuman target) is a pick here like the model heads; picked = full strength + its slider below */
  const ccShapePicks = (list, g, cam, name, tip) => list.length ? h(React.Fragment, null,
    h('div', { className: 'pb-cc-tiles pb-cc-hair', role: 'group', 'aria-label': name, 'data-cc-cam-own': cam },
      list.map(([k, label]) => h('button', { key: k, className: 'pb-cc-tile pb-hair-tile', 'aria-pressed': shapeHeadOn(k), title: label + tip,
        onClick: () => {
          if (shapeHeadOn(k)) { changeAppearance({ [k]: 0 }); return; }
          const patch = { [k]: 1, wear: worn.filter(x => (g === 'heads' ? shelfOf(x) : groupOf(x)) !== g) };
          list.forEach(([o]) => { if (o !== k && shapeHeadOn(o)) patch[o] = 0; });
          changeAppearance(patch);
        } }, h('span', null, label)))),
    list.filter(([k]) => shapeHeadOn(k)).length ? h('div', { className: 'pb-creator-grid', 'data-cc-cam-own': cam },
      list.filter(([k]) => shapeHeadOn(k)).map(([k, label]) => ccSlider(k, label + ' strength'))) : null) : null;
  const ccShapeHeads = (cam) => ccShapePicks(shapeHeads, 'heads', cam, 'Shaped creature heads', ' (reshapes the body\u2019s own head)');
  /* THE SHAPED EARS (2026-11-03, mondo: "Where are the cat ears in the editor? DO we not have any?"): MakeHuman community cat-ear
     targets (sprites.js EW_SHAPE_EARS) on OUTFIT > Head > Ears beside the Elf ears: picked = full strength + its slider; one pair of
     ears at a time (a cat-ear pick takes a worn ear piece off, and the other way round) */
  const ccShapeEars = (cam) => ccShapePicks(shapeEars, 'ears', cam, 'Shaped ears', ' (reshapes the body\u2019s own ears)');
  const wearTile = (cam) => ([id, label]) => {
    const on = worn.includes(id), rn = renamedOf('wear', id);   // THE RENAMED PICKS: his name as he typed it (no men's / women's trim)
    return devTile('wear', id, label, h('button', { key: id, className: 'pb-cc-tile pb-hair-tile', 'aria-pressed': on, title: rn || label, 'data-cc-cam-own': cam, onClick: () => toggleWear(shelfOf(id), id) },
      h('span', null, rn != null ? _pbSoftWrap(rn) : tileLabel(label))));
  };
  const wearGrid = (key, head, name, cam, list) => list.length ? h(React.Fragment, { key },
    head ? h('div', { className: 'pb-creator-colorlabel pb-cc-shelf-sub' }, head) : null,
    h('div', { className: 'pb-cc-tiles pb-cc-hair', role: 'group', 'aria-label': name + (head ? ' ' + head : ''), 'data-cc-cam-own': cam }, list.map(wearTile(cam)))) : null;
  // a group's pack / Blender pieces: this side's, then the ones that fit anyone, then any worn from the other side
  const wearTiles = (rows, sided, head, name, cam) => {
    if (!rows.length) return null;
    if (!sided) return wearGrid('all', head || null, name, cam, rows);
    const mine = rows.filter(r => madeFor(r[0]) === sideNow), both = rows.filter(r => madeFor(r[0]) === 'both'), other = rows.filter(r => madeFor(r[0]) === sideOther && worn.includes(r[0]));
    return h(React.Fragment, null,
      head ? h('div', { className: 'pb-creator-colorlabel pb-layer-head' }, head) : null,
      wearGrid('mine', sideNow === 'female' ? 'Women’s' : 'Men’s', name, cam, mine),
      wearGrid('both', 'Fits anyone', name, cam, both),
      wearGrid('other', 'Worn from the ' + (sideOther === 'female' ? 'women’s' : 'men’s') + ' list', name, cam, other));
  };
  // the fabric / colour / print rows of a Blender piece worn in this group (a top, bottoms or skirt, the belt + its height)
  const groupLayerRows = (g) => {
    const on = (layer) => worn.some(id => (window.EW_WEAR_LAYER_OF || {})[id] === layer && groupOf(id) === g);
    return h(React.Fragment, null,
      on('top') ? h(React.Fragment, null, h('div', { className: 'pb-creator-colorlabel' }, 'Top fabric'), ccFabricTiles('topFabric', 'Top'), ccPrint('topFabric', 'topColor', 'Top')) : null,
      on('bottom') ? h(React.Fragment, null, h('div', { className: 'pb-creator-colorlabel' }, 'Bottoms fabric'), ccFabricTiles('bottomFabric', 'Bottoms'), ccPrint('bottomFabric', 'bottomColor', 'Bottom')) : null,
      on('belt') ? h(React.Fragment, null, h('div', { className: 'pb-creator-colorlabel pb-layer-head' }, 'Belt'), ccFabricTiles('beltFabric', 'Belt', true), ccPrint('beltFabric', 'beltColor', 'Belt'), ccSlider('beltHeight', 'Belt height')) : null);   // THE BELT HEIGHT (2026-11-02): up / down to sit on any trousers' waistband
  };
  /* THE PANTS IN THE BOOTS (2026-11-03, mondo: "Can we make pants fit inside boots or have the option for them to be inside or
     outside?"): on LEGS > Bottoms and FOOTWEAR > Shoes + boots, while a pair of trousers is worn with a boot whose shaft reaches over
     their hem (sprites.js pantsBootsWorn): OUTSIDE (the trouser legs over the boots, the default) / TUCKED IN (appearance.pantsTuck) */
  const ccPantsTuck = () => {
    if (!window.pantsBootsWorn || !window.pantsBootsWorn(appearance)) return null;
    const cur = appearance.pantsTuck === 'in' ? 'in' : 'out';
    return h('div', { key: 'pantsTuck', className: 'pb-creator-options pb-cc-front', role: 'group', 'aria-label': 'Pants in boots' },
      h('span', { className: 'pb-creator-colorlabel' }, 'Pants + boots'),
      [['out', 'OUTSIDE', 'The trouser legs come down over the boots'], ['in', 'TUCKED IN', 'The trouser legs tucked into the boots']].map(([id, txt, tip]) =>
        h('button', { key: id, className: 'ms-tty-btn' + (cur === id ? ' primary' : ''), 'aria-pressed': cur === id, title: tip, onClick: () => { if (cur !== id) changeAppearance({ pantsTuck: id }); } }, txt)));
  };
  const capeOn = appearance.cape && appearance.cape !== 'none', capeDef = (window.EW_CAPE_STYLES || []).find(c => c.id === appearance.cape) || {};
  const ccCape = () => (window.EW_CAPE_STYLES || []).length > 1 ? h(React.Fragment, { key: 'cape' },
    h('div', { className: 'pb-creator-colorlabel pb-layer-head' }, 'Cape'),
    h('div', { className: 'pb-creator-options', role: 'group', 'aria-label': 'Cape' }, window.EW_CAPE_STYLES.filter(c => keepPick('cape', c.id, appearance.cape === c.id)).map(c =>
      devTile('cape', c.id, c.label, h('button', { key: c.id, className: 'ms-tty-btn' + (appearance.cape === c.id ? ' primary' : ''), 'aria-pressed': appearance.cape === c.id,
        onClick: () => changeAppearance(Object.assign({ cape: c.id }, c.look && appearance.cape !== c.id ? { capeColor: c.look.color, capeFabric: c.look.fabric, capePattern: 'solid' } : {})) }, shownName('cape', c.id, c.label))))),
    // (a fur / leaf cloak keeps its own tile: only its tint is a choice)
    capeOn && !capeDef.own ? ccFabricTiles('capeFabric', 'Cape', true) : null,
    capeOn && !capeDef.own ? ccPrint('capeFabric', 'capeColor', 'Cape') : null,
    capeOn && capeDef.own ? ccColorRow('capeColor', 'Cape tint', clothSwatches) : null) : null;
  const clothesShelves = shelves.filter(x => x[2] === 'clothes').map(x => x[0]);
  const clothesWorn = worn.filter(id => clothesShelves.includes(shelfOf(id))).length + ['outer', 'outer2', 'cape', 'feet', 'wear2'].filter(k => appearance[k] && appearance[k] !== 'none').length;
  /* THE LAYERS 1 2 3 (2026-11-04, mondo: "there really needs to be some sort of layer system in the character creator. Like layer 1, 2,
     and 3. I dont like how i can only add an outer layer of coats"): OUTFIT > TORSO > LAYERS = the three torso layers from the skin out,
     each one pick, each its own tab with what it holds written on it:
       LAYER 1 · Shirt / top        = the Tops shelf pick (pack + Blender shirts, tees, tanks, sweaters) in appearance.wear
       LAYER 2 · Shirt, vest, jacket = a second shirt / top over Layer 1 (appearance.wear2, sprites.js normalizeWear2), OR any Outer pick
                                      (appearance.outer: the vests + jackets first, then the coats, robes ...) OR a pack coat (the
                                      'coats' group in appearance.wear); one of the three at a time, a pick takes the others off
       LAYER 3 · Coat               = the second outer layer (appearance.outer2), the coats first; worn over everything but a cape
     Same keys as before (wear / outer / outer2), so every saved, locker and race look shows its layers as they were; wear2 is new.
     The renderer lays each layer over the one under it (three-renderer.js setWear: wear2's z over every Layer 1 top, the Blender coats
     at 70, the second outer at 200). */
  const wear2 = appearance.wear2 && appearance.wear2 !== 'none' ? appearance.wear2 : null;
  const wearRow = id => (window.EW_MH_WEAR || []).find(w => w[0] === id);
  const wearNm = id => { const r = wearRow(id); const n = renamedOf('wear', id); return n != null ? n : r ? r[1] : id; };
  const outerNm = id => { const o = (window.EW_OUTER_STYLES || []).find(x => x.id === id); return shownName('outer', id, o ? o.label : id); };
  const layer1 = () => worn.filter(id => groupOf(id) === 'tops');
  const packCoats = () => worn.filter(id => groupOf(id) === 'coats');
  const layerWorn = (n) => n === 1 ? layer1().map(wearNm)
    : n === 2 ? (wear2 ? [wearNm(wear2)] : []).concat(appearance.outer && appearance.outer !== 'none' ? [outerNm(appearance.outer)] : [], packCoats().map(wearNm))
    : appearance.outer2 && appearance.outer2 !== 'none' ? [outerNm(appearance.outer2)] : [];
  const layerOff = (n) => n === 1 ? { wear: worn.filter(id => groupOf(id) !== 'tops') }
    : n === 2 ? { wear2: 'none', outer: 'none', wear: worn.filter(id => groupOf(id) !== 'coats') } : { outer2: 'none' };
  const LAYER_DEFS = [[1, 'Shirt / top', 'Worn on the skin: a t-shirt, a tank, a shirt, a sweater.'],
    [2, 'Shirt, vest or jacket', 'Worn over Layer 1: a second shirt or top, a vest, a jacket - or a coat.'],
    [3, 'Coat', 'Worn over Layers 1 + 2: a coat, a robe, a uniform. A cape still goes over all of it (BACK > Capes).']];
  // Layer 2's shirts / tops: the same pieces as Layer 1, worn over it (a pick here takes the Layer 2 coat / jacket off)
  const wear2Tile = (cam) => ([id, label]) => {
    const on = wear2 === id, rn = renamedOf('wear', id);
    return devTile('wear', id, label, h('button', { key: id, className: 'pb-cc-tile pb-hair-tile', 'aria-pressed': on, title: (rn || label) + ' (over Layer 1)', 'data-cc-cam-own': cam,
      onClick: () => changeAppearance(on ? { wear2: 'none' } : { wear2: id, outer: 'none', wear: worn.filter(x => x !== id && groupOf(x) !== 'coats') }) },
      h('span', null, rn != null ? _pbSoftWrap(rn) : tileLabel(label))));
  };
  // Layer 2's pack coats (one at a time, like the Coats shelf): a pick takes the Layer 2 top + Outer pick off
  const packCoatTile = (cam) => ([id, label]) => {
    const on = worn.includes(id), rn = renamedOf('wear', id);
    return devTile('wear', id, label, h('button', { key: id, className: 'pb-cc-tile pb-hair-tile', 'aria-pressed': on, title: rn || label, 'data-cc-cam-own': cam,
      onClick: () => on ? toggleWear(shelfOf(id), id) : changeAppearance({ wear: worn.filter(x => shelfOf(x) !== shelfOf(id)).concat([id]), wear2: 'none', outer: 'none' }) },
      h('span', null, rn != null ? _pbSoftWrap(rn) : tileLabel(label))));
  };
  const sidedTiles = (rows, tile, name, cam, isOn) => {
    const mine = rows.filter(r => madeFor(r[0]) === sideNow), both = rows.filter(r => madeFor(r[0]) === 'both'), other = rows.filter(r => madeFor(r[0]) === sideOther && isOn(r[0]));
    const grid = (k, head, list) => list.length ? h(React.Fragment, { key: k },
      h('div', { className: 'pb-creator-colorlabel pb-cc-shelf-sub' }, head),
      h('div', { className: 'pb-cc-tiles pb-cc-hair', role: 'group', 'aria-label': name + ' ' + head, 'data-cc-cam-own': cam }, list.map(tile(cam)))) : null;
    return h(React.Fragment, null,
      grid('mine', sideNow === 'female' ? 'Women\u2019s' : 'Men\u2019s', mine), grid('both', 'Fits anyone', both),
      grid('other', 'Worn from the ' + (sideOther === 'female' ? 'women\u2019s' : 'men\u2019s') + ' list', other));
  };
  const ccTorsoLayers = (cam) => {
    const lt = [1, 2, 3].includes(layerTab) ? layerTab : 1, def = LAYER_DEFS[lt - 1], wornNow = layerWorn(lt);
    const tops = groupRows('tops'), coats = groupRows('coats');
    return h(React.Fragment, null,
      h('p', { className: 'pb-creator-note' }, 'Three layers from the skin out. Each layer holds one piece; a higher layer is worn over the ones under it.'),
      h('div', { className: 'pb-cc-layers', role: 'tablist', 'aria-label': 'Torso layers' },
        LAYER_DEFS.map(([n, kind]) => {
          const w = layerWorn(n);
          return h('button', { key: n, role: 'tab', className: 'pb-cc-layer' + (n === lt ? ' on' : ''), 'aria-selected': n === lt, 'aria-pressed': n === lt, 'data-cc-cam-own': cam,
            title: 'Layer ' + n + ': ' + kind + (w.length ? ' (now: ' + w.join(', ') + ')' : ''), onClick: () => setLayerTab(n) },
            h('b', null, 'LAYER ' + n), h('small', null, kind), h('span', { className: 'pb-cc-layer-worn' + (w.length ? '' : ' empty') }, w.length ? w.join(' + ') : 'Nothing'));
        })),
      h('div', { className: 'pb-cc-layer-bar' },
        h('span', { className: 'pb-creator-note' }, def[2]),
        wornNow.length ? h('button', { className: 'ms-tty-btn pb-layer-remove', title: 'Take Layer ' + lt + ' off', onClick: () => changeAppearance(layerOff(lt)) }, '\u2715 TAKE LAYER ' + lt + ' OFF') : null),
      h('div', { key: 'layer' + lt, className: 'pb-cc-layerpanel', role: 'tabpanel', 'aria-label': 'Layer ' + lt, 'data-cc-cam-own': cam },
        lt === 1 ? h(React.Fragment, null,
          wearTiles(tops, true, 'Shirts + tops', 'Layer 1', cam),
          groupLayerRows('tops'),
          ccWearTints(id => groupOf(id) === 'tops' && id !== wear2)) : null,
        lt === 2 ? h(React.Fragment, null,
          tops.length ? h(React.Fragment, null, h('div', { className: 'pb-creator-colorlabel pb-layer-head' }, 'Shirts + tops over Layer 1'), sidedTiles(tops.filter(r => !worn.includes(r[0])), wear2Tile, 'Layer 2 shirts', cam, id => wear2 === id)) : null,   // (the Layer 1 piece itself is not offered again)
          wear2 && (window.EW_WEAR_LAYER_OF || {})[wear2] === 'top' ? h(React.Fragment, null, h('div', { className: 'pb-creator-colorlabel' }, 'Layer 2 shirt fabric'), ccFabricTiles('top2Fabric', 'Layer 2 shirt'), ccPrint('top2Fabric', 'top2Color', 'Layer 2 shirt')) : null,
          ccLayer('Vests, jackets + coats', 'outer', ccOuterList('outer'), 'outerFabric', 'outerColor', null, { noNone: true, first: 'Vests + jackets', extra: { wear2: 'none', wear: worn.filter(x => groupOf(x) !== 'coats') } }),
          coats.length ? h(React.Fragment, null, h('div', { className: 'pb-creator-colorlabel pb-layer-head' }, 'More coats'), sidedTiles(coats, packCoatTile, 'Layer 2 coats', cam, id => worn.includes(id))) : null,
          ccWearTints(id => id === wear2 || groupOf(id) === 'coats')) : null,
        lt === 3 ? ccLayer('Coats', 'outer2', ccOuterList('outer2'), 'outer2Fabric', 'outer2Color', null, { noNone: true, first: 'Coats' }) : null));
  };
  /* THE BODY SLOTS (2026-11-03, mondo: "can we have tabs instead of one long list where i have to scroll through everything. And I want
     the clothes+accessories organized by body part like a typical rpg; head, torso, left arm, right arm, legs, footwear, etc."). The
     OUTFIT tab = one tab per body part (sprites.js EW_WEAR_SLOTS: Head, Face, Neck, Torso, Back, Left arm, Right arm, Waist, Legs,
     Footwear), and inside it one kind at a time (EW_WEAR_GROUPS: Hats + helmets, Creature heads, Horns ... ). Every clothes AND
     accessories piece is on one of them (wearGroupOf); a pair (gloves, nails, sleeves, arm armour) shows on both arm tabs under BOTH
     ARMS. The layer picks sit with their part: the Outer layer + second outer on Torso > Coats + jackets, the Cape + flapping wings on
     Back, the Feet layer on Footwear > Shoes + boots. Display only: a pick still follows its shelf's one-at-a-time rule (toggleWear), and
     no piece, category or saved look changed. */
  const slots = window.EW_WEAR_SLOTS || [], wearGroups = window.EW_WEAR_GROUPS || [];
  const groupOf = window.wearGroupOf || (id => shelfOf(id));
  const slotOfGroup = window.wearSlotOfGroup || (() => null);
  const onSlot = (g, slot) => { const s = slotOfGroup(g); return s === slot || (s === 'arms' && (slot === 'larm' || slot === 'rarm')); };
  const groupRows = (g) => (window.EW_MH_WEAR || []).filter(w => shelfOf(w[0]) && groupOf(w[0]) === g && keepPick('wear', w[0], worn.includes(w[0])));   // (THE HIDDEN PICKS)
  const layerShown = (layer) => layer === 'layers' || layer === 'outer' || layer === 'feet' || (layer === 'cape' && (window.EW_CAPE_STYLES || []).length > 1) || (layer === 'wings' && (window.EW_WINGS_STYLES || []).length > 1);
  const slotGroups = (slot) => wearGroups.filter(gr => onSlot(gr[1], slot) && (groupRows(gr[1]).length || layerShown(gr[4]) || (gr[1] === 'heads' && shapeHeads.length) || (gr[1] === 'ears' && shapeEars.length)));
  // a tab's / a kind's dot: something worn there (the layer picks count with their group)
  const groupWorn = (gr) => worn.filter(id => shelfOf(id) && groupOf(id) === gr[1]).length
    + (gr[1] === 'heads' ? shapeHeads.filter(([k]) => shapeHeadOn(k)).length : 0)
    + (gr[1] === 'ears' ? shapeEars.filter(([k]) => shapeHeadOn(k)).length : 0)
    + (gr[4] === 'outer' ? ['outer', 'outer2'].filter(k => appearance[k] && appearance[k] !== 'none').length : 0)
    + (gr[4] === 'layers' ? layer1().length + packCoats().length + ['wear2', 'outer', 'outer2'].filter(k => appearance[k] && appearance[k] !== 'none').length : 0)   // THE LAYERS 1 2 3
    + (gr[4] === 'cape' && capeOn ? 1 : 0) + (gr[4] === 'wings' && appearance.wings && appearance.wings !== 'none' ? 1 : 0)
    + (gr[4] === 'feet' && appearance.feet && appearance.feet !== 'none' ? 1 : 0);
  const slotWorn = (slot) => slotGroups(slot).reduce((n, gr) => n + groupWorn(gr), 0);
  // THE TAKE ALL OFF SPLIT: what TAKE ALL OFF takes off for one kind (the same pieces its gold dot counts)
  const kindOff = (gr) => {
    const g = gr[1], L = gr[4], drop = L === 'layers' ? ['tops', 'coats'] : [g];
    const patch = { wear: worn.filter(id => !(shelfOf(id) && drop.includes(groupOf(id)))) };
    if (L === 'layers') Object.assign(patch, { wear2: 'none', outer: 'none', outer2: 'none' });
    if (L === 'outer') Object.assign(patch, { outer: 'none', outer2: 'none' });
    if (L === 'cape') patch.cape = 'none';
    if (L === 'wings') patch.wings = 'none';
    if (L === 'feet') patch.feet = 'none';
    if (g === 'heads') shapeHeads.forEach(([k]) => { if (shapeHeadOn(k)) patch[k] = 0; });
    if (g === 'ears') shapeEars.forEach(([k]) => { if (shapeHeadOn(k)) patch[k] = 0; });
    return patch;
  };
  const slotCam = (slot) => ((slots.find(s => s[0] === slot) || [])[2]) || 'body';
  // one kind open: its layer rows first (the coded / Blender picks), then the pack pieces, their fabric rows and their colours
  const ccGroup = (slot, gr) => {
    const [, g, label, sided, layer] = gr, cam = slotCam(slot), rows = groupRows(g);
    return h(React.Fragment, null,
      layer === 'layers' ? ccTorsoLayers(cam) : null,   // THE LAYERS 1 2 3
      layer === 'outer' ? h(React.Fragment, null, ccLayer('Outer layer', 'outer', ccOuterList('outer'), 'outerFabric', 'outerColor'), ccExtraLayers()) : null,
      layer === 'cape' ? ccCape() : null,
      // 2026-10-27: the wings (mondo's wings upload, the Occulus's), worn on the back and flapping; the pack's costume wings beside them
      layer === 'wings' ? h(React.Fragment, null,
        h('div', { className: 'pb-creator-colorlabel pb-layer-head' }, 'Flapping wings'),
        ccChoice('wings', (window.EW_WINGS_STYLES || [{ id: 'none', label: 'None' }]).map(o => [o.id, o.label]), null, 'wings'),
        appearance.wings && appearance.wings !== 'none' ? ccColorRow('wingsColor', 'Wing colour', hairSwatches) : null) : null,
      layer === 'feet' ? ccLayer('Feet', 'feet', ccLive('feet', window.EW_FEET_STYLES), 'feetFabric', 'feetColor') : null,
      g === 'heads' ? ccShapeHeads(cam) : null,
      g === 'ears' ? ccShapeEars(cam) : null,
      wearTiles(rows, sided, layer === 'outer' ? 'More coats' : layer === 'feet' ? 'More shoes' : layer === 'wings' ? 'Costume wings' : null, label, cam),
      g === 'held' ? h('p', { className: 'pb-creator-note' }, 'One at a time: the right hand closes round it.') : null,
      groupLayerRows(g),
      g === 'bottoms' || g === 'shoes' ? ccPantsTuck() : null,
      ccWearTints(id => groupOf(id) === g));   // THE WEAR TINT
  };
  const ccOutfit = () => {
    const shown = slots.filter(s => slotGroups(s[0]).length);
    const slot = shown.some(s => s[0] === slotTab) ? slotTab : (shown[0] || ['head'])[0];
    const gl = slotGroups(slot), cur = gl.find(gr => gr[1] === kindBySlot[slot]) || gl[0];
    const arm = slot === 'larm' || slot === 'rarm';
    const chip = (gr) => h('button', { key: gr[1], role: 'tab', className: 'ms-tty-btn sm' + (cur === gr ? ' primary' : ''), 'aria-selected': cur === gr, 'aria-pressed': cur === gr,
      onClick: () => setKindBySlot(k => ({ ...k, [slot]: gr[1] })) }, gr[2].toUpperCase() + (groupWorn(gr) ? ' •' : ''));
    const own = gl.filter(gr => slotOfGroup(gr[1]) !== 'arms'), pairs = gl.filter(gr => slotOfGroup(gr[1]) === 'arms');
    const kindN = cur ? groupWorn(cur) : 0;
    return h(React.Fragment, null,
      // THE CREATOR ICONS (2026-11-04): each body part an icon tile (its icon over its name, a gold dot = something worn there), in two
      // even rows (Head ... Back over Left arm ... Footwear) so the tiles line up at any width
      h('div', { className: 'pb-cc-slots', role: 'tablist', 'aria-label': 'Body part', style: { '--cc-cols': shown.length <= 6 ? shown.length : Math.ceil(shown.length / 2) } },
        shown.map(([s, label, cam]) => { const n = slotWorn(s); return h('button', { key: s, role: 'tab', className: 'ms-tty-btn pb-cc-slot' + (slot === s ? ' primary' : ''), 'aria-selected': slot === s, 'aria-pressed': slot === s,
          'data-cc-cam-own': cam, title: label + (n ? ': ' + n + ' worn here' : ': nothing worn here'), onClick: () => setSlotTab(s) },
          ccIcon('slot:' + s), h('span', { className: 'pb-cc-slot-name' }, label.toUpperCase()), n ? h('span', { className: 'pb-cc-worn', 'aria-label': 'worn' }) : null); })),
      gl.length > 1 ? h('div', { className: 'pb-cc-kinds', role: 'tablist', 'aria-label': ((slots.find(s => s[0] === slot) || [])[1] || slot) + ' kind', 'data-cc-cam-own': slotCam(slot) },
        own.map(chip),
        arm && pairs.length ? h('span', { key: 'pair', className: 'pb-cc-kinds-head' }, 'Both arms') : null,
        pairs.map(chip)) : null,
      // (the MEN / WOMEN switch only on a kind it lists by; a kind of accessories lists every piece)
      (cur && cur[3]) || kindN || clothesWorn ? h('div', { className: 'pb-creator-options pb-cc-side', role: 'group', 'aria-label': 'Clothes for' },
        cur && cur[3] ? h('span', { className: 'pb-creator-colorlabel' }, 'Made for') : null,
        (cur && cur[3] ? [['male', 'MEN'], ['female', 'WOMEN']] : []).map(([g, txt]) => h('button', { key: g, className: 'ms-tty-btn' + (sideNow === g ? ' primary' : ''), 'aria-pressed': sideNow === g,
          title: 'List the clothes made for ' + (g === 'female' ? 'women' : 'men') + ' (+ the ones that fit anyone). Any piece fits any body.', onClick: () => setWearFor(g) }, txt)),
        // THE TAKE ALL OFF SPLIT (2026-11-05, mondo: "the button that says "take all off", can it only take off the category of clothes you
        // have selected? And there should be another button that says "Clear All" and it should be red and that should do what take all
        // off does now"): TAKE ALL OFF = everything worn in the open kind (Hats + helmets, Layers 1 2 3, Capes ...); CLEAR ALL (red) = every
        // piece of clothing on every body part (the facial hair and the accessories stay), as TAKE ALL OFF did before
        kindN || clothesWorn ? h('span', { key: 'off', className: 'pb-cc-alloff' },
          kindN ? h('button', { key: 'kind', className: 'ms-tty-btn', title: 'Take off everything worn under ' + ((slots.find(s => s[0] === slot) || [])[1] || slot) + ' > ' + cur[2] + ' (the other kinds stay on)',
            onClick: () => changeAppearance(kindOff(cur)) }, 'TAKE ALL OFF') : null,
          clothesWorn ? h('button', { key: 'all', className: 'ms-tty-btn pb-cc-clearall', title: 'Take off every piece of clothing on every body part (the facial hair and the accessories stay)',
            onClick: () => changeAppearance({ wear: worn.filter(id => !clothesShelves.includes(shelfOf(id))), wear2: 'none', outer: 'none', outer2: 'none', cape: 'none', feet: 'none' }) }, 'CLEAR ALL') : null) : null) : null,
      cur ? h('div', { key: slot + ':' + cur[1], className: 'pb-cc-slotpanel', role: 'tabpanel', 'data-cc-cam-own': slotCam(slot) },
        arm && slotOfGroup(cur[1]) === 'arms' ? h('p', { className: 'pb-creator-note' }, 'A pair: worn on both arms (the same pick shows on LEFT ARM and RIGHT ARM).') : null,
        ccGroup(slot, cur)) : null);
  };
  /* THE SKINS by body: the MakeHuman skins named for a woman / a man, the body's own first, then the rest */
  const lookSide = (label) => / (female|woman|women)/i.test(' ' + label) ? 'female' : /\bmale/i.test(label) ? 'male' : 'both';
  /* THE LOOKS tiles: one MakeHuman pick row (skin / eye colour / brows / lashes), "Body's own" first */
  const mhLookList = (cat) => [['own', "Body's own"]].concat(((window.EW_MH_LOOKS || {})[{ mhSkin: 'skins', mhEyes: 'eyes', mhBrows: 'brows', mhLashes: 'lashes' }[cat]] || []).map(r => [r[0], r[1]]));
  const mhTiles = (cat, head, list, key) => {
    const rows = (list || mhLookList(cat)).filter(([id]) => keepPick(cat, id, (appearance[cat] || 'own') === id)), cam = cat === 'mhSkin' ? 'body' : 'face';   // (THE HIDDEN PICKS)
    if (!window.EW_MH_LOOKS || !rows.length) return null;
    return h(React.Fragment, { key: key || cat },
      head ? h('div', { className: 'pb-creator-colorlabel' + (cat === 'mhSkin' ? ' pb-cc-shelf-sub' : ''), 'data-cc-cam-own': cam }, head) : null,
      h('div', { className: 'pb-cc-tiles pb-cc-hair', role: 'group', 'aria-label': 'MakeHuman ' + (head || cat.slice(2)).toLowerCase(), 'data-cc-cam-own': cam },
        rows.map(([id, label]) =>
          devTile(cat, id, label, h('button', { key: id, className: 'pb-cc-tile pb-hair-tile', 'aria-pressed': (appearance[cat] || 'own') === id, title: shownName(cat, id, label), onClick: () => changeAppearance({ [cat]: id }) },
            h('span', null, renamedOf(cat, id) != null ? _pbSoftWrap(renamedOf(cat, id)) : cat === 'mhSkin' && id !== 'own' ? tileLabel(label) : label))))));   // (THE RENAMED PICKS)
  };
  /* THE LOOK COLOURS: "<thing> colour": Original colours / (Same as hair) / Pick a colour, then the swatches + the custom picker */
  const lookTint = (key, label, colorKey, swatches, hairToo, cam) => h(React.Fragment, { key },
    h('div', { className: 'pb-creator-colorlabel', 'data-cc-cam-own': cam || 'face' }, label),
    ccChoice(key, [['own', 'Original colours']].concat(hairToo ? [['hair', 'Same as hair']] : [], [['pick', 'Pick a colour']])),
    appearance[key] === 'pick' ? ccColorRow(colorKey, label, swatches) : null);
  const faceLooks = { eyes: ['mhEyes', 'eyeTint', 'mhLashes', 'lashTint'], brows: ['mhBrows', 'browTint'], mouth: ['lipTint'] };
  /* THE HIDDEN PICKS: the hider's bar (top of the creator): the marks on / off (off = the lists as players see them), the hidden list
     (each with SHOW, + SHOW ALL), and EXPORT HIDDEN LIST (the file bake-hidden.js bakes into sprites.js EW_CREATOR_HIDDEN).
     THE RENAMED PICKS (2026-11-03): + the RENAMED list (each with RENAME / ORIGINAL NAME, + ALL ORIGINAL NAMES), the export carries
     the names too (EXPORT HIDDEN + NAMES -> EW_CREATOR_NAMES), and CLOSE (F2) */
  const hidKindLabel = (r) => r.kind === 'wear' ? ((window.EW_MH_FACIAL_HAIR || []).includes(r.id) ? 'Facial hair' : ((shelves.find(x => x[0] === shelfOf(r.id)) || [])[1] || 'Clothes'))
    : ({ hair: 'Hair', outer: 'Outer layer', feet: 'Feet layer', cape: 'Cape', wings: 'Flapping wings', idle: 'Idle pose', mhSkin: 'Skin', mhEyes: 'Eye colour', mhBrows: 'Brows', mhLashes: 'Lashes', hairMat: 'Hair texture' })[r.kind] || r.kind;
  const ccDevBar = () => {
    const list = window.creatorHiddenList ? window.creatorHiddenList() : [];
    const names = window.creatorNamesList ? window.creatorNamesList() : [];   // THE RENAMED PICKS
    return h('div', { className: 'pb-cc-devbar', role: 'group', 'aria-label': 'Creator item hider (developer)' },
      h('div', { className: 'pb-cc-devbar-head' }, h('b', null, 'DEV · ITEM HIDER + NAMES'), h('span', null, list.length + ' hidden · ' + names.length + ' renamed')),
      h('p', { className: 'pb-creator-note' }, devMarks ? '✕ on a tile hides it from the creator; SHOW puts it back. ✎ renames it (only the name on its tile). Nothing is deleted, and a look wearing a hidden piece still loads (a worn piece keeps its tile). F2 closes this bar.'
        : 'The lists as players see them: hidden picks are left off (a worn one still shows), renamed ones wear your names.'),
      h('div', { className: 'pb-creator-options' },
        h('button', { className: 'ms-tty-btn' + (hideMarks ? ' primary' : ''), 'aria-pressed': hideMarks, title: 'Show the ✕ / SHOW and ✎ marks on every pick (off = see the lists as players will)', onClick: () => setHideMarks(m => !m) }, hideMarks ? 'MARKS: ON' : 'MARKS: OFF (PLAYER VIEW)'),
        h('button', { className: 'ms-tty-btn', 'aria-expanded': hidListOpen, onClick: () => setHidListOpen(o => !o) }, (hidListOpen ? '▾' : '▸') + ' HIDDEN LIST (' + list.length + ')'),
        h('button', { className: 'ms-tty-btn', 'aria-expanded': namesOpen, onClick: () => setNamesOpen(o => !o) }, (namesOpen ? '▾' : '▸') + ' RENAMED (' + names.length + ')'),
        h('button', { className: 'ms-tty-btn gold', title: 'Save the hidden list and your names as one file; bake-hidden.js bakes both into the game for every player', onClick: () => pbExportHidden(setHidNote) }, '⇩ EXPORT HIDDEN + NAMES'),
        h('button', { className: 'ms-tty-btn', title: 'Close the hider (F2 opens it again in the creator; Settings > Developer has it too)', onClick: () => { if (window.setCreatorHiderOn) window.setCreatorHiderOn(false); } }, 'CLOSE (F2)')),
      hidListOpen ? h('div', { className: 'pb-cc-devlist', role: 'list', 'aria-label': 'Hidden picks' },
        list.length ? list.map(r => h('div', { key: r.key, className: 'pb-cc-devrow', role: 'listitem' },
          h('span', null, h('small', null, hidKindLabel(r) + ' · '), shownName(r.kind, r.id, r.label), r.shipped ? h('small', null, ' (baked)') : null),
          h('button', { className: 'ms-tty-btn sm', onClick: () => window.setCreatorHidden(r.kind, r.id, false, r.label) }, 'SHOW')))
          : h('p', { className: 'pb-creator-note' }, 'Nothing hidden.'),
        list.length ? h('button', { className: 'ms-tty-btn', onClick: () => { if (window.confirm('Show all ' + list.length + ' hidden picks in the creator again?')) window.creatorHiddenShowAll(); } }, 'SHOW ALL') : null) : null,
      // THE RENAMED PICKS: every pick shown under a name of his: kind · its own name -> his name, with RENAME (the box under the row) and ORIGINAL NAME
      namesOpen ? h('div', { className: 'pb-cc-devlist', role: 'list', 'aria-label': 'Renamed picks' },
        names.length ? names.map(r => h(React.Fragment, { key: r.key },
          h('div', { className: 'pb-cc-devrow', role: 'listitem' },
            h('span', null, h('small', null, hidKindLabel(r) + ' · ' + r.label + ' → '), r.name, r.shipped ? h('small', null, ' (baked)') : null),
            h('span', { className: 'pb-cc-devrow-btns' },
              h('button', { className: 'ms-tty-btn sm', 'aria-expanded': renKey === 'list|' + r.key, onClick: () => setRenKey(k => k === 'list|' + r.key ? null : 'list|' + r.key) }, '✎ RENAME'),
              h('button', { className: 'ms-tty-btn sm', title: 'Back to “' + r.label + '”', onClick: () => window.setCreatorName(r.kind, r.id, '') }, 'ORIGINAL NAME'))),
          renKey === 'list|' + r.key ? renEditor('list', r.kind, r.id, r.label) : null))
          : h('p', { className: 'pb-creator-note' }, 'Nothing renamed: ✎ on a tile gives it a name of yours.'),
        names.length ? h('button', { className: 'ms-tty-btn', onClick: () => { if (window.confirm('Put all ' + names.length + ' renamed picks back to their own names?')) window.creatorNamesReset(); } }, 'ALL ORIGINAL NAMES') : null) : null,
      hidNote ? h('div', { className: 'pb-looks-note', role: 'status' }, hidNote) : null);
  };   // THE ONE EYES TAB: the picks shown in each FACE tab (its dot)
  /* THE TABS (2026-11-03, mondo: "can we have tabs instead of one long list where i have to scroll through everything"): the creator
     is five tabs, one open at a time (BODY, FACE, SKIN, HAIR, OUTFIT), under the name + locker; the tab bar stays on screen while a
     tab scrolls. The rows inside each tab are the ones it always had; OUTFIT = THE BODY SLOTS (ccOutfit). The tab open is kept while
     the page lives (_pbCcTab), so a look saved / loaded / re-rendered stays where the player was. */
  const ccBodyTab = () => h(React.Fragment, null,
              /* THE MPFB BODIES (2026-11-01): the classic male / female bases + the five MPFB bodies (sprites.js
                 EW_MPFB_BODIES). The rig dresses an MPFB body like the classic ones (clothes, layers, hair, accessories,
                 the body + face shape sliders); its skin and face are the stock MakeHuman bake, so the controls that only
                 PAINT the classic face (eye size, brows, eye + lip colour, facial hair, skin tone) hide while one is on. */
              /* THE SHELVES (2026-11-02): the bases in two rows, the men's bodies and the women's (same buttons, same order within) */
              (() => {
                const all = [['classic', 'male', 'MALE'], ['classic', 'female', 'FEMALE']].concat((window.EW_MPFB_BODIES || []).map(b => [b.id, b.gender, b.label.toUpperCase()]));
                const btn = ([id, g, label]) => {
                  const on = (appearance.body || 'classic') === id && (id !== 'classic' || gender === g);
                  return h('button', { key: id + g, className: 'ms-tty-btn' + (on ? ' primary' : ''), 'aria-pressed': on, onClick: () => changeAppearance(Object.assign({ body: id }, window.mpfbFacePatch ? window.mpfbFacePatch(appearance, id) : {}), g) }, label);   // THE DEFAULT FACES: an untouched face follows the body's gender
                };
                return [['male', 'Men\u2019s bodies'], ['female', 'Women\u2019s bodies']].map(([g, head]) => h(React.Fragment, { key: g },
                  h('div', { className: 'pb-creator-colorlabel pb-cc-shelf-sub' }, head),
                  h('div', { className: 'pb-creator-options', 'aria-label': 'Base model ' + (g === 'female' ? 'women' : 'men') }, all.filter(b => b[1] === g).map(btn))));
              })(),
              h('div', { className: 'pb-creator-grid' }, ccSlider('height', 'Height', true), ccSlider('width', 'Build', true), ccSlider('chest', 'Chest'), femaleBody ? ccSlider('bust', 'Bust') : null, ccSlider('waist', 'Waist'), ccSlider('hips', 'Hips')),
              /* THE BODY DETAILS (2026-11-02, mondo: female thick / thin bodies; plan row 26): MakeHuman's Weight + Muscle and body
                 modifiers on an MPFB body (sprites.js EW_MPFB_BODY_SLIDERS) */
              mpfb && window.EW_MPFB_BODY_SLIDERS ? h(React.Fragment, null,
                h('div', { className: 'pb-creator-colorlabel' }, 'Body shape'),
                h('div', { className: 'pb-creator-grid' }, window.EW_MPFB_BODY_SLIDERS.filter(r => r[2] !== 'female' || femaleBody).map(([k, label]) => ccSlider(k, label)))) : null,
              /* THE JIGGLE (2026-11-02, mondo: "similar to the capes and the hair, can we add jiggle physics to the boobs and butt?"):
                 how much the chest and the glutes bounce when the body moves (three-renderer.js THE JIGGLE); 0 = still */
              mpfb ? h(React.Fragment, null,
                h('div', { className: 'pb-creator-colorlabel' }, 'Jiggle'),
                h('div', { className: 'pb-creator-grid' }, ccSlider('jiggleChest', 'Chest'), ccSlider('jiggleButt', 'Butt'))) : null,
              /* THE IDLE POSE (2026-11-01, mondo: "can we also add an option to change their idle pose in the character creator?"):
                 the standing idles already in the animation library (sprites.js EW_IDLE_POSES); Default = the body's own idle.
                 Saved in the look (appearance.idle), so EXPORT DEFAULT LOOK / bake-looks.js carry it and the board plays it. */
              (window.EW_IDLE_POSES || []).length > 1 ? h(React.Fragment, null,
                h('div', { className: 'pb-creator-colorlabel' }, 'Idle pose'),
                ccChoice('idle', window.EW_IDLE_POSES.map(o => [o.id, o.label]), null, 'idle', (id, same) => {   // the picked idle shows at once (a walk stops)
                  const cv = window.EWCharViewer; if (same && cv && cv.isWalking && cv.isWalking()) cv.stopPreview();
                })) : null,
              /* THE WALK STYLE (2026-11-05, mondo: "add the walk animations to the character creator just like the idle animations so i
                 can see those too"): the motion-capture walks (sprites.js EW_WALK_STYLES); a pick walks on the stage at once, looping,
                 and is saved in the look like the idle (the board plays it) */
              (window.EW_WALK_STYLES || []).length > 1 ? h(React.Fragment, null,
                h('div', { className: 'pb-creator-colorlabel pb-cc-walkhead', style: { display: 'flex', alignItems: 'center', gap: 10 } }, h('span', null, 'Walk'),
                  h('button', { type: 'button', className: 'ms-tty-btn' + (ccWalking ? ' primary' : ''), style: { padding: '3px 12px' }, onClick: () => {   // loops until pressed again
                    const cv = window.EWCharViewer; if (!cv) return;
                    if (cv.isWalking && cv.isWalking()) { cv.stopPreview(); return; }
                    if (cv.resetView) cv.resetView();
                    if (cv.walk) cv.walk(); else cv.play('walk', { full: true, loop: true, name: 'Walk' });
                  } }, ccWalking ? '\u25a0 STOP WALK' : '\u25b6 PLAY WALK')),
                ccChoice('walk', window.EW_WALK_STYLES.map(o => [o.id, o.label]), null, 'walk', (id, same) => {   // a click walks at once (a new pick walks from the stage's swap)
                  const cv = window.EWCharViewer; if (!cv) return;
                  if (cv.resetView) cv.resetView();
                  if (same && cv.walk) cv.walk();
                })) : null,
    null);
  const ccFaceTab = () => h(React.Fragment, null,
              /* THE FACE SLIDERS (2026-11-02, mondo: "a standard AAA video game character creator where you can control the size of
                 the eyes and the lips and everything"): an MPFB head takes MakeHuman's own face modifiers (sprites.js
                 EW_MPFB_FACE_SLIDERS), one tab per feature; a dot marks a tab with a slider moved */
              mpfb && window.EW_MPFB_FACE_SLIDERS ? h(React.Fragment, null,
                /* THE DEFAULT FACES (2026-11-03, mondo: good-looking male + female default faces): the body gender's default face
                   (sprites.js EW_MPFB_DEFAULT_FACES) or MakeHuman's own neutral face (every face slider at 0), in one click */
                window.mpfbFacePatch ? h('div', { className: 'pb-creator-options', role: 'group', 'aria-label': 'Face preset', 'data-cc-cam-own': 'face' },
                  h('button', { className: 'ms-tty-btn', title: 'Every face slider at this body\u2019s default face', onClick: () => changeAppearance(window.mpfbFacePatch(appearance, appearance.body, true)) }, 'DEFAULT FACE'),
                  h('button', { className: 'ms-tty-btn', title: 'Every face slider at 0 (MakeHuman\u2019s own face)', onClick: () => changeAppearance(Object.fromEntries((window.EW_FACE_RESET_KEYS || window.EW_MPFB_FACE_KEYS || []).map(k => [k, 0]))) }, 'NEUTRAL FACE'),
                  /* THE FACE PRESETS (2026-11-03): MakeHuman community faces baked by bake-faces.js (sprites.js EW_MPFB_FACE_PRESETS);
                     a pick sets every face slider (the ones the preset leaves out go to 0) */
                  (window.EW_MPFB_FACE_PRESETS || []).map(p => h('button', { key: p.id, className: 'ms-tty-btn', title: [p.label, p.author, p.license].filter(Boolean).join(' \u00b7 '),
                    onClick: () => changeAppearance(Object.assign(Object.fromEntries((window.EW_FACE_RESET_KEYS || window.EW_MPFB_FACE_KEYS || []).map(k => [k, 0])), p.face || {})) },
                    p.label.toUpperCase() + (p.gender === 'female' ? ' \u2640' : ' \u2642')))) : null,
                h('div', { className: 'pb-creator-options', role: 'group', 'aria-label': 'Face feature', 'data-cc-cam-own': 'face' },
                  window.EW_MPFB_FACE_SLIDERS.filter(g => !g.inHeads && !g.inEars).map(g => h('button', { key: g.id, className: 'ms-tty-btn' + (faceCat === g.id ? ' primary' : ''), 'aria-pressed': faceCat === g.id, onClick: () => setFaceCat(g.id) },
                    g.label.toUpperCase() + (g.rows.some(r => Math.abs(+appearance[r[0]] || 0) > 0.004) || (faceLooks[g.id] || []).some(k => appearance[k] && appearance[k] !== 'own') ? ' \u2022' : '')))),
                (() => { const g = window.EW_MPFB_FACE_SLIDERS.find(x => x.id === faceCat && !x.inHeads && !x.inEars) || window.EW_MPFB_FACE_SLIDERS[0];
                  return h(React.Fragment, null,
                    h('div', { className: 'pb-creator-grid', 'data-cc-cam-own': 'face' }, g.rows.map(([k, label]) => ccSlider(k, label)),
                      h('button', { className: 'ms-tty-btn', disabled: !g.rows.some(r => Math.abs(+appearance[r[0]] || 0) > 0.004), onClick: () => changeAppearance(Object.fromEntries(g.rows.map(r => [r[0], 0]))) }, 'RESET ' + g.label.toUpperCase() + ' SLIDERS')),
                    /* THE ONE EYES TAB (2026-11-03, mondo: "there is an eyes tab, but then there is another make human skin and face eyes
                       tab, all of those settings need to appear together"): the MakeHuman eye colours + lashes sit under the eye sliders,
                       the brows under the brow sliders, and the lip colour under the mouth sliders (same picks, same saved keys) */
                    /* THE LOOK COLOURS (2026-11-03, mondo: "there is no color picker ... Everything that can possibly have one needs a
                       tint/color picker"): each pick row is followed by its colour: its own, or any colour (three-renderer.js tintLayer) */
                    g.id === 'eyes' ? h(React.Fragment, null,
                      mhTiles('mhEyes', 'Eye colour'),
                      /* THE EYE PACK (2026-11-03): the MakeHuman Eye Texture Pack mondo uploaded (plain, bloodshot, cat eyes), worn by
                         MakeHuman's own eye mesh at full size; same saved key (mhEyes), the Iris colour below recolours these too */
                      mhTiles('mhEyes', 'Eye textures', (window.EW_MH_EYE_PACK || []).filter(r => !r[5]).map(r => [r[0], r[1]]), 'mhEyesPack'),
                      /* THE EYE MATERIALS (2026-11-03): MakeHuman's system eye material packs 01-03 (sprites.js EW_MH_EYE_MATS, in the same
                         list as the pack: same eye mesh, same saved key, the Iris colour recolours them too), one row per pack */
                      [['human', 'Eye materials: human'], ['creature', 'Eye materials: non-human'], ['more', 'Eye materials: various']].map(([g, head]) =>
                        mhTiles('mhEyes', head, (window.EW_MH_EYE_PACK || []).filter(r => r[5] === g).map(r => [r[0], r[1]]), 'mhEyesMat_' + g)),
                      lookTint('eyeTint', 'Iris colour', 'eyeColor', eyeSwatches),
                      mhTiles('mhLashes', 'Lashes'), lookTint('lashTint', 'Lash colour', 'lashColor', hairSwatches)) : null,
                    g.id === 'brows' ? h(React.Fragment, null,
                      mhTiles('mhBrows', 'Brows'), lookTint('browTint', 'Brow colour', 'browColor', hairSwatches, true)) : null,
                    g.id === 'mouth' ? h(React.Fragment, null,
                      /* THE LIP COLOUR (2026-11-03, mondo: "There are different makeups in the skin tab, but what if i just want to change
                         the lips specifically?"): the skin's own lips, or a picked colour painted on the lips only (three-renderer.js tintLips) */
                      lookTint('lipTint', 'Lip colour', 'lipColor', lipSwatches)) : null); })())
                : h('div', { className: 'pb-creator-grid' }, ccSlider('head', 'Head width'), ccSlider('jaw', 'Jaw width'), ccSlider('nose', 'Nose'), ccSlider('cheeks', 'Cheeks'), ccSlider('eyeSize', 'Eye size'), ccSlider('brows', 'Brow weight')),
              /* THE FACIAL HAIR (2026-11-01, mondo: "im not seeing the option to change the facial hair or its color"): an MPFB body
                 wears the pack's beards + moustaches (sprites.js EW_MH_FACIAL_HAIR, one at a time) in the hair colour, a picked
                 colour or their own */
              mpfb && window.EW_MH_FACIAL_HAIR && window.EW_MH_FACIAL_HAIR.length ? (() => {
                const ids = window.EW_MH_FACIAL_HAIR, cur = (appearance.wear || []).find(x => ids.includes(x)) || 'none';
                const rows = (window.EW_MH_WEAR || []).filter(r => ids.includes(r[0]) && keepPick('wear', r[0], cur === r[0]));   // (THE HIDDEN PICKS)
                return h(React.Fragment, null,
                  h('div', { className: 'pb-creator-colorlabel' }, 'Facial hair'),
                  h('div', { className: 'pb-cc-tiles pb-cc-hair', role: 'group', 'aria-label': 'Facial hair' },
                    [['none', 'Clean']].concat(rows.map(r => [r[0], r[1]])).map(([id, label]) =>
                      devTile('wear', id, label, h('button', { key: id, className: 'pb-cc-tile pb-hair-tile', 'aria-pressed': cur === id,
                        onClick: () => changeAppearance({ wear: (appearance.wear || []).filter(x => !ids.includes(x)).concat(id === 'none' ? [] : [id]) }) },
                        h('span', null, id === 'none' ? label : shownName('wear', id, label)))))),   // (THE RENAMED PICKS)
                  cur !== 'none' ? h(React.Fragment, null,
                    h('div', { className: 'pb-creator-colorlabel' }, 'Facial hair colour'),
                    ccChoice('beardTint', [['hair', 'Same as hair'], ['pick', 'Pick a colour'], ['own', 'Original colours']]),
                    appearance.beardTint === 'pick' ? ccColorRow('beardColor', 'Colour', hairSwatches) : null) : null);
              })() : null,
              mpfb ? null : h(React.Fragment, null,
              ccColorRow('eyeColor', 'Eyes', eyeSwatches),
              ccColorRow('lipColor', 'Lips', lipSwatches),
              h('div', { className: 'pb-creator-colorlabel' }, 'Facial hair'),
              ccChoice('beard', [['none', 'Clean'], ['stubble', 'Stubble'], ['moustache', 'Moustache'], ['goatee', 'Goatee'], ['beard', 'Beard'], ['fullbeard', 'Full beard']]),   // rev 10: + moustache · full beard
                null),
    null);
  const ccSkinTab = () => h(React.Fragment, null,
              /* THE LOOKS (2026-11-01, creator step 4): the MakeHuman skins (sprites.js EW_MH_LOOKS); the first tile is the body's
                 own. The eye colours, lashes and brows moved into the FACE tabs 2026-11-03 (mhTiles above). */
              mpfb && window.EW_MH_LOOKS ? h(React.Fragment, null,
                /* THE LOOK COLOURS: any skin colour over the picked skin (its pores, freckles and lips kept), first, where it is looked for */
                lookTint('skinTint', 'Skin colour', 'skin', skinSwatches, false, 'body'),
                (() => {
                  // THE SHELVES: the skins named for a woman / a man, this body's first, then the other's, then the rest
                  const all = mhLookList('mhSkin');
                  const mine = femaleBody ? 'female' : 'male', theirs = femaleBody ? 'male' : 'female', nm = g => g === 'female' ? 'Women\u2019s skins' : 'Men\u2019s skins';
                  return h(React.Fragment, null,
                    mhTiles('mhSkin', nm(mine), all.filter(([id, l]) => id === 'own' || lookSide(l) === mine), 'mine'),
                    mhTiles('mhSkin', nm(theirs), all.filter(([id, l]) => id !== 'own' && lookSide(l) === theirs), 'theirs'),
                    mhTiles('mhSkin', 'Other skins', all.filter(([id, l]) => id !== 'own' && lookSide(l) === 'both'), 'both'));
                })(),
                /* THE CHEST (2026-11-01, mondo): bare with nipples, or bare and smooth (the painted band went with the underwear 2026-11-02) */
                chestBand ? h(React.Fragment, null,
                  h('div', { className: 'pb-creator-colorlabel', 'data-cc-cam': 'body' }, 'Chest'),
                  ccChoice('mhChest', [['nipples', 'Nipples'], ['smooth', 'No nipples']])) : null) : null,
              mpfb ? null : h(React.Fragment, null,
              ccColorRow('skin', 'Skin tone', skinSwatches),
                null),
    null);
  const ccHairTab = () => h(React.Fragment, null,
              h('div', { className: 'pb-cc-tiles pb-cc-hair', role: 'group', 'aria-label': 'Hair style' },
                [{ id: 'bald', label: 'Bald' }].concat(ccHair.filter(st => !st.mh && keepPick('hair', st.id, appearance.hair === st.id))).map(style =>
                  devTile('hair', style.id, style.label, h('button', { key: style.id, className: 'pb-cc-tile pb-hair-tile' + (style.short ? ' short' : ''), 'aria-pressed': appearance.hair === style.id, onClick: () => changeAppearance({ hair: style.id }) },
                    h('i', { className: 'pb-hair-glyph' }), h('span', null, shownName('hair', style.id, style.label)))))),   // (THE RENAMED PICKS)
              // THE PACK HAIR (2026-11-01): the MakeHuman community styles (sprites.js EW_MH_HAIR_STYLES), same tiles, own row
              h('div', { className: 'pb-creator-colorlabel' }, 'More hair styles'),
              h('div', { className: 'pb-cc-tiles pb-cc-hair', role: 'group', 'aria-label': 'MakeHuman hair style' },
                ccHair.filter(st => st.mh && keepPick('hair', st.id, appearance.hair === st.id)).map(style =>
                  devTile('hair', style.id, style.label, h('button', { key: style.id, className: 'pb-cc-tile pb-hair-tile', 'aria-pressed': appearance.hair === style.id, onClick: () => changeAppearance({ hair: style.id }) },
                    h('i', { className: 'pb-hair-glyph' }), h('span', null, shownName('hair', style.id, style.label)))))),   // (THE RENAMED PICKS)
              /* THE HAIR MATERIALS (2026-11-03, mondo: "can we download ... system_hair_materials 1 and 2 ... and implement them in the
                 character creator?"): a MakeHuman system style (Bob 01 / 02, Braid 01, Long 01, Ponytail 01, Short 01 / 02 / 04) can wear one
                 of MakeHuman's recolours of it (sprites.js EW_MH_HAIR_MATS) in the texture's own colours; "Style's own" = its own texture,
                 coloured by the Hair colour (so the Hair colour row shows only then) */
              (() => {
                const mats = (window.EW_MH_HAIR_MATS || []).filter(r => r[2] === appearance.hair);
                if (!mats.length) return null;
                const cur = mats.some(r => r[0] === appearance.hairMat) ? appearance.hairMat : 'own';
                return h(React.Fragment, null,
                  h('div', { className: 'pb-creator-colorlabel' }, 'Hair texture'),
                  h('div', { className: 'pb-cc-tiles pb-cc-hair', role: 'group', 'aria-label': 'Hair texture' },
                    [['own', "Style's own"]].concat(mats.filter(r => keepPick('hairMat', r[0], cur === r[0])).map(r => [r[0], r[1]])).map(([id, label]) =>
                      devTile(id === 'own' ? null : 'hairMat', id, label, h('button', { key: id, className: 'pb-cc-tile pb-hair-tile', 'aria-pressed': cur === id, title: shownName('hairMat', id, label), onClick: () => changeAppearance({ hairMat: id }) },
                        h('span', null, id === 'own' ? label : shownName('hairMat', id, label)))))));
              })(),
              (window.EW_MH_HAIR_MATS || []).some(r => r[0] === appearance.hairMat && r[2] === appearance.hair)
                ? h('p', { className: 'pb-creator-note' }, "Hair colour: this hair texture wears its own colours. Pick Style's own to colour the hair.")
                : ccColorRow('hairColor', 'Hair colour', hairSwatches),
              /* THE SECOND HAIR COLOUR (2026-11-01, mondo: "add a secondary hair color picker"): a pack style with its own band /
                 tie / beads / flower (sprites.js `accent: true`): those keep their colours or take the second colour */
              (ccHair.find(st => st.id === appearance.hair) || {}).accent ? h(React.Fragment, null,
                h('div', { className: 'pb-creator-colorlabel' }, 'Second hair colour (band, tie, beads)'),
                ccChoice('hairAccent', [['own', 'Original colours'], ['tint', 'Pick a colour']]),
                appearance.hairAccent === 'tint' ? ccColorRow('hairColor2', 'Second hair colour', hairSwatches) : null) : null,
    null);
  const mainTabs = [['body', 'BODY', 'body'], ['face', 'FACE', 'face'], ['skin', 'SKIN', 'body'], ['hair', 'HAIR', 'face'], ['outfit', 'OUTFIT', 'body']];
  const tab = mainTabs.some(t => t[0] === mainTab) ? mainTab : 'body', tabCam = (mainTabs.find(t => t[0] === tab) || [])[2];
  return h('fieldset', { className: 'pb-creator-controls', disabled, onPointerDownCapture: ccCamFrom, onFocusCapture: ccCamFrom },
              // rev 10: the NAME and THE LOCKER first — name the character where the look is made, save / load it
              h(SavedLooks, { name: name || '', gender, appearance, disabled, onName, onLoad }),
              devHider ? ccDevBar() : null,   // THE HIDDEN PICKS: the dev item hider's bar
              h('div', { className: 'pb-cc-maintabs', role: 'tablist', 'aria-label': 'Character creator' },
                mainTabs.map(([t, label, cam]) => h('button', { key: t, role: 'tab', className: 'ms-tty-btn pb-cc-maintab' + (tab === t ? ' primary' : ''), 'aria-selected': tab === t, 'aria-pressed': tab === t,
                  'data-cc-cam-own': t === 'outfit' ? slotCam(slots.some(s => s[0] === slotTab) ? slotTab : 'head') : cam, onClick: () => { _pbCcTab = t; setMainTab(t); } },
                  ccIcon(t), h('span', { className: 'pb-cc-maintab-name' }, label)))),   // (THE CREATOR ICONS: the tab's icon over its name)
              h('div', { key: tab, className: 'pb-cc-tabpanel', role: 'tabpanel', 'aria-label': (mainTabs.find(t => t[0] === tab) || [])[1], 'data-cc-cam-own': tab === 'outfit' ? null : tabCam },
                tab === 'body' ? ccBodyTab() : tab === 'face' ? ccFaceTab() : tab === 'skin' ? ccSkinTab() : tab === 'hair' ? ccHairTab() : ccOutfit()),
              h('p', { className: 'pb-creator-note' }, 'Clothing and hair are cosmetic. Colour 1 tints the fabric; a print adds colour 2 over it; plain = no weave. SAVE CHARACTER keeps the look in the locker; saving the team keeps it on the slot.'),
              /* THE CREDITS moved to the main menu's CREDITS page (2026-11-01, mondo: "its weird having it in the character
                 creator itself"): map.js _renderCredits lists the same CREDITS.json authors with every other pack */
    footer || null);
}

/* ── LIVE 3D HERO — the character-creator stage ─────────────────────
   Mounts the shared EWCharViewer (three-renderer.js) into a host div:
   the vessel's rigged GLB with its retargeted idle, drag to orbit,
   wheel to zoom, double-click to reset. The flat sprite renders only
   for sprite-only vessels (never as a loading frame). */
function HeroViewer3D({ race, gender, cls, focus, appearance }) {
  const hostRef = React.useRef(null);
  const accent = PB_ACCENT;
  const supported = !!(window.EWCharViewer && window.EWCharViewer.supports && window.EWCharViewer.supports(race, gender, appearance));   // (THE MESHY DEFAULT: a 2D-only race in a creator look)
  React.useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (supported) {
      window.EWCharViewer.mount(host, race, gender, { accent, appearance });
    } else if (window.EWCharViewer) {
      // sprite-only vessel — release the canvas if it was sitting in our host
      if (host.querySelector('canvas[data-ew-charviewer]')) window.EWCharViewer.unmount();
      host.classList.remove('ew-cv-loading', 'ew-cv-ready', 'ew-cv-fail');
    }
  }, [race, gender, supported, accent, JSON.stringify(appearance)]);
  // the hero stands at `focus` (0..1 of the host's width) — the band between the circuit and the stats
  React.useEffect(() => {
    if (window.EWCharViewer && typeof window.EWCharViewer.setFocus === 'function') window.EWCharViewer.setFocus(focus == null ? 0.5 : focus);
  }, [focus, supported]);
  React.useEffect(() => () => {
    // component teardown: put the singleton viewer to sleep
    if (window.EWCharViewer) window.EWCharViewer.unmount();
  }, []);
  return h('div', { ref: hostRef, className: 'pb-hero3d' + (appearance ? ' pb-custom-model' : '') },
    appearance ? h('div', { className: 'pb-creator-load-error', role: 'alert' },
      h('p', null, 'The base model could not load.'),
      h('button', { className: 'ms-tty-btn', onClick: () => window.EWCharViewer?.retryCharacter() }, 'RETRY')) : null,
    // NO STAND-INS (2026-10-05): a 3D vessel shows nothing until its model is live; the flat sheet is only
    // the art of a sprite-only vessel (no loading frame under the model any more)
    supported ? null : h('div', { className: 'pb-hero3d-fallback' },
      h(Sprite, { race, gender, cls, size: '100%', glow: true, style: { width: '100%', height: '97%' } })),
    supported ? h('div', { className: 'pb-hero3d-hint' }, '⟲ DRAG · ⌕ SCROLL · ✕2 RESET') : null);
}
function TypeChip({ type, size }) {
  const c = getTypeColor(type);
  const text = TYPE_TEXT_C[(type || '').toLowerCase()] || c;
  const fs = size || 10;
  return h('span', { style: { display:'inline-flex', alignItems:'center', fontFamily:'DotGothic16, monospace', fontSize:fs, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', lineHeight:1.3, color:text, padding: fs >= 11 ? '3px 10px' : '2px 8px', border:`1px solid ${c}aa`, background:`linear-gradient(${c}22,${c}22), rgba(9,11,17,0.82)`, textShadow:'0 1px 2px rgba(0,0,0,0.85)', clipPath:'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}, type);
}
/* Letter-grade chip (2026-08-29 stat rework): the React twin of the
   statGradeNodeHtml grade NODE (2026-09-21) — one round node, shown BESIDE
   the number at every display site so the language is learned once. */
function GradeChip({ statKey, val }) {
  /* THE GRADE NODE (2026-09-21): the React twin of data.js statGradeNodeHtml
     — the same `.ew-grade` markup (the gauge ring from the bottom clockwise,
     the grade's gradient face, the white letter); `.pb-grade-ring` only
     sizes it for the pill row. */
  const n = (typeof window.statGradeNode === 'function') ? window.statGradeNode(statKey, val) : null;
  if (!n) return h('span', { className: 'pb-grade-ring ew-grade none' });
  return h('span', { className: 'pb-grade-ring ' + n.cls, style: { '--pct': n.pct }, title: 'GRADE ' + n.g + ' · ' + n.pct + '%' }, h('i', null, n.g));
}
/* Stage 5 (plan §5.5 item 2): the STAT PILL. `statKey` (HP / ATK / INT …)
   picks the disc's colour + glyph from PB_STAT_LOOK; `gradeKey` is the
   engine's stat id for the grade ring / the tooltip. The bar is rounded
   (--pb-r-sm), the fill is the stat's colour, the zodiac ▲▼ and the
   subclass / gear delta read exactly as before. */
/* the VISION row at the cap (computeFullStats _visionOver): a small MAX after the 8, and the tip says the gear past it adds nothing */
function pbVisMax(k, stats) {
  const over = (k === 'VIS' && stats) ? (stats._visionOver || 0) : 0;
  if (!over) return { suffix: '', tip: null };
  return { suffix: h('small', { key: 'max', style: { fontFamily: "'DotGothic16', monospace", fontSize: 7, letterSpacing: '0.08em', marginLeft: 3, opacity: 0.75 } }, 'MAX'), tip: 'Vision tops out at ' + (stats.vision || 8) + ': ' + over + ' point' + (over === 1 ? '' : 's')
    + ' of gear past it add nothing (Inspect searches as many tiles as Vision).' };
}
function StatBar({ label, val, max, compact, zodiacMod, delta, suffix, tip, gradeKey, statKey }) {
  const pct = Math.min(100, (val / max) * 100);
  const look = PB_STAT_LOOK[statKey] || PB_STAT_LOOK[label] || { c: EW.inkMute, g: '●' };
  /* ONE BAR COLOUR (the user 2026-10-01: "for the stat bars, get rid of the different colors. It looks random and super
     confusing") — every stat bar is the same ivory (EW_STAT_BAR_C, shared with ui.js / map.js); the grade node carries the
     colour now. Zodiac ▲▼ still tints it green / red. */
  let color = PB_STAT_BAR_C, labelColor = EW.inkMute, valColor = EW.ink;
  if (zodiacMod === 'up') { color = EW.good; labelColor = EW.good; valColor = EW.good; }
  if (zodiacMod === 'dn') { color = EW.bad; labelColor = EW.bad; valColor = EW.bad; }
  const deltaNum = delta || 0;
  /* THE ROW (2026-09-21): label · THE GRADE NODE · the number · the bar ·
     the delta — the node IS the stat's disc; an ungraded row (MOV / RNG /
     CRT / EVA) keeps the glyph disc in that column. */
  return h('div', { className: 'pb-stat' + (compact ? ' compact' : ''), title: tip || undefined, style: { '--sc': color } },
    h('span', { className: 'pb-stat-label', style: { color: labelColor } }, label,
      zodiacMod === 'up' ? h('em', { style: { color: EW.good } }, '▲') : null,
      zodiacMod === 'dn' ? h('em', { style: { color: EW.bad } }, '▼') : null),
    gradeKey ? h(GradeChip, { statKey: gradeKey, val }) : h('span', { className: 'pb-stat-disc' }, look.g),
    h('span', { className: 'pb-stat-val' + (String(val).length + (typeof suffix === 'string' ? suffix.length : 0) >= 4 ? ' long' : ''), style: { color: valColor, whiteSpace: 'nowrap' } }, ...((typeof suffix === 'string' || !suffix) ? [val + (suffix || '')] : [val, suffix])),   // `long`: a 4+ character number shrinks to fit its box (styles-base.css, 2026-11-09)
    h('span', { className: 'pb-stat-bar' }, h('i', { style: { width: `${pct}%` } })),
    h('span', { className: 'pb-stat-delta', style: { color: deltaNum > 0 ? EW.good : EW.bad } }, deltaNum > 0 ? '+' + deltaNum : deltaNum < 0 ? '' + deltaNum : ''));
}
/* Battle-style HP/MP vitals pill: the exact nameplate fills/glows (PB_VITAL,
   synced with hud.js), taller than the stat bars so the vitals read as their
   own block. Same column metrics as StatBar so everything lines up. Zodiac
   recolors label/value text only — the fill itself stays canonical green/blue. */
function VitalBar({ label, val, max, vital, zodiacMod, delta, tip, gradeKey, statKey }) {
  const pct = Math.min(100, (val / max) * 100);
  const vd = PB_VITAL[vital] || PB_VITAL.hp;
  const look = PB_STAT_LOOK[statKey] || PB_STAT_LOOK[label] || { c: vd.ink, g: '●' };
  let labelColor = vd.ink, valColor = EW.ink;
  if (zodiacMod === 'up') { labelColor = EW.good; valColor = EW.good; }
  if (zodiacMod === 'dn') { labelColor = EW.bad; valColor = EW.bad; }
  const deltaNum = delta || 0;
  return h('div', { className: 'pb-stat vital' + (vital === 'hp' ? ' hp' : ''), title: tip || undefined, style: { '--sc': look.c } },
    h('span', { className: 'pb-stat-label', style: { color: labelColor, textShadow: `0 0 8px ${vd.ink}66` } }, label,
      zodiacMod === 'up' ? h('em', { style: { color: EW.good } }, '▲') : null,
      zodiacMod === 'dn' ? h('em', { style: { color: EW.bad } }, '▼') : null),
    gradeKey ? h(GradeChip, { statKey: gradeKey, val }) : h('span', { className: 'pb-stat-disc' }, look.g),
    h('span', { className: 'pb-stat-val' + (String(val).length >= 4 ? ' long' : ''), style: { color: valColor } }, val),   // HP 1160: the 4-digit vital shrinks to fit (2026-11-09)
    h('span', { className: 'pb-stat-bar' }, h('i', { style: { width: `${pct}%`, background: vd.fill, boxShadow: vd.glow } })),
    h('span', { className: 'pb-stat-delta', style: { color: deltaNum > 0 ? EW.good : EW.bad } }, deltaNum > 0 ? '+' + deltaNum : deltaNum < 0 ? '' + deltaNum : ''));
}
/* ── D.O.O.R. layer (DOOR_DESIGN §3): the forge is a customs desk. The seal
   is the user-made PNG on R2 (data.js DOOR_TEXT.LOGO); SigilMark stays as
   the fallback when data.js predates the layer. Plain game words stay —
   THE PARTY, DOSSIER, SEAL YOUR FATE, Codex of Vessels are not renamed. */
const DOOR = (typeof window !== 'undefined' && window.DOOR_TEXT) || null;
function DoorSeal({ size }) {
  size = size || 30;
  if (!(DOOR && DOOR.LOGO && DOOR.LOGO.onDark)) return h(SigilMark);
  return h('img', { src: DOOR.LOGO.onDark, alt: '', draggable: false, style: { width: size, height: size, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.7))', userSelect: 'none' } });
}
/* Officer on desk: callsign + story clearance (NOT the ELO rank) — the
   head line of the monitor, same words as the match-select terminal. */
function pbOfficer() {
  try {
    const p = window.ProfileSystem?.getActiveProfile?.();
    if (!p) return null;
    const cl = (typeof window.doorClearance === 'function') ? window.doorClearance(p) : { level: 1, title: 'PROBATIONARY' };
    return { name: p.username || 'OFFICER', cl };
  } catch (_e) { return null; }
}
function SigilMark() {
  return h('svg',{width:22,height:22,viewBox:'0 0 28 28'},h('circle',{cx:14,cy:14,r:12,fill:'none',stroke:EW.time,strokeWidth:1}),h('circle',{cx:14,cy:14,r:6,fill:'none',stroke:EW.time,strokeWidth:0.5}),h('circle',{cx:14,cy:14,r:2,fill:EW.time}),h('line',{x1:14,y1:0,x2:14,y2:4,stroke:EW.time,strokeWidth:1}),h('line',{x1:14,y1:24,x2:14,y2:28,stroke:EW.time,strokeWidth:1}),h('line',{x1:0,y1:14,x2:4,y2:14,stroke:EW.time,strokeWidth:1}),h('line',{x1:24,y1:14,x2:28,y2:14,stroke:EW.time,strokeWidth:1}));
}
function classifySpellLocal(sp) { if (!sp) return 'utility'; if (typeof window.classifySpell==='function') return window.classifySpell(sp); const k=sp.kind||sp.type||''; if (/heal/i.test(k)) return 'heal'; if (/buff|shield/i.test(k)) return 'buff'; if (/debuff/i.test(k)) return 'debuff'; if (/damage|dmg/i.test(k)) return 'damage'; return 'utility'; }
function spellCategoryColor(cat) { return {passive:'rgba(176,84,148,0.7)',damage:'rgba(152,80,80,0.7)',heal:'rgba(90,148,86,0.7)',buff:'rgba(80,126,160,0.7)',debuff:'rgba(200,170,70,0.7)',utility:'rgba(140,100,180,0.65)'}[cat]||'rgba(140,100,180,0.65)'; }
function spellCategoryLabel(cat) { return {passive:'PASSIVE',damage:'DAMAGE',heal:'HEAL',buff:'BUFF',debuff:'DEBUFF',utility:'UTILITY'}[cat]||'UTILITY'; }

// Damage-kind mark (2026-10-20, mondo: the burst / orb marks went for the battle rows' icons): ⚔ = physical (scales
// with ATK), three diamonds = magic (scales with M ATK), on the battle rows' red damage chip (.ew-dmgkind,
// styles-hud.css; the icons are hud.js ewDmgKindIcon). Only rendered on spells that actually roll damage — a bare mark on
// a pure buff/debuff would be the confusion it exists to fix.
function pbDmgIcon(sp, size) {
  if (!sp) return null;
  // hudSpellShowsDamage = the UI "shows damage numbers" judgment (hud.js).
  // NOT the engine's spellDealsDamage — that one answers "does the cast end
  // the turn" and deliberately excludes deployables (bombs/mines), which DO
  // deserve a damage badge here.
  const dealsDmg = (typeof hudSpellShowsDamage === 'function')
    ? hudSpellShowsDamage(sp)
    : !!(sp.dmg || (sp.hitDamages && sp.hitDamages.length) || sp.dotDamage || sp.turretDmg || sp.blastDmg);
  if (!dealsDmg) return null;
  const phys = sp.damageType === 'physical';
  const box = Math.round(size * 1.4);
  return h('span', {
    className: 'ew-dmgkind ' + (phys ? 'phys' : 'magic'),
    style: { width: box, height: box, fontSize: Math.max(7, size - 1) },
    title: phys ? 'Physical damage — scales with ATK, blocked by DEF'
                : 'Magic damage — scales with M ATK, blocked by M DEF',
  }, typeof ewDmgKindIcon === 'function' ? ewDmgKindIcon(phys ? 'phys' : 'magic') : (phys ? '⚔' : '✦'));
}

// Human-readable area-of-effect footprint from whatever shape fields a spell uses.
function pbAoeLabel(sp) {
  if (!sp) return null;
  if (sp.crossRadius) return (sp.diamond ? 'Diamond r' : 'Cross r') + sp.crossRadius;
  if (sp.lineWidth || sp.kind === 'line') return 'Line' + (sp.lineLength ? ' ' + sp.lineLength : '');
  if (sp.blastRadius) return (sp.blastRadius * 2 + 1) + '×' + (sp.blastRadius * 2 + 1);
  if (sp.aoeRadius != null && sp.aoeRadius > 0) return (sp.aoeRadius * 2 + 1) + '×' + (sp.aoeRadius * 2 + 1);
  if (sp.bounceRadius) return 'Bounce r' + sp.bounceRadius;
  return null;
}

// ── THE SOCKET PICKER'S TABS + FILTERS (2026-09-14) ─────────────────
// The borrow window (Adaptable) is ~500 rows in one window. The picker
// wears the five category TABS (the same buckets the blade colours by —
// classifySpellLocal) and a filter row: PHYS / MAGIC (the damage kind the
// ⚔ / three-diamond mark shows, damage-dealers only), the six TYPE discs
// (sp.spellType — the type wheel's read), the cast SHAPE (self / single /
// multi / aoe / line — derived from the row's kind + fields, one shape
// per spell), the socket's TIERS (only when it spans more than one) and
// a search. Everything is derived from the row; nothing is stored on it.
const PB_SOCKET_TABS = [
  { id: 'all',     label: 'ALL' },
  { id: 'damage',  label: 'DAMAGE' },
  { id: 'utility', label: 'UTILITY' },
  { id: 'buff',    label: 'BUFF' },
  { id: 'debuff',  label: 'DEBUFF' },
  { id: 'heal',    label: 'HEAL' },
];
const PB_SOCKET_SHAPES = [
  { id: 'single', label: 'SINGLE', title: 'One target' },
  { id: 'multi',  label: 'MULTI',  title: 'Several targets — multi-hit, ricochet, every ally / enemy' },
  { id: 'aoe',    label: 'AOE',    title: 'An area — a radius, a blast, a cross, a zone' },
  { id: 'line',   label: 'LINE',   title: 'A line / beam / dash down a lane' },
  { id: 'self',   label: 'SELF',   title: 'Cast on yourself' },
];
const PB_SOCKET_FILTER_EMPTY = { cat: 'all', dmg: null, type: null, shape: null, tier: null, q: '' };
// The kinds whose cast is the caster's own tile (battle.js SPELL_KIND_META
// selfCast) — a range-0 row says the same thing.
const _PB_SELF_KINDS = ['barrage', 'rallyPull', 'healAll', 'manaRestoreAll', 'warCry', 'scan', 'encore', 'selfHeal', 'escape', 'transform', 'summonWeather', 'trickRoom', 'guard', 'tuneFrequency', 'pulseLattice'];
const _PB_MULTI_KINDS = ['multiHit', 'ricochet', 'splitBeam', 'healAll', 'manaRestoreAll', 'warCry', 'rallyPull', 'cleanseArea', 'aoeShield', 'zoneHeal', 'zoneDebuff', 'doorSlam'];
const _PB_LINE_KINDS = ['line', 'linePush', 'dash', 'tackle', 'leapStrike'];
function pbSpellDmgKind(sp) {
  if (!sp) return null;
  const dealsDmg = (typeof hudSpellShowsDamage === 'function')
    ? hudSpellShowsDamage(sp)
    : !!(sp.dmg || (sp.hitDamages && sp.hitDamages.length) || sp.dotDamage || sp.turretDmg || sp.blastDmg);
  if (!dealsDmg) return null;
  return sp.damageType === 'physical' ? 'physical' : 'magic';
}
function pbSpellShape(sp) {
  if (!sp) return 'single';
  const k = sp.kind || '';
  if (sp.lineWidth || _PB_LINE_KINDS.includes(k)) return 'line';
  if (k !== 'line' && pbAoeLabel(sp)) return 'aoe';
  if (_PB_MULTI_KINDS.includes(k) || (sp.hitDamages && sp.hitDamages.length > 1) || (sp.hits > 1) || sp.bounceRadius || sp.bounces) return 'multi';
  if (sp.range === 0 || sp.selfOnly || sp.selfTarget || _PB_SELF_KINDS.includes(k)) return 'self';
  return 'single';
}
// The tier numeral ('I'–'IV') a spell sits on — its rung (data.js spellTierOf).
function pbTreeTierOf(sp) { return PB_TIER_NUM[pbTierOf(sp)] || 'I'; }
function pbSocketFilterMatch(sp, f) {
  if (!f) return true;
  if (f.cat && f.cat !== 'all' && classifySpellLocal(sp) !== f.cat) return false;
  if (f.dmg && pbSpellDmgKind(sp) !== f.dmg) return false;
  if (f.type && (!pbTypeShown(sp) || (sp.spellType || '').toLowerCase() !== f.type)) return false;
  if (f.shape && pbSpellShape(sp) !== f.shape) return false;
  if (f.tier && pbTreeTierOf(sp) !== f.tier) return false;
  if (f.q) {
    const q = f.q.trim().toLowerCase();
    if (q && !((sp.name || '').toLowerCase().includes(q) || (sp.desc || '').toLowerCase().includes(q) || (sp.school || '').toLowerCase().includes(q))) return false;
  }
  return true;
}
function pbSocketFilterActive(f) {
  return !!(f && ((f.cat && f.cat !== 'all') || f.dmg || f.type || f.shape || f.tier || (f.q && f.q.trim())));
}

// Derive readable effect/mechanic tags from a spell's status effects + special fields.
function pbSpellEffects(sp) {
  const out = [];
  if (!sp) return out;
  const SD = (typeof STATUS_DEFS !== 'undefined') ? STATUS_DEFS : (window.STATUS_DEFS || {});
  (sp.statusEffects || []).forEach(e => {
    const def = SD[e.id] || {};
    const label = def.label || e.id;
    const extra = [];
    if (e.duration) extra.push(e.duration + 't');
    if (e.bonusDamage) extra.push('+' + e.bonusDamage + ' dmg');
    if (e.chance && e.chance < 1) extra.push(Math.round(e.chance * 100) + '%');
    const isBuff = def.kind === 'buff';
    out.push({ txt: (def.glyph ? def.glyph + ' ' : '') + label + (extra.length ? ' (' + extra.join(', ') + ')' : ''), color: isBuff ? EW.good : EW.warn });
  });
  // Stat changes speak in STAGES (stackable to ±5) — distinct from statuses.
  if (sp.statStageBoost) {
    const SL = { atk: 'ATK', def: 'DEF', mdef: 'M DEF', spd: 'SPD', int: 'M ATK' };
    for (const k in SL) {
      const n = sp.statStageBoost[k] || 0;
      if (n) out.push({ txt: (n > 0 ? '+' : '') + n + ' ' + SL[k] + ' stage' + (Math.abs(n) > 1 ? 's' : ''), color: n > 0 ? EW.good : EW.warn });
    }
  }
  if (sp.randomTeamBuff) out.push({ txt: '+' + (sp.randomTeamBuff.stages || 1) + ' random stat stage (team)', color: EW.good });
  const m = [];
  if (sp.damageType) m.push(sp.damageType === 'magic' ? 'Magic damage' : 'Physical damage');
  if (sp.ignoreArmor || sp.ignoresArmor || sp.bounceShieldIgnore) m.push('Ignores armor');
  if (sp.actedTargetBonus) m.push('+' + sp.actedTargetBonus + ' vs units that acted');
  if (sp.sneakBonus) m.push('+50% damage while invisible');
  if (sp.collisionBonus) m.push('+' + sp.collisionBonus + ' on collision');
  if (sp.lowHpBonus) m.push('+' + sp.lowHpBonus + ' heal on low-HP allies');
  if (sp.shieldCapPct) m.push('Shield capped at ' + Math.round(sp.shieldCapPct * 100) + '% max HP');
  if (sp.drainPct) m.push('Heals ' + Math.round(sp.drainPct * 100) + '% of damage dealt');
  if (sp.mpRestore) m.push('Restores ' + sp.mpRestore + ' MP');
  if (sp.guaranteedCrit) m.push('Guaranteed critical');
  if (sp.guaranteedStatus) m.push('Status always applies');
  if (sp.cleanse) m.push('Cleanses a debuff');
  if (sp.revivePct) m.push('Revives at ' + Math.round(sp.revivePct * 100) + '% HP');
  if (sp.chargeToTarget || sp.dashDamage || sp.kind === 'dash') m.push('Dashes to the target');
  if (sp.teleportDistance || sp.kind === 'teleport') m.push('Teleports' + (sp.teleportDistance ? ' up to ' + sp.teleportDistance + ' tiles' : ''));
  if (sp.teleportAnyUnit) m.push('Can teleport any unit');
  if (sp.weatherType || sp.kind === 'summonWeather') m.push('Summons weather' + (sp.weatherType ? ': ' + sp.weatherType : ''));
  if (sp.terrainType || sp.kind === 'terrainCreate') m.push('Reshapes terrain' + (sp.terrainType ? ': ' + sp.terrainType : ''));
  if (sp.turretHp || sp.kind === 'deployTurret') m.push('Deploys a turret');
  if (sp.friendlyFire) m.push('Friendly fire');
  if (sp.bounceDamage) m.push('Ricochets for ' + sp.bounceDamage + ' dmg');
  if (sp.hitDamages && sp.hitDamages.length) m.push('Multi-hit (' + sp.hitDamages.length + ' strikes)');
  if (sp.ignoresLineOfSight) m.push('Ignores line of sight');
  if (sp.selfStun) m.push('Self-stuns after use');
  m.forEach(x => out.push({ txt: x, color: EW.inkMute }));
  return out;
}

// The rich floating spell card. Returns a fixed-positioned React element clamped to the viewport.
function buildSpellTooltip(sp, x, y) {
  if (!sp) return null;
  const cat = pbColourCat(sp), catC = spellCategoryColor(cat);
  const power = (typeof window.getSpellPowerLabel === 'function') ? (window.getSpellPowerLabel(sp) || '') : '';
  const aoe = pbAoeLabel(sp);
  const effects = pbSpellEffects(sp);
  const W = 300;
  const left = Math.max(8, Math.min(x + 18, window.innerWidth - W - 12));
  const top = Math.max(8, Math.min(y + 18, window.innerHeight - 280));
  const stat = (label, val, col) => (val == null || val === '') ? null : h('div', { key: label, style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, padding: '3px 8px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${EW.panelEdge}`, minWidth: 34 } },
    h('span', { style: { fontSize: 8, color: EW.inkDim, letterSpacing: '0.1em' } }, label),
    h('span', { style: { fontSize: 11, fontWeight: 700, color: col || EW.ink } }, val));
  const powerVal = power.replace(/\s*(dmg|heal|shield)\s*$/, '');
  const powerLabel = cat === 'heal' ? 'HEAL' : (sp.shield || sp.shieldHp || /shield/.test(power)) ? 'SHIELD' : 'PWR';
  const powerCol = cat === 'heal' ? EW.good : (powerLabel === 'SHIELD') ? EW.space : EW.bad;
  return h('div', { style: { position: 'fixed', left, top, width: W, zIndex: 9999, pointerEvents: 'none', background: 'linear-gradient(180deg,#0d0c18,#08070f)', border: `1px solid ${catC}`, boxShadow: `0 8px 32px rgba(0,0,0,0.85), 0 0 16px ${catC}33`, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 7, animation: 'pbTipIn 0.12s ease-out', fontFamily: 'DotGothic16, monospace' } },
    h('div', { style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, borderBottom: `1px solid ${EW.panelEdge}`, paddingBottom: 6 } },
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 } },
        h('span', { style: { fontFamily: 'Cormorant SC, serif', fontSize: 15, letterSpacing: '0.06em', color: EW.ink, fontWeight: 600, lineHeight: 1.1 } }, sp.name),
        h('span', { style: { fontSize: 9, color: EW.inkMute, letterSpacing: '0.04em' } }, [sp.school, pbSpCost(sp) + ' SP'].filter(Boolean).join('  ·  '))),
      h('div', { style: { flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 } },
        h('span', { style: { fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', color: catC, border: `1px solid ${catC}66`, background: `${catC}1a`, padding: '1px 6px' } }, spellCategoryLabel(cat)),
        // canonical TYPE badge (same chip as the blades / battle menu) —
        // never a bare colored word
        pbTypeShown(sp) && h('span', { style: pbTypeBadgeStyle(sp.spellType, 8) }, sp.spellType),
        // damage-kind mark + word — icon-first so it can't read as a TYPE chip
        pbDmgIcon(sp, 10) && h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', color: sp.damageType === 'physical' ? '#e0944a' : '#b56ce0' } },
          pbDmgIcon(sp, 10), sp.damageType === 'physical' ? 'PHYSICAL' : 'MAGIC'))),
    h('div', { style: { display: 'flex', gap: 4, flexWrap: 'wrap' } },
      stat('MP', sp.cost != null ? sp.cost : null, 'rgba(120,190,255,0.95)'),
      stat('AP', sp.apCost || 1),
      stat('RNG', sp.range != null ? (sp.range === 0 ? 'Self' : sp.range) : null),
      aoe && stat('AOE', aoe, EW.warn),
      power && stat(powerLabel, powerVal, powerCol)),
    effects.length > 0 && h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 4 } },
      ...effects.map((e, i) => h('span', { key: i, style: { fontSize: 9, color: e.color, background: 'rgba(255,255,255,0.03)', border: `1px solid ${e.color}33`, padding: '1px 6px', letterSpacing: '0.02em' } }, e.txt))),
    sp.desc && h('div', { style: { fontSize: 11, lineHeight: 1.45, color: '#c3c8d6', borderTop: `1px solid ${EW.panelEdge}`, paddingTop: 6, fontStyle: 'italic' } }, sp.desc));
}

// ── Battle-parity ability blades ─────────────────────────────────
// The builder's spell rows ARE the in-battle Horologe command rows
// (hud.js HorologeBlade / .hrlg-blade): whole row wears its category
// color, glowing glyph + colored left edge, Cormorant SC name, the
// canonical type badge, PW/MP chips, gold cost diamonds. What you
// equip here is exactly the row you'll click mid-fight.
// KEEP IN SYNC with hud.js _HRLG_CAT (colors updated 2026-07-26).
const PB_CAT = {
  damage:  { icon: '⚔', color: '#ff5f5f' },
  heal:    { icon: '♥', color: '#58d858' },
  buff:    { icon: '▲', color: '#5cb2ff' },
  debuff:  { icon: '▼', color: '#a06bff' },
  utility: { icon: '◎', color: '#f0d060' },
  passive: { icon: '◈', color: '#f28ad0' },
};
function pbPowerStat(sp) {
  if (typeof window.spellPowerStat === 'function') return window.spellPowerStat(sp);
  if (sp.dmg) return { value: sp.dmg, unit: 'PWR', color: '#ee6655' };
  if (sp.hitDamages && sp.hitDamages.length) return { value: sp.hitDamages.reduce((s, v) => s + v, 0), unit: 'PWR', color: '#ee6655' };
  if (sp.dotDamage) return { value: sp.dotDamage, unit: 'DOT', color: '#ee6655' };
  if (sp.heal) return { value: sp.heal, unit: 'HP', color: '#55cc66' };
  if (sp.shield) return { value: sp.shield, unit: 'SHLD', color: '#5fd6ff' };
  return null;
}
// Spell-pool ordering: category buckets (damage leads), power desc within.
const PB_CAT_ORDER = { damage:0, utility:1, buff:2, debuff:3, heal:4 };
function pbCatRank(sp) { const c = classifySpellLocal(sp); return PB_CAT_ORDER[c] != null ? PB_CAT_ORDER[c] : 9; }
function pbPowerVal(sp) { const p = pbPowerStat(sp); return p ? (parseFloat(p.value) || 0) : 0; }
/* THE canonical type badge — same shape as hud.js typeBadgeStyle (PS1
   outline chip: 1px frame in the type's color around mono caps, no fill
   wash, no cut corners). Battle-parity: matchup intel looks identical
   on the blade here and mid-fight. */
/* THE TYPE BADGE RULE (2026-10-17, data.js spellTypeMatters): the TYPE chip only where the type changes something —
   it only ever drives damage, so a heal / buff / move / passive row wears none (and the TYPE filter skips it). */
function pbTypeShown(sp) {
  return !!(sp && sp.spellType) && (typeof spellTypeMatters !== 'function' || spellTypeMatters(sp));
}
function pbTypeBadgeStyle(typeKey, fontSize) {
  const k = (typeKey || '').toLowerCase();
  const base = TYPE_C[k] || EW.inkMute;
  // THE SOLID PASS (2026-09-21): a filled pill, dark ink (white on a dark colour)
  const _m = /^#?([0-9a-f]{6})/i.exec(String(base)); const _n = _m ? parseInt(_m[1], 16) : 0xffffff;
  const ink = ((0.299 * (_n >> 16) + 0.587 * ((_n >> 8) & 255) + 0.114 * (_n & 255)) / 255) < 0.5 ? '#ffffff' : '#0b0810';
  return { display:'inline-flex', alignItems:'center', flexShrink:0, fontFamily:'"IBM Plex Mono", monospace', fontSize:fontSize||9, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', lineHeight:1.3, color:ink, background:base, border:'1px solid rgba(0,0,0,0.55)', borderRadius:999, padding:'1px 6px', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.28), 0 1px 0 rgba(0,0,0,0.5)' };
}
function slotNoNode(slotNums, slotLabel) {
  if (slotNums && slotNums.length) return h('span', { className:'pbx-slotno' }, slotNums.map(n => h('span', { key:n }, n)));
  if (slotLabel != null) return h('span', { className:'pbx-slotno' }, slotLabel);
  return null;
}
function SpellBlade({ sp, slotLabel, slotNums, heightPx, equippedSlot, pool, equipped, raceAbility, dim, empty, onClick, onHoverIn, onHoverOut }) {
  if (empty) {
    return h('div', { className:'pbx-blade empty', style: heightPx ? { minHeight:heightPx } : null },
      slotNoNode(slotNums, slotLabel),
      h('span', { style:{ fontSize:10, color:EW.inkDim, fontStyle:'italic', letterSpacing:'0.1em' } }, 'EMPTY SLOT'));
  }
  const cat = pbColourCat(sp);
  const cc = PB_CAT[cat] || PB_CAT.damage;
  const sc = spellSlotCost(sp);
  const pw = pbPowerStat(sp);
  const aoe = pbAoeLabel(sp);
  const rng = sp.range != null ? (sp.range === 0 ? 'Self' : 'RNG ' + sp.range) : null;
  const descBits = [rng, aoe ? 'AOE ' + aoe : null].filter(Boolean).join(' · ');
  // The whole row wears its category color — same CSS vars as hud.js.
  const catVars = {
    '--cat': cc.color,
    '--bc-soft': cc.color + '88', '--bc-faint': cc.color + '2a',
    '--bc-hi': cc.color + '2e', '--bc-lo': cc.color + '12',
  };
  const pips = [];
  for (let i = 0; i < sc; i++) pips.push(h('span', { key:i, className:'pbx-cpip' + (sc >= 3 ? ' heavy' : '') }));
  return h('div', {
    className: 'pbx-blade' + (pool ? ' pool' : '') + (equipped ? ' on' : '') + (equippedSlot ? ' equipped' : ''),
    style: { ...catVars, opacity: dim ? 0.45 : 1, minHeight: heightPx || undefined },
    onClick, onMouseEnter: onHoverIn, onMouseLeave: onHoverOut,
  },
    slotNoNode(slotNums, slotLabel),
    h('span', { className:'pbx-cursor' }, '▶'),
    pool ? h('span', { className:'pbx-checkbox', style:{ borderColor: equipped ? cc.color : 'rgba(255,255,255,0.35)' } }, equipped ? h('span', { style:{ width:6, height:6, background:cc.color, display:'block' } }) : null) : null,
    // a damage row's glyph says its damage kind, as in battle: ⚔ physical, three diamonds magic (hud.js ewDmgKindIcon)
    h('span', { className:'pbx-glyph', title: cat === 'damage' ? (sp.damageType === 'physical' ? 'Physical damage — scales with ATK, blocked by DEF' : 'Magic damage — scales with M ATK, blocked by M DEF') : undefined },
      (cat === 'damage' && typeof ewDmgKindIcon === 'function') ? ewDmgKindIcon(sp.damageType === 'physical' ? 'phys' : 'magic') : cc.icon),
    h('div', { className:'pbx-main' },
      // row 1: name + TYPE badge own the line (matchup intel never clips)
      h('div', { className:'pbx-row1' },
        h('span', { className:'pbx-name' }, sp.name),
        pbTypeShown(sp) ? h('span', { style: pbTypeBadgeStyle(sp.spellType, 9) }, sp.spellType) : null,
        raceAbility ? h('span', { style:{ flexShrink:0, fontSize:8, letterSpacing:'0.14em', color:'#f2c468', border:'1px solid rgba(242,196,104,0.45)', background:'rgba(8,7,12,0.7)', padding:'1px 5px', whiteSpace:'nowrap' }, title:'Race ability — this vessel’s birthright' }, 'RACE') : null,
        (!pool && onClick) ? h('span', { className:'pbx-x', style:{ marginLeft:'auto' } }, '✕') : null),
      // row 2: what it does + the chips, underneath — nothing ever cut off
      h('div', { className:'pbx-row2' },
        h('span', { className:'pbx-desc' }, [descBits, sp.desc || ''].filter(Boolean).join(' — ') || spellCategoryLabel(cat)),
        pw ? h('span', { className:'pbx-pw', style:{ color:pw.color } }, pw.value + ' ' + pw.unit) : null,
        sp.cost ? h('span', { className:'pbx-mp' }, sp.cost + ' MP') : null,
        h('span', { className:'pbx-cost', title: sc + ' loadout slot' + (sc > 1 ? 's' : '') }, pips))));
}

/* ══ SPELL TREE — the Tree-of-Life selector (SPELL_TREE_REDESIGN doc) ══
   13 nodes: root (Basic Attack) + three 4-node pillars — RACE (middle),
   PRIMARY job (LEFT), SECONDARY job (RIGHT). Equip = adjacency to an
   equipped node via a functional path; unequip only if the rest stays
   root-connected. Freelancer keeps the flat pool (wildcard sockets are a
   separate pass — classHasSpellTree routes it to legacy). */

/* Node color = what the spell DOES, same coding as the in-battle action
   menu (_HRLG_CAT in hud.js): red damage, green heal, blue buff, purple
   debuff, gold utility. Branch identity lives only in the pillar
   header labels — never on the nodes. */
const TREE_CAT_C = { damage:'#ff5f5f', heal:'#58d858', buff:'#5cb2ff', debuff:'#a06bff', utility:'#f0d060', passive:'#f28ad0' };
/* THE PASSIVE COLOUR (2026-10-17, mondo: "make sure that passives are a separate color than utility moves"): a passive row
   (kind 'passive', its category reads 'utility') paints rose, not the utility gold, on the rack, the loadout, the info
   panel and the hover card. pbColourCat is the painter's category only — filters and ordering keep classifySpellLocal. */
function pbColourCat(sp) { return !sp ? null : sp.kind === 'passive' ? 'passive' : classifySpellLocal(sp); }
// In-chip glyph = the same category ICON the battle action menu uses
// (_HRLG_CAT in hud.js) — NOT the tier numeral (most race abilities carry
// no tier tag, which left race chips blank). Name lives under the chip.
const TREE_CAT_GLYPH = { damage:'⚔', heal:'♥', buff:'▲', debuff:'▼', utility:'◎', passive:'◈' };
/* the category disc's glyph (2026-10-20, mondo: "I dont want the physical/magical icon after the name, it needs to be the
   red circle icon at the front"): a damage spell's red disc says its damage kind, as in battle: ⚔ physical, three
   diamonds magic (hud.js ewDmgKindIcon). Nothing after the name says it. */
function pbCatGlyph(sp, cat) {
  if (cat === 'damage' && sp && typeof ewDmgKindIcon === 'function') return ewDmgKindIcon(sp.damageType === 'physical' ? 'phys' : 'magic');
  return TREE_CAT_GLYPH[cat] || TREE_CAT_GLYPH.utility;
}
const TREE_NODE_BG = '#0d0d13';   // opaque chip fill — lines must never show through a node
/* ══ THE FINISHER ON THE CIRCUIT (2026-09-19) — the user: "I would still
   like to see the finishers and their animations in the party builder in
   the spell tree somewhere." The race's execution (data.js FINISHERS — the
   gauge's other verb, battle.js doFinisher; never a tree spell, never a
   slot) stands as ONE row under the root's bus, THE FINISHER strip: the
   node key is PB_FIN_KEY, it is always "equipped" (the full gauge is its
   price), it takes the select / hover / ENTER / SPACE like any node, and
   its preview is the execution on the stage (EWCharViewer.previewFinisher
   → VFX3D.stage.finisher — the built signature or the typed execution +
   the charged cast). pbFinisherDef(race) is the ONE read. ══ */
const PB_FIN_KEY = 'FIN';
function pbFinisherDef(race, gender) {
  if (!race) return null;
  try {
    /* the race's own types, so a race with no FINISHERS row (the bligblog, 2026-10-27) shows its first type's typed execution, as in battle */
    if (typeof window.getFinisherDefForRace === 'function') return window.getFinisherDefForRace(race, (window.RACE_PROFILES && window.RACE_PROFILES[race] && window.RACE_PROFILES[race].types) || [], gender) || null;   // PRIEST + NUN MERGED: the female's own row
    return (window.FINISHERS && window.FINISHERS[race]) || null;
  } catch (e) { return null; }
}
/* ══ THE TIER RACK (2026-09-24 — the user's spell tree rework) ══════════
   The user: "get rid of units having a secondary job ... ditch the branches.
   The node rung level that a spell is on becomes its tier — Tier I, II, III
   and IV, costing 1, 2, 3 and 4 Spell Points (SP). Still 7 spell slots, 16
   SP ... any spell can be selected anywhere ... make sure the skill tree is
   completely redesigned / reformatted to fit this new spell selection
   system in the party builder."
   So TECHNIQUES is no longer a circuit (no root-to-capstone lanes, no path,
   no cascade, no fork, no subclass lane). It is THE RACK:
     · THE LOADOUT — seven slot cells, the equipped spells in pick order,
       each with its tier numeral; a click unequips (just that spell).
     · FOUR TIER ROWS, IV at the top → I at the bottom, each headed with its
       numeral and its price (4 · 3 · 2 · 1 SP), holding every spell of the
       unit's pool on that tier (race + job, a twin rung's two alternates
       side by side — each its own pick now). A click equips or unequips.
       A chip's state is data.js spellAddVerdict's: equipped · ok · sp (not
       enough SP left) · slots (all seven full) · sealed (Clash).
     · (2026-09-27, THE JOBS REMOVAL + THE FAMILY TABS: the rows became one tab per family — see pbTierCtx; the
       borrow is the Adaptable training row's BORROW tab; the basic attack + THE FINISHER close the rack.)
   The SP meter (16 cells) and the slot pips live in the tech bar; hovering a
   chip forecasts +N / −N on both. Legality is data.js's (isTreeLoadoutLegal
   / treeLegalSubset — also the host's online check). ══ */
const PB_TIER_ORDER = [4, 3, 2, 1];
const PB_TIER_NUM = ['', 'I', 'II', 'III', 'IV'];
const PB_BORROW_RE = /^B[0-4]$/;   // 'B0' = the whole borrow window (every tier, family by family)
/* THE FAMILY TABS (the user, 2026-09-27: "Easy to read spell slots organized by family, maybe tabs for the families, with
   one section that shows the spell info for whichever one you have selected/hovered on"). The rack is ONE family at a
   time: the race's families in their RACE_FAMILIES order, then TRAINING (the old job passives, 1 SP each), GEAR, and
   BORROW (the Adaptable row's window). The open tab is a per-viewer UI state (never state, never relayed — RULE #2). */
function pbSpMax() { return typeof window.SPELL_SP_MAX === 'number' ? window.SPELL_SP_MAX : 16; }
function pbTierOf(spOrId) {
  if (!spOrId) return 0;
  if (typeof window.spellTierOf === 'function') return window.spellTierOf(spOrId);
  const sp = typeof spOrId === 'object' ? spOrId : null;
  return sp && sp.tier === 'III' ? 3 : sp && sp.tier === 'II' ? 2 : 1;
}
function pbSpCost(spOrId) { return typeof window.spellSpCost === 'function' ? window.spellSpCost(spOrId) : pbTierOf(spOrId); }
function pbSpUsed(ids, ups) {
  if (ups && typeof window.loadoutSpUsed === 'function') return window.loadoutSpUsed(ids, ups);   // THE UPGRADES (Phase 5): tier + Σ upgrade SP
  return (ids || []).reduce((n, id) => n + (id ? pbSpCost(id) : 0), 0);
}
/* THE UPGRADES (SPELL_LIBRARY_PLAN.md §6.3, Phase 5): the kit's upgrade map as the repair keeps it (allowed, ≤ 2 per spell,
   inside the SP) — what the SP meter counts and what createUnit will build. */
function pbEffUps(race, cls, ids, ups) {
  if (!ups || typeof ups !== 'object' || typeof window.treeLegalUpgrades !== 'function') return {};
  return window.treeLegalUpgrades(race, cls, (ids || []).filter(Boolean), ups);
}
/* One spell's upgrade rows for the technique panel: every allowed upgrade with its state (on · ok · the refusal). */
function pbUpgradeRows(ctx, id) {
  if (!ctx || !id || typeof window.spellAllowedUpgrades !== 'function') return [];
  const reg = window.SPELL_UPGRADES || {};
  const on = (ctx.ups && ctx.ups[id]) || [];
  return window.spellAllowedUpgrades(id).map(u => {
    // a passive's +1 / +2 names this row's own numbers (data.js spellUpgradeDescFor)
    const row = Object.assign({}, reg[u] || {}, typeof window.spellUpgradeDescFor === 'function' ? { desc: window.spellUpgradeDescFor(id, u) } : {});
    if (on.includes(u)) return { id: u, row, st8: 'on', note: 'ON · CLICK TO REMOVE · +' + window.spellUpgradeSp(u) + ' SP BACK' };
    const v = window.spellUpgradeVerdict(ctx.race, ctx.cls, ctx.equipped, ctx.ups, id, u);
    return { id: u, row, st8: v.ok ? 'ok' : v.reason, note: v.note };
  });
}
/* One unit's rack: the pool in parts (data.js unitSpellPoolParts — its families, the door wheel, the universal TRAINING /
   GEAR, and the families other races carry while the kit holds Adaptable), every id's source, THE TABS, the sealed set,
   the equipped list + its SP. `tabWish` = the open tab's key (a stale or null key opens the first tab). Pure. */
function pbTierCtx(race, cls, equipped, upsWish, tabWish, gender) {   // `gender` (2026-10-27): RACE_GENDER_SPELLS
  const eq = (equipped || []).filter(Boolean);
  const parts = typeof window.unitSpellPoolParts === 'function' ? window.unitSpellPoolParts(race, cls, eq, gender) : { race: [], job: [], borrowRace: [], borrowJob: [], wheel: [], gear: [] };
  if (!parts.wheel) parts.wheel = [];
  if (!parts.gear) parts.gear = [];
  const famOf = (id) => {
    const sp = id && typeof window.getSpellById === 'function' ? window.getSpellById(id) : null;
    const fs = (sp && typeof window.spellFamiliesOf === 'function') ? window.spellFamiliesOf(sp) : [];
    return fs.find(f => window.SPELL_FAMILIES && window.SPELL_FAMILIES[f]) || '';
  };
  const sourceOf = {};
  parts.race.forEach(id => { sourceOf[id] = 'race'; });
  parts.wheel.forEach(id => { if (!sourceOf[id]) sourceOf[id] = 'wheel'; });   // THE DOOR WHEEL (DOOR_GUN_PLAN §2.4): the Door Agent's destination doors
  parts.borrowRace.forEach(id => { if (!sourceOf[id]) sourceOf[id] = 'borrowRace'; });
  parts.gear.forEach(id => { if (!sourceOf[id]) sourceOf[id] = famOf(id) === 'training' ? 'training' : 'gear'; });   // universal, never "borrowed"
  const pool = new Set(Object.keys(sourceOf));
  const borrows = typeof window.loadoutBorrows === 'function' ? window.loadoutBorrows(eq) : eq.includes('passiveAdaptable');
  const own = parts.race.concat(parts.wheel);
  const borrowed = borrows ? eq.filter(id => pool.has(id) && !own.includes(id) && !parts.gear.includes(id)) : [];
  const isPas = (id) => typeof window.spellIsPassive === 'function' && window.spellIsPassive(id);
  const sealed = typeof window.spellSealedIds === 'function' ? window.spellSealedIds(own.concat(borrowed, parts.gear)) : new Set();
  const ups = pbEffUps(race, cls, eq, upsWish);   // THE UPGRADES (Phase 5): every verdict and the meter count them
  const FAM = window.SPELL_FAMILIES || {};
  const tabs = [];
  /* the race's own families (data.js spellFamilyGroups — RACE_FAMILIES order, tier I → IV inside each; a family passive
     row sits in its family's tab), the door wheel's rows in theirs */
  const groups = typeof window.spellFamilyGroups === 'function' ? window.spellFamilyGroups(own, race)
    : [{ fam: null, name: 'Spells', glyph: '◇', color: '#8a8270', desc: '', own: true, ids: own }];
  for (const g of groups) if (g.ids.length) tabs.push({ key: 'f:' + (g.fam || '_'), kind: 'family', fam: g.fam, name: g.name, glyph: g.glyph, color: g.color, desc: g.desc || '', ids: g.ids.slice() });
  /* THE ALWAYS-KNOWN COLUMN (2026-10-29, mondo: "i dont see the chess pieces spells"): the race's inherent spells (data.js
     RACE_INHERENT_SPELLS — the chess piece's six pieces, the machine elves' mirror) have no slot and no SP, so the pool skips
     them; they lead the rack as their own lit column, shown and read here but never equipped */
  const INH = (typeof RACE_INHERENT_SPELLS !== 'undefined') ? RACE_INHERENT_SPELLS : (window.RACE_INHERENT_SPELLS || {});
  const inherent = (INH[race] || []).filter(id => typeof window.getSpellById !== 'function' || window.getSpellById(id));
  if (inherent.length) {
    const f0 = famOf(inherent[0]), d0 = FAM[f0] || {};
    tabs.unshift({ key: 'inherent', kind: 'inherent', fam: f0 || null, name: d0.name || 'Always Known', glyph: d0.glyph || '◆', color: d0.color || '#e6e9f2',
      desc: 'Always known — no slot, no SP' + (d0.desc ? '. ' + d0.desc : ''), ids: inherent.slice() });
    inherent.forEach(id => { if (!sourceOf[id]) sourceOf[id] = 'inherent'; });
  }
  const uni = (f) => {
    const ids = parts.gear.filter(id => famOf(id) === f);
    const d = FAM[f] || {};
    if (ids.length) tabs.push({ key: f, kind: f, fam: f, name: d.name || f, glyph: d.glyph || '◈', color: d.color || '#d9d2b8', desc: d.desc || '', ids });
  };
  uni('training');   // THE TRAINING (the jobs removal): the old job passives, 1 SP each
  uni('gear');
  const borrowGroups = borrowed.length && typeof window.spellFamilyGroups === 'function' ? window.spellFamilyGroups(borrowed, null) : [];
  tabs.push({ key: 'borrow', kind: 'borrow', fam: null, name: 'Borrow', glyph: '＋', color: '#7fd9dd', locked: !borrows,
    desc: borrows ? 'Adaptable is equipped: take spells from the families other races carry.' : 'Equip ADAPTABLE (Training, 1 SP) to take spells from the families other races carry.',
    ids: borrowGroups.length ? borrowGroups.reduce((a, g) => a.concat(g.ids), []) : borrowed.slice() });
  for (const t of tabs) t.on = t.kind === 'inherent' ? t.ids.length : t.ids.filter(id => eq.includes(id)).length;
  const tab = tabs.find(t => t.key === tabWish) || tabs[0];
  const passives = own.concat(borrowed).filter(isPas).concat(parts.gear.filter(id => !own.includes(id)));
  return { race, gender, cls, parts, pool, sourceOf, famOf, tabs, tab, inherent: new Set(inherent), borrowCount: parts.borrowRace.length, passives, sealed, equipped: eq, borrows, isFreelancer: borrows, ups,
    pasUsed: eq.filter(isPas).length,   // no passive cap since 2026-10-06
    cap: typeof window.SPELL_SLOT_MAX !== 'undefined' ? window.SPELL_SLOT_MAX : 7, spMax: pbSpMax(), spUsed: pbSpUsed(eq, ups) };
}
/* equipped · ok · sp · slots · sealed · dup/pool (never drawn) */
function pbSpellState(ctx, id) {
  if (!ctx || !id) return 'empty';
  if (ctx.inherent && ctx.inherent.has(id)) return 'always';   // THE ALWAYS-KNOWN COLUMN: no slot, no SP, never equipped
  if (ctx.equipped.includes(id)) return 'equipped';
  if (typeof window.spellAddVerdict === 'function') {
    const v = window.spellAddVerdict(ctx.race, ctx.cls, ctx.equipped, id, ctx.pool, ctx.ups, ctx.gender);
    return v.ok ? 'ok' : v.reason;
  }
  return 'ok';
}
function pbSpellVerdict(ctx, id) {
  if (!ctx || !id || typeof window.spellAddVerdict !== 'function') return null;
  return window.spellAddVerdict(ctx.race, ctx.cls, ctx.equipped, id, ctx.pool, ctx.ups, ctx.gender);
}
const PB_SOURCE_LABEL = { race: 'RACE', borrowRace: 'BORROWED', wheel: 'DOOR WHEEL', training: 'EVERY UNIT', gear: 'EVERY UNIT', inherent: 'ALWAYS KNOWN' };
/* The keyboard's grid (THE FAMILY COLUMNS, 2026-10-01): one list per column as drawn (BORROW ends with ＋ BROWSE), then the
   ALWAYS READY pair (THE FINISHER, the basic attack). ↑ ↓ walk a column, ← → change column keeping the row (clamped). */
function pbTierGrid(ctx, finisher) {
  const cols = pbRackCols(ctx).map(t => t.kind === 'borrow' ? t.ids.concat(['B0']) : t.ids.slice()).filter(c => c.length);
  cols.push(finisher ? [PB_FIN_KEY, 'root'] : ['root']);
  return cols;
}
function pbTierStep(ctx, key, dir, finisher) {
  const cols = pbTierGrid(ctx, finisher);
  let c = cols.findIndex(col => col.includes(key));
  if (c < 0) return cols[0][0];
  let r = cols[c].indexOf(key);
  if (dir === 'up') r = Math.max(0, r - 1);
  else if (dir === 'down') r = Math.min(cols[c].length - 1, r + 1);
  else if (dir === 'left' && c > 0) { c -= 1; r = Math.min(r, cols[c].length - 1); }
  else if (dir === 'right' && c < cols.length - 1) { c += 1; r = Math.min(r, cols[c].length - 1); }
  return cols[c][r];
}
/* the chess piece's reach (battle.js chessPattern): what a piece's spell can take, said in place of a range */
const PB_CHESS_REACH = { pawn: 'DIAGONAL 1', knight: 'L JUMP', bishop: 'DIAGONALS', rook: 'STRAIGHT LINES', queen: 'ALL 8 LINES', king: 'ANY SIDE 1' };
function pbNodeMeta(sp) {
  const m = [];
  if (!sp) return m;
  if (sp.kind === 'passive') {   // THE PASSIVES (Phase 4): no MP, no range — the stat stick's numbers, else the word
    const sb = sp.hooks && sp.hooks.statBonus;
    if (sb && typeof sb === 'object') Object.keys(sb).forEach(k => { if (sb[k]) m.push(['+' + sb[k] + ' ' + (k === 'int' ? 'M.ATK' : k.toUpperCase()), '#8ee6a0']); });
    m.push(['PASSIVE', null]);
    return m.slice(0, 3);
  }
  if (sp.cost) m.push(['MP ' + sp.cost, '#6fc3ff']);
  if (sp.chessPiece) m.push([PB_CHESS_REACH[sp.chessPiece] || 'PATTERN', null]);   // a piece takes what its pattern reaches, not a range
  else if (sp.range != null) m.push([sp.range === 0 ? 'SELF' : 'R' + sp.range, null]);
  const aoe = pbAoeLabel(sp);
  if (aoe) m.push(['AOE ' + aoe, null]);
  const pw = pbPowerStat(sp);
  if (pw) m.push([pw.value + ' ' + pw.unit, pw.color]);
  return m.slice(0, 4);
}
/* THE BATTLE READ (2026-09-24 look pass — mondo: "the spells need to show the same elemental information like in
   the spell menu during battle, and the same AOE grid preview"): the badges the battle spell menu's row wears
   (hud.js _hrlgSpellBadges — the TYPE badge, the element glyph, the statuses it applies / punishes) and its AOE
   footprint (hud.js _hrlgSpellShape → our own tiles, sized for the rack). hud.js loads after this file, so both
   are read at render time; without it the type badge stands alone and no grid shows. */
function pbSpellBadges(sp, max) {
  if (!sp) return [];
  let list = null;
  try { if (typeof _hrlgSpellBadges === 'function') list = _hrlgSpellBadges(sp); } catch (e) { list = null; }
  if (!list) list = pbTypeShown(sp) ? [{ label: String(sp.spellType).toUpperCase(), style: pbTypeBadgeStyle(sp.spellType, 10), title: 'Spell type — drives type advantage' }] : [];
  return list.slice(0, max || 6).map((b, i) => h('span', { key: 'b' + i, className: 'pb-badge', style: b.style, title: b.title || undefined }, b.label));
}
function pbAoeShape(sp) {
  try { return (sp && typeof _hrlgSpellShape === 'function') ? _hrlgSpellShape(sp) : null; } catch (e) { return null; }
}
function pbAoeTiles(sp, big) {
  const shape = pbAoeShape(sp);
  if (!shape) return null;
  const cells = [];
  let cols;
  if (shape.kind === 'line') {
    cols = shape.len || 4;
    const rows = Math.min(3, shape.w || 1);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) cells.push(true);
  } else {
    const r = Math.min(2, shape.r || 1);
    cols = r * 2 + 1;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      // a 'mask' shape (a drawn aoeMask, an X / ring / round field) lights the cells its set names — mirrors hud.js _hrlgShapeTiles
      const on = shape.kind === 'mask' ? shape.cells.has(dx + ',' + dy)
        : shape.kind === 'cross' ? (dx === 0 || dy === 0) : shape.kind === 'diamond' ? (Math.abs(dx) + Math.abs(dy) <= r) : true;
      cells.push(on ? (dx === 0 && dy === 0 ? 'c' : true) : false);
    }
  }
  return h('span', { key: 'aoe', className: 'pb-aoe' + (big ? ' big' : ''), title: shape.label, style: { gridTemplateColumns: 'repeat(' + cols + ', var(--pb-aoe-cell))' } },
    ...cells.map((c, i) => h('i', { key: i, className: c === 'c' ? 'ctr' : (c ? '' : 'off') })));
}
/* THE FAMILY COLUMNS (the user, 2026-10-01: "Each spell family should be a column so I can see every spell a unit has at
   one time. We dont need to show the tiers anywhere, they are redundant with the spell cost points."). The rack is the
   loadout strip (seven slot cards + ALWAYS READY) over ONE COLUMN PER FAMILY, side by side: the race's families, then
   TRAINING and GEAR (the universal passive rows), then BORROW while Adaptable is on. Every card wears its SP cost, never
   a tier. The info panel lives in its own fixed cell beside the rack (never over it), so a hover can not move a card. */
function pbRackCols(ctx) {
  return ctx.tabs.filter(t => t.kind !== 'borrow' || ctx.borrows);
}
function SpellTierPanel({ ctx, fc, clsName, raceLabel, onSpellClick, onBorrow, onNodeHoverIn, onNodeHoverOut,
                          selKey, hoverKey, onSelect, shakeKey, finisher, onUnequipSlot, onUpgradeOpen }) {
  const spellOf = (id) => (id && typeof window.getSpellById === 'function') ? window.getSpellById(id) : null;
  const colourOf = (sp) => {
    const cat = pbColourCat(sp);
    return { cat, nc: cat ? (TREE_CAT_C[cat] || TREE_CAT_C.utility) : EW.time, glyph: cat ? pbCatGlyph(sp, cat) : '' };
  };
  const FAM = window.SPELL_FAMILIES || {};
  const famLook = (id) => { const f = ctx.famOf(id); const d = FAM[f] || {}; return { f, name: d.name || 'Unsorted', glyph: d.glyph || '◇', color: d.color || '#8a8270' }; };
  const eq = ctx.equipped;
  const spLeft = ctx.spMax - ctx.spUsed;
  const upN = (id) => (ctx.ups && ctx.ups[id]) ? ctx.ups[id].length : 0;
  const upSpOf = (id) => (upN(id) && typeof window.spellUpgradesSpOf === 'function') ? window.spellUpgradesSpOf(ctx.ups, id) : 0;
  /* one spell card: the category disc · the name · its SP · one meta line (MP, range, AOE, power) or why it can't go on */
  const card = (id, prevCost) => {
    const sp = spellOf(id);
    const cost = pbSpCost(id);
    const st8 = pbSpellState(ctx, id);
    const { nc, glyph } = colourOf(sp);
    const src = ctx.sourceOf[id] || 'race';
    const isPas = !!(sp && sp.kind === 'passive');
    const on = st8 === 'equipped';
    const always = st8 === 'always';   // lit like an equipped card; a click only selects it (its info + preview)
    // the card's own refusal (SP, sealed); a full loadout is said ONCE, in the tech bar
    const why = st8 === 'sp' ? 'ONLY ' + spLeft + ' SP LEFT' : st8 === 'sealed' ? 'SEALED IN THIS MODE' : null;
    const whyAll = st8 === 'slots' ? 'all ' + ctx.cap + ' slots are full' : null;
    const meta = pbNodeMeta(sp).slice(0, 3);
    const bf = src === 'borrowRace' ? famLook(id) : null;   // a borrowed card names the family it came from
    const n = upN(id);
    const price = cost + upSpOf(id);
    return h('div', {
      key: id, role: 'button', tabIndex: -1,
      className: 'pb-sc is-' + (always ? 'equipped is-always' : st8) + (isPas ? ' pas' : '') + (selKey === id ? ' sel' : '') + (hoverKey === id ? ' hov' : '') + (prevCost != null && cost !== prevCost ? ' step' : '') + ' src-' + src,
      style: { '--nc': nc, animation: shakeKey === id ? 'ewTreeShake 0.3s linear' : undefined },
      /* an equipped card that isn't the selected one only selects it (its info + upgrades show, 2026-10-06 mondo);
         a second click on the selected card takes it off */
      onClick: () => { const wasSel = selKey === id; if (onSelect) onSelect(id); if (always) return; if (!on || wasSel) onSpellClick(id); },
      onMouseEnter: (e) => onNodeHoverIn(id, sp, e),
      onMouseLeave: () => onNodeHoverOut(id),
      title: always ? (sp ? sp.name : id) + ' · always known · no slot, no SP' : (sp ? sp.name : id) + ' · ' + cost + ' SP' + (on ? (selKey === id ? ' · equipped · click again to remove' : ' · equipped · click to view') : why ? ' · ' + why.toLowerCase() : whyAll ? ' · ' + whyAll : ' · click to equip'),
    },
      h('span', { className: 'pb-sc-disc' }, st8 === 'sealed' ? '🔒' : isPas ? (sp.icon || '◈') : glyph),
      h('span', { className: 'pb-sc-text' },
        h('span', { className: 'pb-sc-name' }, sp ? sp.name : id),
        /* the cost leads the line under the name (gold; filled when equipped, with its upgrades' SP and ⚙ n), then the
           numbers (MP, range, AOE, power) or why it can't go on */
        h('span', { className: 'pb-sc-meta' },
          always ? h('b', { className: 'pb-sc-cost on', title: 'Always known — no slot, no SP' }, 'ALWAYS') :
          h('b', { className: 'pb-sc-cost' + (on ? ' on' : ''), title: on && n ? cost + ' SP + ' + (price - cost) + ' SP of upgrades' : cost + ' SP' },
            String(on ? price : cost), h('small', null, ' SP'), on && n ? h('i', null, ' ⚙' + n) : null),
          why ? h('i', { className: 'pb-sc-why' }, why) : null,
          ...(why ? [] : [
            bf ? h('em', { key: 'bf', style: { color: bf.color } }, bf.glyph + ' ' + bf.name) : null,
            src === 'wheel' ? h('em', { key: 'wh' }, 'DOOR WHEEL') : null,
            ...meta.map(([tx, c], i) => h('em', { key: i, style: c ? { color: c } : undefined }, tx))]))));
  };
  /* THE LOADOUT — seven slot cards in pick order + ALWAYS READY in the eighth cell. A slot card shows the category disc, the
     whole name, its family and its SP; its ✕ takes it off; a click on it selects it (its info + upgrades), a second click on
     the selected one takes it off; its ⚙ opens the upgrades. */
  const loadout = h('div', { className: 'pb-loadout', 'aria-label': 'Equipped spells' },
    ...Array.from({ length: ctx.cap }).map((_, i) => {
      const id = eq[i];
      if (!id) return h('div', { key: 'e' + i, className: 'pb-ls empty' }, h('i', null, String(i + 1)), h('small', null, 'EMPTY'));
      const sp = spellOf(id);
      const cost = pbSpCost(id) + upSpOf(id);
      const { nc, glyph } = colourOf(sp);
      const fl = famLook(id);
      const canUp = typeof window.spellAllowedUpgrades === 'function' && window.spellAllowedUpgrades(id).length;
      return h('div', { key: id, className: 'pb-ls' + (selKey === id ? ' sel' : '') + (hoverKey === id ? ' hov' : '') + ((sp && sp.kind === 'passive') ? ' pas' : ''), style: { '--nc': nc, '--fam': fl.color },
        onClick: () => { if (selKey === id) onUnequipSlot(id); else if (onSelect) onSelect(id); },
        onMouseEnter: (e) => onNodeHoverIn(id, sp, e), onMouseLeave: () => onNodeHoverOut(id),
        title: (sp ? sp.name : id) + ' · ' + fl.name + ' · ' + cost + ' SP' + (selKey === id ? ' · click again to remove' : ' · click to view') },
        h('span', { className: 'pb-ls-disc' }, (sp && sp.kind === 'passive') ? (sp.icon || '◈') : glyph),
        h('span', { className: 'pb-ls-text' },
          h('span', { className: 'pb-ls-name' }, sp ? sp.name : id),
          h('span', { className: 'pb-ls-fam' }, h('b', { className: 'pb-ls-cost' }, cost + ' SP'), fl.glyph + ' ' + fl.name)),
        canUp
          ? h('button', { className: 'pb-ls-up' + (upN(id) ? ' on' : ''), type: 'button',
              title: 'Upgrades — ' + upN(id) + ' of ' + (window.SPELL_UPGRADE_MAX || 2) + ' on',
              onClick: (e) => { e.stopPropagation(); if (onSelect) onSelect(id); if (onUpgradeOpen) onUpgradeOpen(id); } },
              '⚙' + (upN(id) || ''))
          : null,
        h('span', { className: 'pb-ls-x', role: 'button', title: 'Remove',
          onClick: (e) => { e.stopPropagation(); if (onSelect) onSelect(id); onUnequipSlot(id); } }, '✕'));
    }),
    h('div', { key: 'ready', className: 'pb-ls-ready', title: 'Always ready — no slot, no SP' },
      finisher ? (() => {
        const ft = String(finisher.type || 'anomaly').toLowerCase();
        return h('div', { key: 'fin', className: 'pb-ls-mini pb-ls-fin is-finisher' + (selKey === PB_FIN_KEY ? ' sel' : '') + (hoverKey === PB_FIN_KEY ? ' hov' : ''),
          style: { '--fam': TYPE_C[ft] || EW.time }, 'data-finisher': finisher.id || '',
          onClick: () => { if (onSelect) onSelect(PB_FIN_KEY); },
          onMouseEnter: (e) => onNodeHoverIn(PB_FIN_KEY, null, e), onMouseLeave: () => onNodeHoverOut(PB_FIN_KEY),
          title: '☠ THE FINISHER · ' + finisher.name + ' — ' + (finisher.tagline || '') + ' · full gauge + 1 AP' },
          h('i', null, finisher.glyph || '☠'), h('span', null, finisher.name));
      })() : null,
      h('div', { key: 'root', className: 'pb-ls-mini pb-ls-root' + (selKey === 'root' ? ' sel' : '') + (hoverKey === 'root' ? ' hov' : ''), style: { '--fam': '#e6e9f2' },
        onClick: () => { if (onSelect) onSelect('root'); },
        onMouseEnter: (e) => onNodeHoverIn('root', null, e), onMouseLeave: () => onNodeHoverOut('root'),
        title: 'Basic Attack — always equipped, free' },
        h('i', null, '⚔'), h('span', null, 'Basic Attack'))));
  /* THE COLUMNS — one per family: its head (glyph · name · n on), then every card cheapest first */
  const cols = pbRackCols(ctx);
  const column = (t) => {
    let prev = null;
    const cards = t.ids.map(id => { const c = card(id, prev); prev = pbSpCost(id); return c; });
    if (t.kind === 'borrow') {
      cards.push(h('div', { key: 'B0', role: 'button', className: 'pb-sc pb-sc-browse' + (selKey === 'B0' ? ' sel' : ''),
        onClick: () => { if (onSelect) onSelect('B0'); onBorrow('B0'); },
        onMouseEnter: (e) => onNodeHoverIn('B0', null, e), onMouseLeave: () => onNodeHoverOut('B0'),
        title: 'Browse the families other races carry' },
        h('span', { className: 'pb-sc-disc' }, '＋'),
        h('span', { className: 'pb-sc-text' }, h('span', { className: 'pb-sc-name' }, 'Browse other families'),
          h('span', { className: 'pb-sc-meta' }, h('em', null, ctx.borrowCount + ' SPELLS')))));
    }
    const kindTag = t.kind === 'training' || t.kind === 'gear' ? 'PASSIVES' : t.kind === 'borrow' ? 'ADAPTABLE' : t.kind === 'inherent' ? 'ALWAYS KNOWN' : null;
    return h('section', { key: t.key, className: 'pb-famcol k-' + t.kind + (t.on ? ' has' : ''), 'data-family': t.fam || t.kind, style: { '--fam': t.color } },
      h('header', { className: 'pb-famcol-head', title: t.name + (t.desc ? ' — ' + t.desc : '') },
        h('i', null, t.glyph),
        h('span', { className: 'pb-famcol-name' }, t.name, kindTag ? h('small', null, kindTag) : null),
        h('em', null, t.kind === 'borrow' ? (t.on || 0) : (t.on || 0) + '/' + t.ids.length)),
      h('div', { className: 'pb-famcol-list' }, ...cards));
  };
  return h('div', { className: 'pb-circuit pb-rack pb-rack-cols' },
    h('div', { className: 'pb-rack-head' }, loadout),
    h('div', { className: 'pb-famcols', style: { '--cols': cols.length } }, ...cols.map(column)));
}

/* ══ THE TECHNIQUE PANEL (plan §5.2 item 3) — under the rack: a category
   disc · `TIER II · 2 SP · DAMAGE · RACE` · the name · the desc · the chip
   row (AP / MP / RNG / AOE / PWR / SP / status effects) · the verb pill.
   Follows `techHover || techSel`. Module-level so it never remounts per
   render. `info` = pbTechInfo(...) below. ══ */
function pbTechInfo(ctx, key, finisher) {
  if (!ctx || !key) return null;
  if (key === PB_FIN_KEY) return pbFinisherInfo(key, finisher);
  if (key === 'root') return { key, st8: 'root', id: null, sp: null, tier: 0, cost: 0, verdict: null, source: null };
  if (PB_BORROW_RE.test(key)) {
    const t = +key.slice(1);   // 0 = every tier (the whole window)
    return { key, st8: 'borrow', id: null, sp: null, tier: t, cost: t, verdict: null, source: null,
      count: t ? ctx.parts.borrowRace.filter(id => pbTierOf(id) === t).length : ctx.borrowCount };
  }
  const sp = typeof window.getSpellById === 'function' ? window.getSpellById(key) : null;
  if (!sp) return null;
  const t = pbTierOf(key);
  /* THE UPGRADES (Phase 5): the equipped spell's upgrades, its DERIVED def (what the board will use — the chips read it),
     their SP, and every allowed upgrade's row for the toggles */
  const ups = (ctx.ups && ctx.ups[key]) || [];
  const spD = (ups.length && typeof window.resolveSpellDef === 'function') ? window.resolveSpellDef(sp, ups) : sp;
  const upSp = ups.length && typeof window.spellUpgradesSpOf === 'function' ? window.spellUpgradesSpOf(ctx.ups, key) : 0;
  const fam = ctx.famOf ? ctx.famOf(key) : '';
  const famDef = (fam && window.SPELL_FAMILIES && window.SPELL_FAMILIES[fam]) || null;
  return { key, st8: pbSpellState(ctx, key), id: key, sp, spD, ups, upSp, upgrades: pbUpgradeRows(ctx, key), tier: t, cost: pbSpCost(key), verdict: pbSpellVerdict(ctx, key), source: ctx.sourceOf[key] || null,
    fam: famDef ? { id: fam, name: famDef.name || fam, glyph: famDef.glyph || '◇', color: famDef.color || '#8a8270' } : null };
}
function pbFinisherInfo(key, fin) {
  return { key, st8: 'finisher', id: null, sp: null, fin: fin || null, tier: 0, cost: 0, verdict: null, source: null };
}
function TechniquePanel({ info, clsName, raceLabel, fc, onVerb, onPreview, previewLabel, previewOff, previewing, used, slotCap, spUsed, spMax, onUpgrade }) {
  if (info && info.st8 === 'finisher') return h(FinisherPanel, { info, raceLabel, onPreview, previewOff, previewing, used, slotCap, spUsed, spMax });
  const budget = used + ' / ' + slotCap + ' SLOTS · ' + spUsed + ' / ' + spMax + ' SP';
  if (!info) {
    return h('div', { className: 'pb-technique empty' },
      h('div', { className: 'pb-technique-disc', style: { borderColor: 'rgba(255,255,255,0.18)', color: EW.inkDim } }, '◯'),
      h('div', { className: 'pb-technique-main' },
        h('div', { className: 'pb-technique-kicker' }, budget),
        h('div', { className: 'pb-technique-name', style: { color: EW.inkMute } }, 'Hover a spell to read it'),
        h('ul', { className: 'pb-technique-how' },
          h('li', null, h('b', null, 'Click'), ' a spell to equip it. Click it again, or its slot up top, to take it off.'),
          h('li', null, 'The number on each spell is its cost. You have ', h('b', null, spMax + ' SP'), ' and ', h('b', null, slotCap + ' slots'), ' to spend.'),
          h('li', null, h('b', null, 'Passives'), ' (Training and Gear) have no cap: a slot and their SP each.'),
          h('li', null, 'Equipped spells and passives with ', h('b', null, '⚙'), ' can be upgraded here once selected (a passive takes +1, then +2).')),
        h('div', { className: 'pb-technique-keys' }, h('kbd', null, '↑↓←→'), ' walk ', h('kbd', null, 'ENTER'), ' equip / remove ', h('kbd', null, '⌫'), ' remove ', h('kbd', null, 'SPACE'), ' preview')));
  }
  const { st8, key } = info;
  const sp = info.spD || info.sp;   // THE UPGRADES (Phase 5): an upgraded spell's numbers are its derived def's
  const cat = pbColourCat(sp);
  const nc = cat ? (TREE_CAT_C[cat] || TREE_CAT_C.utility) : (st8 === 'root' ? '#e6e9f2' : EW.time);
  const glyph = cat ? pbCatGlyph(sp, cat) : (st8 === 'root' ? '⚔' : st8 === 'borrow' ? '＋' : '◯');
  // the family names the card's home (THE FAMILY TABS, 2026-09-27); a borrowed / universal row adds where it came from
  const srcTxt = info.source && info.source !== 'race' ? PB_SOURCE_LABEL[info.source] : null;
  const kicker = st8 === 'root' ? 'ALWAYS EQUIPPED · NO SLOT · 0 SP'
    : st8 === 'always' ? [info.fam ? info.fam.glyph + ' ' + info.fam.name.toUpperCase() : null, 'ALWAYS KNOWN · NO SLOT · 0 SP', cat ? spellCategoryLabel(cat).toUpperCase() : null].filter(Boolean).join(' · ')
    : st8 === 'borrow' ? 'ADAPTABLE · BORROW FROM OTHER FAMILIES'
    : [info.fam ? info.fam.glyph + ' ' + info.fam.name.toUpperCase() : null, info.cost + ' SP' + (info.upSp ? ' + ' + info.upSp + ' ⚙' : ''), cat ? spellCategoryLabel(cat).toUpperCase() : null, srcTxt,
       st8 === 'equipped' ? 'EQUIPPED' : null].filter(Boolean).join(' · ');
  const name = st8 === 'root' ? 'Basic Attack' : st8 === 'borrow' ? 'Borrow · any family' : (sp ? sp.name : '—');
  const desc = st8 === 'root' ? 'The vessel\'s plain strike — melee or ranged by reach. Every loadout carries it, free.'
    : st8 === 'borrow' ? 'Adaptable is equipped: this unit may take spells from the families other races carry. ' + info.count + ' spells to pick from, family by family.'
    : (sp ? (sp.desc || spellCategoryLabel(cat)) : '');
  const chips = [];
  if (sp) {
    const pw = pbPowerStat(sp);
    const aoe = pbAoeLabel(sp);
    if (sp.apCost != null) chips.push(['AP ' + sp.apCost, EW.ink]);
    if (sp.cost) chips.push(['MP ' + sp.cost, '#6fc3ff']);
    if (sp.chessPiece) chips.push([PB_CHESS_REACH[sp.chessPiece] || 'PATTERN', EW.ink]);
    else if (sp.range != null) chips.push([sp.range === 0 ? 'SELF' : 'RNG ' + sp.range, EW.ink]);
    if (aoe) chips.push(['AOE ' + aoe, EW.ink]);
    if (pw) chips.push([pw.value + ' ' + pw.unit, pw.color]);
  }
  const effects = sp ? pbSpellEffects(sp) : [];
  let verb = null, verbCls = '', verbTitle = '';
  if (st8 === 'equipped') { verb = 'REMOVE · +' + (info.cost + (info.upSp || 0)) + ' SP BACK'; verbCls = 'danger'; verbTitle = 'Remove it — only it (its upgrades go with it)'; }
  else if (st8 === 'ok') { verb = 'EQUIP · ' + info.cost + ' SP'; verbCls = 'primary'; verbTitle = 'Equip this technique'; }
  else if (st8 === 'sp') { verb = 'NEEDS ' + info.cost + ' SP · ' + (spMax - spUsed) + ' LEFT'; verbCls = 'off'; verbTitle = 'Unequip something to free SP'; }
  else if (st8 === 'slots') { verb = 'NO SLOT · ' + used + '/' + slotCap; verbCls = 'off'; verbTitle = 'All seven slots are full — unequip something first'; }
  else if (st8 === 'sealed') { verb = 'SEALED — CLASH RULES'; verbCls = 'off'; verbTitle = 'Not allowed in this mode'; }
  else if (st8 === 'borrow') { verb = '＋ BROWSE THE FAMILIES'; verbCls = 'gold'; verbTitle = 'Open the pool'; }
  const canPreview = st8 !== 'borrow';
  /* ⚙ THE UPGRADES (SPELL_LIBRARY_PLAN.md §6.3, Phase 5): the spell's allowed upgrades as toggles — each its own SP price,
     at most 2 per spell, one of a kind per group; the refusal is data.js spellUpgradeVerdict's words. Off until equipped. */
  const upRows = (sp && info.upgrades) ? info.upgrades : [];
  const upMax = window.SPELL_UPGRADE_MAX || 2;
  const upBox = upRows.length ? h('div', { className: 'pb-upgrades' + (st8 === 'equipped' ? '' : ' off') },
    h('div', { className: 'pb-upgrades-head' },
      h('b', null, '⚙ UPGRADES'),
      h('span', null, st8 === 'equipped' ? ((info.ups || []).length + ' / ' + upMax + ' ON' + (info.upSp ? ' · +' + info.upSp + ' SP' : '')) : 'EQUIP IT TO UPGRADE')),
    h('div', { className: 'pb-upgrades-list' },
      ...upRows.map(u => {
        const on = u.st8 === 'on', ok = u.st8 === 'ok';
        const spC = typeof window.spellUpgradeSp === 'function' ? window.spellUpgradeSp(u.id) : (u.row.sp || 1);
        return h('button', { key: u.id, type: 'button', className: 'pb-up' + (on ? ' on' : ok ? '' : ' no'),
          disabled: st8 !== 'equipped' || (!on && !ok), title: (u.row.desc || '') + ' — ' + u.note,
          onClick: () => onUpgrade && onUpgrade(key, u.id) },
          h('i', null, u.row.glyph || '⚙'),
          h('b', null, u.row.name || u.id),
          h('em', null, (on ? '✓ ' : '+') + spC + ' SP'),
          h('small', null, on || ok ? (u.row.desc || '') : u.note));
      }))) : null;
  return h('div', { className: 'pb-technique', style: { '--tc': nc, '--fam': info.fam ? info.fam.color : nc } },
    h('div', { className: 'pb-technique-disc', style: { borderColor: nc, color: st8 === 'equipped' || st8 === 'root' ? TREE_NODE_BG : nc, background: (st8 === 'equipped' || st8 === 'root') ? nc : 'transparent' } }, glyph),
    h('div', { className: 'pb-technique-main' },
      h('div', { className: 'pb-technique-kicker' }, kicker),
      h('div', { className: 'pb-technique-name' }, name),
      /* why it can't go on, right under the name (PvP playtest 10-24: a passive clicked with 7/7 slots full "does nothing,
         no message" — the bar's red note lasts 1.6 s and the NO SLOT verb sits below the fold of this panel) */
      verbCls === 'off' && verb ? h('div', { className: 'pb-tree-note', style: { maxWidth: '100%', alignSelf: 'flex-start', whiteSpace: 'normal', borderRadius: 6, animation: 'none' } }, verb + ' · ' + verbTitle.toUpperCase()) : null,
      sp ? h('div', { className: 'pb-technique-badges' }, ...pbSpellBadges(sp, 8), pbAoeTiles(sp, true)) : null,
      h('div', { className: 'pb-technique-desc' }, desc),
      (chips.length || effects.length) ? h('div', { className: 'pb-technique-chips' },
        ...chips.map(([t, c], i) => h('span', { key: 'c' + i, className: 'pb-technique-chip', style: { color: c } }, t)),
        ...effects.map((ef, i) => h('span', { key: 'e' + i, className: 'pb-technique-chip fx', style: { color: ef.color || EW.inkMute, borderColor: (ef.color || EW.inkMute) + '66' }, title: ef.txt }, ef.txt))) : null,
      upBox,
      h('div', { className: 'pb-technique-verbs' },
        verb ? h('button', { className: 'pb-verb ' + verbCls, disabled: verbCls === 'off', onClick: () => onVerb && onVerb(info), title: verbTitle }, verb) : h('span', { className: 'pb-verb-note' }, st8 === 'root' ? 'ALWAYS EQUIPPED' : st8 === 'always' ? 'ALWAYS KNOWN' : ''),
        canPreview ? h('button', { className: 'pb-verb ghost' + (previewing ? ' live' : ''), onClick: () => onPreview && onPreview(info), disabled: !!previewOff, title: previewOff ? 'Preview off' : 'Play the cast on the stage (SPACE)' }, previewOff ? '▶ PREVIEW OFF' : (previewing ? '■ PLAYING' : '▶ PREVIEW')) : null,
        h('span', { className: 'pb-technique-slots' }, budget))));
}
/* THE FINISHER's panel (2026-09-19): the race's execution — the type, the
   name, the tagline, the brief, the price (the whole gauge + 1 AP), the
   reach (any enemy the team can see), the slice (~3× the strike's, typed by
   the chart, STAB) — and ▶ PREVIEW plays it on the stage. A designed row
   says so: the typed execution plays until its own is built. */
function FinisherPanel({ info, raceLabel, onPreview, previewOff, previewing, used, slotCap, spUsed, spMax }) {
  const fin = info.fin;
  if (!fin) return h('div', { className: 'pb-technique empty' }, h('div', { className: 'pb-technique-main' }, h('div', { className: 'pb-technique-kicker' }, 'THE FINISHER'), h('div', { className: 'pb-technique-name', style: { color: EW.inkMute } }, 'No execution on file')));
  const t = String(fin.type || 'anomaly').toLowerCase();
  const nc = TYPE_C[t] || EW.time;
  const R = window.FINISHER_RULES || {};
  const chips = [['AP ' + (R.apCost != null ? R.apCost : 1), EW.ink], ['⚛ FULL GAUGE', nc], ['RNG · SIGHT', EW.ink], ['≈3× STRIKE SLICE', '#ff6b6b'], ['STAB', nc]];
  return h('div', { className: 'pb-technique pb-technique-fin', style: { '--tc': nc } },
    h('div', { className: 'pb-technique-disc', style: { borderColor: nc, color: TREE_NODE_BG, background: nc } }, fin.glyph || '☠'),
    h('div', { className: 'pb-technique-main' },
      h('div', { className: 'pb-technique-kicker' }, ['☠ FINISHER', 'THE GAUGE\u2019S OTHER VERB', (raceLabel || '').toUpperCase(), fin.built ? 'BESPOKE' : 'TYPED EXECUTION'].filter(Boolean).join(' · ')),
      h('div', { className: 'pb-technique-name' }, fin.name),
      h('div', { className: 'pb-technique-badges' }, h('span', { className: 'pb-badge', style: pbTypeBadgeStyle(t, 10) }, t.toUpperCase())),
      fin.tagline ? h('div', { className: 'pb-technique-tagline', style: { color: nc } }, fin.tagline) : null,
      h('div', { className: 'pb-technique-desc' }, fin.desc || ''),
      fin.built ? null : h('div', { className: 'pb-technique-desc typed-note' }, 'DESIGNED · until its own is built this race plays the ' + t.toUpperCase() + '-type execution.'),
      h('div', { className: 'pb-technique-chips' },
        ...chips.map(([txt, c], i) => h('span', { key: 'c' + i, className: 'pb-technique-chip', style: { color: c } }, txt))),
      h('div', { className: 'pb-technique-verbs' },
        h('span', { className: 'pb-verb-note' }, 'ALWAYS READY · A FULL GAUGE BUYS IT OR THE ENTROPY STRIKE'),
        h('button', { className: 'pb-verb ghost' + (previewing ? ' live' : ''), onClick: () => onPreview && onPreview(info), disabled: !!previewOff, title: previewOff ? 'Preview off' : 'Play the execution on the stage (SPACE)' }, previewOff ? '▶ PREVIEW OFF' : (previewing ? '■ PLAYING' : '▶ PREVIEW')),
        h('span', { className: 'pb-technique-slots' }, used + ' / ' + slotCap + ' SLOTS · ' + (spUsed || 0) + ' / ' + (spMax || 16) + ' SP'))));
}
// ── Race traits: passives & terrain rules shown on the hero sheet ──
// Entries marked CODED are live engine rules (map.js adaptation fns,
// SKY_RACES flight, sleepPreference day/night swing, werewolf model swap,
// deep-water/lava move+drown rules in state.js/battle.js). The rest are
// DESIGN-intent passives authored 2026-07-06 to give each starter race a
// distinct playstyle — surface them here first, wire them into battle.js
// as they're implemented. Only default-unlocked (3D-ready) races listed.
const RACE_TRAITS = {
  'homosapien': [
    { icon: '🎓', name: 'Quick Study', desc: 'Picks up new techniques faster than other vessels.' },                     // DESIGN
    { icon: '💪', name: 'Underdog', desc: 'Deals +10% damage to vessels with higher max HP.' },                       // DESIGN
  ],
  'giant': [
    { icon: '⛰️', name: 'Mountain Traverser', desc: 'Mountains cost only 1 MOV to climb.' },                          // CODED
    { icon: '🧊', name: 'Sure-Footed', desc: 'Never slips on ice.' },                                                 // CODED
    { icon: '🗿', name: 'Colossal Frame', desc: 'Too massive to be knocked back or pulled.' },                        // DESIGN
  ],
  'fairy': [
    { icon: '🪽', name: 'Flight', desc: 'Airborne — crosses chasms, lava and deep water unharmed. Grounded below 25% HP.' },  // CODED
    { icon: '✨', name: 'Pixie Dust Trail', desc: 'Sheds glowing dust where she moves — allies who step on a mote recover HP and MP.' }, // CODED (PASSIVE_DEFS fairyDustTrail overlays this row)
    { icon: '☀️', name: 'Daywalker', desc: 'Stronger in daylight; weakened at night.' },                              // CODED
    { icon: '🌲', name: 'Forest Spirit', desc: 'Moves through trees at full speed.' },                                // CODED
  ],
  'werewolf': [
    // Lycanthropy + Bloodcraze overlay from PASSIVE_DEFS (Phase 3, 2026-09-07);
    // the old Lunar Shift / Nocturnal rows folded into Lycanthropy.
    { icon: '🌲', name: 'Forest Adapted', desc: 'Moves through trees at full speed.' },                               // CODED
  ],
  'grey': [
    { icon: '🌙', name: 'Nocturnal', desc: '+ATK/DEF/M ATK at night; penalized in daylight.' },                         // CODED
    { icon: '🧠', name: 'Telepathic Network', desc: 'Allies gain +1 VISION while a Grey is on the field.' },             // DESIGN
  ],
  'telepath': [
    { icon: '🪽', name: 'Levitation', desc: 'Airborne — floats over hazards and rough ground. Grounded below 25% HP.' },  // CODED
    { icon: '🌙', name: 'Nocturnal', desc: '+ATK/DEF/M ATK at night; penalized in daylight.' },                         // CODED
    { icon: '🧠', name: 'Unquiet Mind', desc: 'A mind already crowded with voices — immune to Charm and Siren Song.' }, // CODED (PASSIVE_DEFS)
  ],
  'vampire': [
    { icon: '🪽', name: 'Flight', desc: 'Airborne — crosses chasms, lava and deep water unharmed. Grounded below 25% HP.' },  // CODED
    { icon: '🩸', name: 'Hemophage', desc: 'Basic attacks drink deep — restores 25% of the damage dealt as HP.' },    // CODED (PASSIVE_DEFS)
    { icon: '🌙', name: 'Creature of the Night', desc: 'Stronger at night; weakened at high noon.' },                 // DESIGN
  ],
  'demon': [
    { icon: '🪽', name: 'Flight', desc: 'Airborne — crosses chasms, lava and deep water unharmed. Grounded below 25% HP.' },  // CODED
    { icon: '🌋', name: 'Lava-Born', desc: 'Immune to lava — strides through it at full speed.' },                    // CODED
    { icon: '🔥', name: 'Hellfire Affinity', desc: 'Burns it inflicts last 1 turn longer.' },                         // DESIGN
  ],
  'annunaki': [
    { icon: '🪽', name: 'Flight', desc: 'Airborne — crosses chasms, lava and deep water unharmed. Grounded below 25% HP.' },  // CODED
    { icon: '👁️', name: 'Ancient Sight', desc: '+1 vision range; sees over elevation.' },                             // DESIGN
  ],
  'atlantean': [
    { icon: '🌊', name: 'Amphibious', desc: 'Cannot drown; deep water costs only 1 MOV.' },                           // CODED
    { icon: '🔱', name: 'Tide Empowered', desc: '+1 spell range while standing in water.' },                          // DESIGN
  ],
  'pirate': [
    { icon: '⚓', name: 'Old Salt', desc: 'Cannot drown; deep water costs only 1 MOV.' },                             // CODED (Raider class)
    { icon: '💰', name: 'Plunder', desc: 'Earns extra Hazard Pay from kills.' },                                            // DESIGN
  ],
  'bigfoot': [
    // Cryptid overlays from PASSIVE_DEFS (Phase 3) — it replaced the Elusive design row.
    { icon: '🌲', name: 'Forest Adapted', desc: 'Moves through trees at full speed.' },                               // CODED
    { icon: '☀️', name: 'Daywalker', desc: 'Stronger in daylight; weakened at night.' },                              // CODED
  ],
  'catgirl': [
    { icon: '🌲', name: 'Forest Adapted', desc: 'Moves through trees at full speed.' },                               // CODED
    { icon: '🐾', name: 'Featherfall', desc: 'Never takes fall damage — always lands on her feet.' },                 // DESIGN
    { icon: '👁️', name: 'Night Vision', desc: 'Vision is not reduced at night.' },                                    // DESIGN
  ],
  'knight': [
    { icon: '🛡️', name: 'Man-at-Arms', desc: 'Heavy plate and drilled footing — immune to Stagger.' },                // CODED (PASSIVE_DEFS)
    { icon: '⚜️', name: 'Oath of the Shield', desc: 'Adjacent allies take 10% less damage.' },                        // DESIGN
  ],
  'shaman': [
    { icon: '☀️', name: 'Daywalker', desc: 'Stronger in daylight; weakened at night.' },                              // CODED
    { icon: '🌿', name: 'Herbalist', desc: 'Potions she uses or receives heal +25%.' },                               // DESIGN
    { icon: '👻', name: 'Spirit Sight', desc: 'Sees invisible units.' },                                              // DESIGN
  ],
  'mad scientist': [
    { icon: '🔧', name: 'Overclocked Contraptions', desc: 'Deployed turrets gain +50% HP.' },                         // DESIGN
    { icon: '⚗️', name: 'Volatile Mixtures', desc: 'Thrown items splash to adjacent tiles.' },                        // DESIGN
  ],
  'necromancer': [
    { icon: '💀', name: 'Deathfeed', desc: 'Magic attack swells with every unit currently dead on the field (+8 M ATK per corpse, both sides) — all magic spell power grows with the body count.' }, // CODED
  ],
  'men in black': [
    { icon: '🕶️', name: 'Redacted', desc: 'Cannot be scanned or revealed.' },                                         // DESIGN
    { icon: '🌐', name: 'Clearance', desc: 'Ignores enemy ward vision — wards do not see him.' },                     // DESIGN
  ],
  'wizard': [
    { icon: '📚', name: 'Arcane Reserves', desc: 'Regenerates +5 MP every round.' },                                  // DESIGN
    { icon: '🔮', name: 'Tier Mastery', desc: 'Tier III spells cost 10 less MP.' },                                   // DESIGN
  ],
  'fortune teller': [
    { icon: '🃏', name: 'Foresight', desc: 'Cannot be critically hit — she saw it coming.' },                         // DESIGN
    { icon: '🌙', name: 'Moonlit Augury', desc: 'Spells cost 5 less MP at night.' },                                  // DESIGN
  ],
  'quarterback': [
    { icon: '🏈', name: 'Cannon Arm', desc: 'Thrown items fly 2 tiles further.' },                                    // DESIGN
    { icon: '🏃', name: 'Blitz', desc: '+1 MOV during the first round.' },                                            // DESIGN
  ],
  'ki fighter': [
    { icon: '🔥', name: 'Inner Furnace', desc: 'Regains 5 MP whenever she takes a hit.' },                            // DESIGN
    { icon: '🧘', name: 'Centered', desc: 'Immune to knockback until she moves each turn.' },                         // DESIGN
  ],
  'gangster': [
    { icon: '🔪', name: 'Shank', desc: 'Opportunity attacks always land and deal ×1.5.' },                             // CODED (PASSIVE_DEFS)
  ],
  'priest': [   // the Nun's Devout, the merged race's since 2026-10-27
    { icon: '🙏', name: 'Devout', desc: 'Heals this unit casts restore 20% more.' },                                        // CODED (PASSIVE_DEFS)
  ],
  'police officer': [
    { icon: '🔫', name: 'Point Blank', desc: 'Basic attacks from 2 tiles or closer hit ×1.3.' },                       // CODED (PASSIVE_DEFS)
  ],
  'jellyfish': [
    { icon: '🪽', name: 'Flight', desc: 'Airborne — crosses chasms, lava and deep water unharmed. Grounded below 25% HP.' },   // CODED
    { icon: '🔥', name: 'Thermal Regen', desc: 'Fire feeds it: fire damage heals instead of harming, Burn never takes hold, and a lava bath knits its wounds.' },   // CODED (PASSIVE_DEFS)
  ],
  'cult leader': [
    { icon: '🕯️', name: 'Unquiet Mind', desc: 'A mind already crowded with voices — immune to Charm.' },               // CODED (PASSIVE_DEFS)
  ],
  'popstar': [
    { icon: '🎤', name: 'The Show Must Go On', desc: 'Nobody cuts her mic — immune to Silence.' },                     // CODED (PASSIVE_DEFS)
  ],
  'starfish': [
    { icon: '⭐', name: 'Regrowth', desc: 'Grows back whatever it loses — immune to Grievous Wounds.' },   // CODED (PASSIVE_DEFS)
  ],
  'ringmaster': [
    { icon: '🎩', name: 'Showman', desc: 'The voice carries to the back row — immune to Silence.' },   // CODED (PASSIVE_DEFS)
  ],
  'bee queen': [
    { icon: '🐝', name: 'Royal Jelly', desc: 'Fed on royal jelly since the egg — immune to Poison.' },   // CODED (PASSIVE_DEFS)
  ],
  'professor': [
    { icon: '📚', name: 'Tenured', desc: 'Cannot be fired, cannot be rattled — immune to Discord.' },   // CODED (PASSIVE_DEFS)
  ],
  'deep sea fish': [
    { icon: '🐟', name: 'Abyss Eyes', desc: 'Lives where no light reaches — immune to Blind.' },   // CODED (PASSIVE_DEFS)
  ],
  'clown': [
    { icon: '🤡', name: 'Painted Smile', desc: 'The smile is painted on — immune to Charm.' },   // CODED (PASSIVE_DEFS)
  ],
  'bunny girl': [
    { icon: '🐰', name: 'House Rules', desc: 'The house always wins — immune to Discord.' },   // CODED (PASSIVE_DEFS)
  ],
  'sharkman': [
    { icon: '🦈', name: 'Blood in the Water', desc: 'Never stops swimming — immune to Slow.' },   // CODED (PASSIVE_DEFS)
  ],
  'crystal guardian': [
    { icon: '💎', name: 'Faceted', desc: 'Cut from one crystal — immune to Stagger.' },   // CODED (PASSIVE_DEFS)
  ],
  'jack o lantern': [
    { icon: '🎃', name: 'Candlelit', desc: 'There is already a candle inside — immune to Burn.' },   // CODED (PASSIVE_DEFS)
  ],
  'sidekick': [
    { icon: '🦸', name: 'Wingman', desc: 'Always back on their feet for the hero — immune to Stun.' },   // CODED (PASSIVE_DEFS)
  ],
  'mushroom girl': [
    { icon: '🍄', name: 'Sporeborn', desc: 'Made of the stuff — immune to Poison.' },   // CODED (PASSIVE_DEFS)
  ],
  'tree person': [
    { icon: '🌳', name: 'Deep Roots', desc: 'Already rooted — immune to Root.' },   // CODED (PASSIVE_DEFS)
  ],
  'sheriff': [
    { icon: '⭐', name: 'Tin Star', desc: 'The law does not take bribes — immune to Charm.' },   // CODED (PASSIVE_DEFS)
  ],
  'astronaut': [
    { icon: '🧑‍🚀', name: 'Sealed Suit', desc: 'Breathes its own air — immune to Poison.' },   // CODED (PASSIVE_DEFS)
  ],
  'krampus': [
    { icon: '🔔', name: 'Alpine Hide', desc: 'A winter coat of goat hair — immune to Freeze.' },   // CODED (PASSIVE_DEFS)
  ],
  'rabbit': [
    { icon: '🐇', name: 'Quick Feet', desc: 'Always late, never slow — immune to Slow.' },   // CODED (PASSIVE_DEFS)
  ],
  'luchador': [
    { icon: '🤼', name: 'Iron Chin', desc: 'Took a chair to the head every night for years — immune to Stagger.' },   // CODED (PASSIVE_DEFS)
  ],
  'firefighter': [
    { icon: '🧯', name: 'Turnout Gear', desc: 'Fire-rated coat and helmet — immune to Burn.' },   // CODED (PASSIVE_DEFS)
  ],
  'goblin': [
    { icon: '👺', name: 'Cave Eyes', desc: 'Grew up in the dark — immune to Blind.' },   // CODED (PASSIVE_DEFS)
  ],
  'hippie': [
    { icon: '☮', name: 'Good Vibes', desc: 'Nothing can harsh this mellow — immune to Discord.' },   // CODED (PASSIVE_DEFS)
  ],
  'chef': [
    { icon: '🍳', name: 'Iron Stomach', desc: 'Tastes everything on the line — immune to Poison.' },   // CODED (PASSIVE_DEFS)
  ],
  'eagleman': [
    { icon: '🦅', name: 'Eagle-Eyed', desc: 'Sees a mouse move from a mile up — immune to Blind.' },   // CODED (PASSIVE_DEFS)
  ],
  'flesheater': [
    { icon: '🦷', name: 'Mindless Hunger', desc: 'Nothing in there to scare — immune to Fear.' },   // CODED (PASSIVE_DEFS)
  ],
  'mime': [
    { icon: '🤍', name: 'Not a Peep', desc: 'Never says a word anyway — immune to Silence.' },   // CODED (PASSIVE_DEFS)
  ],
  'mummy': [
    { icon: '⚱', name: 'Embalmed', desc: 'Nothing left in the veins to lose — immune to Bleed.' },   // CODED (PASSIVE_DEFS)
  ],
  'swamp monster': [
    { icon: '🌿', name: 'Bog Body', desc: 'Born in the muck and moves through it — immune to Slow.' },   // CODED (PASSIVE_DEFS)
  ],
  'undead': [
    { icon: '💀', name: 'Rotten Through', desc: 'Already rotting — immune to Poison.' },   // CODED (PASSIVE_DEFS)
  ],
  'chess piece': [
    { icon: '♟', name: 'The Pieces', desc: 'Its spells are Pawn, Knight, Bishop, Rook, Queen and King. Each one turns it into that piece and only takes an enemy in that piece\'s pattern; it starts as the pawn.' },   // CODED (data.js RACE_ABILITIES, the Chess family)
    { icon: '♞', name: 'Moves Like Its Piece', desc: 'Moves only the way the piece it is now moves: pawn 1 straight, knight an L, bishop diagonals, rook straight lines, queen both (any distance), king 1 any way. No Jump, no Climb.' },   // CODED (battle.js chessMoveTiles)
  ],
  'unicorn': [
    { icon: '🦄', name: 'Pure Horn', desc: 'The horn clears any poison — immune to Poison.' },   // CODED (PASSIVE_DEFS)
  ],
  'door agent': [
    { icon: '🗝️', name: 'Keyholder', desc: 'Once a turn, open or shut a friendly door beside you for free; your doors take 4 hits; friendly doors never harm you.' },   // CODED (PASSIVE_DEFS)
  ],
  'cowboy': [
    { icon: '🤠', name: 'Quickdraw', desc: 'Wins every speed tie — always acts first among equals.' },                // CODED (PASSIVE_DEFS)
    { icon: '🎯', name: 'Deadeye', desc: '+15% damage to targets at maximum range.' },                                // DESIGN
  ],
  'machine elves': [
    { icon: '🌀', name: 'Fractal Mind', desc: 'Self-similar at every scale — immune to Charm and Siren Song.' },      // CODED (PASSIVE_DEFS)
    { icon: '⚙️', name: 'Self-Assembling', desc: 'Repairs 3% of max HP every round.' },                               // DESIGN
  ],
  'martian': [
    { icon: '👽', name: 'Low-G Physique', desc: 'Jumps 1 tile higher.' },                                             // DESIGN
    { icon: '🔫', name: 'Ray Tech', desc: '+10% damage with beam and projectile spells.' },                           // DESIGN
  ],
  'nordic': [
    { icon: '🛸', name: 'Federation Envoy', desc: 'A Tall Blonde of the Galactic Federation — light-tech beams, stasis and psychic calm.' }, // LORE
    { icon: '🛡️', name: 'Serene Mind', desc: 'Federation discipline — immune to Charm and Siren Song.' },             // CODED (PASSIVE_DEFS)
  ],
  'halfdemon': [
    { icon: '😈', name: 'Dual Heritage', desc: 'Counts as both Human and Unholy in type matchups.' },                 // CODED (types)
    { icon: '🔥', name: 'Infernal Blood', desc: 'Burns on her end 1 turn sooner.' },                                  // DESIGN
  ],
  'ghost': [
    // Incorporeal (phasing + physical immunity) overlays from PASSIVE_DEFS (Phase 3).
    { icon: '☠️', name: 'Beyond Poison', desc: 'Immune to poison terrain.' },                                          // CODED (map.js)
  ],
  'kaiju': [
    { icon: '🔥', name: 'Thermal Regen', desc: 'Immune to Burn. Fire damage HEALS him — and a lava bath knits his wounds.' }, // CODED (PASSIVE_DEFS)
    { icon: '⛰️', name: 'Mountain Traverser', desc: 'Mountains cost only 1 MOV to climb.' },                           // CODED
  ],
};
/* Keep this display table honest: overlay the LIVE combat-passive registry
   (data.js PASSIVE_DEFS / RACE_PASSIVES) on top. A registry passive replaces
   a same-named hand-written row (so descs can never drift from the engine)
   and is prepended if the row was forgotten entirely. Terrain/lore rows
   (Mountain Traverser, Daywalker…) stay hand-authored. */
if (typeof window !== 'undefined' && window.RACE_PASSIVES && window.PASSIVE_DEFS) {
  for (const [race, ids] of Object.entries(window.RACE_PASSIVES)) {
    const rows = RACE_TRAITS[race] || (RACE_TRAITS[race] = []);
    for (const id of [...ids].reverse()) {
      const def = window.PASSIVE_DEFS[id];
      if (!def) continue;
      const row = { icon: def.icon, name: def.name, desc: def.desc };
      const at = rows.findIndex(t => t.name === def.name);
      if (at >= 0) rows[at] = row; else rows.unshift(row);
    }
  }
}
if (typeof window !== 'undefined') window.RACE_TRAITS = RACE_TRAITS;

// Compact tactical diamond: MOV and RNG each get their own footprint.
function RangeDiamond({ radius, fill, edge, label, value, color, tip }) {
  const r = Math.max(0, Math.floor(radius) || 0);
  const size = r * 2 + 1;
  const cellPx = Math.max(4, Math.min(Math.floor(64 / size), 9));
  const cells = [];
  for (let gy = 0; gy < size; gy++) {
    for (let gx = 0; gx < size; gx++) {
      const dist = Math.abs(gx - r) + Math.abs(gy - r);
      if (dist > r) continue;
      const isC = dist === 0;
      cells.push(h('div', { key: gx + '-' + gy, style: { position:'absolute', left: gx * cellPx, top: gy * cellPx, width: cellPx - 1, height: cellPx - 1, background: isC ? '#fff' : fill, border: `1px solid ${isC ? '#fff' : edge}`, boxSizing: 'border-box' } }));
    }
  }
  return h('div', { title: tip || undefined, style: { display:'flex', flexDirection:'column', alignItems:'center', gap:3, flexShrink:0 } },
    h('div', { style: { position:'relative', width: size * cellPx, height: size * cellPx } }, ...cells),
    h('div', { style: { fontSize:9, color, letterSpacing:'0.1em', fontWeight:600, whiteSpace:'nowrap' } }, label, ' ', h('span', { style:{ color:'#e6e9f2' } }, value)));
}
/* ══ Stage 5 (plan §5.5 item 1): THE STICKY NOTES ═══════════════════════
   One paper note per passive the ENGINE would give this vessel — read
   through data.js getUnitPassives on a pseudo-unit built from the slot's
   identity (race / gender / job / types / gear, an empty status map), so
   `flying` resolves first (map.js canFly: SKY_RACES, the Psychic, the
   telepath, a jetpack) and the race's ids after, capped at
   MAX_UNIT_PASSIVES exactly like a unit on the board. The hand-authored
   RACE_TRAITS rows that are NOT registry passives (Mountain Traverser,
   Daywalker…) become one smaller TERRAIN note. Text: `PASSIVE: <name>` +
   the def's desc; a user-voiced marginalia line rides
   `PASSIVE_DEFS[id].note` when present (decision C-7 — Claude never writes
   it). Clicking a note opens the full list in a window. */
function pbUnitNotes(identity, cls, equipment, spellIds) {
  const race = identity.race || '';
  // THE PASSIVES (Phase 4): the equipped passive / gear rows show as notes beside the race's inherent ones
  const passiveRows = (spellIds || []).filter(id => id && typeof window.spellIsPassive === 'function' && window.spellIsPassive(id));
  const pseudo = { race, gender: identity.gender || 'male', cls, types: identity.types || [],
    zodiac: identity.zodiac, status: {}, equipment: equipment || {}, passiveRows };
  let passives = [];
  try { passives = (typeof window.getUnitPassives === 'function') ? (window.getUnitPassives(pseudo) || []) : []; } catch (e) { passives = []; }
  const passiveNames = new Set(passives.map(p => p.name));
  const terrain = (RACE_TRAITS[race] || []).filter(t => !passiveNames.has(t.name));
  return { passives, terrain };
}
// ±3° per note, seeded by the race id — the same vessel always wears its notes the same way
function pbNoteRot(seed, i) {
  let x = 7;
  for (const c of String(seed || '')) x = ((x * 31) + c.charCodeAt(0)) >>> 0;
  return (((x + i * 977) % 61) / 10 - 3).toFixed(1);
}
function PbNotes({ notes, seed, paper, onOpen }) {
  /* THE NOTES STOP ABOVE THE PARTY BAR (Keys vs Keys matchup: on the Gear tab a third note ran down over ONE / RESET /
     SAVE): the column gets the room down to the bar, and the notes shrink to share it (each clips its own text; a click
     still opens the full notes). Measured after every render and on resize. */
  const ref = React.useRef(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const fit = () => {
      el.style.maxHeight = '';
      for (const c of el.children) c.style.minHeight = '';
      const body = el.closest('.pb-body');
      const party = body && body.querySelector(':scope > .pb-party');
      if (!party) return;
      const room = Math.floor(party.getBoundingClientRect().top - el.getBoundingClientRect().top - 10);
      if (room > 60 && el.scrollHeight > room) {
        el.style.maxHeight = room + 'px';
        for (const c of el.children) c.style.minHeight = '0';
      }
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  });
  const items = [];
  notes.passives.forEach((p, i) => {
    items.push(h('div', { key: 'p' + p.id, className: 'pb-note ' + paper, style: { '--rot': pbNoteRot(seed, i) + 'deg' }, onClick: onOpen, title: 'Open the notes' },
      h('i', { className: 'pb-note-fold' }),
      h('b', null, 'PASSIVE: ', h('u', null, p.name)),
      h('p', null, p.desc || ''),
      p.note ? h('em', null, p.note) : null));
  });
  if (notes.terrain.length) {
    const rows = notes.terrain.slice(0, 3);
    items.push(h('div', { key: 'terrain', className: 'pb-note terrain ' + paper, style: { '--rot': pbNoteRot(seed, 5) + 'deg' }, onClick: onOpen, title: 'Open the notes' },
      h('i', { className: 'pb-note-fold' }),
      h('b', null, h('u', null, 'TERRAIN')),
      ...rows.map((t, i) => h('p', { key: i }, t.icon, ' ', h('strong', null, t.name), ' — ', t.desc)),
      notes.terrain.length > rows.length ? h('span', { className: 'pb-note-clip' }, '\u{1F4CE} +' + (notes.terrain.length - rows.length) + ' MORE') : null));
  }
  if (!items.length) return null;
  return h('div', { className: 'pb-notes', ref }, ...items);
}

/* ══ Stage 5 (plan §5.5 item 3): AFFINITIES ══════════════════════════════
   Six round type icons; for the vessel's OWN types the ring reads the
   INCOMING matchups the way state.js getTypeDamageMultiplier judges a hit
   of type A on this vessel: TYPE_CHART[A].strongVs meets a type of ours
   (and weakVs does not) → WEAK, it takes ×1.30; TYPE_CHART[A].weakVs meets
   ours (and strongVs does not) → RESIST, ×0.75; else neutral. (The chart's
   `resists` field is documentation — the engine reads strongVs / weakVs.) */
function pbAffinities(unitTypes) {
  const chart = window.TYPE_CHART || {};
  const mine = (unitTypes || []).map(t => String(t).toLowerCase());
  const order = (Array.isArray(window.ENTROPY_STRIKE_TYPE_ORDER) && window.ENTROPY_STRIKE_TYPE_ORDER.length === 6) ? window.ENTROPY_STRIKE_TYPE_ORDER : PB_TYPE_ORDER;
  return order.map(a => {
    const row = chart[a] || {};
    const strong = (row.strongVs || []).some(t => mine.includes(t));
    const weak = (row.weakVs || []).some(t => mine.includes(t));
    const verdict = strong && !weak ? 'weak' : weak && !strong ? 'resist' : 'neutral';
    return { type: a, verdict, own: mine.includes(a), mult: verdict === 'weak' ? 1.3 : verdict === 'resist' ? 0.75 : 1 };
  });
}
function PbAffinityRing({ types }) {
  const rows = pbAffinities(types);
  return h('div', { className: 'pb-affinity' },
    ...rows.map(r => {
      const c = TYPE_C[r.type] || EW.inkMute;
      const tip = r.verdict === 'weak' ? `takes 1.3× from ${r.type.toUpperCase()}`
        : r.verdict === 'resist' ? `takes 0.75× from ${r.type.toUpperCase()}`
        : `takes 1× from ${r.type.toUpperCase()}`;
      return h('div', { key: r.type, className: 'pb-aff ' + r.verdict + (r.own ? ' own' : ''), style: { '--tc': c }, title: tip + (r.own ? ' · its own type: STAB on its own casts' : '') },
        h('span', { className: 'pb-aff-disc' }, PB_TYPE_GLYPH[r.type] || '?'),
        h('small', null, r.verdict === 'weak' ? 'WEAK' : r.verdict === 'resist' ? 'RESIST' : r.own ? 'OWN' : '—'));
    }));
}

/* ══ THE ELEMENTS (2026-09-09, rev 9): the elemental weakness / resistance
   layer UNDER the type chart. data.js RACE_ELEMENT_AFFINITY is the table
   and getRaceElementAffinity(race, el) the read (the engine's
   unitElementAffinity is the same read off the unit's race); only the
   COMBAT_ELEMENTS ever consult it (fire / ice / lightning / water / poison /
   earth, plus wind / nature / sonic / psychic / light / shadow / blood since
   2026-10-17). weak ×1.5 · resist ×0.5 · immune ×0 (statuses bounce too) ·
   absorb = the hit HEALS. Neutral is the common case and shows as '—'. */
const PB_ELEMENT_ORDER = ['fire', 'ice', 'lightning', 'water', 'poison', 'earth'];
const PB_ELEMENT_C = { fire: '#ff7a3d', ice: '#8fd8ff', lightning: '#ffe25c', water: '#4fa8ff', poison: '#9be25a', earth: '#c9a06a' };
function pbElementAffinities(race) {
  const order = (Array.isArray(window.COMBAT_ELEMENTS) && window.COMBAT_ELEMENTS.length) ? window.COMBAT_ELEMENTS : PB_ELEMENT_ORDER;
  const read = typeof window.getRaceElementAffinity === 'function' ? window.getRaceElementAffinity : (r, el) => ((window.RACE_ELEMENT_AFFINITY || {})[r] || {})[el] || null;
  const mults = window.ELEMENT_AFFINITY_MULT || { weak: 1.5, resist: 0.5, immune: 0 };
  return order.map(el => {
    const tier = read(race, el) || 'neutral';
    const mult = tier === 'absorb' ? null : (mults[tier] ?? 1);
    return { element: el, verdict: tier, mult };
  });
}
function PbElementRing({ race }) {
  const rows = pbElementAffinities(race);
  const icons = window.ELEMENT_ICONS || {};
  const iconHtml = typeof window.elementIconHtml === 'function' ? window.elementIconHtml : null;
  /* THE ELEMENT BOX (2026-09-23): the same two-row read every stat surface
     wears — the icon over the reaction, ? until the race has been hit with
     the element (data.js elemAffinityBox; a vessel you own is always read). */
  if (typeof window.elemAffinityBox === 'function') {
    const cells = window.elemAffinityBox(race);
    const bands = typeof window.elemBoxBands === 'function' ? window.elemBoxBands(cells) : [cells];
    return h('div', { className: 'ew-elem-box md pb-elem-box' },
      ...bands.flatMap((band, bi) => [
        h('div', { key: 'e' + bi, className: 'ew-elem-row ew-elem-els' }, band.map(c => iconHtml
          ? h('span', { key: c.el, className: 'ew-elem-cell ew-elem-el', title: c.tip, dangerouslySetInnerHTML: { __html: iconHtml(c.el, 'ew-elem-icon') } })
          : h('span', { key: c.el, className: 'ew-elem-cell ew-elem-el', title: c.tip }, icons[c.el] || '?'))),
        h('div', { key: 'r' + bi, className: 'ew-elem-row ew-elem-rxs' }, band.map(c =>
          h('span', { key: c.el, className: 'ew-elem-cell ew-elem-rx ' + (c.tier || 'unknown'), style: { color: c.color }, title: c.tip }, c.sym)))]));
  }
  return h('div', { className: 'pb-affinity pb-element' },
    ...rows.map(r => {
      const c = PB_ELEMENT_C[r.element] || EW.inkMute;
      const EL = r.element.toUpperCase();
      const tip = r.verdict === 'weak' ? `takes ${r.mult}× from ${EL}`
        : r.verdict === 'resist' ? `takes ${r.mult}× from ${EL}`
        : r.verdict === 'immune' ? `IMMUNE to ${EL} — no damage, its status bounces`
        : r.verdict === 'absorb' ? `ABSORBS ${EL} — the hit heals instead`
        : `takes 1× from ${EL}`;
      const label = r.verdict === 'weak' ? 'WEAK' : r.verdict === 'resist' ? 'RESIST' : r.verdict === 'immune' ? 'IMMUNE' : r.verdict === 'absorb' ? 'ABSORB' : '—';
      const disc = iconHtml
        ? h('span', { className: 'pb-aff-disc', dangerouslySetInnerHTML: { __html: iconHtml(r.element, 'pb-elicon') } })
        : h('span', { className: 'pb-aff-disc' }, icons[r.element] || '?');
      return h('div', { key: r.element, className: 'pb-aff ' + r.verdict, style: { '--tc': c }, title: tip }, disc, h('small', null, label));
    }));
}

// RPG-style equipment/item slot square flanking the hero sprite.
function EquipSlotBox({ size, accent, filled, icon, label, title, onClick, onClear }) {
  const s = size || 48;
  return h('div', { onClick, title, className:'pbx-eqslot' + (filled ? ' filled' : ''), style:{ width:s, height:s, '--acc': accent || 'rgba(255,255,255,0.5)' } },
    filled && onClear ? h('span', { className:'pbx-eqslot-x', title:'Remove', onClick:(e)=>{ e.stopPropagation(); onClear(); } }, '✕') : null,
    h('span', { className:'pbx-eqslot-icon' }, filled ? icon : '+'),
    filled && label ? h('span', { className:'pbx-eqslot-label' }, label) : null);
}

/* A window on the glass (PARTY_BUILDER_PLAN §5.1 item 9): the pickers and
   the team modal are rounded phosphor panes drawn INSIDE the monitor, never
   browser modals. `zone` = fills the column it is rendered in (the node
   picker over the TECH column); otherwise centred over the whole glass. */
function PbWindow({ title, sub, onClose, width, zone, children }) {
  return h('div', {
    className: 'pb-veil' + (zone ? ' zone' : ''),
    onClick: (e) => { if (e.target === e.currentTarget) onClose(); } },
    h('div', { className: 'pb-window', style: width ? { width } : undefined, onClick: e => e.stopPropagation() },
      h('div', { className: 'pb-window-head' },
        h('b', null, title),
        sub ? h('span', null, sub) : null,
        h('button', { className: 'pb-window-x', onClick: onClose, title: 'Close (ESC)' }, '\u2715 CLOSE')),
      h('div', { className: 'pb-window-body' }, children)));
}

/* Standalone mode flag \u2014 set by _mountReactTeamBuilder (main-menu Party
   Builder page) and cleared by the pre-match mount. In standalone the
   component opens on the TEAM ARCHIVE locker (Pok\u00e9mon-Showdown-style:
   saved squads \u2192 pick one to forge), and the footer trades the match
   controls (CONFIRM / SEAL YOUR FATE / online locks) for SAVE TEAM. */
let _pbStandaloneMode = false;

function PartyBuilder(props) {
  const st = getSt();
  if (!st || !st.partyBuilds) return h('div', { style:{ color:'#8a93a8', padding:40, fontFamily:'DotGothic16, monospace', textAlign:'center' } }, 'Initializing\u2026');
  const NET = window._NET;
  const isOnline = !!(window.ONLINE_RULES?.active || (NET && NET.online));
  const netRole = NET?.role || null;
  const netLock = NET?._lockState || {};
  const isRankedNet = !!NET?.ranked;
  // "I have locked in" — ranked sets _waitingForOpponent; friendly tracks the
  // role's own lock flag. "Opponent locked" — the host learns via
  // guestPartyReceived, the guest via the host-locked relay.
  const isWaitingOnline = isOnline && (!!NET?._waitingForOpponent || !!NET?._autoStartFired
    || (netRole === 'guest' ? !!netLock.guest : !!netLock.host));
  const opponentLockedToo = isOnline && (netRole === 'guest' ? !!netLock.hostLocked : !!netLock.guestPartyReceived);
  // Friendly rooms: the HOST controls the start — once both sides are locked
  // their button becomes a live START MATCH instead of a dead waiting label.
  const friendlyHostCanStart = isWaitingOnline && !isRankedNet && netRole === 'host' && opponentLockedToo;
  const player = isOnline ? (typeof window._myPlayer === 'function' ? window._myPlayer() : 1) : (st.builderSelectedPlayer || 1);
  const teamSize = window.CONFIG?.teamSize || 4;
  /* ONE OF EACH (mondo, 2026-10-20: "disallow more than one of the same unit on a single team"): a unit is its race, so a
     team fields each race once. The wall greys out a race another slot already holds (a click is refused), a sheet that
     still carries one twice (a team saved before the rule) is flagged on its slots and cannot start until one is swapped. */
  const pbSlotRace = (i) => { const mt = st.partyMeta?.[player]?.[i]; return String((mt && mt.race) || window.getDefaultIdentity?.()?.race || 'door agent').toLowerCase(); };
  const pbTeamRaces = () => Array.from({ length: teamSize }, (_, i) => pbSlotRace(i));
  const pbRaceTakenElsewhere = (race, at) => pbTeamRaces().some((r, i) => i !== at && r === race);
  const pbDupRaces = (races) => (typeof window.teamDuplicateRaces === 'function') ? window.teamDuplicateRaces(races) : [];
  const pbRaceName = (race) => (window.RACE_PROFILES?.[race]?.label) || String(race || '').replace(/\b\w/g, c => c.toUpperCase());
  /* HOMOSAPIEN OUT (mondo, 2026-10-23): a saved sheet that still fields a race that left the roster is kept and flagged
     (REMOVED on its slot, a note on its card) and cannot start until that unit is swapped out (state.js teamRemovedRaces) */
  const pbGoneRaces = (races) => (typeof window.teamRemovedRaces === 'function') ? window.teamRemovedRaces(races) : [];
  const pbOneOfEachToast = (race) => { try { sfx('uiError'); } catch (e) {} if (typeof window.ewToast === 'function') window.ewToast(pbRaceName(race) + ' is already on this team. A team fields one of each unit.'); };
  /* 2026-09-09 (found by playtest_builder.js): the flag is per INSTANCE
     now — the pre-match forge sleeping in #builderOverlay re-renders while
     the archive is open and used to flip the shared module flag, so the
     standalone instance woke up as a pre-match one (its ESC ran doBack →
     the match-select terminal). Each mount passes its own mode. */
  const standalone = (props && typeof props.standalone === 'boolean') ? props.standalone : _pbStandaloneMode;
  const [tbView, setTbView] = React.useState(standalone ? 'locker' : 'edit');   // standalone: 'locker' | 'edit'
  const [editingTeamId, setEditingTeamId] = React.useState(null);
  const [teamNameDraft, setTeamNameDraft] = React.useState('');
  const [slot, setSlot] = React.useState(() => st.builderSelectedSlot || 0);
  /* THE A–Z DEFAULT (2026-10-20, mondo): the wall opens sorted by name
     A–Z; every stat sort (HP ↓ was the old default) stays in the SORT menu. */
  const [sortKey, setSortKey] = React.useState('label');
  const [sortDir, setSortDir] = React.useState('asc');
  const [typeFilter, setTypeFilter] = React.useState(null);
  const [rosterSearch, setRosterSearch] = React.useState('');
  const [showTeamModal, setShowTeamModal] = React.useState(false);
  /* THE DEPLOY PICK (2026-09-14): a saved team may carry up to
     RESERVE_RULES.roster (8) vessels; loading one into a mode that fields
     fewer opens a window to choose which ones cross. { preset, chosen: [i…] } */
  const [teamPick, setTeamPick] = React.useState(null);
  const [teamSaveName, setTeamSaveName] = React.useState('');
  const [_, forceUpdate] = React.useState(0);
  const refresh = () => forceUpdate(n => n + 1);
  const [spellTip, setSpellTip] = React.useState(null); // { sp, x, y }
  /* THE CIRCUIT selection model (plan §5.2 item 2): techSel = the node the
     keyboard / a click owns, techHover = the node under the pointer; the
     technique panel follows techHover || techSel. previewState mirrors the
     viewer's MOVE PREVIEW ({ playing, ms, name }); previewNote is the pill's
     one-shot message for vessels that cannot preview. */
  const [techSel, setTechSel] = React.useState(null);
  const [techHover, setTechHover] = React.useState(null);
  const [previewState, setPreviewState] = React.useState(null);
  const [previewNote, setPreviewNote] = React.useState(null);
  const previewHoverTimer = React.useRef(0);
  const previewNoteTimer = React.useRef(0);
  /* ROSTER (Stage 4, §5.4): hovering a wall tile shows that vessel on the
     stage after a 220 ms debounce (cached GLBs swap instantly; uncached
     ones show the summoning ring); leaving the wall returns the slot's
     vessel. pbMenu = the SORT / JOB pill menus (glass windows, C-9). */
  const [rosterHover, setRosterHover] = React.useState(null);
  const rosterHoverTimer = React.useRef(0);
  const [pbMenu, setPbMenu] = React.useState(null);
  // Stage 5: the sticky notes' full-text window (`.pb-notes` click)
  const [notesOpen, setNotesOpen] = React.useState(false);
  // THE STAGE (plan §5.3): the CRT root + the technique on the stage, for the
  // monitor's reactions (grade wash / scanline roll / jolt) — DOM-driven, no
  // React state churn per beat.
  const crtRef = React.useRef(null);
  React.useLayoutEffect(() => { if (window.EWFitText) window.EWFitText.attach(crtRef.current); });   // THE FIT (cut-off text)
  const previewSpellRef = React.useRef(null);
  const gradeTimer = React.useRef(0);
  const showSpellTip = (sp, e) => { if (sp) setSpellTip({ sp, x: e.clientX, y: e.clientY }); };
  const hideSpellTip = () => setSpellTip(null);
  /* the four tabs on the glass (PB_TABS); ROSTER first, as the references open */
  const [pbTab, setPbTab] = React.useState('roster');
  const [creatorOpen, setCreatorOpen] = React.useState(false);
  /* THE REFERENCE (2026-11-01, mondo: "see the original mesh model of the race im working on in the character creator so i can
     reference it"): SHOW ORIGINAL MODEL puts the race's own Meshy model on the stage for a look, nothing saved. Kept as the
     player:slot:race:gender it was pressed on, so another slot / race / gender (or closing the creator) is back on the look. */
  const [creatorRef, setCreatorRef] = React.useState(null);
  const setTab = (id) => { if (!PB_TABS.some(t => t.id === id) || id === pbTab) return; setPbTab(id); sfx('uiCursorMove'); };
  const cycleTab = (d) => { const i = Math.max(0, PB_TABS.findIndex(t => t.id === pbTab)); setTab(PB_TABS[(i + d + PB_TABS.length) % PB_TABS.length].id); };
  React.useEffect(() => { window._pbSetTab = setTab; return () => { if (window._pbSetTab === setTab) delete window._pbSetTab; }; });
  const [equipPicker, setEquipPicker] = React.useState(null);        // 'item' | 'accessory1' | 'accessory2'
  React.useEffect(() => { st.builderSelectedSlot = slot; }, [slot]);

  const getFavRaces = () => {
    const p = window.ProfileSystem?.getActiveProfile?.();
    return p?.favRaces || [];
  };
  const [favRaces, setFavRaces] = React.useState(getFavRaces);
  // A vessel the local human hasn't unlocked yet can never be favorited.
  const isLockedEntry = (raceKey) => (player === 1) && (typeof window.isUnitUnlocked === 'function') && !window.isUnitUnlocked(raceKey);
  const toggleFav = (raceKey, gender) => {
    if (isLockedEntry(raceKey)) { sfx('uiError'); return; }
    const p = window.ProfileSystem?.getActiveProfile?.();
    const idx = window.ProfileSystem?.getActiveProfileIndex?.();
    if (!p || idx == null) return;
    if (!p.favRaces) p.favRaces = [];
    const tag = raceKey + ':' + gender;
    const fi = p.favRaces.indexOf(tag);
    if (fi >= 0) p.favRaces.splice(fi, 1); else p.favRaces.push(tag);
    window.ProfileSystem.saveProfile(idx, p);
    setFavRaces(p.favRaces.slice());
    sfx('uiCursorMove');
  };
  const isFav = (raceKey, gender) => favRaces.includes(raceKey + ':' + gender);

  /* THE NAMES (mondo, 2026-09-30): no random names — a unit is named its race until the player types one. The typed
     name is the slot's partyNames entry; an empty entry (or the race's own label) is the default and shows the race. */
  const slotRaceLabel = (p, i) => {
    const mt = st.partyMeta?.[p]?.[i] || {};
    const race = mt.race || 'door agent';
    return (typeof window.getRaceLabel === 'function' ? window.getRaceLabel(race, mt.gender || 'male') : '') || race;
  };
  const customUnitName = (p, i) => {
    const cur = String(st.partyNames?.[p]?.[i] || '').trim();
    const isDefault = (typeof window.isGeneratedDefaultName === 'function') ? window.isGeneratedDefaultName(cur, st.partyBuilds?.[p]?.[i], p, i) : !cur;
    return isDefault ? '' : cur;
  };
  const resolveUnitName = (p, i, cls) => customUnitName(p, i) || slotRaceLabel(p, i);

  const getTeamPresets = () => {
    const p = window.ProfileSystem?.getActiveProfile?.();
    return p?.teamPresets || [];
  };
  // Snapshot the player's current build into preset slots (shared by the
  // pre-match SAVE modal and the standalone archive's SAVE TEAM).
  const captureTeamSlots = () => {
    const size = window.CONFIG?.teamSize || teamSize;
    const slots = [];
    for (let i = 0; i < size; i++) {
      const cn = typeof window.normalizeClassName === 'function' ? window.normalizeClassName(st.partyBuilds?.[player]?.[i], window.DEFAULT_BUILDS?.[player]?.[i]) : (st.partyBuilds?.[player]?.[i] || 'Warrior');
      const mt = st.partyMeta?.[player]?.[i] || {};
      const lo = st.loadouts?.[player]?.[i] || {};
      slots.push({
        cls: cn,
        race: mt.race || 'door agent',
        gender: mt.gender || 'male',
        appearance: window.normalizeCharacterAppearance?.(mt.appearance) || null,
        unitName: customUnitName(player, i),   // THE NAMES: '' = the race
        customSpells: mt.customSpells ? mt.customSpells.slice() : [],
        spellUpgrades: mt.spellUpgrades ? JSON.parse(JSON.stringify(mt.spellUpgrades)) : {},   // THE UPGRADES (Phase 5)
        zodiac: mt.zodiac || 'aries',
        loadout: { items: lo.items ? { ...lo.items } : {}, equipment: lo.equipment ? { ...lo.equipment } : {} },
      });
    }
    return slots;
  };
  /* Save into an EXISTING preset (by id) or push a new one. Returns the
     saved preset id, or null when the archive is full. */
  const saveTeamAs = (existingId, name) => {
    const p = window.ProfileSystem?.getActiveProfile?.();
    const idx = window.ProfileSystem?.getActiveProfileIndex?.();
    if (!p || idx == null) return null;
    if (!p.teamPresets) p.teamPresets = [];
    const slots = captureTeamSlots();
    const now = new Date().toISOString();
    let saved = existingId ? p.teamPresets.find(t => t.id === existingId) : null;
    if (saved) {
      saved.name = name || saved.name;
      saved.slots = slots;
      saved.gameMode = st.gameMode || saved.gameMode || 'arena';
      saved.lastUsed = now;
    } else {
      const MAX = window.ProfileSystem?.MAX_TEAM_PRESETS || 20;
      if (p.teamPresets.length >= MAX) { sfx('uiError'); return null; }
      saved = {
        id: 'team-' + Date.now(),
        name: name || 'Team ' + (p.teamPresets.length + 1),
        slots,
        gameMode: st.gameMode || 'arena',
        createdAt: now,
        lastUsed: now,
      };
      p.teamPresets.push(saved);
    }
    window.ProfileSystem.saveProfile(idx, p);
    sfx('uiButtonConfirm');
    return saved.id;
  };
  const saveCurrentTeam = (name) => {
    if (saveTeamAs(null, name) == null) return;
    setShowTeamModal(false);
    setTeamSaveName('');
  };
  const loadTeamPreset = (preset, opts) => {
    if (!preset?.slots) return;
    // Read the size FRESH — the standalone archive resizes CONFIG.teamSize
    // to the preset before calling this, after this render captured it.
    const sizeNow = window.CONFIG?.teamSize || teamSize;
    // More vessels on file than the mode fields → the player picks which
    // cross (never a silent truncation to the first N).
    if (!standalone && !opts?.picked && preset.slots.length > sizeNow) {
      const _seen = new Set(), _first = [];   // ONE OF EACH: the pick opens on the first vessels of DIFFERENT races
      preset.slots.forEach((s, i) => { const r = String(s?.race || '').toLowerCase(); if (_first.length < sizeNow && !_seen.has(r) && !pbGoneRaces([r]).length) { _seen.add(r); _first.push(i); } });   // (HOMOSAPIEN OUT: never a removed unit)
      setTeamPick({ preset, chosen: _first });
      sfx('uiCursorMove');
      return;
    }
    for (let i = 0; i < Math.min(preset.slots.length, sizeNow); i++) {
      const s = preset.slots[i];
      if (!st.partyBuilds[player]) st.partyBuilds[player] = [];
      st.partyBuilds[player][i] = s.cls;
      if (!st.partyMeta[player]) st.partyMeta[player] = [];
      if (!st.partyMeta[player][i]) st.partyMeta[player][i] = {};
      st.partyMeta[player][i].race = s.race;
      st.partyMeta[player][i].gender = s.gender;
      st.partyMeta[player][i].appearance = window.normalizeCharacterAppearance?.(s.appearance) || null;
      st.partyMeta[player][i].zodiac = s.zodiac || 'aries';
      if (s.customSpells?.length) st.partyMeta[player][i].customSpells = s.customSpells.slice();
      else delete st.partyMeta[player][i].customSpells;
      if (s.spellUpgrades && Object.keys(s.spellUpgrades).length) st.partyMeta[player][i].spellUpgrades = JSON.parse(JSON.stringify(s.spellUpgrades));
      else delete st.partyMeta[player][i].spellUpgrades;
      if (!st.partyNames) st.partyNames = {};
      if (!st.partyNames[player]) st.partyNames[player] = [];
      st.partyNames[player][i] = (s.unitName && s.unitName !== s.cls) ? s.unitName : '';
      if (!st.loadouts[player]) st.loadouts[player] = [];
      st.loadouts[player][i] = s.loadout ? { items: { ...s.loadout.items }, equipment: { ...s.loadout.equipment } } : (typeof window.emptyLoadout === 'function' ? window.emptyLoadout() : {});
    }

    const p = window.ProfileSystem?.getActiveProfile?.();
    const pidx = window.ProfileSystem?.getActiveProfileIndex?.();
    if (p && pidx != null) {
      const tp = p.teamPresets?.find(t => t.id === preset.id);
      if (tp) tp.lastUsed = new Date().toISOString();
      window.ProfileSystem.saveProfile(pidx, p);
    }
    st.teamLockedIn = false;
    if (st.builderConfirmedSlots) st.builderConfirmedSlots[player] = {};
    sfx('uiButtonConfirm');
    setShowTeamModal(false);
    setTeamPick(null);
    refresh();
  };
  // The picker's DEPLOY: the chosen vessels, in the order they stand on the sheet.
  const deployTeamPick = () => {
    if (!teamPick) return;
    const sizeNow = window.CONFIG?.teamSize || teamSize;
    const chosen = teamPick.chosen.slice().sort((a, b) => a - b);
    if (chosen.length !== sizeNow) { sfx('uiError'); return; }
    if (pbDupRaces(chosen.map(i => teamPick.preset.slots[i]?.race)).length) { sfx('uiError'); return; }   // ONE OF EACH
    if (pbGoneRaces(chosen.map(i => teamPick.preset.slots[i]?.race)).length) { sfx('uiError'); return; }   // HOMOSAPIEN OUT
    loadTeamPreset({ ...teamPick.preset, slots: chosen.map(i => teamPick.preset.slots[i]) }, { picked: true });
  };
  const toggleTeamPick = (i) => {
    if (!teamPick) return;
    const sizeNow = window.CONFIG?.teamSize || teamSize;
    const has = teamPick.chosen.includes(i);
    if (!has && teamPick.chosen.length >= sizeNow) { sfx('uiError'); return; }
    const _r = String(teamPick.preset.slots[i]?.race || '').toLowerCase();
    if (!has && pbGoneRaces([_r]).length) { try { sfx('uiError'); } catch (e) {} if (typeof window.ewToast === 'function') window.ewToast(pbRaceName(_r) + ' is out of the game. Pick another unit.'); return; }   // HOMOSAPIEN OUT
    if (!has && teamPick.chosen.some(j => String(teamPick.preset.slots[j]?.race || '').toLowerCase() === _r)) { pbOneOfEachToast(_r); return; }   // ONE OF EACH
    setTeamPick({ ...teamPick, chosen: has ? teamPick.chosen.filter(x => x !== i) : teamPick.chosen.concat(i) });
    sfx('uiCursorMove');
  };
  const deleteTeamPreset = (presetId) => {
    const p = window.ProfileSystem?.getActiveProfile?.();
    const idx = window.ProfileSystem?.getActiveProfileIndex?.();
    if (!p || idx == null) return;
    p.teamPresets = (p.teamPresets || []).filter(t => t.id !== presetId);
    window.ProfileSystem.saveProfile(idx, p);
    sfx('uiCursorMove');
    refresh();
  };

  // ── Standalone TEAM ARCHIVE actions (Pokémon-Showdown-style locker) ──
  const tbNewTeam = () => {
    if (window.CONFIG) window.CONFIG.teamSize = 4;   // standard squad; modes clamp on load
    if (typeof window.defaultAllTeams === 'function') window.defaultAllTeams();
    st.builderConfirmedSlots = {};
    st.teamLockedIn = false;
    setSlot(0);
    setEditingTeamId(null);
    setTeamNameDraft('');
    setTbView('edit');
    sfx('uiButtonConfirm');
  };
  const tbEditTeam = (preset) => {
    const size = Math.max(1, Math.min(8, (preset.slots || []).length || 4));
    if (window.CONFIG) window.CONFIG.teamSize = size;
    loadTeamPreset(preset);
    setSlot(0);
    setEditingTeamId(preset.id);
    setTeamNameDraft(preset.name || '');
    setTbView('edit');
  };
  const tbDuplicateTeam = (preset) => {
    const p = window.ProfileSystem?.getActiveProfile?.();
    const idx = window.ProfileSystem?.getActiveProfileIndex?.();
    if (!p || idx == null) return;
    if (!p.teamPresets) p.teamPresets = [];
    const MAX = window.ProfileSystem?.MAX_TEAM_PRESETS || 20;
    if (p.teamPresets.length >= MAX) { sfx('uiError'); return; }
    const now = new Date().toISOString();
    p.teamPresets.push({
      ...preset,
      id: 'team-' + Date.now(),
      name: (preset.name || 'Team') + ' copy',
      slots: (preset.slots || []).map(s => ({ ...s, customSpells: (s.customSpells || []).slice(), spellUpgrades: JSON.parse(JSON.stringify(s.spellUpgrades || {})), loadout: { items: { ...(s.loadout?.items || {}) }, equipment: { ...(s.loadout?.equipment || {}) } } })),
      createdAt: now, lastUsed: now,
    });
    window.ProfileSystem.saveProfile(idx, p);
    sfx('uiButtonConfirm');
    refresh();
  };
  /* THE ROSTER SIZE (2026-09-14): the archive keeps up to RESERVE_RULES.roster
     (8) vessels on a sheet — ＋ / − SLOT grow or trim the party in place
     (a new slot takes the mode's default build; a trimmed one is dropped). */
  const tbRosterMax = () => Math.max(4, window.RESERVE_RULES?.roster || 8);
  const tbSetTeamSize = (n) => {
    const size = Math.max(1, Math.min(tbRosterMax(), n | 0));
    const cur = window.CONFIG?.teamSize || teamSize;
    if (size === cur) { sfx('uiError'); return; }
    if (window.CONFIG) window.CONFIG.teamSize = size;
    if (!st.partyBuilds[player]) st.partyBuilds[player] = [];
    if (!st.partyMeta[player]) st.partyMeta[player] = [];
    if (!st.partyNames) st.partyNames = {};
    if (!st.partyNames[player]) st.partyNames[player] = [];
    if (!st.loadouts[player]) st.loadouts[player] = [];
    for (let i = st.partyBuilds[player].length; i < size; i++) {
      const cls = window.DEFAULT_BUILDS?.[player]?.[i] || st.partyBuilds[player][i % Math.max(1, st.partyBuilds[player].length)] || 'Warrior';
      st.partyBuilds[player][i] = cls;
      st.partyMeta[player][i] = null;   // ONE OF EACH (2026-10-20): ensurePartyMeta below seats a race the sheet lacks (an empty {} read as a second Homosapien)
      st.partyNames[player][i] = '';   // THE NAMES: a new slot is its race
      st.loadouts[player][i] = typeof window.emptyLoadout === 'function' ? window.emptyLoadout() : {};
    }
    st.partyBuilds[player].length = size;
    st.partyMeta[player].length = size;
    st.partyNames[player].length = size;
    st.loadouts[player].length = size;
    if (typeof window.ensurePartyMeta === 'function') window.ensurePartyMeta();
    if (st.builderConfirmedSlots?.[player]) Object.keys(st.builderConfirmedSlots[player]).forEach(k => { if (+k >= size) delete st.builderConfirmedSlots[player][k]; });
    if (slot >= size) selectSlot(size - 1);
    st.teamLockedIn = false;
    sfx('uiButtonConfirm');
    refresh();
  };
  const tbSaveTeam = () => {
    const fallback = editingTeamId ? null : ('Team ' + (getTeamPresets().length + 1));
    const id = saveTeamAs(editingTeamId, teamNameDraft.trim() || fallback);
    if (id == null) return;             // archive full
    /* THE SQUAD DESK (2026-09-30): a forge opened from the team pick goes straight back to it with the team on file */
    if (window._ewForgeReturn && typeof window._ewForgeSaved === 'function' && window._ewForgeSaved(id)) return;
    setEditingTeamId(id);
    setTbView('locker');
    refresh();
  };
  /* THE SQUAD DESK (2026-09-30): the team pick opens the forge on a fresh sheet (no team on file / NEW TEAM) or on the
     team to EDIT (map.js _sqForge sets window._ewForgeOpen before mounting) */
  React.useEffect(() => {
    if (!standalone) return;
    const req = window._ewForgeOpen;
    window._ewForgeOpen = null;
    if (!req) return;
    if (req.edit) { const t = getTeamPresets().find(x => x.id === req.edit); if (t) tbEditTeam(t); }
    else if (req.startNew) tbNewTeam();
  }, []);

  const clsName = typeof window.normalizeClassName === 'function' ? window.normalizeClassName(st.partyBuilds?.[player]?.[slot], window.DEFAULT_BUILDS?.[player]?.[slot]) : (st.partyBuilds?.[player]?.[slot] || 'Warrior');
  const meta = st.partyMeta?.[player]?.[slot] || (typeof window.getDefaultIdentity === 'function' ? window.getDefaultIdentity() : {});
  const identity = typeof window.resolveIdentityForBuild === 'function' ? window.resolveIdentityForBuild(clsName, meta) : { race: meta.race || 'door agent', types: ['human'], gender: meta.gender || 'male', zodiac: meta.zodiac || 'aries' };
  const unitRace = identity.race || '', unitTypes = identity.types || [];
  const unitGender = identity.gender || 'male';   // RACE_GENDER_SPELLS (2026-10-27): the Priest and the Nun learn one or two spells of their own
  const fc = PB_ACCENT;
  const template = computeStats(unitRace, clsName);
  const raceAbilities = getRaceAbilities(unitRace, clsName);
  const prof = window.RACE_PROFILES?.[unitRace];
  /* THE TIERS (2026-09-24): no unit has a secondary job — an old save's is dropped here, its spells by the scrub below. */
  const secJob = '';
  if (st.partyMeta?.[player]?.[slot]?.secondaryJob) delete st.partyMeta[player][slot].secondaryJob;
  const unitLoadout = st.loadouts?.[player]?.[slot] || (typeof window.emptyLoadout === 'function' ? window.emptyLoadout() : {});
  const unitEquipment = unitLoadout.equipment || {};
  const rawCustomSpells = Array.isArray(st.partyMeta?.[player]?.[slot]?.customSpells) ? st.partyMeta[player][slot].customSpells : null;

  const mpMode2 = typeof window.getActiveMultiplayerMode === 'function' ? window.getActiveMultiplayerMode() : null;
  const isArenaEarly = false;
  let customSpells = rawCustomSpells;
  if (!rawCustomSpells) {
    const defaults = buildDefaultCustomSpells(unitRace, clsName, secJob, unitGender);

    if (!st.partyMeta[player]) st.partyMeta[player] = [];
    if (!st.partyMeta[player][slot]) st.partyMeta[player][slot] = {};
    st.partyMeta[player][slot].customSpells = defaults;
    customSpells = defaults;
  } else {
    // Self-heal: drop any equipped spell this unit can't actually learn
    // (leftovers from a vessel swap, subjob change, or an old saved team).
    const legal = legalCustomSpellIds(unitRace, clsName, secJob, rawCustomSpells, unitGender);
    if (rawCustomSpells.some(id => !legal.has(id))) {
      const scrubbed = rawCustomSpells.filter(id => legal.has(id));
      st.partyMeta[player][slot].customSpells = scrubbed;
      customSpells = scrubbed;
    }
    // Tree classes: also enforce root-connectivity (stale saves from the
    // flat-pool era may hold legal-but-disconnected picks).
    if (customSpells && typeof window.classHasSpellTree === 'function'
        && window.classHasSpellTree(clsName) && typeof window.treeLegalSubset === 'function') {
      const fixed = window.treeLegalSubset(unitRace, clsName, secJob, customSpells, unitGender);
      if (fixed.length !== customSpells.length) {
        st.partyMeta[player][slot].customSpells = fixed;
        customSpells = fixed;
      }
    }
  }
  /* THE GEAR MERGE (SPELL_LIBRARY_PLAN Phase 4): an old save's two accessories become GEAR passive rows in the kit
     (after its own picks; the rack's repair prices them), and the retired slots empty. */
  if ((unitEquipment.accessory1 || unitEquipment.accessory2) && typeof window.gearMigrateIds === 'function') {
    if (!st.partyMeta[player]) st.partyMeta[player] = [];
    if (!st.partyMeta[player][slot]) st.partyMeta[player][slot] = {};
    let mig = window.gearMigrateIds(customSpells || [], unitEquipment) || [];
    if (typeof window.treeLegalSubset === 'function' && typeof window.classHasSpellTree === 'function' && window.classHasSpellTree(clsName)) mig = window.treeLegalSubset(unitRace, clsName, secJob, mig, unitGender);
    st.partyMeta[player][slot].customSpells = mig;
    customSpells = mig;
    unitEquipment.accessory1 = null; unitEquipment.accessory2 = null;
  }
  const { final: fullStats, delta: statDeltas } = computeFullStats(unitRace, clsName, secJob, customSpells || [], pbEffUps(unitRace, clsName, customSpells || [], st.partyMeta?.[player]?.[slot]?.spellUpgrades), identity.zodiac || 'aries');
  const learnedSpells = getLearnedSpells(clsName, customSpells);
  const zodiacNatal = (window.ZODIAC_EFFECTS?.[identity.zodiac || 'aries']?.natal) || null;   // the race editor's ZODIAC tab
  const unitItems = unitLoadout.items || {};
  /* an item's cap at the forge: ITEM_RULES max, lifted by the kit's passive rows (THE SPELL AUDIT F6, 2026-10-26: Field
     Operative's scannerCap 2 — the battle normalizer reads the same rows) */
  const itemCapOf = (ik, rule) => {
    let m = rule.max || 6;
    if (ik === 'scanner' && typeof window.passiveIdsMax === 'function') m = Math.max(m, window.passiveIdsMax(customSpells || [], 'scannerCap', st.partyMeta?.[player]?.[slot]?.spellUpgrades) || 0);
    return m;
  };

  const rosterEntries = React.useMemo(() => {
    const races = window.AVAILABLE_RACES || [], entries = [];
    for (const rk of races) {
      const p = window.RACE_PROFILES?.[rk]; if (!p) continue;
      const genders = typeof window.getAvailableGendersForRace === 'function' ? window.getAvailableGendersForRace(rk) : ['male'];
      const uc = window.UNIT_CLASS || 'Vessel';   // THE JOBS REMOVAL (2026-09-27): no job per vessel
      if (genders.length > 1) { for (const g of genders) entries.push({ race:rk, gender:g, label:`${_grl(rk,g)} ${g==='female'?'\u2640':'\u2642'}`, cls:uc, types:p.types||[], prof:p }); }
      else entries.push({ race:rk, gender:genders[0], label:_grl(rk,genders[0]), cls:uc, types:p.types||[], prof:p });
    }
    return entries;
  }, [_]);

  const availableTypes = React.useMemo(() => {
    const s = new Set();
    rosterEntries.forEach(e => (e.types || []).forEach(t => { if (t) s.add(t); }));
    return Array.from(s).sort();
  }, [rosterEntries]);

  const filteredRoster = React.useMemo(() => {
    let list = rosterEntries;
    if (typeFilter) list = list.filter(e => e.types.includes(typeFilter));
    if (rosterSearch) { const q = rosterSearch.toLowerCase(); list = list.filter(e => e.label.toLowerCase().includes(q) || e.race.toLowerCase().includes(q)); }
    const getStatVal = (entry, key) => { const s = computeStats(entry.race, entry.cls), mapped = STAT_MAP[key]; return s[mapped] ?? s[key] ?? s[key.toLowerCase()] ?? 0; };
    list = [...list].sort((a, b) => {
      // Owned (unlocked) vessels always come first, then favorites, then the chosen stat.
      const ao = isLockedEntry(a.race) ? 0 : 1, bo = isLockedEntry(b.race) ? 0 : 1;
      if (ao !== bo) return bo - ao;
      const af = isFav(a.race, a.gender) ? 1 : 0, bf = isFav(b.race, b.gender) ? 1 : 0;
      if (af !== bf) return bf - af;
      if (STAT_KEYS.includes(sortKey)) { return sortDir === 'desc' ? getStatVal(b, sortKey) - getStatVal(a, sortKey) : getStatVal(a, sortKey) - getStatVal(b, sortKey); } const av = a[sortKey]||a.label, bv = b[sortKey]||b.label; return sortDir === 'desc' ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv)); });
    return list;
  }, [rosterEntries, typeFilter, rosterSearch, sortKey, sortDir, _, favRaces]);

  function pickRace(raceKey, gender, stay) {   // (stay: THE ASSIGNED LOOKS, LOADED keep the creator open on GEAR)
    if (pbRaceTakenElsewhere(raceKey, slot)) { pbOneOfEachToast(raceKey); return; }   // ONE OF EACH
    if (!st.partyMeta[player]) st.partyMeta[player] = []; if (!st.partyMeta[player][slot]) st.partyMeta[player][slot] = {};
    const prevRace = st.partyMeta[player][slot].race, prevGender = st.partyMeta[player][slot].gender; st.partyMeta[player][slot].race = raceKey; st.partyMeta[player][slot].gender = gender;
    st.partyBuilds[player][slot] = window.UNIT_CLASS || 'Vessel';   // THE JOBS REMOVAL (2026-09-27): one neutral class
    // A different vessel = a different spell pool (its families) — the old unit's picks must never carry over.
    // THE GENDER KIT (2026-11-07): Priest <-> Nun is the same race key with spells of its own — a different vessel too.
    if (raceKey !== prevRace || pbGenderKitChanges(raceKey, prevGender, gender)) { delete st.partyMeta[player][slot].customSpells; delete st.partyMeta[player][slot].spellUpgrades; }
    if (!st.loadouts[player]) st.loadouts[player] = []; if (!st.loadouts[player][slot]) st.loadouts[player][slot] = typeof window.emptyLoadout === 'function' ? window.emptyLoadout() : {};
    const lo = st.loadouts[player][slot]; if (typeof window.ITEM_RULES !== 'undefined') { lo.items = Object.fromEntries(Object.keys(window.ITEM_RULES).map(k=>[k,0])); lo.items.healPotion=1;lo.items.manaPotion=1;lo.items.panacea=1; }
    lo.equipment = typeof window.getDefaultEquipment === 'function' ? window.getDefaultEquipment(st.partyBuilds[player][slot]) : {};

    const _mm = typeof window.getActiveMultiplayerMode === 'function' ? window.getActiveMultiplayerMode() : null;
    if (!st.partyMeta[player][slot].customSpells) {
      st.partyMeta[player][slot].customSpells = buildDefaultCustomSpells(raceKey, st.partyBuilds[player][slot], '', gender);
    }
    st.teamLockedIn = false; if (st.builderConfirmedSlots?.[player]) delete st.builderConfirmedSlots[player][slot]; sfx('uiCursorMove');
    if (!stay) setPbTab('tech');   // C-1: a picked vessel goes straight to its techniques
    refresh();
  }
  function confirmSlot() { if (!st.builderConfirmedSlots) st.builderConfirmedSlots={}; if (!st.builderConfirmedSlots[player]) st.builderConfirmedSlots[player]={}; st.builderConfirmedSlots[player][slot]=true; let thunk=false; const _sl=window._ewStampLook||{}; if(!_sl.forgeOff && !_sl.quiet){ try{ thunk = typeof window.playDoorSfx==='function' && window.playDoorSfx('stamp',{volume:0.75})!==false; }catch(e){} } if(!thunk) sfx('uiButtonConfirm'); for (let ni=0;ni<teamSize;ni++){const nx=(slot+1+ni)%teamSize;if(!st.builderConfirmedSlots[player][nx]){setSlot(nx);break;}} refresh(); }
  function selectSlot(i) { setSlot(i); st.builderSelectedSlot=i; st.builderSelectedPlayer=player; sfx('uiCursorMove'); refresh(); }
  function doRandomize() { if (typeof window.randomizeUnitSlot==='function') window.randomizeUnitSlot(player,slot); if (st.builderConfirmedSlots?.[player]) delete st.builderConfirmedSlots[player][slot]; sfx('uiButtonConfirm'); refresh(); }
  function doRandomizeAll() { if (typeof window.randomizeParty==='function') window.randomizeParty(player); if (!st.builderConfirmedSlots) st.builderConfirmedSlots={}; st.builderConfirmedSlots[player]={}; for(let i=0;i<teamSize;i++) st.builderConfirmedSlots[player][i]=true; sfx('uiButtonConfirm'); refresh(); }
  function doDefaults() { st.builderConfirmedSlots={}; if (typeof window.defaultAllTeams==='function') window.defaultAllTeams();  const slotCap=typeof window.SPELL_SLOT_MAX!=='undefined'?window.SPELL_SLOT_MAX:6; [1,2].forEach(p=>{ if (!st.partyMeta[p]) st.partyMeta[p]=[]; for (let i=0;i<(st.partyBuilds[p]||[]).length;i++){ if (!st.partyMeta[p][i]) st.partyMeta[p][i]={}; const lo=st.loadouts?.[p]?.[i]; if (lo&&Array.isArray(lo.spells)&&lo.spells.filter(Boolean).length>0){ const _ids=lo.spells.filter(Boolean); st.partyMeta[p][i].customSpells=typeof window.trimSpellIdsToSlotBudget==='function'?window.trimSpellIdsToSlotBudget(_ids,st.partyBuilds[p][i]):_ids.slice(0,slotCap); }}}); refresh(); }
  function doBack() { if (typeof window.backToModeSelect==='function') window.backToModeSelect(); }
  function doStart() {
    // Block entering a match with a locked vessel on the local player's team.
    if (typeof window.isUnitUnlocked === 'function') {
      // Check the LOCAL player's team (the online guest builds team 2).
      const size = (st.partyBuilds?.[player] || []).length || teamSize;
      const lockedNames = [];
      for (let i = 0; i < size; i++) {
        const rk = st.partyMeta?.[player]?.[i]?.race || 'door agent';
        if (!window.isUnitUnlocked(rk)) {
          const lbl = (window.RACE_PROFILES?.[rk]?.label) || rk;
          if (lockedNames.indexOf(lbl) === -1) lockedNames.push(lbl);
        }
      }
      if (lockedNames.length) {
        try { sfx('uiError'); } catch (e) {}
        alert('Your team includes locked vessels: ' + lockedNames.join(', ') + '.\nUnlock them in the Shop or swap them out before starting.');
        return;
      }
    }
    /* ONE OF EACH: a sheet loaded from before the rule may still field a race twice */
    const _dups = pbDupRaces(pbTeamRaces());
    if (_dups.length) {
      try { sfx('uiError'); } catch (e) {}
      alert('Your team has the same unit more than once: ' + _dups.map(pbRaceName).join(', ') + '.\nA team fields one of each unit. Swap one out before starting.');
      return;
    }
    /* HOMOSAPIEN OUT: a sheet saved before the race left the roster */
    const _gone = pbGoneRaces(pbTeamRaces());
    if (_gone.length) {
      try { sfx('uiError'); } catch (e) {}
      alert('Your team has a unit that is out of the game: ' + _gone.map(pbRaceName).join(', ') + '.\nSwap it out before starting.');
      return;
    }
    if (typeof window.applyPartyBuild==='function') window.applyPartyBuild();
    if (st.teamLockedIn && typeof window.startMatch==='function') window.startMatch();
  }
  function handleNameChange(val) { if (!st.partyNames) st.partyNames={}; if (!st.partyNames[player]) st.partyNames[player]=[]; const v=String(val||'').trim().slice(0,18); st.partyNames[player][slot]=(typeof window.isGeneratedDefaultName==='function'&&window.isGeneratedDefaultName(v, st.partyBuilds?.[player]?.[slot], player, slot))?'':v; }
  function handleZodiacChange(val) { if (!st.partyMeta[player]) st.partyMeta[player]=[]; if (!st.partyMeta[player][slot]) st.partyMeta[player][slot]={}; st.partyMeta[player][slot].zodiac=val; refresh(); }
  function toggleSpell(spellId) { if (!spellId) return; if (!st.partyMeta[player]) st.partyMeta[player]=[]; if (!st.partyMeta[player][slot]) st.partyMeta[player][slot]={}; const slotCap=typeof window.SPELL_SLOT_MAX!=='undefined'?window.SPELL_SLOT_MAX:6; const m=st.partyMeta[player][slot]; if (!Array.isArray(m.customSpells)) m.customSpells=[]; const arr=m.customSpells,idx=arr.indexOf(spellId); if(idx>=0)arr.splice(idx,1);else{if(usedSpellSlots(arr)+spellIdSlotCost(spellId)>slotCap||pbSpUsed(arr)+pbSpCost(spellId)>pbSpMax()){sfx('uiError');return;}arr.push(spellId); if (typeof window.getSpellById==='function') pbPreview(window.getSpellById(spellId), { equip: true });} st.teamLockedIn=false; sfx('uiCursorMove'); refresh(); }
  function resetCustomSpells() { if (!st.partyMeta[player]) st.partyMeta[player]=[]; if (!st.partyMeta[player][slot]) st.partyMeta[player][slot]={};
    st.partyMeta[player][slot].customSpells = buildDefaultCustomSpells(unitRace, clsName, secJob, unitGender);
    delete st.partyMeta[player][slot].spellUpgrades;
    st.teamLockedIn=false; sfx('uiButtonConfirm'); refresh(); }
  function clearAllSpells() { if (!st.partyMeta[player]) st.partyMeta[player]=[]; if (!st.partyMeta[player][slot]) st.partyMeta[player][slot]={}; st.partyMeta[player][slot].customSpells=[]; delete st.partyMeta[player][slot].spellUpgrades; st.teamLockedIn=false; sfx('uiButtonConfirm'); refresh(); }
  function randomizeSpells() { if (!st.partyMeta[player]) st.partyMeta[player]=[]; if (!st.partyMeta[player][slot]) st.partyMeta[player][slot]={}; const slotCap=typeof window.SPELL_SLOT_MAX!=='undefined'?window.SPELL_SLOT_MAX:6;

    // a random legal kit (any tier, 7 slots, 16 SP — data.js buildTreeLegalLoadout over the race's families)
    if (typeof window.buildTreeLegalLoadout === 'function') {
      st.partyMeta[player][slot].customSpells = window.buildTreeLegalLoadout(unitRace, clsName, '', undefined, undefined, unitGender);
      st.partyMeta[player][slot].spellUpgrades = typeof window.buildRandomUpgrades === 'function' ? window.buildRandomUpgrades(unitRace, clsName, st.partyMeta[player][slot].customSpells) : {};   // THE UPGRADES (Phase 5)
    }
    st.teamLockedIn=false; sfx('uiButtonConfirm'); refresh(); }
  function setItemCount(itemKey, delta) {
    if (!st.loadouts[player]) st.loadouts[player] = [];
    if (!st.loadouts[player][slot]) st.loadouts[player][slot] = typeof window.emptyLoadout === 'function' ? window.emptyLoadout() : {};
    if (!st.loadouts[player][slot].items) st.loadouts[player][slot].items = {};
    const items = st.loadouts[player][slot].items;
    const rule = window.ITEM_RULES?.[itemKey];
    if (!rule) return;
    const maxSlots = window.CONFIG?.unitItemSlots || 3;
    const cur = items[itemKey] || 0;
    const totalUsed = Object.values(items).reduce((s,v)=>s+(v||0),0);
    let next = cur + delta;
    if (next < 0) next = 0;
    const cap = itemCapOf(itemKey, rule);
    if (next > cap) next = cap;
    if (delta > 0 && totalUsed >= maxSlots) { sfx('uiError'); return; }
    items[itemKey] = next;
    st.teamLockedIn = false; sfx('uiCursorMove'); refresh();
  }

  const mpMode = typeof window.getActiveMultiplayerMode === 'function' ? window.getActiveMultiplayerMode() : null;
  const isArena = false;
  /* THE RACK (the tier rework 2026-09-24; THE FAMILY TABS 2026-09-27): every unit picks from its pool — its families —
     one family tab at a time. unitTiers = pbTierCtx (the pool in parts, the tabs, the sealed set, the equipped list + its SP). */
  const useTree = !isArena && typeof window.unitSpellPoolParts === 'function';
  const unitUpsWish = st.partyMeta?.[player]?.[slot]?.spellUpgrades || null;   // THE UPGRADES (Phase 5): meta.spellUpgrades
  // THE FAMILY COLUMNS (2026-10-01): every family is on screen at once, so there is no open tab any more
  const unitTiers = React.useMemo(() => useTree ? pbTierCtx(unitRace, clsName, customSpells || [], unitUpsWish, null, unitGender) : null,
    [useTree, unitRace, unitGender, clsName, customSpells, unitUpsWish, _]);
  const [treeShake, setTreeShake] = React.useState(null);
  // THE BORROW window (an Adaptable kit): which tier's pool is open ('B0'–'B4' or null).
  const [flSocketPick, setFlSocketPick] = React.useState(null);
  const [flSocketFilt, setFlSocketFilt] = React.useState(PB_SOCKET_FILTER_EMPTY);
  // a fresh pool opens on ALL with no filters
  React.useEffect(() => { setFlSocketFilt(PB_SOCKET_FILTER_EMPTY); }, [flSocketPick]);
  // one-line reason for a refused click, shown in the tech bar for 1.6 s
  const [treeNote, setTreeNote] = React.useState(null);
  const treeNoteTimer = React.useRef(0);
  const flashTreeNote = (txt) => {
    setTreeNote(txt);
    if (treeNoteTimer.current) clearTimeout(treeNoteTimer.current);
    treeNoteTimer.current = setTimeout(() => setTreeNote(null), 1600);
  };
  React.useEffect(() => { setFlSocketPick(null); }, [player, slot, clsName, unitRace]);
  React.useEffect(() => () => { if (treeNoteTimer.current) clearTimeout(treeNoteTimer.current); }, []);
  const treeShakeTimer = React.useRef(null);
  React.useEffect(() => { setTechSel(null); setTechHover(null); setPreviewState(null); }, [player, slot, clsName, unitRace]);
  React.useEffect(() => {
    const cv = window.EWCharViewer;
    if (cv && typeof cv.onState === 'function') cv.onState((ps) => setPreviewState(ps && ps.playing ? ps : null));
    return () => {
      if (cv && typeof cv.onState === 'function') cv.onState(null);
      if (previewHoverTimer.current) clearTimeout(previewHoverTimer.current);
      if (previewNoteTimer.current) clearTimeout(previewNoteTimer.current);
    };
  }, []);
  /* THE MONITOR REACTS (plan §5.3 item 5): the effects layer's post grade,
     aberration kick, screen flash and board shake reach the builder through
     EWCharViewer.onStageFx while a preview runs on the stage. `data-grade`
     = the technique's damage type (the six ENTROPY STRIKE palettes,
     styles-base.css), `--pb-grade-amt` = the beat's strength; 'kick' rolls
     a scanline band down the glass, 'shake' jolts the whole glass. */
  React.useEffect(() => {
    const cv = window.EWCharViewer;
    if (!cv || typeof cv.onStageFx !== 'function') return undefined;
    const retrig = (el, cls, ms) => {
      el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
      setTimeout(() => { if (el.classList.contains(cls)) el.classList.remove(cls); }, ms);
    };
    cv.onStageFx((kind, o) => {
      const el = crtRef.current;
      if (!el) return;
      o = o || {};
      if (kind === 'grade' || kind === 'flash') {
        const sp = previewSpellRef.current;
        const type = (sp && sp.spellType) || 'anomaly';
        const amt = kind === 'flash'
          ? Math.min(1, (o.peak != null ? o.peak : 0.3) * 1.6)
          : Math.min(1, (o.tintAmt != null ? o.tintAmt : 0.5) + (o.dim || 0) * 0.5);
        const hold = kind === 'flash' ? (o.ms || 180) : ((o.riseMs || 0) + (o.holdMs || 400));
        el.setAttribute('data-grade', type);
        el.style.setProperty('--pb-grade-amt', Math.max(0.15, amt).toFixed(2));
        if (gradeTimer.current) clearTimeout(gradeTimer.current);
        gradeTimer.current = setTimeout(() => { gradeTimer.current = 0; el.removeAttribute('data-grade'); }, hold);
      } else if (kind === 'kick') retrig(el, 'pb-crt-roll-on', 520);
      else if (kind === 'shake') retrig(el, 'pb-crt-jolt', 420);
    });
    return () => {
      cv.onStageFx(null);
      if (gradeTimer.current) { clearTimeout(gradeTimer.current); gradeTimer.current = 0; }
    };
  }, []);
  /* NO STAND-INS (2026-10-05, mondo: "can we not have all the spells and their props loaded and ready to show?"): the
     builder loads the WHOLE spell library the moment it opens (ThreeVFXEffects.warmSpellLibrary — the same promise the
     battle's loading card waits on, so nothing is fetched twice) and every vessel model on both rosters
     (ThreeRenderer.preloadUnitModels — the stage and the board share its cache). A preview asked for before the library
     has landed WAITS for it (the note says LOADING SPELLS) instead of playing with props missing; a hover just skips. */
  const [libProg, setLibProg] = React.useState(() => {
    const p = window.ThreeVFXEffects && window.ThreeVFXEffects.spellLibraryProgress ? window.ThreeVFXEffects.spellLibraryProgress() : null;
    return p ? { d: p.done, t: p.total, ok: !!p.finished } : { d: 0, t: 0, ok: false };
  });
  const libOkRef = React.useRef(libProg.ok);
  React.useEffect(() => {
    let alive = true;
    const fx = window.ThreeVFXEffects;
    if (!fx || typeof fx.warmSpellLibrary !== 'function') { libOkRef.current = true; setLibProg({ d: 0, t: 0, ok: true }); return undefined; }
    fx.warmSpellLibrary((d, t) => { if (alive) setLibProg(prev => (prev.d === d && prev.t === t) ? prev : { d, t, ok: prev.ok }); })
      .then(() => { libOkRef.current = true; if (alive) setLibProg(prev => ({ d: prev.t, t: prev.t, ok: true })); });
    return () => { alive = false; };
  }, []);
  React.useEffect(() => {
    try {
      if (typeof ThreeRenderer === 'undefined' || typeof ThreeRenderer.preloadUnitModels !== 'function' || typeof window.resolveIdentityForBuild !== 'function') return;
      const units = [];
      [1, 2].forEach(pn => (st.partyBuilds && st.partyBuilds[pn] || []).forEach((cn, i) => {
        const mt = (st.partyMeta && st.partyMeta[pn] && st.partyMeta[pn][i]) || {};
        const id = window.resolveIdentityForBuild(cn, mt) || {};
        if (id.race) units.push({ race: id.race, gender: id.gender || mt.gender || 'male', appearance: mt.appearance || null });
      }));
      if (units.length) ThreeRenderer.preloadUnitModels(units);
    } catch (e) {}
  }, [JSON.stringify(st.partyBuilds || null), JSON.stringify(st.partyMeta || null)]);
  const libWait = (fire, opts) => {
    if (libOkRef.current) { fire(); return; }
    if (opts && opts.hover) return;
    const fx = window.ThreeVFXEffects;
    pbNote('LOADING SPELLS ' + (libProg.t ? (libProg.d + ' / ' + libProg.t) : '…'));
    fx.warmSpellLibrary().then(() => { libOkRef.current = true; fire(); });
  };
  /* MOVE PREVIEW triggers (plan §5.2 item 6). previewOff: the pause-menu
     Animation toggle or the kill-switch. pbPreview(spOrNull, opts): null =
     the basic attack (root). Hover = after a 180 ms debounce and only when
     idle; click / equip / pick = immediately, restarting any running clip.
     Sprite-only vessels get the NO PREVIEW note instead.
     Stage 3 (§5.3): EVERY trigger — hover, click, equip, ENTER, ▶ — runs
     the animation PLUS the spell's real VFX around the hero
     (EWCharViewer.previewSpell — the effects layer staged in the viewer,
     the hero charging / dashing / blinking when the spell moves it, the
     camera pulled out to hold the whole beat; never the relayed
     VFX3D.fire). Decision C-10 was overruled by the user on 2026-09-09
     ("the vfx always play with the animation"); hover still never cuts a
     beat already running. `opts.equip` adds the DOOR click.
     window.EW_NO_PB_VFX = the Stage 2 animation-only preview. */
  const previewOff = !!(st.animationsDisabled || window.EW_NO_PB_PREVIEW);
  const pbNote = (txt) => {
    setPreviewNote(txt);
    if (previewNoteTimer.current) clearTimeout(previewNoteTimer.current);
    previewNoteTimer.current = setTimeout(() => setPreviewNote(null), 1400);
  };
  const pbPreview = (sp, opts) => {
    opts = opts || {};
    if (previewHoverTimer.current) { clearTimeout(previewHoverTimer.current); previewHoverTimer.current = 0; }
    if (previewOff) { if (!opts.hover) pbNote('PREVIEW OFF'); return; }
    const cv = window.EWCharViewer;
    if (!cv || typeof cv.playSpell !== 'function') return;
    const fire = () => {
      if (!cv.isMounted || !cv.isMounted()) return;
      if (opts.hover && cv.isPlaying && cv.isPlaying()) return;   // hover never cuts a running clip
      previewSpellRef.current = sp || null;
      const stageOn = typeof cv.previewSpell === 'function' && !window.EW_NO_PB_VFX;
      const ms = stageOn
        ? cv.previewSpell(sp, { attack: !sp, name: sp ? sp.name : 'BASIC ATTACK' })
        : cv.playSpell(sp, { attack: !sp, name: sp ? sp.name : 'BASIC ATTACK' });
      if (!ms && !opts.hover) pbNote(cv.hasClips && cv.hasClips() ? 'NO CLIP FOR THIS TECHNIQUE' : 'NO PREVIEW · SPRITE VESSEL');
      if (ms && opts.equip) { try { if (typeof window.playDoorSfx === 'function') window.playDoorSfx('crtOn', { volume: 0.3 }); } catch (e) {} }
    };
    if (opts.hover) previewHoverTimer.current = setTimeout(() => { previewHoverTimer.current = 0; libWait(fire, opts); }, 180);
    else libWait(fire, opts);
  };
  /* THE FINISHER's preview (2026-09-19): the execution on the stage —
     EWCharViewer.previewFinisher (the charged cast + VFX3D.stage.finisher).
     The same triggers as pbPreview: hover (debounced, idle only), click /
     ENTER / SPACE / ▶ at once. */
  const pbPreviewFinisher = (opts) => {
    opts = opts || {};
    const fin = pbFinisherDef(unitRace, unitGender);
    if (previewHoverTimer.current) { clearTimeout(previewHoverTimer.current); previewHoverTimer.current = 0; }
    if (!fin) return;
    if (previewOff) { if (!opts.hover) pbNote('PREVIEW OFF'); return; }
    const cv = window.EWCharViewer;
    if (!cv || typeof cv.previewFinisher !== 'function') { if (!opts.hover) pbNote('NO STAGE FOR THE FINISHER'); return; }
    const fire = () => {
      if (!cv.isMounted || !cv.isMounted()) return;
      if (opts.hover && cv.isPlaying && cv.isPlaying()) return;
      previewSpellRef.current = null;
      const ms = cv.previewFinisher(fin, { name: 'FINISHER · ' + String(fin.name || '').toUpperCase(), victim: 'THE DUMMY' });
      if (!ms && !opts.hover) pbNote(cv.hasClips && cv.hasClips() ? 'NO STAGE FOR THE FINISHER' : 'NO PREVIEW · SPRITE VESSEL');
      if (ms && !opts.hover) { try { if (typeof window.playDoorSfx === 'function') window.playDoorSfx('crtOn', { volume: 0.3 }); } catch (e) {} }
    };
    if (opts.hover) previewHoverTimer.current = setTimeout(() => { previewHoverTimer.current = 0; fire(); }, 180);
    else fire();
  };
  const shakeTreeNode = (key) => {
    setTreeShake(key);
    if (treeShakeTimer.current) clearTimeout(treeShakeTimer.current);
    treeShakeTimer.current = setTimeout(() => setTreeShake(null), 350);
  };
  /* THE RACK's click (2026-09-24): an equipped spell unequips (only it — no
     cascade); any other spell equips when data.js spellAddVerdict allows it
     (a free slot, enough SP, not sealed) — else the bar says why. */
  function tierSpellClick(id) {
    if (!unitTiers || !id) return;
    if (unitTiers.inherent && unitTiers.inherent.has(id)) return;   // THE ALWAYS-KNOWN COLUMN: never a slot
    if (!st.partyMeta[player]) st.partyMeta[player] = [];
    if (!st.partyMeta[player][slot]) st.partyMeta[player][slot] = {};
    const m = st.partyMeta[player][slot];
    if (!Array.isArray(m.customSpells)) m.customSpells = [];
    const arr = m.customSpells;
    const cost = pbSpCost(id);
    if (arr.includes(id)) {
      m.customSpells = arr.filter(s => s !== id);
      const upBack = (unitTiers.ups && unitTiers.ups[id] && typeof window.spellUpgradesSpOf === 'function') ? window.spellUpgradesSpOf(unitTiers.ups, id) : 0;
      if (m.spellUpgrades && m.spellUpgrades[id]) delete m.spellUpgrades[id];   // its upgrades leave with it (Phase 5)
      flashTreeNote('UNEQUIPPED · +' + (cost + upBack) + ' SP BACK');
    } else {
      const v = pbSpellVerdict(unitTiers, id);
      if (!v || !v.ok) { flashTreeNote((v && v.note) || 'NOT A LEGAL PICK'); sfx('uiError'); shakeTreeNode(id); return; }
      arr.push(id);
      const spNow = typeof window.getSpellById === 'function' ? window.getSpellById(id) : null;
      if (spNow && spNow.kind !== 'passive') pbPreview(spNow, { equip: true });      // the equip plays the cast (+ its VFX, §5.3); a passive row is never cast
    }
    st.teamLockedIn = false; sfx('uiCursorMove'); refresh();
  }
  /* ⚙ THE UPGRADES (SPELL_LIBRARY_PLAN.md §6.3, Phase 5): a toggle in the technique panel — on → off gives its SP back;
     off → on when data.js spellUpgradeVerdict allows (equipped, allowed, ≤ 2, one of a kind, the SP) — else the bar says why.
     The map lives in meta.spellUpgrades beside customSpells (party-config, saves and the last party carry it). */
  function tierUpgradeClick(spellId, upId) {
    if (!unitTiers || !spellId || !upId) return;
    if (!st.partyMeta[player]) st.partyMeta[player] = [];
    if (!st.partyMeta[player][slot]) st.partyMeta[player][slot] = {};
    const m = st.partyMeta[player][slot];
    const eff = Object.assign({}, unitTiers.ups || {});
    const cur = (eff[spellId] || []).slice();
    const row = (window.SPELL_UPGRADES || {})[upId] || {};
    if (cur.includes(upId)) {
      eff[spellId] = cur.filter(u => u !== upId && !((window.SPELL_UPGRADES || {})[u] && window.SPELL_UPGRADES[u].after === upId));   // +1 off takes +2 with it
      if (!eff[spellId].length) delete eff[spellId];
      flashTreeNote('UPGRADE OFF · ' + String(row.name || upId).toUpperCase() + ' · +' + window.spellUpgradeSp(upId) + ' SP BACK');
    } else {
      const v = window.spellUpgradeVerdict(unitRace, clsName, unitTiers.equipped, unitTiers.ups, spellId, upId);
      if (!v.ok) { flashTreeNote(v.note || 'NOT ALLOWED'); sfx('uiError'); return; }
      eff[spellId] = cur.concat([upId]);
      flashTreeNote('UPGRADED · ' + String(row.name || upId).toUpperCase() + ' · ' + v.need + ' SP');
    }
    m.spellUpgrades = eff;
    st.teamLockedIn = false; sfx('uiCursorMove'); refresh();
  }
  // The rack's hover: the technique panel follows it, the SP meter + pips
  // forecast it, the stage previews it.
  const treeNodeHoverIn = (key, sp, e) => {
    setTechHover(key);
    if (key === PB_FIN_KEY) { pbPreviewFinisher({ hover: true }); return; }
    if ((sp && sp.kind !== 'passive') || key === 'root') pbPreview(sp || null, { hover: true });
  };
  const treeNodeHoverOut = () => {
    setTechHover(null);
    if (previewHoverTimer.current) { clearTimeout(previewHoverTimer.current); previewHoverTimer.current = 0; }
  };
  /* THE BORROW (an Adaptable kit): ＋ BROWSE on the BORROW tab opens the window; picking a spell equips it through the
     same verdict. */
  function flEquipWildcard(spellId) {
    if (!spellId || !unitTiers) return;
    if (!st.partyMeta[player]) st.partyMeta[player] = [];
    if (!st.partyMeta[player][slot]) st.partyMeta[player][slot] = {};
    const m = st.partyMeta[player][slot];
    if (!Array.isArray(m.customSpells)) m.customSpells = [];
    const v = pbSpellVerdict(unitTiers, spellId);
    if (!v || !v.ok) { flashTreeNote((v && v.note) || 'NOT A LEGAL PICK'); sfx('uiError'); return; }
    m.customSpells.push(spellId);
    setFlSocketPick(null);
    hideSpellTip();
    if (typeof window.getSpellById === 'function') pbPreview(window.getSpellById(spellId), { equip: true });
    st.teamLockedIn = false; sfx('uiCursorMove'); refresh();
  }
  /* THE BORROW POOL — family by family since Phase 7 (data.js spellFamilyGroups; each sp carries _famKey for the headers);
     'B0' = every tier (the rack by family), 'B1'–'B4' = one tier (the rack by tier) */
  const flSocketPool = React.useMemo(() => {
    if (!flSocketPick || !unitTiers || !unitTiers.borrows) return [];
    const t = +String(flSocketPick).slice(1);
    const ids = unitTiers.parts.borrowRace.filter(id => {
      const sp = typeof window.getSpellById === 'function' ? window.getSpellById(id) : null;
      return sp && (!t || pbTierOf(sp) === t) && clashSpellOk(sp);
    });
    const groups = typeof window.spellFamilyGroups === 'function' ? window.spellFamilyGroups(ids, null) : [{ fam: null, name: '', ids }];
    const out = [];
    for (const g of groups) for (const id of g.ids) { const sp = window.getSpellById(id); if (sp) out.push({ sp, fam: g.fam || '', famName: g.name, famGlyph: g.glyph, famColor: g.color }); }
    return out;
  }, [flSocketPick, unitTiers, _]);
  const spellPool = [];   // the flat-pool fallback's library read went with the jobs (2026-09-27) — the rack is the pool

  const numerals = ['I','II','III','IV','V','VI','VII','VIII'];
  const unitName = resolveUnitName(player, slot, clsName);
  const unitCustomName = customUnitName(player, slot);
  const allItemKeys = (typeof window.ITEM_RULES!=='undefined' ? Object.keys(window.ITEM_RULES) : [])
    .filter(k => !(window.ITEM_RULES[k] && window.ITEM_RULES[k].fieldOnly))   // THE BAG (2026-09-20): a field-only item is the pause menu's, never a battle slot's
    .filter(k => !(window.ITEM_RULES[k] && window.ITEM_RULES[k].story))   // THE ONE-WAY DOOR (CAPTURE_PLAN.md §3.1): a story-only capture door is never a forge slot
    .filter(k => k !== 'warpStone' || !(typeof window._isClashMode === 'function' && window._isClashMode()));
  const itemSlotMax = window.CONFIG?.unitItemSlots || 3;
  const totalItemsUsed = Object.values(unitItems).reduce((s,v)=>s+(v||0),0);
  // Item counts expanded into per-slot units for the RPG-style slot squares.
  const itemUnits = [];
  for (const k of allItemKeys) { const c = unitItems[k] || 0; for (let n = 0; n < c && itemUnits.length < itemSlotMax; n++) itemUnits.push(k); }
  const spellSlotsUsed = learnedSpells.reduce((s, sp) => s + spellSlotCost(sp), 0);
  const zodiacs = typeof window.AVAILABLE_ZODIACS!=='undefined' ? window.AVAILABLE_ZODIACS : ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
  const codexLore = getCodexLore(unitRace, unitGender);
  const raceClass = pbRaceClass(unitRace);
  const classLabel = CODEX_CLASS_LABELS[raceClass] || 'MULTI-ROLE';
  const slotCap = typeof window.SPELL_SLOT_MAX !== 'undefined' ? window.SPELL_SLOT_MAX : 7;
  const docNum = 'EW-' + (Math.abs((unitRace||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0)*7)%9000+1000);

  /* ══ THE FORGE TERMINAL — one CRT monitor, four tabs, the party as a row
     (PARTY_BUILDER_PLAN §4 anatomy, §5.1 Stage 1). Chrome = the match-select
     `.ms-crt` classes (styles-base.css "THE TERMINAL"), the forge's own
     overrides live in "THE FORGE TERMINAL" (`.ms-crt-forge`, `.pb-*`).
     The STAGE (the hero) is rendered ONCE with a stable key and placed by
     grid-area — EWCharViewer is a singleton canvas and must never remount
     when a tab changes. ══ */
  const raceLabelTxt = _grl(unitRace, identity.gender) || unitRace;
  const officer = pbOfficer();
  const anyWindow = !!(equipPicker || showTeamModal || teamPick || pbMenu || notesOpen || (flSocketPick && unitTiers && unitTiers.borrows));
  // the wall's hover → the stage (Stage 4); cleared on leave, on a pick and off the ROSTER tab
  const rosterHoverIn = (entry) => {
    if (rosterHoverTimer.current) clearTimeout(rosterHoverTimer.current);
    rosterHoverTimer.current = setTimeout(() => { rosterHoverTimer.current = 0; setRosterHover(entry); }, 220);
  };
  const rosterHoverOut = () => {
    if (rosterHoverTimer.current) { clearTimeout(rosterHoverTimer.current); rosterHoverTimer.current = 0; }
    setRosterHover(null);
  };
  React.useEffect(() => { if (pbTab !== 'roster' && rosterHover) rosterHoverOut(); }, [pbTab]);
  React.useEffect(() => () => { if (rosterHoverTimer.current) clearTimeout(rosterHoverTimer.current); }, []);
  const stageEntry = (pbTab === 'roster' && rosterHover) ? rosterHover : null;
  const stageRace = stageEntry ? stageEntry.race : unitRace;
  const stageGender = stageEntry ? (stageEntry.gender || 'male') : (identity.gender || 'male');
  const stageCls = stageEntry ? stageEntry.cls : clsName;
  const stageLabel = stageEntry ? (stageEntry.label || _grl(stageEntry.race, stageEntry.gender)) : raceLabelTxt;
  const closeWindows = () => { setEquipPicker(null); setShowTeamModal(false); setTeamPick(null); setFlSocketPick(null); setPbMenu(null); setNotesOpen(false); hideSpellTip(); };
  const selectPlayer = (p) => { if (p === player) return; st.builderSelectedPlayer = p; st.builderSelectedSlot = 0; setSlot(0); sfx('uiCursorMove'); refresh(); };
  const backOut = () => {
    if (standalone) {
      if (tbView === 'locker') { if (typeof window._teamBuilderBack === 'function') window._teamBuilderBack(); }
      else if (window._ewForgeReturn && typeof window._teamBuilderBack === 'function') window._teamBuilderBack();   // THE SQUAD DESK: back to the team pick
      else { setTbView('locker'); sfx('uiCursorMove'); refresh(); }
    } else doBack();
  };

  /* keyboard (plan §7): tabs, the row, ESC. Never while typing in a field. */
  React.useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      /* 2026-09-09 (found by playtest_builder.js): TWO forges can be mounted
         at once — the pre-match one sleeps in #builderOverlay under the
         title overlay while the standalone one is up in #teamBuilderPage
         (and the other way round). Each instance used to answer every key,
         so ESC in the archive backed the HIDDEN pre-match forge out to the
         match-select terminal. Only the instance on screen takes a key. */
      const root = crtRef.current;
      if (!root || !root.isConnected) return;
      if (standalone) { if (!root.closest('#teamBuilderPage.active')) return; }
      else {
        const so = document.getElementById('startOverlay');
        if (so && so.isConnected && !so.classList.contains('hidden') && getComputedStyle(so).display !== 'none') return;   // a title page is in front
        /* THE PAUSE BUG (mondo, 2026-09-30): the pre-match forge stays mounted in #builderOverlay through the battle, so ESC in a
           fight ran its BACK (backToModeSelect) under the pause menu — the battle ended and RESUME landed in the room. A battle
           owns ESC, and a forge that is not on screen never takes a key. */
        if (st.phase === 'battle' || root.getClientRects().length === 0) return;
      }
      const k = e.key;
      if (k === 'Escape') {
        e.preventDefault();
        if (anyWindow) closeWindows(); else backOut();
        return;
      }
      if (anyWindow || (standalone && tbView === 'locker')) return;
      const onButton = t && t.tagName === 'BUTTON';
      const circuitKeys = pbTab === 'tech' && !!unitTiers;   // the rack owns the arrows on TECHNIQUES (SHIFT+← → still walks the row)
      if (k === 'q' || k === 'Q' || k === '[') { e.preventDefault(); cycleTab(-1); }
      else if (k === 'e' || k === 'E' || k === ']') { e.preventDefault(); cycleTab(1); }
      else if (k >= '1' && k <= '4' && PB_TABS[+k - 1]) { e.preventDefault(); setTab(PB_TABS[+k - 1].id); }
      else if (circuitKeys && !e.shiftKey && (k === 'ArrowUp' || k === 'ArrowDown' || k === 'ArrowLeft' || k === 'ArrowRight')) {
        e.preventDefault();
        const dir = k === 'ArrowUp' ? 'up' : k === 'ArrowDown' ? 'down' : k === 'ArrowLeft' ? 'left' : 'right';
        const next = techSel ? pbTierStep(unitTiers, techSel, dir, unitFinisher) : pbTierGrid(unitTiers, unitFinisher)[0][0];
        if (next !== techSel) {
          setTechSel(next); setTechHover(null); sfx('uiCursorMove');
          const nsp = (next === 'root' || next === PB_FIN_KEY || PB_BORROW_RE.test(next)) ? null
            : (typeof window.getSpellById === 'function' ? window.getSpellById(next) : null);
          if (next === PB_FIN_KEY) pbPreviewFinisher({ hover: true });
          else if (nsp || next === 'root') pbPreview(nsp, { hover: true });
        }
      }
      else if (k === 'ArrowLeft') { e.preventDefault(); selectSlot((slot - 1 + teamSize) % teamSize); }
      else if (k === 'ArrowRight') { e.preventDefault(); selectSlot((slot + 1) % teamSize); }
      else if (circuitKeys && techSel && !onButton && k === 'Enter') { e.preventDefault(); techVerb(pbTechInfo(unitTiers, techSel, unitFinisher)); }
      else if (circuitKeys && techSel && k === 'Backspace') {
        e.preventDefault();
        if ((customSpells || []).includes(techSel)) tierSpellClick(techSel);
        else { flashTreeNote('NOTHING EQUIPPED HERE'); sfx('uiError'); }
      }
      else if (circuitKeys && !onButton && k === ' ') {
        e.preventDefault();
        const info = pbTechInfo(unitTiers, techHover || techSel, unitFinisher);
        if (info && info.st8 === 'finisher') pbPreviewFinisher();
        else if (info && info.st8 !== 'borrow') pbPreview(info.sp || null);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  /* THE TECHNIQUE PANEL's verb (plan §5.2 item 3): the same thing a click
     on the chip does — tierSpellClick / the borrow window. */
  const techVerb = (info) => {
    if (!info || !unitTiers) return;
    const { st8, key } = info;
    if (st8 === 'finisher') { pbPreviewFinisher(); return; }
    if (st8 === 'root') { pbPreview(null); return; }
    if (st8 === 'always') return;   // THE ALWAYS-KNOWN COLUMN: nothing to equip
    if (st8 === 'borrow') { if (unitTiers.borrows) { setFlSocketPick(key); sfx('uiCursorMove'); } return; }
    tierSpellClick(key);
  };
  const unitFinisher = pbFinisherDef(unitRace, unitGender);
  const techInfo = (useTree && unitTiers) ? pbTechInfo(unitTiers, techHover || techSel, unitFinisher) : null;
  // the forecast on the slot pips + the SP meter: +N under a hovered pick, −N under a hovered unequip
  const pipPend = techInfo && techInfo.st8 === 'ok' ? 1 : 0;
  const pipDrop = techInfo && techInfo.st8 === 'equipped' ? 1 : 0;
  const spMax = pbSpMax();
  const spUsedNow = unitTiers ? unitTiers.spUsed : pbSpUsed(customSpells || []);   // tier + upgrades (Phase 5)
  const spPend = pipPend ? techInfo.cost : 0;
  const spDrop = pipDrop ? techInfo.cost : 0;

  /* ── HEAD: one row — the seal + FORGE-1, the tabs (L1 / R1 caps), the mode · slots, ESC ── */
  const tabbar = h('div', { className: 'pb-tabbar' },
    h('button', { className: 'pb-tabcap', onClick: () => cycleTab(-1), title: 'Previous tab · Q or [' }, '◂ L1'),
    h('div', { className: 'pb-tabs', role: 'tablist' },
      ...PB_TABS.map((t, i) => h('button', { key: t.id, role: 'tab', 'aria-selected': t.id === pbTab,
        className: 'pb-tab' + (t.id === pbTab ? ' on' : ''), onClick: () => setTab(t.id), title: (t.hint || '') + ' · key ' + (i + 1) },
        h('i', null, String(i + 1)), t.label))),
    h('button', { className: 'pb-tabcap', onClick: () => cycleTab(1), title: 'Next tab · E or ]' }, 'R1 ▸'));
  const head = h('div', { className: 'ms-tty-head pb-head' },
    h(DoorSeal, { size: 20 }),
    h('b', null, 'ENTROPY WARS'),
    h('span', { className: 'ms-tty-sep' }, '·'), h('span', null, standalone ? 'SQUAD MANIFESTS' : 'FORGE-1'),
    tabbar,
    h('span', { className: 'pb-head-right' },
      h('span', null, teamSize + ' SLOTS · ' + (standalone ? 'TEAM ARCHIVE' : (mpMode?.label || 'BATTLE').toUpperCase())),
      h('span', { className: 'ms-tty-sep' }, '·'), h('span', { className: 'ms-tty-esc' }, 'ESC · BACK')));

  /* ── the pieces, moved into their tabs unchanged inside ── */
  // ROSTER: the Codex of Vessels — filter row + the wall
  /* ROSTER — THE WALL (Stage 4, §5.4): the champ-select grid. One flat
     wall (C-4) of square tiles with --pb-r corners — the 128×128 portrait
     when the vessel has one, else the sprite bottom-anchored — a
     ring on hover / active, the type dots, ★ favourite, 🔒 → the Shop.
     Filters as ROUND chips: six type discs, the SORT
     and JOB pills open glass windows (C-9: no native <select> on the
     glass), search is a pill input. filteredRoster / rosterEntries /
     pickRace / isLockedEntry / toggleFav are unchanged. Hover → the stage
     (rosterHoverIn). */
  const sortLabelTxt = sortKey === 'label' ? ('NAME ' + (sortDir === 'asc' ? 'A–Z' : 'Z–A')) : (statLabel(sortKey) + (sortDir === 'desc' ? ' ↓' : ' ↑'));
  const rosterMenu = pbMenu === 'sort'
    ? h(PbWindow, { title: 'SORT THE WALL', sub: sortLabelTxt, onClose: () => setPbMenu(null), zone: true, width: 300 },
        h('div', { className: 'pb-menu-list' },
          h('button', { key: 'la', className: 'pb-menu-row' + (sortKey === 'label' && sortDir === 'asc' ? ' on' : ''), onClick: () => { setSortKey('label'); setSortDir('asc'); setPbMenu(null); sfx('uiCursorMove'); } }, h('i', null, 'A'), 'NAME', h('small', null, 'A – Z')),
          h('button', { key: 'ld', className: 'pb-menu-row' + (sortKey === 'label' && sortDir === 'desc' ? ' on' : ''), onClick: () => { setSortKey('label'); setSortDir('desc'); setPbMenu(null); sfx('uiCursorMove'); } }, h('i', null, 'Z'), 'NAME', h('small', null, 'Z – A')),
          ...STAT_KEYS.map(k => [['desc', '↓'], ['asc', '↑']].map(([d, arrow]) =>
            h('button', { key: k + d, className: 'pb-menu-row' + (sortKey === k && sortDir === d ? ' on' : ''), onClick: () => { setSortKey(k); setSortDir(d); setPbMenu(null); sfx('uiCursorMove'); } },
              h('i', null, arrow), statLabel(k), h('small', null, d === 'desc' ? 'HIGHEST FIRST' : 'LOWEST FIRST')))).flat()))
    : null;
  const rosterPanel = h(React.Fragment, null,
    h('div', { className: 'pb-zone-head pb-wall-head' },
      h('b', null, 'Codex of Vessels'),
      h('span', { className: 'pb-wall-count' }, filteredRoster.length, ' / ', rosterEntries.length),
      DOOR && h('span', { className:'door-hdr-sub pb-wall-sub' }, 'D.O.O.R. RECORDS · ENTITY REGISTRY'),
      h('div', { style: { flex: 1 } }),
      h('input', { className: 'pb-pill-input', placeholder:'SEARCH…', value:rosterSearch, onChange:e=>setRosterSearch(e.target.value), 'aria-label': 'Search the wall' }),
      h('button', { className: 'pb-pill-btn' + (pbMenu === 'sort' ? ' on' : ''), onClick: () => setPbMenu(pbMenu === 'sort' ? null : 'sort'), title: 'Sort the wall' }, '⇅ ', sortLabelTxt),
      null),
    h('div', { className: 'pb-wall-filters' },
      h('span', { className: 'pb-wall-flabel' }, 'TYPE'),
      ...['human','alien','divine','unholy','tech','anomaly'].map(t => {
        const on = typeFilter === t, c = getTypeColor(t);
        const has = availableTypes.includes(t);
        return h('button', { key: t, className: 'pb-type-disc' + (on ? ' on' : '') + (has ? '' : ' none'), style: { '--tc': c }, disabled: !has,
          onClick: () => setTypeFilter(on ? null : t), title: t.toUpperCase() + (has ? '' : ' — none on the wall') }, PB_TYPE_GLYPH[t] || t.slice(0, 2).toUpperCase());
      }),
      (typeFilter || rosterSearch) ? h('button', { className: 'pb-pill-btn danger', onClick: () => { setTypeFilter(null); setRosterSearch(''); }, title: 'Clear every filter' }, '✕ CLEAR') : null),
    h('div', { className: 'pb-roster', onMouseLeave: rosterHoverOut },
      filteredRoster.map((entry, ei) => {
        const isActive = entry.race===unitRace && entry.gender===(identity.gender||'male') && (entry.race!=='homosapien'||entry.cls===clsName);
        const entryFc = PB_ACCENT;
        const starred = isFav(entry.race, entry.gender);
        // Account-unlock gate: only the local human's roster (player 1) is restricted.
        const locked = isLockedEntry(entry.race);
        const taken = !locked && pbRaceTakenElsewhere(entry.race, slot);   // ONE OF EACH: another slot already fields this race
        const onCardClick = locked
          ? ()=>{ try{ sfx('uiError'); }catch(e){} if (typeof window._goToShop==='function') window._goToShop(entry.race); }
          : ()=>{ rosterHoverOut(); pickRace(entry.race,entry.gender); };
        const pUrl = (typeof window.getUnitPortraitUrl === 'function') ? window.getUnitPortraitUrl({ race: entry.race, gender: entry.gender }) : null;
        const hovered = !!(rosterHover && rosterHover.race === entry.race && rosterHover.gender === entry.gender && rosterHover.cls === entry.cls);
        return h('div', { key:ei, onClick:onCardClick, onMouseEnter: () => rosterHoverIn(entry), title: locked?'NOT DECLASSIFIED — unlock this vessel in the Shop':taken?`${entry.label} is already on this team — one of each unit`:`${entry.label} · ${pbRoleLabel(entry.race)}`,
            className:'pb-rtile'+(locked?' locked':'')+(taken?' taken':'')+(isActive?' on':'')+(hovered?' hover':''), style:{ '--fc': entryFc } },
          h('div', { className: 'pb-rtile-art' + (pUrl ? ' portrait' : '') },
            pUrl ? h('div', { className: 'pb-rtile-portrait', style: { backgroundImage: `url('${pUrl}')` } })
                 : h(Sprite, { race:entry.race, gender:entry.gender, cls:entry.cls, size:'88%', style:{ width:'88%', height:'88%' } }),
            locked ? h('div', { className: 'pb-rtile-lock' }, '🔒') : null,
            taken ? h('div', { className: 'pb-rtile-taken' }, 'ON TEAM') : null,
            !locked ? h('button', { className: 'pb-rtile-star' + (starred ? ' on' : ''), onClick:e=>{e.stopPropagation();toggleFav(entry.race,entry.gender);}, title: starred ? 'Unfavourite' : 'Favourite' }, starred ? '★' : '☆') : null,
            h('div', { className: 'pb-rtile-types' }, ...(entry.types || []).slice(0, 3).map((t, ti) => h('i', { key: ti, style: { background: getTypeColor(t) }, title: String(t).toUpperCase() })))),
          h('div', { className: 'pb-rtile-name' }, entry.label),
          h('div', { className: 'pb-rtile-job' }, pbRoleLabel(entry.race)));
      })),
    rosterMenu);

  // TECHNIQUES: the abilities head, the tree (or the rack + flat pool fallback), the node picker
  const techPanel = h(React.Fragment, null,
    // one bar: the tab's name, the slot pips, the three tools — nothing else
    h('div', { className: 'pb-tech-bar' },
      h('b', null, 'TECHNIQUES'),
      h('span', { className: 'pb-pips' + (spellSlotsUsed > slotCap ? ' over' : ''), title: spellSlotsUsed + ' of ' + slotCap + ' slots filled' },
        ...Array.from({ length: Math.max(slotCap, spellSlotsUsed, spellSlotsUsed + pipPend) }).map((_, i) => h('i', { key: i,
          className: i < spellSlotsUsed ? ('on' + (pipDrop && i >= spellSlotsUsed - pipDrop ? ' drop' : ''))
            : (pipPend && i < spellSlotsUsed + pipPend ? ('pend' + (i >= slotCap ? ' over' : '')) : '') })),
        h('small', { className: pipPend && spellSlotsUsed + pipPend > slotCap ? 'over' : '' },
          (pipPend ? (spellSlotsUsed + '+' + pipPend + '/' + slotCap) : pipDrop ? (spellSlotsUsed + '−' + pipDrop + '/' + slotCap) : (spellSlotsUsed + '/' + slotCap)) + ' SLOTS')),
      // THE SP METER (2026-09-24): one cell per Spell Point — spent · the hovered pick (+N) · the hovered unequip (−N)
      useTree && h('span', { className: 'pb-sp' + (spUsedNow > spMax ? ' over' : ''), title: spUsedNow + ' of ' + spMax + ' Spell Points spent — each spell costs the SP on its card' },
        h('b', null, 'SP'),
        h('span', { className: 'pb-sp-cells' },
          ...Array.from({ length: Math.max(spMax, spUsedNow) }).map((_, i) => h('i', { key: i,
            className: i < spUsedNow ? ('on' + (spDrop && i >= spUsedNow - spDrop ? ' drop' : ''))
              : (spPend && i < spUsedNow + spPend ? ('pend' + (i >= spMax ? ' over' : '')) : '') }))),
        h('small', { className: spPend && spUsedNow + spPend > spMax ? 'over' : '' },
          spPend ? (spUsedNow + '+' + spPend + '/' + spMax) : spDrop ? (spUsedNow + '−' + spDrop + '/' + spMax) : (spUsedNow + '/' + spMax))),
      treeNote ? h('span', { className: 'pb-tree-note', key: treeNote }, treeNote)
        : (unitTiers && unitTiers.equipped.length >= unitTiers.cap) ? h('span', { className: 'pb-tech-hint' }, 'SLOTS FULL · CLICK AN EQUIPPED SPELL TO FREE ONE') : null,
      h('div', { style:{flex:1} }),
      // the loadout tools (2026-10-01, the user: "Where did the clear button for the spell slots?" — the bar had run out of
      // room and clipped RST + CLR; the bar wraps now and the three are spelled out)
      !isArena&&h('span', { className: 'pb-tech-tools' },
        h('button',{onClick:randomizeSpells,className:'pb-mini',title:'Random legal loadout'},'🎲 RANDOM'),
        h('button',{onClick:resetCustomSpells,className:'pb-mini',title:'The default loadout for this race'},'↺ DEFAULT'),
        h('button',{onClick:clearAllSpells,className:'pb-mini danger',disabled:!(customSpells||[]).length,title:'Take every spell off (empty all seven slots)'},'✕ CLEAR ALL'))),
    h('div', { className: 'pb-zone-body', style: { padding: '6px 4px 6px 2px' } },

      // ── equipped loadout: the flat-pool FALLBACK's slot rack (only when the
      //    tier fns are unavailable) — the tier rack draws its own loadout. ──
      !(useTree&&unitTiers)&&h('div', { className:'pbx-slotrack', style:{ maxHeight:'48%', overflow:'hidden' } },
        h('div', { className:'pbx-slotrack-head' },
          h('span', { style:{ fontSize:10, color:'#79d99a', letterSpacing:'0.16em', fontWeight:700 } }, '🔒 EQUIPPED — SPELL SLOTS'),
          h('span', { style:{ fontSize:9, color:EW.inkDim, letterSpacing:'0.06em', marginLeft:'auto' } }, spellSlotsUsed, ' / ', slotCap, ' SLOTS FILLED')),
        h('div', { className:'pbx-slotrack-body' },
        (()=>{
          const SLOT_H = 44, GAP = 3;   // battle-parity row height (.pbx-blade)
          let slotNo = 1;
          const rows = learnedSpells.map((sp, si) => {
            const sc = spellSlotCost(sp);
            const slotNums = [];
            for (let k = 0; k < sc; k++) slotNums.push(String(slotNo + k));
            slotNo += sc;
            const isRA = !!(raceAbilities.find(a => a.id && a.id === sp.id));
            const heightPx = sc * SLOT_H + (sc - 1) * GAP;
            return h(SpellBlade, { key: sp.id || si, sp, slotNums, heightPx, equippedSlot:true, raceAbility: isRA,
              onClick: !isArena ? ()=>toggleSpell(sp.id) : undefined,
              onHoverIn: e=>showSpellTip(sp, e), onHoverOut: hideSpellTip });
          });
          for (let si = spellSlotsUsed; si < slotCap; si++) rows.push(h(SpellBlade, { key:'empty-'+si, empty:true, slotNums:[String(si+1)], heightPx:SLOT_H }));
          if (spellSlotsUsed > slotCap) rows.push(h('div', { key:'overbudget', style:{ display:'flex', alignItems:'center', gap:4, padding:'3px 8px', margin:'0 6px 0 4px', background:'rgba(255,120,120,0.08)', borderLeft:'3px solid rgba(255,120,120,0.6)', fontSize:10, color:EW.bad } },
            h('span', { style:{flex:1} }, 'OVER BUDGET — remove spells (extras are dropped in battle)')));
          return rows;
        })())),

      // ── THE RACK (THE FAMILY TABS, 2026-09-27): the loadout, the family tabs, the open family, ALWAYS READY ──
      useTree&&unitTiers&&h(React.Fragment, null,
        h('div', { className: 'pb-circuit-scroll pb-circuit-cols', onMouseLeave: treeNodeHoverOut },
          h(SpellTierPanel, { ctx: unitTiers, fc, clsName,
            raceLabel: (typeof window.getRaceLabel === 'function' ? window.getRaceLabel(unitRace) : unitRace),
            onSpellClick: tierSpellClick, onUnequipSlot: tierSpellClick,
            onUpgradeOpen: () => { setTechHover(null); sfx('uiCursorMove'); },
            onBorrow: (key) => { setFlSocketPick(flSocketPick === key ? null : key); sfx('uiCursorMove'); },
            onNodeHoverIn: treeNodeHoverIn, onNodeHoverOut: treeNodeHoverOut, shakeKey: treeShake,
            selKey: techSel, hoverKey: techHover, onSelect: (key) => { setTechSel(key); },
            finisher: unitFinisher })),
        null),

      // ── flat pool — FALLBACK only (tree fns unavailable) ──
      (!useTree&&!isArena&&(spellPool.length>0||raceAbilities.length>0))&&h(React.Fragment, null,
        h('div', { style:{ display:'flex', alignItems:'center', gap:6, flexShrink:0, margin:'6px 6px 3px 10px', paddingTop:6, borderTop:`1px solid ${EW.panelEdge}` } },
          h('span', { style:{ fontSize:10, color:EW.inkMute, letterSpacing:'0.16em' } }, 'SPELL POOL'),
          h('span', { style:{ fontSize:9, color:`${fc}bb`, letterSpacing:'0.08em', textTransform:'uppercase' } }, pbRoleLabel(unitRace)),
          h('span', { style:{ fontSize:9, color:EW.inkDim, letterSpacing:'0.06em', marginLeft:'auto' } }, spellPool.length + raceAbilities.length, ' AVAILABLE · CLICK TO EQUIP')),
        h('div', { style:{ flex:1, minHeight:0, overflowY:'auto', display:'flex', flexDirection:'column', gap:3, paddingTop:2, paddingBottom:2 } },
          (()=>{
            // Build one sortable pool (race abilities + class spells), then
            // order by: fits-first → race abilities → category (damage first)
            // → power desc → name. Won't-fit spells sink to the bottom.
            const entries = [];
            raceAbilities.forEach((a, ai) => {
              const raId = a.id || `ra_${unitRace}_${ai}`;
              const selected = customSpells ? customSpells.includes(raId) : false;
              const cantFit = !selected && a.id && (spellSlotsUsed + spellIdSlotCost(a.id)) > slotCap;
              entries.push({ key:'ra-'+ai, sp:a, isRA:true, hasId:!!a.id, id:raId, selected, cantFit:!!cantFit });
            });
            spellPool.forEach(sp => {
              const selected = customSpells ? customSpells.includes(sp.id) : false;
              const cantFit = !selected && (spellSlotsUsed + spellSlotCost(sp)) > slotCap;
              entries.push({ key:sp.id, sp, isRA:false, hasId:true, id:sp.id, selected, cantFit:!!cantFit });
            });
            entries.sort((a, b) => {
              if (a.cantFit !== b.cantFit) return a.cantFit ? 1 : -1;   // dim → bottom
              if (a.isRA !== b.isRA) return a.isRA ? -1 : 1;            // race abilities lead
              const cr = pbCatRank(a.sp) - pbCatRank(b.sp);            // category buckets
              if (cr) return cr;
              const pw = pbPowerVal(b.sp) - pbPowerVal(a.sp);         // power desc
              if (pw) return pw;
              return (a.sp.name || '').localeCompare(b.sp.name || '');
            });
            const nodes = [];
            let dimHeaderShown = false;
            entries.forEach(en => {
              if (en.cantFit && !dimHeaderShown) {
                dimHeaderShown = true;
                nodes.push(h('div', { key:'dimhdr', style:{ display:'flex', alignItems:'center', gap:6, margin:'8px 9px 1px 10px', flexShrink:0, fontSize:8, letterSpacing:'0.12em', color:EW.inkDim, textTransform:'uppercase', whiteSpace:'nowrap' } },
                  h('span', null, "Won't fit remaining slots"),
                  h('span', { style:{ flex:1, height:1, background:EW.panelEdge } })));
              }
              nodes.push(h(SpellBlade, { key:en.key, sp:en.sp, pool: en.isRA ? !!en.hasId : true, raceAbility: en.isRA || undefined, equipped:en.selected, dim:en.cantFit,
                onClick: en.isRA ? (en.hasId && !isArena ? ()=>toggleSpell(en.id) : undefined) : ()=>toggleSpell(en.id),
                onHoverIn: e=>showSpellTip(en.sp, e), onHoverOut: hideSpellTip }));
            });
            return nodes;
          })())),

      isArena&&raceAbilities.length>0&&h('div',{style:{marginTop:3,borderTop:`1px solid ${EW.panelEdge}`,paddingTop:5,display:'flex',flexDirection:'column',gap:3}},
        h('span',{style:{fontSize:10,color:'rgba(200,180,150,0.6)',letterSpacing:'0.1em',marginBottom:1,paddingLeft:10}},'RACE ABILITIES'),
        raceAbilities.map((a,ai)=>h(SpellBlade,{key:ai,sp:a,raceAbility:true,onHoverIn:e=>showSpellTip(a,e),onHoverOut:hideSpellTip})))),

    // ── THE BORROW window: an Adaptable kit's ＋ BROWSE opens every spell of the families other races carry
    //    (tabs + filters + search; a row that would break the budget is dimmed and says why on click). ──
    (() => {
      if (!unitTiers) return null;
      const socketOpen = flSocketPick && unitTiers.borrows;
      if (!socketOpen) return null;
      const close = () => { setFlSocketPick(null); hideSpellTip(); };
      let title, sub, rows;
      {
        const bt = +String(flSocketPick).slice(1);   // 0 = every tier (the rack by family, Phase 7)
        title = '＋ BORROW · BY FAMILY';
        sub = (bt ? bt + ' SP EACH' : '1–4 SP') + ' · ANY OTHER RACE\'S FAMILY · ' + spUsedNow + '/' + spMax + ' SP · ' + (customSpells || []).length + '/' + slotCap + ' SLOTS';
        const F = flSocketFilt;
        // a family's name finds its members too (the search box)
        const famHit = (e, f) => !!(f.q && f.q.trim() && String(e.famName || '').toLowerCase().includes(f.q.trim().toLowerCase()));
        const match = (e, f) => pbSocketFilterMatch(e.sp, f) || (famHit(e, f) && pbSocketFilterMatch(e.sp, { ...f, q: '' }));
        const setF = (patch) => setFlSocketFilt(prev => ({ ...prev, ...patch }));
        // the tabs count within the OTHER filters, so a tab never lies
        const sansCat = { ...F, cat: 'all' };
        const tabCount = {};
        for (const e of flSocketPool) { if (!match(e, sansCat)) continue; const c = classifySpellLocal(e.sp); tabCount[c] = (tabCount[c] || 0) + 1; tabCount.all = (tabCount.all || 0) + 1; }
        const socketTiers = bt ? [] : ['I', 'II', 'III', 'IV'];   // one tier per window in the tier fold; the family fold filters by tier
        const poolTypes = new Set(flSocketPool.map(e => (e.sp.spellType || '').toLowerCase()));
        const shown = flSocketPool.filter(e => match(e, F));
        const filtOn = pbSocketFilterActive(F);
        const tabs = h('div', { className: 'pb-socket-tabs' },
          ...PB_SOCKET_TABS.map(t => {
            const n = tabCount[t.id] || 0;
            const cc = PB_CAT[t.id];
            return h('button', { key: t.id, className: 'pb-tab' + (F.cat === t.id ? ' on' : '') + (n ? '' : ' none'),
              style: cc ? { '--pb-fc': cc.color } : undefined,
              onClick: () => { setF({ cat: t.id }); sfx('uiCursorMove'); }, title: t.label + ' · ' + n },
              cc ? h('i', null, cc.icon) : null, t.label, h('em', null, n));
          }));
        const filters = h('div', { className: 'pb-wall-filters pb-socket-filters' },
          h('span', { className: 'pb-wall-flabel' }, 'DMG'),
          ...[['physical', 'PHYS', '#ff9a4a', 'Physical damage — scales with ATK, blocked by DEF'], ['magic', 'MAGIC', '#c58cff', 'Magic damage — scales with M ATK, blocked by M DEF']].map(([id, label, c, title]) =>
            h('button', { key: id, className: 'pb-ring-btn' + (F.dmg === id ? ' on' : ''), style: { '--fc': c },
              onClick: () => setF({ dmg: F.dmg === id ? null : id }), title }, label)),
          h('span', { className: 'pb-wall-fsep' }),
          h('span', { className: 'pb-wall-flabel' }, 'TYPE'),
          ...['human','alien','divine','unholy','tech','anomaly'].map(t => {
            const on = F.type === t, c = getTypeColor(t), has = poolTypes.has(t);
            return h('button', { key: t, className: 'pb-type-disc' + (on ? ' on' : '') + (has ? '' : ' none'), style: { '--tc': c }, disabled: !has,
              onClick: () => setF({ type: on ? null : t }), title: t.toUpperCase() + (has ? '' : ' — none in this pool') }, PB_TYPE_GLYPH[t] || t.slice(0, 2).toUpperCase());
          }),
          h('span', { className: 'pb-wall-fsep' }),
          h('span', { className: 'pb-wall-flabel' }, 'SHAPE'),
          ...PB_SOCKET_SHAPES.map(sh => h('button', { key: sh.id, className: 'pb-pill-btn' + (F.shape === sh.id ? ' on' : ''),
            onClick: () => setF({ shape: F.shape === sh.id ? null : sh.id }), title: sh.title }, sh.label)),
          socketTiers.length > 1 ? h('span', { className: 'pb-wall-fsep' }) : null,
          socketTiers.length > 1 ? h('span', { className: 'pb-wall-flabel' }, 'COST') : null,
          ...(socketTiers.length > 1 ? socketTiers : []).map((t, ti) => h('button', { key: t, className: 'pb-pill-btn' + (F.tier === t ? ' on' : ''),
            onClick: () => setF({ tier: F.tier === t ? null : t }), title: (ti + 1) + ' SP spells' }, (ti + 1) + ' SP')),
          h('span', { style: { flex: 1 } }),
          h('input', { className: 'pb-pill-input', placeholder: 'SEARCH…', value: F.q, onChange: e => setF({ q: e.target.value }), 'aria-label': 'Search the pool' }),
          filtOn ? h('button', { className: 'pb-pill-btn danger', onClick: () => setFlSocketFilt(PB_SOCKET_FILTER_EMPTY), title: 'Clear every filter' }, '✕ CLEAR') : null);
        sub += ' · ' + shown.length + ' / ' + flSocketPool.length;
        /* THE BORROW WINDOW BY FAMILY (Phase 7): a header per family (glyph · name · its count here), its members tier I → IV */
        const famCount = {};
        for (const e of shown) famCount[e.fam] = (famCount[e.fam] || 0) + 1;
        let lastFam = null;
        rows = [tabs, filters];
        for (const e of shown) {
          const sp = e.sp;
          if (e.fam !== lastFam) {
            lastFam = e.fam;
            rows.push(h('div', { key: 'fh-' + (e.fam || '_none'), className: 'pb-socket-fam', style: { '--fam': e.famColor || '#8a8270' } },
              h('b', null, e.famGlyph || '◇'), h('span', null, e.famName || 'Unsorted'), h('em', null, famCount[e.fam] || 0)));
          }
          const already = (customSpells || []).includes(sp.id);
          const v = already ? null : pbSpellVerdict(unitTiers, sp.id);
          const cantEquip = already || !v || !v.ok;
          rows.push(h(SpellBlade, { key: sp.id, sp, pool:true, equipped: already, dim: cantEquip && !already,
            onClick: () => flEquipWildcard(sp.id),
            onHoverIn: ev=>showSpellTip(sp, ev), onHoverOut: hideSpellTip }));
        }
        if (!shown.length) rows.push(h('div', { key: 'none', className: 'pb-socket-empty' }, 'NOTHING IN THIS POOL FITS THOSE FILTERS'));
      }
      return h(PbWindow, { title, sub, onClose: close, zone: true }, rows);
    })());

  // GEAR: gear circles · item circles · subclass · name · zodiac
  const gearPanel = h(React.Fragment, null,
    h('div', { className: 'pb-zone-head' },
      h('b', null, 'Gear'),
      h('span', { style:{ fontSize:9, color:EW.inkDim, letterSpacing:'0.14em', marginLeft:'auto' } }, totalItemsUsed, '/', itemSlotMax, ' ITEMS CARRIED')),
    h('div', { className: 'pb-zone-body pb-gear' },
      h('button', { className: 'ms-tty-btn primary', onClick: () => setCreatorOpen(true) }, 'CHARACTER CREATOR'),
      /* THE GEAR MERGE (SPELL_LIBRARY_PLAN.md Phase 4): gear is a passive row in the spell slots now — these boxes SHOW the
         equipped passive / gear rows (no cap since 2026-10-06: one more empty box than are on, up to the slots); a click opens TECHNIQUES. */
      (() => {
        const pasIds = (customSpells || []).filter(id => typeof window.spellIsPassive === 'function' && window.spellIsPassive(id));
        const _slots = typeof window.SPELL_SLOT_MAX === 'number' ? window.SPELL_SLOT_MAX : 7;
        const pasMax = Math.min(_slots, Math.max(2, pasIds.length + 1));
        return h('div', { className: 'pb-gear-row' },
          h('div', { className: 'pb-gear-label' }, 'GEAR', h('small', null, 'PASSIVES · IN THE RACK')),
          h('div', { className: 'pb-gear-slots' },
            Array.from({ length: pasMax }).map((_, gi) => {
              const gid = pasIds[gi];
              const sp = gid && typeof window.getSpellById === 'function' ? window.getSpellById(gid) : null;
              return h(EquipSlotBox, { key: 'pas' + gi, size:64, accent:fc,
                filled: !!sp, icon: sp ? (sp.icon || '◈') : null,
                label: sp ? sp.name : '', title: sp ? `${sp.name} — ${sp.desc || ''} · ${pbSpCost(sp)} SP` : 'Equip gear or a passive in TECHNIQUES (the Training and Gear columns: a slot + its SP)',
                onClick: () => { setTab('tech'); },
                onClear: sp ? () => tierSpellClick(gid) : null });
            })));
      })(),
      h('div', { className: 'pb-gear-row' },
        h('div', { className: 'pb-gear-label' }, 'ITEMS', h('small', null, itemSlotMax + ' SLOTS')),
        h('div', { className: 'pb-gear-slots' },
          Array.from({length:itemSlotMax}).map((_, ii) => {
            const ik = itemUnits[ii];
            const rule = ik ? window.ITEM_RULES?.[ik] : null;
            return h(EquipSlotBox, { key:ii, size:64, accent:fc,
              filled:!!rule, icon:rule ? (rule.icon||'\u{1F4E6}') : null,
              label:rule ? rule.name : '', title:rule ? `${rule.name} — ${rule.desc}` : 'Add an item',
              onClick:()=>{ setEquipPicker('item'); sfx('uiCursorMove'); },
              onClear:rule ? ()=>setItemCount(ik, -1) : null });
          }))),
      h('div', { className: 'pb-gear-row', style:{ marginTop: 6 } },
        h('div', { className: 'pb-gear-label' }, 'NAME', h('small', null, 'THE MANIFEST')),
        h('input', { key:player+'-'+slot+'-'+unitCustomName, className:'pb-gear-input', defaultValue:unitCustomName, placeholder:unitName, maxLength:18, onBlur:e=>{ handleNameChange(e.target.value); refresh(); }, onKeyDown:e=>{ if(e.key==='Enter') e.target.blur(); } })),
      // ZODIAC — a wheel of twelve round glyph chips (Stage 5, §5.5 item 4; handleZodiacChange as the <select> did)
      (() => {
        const cur = identity.zodiac || 'aries';
        const el = PB_ZODIAC_ELEMENT[cur] || 'air';
        const read = PB_ZODIAC_READ[el] || PB_ZODIAC_READ.air;
        const every = (typeof window.ZODIAC_ROTATION_ROUNDS === 'number' ? window.ZODIAC_ROTATION_ROUNDS : 5);
        return h('div', { className: 'pb-gear-row pb-zodiac-row' },
          h('div', { className: 'pb-gear-label' }, 'ZODIAC', h('small', null, 'THE SIGN')),
          h('div', { className: 'pb-zodiac' },
            h('div', { className: 'pb-zodiac-wheel', role: 'radiogroup', 'aria-label': 'Zodiac sign' },
              zodiacs.map(z => h('button', { key:z, className:'pb-zodiac-chip' + (z === cur ? ' on' : ''), style:{ '--el': PB_ZODIAC_ELEMENT[z] || 'air' }, 'data-el': PB_ZODIAC_ELEMENT[z] || 'air',
                title: z.charAt(0).toUpperCase() + z.slice(1) + ' · ' + (PB_ZODIAC_ELEMENT[z] || 'air') + ' sign', 'aria-pressed': z === cur,
                onClick:()=>{ if (z !== cur) { handleZodiacChange(z); sfx('uiCursorMove'); } } }, window.ZODIAC_ICONS?.[z] || z.slice(0, 2).toUpperCase()))),
            h('div', { className: 'pb-zodiac-read' },
              h('b', null, (window.ZODIAC_ICONS?.[cur] || ''), ' ', cur.toUpperCase(), h('span', null, ' · ', read.icon, ' ', el.toUpperCase(), ' SIGN')),
              h('span', null, 'WHEN ', cur.toUpperCase(), ' RULES THE SKY (', every, ' ROUNDS IN EVERY ', every * zodiacs.length, '): ', ((typeof window.zodiacSkySummary === 'function' && window.zodiacSkySummary(cur)) || 'NO CHANGE').toUpperCase()),
              (typeof window.zodiacNatalSummary === 'function' && window.zodiacNatalSummary(cur)) ? h('span', null, 'BORN UNDER ', cur.toUpperCase(), ': ', window.zodiacNatalSummary(cur).toUpperCase()) : null,
              h('span', null, read.line, ' · 50% HARDER UNDER ITS OWN SKY'))));
      })(),
      h('div', { style:{ marginTop:'auto', fontSize:8, color:EW.inkDim, letterSpacing:'0.1em', lineHeight:1.5, padding:'6px 2px 0' } },
        'GEAR AND ITEMS RIDE INTO THE CROSSING WITH THE VESSEL · THE SKY CYCLES THROUGH THE TWELVE SIGNS')));

  // DOSSIER: the D.O.O.R. customs file — same source as the codex (data.js
  // DOOR_TEXT: disposition, point of entry, annotation).
  const dossierPanel = (() => {
    const cs = typeof window.doorCustomsStatus === 'function' ? window.doorCustomsStatus(unitRace) : null;
    const poe = typeof window.doorPointOfEntry === 'function' ? window.doorPointOfEntry(unitRace) : null;
    const note = DOOR?.DOSSIER_NOTES?.[unitRace] || null;
    const tone = !cs ? null : cs.status === 'NON-CANON' ? 'void' : /^(UNDOCUMENTED|DISPUTED)$/.test(cs.status) ? 'deny' : 'admit';
    return h(React.Fragment, null,
      h('div', { className: 'pb-zone-head' },
        h('b', null, 'Dossier'),
        h('span', { style:{ fontSize:9, color:EW.inkMute, letterSpacing:'0.04em', padding:'2px 8px', border:`1px solid ${EW.panelEdge}`, borderRadius:999, background:'rgba(0,0,0,0.3)' } }, classLabel),
        h('span', { style:{ fontSize:8, color:EW.inkDim, letterSpacing:'0.04em' } }, docNum),
        cs && h('span', { className:'door-stamp door-stamp-sm' + (tone === 'admit' ? ' admit' : tone === 'void' ? ' void' : ''), style:{ fontSize:7, padding:'2px 5px 1px', marginLeft:'auto' }, title:'Customs disposition · point of entry: ' + (poe || '?') }, cs.status)),
      h('div', { className: 'pb-zone-body', style:{ overflowY:'auto', overflowX:'hidden', gap:6, padding:'10px 14px 10px 12px', position:'relative' } },
        DOOR && h('div', { className:'door-wm', style:{ right:'2%', top:'6%', width:'44%', aspectRatio:'1' } }),
        h('div', { style:{ fontFamily:'Cormorant SC, serif', fontSize:'clamp(18px,1.6vw,24px)', fontWeight:600, lineHeight:1.05, color:'#f1e9cf', position:'relative', zIndex:1 } }, raceLabelTxt),
        h('div', { style:{ fontSize:9, color:EW.inkDim, letterSpacing:'0.16em', position:'relative', zIndex:1 } }, pbRoleLabel(unitRace)),
        DOOR && h('div', { className:'door-file-h', style:{ position:'relative', zIndex:1, marginTop:4 } }, '1.  EXECUTIVE SUMMARY'),
        h('div', { style:{ fontSize:12, lineHeight:1.55, color:'#d3caae', fontFamily:'Cormorant SC, serif', fontStyle:'italic', borderLeft:`2px solid ${fc}55`, paddingLeft:8, position:'relative', zIndex:1 } }, codexLore),
        cs && h('div', { className:'door-file-h', style:{ position:'relative', zIndex:1, marginTop:2 } }, '2.  CUSTOMS DISPOSITION'),
        cs && h('div', { className:'door-file-p', style:{ fontSize:10.5, position:'relative', zIndex:1 } },
          h('b', { style:{ color:'#c9b98a', letterSpacing:'0.08em' } }, cs.status), cs.note ? ' — ' + cs.note : '',
          poe ? h('span', { style:{ display:'block', color:'#b6ad98', marginTop:2, letterSpacing:'0.06em' } }, 'POINT OF ENTRY · ' + poe) : null),
        note && h('div', { className:'door-file-h', style:{ position:'relative', zIndex:1, marginTop:2 } }, '3.  D.O.O.R. ANNOTATION'),
        note && h('div', { className:'door-file-p', style:{ fontSize:10.5, position:'relative', zIndex:1 } }, note),
        h('div', { style:{ fontSize:7, color:EW.inkDim, letterSpacing:'0.08em', paddingTop:6, marginTop:'auto', position:'relative', zIndex:1 } }, 'TOP SECRET // ████████ // NOFORN')));
  })();

  // Stage 5: the vessel's notes (the engine's passives + the hand-authored terrain rows)
  const unitNotes = pbUnitNotes(identity, clsName, unitEquipment, customSpells || []);
  const notePaper = 'yellow';

  // STATS column (every tab but ROSTER): identity, vitals, the sheet, footprints, the type chart, the elements
  const zMod = (mapped) => zodiacNatal ? ((zodiacNatal[mapped]||0) > 0 ? 'up' : (zodiacNatal[mapped]||0) < 0 ? 'dn' : null) : null;
  const statsPanel = h(React.Fragment, null,
    h('div', { className: 'pb-ident' },
      h('b', null, unitName),
      h('span', null, raceLabelTxt.toUpperCase(), ' · ', pbRoleLabel(unitRace),
        ''),
      h('div', { className: 'pb-ident-types' }, ...unitTypes.map((t,i)=>h(TypeChip,{key:i,type:t,size:9})))),
    h('div', { style:{ flex:1, minHeight:0, display:'flex', flexDirection:'column', gap:6, overflowY:'auto', overflowX:'hidden', paddingTop:4 } },
      h('div', { style:{ display:'flex', flexDirection:'column', gap:3, flexShrink:0, paddingBottom:6, marginBottom:2, borderBottom:`1px solid ${EW.panelEdge}` } },
        VITAL_KEYS.map(k => {
          const mapped = STAT_MAP[k], val = fullStats[mapped]??0;
          return h(VitalBar, { key:k, label:k, statKey:k, val, max:STAT_MAX_PB[k]||100, vital:k.toLowerCase(), zodiacMod:zMod(mapped), delta:statDeltas[mapped]??0,
            tip: window.STAT_HELP?.[mapped] || null, gradeKey: mapped });
        })),
      h('div', { style:{ display:'flex', flexDirection:'column', gap:2, flexShrink:0 } },
        BAR_KEYS.map(k => {
          const mapped = STAT_MAP[k], val = fullStats[mapped]??fullStats[k]??fullStats[k.toLowerCase()]??0;
          const d = statDeltas[mapped]??statDeltas[k]??statDeltas[k.toLowerCase()]??0;
          return h(StatBar, { key:k, label:statLabel(k), statKey:k, val, max:STAT_MAX_PB[k]||100, compact:true, zodiacMod:zMod(mapped), delta:d,
            suffix: STAT_PCT[k] ? '%' : pbVisMax(k, fullStats).suffix, tip: pbVisMax(k, fullStats).tip || window.STAT_HELP?.[mapped] || null, gradeKey: mapped });
        })),
      // MOVE / RANGE footprints — the diamonds ARE the rule's shape (§3.2), inside round badges
      h('div', { style:{ display:'flex', gap:14, justifyContent:'center', alignItems:'flex-start', flexShrink:0, paddingTop:2 } },
        h('div', { className:'pb-foot-badge' }, h(RangeDiamond, { radius: fullStats.move ?? 3, fill:'rgba(80,160,255,0.45)', edge:'rgba(80,160,255,0.7)', label:'MOVE', value: fullStats.move ?? 3, color:'rgba(120,180,255,0.9)', tip: window.STAT_HELP?.move })),
        h('div', { className:'pb-foot-badge' }, h(RangeDiamond, { radius: fullStats.range ?? 1, fill:'rgba(255,70,70,0.35)', edge:'rgba(255,70,70,0.6)', label:'RANGE', value: fullStats.range ?? 1, color:'rgba(255,120,120,0.9)', tip: window.STAT_HELP?.range }))),
      // TYPE CHART (Stage 5, §5.5 item 3): the six type discs, the incoming matchups for this vessel's own types
      h('div', { style:{ flexShrink:0, display:'flex', flexDirection:'column', gap:4, borderTop:`1px solid ${EW.panelEdge}`, paddingTop:5 } },
        h('div', { style:{ fontSize:9, color:fc, letterSpacing:'0.14em', fontWeight:600, flexShrink:0 } }, 'TYPE CHART'),
        h(PbAffinityRing, { types: unitTypes })),
      // ELEMENTS (rev 9): the elemental weakness / resistance layer under the type chart (RACE_ELEMENT_AFFINITY)
      h('div', { style:{ flexShrink:0, display:'flex', flexDirection:'column', gap:4, paddingTop:5 } },
        h('div', { style:{ fontSize:9, color:fc, letterSpacing:'0.14em', fontWeight:600, flexShrink:0 } }, 'ELEMENTS'),
        h(PbElementRing, { race: unitRace })),
));

  // ROSTER's quick read under the hero: name · race · role · types · four pills · CONFIRM.
  // It follows the hovered wall tile (stageEntry) like the hero does: that vessel's own types and base stats, no gear
  // deltas or zodiac arrows (those belong to the slot's unit); back to the selected unit when the hover ends.
  const qTypes = stageEntry ? (stageEntry.types || []) : unitTypes;
  const qStats = stageEntry ? computeFullStats(stageEntry.race, stageEntry.cls, null, []).final : fullStats;
  const quickCard = h('div', { className: 'pb-stage-card' },
    h('div', { style:{ display:'flex', alignItems:'baseline', gap:8, minWidth:0 } },
      h('span', { style:{ fontFamily:'Cormorant SC, serif', fontSize:15, fontWeight:600, color:'#f1e9cf', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', minWidth:0 } }, stageEntry ? stageLabel : unitName),
      h('span', { style:{ fontSize:8, color:EW.inkDim, letterSpacing:'0.14em', flexShrink:0, textTransform:'uppercase' } }, pbRoleLabel(stageEntry ? stageEntry.race : unitRace))),
    h('div', { style:{ display:'flex', alignItems:'center', gap:4, flexWrap:'wrap' } }, ...qTypes.map((t,i)=>h(TypeChip,{key:i,type:t,size:9}))),
    /* ALL THE MAIN STATS (mondo 2026-10-20: "it needs all the main stats, 2 columns to fit them"): the race editor's set
       and names, paired row by row (HP|MP, ATK|M ATK, DEF|M DEF, SPD|VISION, CRT|EVA, MOV|JUMP, RNG) */
    h('div', { className: 'pb-stage-stats' },
      QUICK_STAT_KEYS.map(([k, label]) => {
        const mapped = STAT_MAP[k] || k.toLowerCase();
        const val = k === 'JUMP' ? (typeof window.raceJumpStat === 'function' ? window.raceJumpStat(stageEntry ? stageEntry.race : unitRace, qStats.spd) : 1) : (qStats[mapped]??0);
        const d = (stageEntry || k === 'JUMP') ? 0 : (statDeltas[mapped]??0);
        return h(StatBar, { key:k, label, statKey:k, val, max:STAT_MAX_PB[k]||100, compact:true, zodiacMod:stageEntry ? null : zMod(mapped), delta:d,
          suffix: STAT_PCT[k] ? '%' : pbVisMax(k, qStats).suffix, gradeKey: mapped, tip: pbVisMax(k, qStats).tip || window.STAT_HELP?.[mapped] || null });
      })),
    !standalone && h('button', { className:'ms-tty-btn ok', style:{ alignSelf:'flex-end', marginTop:2 }, onClick:confirmSlot, title:'Lock this vessel and move to the next open slot' }, 'CONFIRM ' + numerals[slot]));

  /* ── BODY: the three zones; the stage keeps its key across every tab ── */
  /* ── THE BOTTOM BAR (2026-09-09): the party row and the foot are ONE row —
     BACK + the vessel's summary on the left, the portraits in the middle, the
     tools + CONFIRM / the seal on the right. The empty flanks the user
     circled are now the controls; the `> forge --slot` prompt, the ◂ ▸ caps
     and the counter are gone (← → still walk the row). The online lock
     ladder (START / WAITING / SEAL) is verbatim (plan rule 3.6a). ── */
  const partyRow = h('div', { className: 'pb-party' },
    h('div', { className: 'pb-party-left' },
      standalone
        ? h('button', { className: 'ms-tty-btn danger', onClick: () => { if (window._ewForgeReturn && typeof window._teamBuilderBack === 'function') { window._teamBuilderBack(); return; } setTbView('locker'); sfx('uiCursorMove'); refresh(); }, title: window._ewForgeReturn ? 'Back to the team pick' : 'Back to the archive' }, '◂ TEAMS')
        : h('button', { className: 'ms-tty-btn danger', onClick: doBack, title: 'Back' }, '◂ BACK'),
      (!isOnline && st.showPlayer2Builder) ? h('div', { className: 'pb-party-side' },
        h('button', { className: 'pb-pill' + (player === 1 ? ' on' : ''), onClick: () => selectPlayer(1) }, 'P1'),
        h('button', { className: 'pb-pill' + (player === 2 ? ' on' : ''), onClick: () => selectPlayer(2) }, 'P2 · CPU')) : null),
    h('div', { className: 'pb-party-slots' },
      (() => { const _dupNow = pbDupRaces(pbTeamRaces()), _goneNow = pbGoneRaces(pbTeamRaces()); return Array.from({length: teamSize}).map((_, i) => {
        const cn = typeof window.normalizeClassName==='function' ? window.normalizeClassName(st.partyBuilds?.[player]?.[i], window.DEFAULT_BUILDS?.[player]?.[i]) : (st.partyBuilds?.[player]?.[i]||'Warrior');
        const mt = st.partyMeta?.[player]?.[i] || (typeof window.getDefaultIdentity==='function' ? window.getDefaultIdentity() : {});
        const id = typeof window.resolveIdentityForBuild==='function' ? window.resolveIdentityForBuild(cn,mt) : {race:'door agent',types:['human'],gender:'male'};
        const isActive = i===slot, fCol = PB_ACCENT;
        const confirmed = !!(st.builderConfirmedSlots?.[player]?.[i]);
        const nm = resolveUnitName(player, i, cn);
        const rl = (_grl(id.race,id.gender)||id.race||'?');
        const dupe = _dupNow.includes(String(id.race || '').toLowerCase());   // ONE OF EACH: this race stands on the sheet twice
        const gone = _goneNow.includes(String(id.race || '').toLowerCase());   // HOMOSAPIEN OUT: this race left the roster
        return h('div', { key:i, onClick:()=>selectSlot(i), className:'pb-party-slot' + (isActive ? ' on' : '') + (confirmed ? ' filed' : '') + (dupe || gone ? ' dup' : ''), style:{ '--slot-fc': fCol }, title: nm + ' · ' + rl + ' · ' + pbRoleLabel(id.race) + (dupe ? ' — on this team twice: swap one out (one of each unit)' : '') },
          h('div', { className:'pb-party-ring' },
            gone ? h('span', { className:'pb-party-dup' }, 'REMOVED') : dupe ? h('span', { className:'pb-party-dup' }, 'TWICE') : null,
            h('div', { className:'pb-party-portrait' }, h(PortraitSprite, { race:id.race, gender:id.gender||'male', cls:cn, glow:isActive })),
            h('span', { className:'pb-party-no' }, numerals[i]),
            confirmed && (DOOR
              ? h('span', { className:'door-stamp door-stamp-sm admit pb-party-filed', title:'Locked in' }, 'FILED')
              : h('span', { className:'pb-party-filed pb-party-tick' }, '✓'))),
          h('div', { className:'pb-party-name' }, nm),
          h('div', { className:'pb-party-sub' }, rl, ' · ', pbRoleLabel(id.race)));
      }); })()),
    h('div', { className: 'pb-party-right ms-tty-foot pb-foot' },
      h('div', { className: 'pb-tools' },
        h('button', { className: 'ms-tty-btn sm', onClick: doRandomize, title: 'Randomize this vessel' }, '🎲 ONE'),
        h('button', { className: 'ms-tty-btn sm', onClick: doRandomizeAll, title: 'Randomize the whole party' }, '🎲 ALL'),
        h('button', { className: 'ms-tty-btn sm', onClick: doDefaults, title: 'Reset every slot to defaults' }, 'RESET'),
        standalone ? h('button', { className: 'ms-tty-btn sm', disabled: teamSize <= 1, onClick: () => tbSetTeamSize(teamSize - 1), title: 'Drop the last slot' }, '− SLOT') : null,
        standalone ? h('button', { className: 'ms-tty-btn sm teal', disabled: teamSize >= tbRosterMax(), onClick: () => tbSetTeamSize(teamSize + 1), title: 'Add a vessel (up to ' + tbRosterMax() + ' on a sheet)' }, '＋ SLOT') : null,
        !standalone ? h('button', { className: 'ms-tty-btn sm gold', onClick: () => { setTeamSaveName(''); setShowTeamModal('save'); }, title: 'Archive this party as a saved team' }, '★ SAVE') : null,
        !standalone ? h('button', { className: 'ms-tty-btn sm teal', onClick: () => setShowTeamModal('load'), title: 'Load a saved team from your archive' }, '↑ LOAD', getTeamPresets().length ? ' · ' + getTeamPresets().length : '') : null),
      standalone
        // ── standalone: name the squad, then archive it — SAVE is the seal ──
        ? h('div', { className: 'pb-seal' },
            h('input', { className: 'pb-foot-input', value: teamNameDraft, onChange: e => setTeamNameDraft(e.target.value), placeholder: editingTeamId ? 'Squad name' : 'Name this squad…', maxLength: 30, title: 'Team name' }),
            h('button', { className: 'ms-tty-btn primary', onClick: tbSaveTeam, title: 'Archive this squad' }, h('b', null, '💾 SAVE TEAM'), h('i', null, '↵')))
        // ── match flow: CONFIRM left of the seal ──
        : h('div', { className: 'pb-seal' },
            h('button', { className: 'ms-tty-btn ok', onClick: confirmSlot, title: 'Lock this vessel and move to the next open slot' }, 'CONFIRM ', numerals[slot]),
            friendlyHostCanStart
              ? h('button', { className: 'ms-tty-btn primary', onClick: doStart }, h('b', null, '⚔ START MATCH'), h('i', null, '↵'))
              : isWaitingOnline
              ? h('button', { className: 'ms-tty-btn primary waiting pb-btn-waiting', disabled: true },
                  h('b', null, (isRankedNet && opponentLockedToo) ? 'MATCH STARTING…'
                    : (!isRankedNet && netRole === 'guest' && opponentLockedToo) ? '⌛ WAITING FOR HOST TO START…'
                    : '⌛ WAITING ON OPPONENT…'))
              : h('button', { className: 'ms-tty-btn primary', onClick: doStart, title: 'Seal the manifest and cross' }, h('b', null, 'SEAL YOUR FATE'), h('i', null, '↵')))));

  // TECHNIQUES (THE FAMILY COLUMNS, 2026-10-01): the hero stands in its own cell beside the columns, centred
  const stageCx = (pbTab === 'roster' || pbTab === 'tech') ? 0.5 : PB_STAGE_CX;
  // THE TECHNIQUE PANEL: its own FIXED cell under the hero, right of the family columns (2026-10-01 — it used to sit in an
  // auto-height row under the rack, so a hovered spell grew it over the cards it described and the hover flickered).
  // Only on TECHNIQUES with a rack; its height never follows its content (it scrolls inside).
  const hasPanel = pbTab === 'tech' && !!(useTree && unitTiers);
  const panelZone = hasPanel ? h('div', { key: 'panel', className: 'pb-zone pb-zone-panel' },
    h(TechniquePanel, { info: techInfo, clsName, fc, spUsed: spUsedNow, spMax,
      raceLabel: (typeof window.getRaceLabel === 'function' ? window.getRaceLabel(unitRace) : unitRace),
      onVerb: techVerb, onPreview: (info) => (info && info.st8 === 'finisher') ? pbPreviewFinisher() : pbPreview(info.sp || null),
      previewOff, previewing: !!previewState, used: (customSpells || []).length, slotCap, onUpgrade: tierUpgradeClick })) : null;
  // Cosmetics belong to the selected slot, independent of its job/loadout.
  // THE CHARACTER CREATOR (rev 3, 2026-09-11): every control writes ONE
  // sanitized appearance object (sprites.js normalizeCharacterAppearance —
  // catalogues EW_HAIR_STYLES / EW_FABRICS / EW_APPEARANCE_ENUMS); the stage
  // (EWCharViewer → three-renderer.js _createAppearanceRig) re-dresses the
  // model live. Sections: BODY · FACE · SKIN · HAIR · CLOTHES.
  /* THE RACE LOOKS (2026-11-01): a race with a baked creator look (sprites.js RACE_CREATOR_LOOKS, the Cowboy first) is dressed
     here too. The slot starts on the race's look; an edit keeps the slot's own copy; RESET TO DEFAULT LOOK drops it; USE ORIGINAL
     MODEL puts the race's own Meshy model back on this slot (appearance.model 'original'); EXPORT DEFAULT LOOK saves the look
     as a file that bake-looks.js bakes into RACE_CREATOR_LOOKS (the default every slot / every CPU of that race wears). */
  /* THE MESHY DEFAULT (2026-11-03, mondo: "Let the character creator be available to all units so i can make custom models for
     them ... the old models should stay the default until i say so ... even the cowboy" + "make sure that custom cowboy is still
     saved and there as an option"): the creator opens on EVERY race. No look on the slot = the race's own Meshy model (the DOOR
     Agent excepted); a race with a baked look (now a SAVED look) offers it as USE THE SAVED <RACE> LOOK; EXPORT RACE LOOK on any race. */
  const raceLookRace = !!(window.hasRaceCreatorLook && window.hasRaceCreatorLook(unitRace));
  const lookEditable = !!unitRace && (typeof window.ewCreatorLookRace === 'function' ? window.ewCreatorLookRace(unitRace) : unitRace === 'door agent');
  const lookIsDefault = unitRace === 'door agent' || unitRace === 'homosapien' || (raceLookRace && !!(window.raceLooksAreDefault && window.raceLooksAreDefault()));
  const slotOwnLook = window.normalizeCharacterAppearance?.(meta.appearance) || null;
  const slotOriginal = !!(slotOwnLook && slotOwnLook.model === 'original');
  const raceSavedLook = raceLookRace ? (window.getRaceCreatorLook(unitRace, identity.gender || 'male') || null) : null;
  const appearance = slotOriginal ? null : (slotOwnLook || (lookIsDefault ? raceSavedLook : null));
  const unitRaceLabel = typeof window.getRaceLabel === 'function' ? window.getRaceLabel(unitRace) : unitRace;
  const wearsOriginal = slotOriginal || (!appearance && unitRace !== 'door agent');   // the slot stands in the race's own model
  const setSlotLook = (a) => {   // (THE MESHY DEFAULT: USE THE SAVED LOOK / RESET TO SAVED LOOK put a copy on this slot)
    if (isWaitingOnline || !a) return;
    setCreatorRef(null);
    st.teamLockedIn = false;
    st.partyMeta[player][slot].appearance = window.normalizeCharacterAppearance(Object.assign({}, a, { model: 'creator' }));
    if (st.builderConfirmedSlots?.[player]) st.builderConfirmedSlots[player][slot] = false;
    refresh();
  };
  /* THE REFERENCE: only the stage changes (HeroViewer3D below); the slot's look, its edits and the export stay as they are.
     An edit turns it off, so the change shows at once. */
  const refKey = player + ':' + slot + ':' + unitRace + ':' + (identity.gender || 'male');
  const refHasModel = (typeof RACE_MODELS_3D !== 'undefined') && !!RACE_MODELS_3D[unitRace];
  const refAvail = creatorOpen && pbTab === 'gear' && lookEditable && !slotOriginal && !!appearance && refHasModel;   // the toggle sits on the stage (top middle) while the creator is open
  const refShown = refAvail && creatorRef === refKey;
  const changeAppearance = (changes, gender) => {
    if (isWaitingOnline || !lookEditable) return;   // HOMOSAPIEN OUT (2026-10-23): the creator dresses the DOOR Agent (+ THE RACE LOOKS)
    setCreatorRef(null);   // THE REFERENCE: back on the look being edited
    const target = st.partyMeta[player][slot];
    st.teamLockedIn = false;
    target.appearance = window.normalizeCharacterAppearance({ ...(appearance || {}), ...changes });
    if (gender) { pbGenderKitReset(target, target.race || unitRace, gender); target.gender = gender; }   // THE GENDER KIT (2026-11-07)
    if (st.builderConfirmedSlots?.[player]) st.builderConfirmedSlots[player][slot] = false;
    refresh();
  };
  /* THE ASSIGNED LOOKS, LOADED (2026-11-05): a chip in the Assigned looks box puts that race + gender's assigned look on the stage:
     this slot when it is that race, else the team's slot of that race (selected), else that race goes on this slot (the roster pick,
     the creator stays open). The whole look replaces the slot's look (no merge with the old one); the store is untouched. */
  const loadAssignedLook = (e) => {
    if (isWaitingOnline || !e || !e.race || !e.appearance || !window.normalizeCharacterAppearance) return false;
    const g = e.gender === 'female' ? 'female' : 'male';
    let at = pbSlotRace(slot) === e.race ? slot : pbTeamRaces().indexOf(e.race);
    if (at < 0) { pickRace(e.race, g, true); at = slot; }
    if (pbSlotRace(at) !== e.race) return false;
    setCreatorRef(null);
    st.teamLockedIn = false;
    const pm = st.partyMeta[player] || (st.partyMeta[player] = []), target = pm[at] || (pm[at] = { race: e.race });
    target.appearance = window.normalizeCharacterAppearance(Object.assign({}, e.appearance, { model: 'creator' }));
    pbGenderKitReset(target, e.race, g);   // THE GENDER KIT (2026-11-07)
    target.gender = g;
    if (st.builderConfirmedSlots?.[player]) st.builderConfirmedSlots[player][at] = false;
    if (at !== slot) selectSlot(at); else refresh();
    return true;
  };
  const officerLook = (typeof window.hqLook === 'function' && window.ProfileSystem) ? window.hqLook(window.ProfileSystem.getActiveProfile()) : null;   // rev 8: the card's look, one click onto a slot
  const viewerLoads = !!(window.EWCharViewer && window.EWCharViewer.supports && window.EWCharViewer.supports('door agent', identity.gender || 'male'));
  const mpfbDefaultBody = (identity.gender === 'female' ? 'mpfb_female' : 'mpfb_male');   // THE MPFB BODIES: the creator's default
  const creatorPanel = h(React.Fragment, null,
    h('div', { className: 'pb-zone-head' }, h('b', null, 'Character creator'),
      h('button', { className: 'ms-tty-btn ew-back', onClick: () => setCreatorOpen(false) }, 'BACK TO GEAR')),
    h('div', { className: 'pb-zone-body pb-creator' },
      !lookEditable
        ? h('p', null, 'Select a unit on the Roster tab to customize its look.')
        : wearsOriginal
          ? h(React.Fragment, null,
              h('p', null, 'This slot wears the ' + unitRaceLabel + '\u2019s original ' + (refHasModel ? 'model' : 'sprite') + '. Make a custom look for it here; USE ORIGINAL MODEL in the creator puts the original back.'),
              h('div', { className: 'pb-creator-options' },
                raceSavedLook ? h('button', { className: 'ms-tty-btn primary', disabled: isWaitingOnline, title: 'The saved creator look for the ' + unitRaceLabel + ' (' + (identity.gender || 'male') + ')', onClick: () => setSlotLook(raceSavedLook) }, 'USE THE SAVED ' + String(unitRaceLabel).toUpperCase() + ' LOOK') : null,
                h('button', { className: 'ms-tty-btn' + (raceSavedLook ? '' : ' primary'), disabled: isWaitingOnline, onClick: () => changeAppearance(Object.assign({ body: mpfbDefaultBody, model: 'creator' }, window.mpfbFacePatch ? window.mpfbFacePatch(null, mpfbDefaultBody) : {})) }, 'CREATE APPEARANCE'),
                h('button', { className: 'ms-tty-btn', disabled: isWaitingOnline, onClick: () => changeAppearance(Object.assign(window.randomCharacterAppearance ? window.randomCharacterAppearance() : {}, { body: mpfbDefaultBody, model: 'creator' })) }, '\u2684 RANDOM')),
              (unitRace !== 'door agent' && unitRace !== 'homosapien') ? h(AssignedLooks, { race: unitRace, raceLabel: unitRaceLabel, gender: identity.gender || 'male', appearance: null, disabled: isWaitingOnline, onNote: pbNote, onLoad: loadAssignedLook }) : null)
        : !appearance
          ? h(React.Fragment, null,
              h('p', null, 'Build a custom appearance for this character. Your techniques and equipment stay attached to this slot.'),
              h('div', { className: 'pb-creator-options' },
                // creator step 5 (2026-11-01): a new look starts on the MPFB body of the slot's gender (the classic bases stay one click away)
                h('button', { className: 'ms-tty-btn primary', disabled: isWaitingOnline, onClick: () => changeAppearance(Object.assign({ body: mpfbDefaultBody }, window.mpfbFacePatch ? window.mpfbFacePatch(null, mpfbDefaultBody) : {})) }, 'CREATE APPEARANCE'),   // + THE DEFAULT FACES
                h('button', { className: 'ms-tty-btn', disabled: isWaitingOnline, onClick: () => changeAppearance(Object.assign(window.randomCharacterAppearance ? window.randomCharacterAppearance() : {}, { body: mpfbDefaultBody })) }, '⚄ RANDOM')))
          : h(React.Fragment, null,
            !viewerLoads ? h('p', { className: 'pb-creator-note' }, 'The 3D stage is unavailable here — changes still save with the team.') : null,
            h(CreatorControls, { appearance, gender: identity.gender || 'male', disabled: isWaitingOnline, onChange: changeAppearance,
              name: unitCustomName, onName: (v) => { handleNameChange(v); refresh(); },
              onLoad: (e) => { changeAppearance(e.appearance, e.gender); handleNameChange(e.name); refresh(); }, footer: h(React.Fragment, null,
              h('div', { className: 'pb-creator-options' },
                h('button', { className: 'ms-tty-btn', onClick: () => changeAppearance(Object.assign(window.randomCharacterAppearance ? window.randomCharacterAppearance() : {}, { body: (appearance && appearance.body) || mpfbDefaultBody })) }, '⚄ RANDOMIZE'),   // (keeps the body picked)
                raceSavedLook
                  ? h('button', { className: 'ms-tty-btn', title: 'Back to the saved ' + unitRaceLabel + ' look', onClick: () => setSlotLook(raceSavedLook) }, 'RESET TO SAVED LOOK')
                  : h('button', { className: 'ms-tty-btn', onClick: () => changeAppearance(window.normalizeCharacterAppearance(Object.assign({ body: mpfbDefaultBody }, window.mpfbFacePatch ? window.mpfbFacePatch(null, mpfbDefaultBody) : {}))) }, 'RESET'),   // + THE DEFAULT FACES
                h('button', { className: 'ms-tty-btn', onClick: () => {
                  if (isWaitingOnline) return;
                  st.teamLockedIn = false;
                  if (lookIsDefault && raceLookRace) st.partyMeta[player][slot].appearance = window.normalizeCharacterAppearance({ model: 'original' });   // THE RACE LOOKS: the race's own model on this slot
                  else delete st.partyMeta[player][slot].appearance;   // THE MESHY DEFAULT: no look = the race's own model
                  if (st.builderConfirmedSlots?.[player]) st.builderConfirmedSlots[player][slot] = false;
                  refresh();
                } }, 'USE ORIGINAL MODEL'),
                (unitRace !== 'door agent' && unitRace !== 'homosapien') ? h('button', { className: 'ms-tty-btn gold', title: 'Save this look as a file; bake-looks.js saves it in the game as the ' + unitRaceLabel + ' (' + (identity.gender || 'male') + ') look, offered here on every ' + unitRaceLabel + ' slot (the original model stays the default)', onClick: () => pbExportRaceLook(unitRace, identity.gender || 'male', appearance, pbNote) }, '\u21e9 EXPORT RACE LOOK') : null,
                officerLook ? h('button', { className: 'ms-tty-btn', title: 'The look on your card (Occam\u2019s mirror) on this slot', onClick: () => changeAppearance(officerLook.appearance, officerLook.gender) }, 'USE YOUR OWN LOOK') : null),
                (unitRace !== 'door agent' && unitRace !== 'homosapien') ? h(AssignedLooks, { race: unitRace, raceLabel: unitRaceLabel, gender: identity.gender || 'male', appearance, disabled: isWaitingOnline, onNote: pbNote, onLoad: loadAssignedLook }) : null) }),
            h('div', { className: 'pb-creator-options pb-creator-views' },
              h('button', { className: 'ms-tty-btn', onClick: () => window.EWCharViewer?.resetView() }, 'FULL BODY'),
              h('button', { className: 'ms-tty-btn', onClick: () => window.EWCharViewer?.viewHead() }, 'FACE CLOSE-UP')))));   // (THE WALK STYLE rev 2: PLAY WALK / STOP WALK sits on the Walk row, CreatorControls)

  const zoneContent = pbTab === 'roster' ? rosterPanel : pbTab === 'tech' ? techPanel : pbTab === 'gear' ? (creatorOpen ? creatorPanel : gearPanel) : dossierPanel;
  const body = h('div', { className: 'pb-body', 'data-tab': pbTab, 'data-panel': hasPanel ? '1' : '0' },
    h('div', { key: 'tech', className: 'pb-zone pb-zone-tech pb-zone-' + pbTab }, zoneContent),
    // The stage spans the WHOLE body on TECHNIQUES / GEAR / DOSSIER (the side
    // zones are transparent over it — the hero's environment is the backdrop);
    // --pb-cx / `focus` put the hero at the centre of the free band between
    // the circuit and the stats (PB_STAGE_CX ↔ the CSS column widths).
    h('div', { key: 'stage', className: 'pb-stage', style: { '--pb-cx': (stageCx * 100) + '%' } },
      h('div', { className: 'pb-stage-view' },
        h('div', { className: 'pb-stage-glow', style:{ background:`radial-gradient(circle, ${fc}26, transparent 62%)` } }),
        h('div', { className: 'pb-stage-floor', style:{ background:`radial-gradient(ellipse, ${fc}66, transparent 70%)` } }),
        h(HeroViewer3D, { race:stageRace, gender:stageGender, cls:stageCls, focus: stageCx, appearance: (!stageEntry && refShown) ? { model: 'original' } : (!stageEntry && lookEditable ? meta.appearance : null) }),   // (THE MESHY DEFAULT: none = the race's own model; THE REFERENCE: the race's own model, for a look)
        // MOVE PREVIEW pill (plan §5.2 item 5): shows while a cast clip runs
        // on the stage; the note for vessels that cannot preview; PREVIEW OFF
        // on TECHNIQUES when the trigger is disabled.
        (!stageEntry && refAvail && !previewState) ? h('button', { className: 'pb-stage-pill' + (refShown ? ' live' : ''), 'aria-pressed': refShown ? 'true' : 'false',
            style: { pointerEvents: 'auto', cursor: 'pointer', fontFamily: 'inherit' },
            title: refShown ? 'Back to the look you are editing' : 'Look at the ' + (typeof window.getRaceLabel === 'function' ? window.getRaceLabel(unitRace) : unitRace) + '\u2019s original model for reference. Nothing changes on this slot.',
            onClick: () => { setCreatorRef(refShown ? null : refKey); sfx('uiCursorMove'); } },
            refShown ? '\u25d1 ORIGINAL MODEL \u00b7 BACK TO MY LOOK' : '\u25d0 SHOW ORIGINAL MODEL')
          : previewState ? h('div', { className: 'pb-stage-pill live' }, h('i', null), 'MOVE PREVIEW · ', (previewState.name || '').toUpperCase())
          : previewNote ? h('div', { className: 'pb-stage-pill note' }, previewNote)
          : (previewOff && pbTab === 'tech') ? h('div', { className: 'pb-stage-pill off' }, 'PREVIEW OFF') : null,
        // Stage 5's sticky notes, stuck ON THE GLASS (2026-09-09 — the user: the bezel margin "shrinks the entire screen")
        (pbTab !== 'roster' && !(standalone && tbView === 'locker')) ? h(PbNotes, { notes: unitNotes, seed: unitRace + ':' + (identity.gender || ''), paper: notePaper, onOpen: () => { setNotesOpen(true); sfx('uiCursorMove'); } }) : null),
      pbTab === 'roster' ? quickCard : null),
    // the stats sit on GEAR / DOSSIER; TECHNIQUES gives their width to the family columns (2026-10-01)
    (pbTab !== 'roster' && pbTab !== 'tech') ? h('div', { key: 'stats', className: 'pb-zone pb-zone-stats' }, statsPanel) : null,
    panelZone,
    partyRow);

  /* ══ TEAM ARCHIVE — standalone landing view (Pokémon-Showdown locker), a
     full-glass view over the forge: pick a squad to edit, or start a new
     one. Teams saved here surface in the pre-match ↑ LOAD list. ══ */
  const locker = (standalone && tbView === 'locker') ? (() => {
    const presets = getTeamPresets();
    return h('div', { className: 'pb-locker' },
      h('div', { className: 'ms-tty-head pb-head' },
        h(DoorSeal, { size: 20 }),
        h('span', null, 'D.O.O.R.'), h('span', { className: 'ms-tty-sep' }, '▸'),
        h('b', null, 'ENTROPY WARS'),
        h('span', { className: 'ms-tty-sep' }, '·'), h('span', null, 'RECORDS · SQUAD MANIFESTS'),
        h('span', { className: 'ms-tty-sep' }, '·'), h('span', null, 'FORGE-1'),
        h('span', { className: 'ms-tty-officer' }, officer ? officer.name : 'UNFILED', officer && h('i', null, 'CLEARANCE L' + officer.cl.level + ' · ' + officer.cl.title)),
        h('span', { className: 'ms-tty-sep' }, '·'), h('span', null, presets.length + ' / ' + (window.ProfileSystem?.MAX_TEAM_PRESETS || 20) + ' SQUADS ARCHIVED'),
        h('span', { className: 'ms-tty-sep' }, '·'), h('span', { className: 'ms-tty-esc' }, 'ESC · MAIN MENU')),
      h('div', { className: 'pb-locker-body' },
        h('div', { style:{ marginBottom:18 }},
          h('div', { className:'door-title-stamp' },
            h('div', { style:{ fontFamily:'Cormorant SC, serif', fontSize:'clamp(22px,2.6vw,34px)', fontWeight:600, letterSpacing:'0.1em', color:'#f1e9cf', textShadow:'0 0 22px rgba(255,205,107,0.28)' }}, 'TEAM ARCHIVE'),
            DOOR && h('span', { className:'door-stamp admit', title:'Manifests on file are cleared for deployment' }, 'ON FILE')),
          h('div', { style:{ fontSize:11, color:'#c9bf9e', letterSpacing:'0.08em', marginTop:4, lineHeight:1.5 }},
            'Forge squads here, before the war finds you. Saved teams appear under ', h('b', {style:{color:'#7fd9dd'}}, '↑ LOAD'), ' whenever you build a party for any match.')),
        h('div', { className: 'pb-locker-grid' },
          h('div', { className:'pb-team-card new', onClick:tbNewTeam },
            h('div', { style:{ fontSize:34, color:'#3ddc84', lineHeight:1, textShadow:'0 0 18px rgba(61,220,132,0.5)' }}, '+'),
            h('div', { style:{ fontFamily:'Cormorant SC, serif', fontSize:17, letterSpacing:'0.14em', color:'#3ddc84', fontWeight:600 }}, 'NEW TEAM'),
            h('div', { style:{ fontSize:9, color:EW.inkMute, letterSpacing:'0.1em' }}, 'FORGE A FRESH SQUAD')),
          presets.map(preset => {
            const slots = preset.slots || [];
            return h('div', { key:preset.id, className:'pb-team-card', onClick:()=>tbEditTeam(preset), title:'Open this squad in the forge' },
              h('div', { style:{ display:'flex', alignItems:'baseline', gap:10 }},
                h('span', { style:{ fontFamily:'Cormorant SC, serif', fontSize:18, fontWeight:600, letterSpacing:'0.06em', color:EW.ink, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', minWidth:0, flex:1 }}, preset.name || 'Unnamed'),
                h('span', { style:{ fontSize:9, color:EW.inkDim, letterSpacing:'0.1em', flexShrink:0 }}, slots.length, ' VESSELS')),
              h('div', { style:{ display:'flex', gap:5, flexWrap:'wrap' }},
                slots.slice(0, 8).map((s, si) => h('div', { key:si, className:'pb-team-mini', title:(_grl(s.race, s.gender)||s.race)+' · '+pbRoleLabel(s.race) },
                  h(PortraitSprite, { race:s.race, gender:s.gender||'male', cls:s.cls })))),
              pbGoneRaces(slots.map(s => s.race)).length ? h('div', { className:'pb-dup-note' }, 'REMOVED: ', pbGoneRaces(slots.map(s => s.race)).map(pbRaceName).join(', '), ' · out of the game, swap it out in the forge') : null,   // HOMOSAPIEN OUT
              h('div', { style:{ display:'flex', alignItems:'center', gap:6, marginTop:2 }},
                h('span', { style:{ fontSize:8, color:EW.inkDim, letterSpacing:'0.08em', flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }},
                  (preset.gameMode || '').toUpperCase(), preset.lastUsed ? ' · ' + new Date(preset.lastUsed).toLocaleDateString() : '',
                  pbDupRaces(slots.map(s => s.race)).length ? h('span', { className:'pb-dup-note' }, ' · TWICE: ', pbDupRaces(slots.map(s => s.race)).map(pbRaceName).join(', ')) : null),
                h('button', { className:'pb-team-act', onClick:e=>{ e.stopPropagation(); tbEditTeam(preset); } }, '⚒ FORGE'),
                h('button', { className:'pb-team-act', onClick:e=>{ e.stopPropagation(); tbDuplicateTeam(preset); } }, 'COPY'),
                h('button', { className:'pb-team-act danger', onClick:e=>{ e.stopPropagation(); deleteTeamPreset(preset.id); } }, 'DEL')));
          })),
        presets.length === 0 && h('div', { style:{ marginTop:22, fontSize:11, color:EW.inkDim, fontStyle:'italic', letterSpacing:'0.06em' }},
          'The archive is empty. Forge your first squad — the entropy is patient, but not that patient.')),
      h('div', { className: 'ms-tty-foot pb-foot' },
        h('button', { className: 'ms-tty-btn danger', onClick: () => { if (typeof window._teamBuilderBack==='function') window._teamBuilderBack(); } }, window._ewForgeReturn ? '◂ TEAM SELECT' : '◂ MAIN MENU'),
        h('div', { className: 'ms-tty-spacer' }),
        h('span', { className: 'ms-tty-prompt' }, '> ', h('b', null, 'archive --list'), h('span', { className: 'ms-tty-cursor' })),
        h('span', { className: 'pb-foot-note' }, 'SQUADS ARE SAVED TO YOUR PROFILE', DOOR ? ' · MANIFESTS REMAIN PROPERTY OF THE DEPARTMENT' : '')));
  })() : null;

  /* ── the windows on the glass ── */
  const teamWindow = showTeamModal && h(PbWindow, { title: showTeamModal === 'save' ? 'SAVE TEAM' : 'LOAD TEAM', sub: getTeamPresets().length + ' / ' + (window.ProfileSystem?.MAX_TEAM_PRESETS||20) + ' PRESETS', onClose: () => setShowTeamModal(false), width: 440 },
    showTeamModal === 'save' && h('div', { style:{ display:'flex', flexDirection:'column', gap:8 }},
      h('div', { style:{ fontSize:10, color:EW.inkMute, letterSpacing:'0.1em' }}, 'Name this team preset:'),
      h('input', { className:'pb-gear-input', value:teamSaveName, onChange:e=>setTeamSaveName(e.target.value), placeholder:'e.g. Fire Squad, Tank Line...', maxLength:30, autoFocus:true, onKeyDown:e=>{ if(e.key==='Enter'&&teamSaveName.trim()) saveCurrentTeam(teamSaveName.trim()); }, style:{ width:'100%', boxSizing:'border-box' }}),
      h('div', { style:{ display:'flex', gap:6, justifyContent:'flex-end' }},
        h('button', { className:'ms-tty-btn sm', onClick:()=>setShowTeamModal(false) }, 'CANCEL'),
        h('button', { className:'ms-tty-btn sm gold', disabled: !teamSaveName.trim(), onClick:()=>{ if(teamSaveName.trim()) saveCurrentTeam(teamSaveName.trim()); } }, 'SAVE'))),
    showTeamModal === 'load' && h('div', { style:{ display:'flex', flexDirection:'column', gap:4 }},
      getTeamPresets().length === 0
        ? h('div', { style:{ color:EW.inkDim, fontSize:12, textAlign:'center', padding:20, fontStyle:'italic' }}, 'No saved teams yet. Use SAVE to store your current party.')
        : getTeamPresets().map(preset =>
          h('div', { key:preset.id, className:'pbx-pick-row', style:{ borderRadius:'var(--pb-r-sm)' } },
            h('div', { onClick:()=>loadTeamPreset(preset), style:{ flex:1, display:'flex', flexDirection:'column', gap:2, cursor:'pointer', minWidth:0 }},
              h('div', { style:{ fontFamily:'Cormorant SC, serif', fontSize:13, letterSpacing:'0.1em', color:EW.ink }}, preset.name),
              h('div', { style:{ display:'flex', gap:4, flexWrap:'wrap' }},
                ...(preset.slots||[]).map((s,si)=>{
                  const rl = typeof _grl==='function' ? _grl(s.race,s.gender) : s.race;
                  return h('span', { key:si, style:{ fontSize:9, color:EW.inkMute, background:'rgba(255,255,255,0.04)', padding:'1px 6px', borderRadius:999, border:`1px solid rgba(255,255,255,0.06)` }}, rl);
                })),
              h('div', { style:{ fontSize:8, color:EW.inkDim }}, preset.gameMode?.toUpperCase() || '', ' · ', new Date(preset.createdAt).toLocaleDateString(),
                (preset.slots||[]).length > teamSize ? h('span', { style:{ color:EW.warn, marginLeft:6 }}, '· ', (preset.slots||[]).length, ' ON FILE — PICK ', teamSize) : null,
                pbDupRaces((preset.slots||[]).map(s => s.race)).length ? h('span', { className:'pb-dup-note', style:{ marginLeft:6 }}, '· TWICE: ', pbDupRaces((preset.slots||[]).map(s => s.race)).map(pbRaceName).join(', ')) : null,
                pbGoneRaces((preset.slots||[]).map(s => s.race)).length ? h('span', { className:'pb-dup-note', style:{ marginLeft:6 }}, '· REMOVED: ', pbGoneRaces((preset.slots||[]).map(s => s.race)).map(pbRaceName).join(', ')) : null)),
            h('button', { className:'pb-team-act danger', onClick:e=>{e.stopPropagation();deleteTeamPreset(preset.id);} }, 'DEL')))));

  /* THE DEPLOY PICK window: the sheet's vessels as toggles, DEPLOY when
     exactly the mode's count is chosen. */
  const pickWindow = teamPick && (() => {
    const need = window.CONFIG?.teamSize || teamSize;
    const chosen = teamPick.chosen;
    return h(PbWindow, { title: 'CHOOSE YOUR ' + need, sub: (teamPick.preset.name || 'TEAM').toUpperCase() + ' · ' + chosen.length + ' / ' + need + ' CROSSING', onClose: () => setTeamPick(null), width: 460 },
      h('div', { style:{ display:'flex', flexDirection:'column', gap:4 }},
        h('div', { style:{ fontSize:10, color:EW.inkMute, letterSpacing:'0.1em' }}, 'This sheet holds ', teamPick.preset.slots.length, ' vessels; this match fields ', need, '. Pick who crosses — the rest stay on file.'),
        ...teamPick.preset.slots.map((s, i) => {
          const on = chosen.includes(i);
          const rl = typeof _grl === 'function' ? (_grl(s.race, s.gender) || s.race) : s.race;
          return h('div', { key:i, className:'pbx-pick-row', onClick:()=>toggleTeamPick(i), style:{ borderRadius:'var(--pb-r-sm)', cursor:'pointer', opacity: on ? 1 : 0.55, border: on ? '1px solid rgba(242,196,104,0.7)' : undefined } },
            h('div', { className:'pb-team-mini', style:{ width:36, height:36 } }, h(PortraitSprite, { race:s.race, gender:s.gender||'male', cls:s.cls })),
            h('div', { style:{ flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:2 }},
              h('div', { style:{ fontFamily:'Cormorant SC, serif', fontSize:13, letterSpacing:'0.1em', color:EW.ink }}, s.unitName || rl),
              h('div', { style:{ fontSize:9, color:EW.inkMute }}, rl, ' · ', pbRoleLabel(s.race))),
            h('span', { style:{ fontSize:10, letterSpacing:'0.12em', color: on ? EW.warn : pbGoneRaces([s.race]).length ? '#ff8a8a' : EW.inkDim }}, on ? '✓ CROSSING' : pbGoneRaces([s.race]).length ? 'REMOVED' : 'ON FILE'));
        }),
        h('div', { style:{ display:'flex', gap:6, justifyContent:'flex-end', marginTop:6 }},
          h('button', { className:'ms-tty-btn sm', onClick:()=>setTeamPick(null) }, 'CANCEL'),
          h('button', { className:'ms-tty-btn sm gold', disabled: chosen.length !== need, onClick: deployTeamPick }, 'DEPLOY ', chosen.length, ' / ', need))));
  })();

  // Stage 5: the notes' full text — every passive + every terrain row, unclamped
  const notesWindow = notesOpen && h(PbWindow, { title: 'THE NOTES', sub: raceLabelTxt.toUpperCase() + ' · PASSIVES & TERRAIN', onClose: () => setNotesOpen(false), width: 460 },
    h('div', { className: 'pb-notes-list' },
      ...unitNotes.passives.map(p => h('div', { key: 'p' + p.id, className: 'pb-notes-row' },
        h('span', { className: 'pb-notes-icon' }, p.icon || '✦'),
        h('div', null,
          h('b', null, 'PASSIVE: ', p.name),
          h('p', null, p.desc || ''),
          p.note ? h('em', null, p.note) : null))),
      ...unitNotes.terrain.map((t, i) => h('div', { key: 't' + i, className: 'pb-notes-row terrain' },
        h('span', { className: 'pb-notes-icon' }, t.icon || '⛰'),
        h('div', null,
          h('b', null, 'TERRAIN: ', t.name),
          h('p', null, t.desc || '')))),
      (!unitNotes.passives.length && !unitNotes.terrain.length) ? h('div', { style:{ fontSize:11, color:EW.inkDim, fontStyle:'italic', padding:'12px 6px', textAlign:'center' } }, 'No notes on this vessel — field research pending.') : null));

  const pickerWindow = equipPicker && h(PbWindow, {
      title: 'Battle Items',
      sub: equipPicker === 'item' ? (totalItemsUsed + ' / ' + itemSlotMax + ' CARRIED') : null,
      onClose: () => setEquipPicker(null), width: 470 },
    equipPicker === 'item'
      ? allItemKeys.map(ik => {
          const rule = window.ITEM_RULES?.[ik];
          if (!rule) return null;
          const count = unitItems[ik] || 0;
          const capped = count >= itemCapOf(ik, rule) || totalItemsUsed >= itemSlotMax;
          return h('div', { key:ik, className:'pbx-pick-row', onClick:()=>setItemCount(ik, 1), style:{ opacity: capped && !count ? 0.5 : 1 }},
            h('span', { style:{ fontSize:20, flexShrink:0, width:26, textAlign:'center' }}, rule.icon || '📦'),
            h('div', { style:{ flex:1, minWidth:0 }},
              h('div', { style:{ fontSize:12, color: count ? EW.ink : '#c3c8d6' }}, rule.name),
              h('div', { style:{ fontSize:10, color:EW.inkMute, lineHeight:1.35 }}, rule.desc)),
            h('div', { style:{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }},
              count > 0 ? h('button', { className:'pb-stepper-btn', onClick:e=>{ e.stopPropagation(); setItemCount(ik, -1); }, style:{ width:20, height:20, borderRadius:'50%', background:'rgba(0,0,0,0.4)', border:`1px solid ${EW.panelEdge}`, color:EW.inkMute, fontSize:13, lineHeight:'18px', textAlign:'center', cursor:'pointer', padding:0, fontFamily:'DotGothic16, monospace' }}, '−') : null,
              h('span', { style:{ width:18, textAlign:'center', fontSize:12, color: count ? EW.ink : EW.inkDim, fontWeight:600 }}, count)));
        })
      : null);   // (the gear picker retired with the accessory slots — THE GEAR MERGE, Phase 4)

  /* ── the monitor ── */
  return h('div', { ref: crtRef, className: `ms-crt ms-crt-page ms-crt-forge pb-tarot`, style: { '--pb-fc': fc } },
    h('div', { className: 'ms-crt-bezel' },
      h('div', { className: 'ms-crt-glass' },
        h('div', { className: 'ms-crt-screen' },
          h('div', { className: 'ms-tty pb-tty' }, head, body),
          locker,
          teamWindow, pickWindow,
          notesWindow,
          pickerWindow),
        h('div', { className: 'ms-crt-scan' }),
        h('div', { className: 'ms-crt-glare' }),
        // Stage 3 (§5.3): the monitor's reactions — the grade wash and the scanline roll (CSS-driven, see onStageFx above)
        h('div', { className: 'pb-crt-grade' }),
        h('div', { className: 'pb-crt-roll' })),
      h('div', { className: 'ms-crt-label' }, 'D.O.O.R. · ' + (standalone ? 'RECORDS' : 'CUSTOMS & ADMISSIONS') + ' · FORGE-1 · DO NOT UNPLUG'),
      h('div', { className: 'ms-crt-brand' }, 'ENTROPY DATA SYSTEMS'),
      h('div', { className: 'ms-crt-led' })),
    spellTip && buildSpellTooltip(spellTip.sp, spellTip.x, spellTip.y));
}

let _pbRoot = null;
window._mountReactPartyBuilder = function() {
  const c = document.getElementById('builderOverlay');
  if (!c) return;
  _pbStandaloneMode = false;
  if (!_pbRoot) _pbRoot = ReactDOM.createRoot(c);
  _pbRoot.render(h(PartyBuilder, { standalone: false }));
};
window._unmountReactPartyBuilder = function() {
  if (_pbRoot) { _pbRoot.unmount(); _pbRoot = null; }
  if (window.EWCharViewer) window.EWCharViewer.unmount();
};
window._refreshReactPartyBuilder = function() { if (_pbRoot) _pbRoot.render(h(PartyBuilder, { standalone: false })); };

/* ── Standalone Party Forge (main menu → #teamBuilderPage) ─────────────
   Same component, standalone mode: opens on the TEAM ARCHIVE locker.
   map.js _goToTeamBuilder / _teamBuilderBack own the page navigation. */
let _tbRoot = null;
window._mountReactTeamBuilder = function() {
  const c = document.getElementById('teamBuilderBody');
  if (!c) return;
  _pbStandaloneMode = true;
  if (!_tbRoot) _tbRoot = ReactDOM.createRoot(c);
  _tbRoot.render(h(PartyBuilder, { standalone: true }));
};
window._unmountReactTeamBuilder = function() {
  _pbStandaloneMode = false;
  if (_tbRoot) { _tbRoot.unmount(); _tbRoot = null; }
  if (window.EWCharViewer) window.EWCharViewer.unmount();
};

/* ── THE MIRROR (rev 8, 2026-09-13): Occam's Barbershop's character creator ──
   The officer's OWN LOOK: a human base dressed by CreatorControls on the
   shared stage, filed on the active profile as door.hq.look (data.js
   hqSetLook) with THE PHOTO — a shoulders-up bust the stage renders
   (EWCharViewer.snapshot) — for the ID card (profile.js doorCardPortrait);
   SAVE also sits you in the chair as it (hqSetAvatar 'look') and the walker
   changes at once (map.js _hqRefreshAvatar). Mounted by map.js from the
   mirror counter through _HQ_MODAL (the building waits underneath; CLOSE
   resumes it). */
function OfficerCreator() {
  /* THE INTAKE (2026-09-21): the same screen opens over the MAIN MENU the first time a profile presses
     Play (map.js _hqIntakeOpen → _mountReactCreator({ intake: true, onDone, onCancel })): the officer
     builds their agent — a FREELANCER D.O.O.R. AGENT (data.js HQ_OFFICER_RULES) in the creator's clothes
     — and ENLIST files it (window._hqIntakeEnlist → data.js hqOfficerEnlist: the look, the chair, the
     officer record, member 0 of THE PARTY) before the building opens. The mirror mode (no props) is the
     barbershop's as before; its SAVE re-files an enlisted officer's look on the party too. */
  const props = arguments[0] || {};
  const intake = !!props.intake;
  const OR = window.HQ_OFFICER_RULES || { race: 'door agent', cls: 'Vessel', labels: {} };
  const L = OR.labels || {};
  const PS = window.ProfileSystem;
  const idx = PS && typeof PS.getActiveProfileIndex === 'function' ? PS.getActiveProfileIndex() : null;
  const profile = (idx !== null && idx !== undefined && PS) ? PS.loadProfile(idx) : null;
  const onFile = (profile && typeof window.hqLook === 'function') ? window.hqLook(profile) : null;
  const [gender, setGender] = React.useState(onFile ? onFile.gender : 'male');
  const [appearance, setAppearance] = React.useState(() => onFile ? onFile.appearance : (window.normalizeCharacterAppearance ? window.normalizeCharacterAppearance(Object.assign({ body: 'mpfb_male' }, window.mpfbFacePatch ? window.mpfbFacePatch(null, 'mpfb_male') : {})) : null));   // (creator step 5: a new officer starts on the MPFB body; + THE DEFAULT FACES)
  const [photo, setPhoto] = React.useState(onFile ? onFile.portrait : null);
  const [lookName, setLookName] = React.useState(onFile && onFile.name ? onFile.name : (intake && profile && profile.username ? String(profile.username).slice(0, 24) : ''));   // rev 10: the look wears a name (the intake starts it at the callsign)
  const [status, setStatus] = React.useState(intake ? 'Build your agent — the look, the name. ENLIST files them on your card and opens the building.' : (onFile ? 'A look is on file. Change it here; SAVE files it and takes the photo.' : 'No look on file yet. Build one — SAVE files it on your card and takes the photo.'));
  const [dirty, setDirty] = React.useState(false);
  const change = (changes, g) => {
    setAppearance(window.normalizeCharacterAppearance ? window.normalizeCharacterAppearance({ ...(appearance || {}), ...(changes || {}) }) : { ...(appearance || {}), ...(changes || {}) });
    if (g) setGender(g);
    setDirty(true);
  };
  const takePhoto = () => {
    const url = window.EWCharViewer && typeof window.EWCharViewer.snapshot === 'function' ? window.EWCharViewer.snapshot({ w: 256, h: 320 }) : null;
    if (url) { setPhoto(url); setStatus('Photo taken.'); } else setStatus('The stage has not finished loading — the photo will be taken when you SAVE.');
    return url;
  };
  const save = () => {
    if (!profile || typeof window.hqSetLook !== 'function') { setStatus('No card on file — sign in at Reception first.'); return; }
    const url = (window.EWCharViewer && typeof window.EWCharViewer.snapshot === 'function' ? window.EWCharViewer.snapshot({ w: 256, h: 320 }) : null) || photo || null;
    if (intake) {
      /* THE INTAKE: one transaction on the profile (map.js), then the building */
      const rec = (typeof window._hqIntakeEnlist === 'function') ? window._hqIntakeEnlist({ gender, appearance, portrait: url, name: lookName }) : null;
      if (!rec) { setStatus('The agent could not be filed — try again.'); return; }
      setPhoto(url); setDirty(false);
      try { if (typeof playDoorSfx === 'function') playDoorSfx('stamp', { volume: 0.5 }); } catch (e) {}
      if (typeof props.onDone === 'function') props.onDone(rec);
      return;
    }
    window.hqSetLook(profile, { gender, appearance, portrait: url, name: lookName });
    if (typeof window.hqSetAvatar === 'function') window.hqSetAvatar(profile, 'look');
    /* an enlisted officer's new look walks into the next fight too (data.js hqOfficerEnlist re-files member 0 in place) */
    try { if (typeof window.hqOfficerOnFile === 'function' && window.hqOfficerOnFile(profile) && typeof window.hqOfficerEnlist === 'function') window.hqOfficerEnlist(profile, { name: lookName }); } catch (e) {}
    PS.saveProfile(idx, profile);
    setPhoto(url); setDirty(false);
    setStatus(url ? 'Filed. The card wears the photo; you walk the building as this look.' : 'Filed without a photo (the stage was not ready) — press TAKE PHOTO once it shows.');
    try { if (typeof playDoorSfx === 'function') playDoorSfx('stamp', { volume: 0.5 }); } catch (e) {}
    if (typeof window._hqRefreshAvatar === 'function') window._hqRefreshAvatar();
    if (typeof window._refreshReactProfile === 'function') window._refreshReactProfile();
  };
  const clear = () => {
    if (!profile || typeof window.hqSetLook !== 'function') return;
    window.hqSetLook(profile, null);
    PS.saveProfile(idx, profile);
    setPhoto(null); setDirty(false);
    setStatus('Cleared. The card goes back to your vessel’s portrait; the chair to the recruit.');
    if (typeof window._hqRefreshAvatar === 'function') window._hqRefreshAvatar();
  };
  const close = () => { if (intake) { if (typeof props.onCancel === 'function') props.onCancel(); return; } if (typeof window._unmountReactCreator === 'function') window._unmountReactCreator(); };
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); close(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  // THE WALK STYLE (2026-11-05): the WALK button reads STOP WALK while the stage's walk loops
  const [mirrorWalking, setMirrorWalking] = React.useState(false);
  React.useEffect(() => {
    const cv = window.EWCharViewer;
    if (cv && typeof cv.onState === 'function') cv.onState((ps) => setMirrorWalking(!!(ps && ps.playing === 'walk')));
    return () => { if (cv && typeof cv.onState === 'function') cv.onState(null); };
  }, []);
  const viewerLoads = !!(window.EWCharViewer && window.EWCharViewer.supports && window.EWCharViewer.supports('door agent', gender));
  return h('div', { className: 'pb-officer' + (intake ? ' intake' : ''), role: 'dialog', 'aria-label': intake ? 'The intake — create your agent' : 'Character creator' },
    h('div', { className: 'pb-officer-head' },
      intake ? h('div', null, h('b', null, L.title || 'THE INTAKE'), h('span', null, ' · ' + (L.sub || 'D.O.O.R. HEADQUARTERS · FORM 1 · YOUR AGENT')), h('em', { className: 'pb-officer-brief' }, L.brief || 'A FREELANCER D.O.O.R. AGENT'))
             : h('div', null, h('b', null, 'THE MIRROR'), h('span', null, ' · OCCAM’S BARBERSHOP · YOUR OWN LOOK · ROOM 1287')),
      h('div', { className: 'pb-creator-options', style: { margin: 0 } },
        h('button', { className: 'ms-tty-btn', onClick: () => window.EWCharViewer?.resetView() }, 'FULL BODY'),
        h('button', { className: 'ms-tty-btn', onClick: () => window.EWCharViewer?.viewHead() }, 'FACE CLOSE-UP'),
        h('button', { className: 'ms-tty-btn' + (mirrorWalking ? ' primary' : ''), onClick: () => {   // THE WALK STYLE: loops until pressed again
          const cv = window.EWCharViewer;
          if (cv?.isWalking?.()) { cv.stopPreview(); return; }
          cv?.resetView(); cv?.walk ? cv.walk() : cv?.play('walk', { full: true, loop: true, name: 'Walk' });
        } }, mirrorWalking ? 'STOP WALK' : 'WALK'),
        h('button', { className: 'ms-tty-btn' + (intake ? ' ew-back' : ''), onClick: close }, intake ? (L.back || 'BACK TO THE MENU') : (dirty ? 'CLOSE · UNSAVED' : 'CLOSE')))),
    h('div', { className: 'pb-officer-body' },
      h('div', { className: 'pb-officer-stage' },
        h(HeroViewer3D, { race: 'door agent', gender, cls: 'Vessel', focus: 0.5, appearance }),   // HOMOSAPIEN OUT (2026-10-23): the look on the DOOR Agent
        !viewerLoads ? h('p', { className: 'pb-creator-note', style: { position: 'absolute', left: 16, top: 16 } }, 'The 3D stage is unavailable here — the look still files.') : null),
      h('div', { className: 'pb-officer-controls' },
        h('div', { className: 'pb-creator' },
          h(CreatorControls, { appearance, gender, disabled: !profile, onChange: change,
            name: lookName, onName: (v) => { setLookName(v); setDirty(true); }, onLoad: (e) => { change(e.appearance, e.gender); setLookName(e.name); }, footer:
            h('div', { className: 'pb-creator-options' },
              h('button', { className: 'ms-tty-btn', onClick: () => change(Object.assign(window.randomCharacterAppearance ? window.randomCharacterAppearance() : {}, { body: (appearance && appearance.body) || 'mpfb_male' })) }, '⚄ RANDOMIZE'),   // (keeps the body picked)
              h('button', { className: 'ms-tty-btn', onClick: () => change(window.normalizeCharacterAppearance ? window.normalizeCharacterAppearance(Object.assign({ body: gender === 'female' ? 'mpfb_female' : 'mpfb_male' }, window.mpfbFacePatch ? window.mpfbFacePatch(null, gender === 'female' ? 'mpfb_female' : 'mpfb_male') : {})) : {}) }, 'RESET')) })))),
    h('div', { className: 'pb-officer-foot' },
      photo ? h('img', { className: 'pb-officer-photo', src: photo, alt: 'Your card photo', draggable: false }) : h('div', { className: 'pb-officer-photo pending' }, 'PHOTO PENDING'),
      h('div', { className: 'pb-officer-status' }, status),
      h('button', { className: 'ms-tty-btn', disabled: !profile, onClick: takePhoto }, '📷 TAKE PHOTO'),
      (onFile && !intake) ? h('button', { className: 'ms-tty-btn', disabled: !profile, onClick: clear }, 'CLEAR LOOK') : null,
      h('button', { className: 'ms-tty-btn primary', disabled: !profile, onClick: save }, intake ? (L.enlist || 'ENLIST · FILE THE AGENT') : 'SAVE LOOK · FILE ON CARD')));
}
if (typeof window !== 'undefined') window._ewCreatorParts = { CreatorControls, OfficerCreator, HeroViewer3D };   // the tests render these headlessly
let _creatorRoot = null;
window._mountReactCreator = function () {
  const opts = arguments[0] || null;   // THE INTAKE (2026-09-21): { intake, onDone, onCancel } from map.js; the mirror passes nothing
  let c = document.getElementById('creatorOverlay');
  if (!c) { c = document.createElement('div'); c.id = 'creatorOverlay'; document.body.appendChild(c); }
  if (!_creatorRoot) _creatorRoot = ReactDOM.createRoot(c);
  _creatorRoot.render(h(OfficerCreator, opts));
};
window._unmountReactCreator = function () {
  if (_creatorRoot) { _creatorRoot.unmount(); _creatorRoot = null; }
  if (window.EWCharViewer) window.EWCharViewer.unmount();
  const el = document.getElementById('creatorOverlay');
  if (el) el.innerHTML = '';
};

})();
