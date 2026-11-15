#!/bin/bash
# THE FRESH CHECK (2026-11-15): a cloud container starts with a clone whose local `origin/main` ref can be
# DAYS old (the image is cached) even though HEAD looks fine. A thread that branches from that ref builds and
# tests on an old game. So every session start refreshes the ref. Never fails the session.
cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || exit 0
[ -d .git ] || cd /home/user/EntropyWars_Prototype 2>/dev/null || exit 0
timeout 60 git fetch origin main --quiet 2>/dev/null || true
exit 0
