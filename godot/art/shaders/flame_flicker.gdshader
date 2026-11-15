// Flame flicker for fire/flame_*.svg (Sprite2D / TextureRect, pivot at the bottom centre).
// Sways and stretches the top of the sprite while the base stays planted.
shader_type canvas_item;

uniform float speed = 6.0;
uniform float sway = 0.07;      // sideways lean, in UV units, at the tip
uniform float stretch = 0.10;   // vertical breathing at the tip
uniform float phase = 0.0;      // give each flame a different value
uniform float heat : hint_range(0.0, 1.0) = 0.0; // 0 = idle fire, 1 = roaring (brew ready)

void fragment() {
	float t = TIME * speed * (1.0 + heat * 0.6) + phase;
	float lift = 1.0 - UV.y;                       // 0 at the base, 1 at the tip
	float k = lift * lift;
	vec2 uv = UV;
	uv.x += (sin(t + uv.y * 5.0) * 0.6 + sin(t * 1.7 + 1.3) * 0.4) * sway * k;
	float s = 1.0 + (sin(t * 1.3) * 0.5 + 0.5) * stretch * (1.0 + heat);
	uv.y = 1.0 - lift / s;
	vec4 c = texture(TEXTURE, uv);
	if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0) { c.a = 0.0; }
	c.rgb += vec3(0.10, 0.07, 0.02) * heat * lift;
	COLOR = c * COLOR;
}
