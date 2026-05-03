import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../../store/useStore';

const { height: SH } = Dimensions.get('window');
const today = new Date().toISOString().split('T')[0];

const BG='#FFFFFF'; const CARD='#F4F4F4'; const SURFACE='#EEEEEE';
const TEXT='#111111'; const TEXT2='#767676'; const TEXT3='#ABABAB';
const RED='#E60023'; const GREEN='#008800'; const GOLD='#D4860A';
const BORDER='#E8E8E8'; const PILL=999;

const FREQ_COLOR: Record<string,string> = { daily:'#2980b9', weekly:'#8e44ad', monthly:'#d35400' };
const FREQ_LABEL: Record<string,string> = { daily:'Günlük', weekly:'Haftalık', monthly:'Aylık' };
const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const DAY_LABELS = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];

export default function HomeScreen() {
  const user = useStore(s => s.user);
  const toggleRoutineComplete = useStore(s => s.toggleRoutineComplete);
  const toggleRestDay = useStore(s => s.toggleRestDay);
  const router = useRouter();
  const accent = user.gender === 'female' ? '#e91e63' : '#3498db';
  const isRestDay = user.restDays.includes(today);

  const [view, setView] = useState<'list'|'calendar'>('list');
  const [calMonth, setCalMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string|null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  // Get routines applicable on a date
  const getApplicable = useCallback((dateStr: string) => {
    const dow = new Date(dateStr + 'T12:00:00').getDay();
    const dayOfMonth = new Date(dateStr + 'T12:00:00').getDate();
    return user.routines.filter(r => {
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
  }, [user.routines]);

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
          <TouchableOpacity style={s.settBtn} onPress={() => router.push('/modal')}>
            <Ionicons name="settings-outline" size={20} color={TEXT2} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {view === 'list' ? (
          <>
            {/* Top Cards Row */}
            <View style={s.topCardsRow}>
              {/* Progress OR Native Ad */}
              {isRestDay ? (
                <View style={[s.topCard, { padding: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' }]}>
                  <View style={{ position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, zIndex: 10 }}>
                    <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>AD</Text>
                  </View>
                  <Ionicons name="play-circle" size={36} color="rgba(255,255,255,0.9)" />
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 6, fontWeight: '600' }}>Sponsorlu Video</Text>
                </View>
              ) : (
                <View style={s.topCard}>
                  <Text style={s.topCardLabel}>İlerleme</Text>
                  <Text style={[s.topCardVal, {color: todayPct===100 ? GREEN : accent}]}>{doneToday}<Text style={s.topCardDenom}>/{todayRoutines.length}</Text></Text>
                  <View style={s.track}>
                    <View style={[s.fill, {width: `${todayPct}%` as any, backgroundColor: todayPct===100 ? GREEN : accent}]} />
                  </View>
                </View>
              )}

              {/* Rest Day */}
              <TouchableOpacity
                style={[s.topCard, isRestDay && s.topCardRestOn]}
                onPress={() => toggleRestDay(today)}
                activeOpacity={0.8}
              >
                <Text style={[s.topCardLabel, isRestDay && {color:'rgba(255,255,255,0.8)'}]}>Dinlenme</Text>
                <Text style={[s.topCardVal, isRestDay ? {color: '#fff'} : {color: TEXT}]}>{isRestDay ? 'Aktif' : 'Pasif'}</Text>
                <Ionicons name={isRestDay ? 'moon' : 'moon-outline'} size={16} color={isRestDay ? '#fff' : TEXT3} style={s.topCardIcon} />
              </TouchableOpacity>
            </View>

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
                {[...todayRoutines]
                  .sort((a, b) => {
                    const aDone = a.completedDates.includes(today);
                    const bDone = b.completedDates.includes(today);
                    return aDone === bDone ? 0 : aDone ? -1 : 1;
                  })
                  .map(r => {
                  const done = r.completedDates.includes(today);
                  return (
                    <TouchableOpacity key={r.id} style={s.row} onPress={() => toggleRoutineComplete(r.id, today)} activeOpacity={0.7}>
                      <View style={[s.check, {borderColor: done ? GREEN : GOLD}]}>
                        {done 
                          ? <Ionicons name="checkmark" size={14} color={GREEN} />
                          : <Ionicons name="hourglass-outline" size={10} color={GOLD} />}
                      </View>
                      <View style={{flex:1}}>
                        <Text style={[s.rowName, done && {color: TEXT2}]}>{r.name}</Text>
                        <Text style={[s.rowMeta, done && {color: TEXT3}]}>{FREQ_LABEL[r.frequency]} · {r.notificationTime}</Text>
                      </View>
                    </TouchableOpacity>
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
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={s.sheetRow}
                    onPress={() => canToggle && selectedDate && toggleRoutineComplete(r.id, selectedDate)}
                    activeOpacity={canToggle ? 0.7 : 1}
                  >
                    <View style={[s.check, {borderColor: done ? GREEN : GOLD}, !canToggle && s.checkLocked]}>
                      {done 
                        ? <Ionicons name="checkmark" size={14} color={!canToggle ? TEXT3 : GREEN} />
                        : <Ionicons name="hourglass-outline" size={10} color={!canToggle ? TEXT3 : GOLD} />}
                    </View>
                    <View style={{flex:1}}>
                      <Text style={[s.rowName, done && {color: TEXT2}, !canToggle && {opacity:0.6}]}>{r.name}</Text>
                      <Text style={[s.rowMeta, done && {color: TEXT3}]}>{FREQ_LABEL[r.frequency]} · {r.notificationTime}</Text>
                    </View>
                    {!canToggle && <Ionicons name="lock-closed" size={14} color={TEXT3} />}
                  </TouchableOpacity>
                );
              })
            }
            <View style={{height:24}} />
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {flex:1, backgroundColor:BG},
  header: {flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingTop:12, paddingBottom:8},
  sub: {fontSize:12, color:TEXT2, marginBottom:3},
  title: {fontSize:24, color:TEXT, fontWeight:'900', letterSpacing:-0.5},
  headerRight: {flexDirection:'row', alignItems:'center', gap:10},
  toggle: {flexDirection:'row', backgroundColor:SURFACE, borderRadius:10, padding:2},
  toggleBtn: {padding:8, borderRadius:8},
  toggleBtnOn: {backgroundColor:TEXT},
  settBtn: {width:40, height:40, borderRadius:20, backgroundColor:SURFACE, alignItems:'center', justifyContent:'center'},

  // Top Cards
  topCardsRow: {flexDirection:'row', gap:12, paddingHorizontal:16, marginBottom:16, marginTop:8},
  topCard: {flex:1, backgroundColor:BG, borderRadius:16, padding:14, borderWidth:1, borderColor:BORDER, position: 'relative', overflow: 'hidden'},
  topCardRestOn: {backgroundColor:'#34495e', borderColor:'#2c3e50'},
  topCardLabel: {fontSize:12, color:TEXT2, fontWeight:'600', marginBottom:8},
  topCardVal: {fontSize:24, fontWeight:'900', color:TEXT, marginBottom:8, letterSpacing:-0.5},
  topCardDenom: {fontSize:14, color:TEXT3, fontWeight:'700'},
  topCardIcon: {position:'absolute', right:14, top:14},
  track: {height:5, backgroundColor:SURFACE, borderRadius:3, overflow:'hidden'},
  fill: {height:5, borderRadius:3},

  // List
  list: {paddingHorizontal:16, gap:0},
  row: {flexDirection:'row', alignItems:'center', gap:10, paddingVertical:12, borderBottomWidth:0.5, borderBottomColor:BORDER},
  check: {width:20, height:20, borderRadius:10, borderWidth:1, alignItems:'center', justifyContent:'center', backgroundColor:BG},
  rowName: {fontSize:14, color:TEXT, fontWeight:'500'},
  rowMeta: {fontSize:11, color:TEXT3, marginTop:1},

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
