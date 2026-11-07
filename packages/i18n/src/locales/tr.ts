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
    },
  },
});
