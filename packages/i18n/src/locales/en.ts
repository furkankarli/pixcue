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
    editor: {
      topbar: {
        format: 'Format',
        share: 'Copy link',
        shareCopied: 'Link copied',
        shareFailed: 'Could not copy the link',
        presets: 'Saved',
        export: 'Export',
        menu: 'Menu',
      },
      formats: {
        youtube: 'YouTube',
        'youtube-4k': 'YouTube 4K',
        shorts: 'YouTube Shorts',
        tiktok: 'TikTok',
        reels: 'Instagram Reels',
        vertical: 'Vertical, all apps',
        'instagram-post': 'Instagram post',
        square: 'Square',
        groups: {
          horizontal: 'Horizontal',
          vertical: 'Vertical',
          feed: 'Feed',
        },
      },
      content: {
        reset: 'Reset {field} to default',
      },
      tabs: {
        templates: 'Templates',
        content: 'Content',
        style: 'Style',
        layout: 'Layout',
      },
      stage: {
        label: 'Preview',
        play: 'Play',
        pause: 'Pause',
        seek: 'Timeline',
        time: '{current} / {total} s',
        safeArea: 'Safe area',
        platformUi: 'App buttons',
        background: 'Background',
        backgrounds: {
          checker: 'Transparent',
          dark: 'Dark',
          light: 'Light',
        },
        dragHint: 'Drag the graphic to move it. Double-click resets the position.',
        loading: 'Loading fonts…',
      },
      style: {
        theme: 'Theme',
        themes: {
          tech: 'Tech',
          pixel: 'Pixel',
          pop: 'Pop',
          sade: 'Clean',
        },
        accent: 'Accent color',
        customColor: 'Custom color',
        resetColor: 'Use theme color',
        font: 'Title font',
        themeFont: 'Theme font',
        pixelFontNote: 'The pixel theme always uses its own pixel fonts.',
      },
      layout: {
        position: 'Position',
        positions: {
          tl: 'Top left',
          tc: 'Top center',
          tr: 'Top right',
          ml: 'Middle left',
          mc: 'Center',
          mr: 'Middle right',
          bl: 'Bottom left',
          bc: 'Bottom center',
          br: 'Bottom right',
        },
        size: 'Size',
        duration: 'Duration',
        seconds: '{value} s',
        resetPosition: 'Reset position',
        resetHelp: 'The graphic also stays inside the safe area of every format.',
      },
      list: {
        add: 'Add',
        remove: 'Remove',
        moveUp: 'Move up',
        moveDown: 'Move down',
        item: 'Item {number}',
        full: 'Up to {max} items',
      },
      export: {
        title: 'Export',
        editorQuestion: 'Which editor do you use?',
        format: 'Format',
        recommended: 'Recommended',
        editors: {
          davinci: 'DaVinci Resolve',
          premiere: 'Premiere Pro',
          'final-cut': 'Final Cut Pro',
          'capcut-desktop': 'CapCut (desktop)',
          'capcut-mobile': 'CapCut (phone)',
          edits: 'Instagram Edits',
          other: 'Something else',
        },
        howTo: {
          davinci: {
            import: 'Drag the MOV file into the Media Pool, then onto a track above your video.',
            use: 'Its transparency works right away; no keying needed.',
          },
          premiere: {
            import: 'Import the MOV file and place it on a track above your clip.',
            use: 'Premiere reads the alpha channel automatically.',
          },
          'final-cut': {
            import: 'Import the MOV file and drop it above your clip in the timeline.',
            use: 'It keeps its transparency.',
          },
          'capcut-desktop': {
            import: 'Import the MP4 and add it as an overlay above your video.',
            use: 'Turn on chroma key, pick the background color and raise the strength until it disappears.',
          },
          'capcut-mobile': {
            import: 'Save the video to your phone, then add it in CapCut as an overlay.',
            use: 'Use chroma key in its background removal options, pick the background color and adjust the strength.',
          },
          edits: {
            import: 'Save the video to your phone, then add it in Edits as an overlay.',
            use: 'Remove the background color with its chroma key tool.',
          },
          other: {
            import:
              'Choose WebM if your editor supports VP9 with alpha; otherwise use the PNG sequence.',
            use: 'Import a PNG sequence as one clip (an image sequence).',
          },
        },
        formats: {
          mov: {
            name: 'Transparent MOV',
            description: 'PNG codec with alpha. Works in every browser; files are large.',
          },
          'mp4-key': {
            name: 'Chroma key MP4',
            description: 'H.264 on a solid color you remove with chroma key.',
          },
          webm: {
            name: 'Transparent WebM',
            description: 'VP9 with alpha. Small files; not every editor reads it.',
          },
          'png-sequence': {
            name: 'PNG sequence',
            description: 'One transparent PNG per frame, in a zip.',
          },
        },
        keyColor: 'Background color',
        keyColors: {
          green: 'Green',
          blue: 'Blue',
          magenta: 'Magenta',
        },
        chromaMode: 'Chroma key mode',
        chromaModeHelp: 'Removes soft shadows and see-through edges so keying stays clean.',
        keyConflict:
          'Your accent color is close to this background color, so keying would cut into the graphic. Pick another background color.',
        frameRate: 'Frame rate',
        fps: '{fps} fps',
        start: 'Export',
        cancel: 'Cancel',
        close: 'Close',
        rendering: 'Rendering frame {current} of {total}…',
        packaging: 'Packaging the file…',
        done: 'Ready: {file}',
        download: 'Download again',
        share: 'Save to phone or share',
        unsupported:
          'This browser cannot encode this format. Choose the transparent MOV or the PNG sequence, or try Chrome or Edge.',
        failed: 'The export failed. Try again or choose another format.',
        cancelled: 'Export cancelled.',
      },
      presets: {
        title: 'Saved setups',
        name: 'Name',
        namePlaceholder: 'For example: review lower third',
        save: 'Save',
        empty: 'Nothing saved yet. Saved setups stay in this browser.',
        load: 'Load {name}',
        delete: 'Delete {name}',
        saved: 'Saved',
        unavailable: 'This browser does not allow saving.',
      },
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
      subscribe: {
        name: 'Subscribe button',
        fields: {
          button: 'Button text',
          done: 'Text after the click',
          like: 'Like button',
          bell: 'Notification bell',
          cursor: 'Mouse pointer',
        },
        sample: {
          subscribe: 'Subscribe',
          subscribed: 'Subscribed',
          follow: 'Follow',
          following: 'Following',
        },
      },
      scoreCard: {
        name: 'Score card',
        fields: {
          title: 'Product name',
          score: 'Score',
          max: 'Out of',
          label: 'Score label',
          categories: 'Categories',
          categoryName: 'Category',
          categoryScore: 'Score',
        },
        sample: {
          title: 'Wireless Headphones',
          label: 'Overall',
          category1: 'Design',
          category2: 'Performance',
          category3: 'Software',
          category4: 'Value for money',
        },
      },
      prosCons: {
        name: 'Pros and cons',
        fields: {
          prosTitle: 'Pros title',
          pros: 'Pros',
          consTitle: 'Cons title',
          cons: 'Cons',
          item: 'Item',
        },
        sample: {
          prosTitle: 'Pros',
          pro1: 'Three connection modes',
          pro2: 'Long battery life',
          pro3: 'Comfortable fit',
          consTitle: 'Cons',
          con1: 'No charging case',
          con2: 'Average microphone',
        },
      },
    },
  },
} satisfies { code: string; name: string; messages: MessageTree };
