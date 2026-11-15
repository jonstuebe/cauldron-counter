extends Control
## Boot / preloader. Requests the game scene and every texture, font and
## shader with ResourceLoader.load_threaded_request and shows the real progress
## on the cauldron's strength plate and the bar, then dissolves into the game.
## Layout follows art/preview/preloader_mockup.png (art/MANIFEST.md): the shop
## darkened behind, the cauldron, eyebrow, wordmark, bar, status and a quote.
## Only the few textures this screen shows load synchronously, first.
##
## On the web, web/shell.html (tools/make_shell.mjs) draws this same screen in
## HTML while the engine downloads (0-70%). This scene then starts from that
## state (progress, quote, shimmer clock) without fading the words in again,
## and calls ccBoot.handoff() once its first frame is up, so the HTML overlay
## fades out over an identical picture.

const GAME_SCENE := "res://scenes/game.tscn"
const MIN_TIME := 1.1          # long enough to read; skipped with reduced motion
const STATUS := ["Lighting the fire", "Stoking the fire", "Sorting the jars", "Grinding bone dust", "Polishing the counter", "Opening the shutters"]

var shown_progress := 0.0      # what the bar shows (eases toward real progress)
var real_progress := 0.0
var _paths: Array[String] = []
var _elapsed := 0.0
var _done := false
var _pct_shown := -1
var _pct_first := true         # set the first colour at once (no tween from broth)
var _backdrop: Control
var _halo: TextureRect
var _pot: CauldronView
var _eyebrow: Label
var _title: Label
var _status_row: HBoxContainer
var _status: Label
var _pct: Label
var _quote: Label
var _frame: StyleBox
var _fill: StyleBox
var _spark: Texture2D
var _bar: Control
var _handoff := false
var _frames := 0
var _cy := 360.0
var _hold := false             # ?holdboot (tests): stay at the hand-off until window.ccBootRelease
var _since_html := -1.0        # seconds since the hand-off (-1: no HTML preloader)
const HTML_TAIL := 0.8         # the last stretch eases in at least this long after it
var _base := 0.0               # progress the HTML preloader already showed


func _ready() -> void:
	set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	_paths.append(GAME_SCENE)
	_paths.append_array(Assets.all_paths())
	for p in _paths:
		var err := ResourceLoader.load_threaded_request(p, "", true)
		if err != OK:
			push_error("Could not request %s (%d)" % [p, err])
	UI.load_fonts()

	if Backdrop.available():
		_backdrop = Backdrop.new()
		_backdrop.dim = 0.3
		_backdrop.modulate = Color(0.62, 0.6, 0.7)
		add_child(_backdrop)
	_halo = TextureRect.new()
	_halo.texture = UI.halo_texture()
	_halo.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_halo.mouse_filter = MOUSE_FILTER_IGNORE
	add_child(_halo)
	_pot = CauldronView.new()
	_pot.fixed_k = 0.8
	_pot.set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	add_child(_pot)
	_bar = Control.new()
	_bar.set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	_bar.mouse_filter = MOUSE_FILTER_IGNORE
	_bar.draw.connect(_draw_bar)
	add_child(_bar)

	var track := FontVariation.new()
	track.base_font = UI.extrabold
	track.spacing_glyph = 6
	_eyebrow = _centered(UI.label("A POTION STALL", track, 14, UI.BRASS))
	_title = _centered(UI.label("Cauldron Counter", UI.display, 76, UI.INK))
	_title.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.55))
	_title.add_theme_constant_override("shadow_offset_y", 4)
	_title.add_theme_constant_override("shadow_offset_x", 0)
	_status_row = HBoxContainer.new()
	_status_row.alignment = BoxContainer.ALIGNMENT_CENTER
	_status_row.add_theme_constant_override("separation", 6)
	_status = UI.label("", UI.legible, 19, UI.MUTED)
	_pct = UI.label("0%", UI.legible_black, 19, UI.INK)
	_status_row.add_child(_status)
	_status_row.add_child(_pct)
	add_child(_status_row)
	var tmpl: String = GameData.LINES[randi() % GameData.LINES.size()]
	var quote := "“%s”" % GameData.line(tmpl, randi_range(6, 18))
	var html := _html_state()
	if not html.is_empty():
		_handoff = true
		quote = str(html.get("quote", quote))
		shown_progress = clampf(float(html.get("p", 0.0)), 0.0, 0.95)
		_base = shown_progress
		_elapsed = maxf(float(html.get("t", 0.0)), MIN_TIME)
		_hold = str(JavaScriptBridge.eval("window.location.search", true)).contains("holdboot")
		print("Boot: continuing the HTML preloader at %d%%" % roundi(shown_progress * 100))
	_quote = _centered(UI.label(quote, UI.display_italic, 22, Color(UI.MUTED, 0.85)))
	_quote.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART

	_frame = UI.tex_box("ui/progress_frame", Vector4(20, 0, 20, 0), Vector4.ZERO)
	_fill = UI.tex_box("ui/progress_fill", Vector4(12, 0, 12, 0), Vector4.ZERO)
	if _fill:
		_fill.modulate_color = UI.GLOW
	_spark = Assets.tex("particles/sparkle_white") if Assets.has("particles/sparkle_white") else null

	resized.connect(_layout)
	Screen.changed.connect(_layout)
	_layout.call_deferred()
	if _handoff:
		return
	# fade the words in, a beat apart
	var i := 0
	for n: CanvasItem in [_eyebrow, _title, _status_row, _quote]:
		n.modulate.a = 0.0
		var tw := create_tween()
		tw.tween_interval(0.0 if Settings.reduced_motion else 0.08 * i)
		tw.tween_property(n, "modulate:a", 1.0, 0.05 if Settings.reduced_motion else 0.4)
		i += 1


