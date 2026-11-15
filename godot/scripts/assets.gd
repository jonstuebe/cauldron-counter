class_name Assets
extends RefCounted
## One place that maps asset keys to files. Final art in res://art/ (see
## art/MANIFEST.md) wins over the generated placeholders in res://assets/gen/
## (tools/gen_assets.mjs), so the game still runs if art/ is missing, and
## swapping art never touches scene code. The boot scene preloads all_paths().
##
## Keys:
##   gameplay keys with placeholders: jar/<id>, cork, portrait/<i>/<mood>,
##     cauldron_back, flame/<0..2>, flask_glass, flask_liquid, coin, spark
##   art-only keys are the path under art/ without extension, e.g.
##     "ui/ticket", "background/bg_back", "particles/steam_puff"

const GEN := "res://assets/gen/"
const ART_DIR := "res://art/"

const MOODS := ["neutral", "happy", "cross"]
const CUSTOMER_IDS := ["wren", "marrow", "pell", "tobble", "isolde", "fennick", "mags", "knight", "hask", "pim"]

## Art-only textures the game uses when present (layout falls back without them).
const ART_ONLY := [
	"background/bg_back", "background/bg_glow", "background/bg_shelves", "background/bg_mid", "background/bg_counter", "background/bg_vignette",
	"cauldron/cauldron_glow", "cauldron/cauldron_reflect", "cauldron/cauldron_liquid_shine", "cauldron/cauldron_rim",
	"fire/logs", "fire/fire_glow",
	"ingredients/bottle_round_front",
	"particles/steam_puff", "particles/smoke", "particles/droplet", "particles/bubble", "particles/sparkle_white", "particles/ember", "particles/glow_soft", "particles/pour_stream", "particles/splash_ring",
	"ui/panel_dark", "ui/panel_card", "ui/speech_bubble", "ui/speech_tail", "ui/ticket",
	"ui/button_primary_normal", "ui/button_primary_hover", "ui/button_primary_pressed", "ui/button_primary_disabled",
	"ui/button_ready_normal", "ui/button_ready_hover", "ui/button_ready_pressed", "ui/button_ready_disabled",
	"ui/button_secondary_normal", "ui/button_secondary_hover", "ui/button_secondary_pressed", "ui/button_secondary_disabled",
	"ui/progress_frame", "ui/progress_fill", "ui/bar_frame", "ui/bar_fill",
	"ui/strength_badge", "ui/strength_badge_ready", "ui/queue_dot_on", "ui/queue_dot_off",
	"ui/chip", "ui/chip_dot", "ui/op_tag", "ui/op_tag_faded", "ui/portrait_bg", "ui/portrait_frame", "ui/shelf_plank",
	"ui/wordmark_stacked",
]

static var _cache := {}
static var _font_cache := {}


static func _art_or(art: String, gen: String) -> String:
	return art if ResourceLoader.exists(art) else gen


static func path(key: String) -> String:
	var parts := key.split("/")
	match parts[0]:
		"jar":
			return _art_or(ART_DIR + "ingredients/jar_%s.svg" % parts[1], GEN + "jar_%s.svg" % parts[1])
		"cork":
			return _art_or(ART_DIR + "ingredients/cork.svg", GEN + "cork.svg")
		"portrait":
			var i := int(parts[1])
			var mood := "upset" if parts[2] == "cross" else parts[2]
			return _art_or(ART_DIR + "customers/customer_%d_%s_%s.svg" % [i, CUSTOMER_IDS[i], mood], GEN + "portrait_%s_%s.svg" % [parts[1], parts[2]])
		"cauldron_back":
			return _art_or(ART_DIR + "cauldron/cauldron_body.svg", GEN + "cauldron_back.svg")
		"flame":
			return _art_or(ART_DIR + "fire/flame_%s.svg" % ["c", "a", "b"][int(parts[1])], GEN + "flame_%s.svg" % parts[1])
		"flask_glass":
			return _art_or(ART_DIR + "ingredients/bottle_round_glass.svg", GEN + "flask_glass.svg")
		"flask_liquid":
			return _art_or(ART_DIR + "ingredients/bottle_round_liquid.svg", GEN + "flask_liquid.svg")
		"coin":
			return _art_or(ART_DIR + "ui/coin.svg", GEN + "coin.svg")
		"spark":
			return _art_or(ART_DIR + "particles/sparkle_white.svg", GEN + "spark.svg")
	# Plum buttons with a visible lip (assets/ui), so Undo/Empty read exactly as
	# tall as the parchment Serve button; art/ stays as delivered.
	if key.begins_with("ui/button_secondary_") and ResourceLoader.exists("res://assets/" + key + ".svg"):
		return "res://assets/" + key + ".svg"
	for ext in [".svg", ".png"]:
		if ResourceLoader.exists(ART_DIR + key + ext):
			return ART_DIR + key + ext
	return ""


