import type en from './locales/en.ts';

/** A nested tree of message strings. */
export interface MessageTree {
  readonly [key: string]: string | MessageTree;
}

/** Same shape as `T`, with every leaf widened to `string`. */
type DeepStrings<T> = { readonly [K in keyof T]: T[K] extends string ? string : DeepStrings<T[K]> };

/** The message shape every locale must provide. English is the source of truth. */
export type Messages = DeepStrings<(typeof en)['messages']>;

/** Dot-separated path to every leaf message, e.g. `"settings.language"`. */
export type MessageKey<T = Messages, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : MessageKey<T[K], `${P}${K}.`>;
}[keyof T & string];

export interface Locale {
  /** BCP 47 language tag, e.g. `"tr"` or `"pt-BR"`. Must match the file name. */
  readonly code: string;
  /** Language name written in that language, e.g. `"Türkçe"`. */
  readonly name: string;
  readonly messages: Messages;
}

/** Values for `{placeholder}` interpolation. */
export type MessageParams = Readonly<Record<string, string | number>>;
