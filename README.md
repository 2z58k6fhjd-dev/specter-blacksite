# SPECTER: Blacksite v2.0.1 — Module Import Fix

This patch fixes the browser error: `Failed to resolve module specifier "three"`.

Upload all files to the repository root, replacing the v2.0 files. After GitHub Pages deploys, hard-refresh the page with Ctrl+F5. If the old service worker remains active, open DevTools → Application → Service Workers → Unregister, then refresh once.

# SPECTER: Blacksite v2.0 — True 3D Browser Prototype

This is a new Three.js/WebGL foundation rather than an update to the old raycaster.

## What is genuinely 3D

- Polygonal rooms, floor, ceiling, walls, cover, pipes, and light fixtures
- Perspective camera with unrestricted horizontal and vertical look
- Dynamic facility lights and a shadow-casting weapon flashlight
- 3D first-person HK416-style placeholder model attached to the camera
- 3D VOLK-style enemy figures with depth, lighting, shadows, health, and movement
- Raycast shooting through the actual 3D scene
- Collision against 3D level geometry
- Interactive power switch
- Extraction zone and playable mission flow
- Desktop pointer-lock controls and mobile twin-stick controls

## Run / publish

Upload all files to the root of the existing GitHub Pages repository. The browser must be online because this early prototype imports Three.js from jsDelivr.

The public URL remains:

`https://2z58k6fhjd-dev.github.io/specter-blacksite/`

## Controls

- WASD: move
- Mouse: look
- Left click: fire
- Right click: aim
- E: interact
- F: flashlight
- R: reload
- Shift: sprint

## Important limitation

The environment and weapons are real 3D, but the models are currently constructed from primitive meshes. The next milestone is importing proper GLB models for Specter's hands/weapons and the VOLK enemy.
