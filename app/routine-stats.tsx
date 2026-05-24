import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useStore } from '../store/useStore';
import type { Routine } from '../store/useStore';
import { getAppDate } from '../lib/date';

const BG = '#EEE3D0'; const CARD = '#FFFFFF'; const SURFACE = '#F5EDE0';
const TEXT = '#0A3B25'; const TEXT2 = '#3D6B58'; const TEXT3 = '#B2B7AA';
const GREEN = '#2A6151'; const BORDER = '#B2B7AA'; const GOLD = '#D8C2A4';
const SCREEN_W = Dimensions.get('window').width;

const CAT_COLORS = ['#E91E63','#9C27B0','#3F51B5','#2196F3','#00ACC1','#00897B','#F4511E','#6D4C41','#546E7A','#558B2F'];
function catColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return CAT_COLORS[Math.abs(h) % CAT_COLORS.length];
}

const FREQ_LABEL: Record<string, string> = { daily: 'Günlük', weekly: 'Haftalık', monthly: 'Aylık' };
const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const DAY_SHORTS = ['Pt','Sa','Ça','Pe','Cu','Ct','Pz'];

const fmt = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

function isApplicable(r: Routine, dateStr: string): boolean {
  if (r.scope === 'once' && r.onceRange) {
    if (dateStr < r.onceRange.start || dateStr > r.onceRange.end) return false;
  }
  const dow = new Date(dateStr + 'T12:00:00').getDay();
  const dom = new Date(dateStr + 'T12:00:00').getDate();
  if (r.frequency === 'daily') return true;
  if (r.frequency === 'weekly') {
    if (!r.targetDays || r.targetDays.length === 0) return true;
    return r.targetDays.includes(dow);
  }
  if (r.frequency === 'monthly') {
    if (!r.monthlyDays || r.monthlyDays.length === 0) return true;
    return r.monthlyDays.includes(dom);
  }
  return true;
}

function calcCurrentStreak(dates: string[], today: string): number {
  if (!dates.includes(today)) return 0;
  let streak = 0;
  const d = new Date(today + 'T12:00:00');
  while (dates.includes(fmt(d))) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
}

function calcBestStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...dates].sort();
  let best = 1, current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.round((new Date(sorted[i] + 'T12:00:00').getTime() - new Date(sorted[i-1] + 'T12:00:00').getTime()) / 86400000);
    if (diff === 1) { current++; best = Math.max(best, current); } else current = 1;
  }
  return best;
}

function rateColor(rate: number): string {
  if (rate >= 75) return GREEN;
  if (rate >= 40) return GOLD;
  return '#e74c3c';
}

