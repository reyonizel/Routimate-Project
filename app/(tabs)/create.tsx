import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useStore, Routine } from '../../store/useStore';
import { generateId } from '../../lib/api';
import { localDateStr } from '../../lib/date';

const BG = '#FCF7F0'; const SURFACE = '#F5EDE0'; const BORDER = '#B2B7AA';
const TEXT = '#0A3B25'; const TEXT2 = '#3D6B58'; const TEXT3 = '#B2B7AA';
const GREEN = '#2A6151';

type Freq = 'daily' | 'weekly' | 'monthly';
type Scope = 'once' | 'recurring';
type FreqScope = 'daily-once' | 'daily-rec' | 'weekly-once' | 'weekly-rec' | 'monthly-once' | 'monthly-rec';

const WEEK_DAYS = [
  { label: 'Pzt', js: 1 }, { label: 'Sal', js: 2 }, { label: 'Çar', js: 3 },
  { label: 'Per', js: 4 }, { label: 'Cum', js: 5 }, { label: 'Cmt', js: 6 }, { label: 'Paz', js: 0 },
];

const FS_OPTIONS: { value: FreqScope; label: string; freq: Freq; scope: Scope }[] = [
  { value: 'daily-once',   label: 'Sadece Bugün',   freq: 'daily',   scope: 'once' },
  { value: 'daily-rec',    label: 'Her Gün',         freq: 'daily',   scope: 'recurring' },
  { value: 'weekly-once',  label: 'Sadece Bu Hafta', freq: 'weekly',  scope: 'once' },
  { value: 'weekly-rec',   label: 'Her Hafta',       freq: 'weekly',  scope: 'recurring' },
  { value: 'monthly-once', label: 'Sadece Bu Ay',    freq: 'monthly', scope: 'once' },
  { value: 'monthly-rec',  label: 'Her Ay',          freq: 'monthly', scope: 'recurring' },
];

const scopeLabel = (freq: Freq, scope: Scope) =>
  FS_OPTIONS.find(o => o.freq === freq && o.scope === scope)?.label ?? '';

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
    end: fmt(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
};

type RoutineDraft = {
  tempId: string;
  title: string;
  hour: string;
  min: string;
  freqScope: FreqScope;
  days: number[];
  monthDays: number[];
};

