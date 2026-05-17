// STORE_DEFERRED — Mağaza MVP'de kapalı. Bu dosya ileride DB'den beslenecek.
export type Product = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  emoji: string;
  bg: string;
  badge?: string;
  description: string;
  details: string[];
  rating: number;
  reviewCount: number;
};

export const CATEGORIES = ['Tümü', 'Kitap', 'Beslenme', 'Ekipman', 'Kırtasiye'];

export const PRODUCTS: Product[] = [
  {
    id: '1', name: 'Atomic Habits', price: 280, category: 'Kitap',
    emoji: '📚', bg: '#FFF3E0', badge: 'Çok Satan',
    description: 'James Clear\'ın dünyaca ünlü alışkanlık kitabı. Küçük değişimlerin büyük sonuçlar doğurduğunu bilimsel verilerle anlatıyor.',
    details: ['Yazar: James Clear', 'Sayfa: 320', 'Dil: Türkçe', 'Yayınevi: Olimpos'],
    rating: 4.9, reviewCount: 2840,
  },
  {
    id: '2', name: 'Deep Work', price: 240, category: 'Kitap',
    emoji: '🧠', bg: '#E8F4FD',
    description: 'Cal Newport\'un derin çalışma manifestosu. Dikkat dağınıklığına rağmen yoğun odak ile nasıl üretken olunur?',
    details: ['Yazar: Cal Newport', 'Sayfa: 296', 'Dil: Türkçe', 'Yayınevi: Bozak'],
    rating: 4.7, reviewCount: 1430,
  },
  {
    id: '3', name: '4 Saatlik İş Haftası', price: 220, category: 'Kitap',
    emoji: '⏱️', bg: '#F3E5F5',
    description: 'Tim Ferriss\'in verimliliği yeniden tanımlayan klasiği. Daha az çalışarak daha fazlasını başarmanın yolu.',
    details: ['Yazar: Tim Ferriss', 'Sayfa: 400', 'Dil: Türkçe', 'Yayınevi: Pegasus'],
    rating: 4.6, reviewCount: 980,
  },
  {
    id: '4', name: 'Dürüst Olmayan İnsanlar', price: 200, category: 'Kitap',
    emoji: '📖', bg: '#E8F5E9',
    description: 'Dan Ariely\'nin insan psikolojisini ve karar verme mekanizmalarını inceleyen çarpıcı kitabı.',
    details: ['Yazar: Dan Ariely', 'Sayfa: 280', 'Dil: Türkçe', 'Yayınevi: Optimist'],
    rating: 4.5, reviewCount: 760,
  },
  {
    id: '5', name: 'Whey Protein 2kg', price: 850, originalPrice: 1100, category: 'Beslenme',
    emoji: '💪', bg: '#FFF3E0', badge: 'Popüler',
    description: 'Çikolata aromalı whey protein tozu. Antrenman sonrası kas gelişimi için ideal, düşük yağ ve yüksek protein içeriği.',
    details: ['Servis başı protein: 24g', 'Porsiyon: 80 servis', 'Aroma: Çikolata', 'Gluten Free'],
    rating: 4.8, reviewCount: 3210,
  },
  {
    id: '6', name: 'Creatine 300g', price: 250, category: 'Beslenme',
    emoji: '⚡', bg: '#E3F2FD',
    description: 'Saf kreatin monohidrat. Güç, dayanıklılık ve kas hacmi artışı için bilimsel olarak kanıtlanmış takviye.',
    details: ['İçerik: %100 Kreatin Monohidrat', 'Servis: 5g/gün', '60 servis', 'Katkı maddesi yok'],
    rating: 4.7, reviewCount: 1850,
  },
  {
    id: '7', name: 'BCAA Amino Asit', price: 180, category: 'Beslenme',
    emoji: '🧪', bg: '#F3E5F5',
    description: 'Dallanmış zincirli amino asitler. Kas yıkımını önler, toparlanmayı hızlandırır ve antrenman performansını artırır.',
    details: ['L-Lösin: 3000mg', 'L-İzolosin: 1500mg', 'L-Valin: 1500mg', '30 servis'],
    rating: 4.5, reviewCount: 920,
  },
  {
    id: '8', name: 'Multivitamin 60tb', price: 150, category: 'Beslenme',
    emoji: '💊', bg: '#E8F5E9',
    description: 'Günlük vitamin ve mineral ihtiyacını karşılayan kapsamlı multivitamin. A\'dan Z\'ye 23 vitamin ve mineral.',
    details: ['60 tablet', 'Günde 1 tablet', 'Vitamin A, C, D, E, B kompleks', 'Demir & Çinko içerir'],
    rating: 4.4, reviewCount: 540,
  },
  {
    id: '9', name: 'Shaker Bardak', price: 120, category: 'Beslenme',
    emoji: '🥤', bg: '#FFF8E1',
    description: '600ml kapasiteli, sızdırmaz şaker. Protein tozu ve suplementleri kolayca karıştırmak için spiral tel yaylı.',
    details: ['600ml kapasite', 'BPA Free plastik', 'Çelik yay', 'Dishwasher safe'],
    rating: 4.3, reviewCount: 340,
  },
  {
    id: '10', name: 'Direnç Bandı Seti', price: 320, category: 'Ekipman',
    emoji: '🏋️', bg: '#FCE4EC', badge: 'Yeni',
    description: '5 farklı direnç seviyesinde latex bant seti. Ev egzersizleri için tam vücut antrenman imkânı.',
    details: ['5 farklı direnç', 'X-Light → X-Heavy', 'Taşıma çantası dahil', 'Latex malzeme'],
    rating: 4.6, reviewCount: 670,
  },
  {
    id: '11', name: 'Foam Roller', price: 280, category: 'Ekipman',
    emoji: '🔵', bg: '#E1F5FE',
    description: 'Yoğun dokulu EPP köpük rulo. Kas ağrılarını gidermek, esnekliği artırmak ve toparlanmayı hızlandırmak için.',
    details: ['Uzunluk: 60cm', 'Çap: 15cm', 'EPP köpük', 'Max 150kg'],
    rating: 4.5, reviewCount: 430,
  },
  {
    id: '12', name: 'Yoga Matı', price: 450, category: 'Ekipman',
    emoji: '🧘', bg: '#E8F5E9',
    description: '6mm kalınlığında kaymaz TPE yoga matı. Pilates, esneme ve meditasyon için konforlu yüzey.',
    details: ['6mm kalınlık', 'TPE malzeme', '183x61cm', 'Taşıma kayışı dahil'],
    rating: 4.7, reviewCount: 890,
  },
  {
    id: '13', name: 'Atlama İpi', price: 90, category: 'Ekipman',
    emoji: '🪢', bg: '#FFF3E0',
    description: 'Ayarlanabilir hızlı atlama ipi. Kardiyovasküler antrenman ve kondisyon geliştirme için ideal.',
    details: ['Çelik kablo', 'Ergonomik sap', 'Ayarlanabilir uzunluk', '270cm max'],
    rating: 4.2, reviewCount: 280,
  },
  {
    id: '14', name: 'Günlük Planlayıcı', price: 180, category: 'Kırtasiye',
    emoji: '📓', bg: '#FFF8E1', badge: 'Çok Satan',
    description: 'Tarihsiz günlük planlayıcı. Öncelik matrisi, alışkanlık takibi ve yansıma bölümleriyle rutinlerini yönet.',
    details: ['200 sayfa', 'A5 boyut', 'Sert kapak', 'Ribbon bookmark'],
    rating: 4.8, reviewCount: 1240,
  },
  {
    id: '15', name: 'Bullet Journal', price: 200, category: 'Kırtasiye',
    emoji: '📔', bg: '#F3E5F5',
    description: 'Noktalı kağıtlı bullet journal defteri. Kendi sisteminizi oluşturmak için sonsuz esneklik.',
    details: ['240 sayfa', 'A5 boyut', 'Noktalı kağıt', '120g GSM'],
    rating: 4.6, reviewCount: 720,
  },
  {
    id: '16', name: 'Motivasyon Defteri', price: 150, category: 'Kırtasiye',
    emoji: '✏️', bg: '#E8F4FD',
    description: 'Her sayfasında motivasyon alıntıları ve günlük hedef belirleme alanı olan özel tasarım defter.',
    details: ['180 sayfa', 'B5 boyut', 'Spiralli', 'Hedef takip bölümü'],
    rating: 4.4, reviewCount: 390,
  },
];
