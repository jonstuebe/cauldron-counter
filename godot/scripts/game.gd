extends Control
## The shop. Port of src/main.js: state, customer flow, scoring, input and all
## the animation (pours, flasks, coins, cards, toasts). Rules live in Logic.

signal pour_idle
signal _skip

const BASE_RATE := 1.6     # web pours play at 1.6x
const FAST_RATE := 3.5     # ...and 3.5x when taps queue up
## Secondary text on panels/over the room: lilac lifted for contrast
## (#c4bcd6 is 7.6:1 on the panel colour, 6.2:1 on panel-hi).
const SOFT := Color("#c4bcd6")

# --- state (S in main.js) ---
var day := 1
var gen := 0
var serving := false
var coins := 0
var queue: Array = []
var cur = null              # {t, par, c (index), line, max, timed}
var brew: Array = []
var value := 0
var t := 0.0
var el := 0.0
var paused := true
var today := {served = 0, perfect = 0, left = 0, coins = 0}

# --- pour pipeline ---
var _pours: Array = []
var _pouring := false
var _pending := 0
var _skip_all := false
var _live: Array[Tween] = []
var _skip_armed := false
var _note_token := 0
var _react_token := 0
var _bob_t := 0.0

# --- nodes ---
var body: BoxContainer
var left: VBoxContainer
var right: VBoxContainer
var shelf: GridContainer
var cauldron: CauldronView
var fx: Control
var day_l: Label
var coins_l: Label
var coin_icon: TextureRect
var coins_box: Control
var dots: QueueDots
var motion_btn: Button
var install_btn: Button
var portrait_holder: Control
var face: Panel
var face_tex: TextureRect
var who_l: Label
var says_l: Label
var ticket: Control
var target_l: Label
var patience: PatienceBar
var clock_l: Label
var count_l: Label
var par_l: Label
var chips: HFlowContainer
var note_l: Label
var undo_b: Button
var empty_b: Button
var serve_b: Button
var overlay: Control
var card_center: CenterContainer
var card: PanelContainer
var card_btn: Button
var _chip_count := 0
var backdrop: Backdrop
var shelf_panel: PanelContainer
var _art := false

# --- layout parts (moved between the landscape and portrait trees) ---
var _margin: MarginContainer
var _hdr: HBoxContainer
var _counter_row: HBoxContainer
var _who_row: HBoxContainer
var _patience_row: HBoxContainer
var _recipe: VBoxContainer
var _actions_row: HBoxContainer
var _portrait := false
var _home: Array = []          # [node, landscape parent, index]
var p_root: VBoxContainer
var p_top: MarginContainer
var p_top_v: VBoxContainer
var p_header: HBoxContainer
var p_title: Label
var p_day: PanelContainer
var p_coins: PanelContainer
var p_stage: Control
var p_sheet: PanelContainer
var p_sheet_box: StyleBoxFlat
var p_sheet_v: VBoxContainer
var _card_parts := {}


func _ready() -> void:
	set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	theme = UI.make_theme()
	_build()
	resized.connect(_on_resized)
	Settings.reduced_motion_changed.connect(func(_on): _update_motion_btn())
	Screen.changed.connect(_apply_layout)
	_on_resized()
	_apply_layout()
	_render_brew()
	_start_day()
	print("Cauldron Counter: shop ready")


# ======================================================================
# Building the UI
# ======================================================================

func _build() -> void:
	_art = Assets.art()
	if Backdrop.available():
		backdrop = Backdrop.new()
		add_child(backdrop)
	var margin := MarginContainer.new()
	_margin = margin
	margin.set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	for side in ["left", "right"]:
		margin.add_theme_constant_override("margin_" + side, 28)
	margin.add_theme_constant_override("margin_top", 14)
	margin.add_theme_constant_override("margin_bottom", 18)
	add_child(margin)
	_build_portrait()
	var col := VBoxContainer.new()
	col.add_theme_constant_override("separation", 12)
	margin.add_child(col)
	col.add_child(_build_header())
	body = BoxContainer.new()
	body.size_flags_vertical = SIZE_EXPAND_FILL
	body.add_theme_constant_override("separation", 24)
	col.add_child(body)

	left = VBoxContainer.new()
	left.custom_minimum_size = Vector2(430, 0)
	left.add_theme_constant_override("separation", 12)
	body.add_child(left)
	_counter_row = _build_counter()
	left.add_child(_counter_row)
	# bar, counts and the brew on one solid panel: the room behind is busy
	var stats := PanelContainer.new()
	var ss := UI.box(Color(UI.PANEL, 0.97), 18, Vector4(16, 12, 16, 12))
	ss.border_color = Color("#4a3f6e")
	ss.border_width_top = 2
	stats.add_theme_stylebox_override("panel", ss)
	left.add_child(stats)
	var stats_v := VBoxContainer.new()
	stats_v.add_theme_constant_override("separation", 10)
	stats.add_child(stats_v)
	_patience_row = _build_patience()
	stats_v.add_child(_patience_row)
	var spacer := Control.new()
	spacer.size_flags_vertical = SIZE_EXPAND_FILL
	if not _art:
		left.add_child(spacer)
	_recipe = _build_recipe()
	stats_v.add_child(_recipe)
	# the error note sits under the panel (it reserves its line when empty)
	note_l.reparent(left, false)
	_actions_row = _build_actions()
	left.add_child(_actions_row)
	if _art:
		# art layout (mockup.png): the column hugs the top, the hearth stays clear
		left.add_child(spacer)

	cauldron = CauldronView.new()
	cauldron.size_flags_horizontal = SIZE_EXPAND_FILL
	cauldron.size_flags_vertical = SIZE_EXPAND_FILL
	# with art the pot stands on the hearth (absolute), so its slot can be narrow
	cauldron.custom_minimum_size = Vector2(120 if backdrop else 300, 240)
	cauldron.resized.connect(_place_cauldron.call_deferred)
	body.add_child(cauldron)

	right = VBoxContainer.new()
	right.custom_minimum_size = Vector2(410, 0)
	body.add_child(right)
	if not _art:
		var shelf_title := UI.label("Ingredients", UI.display, 24, UI.MUTED)
		right.add_child(shelf_title)
	shelf_panel = PanelContainer.new()
	shelf_panel.size_flags_vertical = SIZE_SHRINK_BEGIN
	if _art:
		shelf_panel.self_modulate = Color(1, 1, 1, 0.92)
	else:
		shelf_panel.add_theme_stylebox_override("panel", StyleBoxEmpty.new())
	right.add_child(shelf_panel)
	shelf = GridContainer.new()
	shelf.columns = 4
	shelf.add_theme_constant_override("h_separation", 2)
	shelf.add_theme_constant_override("v_separation", 4)
	shelf_panel.add_child(shelf)

	fx = Control.new()
	fx.set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	fx.mouse_filter = MOUSE_FILTER_IGNORE
	add_child(fx)
	_build_overlay()


func _build_header() -> Control:
	var bar := HBoxContainer.new()
	_hdr = bar
	bar.add_theme_constant_override("separation", 22)
	var mark := UI.label("Cauldron Counter", UI.display, 34, UI.INK)
	bar.add_child(mark)
	var sp := Control.new()
	sp.size_flags_horizontal = SIZE_EXPAND_FILL
	bar.add_child(sp)
	day_l = UI.label("Day 1", UI.legible_bold, 20, SOFT)
	day_l.size_flags_vertical = SIZE_SHRINK_CENTER
	bar.add_child(day_l)
	var cb := HBoxContainer.new()
	cb.add_theme_constant_override("separation", 6)
	cb.size_flags_vertical = SIZE_SHRINK_CENTER
	coins_box = cb
	coin_icon = TextureRect.new()
	coin_icon.texture = Assets.tex("coin")
	coin_icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	coin_icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	coin_icon.custom_minimum_size = Vector2(20, 20)
	cb.add_child(coin_icon)
	coins_l = UI.label("0", UI.legible_bold, 22, UI.INK)
	coins_l.custom_minimum_size = Vector2(48, 0)
	cb.add_child(coins_l)
	bar.add_child(cb)
	dots = QueueDots.new()
	dots.size_flags_vertical = SIZE_SHRINK_CENTER
	bar.add_child(dots)
	motion_btn = Button.new()
	motion_btn.theme_type_variation = "Flat"
	motion_btn.add_theme_font_override("font", UI.legible_bold)
	motion_btn.add_theme_font_size_override("font_size", 16)
	motion_btn.add_theme_color_override("font_color", SOFT)
	motion_btn.add_theme_color_override("font_hover_color", UI.INK)
	motion_btn.tooltip_text = "Toggle reduced motion"
	motion_btn.pressed.connect(func(): Settings.set_reduced_motion(not Settings.reduced_motion))
	bar.add_child(motion_btn)
	_update_motion_btn()
	install_btn = _install_button(16)
	bar.add_child(install_btn)
	return bar


