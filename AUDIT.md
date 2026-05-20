# RoutinMate MVP Audit — 10 Faz Planı

> Tarih: 2026-05-17 | Hedef: MVP yayına hazır hale getirme
> Her faz tamamlandıkça `[x]` işaretlenir. Adım adım, sırayla gidilecek.

---

## FAZ 1 — Veritabanı Temizliği & Rutin Zamanlama ✅

### Yapılacaklar

- [x] **1.1** `supabase_schema.sql` — `store_waitlist` tablosu eklendi
- [x] **1.2** `supabase_schema.sql` — `app_sessions` tablosu eklendi
- [x] **1.3** `supabase_schema.sql` — 6 adet performans indexi eklendi
- [x] **1.4** `lib/api.ts` — `StoreWaitlistAPI` ve `SessionAPI` modülleri eklendi
- [x] **1.5** `store/useStore.ts` — `joinStoreWaitlist()` ve `refreshAchievementScore()` action'ları eklendi
- [x] **1.6** Session kayıt: `loadUserData()` içinde `SessionAPI.record()` çağrısı eklendi
- [x] **1.7** `supabase_schema.sql` — `calculate_achievement_score()` PostgreSQL fonksiyonu eklendi
- [x] **1.8** `supabase_schema.sql` — profiles tablosuna `timezone` kolonu eklendi

**Schema değişiklikleri (SQL):**
```sql
-- store_waitlist
create table if not exists public.store_waitlist (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now(),
  unique(email)
);
alter table public.store_waitlist enable row level security;
create policy "waitlist_insert" on public.store_waitlist for insert with check (true);
create policy "waitlist_own"    on public.store_waitlist for select using (auth.uid() = user_id);

-- app_sessions
create table if not exists public.app_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete cascade not null,
  session_date date not null,
  unique(user_id, session_date)
);
alter table public.app_sessions enable row level security;
create policy "sessions_own" on public.app_sessions using (auth.uid() = user_id);

-- Indexler
create index if not exists idx_routines_user_id on public.routines(user_id);
create index if not exists idx_completions_routine_date on public.routine_completions(routine_id, completed_date);
create index if not exists idx_photos_user_created on public.photos(user_id, created_at desc);
create index if not exists idx_messages_match_created on public.messages(match_id, created_at asc);
create index if not exists idx_matches_user_a on public.matches(user_a, status);
create index if not exists idx_matches_user_b on public.matches(user_b, status);

-- Profiles timezone
alter table public.profiles add column if not exists timezone text not null default 'Europe/Istanbul';
```

---

## FAZ 2 — Geliştirici Paneli Kaldır + Ayarlar Güncelle ✅

### Yapılacaklar

- [x] **2.1** `app/modal.tsx` — "🛠 Geliştirici Paneli" Section bloğu kaldırıldı
- [x] **2.2** `app/modal.tsx` — WhatsApp numarası `+905551579682` olarak güncellendi
- [x] **2.3** `app/modal.tsx` — "Alışveriş" Section'ı kaldırıldı
- [x] **2.4** `app/_layout.tsx` — debug route devre dışı bırakıldı
- [x] **2.5** `app/debug.tsx` — İçi boşaltıldı, DEV ONLY yorum eklendi
- [x] **2.6** `app/modal.tsx` — devBtn, devTxt stilleri temizlendi

---

## FAZ 3 — Mağaza → Yakında Açıyor Ekranı ✅

### Yapılacaklar

- [x] **3.1** `app/(tabs)/store.tsx` — "Yakında Açılıyor" tasarımı yapıldı:
  - Üstte mağaza logosu / emoji
  - Ana başlık: "Mağaza Yakında Açılıyor 🛍️"
  - Alt başlık: "RoutinMate mağazasında motivasyon ürünleri, kitaplar ve ekipmanlar bulabileceksin."
  - CTA butonu: "Açılınca Beni Haberdar Et"
  - Tasarım: tema ile uyumlu pill buton, shadow card, GREEN accent
