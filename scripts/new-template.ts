/**
 * Scaffolds a new template:
 *
 *   pnpm new-template <id>        e.g. pnpm new-template quote-card
 *
 * Creates packages/templates/src/<id>.ts with a small working template, adds
 * its strings to every locale (English placeholders marked for translation),
 * and registers it. Then run `pnpm test` and `pnpm test:visual`.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATES = join(ROOT, 'packages/templates/src');
const LOCALES = join(ROOT, 'packages/i18n/src/locales');

export interface Names {
  /** kebab-case id, file name and URL value */
  readonly id: string;
  /** camelCase, used for the export and message keys */
  readonly camel: string;
  /** PascalCase, used for types */
  readonly pascal: string;
  /** Title Case placeholder text */
  readonly title: string;
}

export function namesFor(id: string): Names {
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(id)) {
    throw new Error(
      `"${id}" is not a valid id: use lowercase words separated by dashes, e.g. quote-card`,
    );
  }
  const words = id.split('-');
  const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);
  return {
    id,
    camel: words[0] + words.slice(1).map(cap).join(''),
    pascal: words.map(cap).join(''),
    title: cap(words.join(' ')),
  };
}

/** Source of a new template file. Kept in sync with docs/templates.md by a test. */
export function templateSource(n: Names, apiImport = './api.ts'): string {
  return `/**
 * ${n.title}: describe what it shows and where it sits.
 */
import {
  envelope,
  PIXEL_PANEL_FILL,
  type PixelScene,
  type PixelText,
  pixelPanel,
  pixelTextStyles,
  popScale,
  textWidth,
  themeCase,
  themeFont,
  typedVisible,
  upper,
  type VectorScene,
  withAlpha,
} from '@pixcue/engine';
import { defineTemplate, type FieldValues, field } from '${apiImport}';

// Fields become the editor form. Labels and sample text live in the locale files.
const fields = {
  title: field.text({
    label: 'templates.${n.camel}.fields.title',
    maxLength: 40,
    default: ({ t }) => t('templates.${n.camel}.sample.title'),
  }),
};

export type ${n.pascal}Fields = FieldValues<typeof fields>;

// Vector themes (tech, pop, sade), in design units: every frame's short side is 1080.
const vector: VectorScene<${n.pascal}Fields> = {
  // The graphic's natural size; the engine anchors it and shrinks it to fit.
  measure(c, { fields, theme, locale }) {
    const width = textWidth(c, themeCase(theme, fields.title, locale), themeFont(theme, 'display', 64));
    return { w: width + 120, h: 160 };
  },

  // One frame at time \`t\` (seconds), with the origin at the graphic's top-left.
  draw(c, t, { fields, theme, accent, locale, duration, box }) {
    // Fade in over 0–0.5 s, out over the last 0.4 s; nothing is drawn while hidden.
    const show = envelope(t, duration, 0, 0.5, 0.4, 0);
    if (show <= 0) return;
    withAlpha(c, show, () => {
      theme.panel(c, 0, 0, box.w, box.h);
      c.fillStyle = accent;
      c.fillRect(0, box.h - 8, box.w * show, 8);
      const font = themeFont(theme, 'display', 64);
      const title = themeCase(theme, fields.title, locale);
      theme.heading(c, title, box.w / 2, 104 + (1 - show) * 20, font, 'center', theme.colors.text, accent);
    });
  },
};

interface PixelBox {
  readonly w: number;
  readonly h: number;
  readonly title: PixelText;
}

// The pixel theme, in grid cells (6 output pixels each at 1080p).
const pixel: PixelScene<${n.pascal}Fields, PixelBox> = {
  measure({ fields, accent, locale }) {
    const title = pixelTextStyles.title(upper(fields.title, locale), accent);
    // The panel sprite adds a 3-cell shadow below.
    return { w: title.w + 16, h: title.h + 8 + 3, title };
  },

  draw(P, t, { accent, duration, box }) {
    // Pop in from the second frame (so the first stays empty), pop out at the end.
    const k = popScale(t, 1 / 30, duration - 0.3, P.px);
    if (k === 0) return;
    const panel = pixelPanel(box.w, box.h - 3, PIXEL_PANEL_FILL);
    if (k !== P.px) {
      P.pop(panel, 0, 0, k);
      return;
    }
    P.img(panel, 0, 0);
    P.rect(4, 4, 2, box.h - 11, accent);
    P.text(box.title, 8, 3, typedVisible(t, 0.3, box.title.length, duration - 0.6));
  },
};

export const ${n.camel} = defineTemplate({
  id: '${n.id}',
  name: 'templates.${n.camel}.name',
  duration: 4,
  minDuration: 2,
  position: 'mc',
  fields,
  render: { vector, pixel },
});
`;
}

/** Message block for a locale file, indented for the `templates` object. */
export function messagesSource(n: Names, translateNote: boolean): string {
  const note = translateNote ? '      // TODO(i18n): translate\n' : '';
  return `${note}      ${n.camel}: {
        name: '${n.title}',
        fields: {
          title: 'Title',
        },
        sample: {
          title: '${n.title}',
        },
      },
`;
}

function insertBefore(file: string, marker: string, text: string, last = true): void {
  const s = readFileSync(file, 'utf8');
  const i = last ? s.lastIndexOf(marker) : s.indexOf(marker);
  if (i < 0) throw new Error(`Could not find where to insert in ${file}`);
  writeFileSync(file, s.slice(0, i) + text + s.slice(i));
}

export function scaffold(id: string): string[] {
  const n = namesFor(id);
  const file = join(TEMPLATES, `${id}.ts`);
  if (existsSync(file)) throw new Error(`${file} already exists`);

  writeFileSync(file, templateSource(n));
  const touched = [file];

  for (const locale of readdirSync(LOCALES).filter((f) => f.endsWith('.ts') && f !== 'index.ts')) {
    const path = join(LOCALES, locale);
    // The `templates` object is the last one in each locale's messages.
    insertBefore(path, '    },\n  },\n}', messagesSource(n, locale !== 'en.ts'));
    touched.push(path);
  }

  const registry = join(TEMPLATES, 'registry.ts');
  insertBefore(
    registry,
    "import type { Template } from './api.ts';",
    `import { ${n.camel} } from './${id}.ts';\n`,
    false,
  );
  insertBefore(registry, '];', `  ${n.camel},\n`);
  const index = join(TEMPLATES, 'index.ts');
  insertBefore(index, "export * from './registry.ts';", `export * from './${id}.ts';\n`, false);
  touched.push(registry, index);
  return touched;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const id = process.argv[2];
  if (!id) {
    console.error('Usage: pnpm new-template <id>   (for example: pnpm new-template quote-card)');
    process.exit(1);
  }
  try {
    const files = scaffold(id);
    execFileSync('pnpm', ['exec', 'biome', 'check', '--write', ...files], {
      cwd: ROOT,
      stdio: 'ignore',
    });
    const n = namesFor(id);
    console.log(`Created packages/templates/src/${id}.ts and registered "${n.camel}".

Next steps:
  1. Design it in packages/templates/src/${id}.ts (see docs/templates.md).
  2. Write its labels and sample text in packages/i18n/src/locales/*.ts
     (non-English files have English placeholders marked "TODO(i18n)").
  3. pnpm test && pnpm test:visual   # the first visual run writes its baselines
  4. Look at the PNGs in packages/templates/test/__snapshots__/${id}/ and commit.`);
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }
}