## "Install app" (web only, while the page can be installed): reopens the
## install sheet from web/shell.html.
func _install_button(font_size: int) -> Button:
	var b := Button.new()
	b.text = "Install app"
	b.theme_type_variation = "Flat"
	b.focus_mode = FOCUS_NONE
	b.add_theme_font_override("font", UI.legible_bold)
	b.add_theme_font_size_override("font_size", font_size)
	b.add_theme_color_override("font_color", SOFT)
	b.add_theme_color_override("font_hover_color", UI.INK)
	b.tooltip_text = "Add Cauldron Counter to your Home Screen"
	b.pressed.connect(WebInstall.open)
	var sync := func():
		if is_instance_valid(b):
			b.visible = WebInstall.available and (b != install_btn or not Screen.portrait)
	WebInstall.changed.connect(sync)
	Screen.changed.connect(sync)
	sync.call()
	return b


func _update_motion_btn() -> void:
	motion_btn.text = "Motion: reduced" if Settings.reduced_motion else "Motion: full"


func _build_counter() -> Control:
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 14)
	row.custom_minimum_size = Vector2(0, 124)
	portrait_holder = Control.new()
	portrait_holder.custom_minimum_size = Vector2(120, 120) if _art else Vector2(104, 104)
	portrait_holder.size_flags_vertical = SIZE_SHRINK_CENTER
	row.add_child(portrait_holder)
	if _art:
		_build_art_portrait()
	else:
		_build_flat_portrait()
	var bubble := _build_bubble()
	row.add_child(bubble)
	row.add_child(_build_ticket())
	return row


## Art portrait: starry disc, bust clipped to the circle (112% wide, top-aligned), brass ring.
func _build_art_portrait() -> void:
	face = Panel.new()
	face.add_theme_stylebox_override("panel", StyleBoxEmpty.new())
	face.size = Vector2(120, 120)
	face.pivot_offset = Vector2(60, 60)
	portrait_holder.add_child(face)
	var bg := TextureRect.new()
	bg.texture = Assets.tex("ui/portrait_bg")
	bg.size = Vector2(120, 120)
	bg.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	face.add_child(bg)
	var clip := Panel.new()
	clip.position = Vector2(10, 10)
	clip.size = Vector2(100, 100)
	clip.clip_children = CanvasItem.CLIP_CHILDREN_ONLY
	clip.add_theme_stylebox_override("panel", UI.box(Color.WHITE, 50, Vector4.ZERO))
	face.add_child(clip)
	face_tex = TextureRect.new()
	face_tex.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	face_tex.stretch_mode = TextureRect.STRETCH_SCALE
	face_tex.size = Vector2(112, 112)
	face_tex.position = Vector2(-6, 0)
	face_tex.pivot_offset = Vector2(56, 112)
	clip.add_child(face_tex)
	var ring := TextureRect.new()
	ring.texture = Assets.tex("ui/portrait_frame")
	ring.size = Vector2(120, 120)
	ring.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	face.add_child(ring)


func _build_flat_portrait() -> void:
	face = Panel.new()
	face.size = Vector2(104, 104)
	face.pivot_offset = Vector2(52, 52)
	face.clip_children = CanvasItem.CLIP_CHILDREN_AND_DRAW
	face.add_theme_stylebox_override("panel", UI.box(UI.BG2, 52, Vector4.ZERO))
	portrait_holder.add_child(face)
	face_tex = TextureRect.new()
	face_tex.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	face_tex.stretch_mode = TextureRect.STRETCH_SCALE
	face_tex.size = Vector2(104, 104)
	face.add_child(face_tex)
	var ring := Panel.new()
	ring.size = Vector2(104, 104)
	var rs := UI.box(Color(0, 0, 0, 0), 52, Vector4.ZERO)
	rs.draw_center = false
	rs.border_color = UI.BRASS
	rs.set_border_width_all(4)
	ring.add_theme_stylebox_override("panel", rs)
	ring.mouse_filter = MOUSE_FILTER_IGNORE
	face.add_child(ring)


func _build_bubble() -> Control:
	var bubble := PanelContainer.new()
	var art_bubble := UI.tex_box("ui/speech_bubble", Vector4(28, 28, 28, 28), Vector4(18, 12, 18, 14))
	if art_bubble:
		bubble.add_theme_stylebox_override("panel", art_bubble)
		var tail := Assets.tex("ui/speech_tail")
		if tail:
			bubble.draw.connect(func(): bubble.draw_texture(tail, Vector2(-tail.get_width() + 1, bubble.size.y - tail.get_height())))
	else:
		var bs := UI.box(UI.PANEL, 18, Vector4(16, 11, 16, 13))
		bs.corner_radius_bottom_left = 4
		bubble.add_theme_stylebox_override("panel", bs)
	bubble.size_flags_horizontal = SIZE_EXPAND_FILL
	bubble.size_flags_vertical = SIZE_SHRINK_CENTER
	var bv := VBoxContainer.new()
	bv.add_theme_constant_override("separation", 2)
	bubble.add_child(bv)
	_who_row = HBoxContainer.new()
	bv.add_child(_who_row)
	who_l = UI.label(" ", UI.bold, 17, UI.MUTED)
	who_l.size_flags_horizontal = SIZE_EXPAND_FILL
	_who_row.add_child(who_l)
	says_l = UI.label(" ", UI.legible, 20, UI.INK)
	says_l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	# shape the full line up front so typing it out never reflows the bubble
	says_l.visible_characters_behavior = TextServer.VC_CHARS_AFTER_SHAPING
	says_l.resized.connect(func(): _fit_says.call_deferred())
	says_l.custom_minimum_size = Vector2(180, 54)
	bv.add_child(says_l)
	return bubble


func _build_ticket() -> Control:
	if Assets.has("ui/ticket"):
		# Parchment ticket: number centred near y 62, "wanted" at y 98 (of 132x152), ink.
		var tr := TextureRect.new()
		tr.texture = Assets.tex("ui/ticket")
		tr.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		tr.stretch_mode = TextureRect.STRETCH_SCALE
		var sc := 0.82
		tr.custom_minimum_size = Vector2(132, 152) * sc
		tr.size_flags_vertical = SIZE_SHRINK_BEGIN
		tr.pivot_offset = Vector2(66, 12) * sc
		tr.rotation = deg_to_rad(3.5)
		target_l = UI.label("–", UI.legible_black, 40, UI.INK_DARK)
		target_l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		target_l.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		target_l.position = Vector2(0, (62 - 24) * sc)
		target_l.size = Vector2(132, 48) * sc
		tr.add_child(target_l)
		var w := UI.label("wanted", UI.body, 15, Color(UI.INK_DARK, 0.75))
		w.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		w.position = Vector2(0, (98 - 11) * sc)
		w.size = Vector2(132 * sc, 22)
		tr.add_child(w)
		ticket = tr
		return tr
	var ticket_panel := PanelContainer.new()
	ticket = ticket_panel
	var ts := UI.box(UI.PANEL, 5, Vector4(14, 8, 14, 8))
	ts.border_width_top = 5
	ts.border_color = UI.BRASS
	ts.shadow_color = Color(0, 0, 0, 0.25)
	ts.shadow_size = 8
	ts.shadow_offset = Vector2(0, 4)
	ticket_panel.add_theme_stylebox_override("panel", ts)
	ticket.size_flags_vertical = SIZE_SHRINK_CENTER
	ticket.custom_minimum_size = Vector2(84, 0)
	ticket.rotation = deg_to_rad(3)
	var tv := VBoxContainer.new()
	tv.add_theme_constant_override("separation", -2)
	ticket.add_child(tv)
	target_l = UI.label("–", UI.legible_black, 44, UI.INK)
	target_l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	tv.add_child(target_l)
	var w := UI.label("wanted", UI.body, 15, UI.MUTED)
	w.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	tv.add_child(w)
	ticket.resized.connect(func(): ticket.pivot_offset = ticket.size / 2)
	return ticket


func _build_patience() -> Control:
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 12)
	patience = PatienceBar.new()
	patience.size_flags_horizontal = SIZE_EXPAND_FILL
	row.add_child(patience)
	clock_l = UI.label("", UI.legible_bold, 17, SOFT)
	clock_l.custom_minimum_size = Vector2(130, 0)
	clock_l.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	row.add_child(clock_l)
	return row


func _build_recipe() -> Control:
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 8)
	var head := HBoxContainer.new()
	count_l = UI.label("0 of 6 ingredients", UI.legible, 17, SOFT)
	head.add_child(count_l)
	var sp := Control.new()
	sp.size_flags_horizontal = SIZE_EXPAND_FILL
	head.add_child(sp)
	par_l = UI.label("", UI.legible, 17, SOFT)
	head.add_child(par_l)
	v.add_child(head)
	chips = HFlowContainer.new()
	chips.custom_minimum_size = Vector2(0, 38)
	chips.add_theme_constant_override("h_separation", 6)
	chips.add_theme_constant_override("v_separation", 6)
	v.add_child(chips)
	note_l = UI.label("", UI.body, 18, UI.DANGER)
	note_l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	note_l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	note_l.custom_minimum_size = Vector2(0, 26)
	note_l.pivot_offset = Vector2(215, 13)
	v.add_child(note_l)
	return v


