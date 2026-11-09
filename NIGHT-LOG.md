`node dimension-cat/test/run.mjs` ran clean: exit 0, all 277 checks `ok`, 0 console warnings. No visual
check was possible in this environment (no browser, no Playwright) — only the stub-three test suite
and the two headless probes above. Rebuilt `dist/dimension_cat.html`, `dist/artifact.html` and the
root copy.

## Round 1026 — Whisper Woods gets a street organ grinder, the last of the seven worlds

Victorian, Candy Land, Robot City, the Neighborhood, Sunny Shore and Frosty Peak all have a street
organ grinder busking by now (55-npcs.js's `OrganGrinder`, fixed a couple of rounds back to read its
own physics box off `game.physics.ground0(ox, oz) + 0.68` rather than a bare `0.68`, so it sits right
on a slope instead of floating or sinking). **Whisper Woods is the last of the seven worlds to get its
own: a hand-cranked barrel organ busking on the open forest floor east of the fiddler, well clear of
the stepping-stone path and the herbalist's stall above.** *"Tuppence a tune — even the owls stop to
listen, once in a while."* *"Careful, puss — damp wood and brass gears, and this one's never once made
it out of these trees for a clean."* *"Thirty tunes in the barrel, and the moss underfoot has never
once thrown off the beat."* Every world now has one.

No new mechanism: `OrganGrinder` and `makeBarrelOrgan()` (60-props.js) are reused verbatim from the six
worlds that already have one — only the wardrobe, spot and lines are new.

A headless probe (a scratch script on the same stub-three harness `test/run.mjs` itself uses:
`elements.get('enter').listeners.click[0]()`, `game.travel(6, 'from-hub')` waited out for real, then
1800 simulated frames sampling every NPC's own position every 15th frame) swept a 2 m grid of the open
forest floor (radius 20–54, short of the radius (58) where `forestRegion`'s own fill takes over)
against both those samples and every one of the wood's own physics boxes, rejecting anywhere
`game.zones` already claims: a finer 0.5 m re-sweep of the best region landed on (50.5, -11.5) — 8.03 m
clear of the nearest box and 8.51 m clear of the nearest wandering soul (comfortably past both the
fiddler and the herbalist's stall), at radius 51.8, on ground levelling out at 0.78 m and varying only
3.1 cm across the grinder's own footprint.

Verified past the test suite with a second headless probe: found the new `OrganGrinder` in `game.npcs`,
confirmed both its rig and the organ sit under the scene, ran 700 simulated frames with the rig's
position and head rotation staying finite throughout, checked the organ's own physics box directly —
its centre Y matches `ground0(ox, oz) + 0.68` exactly — then walked the cat to 1 m from the grinder and
called the nearest interactable's `onUse()` directly: the prompt read "Say hello" and
`game.state.friends.size` went 0 → 1.

`node dimension-cat/test/run.mjs` ran clean: exit 0, all 277 checks `ok`, 0 console warnings (the
friend count for world 6 ticked up by one, "151 to meet", a reported figure rather than a fixed
assertion, so nothing else needed to change). No visual check was possible in this environment (no
browser, no Playwright) — only the stub-three test suite and the two headless probes above. Rebuilt
`dist/dimension_cat.html`, `dist/artifact.html` and the root copy.
