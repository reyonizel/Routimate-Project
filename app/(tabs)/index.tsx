import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Dimensions, TextInput, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../../store/useStore';
import { TimeField } from './create';
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

const { height: SH } = Dimensions.get('window');
const today = new Date().toISOString().split('T')[0];

const BG='#FFFFFF'; const CARD='#F4F4F4'; const SURFACE='#EEEEEE';
const TEXT='#111111'; const TEXT2='#767676'; const TEXT3='#ABABAB';
const RED='#00bf63'; const GREEN='#008800'; const GOLD='#D4860A';
const BORDER='#E8E8E8'; const PILL=999;

const FREQ_COLOR: Record<string,string> = { daily:'#2980b9', weekly:'#8e44ad', monthly:'#d35400' };
const FREQ_LABEL: Record<string,string> = { daily:'Günlük', weekly:'Haftalık', monthly:'Aylık' };
const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const DAY_LABELS = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];

export default function HomeScreen() {
  const user = useStore(s => s.user);
  const toggleRoutineComplete = useStore(s => s.toggleRoutineComplete);
  const toggleRestDay = useStore(s => s.toggleRestDay);
  const deleteRoutine = useStore(s => s.deleteRoutine);
  const updateRoutine = useStore(s => s.updateRoutine);
  const addRoutineProof = useStore(s => s.addRoutineProof);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accent = user.gender === 'female' ? '#e91e63' : '#3498db';
  const isRestDay = user.restDays.includes(today);

  const [view, setView] = useState<'list'|'calendar'>('list');
  const [calMonth, setCalMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string|null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [expandedRoutineId, setExpandedRoutineId] = useState<string | null>(null);

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

  const [quickEditRoutineId, setQuickEditRoutineId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editHour, setEditHour] = useState('');
  const [editMin, setEditMin] = useState('');

  const toggleExpand = (id: string) => {
    setExpandedRoutineId(prev => prev === id ? null : id);
  };

  const routineRefs = React.useRef<{ [id: string]: any }>({});
  const [popover, setPopover] = useState<{ id: string, x: number, y: number, w: number, h: number } | null>(null);

  const handleLongPress = (id: string) => {
    const ref = routineRefs.current[id];
    if (ref && ref.measureInWindow) {
      ref.measureInWindow((x: number, y: number, w: number, h: number) => {
        setPopover({ id, x, y, w, h });
      });
    }
  };

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
    const app = getApplicable(dateStr);
    if (!app.length) return null;
    const done = app.filter(r => r.completedDates.includes(dateStr)).length;
    return Math.round((done / app.length) * 100);
  }, [getApplicable, user.restDays]);

  // Today data
  const todayRoutines = getApplicable(today);
  const doneToday = todayRoutines.filter(r => r.completedDates.includes(today)).length;
  const todayPct = todayRoutines.length > 0 ? Math.round((doneToday / todayRoutines.length) * 100) : 0;

  const todayGroups = (() => {
    const map = new Map<string, typeof todayRoutines>();
    todayRoutines.forEach(r => {
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

  const selRoutines = selectedDate ? getApplicable(selectedDate) : [];
  const isPast = selectedDate ? selectedDate < today : false;
  const isToday = selectedDate === today;
  const selIsRestDay = selectedDate ? user.restDays.includes(selectedDate) : false;

  const dotColor = (rate: number|null) => {
    if (rate === null) return 'transparent';
    if (rate === -1) return '#34495e'; // rest day
    if (rate === 100) return GREEN;
    if (rate >= 50) return accent;
    if (rate > 0) return GOLD;
    return RED + '55';
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.sub}>{new Date().toLocaleDateString('tr-TR',{weekday:'long',day:'numeric',month:'long'})}</Text>
          <Text style={s.title}>Rutinlerim</Text>
        </View>
        <View style={s.headerRight}>
          <View style={s.toggle}>
            <TouchableOpacity style={[s.toggleBtn, view==='list' && s.toggleBtnOn]} onPress={() => setView('list')}>
              <Ionicons name="list" size={17} color={view==='list' ? '#fff' : TEXT2} />
            </TouchableOpacity>
            <TouchableOpacity style={[s.toggleBtn, view==='calendar' && s.toggleBtnOn]} onPress={() => setView('calendar')}>
              <Ionicons name="calendar-outline" size={17} color={view==='calendar' ? '#fff' : TEXT2} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[s.settBtn, isRestDay && s.settBtnRest]}
            onPress={() => toggleRestDay(today)}
            activeOpacity={0.8}
          >
            <Ionicons name={isRestDay ? 'moon' : 'moon-outline'} size={20} color={isRestDay ? '#fff' : TEXT2} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {view === 'list' ? (
          <>
            {/* List */}
            {isRestDay ? (
              <View style={s.empty}>
                <Ionicons name="moon-outline" size={48} color={TEXT3} />
                <Text style={s.emptyTitle}>@{user.username}</Text>
                <Text style={s.emptySub}>İyi istirahatler!</Text>
              </View>
            ) : todayRoutines.length === 0 ? (
              <View style={s.empty}>
                <Ionicons name="add-circle-outline" size={48} color={TEXT3} />
                <Text style={s.emptyTitle}>Henüz rutin yok</Text>
                <Text style={s.emptySub}>+ butonuyla rutin ekle</Text>
              </View>
            ) : (
              <View style={s.list}>
                {todayGroups.map((group, idx) => {
                  const groupDone = group.routines.filter(r => r.completedDates.includes(today)).length;
                  const groupPct = group.routines.length > 0 ? Math.round((groupDone / group.routines.length) * 100) : 0;
                  const barColor = groupPct === 100 ? GREEN : accent;
                  const sorted = [...group.routines].sort((a, b) => {
                    const aDone = a.completedDates.includes(today);
                    const bDone = b.completedDates.includes(today);
                    return aDone === bDone ? 0 : aDone ? -1 : 1;
                  });
                  return (
                    <React.Fragment key={group.setName ?? '__none__'}>
                      {idx > 0 && <View style={s.setDivider} />}
                      <View style={[s.setGroup, idx % 2 !== 0 && s.setGroupAlt]}>
                        {group.setName && (
                          <View style={s.setGroupHeader}>
                            <Ionicons name="layers-outline" size={12} color={TEXT2} />
                            <Text style={s.setGroupTitle}>{group.setName}</Text>
                          </View>
                        )}
                        <View style={s.storyBar}>
                          {group.routines.map(r => {
                            const done = r.completedDates.includes(today);
                            return (
                              <View key={r.id} style={[s.storySegment, { backgroundColor: done ? barColor : SURFACE }]} />
                            );
                          })}
                        </View>
                        <View style={{ gap: 7 }}>
                          {sorted.map(r => {
                            const done = r.completedDates.includes(today);
                            const isExpanded = expandedRoutineId === r.id;
                            const hasProof = r.proofPhotos?.some(p => p.date === today) ?? false;
                            return (
                              <Animated.View layout={LinearTransition} key={r.id} style={s.routineRow}>
                                <TouchableOpacity
                                  style={[s.checkBtn, done ? s.checkBtnDone : s.checkBtnPending]}
                                  onPress={() => handleToggleDone(r.id, today, done)}
                                  activeOpacity={0.8}
                                >
                                  {done
                                    ? <Ionicons name="checkmark" size={14} color="#fff" />
                                    : <Ionicons name="hourglass-outline" size={11} color="#fff" />}
                                </TouchableOpacity>
                                <View
                                  ref={el => { routineRefs.current[r.id] = el; }}
                                  style={[s.routineCard, done && s.routineCardDone]}
                                >
                                  <View style={s.routineCardRow}>
                                    <TouchableOpacity
                                      style={s.routineCardMain}
                                      onLongPress={() => handleLongPress(r.id)}
                                      delayLongPress={200}
                                      activeOpacity={0.7}
                                    >
                                      <View style={{ flex: 1 }}>
                                        <Text style={[s.rowName, done && { color: '#fff' }]}>{r.name}</Text>
                                        <Text style={[s.rowMeta, done && { color: 'rgba(255,255,255,0.75)' }]}>{FREQ_LABEL[r.frequency]} · {r.notificationTime}</Text>
                                      </View>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={[s.routineCardCamera, done && s.routineCardCameraDone]}
                                      onPress={() => handleCameraPress(r.id)}
                                      activeOpacity={0.7}
                                    >
                                      {hasProof ? (
                                        <Image
                                          source={{ uri: r.proofPhotos!.find(p => p.date === today)!.uri }}
                                          style={{ width: 28, height: 28, borderRadius: 8 }}
                                          resizeMode="cover"
                                        />
                                      ) : (
                                        <Ionicons name="camera-outline" size={13} color={done ? 'rgba(255,255,255,0.7)' : TEXT2} />
                                      )}
                                    </TouchableOpacity>
                                    {r.description ? (
                                      <TouchableOpacity
                                        style={s.routineCardChevron}
                                        onPress={() => toggleExpand(r.id)}
                                        activeOpacity={0.6}
                                      >
                                        <Ionicons
                                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                          size={16}
                                          color={done ? 'rgba(255,255,255,0.7)' : TEXT3}
                                        />
                                      </TouchableOpacity>
                                    ) : null}
                                  </View>
                                  {isExpanded && r.description ? (
                                    <Animated.View entering={FadeIn} exiting={FadeOut} style={s.routineCardDesc}>
                                      <Text style={{ fontSize: 13, color: done ? 'rgba(255,255,255,0.8)' : TEXT2, lineHeight: 18 }}>{r.description}</Text>
                                    </Animated.View>
                                  ) : null}
                                </View>
                              </Animated.View>
                            );
                          })}
                        </View>
                      </View>
                    </React.Fragment>
                  );
                })}
              </View>
            )}
          </>
        ) : (
          <>
            {/* Month nav */}
            <View style={s.calHeader}>
              <TouchableOpacity style={s.calArrow} onPress={() => setCalMonth(new Date(year, month-1, 1))}>
                <Ionicons name="chevron-back" size={20} color={TEXT} />
              </TouchableOpacity>
              <Text style={s.calTitle}>{MONTHS[month]} {year}</Text>
              <TouchableOpacity style={s.calArrow} onPress={() => setCalMonth(new Date(year, month+1, 1))}>
                <Ionicons name="chevron-forward" size={20} color={TEXT} />
              </TouchableOpacity>
            </View>

            {/* Day labels */}
            <View style={s.calDayRow}>
              {DAY_LABELS.map(d => <Text key={d} style={s.calDayLabel}>{d}</Text>)}
            </View>

            {/* Grid */}
            <View style={s.calGrid}>
              {Array.from({length: cells.length/7}, (_,row) => (
                <View key={row} style={s.calRow}>
                  {cells.slice(row*7, row*7+7).map((day, col) => {
                    if (!day) return <View key={col} style={s.calCell} />;
                    const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                    const pastDay = ds < today;
                    const todayCell = ds === today;
                    const rate = getRate(ds);
                    return (
                      <TouchableOpacity key={col} style={[s.calCell, todayCell && s.calCellToday]} onPress={() => openDay(day)} activeOpacity={0.7}>
                        <Text style={[s.calNum, pastDay && s.calNumPast, todayCell && s.calNumToday]}>{day}</Text>
                        {rate === -1 ? (
                          <View style={[s.calDot, {backgroundColor:'#34495e'}]}>
                            <Text style={s.calDotTxt}>🌙</Text>
                          </View>
                        ) : rate !== null ? (
                          <View style={[s.calDot, {backgroundColor: dotColor(rate)}]}>
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
                {color:GREEN,label:'Tam'},
                {color:accent,label:'50%+'},
                {color:GOLD,label:'Kısmen'},
                {color:RED+'55',label:'Yapılmadı'},
                {color:'#34495e',label:'Dinlenme'},
              ].map(i=>(
                <View key={i.label} style={s.legendItem}>
                  <View style={[s.legendDot, {backgroundColor:i.color}]} />
                  <Text style={s.legendTxt}>{i.label}</Text>
                </View>
              ))}
            </View>
          </>
        )}
        <View style={{height:80}} />
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity
        style={[s.fab, { bottom: 16 + insets.bottom }]}
        onPress={() => router.push('/create')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* ── Day Detail Sheet ── */}
      <Modal visible={sheetVisible} transparent animationType="slide" onRequestClose={() => setSheetVisible(false)}>
        <TouchableOpacity style={s.sheetBg} activeOpacity={1} onPress={() => setSheetVisible(false)} />
        <View style={s.sheet}>
          <View style={s.sheetHandle} />
          <View style={s.sheetHead}>
            <View style={{flex:1}}>
              <Text style={s.sheetDate}>
                {selectedDate ? new Date(selectedDate+'T12:00:00').toLocaleDateString('tr-TR',{weekday:'long',day:'numeric',month:'long'}) : ''}
              </Text>
              {isPast && (
                <View style={s.lockRow}>
                  <Ionicons name="lock-closed" size={11} color={RED} />
                  <Text style={s.lockTxt}>Geçmiş gün — değiştirilemez</Text>
                </View>
              )}
            </View>
            {selectedDate && (() => {
              const r = getRate(selectedDate);
              if (r === -1) return <Text style={[s.sheetRate, {color:'#34495e', fontSize:20}]}>🌙 Dinlenme</Text>;
              if (r !== null) return <Text style={[s.sheetRate, {color: r===100 ? GREEN : accent}]}>{r}%</Text>;
              return null;
            })()}
          </View>
          {/* Rest day toggle — only for today */}
          {isToday && (
            <TouchableOpacity
              style={[s.sheetRestBtn, selIsRestDay && s.sheetRestBtnOn]}
              onPress={() => selectedDate && toggleRestDay(selectedDate)}
            >
              <Ionicons name={selIsRestDay ? 'moon' : 'moon-outline'} size={16} color={selIsRestDay ? '#fff' : TEXT2} />
              <Text style={[s.sheetRestTxt, selIsRestDay && {color:'#fff'}]}>
                {selIsRestDay ? 'Dinlenme Günü ✓ — kaldırmak için dokun' : 'Dinlenme Günü Olarak İşaretle'}
              </Text>
            </TouchableOpacity>
          )}

          <ScrollView style={{maxHeight: SH*0.45}}>
            {selRoutines.length === 0
              ? <Text style={s.sheetEmpty}>Bu gün için rutin yok</Text>
              : [...selRoutines]
                  .sort((a, b) => {
                    if (!selectedDate) return 0;
                    const aDone = a.completedDates.includes(selectedDate);
                    const bDone = b.completedDates.includes(selectedDate);
                    return aDone === bDone ? 0 : aDone ? -1 : 1;
                  })
                  .map(r => {
                const done = selectedDate ? r.completedDates.includes(selectedDate) : false;
                const canToggle = isToday;
                const isExpanded = expandedRoutineId === r.id;
                return (
                  <Animated.View layout={LinearTransition} key={r.id} style={{ borderBottomWidth: 0.5, borderBottomColor: BORDER }}>
                    <View style={[s.sheetRow, { borderBottomWidth: 0, paddingVertical: 0 }]}>
                      <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingVertical: 12 }}
                        onPress={() => canToggle && selectedDate && handleToggleDone(r.id, selectedDate, done)}
                        activeOpacity={canToggle ? 0.7 : 1}
                      >
                        <View style={[s.check, {borderColor: done ? GREEN : GOLD, marginRight: 10}, !canToggle && s.checkLocked]}>
                          {done 
                            ? <Ionicons name="checkmark" size={14} color={!canToggle ? TEXT3 : GREEN} />
                            : <Ionicons name="hourglass-outline" size={10} color={!canToggle ? TEXT3 : GOLD} />}
                        </View>
                        <View style={{flex:1}}>
                          <Text style={[s.rowName, done && {color: TEXT2}, !canToggle && {opacity:0.6}]}>{r.name}</Text>
                          <Text style={[s.rowMeta, done && {color: TEXT3}]}>{FREQ_LABEL[r.frequency]} · {r.notificationTime}</Text>
                        </View>
                        {!canToggle && <Ionicons name="lock-closed" size={14} color={TEXT3} style={{ marginRight: r.description ? 10 : 0 }} />}
                      </TouchableOpacity>
                      
                      {r.description ? (
                        <TouchableOpacity 
                          style={{ paddingVertical: 12, paddingLeft: 12, paddingRight: 4 }} 
                          onPress={() => toggleExpand(r.id)}
                          activeOpacity={0.6}
                        >
                          <Ionicons 
                            name={isExpanded ? "chevron-up" : "chevron-down"} 
                            size={18} 
                            color={TEXT3} 
                          />
                        </TouchableOpacity>
                      ) : null}
                    </View>

                    {isExpanded && r.description ? (
                      <Animated.View entering={FadeIn} exiting={FadeOut} style={{ paddingLeft: 30, paddingRight: 16, paddingBottom: 14, marginTop: -4 }}>
                        <Text style={{ fontSize: 13, color: TEXT2, lineHeight: 18, opacity: canToggle ? 1 : 0.6 }}>{r.description}</Text>
                      </Animated.View>
                    ) : null}
                  </Animated.View>
                );
              })
            }
            <View style={{height:24}} />
          </ScrollView>
        </View>
      </Modal>

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
            if (left + MENU_W > Dimensions.get('window').width - 16) left = Dimensions.get('window').width - 16 - MENU_W;

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

                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 0.5, borderBottomColor: '#E8E8E8' }} onPress={() => { 
                  const r = user.routines.find(rt => rt.id === popover.id);
                  if (r) {
                    setEditName(r.name);
                    setEditDesc(r.description || '');
                    const [h, m] = r.notificationTime.split(':');
                    setEditHour(h);
                    setEditMin(m);
                    setQuickEditRoutineId(r.id);
                  }
                  setPopover(null); 
                }}>
                  <Ionicons name="pencil" size={18} color={TEXT} style={{ marginRight: 10 }} />
                  <Text style={{ fontSize: 15, color: TEXT, fontWeight: '600' }}>Düzenle</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 14 }} onPress={() => { deleteRoutine(popover.id); setPopover(null); }}>
                  <Ionicons name="trash" size={18} color={RED} style={{ marginRight: 10 }} />
                  <Text style={{ fontSize: 15, color: RED, fontWeight: '600' }}>Rutini Sil</Text>
                </TouchableOpacity>
              </View>
            );
          })()}
        </Modal>
      )}

      {/* Quick Edit Modal */}
      {quickEditRoutineId && (
        <Modal transparent visible={true} animationType="slide" onRequestClose={() => setQuickEditRoutineId(null)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setQuickEditRoutineId(null)} activeOpacity={1} />
            <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10 }}>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: TEXT }}>Rutini Düzenle</Text>
                <TouchableOpacity onPress={() => setQuickEditRoutineId(null)}>
                  <Ionicons name="close-circle" size={24} color={TEXT3} />
                </TouchableOpacity>
              </View>

              <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: BORDER }}>
                  <TextInput 
                    style={{ flex: 1, fontSize: 22, fontWeight: '600', color: TEXT, paddingVertical: 12 }}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Başlık (örn: Sabah Koşusu)"
                    placeholderTextColor={TEXT3}
                  />
                  {editName.length > 0 && (
                    <TouchableOpacity onPress={() => setEditName('')}>
                      <Ionicons name="close-circle" size={18} color={TEXT3} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: BORDER }}>
                  <TextInput 
                    style={{ flex: 1, fontSize: 16, fontWeight: '400', color: TEXT, paddingVertical: 12, minHeight: 60, textAlignVertical: 'top' }}
                    value={editDesc}
                    onChangeText={setEditDesc}
                    placeholder="Açıklama (opsiyonel)"
                    placeholderTextColor={TEXT3}
                    multiline
                  />
                  {editDesc.length > 0 && (
                    <TouchableOpacity onPress={() => setEditDesc('')} style={{ marginTop: 14 }}>
                      <Ionicons name="close-circle" size={18} color={TEXT3} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={{ marginBottom: 32, marginHorizontal: -16 }}>
                <TimeField 
                  label=""
                  hour={editHour}
                  min={editMin}
                  onTimeChange={(h: string, m: string) => {
                    setEditHour(h);
                    setEditMin(m);
                  }}
                />
              </View>

              <TouchableOpacity 
                style={{ backgroundColor: RED, borderRadius: 8, paddingVertical: 14, alignItems: 'center' }}
                activeOpacity={0.8}
                onPress={() => {
                  let h = parseInt(editHour || '0');
                  let m = parseInt(editMin || '0');
                  if (h > 23) h = 23;
                  if (m > 59) m = 59;
                  const formattedTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

                  updateRoutine(quickEditRoutineId, {
                    name: editName.trim() || 'İsimsiz Rutin',
                    description: editDesc.trim() || undefined,
                    notificationTime: formattedTime
                  });
                  setQuickEditRoutineId(null);
                }}
              >
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Güncelle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

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
                onPress={() => {
                  addRoutineProof(proofPhoto.routineId, today, proofPhoto.uri);
                  setProofPhoto(null);
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
  fab: {position:'absolute', right:20, width:56, height:56, borderRadius:28, backgroundColor:RED, alignItems:'center', justifyContent:'center', shadowColor:'#000', shadowOffset:{width:0,height:4}, shadowOpacity:0.2, shadowRadius:8, elevation:6},
  header: {flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingTop:12, paddingBottom:8},
  sub: {fontSize:12, color:TEXT2, marginBottom:3},
  title: {fontSize:24, color:TEXT, fontWeight:'900', letterSpacing:-0.5},
  headerRight: {flexDirection:'row', alignItems:'center', gap:10},
  toggle: {flexDirection:'row', backgroundColor:SURFACE, borderRadius:10, padding:2},
  toggleBtn: {padding:8, borderRadius:8},
  toggleBtnOn: {backgroundColor:TEXT},
  settBtn: {width:40, height:40, borderRadius:20, backgroundColor:SURFACE, alignItems:'center', justifyContent:'center'},
  settBtnRest: {backgroundColor:'#34495e'},

  // Story Progress Bar
  storyBar: {flexDirection:'row', gap:4, marginBottom:8},
  storySegment: {flex:1, height:3, borderRadius:2},

  // List
  list: {},
  setDivider: {height:0.5, backgroundColor:BORDER, marginVertical:2},
  setGroup: {paddingHorizontal:16, paddingTop:10, paddingBottom:6, backgroundColor:RED+'10'},
  setGroupAlt: {backgroundColor:RED+'1C'},
  setGroupHeader: {flexDirection:'row', alignItems:'center', gap:5, alignSelf:'flex-start', backgroundColor:SURFACE, borderRadius:8, paddingHorizontal:8, paddingVertical:4, marginBottom:7},
  setGroupTitle: {fontSize:12, fontWeight:'700', color:TEXT, letterSpacing:0.2},
  row: {flexDirection:'row', alignItems:'center', gap:10, paddingVertical:12, borderBottomWidth:0.5, borderBottomColor:BORDER},
  check: {width:18, height:18, borderRadius:9, borderWidth:1.5, alignItems:'center', justifyContent:'center', backgroundColor:'transparent'},
  rowName: {fontSize:13, color:TEXT, fontWeight:'600', letterSpacing:-0.2},
  rowMeta: {fontSize:11, color:TEXT3, marginTop:1},

  // Routine Cards
  routineRow: {flexDirection:'row', alignItems:'center', gap:8},
  checkBtn: {width:34, height:34, borderRadius:17, alignItems:'center', justifyContent:'center'},
  checkBtnDone: {backgroundColor:RED},
  checkBtnPending: {backgroundColor:GOLD},
  routineCard: {flex:1, backgroundColor:CARD, borderRadius:12, overflow:'hidden'},
  routineCardDone: {backgroundColor:RED},
  routineCardRow: {flexDirection:'row', alignItems:'center'},
  routineStripe: {width:4, alignSelf:'stretch'},
  routineCardMain: {flex:1, paddingVertical:11, paddingLeft:14, paddingRight:8},
  routineCardCamera: {marginRight:10, width:28, height:28, borderRadius:8, backgroundColor:SURFACE, alignItems:'center', justifyContent:'center'},
  routineCardCameraDone: {backgroundColor:'rgba(255,255,255,0.25)'},
  routineCardChevron: {paddingVertical:11, paddingLeft:4, paddingRight:12},
  routineCardDesc: {paddingHorizontal:14, paddingBottom:10, paddingTop:1},

  // Empty
  empty: {alignItems:'center', paddingTop:60, gap:12},
  emptyTitle: {fontSize:18, color:TEXT2, fontWeight:'800'},
  emptySub: {fontSize:14, color:TEXT3},

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
  sheetBg: {flex:1, backgroundColor:'rgba(0,0,0,0.25)'},
  sheet: {backgroundColor:BG, borderTopLeftRadius:24, borderTopRightRadius:24, paddingHorizontal:16, paddingTop:8, paddingBottom:34},
  sheetHandle: {width:36, height:4, backgroundColor:SURFACE, borderRadius:2, alignSelf:'center', marginBottom:14},
  sheetHead: {flexDirection:'row', alignItems:'flex-start', marginBottom:14},
  sheetDate: {fontSize:17, color:TEXT, fontWeight:'900', marginBottom:5},
  lockRow: {flexDirection:'row', alignItems:'center', gap:5},
  lockTxt: {fontSize:12, color:RED},
  sheetRate: {fontSize:28, fontWeight:'900'},
  sheetEmpty: {textAlign:'center', color:TEXT3, paddingVertical:24},
  sheetRow: {flexDirection:'row', alignItems:'center', gap:10, paddingVertical:12, borderBottomWidth:0.5, borderBottomColor:BORDER},
  checkLocked: {borderColor:SURFACE, backgroundColor:SURFACE},


  // Sheet rest day toggle
  sheetRestBtn: {flexDirection:'row', alignItems:'center', gap:10, backgroundColor:CARD, borderRadius:12, padding:12, marginBottom:12, borderWidth:1, borderColor:BORDER},
  sheetRestBtnOn: {backgroundColor:'#34495e', borderColor:'#2c3e50'},
  sheetRestTxt: {fontSize:13, color:TEXT2, fontWeight:'700', flex:1},
});