func _build_actions() -> Control:
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 10)
	undo_b = Button.new()
	undo_b.text = "Undo"
	empty_b = Button.new()
	empty_b.text = "Empty"
	serve_b = Button.new()
	serve_b.text = "Serve potion"
	serve_b.theme_type_variation = "Primary"
	for b in [undo_b, empty_b, serve_b]:
		b.size_flags_horizontal = SIZE_EXPAND_FILL
		b.custom_minimum_size = Vector2(0, 54)
		row.add_child(b)
		UI.juice(b, 1.03)
	serve_b.size_flags_stretch_ratio = 2.0
	undo_b.pressed.connect(undo)
	empty_b.pressed.connect(empty_pot)
	serve_b.pressed.connect(serve)
	return row


func _build_overlay() -> void:
	overlay = ColorRect.new()
	(overlay as ColorRect).color = UI.SCRIM
	overlay.set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	overlay.mouse_filter = MOUSE_FILTER_STOP
	overlay.visible = false
	add_child(overlay)
	card_center = CenterContainer.new()
	card_center.set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	overlay.add_child(card_center)


func _on_resized() -> void:
	queue_redraw()
	_place_cauldron.call_deferred()
	# Portrait has its own tree (_to_portrait); the landscape columns never stack.
	var tall := false
	body.vertical = tall
	left.custom_minimum_size.x = 0 if tall else 430
	right.custom_minimum_size.x = 0 if tall else 410
	cauldron.size_flags_stretch_ratio = 1.0
	var avail := (size.x - 56) if tall else 410.0
	if not _portrait:
		shelf.columns = clampi(int(avail / 102.0), 3, 8)
	else:
		_size_shelf.call_deferred()
		_size_card()


## With the art backdrop (landscape), stand the cauldron on the hearth slab
## (layer point 800,754 on the 1600x900 counter layer).
func _place_cauldron() -> void:
	if not is_instance_valid(cauldron) or cauldron.rig == null:
		return
	if _portrait:
		_place_portrait()
		return
	if backdrop:
		backdrop.set_focus(Vector2.ZERO, Vector2.ZERO, 0.0)
	if backdrop == null or body.vertical:
		cauldron.unplace()
		return
	var feet := backdrop.layer_to_canvas(Vector2(800, 760))
	var room := (right.get_global_rect().position.x - left.get_global_rect().end.x) + 90.0
	var kk := clampf(minf(1.55 * backdrop.bg_scale, room / 208.0), 1.0, 2.6)
	cauldron.place(feet, kk)


func _draw() -> void:
	# background + warm halo behind the cauldron (body background in style.css)
	draw_rect(Rect2(Vector2.ZERO, size), UI.BG)
	if backdrop:
		return
	var c := cauldron.get_global_rect().get_center() if cauldron else size / 2
	var hs := Vector2(1100, 760)
	draw_texture_rect(UI.halo_texture(), Rect2(c - hs / 2, hs), false)


func _exit_tree() -> void:
	UI.free_statics()
	Assets.clear()


func _process(delta: float) -> void:
	var dt := minf(0.1, delta)
	_bob_t += dt
	if cur != null and not Settings.reduced_motion and face.position.x == 0.0:
		face.position.y = sin(_bob_t * 2.4) * 2.5
	if paused or cur == null or WebInstall.is_open:
		return
	el += dt
	if cur.timed:
		t -= dt
		var f := maxf(0.0, t / cur.max)
		patience.fill = f
		patience.target_color = UI.DANGER if f < 0.3 else UI.GLOW
		clock_l.add_theme_color_override("font_color", UI.DANGER if f < 0.3 else SOFT)
		clock_l.text = "%ds left" % maxi(0, ceili(t))
		if t <= 0:
			today.left += 1
			_finish_customer("cross", GameData.WALKOUT)
	else:
		var b := Logic.untimed_bonus(el)
		patience.fill = maxf(0.0, 1.0 - el / Logic.BONUS_WINDOW)
		clock_l.add_theme_color_override("font_color", SOFT)
		clock_l.text = "Speed bonus +%d" % b if b else "No rush"


# ======================================================================
# Rendering
# ======================================================================

func _render_shelf() -> void:
	for c in shelf.get_children():
		c.queue_free()
	var cfg := Logic.day_cfg(day)
	for i in cfg.ings.size():
		var jb := JarButton.new().setup(cfg.ings[i], i, false, day >= Logic.FADE_DAY)
		jb.pressed.connect(func(): add_ingredient(jb.index, jb))
		shelf.add_child(jb)
	_stagger_in(shelf.get_children())
	_size_shelf.call_deferred()


func _stagger_in(nodes: Array) -> void:
	if Settings.reduced_motion:
		return
	for i in nodes.size():
		var n: CanvasItem = nodes[i]
		n.modulate.a = 0.0
		var tw := n.create_tween()
		tw.tween_interval(0.03 * i)
		tw.tween_property(n, "modulate:a", 1.0, 0.25)


func _render_header() -> void:
	day_l.text = "Day %d/%d" % [day, Logic.LAST_DAY]
	coins_l.text = str(coins)
	dots.waiting = queue.size() + (1 if cur != null else 0)


func _target() -> int:
	return cur.t if cur != null else -1


func _render_brew(b: Array = brew, v: int = value) -> void:
	var is_ready: bool = cur != null and v == cur.t and b.size() > 0
	cauldron.show_brew(b, v, _target(), is_ready)
	# chips
	var grew := b.size() > _chip_count and b.size() - _chip_count == 1
	for c in chips.get_children():
		c.queue_free()
	if b.is_empty():
		var e := UI.label("Tap an ingredient to drop it in." if _portrait else "The cauldron is empty. Tap an ingredient to drop it in.", UI.body, 18, SOFT)
		chips.add_child(e)
	else:
		for i in b.size():
			var chip := _chip(b[i])
			chips.add_child(chip)
			if grew and i == b.size() - 1 and not Settings.reduced_motion:
				chip.scale = Vector2(0.6, 0.6)
				chip.resized.connect(func(): chip.pivot_offset = chip.size / 2, CONNECT_ONE_SHOT)
				var tw := chip.create_tween().set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
				tw.tween_property(chip, "scale", Vector2.ONE, 0.25)
	_chip_count = b.size()
	count_l.text = "%d of %d ingredients" % [b.size(), Logic.MAX_ING]
	var was_lit := serve_b.theme_type_variation == "Lit"
	serve_b.theme_type_variation = "Lit" if is_ready else "Primary"
	if is_ready and not was_lit and not Settings.reduced_motion:
		serve_b.pivot_offset = serve_b.size / 2
		var tw := serve_b.create_tween().set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
		tw.tween_property(serve_b, "scale", Vector2(1.08, 1.08), 0.12)
		tw.tween_property(serve_b, "scale", Vector2.ONE, 0.2)


func _chip(g: Dictionary) -> Control:
	var p := PanelContainer.new()
	var cb: StyleBox = UI.tex_box("ui/chip", Vector4(18, 0, 18, 0), Vector4(12, 6, 16, 6))
	p.add_theme_stylebox_override("panel", cb if cb else UI.box(UI.PANEL, 999, Vector4(8, 5, 12, 5)))
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", 7)
	p.add_child(h)
	var d := ColorDot.new()
	d.color = Color(g.color)
	h.add_child(d)
	h.add_child(UI.label("%s%d" % [g.op, g.v], UI.legible_bold, 18, UI.INK))
	return p


func _bump() -> void:
	cauldron.bump()


func note(msg: String) -> void:
	note_l.text = msg
	_fit_note()
	_note_token += 1
	var tok := _note_token
	if not Settings.reduced_motion:
		note_l.modulate.a = 0.0
		var tw := note_l.create_tween()
		tw.tween_property(note_l, "modulate:a", 1.0, 0.15)
	get_tree().create_timer(2.4).timeout.connect(func():
		if tok == _note_token:
			note_l.text = ""
			_fit_note())


func toast(main: String, sub := "") -> void:
	var p := PanelContainer.new()
	var fg := UI.BG
	if _art:
		fg = UI.INK
	else:
		p.add_theme_stylebox_override("panel", UI.box(UI.INK, 14, Vector4(18, 10, 18, 11)))
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 0)
	p.add_child(v)
	var m := UI.label(main, UI.legible_black, 22, UI.BRASS_HI if _art else fg)
	m.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(m)
	if sub != "":
		var s := UI.label(sub, UI.legible, 16, Color(fg, 0.8))
		s.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		v.add_child(s)
	p.mouse_filter = MOUSE_FILTER_IGNORE
	add_child(p)
	var top := 14.0
	if _portrait:
		top = p_stage.global_position.y + 8.0
		for l in v.get_children():
			var lw := minf(l.get_minimum_size().x, size.x - 80)
			(l as Label).autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
			(l as Label).custom_minimum_size.x = lw
	p.reset_size()
	var x := (size.x - p.size.x) / 2
	p.position = Vector2(x, top)
	if Settings.reduced_motion:
		get_tree().create_timer(2.2).timeout.connect(p.queue_free)
		return
	p.modulate.a = 0.0
	p.position.y = top - 10
	var tw := p.create_tween()
	tw.tween_property(p, "modulate:a", 1.0, 0.2)
	tw.parallel().tween_property(p, "position:y", top, 0.25).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.tween_interval(1.5)
	tw.tween_property(p, "modulate:a", 0.0, 0.3)
	tw.parallel().tween_property(p, "position:y", top - 10, 0.3)
	tw.tween_callback(p.queue_free)


