# Dimension Cat

A seven-world third-person cat adventure in a single HTML file (three.js r160, everything else procedural).

## Play it

- `dist/dimension_cat.html` — the playable game. Open it in Chrome/Safari/Firefox (needs internet once, to fetch three.js from a CDN).
- Local dev: `python3 -m http.server 8787` in this folder, then open http://127.0.0.1:8787/dist/dimension_cat.html

## Worlds

| # | World | How you get there | Who lives there |
|---|---|---|---|
| 0 | 🏠 Neighborhood | spawn (inside the house) | neighbours, cars, a squirrel |
| 1 | 🍭 Candy Land | stone ring in the park | gingerbread men, the Candy Queen |
| 2 | 🤖 Robot City | airlock behind the Queen | robot workers, the robot dog |
| 3 | 🎩 Victorian | little wooden door in the factory | top-hats and bonnets, the ginger boy at the time door |
| 4 | 🏖️ Sunny Shore | boardwalk arch east of the road | crabs, seagulls, turtles, sunbathers, a dog that follows you |
| 5 | ❄️ Frosty Peak | gondola station west of the road | penguins, reindeer, kids in beanies, a friendly yeti |
| 6 | 🍄 Whisper Woods | hollow oak south-east of the park | deer, foxes, frogs, owls, fairies, butterflies |

A signpost at the front gate points the way. Each world has a squirrel to befriend and eight collectibles. The Neighborhood runs a four-minute day/night cycle: porch lights, windows and street lamps come on at dusk.

The HUD has a round mini-map (bottom-left, `Tab` toggles it): north is up, the pink wedge is the cat, green rings are portals and doors, brown dots are squirrels, white dots are collectibles.

## Files

- `src/` — the source, concatenated in filename order by `build.py`:
  - `00-head.html` styles + DOM (start screen, HUD, help overlay)
  - `10-boot.js` loads three.js from jsdelivr → unpkg → cdnjs
  - `20-util.js` math, seeded RNG, geometry cache, material helpers, tweens
  - `25-textures.js` / `27-textures-nature.js` canvas-painted textures (grass, cobble, candy, metal, brick, fur, sand, snow, water, bark, forest floor…)
  - `30-audio.js` WebAudio-synthesised sound effects
  - `35-sky.js` gradient sky shader, stars, moon, clouds
  - `40-physics.js` AABB + circle collision, step-up, terrain height, camera ray
  - `45-particles.js` particle systems (bursts + ambient: sparkles, fireflies, snowfall)
  - `50-cat.js` / `52-cat-skins.js` the rigged cat and its seven skins
  - `55-npcs.js` humans, gingerbread men, robots, robot dog, squirrels, candy cat + AI controllers
  - `56-npcs-wild.js` crab, seagull, turtle, dog, deer, fox, penguin, yeti, frog, owl, fairy, butterfly + Flyer / Hopper / Follower controllers
  - `60-props.js` houses, the furnished home, fences, cars, lamps, portals, doors, candy, city, victorian props
  - `62-props-nature.js` terrain + animated sea, palms, huts, lighthouse, pier, cabins, igloos, campfire, aurora, big trees, mushrooms, treehouse, hub portals, signpost
  - `65-collectibles.js` fish / yarn / mouse / star
  - `70-worlds.js` world registry + the first four worlds; `72-world-beach.js`, `73-world-snow.js`, `74-world-forest.js` the new three
  - `80-game.js` renderer, camera, input, HUD, transitions, main loop
- `build.py` — `python3 build.py` writes `dist/dimension_cat.html` (and `dist/artifact.html`, body-only for hosting).
- `test/run.mjs` — `node test/run.mjs` runs the whole game headless against a stub three.js: movement, collision, doors, collectibles, squirrel quest, save/restore, touch joystick, photo mode, every world transition and the ending (140 checks).
- `../qa/run7.mjs` — `node qa/run7.mjs` (from the repo root) drives the built file in a headless Chromium via Playwright: new game → save → Continue → Start over, photo mode PNG download, and a phone-sized touch context with the joystick and buttons (26 checks, screenshots in `qa/r7/`). It points at the Chromium shell in `~/Library/Caches/ms-playwright`.

## Controls

W forward · S u-turn and walk back · A/D strafe (cat faces the way it walks) · Shift run · Space jump · E or click interact · M meow · Tab map · P photo mode (Enter saves a PNG) · drag/wheel orbit and zoom · ? controls.

On phones and tablets a joystick (left) and run / jump / meow / use buttons (right) appear; drag anywhere else to orbit the camera. The use button turns green when something is in range.

The cat sits after a few seconds idle, loafs after eight, and stretches when it gets up. Footsteps change with the surface (grass, sand, snow, cobble, planks). People turn their heads to watch the cat go by; Victorian gentlemen tip their hats.

## Quest

Befriend the squirrels (walk up slowly, press E). With four friends, the ginger boy in the Victorian street steps aside from the time door, which takes you home and completes the journey (+1000). Befriending all seven earns a +500 bonus, before or after the ending. Collect fish, yarn, mice and stars for score; the yarn on the couch needs a jump.

## Save game

Progress (score, collectibles, squirrel friends, world and position) is saved to the browser's localStorage on every pickup, friend and portal, and when the tab is hidden. The start screen offers **Continue** when a save exists, and **Start over** wipes it.

## Debug hooks

`window.DC` is the game. Useful in DevTools: `DC.travel(4, 'from-hub')` jump to a world (0–6; use `'from-prev'` for 1–3, `'from-hub'` for 4–6), `DC.cat.group.position.set(x, y, z)` teleport, `DC.state`, `DC.save()` / `DC.wipeSave()`, `DC.togglePhoto()`.
