# SPECTER: Blacksite — Mobile v0.2

A self-contained retro tactical shooter based on the supplied Specter character and equipment references.

## New in v0.2
- Larger mission map
- HK416-style rifle and M9A4-style pistol
- Weapon swapping, magazines, reserves, and timed reloading
- Rifle and heavy enemy types
- Health and armor systems
- Ammo, medkit, and armor pickups
- Multi-stage mission objectives
- Security relay, encrypted drive, access key, and extraction
- Saved progress
- Operator dossier using the supplied artwork
- Offline-capable PWA manifest and service worker
- Improved iPhone landscape controls
- Lightweight generated sound effects

## Mobile controls
- Left stick: movement and strafing
- Right stick: turning
- FIRE: shoot
- R: reload
- USE: interact with extraction
- 1/2: swap rifle and pistol
- Pause: pause/resume; restart after death

## How to run
The game files must be served from a website or local web server. Opening the HTML directly from the iPhone Files app may not run correctly.

Once hosted:
1. Open the game URL in Safari.
2. Tap Share.
3. Tap **Add to Home Screen**.
4. Launch SPECTER from the new icon.
5. After the first successful load, the service worker stores the game for offline play.

The game is entirely static and needs no database or server-side code.
