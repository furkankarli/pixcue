/**
 * Builds the editor control for one template field. Field types come from the
 * template API, so new templates get their form for free.
 */
import type { Field, ItemField, ListField } from '@pixcue/templates';
import { createUniqueId, For, Match, Show, Switch as SolidSwitch } from 'solid-js';
import { t } from '../../i18n.ts';
import { actions, edits, fields } from '../../store.ts';
import { Segmented, Switch } from '../../ui/controls.tsx';
import { ChevronDownIcon, ChevronUpIcon, PlusIcon, ResetIcon, TrashIcon } from '../../ui/icons.tsx';

type Item = Record<string, string | number>;

function value(key: string): unknown {
  return (fields() as Record<string, unknown>)[key];
}

function ResetButton(props: { key: string; label: string }) {
  return (
    <Show when={Object.hasOwn(edits().fields, props.key)}>
      <button
        type="button"
        class="icon-button ghost small"
        onClick={() => actions.resetField(props.key)}
        title={t('editor.content.reset', { field: props.label })}
        aria-label={t('editor.content.reset', { field: props.label })}
      >
        <ResetIcon />
      </button>
    </Show>
  );
}

function ListEditor(props: { name: string; field: ListField }) {
  const items = () => (value(props.name) as Item[] | undefined) ?? [];
  const set = (next: Item[]) => actions.setField(props.name, next);
  const columns = () => Object.entries(props.field.item) as [string, ItemField][];
  const blank = (): Item =>
    Object.fromEntries(columns().map(([k, c]) => [k, c.type === 'number' ? c.min : ''])) as Item;
  const move = (i: number, by: number) => {
    const next = [...items()];
    const [moved] = next.splice(i, 1);
    if (moved) next.splice(i + by, 0, moved);
    set(next);
  };

  return (
    <div class="list-editor">
      <For each={items()}>
        {(item, i) => (
          <div class="list-row">
            <div class="list-cells">
              <For each={columns()}>
                {([key, col]) => (
                  <input
                    class="input"
                    type={col.type === 'number' ? 'number' : 'text'}
                    aria-label={`${t(col.label)} ${i() + 1}`}
                    placeholder={t(col.label)}
                    value={item[key] ?? ''}
                    maxLength={col.type === 'text' ? col.maxLength : undefined}
                    min={col.type === 'number' ? col.min : undefined}
                    max={col.type === 'number' ? col.max : undefined}
                    step={col.type === 'number' ? col.step : undefined}
                    onInput={(e) => {
                      const raw = e.currentTarget.value;
                      const v = col.type === 'number' ? Number(raw) : raw;
                      if (col.type === 'number' && (raw === '' || !Number.isFinite(v))) return;
                      set(items().map((it, j) => (j === i() ? { ...it, [key]: v } : it)));
                    }}
                  />
                )}
              </For>
            </div>
            <div class="list-actions">
              <button
                type="button"
                class="icon-button ghost small"
                disabled={i() === 0}
                onClick={() => move(i(), -1)}
                aria-label={t('editor.list.moveUp')}
              >
                <ChevronUpIcon />
              </button>
              <button
                type="button"
                class="icon-button ghost small"
                disabled={i() === items().length - 1}
                onClick={() => move(i(), 1)}
                aria-label={t('editor.list.moveDown')}
              >
                <ChevronDownIcon />
              </button>
              <button
                type="button"
                class="icon-button ghost small"
                disabled={items().length <= props.field.min}
                onClick={() => set(items().filter((_, j) => j !== i()))}
                aria-label={`${t('editor.list.remove')} ${i() + 1}`}
              >
                <TrashIcon />
              </button>
            </div>
          </div>
        )}
      </For>
      <button
        type="button"
        class="button ghost"
        disabled={items().length >= props.field.max}
        onClick={() => set([...items(), blank()])}
      >
        <PlusIcon />
        {items().length >= props.field.max
          ? t('editor.list.full', { max: props.field.max })
          : t('editor.list.add')}
      </button>
    </div>
  );
}

export function FieldControl(props: { name: string; field: Field }) {
  const id = createUniqueId();
  const label = () => t(props.field.label);
  const help = () => (props.field.help ? t(props.field.help) : undefined);

  return (
    <div class="field">
      <SolidSwitch>
        <Match when={props.field.type === 'boolean'}>
          <div class="field-inline">
            <Switch
              label={label()}
              checked={Boolean(value(props.name))}
              onChange={(v) => actions.setField(props.name, v)}
            />
            <ResetButton key={props.name} label={label()} />
          </div>
        </Match>
        <Match when={true}>
          <div class="field-head">
            <label class="field-label" for={id}>
              {label()}
            </label>
            <ResetButton key={props.name} label={label()} />
          </div>
          <SolidSwitch>
            <Match when={props.field.type === 'text' && props.field}>
              {(f) => (
                <input
                  id={id}
                  class="input"
                  type="text"
                  maxLength={f().maxLength}
                  value={String(value(props.name) ?? '')}
                  onInput={(e) => actions.setField(props.name, e.currentTarget.value)}
                />
              )}
            </Match>
            <Match when={props.field.type === 'longText' && props.field}>
              {(f) => (
                <textarea
                  id={id}
                  class="input"
                  rows={3}
                  maxLength={f().maxLength}
                  value={String(value(props.name) ?? '')}
                  onInput={(e) => actions.setField(props.name, e.currentTarget.value)}
                />
              )}
            </Match>
            <Match when={props.field.type === 'number' && props.field}>
              {(f) => (
                <input
                  id={id}
                  class="input"
                  type="number"
                  min={f().min}
                  max={f().max}
                  step={f().step}
                  value={Number(value(props.name))}
                  onInput={(e) => {
                    const v = e.currentTarget.valueAsNumber;
                    if (Number.isFinite(v)) actions.setField(props.name, v);
                  }}
                />
              )}
            </Match>
            <Match when={props.field.type === 'color'}>
              <input
                id={id}
                class="color-input"
                type="color"
                value={String(value(props.name))}
                onInput={(e) => actions.setField(props.name, e.currentTarget.value)}
              />
            </Match>
            <Match when={props.field.type === 'select' && props.field}>
              {(f) => (
                <Segmented
                  label={label()}
                  value={String(value(props.name))}
                  options={f().options.map((o) => ({ value: o.value, label: t(o.label) }))}
                  onChange={(v) => actions.setField(props.name, v)}
                />
              )}
            </Match>
            <Match when={props.field.type === 'list' && props.field}>
              {(f) => <ListEditor name={props.name} field={f()} />}
            </Match>
          </SolidSwitch>
        </Match>
      </SolidSwitch>
      <Show when={help()}>
        <p class="field-help">{help()}</p>
      </Show>
    </div>
  );
}
