import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useStore } from '../store/useStore';

const BG = '#EEE3D0'; const SURFACE = '#F5EDE0'; const CARD = '#FFFFFF';
const TEXT = '#0A3B25'; const TEXT2 = '#3D6B58'; const TEXT3 = '#B2B7AA';
const GREEN = '#2A6151'; const BORDER = '#B2B7AA';

type Freq = 'daily' | 'weekly' | 'monthly';
type Scope = 'once' | 'recurring';
type FreqScope = 'daily-once' | 'daily-rec' | 'weekly-once' | 'weekly-rec' | 'monthly-once' | 'monthly-rec';

const FS_OPTIONS: { value: FreqScope; label: string; freq: Freq; scope: Scope }[] = [
  { value: 'daily-once',   label: 'Sadece Bugün',   freq: 'daily',   scope: 'once' },
  { value: 'daily-rec',    label: 'Her Gün',         freq: 'daily',   scope: 'recurring' },
  { value: 'weekly-once',  label: 'Sadece Bu Hafta', freq: 'weekly',  scope: 'once' },
  { value: 'weekly-rec',   label: 'Her Hafta',       freq: 'weekly',  scope: 'recurring' },
  { value: 'monthly-once', label: 'Sadece Bu Ay',    freq: 'monthly', scope: 'once' },
  { value: 'monthly-rec',  label: 'Her Ay',          freq: 'monthly', scope: 'recurring' },
];

const WEEK_DAYS = [
  { label: 'Pzt', js: 1 }, { label: 'Sal', js: 2 }, { label: 'Çar', js: 3 },
  { label: 'Per', js: 4 }, { label: 'Cum', js: 5 }, { label: 'Cmt', js: 6 }, { label: 'Paz', js: 0 },
];

