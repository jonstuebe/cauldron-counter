extends Node
## Autoload "Capture": scripted autoplay for screenshots and the gameplay movie.
## Inactive unless a user arg is passed after `--`:
##   godot --path godot -- --capture [--shots=/abs/dir]     # PNGs, then quit
##   godot --path godot --write-movie out.avi --fixed-fps 60 -- --demo
## It plays the boot scene, the day-1 card, two correct orders, one miss and a
## recovery, saving PNGs of the preloader, title, mid-brew, success and fail.

var active := false
var shots_dir := "res://screenshots"
var _tree: SceneTree
var start_day := 1


func _ready() -> void:
	var args := OS.get_cmdline_user_args()
	active = "--capture" in args or "--demo" in args
	if OS.has_feature("web"):
		# Web build: autoplay with ?demo=1 (or ?capture=1) in the page URL.
		var q := str(JavaScriptBridge.eval("window.location.search", true))
		active = active or q.contains("demo=1") or q.contains("capture=1")
		# ?day=N starts the autoplay on day N (e.g. to see a full tray)
		var m := RegEx.create_from_string("[?&]day=(\\d+)").search(q)
		if m:
			start_day = int(m.get_string(1))
	for a in args:
		if a.begins_with("--shots="):
			shots_dir = a.substr(8)
	if not active:
		return
	_tree = get_tree()
	process_mode = Node.PROCESS_MODE_ALWAYS
	_run()


func _until(cond: Callable, timeout := 20.0) -> bool:
	var t0 := Time.get_ticks_msec()
	while not cond.call():
		await _tree.process_frame
		if (Time.get_ticks_msec() - t0) / 1000.0 > timeout:
			push_error("Capture: timed out waiting")
			return false
	return true


func _sleep(sec: float) -> void:
	await _tree.create_timer(sec).timeout


func _shot(name: String) -> void:
	if OS.has_feature("web"):
		# The browser driver (tools/web_capture.mjs) screenshots the page on this line.
		print("Capture: shot ", name)
		await _tree.process_frame
		return
	if DisplayServer.get_name() == "headless":
		print("Capture: (headless, skipped) ", name)
		return
	await RenderingServer.frame_post_draw
	var img := get_viewport().get_texture().get_image()
	if img == null or img.is_empty():
		push_warning("Capture: empty frame for %s" % name)
		return
	var dir := ProjectSettings.globalize_path(shots_dir)
	DirAccess.make_dir_recursive_absolute(dir)
	var path := dir.path_join(name + ".png")
	img.save_png(path)
	print("Capture: saved ", path)


func _scene_is(suffix: String) -> bool:
	var s := _tree.current_scene
	return s != null and s.scene_file_path.ends_with(suffix)


func _run() -> void:
	await _until(func(): return _scene_is("boot.tscn"))
	await _until(func(): return _tree.current_scene.shown_progress >= 0.45 or not _scene_is("boot.tscn"))
	await _shot("01_preloader")
	await _until(func(): return _scene_is("game.tscn"))
	var game: Node = _tree.current_scene
	if start_day > 1:
		await _sleep(0.3)
		game.jump_to_day(start_day)
	await _sleep(2.4)   # the boot dissolve and the card's fade-in have finished
	await _shot("02_title")
	game.dismiss_card()
	await _sleep(1.0)

	# Order 1: correct, with a mid-brew shot while a jar is pouring.
	await _brew(game, game.solution(), "03_mid_brew")
	await _serve(game, "04_success", 0.45)
	await _sleep(2.0)

	# Order 2: a miss first (wrong strength), then the right brew.
	var target: int = game.current_target()
	await _brew(game, [3] if target != 10 else [2], "")
	await _serve(game, "05_fail", 0.38)
	await _sleep(1.6)
	await _brew(game, game.solution(), "")
	await _serve(game, "", 0.0)
	await _sleep(2.2)

	# Order 3: correct.
	await _brew(game, game.solution(), "")
	await _serve(game, "06_success_2", 0.5)
	await _sleep(2.4)

	# Order 4: correct, unhurried, so the movie runs past 30 seconds.
	await _brew(game, game.solution(), "")
	await _serve(game, "", 0.0)
	await _sleep(2.6)

	# Order 5: the last customer of the day, then the closing card and the
	# end-of-game card.
	await _brew(game, game.solution(), "")
	await _serve(game, "", 0.0)
	await _until(func(): return game.overlay.visible)
	await _sleep(1.0)
	await _shot("07_results")
	await _sleep(1.0)   # let the browser finish the screenshot before the next card
	game.show_finale()
	await _sleep(1.0)
	await _shot("08_game_over")
	print("Capture: done")
	if not OS.has_feature("web"):
		_tree.quit()


func _brew(game: Node, path: Array, shot: String) -> void:
	await _until(func(): return not game.paused)
	for n in path.size():
		game.add_ingredient(path[n])
		if n == 1 and shot != "":
			await _sleep(0.22)
			await _shot(shot)
			await _sleep(0.2)
		else:
			await _sleep(0.6)
	await _until(func(): return game.is_idle())
	await _sleep(0.35)


func _serve(game: Node, shot: String, delay: float) -> void:
	game.serve()
	if shot != "":
		await _sleep(delay)
		await _shot(shot)
