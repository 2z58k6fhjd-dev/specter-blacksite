# SPECTER: Blacksite v1.4 — Transparent Weapon Sprite Fix

This build corrects the large rectangular weapon-image problem from v1.3.

## Fixed in v1.4

- Removed the full rectangular backgrounds around the rifle and pistol sprites
- Added transparent alpha around all four weapon frames
- Reduced first-person weapon scale so the rifle no longer covers most of the screen
- Repositioned hip-fire and ADS views lower and farther right
- Preserved the VOLK enemies, power switch, flashlight, ADS, reload, vertical aim, and mobile controls
- Added the in-game `BUILD v1.4` marker
- Updated asset cache-busting and the service-worker cache name

## Install

Replace every file in the GitHub Pages repository, including the entire `assets` folder. Wait for the Pages deployment to finish, then reload the game. A private window may be useful if an older service worker is still active.