export default function RoutineStatsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useStore(s => s.user);
  const today = getAppDate(user.dayEndHour ?? 0);

  const routine = user.routines.find(r => r.id === id);

  if (!routine) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Text style={{ fontSize: 15, color: TEXT2 }}>Rutin bulunamadı.</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: GREEN, fontWeight: '700' }}>Geri dön</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const cc = routine.setName ? catColor(routine.setName) : GREEN;

  const stats = useMemo(() => {
    const todayD = new Date(today + 'T12:00:00');
    const total = routine.completedDates.length;
    const streak = calcCurrentStreak(routine.completedDates, today);
    const best = calcBestStreak(routine.completedDates);
    const daysSince = Math.max(1, Math.floor((Date.now() - new Date(routine.createdAt).getTime()) / 86400000));

    // â”€â”€ Bu Hafta â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const dow = todayD.getDay();
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    const weekStart = new Date(todayD);
    weekStart.setDate(todayD.getDate() + mondayOffset);

    let weekApplicable = 0, weekDone = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart); d.setDate(weekStart.getDate() + i);
      if (d > todayD) break;
      const ds = fmt(d);
      if (isApplicable(routine, ds)) {
        weekApplicable++;
        if (routine.completedDates.includes(ds)) weekDone++;
      }
    }
    const weekRate = weekApplicable > 0 ? Math.round((weekDone / weekApplicable) * 100) : 0;

    // â”€â”€ Bu Ay â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const monthYear = todayD.getFullYear();
    const monthIdx = todayD.getMonth();
    const daysInMonth = new Date(monthYear, monthIdx + 1, 0).getDate();

    let monthApplicable = 0, monthDone = 0;
    const monthDayStatus: { day: number; applicable: boolean; done: boolean; future: boolean }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${monthYear}-${String(monthIdx+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const future = ds > today;
      const appl = isApplicable(routine, ds);
      const done = routine.completedDates.includes(ds);
      monthDayStatus.push({ day: d, applicable: appl, done, future });
      if (!future && appl) { monthApplicable++; if (done) monthDone++; }
    }
    const monthRate = monthApplicable > 0 ? Math.round((monthDone / monthApplicable) * 100) : 0;

    // Month calendar offset
    const firstDayRaw = new Date(monthYear, monthIdx, 1).getDay();
    const calOffset = firstDayRaw === 0 ? 6 : firstDayRaw - 1;
    const monthCells: (number | null)[] = [
      ...Array(calOffset).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (monthCells.length % 7 !== 0) monthCells.push(null);

    // Monthly bar chart: week-by-week
    const weekBars: { label: string; rate: number; done: number; total: number }[] = [];
    let wAppl = 0, wDone = 0, wFrom = 1;
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${monthYear}-${String(monthIdx+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      if (ds > today) { if (wAppl > 0) weekBars.push({ label: `${wFrom}-${d-1}`, rate: Math.round((wDone/wAppl)*100), done: wDone, total: wAppl }); break; }
      const dow2 = new Date(ds + 'T12:00:00').getDay();
      const appl = isApplicable(routine, ds);
      if (appl) { wAppl++; if (routine.completedDates.includes(ds)) wDone++; }
      if (dow2 === 0 || d === daysInMonth) {
        if (wAppl > 0) weekBars.push({ label: `${wFrom}-${d}`, rate: Math.round((wDone/wAppl)*100), done: wDone, total: wAppl });
        wFrom = d + 1; wAppl = 0; wDone = 0;
      }
    }

    // â”€â”€ Bu Yıl â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const thisYear = todayD.getFullYear();
    let yearApplicable = 0, yearDone = 0;
    const yearCursor = new Date(thisYear, 0, 1);
    while (yearCursor <= todayD) {
      const ds = fmt(yearCursor);
      if (isApplicable(routine, ds)) { yearApplicable++; if (routine.completedDates.includes(ds)) yearDone++; }
      yearCursor.setDate(yearCursor.getDate() + 1);
    }
    const yearRate = yearApplicable > 0 ? Math.round((yearDone / yearApplicable) * 100) : 0;

    return {
      total, streak, best, daysSince,
      weekRate, weekDone, weekApplicable,
      monthRate, monthDone, monthApplicable, monthDayStatus, monthCells, monthCellsRows: monthCells.length / 7,
      monthYear, monthIdx, daysInMonth, weekBars,
      yearRate, yearDone, yearApplicable,
    };
  }, [routine, today]);

  const createdDate = new Date(routine.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={TEXT} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>İstatistikler</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Kimlik */}
        <View style={s.identityCard}>
          <View style={[s.iconBig, { backgroundColor: cc }]}>
            <Ionicons name={(routine.setIcon as any) || 'star-outline'} size={24} color="#fff" />
          </View>
          <Text style={s.routineName}>{routine.name}</Text>
{routine.setName && <Text style={s.routineSet}>{routine.setName} · {FREQ_LABEL[routine.frequency]}</Text>}
          <Text style={s.routineCreated}>{createdDate}'den beri · {stats.daysSince} gün</Text>
        </View>

        {/* Toplam sayılar */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={[s.statNum, { color: cc }]}>{stats.total}</Text>
            <Text style={s.statLbl}>Toplam</Text>
          </View>
          <View style={s.statCard}>
            <Text style={[s.statNum, { color: GOLD }]}>{stats.streak}</Text>
            <Text style={s.statLbl}>Güncel Seri</Text>
          </View>
          <View style={s.statCard}>
            <Text style={[s.statNum, { color: GREEN }]}>{stats.best}</Text>
            <Text style={s.statLbl}>En İyi Seri</Text>
          </View>
        </View>

        {/* Yüzde kartları */}
        <View style={s.statsRow}>
          {[
            { label: 'Bu Hafta', rate: stats.weekRate, sub: `${stats.weekDone}/${stats.weekApplicable}` },
            { label: 'Bu Ay', rate: stats.monthRate, sub: `${stats.monthDone}/${stats.monthApplicable}` },
            { label: 'Bu Yıl', rate: stats.yearRate, sub: `${stats.yearDone}/${stats.yearApplicable}` },
          ].map(({ label, rate, sub }) => (
            <View key={label} style={s.rateCard}>
              <Text style={[s.rateNum, { color: rateColor(rate) }]}>{rate}<Text style={s.ratePct}>%</Text></Text>
              <Text style={s.statLbl}>{label}</Text>
              <Text style={s.rateSub}>{sub} gün</Text>
            </View>
          ))}
        </View>

        {/* Bu Ay Takvimi */}
        <View style={s.sectionCard}>
          <View style={s.sectionHeaderRow}>
            <Text style={s.sectionTitle}>{MONTHS[stats.monthIdx].toUpperCase()} {stats.monthYear}</Text>
            <Text style={[s.monthRateLbl, { color: rateColor(stats.monthRate) }]}>{stats.monthRate}%</Text>
          </View>

          {/* Ay ilerleme barı */}
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${stats.monthRate}%`, backgroundColor: rateColor(stats.monthRate) }]} />
          </View>

          {/* Gün başlıkları */}
          <View style={s.calDayRow}>
            {DAY_SHORTS.map(d => <Text key={d} style={s.calDayLbl}>{d}</Text>)}
          </View>

          {/* Takvim ızgarası */}
          {Array.from({ length: stats.monthCellsRows }, (_, row) => (
            <View key={row} style={s.calRow}>
              {stats.monthCells.slice(row * 7, row * 7 + 7).map((day, col) => {
                if (!day) return <View key={col} style={s.calCellEmpty} />;
                const ds = `${stats.monthYear}-${String(stats.monthIdx+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                const status = stats.monthDayStatus.find(x => x.day === day)!;
                const isToday = ds === today;
                return (
                  <View key={col} style={s.calCellWrap}>
                    <View style={[
                      s.calCell,
                      status.done && { backgroundColor: GREEN },
                      !status.done && isToday && { borderWidth: 1.5, borderColor: cc },
                      !status.done && !isToday && status.applicable && !status.future && { backgroundColor: SURFACE },
                    ]}>
                      {status.done
                        ? <Ionicons name="checkmark" size={12} color="#fff" />
                        : <Text style={[s.calNum, status.future && s.calNumFuture, isToday && { color: cc, fontWeight: '900' }]}>{day}</Text>
                      }
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* Haftalık bar grafik */}
        {stats.weekBars.length > 0 && (
          <View style={s.sectionCard}>
            <Text style={s.sectionTitle}>HAFTALIK DAĞILIM</Text>
            {stats.weekBars.map((wb, i) => (
              <View key={i} style={s.barRow}>
                <Text style={s.barLabel}>{wb.label}. gün</Text>
                <View style={s.barTrack}>
                  <View style={[s.barFill, { width: `${wb.rate}%`, backgroundColor: rateColor(wb.rate) }]} />
                </View>
                <Text style={[s.barPct, { color: rateColor(wb.rate) }]}>{wb.rate}%</Text>
              </View>
            ))}
          </View>
        )}

        {/* Notlar */}
        {(routine.notes?.length ?? 0) > 0 && (
          <View style={s.sectionCard}>
            <Text style={s.sectionTitle}>NOTLAR</Text>
            {routine.notes!.map((note, i) => (
              <View key={note.id} style={[s.noteItem, i < routine.notes!.length - 1 && s.noteItemBorder]}>
                <Text style={s.noteDate}>
                  {new Date(note.date + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                </Text>
                <Text style={s.noteTxt}>{note.text}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, color: TEXT, fontWeight: '800', letterSpacing: -0.3, textAlign: 'center' },

  identityCard: { alignItems: 'center', paddingTop: 16, paddingBottom: 20, paddingHorizontal: 20, gap: 5 },
  iconBig: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  routineName: { fontSize: 22, color: TEXT, fontWeight: '900', letterSpacing: -0.5, textAlign: 'center' },
  routineSet: { fontSize: 13, color: TEXT2 },
  routineCreated: { fontSize: 12, color: TEXT3 },

  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  statCard: { flex: 1, backgroundColor: CARD, borderRadius: 16, paddingVertical: 14, alignItems: 'center', gap: 3 },
  statNum: { fontSize: 26, fontWeight: '900' },
  statLbl: { fontSize: 10, color: TEXT3, fontWeight: '700', letterSpacing: 0.3 },

  rateCard: { flex: 1, backgroundColor: CARD, borderRadius: 16, paddingVertical: 12, alignItems: 'center', gap: 2 },
  rateNum: { fontSize: 22, fontWeight: '900' },
  ratePct: { fontSize: 13, fontWeight: '700' },
  rateSub: { fontSize: 10, color: TEXT3, fontWeight: '600' },

  sectionCard: { marginHorizontal: 16, marginBottom: 8, backgroundColor: CARD, borderRadius: 16, padding: 14 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontSize: 10, fontWeight: '800', color: TEXT3, letterSpacing: 1 },
  monthRateLbl: { fontSize: 16, fontWeight: '900' },

  progressTrack: { height: 7, backgroundColor: SURFACE, borderRadius: 4, marginBottom: 14, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },

  calDayRow: { flexDirection: 'row', marginBottom: 6 },
  calDayLbl: { flex: 1, textAlign: 'center', fontSize: 10, color: TEXT3, fontWeight: '700' },
  calRow: { flexDirection: 'row', marginBottom: 4 },
  calCellWrap: { flex: 1, padding: 2 },
  calCellEmpty: { flex: 1 },
  calCell: { flex: 1, aspectRatio: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  calNum: { fontSize: 11, fontWeight: '600', color: TEXT2 },
  calNumFuture: { color: TEXT3, opacity: 0.4 },

  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  barLabel: { width: 56, fontSize: 11, color: TEXT3, fontWeight: '600' },
  barTrack: { flex: 1, height: 8, backgroundColor: SURFACE, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  barPct: { width: 34, fontSize: 12, fontWeight: '800', textAlign: 'right' },

  noteItem: { paddingVertical: 10 },
  noteItemBorder: { borderBottomWidth: 0.5, borderBottomColor: BORDER },
  noteDate: { fontSize: 11, color: TEXT3, fontWeight: '700', marginBottom: 4 },
  noteTxt: { fontSize: 14, color: TEXT, lineHeight: 20 },
});

