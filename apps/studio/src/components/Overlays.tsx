/**
 * Preview overlays in design units: the safe area, and a generic mock of the
 * app UI that covers vertical videos (no logos), to check what stays visible.
 */
import type { Frame } from '@pixcue/engine';
import { For, Show } from 'solid-js';

export function SafeAreaOverlay(props: { frame: Frame }) {
  return (
    <rect
      class="overlay-safe"
      x={props.frame.safeArea.x}
      y={props.frame.safeArea.y}
      width={props.frame.safeArea.width}
      height={props.frame.safeArea.height}
      vector-effect="non-scaling-stroke"
    />
  );
}

/** Rough shapes of the UI each app draws over a video. */
export function PlatformOverlay(props: { frame: Frame }) {
  const W = () => props.frame.width;
  const H = () => props.frame.height;
  const vertical = () =>
    props.frame.orientation === 'vertical' && props.frame.preset !== 'instagram-post';
  return (
    <g class="overlay-ui">
      <Show when={vertical()}>
        {/* tabs at the top */}
        <rect x={W() / 2 - 230} y={92} width={180} height={34} rx={17} />
        <rect x={W() / 2 + 30} y={92} width={200} height={34} rx={17} />
        {/* action buttons on the right */}
        <For each={[0, 1, 2, 3]}>
          {(i) => (
            <>
              <circle cx={W() - 80} cy={H() - 900 + i * 165} r={42} />
              <rect x={W() - 112} y={H() - 845 + i * 165} width={64} height={18} rx={9} />
            </>
          )}
        </For>
        {/* account, caption and sound rows */}
        <circle cx={92} cy={H() - 400} r={42} />
        <rect x={150} y={H() - 418} width={300} height={36} rx={18} />
        <rect x={50} y={H() - 335} width={700} height={28} rx={14} />
        <rect x={50} y={H() - 290} width={520} height={28} rx={14} />
        {/* navigation bar */}
        <rect x={0} y={H() - 150} width={W()} height={150} />
      </Show>
      <Show when={props.frame.preset === 'youtube' || props.frame.preset === 'youtube-4k'}>
        {/* player controls */}
        <rect x={40} y={H() - 72} width={W() - 80} height={8} rx={4} />
        <circle cx={70} cy={H() - 32} r={18} />
        <rect x={110} y={H() - 42} width={160} height={20} rx={10} />
        <rect x={W() - 240} y={H() - 42} width={200} height={20} rx={10} />
      </Show>
    </g>
  );
}
