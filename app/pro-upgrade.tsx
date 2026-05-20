import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useStore } from '../store/useStore';

const { width } = Dimensions.get('window');
const BG = '#FCF7F0'; const CARD = '#FFFFFF'; const SURFACE = '#F5EDE0';
const TEXT = '#0A3B25'; const TEXT2 = '#3D6B58'; const TEXT3 = '#B2B7AA';
const GREEN = '#2A6151'; const GOLD = '#D8C2A4'; const BORDER = '#B2B7AA';

const FEATURES = [
  { icon: 'people-outline',       label: 'Sınırsız Mate Eşleşme',        sub: 'Her ay istediğin kadar yeni mate bul' },
  { icon: 'analytics-outline',    label: 'Gelişmiş İstatistikler',        sub: 'Haftalık & aylık detaylı raporlar' },
  { icon: 'shield-checkmark-outline', label: 'Öncelikli Profil',          sub: 'Keşif sayfasında öne çık' },
  { icon: 'camera-outline',       label: 'Sınırsız Kanıt Fotoğrafı',      sub: 'Her rutine fotoğraf ekle' },
  { icon: 'notifications-outline', label: 'Akıllı Hatırlatmalar',         sub: 'Kişiselleştirilmiş bildirimler' },
  { icon: 'color-palette-outline', label: 'Özel Temalar',                 sub: 'Uygulamayı istediğin renge boya' },
  { icon: 'storefront-outline',   label: 'Mağazada %10 İndirim',          sub: 'Tüm ürünlerde Pro indirimi' },
  { icon: 'ribbon-outline',       label: 'Pro Rozeti',                    sub: 'Profilinde özel Pro rozeti' },
];

const PLANS = [
  { id: 'monthly', label: 'Aylık', price: '₺99', per: 'ay', badge: null },
  { id: 'yearly',  label: 'Yıllık', price: '₺799', per: 'yıl', badge: '%33 Tasarruf' },
];

