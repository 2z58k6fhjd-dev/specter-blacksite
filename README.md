# SPECTER: Blacksite v2.2.1 — Audited Milestone 1 Enemy AI

This build completes the first major gameplay milestone.

## Enemy behavior
- Patrol routes with separate sectors
- Hearing for gunshots and the facility power switch
- Flashlight-beam detection in darkness
- Suspicion and escalation instead of instant omniscience
- Investigation of sound locations
- Last-known-position searching after losing sight
- Distinct aggressive, cautious/flanking, and defensive/cover personalities
- Radio callouts and squad alert propagation
- Reinforcement call and delayed arrival from the south corridor
- Burst-fire behavior, tracer effects, and distance-based accuracy

## Controls
WASD move, mouse look, left click fire, right click ADS, E interact, F flashlight, R reload, 1 rifle, 2 pistol.

## Installation
Replace the live repository files with this package and keep all files together in the repository root.


## Audit corrections in 2.2.1
- Isolated collision and sight raycasts to static world geometry so the player's camera-mounted gun cannot block movement, bullets, or enemy vision.
- Corrected bullet-decal orientation on rotated surfaces.
- Corrected enemy tracer origin so it follows the enemy rifle direction.
- Prevented mission-complete messages from firing every rendered frame.
- Restricted extraction completion to the marked extraction footprint.
- Added a mobile weapon-swap button and aim-release failsafes.
