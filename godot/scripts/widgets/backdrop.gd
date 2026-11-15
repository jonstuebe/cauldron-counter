class_name Backdrop
extends Control
## The shop interior from art/background: six 1600x900 layers centred on the
## 1280x720 design viewport (placed at -160,-90) and scaled to cover wider or
## taller windows. The layers hold still (no pointer parallax); only the
## window glow flickers.

const LAYERS := [
	["background/bg_back", 0.15, false],
	["background/bg_glow", 0.15, true],
	["background/bg_shelves", 0.3, false],
	["background/bg_mid", 0.5, false],
	["background/bg_counter", 1.0, false],
]
const SIZE := Vector2(1600, 900)

var bg_scale := 1.0
var dim := 1.0                 # the preloader shows the room darkened
var _rects: Array[TextureRect] = []
var _factors: Array[float] = []
var _vignette: TextureRect
var _glow: TextureRect
var _t := 0.0
## Portrait: when focus_scale > 0, layer point focus_layer sits on canvas point
## focus_canvas at that scale (instead of covering the window, centred).
var focus_scale := 0.0
var focus_layer := Vector2.ZERO
var focus_canvas := Vector2.ZERO


static func available() -> bool:
	return Assets.has("background/bg_back")


func _ready() -> void:
	set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	mouse_filter = MOUSE_FILTER_IGNORE
	for l in LAYERS:
		var t := Assets.tex(l[0])
		if t == null:
			continue
		var r := TextureRect.new()
		r.texture = t
		r.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		r.stretch_mode = TextureRect.STRETCH_SCALE
		r.mouse_filter = MOUSE_FILTER_IGNORE
		if l[2]:
			var m := CanvasItemMaterial.new()
			m.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
			r.material = m
			_glow = r
		add_child(r)
		_rects.append(r)
		_factors.append(l[1])
	if Assets.has("background/bg_vignette"):
		_vignette = TextureRect.new()
		_vignette.texture = Assets.tex("background/bg_vignette")
		_vignette.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		_vignette.stretch_mode = TextureRect.STRETCH_SCALE
		_vignette.set_anchors_and_offsets_preset(PRESET_FULL_RECT)
		_vignette.mouse_filter = MOUSE_FILTER_IGNORE
		add_child(_vignette)
	resized.connect(_layout)
	_layout()


func _layout() -> void:
	var origin := _origin()
	for i in _rects.size():
		_rects[i].position = origin
		_rects[i].size = SIZE * bg_scale
		_rects[i].modulate = Color(dim, dim, dim, 1) if _rects[i] != _glow else _rects[i].modulate


func _origin() -> Vector2:
	if focus_scale > 0.0:
		bg_scale = maxf(focus_scale, size.x / SIZE.x)
		return focus_canvas - global_position - focus_layer * bg_scale
	bg_scale = maxf(1.0, maxf(size.x / SIZE.x, size.y / SIZE.y))
	return size / 2 - SIZE / 2 * bg_scale


## Pin a layer point to a canvas point at a given scale (portrait framing);
## scale 0 goes back to covering the window.
func set_focus(layer_point: Vector2, canvas_point: Vector2, s: float) -> void:
	focus_layer = layer_point
	focus_canvas = canvas_point
	focus_scale = s
	_layout()


## A point on the 1600x900 layer -> canvas position (counter layer, no drift).
func layer_to_canvas(p: Vector2) -> Vector2:
	var o := _origin()
	return global_position + o + p * bg_scale


func _process(delta: float) -> void:
	_t += delta
	if _glow:
		var a := 0.85 + 0.15 * sin(_t * 5.3) * sin(_t * 2.1) if not Settings.reduced_motion else 0.9
		_glow.modulate = Color(1, 1, 1, a * dim)
