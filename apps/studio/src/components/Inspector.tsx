/**
 * Tabbed side panel (WAI-ARIA tabs): Content is generated from the template's
 * fields; Style and Layout are shared by every template. On narrow screens the
 * template library is one more tab.
 */
import type { Field } from '@pixcue/templates';
import { createSignal, createUniqueId, For, type JSX, Match, Switch } from 'solid-js';
import { t } from '../i18n.ts';
import { template } from '../store.ts';
import { FieldControl } from './fields/FieldControl.tsx';
import { LayoutPanel } from './LayoutPanel.tsx';
import { Library } from './Library.tsx';
import { StylePanel } from './StylePanel.tsx';

export type InspectorTab = 'templates' | 'content' | 'style' | 'layout';

export function ContentPanel() {
  return (
    <div class="panel-stack">
      <For each={Object.entries(template().fields) as [string, Field][]}>
        {([name, field]) => <FieldControl name={name} field={field} />}
      </For>
    </div>
  );
}

export function Inspector(props: { tabs: readonly InspectorTab[] }) {
  const [chosen, setChosen] = createSignal<InspectorTab>('content');
  const current = () => (props.tabs.includes(chosen()) ? chosen() : (props.tabs[0] ?? 'content'));
  const id = createUniqueId();
  const tabButtons: HTMLButtonElement[] = [];

  const onKeyDown = (e: KeyboardEvent) => {
    const i = props.tabs.indexOf(current());
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: props.tabs.length - 1 }[
      e.key
    ];
    if (next === undefined) return;
    e.preventDefault();
    const index = (next + props.tabs.length) % props.tabs.length;
    const tab = props.tabs[index];
    if (tab) setChosen(tab);
    tabButtons[index]?.focus();
  };

  const panels: Record<InspectorTab, () => JSX.Element> = {
    templates: () => <Library />,
    content: () => <ContentPanel />,
    style: () => <StylePanel />,
    layout: () => <LayoutPanel />,
  };

  return (
    <div class="inspector">
      <div class="tabs" role="tablist" aria-label={t('editor.stage.label')} onKeyDown={onKeyDown}>
        <For each={props.tabs}>
          {(tab, i) => (
            <button
              ref={(el) => {
                tabButtons[i()] = el;
              }}
              type="button"
              role="tab"
              id={`${id}-${tab}`}
              aria-selected={current() === tab}
              aria-controls={`${id}-panel`}
              tabIndex={current() === tab ? 0 : -1}
              class="tab"
              onClick={() => setChosen(tab)}
            >
              {t(`editor.tabs.${tab}`)}
            </button>
          )}
        </For>
      </div>
      <div
        class="tab-panel"
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-${current()}`}
      >
        <Switch>
          <For each={props.tabs}>
            {(tab) => <Match when={current() === tab}>{panels[tab]()}</Match>}
          </For>
        </Switch>
      </div>
    </div>
  );
}
