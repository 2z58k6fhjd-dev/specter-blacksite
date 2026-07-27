# SPECTER v2.1.1 — Startup Fix

Fixes the startup crash: `Cannot access currentWeapon before initialization`.

## Simplest update
Replace only `game.js`, then hard-refresh the page.

## Recommended update
Replace `game.js`, `index.html`, and `service-worker.js` so GitHub Pages and the browser cannot keep the broken cached script.
