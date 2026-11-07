import type { MessageTree } from '../types.ts';

/**
 * English: the source locale. Every other locale provides exactly these keys.
 * Use `{name}` placeholders for values filled in at runtime.
 */
export default {
  code: 'en',
  name: 'English',
  messages: {
    app: {
      tagline: 'Motion graphics for video creators, right in your browser.',
      comingSoon: 'The editor is on its way.',
    },
    settings: {
      language: 'Language',
    },
    templates: {
      lowerThird: {
        name: 'Lower third',
        fields: {
          tag: 'Tag',
          tagHelp: 'Leave empty to hide it.',
          title: 'Title',
          subtitle: 'Subtitle',
        },
        sample: {
          tag: 'Review',
          title: 'Wireless Headphones',
          subtitle: 'Sound, battery life and connection tests',
        },
      },
      chapterTitle: {
        name: 'Chapter title',
        fields: {
          kicker: 'Chapter label',
          kickerHelp: 'Shown under the line. Leave empty to hide it.',
          title: 'Title',
        },
        sample: {
          kicker: 'Chapter 01',
          title: 'Unboxing',
        },
      },
      specCard: {
        name: 'Spec card',
        fields: {
          header: 'Title',
          rows: 'Rows',
          rowLabel: 'Label',
          rowValue: 'Value',
        },
        sample: {
          header: 'Specs',
          row1Label: 'Driver',
          row1Value: '40 mm dynamic',
          row2Label: 'Battery',
          row2Value: '30 hours',
          row3Label: 'Connection',
          row3Value: 'Bluetooth 5.3',
        },
      },
      callout: {
        name: 'Callout',
        fields: {
          title: 'Title',
          subtitle: 'Subtitle',
          direction: 'Direction',
          right: 'Right',
          left: 'Left',
        },
        sample: {
          title: '40 mm driver',
          subtitle: 'Deep, clear bass',
        },
      },
    },
  },
} satisfies { code: string; name: string; messages: MessageTree };
