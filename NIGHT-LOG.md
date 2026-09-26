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

## Round 35 — an ice fisherman on Frosty Peak

Frosty Peak had plenty of wildlife and the yeti, but not one grown-up to say hello to — every
greetable person there was a child. An **ice fisherman** now sits on a stool at the edge of the
frozen pond, rod dipped into a hole cut in the ice, line trailing down. Most of the time it's just
a slow jiggle, but every 7–13 seconds he gets a bite: the rod dips hard, a scatter of ice and water
flies up out of the hole, and a chime marks the catch — "Got one!" "Not a bite in an hour..."
"Careful, puss, don't scare them off." Frosty Peak now has 5 people to meet instead of 4.

## Round 36 — a fisherman on the pier

Sunny Shore had a whole pier out over the water with nobody on it. A **fisherman** now sits on a
stool near its end, rod cast out past the tip, line trailing down to the water — the same rig as
Frosty Peak's ice angler, given a seat that isn't tied to the ground so it can sit up on the pier
deck over open water instead of down on the pond ice. Every so often the rod dips and a splash of
spray marks a catch — "Not a nibble all morning." "Best spot on the whole pier, this." Sunny Shore
now has 9 people to meet instead of 8.

## Round 37 — the ginger boy gets his due

The comment next to the ginger boy by the Victorian time door had read "the story that goes with
him is still to come" since the day he was built — he's had lines for ages, but talking to him
never actually made him a friend, so he didn't count toward Victorian's total and never triggered
the new-friend chime. He's now wired up properly with `game.namedFriend()`, the same way the yeti
and the Candy Queen are: the first chat befriends him, with hearts and a line of his own —
**"You stopped! Everyone else just dashes through the door. I'm glad you didn't."** — and only
after that does he fall back to his usual lines about the door, the future and the fog. Victorian
now has 27 people to meet instead of 26.

## Round 38 — a birdwatcher in Whisper Woods

Whisper Woods was still the thinnest world to meet people in, even after the forager. A
**birdwatcher** now stands near the owls' tree at the edge of the glade, binoculars in hand,
scanning the canopy. Every few seconds the glasses come up and the head tilts back for a good
look, then lower again while the watching goes on — "There! ...no, just a leaf." "Ssh — a
woodpecker, three trees over." "That owl's been in the same tree all week." Whisper Woods now has
4 people to meet instead of 3.

## Round 39 — an artist among the mushrooms

Whisper Woods was still the world with fewest people to meet. An **artist** now sets up an easel
near the glade's giant mushrooms, dabbing at a canvas and stepping back to look — reusing the same
painter rig as the Neighborhood's pond-side painter, in a new spot and clothes, with his own lines.
"The light here is far too good to waste." "I swear that mushroom moved when I wasn't looking."
"Nearly got the whiskers right, this time." Whisper Woods now has 5 people to meet instead of 4.

## Round 40 — an old-timer by the fire on Frosty Peak

The campfire in the middle of the snow village has always had three log seats round it, and nobody
ever sat on them. An **old-timer** now perches on one, come in from the cold to warm her hands,
turning to watch the cat go by same as anyone else — "Best seat on the mountain, this." "Come and
warm your paws, puss." "Cold enough to freeze a yeti's nose, out there." Frosty Peak now has 6
people to meet instead of 5.