# ======================================================================
# Pouring (shared-element jar flight, ported from pour() in main.js)
# ======================================================================

func _tw() -> Tween:
	var tw := create_tween()
	tw.set_speed_scale(FAST_RATE if _pending > 1 else BASE_RATE)
	_live.append(tw)
	tw.finished.connect(func(): _live.erase(tw))
	return tw


## Fire-and-forget pour tween: jumps to its end while a serve is skipping.
func _go(tw: Tween) -> void:
	if _skip_all and tw.is_valid():
		tw.custom_step(1000.0)


func _play(tw: Tween) -> void:
	_go(tw)
	if tw.is_valid() and tw.is_running():
		await tw.finished


func _skip_to_end() -> void:
	_skip_all = true
	for tw in _live.duplicate():
		if tw.is_valid():
			tw.custom_step(1000.0)


func _hurry() -> void:
	for tw in _live:
		if tw.is_valid():
			tw.set_speed_scale(FAST_RATE)


func _show_snap(snap: Dictionary) -> void:
	if snap.gen != gen:
		return
	_render_brew(snap.brew, snap.value)
	_bump()


func _make_fly_jar(g: Dictionary) -> Node2D:
	# Local units = SVG units of the 60x74 jar, origin at the jar centre.
	var root := Node2D.new()
	var jar := Sprite2D.new()
	jar.texture = Assets.tex("jar/" + g.id)
	jar.scale = Vector2.ONE * (60.0 / jar.texture.get_width())
	root.add_child(jar)
	var cork := Sprite2D.new()
	cork.name = "Cork"
	cork.texture = Assets.tex("cork")
	var cr := Assets.cork_rect()
	cork.scale = Vector2.ONE * (cr.size.x / cork.texture.get_width())
	cork.position = cr.get_center() - Vector2(30, Assets.jar_height() / 2)
	root.add_child(cork)
	return root


func _pour(g: Dictionary, btn: JarButton, snap: Dictionary) -> void:
	var col := Color(g.color)
	if btn == null or not is_instance_valid(btn) or Settings.reduced_motion:
		cauldron.splash(col)
		_show_snap(snap)
		return
	var r := btn.jar_global_rect()
	var pot := cauldron.pot_size()
	var unit := r.size.x / 60.0
	var s := clampf(pot.x * 0.3 / r.size.x, 1.0, 1.6)
	var h := r.size.y * s
	var theta := deg_to_rad(118.0)
	var mouth := Vector2(0.34 * h * sin(theta), -0.34 * h * cos(theta))
	var liquid := cauldron.at(cauldron.LIQ_C)
	var jar_c := Vector2(liquid.x - mouth.x, maxf(h / 2 + 10, liquid.y - pot.y * 0.42))
	var start := r.get_center()
	var fly := _make_fly_jar(g)
	fly.position = start
	fly.scale = Vector2.ONE * unit
	fx.add_child(fly)
	btn.hold_icon()
	var cork: Sprite2D = fly.get_node("Cork")

	# 1. rise from the shelf in an arc, stretching along the flight
	var d := jar_c - start
	var mid := start + Vector2(d.x * 0.45, d.y * 0.62 - 30)
	var ctrl := 2.0 * mid - 0.5 * (start + jar_c)
	var tw := _tw()
	tw.tween_method(func(p: float):
		fly.position = UI.quad_bezier(p, start, ctrl, jar_c)
		fly.rotation = deg_to_rad(-12.0) * sin(p * PI)
		var sc := lerpf(1.0, s, p) * unit
		var st := sin(p * PI) * 0.14
		fly.scale = Vector2(sc * (1.0 - st), sc * (1.0 + st)), 0.0, 1.0, 0.38).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	# land with a squash
	tw.tween_property(fly, "scale", Vector2(s * unit * 1.1, s * unit * 0.9), 0.06)
	tw.tween_property(fly, "scale", Vector2.ONE * s * unit, 0.12).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	await _play(tw)

	# 2. pop the cork
	var cork_home := cork.position
	var cork_off := cork_home + Vector2(-8, -18)
	var ct := _tw()
	ct.tween_property(cork, "position", cork_off, 0.12).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	ct.parallel().tween_property(cork, "rotation", deg_to_rad(-35), 0.12)
	ct.tween_property(cork, "modulate:a", 0.0, 0.08)
	_go(ct)
	await _play(_wait_tw(0.13))

	# 3. tilt
	tw = _tw()
	tw.tween_property(fly, "rotation", theta, 0.24).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_IN_OUT)
	await _play(tw)

	# 4. pour stream
	var m := jar_c + mouth
	var sw := maxf(4.0, 5.0 * s * unit)
	var stream := ColorRect.new()
	stream.color = col
	stream.mouse_filter = MOUSE_FILTER_IGNORE
	stream.position = Vector2(m.x - sw / 2, m.y)
	var full_h := maxf(12.0, liquid.y - m.y)
	stream.size = Vector2(sw, 0)
	fx.add_child(stream)
	fx.move_child(stream, fly.get_index())
	tw = _tw()
	tw.tween_property(stream, "size:y", full_h, 0.13).set_ease(Tween.EASE_IN)
	await _play(tw)
	cauldron.splash(col)
	_show_snap(snap)
	var wob := _tw()
	wob.tween_property(fly, "rotation", theta + deg_to_rad(6), 0.12)
	wob.tween_property(fly, "rotation", theta, 0.12)
	_go(wob)
	await _play(_wait_tw(0.23))
	tw = _tw()
	tw.tween_property(stream, "position:y", m.y + full_h, 0.13).set_ease(Tween.EASE_IN)
	tw.parallel().tween_property(stream, "size:y", 0.0, 0.13).set_ease(Tween.EASE_IN)
	await _play(tw)
	stream.queue_free()

	# 5. right it and cork it
	tw = _tw()
	tw.tween_property(fly, "rotation", 0.0, 0.21).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	await _play(tw)
	ct = _tw()
	ct.tween_property(cork, "modulate:a", 1.0, 0.06)
	ct.parallel().tween_property(cork, "position", cork_home, 0.17).set_ease(Tween.EASE_IN)
	ct.parallel().tween_property(cork, "rotation", 0.0, 0.17)
	_go(ct)
	await _play(_wait_tw(0.15))

	# 6. fly home (not awaited, so the next pour can start)
	var home := btn.jar_global_rect().get_center() if is_instance_valid(btn) else start
	var hmid := (jar_c + home) * 0.5 + Vector2(0, -24)
	var hctrl := 2.0 * hmid - 0.5 * (jar_c + home)
	tw = _tw()
	tw.tween_method(func(p: float):
		fly.position = UI.quad_bezier(p, jar_c, hctrl, home)
		fly.rotation = deg_to_rad(8.0) * sin(p * PI)
		fly.scale = Vector2.ONE * lerpf(s, 1.0, p) * unit, 0.0, 1.0, 0.34).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_IN_OUT)
	tw.tween_callback(func():
		fly.queue_free()
		if is_instance_valid(btn):
			btn.release_icon())
	_go(tw)


func _wait_tw(sec: float) -> Tween:
	var tw := _tw()
	tw.tween_interval(sec)
	return tw


func _enqueue_pour(g: Dictionary, btn: JarButton, snap: Dictionary) -> void:
	_pours.append([g, btn, snap])
	_pending += 1
	if _pending > 1:
		_hurry()
	if not _pouring:
		_run_pours()


func _run_pours() -> void:
	_pouring = true
	while not _pours.is_empty():
		var job: Array = _pours.pop_front()
		await _pour(job[0], job[1], job[2])
		_pending -= 1
	_pouring = false
	pour_idle.emit()


# ======================================================================
# Actions
# ======================================================================

func add_ingredient(i: int, btn: JarButton = null) -> void:
	if paused or cur == null:
		return
	var ings: Array = Logic.day_cfg(day).ings
	if i < 0 or i >= ings.size():
		return
	var g: Dictionary = ings[i]
	if btn == null:
		btn = _jar_button(i)
	if brew.size() >= Logic.MAX_ING:
		note("The cauldron is full. Undo or empty it first.")
		if btn:
			btn.shake()
		return
	var r := Logic.apply(value, g)
	if r.has("err"):
		note(r.err)
		if btn:
			btn.shake()
		return
	brew.append(g)
	value = r.v
	var snap := {brew = brew.duplicate(), value = value, gen = gen}
	_enqueue_pour(g, btn, snap)


func _jar_button(i: int) -> JarButton:
	for c in shelf.get_children():
		if c is JarButton and c.index == i and not c.is_queued_for_deletion():
			return c
	return null


func _recompute() -> void:
	gen += 1
	value = 0
	for g in brew:
		value = Logic.apply(value, g).v
	_render_brew()
	_bump()


