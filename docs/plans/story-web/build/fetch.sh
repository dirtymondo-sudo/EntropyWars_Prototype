#!/bin/bash
# usage: fetch.sh "<object key>" outfile
enc=$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1],safe=''))" "$1")
curl -sS -o "$2" -w "%{http_code}" "https://api.cloudflare.com/client/v4/accounts/b2608d464c04fdeec48ba91f04b8aeb7/r2/buckets/ewmusicsfx/objects/$enc"
