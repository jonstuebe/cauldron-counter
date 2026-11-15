class_name ColorDot
extends Control
## The little colour swatch inside a recipe chip.

var color := Color.WHITE


func _ready() -> void:
	custom_minimum_size = Vector2(16, 16)
	size_flags_vertical = Control.SIZE_SHRINK_CENTER


func _draw() -> void:
	var t := Assets.tex("ui/chip_dot")
	if t:
		draw_texture_rect(t, Rect2(Vector2.ZERO, size), false, color)
		return
	draw_circle(size / 2, 7, color, true, -1.0, true)