Along the way, gave the `Sitter` controller (already used for the Neighborhood's bench pair)
optional spoken lines, the same way `Wanderer` and `Vendor` already have them — the bench sitters
themselves stay silent since they're built without any. First pass wired up `cryT` unconditionally,
which drew an extra tick off the shared `rnd()` sequence for every `Sitter` regardless of whether
it talks, silently shifting the timing of everything built after it in the Neighborhood and
breaking the two-neighbours-chatting test; fixed by only drawing that tick when the sitter actually
has lines to say.

## Round 41 — a lifeguard on Sunny Shore

The beach had a fisherman on the pier and a whole sunbathing crowd, but nobody watching the water.
A **lifeguard** now sits up on a new raised wooden chair — A-frame legs, a ladder up the back, a
ring buoy hung off one side — planted on open sand north of the towels, facing out to sea. Reuses
the `Sitter` controller (same one as the Neighborhood's bench pair and Frosty Peak's old-timer),
just with a taller seat height to match the chair. "Swim between the flags, please!" "Mind that
current, puss — respect the sea." Sunny Shore now has 10 people to meet instead of 9.

While orienting for this round, found that the previous 7 rounds (34–40) had been committed onto a
detached `HEAD` in this container rather than fast-forwarded onto `main`, so `origin/main` looked
stuck at round 33 from a stale local view — turned out to be a false alarm (a fetch showed origin
already had round 40), but worth a mention in case a future round finds `main` genuinely behind a
detached tip again: fast-forward it before doing anything else, since unpushed work here is lost
when the container goes away.

## Round 42 — a child chases fireflies in Whisper Woods

Whisper Woods was still the world with fewest people to meet, even after the birdwatcher and the
artist. A **child** now wanders the glade with a jam-jar, chasing the ambient fireflies that were
already drifting there and never quite catching one — "Nearly caught one!" "They twinkle if you
creep up slow." "Don't tell my mum I'm still out." Built as a plain `Wanderer` (no new controller
needed) so it doubles as the world's first *child* greeting: Whisper Woods has no entry in the
`GREETINGS` table, so every grown-up there has always waved and gone quiet on a "say hello" — a
child pulls from the separate `GREETINGS.child` lines instead, so this is also the first character
in the woods who actually has something to say back. Whisper Woods now has 6 people to meet
instead of 5.

## Round 43 — an artist paints the aurora on Frosty Peak

Frosty Peak was tied with Whisper Woods for the fewest people to meet, at six. An **artist** now
sets up an easel on the open snowfield east of the village, easel propped up and dabbing away
while the aurora ripples overhead — reusing the same `Painter` controller as the Neighborhood's
pond-side artist and Whisper Woods' mushroom painter, in warmer clothes for the cold. "The sky
does all the work, up here." "Try painting that shimmer, if you can." "Best canvas in the sky,
tonight." Frosty Peak now has 7 people to meet instead of 6.

