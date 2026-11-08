/**
 * An inline color picker: a saturation and brightness square, a hue slider
 * and a hex field. It opens inside the panel, so it never lands off screen
 * the way a system color dialog can.
 */
import { createEffect, createSignal, createUniqueId } from 'solid-js';

interface Hsv {
  readonly h: number;
  readonly s: number;
  readonly v: number;
}

const HEX = /^#?([0-9a-f]{6})$/i;

export function hexToHsv(hex: string): Hsv | null {
  const m = HEX.exec(hex.trim());
  if (!m?.[1]) return null;
  const n = Number.parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  let h = 0;
  if (d > 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
  }
  return { h: (h * 60 + 360) % 360, s: max === 0 ? 0 : d / max, v: max };
}

export function hsvToHex({ h, s, v }: Hsv): string {
  const f = (k: number) => {
    const x = (k + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(x, 4 - x, 1));
  };
  const byte = (x: number) =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${byte(f(5))}${byte(f(3))}${byte(f(1))}`.toUpperCase();
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export function ColorPicker(props: {
  value: string;
  onChange: (hex: string) => void;
  labels: { area: string; hue: string; hex: string };
}) {
  const hexId = createUniqueId();
  const [hsv, setHsv] = createSignal<Hsv>(hexToHsv(props.value) ?? { h: 0, s: 1, v: 1 });
  const [draft, setDraft] = createSignal(props.value.toUpperCase());

  // Follow changes from outside (a swatch was picked) unless they are ours.
  createEffect(() => {
    const outside = props.value.toUpperCase();
    if (outside !== hsvToHex(hsv())) {
      const next = hexToHsv(outside);
      if (next) setHsv((cur) => (next.s === 0 || next.v === 0 ? { ...next, h: cur.h } : next));
    }
    setDraft(outside);
  });

  const commit = (next: Hsv) => {
    setHsv(next);
    props.onChange(hsvToHex(next));
  };

  let area!: HTMLDivElement;
  const pick = (e: PointerEvent) => {
    const r = area.getBoundingClientRect();
    commit({
      h: hsv().h,
      s: clamp01((e.clientX - r.left) / r.width),
      v: clamp01(1 - (e.clientY - r.top) / r.height),
    });
  };
  const onKey = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 0.1 : 0.02;
    const { h, s, v } = hsv();
    const next = {
      ArrowLeft: { h, s: clamp01(s - step), v },
      ArrowRight: { h, s: clamp01(s + step), v },
      ArrowUp: { h, s, v: clamp01(v + step) },
      ArrowDown: { h, s, v: clamp01(v - step) },
    }[e.key];
    if (!next) return;
    e.preventDefault();
    commit(next);
  };

  return (
    <div class="color-picker">
      <div
        ref={area}
        class="color-area"
        style={{ '--hue': `${hsv().h}` }}
        role="slider"
        tabIndex={0}
        aria-label={props.labels.area}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(hsv().s * 100)}
        aria-valuetext={`${Math.round(hsv().s * 100)}%, ${Math.round(hsv().v * 100)}%`}
        onPointerDown={(e) => {
          pick(e);
          area.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (area.hasPointerCapture(e.pointerId)) pick(e);
        }}
        onKeyDown={onKey}
      >
        <span
          class="color-thumb"
          style={{
            left: `${hsv().s * 100}%`,
            top: `${(1 - hsv().v) * 100}%`,
            background: hsvToHex(hsv()),
          }}
        />
      </div>
      <input
        class="hue-slider"
        type="range"
        min={0}
        max={359}
        step={1}
        value={Math.round(hsv().h)}
        aria-label={props.labels.hue}
        onInput={(e) => commit({ ...hsv(), h: Number(e.currentTarget.value) })}
      />
      <div class="color-hex">
        <span class="color-preview" style={{ background: hsvToHex(hsv()) }} />
        <label class="visually-hidden" for={hexId}>
          {props.labels.hex}
        </label>
        <input
          id={hexId}
          class="input mono"
          value={draft()}
          maxLength={7}
          spellcheck={false}
          onInput={(e) => {
            const v = e.currentTarget.value;
            setDraft(v);
            const next = hexToHsv(v);
            if (next) commit(next);
          }}
          onBlur={() => setDraft(hsvToHex(hsv()))}
        />
      </div>
    </div>
  );
}
