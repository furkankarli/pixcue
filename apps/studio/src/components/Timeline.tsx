/**
 * The timeline: a ruler and one track holding the clip.
 * The clip shows a filmstrip of the graphic over time; dragging its right
 * edge changes the length. Clicking or dragging the ruler and track scrubs.
 * Both the playhead and the clip edge are keyboard sliders.
 */
import { render, scaleFrame } from '@pixcue/engine';
import { createEffect, createMemo, createSignal, For, onCleanup, onMount, Show } from 'solid-js';
import { locale, t } from '../i18n.ts';
import { whenIdle } from '../idle.ts';
import { displayTime, seek } from '../playback.ts';
import { MAX_DURATION } from '../state/editor-state.ts';
import { actions, duration, fontsVersion, frame, renderState, template } from '../store.ts';

/** Snap step for the clip length, in seconds. */
const LENGTH_STEP = 0.5;
/** Playhead step for arrow keys: one frame at 30 fps. */
const FRAME = 1 / 30;
/** Filmstrip frame height in CSS pixels (the track height minus its padding). */
const STRIP_H = 40;

/** Seconds the ruler shows: the clip plus room to lengthen it, in steps of 5. */
const spanFor = (length: number) =>
  Math.min(MAX_DURATION + 5, Math.max(10, Math.ceil((length + 2.5) / 5) * 5));

