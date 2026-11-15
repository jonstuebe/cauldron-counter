extends Node
## Autoload "WebInstall": the bridge to the install sheet in web/shell.html
## (window.ccInstall). The page decides the platform, the steps and whether
## the game is already installed; the game only says when there is a calm
## moment (between customers) and opens the sheet from its menu.
## Elsewhere than the web everything here is a no-op.

signal changed                 # availability or open state changed

var is_open := false
var available := false
var _cb: JavaScriptObject      # keep the callback alive


func _ready() -> void:
	if not OS.has_feature("web"):
		return
	var api = JavaScriptBridge.get_interface("ccInstall")
	if api == null:
		return
	_cb = JavaScriptBridge.create_callback(_on_js)
	api.subscribe(_cb)


func _on_js(args: Array) -> void:
	var was_open := is_open
	is_open = bool(args[0]) if args.size() > 0 else false
	available = bool(args[1]) if args.size() > 1 else false
	if was_open and not is_open:
		get_viewport().gui_release_focus()
	changed.emit()


## Open the sheet (from the menu), ignoring an earlier "Not now".
func open() -> void:
	if OS.has_feature("web"):
		JavaScriptBridge.eval("window.ccInstall && window.ccInstall.open(true)", true)


## A calm moment: "served" after a happy customer, "between" otherwise. The
## page may show the sheet now; this returns once it is closed again.
func moment(kind: String) -> void:
	if not OS.has_feature("web") or not available:
		return
	var shown = JavaScriptBridge.eval("!!(window.ccInstall && window.ccInstall.moment('%s'))" % kind, true)
	if not bool(shown):
		return
	is_open = true
	while is_open and is_inside_tree():
		await get_tree().create_timer(0.2).timeout
