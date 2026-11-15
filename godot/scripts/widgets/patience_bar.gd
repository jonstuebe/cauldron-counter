class_name PatienceBar
extends Control
## Thin patience / speed-bonus bar (.patience). Colour eases between states.

var fill := 1.0:
	set(v):
		fill = clampf(v, 0.0, 1.0)
		queue_redraw()
var target_color := UI.GLOW
var _color := UI.GLOW


var _frame: StyleBox
var _fill: StyleBox


func _ready() -> void:
	_frame = UI.tex_box("ui/bar_frame", Vector4(7, 0, 7, 0), Vector4.ZERO)
	_fill = UI.tex_box("ui/bar_fill", Vector4(4, 0, 4, 0), Vector4.ZERO)
	custom_minimum_size = Vector2(0, 14 if _frame else 8)
	size_flags_vertical = Control.SIZE_SHRINK_CENTER


func _process(delta: float) -> void:
	if _color != target_color:
		_color = _color.lerp(target_color, minf(1.0, delta * 8.0))
		if _color.is_equal_approx(target_color):
			_color = target_color
		queue_redraw()


func _draw() -> void:
	if _frame and _fill:
		draw_style_box(_frame, Rect2(Vector2.ZERO, size))
		if fill > 0.0:
			var w := maxf(8.0, (size.x - 6) * fill)
			_fill.modulate_color = _color
			draw_style_box(_fill, Rect2(3, 3, w, size.y - 6))
		return
	draw_style_box(UI.box(UI.BG2, 4, Vector4.ZERO), Rect2(Vector2.ZERO, size))
	if fill > 0.0:
		draw_style_box(UI.box(_color, 4, Vector4.ZERO), Rect2(Vector2.ZERO, Vector2(maxf(8.0, size.x * fill), size.y)))
