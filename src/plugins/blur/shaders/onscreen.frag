#version 140

uniform sampler2D texUnit;
uniform mat4 colorMatrix;
uniform float offset;
uniform vec2 halfpixel;
// HoltOS adaptive contrast: the smallest downsampled blur level (a tiny copy
// of the backdrop that the upsample passes never overwrite) and the target
// luminance. adaptiveMaxLuminance <= 0 turns it off.
uniform sampler2D backdropTexUnit;
uniform float adaptiveMaxLuminance;

in vec2 uv;

out vec4 fragColor;

// Darkens the blurred colour where the local backdrop is brighter than the
// target, so light text on top keeps its contrast. Luminance is taken in
// approximately linear light (gamma 2) and eased with a smoothstep so the
// clamp has no visible edge.
vec4 adaptContrast(vec4 color)
{
    if (adaptiveMaxLuminance <= 0.0) {
        return color;
    }
    vec3 local = (texture(backdropTexUnit, uv) * colorMatrix).rgb;
    float luminance = dot(local * local, vec3(0.2126, 0.7152, 0.0722));
    float strength = smoothstep(adaptiveMaxLuminance * 0.8, adaptiveMaxLuminance * 1.25, luminance);
    float linearScale = mix(1.0, clamp(adaptiveMaxLuminance / max(luminance, 0.0001), 0.0, 1.0), strength);
    return vec4(color.rgb * sqrt(linearScale), color.a);
}

void main(void)
{
    vec4 sum = texture(texUnit, uv + vec2(-halfpixel.x * 2.0, 0.0) * offset);
    sum += texture(texUnit, uv + vec2(-halfpixel.x, halfpixel.y) * offset) * 2.0;
    sum += texture(texUnit, uv + vec2(0.0, halfpixel.y * 2.0) * offset);
    sum += texture(texUnit, uv + vec2(halfpixel.x, halfpixel.y) * offset) * 2.0;
    sum += texture(texUnit, uv + vec2(halfpixel.x * 2.0, 0.0) * offset);
    sum += texture(texUnit, uv + vec2(halfpixel.x, -halfpixel.y) * offset) * 2.0;
    sum += texture(texUnit, uv + vec2(0.0, -halfpixel.y * 2.0) * offset);
    sum += texture(texUnit, uv + vec2(-halfpixel.x, -halfpixel.y) * offset) * 2.0;

    fragColor = adaptContrast((sum / 12.0) * colorMatrix);
}