func undo() -> void:
	if paused or brew.is_empty():
		return
	brew.pop_back()
	_recompute()


func empty_pot() -> void:
	if paused or brew.is_empty():
		return
	brew = []
	_recompute()


func serve() -> void:
	if paused or cur == null or serving:
		return
	serving = true
	_skip_to_end()
	if _pouring:
		await pour_idle
	_skip_all = false
	serving = false
	_do_serve()


func _do_serve() -> void:
	if paused or cur == null:
		return
	if brew.is_empty():
		note("Add some ingredients first.")
		return
	var target: int = cur.t
	var par: int = cur.par
	if value == target:
		var n := brew.size()
		var speed: int = roundi(maxf(0.0, t / cur.max) * 6) if cur.timed else Logic.untimed_bonus(el)
		var tip := 6 if n == par else (3 if n == par + 1 else 0)
		var total := 10 + tip + speed
		var parts := ["10 for the potion"]
		if tip:
			parts.append("%d %s" % [tip, "master’s tip" if n == par else "tip"])
		if speed:
			parts.append("%d for speed" % speed)
		var col := Logic.mix_color(brew)
		var old := coins
		coins += total
		today.coins += total
		today.served += 1
		if n == par:
			today.perfect += 1
		paused = true
		brew = []
		value = 0
		gen += 1
		_render_brew()
		_bump()
		_render_header()
		coins_l.text = str(old)
		toast("+%d coins" % total, ", ".join(parts))
		cauldron.celebrate()
		_serve_success(col, old, total)
	else:
		var v := value
		var col := Logic.mix_color(brew)
		coins = maxi(0, coins - 2)
		today.coins -= 2
		if cur.timed:
			t -= cur.max * 0.2
		toast("−2 coins", "Wasted ingredients")
		brew = []
		_recompute()
		_render_header()
		_react_token += 1
		var tok := _react_token
		var who = cur
		var react := func():
			if cur == null or paused or not is_same(cur, who):
				return
			_set_face("cross")
			_say("That’s a %d. I asked for %d." % [v, target])
			_shake_face()
			get_tree().create_timer(2.4).timeout.connect(func():
				if tok == _react_token and is_same(cur, who) and not paused:
					_set_face("neutral")
					_say(GameData.line(cur.line, cur.t)))
		cauldron.fizzle()
		if Settings.reduced_motion:
			react.call()
		else:
			_fly_flask(col, true)
			get_tree().create_timer(0.47).timeout.connect(react)


func _serve_success(col: Color, old: int, total: int) -> void:
	if not Settings.reduced_motion:
		await _fly_flask(col, false)
		_portrait_burst()
	var thanks: String = GameData.THANKS[Logic.rand(0, GameData.THANKS.size() - 1)]
	if Settings.reduced_motion:
		coins_l.text = str(coins)
	else:
		_fly_coins(mini(8, ceili(total / 3.0)), face.get_global_rect().get_center(), coin_icon.get_global_rect().get_center(), old)
	_finish_customer("happy", thanks, 0.65)


## A filled flask rises out of the cauldron and flies to the customer (or falls short).
func _fly_flask(col: Color, miss: bool) -> void:
	var pot := cauldron.pot_size()
	var w := maxf(40.0, pot.x * 0.17)
	var src := cauldron.at(cauldron.LIQ_C)
	var dst := face.get_global_rect().get_center()
	var root := Node2D.new()
	var liq := Sprite2D.new()
	liq.texture = Assets.tex("flask_liquid")
	liq.modulate = col
	var glass := Sprite2D.new()
	glass.texture = Assets.tex("flask_glass")
	var sc := w / glass.texture.get_width()
	liq.scale = Vector2.ONE * (w / liq.texture.get_width())
	glass.scale = Vector2.ONE * sc
	root.add_child(liq)
	root.add_child(glass)
	if Assets.has("ingredients/bottle_round_front"):
		var front := Sprite2D.new()
		front.texture = Assets.tex("ingredients/bottle_round_front")
		front.scale = Vector2.ONE * (w / front.texture.get_width())
		root.add_child(front)
	root.position = src
	root.scale = Vector2.ONE * 0.3
	root.modulate.a = 0.0
	fx.add_child(root)
	var up := Vector2(0, -pot.y * 0.35)
	var dd := dst - src
	var tw := create_tween()
	if miss:
		tw.tween_property(root, "modulate:a", 1.0, 0.12)
		tw.parallel().tween_property(root, "position", src + up, 0.23).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
		tw.parallel().tween_property(root, "scale", Vector2.ONE, 0.23)
		tw.parallel().tween_property(root, "rotation", deg_to_rad(-8), 0.23)
		tw.tween_property(root, "position", src + dd * 0.8, 0.24).set_trans(Tween.TRANS_SINE)
		tw.parallel().tween_property(root, "scale", Vector2.ONE * 0.8, 0.24)
		tw.parallel().tween_property(root, "rotation", 0.0, 0.24)
		tw.tween_property(root, "rotation", deg_to_rad(-25), 0.09)
		tw.parallel().tween_property(root, "position", src + dd * 0.78 + Vector2(0, 18), 0.09)
		tw.tween_property(root, "position", src + dd * 0.6 + Vector2(0, 140), 0.2).set_ease(Tween.EASE_IN).set_trans(Tween.TRANS_QUAD)
		tw.parallel().tween_property(root, "rotation", deg_to_rad(-130), 0.2)
		tw.parallel().tween_property(root, "modulate:a", 0.0, 0.2)
		tw.parallel().tween_property(root, "scale", Vector2.ONE * 0.6, 0.2)
	else:
		tw.tween_property(root, "modulate:a", 1.0, 0.1)
		tw.parallel().tween_property(root, "position", src + up, 0.18).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
		tw.parallel().tween_property(root, "scale", Vector2(0.9, 1.15), 0.18)
		tw.parallel().tween_property(root, "rotation", deg_to_rad(-8), 0.18)
		var a := src + up
		var ctrl := a + Vector2(dd.x * 0.5, -60)
		tw.tween_method(func(p: float):
			root.position = UI.quad_bezier(p, a, ctrl, dst)
			root.scale = Vector2.ONE * lerpf(1.0, 0.55, p)
			root.rotation = lerpf(deg_to_rad(-8), deg_to_rad(6), p), 0.0, 1.0, 0.29).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
		tw.tween_property(root, "scale", Vector2.ONE * 0.2, 0.06)
		tw.parallel().tween_property(root, "modulate:a", 0.0, 0.06)
	tw.tween_callback(root.queue_free)
	await tw.finished


func _portrait_burst() -> void:
	var p := Particles.burst({amount = 28, lifetime = 0.8, dir = Vector2(0, -1), spread = 180.0,
		vel = Vector2(90, 220), gravity = Vector2(0, 260), scale = Vector2(0.2, 0.45), alpha = 1.0, hue = true})
	p.position = face.get_global_rect().get_center()
	fx.add_child(p)


## Coins burst from the customer into the purse, ticking the count up as each lands.
func _fly_coins(n: int, from: Vector2, to: Vector2, old: int) -> void:
	for i in n:
		var c := Sprite2D.new()
		c.texture = Assets.tex("coin")
		var base := 18.0 / c.texture.get_width()
		c.scale = Vector2.ONE * base * 0.4
		c.position = from
		c.modulate.a = 0.0
		fx.add_child(c)
		var jx := randf_range(-30, 30)
		var up := Vector2(jx, -30 - randf() * 30)
		var tw := create_tween()
		tw.tween_interval(i * 0.06)
		tw.tween_property(c, "modulate:a", 1.0, 0.1)
		tw.parallel().tween_property(c, "position", from + up, 0.15).set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_QUAD)
		tw.parallel().tween_property(c, "scale", Vector2.ONE * base, 0.15)
		tw.tween_property(c, "position", to, 0.33).set_ease(Tween.EASE_IN).set_trans(Tween.TRANS_CUBIC)
		tw.parallel().tween_property(c, "scale", Vector2.ONE * base * 0.7, 0.33)
		var k := i + 1
		tw.tween_callback(func():
			c.queue_free()
			coins_l.text = str(roundi(old + (coins - old) * float(k) / n))
			_pop(coins_box))


func _pop(n: Control) -> void:
	if Settings.reduced_motion:
		return
	n.pivot_offset = n.size / 2
	var base: Vector2 = n.get_meta("base_scale", Vector2.ONE)
	var tw := n.create_tween()
	tw.tween_property(n, "scale", base * 1.15, 0.08)
	tw.tween_property(n, "scale", base, 0.17).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)


# ======================================================================
# Customers
# ======================================================================

func _set_face(mood: String) -> void:
	face_tex.texture = Assets.portrait(cur.c, mood)
	if Settings.reduced_motion or mood != "happy":
		return
	var tw := face.create_tween()
	tw.tween_property(face, "scale", Vector2(1.1, 0.92), 0.08)
	tw.tween_property(face, "scale", Vector2.ONE, 0.25).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)


