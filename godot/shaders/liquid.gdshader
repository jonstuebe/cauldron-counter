// Cauldron liquid surface. Drawn on a rect with the ellipse's proportions.
shader_type canvas_item;

uniform vec4 liquid_color : source_color = vec4(0.169, 0.145, 0.208, 1.0);
uniform float energy = 0.0;   // 0..1, rises as the brew nears the order
uniform float ready = 0.0;    // 1 when the brew matches the order
uniform float ripple = 10.0;  // seconds since the last splash
uniform float wobble = 1.0;   // 0 with reduced motion
uniform float aspect = 7.2;   // rect width / height

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	f = f * f * (3.0 - 2.0 * f);
	return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

void fragment() {
	vec2 p = UV * 2.0 - 1.0;
	float t = TIME * wobble;
	float d = length(p);
	float edge = 0.92 + 0.03 * sin(atan(p.y, p.x) * 7.0 + t * 2.2) * wobble;
	float aa = max(fwidth(d) * 1.5, 0.01);
	float mask = 1.0 - smoothstep(edge - aa, edge, d);

	vec2 q = vec2(p.x * aspect, p.y) * 1.3;
	float n = noise(q * 1.2 + vec2(t * 0.6, -t * 0.25)) * 0.6 + noise(q * 2.8 - vec2(t * 0.9, 0.0)) * 0.4;
	vec3 col = liquid_color.rgb * (0.8 + 0.34 * n);
	col *= mix(1.0, 0.7, smoothstep(0.45, 0.92, d));
	col += vec3(0.10) * smoothstep(0.35, 0.0, abs(p.y + 0.4)) * smoothstep(0.9, 0.15, abs(p.x));
	col = mix(col, col * 1.3 + vec3(0.04), energy * 0.6);

	// splash ring
	float r = ripple * 1.7;
	float ring = smoothstep(0.08, 0.0, abs(d - r)) * (1.0 - clamp(ripple / 0.55, 0.0, 1.0));
	col += vec3(0.4) * ring;

	// bubbles popping on the surface
	vec2 g = q * 0.9;
	vec2 id = floor(g);
	vec2 f = fract(g) - 0.5;
	float h = hash(id);
	vec2 off = (vec2(hash(id + 7.1), hash(id + 3.3)) - 0.5) * 0.5;
	float ph = fract(t * (0.35 + 0.4 * h) + h);
	float br = 0.28 * ph;
	float bub = smoothstep(0.05, 0.0, abs(length((f - off) * vec2(1.0, 1.6)) - br)) * (1.0 - ph) * step(0.45, h);
	col += vec3(0.22 + 0.25 * energy) * bub * wobble;

	col = mix(col, col + vec3(0.22, 0.17, 0.04), ready * (0.55 + 0.45 * sin(TIME * 4.0)));
	COLOR = vec4(col, mask * liquid_color.a);
}
