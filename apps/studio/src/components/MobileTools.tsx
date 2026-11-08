/**
 * The phone editor's tools: a bar along the bottom (format, templates, text,
 * style, layout) and the sheet one of them opens above it. The preview keeps the
 * rest of the screen; tapping the open tool again closes the sheet.
 */
import { createSignal, type JSX, Match, Show, Switch } from 'solid-js';
import { t } from '../i18n.ts';
import {
  CloseIcon,
  FormatIcon,
  LayoutIcon,
  StyleIcon,
  TemplatesIcon,
  TextIcon,
} from '../ui/icons.tsx';
import { FormatOptions } from './FormatPicker.tsx';
import { ContentPanel } from './Inspector.tsx';
import { LayoutPanel } from './LayoutPanel.tsx';
import { Library } from './Library.tsx';
import { StylePanel } from './StylePanel.tsx';

type Tool = 'format' | 'templates' | 'content' | 'style' | 'layout';

const TOOLS: readonly { id: Tool; icon: (props: { size?: number }) => JSX.Element }[] = [
  { id: 'format', icon: FormatIcon },
  { id: 'templates', icon: TemplatesIcon },
  { id: 'content', icon: TextIcon },
  { id: 'style', icon: StyleIcon },
  { id: 'layout', icon: LayoutIcon },
];

const toolLabel = (tool: Tool) =>
  tool === 'format' ? t('editor.topbar.format') : t(`editor.tabs.${tool}`);

export function MobileTools() {
  const [open, setOpen] = createSignal<Tool | null>(null);
  return (
    <>
      <Show when={open()}>
        {(tool) => (
          <section class="sheet" id="tool-sheet" aria-label={toolLabel(tool())}>
            <header class="sheet-header">
              <h2>{toolLabel(tool())}</h2>
              <button
                type="button"
                class="icon-button ghost"
                aria-label={t('editor.sheet.close')}
                onClick={() => setOpen(null)}
              >
                <CloseIcon />
              </button>
            </header>
            <div class="sheet-body">
              <Switch>
                <Match when={tool() === 'format'}>
                  <FormatOptions />
                </Match>
                <Match when={tool() === 'templates'}>
                  <Library />
                </Match>
                <Match when={tool() === 'content'}>
                  <ContentPanel />
                </Match>
                <Match when={tool() === 'style'}>
                  <StylePanel />
                </Match>
                <Match when={tool() === 'layout'}>
                  <LayoutPanel />
                </Match>
              </Switch>
            </div>
          </section>
        )}
      </Show>
      <nav class="toolbar" aria-label={t('editor.sheet.tools')}>
        {TOOLS.map((tool) => (
          <button
            type="button"
            class="tool"
            aria-pressed={open() === tool.id}
            aria-controls={open() ? 'tool-sheet' : undefined}
            onClick={() => setOpen((cur) => (cur === tool.id ? null : tool.id))}
          >
            <tool.icon />
            <span>{toolLabel(tool.id)}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
