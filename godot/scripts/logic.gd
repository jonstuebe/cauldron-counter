class_name Logic
extends RefCounted
## Pure game rules, ported 1:1 from src/logic.js. No scene access, so the
## headless test (tests/test_logic.gd) can check them against the JS behaviour.
##
## Ingredients are Dictionaries with the same keys as the JS objects:
## id, name, op ("+", "−", "×", "÷"), v, color, glyph, day, err (divisors only).

const INGS: Array[Dictionary] = [
	{id = "dew", name = "Dewdrop", op = "+", v = 1, color = "#7fc8e8", glyph = "drop", day = 1},
	{id = "bone", name = "Bone dust", op = "+", v = 4, color = "#d9cfb8", glyph = "bone", day = 1},
	{id = "newt", name = "Newt eye", op = "+", v = 6, color = "#8fd16a", glyph = "eye", day = 1},
	{id = "ember", name = "Ember root", op = "+", v = 10, color = "#f08a4b", glyph = "flame", day = 1},
	{id = "salt", name = "Shadow salt", op = "−", v = 3, color = "#9a8fd0", glyph = "crystal", day = 2},
	{id = "frost", name = "Frost leaf", op = "−", v = 7, color = "#a8e6e0", glyph = "leaf", day = 2},
	{id = "moon", name = "Moonwater", op = "×", v = 2, color = "#cfc8ff", glyph = "moon", day = 5},
	{id = "dragon", name = "Dragon pepper", op = "×", v = 3, color = "#e2504a", glyph = "pepper", day = 7},
	{id = "mist", name = "Mist moss", op = "÷", v = 2, color = "#a6c49f", glyph = "moss", day = 9, err = "Mist moss only halves an even brew."},
	{id = "troll", name = "Troll sweat", op = "−", v = 12, color = "#c9b45a", glyph = "drops", day = 11},
	{id = "star", name = "Starflower", op = "÷", v = 3, color = "#f5e27a", glyph = "star", day = 13, err = "Starflower only works when the strength splits evenly into three."},
	{id = "gold", name = "Goblin gold", op = "+", v = 25, color = "#e3b93f", glyph = "coin", day = 26},
	{id = "wyrm", name = "Wyrm scale", op = "×", v = 4, color = "#4fa38a", glyph = "scale", day = 30},
	{id = "tear", name = "Hag’s tear", op = "−", v = 20, color = "#9fc3e8", glyph = "tear", day = 34},
	{id = "ash", name = "Phoenix ash", op = "÷", v = 5, color = "#c95b8f", glyph = "feather", day = 38, err = "Phoenix ash only works when the strength divides evenly by five."},
	{id = "quick", name = "Quicksilver", op = "÷", v = 4, color = "#c8ccd4", glyph = "blob", day = 42, err = "Quicksilver only works when the strength divides evenly by four."},
]

const PER_DAY := 5
const MAX_ING := 6
const LAST_DAY := 50
const TIMER_DAY := 3
const FADE_DAY := 46
const BONUS_WINDOW := 36
## [from day, lowest target, highest target, fewest steps, most steps]
const TIERS := [[1,7,30,2,4],[2,5,38,2,4],[4,10,50,3,4],[5,18,80,3,5],[7,20,99,3,5],[9,30,140,3,5],[11,30,160,4,5],[13,40,200,4,5],[16,60,260,4,6],[20,80,360,4,6],[23,100,450,5,6],[26,100,450,4,6],[30,120,520,5,6],[34,150,600,5,6],[38,150,650,5,6],[42,200,700,5,6],[46,150,600,4,6],[48,250,800,5,6]]
## 30s on the first timed day, 5s less each day after, never below 10s.
const TIMER_START := 30
const TIMER_STEP := 5
const TIMER_FLOOR := 10
const BROTH := Color("#2b2535")


static func ing(id: String) -> Dictionary:
	for g in INGS:
		if g.id == id:
			return g
	return {}


## rng is a Callable returning a float in [0, 1), like Math.random.
static func rand(a: int, b: int, rng: Callable = Callable()) -> int:
	var r: float = rng.call() if rng.is_valid() else randf()
	return a + int(floor(r * (b - a + 1)))


