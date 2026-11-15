class_name CauldronView
extends Control
## The cauldron: layered art on a rig in SVG units (the web game's viewBox
## 0 0 260 230; the art canvas is the same at 2x), a shader liquid surface,
## particles (steam, splash droplets, ready sparks, failure smoke), an
## AnimationPlayer driving the fire glow, and the strength plate with a
## count-up number. Works with the art stack (art/cauldron) or the generated
## placeholders.

const CANVAS := Vector2(260, 230)
const FEET_Y := 216.0           # floor contact of the feet (432 on the art canvas)

var LIQ_C := Vector2(130, 78)
var LIQ_R := Vector2(94, 13)
var k := 1.0                    # px per SVG unit
var fixed_k := 0.0              # >0: use this scale instead of fitting the rect
var feet_global := Vector2.INF  # when set, stand the feet here instead of centring
var rig: Node2D
var liquid: ColorRect
var plate: Control
var plate_tex: TextureRect
var plate_lbl: Label
var plate_num: Label
var steam: GPUParticles2D
var sparks: GPUParticles2D
var shown_value := 0
var ready_state := false
var _art := false
var _liq_mat: ShaderMaterial
var _count_tw: Tween
var _color_tw: Tween
var _anim: AnimationPlayer
var _glow: Sprite2D
var _reflect: Sprite2D
var _flame_mats: Array[ShaderMaterial] = []
var _plate_box: StyleBoxFlat
var _sheen: ShaderMaterial


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	_art = Assets.art()
	if _art:
		LIQ_C = Vector2(130, 78.5)
		LIQ_R = Vector2(96.5, 14.25)
	rig = Node2D.new()
	add_child(rig)
	var add_layer := func(key: String, additive := false) -> Sprite2D:
		var t := Assets.tex(key)
		if t == null:
			return null
		var s := _canvas_sprite(t, Vector2.ZERO)
		if additive:
			var m := CanvasItemMaterial.new()
			m.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
			s.material = m
		rig.add_child(s)
		return s

	var fire_glow: Sprite2D = null
	if Assets.has("fire/fire_glow"):
		fire_glow = Sprite2D.new()
		fire_glow.texture = Assets.tex("fire/fire_glow")
		fire_glow.scale = Vector2.ONE * 0.5
		fire_glow.position = Vector2(130, 200)
		var gm := CanvasItemMaterial.new()
		gm.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
		fire_glow.material = gm
		fire_glow.name = "FireGlow"
		rig.add_child(fire_glow)
	_glow = add_layer.call("cauldron/cauldron_glow", true)
	if _glow:
		_glow.scale *= 1.15
		_glow.position = Vector2(130, 115) - CANVAS * 0.5 * 1.15 + Vector2(0, -15)
		_glow.modulate = Color(UI.GLOW, 0.4)
	_build_fire()
	add_layer.call("cauldron_back")
	_reflect = add_layer.call("cauldron/cauldron_reflect")
	if _reflect:
		_reflect.modulate = Color(UI.BROTH.lightened(0.3), 0.8)

	# liquid surface (shader), then fixed highlights
	liquid = ColorRect.new()
	var half := LIQ_R / 0.92
	liquid.position = LIQ_C - half
	liquid.size = half * 2
	liquid.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_liq_mat = ShaderMaterial.new()
	_liq_mat.shader = load("res://shaders/liquid.gdshader")
	for kv in [["liquid_color", UI.BROTH], ["energy", 0.0], ["ready", 0.0], ["ripple", 10.0], ["wobble", 1.0], ["aspect", half.x / half.y]]:
		_liq_mat.set_shader_parameter(kv[0], kv[1])
	liquid.material = _liq_mat
	rig.add_child(liquid)
	add_layer.call("cauldron/cauldron_liquid_shine")

	# steam rising off the brew (the web game's .vapor circles)
	var steam_tex := "particles/steam_puff" if Assets.has("particles/steam_puff") else "spark"
	steam = Particles.make({tex = steam_tex, amount = 12, lifetime = 3.0, box = Vector2(55, 3), dir = Vector2(0, -1), spread = 12.0,
		vel = Vector2(12, 22), gravity = Vector2(0, -5), scale = Vector2(0.12, 0.22) if _art else Vector2(0.25, 0.5), grow = 2.4, alpha = 0.4, preprocess = 3.0})
	steam.position = LIQ_C + Vector2(0, -8)
	steam.modulate = UI.MUTED
	rig.add_child(steam)
	sparks = Particles.make({amount = 12, lifetime = 1.4, box = Vector2(60, 4), dir = Vector2(0, -1), spread = 20.0,
		vel = Vector2(20, 40), gravity = Vector2(0, -8), scale = Vector2(0.06, 0.12) if _art else Vector2(0.12, 0.22), alpha = 1.0})
	sparks.position = LIQ_C + Vector2(0, -4)
	sparks.modulate = UI.BRASS_HI
	sparks.emitting = false
	rig.add_child(sparks)
	add_layer.call("cauldron/cauldron_rim")
	if Assets.has("fire/logs"):
		var logs := Sprite2D.new()
		logs.texture = Assets.tex("fire/logs")
		logs.centered = false
		logs.scale = Vector2.ONE * 0.5
		logs.position = Vector2(60, 202)
		rig.add_child(logs)

	# strength plate (kept out of the scaled rig so its text stays crisp)
	plate = Control.new()
	plate.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(plate)
	if Assets.has("ui/strength_badge"):
		plate_tex = TextureRect.new()
		plate_tex.texture = Assets.tex("ui/strength_badge")
		plate_tex.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		plate_tex.stretch_mode = TextureRect.STRETCH_SCALE
		plate_tex.set_anchors_and_offsets_preset(PRESET_FULL_RECT)
		var sheen_shader := Assets.shader("sheen")
		if sheen_shader:
			_sheen = ShaderMaterial.new()
			_sheen.shader = sheen_shader
			_sheen.set_shader_parameter("active", 0.0)
			plate_tex.material = _sheen
		plate.add_child(plate_tex)
	else:
		var p := Panel.new()
		p.set_anchors_and_offsets_preset(PRESET_FULL_RECT)
		_plate_box = UI.box(UI.BRASS, 12, Vector4.ZERO)
		p.add_theme_stylebox_override("panel", _plate_box)
		plate.add_child(p)
	plate_lbl = UI.label("STRENGTH" if _art else "strength", UI.extrabold if _art else UI.body, 11, UI.PLATE_INK)
	plate_lbl.modulate.a = 0.8
	plate_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	plate_lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	plate.add_child(plate_lbl)
	plate_num = UI.label("0", UI.legible_black, 34, UI.INK_DARK if _art else UI.PLATE_INK)
	plate_num.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	plate_num.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	plate.add_child(plate_num)
	_build_animations(fire_glow)
	resized.connect(_layout)
	Settings.reduced_motion_changed.connect(_apply_motion)
	_apply_motion(Settings.reduced_motion)
	_layout()


