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
const PHOTO_SIZE = (width - 32 - 4) / 3;
const today = localDateStr();

const BG = '#FFFFFF'; const CARD = '#F4F4F4'; const SURFACE = '#EEEEEE';
const TEXT = '#111111'; const TEXT2 = '#767676'; const TEXT3 = '#ABABAB';
const RED = '#00bf63'; const GREEN = '#008800'; const GOLD = '#D4860A';
const BORDER = '#E8E8E8'; const PILL = 999;

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
      {xs.map((x, i) => <Circle key={i} cx={x} cy={ys[i]} r={3} fill={data[i] > 0 ? color : '#E0E0E0'} />)}
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
    const done = scheduled.filter(r => r.completedDates.includes(dateStr)).length;
    const pct = scheduled.length > 0 ? done / scheduled.length : 0;
    return { dateStr, dayLabel: TR_DAYS[dw], pct, isToday: dateStr === today };
  });

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
        <Text style={styles.topUsername}>{user.username}</Text>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/modal')}>
          <Ionicons name="menu" size={28} color={TEXT} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Instagram style Header: Avatar on left, Stats on right */}
        <View style={styles.instaHeader}>
          {/* Avatar */}
          <View style={styles.avatarCol}>
            <TouchableOpacity onPress={pickAvatar} activeOpacity={0.85} style={styles.avatarWrap}>
              <View style={[styles.avatarRing, { borderColor: accentColor }]}>
                {user.avatarUri
                  ? <Image source={{ uri: user.avatarUri }} style={styles.avatarImage} contentFit="cover" cachePolicy="memory-disk" transition={250} placeholder="#E8E8E8" />
                  : (
                    <View style={styles.avatarInner}>
                      <Text style={[styles.avatarLetter, { color: accentColor }]}>{(user.username || '?')[0].toUpperCase()}</Text>
                    </View>
                  )
                }
              </View>
              <View style={styles.cameraChip}>
                <Ionicons name="add" size={14} color="#fff" />
              </View>
            </TouchableOpacity>
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

        {/* Bio Section */}
        <View style={styles.bioSection}>
          {user.fullName ? <Text style={styles.profileFullName}>{user.fullName}</Text> : null}
          {user.bio ? <Text style={styles.profileBio}>{user.bio}</Text> : null}
          {user.locationName ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Ionicons name="location-outline" size={14} color={TEXT2} />
              <Text style={styles.profileLocation}>{user.locationName}</Text>
            </View>
          ) : null}
        </View>

        {/* Pro badge / upgrade */}
        <View style={styles.actionRow}>
          {user.isPro ? (
            <View style={[styles.proBadge, { flex: 1 }]}>
              <Ionicons name="star" size={13} color={GOLD} />
              <Text style={[styles.proBadgeText, { color: GOLD }]}>Pro Üye</Text>
            </View>
          ) : (
            <TouchableOpacity style={[styles.upgradeBtn, { flex: 1 }]} onPress={() => router.push('/pro-upgrade')} activeOpacity={0.85}>
              <FontAwesome5 name="crown" size={14} color="#fff" />
              <Text style={styles.upgradeBtnText}>Pro'ya Geç</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.editProfileBtn, { flex: 1, marginLeft: 8 }]}
            onPress={() => router.push('/edit-profile')}
            activeOpacity={0.85}
          >
            <Text style={styles.editProfileBtnText}>Profili Düzenle</Text>
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
                const isExpanded = expandedSet === setName;
                return (
                  <View key={setName} style={styles.setBlock}>
                    {/* Collapsed header — tap chevron to expand */}
                    <TouchableOpacity
                      style={styles.setHeader}
                      onPress={() => setExpandedSet(isExpanded ? null : setName)}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.setTitle, isInactive && styles.setTitleInactive]}>{setName}</Text>
                        <Text style={styles.setMeta}>{routines.length} rutin · {isInactive ? 'Pasif' : 'Aktif'}</Text>
                      </View>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={TEXT3}
                      />
                    </TouchableOpacity>

                    {/* Expanded: routine rows + pasifleştir butonu */}
                    {isExpanded && (
                      <>
                        {routines.map(r => {
                          const done = r.completedDates.includes(today);
                          return (
                            <TouchableOpacity
                              key={r.id}
                              style={styles.routineRow}
                              onLongPress={() => openEditSheet(r)}
                              delayLongPress={300}
                              activeOpacity={0.7}
                            >
                              <View style={[styles.routineDot, {
                                backgroundColor: done ? RED : SURFACE,
                                borderWidth: done ? 0 : 1.5,
                                borderColor: BORDER,
                              }]}>
                                {done && <Ionicons name="checkmark" size={10} color="#fff" />}
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={[styles.routineName, done && { color: TEXT3 }]}>{r.name}</Text>
                                <Text style={styles.routineMeta}>{FREQ_LABEL[r.frequency]} · {r.completedDates.length} tamamlama</Text>
                              </View>
                              <Ionicons name="ellipsis-horizontal" size={16} color={TEXT3} />
                            </TouchableOpacity>
                          );
                        })}
                        <TouchableOpacity
                          style={[styles.setActionBtn, isInactive && styles.setActionBtnActive]}
                          onPress={() => toggleSetActive(setName)}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.setActionTxt, isInactive && { color: RED }]}>
                            {isInactive ? 'Aktifleştir' : 'Pasifleştir'}
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
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

            {/* Son 7 Gün — Çizgi Grafiği */}
            <View style={st.sec}>
              <View style={st.secHeader}>
                <Text style={st.secTitle}>Son 7 Gün</Text>
              </View>
              <LineChart data={last7Data.map(d => d.pct)} />
              <View style={st.dayRow}>
                {last7Data.map(d => (
                  <Text key={d.dateStr} style={[st.dayLbl, d.isToday && { color: RED, fontWeight: '800' }]}>
                    {d.dayLabel}
                  </Text>
                ))}
              </View>
            </View>

            <View style={st.div} />

            {/* Tamamlama */}
            <View style={st.sec}>
              <Text style={st.secTitle}>Tamamlama</Text>
              <View style={st.numLine}>
                <Text style={[st.numBig, { color: RED }]}>{totalDoneAllTime.toLocaleString('tr-TR')}</Text>
                <Text style={st.numOf}>/ {totalExpectedAllTime.toLocaleString('tr-TR')} beklenen görev</Text>
              </View>
              <View style={[st.numLine, { marginTop: 8 }]}>
                <Text style={[st.numBig, { color: '#F59E0B' }]}>{proofPhotos}</Text>
                <Text style={st.numOf}>/ {totalExpectedAllTime.toLocaleString('tr-TR')} kanıtlandı</Text>
              </View>
            </View>

            <View style={st.div} />

            {/* Başarı & Seri */}
            <View style={[st.sec, { flexDirection: 'row' }]}>
              <View style={{ flex: 1 }}>
                <Text style={st.secTitle}>Başarı Skoru</Text>
                <Text style={[st.bigN, {
                  color: user.achievementScore >= 70 ? RED : user.achievementScore >= 40 ? '#F59E0B' : '#EF4444',
                }]}>{user.achievementScore}<Text style={st.bigNUnit}>/100</Text></Text>
              </View>
              <View style={st.vDiv} />
              <View style={{ flex: 1 }}>
                <Text style={st.secTitle}>Günlük Seri</Text>
                <Text style={[st.bigN, { color: '#8B5CF6' }]}>{streakDays}<Text style={st.bigNUnit}> gün</Text></Text>
              </View>
            </View>

            <View style={st.div} />

            {/* Bugün */}
            <View style={st.sec}>
              <View style={st.secHeader}>
                <Text style={st.secTitle}>Bugün</Text>
                <Text style={[st.badge, {
                  color: todayPct === 100 ? RED : todayPct > 0 ? '#F59E0B' : TEXT3,
                }]}>
                  {todayScheduled.length > 0 ? `${todayDone}/${todayScheduled.length} tamamlandı` : 'Bugün görev yok'}
                </Text>
              </View>
              {todayScheduled.length > 0 && (
                <>
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
                </>
              )}
            </View>

            {/* Mate */}
            {mate && (
              <>
                <View style={st.div} />
                <View style={[st.sec, { flexDirection: 'row' }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={st.secTitle}>Sen</Text>
                    <Text style={[st.bigN, { color: RED }]}>{user.achievementScore}<Text style={st.bigNUnit}>/100</Text></Text>
                    <Text style={[st.numOf, { marginTop: 4 }]}>{streakDays} gün seri</Text>
                  </View>
                  <View style={st.vDiv} />
                  <View style={{ flex: 1 }}>
                    <Text style={st.secTitle}>@{mate.username}</Text>
                    <Text style={[st.bigN, { color: '#8B5CF6' }]}>{mate.achievementScore}<Text style={st.bigNUnit}>/100</Text></Text>
                    {mateStreakDays !== null && <Text style={[st.numOf, { marginTop: 4 }]}>{mateStreakDays} gün seri</Text>}
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
                  <Text style={st.bigN}>{String(avgHour).padStart(2, '0')}:00</Text>
                  <Text style={[st.numOf, { marginTop: 2 }]}>kanıt fotoğraflarına göre</Text>
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

                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 0.5, borderBottomColor: '#E8E8E8' }} onPress={() => { pinPhoto(popover.id); setPopover(null); }}>
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
                  <Image source={{ uri: p.uri }} style={{ width: '100%', height: '100%' }} contentFit="contain" transition={200} placeholder="#E8E8E8" />
                  
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
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  topUsername: { fontSize: 22, color: TEXT, fontWeight: 'bold' },
  settingsBtn: { padding: 4 },
  
  instaHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  avatarCol: { alignItems: 'center', marginRight: 24 },
  avatarWrap: { position: 'relative' },
  avatarRing: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 72, height: 72, borderRadius: 36 },
  avatarInner: { width: 72, height: 72, borderRadius: 36, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 28, fontWeight: '900' },
  cameraChip: { position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: '#3498db', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: BG },
  
  bioSection: { paddingHorizontal: 16, marginBottom: 16 },
  profileFullName: { fontSize: 14, color: TEXT, fontWeight: '700' },
  profileBio: { fontSize: 14, color: TEXT, marginTop: 2, lineHeight: 18 },
  profileLocation: { fontSize: 13, color: TEXT2, marginLeft: 4 },

  statsContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 18, color: TEXT, fontWeight: 'bold' },
  statLabel: { fontSize: 13, color: TEXT, marginTop: 2 },

  actionRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12 },
  proBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: SURFACE, borderRadius: 5, paddingVertical: 10, borderWidth: 1, borderColor: BORDER },
  proBadgeText: { fontSize: 13, fontWeight: '700' },
  upgradeBtn: { flexDirection: 'row', gap: 8, backgroundColor: '#00bf63', borderRadius: 8, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', width: '100%' },
  upgradeBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
  editProfileBtn: { backgroundColor: SURFACE, borderRadius: 8, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER },
  editProfileBtnText: { color: TEXT, fontSize: 14, fontWeight: '700' },
  tabs: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: BORDER, marginHorizontal: 16 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: TEXT },
  tabText: { fontSize: 13, color: TEXT2, fontWeight: '600' },
  tabTextActive: { color: TEXT, fontWeight: '800' },
  tabContent: { padding: 16 },
  emptyMsg: { textAlign: 'center', color: TEXT3, fontSize: 14, paddingTop: 30 },
  setBlock: { marginBottom: 12, backgroundColor: CARD, borderRadius: 16, overflow: 'hidden' },
  setHeader: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  setTitle: { fontSize: 15, color: TEXT, fontWeight: '800', letterSpacing: -0.3 },
  setTitleInactive: { color: TEXT3 },
  setMeta: { fontSize: 11, color: TEXT3, marginTop: 2 },
  setActionBtn: { margin: 12, marginTop: 4, borderRadius: 10, paddingVertical: 11, alignItems: 'center', backgroundColor: SURFACE },
  setActionBtnActive: { backgroundColor: RED + '15' },
  setActionTxt: { fontSize: 13, fontWeight: '700', color: TEXT2 },
  routineRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, gap: 10, borderTopWidth: 0.5, borderTopColor: BORDER },
  routineDot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  routineName: { fontSize: 13, color: TEXT, fontWeight: '600' },
  routineMeta: { fontSize: 11, color: TEXT3, marginTop: 2 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  photoAdd: { width: PHOTO_SIZE, height: PHOTO_SIZE, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1.5, borderColor: BORDER, borderStyle: 'dashed', gap: 6 },
  photoAddText: { fontSize: 11, color: TEXT3, fontWeight: '600' },
  photoCell: { width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: 10, overflow: 'hidden' },
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
  sec:      { paddingHorizontal: 20, paddingVertical: 18 },
  secHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  secTitle: { fontSize: 12, fontWeight: '700', color: TEXT2, marginBottom: 12 },
  div:      { height: 1, backgroundColor: BORDER },
  vDiv:     { width: 1, backgroundColor: BORDER, marginHorizontal: 20 },

  // Çizgi grafik
  dayRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  dayLbl: { flex: 1, textAlign: 'center', fontSize: 10, color: TEXT3, fontWeight: '600' },

  // Sayılar
  numLine: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  numBig:  { fontSize: 28, fontWeight: '900', color: TEXT },
  numOf:   { fontSize: 13, color: TEXT2 },

  // Büyük sayılar
  bigN:     { fontSize: 44, fontWeight: '900', color: TEXT, lineHeight: 48 },
  bigNUnit: { fontSize: 16, fontWeight: '500', color: TEXT3 },

  // Bugün
  badge:    { fontSize: 13, fontWeight: '600' },
  progBg:   { height: 4, backgroundColor: SURFACE, borderRadius: 2, overflow: 'hidden', marginBottom: 14 },
  progFill: { height: '100%', borderRadius: 2 },
  taskRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, gap: 10, borderTopWidth: 0.5, borderTopColor: BORDER },
  taskDot:  { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: TEXT3, alignItems: 'center', justifyContent: 'center' },
  taskName: { flex: 1, fontSize: 14, color: TEXT, fontWeight: '500' },
});