func _shake_face() -> void:
	if Settings.reduced_motion:
		return
	var tw := face.create_tween()
	for dx in [-6.0, 6.0, -4.0, 3.0, 0.0]:
		tw.tween_property(face, "rotation", deg_to_rad(dx), 0.05)


func _say(text: String) -> void:
	says_l.text = text
	_fit_says.call_deferred()
	if Settings.reduced_motion:
		says_l.visible_ratio = 1.0
		return
	says_l.visible_ratio = 0.0
	says_l.create_tween().tween_property(says_l, "visible_ratio", 1.0, clampf(text.length() * 0.008, 0.18, 0.45))


func _next_customer() -> void:
	if queue.is_empty():
		_end_day()
		return
	cur = queue.pop_front()
	brew = []
	value = 0
	gen += 1
	var cfg := Logic.day_cfg(day)
	cur.max = cfg.patience
	t = cfg.patience
	cur.timed = cfg.timed
	el = 0.0
	patience.target_color = UI.GLOW if cfg.timed else UI.BRASS
	patience.fill = 1.0
	face_tex.texture = Assets.portrait(cur.c, "neutral")
	face.rotation = 0
	face.scale = Vector2.ONE
	if Settings.reduced_motion:
		face.position = Vector2.ZERO
		face.modulate.a = 1.0
	else:
		face.position = Vector2(-70, 6)
		face.modulate.a = 0.0
		var tw := face.create_tween().set_parallel()
		tw.tween_property(face, "position", Vector2.ZERO, 0.45).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
		tw.tween_property(face, "modulate:a", 1.0, 0.25)
	who_l.text = GameData.CUSTOMERS[cur.c].name
	_say(GameData.line(cur.line, cur.t))
	target_l.text = str(cur.t)
	_pop(ticket)
	par_l.text = "Master’s tip: use %d" % cur.par
	_render_header()
	_render_brew()
	paused = false


func _finish_customer(mood: String, msg: String, hold := 1.1) -> void:
	paused = true
	_set_face(mood)
	_say(msg)
	if mood == "cross":
		_shake_face()
	await _wait_skippable(hold)
	if not Settings.reduced_motion:
		var tw := face.create_tween().set_parallel()
		tw.tween_property(face, "position:x", -50.0, 0.26).set_ease(Tween.EASE_IN).set_trans(Tween.TRANS_CUBIC)
		tw.tween_property(face, "modulate:a", 0.0, 0.26)
		await tw.finished
	# a calm beat between customers: the web build may offer to install here
	await WebInstall.moment("served" if mood == "happy" else "between")
	cur = null
	_next_customer()


func _wait_skippable(sec: float) -> void:
	_skip_armed = true
	get_tree().create_timer(sec).timeout.connect(func():
		if _skip_armed:
			_skip_armed = false
			_skip.emit())
	await _skip


# Tap anywhere (or press Enter/space) to wave the customer off early.
func _input(event: InputEvent) -> void:
	if not _skip_armed or overlay.visible:
		return
	var tap: bool = (event is InputEventMouseButton and event.pressed) or (event is InputEventScreenTouch and event.pressed)
	var key: bool = event is InputEventKey and event.pressed and not event.echo and event.keycode in [KEY_ENTER, KEY_KP_ENTER, KEY_SPACE]
	if tap or key:
		_skip_armed = false
		_skip.emit()
		if key:
			get_viewport().set_input_as_handled()


func _unhandled_key_input(event: InputEvent) -> void:
	if overlay.visible or not (event is InputEventKey) or not event.pressed or event.echo:
		return
	var kc: int = event.keycode
	if kc >= KEY_1 and kc <= KEY_9:
		add_ingredient(kc - KEY_1)
	elif kc == KEY_BACKSPACE:
		undo()
	elif kc == KEY_ENTER or kc == KEY_KP_ENTER:
		serve()


# ======================================================================
# Days and cards
# ======================================================================

func _open_card(title: String, paragraphs: Array, extras: Array, button_text: String, on_go: Callable) -> void:
	paused = true
	for c in card_center.get_children():
		c.queue_free()
	card = PanelContainer.new()
	var art_card := UI.tex_box("ui/panel_card", Vector4(40, 40, 40, 40), Vector4(38, 34, 38, 32))
	if art_card:
		card.add_theme_stylebox_override("panel", art_card)
	else:
		var sb := UI.box(UI.PANEL, 22, Vector4(30, 28, 30, 26))
		sb.shadow_color = Color(0, 0, 0, 0.35)
		sb.shadow_size = 30
		sb.shadow_offset = Vector2(0, 14)
		card.add_theme_stylebox_override("panel", sb)
	card.custom_minimum_size = Vector2(520, 0)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 12)
	card.add_child(v)
	_card_parts = {texts = [], minis = [], art = art_card}
	if title == "Cauldron Counter" and Assets.has("ui/wordmark_stacked"):
		# portrait title card: the stacked wordmark instead of a one-line title
		var wm := TextureRect.new()
		wm.texture = Assets.tex("ui/wordmark_stacked")
		wm.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		wm.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		wm.custom_minimum_size = Vector2(0, 120)
		v.add_child(wm)
		_card_parts.wordmark = wm
	var h := UI.label(title, UI.display, 46, UI.INK)
	h.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	v.add_child(h)
	_card_parts.title = h
	for p in paragraphs:
		var rt := RichTextLabel.new()
		rt.bbcode_enabled = true
		rt.fit_content = true
		rt.scroll_active = false
		rt.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		rt.custom_minimum_size = Vector2(460, 0)
		rt.text = p
		rt.mouse_filter = MOUSE_FILTER_IGNORE
		v.add_child(rt)
		_card_parts.texts.append(rt)
	for e in extras:
		v.add_child(e)
		for j in e.get_children():
			if j is JarButton:
				_card_parts.minis.append(j)
		if e is GridContainer:
			_card_parts.tally = e
	card_btn = Button.new()
	card_btn.text = button_text
	card_btn.theme_type_variation = "Primary"
	card_btn.custom_minimum_size = Vector2(0, 58)
	UI.juice(card_btn, 1.02)
	v.add_child(card_btn)
	# portrait has no header toggle, so the cards carry the motion setting
	var mb := Button.new()
	mb.theme_type_variation = "Flat"
	mb.focus_mode = FOCUS_NONE
	mb.add_theme_font_override("font", UI.legible_bold)
	mb.add_theme_font_size_override("font_size", 17)
	mb.add_theme_color_override("font_color", UI.MUTED)
	mb.custom_minimum_size = Vector2(0, 40)
	mb.text = motion_btn.text
	mb.pressed.connect(func():
		Settings.set_reduced_motion(not Settings.reduced_motion)
		mb.text = motion_btn.text)
	v.add_child(mb)
	_card_parts.motion = mb
	v.add_child(_install_button(17))
	card_center.add_child(card)
	_size_card()
	overlay.visible = true
	card_btn.pressed.connect(func(): _close_card(on_go), CONNECT_ONE_SHOT)
	card_btn.grab_focus.call_deferred()
	if Settings.reduced_motion:
		overlay.modulate.a = 1.0
		return
	overlay.modulate.a = 0.0
	card.modulate.a = 0.0
	var tw := create_tween()
	tw.tween_property(overlay, "modulate:a", 1.0, 0.2)
	await get_tree().process_frame
	if not is_instance_valid(card):
		return
	card.pivot_offset = card.size / 2
	card.scale = Vector2(0.95, 0.95)
	card.position.y += 18
	var y := card.position.y - 18
	var ct := card.create_tween().set_parallel().set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	ct.tween_property(card, "modulate:a", 1.0, 0.25)
	ct.tween_property(card, "scale", Vector2.ONE, 0.4)
	ct.tween_property(card, "position:y", y, 0.4)


func _close_card(on_go: Callable) -> void:
	if not Settings.reduced_motion and is_instance_valid(card):
		var tw := create_tween().set_parallel()
		tw.tween_property(card, "modulate:a", 0.0, 0.18)
		tw.tween_property(card, "scale", Vector2(0.96, 0.96), 0.18)
		tw.tween_property(overlay, "modulate:a", 0.0, 0.22)
		await tw.finished
	overlay.visible = false
	on_go.call()


## Press the card's button (used by demo/capture autoplay and Enter).
func dismiss_card() -> void:
	if overlay.visible and is_instance_valid(card_btn):
		card_btn.pressed.emit()


func _mini_shelf(ings: Array) -> Control:
	var flow := HFlowContainer.new()
	flow.alignment = FlowContainer.ALIGNMENT_CENTER
	flow.add_theme_constant_override("h_separation", 4)
	for g in ings:
		flow.add_child(JarButton.new().setup(g, 0, true))
	return flow


func _tally(rows: Array) -> Control:
	var grid := GridContainer.new()
	grid.columns = 2
	grid.add_theme_constant_override("h_separation", 24)
	grid.add_theme_constant_override("v_separation", 6)
	for r in rows:
		var k := UI.label(r[0], UI.body, 20, UI.INK)
		k.size_flags_horizontal = SIZE_EXPAND_FILL
		grid.add_child(k)
		var val := UI.label(str(r[1]), UI.legible_bold, 20, UI.INK)
		val.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
		grid.add_child(val)
	return grid


