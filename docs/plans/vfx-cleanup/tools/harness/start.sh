#!/bin/bash
# start the VFX ctl and load SA + SV into the page.  start.sh [--gpu webgl2]
curl -s localhost:${CPORT:-4700}/quit >/dev/null 2>&1; sleep 1
cd /home/user/EntropyWars_Prototype && (nohup node /tmp/sv/sv-ctl.js "$@" > /tmp/sv/ctl.log 2>&1 &)
sleep 5; for i in $(seq 1 60); do r=$(/tmp/sv/e.sh 'return typeof GAME+" "+(typeof ThreeRenderer)+" "+(typeof startMatch)' 2>/dev/null); echo "$r" | grep -q "object object function" && break; sleep 4; done
/tmp/sv/inject.sh