export default function ProUpgradeScreen() {
  const router = useRouter();
  const togglePro = useStore(s => s.togglePro);
  const isPro = useStore(s => s.user.isPro);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);

  const handleUpgrade = () => {
    setLoading(true);
    // Simulated payment flow
    setTimeout(() => {
      setLoading(false);
      togglePro();
      Alert.alert(
        '🎉 Pro\'ya Geçtin!',
        'RoutinMate Pro üyeliğin başladı. Tüm özelliklerin kilidini açtın.',
        [{ text: 'Harika!', onPress: () => router.back() }]
      );
    }, 1500);
  };

  if (isPro) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={TEXT} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pro Üyelik</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 }}>
          <View style={styles.goldCircle}>
            <FontAwesome5 name="crown" size={40} color={GOLD} />
          </View>
          <Text style={styles.alreadyProTitle}>Zaten Pro Üyesin!</Text>
          <Text style={styles.alreadyProSub}>Tüm Pro özelliklerine erişimin var. RoutinMate'i sonuna kadar kullan.</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} activeOpacity={0.85}>
            <Text style={styles.closeBtnTxt}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pro'ya Geç</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.goldCircle}>
            <FontAwesome5 name="crown" size={40} color={GOLD} />
          </View>
          <Text style={styles.heroTitle}>RoutinMate Pro</Text>
          <Text style={styles.heroSub}>Rutin yolculuğunda bir adım öne geç.</Text>
        </View>

        {/* Plan selector */}
        <View style={styles.planRow}>
          {PLANS.map(plan => {
            const active = selectedPlan === plan.id;
            return (
              <TouchableOpacity
                key={plan.id}
                style={[styles.planCard, active && styles.planCardActive]}
                onPress={() => setSelectedPlan(plan.id as 'monthly' | 'yearly')}
                activeOpacity={0.85}
              >
                {plan.badge && (
                  <View style={styles.planBadge}>
                    <Text style={styles.planBadgeTxt}>{plan.badge}</Text>
                  </View>
                )}
                <Text style={[styles.planLabel, active && styles.planLabelActive]}>{plan.label}</Text>
                <Text style={[styles.planPrice, active && styles.planPriceActive]}>{plan.price}</Text>
                <Text style={[styles.planPer, active && { color: GREEN + 'CC' }]}>/{plan.per}</Text>
                {active && (
                  <View style={styles.planCheck}>
                    <Ionicons name="checkmark-circle" size={20} color={GREEN} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Neler Dahil?</Text>
          <View style={styles.featureList}>
            {FEATURES.map(f => (
              <View key={f.label} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Ionicons name={f.icon as any} size={20} color={GREEN} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureLabel}>{f.label}</Text>
                  <Text style={styles.featureSub}>{f.sub}</Text>
                </View>
                <Ionicons name="checkmark-circle" size={18} color={GREEN} />
              </View>
            ))}
          </View>
        </View>

        {/* Fine print */}
        <Text style={styles.finePrint}>
          Abonelik otomatik yenilenir. İstediğin zaman iptal edebilirsin. Ödeme App Store/Google Play üzerinden alınır.
        </Text>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Sticky CTA */}
      <View style={styles.cta}>
        <TouchableOpacity
          style={[styles.ctaBtn, loading && { opacity: 0.7 }]}
          onPress={handleUpgrade}
          activeOpacity={0.85}
          disabled={loading}
        >
          <FontAwesome5 name="crown" size={16} color="#fff" />
          <Text style={styles.ctaBtnTxt}>
            {loading ? 'İşleniyor...' : `Pro'ya Geç — ${PLANS.find(p => p.id === selectedPlan)?.price}/${selectedPlan === 'monthly' ? 'ay' : 'yıl'}`}
          </Text>
        </TouchableOpacity>
        <Text style={styles.ctaSub}>7 günlük ücretsiz deneme ile başla</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: BORDER,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: CARD, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: TEXT },

  scroll: { paddingHorizontal: 20 },

  hero: { alignItems: 'center', paddingTop: 36, paddingBottom: 28, gap: 10 },
  goldCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: GOLD + '15', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TEXT, letterSpacing: -0.5 },
  heroSub: { fontSize: 15, color: TEXT2, textAlign: 'center' },

  planRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  planCard: {
    flex: 1, borderRadius: 18, padding: 18, borderWidth: 2, borderColor: BORDER,
    backgroundColor: CARD, alignItems: 'center', position: 'relative', gap: 4,
  },
  planCardActive: { borderColor: GREEN, backgroundColor: GREEN + '08' },
  planBadge: { position: 'absolute', top: -12, backgroundColor: GREEN, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  planBadgeTxt: { fontSize: 11, fontWeight: '800', color: '#fff' },
  planLabel: { fontSize: 13, fontWeight: '700', color: TEXT3 },
  planLabelActive: { color: GREEN },
  planPrice: { fontSize: 26, fontWeight: '900', color: TEXT, letterSpacing: -1 },
  planPriceActive: { color: TEXT },
  planPer: { fontSize: 12, color: TEXT3, fontWeight: '600' },
  planCheck: { position: 'absolute', top: 10, right: 10 },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: TEXT, marginBottom: 14, letterSpacing: -0.3 },
  featureList: { gap: 8 },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: CARD, borderRadius: 16, padding: 14,
  },
  featureIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: GREEN + '15', alignItems: 'center', justifyContent: 'center' },
  featureLabel: { fontSize: 14, fontWeight: '800', color: TEXT, marginBottom: 2 },
  featureSub: { fontSize: 12, color: TEXT2 },

  finePrint: { fontSize: 11, color: TEXT3, textAlign: 'center', lineHeight: 16, marginBottom: 8 },

  cta: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingBottom: 34, paddingTop: 16,
    backgroundColor: BG,
    borderTopWidth: 0.5, borderTopColor: BORDER,
  },
  ctaBtn: {
    flexDirection: 'row', gap: 10, backgroundColor: GOLD, borderRadius: 18,
    paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
  },
  ctaBtnTxt: { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },
  ctaSub: { textAlign: 'center', fontSize: 12, color: TEXT3, marginTop: 8 },

  alreadyProTitle: { fontSize: 24, fontWeight: '900', color: TEXT },
  alreadyProSub: { fontSize: 15, color: TEXT2, textAlign: 'center', lineHeight: 22 },
  closeBtn: { backgroundColor: GREEN, borderRadius: 16, paddingHorizontal: 32, paddingVertical: 14 },
  closeBtnTxt: { fontSize: 15, fontWeight: '800', color: '#fff' },
});

