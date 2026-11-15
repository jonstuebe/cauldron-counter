class_name JarButton
extends Button
## One ingredient jar on the shelf (.jar in style.css): jar art + cork, name,
## and an op tag. Mini jars on the day cards are display-only.

const JAR_W := 56.0
var SVG := Vector2(60, 74)

var ing: Dictionary
var index := -1
var mini := false
var faded := false
var _icon: Control           # pivot for hover lift / shake
var _jar: TextureRect
var _cork: TextureRect
var _out := 0                # flying copies currently away from the shelf
var _plank: StyleBox
## Portrait tray cell (Vector2.ZERO = the landscape shelf layout).
var cell := Vector2.ZERO
var _jar_w := JAR_W
var _tag_on_jar := false
var _lit := false


func setup(g: Dictionary, i: int, is_mini := false, is_faded := false) -> JarButton:
	ing = g
	index = i
	mini = is_mini
	faded = is_faded and not is_mini
	return self


func _ready() -> void:
	theme_type_variation = "Flat"
	focus_mode = Control.FOCUS_NONE
	custom_minimum_size = Vector2(98, 156)
	mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND if not mini else Control.CURSOR_ARROW
	if mini:
		mouse_filter = Control.MOUSE_FILTER_IGNORE
	tooltip_text = "" if mini else (ing.name if faded else "%s, %s %d" % [ing.name, ing.op, ing.v])
	SVG = Vector2(60, Assets.jar_height())
	var f := JAR_W / SVG.x
	_icon = Control.new()
	_icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_icon.size = SVG * f
	_icon.pivot_offset = Vector2(_icon.size.x / 2, _icon.size.y)
	add_child(_icon)
	_jar = TextureRect.new()
	_jar.texture = Assets.tex("jar/" + ing.id)
	_jar.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_jar.stretch_mode = TextureRect.STRETCH_SCALE
	_jar.size = SVG * f
	_jar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_icon.add_child(_jar)
	_cork = TextureRect.new()
	_cork.texture = Assets.tex("cork")
	_cork.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_cork.stretch_mode = TextureRect.STRETCH_SCALE
	var cr := Assets.cork_rect()
	_cork.position = cr.position * f
	_cork.size = cr.size * f
	_cork.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_icon.add_child(_cork)
	var name_l := UI.label(ing.name, UI.body, 17, UI.INK)
	name_l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	name_l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	name_l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	name_l.name = "Name"
	add_child(name_l)
	var tag := PanelContainer.new()
	tag.name = "Tag"
	tag.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var tag_box: StyleBox = UI.tex_box("ui/op_tag_faded" if faded else "ui/op_tag", Vector4(10, 10, 10, 13), Vector4(12, 1, 12, 5))
	if tag_box == null:
		tag_box = UI.box(UI.BG2 if faded else UI.BRASS, 6, Vector4(9, 0, 9, 1))
	tag.add_theme_stylebox_override("panel", tag_box)
	var op := UI.label("?" if faded else "%s%d" % [ing.op, ing.v], UI.legible_black, 19, UI.MUTED if faded else UI.INK_DARK)
	op.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	tag.add_child(op)
	add_child(tag)
	resized.connect(_layout)
	if cell != Vector2.ZERO:
		set_cell(cell)
	_layout()
	if not mini:
		mouse_entered.connect(_hover.bind(true))
		mouse_exited.connect(_hover.bind(false))
		button_down.connect(_press)


## Size the jar for a portrait tray cell. Tall cells show the name under the
## jar; short ones drop it and hang the op tag on the jar's belly.
func set_cell(c: Vector2) -> void:
	cell = c
	if not is_node_ready():
		return
	var n: Label = get_node("Name")
	var op: Label = get_node("Tag").get_child(0)
	if c == Vector2.ZERO:
		custom_minimum_size = Vector2(98, 156)
		_jar_w = JAR_W
		_tag_on_jar = false
		_lit = false
		n.visible = true
		n.add_theme_font_size_override("font_size", 17)
		n.text_overrun_behavior = TextServer.OVERRUN_NO_TRIMMING
		n.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		op.add_theme_font_size_override("font_size", 19)
	else:
		custom_minimum_size = c
		var show_name := c.y >= 138.0 and c.x >= 78.0
		_tag_on_jar = false
		_lit = not mini
		var room := c.y - 6.0 - 20.0 - (20.0 if show_name else 0.0) - (0.0 if _tag_on_jar else 26.0)
		_jar_w = clampf(minf(c.x * 0.66, room * SVG.x / SVG.y), 36.0, 78.0)
		n.visible = show_name
		n.add_theme_font_size_override("font_size", 16)
		n.autowrap_mode = TextServer.AUTOWRAP_OFF
		n.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
		op.add_theme_font_size_override("font_size", 20 if c.x >= 70.0 else 17)
	var f := _jar_w / SVG.x
	_icon.size = SVG * f
	_icon.pivot_offset = Vector2(_icon.size.x / 2, _icon.size.y)
	_jar.size = SVG * f
	var cr := Assets.cork_rect()
	_cork.position = cr.position * f
	_cork.size = cr.size * f
	_layout()


