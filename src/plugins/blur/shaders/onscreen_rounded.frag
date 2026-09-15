#version 140

#include "sdf.glsl"

uniform sampler2D texUnit;
uniform mat4 colorMatrix;
uniform float offset;
uniform vec2 halfpixel;
uniform vec4 box;
uniform vec4 cornerRadius;
uniform float opacity;
// HoltOS adaptive contrast (see onscreen.frag).
uniform sampler2D backdropTexUnit;
uniform float adaptiveMaxLuminance;

in vec2 uv;
in vec2 vertex;

out vec4 fragColor;

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

    fragColor = adaptContrast((sum / 12.0) * colorMatrix) * opacity;

    float f = sdfRoundedBox(vertex, box.xy, box.zw, cornerRadius);
    float df = fwidth(f);
    fragColor *= 1.0 - clamp(0.5 + f / df, 0.0, 1.0);
}
