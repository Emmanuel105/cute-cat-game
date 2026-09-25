# Night log — 21 September 2026

**In the morning:** open `dimension_cat.html` at the repo root (or `npm run dev` and visit
`/dimension_cat.html`). Everything below is committed, one commit per round; `git log` has the
detail. Screenshots from every round are in `qa/` (folders `l6`, `sf1`, `ll1`, `bs3`, `cy1`, `hc3`,
`sl1`, `fr2`, `tk2`, `pa2`…). `node dimension-cat/test/run.mjs` runs the 270-odd checks;
`node qa/bench.mjs` measures draw calls and frame rate per world.

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

## Round 2 — waves, and no more slashes across the sky

Turning the ink white showed up something that was always there: the zipline, the gondola cables
and the lantern strings are a pixel wide, so the ink pass drew both their edges and they came out as
solid lines across the sky. They now stay out of the ink pass entirely (they still hide behind things
properly) and read as thin dark cables again.

People give the cat a **wave** the first time it walks up to them. Gentlemen still tip their hat.

Tests added: no two neighbours share a shirt, the children are small, everyone has hands, and a
neighbour really does lift an arm when the cat comes over. 201 checks, all green.

## Round 3 — the same picture for a third fewer draw calls

A person was 51 separate meshes; Victorian has 22 people. Every joint's static parts are now merged
into one vertex-coloured mesh at build time — a person is 20 meshes and looks identical. Then the
same was done for all sixteen creatures. Victorian went from 3013 draw calls (after round 1) to
2305; the forest from 3036 to 2889.

`node qa/bench.mjs` now measures from a fixed spot at noon so its numbers compare run to run.

## Round 4 — the town has something to do

- **Nobody walks in the road.** Strollers keep to the pavements, gardens and park; the asphalt of both
  roads is off limits, so the cars are not forever honking at pedestrians.
- **Two people sit on the park bench**, half-turned toward each other, hands in their laps, and look
  round when the cat comes past.
- **Two children play tag on the east lawn.** One is "it" and chases; the other runs, weaving. When
  caught, the tagged one hops and becomes "it", counts to three, and the chase goes the other way.
  A little rising blip plays on every tag.

Tests: none of the strollers is standing in the road, the sitters' knees are bent, and the children
swap roles (four times in twenty seconds) without leaving the lawn. `node qa/park.mjs` shoots it.

## Round 5 — hellos, and a dog on a lead

- When someone waves at the cat they now **say something** on the HUD: the Neighborhood has its own
  lines ("Aww, who's a good cat?"), so do the Victorian town ("A cat about town! How very modern."),
  the shore ("Careful, the sand's hot!") and the peak ("Have you seen the yeti? He's lovely."), and
  children have theirs everywhere ("Can we keep it?"). Never more than one line every six seconds.
- **A woman walks her dog** up and down the north pavement. The dog trots at her heel on a lead that
  stretches from her hand to its collar, and woofs now and then.

## Round 6 — a snowball fight

Two of the children on Frosty Peak are having a **snowball fight** across the village square: they
wind up, throw, the snowball arcs over and bursts in a puff of snow, and whoever it hits flinches.
They shuffle about between throws. Walk the cat up close and one of them will throw one at *you* —
"Got you, kitty!" — once per visit.

## Round 7 — a beach ball, a paper boy, and voices

- On Sunny Shore **two of the sunbathers keep the beach ball up**: held a moment, thrown in a high
  arc, caught, thrown back. Stand right next to the catcher and it comes down off the cat's head with
  a "Boing!" and hops on to them.
- The Victorian **urchin sells papers**: "Extra! Extra! Cat seen in town!", "Paper, guv'nor?
  Ha'penny!" — called out now and then when the cat is within earshot.
- Every greeting and cry now has a little **talk blip** with it; the beach ball has a soft bounce.
- `qa/bench.mjs` covers Frosty Peak too. All six worlds sit at 300–2900 draw calls and ~90 fps.

## Round 8 — elders, skipping children, and a cane

People now bend from the waist rather than tipping over whole: there is a spine joint at the hips.
About one adult in six is an **elder** — grey or white hair, more often in glasses, a little stooped,
a shade shorter. The two on the park bench are elders now and lean back into it. **Children skip**
when they walk, a hop on every step. Anyone with a **cane** keeps it planted ahead, takes shorter
steps and sways; the Victorian gentlemen with canes go slower, and the paper boy runs.

## Round 9 — a swing, and a ring dance

- A blue **swing set** stands in the park west of the path, and a girl swings on it, kicking her
  legs out at the top of each arc. "Wheee!" when the cat is near.
- In Candy Land four **gingerbread men dance a ring** round the big green lollipop, hand in hand,
  turning about every nine seconds.