func _layout() -> void:
	var n: Label = get_node("Name")
	var t: Control = get_node("Tag")
	t.reset_size()
	if cell != Vector2.ZERO:
		# portrait cell: plank 20 at the bottom, jar standing on it
		var floor_y := size.y - 20.0
		var name_h := 20.0 if n.visible else 0.0
		var tag_h := 0.0 if _tag_on_jar else t.size.y + 2.0
		_icon.position = Vector2((size.x - _icon.size.x) / 2, floor_y - tag_h - name_h - _icon.size.y)
		n.size = Vector2(size.x - 4, 20)
		n.position = Vector2(2, floor_y - tag_h - name_h)
		if _tag_on_jar:
			t.position = Vector2((size.x - t.size.x) / 2, floor_y - t.size.y - 2)
		else:
			t.position = Vector2((size.x - t.size.x) / 2, floor_y - t.size.y)
		queue_redraw()
		return
	_icon.position = Vector2((size.x - _icon.size.x) / 2, 8)
	n.size = Vector2(size.x - 4, 0)
	n.position = Vector2(2, _icon.position.y + _icon.size.y + 2)
	t.position = Vector2((size.x - t.size.x) / 2, size.y - 26 - t.size.y)
	queue_redraw()


func _draw() -> void:
	# wooden shelf lip under each jar (.jar::after)
	if _plank == null:
		_plank = UI.tex_box("ui/shelf_plank", Vector4(8, 0, 8, 0), Vector4.ZERO)
	if cell != Vector2.ZERO:
		if _lit:
			# candle-lit niche: a warm pool of light behind each jar
			var c := Vector2(size.x / 2, _icon.position.y + _icon.size.y * 0.55)
			var hs := Vector2(size.x * 1.15, _icon.size.y * 1.5)
			draw_texture_rect(UI.halo_texture(), Rect2(c - hs / 2, hs), false, Color(1, 1, 1, 0.9))
		if _plank:
			draw_style_box(_plank, Rect2(0, size.y - 22, size.x, 22))
		return
	if _plank:
		draw_style_box(_plank, Rect2(0, size.y - 22, size.x, 22))
		return
	var r := Rect2(0, size.y - 10, size.x, 10)
	draw_rect(Rect2(r.position, Vector2(r.size.x, 4)), UI.WOOD_HI)
	draw_rect(Rect2(r.position + Vector2(0, 4), Vector2(r.size.x, 6)), UI.WOOD)


func _hover(on: bool) -> void:
	if Settings.reduced_motion or cell != Vector2.ZERO:
		return
	var tw := create_tween().set_parallel().set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.tween_property(_icon, "position:y", 4.0 - (5.0 if on else 0.0), 0.15)
	tw.tween_property(_icon, "rotation", deg_to_rad(-3.0) if on else 0.0, 0.15)


func _press() -> void:
	if Settings.reduced_motion:
		return
	var tw := create_tween().set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.tween_property(_icon, "scale", Vector2(1.08, 0.9), 0.06)
	tw.tween_property(_icon, "scale", Vector2.ONE, 0.2)


## Wrong ingredient: wobble the jar (.jar.shake).
func shake() -> void:
	if Settings.reduced_motion:
		return
	var tw := create_tween()
	for k in [[-5.0, -6.0], [5.0, 6.0], [-3.0, -3.0], [0.0, 0.0]]:
		tw.tween_property(_icon, "position:x", (size.x - _icon.size.x) / 2 + k[0], 0.08)
		tw.parallel().tween_property(_icon, "rotation", deg_to_rad(k[1]), 0.08)


func jar_global_rect() -> Rect2:
	return Rect2(_jar.global_position, _jar.size * _icon.scale)


func hold_icon() -> void:
	_out += 1
	_icon.modulate.a = 0.0


func release_icon() -> void:
	_out -= 1
	if _out <= 0:
		_out = 0
		_icon.modulate.a = 1.0
		if not Settings.reduced_motion:
			_icon.scale = Vector2(1.1, 0.9)
			create_tween().set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT).tween_property(_icon, "scale", Vector2.ONE, 0.2)
