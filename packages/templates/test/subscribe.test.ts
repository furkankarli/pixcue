import { createTranslator } from '@pixcue/i18n';
import { describe, expect, it } from 'vitest';
import { resolveFields } from '../src/api.ts';
import { subscribe } from '../src/subscribe.ts';
import { renderFrame } from './render-helpers.ts';

const defaults = (locale: 'en' | 'tr', platform: 'youtube' | 'tiktok' | 'instagram' | 'any') =>
  resolveFields(subscribe, {}, { t: createTranslator(locale), locale, platform });

describe('subscribe', () => {
  it('says Subscribe on YouTube and Follow elsewhere, in each language', () => {
    expect(defaults('en', 'youtube')).toMatchObject({
      button: 'Subscribe',
      done: 'Subscribed',
      bell: true,
    });
    expect(defaults('en', 'tiktok')).toMatchObject({
      button: 'Follow',
      done: 'Following',
      bell: false,
    });
    expect(defaults('tr', 'youtube')).toMatchObject({ button: 'Abone ol', done: 'Abone olundu' });
    expect(defaults('tr', 'instagram')).toMatchObject({
      button: 'Takip et',
      done: 'Takip ediliyor',
    });
  });

  it('keeps text the user typed when the platform changes', () => {
    const v = resolveFields(
      subscribe,
      { button: 'Katıl' },
      { t: createTranslator('tr'), locale: 'tr', platform: 'tiktok' },
    );
    expect(v.button).toBe('Katıl');
  });

  it('draws different labels of the same width differently in pixel mode', () => {
    const draw = (button: string) =>
      Buffer.from(
        renderFrame({
          template: subscribe,
          theme: 'pixel',
          preset: 'youtube',
          t: 1,
          overrides: { button },
        }).ctx.getImageData(0, 0, 1920, 1080).data,
      );
    expect(draw('ABCD').equals(draw('DCBA'))).toBe(false);
  });
});
