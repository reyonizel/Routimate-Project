import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Alert, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { PRODUCTS } from '../lib/products';
import { useStore } from '../store/useStore';
import ErrorView from '../components/ErrorView';

const { width: SW } = Dimensions.get('window');

const BG = '#FFFFFF'; const CARD = '#F4F4F4'; const SURFACE = '#EEEEEE';
const TEXT = '#111111'; const TEXT2 = '#767676'; const TEXT3 = '#ABABAB';
const GREEN = '#00bf63'; const GOLD = '#D4860A'; const BORDER = '#E8E8E8';

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons
          key={i}
          name={i <= Math.floor(rating) ? 'star' : i - rating < 1 ? 'star-half' : 'star-outline'}
          size={14}
          color={GOLD}
        />
      ))}
    </View>
  );
}

function isDeliverable(locationName?: string | null): boolean {
  if (!locationName) return false;
  const loc = locationName.toLowerCase();
  return loc.includes('trabzon') && loc.includes('ortahisar');
}

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const locationName = useStore(s => s.user.locationName);
  const canDeliver = isDeliverable(locationName);

  const [inCart, setInCart] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [ordered, setOrdered] = useState(false);

  const product = PRODUCTS.find(p => p.id === id);

  if (!product) {
    return (
      <SafeAreaView style={s.container} edges={['top', 'bottom']}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={TEXT} />
        </TouchableOpacity>
        <ErrorView variant="not_found" onRetry={() => router.back()} retryLabel="Geri Dön" />
      </SafeAreaView>
    );
  }

  const handleOrder = () => {
    const ph = phone.trim();
    const addr = address.trim();
    if (ph.length < 10) { Alert.alert('Hata', 'Geçerli bir telefon numarası gir.'); return; }
    if (addr.length < 10) { Alert.alert('Hata', 'Lütfen açık adresini yaz.'); return; }
    setCheckoutOpen(false);
    setOrdered(true);
    Alert.alert(
      '🎉 Siparişin Alındı!',
      `"${product.name}" için siparişin oluşturuldu.\n\nKapıda ödeme: ₺${product.price}\nAdres: ${addr}\nTelefon: ${ph}\n\nKargo 3-5 iş günü içinde kapına gelecek.`,
      [{ text: 'Harika!' }]
    );
  };

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      {/* Back button */}
      <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
        <Ionicons name="arrow-back" size={22} color={TEXT} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[s.hero, { backgroundColor: product.bg }]}>
          <Text style={s.heroEmoji}>{product.emoji}</Text>
          {product.badge && (
            <View style={s.heroBadge}>
              <Text style={s.heroBadgeTxt}>{product.badge}</Text>
            </View>
          )}
        </View>

        <View style={s.body}>
          {/* Category + Name */}
          <Text style={s.category}>{product.category.toUpperCase()}</Text>
          <Text style={s.name}>{product.name}</Text>

          {/* Rating */}
          <View style={s.ratingRow}>
            <StarRating rating={product.rating} />
            <Text style={s.ratingVal}>{product.rating}</Text>
            <Text style={s.ratingCount}>({product.reviewCount} değerlendirme)</Text>
          </View>

          {/* Price */}
          <View style={s.priceRow}>
            <Text style={s.price}>₺{product.price}</Text>
            {product.originalPrice && (
              <Text style={s.originalPrice}>₺{product.originalPrice}</Text>
            )}
            {product.originalPrice && (
              <View style={s.discountBadge}>
                <Text style={s.discountTxt}>
                  %{Math.round((1 - product.price / product.originalPrice) * 100)} İndirim
                </Text>
              </View>
            )}
          </View>

          <View style={s.divider} />

          {/* Description */}
          <Text style={s.sectionTitle}>Ürün Açıklaması</Text>
          <Text style={s.description}>{product.description}</Text>

          {/* Details */}
          <Text style={[s.sectionTitle, { marginTop: 20 }]}>Ürün Detayları</Text>
          <View style={s.detailsGrid}>
            {product.details.map((d, i) => (
              <View key={i} style={s.detailChip}>
                <Ionicons name="checkmark-circle" size={14} color={GREEN} />
                <Text style={s.detailTxt}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Shipping info */}
          <View style={s.shippingBox}>
            <View style={s.shippingRow}>
              <Ionicons name="cube-outline" size={18} color={GREEN} />
              <Text style={s.shippingTxt}>Ücretsiz kargo · 3-5 iş günü</Text>
            </View>
            <View style={s.shippingRow}>
              <Ionicons name="shield-checkmark-outline" size={18} color={GREEN} />
              <Text style={s.shippingTxt}>14 gün iade garantisi</Text>
            </View>
            <View style={s.shippingRow}>
              <Ionicons name="cash-outline" size={18} color={GREEN} />
              <Text style={s.shippingTxt}>Kapıda ödeme</Text>
            </View>
          </View>

          {/* Delivery zone notice */}
          {!canDeliver && (
            <View style={s.zoneBox}>
              <Ionicons name="location-outline" size={20} color={GOLD} />
              <View style={{ flex: 1 }}>
                <Text style={s.zoneTxt}>Teslimat Bölgesi Dışındasın</Text>
                <Text style={s.zoneSub}>
                  Şu an yalnızca <Text style={{ fontWeight: '800' }}>Trabzon Ortahisar</Text> bölgesine teslimat yapılmaktadır.
                  {locationName ? ` (Konumun: ${locationName})` : ' Profilinde konumunu güncelle.'}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Sticky bottom bar */}
      <View style={s.bottomBar}>
        <View style={s.bottomPrice}>
          <Text style={s.bottomPriceLabel}>Fiyat</Text>
          <Text style={s.bottomPriceVal}>₺{product.price}</Text>
        </View>
        {canDeliver ? (
          <TouchableOpacity
            style={[s.cartBtn, ordered && s.cartBtnDone]}
            onPress={ordered ? undefined : () => setCheckoutOpen(true)}
            activeOpacity={ordered ? 1 : 0.85}
          >
            <Ionicons name={ordered ? 'checkmark' : 'bag-add-outline'} size={20} color="#fff" />
            <Text style={s.cartBtnTxt}>{ordered ? 'Sipariş Verildi' : 'Sipariş Ver'}</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.cartBtnDisabled}>
            <Ionicons name="location-outline" size={20} color={TEXT3} />
            <Text style={s.cartBtnDisabledTxt}>Teslimat Yok</Text>
          </View>
        )}
      </View>

      {/* Checkout Modal */}
      <Modal visible={checkoutOpen} transparent animationType="slide" onRequestClose={() => setCheckoutOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setCheckoutOpen(false)} />
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Sipariş Bilgileri</Text>
            <Text style={s.sheetSub}>Kapıda ödeme · Sadece Trabzon Ortahisar</Text>

            <View style={s.sheetProduct}>
              <Text style={s.sheetProductEmoji}>{product.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.sheetProductName}>{product.name}</Text>
                <Text style={s.sheetProductPrice}>₺{product.price}</Text>
              </View>
            </View>

            <View style={s.inputWrap}>
              <Text style={s.inputLabel}>TELEFON NUMARASI</Text>
              <TextInput
                style={s.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="0555 123 45 67"
                placeholderTextColor={TEXT3}
                keyboardType="phone-pad"
                selectionColor={GREEN}
              />
              <View style={s.inputLine} />
            </View>

            <View style={s.inputWrap}>
              <Text style={s.inputLabel}>AÇIK ADRES</Text>
              <TextInput
                style={[s.input, { minHeight: 60, textAlignVertical: 'top' }]}
                value={address}
                onChangeText={setAddress}
                placeholder="Mahalle, sokak, bina no, daire..."
                placeholderTextColor={TEXT3}
                multiline
                selectionColor={GREEN}
              />
              <View style={s.inputLine} />
            </View>

            <View style={s.sheetInfo}>
              <Ionicons name="information-circle-outline" size={16} color={TEXT3} />
              <Text style={s.sheetInfoTxt}>Ödeme kapıda nakit olarak alınır. Kurye sizi arayacaktır.</Text>
            </View>

            <TouchableOpacity style={s.orderBtn} onPress={handleOrder} activeOpacity={0.85}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={s.orderBtnTxt}>Siparişi Onayla — ₺{product.price}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  backBtn: {
    position: 'absolute', top: 56, left: 16, zIndex: 10,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4,
  },

  hero: { width: '100%', height: SW * 0.65, alignItems: 'center', justifyContent: 'center' },
  heroEmoji: { fontSize: 96 },
  heroBadge: { position: 'absolute', top: 16, right: 16, backgroundColor: GREEN, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  heroBadgeTxt: { fontSize: 11, fontWeight: '800', color: '#fff' },

  body: { paddingHorizontal: 20, paddingTop: 20 },

  category: { fontSize: 11, fontWeight: '700', color: GREEN, letterSpacing: 1.2, marginBottom: 6 },
  name: { fontSize: 24, fontWeight: '900', color: TEXT, letterSpacing: -0.5, marginBottom: 10 },

  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  ratingVal: { fontSize: 14, fontWeight: '800', color: TEXT },
  ratingCount: { fontSize: 13, color: TEXT3 },

  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  price: { fontSize: 28, fontWeight: '900', color: TEXT },
  originalPrice: { fontSize: 18, color: TEXT3, textDecorationLine: 'line-through' },
  discountBadge: { backgroundColor: '#FFF3E0', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  discountTxt: { fontSize: 12, fontWeight: '800', color: GOLD },

  divider: { height: 0.5, backgroundColor: BORDER, marginBottom: 20 },

  sectionTitle: { fontSize: 15, fontWeight: '800', color: TEXT, marginBottom: 8 },
  description: { fontSize: 14, color: TEXT2, lineHeight: 22 },

  detailsGrid: { gap: 8 },
  detailChip: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailTxt: { fontSize: 14, color: TEXT2 },

  shippingBox: { marginTop: 20, backgroundColor: GREEN + '10', borderRadius: 14, padding: 14, gap: 10 },
  shippingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  shippingTxt: { fontSize: 13, color: TEXT, fontWeight: '600' },

  zoneBox: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    marginTop: 14, backgroundColor: GOLD + '12', borderRadius: 14, padding: 14,
  },
  zoneTxt: { fontSize: 14, fontWeight: '800', color: GOLD, marginBottom: 3 },
  zoneSub: { fontSize: 12, color: TEXT2, lineHeight: 17 },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: BG, borderTopWidth: 0.5, borderTopColor: BORDER,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12, paddingBottom: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 10,
  },
  bottomPrice: { gap: 2 },
  bottomPriceLabel: { fontSize: 11, color: TEXT3, fontWeight: '600' },
  bottomPriceVal: { fontSize: 22, fontWeight: '900', color: TEXT },
  cartBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: GREEN, borderRadius: 14, paddingHorizontal: 22, paddingVertical: 14 },
  cartBtnDone: { backgroundColor: TEXT3 },
  cartBtnTxt: { fontSize: 15, fontWeight: '800', color: '#fff' },
  cartBtnDisabled: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: SURFACE, borderRadius: 14, paddingHorizontal: 22, paddingVertical: 14 },
  cartBtnDisabledTxt: { fontSize: 15, fontWeight: '700', color: TEXT3 },

  sheet: {
    backgroundColor: BG, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40, gap: 16,
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: BORDER, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  sheetTitle: { fontSize: 20, fontWeight: '900', color: TEXT },
  sheetSub: { fontSize: 13, color: TEXT2, marginTop: -8 },
  sheetProduct: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: CARD, borderRadius: 16, padding: 14,
  },
  sheetProductEmoji: { fontSize: 32 },
  sheetProductName: { fontSize: 14, fontWeight: '700', color: TEXT },
  sheetProductPrice: { fontSize: 18, fontWeight: '900', color: GREEN, marginTop: 2 },

  inputWrap: { gap: 6 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: TEXT3, letterSpacing: 0.5 },
  input: { fontSize: 16, color: TEXT, paddingVertical: 6 },
  inputLine: { height: 1, backgroundColor: BORDER },

  sheetInfo: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  sheetInfoTxt: { flex: 1, fontSize: 12, color: TEXT3, lineHeight: 17 },

  orderBtn: {
    flexDirection: 'row', gap: 10, backgroundColor: GREEN,
    borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
  },
  orderBtnTxt: { fontSize: 16, fontWeight: '900', color: '#fff' },
});
