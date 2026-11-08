/**
 * Helpers for format tests: they need ffmpeg and ffprobe on PATH (CI installs
 * them; locally, install ffmpeg to run `pnpm test:formats`).
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export function ffmpeg(args: string[]): Buffer {
  return execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    maxBuffer: 1 << 30,
  });
}

export interface ProbeStream {
  codec_name: string;
  codec_type?: string;
  sample_rate?: string;
  channels?: number;
  duration?: string;
  pix_fmt?: string;
  width: number;
  height: number;
  r_frame_rate: string;
  time_base?: string;
  nb_read_frames?: string;
  extradata?: string;
  tags?: Record<string, string>;
}

export interface ProbePacket {
  pts: number;
  dts: number;
  pos: string;
  size: string;
  flags: string;
}

export function ffprobe(
  file: string,
  extra: string[] = [],
): {
  streams: ProbeStream[];
  packets?: ProbePacket[];
  frames?: { best_effort_timestamp_time?: string }[];
  format: { format_name: string; duration?: string };
} {
  const out = execFileSync('ffprobe', [
    '-v',
    'error',
    '-print_format',
    'json',
    '-show_streams',
    '-show_format',
    ...extra,
    file,
  ]);
  return JSON.parse(out.toString());
}

/** Decodes every frame to raw RGBA. */
export function decodeRgba(file: string, decoder: string[] = []): Buffer {
  return ffmpeg([...decoder, '-i', file, '-f', 'rawvideo', '-pix_fmt', 'rgba', 'pipe:1']);
}

/** MD5 of every decoded frame, in order. */
/** One hash per decoded video frame (sound tracks are left out). */
export function frameHashes(file: string): string[] {
  return ffmpeg(['-i', file, '-map', '0:v', '-f', 'framemd5', 'pipe:1'])
    .toString()
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => l.split(',').at(-1)?.trim() ?? '');
}

/** Parses ffprobe's hexdump format ("00000000: 0164 001f ...  .d..") into bytes. */
export function hexdumpBytes(dump: string): Uint8Array {
  const hex = dump
    .split('\n')
    .map((line) => line.split(': ')[1]?.slice(0, 39) ?? '')
    .join('')
    .replace(/\s+/g, '');
  return Uint8Array.from(hex.match(/../g) ?? [], (h) => Number.parseInt(h, 16));
}

/** A temporary directory removed by the returned cleanup function. */
export function tempDir(): {
  dir: string;
  file: (name: string, data?: Uint8Array) => string;
  cleanup: () => void;
} {
  const dir = mkdtempSync(join(tmpdir(), 'pixcue-format-'));
  return {
    dir,
    file: (name, data) => {
      const path = join(dir, name);
      if (data) writeFileSync(path, data);
      return path;
    },
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}
