#!/bin/bash
# THE SPELL VFX CAPTURE HARNESS, one-time setup in a fresh cloud container (about 2 min).
#   bash docs/plans/vfx-cleanup/tools/harness/setup.sh
# Everything it needs is in this folder (no /mnt/project-files): it installs npm deps, packs the import-map
# packages named in index.html into $EW_HARNESS_DIR (default /tmp/ew-harness), fetches react / react-dom / MeshLine
# from the CDN, and copies the harness to /tmp/sv. Then:
#   node /tmp/sv/sv-run.js --ids docs/plans/vfx-cleanup/batches/<batch>.txt --out /tmp/sv/<batch>
#   python3 /tmp/sv/sv-report.py /tmp/sv/<batch>        (contact sheets)
# Interactive single spells: bash /tmp/sv/start.sh, then /tmp/sv/e.sh '<js>' (see VFX_CLEANUP_PLAN.md section 7).
# Run it from a FRESH checkout (RULE #1d): git fetch origin main && git merge origin/main first.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"; REPO="$(cd "$HERE/../../../../.." && pwd)"
H=${EW_HARNESS_DIR:-/tmp/ew-harness}; mkdir -p $H/pkgs $H/cdn
cp "$HERE/route.js" $H/ && echo "$REPO" > $H/repo.txt
cd "$REPO" && npm install --no-audit --no-fund >/dev/null 2>&1
cd $H/pkgs && for p in $(grep -o 'cdn.jsdelivr.net/npm/[^"/]*@[0-9][^/"]*' "$REPO/index.html" | sed 's#cdn.jsdelivr.net/npm/##' | sort -u); do
  n=${p/@/-}; [ -d "$n" ] && continue; npm pack "$p" --silent >/dev/null; mkdir -p "$n" && tar xzf "$n.tgz" -C "$n" --strip-components=1; done
cd $H/cdn && for f in react.production.min.js react-dom.production.min.js THREE.MeshLine.js; do
  u=$(grep -o "https://cdn.entropywars.net/[^\"?]*$f" "$REPO/index.html" | head -1); [ -n "$u" ] && curl -s --compressed -o $f "$u?r=$RANDOM$RANDOM"; done
mkdir -p /tmp/sv && cp "$HERE"/* /tmp/sv/ && chmod +x /tmp/sv/*.sh
which Xvfb >/dev/null || echo "WARNING: no Xvfb - run with --gpu webgpu (slower)"
echo "spell VFX capture harness ready in /tmp/sv (repo $(git -C "$REPO" log --oneline -1 | cut -c1-60))"
