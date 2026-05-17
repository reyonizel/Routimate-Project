import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert, Modal, TextInput, Animated, Easing, KeyboardAvoidingView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../../store/useStore';
import { Photo, Routine } from '../../store/useStore';
import { BlurView } from 'expo-blur';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 32 - 4) / 3;
const today = new Date().toISOString().split('T')[0];

const BG = '#FFFFFF'; const CARD = '#F4F4F4'; const SURFACE = '#EEEEEE';
const TEXT = '#111111'; const TEXT2 = '#767676'; const TEXT3 = '#ABABAB';
const RED = '#00bf63'; const GREEN = '#008800'; const GOLD = '#D4860A';
const BORDER = '#E8E8E8'; const PILL = 999;

export default function ProfileScreen() {
  const user = useStore((s) => s.user);
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

  // Metrik hesaplamaları (client-side approximation)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  const cutoff = thirtyDaysAgo.toISOString().split('T')[0];

  const totalExpected = user.routines.filter(r => r.scope !== 'once').length * 30;
  const completedLast30 = user.routines
    .flatMap(r => r.completedDates.filter(d => d >= cutoff)).length;
  const completionPct = totalExpected > 0 ? Math.min(100, Math.round((completedLast30 * 100) / totalExpected)) : 0;

  const totalPhotos = user.photos.length;
  const proofPhotos = user.photos.filter(p => p.proofMeta).length;
  const proofPct = totalPhotos > 0 ? Math.min(100, Math.round((proofPhotos * 100) / totalPhotos)) : 0;

  const streakDays = (() => {
    const completedSet = new Set(user.routines.flatMap(r => r.completedDates));
    let streak = 0;
    const d = new Date();
    while (completedSet.has(d.toISOString().split('T')[0])) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  })();
  const streakPct = Math.min(100, Math.round((streakDays / 14) * 100));

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
                  ? <Image source={{ uri: user.avatarUri }} style={styles.avatarImage} contentFit="cover" cachePolicy="memory-disk" />
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

            {/* Metrik kartları */}
            <View style={styles.metricGrid}>
              {[
                { label: 'Tamamlama', pct: completionPct, weight: '%60', icon: 'checkmark-circle-outline' as const, color: RED },
                { label: 'Kanıt Fotoğrafı', pct: proofPct, weight: '%15', icon: 'camera-outline' as const, color: '#8B5CF6' },
                { label: 'Giriş Tutarlılığı', pct: 0, weight: '%20', icon: 'calendar-outline' as const, color: '#F59E0B', note: 'Sunucudan hesaplanır' },
                { label: 'Seri Bonusu', pct: streakPct, weight: '%5', icon: 'flame-outline' as const, color: '#EF4444', note: `${streakDays} gün` },
              ].map(m => (
                <View key={m.label} style={styles.metricCard}>
                  <View style={[styles.metricIconWrap, { backgroundColor: m.color + '18' }]}>
                    <Ionicons name={m.icon} size={18} color={m.color} />
                  </View>
                  <Text style={styles.metricLabel}>{m.label}</Text>
                  <Text style={styles.metricWeight}>{m.weight}</Text>
                  <View style={styles.metricBarBg}>
                    <View style={[styles.metricBarFill, { width: `${m.pct}%` as any, backgroundColor: m.color }]} />
                  </View>
                  <Text style={[styles.metricPct, { color: m.color }]}>
                    {m.note ?? `${m.pct}%`}
                  </Text>
                </View>
              ))}
            </View>

            {/* Per-routine bars */}
            {user.routines.length > 0 && (
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
            )}
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
                  <Image source={{ uri: p.uri }} style={{ width: '100%', height: '100%' }} contentFit="contain" />
                  
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
