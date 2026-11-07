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
      callout: {
        name: 'İşaretçi',
        fields: {
          title: 'Başlık',
          subtitle: 'Alt yazı',
          direction: 'Yön',
          right: 'Sağa',
          left: 'Sola',
        },
        sample: {
          title: '40 mm sürücü',
          subtitle: 'Derin ve net bas',
        },
      },
      subscribe: {
        name: 'Abone ol butonu',
        fields: {
          button: 'Buton yazısı',
          done: 'Tıklandıktan sonraki yazı',
          like: 'Beğeni butonu',
          bell: 'Bildirim zili',
          cursor: 'Fare imleci',
        },
        sample: {
          subscribe: 'Abone ol',
          subscribed: 'Abone olundu',
          follow: 'Takip et',
          following: 'Takip ediliyor',
        },
      },
      scoreCard: {
        name: 'Puan kartı',
        fields: {
          title: 'Ürün adı',
          score: 'Puan',
          max: 'Üzerinden',
          label: 'Puan etiketi',
          categories: 'Kategoriler',
          categoryName: 'Kategori',
          categoryScore: 'Puan',
        },
        sample: {
          title: 'Kablosuz Kulaklık',
          label: 'Genel puan',
          category1: 'Tasarım',
          category2: 'Performans',
          category3: 'Yazılım',
          category4: 'Fiyat / performans',
        },
      },
      prosCons: {
        name: 'Artılar ve eksiler',
        fields: {
          prosTitle: 'Artılar başlığı',
          pros: 'Artılar',
          consTitle: 'Eksiler başlığı',
          cons: 'Eksiler',
          item: 'Madde',
        },
        sample: {
          prosTitle: 'Artılar',
          pro1: 'Üç bağlantı modu',
          pro2: 'Uzun pil ömrü',
          pro3: 'Rahat kullanım',
          consTitle: 'Eksiler',
          con1: 'Şarj kutusu yok',
          con2: 'Mikrofon ortalama',
        },
      },
    },
  },
});
