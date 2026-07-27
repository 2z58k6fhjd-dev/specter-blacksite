# SPECTER: Blacksite v1.2 — Weapon Sprite Rendering Fix

This build fixes the actual reason the weapon appeared unchanged. v1.1 loaded the new PNG files, but the renderer still drew the old procedural HK416 over them. v1.2 removes that legacy rendering path and draws the replacement weapon assets directly.

## Fixed in v1.2

- New rifle PNG is now visibly rendered in hip-fire
- New rifle ADS PNG is now visibly rendered while aiming
- New pistol PNGs are now used
- Legacy procedural weapon drawing removed
- Asset URLs include a v1.2 cache-busting query
- HUD shows BUILD v1.2 for easy verification
- Service worker immediately activates and deletes every older SPECTER cache

## Install

Replace every existing repository file with this package, including the entire `assets` folder. After GitHub Pages finishes deploying, open the game in a Private tab once or clear the old site data. The upper-left HUD must read `BUILD v1.2`.
