/**
 * A dropdown: a button that opens a small panel of controls. It uses the
 * Popover API, so the panel sits in the top layer (never clipped by a
 * scrolling panel), closes on Escape and on a click outside, and returns
 * focus to its button. It is a disclosure, not an ARIA menu: the panel holds
 * ordinary buttons, switches and selects.
 */
import { createContext, createSignal, createUniqueId, type JSX, useContext } from 'solid-js';

const CloseMenu = createContext<() => void>(() => {});

/** Closes the menu the caller sits in (after an action that is done). */
export const useCloseMenu = () => useContext(CloseMenu);

export function Menu(props: {
  /** Accessible name of the button (and its tooltip when it shows only an icon). */
  label: string;
  /** What the button shows. */
  trigger: JSX.Element;
  class?: string;
  /** Which edge of the button the panel lines up with. */
  align?: 'start' | 'end';
  /** Open upwards (for menus near the bottom of the screen). */
  up?: boolean;
  children: JSX.Element;
}) {
  const id = createUniqueId();
  const [open, setOpen] = createSignal(false);
  let button!: HTMLButtonElement;
  let panel!: HTMLDivElement;

  const place = () => {
    const r = button.getBoundingClientRect();
    const w = panel.offsetWidth;
    const h = panel.offsetHeight;
    const left = props.align === 'end' ? r.right - w : r.left;
    panel.style.left = `${Math.max(8, Math.min(left, innerWidth - w - 8))}px`;
    panel.style.top = `${props.up ? Math.max(8, r.top - h - 6) : r.bottom + 6}px`;
  };

  const close = () => panel.hidePopover();

  return (
    <CloseMenu.Provider value={close}>
      <button
        ref={button}
        type="button"
        class={props.class ?? 'button ghost'}
        aria-expanded={open()}
        aria-controls={id}
        aria-label={props.label}
        title={props.label}
        onClick={() => panel.togglePopover()}
      >
        {props.trigger}
      </button>
      <div
        ref={panel}
        id={id}
        class="menu"
        popover="auto"
        onToggle={(e) => {
          const isOpen = (e as ToggleEvent).newState === 'open';
          setOpen(isOpen);
          if (isOpen) place();
        }}
      >
        {props.children}
      </div>
    </CloseMenu.Provider>
  );
}