Also found and fixed something left over from earlier containers: on arrival, this session's `HEAD`
was detached and sitting nine commits ahead of both the local and remote `main` — rounds 34 through
42 (forager through fireflies) had all been committed but never fast-forwarded onto `main` or
pushed to `origin`. This is despite round 41's log entry saying its own check of the same situation
was "a false alarm" with origin already caught up to round 40 — it wasn't; `origin/main` was still
sitting at round 33 (the robot dog's toy mouse) until this round fast-forwarded local `main` to the
detached tip and pushed it. Worth taking this check seriously every round: fetch `origin/main` and
compare it against `HEAD` with `git log --oneline origin/main..HEAD`, not just a glance at appearances.

## Round 44 — a whittler on the eastern stump

Whisper Woods was still the thinnest world to meet people in, at six, with the woodcutter, the
hiker, the forager, the birdwatcher, the artist and the firefly-chasing child. An **old whittler**
now sits on one of the four decorative stumps already scattered through the woods (the one east of
the glade, near the owls' tree), carving away at a block of wood — just the plain `Sitter`
controller already used for the Neighborhood's bench pair, Frosty Peak's old-timer and Sunny
Shore's lifeguard, seated a little higher to match the stump's height, with no new geometry needed
since the stump was already there. "Carving a mouse, for luck." "Sit a while — the stump's plenty
wide." "Whittled worse things than a cat, in my time." Whisper Woods now has 7 people to meet
instead of 6, level with Frosty Peak.

This round also found local `main` sitting behind a detached `HEAD` again on arrival, same as
rounds 41 and 42 — but this time a proper check (`git fetch origin main` then
`git log --oneline origin/main..HEAD`) showed the two were already identical once fetched; the
detached tip and `origin/main` agreed, so the "behind" reading was just a stale local branch
pointer from a previous container, fast-forwarded and pushed with nothing lost. Small reassurance
that the round-43 warning is being heeded — worth still checking every time, since it costs nothing
and the one time it matters is expensive to get wrong.

## Round 45 — a cocoa vendor by the Frosty Peak fire

Frosty Peak and Whisper Woods were tied for fewest people to meet, at seven. A **hot cocoa
vendor** now stands a few steps from the campfire, a steaming mug held up in one mittened hand —
built with the same `Vendor` controller as the Neighborhood's balloon seller, but simplified: no
item to give, just a greeting and a call across the square. "Hot cocoa! Warms you right through."
"Marshmallows or none, your choice." "Careful, puss — it's steaming!" A new `makeCocoaMug()` prop
(a china mug, a dab of cocoa, two marshmallows, and a pair of steam wisps that drift up and fade)
sits in the vendor's hand. Frosty Peak now has 8 people to meet instead of 7.

Checked local `main` against `origin/main` on arrival, per the round-43/44 warning: this time they
were genuinely identical (`HEAD` was not detached), so nothing needed fast-forwarding before
starting.

## Round 46 — an angler at the glowing pond

Whisper Woods was back to being the thinnest world to meet people in, at seven, once Frosty Peak's
cocoa vendor pushed it ahead to eight. An **old angler** now sits on a stool at the edge of the
glowing pond in the glade, rod dipped into the water, line trailing down among the lily pads —
reusing the same `IceFisher` controller as Frosty Peak's ice fisherman and Sunny Shore's pier
fisherman (it already worked for open water, not just ice, since the beach one sits over the sea).
Every so often the rod dips and a burst of spray marks a catch — "Something bites in that glow, I
swear." "Careful, puss — don't spook them." "Caught one shaped like a star, once." Whisper Woods
now has 8 people to meet instead of 7, level again with Frosty Peak.

Local `main` was found detached and one commit behind `origin/main` on arrival (round 45's tip
hadn't been fast-forwarded) — fixed with `git branch -f main origin/main` before starting, per the
round-43/44 warning about checking this every time.

## Round 47 — a knitter on the western stump

Frosty Peak and Whisper Woods were tied for fewest people to meet again, at eight. Whisper Woods
has four decorative stumps scattered through the woods but only one of them was ever sat on — the
whittler's, on the east side. An **old woman** now sits on the western stump with a ball of wool
in her lap, the whittler's quiet counterpart — plain `Sitter` controller again, no new geometry,
just a second stump put to use. "Knit one, purl one — mind your claws." "This scarf is nearly
done, if the light holds." "Sit a spell, if you like; the wool keeps me busy." Whisper Woods now
has 9 people to meet instead of 8, ahead of Frosty Peak.

Checked local `main` against `origin/main` on arrival (fetch, then `git log --oneline
origin/main..HEAD` and the reverse): `HEAD` was detached but the two were identical, so a plain
`git checkout main && git merge --ff-only origin/main` brought local `main` forward with nothing
to lose. To get an actual per-world friend count (grepping "new Wanderer(" etc. undercounts
anything built in a loop) this round called `game.load(i, 'from-prev')` directly against the
bundled game in a scratch script and read `game.friendTotal` for each world index — worth
remembering as a faster way to check "which world is thinnest" than counting source lines by eye.

## Round 48 — a snowman gets a second pair of hands

Frosty Peak had gone back to being tied for fewest people to meet, at eight, once Whisper Woods'
knitter pushed ahead. A **child now kneels beside the first snowman**, packing on a fresh layer of
snow — the same `Kneeler` controller already used for the sandcastle kid on Sunny Shore, given
`Sitter`-style optional spoken lines (it had none before) so it can talk back: "Nearly got his arms
right." "Don't melt yet, mister snowman." "He needs a nose. A carrot would do." Frosty Peak now has
9 people to meet instead of 8, level again with Whisper Woods.

Checked local `main` against `origin/main` on arrival: local `main` was 14 commits behind a detached
`HEAD` that matched `origin/main` exactly, so `git checkout main && git merge --ff-only origin/main`
brought it forward with nothing to lose, per the running warning from rounds 43/44/46/47 about
checking this every time.

## Round 49 — a girl weaves a daisy chain on the last stump

Whisper Woods has four decorative stumps; two were already sat on (the whittler to the east, the
knitter to the west), leaving two bare. A **young woman** now sits on one of the remaining two,
threading a daisy chain and in no hurry to finish it — the same plain `Sitter` controller as her
stump-mates, no new geometry, just the fourth seat put to use. "One for luck, one for love."
"Sit if you like - there's room enough." "Lost count again. No matter." Whisper Woods now has 10
people to meet instead of 9, ahead of Frosty Peak (still at 9) for the first time in a few rounds.

Checked local `main` against `origin/main` on arrival, per the running rounds 43-48 warning: `HEAD`
was detached but matched `origin/main` exactly, so `git checkout main && git merge --ff-only
origin/main` brought local `main` forward with nothing lost, before starting this round's work. Used
the round-47 trick of calling `game.load(i, 'from-prev')` in a scratch script and reading
`game.friendTotal` per world to confirm Whisper Woods and Frosty Peak were tied at 9 before picking
which one to extend.

## Round 50 — a woodcutter behind the northern cabin

Frosty Peak had dropped back to fewest people to meet, at nine, once Whisper Woods' daisy-chain
girl pushed it ahead. A **woodcutter** now splits logs on a stump tucked behind the northern
cabin — reusing the `Chopper` controller and `makeStump` prop that Whisper Woods' woodcutter
already uses, just given a beanie, coat and scarf to suit the mountain and moved to open snow
clear of every path, cabin and prop in the village. "Good dry wood, this — burns all night."
"Mind the chips, puss." "Every cabin wants a full woodpile before dark." Frosty Peak now has
10 people to meet instead of 9, level again with Whisper Woods.

Checked local `main` against `origin/main` on arrival, per the running rounds 43-49 warning:
`HEAD` was detached and 16 commits behind, matching `origin/main` exactly, so `git checkout main
&& git merge --ff-only origin/main` brought it forward with nothing lost before starting. Used the
round-47/49 trick of loading each world and reading `game.friendTotal` to confirm Frosty Peak
was the thinnest world before picking it.

## Round 51 — a third sunbather with a book that isn't getting read

Checking `game.friendTotal` per world (the round-47/49 trick) after round 50's woodcutter showed
Sunny Shore had quietly become the thinnest world at ten, tied with Frosty Peak and Whisper Woods.
Sunny Shore's sunbathers' corner has four umbrella-and-towel spots but only ever seated two people
on them — the other two towels sat empty. A **third sunbather** now lies on one of the spare
towels, and `Sunbather` gained the same optional spoken-line support `Kneeler` picked up in round
48, so she can talk back without opening her eyes: "Sunbathing is a science, apparently." "Same
page as an hour ago." "Wake me if the tide comes in." Sunny Shore now has 11 people to meet instead
of 10, ahead of Frosty Peak and Whisper Woods (both still at 10). `test/run.mjs` expected exactly
two sunbathers by name, so that check now expects three.

Checked local `main` against `origin/main` on arrival, per the running rounds 43-50 warning:
`HEAD` was attached to `main` and already level with `origin/main` after round 50's own
fast-forward, so nothing needed doing before starting this round's work.

## Round 52 — a pinecone gatherer on the fringe of the pines

The round-47/49 trick (`game.load(i, 'from-prev'/'from-hub')` then read `game.friendTotal`)
showed Frosty Peak and Whisper Woods tied again at ten, once round 51's third sunbather pushed
Sunny Shore ahead. A **woman now gathers pinecones for kindling** north-east of the Frosty Peak
square, at the fringe where the hand-built village gives way to the pine ring — reusing the
`Forager` controller Whisper Woods' mushroom-picker already uses, just kneeling under pines
instead of beside mushrooms. `Forager`'s cry icon was hardcoded to a mushroom, so it now takes an
optional `cryIcon` the way most other controllers already do, and Frosty Peak passes a pine tree
instead: "Pinecones catch quicker than logs." "Every cabin wants kindling before the wood runs
low." "Mind your paws, puss - sticky with sap." Frosty Peak now has 11 people to meet instead of
10, ahead of Whisper Woods (still at 10).

Checked local `main` against `origin/main` on arrival, per the running rounds 43-50 warning:
`HEAD` was detached but matched `origin/main` exactly (18 commits ahead of the old local `main`),
so `git checkout main && git merge --ff-only origin/main` brought it forward with nothing lost
before starting this round's work.

## Round 53 — two campers at the foot of the treehouse

The round-47/49/52 trick (`game.load`/`game.travel` per world, reading `game.friendTotal`)
showed Whisper Woods had slipped to the thinnest world at ten, once round 52's pinecone
gatherer pushed Frosty Peak to eleven. The treehouse north-west of the glade has stood empty
since it was built — nobody at ground level ever remarked on it. **Two campers now rest at the
foot of its rope ladder**, reusing the `Talkers` controller (already doing duty for gossiping
neighbours and Victorian ladies) so both count as separate friends to meet: "Wonder who built
that treehouse." "Best view in the woods, I'd wager." "Careful - you'll wake whoever lives up
there." "No ladder for us, my knees say." Whisper Woods now has 12 people to meet instead of
10, ahead of every other world.

Checked local `main` against `origin/main` on arrival: `origin/main` had already gathered the
19 commits through round 52 that a stale local ref made look unpushed, so `git fetch` plus a
`git checkout main && git merge --ff-only` confirmed nothing was missing before starting.

## Round 54 — an ice-cream vendor on Sunny Shore

The round-47/49/52/53 trick (`game.load` per world, reading `game.friendTotal`) showed Sunny
Shore and Frosty Peak tied at eleven, once round 53's campers pushed Whisper Woods ahead to
twelve. Sunny Shore's row of five beach huts had plenty of colour but nobody selling anything
from them. An **ice-cream vendor** now stands on the open sand just east of the huts, cone held
up in one hand — the same `Vendor` controller as the Neighborhood's balloon seller and Frosty
Peak's cocoa vendor, with a new `makeIceCreamCone()` prop (a waffle cone, two scoops, a cherry on
top) and greeted the plain way the cocoa vendor is, rather than given a special interact prompt
like the balloons: "Ice cream! Cold as the sea!" "Melts fast in this sun — best hurry!" "One scoop
or two, puss?" Sunny Shore now has 12 people to meet instead of 11, level with Whisper Woods.

Checked local `main` against `origin/main` on arrival, per the running rounds 43-53 warning:
`HEAD` was detached and 20 commits ahead of a stale local `main`, but matched `origin/main`
exactly, so `git checkout main && git merge --ff-only origin/main` brought it forward with
nothing lost before starting this round's work.

## Round 55 — a reindeer keeper on Frosty Peak

The round-47/49/52/53/54 trick (`game.load` per world, reading `game.friendTotal`) showed Frosty
Peak had slipped back to the thinnest world at eleven, once round 54's ice-cream vendor pushed
Sunny Shore ahead to twelve. The three reindeer wandering the village have always just been
scenery. A **reindeer keeper now kneels by the herd's middle spot**, checking harness bells before
the next run — the same `Kneeler` controller already used for the sandcastle kid and the
snowman-packing child, given an adult body for the first time instead of a child's, with no new
geometry needed. "Bells all present and correct." "Mind the antlers, puss — they don't mean it."
"Copper's the friendliest of the lot." Frosty Peak now has 12 people to meet instead of 11, level
with Sunny Shore and Whisper Woods.

Checked local `main` against `origin/main` on arrival, per the running rounds 43-54 warning:
`HEAD` was detached and matched `origin/main` exactly, so `git checkout main && git merge
--ff-only origin/main` brought it forward with nothing lost before starting this round's work.

## Round 56 — the beach ball players get a hello

The round-47/49/52/53/54/55 trick (`game.load`/`game.travel` per world, reading `game.friendTotal`,
this time with a long enough sleep between travels — a first pass with only 560 ms between calls
under-counted every other world, since `travel()` ignores a new call while `this.transitioning` is
still true from the last one, which does not clear until about a second after it was set) showed
Sunny Shore tied with Frosty Peak and Whisper Woods at twelve. Digging into why turned up something
that wasn't a new character but an old oversight: the two people **keeping the beach ball in the
air** have been fully modelled, animated townsfolk since round 7, standing right there on the sand
next to sunbathers, a kneeling child and a kite-flying boy who all count as friends — but `BallGame`
never called `greetable()`, so pressing E on either of them did nothing and neither was ever counted
towards the world's total. Both are **now greetable** ("Say hello", a wave, hearts, the usual Sunny
Shore lines) the same way every other beachgoer already is. Sunny Shore now has 14 people to meet
instead of 12, ahead of Frosty Peak and Whisper Woods (still at 12).

Checked local `main` against `origin/main` on arrival, per the running rounds 43-55 warning: `HEAD`
was attached to `main` and already level with `origin/main`, so nothing needed fast-forwarding
before starting this round's work.
