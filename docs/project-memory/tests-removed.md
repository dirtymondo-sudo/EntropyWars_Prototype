---
name: tests-removed
description: 2026-09-29 the whole test suite, check-* tools and CI workflow were slated for deletion; zip remove-tests/ENTROPY_WARS_REMOVE_TESTS.zip
metadata:
  type: project
  modified: 2026-09-29T18:02:29.809Z
---
2026-09-29, thread "Remove the tests": mondo asked for every test gone. Zip /mnt/project-files/remove-tests/ENTROPY_WARS_REMOVE_TESTS.zip holds package.json (test/test:*/grades scripts removed), CLAUDE.md (TOOLING rewritten to NO TESTS, THE RED CI section removed), docs/notes/hq-building-rooms.md (one "run npm test" dropped), plus DELETE_THESE_FILES.txt. Delete list: all root *.test.js (210), test-end.js, test-heavy.js, all check-*.js/.cjs (16), root ci.yml, .github/workflows/ci.yml, and stray docs/notes copies (*.test.js, test-end.js, package.json, CLAUDE.md).

Left alone on purpose: EDITOR_PLAN.md (R6 and §8 still say each phase ships a test + test:end) and docs/notes/editor.md, because the E2 thread was editing them; those lines should be dropped by the editor thread. Playtest harness (playtest_*.js, probe_*.js) and load-data.js stay (load-data.js is used by server.js at boot).

**How to apply:** never re-add tests or CI; see [[editor-plan]] for the plan whose test rows are now void.