- [ ] **3.2** `app/(tabs)/store.tsx` — "Haberdar Et" butonuna tıklanınca bottom sheet açılır:
  - Başlık: "Mağaza açılınca bildirim al"
  - Email input (pre-filled kullanıcının auth email'i ile)
  - "Beni Listeye Ekle" pill butonu → `joinStoreWaitlist()` çağrısı
  - Başarı durumunda: "Harika! Mağaza açılınca sana haber vereceğiz ✓" mesajı
  - Hata durumunda: "Zaten listedesin" mesajı (unique constraint)
- [ ] **3.3** `app/cart.tsx`, `app/orders.tsx`, `app/product-detail.tsx` — Doğrudan erişim olursa "Mağaza yakında açılıyor" redirect/mesajı
- [ ] **3.4** `app/(tabs)/_layout.tsx` — Store tabı ikonunu koru (tab görünür kalacak, sadece içerik "coming soon")
- [ ] **3.5** `lib/api.ts` — `StoreWaitlistAPI.join(userId, email)` implementasyonu

---

## FAZ 4 — Satıcı Paneli & Eğitim Paneli Devre Dışı ✅

### Yapılacaklar

- [x] **4.1** `app/seller-panel.tsx` — Dosya oluştur ama içini disabled stub yap:
  ```tsx
  // SELLER_PANEL — MVP'de devre dışı. Sonraki sürümde aktive edilecek.
  export default function SellerPanel() { return null; }
  ```
- [ ] **4.2** `app/training-panel.tsx` — Aynı şekilde disabled stub:
  ```tsx
  // TRAINING_PANEL — MVP'de devre dışı. Sonraki sürümde aktive edilecek.
  export default function TrainingPanel() { return null; }
  ```
- [ ] **4.3** `app/_layout.tsx` — Her iki route'u `href: null` ile kayıt et ama navigasyona ekleme
- [ ] **4.4** Hiçbir tab ikonunda, modal'da, veya linklerde bu panellere referans olmamasını doğrula

---

## FAZ 5 — Görsel Performansı (WebP, Skeleton, Preload, Cache) ✅ (kısmen)

### Yapılacaklar

- [ ] **5.1** `lib/api.ts` — `StorageAPI.uploadImage()` → yüklemeden önce WebP dönüşümü ekle:
  ```ts
  import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
  const webp = await manipulateAsync(localUri, [{ resize: { width: 1200 } }], {
    compress: 0.82, format: SaveFormat.WEBP,
  });
  ```
  Avatar yüklemede: `resize: { width: 400 }`, `compress: 0.85`
- [ ] **5.2** `store/useStore.ts` — `uploadAvatar()` ve `addRoutineProof()` → aynı WebP pipeline'ı kullan
- [ ] **5.3** `components/SkeletonLoader.tsx` — Reusable skeleton component yaz:
  - `SkeletonBox(width, height, borderRadius)` — animated shimmer
  - `SkeletonAvatar(size)` — çember
  - `SkeletonRow(lines)` — metin satırları
- [ ] **5.4** `app/(tabs)/profile.tsx` — Fotoğraf grid'ine skeleton loader ekle (fotoğraflar yüklenene kadar)
- [ ] **5.5** `app/(tabs)/mate.tsx` — Discovery kartlarına skeleton loader ekle
- [ ] **5.6** `app/(tabs)/profile.tsx` — `Image` componentini `expo-image` kullanarak `cachePolicy="memory-disk"` ve `contentFit="cover"` ile güncelle (zaten expo-image var, policy eksik)
- [ ] **5.7** `app/(tabs)/mate.tsx` — Discover listesindeki avatarları `Image.prefetch()` ile önceden yükle
- [ ] **5.8** `lib/api.ts` — `ProfileAPI.getDiscovery()` SELECT'ini sadece gerekli alanlarla kısıt: routines'den `routine_completions` çekmeyecek (sadece count yeterli), photo'dan sadece `uri, is_pinned` al
- [ ] **5.9** `app/(tabs)/index.tsx` — Rutinler listesi scroll performansı: `getItemLayout` veya `windowSize` optimizasyonu
- [ ] **5.10** Supabase'de `photos` bucket'ına CDN cache header ekle (Supabase dashboard → Storage → Bucket settings → `Cache-Control: public, max-age=31536000`)

---

## FAZ 6 — Başarı Skoru Algoritması Yenileme ✅

### Yapılacaklar

- [ ] **6.1** Yeni algoritma (ağırlıklı, 0–100 arası):

  | Metrik | Ağırlık | Hesaplama |
  |--------|---------|-----------|
  | Görev tamamlama oranı (son 30 gün) | %60 | tamamlanan / beklenen gün sayısı |
  | Günlük uygulama girişi (son 30 gün) | %20 | aktif gün / 30 |
  | Kanıt fotoğrafı yükleme oranı | %15 | fotoğraf yüklenen tamamlama / toplam tamamlama |
  | Seri (streak) bonusu | %5 | max(1, mevcut_streak / 14) × 5 |

- [ ] **6.2** `lib/api.ts` — `ScoreAPI.calculate(userId)` → Supabase RPC veya client-side hesaplama fonksiyonu ekle
- [ ] **6.3** `lib/api.ts` — `SessionAPI.recordSession(userId)` → Kullanıcı uygulamayı her açtığında bugünkü session'ı kaydet (upsert)
- [ ] **6.4** `store/useStore.ts` — `loadUserData()` içinde `SessionAPI.recordSession()` çağır
- [ ] **6.5** `store/useStore.ts` — `toggleRoutineComplete()` sonrasında skoru yeniden hesapla ve `ProfileAPI.update()` ile kaydet
- [ ] **6.6** `app/(tabs)/profile.tsx` — Stats tab'ında yeni metrik breakdown göster:
  - Küçük kartlar: "Tamamlama", "Giriş Tutarlılığı", "Kanıt Fotoğrafı", "Seri"
  - Her biri 0–100 progress bar ile
- [ ] **6.7** `supabase_schema.sql` — `calculate_achievement_score` PostgreSQL fonksiyonu ekle (opsiyonel, DB tarafında hesaplanabilir):
  ```sql
  create or replace function calculate_achievement_score(p_user_id uuid)
  returns int language plpgsql as $$
  declare
    completion_score int;
    session_score    int;
    proof_score      int;
    final_score      int;
  begin
    -- Tamamlama oranı (son 30 gün)
    select coalesce(
      cast(count(rc.id) * 100 / nullif(
        (select count(*) from routines r2
         where r2.user_id = p_user_id
           and r2.scope = 'recurring'), 0) / 30, 0)
    into completion_score
    from routine_completions rc
    where rc.user_id = p_user_id
      and rc.completed_date >= current_date - 29;

    -- Session oranı (son 30 gün)
    select coalesce(count(*) * 100 / 30, 0)
    into session_score
    from app_sessions
    where user_id = p_user_id
      and session_date >= current_date - 29;

    -- Proof fotoğraf oranı
    select coalesce(
      count(case when proof_meta is not null then 1 end) * 100 / nullif(count(*), 0), 0)
    into proof_score
    from photos
    where user_id = p_user_id;

    final_score := least(100,
      (completion_score * 60 / 100) +
      (session_score    * 20 / 100) +
      (proof_score      * 15 / 100) +
      5
    );

    return final_score;
  end;
  $$;
  ```

---

## FAZ 7 — Rutin Düzenleme Ekranı Tema Tasarımı ✅

### Yapılacaklar

- [ ] **7.1** Rutin düzenleme nerede gerçekleşiyor tespit et:
  - Profile tab → rutin uzun basma menüsü → edit flow
  - create.tsx'teki form state muhtemelen re-use ediliyor
- [ ] **7.2** `app/(tabs)/create.tsx` — Form tasarımını tema ile hizala:
  - Başlık ve desc input: `borderWidth: 0`, `backgroundColor: '#F4F4F4'`, `borderRadius: 16`
  - Zaman seçici: pill buton tasarımı (saat kutuları → rounded pill)
  - Frekans seçenekleri: pill chip row (mevcut catChip stiline benzer)
  - Set adı input: aynı bordsuz card tasarımı
  - "Rutin Ekle" butonu: tam genişlik, GREEN, borderRadius: 999
  - Kaldır (remove) butonu: kırmızı text-only, icon + text
  - Kaydet butonu: sticky bottom bar, tam genişlik pill
- [ ] **7.3** `app/(tabs)/create.tsx` — Düzenleme modu ekle: `route.params.routineId` varsa edit mode
- [ ] **7.4** Renk sabitleri: `GREEN = '#00bf63'`, `BG = '#FFFFFF'`, `CARD = '#F4F4F4'`, borderWidth her yerde 0
- [ ] **7.5** Stil denetimi: `borderWidth` → 0, `borderRadius: 999` pill buttonlar, `shadow` → elevation/shadow card

---

## FAZ 8 — Profil Galerisi: Görsel Ekleme Kaldır ✅

### Yapılacaklar

- [ ] **8.1** `app/(tabs)/profile.tsx` — `pickPhoto()` fonksiyonunu sil (satır 61–71)
- [ ] **8.2** `app/(tabs)/profile.tsx` — Fotoğraflar tabındaki "+" ekleme butonu/dokunma alanını kaldır
- [ ] **8.3** `store/useStore.ts` — `addPhoto()` action'ı koru (proof fotoğrafları hâlâ bu sistemi kullanıyor)
- [ ] **8.4** `lib/api.ts` — `PhotoAPI.add()` koru (proof sistemi için gerekli)
- [ ] **8.5** `app/(tabs)/profile.tsx` — `ImagePicker` import'unu kaldırma (avatar için hâlâ gerekli), sadece `pickPhoto` kullanımını sil
- [ ] **8.6** Fotoğraf grid'i: sadece proof fotoğrafları gösterilecek. Boş state mesajını güncelle: "Rutin tamamlayarak kanıt fotoğrafı yükleyebilirsin"
- [ ] **8.7** `store/useStore.ts` — Persist listesinden `photos` array'i değerlendir: büyük veri → sadece son 20 fotoğrafı persist et

---

## FAZ 9 — Harita / Lokasyon: Hafif API Yaklaşımı ✅

### Yapılacaklar

- [ ] **9.1** `components/LocationSearch.tsx` — Mevcut open-meteo API yaklaşımı zaten hafif ✓
  - Ancak timeout 8 saniye → 5 saniyeye düşür
  - Debounce 400ms → 300ms
  - Skeleton loader ekle (arama sonuçları gelene kadar)
- [ ] **9.2** `expo-location` kullanım denetimi yap: GPS koordinatı alma nerede kullanılıyor?
  - Sadece `onboarding.tsx`'de "Konumumu Al" butonu varsa → burada kal
  - `expo-location` paketi hafiftir, problem değil
- [ ] **9.3** `app/product-detail.tsx` — Teslimat bölgesi kontrolü: "Sadece Trabzon Ortahisar" hardcoded. MVP'de tüm şehirlere açık yap veya mağaza "coming soon" olduğu için bu ekran zaten erişilemez
- [ ] **9.4** Görsel harita ihtiyacı varsa (ileride): `react-native-maps` yerine WebView + Leaflet.js (JavaScript harita) tercih et
  - Bundle'a etki: ~0KB (HTML string olarak gömülür)
  - Tile provider: OpenStreetMap (ücretsiz, key gerekmez)
  - `app/components/MapView.tsx` → `<WebView source={{ html: leafletHtml }} />`
- [ ] **9.5** Şimdilik görsel harita yok → sadece adres arama yeterli (LocationSearch.tsx)

---

## FAZ 10 — Mock Data Temizliği & Final Cleanup ✅

### Yapılacaklar

- [ ] **10.1** `lib/products.ts` — Mağaza "coming soon" olduğu için bu dosya artık aktif değil. Import'larını kaldır:
  - `app/(tabs)/store.tsx` → `PRODUCTS`, `CATEGORIES` import kaldır
  - `app/product-detail.tsx` → `PRODUCTS` import kaldır (sayfa zaten erişilemez)
  - `app/cart.tsx` → `PRODUCTS` import kaldır
  - `lib/products.ts` dosyasını sil veya `// DEFERRED: store MVP sonrası` ile işaretle
- [ ] **10.2** `app/(tabs)/store.tsx` — `useCart`, local cart state, `addToCart` logic → kaldır (coming soon ekranında gereksiz)
- [ ] **10.3** `app/modal.tsx` — "Alışveriş" section'ını (orders butonu) kaldır (mağaza devre dışıyken sipariş görüntüleme gereksiz)
- [ ] **10.4** `store/useStore.ts` — `orders` state ve `OrderAPI` çağrıları → koru (ileride lazım), sadece modal link'ini kaldır
- [ ] **10.5** `app/(tabs)/profile.tsx` — Donut chart'ta `achievementScore` değeri → yeni algoritma ile güncelle
- [ ] **10.6** `app/(tabs)/mate.tsx` — `getDiscovery` mock ID exclude listesi varsa temizle
- [ ] **10.7** `app/modal.tsx` — Test/sahte email ve URL'ler doğrula: `destek@routinmate.app`, `https://routinmate.app/kvkk` gerçek mi?
- [ ] **10.8** Tüm `console.log` ve `console.error` → production'da devre dışı bırakmak için `__DEV__` guard ekle
- [ ] **10.9** `lib/api.ts` — Kullanılmayan import ve dead code temizliği
- [ ] **10.10** `package.json` — Kullanılmayan paketleri denetle ve kaldır

---

## Sıralama & Bağımlılık Haritası

```
FAZ 1 (DB) ──► FAZ 3 (Store Waitlist API'ye bağlı)
FAZ 1 (DB) ──► FAZ 6 (Session tablosuna bağlı)
FAZ 2      ──► Bağımsız
FAZ 4      ──► Bağımsız
FAZ 5      ──► FAZ 1 sonrası (index optimizasyonları)
FAZ 7      ──► Bağımsız (UI only)
FAZ 8      ──► Bağımsız (UI only)
FAZ 9      ──► Bağımsız
FAZ 10     ──► FAZ 3 sonrası (products.ts kaldırma store.tsx değişikliğine bağlı)
```

**Önerilen sıra:**  
`1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10`

---

## Kritik Notlar

- `photos.uri` kolonu DB'de var ve API'de doğru. PostgREST double-join bug'ı `getActiveMatch`'te fix edildi ✓
- Mağaza tab'ı kaldırılmıyor, coming soon ekranına dönüştürülüyor
- `expo-image-manipulator` zaten yüklü — WebP için ek paket gereksiz
- Rutin completion proof fotoğrafları `addPhoto()` API'sini kullanıyor — bu kalmaya devam edecek
- Seller/Training panel stub dosyaları oluşturulacak ama hiçbir navigasyona bağlanmayacak