static func shuffle(a: Array, rng: Callable = Callable()) -> Array:
	a = a.duplicate()
	for i in range(a.size() - 1, 0, -1):
		var j := rand(0, i, rng)
		var t = a[i]
		a[i] = a[j]
		a[j] = t
	return a


static func patience_for(d: int) -> int:
	return 0 if d < TIMER_DAY else maxi(TIMER_FLOOR, TIMER_START - TIMER_STEP * (d - TIMER_DAY))


static func day_cfg(d: int) -> Dictionary:
	var ings: Array[Dictionary] = []
	for g in INGS:
		if g.day <= d:
			ings.append(g)
	var tier: Array = TIERS[0]
	for t in TIERS:
		if t[0] <= d:
			tier = t
	var patience := patience_for(d)
	return {ings = ings, lo = tier[1], hi = tier[2], minD = tier[3], maxD = tier[4], patience = patience, timed = patience > 0}


static func untimed_bonus(el: float) -> int:
	return maxi(0, 6 - int(floor(el / 6.0)))


## Returns {v = new strength} or {err = message}.
static func apply(v: int, g: Dictionary) -> Dictionary:
	match g.op:
		"+":
			return {v = v + g.v}
		"−":
			var r: int = v - g.v
			return {err = "Too weak for %s. Strength can’t drop below zero." % g.name} if r < 0 else {v = r}
		"×":
			var r: int = v * g.v
			return {err = "The cauldron can’t hold a brew that strong."} if r > 999 else {v = r}
		"÷":
			return {err = g.err} if v % g.v != 0 else {v = v / g.v}
	return {err = "Unknown ingredient."}


## Breadth-first map of strength -> fewest ingredients, in discovery order
## (GDScript Dictionaries keep insertion order, like the JS Map).
static func solve_map(ings: Array, max_d: int) -> Dictionary:
	var dist := {0: 0}
	var fr: Array[int] = [0]
	for d in range(1, max_d + 1):
		var nx: Array[int] = []
		for v in fr:
			for g in ings:
				var r := apply(v, g)
				if r.has("err") or r.v > 800:
					continue
				if not dist.has(r.v):
					dist[r.v] = d
					nx.append(r.v)
		fr = nx
	return dist


## Five distinct orders for day d: [{t = target, par = fewest ingredients}].
static func gen_orders(d: int, rng: Callable = Callable()) -> Array[Dictionary]:
	var c := day_cfg(d)
	var dist := solve_map(c.ings, c.maxD)
	var cands: Array = []
	for t in dist:
		var m: int = dist[t]
		if t >= c.lo and t <= c.hi and m >= c.minD:
			cands.append([t, m])
	if cands.size() < PER_DAY:
		cands.clear()
		for t in dist:
			if t >= c.lo and dist[t] >= 2:
				cands.append([t, dist[t]])
	var out: Array[Dictionary] = []
	for pair in shuffle(cands, rng).slice(0, PER_DAY):
		out.append({t = pair[0], par = pair[1]})
	return out


## Integer channel average of the brew colours (same truncation as the JS),
## or an empty array for an empty cauldron.
static func mix_rgb(brew: Array) -> Array[int]:
	if brew.is_empty():
		return []
	var r := 0
	var gr := 0
	var b := 0
	for x in brew:
		var n: int = String(x.color).substr(1).hex_to_int()
		r += n >> 16 & 255
		gr += n >> 8 & 255
		b += n & 255
	var k := brew.size()
	return [r / k, gr / k, b / k]


static func mix_color(brew: Array) -> Color:
	var m := mix_rgb(brew)
	if m.is_empty():
		return BROTH
	return Color8(m[0], m[1], m[2])


## Shortest ingredient sequence from `from` to `target`, or [] if none within max_d.
## Not in logic.js; used by the demo/capture autoplay.
static func solve_path(ings: Array, from: int, target: int, max_d: int) -> Array:
	var prev := {from: null}
	var fr: Array[int] = [from]
	for d in range(max_d):
		var nx: Array[int] = []
		for v in fr:
			for i in ings.size():
				var r := apply(v, ings[i])
				if r.has("err") or r.v > 999 or prev.has(r.v):
					continue
				prev[r.v] = [v, i]
				if r.v == target:
					var path: Array = []
					var cur: int = target
					while prev[cur] != null:
						path.push_front(prev[cur][1])
						cur = prev[cur][0]
					return path
				nx.append(r.v)
		fr = nx
	return []
