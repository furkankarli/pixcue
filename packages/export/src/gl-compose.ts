/**
 * Composites a transparent frame onto a key color on the GPU (WebGL 2): the
 * same result as `composeOnColor`, without reading every pixel back to
 * JavaScript. That readback and loop are the slowest part of a chroma-key
 * export on phones. Returns null where WebGL 2 is unavailable, and callers
 * fall back to the JavaScript path.
 */
import { HARD_EDGE_CUTOFF } from './chroma.ts';
import type { FrameImage } from './frames.ts';

const VERTEX = `#version 300 es
in vec2 position;
out vec2 uv;
void main() {
  uv = vec2(position.x + 1.0, 1.0 - position.y) * 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

// Straight (unpremultiplied) alpha in, an opaque frame out. Hard edges keep a
// pixel only at or above the cutoff, exactly like the JavaScript path.
const FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D frame;
uniform vec3 key;
uniform float cutoff;
uniform bool hardEdges;
in vec2 uv;
out vec4 color;
void main() {
  vec4 c = texture(frame, uv);
  if (hardEdges) {
    color = vec4(c.a * 255.0 < cutoff - 0.5 ? key : c.rgb, 1.0);
  } else {
    color = vec4(mix(key, c.rgb, c.a), 1.0);
  }
}`;

export interface GlComposer {
  compose(frame: FrameImage, color: string, hardEdges: boolean): FrameImage;
}

function rgb01(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.replace('#', ''), 16) || 0;
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function shader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, source);
  gl.compileShader(s);
  return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
}

/** A composer for frames of `width`×`height`, or null without WebGL 2. */
export function createGlComposer(width: number, height: number): GlComposer | null {
  if (typeof OffscreenCanvas === 'undefined') return null;
  const canvas = new OffscreenCanvas(width, height);
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    depth: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: true,
  });
  if (!gl) return null;
  const vs = shader(gl, gl.VERTEX_SHADER, VERTEX);
  const fs = shader(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vs || !fs || !program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  // One triangle that covers the viewport.
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  // Canvas pixels arrive unpremultiplied, as the JavaScript path sees them.
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

  const keyAt = gl.getUniformLocation(program, 'key');
  const hardAt = gl.getUniformLocation(program, 'hardEdges');
  gl.uniform1f(gl.getUniformLocation(program, 'cutoff'), HARD_EDGE_CUTOFF);
  gl.viewport(0, 0, width, height);

  return {
    compose(frame, color, hardEdges) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, frame as TexImageSource);
      gl.uniform3fv(keyAt, rgb01(color));
      gl.uniform1i(hardAt, hardEdges ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      return canvas as unknown as FrameImage;
    },
  };
}
