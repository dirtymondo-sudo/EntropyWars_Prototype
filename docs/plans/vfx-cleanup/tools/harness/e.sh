#!/bin/bash
curl -s -X POST --data-binary "$1" localhost:${CPORT:-4700}/eval; echo
