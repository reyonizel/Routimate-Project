import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, Platform, Animated, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useStore, Routine } from '../../store/useStore';

const BG='#FFFFFF'; const CARD='#F4F4F4'; const SURFACE='#EEEEEE';
const TEXT='#111111'; const TEXT2='#767676'; const TEXT3='#ABABAB';
const RED='#E60023'; const BORDER='#E8E8E8'; const PILL=999;

type Freq = 'daily'|'weekly'|'monthly';

const WEEK_DAYS = [
  {label:'Pzt', short:'P', js:1},{label:'Sal', short:'S', js:2},
  {label:'Çar', short:'Ç', js:3},{label:'Per', short:'P', js:4},
  {label:'Cum', short:'C', js:5},{label:'Cmt', short:'C', js:6},
  {label:'Paz', short:'P', js:0},
];

// ─── Weekly schedule: each day has its own task list ────────────────
type WeekDayTask = { title: string; desc: string; hour: string; min: string };

export default function CreateScreen() {
  const addRoutine  = useStore(s => s.addRoutine);
  const addRoutines = useStore(s => s.addRoutines);
  const router = useRouter();

  const [freq, setFreq] = useState<Freq>('daily');
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  const handleTabPress = (val: Freq, idx: number) => {
    setFreq(val);
    Animated.spring(slideAnim, {
      toValue: idx,
      useNativeDriver: true,
      bounciness: 0,
      speed: 16
    }).start();
  };

  const TAB_DATA: [Freq, string][] = [['daily','Günlük'],['weekly','Haftalık'],['monthly','Aylık']];
  const tabWidth = (Dimensions.get('window').width - 32) / 3;

  const TR_MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  const currentMonthStr = TR_MONTHS[new Date().getMonth()];

  // ── DAILY ──────────────────────────────────────────────────────────
  const [dailyName, setDailyName] = useState('');
  const [dailyDesc, setDailyDesc] = useState('');
  const [dailyHour, setDailyHour] = useState('09');
  const [dailyMin,  setDailyMin]  = useState('00');
  const [showDailyH, setShowDailyH] = useState(false);
  const [showDailyM, setShowDailyM] = useState(false);

  // ── WEEKLY ─────────────────────────────────────────────────────────
  const [weekTasks, setWeekTasks] = useState<{ [day: number]: WeekDayTask }>({});
  const [activeDay, setActiveDay] = useState<number>(1);
  const updateWeekTask = (day: number, key: keyof WeekDayTask, val: string) => {
    setWeekTasks(prev => {
      const existing = prev[day] || { title: '', desc: '', hour: '09', min: '00' };
      return { ...prev, [day]: { ...existing, [key]: val } };
    });
  };

  // ── MONTHLY ────────────────────────────────────────────────────────
  const [monthTasks, setMonthTasks] = useState<{ [day: number]: WeekDayTask }>({});
  const today = new Date();
  const [activeMonthDay, setActiveMonthDay] = useState<number>(today.getDate());
  const [displayedMonth, setDisplayedMonth] = useState(new Date());
  const updateMonthTask = (day: number, key: keyof WeekDayTask, val: string) => {
    setMonthTasks(prev => {
      const existing = prev[day] || { title: '', desc: '', hour: '09', min: '00' };
      return { ...prev, [day]: { ...existing, [key]: val } };
    });
  };

  // ── REST DAYS ──────────────────────────────────────────────────────
  const [restDays, setRestDays] = useState<number[]>([]); // day of week indices
  const toggleRestWeekday = (js: number) =>
    setRestDays(prev => prev.includes(js) ? prev.filter(d => d !== js) : [...prev, js]);

  // ── HELPERS ────────────────────────────────────────────────────────
  const HOURS = Array.from({length:24}, (_,i) => String(i).padStart(2,'0'));
  const MINS  = ['00','15','30','45'];

  // Helpers...

  // ── SAVE ───────────────────────────────────────────────────────────
  const handleSave = () => {

    if (freq === 'daily') {
      if (!dailyName.trim()) return;
      addRoutine({
        id: Date.now().toString(), name: dailyName.trim(),
        description: dailyDesc.trim() || undefined,
        frequency: 'daily', notificationTime: `${dailyHour}:${dailyMin}`,
        completedDates: [], createdAt: new Date().toISOString(),
      });
      setDailyName('');
      setDailyDesc('');
      Alert.alert('Kaydedildi ✓', `"${dailyName.trim()}" eklendi.`);

    } else if (freq === 'weekly') {
      const days = Object.keys(weekTasks).map(Number).filter(d => (weekTasks[d]?.title || '').trim().length > 0);
      if (days.length === 0) { Alert.alert('Uyarı', 'En az bir güne görev ekleyin.'); return; }
      const now = Date.now();
      const routines: Routine[] = [];
      days.forEach((jsDay, di) => {
        const task = weekTasks[jsDay];
        routines.push({
          id: `${now}-${di}`, name: task.title.trim(),
          description: task.desc.trim() || undefined,
          frequency: 'weekly', notificationTime: `${task.hour}:${task.min}`,
          targetDays: [jsDay],
          completedDates: [], createdAt: new Date().toISOString(),
        });
      });
      addRoutines(routines);
      setWeekTasks({});
      Alert.alert('Kaydedildi ✓', `${routines.length} haftalık rutin eklendi.`);

    } else {
      const days = Object.keys(monthTasks).map(Number).filter(d => (monthTasks[d]?.title || '').trim().length > 0);
      if (days.length === 0) { Alert.alert('Uyarı', 'En az bir güne görev ekleyin.'); return; }
      const now = Date.now();
      const routines: Routine[] = [];
      days.forEach((mDay, di) => {
        const task = monthTasks[mDay];
        routines.push({
          id: `${now}-${di}`, name: task.title.trim(),
          description: task.desc.trim() || undefined,
          frequency: 'monthly', notificationTime: `${task.hour}:${task.min}`,
          monthlyDays: [mDay],
          completedDates: [], createdAt: new Date().toISOString(),
        });
      });
      addRoutines(routines);
      setMonthTasks({});
      Alert.alert('Kaydedildi ✓', `${routines.length} aylık rutin eklendi.`);
    }
  };

  const canSave =
    freq === 'daily' ? dailyName.trim().length > 0
    : freq === 'weekly' ? Object.values(weekTasks).some(t => t.title.trim().length > 0)
    : Object.values(monthTasks).some(t => t.title.trim().length > 0);

  // ── RENDER ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Yeni alışkanlık başlat</Text>
        </View>

        {/* Freq selector */}
        <View style={[s.field, { marginBottom: 16 }]}>
          <View style={s.tabs}>
            <Animated.View style={[s.tabIndicator, {
              width: tabWidth,
              transform: [{
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1, 2],
                  outputRange: [0, tabWidth, tabWidth * 2]
                })
              }]
            }]} />
            {TAB_DATA.map(([val,lbl], idx) => {
              const on = freq === val;
              return (
                <TouchableOpacity key={val} style={s.tab} onPress={() => handleTabPress(val, idx)}>
                  <Text style={[s.tabText, on && s.tabTextActive]}>{lbl}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ─── DAILY ──────────────────────────────────────── */}
        {freq === 'daily' && (
          <>
            <View style={s.field}>
              <View style={s.inputRow}>
                <TextInput style={s.input} value={dailyName} onChangeText={t=>setDailyName(t.slice(0,60))}
                  placeholder="Başlık (örn: Sabah Koşusu)" placeholderTextColor={TEXT3} maxLength={60} />
                {dailyName.length > 0 && (
                  <TouchableOpacity onPress={() => setDailyName('')}>
                    <Ionicons name="close-circle" size={18} color={TEXT3} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={s.field}>
              <View style={[s.inputRow, { alignItems: 'flex-start' }]}>
                <TextInput style={[s.input, { fontSize: 16, fontWeight: '400', minHeight: 60, textAlignVertical: 'top' }]} 
                  value={dailyDesc} onChangeText={t=>setDailyDesc(t.slice(0,200))}
                  placeholder="Açıklama (opsiyonel)" placeholderTextColor={TEXT3} multiline maxLength={200} />
                {dailyDesc.length > 0 && (
                  <TouchableOpacity onPress={() => setDailyDesc('')} style={{ marginTop: 2 }}>
                    <Ionicons name="close-circle" size={18} color={TEXT3} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <TimeField label="" hour={dailyHour} min={dailyMin}
              onTimeChange={(h: string, m: string) => { setDailyHour(h); setDailyMin(m); }} />
          </>
        )}

        {/* ─── WEEKLY ─────────────────────────────────────── */}
        {freq === 'weekly' && (
          <>
            <View style={s.field}>
              <View style={s.dayRowFlex}>
                {WEEK_DAYS.map(({label, js}) => {
                  const isActive = activeDay === js;
                  const hasTask = (weekTasks[js]?.title || '').trim().length > 0;
                  return (
                    <TouchableOpacity key={js} style={[s.restChip, isActive && s.restChipOn]} onPress={() => setActiveDay(js)}>
                      <Text style={[s.restLabel, isActive && {color:'#fff'}]}>{label}</Text>
                      {hasTask && !isActive && <View style={s.weekDayDotMini} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={s.field}>
              <View style={s.inputRow}>
                <TextInput style={s.input} 
                  value={weekTasks[activeDay]?.title || ''} 
                  onChangeText={t => updateWeekTask(activeDay, 'title', t.slice(0,60))}
                  placeholder={`${WEEK_DAYS.find(d=>d.js===activeDay)?.label} günü için başlık`} 
                  placeholderTextColor={TEXT3} maxLength={60} />
              </View>
            </View>

            <View style={s.field}>
              <View style={[s.inputRow, { alignItems: 'flex-start' }]}>
                <TextInput style={[s.input, { fontSize: 16, fontWeight: '400', minHeight: 60, textAlignVertical: 'top' }]} 
                  value={weekTasks[activeDay]?.desc || ''} 
                  onChangeText={t => updateWeekTask(activeDay, 'desc', t.slice(0,200))}
                  placeholder="Açıklama (opsiyonel)" placeholderTextColor={TEXT3} multiline maxLength={200} />
              </View>
            </View>

            <TimeField label="" 
              hour={weekTasks[activeDay]?.hour || '09'} 
              min={weekTasks[activeDay]?.min || '00'}
              onTimeChange={(h: string, m: string) => { 
                updateWeekTask(activeDay, 'hour', h); 
                updateWeekTask(activeDay, 'min', m); 
              }} />
          </>
        )}

        {/* ─── MONTHLY ────────────────────────────────────── */}
        {freq === 'monthly' && (
          <>
            <View style={[s.field, { marginBottom: 8 }]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4, gap: 8, flexDirection: 'row', alignItems: 'center' }}>
                {(() => {
                  const y = displayedMonth.getFullYear();
                  const m = displayedMonth.getMonth();
                  const daysInMonth = new Date(y, m + 1, 0).getDate();
                  const monthAbbr = TR_MONTHS[m];
                  const nextMonthAbbr = TR_MONTHS[(m + 1) % 12];
                  const prevMonthAbbr = TR_MONTHS[(m - 1 + 12) % 12];

                  // Is this the current month? If so, days before today are past.
                  const isCurrentMonth = y === today.getFullYear() && m === today.getMonth();
                  const startDay = isCurrentMonth ? today.getDate() : 1;

                  const chips = [];

                  // Prev month nav chip — only if we're in a future month
                  if (!isCurrentMonth) {
                    chips.push(
                      <TouchableOpacity
                        key="prev-month"
                        style={s.mChipNav}
                        onPress={() => {
                          const prevDate = new Date(y, m - 1, 1);
                          setDisplayedMonth(prevDate);
                          // If going back to current month, select today; else select day 1
                          const prevIsCurrentMonth = prevDate.getFullYear() === today.getFullYear() && prevDate.getMonth() === today.getMonth();
                          setActiveMonthDay(prevIsCurrentMonth ? today.getDate() : 1);
                        }}
                      >
                        <Ionicons name="chevron-back" size={14} color={RED} />
                        <Text style={s.mChipNavTxt}>{prevMonthAbbr}</Text>
                      </TouchableOpacity>
                    );
                  }

                  for (let d = startDay; d <= daysInMonth; d++) {
                    const isActive = activeMonthDay === d;
                    const hasTask = (monthTasks[d]?.title || '').trim().length > 0;
                    chips.push(
                      <TouchableOpacity 
                        key={`${m}-${d}`}
                        style={[s.mChip, isActive && s.mChipActive]}
                        onPress={() => setActiveMonthDay(d)}
                      >
                        <Text style={[s.mChipDay, isActive && { color: '#fff' }]}>{d}</Text>
                        <Text style={[s.mChipMonth, isActive && { color: 'rgba(255,255,255,0.75)' }]}>{monthAbbr}</Text>
                        {hasTask && !isActive && <View style={s.mChipDot} />}
                      </TouchableOpacity>
                    );
                  }

                  // Next month nav chip
                  chips.push(
                    <TouchableOpacity
                      key="next-month"
                      style={s.mChipNav}
                      onPress={() => {
                        setDisplayedMonth(new Date(y, m + 1, 1));
                        setActiveMonthDay(1);
                      }}
                    >
                      <Text style={s.mChipNavTxt}>{nextMonthAbbr}</Text>
                      <Ionicons name="chevron-forward" size={14} color={RED} />
                    </TouchableOpacity>
                  );

                  return chips;
                })()}
              </ScrollView>
            </View>

            <View style={s.field}>
              <View style={s.inputRow}>
                <TextInput style={s.input} 
                  value={monthTasks[activeMonthDay]?.title || ''} 
                  onChangeText={t => updateMonthTask(activeMonthDay, 'title', t.slice(0,60))}
                  placeholder={`${activeMonthDay} ${TR_MONTHS[displayedMonth.getMonth()]} için başlık`} 
                  placeholderTextColor={TEXT3} maxLength={60} />
              </View>
            </View>

            <View style={s.field}>
              <View style={[s.inputRow, { alignItems: 'flex-start' }]}>
                <TextInput style={[s.input, { fontSize: 16, fontWeight: '400', minHeight: 60, textAlignVertical: 'top' }]} 
                  value={monthTasks[activeMonthDay]?.desc || ''} 
                  onChangeText={t => updateMonthTask(activeMonthDay, 'desc', t.slice(0,200))}
                  placeholder="Açıklama (opsiyonel)" placeholderTextColor={TEXT3} multiline maxLength={200} />
              </View>
            </View>

            <TimeField label="" 
              hour={monthTasks[activeMonthDay]?.hour || '09'} 
              min={monthTasks[activeMonthDay]?.min || '00'}
              onTimeChange={(h: string, m: string) => { 
                updateMonthTask(activeMonthDay, 'hour', h); 
                updateMonthTask(activeMonthDay, 'min', m); 
              }} />
          </>
        )}

        {/* Save */}
        <TouchableOpacity style={[s.saveBtn, !canSave && s.saveBtnOff]} onPress={handleSave} disabled={!canSave}>
          <Text style={[s.saveTxt, !canSave && {color:TEXT3}]}>
            {freq === 'monthly' ? `Kaydet (${Object.values(monthTasks).filter(t => t.title.trim().length > 0).length} gün)` :
             freq === 'weekly' ? `Kaydet (${Object.values(weekTasks).filter(t => t.title.trim().length > 0).length} gün)` : 'Kaydet'}
          </Text>
        </TouchableOpacity>

        <View style={{height:80}} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

export function TimeField({label, hour, min, onTimeChange, weekMode, weekHour, weekMin, onWeekTimeChange}: any) {
  const [show, setShow] = useState(false);

  const h = weekMode ? weekHour : hour;
  const m = weekMode ? weekMin : min;

  const date = new Date();
  date.setHours(parseInt(h || '0', 10));
  date.setMinutes(parseInt(m || '0', 10));

  const onChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }
    if (event.type === 'set' || Platform.OS === 'ios') {
      if (selectedDate) {
        const newH = String(selectedDate.getHours()).padStart(2, '0');
        const newM = String(selectedDate.getMinutes()).padStart(2, '0');
        if (weekMode) {
          onWeekTimeChange(newH, newM);
        } else {
          onTimeChange(newH, newM);
        }
      }
    } else {
      setShow(false);
    }
  };

  return (
    <View style={s.field}>
      {!!label && <Text style={s.label}>{label}</Text>}
      {Platform.OS === 'ios' ? (
        <View style={{ overflow: 'hidden' }}>
          <DateTimePicker
            value={date}
            mode="time"
            display="spinner"
            is24Hour={true}
            onChange={onChange}
            style={{ width: '100%', height: 120 }}
          />
        </View>
      ) : (
        <>
          <TouchableOpacity style={s.timePadAndroid} onPress={() => setShow(true)}>
            <Ionicons name="time-outline" size={22} color={TEXT2} style={{marginRight: 8}} />
            <Text style={s.timeNumAndroid}>{h}:{m}</Text>
          </TouchableOpacity>
          
          {show && (
            <DateTimePicker
              value={date}
              mode="time"
              display="spinner"
              is24Hour={true}
              onChange={onChange}
            />
          )}
        </>
      )}
    </View>
  );
}

function RestDayPicker({restDays, onToggle}: {restDays: number[]; onToggle:(js:number)=>void}) {
  const WEEK_DAYS_SHORT = [{label:'Pzt',js:1},{label:'Sal',js:2},{label:'Çar',js:3},{label:'Per',js:4},{label:'Cum',js:5},{label:'Cmt',js:6},{label:'Paz',js:0}];
  return (
    <View style={s.field}>
      <Text style={s.label}>DİNLENME GÜNLERİ (opsiyonel)</Text>
      <Text style={s.calHint}>Seçilen günlerde bu görev sayılmaz.</Text>
      <View style={s.dayRowFlex}>
        {WEEK_DAYS_SHORT.map(({label,js}) => {
          const on = restDays.includes(js);
          return (
            <TouchableOpacity key={js} style={[s.restChip, on && s.restChipOn]} onPress={() => onToggle(js)}>
              <Text style={[s.restLabel, on && {color:'#fff'}]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {restDays.length > 0 && (
        <Text style={s.restSummary}>
          {WEEK_DAYS_SHORT.filter(d => restDays.includes(d.js)).map(d=>d.label).join(', ')} dinlenme günü
        </Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {flex:1, backgroundColor:BG},
  header: {paddingHorizontal:16, paddingTop:16, paddingBottom:20},
  headerSub: {fontSize:13, color:TEXT2, marginBottom:4},
  headerTitle: {fontSize:24, color:TEXT, fontWeight:'900', letterSpacing:-0.5},
  field: {marginHorizontal:16, marginBottom:24},
  label: {fontSize:11, color:TEXT3, fontWeight:'700', letterSpacing:1.5, marginBottom:10},
  calHint: {fontSize:12, color:TEXT3, marginBottom:12},
  inputRow: {flexDirection:'row', alignItems:'center', borderBottomWidth:1, borderBottomColor:BORDER},
  input: {flex:1, fontSize:22, fontWeight:'600', color:TEXT, paddingVertical:12},
  
  // Tabs
  tabs: { flexDirection:'row', borderBottomWidth:0.5, borderBottomColor:BORDER, position:'relative' },
  tabIndicator: { position:'absolute', bottom:-0.5, left:0, height:2, backgroundColor:RED },
  tab: { flex:1, paddingVertical:12, alignItems:'center' },
  tabText: { fontSize:13, color:TEXT2, fontWeight:'600' },
  tabTextActive: { color:TEXT, fontWeight:'800' },

  // Weekly schedule
  weekDayDotMini: {width:6, height:6, borderRadius:3, backgroundColor:RED, position:'absolute', top:4, right:4},

  // Monthly carousel chips
  mChip:       { width: 52, height: 60, borderRadius: 14, backgroundColor: CARD, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  mChipActive: { backgroundColor: RED },
  mChipDay:    { fontSize: 18, fontWeight: '700', color: TEXT },
  mChipMonth:  { fontSize: 11, color: TEXT3, fontWeight: '600', marginTop: 2 },
  mChipDot:    { position: 'absolute', top: 6, right: 6, width: 6, height: 6, borderRadius: 3, backgroundColor: RED },
  mChipNav:    { height: 60, paddingHorizontal: 14, borderRadius: 14, backgroundColor: 'rgba(230,0,35,0.1)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4, borderWidth: 1.5, borderColor: 'rgba(230,0,35,0.25)' },
  mChipNavTxt: { fontSize: 14, fontWeight: '700', color: RED },

  // Time
  timePadAndroid: {flexDirection:'row', alignItems:'center', paddingVertical:10, borderBottomWidth:1, borderBottomColor:BORDER},
  timeNumAndroid: {fontSize:22, color:TEXT, fontWeight:'600', letterSpacing:1},

  // Rest days
  dayRowFlex: {flexDirection:'row', justifyContent:'space-between', gap:4},
  restChip: {flex:1, aspectRatio:1, borderRadius:99, backgroundColor:CARD, alignItems:'center', justifyContent:'center'},
  restChipOn: {backgroundColor:TEXT},
  restLabel: {fontSize:13, color:TEXT, fontWeight:'700'},
  restSummary: {fontSize:12, color:TEXT2, marginTop:10},

  // Save
  saveBtn: {marginHorizontal:16, backgroundColor:RED, borderRadius:8, paddingVertical:14, alignItems:'center'},
  saveBtnOff: {backgroundColor:SURFACE},
  saveTxt: {fontSize:16, color:'#fff', fontWeight:'bold'},
});
