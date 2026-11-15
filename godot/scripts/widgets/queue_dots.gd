class_name QueueDots
extends Control
## Five dots for customers still waiting today (.queue).

var waiting := 0:
	set(v):
		waiting = v
		queue_redraw()


func _ready() -> void:
	custom_minimum_size = Vector2(Logic.PER_DAY * 20, 18)
	tooltip_text = "Customers waiting"


func _draw() -> void:
	var on_t := Assets.tex("ui/queue_dot_on")
	var off_t := Assets.tex("ui/queue_dot_off")
	if on_t and off_t:
		for i in Logic.PER_DAY:
			draw_texture_rect(on_t if i < waiting else off_t, Rect2(i * 20, size.y / 2 - 8, 16, 16), false)
		return
	for i in Logic.PER_DAY:
		var on := i < waiting
		draw_circle(Vector2(5 + i * 14, size.y / 2), 4.5, UI.INK if on else Color(UI.MUTED, 0.45), true, -1.0, true)
