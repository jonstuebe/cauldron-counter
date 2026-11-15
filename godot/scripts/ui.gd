class_name UI
extends RefCounted
## Palette (dark theme of src/style.css), fonts, theme and small widget helpers.

const BG := Color("#1e1830")
const BG2 := Color("#2a2142")
const INK := Color("#efe7d6")
const MUTED := Color("#a99fbd")
const PANEL := Color("#2f2749")
const BRASS := Color("#d4ad55")
const BRASS_HI := Color("#f0cb73")
const IRON := Color("#120e1a")
const IRON_HI := Color("#2c2538")
const GLOW := Color("#6fe0bd")
const DANGER := Color("#ef7a64")
const WOOD := Color("#4f3624")
const WOOD_HI := Color("#6d4c33")
const BROTH := Color("#2b2535")
const HALO := Color(240 / 255.0, 160 / 255.0, 80 / 255.0, 0.22)
const PLATE_INK := Color("#1e1830")
const SCRIM := Color(20 / 255.0, 15 / 255.0, 30 / 255.0, 0.62)

static var _halo: GradientTexture2D
static var display: Font
static var body: Font
static var bold: Font
static var legible: Font
static var legible_bold: Font
static var legible_black: Font
static var extrabold: Font
static var display_italic: Font
const INK_DARK := Color("#1e1628")


static func load_fonts() -> void:
	if display:
		return
	display = load(Assets.font_path("display"))
	display_italic = load(Assets.font_path("display_italic"))
	body = load(Assets.font_path("body"))
	bold = load(Assets.font_path("bold"))
	extrabold = load(Assets.font_path("extrabold"))
	var base: Font = load(Assets.font_path("legible"))
	legible = _weight(base, 500)
	legible_bold = _weight(base, 700)
	legible_black = _weight(base, 800)


static func _weight(base: Font, w: int) -> FontVariation:
	var f := FontVariation.new()
	f.base_font = base
	f.variation_opentype = {TextServerManager.get_primary_interface().name_to_tag("wght"): w}
	return f


## Soft radial glow (radial-gradient(var(--halo), transparent 70%)).
static func halo_texture() -> GradientTexture2D:
	if _halo == null:
		var g := Gradient.new()
		g.set_color(0, HALO)
		g.set_color(1, Color(HALO, 0.0))
		g.add_point(0.45, Color(HALO, HALO.a * 0.55))
		_halo = GradientTexture2D.new()
		_halo.gradient = g
		_halo.fill = GradientTexture2D.FILL_RADIAL
		_halo.fill_from = Vector2(0.5, 0.5)
		_halo.fill_to = Vector2(0.5, 0.0)
		_halo.width = 256
		_halo.height = 256
	return _halo


static func free_statics() -> void:
	_halo = null
	extrabold = null
	display_italic = null
	display = null
	body = null
	bold = null
	legible = null
	legible_bold = null
	legible_black = null


## 9-slice StyleBoxTexture from an art key, or null when the art is missing.
static func tex_box(key: String, slice: Vector4, pad: Vector4) -> StyleBoxTexture:
	var t := Assets.tex(key)
	if t == null:
		return null
	var s := StyleBoxTexture.new()
	s.texture = t
	s.texture_margin_left = slice.x
	s.texture_margin_top = slice.y
	s.texture_margin_right = slice.z
	s.texture_margin_bottom = slice.w
	s.content_margin_left = pad.x
	s.content_margin_top = pad.y
	s.content_margin_right = pad.z
	s.content_margin_bottom = pad.w
	return s


static func box(color: Color, radius := 12, pad := Vector4(12, 10, 12, 10)) -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = color
	s.set_corner_radius_all(radius)
	s.content_margin_left = pad.x
	s.content_margin_top = pad.y
	s.content_margin_right = pad.z
	s.content_margin_bottom = pad.w
	s.anti_aliasing = true
	return s


