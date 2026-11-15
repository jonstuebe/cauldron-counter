extends SceneTree
## Rasterises the cauldron icon into the boot splash PNG:
##   godot --headless --path godot -s tools/make_splash.gd
func _init() -> void:
	var svg := FileAccess.get_file_as_string("res://assets/gen/icon.svg")
	var img := Image.new()
	var err := img.load_svg_from_string(svg, 1.0)
	if err != OK:
		printerr("svg load failed: ", err)
		quit(1)
		return
	img.save_png("res://assets/splash.png")
	print("wrote res://assets/splash.png ", img.get_size())
	quit()
