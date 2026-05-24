import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useStore, Routine } from '../../store/useStore';
import { generateId } from '../../lib/api';
import { localDateStr } from '../../lib/date';

const BG = '#EEE3D0'; const SURFACE = '#F5EDE0'; const BORDER = '#B2B7AA';
const TEXT = '#0A3B25'; const TEXT2 = '#3D6B58'; const TEXT3 = '#B2B7AA';
const GREEN = '#2A6151'; const PILL = 999;

type Freq = 'daily' | 'weekly' | 'monthly';

const WEEK_DAYS = [
  { label: 'Pzt', js: 1 }, { label: 'Sal', js: 2 }, { label: 'Çar', js: 3 },
  { label: 'Per', js: 4 }, { label: 'Cum', js: 5 }, { label: 'Cmt', js: 6 }, { label: 'Paz', js: 0 },
];

const FREQ_OPTS: { value: Freq; label: string }[] = [
  { value: 'daily',   label: 'Günlük' },
  { value: 'weekly',  label: 'Haftalık' },
  { value: 'monthly', label: 'Aylık' },
];

const getOnceRange = (freq: Freq): { start: string; end: string } => {
  const now = new Date();
  const fmt = (d: Date) => localDateStr(d);
  if (freq === 'daily') { const s = fmt(now); return { start: s, end: s }; }
  if (freq === 'weekly') {
    const day = now.getDay();
    const mon = new Date(now); mon.setDate(now.getDate() + (day === 0 ? -6 : 1 - day));
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return { start: fmt(mon), end: fmt(sun) };
  }
  return {
    start: fmt(new Date(now.getFullYear(), now.getMonth(), 1)),
    end:   fmt(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
};

export default function CreateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addRoutines = useStore(s => s.addRoutines);
  const selectedCategory = useStore(s => s.selectedCategory);
  const setSelectedCategory = useStore(s => s.setSelectedCategory);

  const [title, setTitle]       = useState('');
  const [freq, setFreq]         = useState<Freq>('daily');
  const [recurring, setRecurring] = useState(true);
  const [days, setDays]         = useState<number[]>([]);
  const [monthDays, setMonthDays] = useState<number[]>([]);
  const [hour, setHour]         = useState('09');
  const [min, setMin]           = useState('00');
  const [showTime, setShowTime] = useState(false);

  const timeDate = new Date();
  timeDate.setHours(parseInt(hour, 10));
  timeDate.setMinutes(parseInt(min, 10));

  const hasCategory = !!selectedCategory && selectedCategory.name !== 'new';

  const canSave = title.trim().length > 0
    && hasCategory
    && (freq === 'weekly'  ? days.length > 0     : true)
    && (freq === 'monthly' ? monthDays.length > 0 : true);

  const handleSave = () => {
    if (!canSave) return;
    const catName = selectedCategory?.name && selectedCategory.name !== 'new' ? selectedCategory.name : undefined;
    const catIcon = selectedCategory?.icon && catName ? selectedCategory.icon : undefined;
    const scope = recurring ? 'recurring' : 'once';
    const routine: Routine = {
      id: generateId(),
      name: title.trim(),
      frequency: freq,
      notificationTime: `${hour}:${min}`,
      completedDates: [],
      createdAt: new Date().toISOString(),
      setName: catName,
      setIcon: catIcon,
      scope,
      onceRange: scope === 'once' ? getOnceRange(freq) : undefined,
      targetDays: freq === 'weekly' && days.length > 0 ? days : undefined,
      monthlyDays: freq === 'monthly' && monthDays.length > 0 ? monthDays : undefined,
    };
    addRoutines([routine]);
    setTitle(''); setFreq('daily'); setRecurring(true);
    setDays([]); setMonthDays([]); setHour('09'); setMin('00'); setShowTime(false);
    setSelectedCategory(null);
    Alert.alert('Eklendi ✓', `"${routine.name}" rutini oluşturuldu.`);
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Yeni Rutin</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* Kategori */}
        <TouchableOpacity style={s.catRow} onPress={() => router.push('/category-select')} activeOpacity={0.7}>
          <View style={s.catIconBox}>
            <Ionicons
              name={(selectedCategory?.icon as any) ?? 'grid-outline'}
              size={18}
              color={selectedCategory ? GREEN : TEXT3}
            />
          </View>
          <Text style={[s.catLabel, selectedCategory && { color: TEXT }]}>
            {selectedCategory?.name && selectedCategory.name !== 'new' ? selectedCategory.name : 'Kategori seç'}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={TEXT3} />
        </TouchableOpacity>

        <View style={s.divider} />

        <View style={s.form}>
          {/* Rutin adı */}
          <TextInput
            style={s.nameInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Rutin adı..."
            placeholderTextColor={TEXT3}
            maxLength={80}
          />

          {/* Frekans */}
          <View style={s.freqRow}>
            {FREQ_OPTS.map(opt => {
              const on = freq === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[s.freqPill, on && s.freqPillOn]}
                  onPress={() => { setFreq(opt.value); setDays([]); setMonthDays([]); }}
                  activeOpacity={0.7}
                >
                  <Text style={[s.freqPillTxt, on && { color: '#fff' }]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Tekrarlayan / Sadece bu sefer */}
          <View style={s.scopeCol}>
            {[{ val: true, label: 'Tekrarlayan' }, { val: false, label: 'Sadece Bu Sefer' }].map(opt => (
              <TouchableOpacity
                key={String(opt.val)}
                style={s.radioRow}
                onPress={() => setRecurring(opt.val)}
                activeOpacity={0.7}
              >
                <View style={s.radioOuter}>
                  {recurring === opt.val && <View style={s.radioInner} />}
                </View>
                <Text style={[s.radioLabel, recurring === opt.val && s.radioLabelOn]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Haftalık gün seçimi */}
          {freq === 'weekly' && (
            <View style={s.dayRow}>
              {WEEK_DAYS.map(({ label, js }) => {
                const on = days.includes(js);
                return (
                  <TouchableOpacity
                    key={js}
                    style={[s.dayChip, on && s.dayChipOn]}
                    onPress={() => setDays(prev => on ? prev.filter(d => d !== js) : [...prev, js])}
                  >
                    <Text style={[s.dayChipTxt, on && { color: '#fff' }]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Aylık gün seçimi */}
          {freq === 'monthly' && (
            <View style={s.calGrid}>
              {Array.from({ length: 31 }, (_, i) => i + 1).map(d => {
                const on = monthDays.includes(d);
                return (
                  <TouchableOpacity
                    key={d}
                    style={[s.calCell, on && s.calCellOn]}
                    onPress={() => setMonthDays(prev => on ? prev.filter(x => x !== d) : [...prev, d])}
                  >
                    <Text style={[s.calCellTxt, on && { color: '#fff' }]}>{d}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Bildirim saati */}
          <TouchableOpacity style={s.timeBtn} onPress={() => setShowTime(v => !v)} activeOpacity={0.7}>
            <Ionicons name="time-outline" size={16} color={TEXT2} />
            <Text style={s.timeLbl}>Bildirim saati</Text>
            <Text style={s.timeVal}>{hour}:{min}</Text>
            <Ionicons name={showTime ? 'chevron-up' : 'chevron-down'} size={14} color={TEXT3} />
          </TouchableOpacity>

          {showTime && Platform.OS === 'ios' && (
            <View style={{ overflow: 'hidden' }}>
              <DateTimePicker
                value={timeDate} mode="time" display="spinner" is24Hour
                onChange={(_, d) => {
                  if (d) {
                    setHour(String(d.getHours()).padStart(2, '0'));
                    setMin(String(d.getMinutes()).padStart(2, '0'));
                  }
                }}
                style={{ width: '100%', height: 110 }}
              />
            </View>
          )}
          {showTime && Platform.OS === 'android' && (
            <DateTimePicker
              value={timeDate} mode="time" display="spinner" is24Hour
              onChange={(e, d) => {
                setShowTime(false);
                if (e.type === 'set' && d) {
                  setHour(String(d.getHours()).padStart(2, '0'));
                  setMin(String(d.getMinutes()).padStart(2, '0'));
                }
              }}
            />
          )}
        </View>
      </ScrollView>

      {/* Ekle butonu */}
      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={[s.addBtn, !canSave && s.addBtnOff]}
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={20} color={canSave ? '#fff' : TEXT3} />
          <Text style={[s.addBtnTxt, !canSave && { color: TEXT3 }]}>Rutin Ekle</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 },
  headerTitle: { fontSize: 22, color: TEXT, fontWeight: '800', letterSpacing: -0.3 },

  divider: { height: 0.5, backgroundColor: BORDER },

  catRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  catIconBox: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center',
  },
  catLabel: { flex: 1, fontSize: 14, color: TEXT3, fontWeight: '500' },

  form: { paddingHorizontal: 16, paddingTop: 20, gap: 14 },

  nameInput: {
    fontSize: 20, fontWeight: '700', color: TEXT,
    backgroundColor: SURFACE, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 16,
  },

  freqRow: { flexDirection: 'row', gap: 8 },
  freqPill: {
    flex: 1, paddingVertical: 12, borderRadius: PILL,
    backgroundColor: SURFACE, alignItems: 'center',
  },
  freqPillOn: { backgroundColor: GREEN },
  freqPillTxt: { fontSize: 13, fontWeight: '700', color: TEXT2 },

  scopeCol: { flexDirection: 'row', gap: 24 },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  radioInner: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: GREEN,
  },
  radioLabel: { fontSize: 14, fontWeight: '500', color: TEXT2 },
  radioLabelOn: { color: TEXT, fontWeight: '700' },

  dayRow: { flexDirection: 'row', gap: 5 },
  dayChip: {
    flex: 1, aspectRatio: 1, borderRadius: PILL,
    backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center',
  },
  dayChipOn: { backgroundColor: TEXT },
  dayChipTxt: { fontSize: 11, fontWeight: '700', color: TEXT2 },

  calGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  calCell: {
    width: '12%', aspectRatio: 1, borderRadius: 10,
    backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center',
  },
  calCellOn: { backgroundColor: GREEN },
  calCellTxt: { fontSize: 12, fontWeight: '700', color: TEXT2 },

  timeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: SURFACE, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 13,
  },
  timeLbl: { fontSize: 13, color: TEXT2, flex: 1 },
  timeVal: { fontSize: 16, fontWeight: '800', color: TEXT, letterSpacing: 0.5 },

  footer: {
    paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 0.5, borderTopColor: BORDER,
    backgroundColor: BG,
  },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: GREEN,
    borderRadius: PILL, paddingVertical: 16,
  },
  addBtnOff: { backgroundColor: SURFACE },
  addBtnTxt: { fontSize: 16, color: '#fff', fontWeight: '800' },
});
