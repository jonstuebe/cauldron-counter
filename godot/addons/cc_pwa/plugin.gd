@tool
extends EditorPlugin
## Registers an export plugin that finishes the Web export's PWA manifest:
## Godot writes name, icons (144/180/512), display, orientation and the
## background colour; this adds a maskable 512 icon, theme_color, id, scope and
## short_name (export_presets.cfg has progressive_web_app/enabled=true).

var _export: EditorExportPlugin


func _enter_tree() -> void:
	_export = PwaExport.new()
	add_export_plugin(_export)


func _exit_tree() -> void:
	remove_export_plugin(_export)
	_export = null


class PwaExport extends EditorExportPlugin:
	const MASKABLE := "res://assets/pwa/icon_512_maskable.png"
	var _path := ""
	var _web := false

	func _get_name() -> String:
		return "CauldronCounterPWA"

	func _export_begin(features: PackedStringArray, _is_debug: bool, path: String, _flags: int) -> void:
		_web = features.has("web")
		_path = path

	func _export_end() -> void:
		if not _web or _path == "":
			return
		var dir := _path.get_base_dir()
		var base := _path.get_file().get_basename()
		var mpath := dir.path_join(base + ".manifest.json")
		if not FileAccess.file_exists(mpath):
			return
		var m = JSON.parse_string(FileAccess.get_file_as_string(mpath))
		if not m is Dictionary:
			push_error("PWA: could not read " + mpath)
			return
		var icon_name := base + ".512x512.maskable.png"
		var src := FileAccess.get_file_as_bytes(MASKABLE)
		if src.size() > 0:
			var f := FileAccess.open(dir.path_join(icon_name), FileAccess.WRITE)
			f.store_buffer(src)
			f.close()
			var icons: Array = m.get("icons", [])
			icons.append({"src": icon_name, "sizes": "512x512", "type": "image/png", "purpose": "maskable"})
			m["icons"] = icons
		m["id"] = "./"
		m["scope"] = "./"
		m["short_name"] = "Cauldron"
		m["description"] = "Brew potions to the exact strength each customer asks for."
		m["theme_color"] = "#1e1830"
		m["background_color"] = "#1e1830"
		var out := FileAccess.open(mpath, FileAccess.WRITE)
		out.store_string(JSON.stringify(m, "\t"))
		out.close()
		print("PWA: manifest finished (%s)" % mpath)
