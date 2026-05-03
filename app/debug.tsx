import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';

const BG = '#FFFFFF'; const CARD = '#F4F4F4'; const SURFACE = '#EEEEEE';
const TEXT = '#111111'; const TEXT2 = '#767676'; const TEXT3 = '#ABABAB';
const RED = '#E60023'; const GREEN = '#008800'; const GOLD = '#D4860A'; const BLUE = '#3498db';
const BORDER = '#E8E8E8'; const PILL = 999;

type ActionColor = string;
const ACTIONS: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; sub: string; color: ActionColor; key: string }[] = [
  { icon: 'shuffle-outline',   label: 'Yeni Eşleşme Zorla', sub: '30 günlük sayacı sıfırlar',       color: BLUE,  key: 'match' },
  { icon: 'star-outline',      label: 'Pro Toggle',          sub: 'Pro durumunu tersine çevirir',    color: GOLD,  key: 'pro' },
  { icon: 'flask-outline',     label: 'Mock Rutin Ekle',     sub: '4 örnek günlük rutin ekler',      color: GREEN, key: 'mock' },
  { icon: 'trash-outline',     label: 'Rutinleri Temizle',   sub: 'Tüm rutinleri siler (simülasyon)', color: RED,   key: 'clear' },
];

export default function DebugScreen() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const mate = useStore((s) => s.mate);
  const forceNewMatch = useStore((s) => s.forceNewMatch);
  const togglePro = useStore((s) => s.togglePro);
  const addRoutine = useStore((s) => s.addRoutine);

  const handleAction = (key: string) => {
    switch (key) {
      case 'match':
        forceNewMatch();
        Alert.alert('✓ Yeni Eşleşme', 'Mate yenilendi, sayaç sıfırlandı.');
        break;
      case 'pro':
        togglePro();
        Alert.alert('✓ Pro Toggle', `Pro: ${!user.isPro ? 'açıldı' : 'kapatıldı'}`);
        break;
      case 'mock': {
        const today = new Date().toISOString().split('T')[0];
        ['Sabah Koşusu', 'Meditasyon', 'Soğuk Duş', 'Kitap Okuma'].forEach((name, i) => {
          addRoutine({
            id: `mock-${Date.now()}-${i}`, name, frequency: 'daily',
            notificationTime: `0${7 + i}:00`,
            completedDates: i < 2 ? [today] : [],
            createdAt: new Date().toISOString(),
          });
        });
        Alert.alert('✓ Mock Data', '4 rutin eklendi.');
        break;
      }
      case 'clear':
        Alert.alert('Simülasyon', 'Store reset yakında eklenecek.');
        break;
    }
  };

  const STATE = [
    { label: 'Kullanıcı', value: `@${user.username}` },
    { label: 'Mate', value: `@${mate.username}` },
    { label: 'Pro', value: user.isPro ? 'Aktif ✓' : 'Değil ✗', color: user.isPro ? GREEN : RED },
    { label: 'Cinsiyet', value: user.gender === 'male' ? 'Erkek' : 'Kadın' },
    { label: 'Rutin Sayısı', value: `${user.routines.length}` },
    { label: 'Başarı Oranı', value: `%${user.achievementScore}` },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={TEXT} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.navTitle}>Debug Panel</Text>
          <Text style={styles.navSub}>Geliştirici Araçları</Text>
        </View>
        <View style={styles.devBadge}><Text style={styles.devBadgeText}>DEV</Text></View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* State grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionSub}>Anlık durum</Text>
          <Text style={styles.sectionTitle}>Uygulama State</Text>
        </View>
        <View style={styles.stateGrid}>
          {STATE.map((item) => (
            <View key={item.label} style={styles.stateCard}>
              <Text style={styles.stateLabel}>{item.label}</Text>
              <Text style={[styles.stateValue, item.color ? { color: item.color } : {}]}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionSub}>Test araçları</Text>
          <Text style={styles.sectionTitle}>Eylemler</Text>
        </View>
        <View style={styles.actionList}>
          {ACTIONS.map((a) => (
            <TouchableOpacity key={a.key} style={styles.actionRow} onPress={() => handleAction(a.key)} activeOpacity={0.75}>
              <View style={[styles.actionIcon, { backgroundColor: a.color + '15' }]}>
                <Ionicons name={a.icon} size={21} color={a.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionLabel, { color: a.color }]}>{a.label}</Text>
                <Text style={styles.actionSub}>{a.sub}</Text>
              </View>
              <Ionicons name="play-circle-outline" size={22} color={a.color} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Version */}
        <View style={styles.versionRow}>
          <Ionicons name="information-circle-outline" size={14} color={TEXT3} />
          <Text style={styles.versionText}>RoutinMate · v1.0 · Debug Build</Text>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  navbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 18, color: TEXT, fontWeight: '900' },
  navSub: { fontSize: 12, color: TEXT2, marginTop: 1 },
  devBadge: { backgroundColor: RED, borderRadius: PILL, paddingHorizontal: 12, paddingVertical: 5 },
  devBadgeText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  sectionHeader: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 },
  sectionSub: { fontSize: 12, color: TEXT2, fontWeight: '500', marginBottom: 3 },
  sectionTitle: { fontSize: 22, color: TEXT, fontWeight: '900', letterSpacing: -0.5 },
  stateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16 },
  stateCard: { width: '47%', backgroundColor: CARD, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: BORDER },
  stateLabel: { fontSize: 11, color: TEXT3, fontWeight: '600', marginBottom: 6, letterSpacing: 0.3 },
  stateValue: { fontSize: 16, color: TEXT, fontWeight: '800' },
  actionList: { paddingHorizontal: 16, gap: 10 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: CARD, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: BORDER },
  actionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 15, fontWeight: '800', marginBottom: 3 },
  actionSub: { fontSize: 12, color: TEXT2 },
  versionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 24 },
  versionText: { fontSize: 12, color: TEXT3 },
});
