/** File names and saving: download on desktop, the share sheet on phones. */

const TURKISH: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', i: 'i', ö: 'o', ş: 's', ü: 'u' };

/** A short, safe file-name part: "Kablosuz Kulaklık!" → "kablosuz-kulaklik". */
export function slug(text: string, max = 40): string {
  return text
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğıöşü]/g, (c) => TURKISH[c] ?? c)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max)
    .replace(/-+$/, '');
}

/** Joins non-empty slugs: `fileName(['Alt bant', 'Kablosuz Kulaklık', 'youtube'], 'mov')`. */
export function fileName(parts: readonly string[], extension: string): string {
  const base =
    parts
      .map((p) => slug(p))
      .filter(Boolean)
      .join('-') || 'pixcue';
  return `${base}.${extension}`;
}

export function download(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/** Whether this browser can hand a file to the share sheet (phones). */
export function canShareFile(file: File): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] })
  );
}

/** Opens the share sheet; returns false if sharing failed and a download is needed. Must run in a click. */
export async function shareFile(file: File): Promise<boolean> {
  try {
    await navigator.share({ files: [file], title: file.name });
    return true;
  } catch (error) {
    // The user closing the sheet is not a failure.
    return error instanceof DOMException && error.name === 'AbortError';
  }
}
