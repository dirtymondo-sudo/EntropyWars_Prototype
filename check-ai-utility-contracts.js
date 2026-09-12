'use strict';
// Run the current production-function utility contract regressions.
// These are controlled tests, not browser play, AI simulation or Phase 6 acceptance.
// The earlier observations-only probes were superseded by these assertions.
const {spawnSync}=require('node:child_process');
const result=spawnSync(process.execPath,['--test',
    'ai-chivalry.test.js','chivalry-landing.test.js',
    'trick-room-order.test.js','trick-room-lifecycle.test.js','simul-speed.test.js',
    'ai-lattice-value.test.js','ai-prism-selfcast.test.js'],{cwd:__dirname,stdio:'inherit'});
if(result.error){console.error(result.error.message);process.exitCode=1;}
else process.exitCode=result.status ?? 1;
