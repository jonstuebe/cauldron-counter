class_name Particles
extends RefCounted
## GPUParticles2D factory. Textures come from Assets ("spark"); tint the node
## with `modulate`. cfg keys: amount, lifetime, box (emission half-extents),
## dir, spread, vel (min,max), gravity, scale (min,max), grow (end scale
## multiplier), alpha (peak), preprocess, hue (rainbow-ish gold/green/ink mix).

const SPARK_COLORS := [Color("#f0cb73"), Color("#6fe0bd"), Color("#efe7d6"), Color("#d4ad55")]


static func make(cfg: Dictionary) -> GPUParticles2D:
	var p := GPUParticles2D.new()
	p.amount = cfg.get("amount", 16)
	p.lifetime = cfg.get("lifetime", 1.0)
	p.preprocess = cfg.get("preprocess", 0.0)
	p.texture = Assets.tex(cfg.get("tex", "spark"))
	p.local_coords = true
	var m := ParticleProcessMaterial.new()
	var box: Vector2 = cfg.get("box", Vector2.ZERO)
	if box != Vector2.ZERO:
		m.emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_BOX
		m.emission_box_extents = Vector3(box.x, box.y, 0)
	var dir: Vector2 = cfg.get("dir", Vector2(0, -1))
	m.direction = Vector3(dir.x, dir.y, 0)
	m.spread = cfg.get("spread", 15.0)
	var vel: Vector2 = cfg.get("vel", Vector2(20, 40))
	m.initial_velocity_min = vel.x
	m.initial_velocity_max = vel.y
	var g: Vector2 = cfg.get("gravity", Vector2.ZERO)
	m.gravity = Vector3(g.x, g.y, 0)
	m.damping_min = 4.0
	m.damping_max = 10.0
	var sc: Vector2 = cfg.get("scale", Vector2(0.3, 0.6))
	m.scale_min = sc.x
	m.scale_max = sc.y
	var grow: float = cfg.get("grow", 0.0)
	var curve := Curve.new()
	if grow > 0.0:
		curve.max_value = grow
		curve.add_point(Vector2(0, 0.6))
		curve.add_point(Vector2(1, grow))
	else:
		curve.add_point(Vector2(0, 1.0))
		curve.add_point(Vector2(0.7, 0.9))
		curve.add_point(Vector2(1, 0.0))
	var ct := CurveTexture.new()
	ct.curve = curve
	m.scale_curve = ct
	var a: float = cfg.get("alpha", 0.8)
	var grad := Gradient.new()
	grad.set_color(0, Color(1, 1, 1, 0))
	grad.set_color(1, Color(1, 1, 1, 0))
	grad.add_point(0.15, Color(1, 1, 1, a))
	grad.add_point(0.6, Color(1, 1, 1, a * 0.8))
	var gt := GradientTexture1D.new()
	gt.gradient = grad
	m.color_ramp = gt
	if cfg.get("hue", false):
		var ig := Gradient.new()
		ig.interpolation_mode = Gradient.GRADIENT_INTERPOLATE_CONSTANT
		ig.offsets = PackedFloat32Array([0.0, 0.3, 0.6, 0.85])
		ig.colors = PackedColorArray(SPARK_COLORS)
		var igt := GradientTexture1D.new()
		igt.gradient = ig
		m.color_initial_ramp = igt
	p.process_material = m
	return p


## One-shot burst that frees itself once finished.
static func burst(cfg: Dictionary) -> GPUParticles2D:
	var p := make(cfg)
	p.one_shot = true
	p.explosiveness = cfg.get("explosiveness", 0.9)
	p.emitting = true
	p.finished.connect(p.queue_free)
	return p
