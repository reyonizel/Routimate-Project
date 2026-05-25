import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Image, Alert, Dimensions, BackHandler } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, withSpring, useAnimatedStyle, withSequence, withRepeat, withTiming, runOnJS } from 'react-native-reanimated';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../../store/useStore';
import { getAppDate } from '../../lib/date';
import SkeletonImage from '../../components/SkeletonImage';
import { SkeletonBox } from '../../components/SkeletonLoader';
import { Audio } from 'expo-av';

const SOUND_FILES = {
  correct: require('../../assets/images/dragon-studio-correct-472358.mp3'),
  apple_pay: require('../../assets/images/ksjsbwuil-apple-pay-success-sound-effect-481188.mp3'),
  success: require('../../assets/images/meldix-success-340660.mp3'),
  notify: require('../../assets/images/notification_message-notify-7-310750.mp3'),
  iphone_msg: require('../../assets/images/son_duquotidient-message-envoye-iphone-apple-391098.mp3'),
  level_up: require('../../assets/images/tithuh-level-up-02-528919.mp3'),
  notify_022: require('../../assets/images/universfield-new-notification-022-370046.mp3'),
  notify_037: require('../../assets/images/universfield-new-notification-037-485898.mp3'),
  notify_054: require('../../assets/images/universfield-new-notification-054-494259.mp3'),
  notify_057: require('../../assets/images/universfield-new-notification-057-494255.mp3'),
};

const playCompletionSound = async (soundId: string) => {
  if (!soundId || soundId === 'none' || soundId === 'default') return;
  const file = SOUND_FILES[soundId as keyof typeof SOUND_FILES];
  if (!file) return;
  try {
    const { sound } = await Audio.Sound.createAsync(file);
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (e) {}
};

const BG='#EEE3D0'; const CARD='#FFFFFF'; const SURFACE='#F5EDE0';
const TEXT='#0A3B25'; const TEXT2='#3D6B58'; const TEXT3='#B2B7AA';
const RED='#2A6151'; const GREEN='#1A4F3A'; const GOLD='#D8C2A4';
const BORDER='#B2B7AA'; const PILL=999;

const FREQ_COLOR: Record<string,string> = { daily:'#2A6151', weekly:'#1A4F3A', monthly:'#D8C2A4' };
const CAT_COLORS = ['#E91E63','#9C27B0','#3F51B5','#2196F3','#00ACC1','#00897B','#F4511E','#6D4C41','#546E7A','#558B2F'];
function catColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return CAT_COLORS[Math.abs(h) % CAT_COLORS.length];
}
const FREQ_LABEL: Record<string,string> = { daily:'Günlük', weekly:'Haftalık', monthly:'Aylık' };
const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const DAY_LABELS = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];