## True when final art is installed (switches layouts to the art-driven look).
static func art() -> bool:
	return ResourceLoader.exists(ART_DIR + "cauldron/cauldron_body.svg")


static func has(key: String) -> bool:
	return path(key) != ""


static func tex(key: String) -> Texture2D:
	if not _cache.has(key):
		var p := path(key)
		_cache[key] = load(p) if p != "" else null
	return _cache[key]


static func portrait(i: int, mood: String) -> Texture2D:
	return tex("portrait/%d/%s" % [i, mood])


## Cork placement in jar units (jar is 60 units wide): placeholder vs art canvas.
static func cork_rect() -> Rect2:
	if path("cork").begins_with(ART_DIR):
		return Rect2(21, -6, 18, 14)   # 36x28 at (42,-12) on the 120x150 art jar
	return Rect2(21, 2, 18, 10)


## Height of a jar in jar units (60 wide).
static func jar_height() -> float:
	var t := tex("jar/dew")
	return 60.0 * t.get_height() / t.get_width()


# --- fonts ---

const FONTS := {
	display = ["fonts/IMFellEnglish-Regular.ttf", "res://assets/fonts/IMFellEnglish-Regular.ttf"],
	display_italic = ["fonts/IMFellEnglish-Italic.ttf", "res://assets/fonts/IMFellEnglish-Regular.ttf"],
	body = ["fonts/AlegreyaSans-Medium.ttf", "res://assets/fonts/AlegreyaSans-Medium.woff2"],
	bold = ["fonts/AlegreyaSans-Bold.ttf", "res://assets/fonts/AlegreyaSans-Bold.woff2"],
	extrabold = ["fonts/AlegreyaSans-ExtraBold.ttf", "res://assets/fonts/AlegreyaSans-Bold.woff2"],
	legible = ["fonts/AtkinsonHyperlegibleNext-Variable.ttf", "res://assets/fonts/AtkinsonHyperlegibleNext-VF.ttf"],
}


static func font_path(name: String) -> String:
	return _art_or(ART_DIR + FONTS[name][0], FONTS[name][1])


static func keys() -> Array[String]:
	var k: Array[String] = ["cork", "cauldron_back", "flask_glass", "flask_liquid", "coin", "spark"]
	for g in Logic.INGS:
		k.append("jar/" + g.id)
	for i in GameData.CUSTOMERS.size():
		for m in MOODS:
			k.append("portrait/%d/%s" % [i, m])
	for n in 3:
		k.append("flame/%d" % n)
	for a in ART_ONLY:
		if has(a):
			k.append(a)
	return k


static func all_paths() -> Array[String]:
	var p: Array[String] = ["res://shaders/liquid.gdshader", "res://shaders/dissolve.gdshader"]
	for f in FONTS:
		var fp := font_path(f)
		if not p.has(fp):
			p.append(fp)
	for s in ["flame_flicker", "heat_haze", "sheen"]:
		if ResourceLoader.exists(ART_DIR + "shaders/%s.gdshader" % s):
			p.append(ART_DIR + "shaders/%s.gdshader" % s)
	for k in keys():
		p.append(path(k))
	return p


static func shader(name: String) -> Shader:
	var p := ART_DIR + "shaders/%s.gdshader" % name
	return load(p) if ResourceLoader.exists(p) else null


## Called by the boot scene with the resources it finished loading threaded.
static func prime(key: String, res: Resource) -> void:
	_cache[key] = res


static func clear() -> void:
	_cache.clear()