func _start_day() -> void:
	var c := Logic.day_cfg(day)
	var orders := Logic.gen_orders(day)
	var ppl := Logic.shuffle(range(GameData.CUSTOMERS.size()))
	var lines := Logic.shuffle(Array(GameData.LINES))
	queue = []
	for i in orders.size():
		queue.append({t = orders[i].t, par = orders[i].par, c = ppl[i], line = lines[i]})
	today = {served = 0, perfect = 0, left = 0, coins = 0}
	_render_shelf()
	_render_header()
	var go := _next_customer
	var mut := "[color=#%s]" % UI.MUTED.to_html(false)
	if day == 1:
		_open_card("Cauldron Counter", [
			"Customers come to your stall for potions of an exact strength. Drop ingredients into the cauldron to reach it, then serve.",
			mut + "Use the fewest ingredients you can for a bigger tip. There’s no clock for the first two days, but quick potions earn a speed bonus.[/color]",
		], [_mini_shelf(c.ings)], "Open the shop", go)
	elif not GameData.day_note(day).is_empty():
		var n := GameData.day_note(day)
		var fresh: Array = c.ings.filter(func(g): return g.day == day)
		var wait := (" " + mut + "Customers will wait %d seconds.[/color]" % c.patience) if c.timed and day != Logic.TIMER_DAY else ""
		_open_card("Day %d" % day, ["[b]%s.[/b] %s%s" % [n.title, n.text, wait]], [_mini_shelf(fresh)] if fresh.size() else [], "Open the shop", go)
	else:
		_open_card("Day %d" % day, ["%s Customers will wait [b]%d seconds[/b] today." % [GameData.FLAVOR[day % GameData.FLAVOR.size()], c.patience]], [], "Open the shop", go)


func _end_day() -> void:
	Settings.record_best(coins)
	_render_header()
	var mut := "[color=#%s]" % UI.MUTED.to_html(false)
	_open_card("Closing time", [mut + "Day %d is done.[/color]" % day], [_tally([
		["Customers served", "%d of %d" % [today.served, Logic.PER_DAY]],
		["Master’s tips earned", today.perfect],
		["Walked out", today.left],
		["Coins today", today.coins],
		["Purse", coins],
		["Best purse", Settings.best],
	])], ("Start day %d" % (day + 1)) if day < Logic.LAST_DAY else "See how you did", func():
		if day < Logic.LAST_DAY:
			day += 1
			_start_day()
			return
		show_finale())


func show_finale() -> void:
	_open_card("Master of the cauldron", ["You’ve brewed through all %d days." % Logic.LAST_DAY], [_tally([
		["Final purse", coins], ["Best purse", Settings.best]])], "Play again", func():
			day = 1
			coins = 0
			_start_day())


## Autoplay: start over on another day (shows that day's card).
func jump_to_day(n: int) -> void:
	day = clampi(n, 1, Logic.LAST_DAY)
	_start_day()


# ======================================================================
# Autoplay hooks (tools: capture / demo)
# ======================================================================

func is_idle() -> bool:
	return not _pouring and not serving


func current_target() -> int:
	return _target()


func solution() -> Array:
	if cur == null:
		return []
	return Logic.solve_path(Logic.day_cfg(day).ings, 0, cur.t, Logic.MAX_ING)


# ======================================================================
# Portrait layout (phones held upright, tablets in portrait)
# ======================================================================
# Top to bottom: header (title, day, purse) and the customer row; the stage
# with the cauldron standing on the hearth (backdrop reframed around it) and
# the wanted ticket; then a bottom sheet in the thumb zone with the bar, the
# brew so far, the ingredient tray and the Undo / Empty / Serve buttons.
# The same widgets move between the two trees, so all state and animation
# code is shared.

func _build_portrait() -> void:
	p_root = VBoxContainer.new()
	p_root.set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	p_root.add_theme_constant_override("separation", 0)
	p_root.visible = false
	add_child(p_root)
	p_top = MarginContainer.new()
	p_root.add_child(p_top)
	p_top_v = VBoxContainer.new()
	p_top_v.add_theme_constant_override("separation", 12)
	p_top.add_child(p_top_v)
	p_header = HBoxContainer.new()
	p_header.add_theme_constant_override("separation", 8)
	p_top_v.add_child(p_header)
	p_title = UI.label("Cauldron Counter", UI.display, 22, UI.INK)
	p_title.size_flags_horizontal = SIZE_EXPAND_FILL
	p_title.size_flags_vertical = SIZE_SHRINK_CENTER
	p_title.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	p_title.clip_text = true
	p_header.add_child(p_title)
	p_day = _pill()
	p_header.add_child(p_day)
	p_coins = _pill()
	p_header.add_child(p_coins)

	p_stage = Control.new()
	p_stage.size_flags_vertical = SIZE_EXPAND_FILL
	p_stage.custom_minimum_size = Vector2(0, 170)
	p_stage.mouse_filter = MOUSE_FILTER_IGNORE
	p_stage.resized.connect(_place_cauldron.call_deferred)
	p_root.add_child(p_stage)

	p_sheet = PanelContainer.new()
	p_sheet_box = StyleBoxFlat.new()
	p_sheet_box.bg_color = Color("#221a37")
	p_sheet_box.corner_radius_top_left = 26
	p_sheet_box.corner_radius_top_right = 26
	p_sheet_box.border_width_top = 2
	p_sheet_box.border_color = Color(UI.BRASS, 0.55)
	p_sheet_box.shadow_color = Color(0, 0, 0, 0.45)
	p_sheet_box.shadow_size = 22
	p_sheet_box.anti_aliasing = true
	p_sheet.add_theme_stylebox_override("panel", p_sheet_box)
	p_root.add_child(p_sheet)
	p_sheet_v = VBoxContainer.new()
	p_sheet_v.add_theme_constant_override("separation", 10)
	p_sheet.add_child(p_sheet_v)


func _pill() -> PanelContainer:
	var pc := PanelContainer.new()
	pc.size_flags_vertical = SIZE_SHRINK_CENTER
	var sb := UI.box(Color(UI.PANEL, 0.92), 999, Vector4(10, 5, 11, 6))
	sb.border_color = Color(UI.BRASS, 0.35)
	sb.set_border_width_all(1)
	pc.add_theme_stylebox_override("panel", sb)
	return pc


func _move(n: Node, parent: Node) -> void:
	if n.get_parent() != parent:
		n.reparent(parent, false)
	parent.move_child(n, -1)


func _apply_layout() -> void:
	var p: bool = Screen.portrait
	if p != _portrait:
		_portrait = p
		if p:
			_to_portrait()
		else:
			_to_landscape()
	_apply_safe()
	_size_card()
	_fit_note()
	_fit_says.call_deferred()
	_size_shelf.call_deferred()
	_place_cauldron.call_deferred()


func _to_portrait() -> void:
	_home.clear()
	for n in [day_l, coins_box, dots, _counter_row, ticket, _patience_row, _recipe, note_l, _actions_row, cauldron, shelf]:
		_home.append([n, n.get_parent(), n.get_index()])
	_move(day_l, p_day)
	_move(coins_box, p_coins)
	_move(dots, _who_row)
	_move(_counter_row, p_top_v)
	_move(cauldron, p_stage)
	cauldron.set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	_move(ticket, p_stage)
	ticket.scale = Vector2.ONE * 1.12
	ticket.set_meta("base_scale", ticket.scale)
	_move(note_l, p_stage)
	var nb := UI.box(Color(UI.IRON, 0.88), 14, Vector4(14, 7, 14, 8))
	nb.border_color = Color(UI.DANGER, 0.6)
	nb.set_border_width_all(1)
	note_l.add_theme_stylebox_override("normal", nb)
	note_l.size_flags_horizontal = SIZE_FILL
	for n in [_patience_row, _recipe, shelf, _actions_row]:
		_move(n, p_sheet_v)
	shelf.size_flags_horizontal = SIZE_SHRINK_CENTER
	shelf.add_theme_constant_override("h_separation", 0)
	shelf.add_theme_constant_override("v_separation", 6)
	day_l.add_theme_font_size_override("font_size", 16)
	day_l.add_theme_color_override("font_color", UI.INK)
	coin_icon.custom_minimum_size = Vector2(22, 22)
	coins_l.custom_minimum_size = Vector2(0, 0)
	coins_l.add_theme_font_size_override("font_size", 19)
	says_l.add_theme_font_size_override("font_size", 19)
	says_l.custom_minimum_size = Vector2(120, 52)
	# long names ("Pim, age nine and a half") must not widen the row
	who_l.clip_text = true
	who_l.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	clock_l.custom_minimum_size = Vector2(118, 0)
	_counter_row.custom_minimum_size = Vector2(0, 120)
	for b in [undo_b, empty_b, serve_b]:
		b.custom_minimum_size = Vector2(0, 60)
	_margin.visible = false
	p_root.visible = true
	motion_btn.visible = false
	install_btn.visible = false
	_render_brew()