func _canvas_sprite(tex: Texture2D, pos: Vector2) -> Sprite2D:
	var s := Sprite2D.new()
	s.texture = tex
	s.centered = false
	s.position = pos
	s.scale = Vector2.ONE * (CANVAS.x / tex.get_width())
	return s


func _build_fire() -> void:
	var fire := Node2D.new()
	fire.name = "Fire"
	rig.add_child(fire)
	var flicker := Assets.shader("flame_flicker")
	if _art:
		# Separate 80x120 flame sprites, pivot bottom centre, at the art anchors.
		var bases := [Vector2(89, 226), Vector2(131, 226), Vector2(172, 226)]
		var scales := [1.05, 1.3, 1.1]
		for i in 3:
			var pivot := Node2D.new()
			pivot.name = "Flame%d" % i
			pivot.position = bases[i]
			pivot.scale = Vector2.ONE * scales[i]
			fire.add_child(pivot)
			var s := Sprite2D.new()
			s.texture = Assets.tex("flame/%d" % i)
			s.centered = false
			s.scale = Vector2.ONE * 0.5
			s.position = -Vector2(40, 116) * 0.5
			if flicker:
				var m := ShaderMaterial.new()
				m.shader = flicker
				m.set_shader_parameter("phase", i * 1.7)
				s.material = m
				_flame_mats.append(m)
			pivot.add_child(s)
	else:
		var bases := [Vector2(104, 222), Vector2(131, 224), Vector2(162, 222)]
		for i in 3:
			var pivot := Node2D.new()
			pivot.name = "Flame%d" % i
			pivot.position = bases[i]
			fire.add_child(pivot)
			pivot.add_child(_canvas_sprite(Assets.tex("flame/%d" % i), -bases[i]))


