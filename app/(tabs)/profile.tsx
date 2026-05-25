import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert, Modal, TextInput, Animated, Easing, KeyboardAvoidingView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../../store/useStore';
import { localDateStr } from '../../lib/date';
import { Photo, Routine } from '../../store/useStore';
import { BlurView } from 'expo-blur';
import Svg, { Circle, G, Text as SvgText, Polyline, Path } from 'react-native-svg';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 8) / 3;
const today = localDateStr();

const BG = '#EEE3D0'; const CARD = '#FFFFFF'; const SURFACE = '#F5EDE0';
const TEXT = '#0A3B25'; const TEXT2 = '#3D6B58'; const TEXT3 = '#B2B7AA';
const RED = '#2A6151'; const GREEN = '#1A4F3A'; const GOLD = '#D8C2A4';
const BORDER = '#B2B7AA'; const PILL = 999;

function rateColor(rate: number): string {
  if (rate >= 75) return '#2A6151';
  if (rate >= 40) return '#D8C2A4';
  return '#e74c3c';
}

function LineChart({ data, color = RED }: { data: number[]; color?: string }) {
  const cw = width - 40;
  const ch = 88;
  const pL = 4, pR = 4, pT = 10, pB = 8;
  const n = data.length;
  if (n < 2) return null;
  const xs = data.map((_, i) => pL + (i / (n - 1)) * (cw - pL - pR));
  const ys = data.map(v => pT + (ch - pT - pB) * (1 - v));
  const pts = xs.map((x, i) => `${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  const fill = `M${xs[0].toFixed(1)},${ch} ${xs.map((x,i) => `L${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ')} L${xs[n-1].toFixed(1)},${ch} Z`;
  return (
    <Svg width={cw} height={ch}>
      <Path d={fill} fill={color} fillOpacity={0.08} />
      <Polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {xs.map((x, i) => <Circle key={i} cx={x} cy={ys[i]} r={3} fill={data[i] > 0 ? color : '#B2B7AA'} />)}
    </Svg>
  );
}

export default function ProfileScreen() {
  const user = useStore((s) => s.user);
  const mate = useStore((s) => s.mate);
  const updateUser = useStore((s) => s.updateUser);
  const uploadAvatar = useStore((s) => s.uploadAvatar);
  const deletePhoto = useStore((s) => s.deletePhoto);
  const pinPhoto = useStore((s) => s.pinPhoto);
  const toggleSetActive = useStore((s) => s.toggleSetActive);
  const updateRoutine = useStore((s) => s.updateRoutine);
  const deleteRoutine = useStore((s) => s.deleteRoutine);
  const refreshAchievementScore = useStore((s) => s.refreshAchievementScore);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accentColor = user.gender === 'female' ? '#e91e63' : '#3498db';
  const [activeTab, setActiveTab] = useState(0);
  const [expandedSet, setExpandedSet] = useState<string | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  // Edit routine sheet
  const editSheetAnim = useRef(new Animated.Value(0)).current;
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [editName, setEditName] = useState('');
  const [editHour, setEditHour] = useState('');
  const [editMin, setEditMin] = useState('');
  const [showEditTimePicker, setShowEditTimePicker] = useState(false);

  const openEditSheet = (r: Routine) => {
    const [h = '07', m = '00'] = (r.notificationTime || '07:00').split(':');
    setEditingRoutine(r);
    setEditName(r.name);
    setEditHour(h);
    setEditMin(m);
    setShowEditTimePicker(false);
    Animated.spring(editSheetAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 11 }).start();
  };

  const closeEditSheet = () => {
    Animated.timing(editSheetAnim, { toValue: 0, duration: 220, easing: Easing.out(Easing.ease), useNativeDriver: true })
      .start(() => setEditingRoutine(null));
  };

  const saveEdit = () => {
    if (!editingRoutine || !editName.trim()) return;
    const h = editHour.padStart(2, '0');
    const mn = editMin.padStart(2, '0');
    updateRoutine(editingRoutine.id, {
      name: editName.trim(),
      notificationTime: `${h}:${mn}`,
    });
    closeEditSheet();
  };

  useEffect(() => {
    if (activeTab === 2) refreshAchievementScore().catch(() => {});
  }, [activeTab]);

  // Tüm zamanlar — recurring rutinler üzerinden hesaplanır
  const proofPhotos = user.photos.filter(p => p.proofMeta).length;
  const recurringRoutines = user.routines.filter(r => r.scope !== 'once');

  const totalDoneAllTime = recurringRoutines.reduce((s, r) => s + r.completedDates.length, 0);

  const totalExpectedAllTime = recurringRoutines.reduce((sum, r) => {
    const t = Date.parse(r.createdAt);
    const startMs = isNaN(t) ? Date.now() : t;
    const days = Math.max(1, Math.round((Date.now() - startMs) / 86400000) + 1);
    if (r.frequency === 'daily') return sum + days;
    if (r.frequency === 'weekly') return sum + Math.round(days * (r.targetDays?.length ?? 1) / 7);
    if (r.frequency === 'monthly') return sum + Math.round(days * (r.monthlyDays?.length ?? 1) / 30.44);
    return sum + days;
  }, 0);

  // Mevcut seri
  const streakDays = (() => {
    const completedSet = new Set(user.routines.flatMap(r => r.completedDates));
    let streak = 0;
    const d = new Date();
    while (completedSet.has(localDateStr(d))) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  })();

  // Bugünün görevleri
  const todayDow = new Date().getDay();
  const todayMday = new Date().getDate();
  const todayScheduled = user.routines.filter(r => {
    if (r.scope === 'once') return false;
    if (r.frequency === 'daily') return true;
    if (r.frequency === 'weekly') return r.targetDays?.includes(todayDow) ?? false;
    if (r.frequency === 'monthly') return r.monthlyDays?.includes(todayMday) ?? false;
    return false;
  });
  const todayDone = todayScheduled.filter(r => r.completedDates.includes(today)).length;
  const todayPct = todayScheduled.length > 0 ? Math.round(todayDone / todayScheduled.length * 100) : 0;

  // En aktif saat
  const capturedHours = user.photos
    .filter(p => p.proofMeta?.capturedAt)
    .map(p => new Date(p.proofMeta!.capturedAt).getHours());
  const avgHour = capturedHours.length >= 3
    ? Math.round(capturedHours.reduce((a, b) => a + b, 0) / capturedHours.length)
    : null;

  // Mate seri
  const mateStreakDays = (() => {
    if (!mate) return null;
    const completedSet = new Set(mate.routines.flatMap(r => r.completedDates));
    let streak = 0;
    const d = new Date();
    while (completedSet.has(localDateStr(d))) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  })();

  // Son 7 gün bar chart verisi
  const TR_DAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  const last7Data = Array.from({ length: 7 }, (_, i) => {
    const dateStr = localDateStr(new Date(Date.now() - (6 - i) * 86400000));
    const d = new Date(dateStr + 'T12:00:00');
    const dw = d.getDay();
    const dm = d.getDate();
    const scheduled = user.routines.filter(r => {
      if (r.scope === 'once') return false;
      if (r.frequency === 'daily') return true;
      if (r.frequency === 'weekly') return r.targetDays?.includes(dw) ?? false;
      if (r.frequency === 'monthly') return r.monthlyDays?.includes(dm) ?? false;
      return false;
    });
    const doneCount = scheduled.filter(r => r.completedDates.includes(dateStr)).length;
    const pct = scheduled.length > 0 ? doneCount / scheduled.length : 0;
    return { dateStr, dayLabel: TR_DAYS[dw], pct, doneCount, isToday: dateStr === today };
  });
  const maxDoneCount = Math.max(...last7Data.map(d => d.doneCount), 1);
  const last7Pct = Math.round(last7Data.reduce((s, d) => s + d.pct, 0) / last7Data.length * 100);

  const editTimeDate = new Date();
  editTimeDate.setHours(parseInt(editHour || '7', 10));
  editTimeDate.setMinutes(parseInt(editMin || '0', 10));

  const TABS = ['Rutinler', 'Fotoğraflar', 'İstatistik'];

  const photoRefs = React.useRef<{ [id: string]: any }>({});
  const [popover, setPopover] = useState<{ id: string, x: number, y: number, w: number, h: number } | null>(null);

  const handleLongPress = (id: string) => {
    const ref = photoRefs.current[id];
    if (ref && ref.measureInWindow) {
      ref.measureInWindow((x: number, y: number, w: number, h: number) => {
        setPopover({ id, x, y, w, h });
      });
    }
  };

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('İzin Gerekli', 'Galeriye erişim izni gerekiyor.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled) uploadAvatar(result.assets[0].uri);
  };


  // const handlePhotoPress = (id: string) => {
  //   Alert.alert(...);
  // };

  // SVG donut chart
  const size = 180; const r = 70; const sw = 12;
  const circ = 2 * Math.PI * r;
  const dash = (user.achievementScore / 100) * circ;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top row: username + settings */}
      <View style={styles.topRow}>
        <Text style={styles.topUsername}>@{user.username}</Text>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/modal')}>
          <Ionicons name="menu" size={22} color={TEXT} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Instagram Header: avatar sol, istatistikler sağ */}
        <View style={styles.instaHead}>
          <TouchableOpacity onPress={pickAvatar} activeOpacity={0.8}>
            <View>
              {user.avatarUri ? (
                <Image source={{ uri: user.avatarUri }} style={styles.avatar} contentFit="cover" cachePolicy="memory-disk" transition={200} />
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: accentColor + '20' }]}>
                  <Text style={[styles.avatarInitial, { color: accentColor }]}>{(user.username || '?')[0].toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.avatarEditBadge}>
                <Ionicons name="pencil" size={9} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{user.routines.length}</Text>
              <Text style={styles.statLabel}>Rutin</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{user.achievementScore}%</Text>
              <Text style={styles.statLabel}>Başarı</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{user.photos.length}</Text>
              <Text style={styles.statLabel}>Fotoğraf</Text>
            </View>
          </View>
        </View>

        {/* Bio */}
        <View style={styles.bioArea}>
          {user.fullName ? <Text style={styles.profileName}>{user.fullName}</Text> : null}
          {user.bio ? <Text style={styles.profileBio}>{user.bio}</Text> : null}
        </View>

        {/* Buttons */}
        <View style={styles.btnRow}>
          {!user.isPro && (
            <TouchableOpacity style={styles.proBtn} onPress={() => router.push('/pro-upgrade')} activeOpacity={0.85}>
              <FontAwesome5 name="crown" size={12} color="#fff" />
              <Text style={styles.proBtnTxt}>Pro'ya Geç</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/edit-profile')} activeOpacity={0.85}>
            <Text style={styles.editBtnTxt}>Profili Düzenle</Text>
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
            {user.routines.length === 0 ? (
              <Text style={styles.emptyMsg}>Henüz rutin seti yok</Text>
            ) : (() => {
              const FREQ_LABEL: Record<string, string> = { daily: 'Günlük', weekly: 'Haftalık', monthly: 'Aylık' };
              const groups: Record<string, typeof user.routines> = {};
              user.routines.forEach(r => {
                const key = r.setName || 'Diğer';
                if (!groups[key]) groups[key] = [];
                groups[key].push(r);
              });
              return Object.entries(groups).map(([setName, routines]) => {
                const isInactive = (user.inactiveSets ?? []).includes(setName);
                return (
                  <TouchableOpacity
                    key={setName}
                    style={styles.setHeader}
                    onPress={() => router.push({ pathname: '/set-panel', params: { setName } })}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.setTitle, isInactive && styles.setTitleInactive]}>{setName}</Text>
                      <Text style={styles.setMeta}>{routines.length} rutin · {isInactive ? 'Pasif' : 'Aktif'}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={TEXT3} />
                  </TouchableOpacity>
                );
              });
            })()}
          </View>
        )}

        {/* Tab 1: Photos */}
        {activeTab === 1 && (
          <View style={styles.tabContent}>
            {user.photos.length === 0 && (
              <Text style={[styles.emptyMsg, { marginBottom: 0 }]}>
                Rutin tamamlayarak kanıt fotoğrafı yükleyebilirsin
              </Text>
            )}
            <View style={styles.photoGrid}>
              {user.photos.map((p, index) => (
                <TouchableOpacity
                  key={p.id}
                  ref={el => { photoRefs.current[p.id] = el; }}
                  style={styles.photoCell}
                  activeOpacity={0.8}
                  onPress={() => setViewerIndex(index)}
                  onLongPress={() => handleLongPress(p.id)}
                  delayLongPress={200}
                >
                  <Image
                    source={{ uri: p.uri }}
                    style={styles.photoImage}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                  {p.isPinned && (
                    <View style={{ position: 'absolute', top: 6, right: 6, backgroundColor: RED, borderRadius: 12, width: 22, height: 22, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 3, shadowOffset: {width: 0, height: 2}, elevation: 3 }}>
                      <FontAwesome5 name="thumbtack" size={11} color="#fff" style={{ transform: [{ rotate: '-45deg' }] }} />
                    </View>
                  )}
                  {p.proofMeta && !p.isPinned && (
                    <View style={{ position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10, width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="camera" size={12} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Tab 2: Stats */}
        {activeTab === 2 && (
          <View style={{ backgroundColor: BG }}>

            {/* Sayılar */}
            <View style={st.numRow}>
              <View style={st.numItem}>
                <Text style={st.numBig}>{totalDoneAllTime.toLocaleString('tr-TR')}</Text>
                <Text style={st.numLbl}>Toplam</Text>
              </View>
              <View style={st.numDivider} />
              <View style={st.numItem}>
                <Text style={st.numBig}>{streakDays}</Text>
                <Text style={st.numLbl}>Seri</Text>
              </View>
              <View style={st.numDivider} />
              <View style={st.numItem}>
                <Text style={st.numBig}>{user.achievementScore}</Text>
                <Text style={st.numLbl}>Başarı</Text>
              </View>
            </View>

            <View style={st.div} />

            {/* Yüzdeler */}
            <View style={st.numRow}>
              <View style={st.numItem}>
                <Text style={[st.numBig, { color: rateColor(todayPct) }]}>{todayPct}%</Text>
                <Text style={st.numLbl}>Bugün</Text>
                <Text style={st.numSub}>{todayDone}/{todayScheduled.length}</Text>
              </View>
              <View style={st.numDivider} />
              <View style={st.numItem}>
                <Text style={[st.numBig, { color: rateColor(last7Pct) }]}>{last7Pct}%</Text>
                <Text style={st.numLbl}>7 Gün</Text>
                <Text style={st.numSub}>ortalama</Text>
              </View>
              <View style={st.numDivider} />
              <View style={st.numItem}>
                <Text style={st.numBig}>{proofPhotos}</Text>
                <Text style={st.numLbl}>Fotoğraf</Text>
                <Text style={st.numSub}>kanıt</Text>
              </View>
            </View>

            <View style={st.div} />

            {/* Son 7 gün */}
            <View style={st.sec}>
              <Text style={st.secTitle}>Son 7 Gün</Text>
              <LineChart data={last7Data.map(d => d.doneCount / maxDoneCount)} />
              <View style={st.dayRow}>
                {last7Data.map(d => (
                  <Text key={d.dateStr} style={[st.dayLbl, d.isToday && { color: RED, fontWeight: '800' }]}>
                    {d.dayLabel}
                  </Text>
                ))}
              </View>
            </View>

            {/* Bugün */}
            {todayScheduled.length > 0 && (
              <>
                <View style={st.div} />
                <View style={st.sec}>
                  <View style={st.secHeader}>
                    <Text style={st.secTitle}>Bugün</Text>
                    <Text style={[st.numSub, { color: todayPct === 100 ? RED : TEXT2 }]}>
                      {todayDone}/{todayScheduled.length} tamamlandı
                    </Text>
                  </View>
                  <View style={st.progBg}>
                    <View style={[st.progFill, {
                      width: `${todayPct}%` as any,
                      backgroundColor: todayPct === 100 ? RED : '#F59E0B',
                    }]} />
                  </View>
                  {todayScheduled.map(r => {
                    const done = r.completedDates.includes(today);
                    return (
                      <View key={r.id} style={st.taskRow}>
                        <View style={[st.taskDot, done && { backgroundColor: RED, borderColor: RED }]}>
                          {done && <Ionicons name="checkmark" size={10} color="#fff" />}
                        </View>
                        <Text style={[st.taskName, done && { color: TEXT3, textDecorationLine: 'line-through' }]}>
                          {r.name}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            {/* Mate */}
            {mate && (
              <>
                <View style={st.div} />
                <View style={st.sec}>
                  <Text style={st.secTitle}>Mate Karşılaştırması</Text>
                  <View style={st.mateRow}>
                    <View style={st.mateCol}>
                      <Text style={st.mateScore}>{user.achievementScore}</Text>
                      <Text style={st.numLbl}>Sen</Text>
                      <Text style={st.numSub}>{streakDays} gün seri</Text>
                    </View>
                    <View style={st.numDivider} />
                    <View style={st.mateCol}>
                      <Text style={st.mateScore}>{mate.achievementScore}</Text>
                      <Text style={[st.numLbl, { textAlign: 'center' }]}>@{mate.username}</Text>
                      {mateStreakDays !== null && <Text style={st.numSub}>{mateStreakDays} gün seri</Text>}
                    </View>
                  </View>
                </View>
              </>
            )}

            {/* En Aktif Saat */}
            {avgHour !== null && (
              <>
                <View style={st.div} />
                <View style={st.sec}>
                  <Text style={st.secTitle}>En Aktif Saat</Text>
                  <Text style={st.bigHour}>{String(avgHour).padStart(2, '0')}:00</Text>
                  <Text style={st.numSub}>kanıt fotoğraflarına göre</Text>
                </View>
              </>
            )}

            <View style={{ height: 32 }} />
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Popover Menu */}
      {popover && (
        <Modal transparent visible={true} animationType="fade" onRequestClose={() => setPopover(null)}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setPopover(null)}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} />
          </TouchableOpacity>

          {(() => {
            const tipX = popover.x + popover.w / 2;
            const isAbove = popover.y > Dimensions.get('window').height / 2;
            const MENU_W = 180;
            const MENU_H = 100;
            
            let left = tipX - MENU_W / 2;
            if (left < 16) left = 16;
            if (left + MENU_W > width - 16) left = width - 16 - MENU_W;

            const arrowLeft = tipX - left - 8;

            return (
              <View style={{
                position: 'absolute',
                left,
                top: isAbove ? popover.y - MENU_H - 12 : popover.y + popover.h + 12,
                width: MENU_W,
                backgroundColor: '#fff',
                borderRadius: 14,
                shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 15
              }}>
                {/* Arrow */}
                <View style={{
                  position: 'absolute',
                  left: arrowLeft,
                  [isAbove ? 'bottom' : 'top']: -8,
                  width: 0, height: 0,
                  borderLeftWidth: 8, borderRightWidth: 8,
                  borderStyle: 'solid',
                  backgroundColor: 'transparent',
                  borderLeftColor: 'transparent', borderRightColor: 'transparent',
                  ...(isAbove 
                    ? { borderTopWidth: 8, borderTopColor: '#fff', borderBottomWidth: 0 }
                    : { borderBottomWidth: 8, borderBottomColor: '#fff', borderTopWidth: 0 })
                }} />

                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 0.5, borderBottomColor: '#B2B7AA' }} onPress={() => { pinPhoto(popover.id); setPopover(null); }}>
                  <FontAwesome5 name="thumbtack" size={16} color={TEXT} style={{ marginRight: 10, transform: [{ rotate: '-45deg' }] }} />
                  <Text style={{ fontSize: 15, color: TEXT, fontWeight: '600' }}>
                    {user.photos.find(p => p.id === popover.id)?.isPinned ? 'Tutturmayı Kaldır' : 'Başa Tuttur'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 14 }} onPress={() => { deletePhoto(popover.id); setPopover(null); }}>
                  <Ionicons name="trash" size={18} color={RED} style={{ marginRight: 10 }} />
                  <Text style={{ fontSize: 15, color: RED, fontWeight: '600' }}>Gönderiyi Sil</Text>
                </TouchableOpacity>
              </View>
            );
          })()}
        </Modal>
      )}

      {/* Fullscreen Photo Gallery Viewer */}
      {viewerIndex !== null && (
        <Modal transparent visible={true} animationType="fade" onRequestClose={() => setViewerIndex(null)}>
          <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              contentOffset={{ x: viewerIndex * width, y: 0 }}
            >
              {user.photos.map((p) => (
                <View key={p.id} style={{ width, height: Dimensions.get('window').height, backgroundColor: '#fff', justifyContent: 'center' }}>
                  <Image source={{ uri: p.uri }} style={{ width: '100%', height: '100%' }} contentFit="contain" transition={200} placeholder="#F5EDE0" />
                  
                  {/* Top Header Panel */}
                  <View style={{ position: 'absolute', top: Math.max(insets.top + 10, 40), left: 20, right: 20, flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }} onPress={() => setViewerIndex(null)}>
                      <Ionicons name="chevron-back" size={24} color="#111" style={{ marginRight: 2 }} />
                    </TouchableOpacity>
                    
                    <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.85)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14 }}>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: '#111', letterSpacing: -0.3 }} numberOfLines={1}>
                        {p.proofMeta ? (
                          p.proofMeta.setName ? `${p.proofMeta.setName} - ${p.proofMeta.routineName}` : p.proofMeta.routineName
                        ) : (
                          'Fotoğraf'
                        )}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#666', marginTop: 2, fontWeight: '500' }}>
                        {new Date(p.proofMeta?.capturedAt || p.uploadedAt).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </Modal>
      )}


      {/* Routine Edit Sheet */}
      {editingRoutine && (
        <Modal transparent visible={true} animationType="none" onRequestClose={closeEditSheet}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <TouchableOpacity style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)' }]} activeOpacity={1} onPress={closeEditSheet} />
            <Animated.View style={[styles.editSheet, {
              transform: [{ translateY: editSheetAnim.interpolate({ inputRange: [0, 1], outputRange: [500, 0] }) }],
            }]}>
              <View style={styles.editSheetHandle} />
              <Text style={styles.editSheetTitle}>Rutini Düzenle</Text>

              <View style={styles.editForm}>
                <TextInput
                  style={styles.editFormInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Rutin adı"
                  placeholderTextColor={TEXT3}
                  autoFocus
                  maxLength={60}
                />

                <TouchableOpacity style={styles.editTimeBtn} onPress={() => setShowEditTimePicker(v => !v)} activeOpacity={0.7}>
                  <Ionicons name="time-outline" size={16} color={TEXT2} />
                  <Text style={styles.editTimeLbl}>Bildirim saatiniz:</Text>
                  <Text style={styles.editTimeBtnTxt}>{editHour}:{editMin}</Text>
                  <Ionicons name={showEditTimePicker ? 'chevron-up' : 'chevron-down'} size={14} color={TEXT3} />
                </TouchableOpacity>

                {showEditTimePicker && Platform.OS === 'ios' && (
                  <View style={{ overflow: 'hidden', marginBottom: 4 }}>
                    <DateTimePicker
                      value={editTimeDate}
                      mode="time"
                      display="spinner"
                      is24Hour
                      onChange={(_, d) => {
                        if (d) {
                          setEditHour(String(d.getHours()).padStart(2, '0'));
                          setEditMin(String(d.getMinutes()).padStart(2, '0'));
                        }
                      }}
                      style={{ width: '100%', height: 110 }}
                    />
                  </View>
                )}
                {showEditTimePicker && Platform.OS === 'android' && (
                  <DateTimePicker
                    value={editTimeDate}
                    mode="time"
                    display="spinner"
                    is24Hour
                    onChange={(e, d) => {
                      setShowEditTimePicker(false);
                      if (e.type === 'set' && d) {
                        setEditHour(String(d.getHours()).padStart(2, '0'));
                        setEditMin(String(d.getMinutes()).padStart(2, '0'));
                      }
                    }}
                  />
                )}
              </View>

              <View style={styles.editBtnRow}>
                <TouchableOpacity style={styles.editCancelBtn} onPress={closeEditSheet} activeOpacity={0.8}>
                  <Text style={styles.editCancelTxt}>Vazgeç</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.editSaveBtn} onPress={saveEdit} activeOpacity={0.85}>
                  <Text style={styles.editSaveTxt}>Kaydet</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.editDeleteBtn}
                onPress={() => {
                  Alert.alert('Rutini Sil', `"${editingRoutine.name}" silinecek. Emin misin?`, [
                    { text: 'Vazgeç', style: 'cancel' },
                    { text: 'Sil', style: 'destructive', onPress: () => { deleteRoutine(editingRoutine.id); closeEditSheet(); } },
                  ]);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                <Text style={styles.editDeleteTxt}>Rutini Sil</Text>
              </TouchableOpacity>
            </Animated.View>
          </KeyboardAvoidingView>
        </Modal>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  topUsername: { fontSize: 16, color: TEXT, fontWeight: '400', letterSpacing: -0.1 },
  settingsBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' },

  instaHead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 16 },
  avatar: { width: 68, height: 68, borderRadius: 34 },
  avatarFallback: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 26, fontWeight: '900' },
  avatarEditBadge: {
    position: 'absolute', top: 0, left: 0,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: RED, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: BG,
  },
  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: 2 },
  statNum: { fontSize: 18, fontWeight: '900', color: TEXT, letterSpacing: -0.4 },
  statLabel: { fontSize: 11, color: TEXT3, fontWeight: '600' },

  bioArea: { paddingHorizontal: 16, paddingBottom: 10, gap: 3 },
  profileName: { fontSize: 14, fontWeight: '400', color: TEXT },
  profileBio: { fontSize: 13, color: TEXT2, lineHeight: 18 },

  btnRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  proBtn: { flex: 1, flexDirection: 'row', gap: 6, backgroundColor: GOLD, borderRadius: 10, paddingVertical: 9, alignItems: 'center', justifyContent: 'center' },
  proBtnTxt: { color: '#0A3B25', fontSize: 13, fontWeight: '800' },
  editBtn: { flex: 1, backgroundColor: SURFACE, borderRadius: 10, paddingVertical: 9, alignItems: 'center', justifyContent: 'center' },
  editBtnTxt: { color: TEXT, fontSize: 13, fontWeight: '700' },
  tabs: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: BORDER, marginHorizontal: 16 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: TEXT },
  tabText: { fontSize: 13, color: TEXT2, fontWeight: '600' },
  tabTextActive: { color: TEXT, fontWeight: '800' },
  tabContent: { paddingTop: 4 },
  emptyMsg: { textAlign: 'center', color: TEXT3, fontSize: 14, paddingTop: 30 },
  setBlock: { marginBottom: 0 },
  setHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderTopWidth: 0.5, borderTopColor: BORDER, backgroundColor: 'rgba(42,97,81,0.05)' },
  setTitle: { fontSize: 14, color: RED, fontWeight: '700' },
  setTitleInactive: { color: TEXT3 },
  setMeta: { fontSize: 11, color: TEXT3, marginTop: 1 },
  setActionBtn: { alignSelf: 'flex-end', marginRight: 16, marginTop: 6, marginBottom: 10, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: SURFACE, borderRadius: PILL },
  setActionBtnActive: { backgroundColor: 'rgba(42,97,81,0.10)' },
  setActionTxt: { fontSize: 12, fontWeight: '700', color: TEXT3 },
  routineRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 16, gap: 10, borderTopWidth: 0.5, borderTopColor: BORDER },
  routineDot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  routineName: { fontSize: 13, color: TEXT, fontWeight: '600' },
  routineMeta: { fontSize: 11, color: TEXT3, marginTop: 2 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, paddingHorizontal: 2 },
  photoAdd: { width: PHOTO_SIZE, height: PHOTO_SIZE, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1.5, borderColor: BORDER, borderStyle: 'dashed', gap: 6 },
  photoAddText: { fontSize: 11, color: TEXT3, fontWeight: '600' },
  photoCell: { width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: 4, overflow: 'hidden' },
  photoImage: { width: '100%', height: '100%' },
  barRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 24, alignItems: 'flex-end' },
  barItem: { alignItems: 'center', width: 48 },
  bar: { width: 22, height: 90, backgroundColor: SURFACE, borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end', marginBottom: 6 },
  barFill: { width: '100%', borderRadius: 4 },
  barPct: { fontSize: 11, color: TEXT2, fontWeight: '700' },
  barName: { fontSize: 10, color: TEXT3, marginTop: 2, width: 48, textAlign: 'center' },

  // Metrik kartları
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 4, marginTop: 8, width: '100%' },
  metricCard: {
    flex: 1, minWidth: '45%', backgroundColor: CARD, borderRadius: 16,
    padding: 14, gap: 6,
    shadowColor: '#0A3B25', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  metricIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  metricLabel: { fontSize: 12, fontWeight: '700', color: TEXT },
  metricWeight: { fontSize: 10, color: TEXT3, fontWeight: '600' },
  metricBarBg: { height: 5, backgroundColor: SURFACE, borderRadius: 999, overflow: 'hidden' },
  metricBarFill: { height: '100%', borderRadius: 999 },
  metricPct: { fontSize: 12, fontWeight: '800' },

  // Routine edit sheet
  editSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: BG, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 16, paddingBottom: 44,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 20,
  },
  editSheetHandle: { width: 38, height: 4, borderRadius: 2, backgroundColor: SURFACE, alignSelf: 'center', marginBottom: 20 },
  editSheetTitle: { fontSize: 24, fontWeight: '900', color: TEXT, marginBottom: 14, letterSpacing: -0.5 },
  editForm: { gap: 12, marginBottom: 16 },
  editFormInput: {
    fontSize: 16, fontWeight: '600', color: TEXT,
    backgroundColor: SURFACE, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  editTimeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: SURFACE, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 13,
  },
  editTimeLbl: { fontSize: 13, color: TEXT2, flex: 1 },
  editTimeBtnTxt: { fontSize: 16, fontWeight: '800', color: TEXT, letterSpacing: 0.5 },
  editBtnRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  editCancelBtn: { flex: 1, borderRadius: PILL, paddingVertical: 13, alignItems: 'center', backgroundColor: SURFACE },
  editCancelTxt: { fontSize: 14, color: TEXT2, fontWeight: '700' },
  editSaveBtn: {
    flex: 2, borderRadius: PILL, paddingVertical: 13, alignItems: 'center', backgroundColor: RED,
    shadowColor: RED, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  editSaveTxt: { fontSize: 14, color: '#fff', fontWeight: '900' },
  editDeleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  editDeleteTxt: { fontSize: 13, fontWeight: '700', color: '#EF4444' },
});

const st = StyleSheet.create({
  div: { height: 1, backgroundColor: BORDER },

  // Sayı satırı (kutu yok)
  numRow:     { flexDirection: 'row', paddingVertical: 20, paddingHorizontal: 16 },
  numItem:    { flex: 1, alignItems: 'center', gap: 3 },
  numDivider: { width: 1, backgroundColor: BORDER, marginHorizontal: 4 },
  numBig:     { fontSize: 26, fontWeight: '900', color: TEXT, letterSpacing: -0.5 },
  numLbl:     { fontSize: 11, color: TEXT3, fontWeight: '600' },
  numSub:     { fontSize: 11, color: TEXT3, fontWeight: '500' },

  // Bölüm
  sec:       { paddingHorizontal: 20, paddingVertical: 18 },
  secHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  secTitle:  { fontSize: 13, fontWeight: '700', color: TEXT, marginBottom: 12 },

  // Grafik
  dayRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  dayLbl: { flex: 1, textAlign: 'center', fontSize: 10, color: TEXT3, fontWeight: '600' },

  // Bugün
  progBg:   { height: 4, backgroundColor: SURFACE, borderRadius: 2, overflow: 'hidden', marginBottom: 12 },
  progFill: { height: '100%', borderRadius: 2 },
  taskRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, gap: 10, borderTopWidth: 0.5, borderTopColor: BORDER },
  taskDot:  { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: TEXT3, alignItems: 'center', justifyContent: 'center' },
  taskName: { flex: 1, fontSize: 14, color: TEXT, fontWeight: '500' },

  // Mate
  mateRow:   { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  mateCol:   { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 8 },
  mateScore: { fontSize: 36, fontWeight: '900', color: TEXT, letterSpacing: -1 },

  // En aktif saat
  bigHour: { fontSize: 40, fontWeight: '900', color: TEXT, letterSpacing: -1, marginBottom: 2 },
});