static func make_theme() -> Theme:
	load_fonts()
	var t := Theme.new()
	t.default_font = body
	t.default_font_size = 20
	t.set_color("font_color", "Label", INK)
	# Buttons: panel-coloured pills, like .btn
	for state in ["normal", "hover", "pressed", "focus", "disabled"]:
		var c := PANEL
		if state == "hover":
			c = PANEL.lightened(0.08)
		elif state == "pressed":
			c = PANEL.darkened(0.15)
		var sb := box(c, 14, Vector4(16, 12, 16, 12))
		if state == "focus":
			sb.draw_center = false
			sb.border_color = BRASS_HI
			sb.set_border_width_all(3)
			sb.expand_margin_left = 3
			sb.expand_margin_right = 3
			sb.expand_margin_top = 3
			sb.expand_margin_bottom = 3
		t.set_stylebox(state, "Button", sb)
	t.set_font("font", "Button", bold)
	t.set_font_size("font_size", "Button", 20)
	for k in ["font_color", "font_hover_color", "font_pressed_color", "font_focus_color", "font_hover_pressed_color"]:
		t.set_color(k, "Button", INK)
	t.set_color("font_disabled_color", "Button", MUTED)
	# Primary button variation (.btn.primary): ink on bg, brass when lit.
	t.set_type_variation("Primary", "Button")
	t.set_stylebox("normal", "Primary", box(INK, 14, Vector4(18, 12, 18, 12)))
	t.set_stylebox("hover", "Primary", box(INK.lightened(0.1), 14, Vector4(18, 12, 18, 12)))
	t.set_stylebox("pressed", "Primary", box(INK.darkened(0.12), 14, Vector4(18, 12, 18, 12)))
	for k in ["font_color", "font_hover_color", "font_pressed_color", "font_focus_color", "font_hover_pressed_color"]:
		t.set_color(k, "Primary", BG)
	t.set_font_size("font_size", "Primary", 22)
	t.set_type_variation("Lit", "Button")
	t.set_stylebox("normal", "Lit", box(BRASS, 14, Vector4(18, 12, 18, 12)))
	t.set_stylebox("hover", "Lit", box(BRASS_HI, 14, Vector4(18, 12, 18, 12)))
	t.set_stylebox("pressed", "Lit", box(BRASS.darkened(0.12), 14, Vector4(18, 12, 18, 12)))
	for k in ["font_color", "font_hover_color", "font_pressed_color", "font_focus_color", "font_hover_pressed_color"]:
		t.set_color(k, "Lit", PLATE_INK)
	t.set_font_size("font_size", "Lit", 22)
	# Flat button for jars / header toggle
	var flat := StyleBoxEmpty.new()
	t.set_type_variation("Flat", "Button")
	for state in ["normal", "hover", "pressed", "disabled"]:
		t.set_stylebox(state, "Flat", flat)
	t.set_stylebox("focus", "Flat", box(Color(0, 0, 0, 0), 12))
	(t.get_stylebox("focus", "Flat") as StyleBoxFlat).border_color = BRASS_HI
	(t.get_stylebox("focus", "Flat") as StyleBoxFlat).set_border_width_all(3)
	(t.get_stylebox("focus", "Flat") as StyleBoxFlat).draw_center = false
	t.set_stylebox("panel", "PanelContainer", box(PANEL, 16))
	if Assets.art():
		_art_theme(t)
	t.set_color("default_color", "RichTextLabel", INK)
	t.set_font("normal_font", "RichTextLabel", body)
	t.set_font("bold_font", "RichTextLabel", bold)
	t.set_font_size("normal_font_size", "RichTextLabel", 21)
	t.set_font_size("bold_font_size", "RichTextLabel", 21)
	return t


## Swap in the art UI kit: plum/parchment/brass buttons and panels.
static func _art_theme(t: Theme) -> void:
	var fam := {"Button": ["secondary", INK], "Primary": ["primary", INK_DARK], "Lit": ["ready", INK_DARK]}
	for type in fam:
		var f: Array = fam[type]
		for state in ["normal", "hover", "pressed", "disabled"]:
			var top := 15 if state == "pressed" else 10
			var sb := tex_box("ui/button_%s_%s" % [f[0], state], Vector4(22, 22, 22, 30), Vector4(18, top, 18, 28 - top))
			if sb:
				t.set_stylebox(state, type, sb)
		for k in ["font_color", "font_hover_color", "font_pressed_color", "font_focus_color", "font_hover_pressed_color"]:
			t.set_color(k, type, f[1])
		t.set_font("font", type, bold)
	var panel := tex_box("ui/panel_dark", Vector4(28, 28, 28, 28), Vector4(18, 14, 18, 14))
	if panel:
		t.set_stylebox("panel", "PanelContainer", panel)


static func label(text: String, font: Font = null, size := 20, color := INK) -> Label:
	var l := Label.new()
	l.text = text
	if font:
		l.add_theme_font_override("font", font)
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	return l


## Hover lift + press squash on any button (respects reduced motion).
static func juice(b: Control, hover_scale := 1.04) -> void:
	var host := b
	var set_pivot := func(): host.pivot_offset = host.size / 2
	b.resized.connect(set_pivot)
	set_pivot.call()
	var to := func(s: float, d: float):
		if Settings.reduced_motion:
			host.scale = Vector2.ONE
			return
		var tw := host.create_tween().set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
		tw.tween_property(host, "scale", Vector2(s, s), d)
	b.mouse_entered.connect(func(): to.call(hover_scale, 0.15))
	b.mouse_exited.connect(func(): to.call(1.0, 0.15))
	if b is BaseButton:
		b.button_down.connect(func(): to.call(0.94, 0.08))
		b.button_up.connect(func(): to.call(hover_scale if b.is_hovered() else 1.0, 0.18))


static func cubic_bezier(t: float, p1: Vector2, c1: Vector2, c2: Vector2, p2: Vector2) -> Vector2:
	var u := 1.0 - t
	return u * u * u * p1 + 3 * u * u * t * c1 + 3 * u * t * t * c2 + t * t * t * p2


static func quad_bezier(t: float, a: Vector2, c: Vector2, b: Vector2) -> Vector2:
	var u := 1.0 - t
	return u * u * a + 2 * u * t * c + t * t * b