export function Timeline() {
  let area!: HTMLDivElement;
  let strip!: HTMLCanvasElement;
  const [width, setWidth] = createSignal(0);
  // While the clip edge is dragged the scale holds still under the pointer.
  const [frozenSpan, setFrozenSpan] = createSignal<number | null>(null);
  const span = () => frozenSpan() ?? spanFor(duration());
  const x = (seconds: number) => (seconds / span()) * width();

  onMount(() => {
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(area);
    onCleanup(() => observer.disconnect());
  });

  const short = createMemo(() => new Intl.NumberFormat(locale(), { maximumFractionDigits: 1 }));
  const seconds = (value: number) => t('editor.layout.seconds', { value: short().format(value) });

  /** Ruler marks: every second, labelled every second or every five. */
  const marks = createMemo(() => {
    const every = span() > 20 ? 5 : 1;
    return Array.from({ length: Math.floor(span()) + 1 }, (_, s) => ({
      s,
      major: s % every === 0,
    }));
  });

  // Scrubbing: the ruler and the empty track move the playhead.
  const timeAt = (clientX: number) => {
    const r = area.getBoundingClientRect();
    return ((clientX - r.left) / Math.max(1, r.width)) * span();
  };
  let scrubbing = false;
  const onScrubDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    scrubbing = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    seek(timeAt(e.clientX));
  };
  const onScrubMove = (e: PointerEvent) => {
    if (scrubbing) seek(timeAt(e.clientX));
  };
  const onScrubUp = () => {
    scrubbing = false;
  };

  // Clip length: drag the clip's right edge.
  const setLength = (value: number) => {
    const snapped = Math.round(value / LENGTH_STEP) * LENGTH_STEP;
    actions.setDuration(Math.min(MAX_DURATION, Math.max(template().minDuration, snapped)));
  };
  const onEdgeDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    setFrozenSpan(span());
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onEdgeMove = (e: PointerEvent) => {
    if (frozenSpan() !== null) setLength(timeAt(e.clientX));
  };
  const onEdgeUp = () => setFrozenSpan(null);

  const onPlayheadKey = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 1 : FRAME;
    const to = {
      ArrowLeft: displayTime() - step,
      ArrowRight: displayTime() + step,
      Home: 0,
      End: duration(),
    }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    seek(to);
  };
  const onEdgeKey = (e: KeyboardEvent) => {
    const to = {
      ArrowLeft: duration() - LENGTH_STEP,
      ArrowDown: duration() - LENGTH_STEP,
      ArrowRight: duration() + LENGTH_STEP,
      ArrowUp: duration() + LENGTH_STEP,
      Home: template().minDuration,
      End: MAX_DURATION,
    }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    setLength(to);
  };

  // Filmstrip: frames across the clip, cropped to the graphic, redrawn a
  // moment after the last edit so typing stays smooth.
  const offscreen = document.createElement('canvas');
  let pending: ReturnType<typeof setTimeout> | undefined;
  let cancelIdle: (() => void) | undefined;
  onCleanup(() => {
    clearTimeout(pending);
    cancelIdle?.();
  });
  createEffect(() => {
    fontsVersion();
    const clipWidth = x(duration());
    const output = scaleFrame(frame(), 480);
    const rs = renderState(output);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    clearTimeout(pending);
    cancelIdle?.();
    pending = setTimeout(
      () =>
        (cancelIdle = whenIdle(() => {
          const ctx = offscreen.getContext('2d');
          const view = strip.getContext('2d');
          if (!ctx || !view || clipWidth < 2) return;
          offscreen.width = output.pixelWidth;
          offscreen.height = output.pixelHeight;
          strip.width = Math.round(clipWidth * dpr);
          strip.height = Math.round(STRIP_H * dpr);
          view.clearRect(0, 0, strip.width, strip.height);
          try {
            const crop = render(ctx, rs.duration / 2, rs);
            const pad = Math.max(crop.width, crop.height) * 0.1;
            const sx = Math.max(0, crop.x - pad);
            const sy = Math.max(0, crop.y - pad);
            const sw = Math.min(output.pixelWidth - sx, crop.width + pad * 2);
            const sh = Math.min(output.pixelHeight - sy, crop.height + pad * 2);
            const cellH = strip.height;
            const cellW = Math.max(cellH, Math.min(cellH * 2.4, (sw / sh) * cellH));
            const count = Math.max(1, Math.round(strip.width / cellW));
            const w = strip.width / count;
            for (let i = 0; i < count; i++) {
              render(ctx, ((i + 0.5) / count) * rs.duration, rs);
              const k = Math.min(w / sw, cellH / sh);
              view.drawImage(
                offscreen,
                sx,
                sy,
                sw,
                sh,
                i * w + (w - sw * k) / 2,
                (cellH - sh * k) / 2,
                sw * k,
                sh * k,
              );
            }
          } catch (error) {
            console.error(error);
          }
        })),
      140,
    );
  });

  return (
    <section class="timeline" aria-label={t('editor.timeline.label')}>
      <div class="timeline-head">
        <div class="track-label" aria-hidden="true">
          {t(template().name)}
        </div>
      </div>

      <div class="timeline-tracks">
        <div
          class="timeline-area"
          ref={area}
          onPointerDown={onScrubDown}
          onPointerMove={onScrubMove}
          onPointerUp={onScrubUp}
          onPointerCancel={onScrubUp}
        >
          <div class="ruler" aria-hidden="true">
            <For each={marks()}>
              {(m) => (
                <span class="tick" classList={{ major: m.major }} style={{ left: `${x(m.s)}px` }}>
                  <Show when={m.major}>
                    <span class="tick-label">{m.s}</span>
                  </Show>
                </span>
              )}
            </For>
          </div>
          <div class="track">
            <div class="clip" style={{ width: `${x(duration())}px` }}>
              <canvas class="filmstrip" ref={strip} />
              <div
                class="clip-edge"
                classList={{ active: frozenSpan() !== null }}
                role="slider"
                tabIndex={0}
                aria-label={t('editor.layout.duration')}
                aria-valuemin={template().minDuration}
                aria-valuemax={MAX_DURATION}
                aria-valuenow={duration()}
                aria-valuetext={seconds(duration())}
                title={`${t('editor.layout.duration')}: ${seconds(duration())}`}
                onPointerDown={onEdgeDown}
                onPointerMove={onEdgeMove}
                onPointerUp={onEdgeUp}
                onPointerCancel={onEdgeUp}
                onKeyDown={onEdgeKey}
              />
            </div>
          </div>
          <div
            class="playhead"
            style={{ transform: `translateX(${x(displayTime())}px)` }}
            role="slider"
            tabIndex={0}
            aria-label={t('editor.timeline.playhead')}
            aria-valuemin={0}
            aria-valuemax={duration()}
            aria-valuenow={Math.round(displayTime() * 100) / 100}
            aria-valuetext={seconds(displayTime())}
            onKeyDown={onPlayheadKey}
          />
        </div>
      </div>
    </section>
  );
}
