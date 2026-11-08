import { describe, expect, it } from 'vitest';
import { exportMov, exportPngSequence } from '../src/exporters/sequence.ts';
import {
  type AudioCodecsApi,
  canEncodeAac,
  encodeAac,
  interleave16,
  type SoundInput,
  wavFile,
} from '../src/sound.ts';
import { nodePlatform, syntheticSource } from './node-platform.ts';

/** A quarter second of a ramp, left and right mirrored. */
function sound(sampleRate = 8000): SoundInput {
  const n = sampleRate / 4;
  const left = new Float32Array(n).map((_, i) => i / n);
  const right = left.map((x) => -x);
  return { sampleRate, channels: [left, right] };
}

const bytes = async (blob: Blob) => Buffer.from(await blob.arrayBuffer());

describe('PCM and WAV', () => {
  it('interleaves 16-bit samples, left first', () => {
    const pcm = new DataView(interleave16(sound()).buffer);
    expect(pcm.byteLength).toBe(2000 * 4);
    expect(pcm.getInt16(4 * 1000, true)).toBe(Math.round(0.5 * 32767));
    expect(pcm.getInt16(4 * 1000 + 2, true)).toBe(Math.round(-0.5 * 32767));
  });

  it('writes a valid WAV header', () => {
    const wav = Buffer.from(wavFile(sound()));
    expect(wav.toString('ascii', 0, 4)).toBe('RIFF');
    expect(wav.toString('ascii', 8, 12)).toBe('WAVE');
    expect(wav.readUInt16LE(22)).toBe(2);
    expect(wav.readUInt32LE(24)).toBe(8000);
    expect(wav.readUInt32LE(40)).toBe(2000 * 4);
  });
});

describe('sound in exports', () => {
  it('gives the MOV a PCM sound track', async () => {
    const mov = await bytes(
      await exportMov(syntheticSource(3), { platform: nodePlatform, sound: sound() }),
    );
    expect(mov.includes('soun')).toBe(true);
    expect(mov.includes('sowt')).toBe(true);
  });

  it('leaves the MOV silent without sound', async () => {
    const mov = await bytes(await exportMov(syntheticSource(3), { platform: nodePlatform }));
    expect(mov.includes('soun')).toBe(false);
  });

  it('puts a WAV beside the PNG frames', async () => {
    const zip = await bytes(
      await exportPngSequence(syntheticSource(2), {
        platform: nodePlatform,
        name: 'clip',
        sound: sound(),
      }),
    );
    expect(zip.includes('clip/clip.wav')).toBe(true);
    expect(zip.includes('clip/clip_0001.png')).toBe(true);
  });
});

/** An AudioEncoder stand-in that turns each block into one tiny frame. */
function fakeAudio(supported = true) {
  const blocks: number[] = [];
  class FakeData {
    constructor(readonly init: AudioDataInit) {}
    close() {}
  }
  class FakeEncoder {
    static async isConfigSupported(config: AudioEncoderConfig) {
      return { supported: supported && config.codec === 'mp4a.40.2', config };
    }
    state: CodecState = 'unconfigured';
    constructor(private readonly init: AudioEncoderInit) {}
    configure() {
      this.state = 'configured';
    }
    encode(data: FakeData) {
      blocks.push(data.init.numberOfFrames);
      this.init.output(
        { byteLength: 2, copyTo: (d: Uint8Array) => d.set([7, 7]) } as unknown as EncodedAudioChunk,
        {
          decoderConfig: {
            codec: 'mp4a.40.2',
            sampleRate: 8000,
            numberOfChannels: 2,
            description: new Uint8Array([0x15, 0x90]),
          },
        },
      );
    }
    async flush() {}
    close() {
      this.state = 'closed';
    }
  }
  return {
    api: { AudioEncoder: FakeEncoder, AudioData: FakeData } as unknown as AudioCodecsApi,
    blocks,
  };
}

describe('AAC', () => {
  it('encodes the soundtrack in blocks and keeps the encoder configuration', async () => {
    const fake = fakeAudio();
    const s = sound(48000); // 12000 frames: blocks of 4800, 4800, 2400
    const audio = await encodeAac(s, fake.api);
    expect(fake.blocks).toEqual([4800, 4800, 2400]);
    expect(audio?.frames).toHaveLength(3);
    expect([...(audio?.config ?? [])]).toEqual([0x15, 0x90]);
    expect(audio?.priming).toBe(1024);
  });

  it('reports when AAC is unavailable', async () => {
    const fake = fakeAudio(false);
    expect(await canEncodeAac(sound(), fake.api)).toBe(false);
    expect(await encodeAac(sound(), fake.api)).toBeNull();
  });
});