## The HTML preloader's state ({p, quote, t}), or {} when there is none.
func _html_state() -> Dictionary:
	if not OS.has_feature("web"):
		return {}
	var js = JavaScriptBridge.eval("window.ccBoot ? JSON.stringify(window.ccBoot.state()) : ''", true)
	if typeof(js) != TYPE_STRING or str(js) == "":
		return {}
	var d = JSON.parse_string(str(js))
	return d if d is Dictionary else {}


## Once this screen has drawn a frame, fade the HTML preloader out over it.
## (Called from _process, so it happens even if loading is already done.)
func _reveal() -> void:
	_handoff = false
	_since_html = 0.0
	JavaScriptBridge.eval("window.ccBoot && window.ccBoot.handoff()", true)
	print("Boot: handed off from the HTML preloader")


func _centered(l: Label) -> Label:
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(l)
	return l


func _layout() -> void:
	# centre of the safe area (notch / home indicator)
	var c := Vector2(size.x / 2, (Screen.safe.y + size.y - Screen.safe.w) / 2)
	_cy = c.y
	# 1280x720 mock-up positions, relative to the centre (640, 360). Portrait
	# (400 wide canvas) keeps them and only shrinks the wordmark and quote;
	# web/shell.html mirrors all of this.
	var portrait := Screen.portrait
	_pot.place(Vector2(c.x, c.y - 39), 0.8)
	var hs := Vector2(900, 700)
	_halo.size = hs
	_halo.position = Vector2(c.x, c.y + 20) - hs / 2
	_eyebrow.size = Vector2(size.x, 20)
	_eyebrow.position = Vector2(0, c.y - 6)
	var ts := 46 if portrait else 76
	if _title.get_theme_font_size("font_size") != ts:
		_title.add_theme_font_size_override("font_size", ts)
		_quote.add_theme_font_size_override("font_size", 19 if portrait else 22)
		# labels only shrink to a new font size after their theme cache updates
		_title.size = Vector2.ZERO
		_quote.size = Vector2.ZERO
		_layout.call_deferred()
	_title.size = Vector2(size.x, 96)
	_title.position = Vector2(0, c.y + 4 + (17 if portrait else 0))
	_status_row.size = Vector2(size.x, 28)
	_status_row.position = Vector2(0, c.y + 186)
	_quote.size = Vector2(minf(size.x - 32, 900), 60)
	_quote.position = Vector2((size.x - _quote.size.x) / 2, c.y + 276)


func _bar_rect() -> Rect2:
	var bw := minf(480.0, size.x - 48)
	return Rect2(size.x / 2 - bw / 2, _cy + 132, bw, 40)


func _process(delta: float) -> void:
	_elapsed += delta
	_frames += 1
	if _handoff and _frames >= 3:
		_reveal()
	if not _done:
		var sum := 0.0
		var all_loaded := true
		for p in _paths:
			var prog := []
			var st := ResourceLoader.load_threaded_get_status(p, prog)
			match st:
				ResourceLoader.THREAD_LOAD_LOADED:
					sum += 1.0
				ResourceLoader.THREAD_LOAD_IN_PROGRESS:
					sum += float(prog[0]) if prog.size() > 0 else 0.0
					all_loaded = false
				_:
					push_error("Failed to load %s" % p)
					sum += 1.0
		real_progress = _base + (1.0 - _base) * sum / _paths.size()
		# Ease toward the real value, but never faster than MIN_TIME allows.
		var cap := 1.0 if Settings.reduced_motion else clampf(_elapsed / MIN_TIME, 0.0, 1.0)
		if _hold:
			_hold = not bool(JavaScriptBridge.eval("!!window.ccBootRelease", true))
			if not _hold:
				_since_html = 0.0
		if _hold:
			cap = _base
		elif _since_html >= 0.0 and not Settings.reduced_motion:
			# while the HTML overlay fades (0.35 s), then on to 100%
			_since_html += delta
			cap = _base + (1.0 - _base) * clampf((_since_html - 0.25) / HTML_TAIL, 0.0, 1.0)
		elif _handoff:
			cap = _base
		shown_progress = move_toward(shown_progress, minf(real_progress, cap), delta * 2.2)
		if Settings.reduced_motion:
			shown_progress = minf(real_progress, cap)
		if all_loaded and shown_progress >= 0.999 and not _handoff:
			_done = true
			_finish()
	var pct := roundi(shown_progress * 100)
	if pct != _pct_shown:
		_pct_shown = pct
		_status.text = STATUS[mini(int(shown_progress * STATUS.size()), STATUS.size() - 1)] + "…"
		_pct.text = "%d%%" % pct
		_pot.set_number(pct)
		# the brew turns from broth to mint as the shop gets ready
		_pot.show_color(UI.BROTH.lerp(UI.GLOW, shown_progress), shown_progress, true, 0.0 if _pct_first else -1.0)
		_pct_first = false
	_bar.queue_redraw()


