import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 32 - 4) / 3;
const today = new Date().toISOString().split('T')[0];
const NAVBAR_H = 56; // approximate navbar height

const BG = '#FFFFFF'; const CARD = '#F4F4F4'; const SURFACE = '#EEEEEE';
const TEXT = '#111111'; const TEXT2 = '#767676'; const TEXT3 = '#ABABAB';
const RED = '#00bf63'; const GREEN = '#008800'; const GOLD = '#D4860A';
const BORDER = '#E8E8E8'; const PILL = 999;

export default function MateProfileScreen() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const mate = useStore((s) => s.mate);

  if (!mate) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.navbar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={TEXT} />
          </TouchableOpacity>
        </View>
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <Text style={{color: TEXT2}}>Mate bulunamadı</Text>
        </View>
      </SafeAreaView>
    );
  }

  const accentColor = mate.gender === 'female' ? '#e91e63' : '#3498db';
  const completedToday = mate.routines.filter((r) => r.completedDates.includes(today)).length;

  const [activeTab, setActiveTab] = useState(0);
  const TABS = ['Rutinler', 'Fotoğraflar', 'İstatistik'];

  // SVG donut chart for stats
  const size = 180; const r = 70; const sw = 12;
  const circ = 2 * Math.PI * r;
  const dash = (mate.achievementScore / 100) * circ;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Navbar — always on top */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Mate Profili</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Scrollable content — renders behind blur if not pro */}
      <ScrollView showsVerticalScrollIndicator={false} scrollEnabled={user.isPro}>

        {/* Instagram style Header: Avatar on left, Stats on right */}
        <View style={styles.instaHeader}>
          {/* Avatar & Username */}
          <View style={styles.avatarCol}>
            <View style={styles.avatarWrap}>
              <View style={[styles.avatarRing, { borderColor: accentColor }]}>
                {mate.avatarUri
                  ? <Image source={{ uri: mate.avatarUri }} style={styles.avatarImage} contentFit="cover" cachePolicy="memory-disk" />
                  : (
                    <View style={styles.avatarInner}>
                      <Text style={[styles.avatarLetter, { color: accentColor }]}>{(mate.username || '?')[0].toUpperCase()}</Text>
                    </View>
                  )
                }
              </View>
            </View>
            <Text style={styles.profileName}>@{mate.username}</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{mate.achievementScore}%</Text>
              <Text style={styles.statLabel}>Başarı</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{mate.routines.length}</Text>
              <Text style={styles.statLabel}>Rutin</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{mate.photos.length}</Text>
              <Text style={styles.statLabel}>Fotoğraf</Text>
            </View>
          </View>
        </View>

        {/* DM CTA */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.dmBtn} onPress={() => router.back()} activeOpacity={0.85}>
            <Ionicons name="chatbubble-ellipses" size={14} color="#fff" />
            <Text style={styles.dmBtnText}>Mesaj Gönder</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {TABS.map((t, i) => (
            <TouchableOpacity key={t} style={[styles.tab, activeTab === i && styles.tabActive]} onPress={() => setActiveTab(i)}>
              <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab 0: Routines */}
        {activeTab === 0 && (
          <View style={styles.tabContent}>
            {mate.routines.length === 0
              ? <Text style={styles.emptyMsg}>Henüz rutin yok</Text>
              : mate.routines.map((r) => {
                const done = r.completedDates.includes(today);
                return (
                  <View key={r.id} style={styles.routineRow}>
                    <View style={[styles.routineDot, { backgroundColor: done ? GREEN : SURFACE, borderWidth: done ? 0 : 1.5, borderColor: BORDER }]}>
                      {done && <Ionicons name="checkmark" size={12} color="#fff" />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.routineName, done && { color: TEXT3, textDecorationLine: 'line-through' }]}>{r.name}</Text>
                      <Text style={styles.routineMeta}>{r.frequency} · {r.completedDates.length} tamamlama</Text>
                    </View>
                  </View>
                );
              })
            }
          </View>
        )}

        {/* Tab 1: Photos */}
        {activeTab === 1 && (
          <View style={styles.tabContent}>
            <View style={styles.photoGrid}>
              {mate.photos.length === 0
                ? <Text style={styles.emptyMsg}>Henüz fotoğraf paylaşılmadı</Text>
                : mate.photos.map((p, i) => (
                  <View key={i} style={styles.photoCell}>
                    <Image source={{ uri: p.uri }} style={styles.photoImage} contentFit="cover" />
                  </View>
                ))
              }
            </View>
          </View>
        )}

        {/* Tab 2: Stats */}
        {activeTab === 2 && (
          <View style={[styles.tabContent, { alignItems: 'center' }]}>
            <Svg width={size} height={size}>
              <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
                <Circle cx={size / 2} cy={size / 2} r={r} stroke={SURFACE} strokeWidth={sw} fill="none" />
                <Circle cx={size / 2} cy={size / 2} r={r} stroke={accentColor} strokeWidth={sw} fill="none"
                  strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
              </G>
              <SvgText x={size / 2} y={size / 2 - 6} textAnchor="middle" fill={TEXT} fontSize="34" fontWeight="900">
                {mate.achievementScore}%
              </SvgText>
              <SvgText x={size / 2} y={size / 2 + 20} textAnchor="middle" fill={TEXT2} fontSize="13">
                Başarı Oranı
              </SvgText>
            </Svg>
            <View style={styles.barRow}>
              {mate.routines.slice(0, 5).map((r) => {
                const pct = Math.min(Math.floor((r.completedDates.length / 30) * 100), 100);
                return (
                  <View key={r.id} style={styles.barItem}>
                    <View style={styles.bar}>
                      <View style={[styles.barFill, { height: `${pct}%` as any, backgroundColor: accentColor }]} />
                    </View>
                    <Text style={styles.barPct}>{pct}%</Text>
                    <Text style={styles.barName} numberOfLines={1}>{r.name.split(' ')[0]}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* ─── FULL BLUR OVERLAY (non-Pro) ──────────────────────────── */}
      {!user.isPro && (
        <BlurView intensity={15} tint="light" experimentalBlurMethod="dimezisBlurView" style={styles.blurOverlay} pointerEvents="auto">
          <View style={styles.blurContent}>
            <Text style={styles.blurMainText}>Profili Görüntülemek İçin{'\n'}Pro Üye Olmalısın</Text>
            
            <TouchableOpacity style={styles.blurProBtn} onPress={() => router.push('/modal')} activeOpacity={0.85}>
              <FontAwesome5 name="crown" size={14} color="#fff" />
              <Text style={styles.blurProBtnText}>Pro'ya Geç</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()} style={styles.blurBackMini}>
              <Text style={styles.blurBackMiniText}>Geri Dön</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // Navbar
  navbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: BORDER,
    zIndex: 10, backgroundColor: BG,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 16, color: TEXT, fontWeight: '800' },

  instaHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  avatarCol: { alignItems: 'center', marginRight: 24, minWidth: 80 },
  avatarWrap: { position: 'relative', marginBottom: 8 },
  avatarRing: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 72, height: 72, borderRadius: 36 },
  avatarInner: { width: 72, height: 72, borderRadius: 36, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 28, fontWeight: '900' },
  profileName: { fontSize: 13, color: TEXT, fontWeight: '600' },

  statsContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 18, color: TEXT, fontWeight: 'bold' },
  statLabel: { fontSize: 13, color: TEXT, marginTop: 2 },

  actionRow: { paddingHorizontal: 16, marginBottom: 12 },
  dmBtn: { flexDirection: 'row', gap: 8, backgroundColor: RED, borderRadius: 8, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', width: '100%' },
  dmBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },

  tabs: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: BORDER, marginHorizontal: 16 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: TEXT },
  tabText: { fontSize: 13, color: TEXT2, fontWeight: '600' },
  tabTextActive: { color: TEXT, fontWeight: '800' },
  tabContent: { padding: 16 },
  emptyMsg: { textAlign: 'center', color: TEXT3, fontSize: 14, paddingTop: 30, width: '100%' },
  
  routineRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  routineDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  routineName: { fontSize: 15, color: TEXT, fontWeight: '700' },
  routineMeta: { fontSize: 12, color: TEXT2, marginTop: 3 },
  
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  photoCell: { width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: 10, overflow: 'hidden', backgroundColor: SURFACE },
  photoImage: { width: '100%', height: '100%' },

  barRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 24, alignItems: 'flex-end' },
  barItem: { alignItems: 'center', width: 48 },
  bar: { width: 22, height: 90, backgroundColor: SURFACE, borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end', marginBottom: 6, borderWidth: 1, borderColor: BORDER },
  barFill: { width: '100%', borderRadius: 4 },
  barPct: { fontSize: 11, color: TEXT2, fontWeight: '700' },
  barName: { fontSize: 10, color: TEXT3, marginTop: 2, width: 48, textAlign: 'center' },

  // Blur overlay
  blurOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 50,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  blurContent: {
    alignItems: 'center',
  },
  blurMainText: {
    fontSize: 22,
    color: TEXT,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 28,
    letterSpacing: -0.5,
  },
  blurProBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: RED,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: PILL,
    marginBottom: 16,
  },
  blurProBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  blurBackMini: {
    padding: 8,
  },
  blurBackMiniText: {
    color: TEXT2,
    fontSize: 14,
    fontWeight: '700',
  },
  blurCard: {
    backgroundColor: BG,
    borderRadius: 28,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: GOLD + '40',
  },
  blurIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: GOLD + '15',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  blurTitle: {
    fontSize: 20, color: TEXT, fontWeight: '900',
    textAlign: 'center', letterSpacing: -0.3, marginBottom: 10, lineHeight: 28,
  },
  blurSub: {
    fontSize: 14, color: TEXT2, textAlign: 'center', lineHeight: 20, marginBottom: 20,
  },
  blurTeaser: {
    flexDirection: 'row', backgroundColor: SURFACE,
    borderRadius: 16, paddingVertical: 14, width: '100%', marginBottom: 20,
  },
  teaserItem: { flex: 1, alignItems: 'center' },
  teaserVal: { fontSize: 20, color: TEXT, fontWeight: '900' },
  teaserLabel: { fontSize: 11, color: TEXT2, marginTop: 3 },
  blurBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: RED, borderRadius: PILL,
    paddingHorizontal: 32, paddingVertical: 15, width: '100%',
    justifyContent: 'center', marginBottom: 12,
  },
  blurBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  blurBack: { paddingVertical: 8 },
  blurBackText: { fontSize: 14, color: TEXT3, fontWeight: '600' },
});
