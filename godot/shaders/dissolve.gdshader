// Scene transition: the captured boot screen burns away along a noise front.
shader_type canvas_item;

uniform float progress : hint_range(0.0, 1.0) = 0.0;
uniform vec4 edge_color : source_color = vec4(0.941, 0.796, 0.451, 1.0);
uniform float edge_width = 0.06;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	f = f * f * (3.0 - 2.0 * f);
	return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

void fragment() {
	vec4 c = texture(TEXTURE, UV);
	float n = noise(UV * vec2(16.0, 9.0)) * 0.65 + noise(UV * vec2(48.0, 27.0)) * 0.35;
	// radial bias so the dissolve opens from the centre (the cauldron) outwards
	n = mix(n, length(UV - vec2(0.5)) * 1.3, 0.45);
	float p = progress * (1.0 + edge_width * 2.0) - edge_width;
	float a = smoothstep(p, p + 0.02, n);
	float e = smoothstep(p + edge_width, p, n) * a;
	COLOR = vec4(mix(c.rgb, edge_color.rgb, e), c.a * a);
}
