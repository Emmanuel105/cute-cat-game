# Night log — 21 September 2026

What Claude did to Dimension Cat while you slept. Newest at the bottom. Every round is a commit;
`git log` has the detail, `qa/` has the screenshots each round was checked against.

## Round 1 — the people, and white ink

**Before:** everyone in the Neighborhood wore the same red shirt. Arms hung dead straight and ended in
nothing. Feet floated ten centimetres above the ground. Shirts came up to the chin.

**Now:** every townsperson has hands (mittens with a thumb), a neck, a chest that tapers to a waist,
elbows that rest bent, and shoes flat on the ground with a toe and a heel. Clothes are layered:
jackets, striped tops, aprons, belts, buttons, scarves, satchels, backpacks, sashes on dresses, flat
caps. Faces differ in eye size, spacing, brow angle and mouth, and can have glasses, freckles,
beards or moustaches. Slim, average and stout builds. **Children** — with a child's big head and
short limbs — in the Neighborhood, on the shore, on Frosty Peak and in the Victorian town.

The reason everyone was red: each shirt colour was rolled on its own, and dice clump. Clothes now come
out of a shuffled bag per world, so no two neighbours can match.

Standing still, people breathe, shift their weight, glance around and sometimes wave.

**White ink**, one pixel wide, as you asked. It reads as chalk on paper, pops at night in the
Victorian street and in Robot City, and quietly vanishes against snow and sky.

Cost: a person is 51 meshes instead of 37; the heaviest world (Victorian) went from 2595 to 3013 draw
calls and still runs at ~78 fps in the headless benchmark (`node qa/bench.mjs`).