func _to_landscape() -> void:
	var order := _home.duplicate()
	order.sort_custom(func(a, b): return a[2] < b[2])
	for h in order:
		var n: Node = h[0]
		n.reparent(h[1], false)
		h[1].move_child(n, mini(h[2], h[1].get_child_count() - 1))
	_home.clear()
	ticket.scale = Vector2.ONE
	ticket.set_meta("base_scale", Vector2.ONE)
	note_l.remove_theme_stylebox_override("normal")
	note_l.visible = true
	shelf.size_flags_horizontal = SIZE_FILL
	shelf.add_theme_constant_override("h_separation", 2)
	shelf.add_theme_constant_override("v_separation", 4)
	day_l.add_theme_font_size_override("font_size", 20)
	day_l.add_theme_color_override("font_color", SOFT)
	coin_icon.custom_minimum_size = Vector2(20, 20)
	coins_l.custom_minimum_size = Vector2(48, 0)
	coins_l.add_theme_font_size_override("font_size", 22)
	says_l.add_theme_font_size_override("font_size", 20)
	says_l.custom_minimum_size = Vector2(180, 54)
	who_l.clip_text = false
	who_l.text_overrun_behavior = TextServer.OVERRUN_NO_TRIMMING
	clock_l.custom_minimum_size = Vector2(130, 0)
	chips.visible = true
	_counter_row.custom_minimum_size = Vector2(0, 124)
	for b in [undo_b, empty_b, serve_b]:
		b.custom_minimum_size = Vector2(0, 54)
	for j in shelf.get_children():
		if j is JarButton:
			j.set_cell(Vector2.ZERO)
	_margin.visible = true
	p_root.visible = false
	motion_btn.visible = true
	install_btn.visible = WebInstall.available
	if backdrop:
		backdrop.set_focus(Vector2.ZERO, Vector2.ZERO, 0.0)
	_on_resized()
	_render_brew()


func _apply_safe() -> void:
	var sa: Vector4 = Screen.safe
	for side in [["left", sa.x], ["right", sa.z]]:
		_margin.add_theme_constant_override("margin_" + side[0], 28 + roundi(side[1]))
	_margin.add_theme_constant_override("margin_top", 14 + roundi(sa.y))
	_margin.add_theme_constant_override("margin_bottom", 18 + roundi(sa.w))
	p_top.add_theme_constant_override("margin_left", 16 + roundi(sa.x))
	p_top.add_theme_constant_override("margin_right", 16 + roundi(sa.z))
	p_top.add_theme_constant_override("margin_top", 10 + roundi(sa.y))
	p_top.add_theme_constant_override("margin_bottom", 4)
	p_sheet_box.content_margin_left = 16 + sa.x
	p_sheet_box.content_margin_right = 16 + sa.z
	p_sheet_box.content_margin_top = 14
	# the buttons sit just above the home indicator (or 12 from a plain edge)
	p_sheet_box.content_margin_bottom = sa.w + 2.0 if sa.w > 0.0 else 12.0
	card_center.offset_top = sa.y
	card_center.offset_bottom = -sa.w


## Lay the jars out as a tray: 1 row up to four, 2 rows up to twelve, then 3,
## spread over the full width; the cell height comes from the room left once
## the stage keeps about a third of the screen for the cauldron.
func _size_shelf() -> void:
	if not _portrait:
		return
	var jars: Array = shelf.get_children().filter(func(c): return c is JarButton and not c.is_queued_for_deletion())
	var n := jars.size()
	if n == 0:
		return
	# small phones (360x640 class): the plate and "x of 6" carry the brew, so
	# the chip row gives its height to the jars
	chips.visible = size.y >= 780.0
	var rows := 1 if n <= 4 else (2 if n <= 12 else 3)
	var cols := ceili(n / float(rows))
	shelf.columns = cols
	var inner_w := size.x - p_sheet_box.content_margin_left - p_sheet_box.content_margin_right
	var cw := floorf(minf(inner_w / cols, 150.0))
	var other := p_top.get_combined_minimum_size().y + p_sheet.get_combined_minimum_size().y - shelf.get_combined_minimum_size().y
	var stage_min := clampf(size.y * 0.3, 200.0, 330.0)
	var ch := floorf(clampf((size.y - other - stage_min) / rows - 6.0, 96.0, 156.0))
	# one row: tall enough for the names when the stage still keeps 190
	if rows == 1 and ch < 140.0 and size.y - other - 146.0 >= 190.0:
		ch = 140.0
	var c := Vector2(cw, ch)
	for j in jars:
		if j.cell != c:
			j.set_cell(c)


func _place_portrait() -> void:
	var st := p_stage.get_global_rect()
	var w := st.size.x
	var h := st.size.y
	var tk := Vector2(132, 152) * 0.82 * ticket.scale.x
	ticket.position = Vector2(w - tk.x - 12 - Screen.safe.z, 2)
	# the cauldron stands on the hearth near the stage floor; it stays clear of
	# the ticket (rim ~156 units above the feet) and the screen edges
	var avail_h := h - 16.0
	var kk := minf((w - 36.0) / 260.0, avail_h / 205.0)
	var rim_room := (h - 16.0 - (tk.y * 0.92)) / 150.0
	if rim_room < kk:
		kk = maxf(rim_room, kk * 0.82)
	kk = clampf(kk, 0.62, 1.7)
	var feet := Vector2(st.position.x + w / 2, st.end.y - 14.0)
	cauldron.place(feet, kk)
	if backdrop:
		# same room-to-cauldron proportion as landscape (k 1.55 at scale 1),
		# never so small that the top of the room shows a gap
		backdrop.set_focus(Vector2(800, 760), feet, maxf(kk / 1.55, (feet.y + 4.0) / 760.0))
	_fit_note()


## Reserve the bubble height for the whole line (an autowrapped Label inside
## nested containers can report one line too few on its first layout).
func _fit_says() -> void:
	var w := says_l.size.x
	if w < 40.0:
		return
	var f: Font = says_l.get_theme_font("font")
	var fs := says_l.get_theme_font_size("font_size")
	var hh := f.get_multiline_string_size(says_l.text, HORIZONTAL_ALIGNMENT_LEFT, w, fs, -1, TextServer.BREAK_MANDATORY | TextServer.BREAK_WORD_BOUND | TextServer.BREAK_ADAPTIVE).y
	var want := maxf(54.0 if not _portrait else 52.0, ceilf(hh) + 2.0)
	if absf(says_l.custom_minimum_size.y - want) > 0.5:
		says_l.custom_minimum_size.y = want


## Portrait shows the note as a pill over the hearth; it hides when empty.
func _fit_note() -> void:
	if not _portrait or not is_instance_valid(note_l):
		return
	note_l.visible = note_l.text != ""
	if not note_l.visible:
		return
	var maxw := p_stage.size.x - 48.0
	var f: Font = note_l.get_theme_font("font")
	var tw := f.get_string_size(note_l.text, HORIZONTAL_ALIGNMENT_LEFT, -1, note_l.get_theme_font_size("font_size")).x + 30.0
	note_l.custom_minimum_size = Vector2(minf(tw, maxw), 0)
	note_l.size = Vector2.ZERO
	note_l.reset_size()
	note_l.position = Vector2((p_stage.size.x - note_l.size.x) / 2, p_stage.size.y - note_l.size.y - 70.0)
	note_l.pivot_offset = note_l.size / 2


## Size the open card for the layout: ~92% of a phone's width in portrait.
func _size_card() -> void:
	if not is_instance_valid(card) or _card_parts.is_empty():
		return
	var p := _portrait
	var inner := 0.0
	if p:
		var w := minf(size.x - 28.0 - Screen.safe.x - Screen.safe.z, 560.0)
		card.custom_minimum_size = Vector2(w, 0)
		inner = w - 56.0
	else:
		card.custom_minimum_size = Vector2(520, 0)
		inner = 460.0
	var art_card = _card_parts.get("art")
	if art_card:
		var pads := Vector4(28, 30, 28, 24) if p else Vector4(38, 34, 38, 32)
		art_card.content_margin_left = pads.x
		art_card.content_margin_top = pads.y
		art_card.content_margin_right = pads.z
		art_card.content_margin_bottom = pads.w
	var wm = _card_parts.get("wordmark")
	var title: Label = _card_parts.title
	if wm:
		wm.visible = p
		title.visible = not p
	title.add_theme_font_size_override("font_size", 42 if p else 46)
	for rt in _card_parts.texts:
		rt.custom_minimum_size = Vector2(inner, 0)
		rt.add_theme_font_size_override("normal_font_size", 20 if p else 21)
		rt.add_theme_font_size_override("bold_font_size", 20 if p else 21)
	for j in _card_parts.minis:
		j.set_cell(Vector2(minf(floorf(inner / 4.0) - 5.0, 96.0), 124 if size.y < 800 else 140) if p else Vector2.ZERO)
	var tally = _card_parts.get("tally")
	if tally:
		for l in tally.get_children():
			(l as Label).add_theme_font_size_override("font_size", 21 if p else 20)
	card_btn.custom_minimum_size = Vector2(0, 64 if p else 58)
	_card_parts.motion.visible = p