func _draw_bar() -> void:
	var bar := _bar_rect()
	var inner := Rect2(bar.position + Vector2(8, 7), Vector2(bar.size.x - 16, 26))
	var w := maxf(24.0, inner.size.x * shown_progress)
	if _frame and _fill:
		_bar.draw_style_box(_frame, bar)
		if shown_progress > 0.01:
			_bar.draw_style_box(_fill, Rect2(inner.position, Vector2(w, inner.size.y)))
	else:
		_bar.draw_style_box(UI.box(UI.BG2, 10, Vector4.ZERO), bar)
		if shown_progress > 0.01:
			_bar.draw_style_box(UI.box(UI.GLOW, 10, Vector4.ZERO), Rect2(inner.position, Vector2(w, inner.size.y)))
	if shown_progress > 0.01:
		# shimmer travelling along the fill
		if not Settings.reduced_motion:
			var sx := fmod(_elapsed * 260.0, inner.size.x + 80) - 40
			if sx < w - 6:
				var x0 := maxf(6.0, sx)
				_bar.draw_rect(Rect2(inner.position + Vector2(x0, 5), Vector2(minf(30, w - 6 - x0), 4)), Color(1, 1, 1, 0.3))
		if _spark:
			var s := 22.0 + (0.0 if Settings.reduced_motion else 4.0 * sin(_elapsed * 9.0))
			var p := Vector2(inner.position.x + w - 4, inner.position.y + 2)
			_bar.draw_texture_rect(_spark, Rect2(p - Vector2(s, s) / 2, Vector2(s, s)), false, Color(1, 0.93, 0.78))


func _finish() -> void:
	var scene: PackedScene = ResourceLoader.load_threaded_get(GAME_SCENE)
	for key in Assets.keys():
		var res := ResourceLoader.load_threaded_get(Assets.path(key))
		Assets.prime(key, res)
	var game := scene.instantiate()
	await get_tree().process_frame
	await _transition_to(game)


## Dissolve: snapshot this screen, swap the game in underneath, burn the snapshot away.
func _transition_to(game: Node) -> void:
	var tree := get_tree()
	var layer := CanvasLayer.new()
	layer.layer = 100
	var cover: CanvasItem
	var img: Image = null
	if DisplayServer.get_name() != "headless":
		img = get_viewport().get_texture().get_image()
	if img and not img.is_empty():
		var tr := TextureRect.new()
		tr.texture = ImageTexture.create_from_image(img)
		# the snapshot is in window pixels (DPR x canvas); never let it set the size
		tr.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		tr.set_anchors_and_offsets_preset(PRESET_FULL_RECT)
		tr.stretch_mode = TextureRect.STRETCH_SCALE
		var mat := ShaderMaterial.new()
		mat.shader = load("res://shaders/dissolve.gdshader")
		tr.material = mat
		cover = tr
	else:
		var cr := ColorRect.new()
		cr.color = UI.BG
		cr.set_anchors_and_offsets_preset(PRESET_FULL_RECT)
		cover = cr
	cover.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.add_child(cover)
	tree.root.add_child(layer)
	tree.root.add_child(game)
	tree.current_scene = game
	visible = false
	var tw := layer.create_tween()
	var dur := 0.05 if Settings.reduced_motion else 0.6
	if cover.material:
		var mat: ShaderMaterial = cover.material
		mat.set_shader_parameter("progress", 0.0)
		tw.tween_method(func(x: float): mat.set_shader_parameter("progress", x), 0.0, 1.0, dur).set_ease(Tween.EASE_IN_OUT).set_trans(Tween.TRANS_SINE)
	else:
		tw.tween_property(cover, "modulate:a", 0.0, dur)
	tw.tween_callback(layer.queue_free)
	queue_free()
