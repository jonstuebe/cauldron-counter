extends Node
## Autoload "Settings": reduced motion and best purse, persisted to user://.
## On the web, reduced motion defaults to the browser's prefers-reduced-motion
## (the web game's only motion setting); the header toggle overrides it.

signal reduced_motion_changed(on: bool)

const PATH := "user://settings.cfg"

var reduced_motion := false
var best := 0
var _cfg := ConfigFile.new()


func _ready() -> void:
	var has_file := _cfg.load(PATH) == OK
	best = int(_cfg.get_value("game", "best", 0))
	if has_file and _cfg.has_section_key("ui", "reduced_motion"):
		reduced_motion = bool(_cfg.get_value("ui", "reduced_motion"))
	elif OS.has_feature("web"):
		var r = JavaScriptBridge.eval("window.matchMedia('(prefers-reduced-motion: reduce)').matches", true)
		reduced_motion = bool(r)
	if "--reduced-motion" in OS.get_cmdline_user_args():
		reduced_motion = true


func set_reduced_motion(on: bool) -> void:
	reduced_motion = on
	_cfg.set_value("ui", "reduced_motion", on)
	_cfg.save(PATH)
	reduced_motion_changed.emit(on)


func record_best(coins: int) -> void:
	if coins > best and not Capture.active:
		best = coins
		_cfg.set_value("game", "best", best)
		_cfg.save(PATH)
