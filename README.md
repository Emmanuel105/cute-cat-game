# 🐱 Cute Cat Game

A 3D adventure game built with [Three.js](https://threejs.org/). Pick your character, explore four worlds, collect treats, chase a mouse, and unlock magic portals!

**Play it here → https://emmanuel105.github.io/cute-cat-game/**

## Features

- **3 characters**: 🐱 Cat (balanced) · 🐰 Bunny (super jumps) · 🐶 Dog (super speed)
- **4 worlds** connected by magic portals (collect score to unlock them):
  1. 🌳 **Sunny Meadow** — grass, flowers, a cozy house, and a day/night cycle
  2. ❄️ **Snowy Peaks** — snowmen, frozen ponds, ice platforms, and falling snow
  3. 🌙 **Moon Base** — low gravity, glowing crystals, craters, and Earth in the sky
  4. 🍭 **Candy Kingdom** — lollipop trees, gumdrops, a chocolate river, and bouncy jumps
- **5 skins**, 3 camera modes (3rd person / 1st person / cinematic), and a saved high score

## Pages

- **Game:** `index.html` — the full game
- **Viewer:** `viewer.html` — a simple 3D cat you can orbit and poke

### Controls

| Key | Action |
|---|---|
| W / S | Move forward / back |
| A / D | Turn left / right |
| Shift | Run (uses energy) |
| Space | Jump |
| C | Switch camera (3rd person / 1st person / cinematic) |
| Mouse drag | Rotate camera |
| Scroll | Zoom |

## Development

```bash
npm install     # install dependencies (first time only)
npm run dev     # start the dev server at http://localhost:5173
npm run build   # build the production bundle into dist/
npm run preview # preview the production build locally
```

## Project structure

```
index.html            game page (UI + HUD)
viewer.html           cat viewer page
src/
  main.js             entry point + game loop
  viewer.js           cat viewer scene
  game/
    scene.js          renderer, camera, lights, sky
    world.js          ground, trees, house, platforms
    cat.js            the cat model + skins
    collectibles.js   items + chase mouse
    particles.js      dust / sparkle effects
    physics.js        platform collision
    input.js          keyboard + mouse handling
    daynight.js       day/night cycle
    ui.js             HUD, start screen, messages
    state.js          shared game state
legacy/               the original single-file prototypes
```

## Deployment

Every push to `main` automatically builds and deploys to GitHub Pages via `.github/workflows/deploy.yml`.