export default function CreateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addRoutines = useStore(s => s.addRoutines);
  const selectedCategory = useStore(s => s.selectedCategory);
  const setSelectedCategory = useStore(s => s.setSelectedCategory);
  const user = useStore(s => s.user);

  const [drafts, setDrafts] = useState<RoutineDraft[]>([]);

  const [fTitle, setFTitle] = useState('');
  const [fHour, setFHour] = useState('09');
  const [fMin, setFMin] = useState('00');
  const [fFreqScope, setFFreqScope] = useState<FreqScope>('daily-rec');
  const [fDays, setFDays] = useState<number[]>([]);
  const [fMonthDays, setFMonthDays] = useState<number[]>([]);
  const [fShowTime, setFShowTime] = useState(false);

  const fOpt = FS_OPTIONS.find(o => o.value === fFreqScope)!;
  const fTimeDate = new Date();
  fTimeDate.setHours(parseInt(fHour, 10));
  fTimeDate.setMinutes(parseInt(fMin, 10));

  const canAdd = fTitle.trim().length > 0
    && (fOpt.freq === 'weekly' ? fDays.length > 0 : true)
    && (fOpt.freq === 'monthly' ? fMonthDays.length > 0 : true);

  useFocusEffect(
    React.useCallback(() => {
      return () => { setSelectedCategory(null); };
    }, [setSelectedCategory])
  );

  const handleAddDraft = () => {
    if (!fTitle.trim()) return;
    setDrafts(prev => [...prev, {
      tempId: Date.now().toString(),
      title: fTitle.trim(), hour: fHour, min: fMin,
      freqScope: fFreqScope, days: fDays, monthDays: fMonthDays,
    }]);
    setFTitle(''); setFHour('09'); setFMin('00'); setFFreqScope('daily-rec');
    setFDays([]); setFMonthDays([]); setFShowTime(false);
  };

  const handleSave = () => {
    if (drafts.length === 0) return;
    const catName = selectedCategory?.name && selectedCategory.name !== 'new' ? selectedCategory.name : undefined;
    const catIcon = selectedCategory?.icon && catName ? selectedCategory.icon : undefined;
    const routines: Routine[] = drafts.map(d => {
      const opt = FS_OPTIONS.find(o => o.value === d.freqScope)!;
      return {
        id: generateId(), name: d.title, frequency: opt.freq,
        notificationTime: `${d.hour}:${d.min}`, completedDates: [],
        createdAt: new Date().toISOString(),
        setName: catName, setIcon: catIcon,
        scope: opt.scope, onceRange: opt.scope === 'once' ? getOnceRange(opt.freq) : undefined,
        targetDays: opt.freq === 'weekly' && d.days.length > 0 ? d.days : undefined,
        monthlyDays: opt.freq === 'monthly' && d.monthDays.length > 0 ? d.monthDays : undefined,
      };
    });
    addRoutines(routines);
    setDrafts([]); setSelectedCategory(null);
    Alert.alert('Kaydedildi ✓', `${routines.length} rutin${catName ? ` "${catName}" kategorisine` : ''} eklendi.`);
  };

  const removeDraft = (tempId: string) => setDrafts(prev => prev.filter(d => d.tempId !== tempId));

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Yeni Rutin</Text>
        {drafts.length > 0 && (
          <TouchableOpacity style={s.saveHeaderBtn} onPress={handleSave} activeOpacity={0.85}>
            <Text style={s.saveHeaderTxt}>Kaydet</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        {/* Kategori seçimi */}
        <TouchableOpacity style={s.catRow} onPress={() => router.push('/category-select')} activeOpacity={0.7}>
          <View style={s.catIcon}>
            <Ionicons name={selectedCategory?.icon ? (selectedCategory.icon as any) : 'grid-outline'} size={18} color={selectedCategory ? GREEN : TEXT3} />
          </View>
          <Text style={[s.catLabel, selectedCategory && { color: TEXT }]}>{selectedCategory?.name && selectedCategory.name !== 'new' ? selectedCategory.name : 'Kategori seç'}</Text>
          <Ionicons name="chevron-forward" size={18} color={TEXT3} />
        </TouchableOpacity>

        <View style={s.divider} />

        {/* Eklenen rutinler */}
        {drafts.length > 0 && (
          <>
            <View style={s.sectionLabel}>
              <Text style={s.sectionLabelTxt}>Eklenen Rutinler</Text>
              <View style={s.badge}><Text style={s.badgeTxt}>{drafts.length}</Text></View>
            </View>
            {drafts.map((d, idx) => {
              const opt = FS_OPTIONS.find(o => o.value === d.freqScope)!;
              return (
                <View key={d.tempId} style={[s.draftRow, idx < drafts.length - 1 && s.draftBorder]}>
                  <View style={[s.draftDot, { backgroundColor: opt.freq === 'daily' ? '#2980b9' : opt.freq === 'weekly' ? '#8e44ad' : '#d35400' }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.draftTitle}>{d.title}</Text>
                    <Text style={s.draftMeta}>{scopeLabel(opt.freq, opt.scope)} · {d.hour}:{d.min}</Text>
                  </View>
                  <TouchableOpacity hitSlop={10} onPress={() => removeDraft(d.tempId)}>
                    <Ionicons name="close-circle" size={18} color={TEXT3} />
                  </TouchableOpacity>
                </View>
              );
            })}
            <View style={s.divider} />
          </>
        )}

        {/* Rutin ekleme */}
        <View style={s.sectionLabel}>
          <Text style={[s.sectionLabelTxt, { color: GREEN }]}>Rutin Ekle</Text>
        </View>

        <View style={s.formWrap}>
          {/* Rutin adı kutucuğu */}
          <View style={s.nameBox}>
            <TextInput style={s.nameInput} value={fTitle} onChangeText={setFTitle} placeholder="Rutin adı..." placeholderTextColor={TEXT3} maxLength={80} />
          </View>

          {/* Saat ve Periyot yan yana */}
          <View style={s.rowSplit}>
            <TouchableOpacity style={s.splitBtn} onPress={() => setFShowTime(v => !v)} activeOpacity={0.7}>
              <Ionicons name="time-outline" size={16} color={TEXT2} />
              <Text style={s.splitBtnTxt}>{fHour}:{fMin}</Text>
            </TouchableOpacity>

            <View style={s.freqWrap}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.freqScroll}>
                {FS_OPTIONS.map(opt => {
                  const on = fFreqScope === opt.value;
                  return (
                    <TouchableOpacity key={opt.value} style={[s.freqChip, on && s.freqChipOn]} onPress={() => setFFreqScope(opt.value)} activeOpacity={0.7}>
                      <Text style={[s.freqChipTxt, on && { color: '#fff' }]}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {fShowTime && Platform.OS === 'ios' && (
            <View style={{ overflow: 'hidden', marginTop: 8 }}>
              <DateTimePicker value={fTimeDate} mode="time" display="spinner" is24Hour onChange={(_, d) => { if (d) { setFHour(String(d.getHours()).padStart(2, '0')); setFMin(String(d.getMinutes()).padStart(2, '0')); } }} style={{ width: '100%', height: 110 }} />
            </View>
          )}
          {fShowTime && Platform.OS === 'android' && (
            <DateTimePicker value={fTimeDate} mode="time" display="spinner" is24Hour onChange={(e, d) => { setFShowTime(false); if (e.type === 'set' && d) { setFHour(String(d.getHours()).padStart(2, '0')); setFMin(String(d.getMinutes()).padStart(2, '0')); } }} />
          )}

          {fOpt.freq === 'weekly' && (
            <View style={s.dayRow}>
              {WEEK_DAYS.map(({ label, js }) => {
                const on = fDays.includes(js);
                return (
                  <TouchableOpacity key={js} style={[s.dayChip, on && s.dayChipOn]} onPress={() => setFDays(prev => on ? prev.filter(d => d !== js) : [...prev, js])}>
                    <Text style={[s.dayChipTxt, on && { color: '#fff' }]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {fOpt.freq === 'monthly' && (
            <View style={s.calGrid}>
              {Array.from({ length: 31 }, (_, i) => i + 1).map(d => {
                const on = fMonthDays.includes(d);
                return (
                  <TouchableOpacity key={d} style={[s.calCell, on && s.calCellOn]} onPress={() => setFMonthDays(prev => on ? prev.filter(x => x !== d) : [...prev, d])}>
                    <Text style={[s.calCellTxt, on && { color: '#fff' }]}>{d}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <TouchableOpacity style={[s.addBtn, !canAdd && s.addBtnOff]} onPress={handleAddDraft} disabled={!canAdd} activeOpacity={0.8}>
          <Ionicons name="add" size={18} color={canAdd ? '#fff' : TEXT3} />
          <Text style={s.addBtnTxt}>Listeye Ekle</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 },
  headerTitle: { fontSize: 22, color: TEXT, fontWeight: '800', letterSpacing: -0.3 },
  saveHeaderBtn: { backgroundColor: GREEN, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  saveHeaderTxt: { fontSize: 14, color: '#fff', fontWeight: '700' },

  divider: { height: 1, backgroundColor: BORDER },

  // Category row
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14 },
  catIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' },
  catLabel: { flex: 1, fontSize: 14, color: TEXT3, fontWeight: '500' },

  // Section label
  sectionLabel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  sectionLabelTxt: { fontSize: 13, color: TEXT2, fontWeight: '700', letterSpacing: 0.5 },
  badge: { backgroundColor: GREEN + '15', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  badgeTxt: { fontSize: 11, color: GREEN, fontWeight: '700' },

  // Drafts
  draftRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 11 },
  draftBorder: { borderBottomWidth: 1, borderBottomColor: BORDER },
  draftDot: { width: 8, height: 8, borderRadius: 4 },
  draftTitle: { fontSize: 14, color: TEXT, fontWeight: '500' },
  draftMeta: { fontSize: 11, color: TEXT3, marginTop: 2 },

  // Form
  formWrap: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },

  // Name box
  nameBox: { backgroundColor: SURFACE, borderRadius: 12, borderWidth: 1, borderColor: BORDER },
  nameInput: { fontSize: 14, color: TEXT, paddingVertical: 12, paddingHorizontal: 14 },

  // Row split: time + frequency
  rowSplit: { flexDirection: 'row', gap: 10 },
  splitBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: SURFACE, borderRadius: 12, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 14, paddingVertical: 10 },
  splitBtnTxt: { fontSize: 15, fontWeight: '700', color: TEXT, letterSpacing: 0.5 },
  freqWrap: { flex: 1 },
  freqScroll: { gap: 6 },
  freqChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER },
  freqChipOn: { backgroundColor: GREEN, borderColor: GREEN },
  freqChipTxt: { fontSize: 12, fontWeight: '600', color: TEXT2 },

  // Day chips
  dayRow: { flexDirection: 'row', gap: 5 },
  dayChip: { flex: 1, aspectRatio: 1, borderRadius: 999, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' },
  dayChipOn: { backgroundColor: TEXT },
  dayChipTxt: { fontSize: 11, fontWeight: '700', color: TEXT2 },

  // Month grid
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  calCell: { width: '12%', aspectRatio: 1, borderRadius: 10, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' },
  calCellOn: { backgroundColor: GREEN },
  calCellTxt: { fontSize: 12, fontWeight: '700', color: TEXT2 },

  // Buttons
  addBtn: { marginHorizontal: 16, marginTop: 20, borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: GREEN, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  addBtnOff: { backgroundColor: SURFACE },
  addBtnTxt: { fontSize: 15, color: '#fff', fontWeight: '700' },
});
