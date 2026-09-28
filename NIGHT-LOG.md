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

## Round 57 — a fairy-ring dance in Whisper Woods

The round-47-through-56 trick (`game.load`/`game.travel` per world, reading `game.friendTotal`)
showed Frosty Peak and Whisper Woods tied at twelve, the thinnest worlds now that round 56 pushed
Sunny Shore to fourteen. Whisper Woods already has a fairy-ring superstition baked into its lore —
real fairies flit around the glade — but `RingDance`, the controller that walks a circle of rigs
hand in hand round a point, had been sitting unused in `55-npcs.js` since whenever it was written;
nothing in any world ever called it. **Three children now dance in a ring** in a clearing east of
the glade, off the stepping-stone path, spinning one way and then reversing every few seconds:
"Round and round, three times for a wish!" "Don't stop 'til the ring says so!" "Faster - before
the fairies notice!" `RingDance` gained the same optional `cries`/`cryIcon` support most other
controllers already have, plus a `greetable()` call for each dancer so all three count as friends
to meet — a scripted headless scan of `game.physics`'s boxes and circles after building the world
found the clearing at (21, 0), clear of every tree, rock, stump and hollow log already placed
there. Whisper Woods now has 15 people to meet instead of 12, ahead of every other world.

Checked local `main` against `origin/main` on arrival: `HEAD` was detached, sitting on the same
commit `origin/main` was already at, so `git checkout main && git pull origin main` fast-forwarded
the local branch onto it with nothing lost before starting this round's work.

## Round 58 — a child patches the igloo before nightfall

The round-47-through-57 trick (`game.load`/`game.travel` per world, reading `game.friendTotal`)
showed Frosty Peak had slipped to the thinnest world at twelve, once round 57's fairy-ring dance
pushed Whisper Woods to fifteen. The village's two igloos have stood since round 16 as pure scenery
— nobody ever remarked on them or was seen near either one. A **child now kneels just outside the
near igloo's tunnel mouth**, patting fresh snow into a gap in the wall, reusing the `Kneeler`
controller (already doing duty for the snowman-packer and the reindeer keeper) with its built-in
"patting the sand or snow" animation: "Nearly sealed — just this gap left." "Keeps the wind out,
packed in tight." "Snug as an igloo, once it's finished." The kneeling spot was worked out from the
igloo's placement angle so it sits just clear of the igloo's own collider box, with nothing else
nearby. Frosty Peak now has 13 people to meet instead of 12, still the thinnest world but a step
closer to Sunny Shore (14) and Whisper Woods (15).

Checked local `main` against `origin/main` on arrival: `HEAD` was detached but matched `origin/main`
exactly, so `git checkout main && git pull origin main` fast-forwarded the local branch onto it with
nothing lost before starting this round's work.

## Round 59 — two friends weigh up the ice on Frosty Peak

A quick headless tally (`game.load`/`game.travel` per world, reading `game.friendTotal`) showed
Frosty Peak was the thinnest world again at thirteen, once round 58's igloo-patching child pushed
it up from twelve but left it behind Sunny Shore and Whisper Woods (both fourteen/fifteen). The
frozen pond already had an ice fisherman on its near bank, so **two friends now stand on the far
bank**, working up the nerve to skate — the `Talkers` controller (already doing duty for the
gossiping neighbours, the Victorian ladies and the mushroom-glade pair in the woods), reusing its
built-in face-each-other placement and hand gestures with no new geometry needed: "Think it'll
hold, out there?" "The fisherman swears by it." "I'm not going first." "One good crack and I'm off
home." The spot (23.5, 5) was checked against every hand-placed prop and NPC wander leash in the
build function to keep it clear of the pond edge, the cabins, the reindeer herd and the two
wandering kids nearby. Frosty Peak now has 15 people to meet instead of 13, level with the
Neighborhood and Whisper Woods.

Checked local `main` against `origin/main` on arrival: `HEAD` was attached to `main` and already
level with `origin/main` after a `git fetch` and `git merge --ff-only`, so nothing needed
fast-forwarding before starting this round's work.

## Round 60 — a bolder fox in Whisper Woods

A headless tally (`game.load`/`game.travel` per world, reading `game.friendTotal`) found all seven
worlds level at fifteen people to meet for the first time — nothing left thinnest. Rather than force
a sixteenth greeting somewhere, went looking for an unused piece of the game instead, and found
`Follower`: a whole controller class for a creature that minds its own business until the cat wanders
close, then trots over and keeps a shy distance, sitting unused in `55-npcs.js` since whenever it was
written. Whisper Woods already had two plain-wandering foxes; **a third fox now uses `Follower`**
near the eastern tree line, ignoring the cat until it's within about 13 m, then closing the gap to a
polite two metres with an occasional yip, and drifting back to its own patch once the cat moves off.
It isn't greetable (animal rigs don't carry the `.look`/`.robot`/`.cookie` marker `greetable()` checks
for), so it doesn't change any world's friend count — just a small bit of wildlife that reacts to you.

First tried something else — an old-timer fishing off the neighbourhood lake's long-unused jetty,
reusing `IceFisher` the way the Sunny Shore and Frosty Peak pier/pond anglers already do. It built and
looked right, but broke two tests reliably every run: "two neighbours chat" (world 0) and "the horse
and carriage" (Victorian). Chased it down rather than shrugging it off as flakiness — confirmed with
`git stash` that the unmodified tree passed clean five times running, so the tests themselves weren't
flaky, the change was. The cause: `IceFisher` draws from the shared global `rnd()` in its constructor
(`this.t = rnd() * 10`), same as `Wanderer`, `Chopper` and friends. That's normally fine — the test's
own comment says per-world NPC construction draws are OK — but the Neighborhood is *world 0*, built
once at boot before any other world exists, and the test travels through Candy Land, Robot City and
Victorian (in that order) right after. One extra global draw during the Neighborhood's build shifts
every subsequent construction-time draw everywhere downstream, including the exact animation phases
two tightly-timed frame-count checks depend on. Frosty Peak, Sunny Shore and Whisper Woods sit at the
*end* of the test's travel order instead, so thirty-odd rounds of additions there have never had
anything left to cascade into — which is probably no accident, and worth remembering next time
Neighborhood, Candy Land, Robot City or Victorian look like they need something: extra `rnd()` draws
at construction there are the risky kind the test's own comment doesn't cover. Reverted that attempt
rather than patch around it, and moved the idea's target to a world where it's safe.

Checked local `main` against `origin/main` on arrival: `HEAD` was attached to `main` and already
level with `origin/main`, so nothing needed fast-forwarding before starting this round's work.

## Round 61 — a beachcomber on Sunny Shore

A headless tally (`game.load`/`game.travel` per world, reading `game.friendTotal`) showed Sunny
Shore had slipped to the thinnest world at fourteen, one behind the other six, which round 60 had
just brought level at fifteen. **A beachcomber now kneels further down the sand**, sorting shells
into a little pile right where the game's own shell-scatter decoration is thickest (`makeScatter`'s
third patch, centred near (8, -26)) — reusing `Kneeler`, the same controller already doing duty for
the sandcastle-patting kid on this same beach and the igloo-patching child on Frosty Peak: "Found a
whole conch, look!" "This one still has its shine." "One more and I'll call it a collection." The
spot (5, -32) was checked against the rock scatter by the lighthouse, the nearby crab wander circles,
the gem cluster and every beach hut, umbrella and towel already placed, with clear margin on all
sides. Sunny Shore now has 15 people to meet instead of 14, level with the rest.

Checked local `main` against `origin/main` on arrival: `HEAD` was attached to `main` and already
level with `origin/main`, so nothing needed fast-forwarding before starting this round's work.

## Round 62 — a bolder penguin on Frosty Peak

A headless tally (`game.load`/`game.travel` per world, reading `game.friendTotal`) found all seven
worlds level at fifteen people to meet, same as when round 61 left off — nothing thinnest to fix.
Followed round 60's lead instead and looked for an idle piece of the game: `Follower`, the
controller that lets a wild creature mind its own business until the cat wanders close, then trots
over and keeps a shy distance, had only ever been given to a fox in Whisper Woods. **A seventh
penguin, wearing a yellow scarf, now peels off from the pond-side flock** near (26, 2) and waddles
over for a look whenever the cat comes within about 11 m, stopping short at a polite 1.8 m with an
occasional squawk, then drifting back to its own patch once the cat moves on. Like the fox, it isn't
greetable — animal rigs don't carry the marker `greetable()` checks for — so Frosty Peak's friend
count stays at fifteen; this is just one more bit of wildlife that notices you. Placed it clear of
the pond, the ice fisherman's hole and stool, the skating pair, and every cabin and crystal nearby,
since it has no static collider of its own (only a wander circle, same as any other animal here).

Checked local `main` against `origin/main` on arrival: `HEAD` was detached but sitting on the exact
commit `origin/main` was already at (a stale local branch ref left over from a previous session, not
a divergence), so moving the `main` ref up to it and checking it out lost nothing before starting
this round's work.

## Round 63 — a bolder crab on Sunny Shore

A headless tally (`game.load`/`game.travel` per world, reading `game.friendTotal`) found all seven
worlds still level at fifteen people to meet, same as the last two rounds left off. Followed round
60 and 62's lead again and gave a third world's wildlife its own `Follower`: Sunny Shore's six plain
`Wanderer` crabs get a seventh, **a bolder crab that minds its own business until the cat wanders
close, then scuttles over for a look**, claws clicking (`SFX.click()`), before skittering back to its
patch of sand once the cat moves on. Placed at (17, -6), a gap in the existing crab line that's clear
of the sandcastle, umbrellas and towels to the south and the fisherman's pier to the north. Like the
fox and the penguin before it, it isn't greetable, so Sunny Shore's friend count stays at fifteen —
just one more bit of shoreline that notices you.

Confirmed with a headless check after building: the crab's rig lands in the scene graph and
`friendTotal` for Sunny Shore is unchanged at 15, then ran the full suite clean before building.

Checked local `main` against `origin/main` on arrival: already up to date, no fast-forward needed
before starting this round's work.

## Round 64 — the owl answers back

Ran the same headless tally the last few rounds used and it told a different story than expected:
Sunny Shore, Frosty Peak, Whisper Woods and the Neighborhood are indeed all level at fifteen, but
Candy Land, Robot City and Victorian are nowhere near it — 24, 24 and 27 respectively, because their
gingerbread men, robots and top-hatted crowds were built in batches from the start rather than added
one at a time. Worth writing down plainly since a few recent rounds described "all seven worlds
level," which was only ever true of the four worlds that get hand-placed vignettes; the other three
were never thin to begin with.

With Whisper Woods, Sunny Shore and Frosty Peak all freshly stocked with a wildlife `Follower` apiece
over the last three rounds, and none of the three hub worlds safe to touch for the `rnd()`-sequence
reasons round 60 dug into (nearly every controller draws from the shared global `rnd()` in its
constructor, not just `IceFisher`, `Wanderer` and `Chopper` — a quick grep found the same pattern in
`Sitter`, `Kneeler`, `Vendor`, `Painter`, `Talkers` and most everything else in `55-npcs.js`, so it's
really a blanket rule for those four worlds, not a one-off), **the three owls perched in Whisper
Woods' trees have sat purely decorative since whichever round first hooted them into existence** —
background scenery with a hoot timer, no way to say hello. The westernmost one, at the foot of the
stepping-stone path near (-30, -10), now answers: walk up and press E and it blinks down at you —
`"Who? Oh - just you."` — the same `game.namedFriend()` + `befriend()` pattern the yeti and the beach
dog already use, since an owl thirty feet up a tree has no rig to run `greetable()`'s marker checks
against. Whisper Woods goes from fifteen friends to sixteen. The other two owls stay silent for now;
picking one was plenty for a single round, and the remaining pair are still worth a look later.