## AnimationPlayer: placeholder flames breathe (scale/skew); with the art the
## flame shader does that, and the player flickers the fire glow instead.
func _build_animations(fire_glow: Sprite2D) -> void:
	_anim = AnimationPlayer.new()
	rig.add_child(_anim)
	_anim.root_node = NodePath("..")
	var lib := AnimationLibrary.new()
	var a := Animation.new()
	a.length = 1.2
	a.loop_mode = Animation.LOOP_PINGPONG
	if _flame_mats.is_empty():
		var periods := [0.55, 0.45, 0.65]
		for i in 3:
			var tr := a.add_track(Animation.TYPE_VALUE)
			a.track_set_path(tr, NodePath("Fire/Flame%d:scale" % i))
			a.track_set_interpolation_type(tr, Animation.INTERPOLATION_CUBIC)
			a.track_insert_key(tr, 0.0, Vector2(1.0, 0.85))
			a.track_insert_key(tr, periods[i], Vector2(0.95, 1.12))
			a.track_insert_key(tr, 1.2, Vector2(1.03, 0.9))
			var sk := a.add_track(Animation.TYPE_VALUE)
			a.track_set_path(sk, NodePath("Fire/Flame%d:skew" % i))
			a.track_insert_key(sk, 0.0, deg_to_rad(-3.0))
			a.track_insert_key(sk, 1.2, deg_to_rad(3.0))
	if fire_glow:
		var tr := a.add_track(Animation.TYPE_VALUE)
		a.track_set_path(tr, NodePath("FireGlow:modulate:a"))
		a.track_set_interpolation_type(tr, Animation.INTERPOLATION_CUBIC)
		for kv in [[0.0, 0.75], [0.3, 0.95], [0.55, 0.8], [0.9, 1.0], [1.2, 0.7]]:
			a.track_insert_key(tr, kv[0], kv[1])
	lib.add_animation("flicker", a)
	_anim.add_animation_library("", lib)
	_anim.play("flicker")


func _layout() -> void:
	if fixed_k > 0.0:
		k = fixed_k
	else:
		k = clampf(minf(size.x / (CANVAS.x + 20), size.y / (CANVAS.y + 10)), 0.6, 2.6)
	rig.scale = Vector2.ONE * k
	if feet_global != Vector2.INF:
		rig.position = (feet_global - global_position) - Vector2(130, FEET_Y) * k
	else:
		rig.position = (size - CANVAS * k) / 2
	var pr := Rect2(Vector2(82, 100), Vector2(96, 66)) if plate_tex else Rect2(Vector2(88, 108), Vector2(84, 54))
	plate.size = pr.size * k
	plate.position = rig.position + pr.position * k
	plate.pivot_offset = plate.size / 2
	plate_lbl.add_theme_font_size_override("font_size", roundi((7.5 if plate_tex else 11.0) * k))
	plate_num.add_theme_font_size_override("font_size", roundi((30.0 if plate_tex else 34.0) * k))
	if plate_tex:
		# label centred at y 30/132 and number at 76/132 of the badge
		plate_lbl.size = Vector2(plate.size.x, 14 * k)
		plate_lbl.position = Vector2(0, plate.size.y * 30 / 132.0 - 7 * k)
		plate_num.size = Vector2(plate.size.x, 36 * k)
		plate_num.position = Vector2(0, plate.size.y * 77 / 132.0 - 18 * k)
	else:
		plate_lbl.size = Vector2(plate.size.x, 16 * k)
		plate_lbl.position = Vector2(0, 2 * k)
		plate_num.size = Vector2(plate.size.x, 40 * k)
		plate_num.position = Vector2(0, 14 * k)
		_plate_box.set_corner_radius_all(roundi(12 * k))


