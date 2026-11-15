// A slow diagonal glint that sweeps across polished brass: ui/strength_badge_ready.svg,
// ui/button_ready_*.svg, ui/coin.svg. Set `active` to 0 to switch it off without swapping materials.
shader_type canvas_item;

uniform float active : hint_range(0.0, 1.0) = 1.0;
uniform float period = 2.6;      // seconds between sweeps
uniform float width = 0.16;
uniform vec4 glint : source_color = vec4(1.0, 0.96, 0.82, 1.0);

void fragment() {
	vec4 c = texture(TEXTURE, UV);
	float p = fract(TIME / period) * 2.4 - 0.7;       // travels past both edges, then rests
	float d = (UV.x + UV.y * 0.35) - p;
	float band = smoothstep(width, 0.0, abs(d));
	c.rgb = mix(c.rgb, glint.rgb, band * 0.55 * active);
	COLOR = c * COLOR;
}
