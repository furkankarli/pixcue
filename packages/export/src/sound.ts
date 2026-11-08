/**
 * Sound for exports: PCM in, WAV, interleaved 16-bit PCM or AAC out. The
 * exporters take plain samples, so this package still knows nothing about
 * how the sound was made.
 */
import type { Mp4Audio } from './mux/mp4.ts';

/** A soundtrack: one array of -1..1 samples per channel. */
export interface SoundInput {
  readonly sampleRate: number;
  readonly channels: readonly Float32Array[];
}

/** 16-bit little-endian interleaved PCM (what WAV and QuickTime `sowt` store). */
export function interleave16(sound: SoundInput): Uint8Array {
  const { channels } = sound;
  const length = channels[0]?.length ?? 0;
  const out = new DataView(new ArrayBuffer(length * channels.length * 2));
  for (let i = 0; i < length; i++) {
    channels.forEach((channel, c) => {
      const v = Math.max(-1, Math.min(1, channel[i] ?? 0));
      out.setInt16((i * channels.length + c) * 2, Math.round(v * 32767), true);
    });
  }
  return new Uint8Array(out.buffer);
}

/** A 16-bit PCM WAV file. */
export function wavFile(sound: SoundInput): Uint8Array {
  const pcm = interleave16(sound);
  const channels = sound.channels.length;
  const out = new Uint8Array(44 + pcm.length);
  const v = new DataView(out.buffer);
  const text = (at: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(at + i, s.charCodeAt(i));
  };
  text(0, 'RIFF');
  v.setUint32(4, 36 + pcm.length, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, channels, true);
  v.setUint32(24, sound.sampleRate, true);
  v.setUint32(28, sound.sampleRate * channels * 2, true);
  v.setUint16(32, channels * 2, true);
  v.setUint16(34, 16, true);
  text(36, 'data');
  v.setUint32(40, pcm.length, true);
  out.set(pcm, 44);
  return out;
}

/** The WebCodecs audio classes used for AAC; injectable for tests. */
export interface AudioCodecsApi {
  readonly AudioEncoder: {
    new (
      init: AudioEncoderInit,
    ): Pick<AudioEncoder, 'configure' | 'encode' | 'flush' | 'close' | 'state'>;
    isConfigSupported(config: AudioEncoderConfig): Promise<AudioEncoderSupport>;
  };
  readonly AudioData: new (init: AudioDataInit) => AudioData;
}

function audioApi(api?: AudioCodecsApi): AudioCodecsApi | null {
  if (api) return api;
  const g = globalThis as Partial<AudioCodecsApi>;
  return g.AudioEncoder && g.AudioData ? (g as AudioCodecsApi) : null;
}

const AAC_BITRATE = 192_000;

function aacConfig(sound: SoundInput): AudioEncoderConfig {
  return {
    codec: 'mp4a.40.2', // AAC-LC
    sampleRate: sound.sampleRate,
    numberOfChannels: sound.channels.length,
    bitrate: AAC_BITRATE,
  };
}

/** Whether this browser can encode AAC for an MP4's sound. */
export async function canEncodeAac(sound: SoundInput, api?: AudioCodecsApi): Promise<boolean> {
  const codecs = audioApi(api);
  if (!codecs) return false;
  try {
    return (await codecs.AudioEncoder.isConfigSupported(aacConfig(sound))).supported === true;
  } catch {
    return false;
  }
}

/** AudioSpecificConfig for AAC-LC, for encoders that do not report one. */
function audioSpecificConfig(sampleRate: number, channels: number): Uint8Array {
  const rates = [96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000];
  const index = Math.max(0, rates.indexOf(sampleRate));
  const bits = (2 << 11) | (index << 7) | (channels << 3);
  return new Uint8Array([bits >> 8, bits & 255]);
}

/** Frames fed to the encoder at a time. */
const BLOCK = 4800;

/** Encodes the soundtrack as AAC-LC, or returns null where AAC is unavailable. */
export async function encodeAac(sound: SoundInput, api?: AudioCodecsApi): Promise<Mp4Audio | null> {
  const codecs = audioApi(api);
  if (!codecs || !(await canEncodeAac(sound, codecs))) return null;
  const frames: Uint8Array[] = [];
  let description: Uint8Array | undefined;
  let failure: unknown = null;
  const encoder = new codecs.AudioEncoder({
    output(chunk, meta) {
      const data = new Uint8Array(chunk.byteLength);
      chunk.copyTo(data);
      frames.push(data);
      const d = meta?.decoderConfig?.description;
      if (d && !description) {
        const view = ArrayBuffer.isView(d)
          ? new Uint8Array(d.buffer, d.byteOffset, d.byteLength)
          : new Uint8Array(d);
        description = new Uint8Array(view);
      }
    },
    error(e) {
      failure = e;
    },
  });
  try {
    encoder.configure(aacConfig(sound));
    const channels = sound.channels.length;
    const length = sound.channels[0]?.length ?? 0;
    for (let at = 0; at < length; at += BLOCK) {
      const n = Math.min(BLOCK, length - at);
      const data = new Float32Array(n * channels);
      sound.channels.forEach((channel, c) => {
        data.set(channel.subarray(at, at + n), c * n);
      });
      const block = new codecs.AudioData({
        format: 'f32-planar',
        sampleRate: sound.sampleRate,
        numberOfFrames: n,
        numberOfChannels: channels,
        timestamp: Math.round((at * 1e6) / sound.sampleRate),
        data,
      });
      encoder.encode(block);
      block.close();
    }
    await encoder.flush();
    if (failure) throw failure;
  } finally {
    if (encoder.state !== 'closed') encoder.close();
  }
  return {
    frames,
    sampleRate: sound.sampleRate,
    channels: sound.channels.length,
    config: description ?? audioSpecificConfig(sound.sampleRate, sound.channels.length),
    bitrate: AAC_BITRATE,
    // AAC encoders start with one frame of priming samples.
    priming: 1024,
  };
}
