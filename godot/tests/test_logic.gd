extends SceneTree
## Headless port of test/logic.test.js. Run:
##   godot --headless --path godot -s tests/test_logic.gd
## Exits 0 when every assertion passes, 1 otherwise.

var passed := 0
var failed := 0
var _case := ""


func _init() -> void:
	_run()
	print("\n%d passed, %d failed" % [passed, failed])
	quit(1 if failed > 0 else 0)


func check(cond: bool, what: String) -> void:
	if cond:
		passed += 1
	else:
		failed += 1
		printerr("FAIL [%s] %s" % [_case, what])


func eq(a, b, what: String) -> void:
	check(a == b, "%s: expected %s, got %s" % [what, str(b), str(a)])


func it(name: String) -> void:
	_case = name
	print("  - ", name)


# Tiny seeded PRNG (mulberry32) emulating JS 32-bit integer maths, so order
# generation is reproducible exactly as in the Vitest suite.
static func _imul(a: int, b: int) -> int:
	a &= 0xFFFFFFFF
	b &= 0xFFFFFFFF
	var lo := (a & 0xFFFF) * b
	var hi := ((a >> 16) * b) & 0xFFFF
	return (lo + (hi << 16)) & 0xFFFFFFFF


static func _i32(x: int) -> int:
	x &= 0xFFFFFFFF
	return x - 0x100000000 if x >= 0x80000000 else x


