extends Node
## Autoload "Screen": picks the layout for the window shape and keeps the
## content scale and safe-area insets in step with it.
##
## Landscape keeps the approved 1280x720 design canvas (canvas_items, expand).
## Portrait (taller than wide) switches the design canvas to 400x720, so a
## phone shows about one canvas unit per CSS pixel and text stays legible; the
## extra height (and width on tablets) is filled by the layout.
##
## Safe areas (notch, home indicator) come from CSS env(safe-area-inset-*) on
## the web (the export adds viewport-fit=cover) and from the display safe area
## elsewhere. `?safe=TOP,BOTTOM[,LEFT,RIGHT]` in the page URL fakes insets in
## CSS px, for testing in a desktop browser.

signal changed

const LANDSCAPE := Vector2i(1280, 720)
const PORTRAIT := Vector2i(400, 720)

var portrait := false
## Insets in canvas units: x = left, y = top, z = right, w = bottom.
var safe := Vector4.ZERO
var _fake := Vector4(-1, -1, -1, -1)
var _last_win := Vector2i.ZERO


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	if OS.has_feature("web"):
		var q := str(JavaScriptBridge.eval("window.location.search", true))
		var m := RegEx.create_from_string("[?&]safe=([0-9.,]+)").search(q)
		if m:
			var p := m.get_string(1).split(",")
			_fake = Vector4(0, float(p[0]), 0, float(p[1]) if p.size() > 1 else 0.0)
			if p.size() > 3:
				_fake.x = float(p[2])
				_fake.z = float(p[3])
	get_tree().root.size_changed.connect(_update)
	_update()


func _process(_delta: float) -> void:
	# Some browsers resize the canvas a frame after rotation without a
	# size_changed; keep a cheap watch on the window size.
	if get_tree().root.size != _last_win:
		_update()


func _update() -> void:
	var root := get_tree().root
	var win := root.size
	_last_win = win
	if win.x <= 0 or win.y <= 0:
		return
	var p := win.y > win.x * 1.05
	var want := PORTRAIT if p else LANDSCAPE
	if root.content_scale_size != want:
		root.content_scale_size = want
	var s := _read_safe(win)
	if p != portrait or not s.is_equal_approx(safe):
		portrait = p
		safe = s
		changed.emit()


## Canvas units per window pixel.
func _px_to_canvas(win: Vector2i) -> float:
	var base := Vector2(get_tree().root.content_scale_size)
	var k := minf(win.x / base.x, win.y / base.y)
	return 1.0 / k if k > 0 else 1.0


func _read_safe(win: Vector2i) -> Vector4:
	var css := _fake
	if OS.has_feature("web"):
		if css.x < 0:
			var js := """(function(){var d=document.getElementById('cc-safe');if(!d){d=document.createElement('div');d.id='cc-safe';
d.style.cssText='position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
document.body.appendChild(d);}var s=getComputedStyle(d);return [parseFloat(s.paddingLeft)||0,parseFloat(s.paddingTop)||0,parseFloat(s.paddingRight)||0,parseFloat(s.paddingBottom)||0].join(',');})()"""
			var r := str(JavaScriptBridge.eval(js, true)).split(",")
			css = Vector4(float(r[0]), float(r[1]), float(r[2]), float(r[3])) if r.size() == 4 else Vector4.ZERO
		# CSS px -> window px -> canvas units
		var dpr := float(JavaScriptBridge.eval("window.devicePixelRatio || 1", true))
		var css_w := float(JavaScriptBridge.eval("window.innerWidth || 0", true))
		var px_per_css := (win.x / css_w) if css_w > 0 else dpr
		return css * px_per_css * _px_to_canvas(win)
	var r2 := DisplayServer.get_display_safe_area()
	var ss := DisplayServer.screen_get_size()
	if r2.size.x <= 0 or ss.x <= 0 or r2.size == ss:
		return Vector4.ZERO
	var c := _px_to_canvas(win)
	return Vector4(r2.position.x, r2.position.y, ss.x - r2.end.x, ss.y - r2.end.y) * c