export default function RoutineEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useStore(s => s.user);
  const updateRoutine = useStore(s => s.updateRoutine);
  const deleteRoutine = useStore(s => s.deleteRoutine);

  const routine = user.routines.find(r => r.id === id);

  const initFreqScope = (): FreqScope => {
    const freq = routine?.frequency ?? 'daily';
    const scope = routine?.scope ?? 'recurring';
    return `${freq}-${scope === 'once' ? 'once' : 'rec'}` as FreqScope;
  };

  const [name, setName] = useState(routine?.name ?? '');
  const [hour, setHour] = useState(routine?.notificationTime.split(':')[0] ?? '09');
  const [min, setMin] = useState(routine?.notificationTime.split(':')[1] ?? '00');
  const [freqScope, setFreqScope] = useState<FreqScope>(initFreqScope());
  const [days, setDays] = useState<number[]>(routine?.targetDays ?? []);
  const [monthDays, setMonthDays] = useState<number[]>(routine?.monthlyDays ?? []);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<View>(null);

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

  const fOpt = FS_OPTIONS.find(o => o.value === freqScope)!;
  const DROPDOWN_H = FS_OPTIONS.length * 46;

  const openDropdown = () => {
    triggerRef.current?.measureInWindow((x, y, w) => {
      setDropdownPos({ top: Math.max(8, y - DROPDOWN_H), left: x, width: w });
      setShowDropdown(true);
    });
  };

  const canSave = name.trim().length > 0
    && (fOpt.freq === 'weekly' ? days.length > 0 : true)
    && (fOpt.freq === 'monthly' ? monthDays.length > 0 : true);

  const handleSave = () => {
    if (!canSave) return;
    updateRoutine(routine.id, {
      name: name.trim(),
      notificationTime: `${hour}:${min}`,
      frequency: fOpt.freq,
      scope: fOpt.scope,
      targetDays: fOpt.freq === 'weekly' ? days : undefined,
      monthlyDays: fOpt.freq === 'monthly' ? monthDays : undefined,
    });
    router.back();
  };

  const timeDate = new Date();
  timeDate.setHours(parseInt(hour, 10));
  timeDate.setMinutes(parseInt(min, 10));

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* ── Header ─────────────────────────────── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={TEXT} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Rutini Düzenle</Text>
        <TouchableOpacity
          style={[s.saveBtn, !canSave && s.saveBtnOff]}
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.8}
        >
          <Text style={[s.saveTxt, !canSave && { color: TEXT3 }]}>Kaydet</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── İsim ──────────────────────────────── */}
        <TextInput
          style={s.nameInput}
          value={name}
          onChangeText={t => setName(t.slice(0, 60))}
          placeholder="Rutin adı"
          placeholderTextColor={TEXT3}
          maxLength={60}
        />

        <View style={s.divider} />

        {/* ── Frekans ───────────────────────────── */}
        <View ref={triggerRef} collapsable={false}>
          <TouchableOpacity style={s.row} onPress={openDropdown} activeOpacity={0.7}>
            <Text style={s.rowLabel}>Sıklık</Text>
            <Text style={s.rowValue}>{fOpt.label}</Text>
            <Ionicons name="chevron-forward" size={16} color={TEXT3} />
          </TouchableOpacity>
        </View>

        <Modal visible={showDropdown} transparent animationType="fade" onRequestClose={() => setShowDropdown(false)}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowDropdown(false)} />
          <View style={[s.dropdownList, { top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }]}>
            {FS_OPTIONS.map((opt, idx) => {
              const on = freqScope === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[s.dropdownItem, idx < FS_OPTIONS.length - 1 && s.dropdownItemBorder, on && s.dropdownItemOn]}
                  onPress={() => { setFreqScope(opt.value); setDays([]); setMonthDays([]); setShowDropdown(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={[s.dropdownItemTxt, on && s.dropdownItemTxtOn]}>{opt.label}</Text>
                  {on && <Ionicons name="checkmark" size={15} color={GREEN} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </Modal>

        <View style={s.divider} />

        {/* ── Haftalık günler ───────────────────── */}
        {fOpt.freq === 'weekly' && (
          <>
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
            <View style={s.divider} />
          </>
        )}

        {/* ── Aylık günler ──────────────────────── */}
        {fOpt.freq === 'monthly' && (
          <>
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
            <View style={s.divider} />
          </>
        )}

        {/* ── Saat ──────────────────────────────── */}
        <TouchableOpacity style={s.row} onPress={() => setShowTimePicker(v => !v)} activeOpacity={0.7}>
          <Text style={s.rowLabel}>Bildirim saati</Text>
          <Text style={s.rowValue}>{hour}:{min}</Text>
          <Ionicons name={showTimePicker ? 'chevron-up' : 'chevron-forward'} size={16} color={TEXT3} />
        </TouchableOpacity>

        {showTimePicker && Platform.OS === 'ios' && (
          <View style={{ overflow: 'hidden', backgroundColor: SURFACE }}>
            <DateTimePicker
              value={timeDate} mode="time" display="spinner" is24Hour
              onChange={(_, d) => { if (d) { setHour(String(d.getHours()).padStart(2,'0')); setMin(String(d.getMinutes()).padStart(2,'0')); } }}
              style={{ width: '100%', height: 110 }}
            />
          </View>
        )}
        {showTimePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={timeDate} mode="time" display="spinner" is24Hour
            onChange={(e, d) => { setShowTimePicker(false); if (e.type === 'set' && d) { setHour(String(d.getHours()).padStart(2,'0')); setMin(String(d.getMinutes()).padStart(2,'0')); } }}
          />
        )}

        <View style={s.divider} />

        {/* ── Sil ───────────────────────────────── */}
        <TouchableOpacity
          style={s.deleteBtn}
          onPress={() => Alert.alert(
            'Rutini Sil',
            `"${routine.name}" silinecek. Emin misin?`,
            [
              { text: 'Vazgeç', style: 'cancel' },
              { text: 'Sil', style: 'destructive', onPress: () => { deleteRoutine(routine.id); router.back(); } },
            ]
          )}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
          <Text style={s.deleteTxt}>Rutini Sil</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 18, color: TEXT, fontWeight: '800', letterSpacing: -0.3 },
  saveBtn: { backgroundColor: GREEN, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 9 },
  saveBtnOff: { backgroundColor: SURFACE },
  saveTxt: { fontSize: 14, color: '#fff', fontWeight: '800' },

  nameInput: {
    fontSize: 18, fontWeight: '700', color: TEXT,
    backgroundColor: SURFACE,
    paddingHorizontal: 20, paddingVertical: 18,
  },

  divider: { height: 1, backgroundColor: BORDER, marginHorizontal: 20 },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: SURFACE, paddingHorizontal: 20, paddingVertical: 16,
  },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: TEXT },
  rowValue: { fontSize: 14, fontWeight: '700', color: TEXT2 },

  dropdownList: {
    position: 'absolute', backgroundColor: BG, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 12,
  },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 13,
  },
  dropdownItemBorder: { borderBottomWidth: 0.5, borderBottomColor: BORDER },
  dropdownItemOn: { backgroundColor: GREEN + '12' },
  dropdownItemTxt: { fontSize: 14, color: TEXT2, fontWeight: '500' },
  dropdownItemTxtOn: { color: TEXT, fontWeight: '700' },

  dayRow: {
    flexDirection: 'row', gap: 6,
    backgroundColor: SURFACE, paddingHorizontal: 16, paddingVertical: 14,
  },
  dayChip: {
    flex: 1, aspectRatio: 1, borderRadius: 999,
    backgroundColor: BG, alignItems: 'center', justifyContent: 'center',
  },
  dayChipOn: { backgroundColor: TEXT },
  dayChipTxt: { fontSize: 11, fontWeight: '700', color: TEXT2 },

  calGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    backgroundColor: SURFACE, paddingHorizontal: 16, paddingVertical: 14,
  },
  calCell: {
    width: '12%', aspectRatio: 1, borderRadius: 10,
    backgroundColor: BG, alignItems: 'center', justifyContent: 'center',
  },
  calCellOn: { backgroundColor: GREEN },
  calCellTxt: { fontSize: 12, fontWeight: '700', color: TEXT2 },

  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: SURFACE, paddingVertical: 16,
  },
  deleteTxt: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
});
