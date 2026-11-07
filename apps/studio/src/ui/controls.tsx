/** Small form building blocks shared by every panel. */
import { createUniqueId, For, type JSX } from 'solid-js';

export function Field(props: {
  label: string;
  help?: string | undefined;
  for?: string;
  children: JSX.Element;
  inline?: boolean;
}) {
  return (
    <div classList={{ field: true, 'field-inline': props.inline }}>
      <label class="field-label" for={props.for}>
        {props.label}
      </label>
      {props.children}
      {props.help && <p class="field-help">{props.help}</p>}
    </div>
  );
}

export interface Option<V extends string | number> {
  readonly value: V;
  readonly label: string;
}

/** A row of mutually exclusive options: real radio inputs, styled as segments. */
export function Segmented<V extends string | number>(props: {
  label: string;
  value: V;
  options: readonly Option<V>[];
  onChange: (value: V) => void;
  small?: boolean;
}) {
  const name = createUniqueId();
  return (
    <fieldset class="segmented" classList={{ small: props.small }}>
      <legend class="visually-hidden">{props.label}</legend>
      <For each={props.options}>
        {(o) => (
          <label class="segment">
            <input
              type="radio"
              name={name}
              checked={o.value === props.value}
              onChange={() => props.onChange(o.value)}
            />
            <span>{o.label}</span>
          </label>
        )}
      </For>
    </fieldset>
  );
}

export function Switch(props: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = createUniqueId();
  return (
    <label class="switch" for={id}>
      <input
        id={id}
        type="checkbox"
        checked={props.checked}
        onChange={(e) => props.onChange(e.currentTarget.checked)}
      />
      <span class="switch-track" aria-hidden="true" />
      <span>{props.label}</span>
    </label>
  );
}

export function Slider(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onInput: (value: number) => void;
}) {
  const id = createUniqueId();
  return (
    <div class="field">
      <div class="slider-head">
        <label class="field-label" for={id}>
          {props.label}
        </label>
        <output for={id} class="slider-value">
          {props.display}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onInput={(e) => props.onInput(Number(e.currentTarget.value))}
      />
    </div>
  );
}
