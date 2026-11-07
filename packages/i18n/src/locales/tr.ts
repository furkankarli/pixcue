import { defineLocale } from '../define.ts';

export default defineLocale({
  code: 'tr',
  name: 'Türkçe',
  messages: {
    app: {
      tagline: 'İçerik üreticileri için tarayıcıda çalışan hareketli grafikler.',
      comingSoon: 'Editör çok yakında.',
    },
    settings: {
      language: 'Dil',
    },
    templates: {
      lowerThird: {
        name: 'Alt bant',
        fields: {
          tag: 'Etiket',
          tagHelp: 'Boş bırakırsan görünmez.',
          title: 'Başlık',
          subtitle: 'Alt yazı',
        },
        sample: {
          tag: 'İnceleme',
          title: 'Kablosuz Kulaklık',
          subtitle: 'Ses, pil ömrü ve bağlantı testleri',
        },
      },
      chapterTitle: {
        name: 'Bölüm başlığı',
        fields: {
          kicker: 'Bölüm etiketi',
          kickerHelp: 'Çizginin altında görünür. Boş bırakırsan gizlenir.',
          title: 'Başlık',
        },
        sample: {
          kicker: 'Bölüm 01',
          title: 'Kutu açılışı',
        },
      },
      specCard: {
        name: 'Özellik kartı',
        fields: {
          header: 'Başlık',
          rows: 'Satırlar',
          rowLabel: 'Etiket',
          rowValue: 'Değer',
        },
        sample: {
          header: 'Özellikler',
          row1Label: 'Sürücü',
          row1Value: '40 mm dinamik',
          row2Label: 'Pil',
          row2Value: '30 saat',
          row3Label: 'Bağlantı',
          row3Value: 'Bluetooth 5.3',
        },
      },
    },
  },
});