## Stand the cauldron's feet on a canvas point (the hearth slab) at scale `scale_k`.
func place(feet: Vector2, scale_k: float) -> void:
	feet_global = feet
	fixed_k = scale_k
	_layout()
	# labels only shrink to a new font size after their theme cache updates
	_layout.call_deferred()


func unplace() -> void:
	feet_global = Vector2.INF
	fixed_k = 0.0
	_layout()


func _apply_motion(reduced: bool) -> void:
	# style.css hides .vapor and .sparks under prefers-reduced-motion
	steam.visible = not reduced
	sparks.visible = not reduced
	_liq_mat.set_shader_parameter("wobble", 0.0 if reduced else 1.0)
	for m in _flame_mats:
		m.set_shader_parameter("speed", 0.0 if reduced else 6.0)
	if reduced:
		_anim.pause()
	else:
		_anim.play("flicker")


## Tween a shader uniform via set_shader_parameter (works even when the
## renderer exposes no uniform list, e.g. headless).
func _param(tw: Tween, uniform: String, to: Variant, dur: float, mat: ShaderMaterial = null) -> void:
	if mat == null:
		mat = _liq_mat
	var from: Variant = mat.get_shader_parameter(uniform)
	if from == null or typeof(from) != typeof(to):
		from = to
	tw.tween_method(func(x): mat.set_shader_parameter(uniform, x), from, to, dur)


## SVG-space point -> canvas (global) position.
func at(p: Vector2) -> Vector2:
	return rig.get_global_transform() * p


func pot_size() -> Vector2:
	return CANVAS * k


## Update colour, energy and the number. `target` is the current order (or -1).
func show_brew(brew: Array, value: int, target: int, is_ready: bool) -> void:
	var col := Logic.mix_color(brew)
	var energy := 0.0
	if not brew.is_empty() and target > 0:
		energy = clampf(1.0 - absf(value - target) / float(maxi(target, 1)), 0.0, 1.0)
	_set_ready(is_ready)
	show_color(col, energy, not brew.is_empty())
	_count_to(value)


## Liquid colour + glow; used by show_brew and by the preloader.
func show_color(col: Color, energy: float, filled := true, dur := -1.0) -> void:
	if dur < 0.0:
		dur = 0.0 if Settings.reduced_motion else 0.45
	if _color_tw:
		_color_tw.kill()
	_color_tw = create_tween().set_parallel()
	_param(_color_tw, "liquid_color", col, dur)
	_param(_color_tw, "energy", energy, dur)
	var light := col.lightened(0.25) if filled else UI.MUTED
	_color_tw.tween_property(steam, "modulate", light, dur)
	if _glow:
		_color_tw.tween_property(_glow, "modulate", Color(col if filled else UI.GLOW, 0.75 if ready_state else 0.35 + 0.25 * energy), dur)
	if _reflect:
		_color_tw.tween_property(_reflect, "modulate", Color(col.lightened(0.15) if filled else UI.BROTH.lightened(0.3), 0.8), dur)


## Set the plate number directly (preloader percentage).
func set_number(v: int) -> void:
	shown_value = v
	plate_num.text = str(v)


func _count_to(v: int) -> void:
	if _count_tw:
		_count_tw.kill()
	if Settings.reduced_motion or v == shown_value:
		set_number(v)
		return
	var from := shown_value
	_count_tw = create_tween()
	_count_tw.tween_method(func(x: float):
		shown_value = roundi(x)
		plate_num.text = str(shown_value), float(from), float(v), clampf(0.12 + absf(v - from) * 0.004, 0.15, 0.4)).set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_CUBIC)


