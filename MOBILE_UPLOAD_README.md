# Mobile crash / SFX update — local delivery, not deployed

Upload in this order:

1. All 37 `*_mobile.mp3` files → R2 `Assets/SFX/` (case-sensitive). These are converted copies of the existing Ogg cues, with new filenames. Do not rename them or delete the originals. Set MP3 Content-Type to `audio/mpeg` if your uploader does not do it automatically.
2. `audio.js`, `sprites.js`, `three-renderer.js`, `three-post.js` → the R2 bucket root, replacing those files.
3. `index.html` → Render's application root, then redeploy Render. Its shared cache token is `20260919-mobile-02-cors`.
4. Sync the same source files to GitHub. `CLAUDE.md`, `character-creator.test.js`, `mobile-performance.test.js`, and this README are repository-only. Keep the MP3 copies in repository folder `mobile-audio/` for the asset regression test; their production destination remains `Assets/SFX/`.

The ZIP is flat, as required by the project's delivery workflow. Do not upload the entire ZIP into one R2 folder.

## Changes

- Low performance mode skips creation of the entire post-processing pipeline. Previously, disabling some passes still allocated the composer and eleven bloom targets. Board/HQ direct rendering retains scene lighting and tone mapping, while bloom, CRT, depth of field and post filters are absent in Low mode. Desktop High mode retains its existing post pipeline.
- Unit/prop model loads share a one-at-a-time queue in Low mode. Embedded material textures are reduced to a maximum dimension of 512 pixels before GPU upload; sprite atlases are untouched. A 2048×2048 material map becomes 512×512 (one sixteenth of the texels). This is an asset calculation, not a measured whole-game RAM reduction.
- Sprite-only match preloading now skips hair/fabric assets as well as base character models.
- Tornado images no longer decode eagerly at page load. Low mode requests 25 of the 99 frames while keeping the same animation cycle length; High mode retains all frames on demand.
- Music stays at `preload='none'` until requested; the selected battle track can still warm during match loading.
- File SFX use the existing shared Web Audio context, resumed from user gestures, rather than a new HTML audio player for every delayed/network event. Decoding is limited to two concurrent loads, the decoded cache to 8 MiB, pending URLs to 16 and simultaneous file voices to 12. Late cold-load cues are dropped after 1.2 seconds rather than played out of sync. Common cues warm at audio unlock. Existing mixer volumes/cooldowns remain in use.
- All 37 Ogg SFX have supplied MP3 replacements; no server or gameplay/online simulation rules changed. Sound playback remains client-local for both host and guest.

The MP3 copies also avoid relying on Ogg container support on older iOS versions. WebKit documents Ogg support arriving in Safari 18.4: https://webkit.org/blog/16574/webkit-features-in-safari-18-4/
The game CDN's audio CORS response was checked for `https://entropywars-prototype.onrender.com`. Other hosting origins must already be included in the bucket's CORS policy for cross-origin assets.

## Verification

- All 204 JavaScript files passed the repository syntax checker; canonical data parity and all 21 content-schema tests passed.
- Targeted mobile, character-loader, audio-mixer, playlist and scene-lifecycle run: 65 passed, 3 optional Three.js-dependent tests skipped, 0 failed. Includes nine new mobile regressions.
- The package's default test command was executed directly with bundled Node (`node --test *.test.js`; npm is unavailable). Initial run: 1,645 passed, 63 skipped, 4 failed. One failure was an isolated character-loader test harness needing the newly extracted helpers; that harness was updated and its targeted rerun passed. The other three failures were reproduced against the downloaded original source: the Astral test pins an obsolete cache token; DUMB dream-lab expects two exits but has three; an Astral sea Greek column is reported standing in water. Those unrelated map/test issues are unchanged.
- Converted audio files were decoded successfully by FFmpeg. No live deployment or browser playtest was performed, and no physical iPhone crash/memory measurement is claimed.

## iPhone 13 check after upload

Use Auto or Low performance mode with the existing 3D-unit override off, then reload. Check menu → HQ, menu → CPU match, one online match as guest, several actions/SFX, and switching to another app and back followed by a tap. If a previously saved High preset is active, select Low first. Cold-network SFX can be silent on their first use if downloading takes longer than the stale-cue deadline; subsequent uses play from cache.

Remaining limits: runtime texture reduction cannot remove the initial decode cost of a single oversized GLB, the persistent model caches are not a complete memory-budget system, and a real phone run is still needed to establish whether these changes eliminate the reported crash. Ogg music tracks are unchanged; this conversion set covers SFX.
