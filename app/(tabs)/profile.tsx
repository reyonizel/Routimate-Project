import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../../store/useStore';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 32 - 4) / 3;
const today = new Date().toISOString().split('T')[0];

const BG = '#FFFFFF'; const CARD = '#F4F4F4'; const SURFACE = '#EEEEEE';
const TEXT = '#111111'; const TEXT2 = '#767676'; const TEXT3 = '#ABABAB';
const RED = '#E60023'; const GREEN = '#008800'; const GOLD = '#D4860A';
const BORDER = '#E8E8E8'; const PILL = 999;

export default function ProfileScreen() {
  const user = useStore((s) => s.user);
  const updateUser = useStore((s) => s.updateUser);
  const addPhoto = useStore((s) => s.addPhoto);
  const router = useRouter();
  const accentColor = user.gender === 'female' ? '#e91e63' : '#3498db';
  const [activeTab, setActiveTab] = useState(0);
  const TABS = ['Rutinler', 'Fotoğraflar', 'İstatistik'];

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('İzin Gerekli', 'Galeriye erişim izni gerekiyor.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled) updateUser({ avatarUri: result.assets[0].uri });
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('İzin Gerekli', 'Galeriye erişim izni gerekiyor.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, quality: 0.85,
    });
    if (!result.canceled) {
      addPhoto({ id: Date.now().toString(), uri: result.assets[0].uri, uploadedAt: new Date().toISOString() });
    }
  };

  // SVG donut chart
  const size = 180; const r = 70; const sw = 12;
  const circ = 2 * Math.PI * r;
  const dash = (user.achievementScore / 100) * circ;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top row: username + settings */}
      <View style={styles.topRow}>
        <Text style={styles.topUsername}>{user.username}</Text>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/modal')}>
          <Ionicons name="menu" size={28} color={TEXT} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Instagram style Header: Avatar on left, Stats on right */}
        <View style={styles.instaHeader}>
          {/* Avatar & Username */}
          <View style={styles.avatarCol}>
            <TouchableOpacity onPress={pickAvatar} activeOpacity={0.85} style={styles.avatarWrap}>
              <View style={[styles.avatarRing, { borderColor: accentColor }]}>
                {user.avatarUri
                  ? <Image source={{ uri: user.avatarUri }} style={styles.avatarImage} />
                  : (
                    <View style={styles.avatarInner}>
                      <Text style={[styles.avatarLetter, { color: accentColor }]}>{user.username[0].toUpperCase()}</Text>
                    </View>
                  )
                }
              </View>
              <View style={styles.cameraChip}>
                <Ionicons name="add" size={14} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.profileName}>@{user.username}</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{user.achievementScore}%</Text>
              <Text style={styles.statLabel}>Başarı</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{user.routines.length}</Text>
              <Text style={styles.statLabel}>Rutin</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{user.photos.length}</Text>
              <Text style={styles.statLabel}>Fotoğraf</Text>
            </View>
          </View>
        </View>

        {/* Pro badge / upgrade */}
        <View style={styles.actionRow}>
          {user.isPro ? (
            <View style={styles.proBadge}>
              <Ionicons name="star" size={13} color={GOLD} />
              <Text style={[styles.proBadgeText, { color: GOLD }]}>Pro Üye</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.upgradeBtn} onPress={() => router.push('/modal')} activeOpacity={0.85}>
              <FontAwesome5 name="crown" size={14} color="#fff" />
              <Text style={styles.upgradeBtnText}>Pro'ya Geç</Text>
            </TouchableOpacity>
          )}
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
            {user.routines.length === 0
              ? <Text style={styles.emptyMsg}>Henüz rutin yok</Text>
              : user.routines.map((r) => {
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
              <TouchableOpacity style={styles.photoAdd} onPress={pickPhoto}>
                <Ionicons name="add" size={26} color={TEXT3} />
                <Text style={styles.photoAddText}>Fotoğraf Ekle</Text>
              </TouchableOpacity>
              {user.photos.map((p) => (
                <View key={p.id} style={styles.photoCell}>
                  <Image source={{ uri: p.uri }} style={styles.photoImage} resizeMode="cover" />
                </View>
              ))}
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
                {user.achievementScore}%
              </SvgText>
              <SvgText x={size / 2} y={size / 2 + 20} textAnchor="middle" fill={TEXT2} fontSize="13">
                Başarı Oranı
              </SvgText>
            </Svg>
            <View style={styles.barRow}>
              {user.routines.slice(0, 5).map((r) => {
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  topUsername: { fontSize: 22, color: TEXT, fontWeight: 'bold' },
  settingsBtn: { padding: 4 },
  
  instaHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  avatarCol: { alignItems: 'center', marginRight: 24, minWidth: 80 },
  avatarWrap: { position: 'relative', marginBottom: 8 },
  avatarRing: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 72, height: 72, borderRadius: 36 },
  avatarInner: { width: 72, height: 72, borderRadius: 36, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 28, fontWeight: '900' },
  cameraChip: { position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: '#3498db', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: BG },
  profileName: { fontSize: 13, color: TEXT, fontWeight: '600' },

  statsContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 18, color: TEXT, fontWeight: 'bold' },
  statLabel: { fontSize: 13, color: TEXT, marginTop: 2 },

  actionRow: { paddingHorizontal: 16, marginBottom: 12 },
  proBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: SURFACE, borderRadius: 5, paddingVertical: 10, borderWidth: 1, borderColor: BORDER },
  proBadgeText: { fontSize: 13, fontWeight: '700' },
  upgradeBtn: { flexDirection: 'row', gap: 8, backgroundColor: '#E60023', borderRadius: 8, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', width: '100%' },
  upgradeBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
  tabs: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: BORDER, marginHorizontal: 16 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: TEXT },
  tabText: { fontSize: 13, color: TEXT2, fontWeight: '600' },
  tabTextActive: { color: TEXT, fontWeight: '800' },
  tabContent: { padding: 16 },
  emptyMsg: { textAlign: 'center', color: TEXT3, fontSize: 14, paddingTop: 30 },
  routineRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  routineDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  routineName: { fontSize: 15, color: TEXT, fontWeight: '700' },
  routineMeta: { fontSize: 12, color: TEXT2, marginTop: 3 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  photoAdd: { width: PHOTO_SIZE, height: PHOTO_SIZE, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1.5, borderColor: BORDER, borderStyle: 'dashed', gap: 6 },
  photoAddText: { fontSize: 11, color: TEXT3, fontWeight: '600' },
  photoCell: { width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: 10, overflow: 'hidden' },
  photoImage: { width: '100%', height: '100%' },
  barRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 24, alignItems: 'flex-end' },
  barItem: { alignItems: 'center', width: 48 },
  bar: { width: 22, height: 90, backgroundColor: SURFACE, borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end', marginBottom: 6, borderWidth: 1, borderColor: BORDER },
  barFill: { width: '100%', borderRadius: 4 },
  barPct: { fontSize: 11, color: TEXT2, fontWeight: '700' },
  barName: { fontSize: 10, color: TEXT3, marginTop: 2, width: 48, textAlign: 'center' },
});