func seeded(seed: int) -> Callable:
	var st := [seed]
	return func() -> float:
		var s := _i32(st[0])
		s = _i32(s + 0x6d2b79f5)
		st[0] = s
		var u := s & 0xFFFFFFFF
		var t := _imul(u ^ (u >> 15), 1 | u)
		t = ((t + _imul(t ^ (t >> 7), 61 | t)) & 0xFFFFFFFF) ^ t
		return float((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296.0


# Independent brute force: fewest ingredients from 0 to target, or -1 (Infinity).
func fewest_steps(ings: Array, target: int, max_d: int) -> int:
	if target == 0:
		return 0
	var frontier := {0: true}
	for d in range(1, max_d + 1):
		var next := {}
		for v in frontier:
			for g in ings:
				var r := Logic.apply(v, g)
				if r.has("err"):
					continue
				if r.v == target:
					return d
				next[r.v] = true
		frontier = next
	return -1


func ids(ings: Array) -> Array:
	return ings.map(func(g): return g.id)


func _run() -> void:
	var ing := Logic.ing
	print("apply")
	it("adds")
	eq(Logic.apply(3, ing.call("ember")), {v = 13}, "3 + ember")
	it("subtracts but never below zero")
	eq(Logic.apply(10, ing.call("frost")), {v = 3}, "10 - frost")
	eq(Logic.apply(3, ing.call("salt")), {v = 0}, "3 - salt")
	check(String(Logic.apply(2, ing.call("salt")).get("err", "")).contains("below zero"), "2 - salt errors 'below zero'")
	it("multiplies up to the cauldron limit")
	eq(Logic.apply(21, ing.call("dragon")), {v = 63}, "21 x dragon")
	check(String(Logic.apply(500, ing.call("moon")).get("err", "")).contains("can’t hold"), "500 x moon errors 'can’t hold'")
	it("divides only evenly, with the ingredient’s own message")
	eq(Logic.apply(27, ing.call("star")), {v = 9}, "27 / star")
	eq(Logic.apply(28, ing.call("star")).get("err"), ing.call("star").err, "28 / star message")
	eq(Logic.apply(7, ing.call("mist")).get("err"), ing.call("mist").err, "7 / mist message")
	it("every ingredient has a known op, and divisors carry an error message")
	for g in Logic.INGS:
		check(["+", "−", "×", "÷"].has(g.op), "%s has known op" % g.id)
		if g.op == "÷":
			check(String(g.get("err", "")) != "", "%s has err" % g.id)

	print("patienceFor")
	it("is untimed before the timer day")
	eq(Logic.patience_for(1), 0, "day 1")
	eq(Logic.patience_for(Logic.TIMER_DAY - 1), 0, "day before timer")
	it("starts at 30s and drops 5s a day to the floor")
	eq(Logic.patience_for(Logic.TIMER_DAY), 30, "timer day")
	eq(Logic.patience_for(Logic.TIMER_DAY + 1), 25, "timer day + 1")
	eq(Logic.patience_for(Logic.LAST_DAY), Logic.TIMER_FLOOR, "last day")

	print("untimedBonus")
	it("starts at 6 and loses one every 6 seconds")
	eq(Logic.untimed_bonus(0), 6, "0s")
	eq(Logic.untimed_bonus(6), 5, "6s")
	eq(Logic.untimed_bonus(36), 0, "36s")
	eq(Logic.untimed_bonus(1000), 0, "1000s")

	print("dayCfg")
	it("unlocks ingredients on their day")
	eq(ids(Logic.day_cfg(1).ings), ["dew", "bone", "newt", "ember"], "day 1 ingredients")
	check(ids(Logic.day_cfg(5).ings).has("moon"), "day 5 has moon")
	eq(Logic.day_cfg(Logic.LAST_DAY).ings.size(), Logic.INGS.size(), "last day has all")
	it("keeps step ranges within the cauldron size")
	for d in range(1, Logic.LAST_DAY + 1):
		var c := Logic.day_cfg(d)
		check(c.minD <= c.maxD, "day %d minD<=maxD" % d)
		check(c.maxD <= Logic.MAX_ING, "day %d maxD<=MAX_ING" % d)
		eq(c.timed, d >= Logic.TIMER_DAY, "day %d timed" % d)

	print("solveMap")
	it("finds shortest paths")
	var dist := Logic.solve_map([ing.call("dew"), ing.call("ember")], 3)
	eq(dist.get(0), 0, "0")
	eq(dist.get(10), 1, "10")
	eq(dist.get(11), 2, "11")
	eq(dist.get(30), 3, "30")
	check(not dist.has(31), "31 unreachable")

	print("genOrders")
	for d in range(1, Logic.LAST_DAY + 1):
		it("day %d: %d distinct, solvable orders with an honest par" % [d, Logic.PER_DAY])
		var c := Logic.day_cfg(d)
		for seed in [1, 42, 1337]:
			var orders := Logic.gen_orders(d, seeded(seed * 100 + d))
			eq(orders.size(), Logic.PER_DAY, "seed %d count" % seed)
			var ts := {}
			for o in orders:
				ts[o.t] = true
			eq(ts.size(), Logic.PER_DAY, "seed %d distinct" % seed)
			for o in orders:
				check(o.par >= 2, "par %d >= 2" % o.par)
				check(o.par <= Logic.MAX_ING, "par %d <= MAX_ING" % o.par)
				# par is the true minimum, so the master's tip is always achievable
				eq(fewest_steps(c.ings, o.t, o.par), o.par, "target %d honest par" % o.t)

	print("shuffle")
	it("keeps every element and does not mutate")
	var a := [1, 2, 3, 4, 5]
	var s := Logic.shuffle(a, seeded(7))
	eq(a, [1, 2, 3, 4, 5], "input untouched")
	var sorted := s.duplicate()
	sorted.sort()
	eq(sorted, a, "same elements")

	print("mixColor")
	it("uses broth for an empty cauldron")
	eq(Logic.mix_rgb([]), [], "empty mix")
	eq(Logic.mix_color([]), Logic.BROTH, "empty is broth")
	it("averages ingredient colours")
	eq(Logic.mix_rgb([{color = "#ff0000"}, {color = "#0000ff"}]), [127, 0, 127], "rgb(127,0,127)")

	print("mulberry32 parity with JS")
	it("first values of seeded(7) match Vitest's PRNG")
	# Reference values from: node -e "<mulberry32 from test/logic.test.js>(7)()"
	var r := seeded(7)
	var got := [r.call(), r.call(), r.call()]
	for i in JS_SEED7.size():
		check(absf(got[i] - JS_SEED7[i]) < 1e-12, "value %d: %f vs %f" % [i, got[i], JS_SEED7[i]])

	it("genOrders with the same seed produces the same orders as logic.js")
	for d in JS_ORDERS:
		var got_orders := Logic.gen_orders(d, seeded(4200 + d)).map(func(o): return [o.t, o.par])
		eq(got_orders, JS_ORDERS[d], "day %d orders" % d)

	print("solve_path (port helper)")
	it("reaches every generated order within par")
	for d in [1, 9, 30, 50]:
		var c := Logic.day_cfg(d)
		for o in Logic.gen_orders(d, seeded(d)):
			var path := Logic.solve_path(c.ings, 0, o.t, Logic.MAX_ING)
			var v := 0
			for i in path:
				v = Logic.apply(v, c.ings[i]).v
			eq(v, o.t, "day %d path reaches %d" % [d, o.t])
			check(path.size() <= o.par, "day %d path within par" % d)


## Reference outputs captured from the JS implementation (node, src/logic.js).
const JS_SEED7 := [0.011704753153026104, 0.06195825757458806, 0.97690763277933]
## genOrders(d, seeded(4200 + d)) -> [[t, par], ...]
const JS_ORDERS := {
	1: [[12,2],[19,4],[9,3],[15,3],[20,2]],
	5: [[62,5],[49,5],[58,5],[33,4],[50,4]],
	13: [[73,5],[132,5],[55,4],[137,5],[51,4]],
	30: [[364,5],[262,5],[317,5],[494,6],[436,5]],
	50: [[471,5],[741,6],[386,5],[381,5],[418,5]],
}