## Round 10 — robots at work, a hiker, a bobby

- In Robot City a **loader robot** stands at the end of each conveyor and lifts every crate off as it
  arrives, with a beep, next to the stack it has already unloaded.
- A **hiker** with a backpack walks the stepping stones in Whisper Woods, from the hollow oak to the
  glade and back, and tells you the fairies come out at dusk.
- A **bobby** in a tall helmet patrols the Victorian street, up one side and down the other:
  "'Ello 'ello, what's all this then?"

## Round 11 — the lamplighter

An old **lamplighter** in a flat cap works his way along the Victorian street, lamp to lamp, zig-
zagging across the cobbles. At each one he stops, raises his glowing pole and the lamp flares
brighter for a moment. "Another one lit. Only forty to go." The dog on the lead in the
Neighborhood can now be petted, like the one on the beach.

## Round 12 — "Say hello", and the country baked

- Walk up to anyone and press **E: "Say hello"** (or "Say hi" to a child). They wave — a gentleman
  tips his hat — say their line, and hearts go up.
- The generated country outside each world's centre was 70–80% of what the game drew each frame.
  Every static prop out there is now baked into a single mesh as it is placed: Candy Land draws 866
  calls where it drew 1455, Frosty Peak 1911 instead of 2605, the woods 1551 instead of 2342. It
  looks the same.

## Round 13 — sunbathers, a sandcastle, and a push

- Two **sunbathers** lie flat out on the beach towels in dark glasses, hands behind their heads.
- A **child kneels at the sandcastle**, patting the sand, bucket at hand.
- Walk up to the park swing and press **E: "Push the swing"** — she goes higher for a while.

## Round 14 — a balloon of your own

A **balloon seller** stands just south of the park path with a bunch of six. Press **E: "Take a
balloon"** and one is tied to the cat: it floats above and a little behind, drifting after you, and it
comes with you **through every portal**. Press E again to swap colours. "Balloons! Get your
balloons!"

## Round 15 — the post

A **postie** with a satchel does the round of every mailbox on the main street — the south side
east, the north side west, then round again — stopping at each to post the letters. "Letter for
number twelve!"

## Round 16 — a cyclist

A woman in a yellow cap **rides a green bicycle** round and round the main street in the westbound
lane, pedalling, leaning into the bars. Like the cars she stops for the cat — but rings her bell
instead of honking.

## Round 17 — a horse and carriage

A **horse and carriage** clip-clops east along the Victorian street and round again, lanterns lit,
a top-hatted driver on the box with the reins. It stops for the cat like everything else on the
road. The balloon now floats at the right height whatever shape you are in.

## Round 18 — a kite

A boy on the dunes of Sunny Shore **flies a red and yellow kite**: it swoops in a lazy figure of
eight ten metres up, tail streaming, on a line from his hands. "Higher than the lighthouse!"

## Round 19 — a sled run

On the flank of the west peak a girl **sleds down a twelve-metre drop**, arms in the air —
"Wheeeee!" — skids to a stop in a puff of snow, then trudges back up dragging the sled behind her
on a rope, and goes again.

## Round 21 — a woodcutter, and the Queen's guard

- A stout, bearded **woodcutter** stands at the stump by the forest glade splitting logs: the axe
  goes up over his head and comes down with a thunk and a spray of chips. "Mind the chips, puss."
- **Three gingerbread guards** march in step back and forth in front of the Candy Queen: "Hup, two,
  three, four!" — "Halt! ...who goes there? Oh, a kitty."

## Round 22 — making friends counts

Every "Say hello" to someone new makes a **friend**: five points, a chime, and "New friend! 3 of 11
in Neighborhood". Meet everyone in a world and there is a fanfare and fifty more. Friends are
remembered in the save — the Continue line on the start screen shows how many — and the prompt
changes to "Say hello again" for people you already know.

## Round 23 — friends on the HUD and the map

A **Friends** counter sits under Collected ("1 / 11"). On the mini-map the amber dots are people
still to meet; anyone already greeted fades to grey. A few seconds after you start, a one-time hint
says to walk up to anyone and press E.

## Round 24 — everyone counts

Robots can be greeted too ("Beep hello" — "BEEP BOOP. HELLO, SMALL CAT."), and so can the gingerbread
men ("Hee hee! Mind my icing!"); both hop for joy. The yeti, the Candy Queen and the two dogs count as
friends when you say hi or pet them. Every world now has people to meet: 12 in the Neighborhood, 18
in Candy Land, 21 in Robot City, 24 in the Victorian town, 8 on the shore, 4 on the peak, 2 in the
woods. Where there is nobody, the Friends pill hides.

## Round 25 — the grand finale