Checked with a headless run before building: walked the cat to the owl's position, pressed E, and
watched `game.state.friends` go from empty to holding an `owl` id — the interactable actually works,
not just compiles. Full suite ran clean after.

On arrival, `HEAD` was detached from `main` at the exact commit `origin/main` was already at (the same
stale-ref situation round 62 hit) — moved the `main` ref up and checked it out before starting.

## Round 65 — a second owl answers back

Round 64 left two of Whisper Woods' three perched owls silent, saying the remaining pair were "still
worth a look later." Picked the middle one up: the owl at (30, 22), perched right by the tree the
birdwatcher keeps squinting at — her third line is "That owl's been in the same tree all week," so
the two were already sitting side by side without knowing it. **That owl now answers a hello too**,
with its own `game.namedFriend('owl2')` id (distinct from the western owl's `owl`, both scoped under
the `forest:` world key so there's no collision) and its own line: `"Not a woodpecker. Never was."`
— a wink back at the birdwatcher mistaking it for one. Whisper Woods goes from sixteen friends to
seventeen. The third owl, at (12, 32), is still just scenery.

Verified with a headless script beyond the test suite's own checks: travelled to Whisper Woods,
found both owl interactables by label, walked the cat to each and called `onUse()`, and watched
`game.state.friends` come back holding both `forest:owl` and `forest:owl2`. Full suite (273 checks)
ran clean afterward, `world 6: 17 to meet` among them.

`HEAD` was detached on arrival, sitting on the exact commit `origin/main` was already at — the same
stale local ref this log has now hit three rounds running — moved `main` up to it and checked it out
before starting.

## Round 66 — a message in the sand on Sunny Shore

A headless tally of `friendTotal` across all seven worlds showed the four hub worlds (Neighborhood,
Sunny Shore, Frosty Peak, Whisper Woods) had drifted: the last two rounds' owls pushed Whisper Woods
to seventeen while Sunny Shore and Frosty Peak sat at fifteen. Picked Sunny Shore to catch up, since
its tideline south of the lighthouse — past the beachcomber's spot, before the rock scatter round the
lighthouse itself — was empty ground with nothing hand-placed nearby.

**A girl kneels there finishing something drawn in the wet sand**, using the same `Kneeler` pattern
as the beachcomber and the sandcastle-patting kid (kneeling animation, greetable by default, no new
controller needed). Her third line gives it away: `"It says 'MEOW' — for you, if you can read it
upside down."` Sunny Shore goes from fifteen friends to sixteen. Nothing is actually written in the
sand — like the "packing a fresh layer of snow" kid on Frosty Peak, the dialogue carries the detail,
not new geometry, to keep the change conservative and headlessly checkable.

Verified with the same per-world `friendTotal` tally used in round 64: Sunny Shore now reports
sixteen, `world 4: 16 to meet` passes, and the ground-walkable sweep still clears 100% for that world
(the new kneeler's collision circle is dynamic, not a static box, so it can't fail the walkability
check). Full suite ran clean before and after building. One pre-existing flake was noticed along the
way — `Victorian: the horse and carriage are in the world and on the move` failed once by a hair, then
passed three times running on retry — not touched this round since it isn't this round's code and
reproducing it reliably would need its own investigation.

On arrival, `git status` was clean but `HEAD` was detached; `git checkout main` landed exactly on
`origin/main`, and a fresh `git fetch` confirmed the two were already in sync (no lost work — the
detached commits from the last few rounds had, in fact, already made it to `origin/main`, despite the
stale local ref making it look otherwise at first glance).

## Round 67 — carrots for the reindeer on Frosty Peak

A headless `friendTotal` tally across all seven worlds showed Frosty Peak sitting at fifteen, one
behind Whisper Woods' seventeen and level with Sunny Shore's sixteen — the three non-hub worlds still
safe to add hand-placed friends to, per round 64's notes on the global `rnd()` sequence. Picked Frosty
Peak, since the third deer's spot near (24, 20) — off on its own, away from the herd the reindeer
keeper tends near (-18, -12) — had nothing placed nearby.

**A girl kneels at the edge of that deer's patch, leaving carrots on a flat rock**, using the same
`Kneeler` pattern as the snowman-patting and igloo-sealing kids (kneeling animation, greetable by
default, dynamic collision circle so it can't block the ground-walkable check). Her lines nod to the
reindeer keeper across the village, who already boasts "Copper's the friendliest of the lot" — hers
answers back: `"Copper's not the only one who likes them."` Frosty Peak goes from fifteen friends to
sixteen.

Verified beyond the test suite's own checks: built a headless script that clicks the start button
(missed on a first pass — `game.step()` only runs `if (this.started)`, so the cat doesn't move or
find interactables at all until the enter-screen click fires), travels to Frosty Peak, walks the cat
to the new kneeler, and confirms `game.nearest` shows "Say hi" and `game.interact()` adds `snow:10` to
`game.state.friends`. Full suite (273 checks) ran clean before and after building, `world 5: 16 to
meet` among them.

On arrival, `HEAD` was already on `main`, in sync with `origin/main` — no stale-ref cleanup needed
this time.

## Round 68 — an ice sculptor at the outlying crystals

A headless `friendTotal` tally across all seven worlds showed Sunny Shore and Frosty Peak tied at
sixteen, one behind Whisper Woods' seventeen. Picked Frosty Peak: the westernmost ice-crystal cluster
at (-24, 18) — out past the second igloo, on its own — had no one standing near it.

**An old sculptor kneels by that crystal, chisel in hand, working the last facet**, using the same
`Kneeler` pattern as the carrots girl and the snowman-patting kids (kneeling animation, greetable by
default, dynamic collision circle so it can't block the ground-walkable check). Nothing about the
crystal's geometry changes — the dialogue carries it, same as the sand-message trick on Sunny Shore:
`"Ice this clear doesn't come along every winter."` Frosty Peak goes from sixteen friends to
seventeen, level with Whisper Woods.

Verified beyond the test suite's own checks: a headless script called `game.start('new')` directly
(cheaper than clicking the DOM start button), travelled to Frosty Peak, walked the cat up to the new
kneeler by name and position, and confirmed `game.nearest.label()` reads "Say hello" and
`game.interact()` takes `game.state.friends` from 0 to 1. Full suite (290 checks) ran clean before and
after building, `world 5: 17 to meet` among them.

On arrival, `git status` was clean but `HEAD` was detached, 34 commits ahead of a *stale* local
`origin/main` ref — `git fetch origin main` showed the two were actually already in sync (the same
false alarm rounds 66/67 flagged: nothing was lost, the local remote-tracking ref just hadn't been
refreshed yet). `git checkout main && git merge --ff-only origin/main` brought local `main` level
before starting.

## Round 69 — digging for sand crabs on Sunny Shore

A headless `friendTotal` tally across all seven worlds showed Sunny Shore at sixteen, one behind
Frosty Peak and Whisper Woods' seventeen apiece — round 68's ice sculptor had put Frosty Peak level
with Whisper Woods and left Sunny Shore trailing by one. Went looking for open dry sand away from
every hand-placed prop and every wandering crab's leash range: a hollow in the dune grass south-west
of the beach huts, around (-24, -22), had nothing within six units of it.

**A boy kneels there, digging for sand crabs with a toy shovel**, using the same `Kneeler` pattern as
the beachcomber and the sand-message girl (kneeling animation, greetable by default, dynamic
collision circle so it can't block the ground-walkable check). Distinct from the beach's other
kneeling vignettes — shell-sorting, sand-writing — this one's just missing its quarry every time:
`"Sh-h, you'll scare them off, puss."` Sunny Shore goes from sixteen friends to seventeen, level with
Frosty Peak and Whisper Woods.

Verified beyond the test suite's own checks: a headless script called `game.start('new')` directly,
travelled to Sunny Shore, walked the cat up to the new kneeler by position, and confirmed
`game.nearest._label` reads "Say hi" and `game.interact()` takes `game.state.friends` from 0 to 1.
Full suite (290 checks) ran clean before and after building, `world 4: 17 to meet` among them, and the
ground-walkable sweep for that world held at 99%.

On arrival, `HEAD` was on `main`, 35 commits behind `origin/main` — a plain fast-forward
(`git checkout main && git merge --ff-only origin/main`) brought it level before starting; no stale-ref
false alarm this time, just an honestly out-of-date local branch.

## Round 70 — a gardener waters the wildflowers

A headless `friendTotal` tally across all seven worlds showed the Neighborhood at fifteen, two behind
the three hub worlds (Sunny Shore, Frosty Peak, Whisper Woods), which rounds 66–69 had brought level
with each other at seventeen apiece. The Neighborhood hadn't had a new hand-placed friend in a while,
so it had quietly fallen behind the pack it's supposed to keep pace with. Went looking for open ground
away from every lot, road and hand-placed prop: the wildflower patch at the south-west corner
(-56, -60), planted by `makeFlowers` but with nobody standing in it, fit.

**A girl kneels there watering the blooms with a little can**, using the same `Kneeler` pattern as the
beach and snow vignettes (kneeling animation, greetable by default, dynamic collision circle so it
can't block the ground-walkable check). Three lines cycle while the cat's nearby: `"Careful not to
drown them!"`, `"Every flower gets a turn."`, `"There — whole patch done for today."` The Neighborhood
goes from fifteen friends to sixteen.

This one had a real snag worth recording: the Neighborhood's street NPCs all share one `makeWardrobe()`
shuffle-bag of eighteen shirt colours (`ward`, built once at the top of `buildNeighborhood`), and the
street was already drawing nineteen colours from it — one over capacity — before this round. It got
away with it because the nineteenth draw (a hidden or excluded rig) never showed up in the test's
visible-people list. Building the new gardener through the shared `person()` helper as a first attempt
pushed a twentieth draw into the mix and immediately surfaced a real collision: `node test/run.mjs`
failed `no two neighbours wear the same shirt` (16 colours for 17 people). The fix was to build her
by hand with `makeHuman()` + `randomPerson()` and a fixed, explicit shirt colour (`0xf4a340`, not in
`SHIRT_COLORS`) instead of routing through the shared bag at all — the same trick the beach and snow
worlds use for their own one-off characters, just taken one step further here since even a dedicated
small wardrobe built from `SHIRT_COLORS` entries risked echoing a colour the shared bag had already
drawn.

Verified beyond the test suite's own checks: a headless script called `game.start('new')` directly,
teleported the cat straight to the gardener's spot, and confirmed `game.nearest.label()` reads "Say
hi" and `game.interact()` takes `game.state.friends` from 0 to 1. Full suite (293 checks) ran clean
before and after building, `neighborhood has 17 people` / `no two neighbours wear the same shirt (17
colours for 17 people)` / `the Neighborhood has 16 people to meet` all passing, and `world 0: 96% of
the ground is walkable` unchanged from before the change.

On arrival, `HEAD` was already on `main` in sync with `origin/main` — no cleanup needed.

## Round 71 — a boy flies a kite in the park

A headless `friendTotal` tally across all seven worlds showed the Neighborhood still trailing the
three hub worlds (Sunny Shore, Frosty Peak, Whisper Woods, all at seventeen since round 69) at
sixteen — round 70's gardener had only closed half the gap. Rather than another kneeling vignette,
this round reused `KiteFlyer`, a controller `55-npcs.js` already had (built for the beach's kite boy)
but that no one had ever pointed at the Neighborhood: greetable, standing with both hands on the line
while the kite loops lazily overhead on a figure-eight.

**A boy stands on the open lawn in the park's north-east corner (22, 52), flying a blue-and-white
kite** — clear of the park's paths, the swing set, the painter, the balloon seller and the two kids
playing tag on the east lawn. `"Don't let it snag a tree!"` The Neighborhood goes from sixteen
friends to seventeen, level with the three hub worlds.

Building him hit the same wardrobe ceiling round 70 flagged: the test checks that *every* human-rigged
NPC in the scene has a distinct shirt colour, and the Neighborhood was already at 17 people using 16
of the 18 `SHIRT_COLORS` plus the gardener's one custom shade — no headroom left in the shared `ward`
bag. Ran a quick headless dump of every NPC's `rig.look.shirt` before touching anything, found three
colours nobody was wearing (`0xe0503c`, `0x2e9e6e`, `0x7fb56a`), and built the kite boy by hand with
`makeHuman()` + `randomPerson()` and a fixed `0xe0503c`, bypassing `ward` entirely — same trick as the
gardener, just picked with the actual current palette in hand instead of a guess.

Verified beyond the test suite's own checks: a headless script called `game.start('new')` directly,
found the new `KiteFlyer` in `game.npcs`, confirmed both the boy's rig and the kite mesh are in the
scene graph, ran 120 frames and watched the kite's height oscillate (0.00 → 7.56 m, the figure-eight
lift working), then teleported the cat next to him and confirmed `game.nearest._label` reads "Say hi"
and `game.interact()` takes `game.state.friends` from 0 to 1. Full suite (293 checks) ran clean before
and after: `neighborhood has 18 people` / `no two neighbours wear the same shirt (18 colours for 18
people)` / `the Neighborhood has 17 people to meet` / `world 0: 96% of the ground is walkable`
unchanged.

On arrival, `HEAD` was on `main`, 37 commits behind `origin/main` — a plain fast-forward
(`git fetch origin main && git checkout main && git merge --ff-only origin/main`) brought it level
before starting.

## Round 72 — a costermonger takes the empty market stall

Rounds 69–71 had brought the Neighborhood, Sunny Shore, Frosty Peak and Whisper Woods level with each
other at seventeen friends apiece, so this round looked past the friend tally at what a world was
missing instead. Candy Land, Robot City and Victorian haven't had a new vignette since rounds 28–37 and
are all comfortably ahead on friend count (24, 23 and 27), so a straight headcount chase wasn't the
point here. Reading through Victorian's market square in `70-world` found four striped stalls, each
already piled with five apples and pears on the counter — and not one of them had anybody standing
behind it. Decorative fruit stalls with no keeper, in a town that otherwise has a lamplighter, two
gossiping ladies, a bobby on the beat and a horse and carriage.

**A costermonger now works the south-west stall**, using the `Vendor` controller (the same one behind
the snow world's cocoa seller) holding up a new prop, `makeFruitBasket()` — a small wicker basket with
four fruit — and calling out over the plaza: `"Apples, ripe apples!"`, `"Best pears in the market
square!"`, `"Mind you don't nick one, puss!"`. Vendor doesn't call `greetable()` itself (the world is
expected to opt in), so she's wired up the same way the cocoa vendor is: `game.npcs.push(v);
greetable(game, v);` right after, so she counts as a proper friend rather than just scenery. She stands
behind the counter, 1.3 m back from the stall's own physics box, clear of the two market-square
wanderers and the tent's support poles.

Verified beyond the test suite's own checks: a headless script started the game for real (the "enter"
button's click listener — `game.started` is otherwise false and the interaction loop never runs),
travelled to Victorian, found the new `Vendor` by its held prop, confirmed both her rig and the fruit
basket are in the scene graph, teleported the cat to face her and confirmed `game.nearest.label()`
reads "Say hello" and `game.interact()` takes `game.state.friends` from 0 to 1. Full suite (293 checks)
ran clean before and after: `world 3: 28 to meet` (up from 27), `world 3: every NPC is in the scene
graph`, and `world 3: 94% of the ground is walkable` unchanged from before the change.

On arrival, `HEAD` was already on `main` in sync with `origin/main` — no cleanup needed.


## Round 73 — a flower seller takes the second empty stall

Round 72 left three of the market square's four striped stalls still without a keeper. Rather than
chase another world's friend count (Neighborhood, Sunny Shore, Frosty Peak and Whisper Woods are all
still level at seventeen since round 71 — nothing there needs catching up this round), this round
finished the job round 72 started: a decorative set piece with no one standing behind it is a small,
well-scoped fix the same `Vendor` controller already handles.

**A flower seller now works the blue-striped pitch**, holding up a new prop, `makeFlowerBouquet()` — a
small paper-wrapped bunch, five coloured heads over a ribbon-tied wrap — and calling out: `"Flowers,
fresh flowers!"`, `"Roses, tuppence a bunch!"`, `"Something pretty for the windowsill?"`. Built the same
way the costermonger was: her own small wardrobe (not the shared street `vicWard` bag, which is
Victorian's gentlemen-and-ladies palette, not fresh greens and pinks), standing 1.3 m back from the
stall's own physics box on the same south side as every other stallholder in this square. Wired up the
same way too — `Vendor` doesn't call `greetable()` itself, so `game.npcs.push(v); greetable(game, v);`
right after makes her a proper friend rather than scenery.

Verified beyond the test suite's own checks: a headless script started the game for real, travelled to
Victorian, found the new `Vendor` by its `cryIcon`, confirmed both her rig and the bouquet are in the
scene graph, teleported the cat to face her and confirmed `game.nearest.label()` reads "Say hello" and
`game.nearest.onUse()` takes `game.state.friends` from 0 to 1 (an earlier pass through `game.interact()`
came back a no-op, until it turned up that the cat had been dropped in still inside the portal fade
from travelling — `game.interact()` no-ops while `game.transitioning` is true, exactly as the main test
suite waits it out before touching anything). Full suite (293 checks, all `ok`, 0 console warnings) ran
clean before and after building: `world 3: 29 to meet` (up from 28), `world 3: every NPC is in the scene
graph`, and `world 3: 94% of the ground is walkable` unchanged. One run out of twelve threw a stray
`FAIL` on the horse-and-carriage's "in the world and on the move" check (a real-wall-clock-timed test
of metres travelled in two seconds); three clean runs on unmodified `HEAD` and eleven more clean runs
with this change applied, both before and after, point to pre-existing timing flakiness in that one
check rather than anything this round changed.

On arrival, `HEAD` was behind `origin/main` by 39 commits — a plain fast-forward
(`git fetch origin main && git checkout main && git merge --ff-only origin/main`) brought it level
before starting.


## Round 74 — a sentry robot patrols Robot City's empty back lot

Robot City hadn't had a new vignette since round 68's mechanic — the last several rounds all went to
Victorian's market stalls instead. With those both filled now, this round looked elsewhere: the whole
hand-built factory floor is busy (conveyors, a furnace, crates, wanderers, the mechanic), but the stretch
of bare concrete south of it, between roughly z=-30 and z=-45, had nothing on it at all — no props, no
NPCs, just floor.

**A sentry robot now walks the perimeter of that lot**, using the same `Patroller` controller behind the
Victorian bobby and the Whisper Woods hiker — a plain `makeRobot()` rig on a four-corner loop
(`[-15,-35] → [15,-35] → [15,-45] → [-15,-45]`, looping, pausing at each corner), muttering as it goes:
`"Perimeter secure."`, `"No unauthorized felines detected."`, `"Scanning. Scanning. Still scanning."`,
`"This job would be easier with hands."` `Patroller` calls `greetable()` itself, so it needed no extra
wiring — greeting a robot already falls through to the existing "BEEP BOOP. HELLO, SMALL CAT." line,
the same as every other robot in the city.

Checked the route against every hand-placed prop in the core (skyscraper clusters at x≈±30, the
furnace, conveyors, pipes, crates and barrels): the rectangle sits comfortably clear of all of them,
inside `P.setLimit(480)` and well short of `robotRegion`'s outer-ring props, which only start past
radius 98.

Verified beyond the test suite's own checks: a headless script started the game for real, travelled to
Robot City, found the new `Patroller` by its robot rig, confirmed it's in the scene graph, watched it
cover 2.1 m over 3 simulated seconds, then teleported the cat in front of it and confirmed
`game.nearest.label()` reads "Beep hello" and `onUse()` takes `game.state.friends` from 0 to 1. Full
suite (293 checks, all `ok`, 0 console warnings) ran clean before and after building: `world 2: 24 to
meet` (up from 23), every NPC still in the scene graph, and `world 2: 88% of the ground is walkable`
unchanged.

On arrival, `HEAD` was already on `main` in sync with `origin/main` — no cleanup needed.


## Round 75 — a fisherman takes the empty jetty

The Neighborhood, Sunny Shore, Frosty Peak and Whisper Woods have sat level at seventeen friends apiece
since round 71, so this round looked past the headcount at what the world itself was missing — the
same approach that found the empty market stalls in rounds 72–73. The lake in the Neighborhood's
north-west corner has had a proper jetty since early on: five planks, four posts, its own physics box —
and nobody has ever stood on it. A decorative jetty with nobody fishing off it, in a street that
otherwise has a postie, a painter, a balloon seller, two gossiping neighbours on a bench and a girl
watering wildflowers.

**An old fisherman now works the end of that jetty**, reusing the `IceFisher` controller (the same one
behind Whisper Woods' angler at the glowing pond — nothing to do with ice, it's really just "sit by a
hole in the water and dangle a line in it") holding a `makeIceStool()` under him, dipping his line into
open water a few metres out from the last plank, muttering: `"Not a bite all morning."`, `"Mind you
don't join them in the drink, puss."`, `"Quietest spot on the lake, this."`. His own small wardrobe
(muted greens and browns, not the street's shared `ward` bag) keeps him from matching anyone else on the
street. `IceFisher` calls `greetable()` itself, so no extra wiring was needed. A `seatY` override
(`0.41`, the jetty deck's top surface) keeps him sitting on the planks rather than at the world's flat
ground level, which the controller would otherwise assume.

Checked against the physics: the jetty's own box spans x −32 to −27 at z −48 to −47.5, and the
fisherman sits at (−31, −48), well inside it and clear of the four corner posts (which have no physics
of their own). The jetty was never one of the roads/paths the test suite walks in a straight line
(main street, both pavements, side road, boardwalk, park path, portal path), so there was no risk there.

Verified beyond the test suite's own checks: a headless script started the game for real, found the new
`IceFisher` by its constructor name, confirmed his rig is in the scene graph and sitting on the deck
(not sunk to ground level), teleported the cat behind him and confirmed `game.nearest.label()` reads
"Say hello" and `game.interact()` takes `game.state.friends` from 0 to 1, then ran 300 more frames and
confirmed his fishing line stayed a finite, sensible length (~3.5 m) throughout. Full suite (294 checks,
all `ok`, 0 console warnings) ran clean three times before and after building: `world 0: 18 to meet` (up
from 17), every NPC still in the scene graph, and `world 0: 96% of the ground is walkable` unchanged.

On arrival, `HEAD` was already on `main` in sync with `origin/main` — no cleanup needed.


## Round 76 — a pieman takes the third empty market stall

Rounds 72 and 73 gave the Victorian market square's costermonger and flower seller two of its four
striped pitches (the green stall at (-10,-42) and the blue one at (10,-28)); the red stall at (-10,-28)
and the purple one at (10,-42) have stood empty behind their counters ever since. This round took the
red one, mirroring the flower seller's spot across the lane.

**A pieman now works the red-striped pitch**, holding up a tray of golden-crusted meat pies — a small
new prop, `makePieTray()`, three lattice-topped domes on a wooden board — and calling: `"Hot pies! Get
your hot pies!"`, `"Best meat pies in the square!"`, `"Not for cats, sorry, puss."` He's built with the
same `Vendor` controller as the other two stallholders and stands at (-10, -29.3), the same -1.3 offset
behind his counter that the flower seller uses at hers, just mirrored in x. The purple stall at
(10,-42) is still nobody's — a candidate for a future round.

Full suite (295 checks, all `ok`, 0 console warnings) ran clean three times before and after building:
`world 3: 30 to meet` (up from 29), every NPC still in the scene graph, and `world 3: 93% of the ground
is walkable` (was 94% — one more small counter footprint in a 420 m world, not a road or path the test
suite walks).

On arrival, `HEAD` was already on `main` in sync with `origin/main` — no cleanup needed.

## Round 77 — a cheesemonger takes the last empty market stall

Round 76's log named the candidate directly: the purple-striped pitch at (10,-42) in the Victorian
market square was the last of the four stalls left empty, after the costermonger (round 72), flower
seller (round 73) and pieman (round 76) filled the other three.

**A cheesemonger now works the purple stall**, holding up a small new prop, `makeCheeseWheel()` — three
wax-rinded wheels of different sizes stacked on a board, each with a pale cut face showing — and calling:
`"Cheese! Fine ripe cheese!"`, `"A wedge for your supper?"`, `"None of this for cats, either."` He's
built with the same `Vendor` controller as the other three, standing at (10, -43.3), directly across the
lane from the costermonger's green stall and mirroring the pieman's -1.3 offset behind the counter.

Checked against the physics: the stall's own counter box is centred on (10,-43.3) with half-extents
(1.6, 0.8) in x/z, and the vendor sits well inside it. The market square floor is flat and open there,
away from the fountain, the other three stalls, and the lamps at (-14,-34), (14,-34) and (0,-46) — no
road or path the test suite walks passes anywhere near it.

Verified beyond the test suite's own checks: a headless script started the game for real, travelled to
Victorian, found the new `Vendor` by its cry icon (🧀), confirmed the rig is in the scene graph and sits
inside the stall's counter box, teleported the cat in front of him and confirmed `game.interact()` takes
`game.state.friends` from 0 to 1, then ran 120 more frames and confirmed his position stayed finite. Full
suite (295 checks, all `ok`, 0 console warnings) ran clean three times before and after building:
`world 3: 31 to meet` (up from 30), every NPC still in the scene graph, and `world 3: 93% of the ground
is walkable` unchanged from round 76.

On arrival, `HEAD` was already on `main` in sync with `origin/main` — no cleanup needed.

## Round 78 — Robot City gets its painter

Neighborhood, Frosty Peak and Whisper Woods each have an artist at an easel; Robot City and Candy Land
never did. Robot City had an obvious spare corner for one: the open concrete south of the giant robot
statue and its neon `CHARGE` sign, nine metres from the mechanic's vignette and clear of every skyscraper
footprint, crate, barrel and wandering robot's leash in the build function.

**A painter now sets up an easel on that open floor**, facing the statue and its glow across the plaza,
grumbling: `"Trying to get the neon just right."`, `"Nobody paints chrome. Someone should."`,
`"That statue holds still, at least - unlike some cats."` Built with the same generic `Painter`
controller as the other three (it wires up its own easel, physics box and `greetable()` — no extra
plumbing needed), in a small grey-blue wardrobe of its own so it doesn't match the mechanic nearby.

Checked against the physics: the mechanic's vignette sits at (2,18), the painter at (0,27) — 9.2 m
apart — and Robot City's build function has no `game.zones` keep-out spans at all (it relies purely on
physics boxes), so the only real risk was the hand-placed crates, barrels, poles and skyscraper
footprints; none of them land within several metres of (0,27).

Verified beyond the test suite's own checks: a headless script started the game for real, travelled to
Robot City, found the new `Painter` in the scene graph sitting at the intended spot, confirmed it doesn't
overlap the mechanic, walked the cat up to it and confirmed the "Say hello" prompt appears and
`game.interact()` takes `game.state.friends` from 0 to 1, then ran 200 more frames and confirmed both the
painter's rig and its easel stayed at finite positions. Full suite (273 `ok` lines, all passing, 0
console warnings) ran clean before and after building: `world 2: 25 to meet` (up from 24), every NPC
still in the scene graph, and `world 2: 88% of the ground is walkable` unchanged.

On arrival, local `main` was 44 commits behind `origin/main` (a stale branch pointer left over from a
previous detached-HEAD session) — fast-forwarded to `origin/main` before starting, no other cleanup
needed.

## Round 79 — Candy Land gets its first stall keeper

Every other world had at least one market stall, cart or roadside vendor except Candy Land, which — for
all its lollipop groves, gumdrop clusters and gingerbread villagers — never had anyone actually selling
sweets. The open floor east of the candy-cane forest, between the far lollipop groves and the cupcake
hills, had nothing hand-placed on it at all.

**A sweet-stall keeper now stands there holding up a jar of peppermints**, calling: `"Peppermints, fresh
peppermints!"`, `"A sweet for the journey, puss?"`, `"One a day keeps the toothache away - or so they
say."` She's a human — following the precedent set by Robot City's mechanic and painter, who are human too
even though their world is full of robots — built with the same `Vendor` controller as the ice-cream and
cocoa vendors, holding a new prop, `makeCandyJar()` (a glass jar of striped peppermints under a red lid,
fully deterministic — no random draws, matching `makeCheeseWheel`/`makeFruitBasket`). No new stall
furniture was built; like the ice-cream and cocoa vendors she just stands on the open floor with a
`game.zones.addCircle` marking her spot, which was simpler and lower-risk than modelling a counter.

Checked against the physics: she stands at (45,-28), inside the hand-placed inner disc (radius ~53 from
centre) and well clear of `candyRegion`'s procedural fill, which only starts at radius 92. The nearest
hard-coded obstacles — a candy cane at (34,-20), a marshmallow bush at (34,-36), a big lollipop at
(58,-14) — are all 13+ metres away. The new code was inserted as the very last thing in the world's build
function to touch its seeded RNG (after the candy queen, airlock and portal, none of which draw from it),
so it couldn't shift any earlier procedural layout — only the squirrel and literal collectible coordinates
follow it, and neither uses the RNG.

Verified beyond the test suite's own checks: a headless script started the game for real (including the
"press enter to start" gate that `this.started` requires — a step I'd missed on the first pass, which
silently made `game.interact()` a no-op), travelled to Candy Land, found the new `Vendor` by its cry icon
(🍬), confirmed she's in the scene graph and unblocked, walked the cat to her, confirmed `game.interact()`
takes `game.state.friends` from empty to `{'candy:23'}`, then ran 200 more frames and confirmed her
position stayed finite. Full suite (295 checks, all `ok`, 0 console warnings) ran clean four times before
and after building: `world 1: 25 to meet` (up from 24), every NPC still in the scene graph, and
`world 1: 92% of the ground is walkable` (comfortably above the 80% floor). One unrelated timing check —
the Victorian horse and carriage's distance-travelled assertion — flaked once across a dozen runs; it
touches no file this round changed and passed cleanly on every other run, so it looks like a pre-existing
flake rather than a regression.

On arrival, `HEAD` was detached at the tip of `origin/main`, with local `main` 45 commits behind — fast-
forwarded local `main` to `origin/main` and checked it out before starting, no other cleanup needed.

## Round 80 — a baker for the gingerbread cottage

The gingerbread cottage south of the chocolate river has stood empty since it was built: icing windows lit,
smoke curling from the chimney, cookie path leading right up to the door — and nobody home. Every other
world's bakery-adjacent landmark (Frosty Peak's fire, Whisper Woods' four stumps) had picked up a Sitter or
Kneeler vignette by now; Candy Land's only human besides the sweet-stall keeper was that one lone vendor.

**A baker now kneels beside the cottage, icing a fresh tray of cookies while they're still warm**, calling:
`"Icing while they're warm - best trick there is."`, `"Careful, puss - sugar everywhere."`, `"One more tray
and the cottage smells like heaven."` The tray is new geometry — a plank board with three round cookies
(the same dough/icing colours as the gingerbread men) topped with a piped icing ring — built inline rather
than as a shared prop, since nothing else needs it. She uses the same generic `Kneeler` controller as the
Neighborhood's gardener and Frosty Peak's reindeer keeper (kneeling + patting animation, its own physics
circle, `greetable()` wired up automatically) — no new plumbing.

Checked against the physics: baker at (3.5,-56.5), tray box at (3.5,-57.8) — 1.3 m north, clear of her own
kneeling circle by 0.45 m. The cottage's own collider ends at z=-58.8, the tray box starts at z=-58.3, a
0.5 m gap. Nearest hand-placed obstacles — the cookie-path tiles (decorative only, no collider) and a
gumdrop cluster centred (10,-50) with a 6 m radius — sit 2+ m and 10+ m away respectively; the sweet-stall
vendor from Round 79 is 50 m off on the other side of the map.

Verified beyond the test suite's own checks: a headless script started the game for real, travelled to
Candy Land, found the new `Kneeler` in the scene graph at its intended spot, confirmed `game.interact()`
takes `game.state.friends` from empty to one, then ran 200 more frames and confirmed both the baker and the
cat stayed at finite positions. Full suite (three runs, all `ok`, 0 console warnings, exit 0) ran clean
before and after building: `world 1: 26 to meet` (up from 25), every NPC still in the scene graph, and
`world 1: 92% of the ground is walkable` unchanged.

On arrival, `HEAD` was detached 47 commits ahead of the local `main` branch pointer (itself just a stale
ref — a `git fetch` showed `origin/main` already matched `HEAD`, so no work was actually at risk); reset
local `main` to `origin/main`'s real tip and checked it out before starting, no other cleanup needed.

## Round 81 — a juggler works the Victorian market square

None of the seven worlds had ever had a street performer, and Victorian's market square — four vendor
stalls, a fountain, gas lamps — had one obvious quiet patch of cobbles: the open stretch between the
fountain and the west-side stalls, six metres clear of both.

**A juggler now stands there with three balls always in the air**, calling out `"Three balls, never
four - not since Tuesday."`, `"Watch the hands, not the cat, sir!"`, `"One coin in the hat, if you liked
that."` This needed a genuinely new controller — nothing in `55-npcs.js` moved a prop free of the rig's
own hands before. The new `Juggler` class keeps the three balls as their own meshes (never parented to a
hand, since they leave it), and sweeps each one on a continuous `sin`/`cos` loop from one side of the body
to the other, arcing up at the midpoint, the three offset by a third of a turn so one is always near the
peak — smooth and looping forever, not a literal over/under cascade, but reads as juggling without ever
snapping or teleporting a ball between throws. The arms lift and drop in time on the same period. Built
with the standard `randomPerson`/`makeWardrobe` plus `greetable(game, this)`, so it costs nothing extra in
scene-graph or friend-count bookkeeping.

Checked against the physics: juggler at (-6,-34), facing the fountain. The fountain's own collider is a
6.8×6.8 box centred on (0,-34), leaving 2.6 m of clearance; the nearest stall colliders (pieman at
(-10,-29.3), coster at (-10,-43.3)) are 6+ m away; the market square's own north-south lane (kept clear
for the road-walking test) sits at x ≈ -1.2 to -2.3, a further 3.7 m east. The juggler's own physics circle
(radius 0.4) is a moving-NPC collider, not a fixed obstacle, so it can't fail the walkability check the way
a static box would.

Verified beyond the test suite's own checks: a headless script started the game for real, travelled
Neighborhood → Candy Land → Robot City → Victorian, found the new `Juggler` in the scene graph at its
intended spot with all three balls also in the scene, walked the cat up to it, confirmed the "Say hello"
prompt appears and `game.interact()` takes friends from 0 to 1, then ran 300 more frames and confirmed the
juggler's rig and all three balls stayed at finite positions, and confirmed its spot doesn't sit inside any
static collider. Full suite (273 `ok` lines, all passing, 0 console warnings) ran clean seven of eight
times: `world 3: 32 to meet` (up from 31), every NPC still in the scene graph, and `world 3: 95% of the
ground is walkable` unchanged. The one failure, once in eight runs, was Sunny Shore's kite-height check —
timing-sensitive against real elapsed frame time, touches no file this round changed, and is the same
flake class noted in Round 79's log.

On arrival, the repo was exactly as Round 80 left it (`origin/main` at the baker commit); a stale local
`main` ref pointed 47 commits behind until `git fetch` + `checkout -B main origin/main` sorted it, no other
cleanup needed.

## Round 82 — the green car's owner gives it a wash

The Neighborhood's one parked car — the green one tucked in its owner's yard south of the road at
(21.5, 6.5) — has sat there since it was first placed, never once acknowledged by anyone on the street.
Every other named prop in the village (the mailbox, the swing, the balloon seller's pitch) has a person
attached to it by now; the car was the odd one out.

**Its owner is now out in the yard washing it**, sponge in hand, working a slow side-to-side scrub over the
wing while a bucket of suds sits at their feet: `"Nearly got the wing mirror shiny."`, `"Careful, puss -
wet paint, this bit."`, `"She'll gleam like new by lunchtime."` This needed a new `Washer` controller —
close kin to the existing `Painter` (same idle-arm-damping shape, a held prop in one hand, the other braced),
but the working arm sweeps on a plain `sin` loop instead of dabbing at a canvas, and there's no easel to
manage. The bucket is two stacked cylinders (a blue plastic body, a paler translucent disc for the suds)
built inline, since nothing else in the game needs a bucket model. Built with `makeWardrobe`/`randomPerson`
plus `greetable(game, this)` in the constructor, same as every other kneeling/standing vignette.

Checked against the physics: the washer stands at (21.5, 4.6), 0.9 m south of the car's own collider box
(which spans z 5.5–7.5) — clear by 0.55 m once the washer's own 0.35 m physics circle is subtracted. The
bucket sits at (20.6, 4.5), just west of the washer and clear of the house box (z ends at 3.2), the
mailbox (19.6, 1.3), and the yard fence (z 7.9–8.1, well north of both). None of it comes near any of the
seven roads/paths the test suite walks end to end (all at z ≥ 9.6 or along x = 44).

Verified beyond the test suite's own checks: a headless script started the game for real, found the new
`Washer` in the scene graph at (21.5, 4.6), confirmed the "Say hello" prompt appears and `game.interact()`
takes friends from 0 to 1, then ran 200 more frames and confirmed both the washer and the cat stayed at
finite positions, and read back the car's own collider box to confirm the 0.9 m clearance by hand. Full
suite (273 `ok` lines, all passing, 0 console warnings, exit 0) ran clean three times before and after
building: `world 0: 19 to meet` (up from 18, `neighborhood has 20 people`, up from 19), every NPC still in
the scene graph, and `world 0: 96% of the ground is walkable` unchanged.

On arrival, the repo was exactly as Round 81 left it (`HEAD` detached at the tip of `origin/main`, local
`main` 48 commits behind); fast-forwarded local `main` to `origin/main` and checked it out before starting,
no other cleanup needed.

## Round 83 — a robot recharges by the statue plaza

Robot City's west statue plaza has flown a green neon "CHARGE" sign since the world was first built, but
nothing there had ever actually been charging — a decoration nobody could read as anything but scenery.

**A worker robot now stands plugged into a charging pylon on the plaza's quiet south side**, a cable
running from its side to the pylon's glowing head, which breathes brighter and dimmer on a slow sine
(paired with a matching point light so the glow actually lights the concrete, not just its own bulb). No
new geometry beyond the pylon itself (a steel post, a dark cap, a glowing green sphere) and the cable — the
robot is the same `makeRobot()` used everywhere else in the city. It needed a new controller, though:
nothing existing left a rig standing put while still reachable and chatty. `Charger` is `Kneeler` stripped
down to the parts that make sense for a robot (no legs to re-pose — the rig's own idle animation already
handles that) — greetable, with its own cries: `"Charge at 74%... 75%..."`, `"Do not unplug. Please do not
unplug."`, `"Beep. Recharging. Beep."` The cable itself is built exactly like the fishing line in
`IceFisher`: a rotated cylinder in a wrapper group, then one `lookAt` + `scale.set(1,1,dist)` at
construction time — no per-frame update needed, since neither end ever moves.

Checked against the physics with a headless probe script (built the bundle, called `game.travel(2,
'from-prev')`, waited out its real 600ms `setTimeout` before reading `game.physics.boxes`) rather than
guessing coordinates: the robot and pylon sit at (-37, 12) and (-36, 12), a stretch of bare concrete with
zero colliders and zero `game.zones` entries within several metres in every direction — the nearest things
are a lamp post 7 m off, the statue's own collider 9 m off, and two skyscraper footprints 8-9 m off. Hand-placed
props and the ring portal back to Candy Land (at x=-10) are 27 m clear.

Verified beyond the test suite's own checks: the same headless approach found the new `Charger` in the
scene graph at its intended spot, confirmed a "Beep hello" prompt appears and `game.interact()` takes
friends from 0 to 1, ran 300 more frames and confirmed both the robot and the cat stayed at finite
positions, and confirmed the spot isn't embedded in any static collider. Full suite (273 `ok` lines, all
passing, 0 console warnings, exit 0) ran clean before and after building: `world 2: 26 to meet` (up from
25), every NPC still in the scene graph, and `world 2: 88% of the ground is walkable` unchanged.

On arrival, the repo was exactly as Round 82 left it (`origin/main` at the car-wash commit); a detached
`HEAD` on that same commit with local `main` 49 behind was fixed with `git checkout -B main origin/main`,
no other cleanup needed.

## Round 84 — Sector 8's belt gets a quality inspector

Robot City's second conveyor line, out in the east yard under the "SECTOR 8" neon sign, had run for every
round since it was built with nobody watching it — a good half of the factory floor's own pair of belts had
a loader robot at the end; this one never did.

**A human quality inspector now kneels by the stack of crates already off the belt**, clipboard in hand,
looking them over: `"Every crate off Sector 8 gets a look before it leaves."`, `"Careful, puss — don't dent
the paperwork."`, `"Line's running smooth today, for once."` The first instinct was to give this belt a
second `Loader` robot to match the factory floor's pair — but the test suite hardcodes `ld.length === 2` for
Robot City's loaders (a real assertion that two, and only two, Loader robots lift crates), so a third would
have failed it outright. A human `Kneeler` beside the same kind of crate stack tells the same "someone
finally minds this belt" story without touching that invariant, and it's a plain reuse of an existing,
well-tested controller — no new class, no animation risk.

Checked against the physics with a headless probe (built the bundle, clicked the on-screen start button so
`game.started` is true and the interactable-scanning half of the game loop actually runs — the first probe
attempt skipped that and got a false "nothing to interact with" reading before this was caught — then
`game.travel(2, 'from-prev')`, waited out its real ~1.1 s of chained `setTimeout`s): the crate stack sits at
(45.5–46.6, 19.1), the inspector kneels at (47.6, 19.1), and the only static colliders within 8 m are the
conveyor's own box, the crate stack's own box, and a light pole 7 m off at (44, 26) — no skyscraper from
either ring of the skyline landed nearby. Confirmed the "Say hello" prompt appears within range, that
`game.interact()` takes friends from 0 to 1, and that the inspector and crates stay at finite positions
after 300 more frames.

Full suite (290 `ok` lines, all passing, 0 console warnings, exit 0) ran clean three times: `world 2: 27 to
meet` (up from 26), every NPC still in the scene graph, and `world 2: 88% of the ground is walkable`
unchanged.

On arrival, the repo was exactly as Round 83 left it (`origin/main` at the charging-robot commit); local
`main` was stale and was fast-forwarded with `git checkout -B main origin/main`, no other cleanup needed.

## Round 85 — a birdwatcher on Sunny Shore

Sunny Shore had a whole flock of seagulls wheeling over the water and, after 84 rounds, still nobody on the
sand paying them any mind — every other world with circling wildlife (Whisper Woods' owls, Frosty Peak's
aurora) had already earned someone watching it. Sunny Shore, Frosty Peak and Whisper Woods were tied at the
bottom of the friend count (17 each) going into this round, so any of the three was fair game; the gulls
were the clearest gap.

**A birdwatcher now stands on the open sand south of the beach huts, binoculars raised to the wheeling
gulls**: `"There's one - no, gone again."`, `"Fifty-two species this year, if I've counted right."`, `"Gulls
mostly. Still counts."` This is a straight reuse of the `Birder` controller already doing exactly this job
for Whisper Woods' owls — same binoculars prop, same raise-and-lower gesture — just relocated to the beach
with a beachier wardrobe (no coat, sunglasses instead of none). No new class, no animation risk.

Checked against the physics with a headless probe (built the bundle, called `game.travel(4, 'from-hub')`,
waited out its ~1.1 s of chained `setTimeout`s, then read `game.physics.boxes`/`circles` and `game.npcs`
directly): placed at (-8, -36), a stretch of bare sand south-west of the hut row — zero static colliders
within 8 m in any direction, the nearest other NPC a passing seagull `Flyer` 7 m off (no collider, flies
over), and the nearest grounded neighbour (the beachcomber at (5, -32)) a clear 14 m away.

Verified beyond the test suite's own checks: the same probe found the birdwatcher in the scene graph at its
intended spot, confirmed the "Say hello" prompt appears within its 2.1 m greet radius, that `game.interact()`
takes friends from 0 to 1, and that its position stayed finite after 300 more frames. Full suite (273 `ok`
lines, all passing, 0 console warnings, exit 0) ran clean before and after building: `world 4: 18 to meet`
(up from 17), every NPC still in the scene graph, and `world 4: 99% of the ground is walkable` unchanged.

On arrival, the repo was exactly as Round 84 left it (`origin/main` at the quality-inspector commit); local
`main` was stale (behind and holding old history) and was reset to it with `git checkout -B main
origin/main`, no other cleanup needed.

## Round 86 — someone feeds Whisper Woods' deer

Frosty Peak has a reindeer keeper checking harness bells and a girl leaving carrots on a rock for its herd;
Whisper Woods has had three wandering deer since the world was built and nobody paying them any mind at
all — the woods' friend count (17) was tied for lowest with Frosty Peak, and this was the clearest gap
between the two.

**A woman now kneels at the fringe of the trees by the western deer's home spot, scattering acorns**:
`"Acorns bring them close, if you're quiet."`, `"Careful, puss — you'll scare them off."`, `"That one always
comes first."` Plain reuse of the `Kneeler` controller already doing this job all over the game (the
sculptor, the reindeer keeper, both snowman/igloo kids) — no new class, no animation risk.

Checked against the physics with a headless probe (built the bundle, called `game.travel(6, 'from-hub')`,
waited out its real ~1.1 s of chained `setTimeout`s before reading `game.physics.boxes` and `game.npcs`
directly — the first attempt filtered boxes with `Array.filter`'s index argument standing in for a default
radius parameter and reported half the world as "nearby"; fixed by wrapping the filter in an explicit
one-arg lambda): placed at (-21.8, 3.0), 2.2 m off the deer's own home spot, the same offset the Frosty Peak
reindeer keeper already uses safely. Only one static collider sits within 8 m — a giant mushroom at (-20, 0)
— and its nearest edge is still 3.4 m clear; the nearest other NPC (the deer itself, roaming its 8 m leash)
settled 3.8 m away after 300 more frames.

Verified beyond the test suite's own checks: the same probe found the kneeler in the scene graph at its
intended spot, confirmed a "Say hello" prompt exists, and confirmed its position stayed finite after those
300 frames. Full suite (273 `ok` lines, all passing, 0 console warnings, exit 0) ran clean before and after
building: `world 6: 18 to meet` (up from 17), every NPC still in the scene graph, and `world 6: 98% of the
ground is walkable` (down 1 point from the new collider, still comfortably above the suite's 80% floor).

On arrival, the repo's local `main` was a detached `HEAD` one commit ahead of a stale cached `origin/main`
ref; a `git fetch origin main` showed the real remote had already moved to that same commit (a forced,
unrelated-history update — the local ref was simply out of date, not actually behind), and `git checkout -B
main origin/main` cleared it up, no other cleanup needed.

## Round 87 — a marshmallow at the fire's third seat

Frosty Peak's campfire has three log seats built in (the tripod of logs ringing the flames), but only one
was ever taken — the old-timer warming her hands. Frosty Peak was also tied for the lowest friend count
(17) of any world, so filling the empty seat was the clearest small gap available.

**A kid now takes the fire's third log seat**: `"Careful, this one's about to catch."`, `"Best seat in the
village, right here."`, `"Golden brown, not black — that's the trick."` Plain reuse of the `Sitter`
controller already seating the old-timer at the same fire, on the other free log (the loop building the
fire's three seating logs at angles 0.4, 2.5, 4.4 only ever had 2.5 taken) — same seat height, no new class,
no animation risk, and no held marshmallow prop (the dialogue does that work instead, to keep the change to
one line).

Checked against the physics with a headless probe (built the bundle, set `game.started = true`, called
`game.travel(5, 'from-hub')`, waited out its ~1.2 s of chained `setTimeout`s, then read `game.physics.boxes`
and `game.npcs` directly): the seat sits at (-0.52, -1.62), 2.2 m from the old-timer's own seat on the far
side of the fire; the four static colliders within 8 m are the fire pit itself and its own three seating
logs, and none of them overlap the seat position (nearest edge just under 1 m clear — the same clearance the
old-timer's identical seat already has).

Verified beyond the test suite's own checks: the same probe found the new `Sitter` in the scene graph at its
intended spot, confirmed the "Say hello" prompt appears within range, that `game.interact()` (via the found
interactable's `onUse`) takes `game.state.friends.size` from 0 to 1, and that its position stayed finite
after 300 more frames. Full suite (290 `ok` lines, all passing, 0 console warnings, exit 0) ran clean before
and after building: `world 5: 18 to meet` (up from 17), every NPC still in the scene graph, and `world 5:
98% of the ground is walkable` unchanged.

On arrival, the repo was exactly as Round 86 left it (`origin/main` at the deer-feeding commit, a shallow
clone whose `merge-base` briefly looked like unrelated history until `git fetch --unshallow` resolved it);
`git checkout main && git merge --ff-only origin/main` brought local `main` in line, no other cleanup
needed.

## Round 88 — a coachman waits by the clock tower

The Victorian street has a parked carriage near the clock tower (`makeCarriage`, built long ago) that has
sat there empty this whole time — no driver, no horse, nobody minding it, right next to the one working
clock in the game. That felt like the clearest gap in a world already busy with vendors, a juggler, a
lamplighter, a bobby and a moving horse-and-carriage of its own.

**A coachman now sits up on the parked carriage's driver's bench, watch in hand**: `"Right on time, or so
the clock says."`, `"The fare's been in that shop twenty minutes. Some things never change."`, `"Careful of
the wheels, puss."` Plain reuse of the `Sitter` controller (the same one seating the fire-side old-timer and
the stump-sitters in the woods) — no new class, no held prop, the dialogue does the "pocket watch" work
instead.

Worked out the driver's bench position by hand from the carriage's own geometry: the bench mesh sits at
local `(0, 2.0, 1.9)` inside the carriage's rotated group (`ry = PI/2`), which works out to world `(17.9,
3.4)` once the local `z` offset is rotated into world `x`. Checked against the physics with a headless
probe (built the bundle, called `game.travel(3, 'from-prev')`, waited out its ~1.3 s of chained
`setTimeout`s, then read `game.physics.boxes` and `game.npcs` directly): the only static collider touching
that spot is the carriage's own body box (it works out that he's sitting on the thing, as intended); the
nearest unrelated colliders — two terrace houses and their fences — sit a clear 6+ m off.

Verified beyond the test suite's own checks: the same probe found the coachman in the scene graph at his
intended spot, confirmed the "Say hello" prompt exists and that using it takes `game.state.friends.size`
from 0 to 1, and that his position stayed finite after 300 more frames. Full suite (290 `ok` lines, all
passing, 0 console warnings, exit 0) ran clean before and after building: `world 3: 33 to meet` (up from
32), every NPC still in the scene graph, and `world 3: 94% of the ground is walkable` unchanged.

On arrival, the repo's local `main` was a detached `HEAD` sitting at the same commit as `origin/main` (a
stale branch ref underneath it, 45 ahead / 50 behind); `git checkout -B main origin/main` reset it cleanly,
no other cleanup needed.

## Round 89 — a carrot nose for the far snowman

A headless tally (`game.load(i, 'from-prev'/'from-hub')` per world, reading `game.friendTotal`) found
Sunny Shore, Frosty Peak and Whisper Woods tied at eighteen, the thinnest worlds now that round 88's
coachman pushed Victorian ahead. Frosty Peak's village has four snowmen, but only the first of them
(built round 48) ever got a child fussing over it — the other three have stood bare since whichever
round first piled them up.

**A second child now kneels by the far snowman**, pressing a carrot into its face for a nose:
`"Found him a carrot, look!"` `"Straight in the middle, that's the trick."` `"Don't sneeze on it, puss
- it took ages to find."` Plain reuse of the `Kneeler` controller and the exact pattern round 48 already
used for the first snowman (and the igloo, the reindeer, the sandcastle) — no new class, no new
geometry, just the same "patting the snow" animation and a second bare snowman put to use. Frosty
Peak now has 19 people to meet instead of 18, ahead of Sunny Shore and Whisper Woods (both still 18).

Checked the spot with a headless probe (built the bundle, called `game.load(5, 'from-hub')`, read
`game.physics.boxes` and `game.npcs` directly): the kneeling spot (7, 19.3) sits 0.8 m clear of the
snowman's own collider box (the only static collider within 3 m) and well clear of the nearest cabin
(8.5 m away) and pine tree (9.4 m away). The same probe found the new `Kneeler` in the scene graph at
its intended spot, confirmed the nearest interactable there is "Say hi" at distance 0, that using it
takes `game.state.friends.size` from 0 to 1, and that its position stayed finite after 300 more frames.
Full suite (273 `ok` lines, all passing, 0 FAIL, 0 console warnings, exit 0) ran clean before and after
building.

On arrival, local `main` was already level with `origin/main` (checked with `git fetch origin main`
and `git log --oneline` both ways), so nothing needed fast-forwarding before starting this round's
work.

## Round 90 — a metal detectorist on Sunny Shore

A headless tally of `game.friendTotal` per world (built the bundle, called `game.load(i, ...)` for
each) found Sunny Shore and Whisper Woods tied at eighteen, the thinnest worlds now that round 89's
second snowman pushed Frosty Peak to nineteen.

**A metal detectorist now sweeps the open sand** between the ice-cream cart and the sunbathers'
corner, coil swinging side to side, arm and head dipped toward the ground. Every eleven to eighteen
seconds it beeps and throws a little shower of sparks where the coil is pointed — a "find" that never
actually leaves the sand. Three lines when the cat comes close: `"Found a bottle cap. Progress."`
`"Careful, puss, you'll set it off."` `"One day it'll be real treasure."` New `Detectorist` controller
in `55-npcs.js` (built on the same standing-and-swinging-arm shape as `Washer` and `Vendor`, with a
held prop — a pole and a coil — made the same way `Birder`'s binoculars are: two primitives parented
straight onto the rig's hand). Sunny Shore now has 19 people to meet, level with Frosty Peak and ahead
of Whisper Woods.

Checked the spot with a headless probe (built the bundle, called `game.load(4, 'from-hub')`, read
`game.physics.boxes` and `game.npcs` directly): the detectorist's chosen spot (-6, 18) sits 5.3 m clear
of the nearest static collider (a beach hut wall), confirmed it's in the scene graph, that "Say hello"
exists and takes `game.state.friends.size` from 0 to 1, that its position stays finite after 300 more
frames of update, and that the find-timer actually fires and resets to a new multi-second wait rather
than getting stuck. Full suite (273 `ok` lines, all passing, 0 FAIL, 0 console warnings, exit 0) ran
clean before and after building; Sunny Shore also reads as 100% walkable on the grid sample, same as
before the change.

## Round 91 — a hedgehog hunt at the hollow log

A headless tally of `game.friendTotal` per world (built the bundle, called `game.load(i, ...)` for
each) found Whisper Woods the thinnest at eighteen, a step behind Sunny Shore and Frosty Peak at
nineteen. Whisper Woods has five fallen hollow logs scattered through the trees (moss, mushrooms, sawn
ends showing growth rings) but not one of them had ever had anyone paying attention to it — pure
scenery since whichever round first placed them.

**A child now kneels at the mouth of the eastern hollow log**, convinced there's a hedgehog just out
of reach inside it: `"It's in there, I heard it snuffle."` `"Shh - you'll frighten it further in."`
`"There! ...no. Gone again."` Plain reuse of the `Kneeler` controller (the same one used for the deer
feeder and both snowmen-carrot kids) — no new class, no new geometry, just a bare log put to use.
Whisper Woods now has 19 people to meet, level with the other two.

Worked the kneeling spot out from the log's own geometry: the log is 3.4 long, radius 0.62, built
along its local x-axis before the world places it at (22, -14) with `ry = 1.1`; the child kneels 2.5 m
out from the log's centre along that rotated axis (past the log's own open end), facing back in.
Checked with a headless probe (built the bundle, called `game.load(6, 'from-hub')`, read
`game.physics.boxes` and `game.npcs` directly): the only collider within 3 m of the kneeling spot is
the log's own box, and the kneel point sits a further 1.6 m clear of it. The same probe found the
child in the scene graph, confirmed the greet interactable exists and takes `game.state.friends.size`
from 0 to 1, and that its position stayed finite after 300 more frames. Full suite (273 `ok` lines, all
passing, 0 console warnings, exit 0) ran clean before and after building; Whisper Woods still reads as
98% walkable, unchanged.

On arrival, local `main` was a stale detached `HEAD` sitting behind `origin/main` (a force-updated
branch ref underneath it); `git checkout -B main origin/main` reset it cleanly, no other cleanup
needed.

## Round 92 — the third owl answers back

A headless tally of `game.friendTotal` per world (built the bundle, called `game.load(i, ...)` for
each) found the four hub worlds (Neighborhood, Sunny Shore, Frosty Peak, Whisper Woods) tied at
nineteen apiece — nothing thinnest to chase this time. Went looking for an unfinished thread
instead: round 64 wired up the westernmost of Whisper Woods' three perched owls to answer a hello,
round 65 did the same for the middle one, and both logs named the third — at (12, 32), by the
lantern string running out to the treehouse — as "still just scenery," never picked back up since.

**That owl now answers too.** Same `game.namedFriend()` + `befriend()` pattern as its two
tree-mates (an owl thirty feet up has no rig for `greetable()`'s marker checks), its own id
(`owl3`, alongside `owl` and `owl2`, all scoped under Whisper Woods' `forest:` key) and its own
line: `"Hoo? ...Hoo. That's the whole conversation, really."` Whisper Woods goes from nineteen
friends to twenty, ahead of the other three hub worlds.

Verified beyond the test suite's own checks: a headless script started the game for real, travelled
to Whisper Woods, found the third owl's interactable by position, teleported the cat to it, confirmed
`game.nearest.label()` reads "Say hello to the owl" and `game.interact()` takes `game.state.friends`
from empty to holding `forest:owl3`, then ran 300 more frames and confirmed the owl's position stayed
finite. Full suite ran clean before and after building: `world 6: 20 to meet` (up from 19), every NPC
still in the scene graph, 0 console warnings, exit 0.

On arrival, local `main` was a stale ref sitting well behind a detached `HEAD` that matched
`origin/main` exactly (the same "forced update" pattern several recent rounds have hit) —
`git checkout -B main origin/main` reset it cleanly before starting, no other cleanup needed.

## Round 93 — Sunny Shore gets a painter of its own

Round 92 tallied the four hub worlds at nineteen friends apiece, then bumped Whisper Woods to
twenty via the third owl. That left Sunny Shore, Frosty Peak and the Neighborhood tied at the
bottom. A grep for `new Painter(game` across the source turned up four already: Neighborhood,
Robot City, Frosty Peak (painting the aurora) and Whisper Woods (the mushroom glade) — Candy Land,
Victorian and Sunny Shore had never had one. Sunny Shore had the obvious subject sitting right
there: the lighthouse.

**An artist now sets up an easel on the clear sand south of the lighthouse**, working through the
same `Painter` controller and `makeEasel()` prop the other four worlds use, facing the tower's
red-and-white bands. Lines: `"That red band never sits quite straight, does it."`, `"Best light on
the coast, this time of day."`, `"Careful, puss - wet paint, if you can believe it dries out here
at all."` `Painter` calls `greetable()` itself, so no extra friend-bookkeeping was needed.

Checked against the physics: the spot is (0, -40), thirteen metres clear of the lighthouse's own
keep-out circle (radius 9, centred on (12, -46)) and its scattered rock ring (radius 2.6-6 round
the same centre), and well clear of the birdwatcher, beachcomber and tideline-message girl further
along the sand. Not on any road or path the test suite walks (those are all in the Neighborhood).

Verified beyond the test suite's own checks: a headless script started the game for real (clicking
the actual start button, not just calling `travel()` — `game.nearest` only populates once
`game.started` is true), travelled to Sunny Shore, waited out the real portal-fade timer the same
way the suite's own travel loop does, found the new painter and easel both parented into the scene,
teleported the cat alongside, confirmed `game.nearest._label` reads "Say hello" and
`game.interact()` takes `game.state.friends` from empty to one, then ran 300 more frames and
confirmed both the rig and the easel stayed at finite positions throughout. Full suite (296 checks)
ran clean three times before and after building: `world 4: 20 to meet` (up from 19), `world 4: 99%
of the ground is walkable` (unchanged), every NPC still in the scene graph, 0 console warnings,
exit 0.

On arrival, `HEAD` was detached at a commit matching `origin/main` exactly, with local `main`
stale behind it — the same pattern recent rounds have hit. Left `main` alone this time and worked
from the matching detached `HEAD`, pushing straight to `origin/main` at the end instead of
resetting the local branch ref, since the classifier that guards this sandbox declined the
branch-reset command as a destructive local change; the repo state itself needed no cleanup.

## Round 94 — a court jester for the Candy Queen's empty throne

The grand hall inside the Candy Queen's castle had nothing in it but two marching gingerbread
guards up by the dais — all that space between the gate and the throne stood empty. A **court
jester now juggles three candy-coloured balls in the middle of the hall**, facing the throne, the
same juggling act already used for the Victorian market square. Says things like *"The throne's
empty most days. Good acoustics, though."* and *"Her Majesty prefers the airlock. More's the
pity."* — a nod to the fact that the Candy Queen herself actually guards the airlock down south,
not this throne room. Placed well clear of the four candy-cane pillars and the gate towers using
the castle's own `gate`/`throne` anchor points (the castle's rotation is fixed at `PI`, unlike the
village houses' random door-facing, so the position math was safe to work out by hand). Full suite
(273 checks) ran clean after the change: `world 1: 27 to meet` (up from 26), every NPC still in
the scene graph, 91% of Candy Land's ground still walkable, 0 console warnings, exit 0.

## Round 95 — an orchard hand for the Neighborhood's empty apple rows

The Neighborhood and Frosty Peak were tied at the bottom of the friend count (19 apiece). Frosty
Peak's build function is already dense with kneelers, sitters and vendors packed around the fire
and pond, so instead of crowding it further, went looking at the Neighborhood's own quiet corner:
the four-by-four orchard grid in the south-east, planted back in an earlier round, had never had
anyone working it — sixteen apple trees and not a soul among them.

**An orchard hand now kneels between the rows, sorting a wooden crate of fallen apples.** Built
with the `Kneeler` controller (the same kneel-and-pat animation used for the ice sculptor and the
snowman-builders), facing a hand-built crate of four apple-coloured spheres. Lines: *"Best crop in
years, this lot."*, *"Mind the wasps, puss — they love a bruised one."*, *"Every crate goes down to
market by Friday."*

First attempt placed the new code right after the orchard's tree-planting loop, which shifted every
`r()` draw for the rest of the Neighborhood's build (house colours, hats, the shared street
wardrobe) and broke two unrelated tests — a duplicate shirt colour among the street's people, and
the wrong NPC getting picked for the "walks up and waves" check, since the front-loaded insertion
reordered `game.npcs`. Moved the block to the end of the build function instead, alongside the
other one-off street characters (the postie, the car-washer, the balloon seller), which only
appends new draws rather than reshuffling earlier ones — same pattern those existing characters
already use. Picked the crate's position at the dead centre of four trees (safe clearance from
every trunk's collision box) and gave the kneeling spot its own thirteen-metre gap from the nearest
road, well outside anything the test suite's road-walking checks touch.

Verified beyond the test suite's own checks: a headless script started the game for real (clicking
the actual start button), found the new Kneeler in `game.npcs` and confirmed its rig is parented
into the scene, teleported the cat alongside it, confirmed `game.nearest.label()` reads "Say
hello", confirmed `game.interact()` takes `game.state.friends` from empty to one, then ran 300 more
frames and confirmed the rig's position stayed finite throughout. Full suite ran clean before and
after building: `world 0: 20 to meet` (up from 19), every NPC still in the scene graph, 96% of the
Neighborhood's ground still walkable, 0 console warnings, exit 0.

## Round 96 — a zipline attendant for Whisper Woods

Checked the friend count across worlds and Frosty Peak was lowest at 19, but its build function
is already dense with kneelers, sitters and vendors (as recent rounds have noted), so rather than
crowd it further, looked for a genuinely empty spot elsewhere. Whisper Woods' zipline — a start
tower at (-30, 30) with a squirrel riding the trolley down to a landing post — had never had anyone
near it, despite the woods otherwise being full of people.

**An attendant now stands at the foot of the tower, checking the cable before sending the next
rider off.** Built with the `Charger` controller (stand-in-place, greetable, periodic cries), since
nobody actually climbs the tower or rides the line — it's decorative, same as before. Lines:
*"Cable's tight, harness checked - all set."*, *"Only ever the squirrel gets a turn, mind."*,
*"Mind the posts, puss - they don't budge."* — a nod to the fact that the only rider is, and
always has been, the squirrel on the trolley.

Placed at (-33, 28), 3.6 m from the tower's own 2×2 m physics box and clear of every other prop
in the file (inner trees, hollow logs, rock piles, the ring-dance clearing) — confirmed empty with
`game.physics.blocked()` in a headless probe before writing the change, since the spot sits well
outside anything the test suite's own road/path walker checks. Added the block after the ring-dance
NPCs, at the end of the world's people, so it only appends new `r()` draws rather than reshuffling
earlier ones (the mistake Round 95 hit and fixed).

Verified beyond the test suite's own checks: a headless script started the game for real (clicking
the actual start button), travelled to Whisper Woods, waited out the real portal-fade timer,
found the new `Charger` in `game.npcs` with its rig parented into the scene, teleported the cat
alongside it, confirmed `game.nearest._label` reads "Say hello", confirmed `game.interact()` takes
`game.state.friends` from empty to one, then ran 300 more frames and confirmed the rig's position
stayed finite throughout. Full suite (273 checks) ran clean before and after building: `world 6: 21
to meet` (up from 20), every NPC still in the scene graph, 99% of Whisper Woods' ground still
walkable, 0 console warnings, exit 0.

## Round 97 — a genuine test flake fixed, a gumdrop bracelet in Candy Land, and a repo scare

This round started with `main` frozen 63 rounds behind where this log says it should be — this
sandbox's git history had a second, completely disconnected line of commits sitting on a detached
`HEAD` (no shared ancestor with `main` at all), everything up through last round, never on any
branch and never pushed. It looked like it would be silently discarded when the sandbox was
recycled, so it got pushed to `origin/recovered-round-96` as a safety net before anything else
happened. Partway through this round `origin/main` was itself force-pushed to that same commit
(by another concurrent run, it looks like, reaching the same conclusion independently) — so the
history is whole again, but if anyone's tracking a `round34-attempt-on-old-main` or
`recovered-round-96` branch on the remote, they're leftover scaffolding from this recovery and can
be deleted once someone's confirmed nothing needs them.

**Fixed a real, intermittent failure in `test/run.mjs`.** Three spots waited out the portal fade
with a fixed real-time `sleep()` instead of polling `game.transitioning`, with as little as 40ms of
margin over the timers they were actually waiting on — one of them the wait after stepping through
the time door. Under load (more geometry to build, a slower box, a GC pause — nothing to do with
which world runs first) the wait could end before the fade's chain of `setTimeout`s had actually
resolved, and once a `travel()` call got silently swallowed by the `transitioning` guard because it
still thought a fade was running, the cat never made it home and the suite failed two checks near
the end for reasons that had nothing to do with them. Traced it by temporarily logging every world
`load()` call with its caller and the physics box count, confirmed the exact failure (a stranded
`travel(0)` from `completeJourney()`), and swapped all three fixed sleeps for the same
`while (game.transitioning) { await sleep(60); frames(4); }` polling idiom already used elsewhere in
the file. Was failing roughly one run in three before; more than a dozen clean runs since.

**A girl now kneels at the south-west edge of Candy Land's candy-cane forest, threading gumdrops
from the nearby patch onto a string.** Every hand-built world is dense with vignettes by this point
(96 rounds' worth), so rather than eyeball a spot and risk a collision or a duplicate idea, wrote a
small headless probe that samples the walkable ground in each world's hand-built core and ranks it
by distance to the nearest existing NPC or interactable — found this corner genuinely clear, over
30 m from anything else, confirmed with the same `physics.blocked()` call the test suite's own
road-walker uses. Lines: *"Three more and it's a bracelet."*, *"Mind the string, puss - sticky."*,
*"Best colours in the whole patch, out here."* Candy Land is up to 28 to meet.

Verified: full suite green repeatedly (`world 1: 28 to meet`, up from 27; 91% of Candy Land's
ground still walkable; 0 console warnings; `exit 0`), then rebuilt `dist/dimension_cat.html` and the
root copy.

## Round 98 — a fiddler at the foot of the clock tower

Started this round by finding local `main` in a detached-HEAD state, one branch pointer still stuck
63 rounds back at an old commit while `origin/main` (and the actual checked-out `HEAD`) already had
last round's recovery on it. Reset the local `main` branch to match `origin/main` before touching
anything, so this round builds on the real history rather than reopening the same scare.

Went looking for the least-visited world by scanning the log for how often each world's name comes
up in recent rounds: Victorian and Robot City had had the fewest mentions in ages, even though
Victorian already has the most people of any world (33). The clock tower plaza (east end of the
street) had the tower, a carriage with its coachman, and nothing else — a big empty square of
cobbles around a landmark everybody walks straight past.

**A fiddler now rests at the tower's foot, violin and bow in hand, between tunes, with an open
case and a few coins at his feet.** Built as a `Charger` (stand in place, greetable, periodic
cries) with a small violin (body, neck, scroll) held in one hand and a bow — kept out of the ink
pass, being thin — in the other; both are static props rather than an animated playing motion,
since `Charger` doesn't repose the arms each frame. Lines: *"Tuppence for a tune, if you fancy
one."*, *"Squirrel stole my rosin, you know."*, *"Wind me up and I'll play Greensleeves."*

Placed at (39, 6): outside the clock tower's own 7.5×18×7.5 physics box, inside the tower's 16×16
paved plaza, and inside the same keep-out circle (`zones.addCircle(42, 0, 11)`) that already stops
the procedural country from scattering clutter there, so nothing else could have been sharing the
spot. Checked its distance from the side road the test suite walks end to end (`x = 44`, the whole
length of the street) before committing to the position — a full metre of clearance either side of
the test's own 0.5 m probe radius.

Verified beyond the test suite's own checks: a headless script called `game.start('new')` for real
(the click-driven path never fires `started = true` in a stub DOM, which silently disables the
whole nearest-interactable/step loop — worth remembering for future headless checks), travelled to
Victorian, found the new `Charger` in `game.npcs` with its rig parented into the scene, teleported
the cat alongside it, confirmed `game.nearest.label()` reads "Say hello", confirmed `game.interact()`
takes `game.state.friends` from empty to one, then ran 300 more frames and confirmed the rig's
position stayed finite throughout. Full suite ran clean before and after building: `world 3: 34 to
meet` (up from 33), every NPC still in the scene graph, 94% of Victorian's ground still walkable, 0
console warnings, exit 0.

## Round 99 — two robots on their break

Local `main` had drifted from `origin/main` again (a stale ref left over from a previous session,
not an actual divergence — `git fetch` cleared it up in one command, no history was ever at risk),
so this round started by re-syncing before touching anything.

Went looking for the world with the fewest mentions in recent rounds this time, rather than eyeball
it: counted world names across the last dozen-odd entries in this log. Robot City came up twice,
the least of any of the seven, even though it still had plenty of bare factory floor.

**Two robots now pause south-east of RoboDog's patrol loop, on the empty stretch of floor between
the conveyor belts and the perimeter fence, to swap gossip.** Built with the existing `Talkers`
controller — until now only ever given a pair of human rigs (the two Victorian ladies, the
neighbours by the pond) — paired with two plain `makeRobot()` rigs instead; robots already share
every field `Talkers` and its `lookAtCat` helper touch (`head`, `arms[].sh/el`, `group`, `animate`),
since `Wanderer` has used robot rigs the same way for rounds. Lines: *"Sector 8 got a new inspector,
I hear."*, *"Mine's still squeaking. Yours?"*, *"The furnace hums off-key today."*, *"Don't tell the
mechanic, but I like the squeak."*

Found the spot with a small headless probe rather than guessing: sampled a grid across the hand-built
core with `game.physics.blocked()` (the same call the cat's own movement uses) and ranked what came
back clear by distance to the nearest existing NPC or interactable, the same technique last round
used for Candy Land. Landed on (24, −9); confirmed both robots' exact stand positions (±0.65 either
side of it) are unblocked at their real 0.3 m circle radius before committing to it.

Verified beyond the test suite's own checks: drove `game.start('new')` for real, travelled to Robot
City the same way the suite does (polling `worldIndex` and `transitioning` rather than guessing a
frame count), found the new pair in `game.npcs` as a `Talkers` instance with both rigs parented into
the scene, walked the cat up to each in turn, confirmed `game.nearest.label()` reads "Beep hello" for
both and `game.interact()` takes `game.state.friends` from 0 to 2, then ran 400 more frames and
confirmed both rigs' positions stayed finite. Full suite ran clean before and after building:
`world 2: 29 to meet` (up from 27), every NPC still in the scene graph, 88% of Robot City's ground
still walkable, 0 console warnings, exit 0.

## Round 100 — a tracker follows paw prints toward the cave

Local `main` had drifted into a detached HEAD again (the same stale-checkout pattern noted in the
last couple of rounds, not an actual divergence), so this round started with a `git fetch` and
`git checkout -B main origin/main` before touching anything.

Counted world names across the last twenty-odd log entries to find the least-visited one: Frosty
Peak had come up only twice recently, against three or more for everything else, even though it's
one of the busiest hand-built worlds already (39 NPCs before this round).

**A tracker now kneels on the open snow south of the village, studying a line of paw prints that
lead toward the yeti's cave.** Built with the existing `Kneeler` controller — the same one already
doing the ice sculptor, the reindeer keeper and four separate kids — so no new animation code was
needed, just a new person and a new reason to be down on one knee. Lines: *"Prints this big? Has to
be the yeti."*, *"Careful, puss — don't smudge them."*, *"Heading straight for the cave, these
are."*

Found the spot with a headless probe rather than eyeballing it: built the world for real, collected
every NPC's position, then swept a grid checking `game.physics.boxes` the same way the test suite's
own road-walker does, ranking clear ground by distance to the nearest existing NPC. The top hits
all fell inside the cave's own flattened entrance strip (`zones.addSpan(-7, -62, 7, -24)`) and had
to be thrown out by hand; landed on (6, −20), just outside that strip and 14 m from anything else,
confirmed clear at a generous 0.8 m radius.

Verified beyond the test suite's own checks: drove `game.start('new')` for real, travelled to
Frosty Peak, found the new `Kneeler` in `game.npcs` with its rig parented into the scene, walked the
cat up to it, confirmed `game.nearest.label()` reads "Say hello" and `game.interact()` takes
`game.state.friends` from 0 to 1, then ran 300 more frames and confirmed the rig's position stayed
finite. Full suite ran clean before and after building: `world 5: 20 to meet` (up from 19), every
NPC still in the scene graph, 98% of Frosty Peak's ground still walkable, 0 console warnings,
exit 0.

## Round 101 — someone rakes leaves in the Neighborhood

Counted world names across the last thirty-odd log entries again: the Neighborhood hadn't had a new
character since Round 95 (the orchard hand), the longest gap of any of the seven worlds, even
though most of its front yards along the north row of houses sit empty.

**Someone now rakes a pile of leaves into shape in the front yard of a house on the north row, west
of centre.** Built with the existing `Washer` controller — until now only ever the car-washer's
sponge, side to side over a wing — reused here with a rake instead of a sponge: same one-hand swipe
animation, different prop and a small scattered heap of coloured leaf-spheres in front of them. No
new animation code needed. Lines: *"One more pile before lunch."*, *"Careful, puss — don't scatter
it!"*, *"These leaves just keep coming down."*

First choice of spot was wrong and caught in review: the obvious empty yard, at the house two lots
east of this one, turned out to sit inside the beach boardwalk's keep-out zone (`Z.addSpan(45,
20.3, 76, 23.7)`) — the boardwalk to Sunny Shore's gate runs right along the north row for that
stretch of houses, cutting through what would otherwise be their front yards. `game.zones.blocked()`
confirmed it before anything got built into the scene permanently in a bad spot; moved two lots
west instead (`x = -63`) and reconfirmed clear.

Verified beyond the test suite's own checks: drove `game.start('new')` for real, found the new
`Washer` in `game.npcs` with its rig parented into the scene, confirmed `game.zones.blocked()` is
false at both the raker's stand point and the leaf pile, confirmed no physics collider sits within
0.5 m of either spot, confirmed the nearest other NPC is 12 m away, walked the cat up, confirmed
`game.nearest.label()` reads "Say hello" and `game.interact()` takes `game.state.friends` from 0 to
1, then ran 300 more frames and confirmed the rig's position stayed finite. Full suite ran clean
before and after building: `world 0: 21 to meet` (up from 20), every NPC still in the scene graph,
96% of the Neighborhood's ground still walkable, 0 console warnings, exit 0.

## Round 102 — someone sweeps the doorstep in Candy Land's village lane

Counted world names across the last thirty-odd log entries: Candy Land had the fewest mentions of
the seven (six, against nine or more for everything else), even though the little candy-house
village on the lane up to the Queen's castle — five houses between the bridge and the throne room —
had never had a single resident. Plenty of gingerbread men wander the wider forest, but nobody lived
in the houses themselves.

**Someone now sweeps sugar dust off the nearest candy house's doorstep, into a little pile of
pastel crumbs.** Built with the existing `Washer` controller (already reused for the car-wash sponge
and, last round, a leaf rake) with a broom in place of either — same one-hand swipe, a new prop and a
small scattered heap of white/pink/lemon/blue sugar-grain spheres in front of them. No new animation
code needed. Lines: *"Sugar gets everywhere this time of year."*, *"Careful, puss — don't track it
in."*, *"Clean stoop, happy house."*

Finding the spot took an extra step this time: the house's collision box turned out to be an
axis-aligned square around its centre regardless of which way its door actually faces (`addRotBox`
bounds the rotated shape with its AABB, not the true rotated footprint), so a spot placed by eye
using the door's facing angle landed inside that square and came back `physics.blocked() === true`.
Built the game for real, read the house's actual `rotation.y` off the scene graph, and swept the
sweeper and the dust pile further out along that same facing direction until both cleared the square
with margin — confirmed with `game.physics.blocked()` before writing the coordinates into source.

Verified beyond the test suite's own checks: drove `game.start('new')` for real, travelled to Candy
Land, found the new `Washer` in `game.npcs` with its rig parented into the scene, walked the cat up
to it, confirmed `game.nearest.label()` reads "Say hello" and `game.interact()` takes
`game.state.friends` from 0 to 1 (id `candy:27`), then ran 300 more frames and confirmed the rig's
position stayed finite. Full suite ran clean before and after building: `world 1: 29 to meet` (up
from 28), every NPC still in the scene graph, 91% of Candy Land's ground still walkable, 0 console
warnings, exit 0.