func _set_ready(on: bool) -> void:
	if on == ready_state:
		return
	ready_state = on
	sparks.emitting = on and not Settings.reduced_motion
	if plate_tex:
		plate_tex.texture = Assets.tex("ui/strength_badge_ready" if on else "ui/strength_badge")
		if _sheen:
			_sheen.set_shader_parameter("active", 1.0 if on else 0.0)
	else:
		_plate_box.bg_color = UI.BRASS_HI if on else UI.BRASS
	for m in _flame_mats:
		m.set_shader_parameter("heat", 1.0 if on else 0.0)
	var tw := create_tween()
	_param(tw, "ready", 1.0 if on else 0.0, 0.0 if Settings.reduced_motion else 0.3)


## .plate.pop
func bump() -> void:
	if Settings.reduced_motion:
		return
	var tw := create_tween()
	tw.tween_property(plate, "scale", Vector2(0.85, 0.85), 0.06)
	tw.tween_property(plate, "scale", Vector2(1.08, 1.08), 0.12).set_ease(Tween.EASE_OUT)
	tw.tween_property(plate, "scale", Vector2.ONE, 0.12)


## Ingredient lands: ripple ring in the shader + coloured droplets.
func splash(color: Color) -> void:
	_liq_mat.set_shader_parameter("ripple", 0.0)
	if Settings.reduced_motion:
		_liq_mat.set_shader_parameter("ripple", 10.0)
		return
	_param(create_tween(), "ripple", 1.0, 0.6)
	var p := Particles.burst({tex = "particles/droplet" if Assets.has("particles/droplet") else "spark", amount = 14, lifetime = 0.55, box = Vector2(14, 2), dir = Vector2(0, -1), spread = 55.0,
		vel = Vector2(50, 110), gravity = Vector2(0, 320), scale = Vector2(0.18, 0.3) if _art else Vector2(0.14, 0.28), alpha = 1.0})
	p.position = LIQ_C
	p.modulate = color.lightened(0.15)
	rig.add_child(p)
	# a quick squash about the feet sells the impact
	var feet := rig.position + Vector2(130, FEET_Y) * k
	var squash := func(x: float):
		rig.scale = Vector2(k * (1.0 + 0.025 * x), k * (1.0 - 0.025 * x))
		rig.position = feet - Vector2(130, FEET_Y) * rig.scale
	var tw := create_tween()
	tw.tween_method(squash, 0.0, 1.0, 0.07)
	tw.tween_method(squash, 1.0, 0.0, 0.16).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)


## Wrong potion served: grey smoke and a rattle.
func fizzle() -> void:
	if Settings.reduced_motion:
		return
	var p := Particles.burst({tex = "particles/smoke" if Assets.has("particles/smoke") else "spark", amount = 16, lifetime = 1.1, box = Vector2(60, 4), dir = Vector2(0, -1), spread = 25.0,
		vel = Vector2(25, 60), gravity = Vector2(0, -20), scale = Vector2(0.18, 0.35) if _art else Vector2(0.4, 0.8), grow = 1.8, alpha = 0.8})
	p.position = LIQ_C
	p.modulate = Color(1, 1, 1) if _art else Color("#6d6478")
	rig.add_child(p)
	var base := rig.position
	var tw := create_tween()
	for dx in [-7.0, 6.0, -4.0, 3.0, 0.0]:
		tw.tween_property(rig, "position", base + Vector2(dx, 0), 0.05)


## Success: golden sparkles burst up out of the pot.
func celebrate() -> void:
	if Settings.reduced_motion:
		return
	var p := Particles.burst({amount = 36, lifetime = 0.9, box = Vector2(40, 4), dir = Vector2(0, -1), spread = 70.0,
		vel = Vector2(90, 200), gravity = Vector2(0, 160), scale = Vector2(0.08, 0.18) if _art else Vector2(0.15, 0.35), alpha = 1.0, hue = true})
	p.position = LIQ_C
	rig.add_child(p)
