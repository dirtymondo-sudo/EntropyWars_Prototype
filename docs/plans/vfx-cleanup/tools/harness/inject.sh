#!/bin/bash
for f in /tmp/sv/sa-lib.js /tmp/sv/sv-lib.js; do S=$(python3 -c 'import sys,json;print(json.dumps(open(sys.argv[1]).read()))' $f); /tmp/sv/e.sh "(0,eval)($S); return 1" >/dev/null; done; echo injected
