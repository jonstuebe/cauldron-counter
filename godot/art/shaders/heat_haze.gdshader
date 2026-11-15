// Heat haze above the fire and the cauldron mouth. Put it on a plain ColorRect that covers
// the area to distort (suggested: 520x260 centred over the cauldron rim, above the
// background layers and below the UI). Works in the Compatibility renderer.
shader_type canvas_item;

uniform sampler2D screen_tex : hint_screen_texture, repeat_disable, filter_linear;
uniform float strength = 0.0035;  // UV offset; keep it subtle
uniform float speed = 1.4;
uniform float scale = 22.0;

void fragment() {
	// fades out toward every edge of the rect, strongest in the lower middle
	float mask = smoothstep(0.0, 0.25, UV.x) * smoothstep(1.0, 0.75, UV.x) * smoothstep(0.0, 0.5, UV.y) * smoothstep(1.0, 0.9, UV.y);
	float t = TIME * speed;
	vec2 wob = vec2(
		sin(UV.y * scale - t * 3.0) + sin(UV.y * scale * 0.47 + t * 1.9),
		cos(UV.x * scale * 0.6 + t * 2.3)) * 0.5;
	COLOR = vec4(texture(screen_tex, SCREEN_UV + wob * strength * mask).rgb, 1.0);
}