export default function HomeScreen() {
  const user = useStore(s => s.user);
  const isInitializing = useStore(s => s.isInitializing);
  const today = getAppDate(user.dayEndHour ?? 0);
  const toggleRoutineComplete = useStore(s => s.toggleRoutineComplete);
  const toggleRestDay = useStore(s => s.toggleRestDay);
  const deleteRoutine = useStore(s => s.deleteRoutine);
  const addRoutineProof = useStore(s => s.addRoutineProof);
  const toggleRoutineSkip = useStore(s => s.toggleRoutineSkip);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accent = user.gender === 'female' ? '#e91e63' : '#3498db';
  const isRestDay = user.restDays.includes(today);

  const [calMonth, setCalMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [taskMenu, setTaskMenu] = useState<string | null>(null);

  const sheetY = useSharedValue(0);
  const onDismissRef = useRef<() => void>(() => {});

  const callDismiss = useCallback(() => {
    onDismissRef.current();
  }, []);

  const panGesture = useMemo(() => Gesture.Pan()
    .onUpdate((e) => { if (e.translationY > 0) sheetY.value = e.translationY; })
    .onEnd((e) => {
      if (e.translationY > 80 || e.velocityY > 800) {
        sheetY.value = withTiming(800, { duration: 200 }, (done) => {
          if (done) runOnJS(callDismiss)();
        });
      } else {
        sheetY.value = withSpring(0, { damping: 20 });
      }
    }), [callDismiss]);

  const sheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }],
  }));

  useEffect(() => {
    if (sheetVisible) {
      sheetY.value = 800;
      onDismissRef.current = () => setSheetVisible(false);
      sheetY.value = withTiming(0, { duration: 320 });
    }
  }, [sheetVisible]);

  useEffect(() => {
    if (taskMenu) {
      sheetY.value = 800;
      onDismissRef.current = () => setTaskMenu(null);
      sheetY.value = withTiming(0, { duration: 320 });
    }
  }, [taskMenu]);

  useEffect(() => {
    if (!sheetVisible && !taskMenu) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (sheetVisible) { setSheetVisible(false); return true; }
      if (taskMenu) { setTaskMenu(null); return true; }
      return false;
    });
    return () => sub.remove();
  }, [sheetVisible, taskMenu]);

  const fabOffset = useSharedValue(0);
  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: fabOffset.value }],
  }));

  useFocusEffect(
    useCallback(() => {
      fabOffset.value = withRepeat(
        withTiming(-6, { duration: 600 }),
        -1,
        true,
      );
      return () => { fabOffset.value = 0; };
    }, []),
  );

  const carouselRef = useRef<ScrollView>(null);
  const CELL_W = 46;
  const CAR_W = Dimensions.get('window').width - 64;
  const carPadding = Math.max(0, CAR_W / 2 - CELL_W / 2);
  const todayDayNum = parseInt(today.split('-')[2]);

  useEffect(() => {
    const selYear = parseInt(selectedDate.split('-')[0]);
    const selMonthIdx = parseInt(selectedDate.split('-')[1]) - 1;
    const selDay = parseInt(selectedDate.split('-')[2]);
    const isSelInView = year === selYear && month === selMonthIdx;
    const scrollDay = isSelInView ? selDay : (year === parseInt(today.split('-')[0]) && month === parseInt(today.split('-')[1]) - 1) ? todayDayNum : 1;
    setTimeout(() => {
      carouselRef.current?.scrollTo({ x: Math.max(0, (scrollDay - 1) * CELL_W), animated: false });
    }, 50);
  }, [calMonth]);

  useEffect(() => {
    const selYear = parseInt(selectedDate.split('-')[0]);
    const selMonthIdx = parseInt(selectedDate.split('-')[1]) - 1;
    const selDay = parseInt(selectedDate.split('-')[2]);
    if (year === selYear && month === selMonthIdx) {
      carouselRef.current?.scrollTo({ x: Math.max(0, (selDay - 1) * CELL_W), animated: true });
    }
  }, [selectedDate]);

  const handleToggleDone = (routineId: string, dateStr: string, wasDone: boolean) => {
    toggleRoutineComplete(routineId, dateStr);
    if (!wasDone) {
      playCompletionSound(user.completionSound || 'correct');
    }
  };

  const [proofPhoto, setProofPhoto] = useState<{ routineId: string; uri: string } | null>(null);

  const handleCameraPress = async (routineId: string) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Fotoğraf çekebilmek için kamera iznine ihtiyacımız var.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setProofPhoto({ routineId, uri: result.assets[0].uri });
    }
  };

  const handleLongPress = (id: string) => setTaskMenu(id);
  const swipeRefs = useRef<{ [id: string]: Swipeable | null }>({});

  // Get routines applicable on a date
  const getApplicable = useCallback((dateStr: string) => {
    const dow = new Date(dateStr + 'T12:00:00').getDay();
    const dayOfMonth = new Date(dateStr + 'T12:00:00').getDate();
    return user.routines.filter(r => {
      // inactive set check
      if (r.setName && (user.inactiveSets ?? []).includes(r.setName)) return false;
      // scope check
      if (r.scope === 'once' && r.onceRange) {
        if (dateStr < r.onceRange.start || dateStr > r.onceRange.end) return false;
      }
      if (r.frequency === 'daily') return true;
      if (r.frequency === 'weekly') {
        if (!r.targetDays || r.targetDays.length === 0) return true;
        return r.targetDays.includes(dow);
      }
      if (r.frequency === 'monthly') {
        if (!r.monthlyDays || r.monthlyDays.length === 0) return true;
        return r.monthlyDays.includes(dayOfMonth);
      }
      return true;
    });
  }, [user.routines, user.inactiveSets]);

  const getRate = useCallback((dateStr: string) => {
    if (user.restDays.includes(dateStr)) return -1; // rest day sentinel
    const app = getApplicable(dateStr).filter(r => !(r.skippedDates ?? []).includes(dateStr));
    if (!app.length) return null;
    const done = app.filter(r => r.completedDates.includes(dateStr)).length;
    return Math.round((done / app.length) * 100);
  }, [getApplicable, user.restDays]);

  const canToggle = selectedDate === today;
  const selIsRestDay = user.restDays.includes(selectedDate);
  const selRoutines = getApplicable(selectedDate);
  const selGroups = (() => {
    const map = new Map<string, typeof selRoutines>();
    selRoutines.forEach(r => {
      const key = r.setName ?? '';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return Array.from(map.entries()).map(([key, rs]) => ({ setName: key || undefined, routines: rs }));
  })();

  // Calendar
  const year = calMonth.getFullYear();
  const month = calMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const rawFirst = new Date(year, month, 1).getDay();
  const offset = rawFirst === 0 ? 6 : rawFirst - 1;
  const cells: (number|null)[] = [...Array(offset).fill(null), ...Array.from({length: daysInMonth}, (_,i) => i+1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const openDay = (day: number) => {
    const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    setSelectedDate(ds);
    setSheetVisible(true);
  };

  const isPast = selectedDate < today;
  const isToday = selectedDate === today;

  const dotColor = (rate: number|null) => {
    if (rate === null) return 'transparent';
    if (rate === -1) return '#B2B7AA'; // rest day
    if (rate === 100) return GREEN;
    if (rate >= 50) return accent;
    if (rate > 0) return GOLD;
    return RED + '55';
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Top Block: Header + Calendar */}
      <View style={s.topBlock}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            {user.avatarUri ? (
              <SkeletonImage uri={user.avatarUri} style={s.headerAvatar} skeletonStyle={s.headerAvatar} borderRadius={14} />
            ) : (
              <View style={s.headerAvatarPlaceholder}>
                <Ionicons name="person" size={16} color={accent} />
              </View>
            )}
            <View>
              <Text style={s.sub}>Hoşgeldin</Text>
              <Text style={s.title}>{(user.fullName?.split(' ')[0] || user.username) || 'Kullanıcı'}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[s.settBtn, isRestDay && s.settBtnRest]}
              onPress={() => toggleRestDay(today)}
              activeOpacity={0.8}
            >
              {isRestDay
                ? <Ionicons name="cafe" size={20} color="#fff" />
                : <Ionicons name="cafe-outline" size={20} color={TEXT2} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={s.settBtn}
              onPress={() => setSheetVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar-outline" size={20} color={TEXT2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Month Carousel */}
        <View style={s.carouselWrap}>
          <TouchableOpacity style={s.carArrowBtn} onPress={() => setCalMonth(new Date(year, month - 1, 1))}>
            <Ionicons name="chevron-back" size={18} color={TEXT2} />
          </TouchableOpacity>
          <ScrollView
            ref={carouselRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: carPadding }}
            style={{ flex: 1 }}
          >
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isT = ds === today;
              const isSel = ds === selectedDate;
              const isPastD = ds < today;
              const rate = getRate(ds);
              const dw = new Date(ds + 'T12:00:00').getDay();
              const dlbl = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'][dw];
              return (
                <TouchableOpacity
                  key={ds}
                  onPress={() => setSelectedDate(ds)}
                  style={[s.carCell, (isT || isSel) && s.carCellActive, isT && s.carCellToday]}
                  activeOpacity={0.7}
                >
                  <Text style={[s.carDayName, isT && { color: '#fff' }, isSel && !isT && { color: RED }]}>
                    {dlbl}
                  </Text>
                  <Text style={[s.carDayNum, isT && { color: '#fff' }, isSel && !isT && { color: RED }, isPastD && !isSel && !isT && { color: TEXT3 }]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity style={s.carArrowBtn} onPress={() => setCalMonth(new Date(year, month + 1, 1))}>
            <Ionicons name="chevron-forward" size={18} color={TEXT2} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        {/* Geçmiş gün bandı */}
        {!canToggle && (
          <View style={s.pastBanner}>
            <Ionicons name="lock-closed" size={11} color={TEXT3} />
            <Text style={s.pastBannerTxt}>
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} — sadece görüntüleme
            </Text>
          </View>
        )}

        {isInitializing ? (
          <View style={s.skeletonList}>
            {Array.from({ length: 5 }).map((_, i) => (
              <View key={i} style={s.skeletonRow}>
                <SkeletonBox width={40} height={40} borderRadius={10} />
                <View style={s.skeletonTextWrap}>
                  <SkeletonBox width="70%" height={14} borderRadius={7} />
                  <SkeletonBox width="40%" height={10} borderRadius={5} style={{ marginTop: 6 }} />
                </View>
                <SkeletonBox width={30} height={30} borderRadius={15} />
              </View>
            ))}
          </View>
        ) : selIsRestDay ? (
          <View style={s.restDayWrap}>
            <ExpoImage
              source={require('../../assets/images/sleeping-cat.gif')}
              style={s.catGif}
              contentFit="contain"
            />
            <Text style={s.emptyTitle}>Dinlenme günü</Text>
            <Text style={s.emptySub}>Bunu hak ettin, {user.fullName?.split(' ')[0]}! 😴</Text>
          </View>
        ) : selRoutines.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="add-circle-outline" size={40} color={TEXT3} />
            <Text style={s.emptyTitle}>Bu gün için rutin yok</Text>
            {canToggle && <Text style={s.emptySub}>+ butonuyla rutin ekle</Text>}
          </View>
        ) : (
          <View style={s.list}>
            {selGroups.map((group) => {
              const sorted = [...group.routines].sort((a, b) => {
                const aDone = a.completedDates.includes(selectedDate);
                const bDone = b.completedDates.includes(selectedDate);
                return aDone === bDone ? 0 : aDone ? -1 : 1;
              });
              return (
                <View key={group.setName ?? '__none__'}>
                  {sorted.map(r => {
                    const done = r.completedDates.includes(selectedDate);
                    const skipped = (r.skippedDates ?? []).includes(selectedDate);
                    const proof = user.photos.find(p => p.proofMeta?.routineId === r.id && p.proofMeta?.date === selectedDate);
                    const cc = r.setName ? catColor(r.setName) : TEXT3;
                    const noteCount = r.notes?.length ?? 0;

                    return (
                      <View key={r.id}>
                        <Swipeable
                          ref={el => { swipeRefs.current[r.id] = el; }}
                          friction={2}
                          overshootLeft={false}
                          overshootRight={false}
                          renderLeftActions={canToggle ? () => (
                            <TouchableOpacity
                              style={[s.swipeAction, { backgroundColor: skipped ? '#2A6151' : '#B2B7AA' }]}
                              onPress={() => { swipeRefs.current[r.id]?.close(); toggleRoutineSkip(r.id, selectedDate); }}
                              activeOpacity={0.85}
                            >
                              <Ionicons name={skipped ? 'refresh-outline' : 'cafe-outline'} size={20} color="#fff" />
                              <Text style={s.swipeLabel}>{skipped ? 'Devam' : 'Atla'}</Text>
                            </TouchableOpacity>
                          ) : undefined}
                          renderRightActions={canToggle ? () => (
                            <TouchableOpacity
                              style={[s.swipeAction, { backgroundColor: '#3498db' }]}
                              onPress={() => { swipeRefs.current[r.id]?.close(); router.push(`/routine-edit?id=${r.id}`); }}
                              activeOpacity={0.85}
                            >
                              <Ionicons name="create-outline" size={20} color="#fff" />
                              <Text style={s.swipeLabel}>Düzenle</Text>
                            </TouchableOpacity>
                          ) : undefined}
                        >
                          <TouchableOpacity
                            style={[s.taskRow, skipped && s.taskRowSkipped]}
                            onLongPress={() => handleLongPress(r.id)}
                            delayLongPress={300}
                            activeOpacity={1}
                          >
                            {/* Sol: kategori ikonu */}
                            <View style={[s.catIcon, { backgroundColor: skipped ? '#B2B7AA' : (r.setName ? cc : SURFACE) }]}>
                              <Ionicons
                                name={skipped ? 'cafe-outline' : ((r.setIcon as any) || 'star-outline')}
                                size={16}
                                color={skipped ? '#fff' : (r.setName ? '#fff' : TEXT3)}
                              />
                            </View>

                            <View style={{ flex: 1 }}>
                              <Text style={[s.taskName, (done || skipped) && s.taskNameDone]}>{r.name}</Text>
                            </View>

                            {/* Sağ: kamera + done yan yana */}
                            <View style={s.taskActions}>
                              {!skipped && (
                                <TouchableOpacity
                                  style={s.taskCamera}
                                  onPress={() => canToggle && handleCameraPress(r.id)}
                                  activeOpacity={canToggle ? 0.7 : 1}
                                >
                                  {proof ? (
                                    <SkeletonImage uri={proof.uri} style={{ width: 28, height: 28 }} skeletonStyle={{ width: 28, height: 28 }} borderRadius={7} />
                                  ) : (
                                    <Ionicons name="camera-outline" size={17} color={canToggle ? TEXT2 : TEXT3} />
                                  )}
                                </TouchableOpacity>
                              )}

                              <TouchableOpacity
                                style={[s.taskCheck, done && !skipped && s.taskCheckDone, skipped && s.taskCheckSkipped]}
                                onPress={() => !skipped && canToggle && handleToggleDone(r.id, selectedDate, done)}
                                activeOpacity={(canToggle && !skipped) ? 0.75 : 1}
                              >
                                {skipped
                                  ? <Ionicons name="cafe-outline" size={12} color={TEXT3} />
                                  : done
                                    ? <Ionicons name="checkmark" size={16} color="#fff" />
                                    : !canToggle
                                      ? <Ionicons name="lock-closed" size={10} color={TEXT3} />
                                      : null}
                              </TouchableOpacity>
                            </View>
                          </TouchableOpacity>
                        </Swipeable>
                        <View style={s.taskDivider} />
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        )}

        <View style={{height: 80}} />
      </ScrollView>

      {/* â”€â”€ FAB â”€â”€ */}
      <Animated.View style={[s.fabWrap, { bottom: 8, right: 16 }, fabStyle]}>
        <TouchableOpacity
          style={s.fab}
          onPress={() => router.push('/create')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* â”€â”€ Takvim Modalı â”€â”€ */}
      {sheetVisible && <>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setSheetVisible(false)} />
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[s.sheet, s.sheetPos, { paddingBottom: insets.bottom + 12 }, sheetAnimStyle]}>
            <View style={s.sheetHandle} />

          {/* Ay navigasyonu */}
          <View style={s.calHeader}>
            <TouchableOpacity style={s.calArrow} onPress={() => setCalMonth(new Date(year, month - 1, 1))}>
              <Ionicons name="chevron-back" size={20} color={TEXT} />
            </TouchableOpacity>
            <Text style={s.calTitle}>{MONTHS[month]} {year}</Text>
            <TouchableOpacity style={s.calArrow} onPress={() => setCalMonth(new Date(year, month + 1, 1))}>
              <Ionicons name="chevron-forward" size={20} color={TEXT} />
            </TouchableOpacity>
          </View>

          {/* Gün başlıkları */}
          <View style={s.calDayRow}>
            {DAY_LABELS.map(d => <Text key={d} style={s.calDayLabel}>{d}</Text>)}
          </View>

          {/* Izgara */}
          <View style={s.calGrid}>
            {Array.from({length: cells.length / 7}, (_, row) => (
              <View key={row} style={s.calRow}>
                {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
                  if (!day) return <View key={col} style={s.calCell} />;
                  const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const pastDay = ds < today;
                  const todayCell = ds === today;
                  const rate = getRate(ds);
                  return (
                    <TouchableOpacity
                      key={col}
                      style={[s.calCell, todayCell && s.calCellToday]}
                      onPress={() => { setSelectedDate(ds); setSheetVisible(false); }}
                      activeOpacity={0.7}
                    >
                      <Text style={[s.calNum, pastDay && s.calNumPast, todayCell && s.calNumToday]}>{day}</Text>
                      {rate === -1 ? (
                        <View style={[s.calDot, { backgroundColor: '#B2B7AA' }]}>
                          <Text style={s.calDotTxt}>☕</Text>
                        </View>
                      ) : rate !== null ? (
                        <View style={[s.calDot, { backgroundColor: dotColor(rate) }]}>
                          <Text style={s.calDotTxt}>{rate}%</Text>
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Legend */}
          <View style={s.legend}>
            {[
              { color: GREEN, label: 'Tam' },
              { color: accent, label: '50%+' },
              { color: GOLD, label: 'Kısmen' },
              { color: RED + '55', label: 'Yapılmadı' },
              { color: '#B2B7AA', label: 'Dinlenme' },
            ].map(i => (
              <View key={i.label} style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: i.color }]} />
                <Text style={s.legendTxt}>{i.label}</Text>
              </View>
            ))}
          </View>
          </Animated.View>
        </GestureDetector>
      </>}

      {/* Task Menu Bottom Sheet */}
      {taskMenu && (() => {
        const menuR = user.routines.find(r => r.id === taskMenu);
        if (!menuR) return null;
        const mcc = menuR.setName ? catColor(menuR.setName) : TEXT3;
        return (
          <>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setTaskMenu(null)} />
            <GestureDetector gesture={panGesture}>
              <Animated.View style={[s.taskMenuSheet, s.sheetPos, { paddingBottom: insets.bottom + 16 }, sheetAnimStyle]}>
                <View style={s.sheetHandle} />

              {/* Rutin başlığı */}
              <View style={s.taskMenuHeader}>
                <View style={[s.catIcon, { backgroundColor: menuR.setName ? mcc : SURFACE }]}>
                  <Ionicons name={(menuR.setIcon as any) || 'star-outline'} size={15} color={menuR.setName ? '#fff' : TEXT3} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.taskMenuName}>{menuR.name}</Text>
                  {menuR.setName && <Text style={s.taskMenuSub}>{menuR.setName} · {FREQ_LABEL[menuR.frequency]}</Text>}
                </View>
              </View>

              {/* Detaylar */}
              <View style={s.menuDetailsWrap}>
                <View style={s.menuDetailRow}>
                  <Ionicons name="time-outline" size={13} color={TEXT3} />
                  <Text style={s.menuDetailTxt}>Bildirim: {menuR.notificationTime}</Text>
                </View>
                <View style={s.menuDetailRow}>
                  <Ionicons name="checkmark-done-outline" size={13} color={TEXT3} />
                  <Text style={s.menuDetailTxt}>{menuR.completedDates.length} kez tamamlandı</Text>
                </View>
                {(menuR.notes?.length ?? 0) > 0 && (
                  <View style={s.menuDetailRow}>
                    <Ionicons name="document-text-outline" size={13} color={TEXT3} />
                    <Text style={s.menuDetailTxt}>{menuR.notes!.length} not</Text>
                  </View>
                )}
              </View>

              {/* İşlem butonları */}
              <View style={s.menuActionsCard}>
                <TouchableOpacity style={s.menuActionBtn} onPress={() => { setTaskMenu(null); router.push(`/routine-edit?id=${menuR.id}`); }}>
                  <Ionicons name="create-outline" size={19} color={TEXT} />
                  <Text style={s.menuActionTxt}>Düzenle</Text>
                  <Ionicons name="chevron-forward" size={15} color={TEXT3} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
                <View style={s.menuActionDivider} />
                <TouchableOpacity style={s.menuActionBtn} onPress={() => { setTaskMenu(null); router.push(`/routine-stats?id=${menuR.id}`); }}>
                  <Ionicons name="bar-chart-outline" size={19} color={TEXT} />
                  <Text style={s.menuActionTxt}>İstatistikler</Text>
                  <Ionicons name="chevron-forward" size={15} color={TEXT3} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
                <View style={s.menuActionDivider} />
                <TouchableOpacity style={s.menuActionBtn} onPress={() => { setTaskMenu(null); router.push(`/routine-note?id=${menuR.id}`); }}>
                  <Ionicons name="add-circle-outline" size={19} color={TEXT} />
                  <Text style={s.menuActionTxt}>Not Ekle</Text>
                  <Ionicons name="chevron-forward" size={15} color={TEXT3} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
                {(menuR.notes?.length ?? 0) > 0 && (
                  <>
                    <View style={s.menuActionDivider} />
                    <TouchableOpacity style={s.menuActionBtn} onPress={() => { setTaskMenu(null); router.push(`/routine-note?id=${menuR.id}`); }}>
                      <Ionicons name="document-text-outline" size={19} color={TEXT} />
                      <Text style={s.menuActionTxt}>Notlarım</Text>
                      <View style={s.menuNoteBadge}>
                        <Text style={s.menuNoteBadgeTxt}>{menuR.notes!.length}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={15} color={TEXT3} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  </>
                )}
              </View>

              {/* Sil */}
              <TouchableOpacity
                style={s.menuDeleteBtn}
                onPress={() => {
                  setTaskMenu(null);
                  Alert.alert(`"${menuR.name}" silinecek`, 'Bu rutin kalıcı olarak silinecek.', [
                    { text: 'İptal', style: 'cancel' },
                    { text: 'Sil', style: 'destructive', onPress: () => deleteRoutine(menuR.id) },
                  ]);
                }}
              >
                <Ionicons name="trash-outline" size={19} color="#e74c3c" />
                <Text style={s.menuDeleteTxt}>Sil</Text>
              </TouchableOpacity>
              </Animated.View>
            </GestureDetector>
          </>
        );
      })()}

      {/* Proof Photo Modal */}
      {proofPhoto && (
        <Modal transparent visible animationType="fade" onRequestClose={() => setProofPhoto(null)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' }}>
            <Image source={{ uri: proofPhoto.uri }} style={{ width: '90%', height: '65%', borderRadius: 20 }} resizeMode="cover" />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
              <TouchableOpacity
                style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, paddingVertical: 13, paddingHorizontal: 28 }}
                onPress={() => setProofPhoto(null)}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Yeniden Çek</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: RED, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 28 }}
                onPress={async () => {
                  setProofPhoto(null);
                  await addRoutineProof(proofPhoto.routineId, today, proofPhoto.uri);
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {flex:1, backgroundColor:BG},
  topBlock: {backgroundColor:BG},

  // Carousel
  carouselWrap: {flexDirection:'row', alignItems:'center', paddingVertical:4, backgroundColor:BG},
  carArrowBtn: {width:32, height:48, alignItems:'center', justifyContent:'center'},
  carCell: {width:44, alignItems:'center', paddingVertical:6, paddingHorizontal:1, borderRadius:10, gap:1},
  carCellActive: {backgroundColor:SURFACE},
  carCellToday: {backgroundColor:RED},
  carDayName: {fontSize:9, fontWeight:'700', color:TEXT3},
  carDayNum: {fontSize:15, fontWeight:'900', color:TEXT},

  // Past banner
  pastBanner: {flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:16, paddingVertical:6, backgroundColor:CARD},
  pastBannerTxt: {fontSize:11, color:TEXT3},

  fabWrap: {position:'absolute'},
  fab: {width:52, height:52, borderRadius:12, backgroundColor:RED, alignItems:'center', justifyContent:'center', shadowColor:'#000', shadowOffset:{width:0,height:4}, shadowOpacity:0.2, shadowRadius:8, elevation:6},
  header: {flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingTop:10, paddingBottom:6},
  headerLeft: {flexDirection:'row', alignItems:'center', gap:10},
  headerAvatar: {width:28, height:28, borderRadius:14},
  headerAvatarPlaceholder: {width:28, height:28, borderRadius:14, backgroundColor:SURFACE, alignItems:'center', justifyContent:'center'},
  sub: {fontSize:11, color:TEXT2, marginBottom:1},
  title: {fontSize:15, color:TEXT, fontWeight:'500', letterSpacing:-0.3},
  settBtn: {width:40, height:40, borderRadius:20, backgroundColor:SURFACE, alignItems:'center', justifyContent:'center'},
  settBtnRest: {backgroundColor:'#B2B7AA'},

  // List
  list: {},
  setLabel: {paddingHorizontal:16, paddingTop:16, paddingBottom:4},
  setLabelTxt: {fontSize:10, fontWeight:'800', color:TEXT3, letterSpacing:0.8},
  row: {flexDirection:'row', alignItems:'center', gap:10, paddingVertical:12, borderBottomWidth:0.5, borderBottomColor:BORDER},
  check: {width:18, height:18, borderRadius:9, borderWidth:1.5, alignItems:'center', justifyContent:'center', backgroundColor:'transparent'},
  rowName: {fontSize:13, color:TEXT, fontWeight:'600', letterSpacing:-0.2},
  rowMeta: {fontSize:11, color:TEXT3, marginTop:1},

  // Task rows (new list style)
  taskRow: {flexDirection:'row', alignItems:'center', gap:10, paddingVertical:13, paddingHorizontal:16, backgroundColor:SURFACE},
  taskDivider: {height:1, backgroundColor:BORDER, marginHorizontal:20},
  catIcon: {width:36, height:36, borderRadius:10, alignItems:'center', justifyContent:'center'},
  taskCamera: {width:30, height:30, borderRadius:8, alignItems:'center', justifyContent:'center'},
  taskActions: {flexDirection:'row', alignItems:'center', gap:6},
  taskName: {fontSize:14, color:TEXT, fontWeight:'500'},
  taskNameDone: {color:TEXT3},
  taskMetaRow: {flexDirection:'row', alignItems:'center', gap:5, marginTop:3},
  catChip: {borderRadius:4, paddingHorizontal:5, paddingVertical:1},
  catChipTxt: {fontSize:10, fontWeight:'600', color:'#fff'},
  taskMeta: {fontSize:11, color:TEXT3},
  taskRowSkipped: {opacity: 0.55},
  taskCheck: {width:30, height:30, borderRadius:15, borderWidth:1.5, borderColor:BORDER, alignItems:'center', justifyContent:'center'},
  taskCheckDone: {backgroundColor:RED, borderColor:RED},
  taskCheckSkipped: {borderColor:SURFACE, backgroundColor:SURFACE},
  swipeAction: {width:72, justifyContent:'center', alignItems:'center', gap:4},
  swipeLabel: {fontSize:10, color:'#fff', fontWeight:'800'},
  menuNoteBadge: {backgroundColor:RED, borderRadius:999, paddingHorizontal:7, paddingVertical:2, marginLeft:'auto'},
  menuNoteBadgeTxt: {fontSize:11, color:'#fff', fontWeight:'800'},

  // Skeleton
  skeletonList: { paddingHorizontal: 16, gap: 12, paddingTop: 12 },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  skeletonTextWrap: { flex: 1, gap: 6 },

  // Empty
  empty: {alignItems:'center', paddingTop:48, gap:8},
  emptyTitle: {fontSize:16, color:TEXT2, fontWeight:'800'},
  emptySub: {fontSize:13, color:TEXT3},
  restDayWrap: {
    minHeight: Dimensions.get('window').height * 0.46,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  catGif: { width: 220, height: 220 },

  // Calendar
  calHeader: {flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:12},
  calArrow: {width:36, height:36, borderRadius:18, backgroundColor:SURFACE, alignItems:'center', justifyContent:'center'},
  calTitle: {fontSize:17, color:TEXT, fontWeight:'800'},
  calDayRow: {flexDirection:'row', paddingHorizontal:16, marginBottom:4},
  calDayLabel: {flex:1, textAlign:'center', fontSize:11, color:TEXT2, fontWeight:'700'},
  calGrid: {paddingHorizontal:16},
  calRow: {flexDirection:'row'},
  calCell: {flex:1, alignItems:'center', paddingVertical:6, gap:3},
  calCellToday: {backgroundColor:RED+'10', borderRadius:12},
  calNum: {fontSize:13, color:TEXT, fontWeight:'600'},
  calNumPast: {color:TEXT3},
  calNumToday: {color:RED, fontWeight:'900'},
  calDot: {borderRadius:PILL, paddingHorizontal:4, paddingVertical:2, minWidth:28, alignItems:'center'},
  calDotTxt: {fontSize:9, color:'#fff', fontWeight:'800'},

  // Legend
  legend: {flexDirection:'row', justifyContent:'center', flexWrap:'wrap', gap:10, paddingVertical:14},
  legendItem: {flexDirection:'row', alignItems:'center', gap:5},
  legendDot: {width:10, height:10, borderRadius:5},
  legendTxt: {fontSize:11, color:TEXT2},

  // Sheet
  sheetPos: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  sheet: {backgroundColor:GOLD, borderTopLeftRadius:24, borderTopRightRadius:24, paddingHorizontal:16, paddingTop:8, paddingBottom:34},
  sheetHandle: {width:36, height:4, backgroundColor:SURFACE, borderRadius:2, alignSelf:'center', marginBottom:14},
  sheetHead: {flexDirection:'row', alignItems:'flex-start', marginBottom:14},
  sheetDate: {fontSize:17, color:TEXT, fontWeight:'900', marginBottom:5},
  lockRow: {flexDirection:'row', alignItems:'center', gap:5},
  lockTxt: {fontSize:12, color:RED},
  sheetRate: {fontSize:28, fontWeight:'900'},
  sheetEmpty: {textAlign:'center', color:TEXT3, paddingVertical:24},
  sheetRow: {flexDirection:'row', alignItems:'center', gap:10, paddingVertical:12, borderBottomWidth:0.5, borderBottomColor:BORDER},
  checkLocked: {borderColor:SURFACE, backgroundColor:SURFACE},


  // Task Menu Bottom Sheet
  taskMenuSheet: {backgroundColor:GOLD, borderTopLeftRadius:24, borderTopRightRadius:24, paddingHorizontal:16, paddingTop:8},
  taskMenuHeader: {flexDirection:'row', alignItems:'center', gap:12, paddingVertical:14, paddingHorizontal:4},
  taskMenuName: {fontSize:17, color:TEXT, fontWeight:'800', letterSpacing:-0.3},
  taskMenuSub: {fontSize:12, color:TEXT2, marginTop:2},
  menuDetailsWrap: {backgroundColor:SURFACE, borderRadius:16, padding:14, marginBottom:12, gap:9},
  menuDetailRow: {flexDirection:'row', alignItems:'center', gap:8},
  menuDetailTxt: {fontSize:13, color:TEXT2},
  menuActionsCard: {backgroundColor:SURFACE, borderRadius:16, marginBottom:10, overflow:'hidden'},
  menuActionBtn: {flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:16, paddingVertical:15},
  menuActionTxt: {fontSize:15, color:TEXT, fontWeight:'600'},
  menuActionDivider: {height:0.5, backgroundColor:BORDER, marginLeft:47},
  menuDeleteBtn: {flexDirection:'row', alignItems:'center', gap:12, backgroundColor:SURFACE, borderRadius:16, paddingHorizontal:16, paddingVertical:15},
  menuDeleteTxt: {fontSize:15, color:'#e74c3c', fontWeight:'600'},

  // Sheet rest day toggle
  sheetRestBtn: {flexDirection:'row', alignItems:'center', gap:10, backgroundColor:SURFACE, borderRadius:12, padding:12, marginBottom:12, borderWidth:1, borderColor:BORDER},
  sheetRestBtnOn: {backgroundColor:'#B2B7AA', borderColor:'#9BA5A0'},
  sheetRestTxt: {fontSize:13, color:TEXT2, fontWeight:'700', flex:1},
});