Meet everyone in every dimension and there is a **grand finale**: a fanfare, a burst of hearts and
confetti around the cat, and 500 points. The game remembers how many people each world has once
you have visited it, so the finale can only happen after you have been everywhere.

## Round 26 — say cheese

Switch on **photo mode** and anyone within ten metres stops what they are doing, turns to face the
camera and holds a hand up for the picture. Switch it off and they go back to their business.

## Round 27 — chatting, and a painter

- **Two neighbours stand chatting** on the south pavement, facing each other and taking turns:
  the speaker's hands go, the listener nods along. "...and then the cat just walked straight in!"
  Two Victorian ladies in gowns gossip by the square too ("A cat in the square! Whatever next.").
- A **painter** at her easel by the park pond, brush in one hand and palette in the other, dabbing
  at the canvas and stepping back to look. The picture fills in as you watch: sky, hill, and a
  black cat. "Hold still, kitty... perfect."

## Round 28 — a mechanic, and a wonky robot

A **mechanic** kneels over a **wonky robot** on the open floor of Robot City, wrench in hand.
Every so often the wrench bites, sparks fly, and the patient sits bolt upright and beeps —
"SYSTEMS... NOMINAL?" — before slumping back down, unconvinced. "Nearly got it... It's just a
squeaky bearing."

## Round 29 — the snowball fight for real, a gondola that climbs, and the Candy Queen's castle

**Before:** the two kids in Frosty Peak "having a snowball fight" just walked a lazy stroll past
each other — no crouch, no read of a fight at all. The Neighborhood gondola's cable, fixed once
already, still ended up either underground (like a cave) or buried in the decorative mountains
beyond it, depending on which way the bug ran.

- **The snowball fight now reads as one.** Between throws the two kids crouch, knees bent, hands
  low, packing snow — not strolling. The moment it's their turn they square up, wind back and
  throw; hit snowballs are visibly in flight, not just a toast when one lands.
- **The gondola cable climbs cleanly into the sky** instead of diving through the ground or
  disappearing into a mountain — short, steep, and clear of the decorative peaks beyond it.
- **Candy Land, Robot City and the Victorian town are all a great deal bigger** — walkable radius
  up from ~270 (~240 for Victorian) to 480 (420), with the distant skyline, hills and mountains
  pushed out to match, so the walk to the edge of the map is now much longer and the horizon much
  further away.
- **The Candy Queen has a castle.** Striped candy-cane corner towers with pink roofs, a grand
  gate flanked by two smaller towers, and one huge throne hall inside — checkerboard floor,
  candy-cane pillars, lollipop-coloured stained glass, and a fan-backed throne with a cherry on
  top, guarded by two gingerbread men. A little candy village — five brightly-iced round houses —
  lines the lane up to the gate.

## Round 30 — a wash and brush-up

Sit still long enough and the cat **grooms itself**: head ducked down, turned aside to the flank,
with a quick bobbing lick, for a couple of seconds before it settles back to its usual idle
look-around. Left side or right side, whichever way it fancies.

## Round 31 — the squirrel climbs

Pet a squirrel and it **scampers straight up out of reach**, chattering away for a few seconds —
still turned to look down at the cat — before coming back down. It's a plain rise-in-place, not a
climb along any particular trunk, but most squirrels already sit near something tall enough (a
tree, or in Candy Land a lollipop) that it reads as climbing it.

## Round 32 — the clock strikes

Step through the time door and, under the fanfare, the **Victorian clock tower tolls three
times** — a deep bell, felt rather than seen, since the door is clear across town from it.

## Round 33 — a toy mouse for the robot dog

**Offer the robot dog a toy mouse** — mid-chase or not, corner it or just walk up — and it drops
the chase for good, wags, and counts as a friend. Once won over it never goes on alert again,
though it still gives a happy beep now and then when the cat's nearby.

## Round 34 — a forager in Whisper Woods

Whisper Woods only had two people to meet (the woodcutter and the hiker), which felt thin next to
the other worlds. A **mushroom forager** now kneels by one of the glade's patches, reaching down
to pick and lifting each find up before tucking it away — a little chime and a scatter of sparkles
mark every pick. "Chanterelles today — lovely with butter." "Mind the fairy rings, puss." Woods now
has 3 to meet instead of 2.

Also fixed a **flaky end-of-quest test**: stepping through the time door back to the Neighborhood
was timed too tightly against the world-transition chain (1100 ms of slack against ~1020 ms of
real transition time), so on a loaded machine the check could fire before the travel had actually
started, failing "time door → neighborhood" and "save records completion" even with no code change.
Confirmed this reproduced on the unmodified tree too, tracked it to the transition timing margin,
and gave it more headroom (2200 ms) rather than touching any game logic.
