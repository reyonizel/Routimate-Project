import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, Platform, Modal, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useStore, Routine } from '../../store/useStore';
import { generateId } from '../../lib/api';
import { localDateStr } from '../../lib/date';

const BG = '#FFFFFF'; const CARD = '#F4F4F4'; const SURFACE = '#EEEEEE';
const TEXT = '#111111'; const TEXT2 = '#767676'; const TEXT3 = '#ABABAB';
const GREEN = '#00bf63'; const BORDER = '#E8E8E8';

type Freq = 'daily' | 'weekly' | 'monthly';
type Scope = 'once' | 'recurring';
type FreqScope = 'daily-once' | 'daily-rec' | 'weekly-once' | 'weekly-rec' | 'monthly-once' | 'monthly-rec';

type RoutineItem = {
  tempId: string;
  title: string;
  desc: string;
  hour: string;
  min: string;
  freq: Freq;
  scope: Scope;
  targetDays: number[];
  monthDays: number[];
};

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

const FREQ_LABEL: Record<Freq, string> = { daily: 'Günlük', weekly: 'Haftalık', monthly: 'Aylık' };

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

export default function CreateScreen() {
  const addRoutines = useStore(s => s.addRoutines);

  const [setName, setSetName] = useState('');
  const [nameError, setNameError] = useState(false);
  const [items, setItems] = useState<RoutineItem[]>([]);
  const [showForm, setShowForm] = useState(false);

  // form fields
  const [fTitle, setFTitle] = useState('');
  const [fHour, setFHour] = useState('09');
  const [fMin, setFMin] = useState('00');
  const [fFreqScope, setFFreqScope] = useState<FreqScope>('daily-rec');
  const [fDays, setFDays] = useState<number[]>([]);
  const [fMonthDays, setFMonthDays] = useState<number[]>([]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<View>(null);
  const DROPDOWN_H = FS_OPTIONS.length * 46;

  const fOpt = FS_OPTIONS.find(o => o.value === fFreqScope)!;

  const canAdd = fTitle.trim().length > 0
    && (fOpt.freq === 'weekly' ? fDays.length > 0 : true)
    && (fOpt.freq === 'monthly' ? fMonthDays.length > 0 : true);;

  const openDropdown = () => {
    triggerRef.current?.measureInWindow((x, y, w, h) => {
      setDropdownPos({
        top: Math.max(8, y - DROPDOWN_H),
        left: x,
        width: w,
      });
      setShowDropdown(true);
    });
  };

  const resetForm = () => {
    setFTitle(''); setFHour('09'); setFMin('00');
    setFFreqScope('daily-rec'); setFDays([]); setFMonthDays([]);
    setShowTimePicker(false); setShowDropdown(false); setShowForm(false);
  };

  const handleAddItem = () => {
    if (!fTitle.trim()) return;
    setItems(prev => [...prev, {
      tempId: Date.now().toString(),
      title: fTitle.trim(), desc: '',
      hour: fHour, min: fMin,
      freq: fOpt.freq, scope: fOpt.scope,
      targetDays: fDays, monthDays: fMonthDays,
    }]);
    resetForm();
  };

  const handleSave = () => {
    if (!setName.trim()) { setNameError(true); return; }
    if (items.length === 0) return;
    const routines: Routine[] = items.map((item) => ({
      id: generateId(),
      name: item.title,
      frequency: item.freq,
      notificationTime: `${item.hour}:${item.min}`,
      completedDates: [],
      createdAt: new Date().toISOString(),
      setName: setName.trim(),
      scope: item.scope,
      onceRange: item.scope === 'once' ? getOnceRange(item.freq) : undefined,
      targetDays: item.freq === 'weekly' && item.targetDays.length > 0
        ? item.targetDays : undefined,
      monthlyDays: item.freq === 'monthly' && item.monthDays.length > 0
        ? item.monthDays : undefined,
    }));
    addRoutines(routines);
    setSetName(''); setItems([]);
    Alert.alert('Kaydedildi ✓', `"${setName.trim()}" seti ${routines.length} rutinle oluşturuldu.`);
  };

  const timeDate = new Date();
  timeDate.setHours(parseInt(fHour, 10));
  timeDate.setMinutes(parseInt(fMin, 10));

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <View style={s.header}>
          <Text style={s.headerTitle}>Yeni Rutin Seti</Text>
        </View>

        {/* ── Main card ── */}
        <View style={s.card}>

          {/* Set name */}
          <TextInput
            style={[s.setNameInput, nameError && { color: '#e74c3c' }]}
            value={setName}
            onChangeText={t => { setSetName(t.slice(0, 80)); if (t.trim()) setNameError(false); }}
            placeholder={nameError ? 'Set adı zorunlu!' : 'Set adı girin...'}
            placeholderTextColor={nameError ? '#e74c3c88' : TEXT3}
            maxLength={80}
          />

          {/* Added routines */}
          {items.length > 0 && (
            <View style={s.itemsSection}>
              <View style={s.divider} />
              {items.map((item, idx) => (
                <View key={item.tempId} style={[s.itemRow, idx < items.length - 1 && s.itemRowBorder]}>
                  <View style={[s.itemDot, {
                    backgroundColor: item.freq === 'daily' ? '#2980b9'
                      : item.freq === 'weekly' ? '#8e44ad' : '#d35400'
                  }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.itemTitle}>{item.title}</Text>
                    <Text style={s.itemMeta}>{scopeLabel(item.freq, item.scope)} · {item.hour}:{item.min}</Text>
                  </View>
                  <TouchableOpacity
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() => setItems(prev => prev.filter(i => i.tempId !== item.tempId))}
                  >
                    <Ionicons name="close-circle" size={18} color={TEXT3} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={s.divider} />

          {/* Inline form */}
          {showForm ? (
            <View style={s.form}>
              {/* Title */}
              <TextInput
                style={s.formTitleInput}
                value={fTitle}
                onChangeText={t => setFTitle(t.slice(0, 60))}
                placeholder="Rutin adı"
                placeholderTextColor={TEXT3}
                autoFocus
                maxLength={60}
              />

              {/* Timing dropdown */}
              <View ref={triggerRef} collapsable={false}>
                <TouchableOpacity
                  style={s.dropdownTrigger}
                  onPress={openDropdown}
                  activeOpacity={0.7}
                >
                  <Text style={s.dropdownValue}>{fOpt.label}</Text>
                  <Ionicons name={showDropdown ? 'chevron-up' : 'chevron-down'} size={16} color={TEXT3} />
                </TouchableOpacity>
              </View>

              <Modal visible={showDropdown} transparent animationType="fade" onRequestClose={() => setShowDropdown(false)}>
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowDropdown(false)} />
                <View style={[s.dropdownList, { top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }]}>
                  {FS_OPTIONS.map((opt, idx) => {
                    const on = fFreqScope === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        style={[s.dropdownItem, idx < FS_OPTIONS.length - 1 && s.dropdownItemBorder, on && s.dropdownItemOn]}
                        onPress={() => { setFFreqScope(opt.value); setFDays([]); setFMonthDays([]); setShowDropdown(false); }}
                        activeOpacity={0.7}
                      >
                        <Text style={[s.dropdownItemTxt, on && s.dropdownItemTxtOn]}>{opt.label}</Text>
                        {on && <Ionicons name="checkmark" size={15} color={GREEN} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Modal>

              {/* Weekly days — her hafta ve sadece bu hafta için */}
              {fOpt.freq === 'weekly' && (
                <View style={s.dayRow}>
                  {WEEK_DAYS.map(({ label, js }) => {
                    const on = fDays.includes(js);
                    return (
                      <TouchableOpacity
                        key={js}
                        style={[s.dayChip, on && s.dayChipOn]}
                        onPress={() => setFDays(prev => on ? prev.filter(d => d !== js) : [...prev, js])}
                      >
                        <Text style={[s.dayChipTxt, on && { color: '#fff' }]}>{label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Monthly grid — her ay ve sadece bu ay için */}
              {fOpt.freq === 'monthly' && (
                <View style={s.calGrid}>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => {
                    const on = fMonthDays.includes(d);
                    return (
                      <TouchableOpacity
                        key={d}
                        style={[s.calCell, on && s.calCellOn]}
                        onPress={() => setFMonthDays(prev => on ? prev.filter(x => x !== d) : [...prev, d])}
                      >
                        <Text style={[s.calCellTxt, on && { color: '#fff' }]}>{d}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Time selector */}
              <TouchableOpacity style={s.timeBtn} onPress={() => setShowTimePicker(v => !v)} activeOpacity={0.7}>
                <Ionicons name="time-outline" size={16} color={TEXT2} />
                <Text style={s.timeLbl}>Bildirim saatiniz:</Text>
                <Text style={s.timeBtnTxt}>{fHour}:{fMin}</Text>
                <Ionicons name={showTimePicker ? 'chevron-up' : 'chevron-down'} size={14} color={TEXT3} />
              </TouchableOpacity>

              {showTimePicker && Platform.OS === 'ios' && (
                <View style={{ overflow: 'hidden', marginBottom: 12 }}>
                  <DateTimePicker
                    value={timeDate} mode="time" display="spinner" is24Hour
                    onChange={(_, d) => {
                      if (d) {
                        setFHour(String(d.getHours()).padStart(2, '0'));
                        setFMin(String(d.getMinutes()).padStart(2, '0'));
                      }
                    }}
                    style={{ width: '100%', height: 110 }}
                  />
                </View>
              )}
              {showTimePicker && Platform.OS === 'android' && (
                <DateTimePicker
                  value={timeDate} mode="time" display="spinner" is24Hour
                  onChange={(e, d) => {
                    setShowTimePicker(false);
                    if (e.type === 'set' && d) {
                      setFHour(String(d.getHours()).padStart(2, '0'));
                      setFMin(String(d.getMinutes()).padStart(2, '0'));
                    }
                  }}
                />
              )}

              {/* Form buttons */}
              <View style={s.formBtns}>
                <TouchableOpacity style={s.cancelBtn} onPress={resetForm} activeOpacity={0.7}>
                  <Text style={s.cancelTxt}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.addBtn, !canAdd && s.addBtnOff]}
                  onPress={handleAddItem}
                  disabled={!canAdd}
                  activeOpacity={0.8}
                >
                  <Text style={s.addBtnTxt}>Ekle</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={s.addRowBtn} onPress={() => setShowForm(true)} activeOpacity={0.6}>
              <Ionicons name="add-circle-outline" size={18} color={GREEN} />
              <Text style={s.addRowTxt}>Rutin ekle</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Save */}
        {items.length > 0 && !showForm && (
          <TouchableOpacity style={s.saveBtn} onPress={handleSave} activeOpacity={0.85}>
            <Text style={s.saveTxt}>Kaydet  ·  {items.length} rutin</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── TimeField — used by index.tsx quick edit ────────────────────────────────
export function TimeField({ label, hour, min, onTimeChange, weekMode, weekHour, weekMin, onWeekTimeChange }: any) {
  const [show, setShow] = useState(false);
  const h = weekMode ? weekHour : hour;
  const m = weekMode ? weekMin : min;
  const date = new Date();
  date.setHours(parseInt(h || '0', 10));
  date.setMinutes(parseInt(m || '0', 10));

  const onChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (event.type === 'set' || Platform.OS === 'ios') {
      if (selectedDate) {
        const newH = String(selectedDate.getHours()).padStart(2, '0');
        const newM = String(selectedDate.getMinutes()).padStart(2, '0');
        weekMode ? onWeekTimeChange(newH, newM) : onTimeChange(newH, newM);
      }
    } else { setShow(false); }
  };

  return (
    <View style={s.tfField}>
      {!!label && <Text style={s.tfLabel}>{label}</Text>}
      {Platform.OS === 'ios' ? (
        <View style={{ overflow: 'hidden' }}>
          <DateTimePicker value={date} mode="time" display="spinner" is24Hour onChange={onChange} style={{ width: '100%', height: 120 }} />
        </View>
      ) : (
        <>
          <TouchableOpacity style={s.tfAndroid} onPress={() => setShow(true)}>
            <Ionicons name="time-outline" size={22} color={TEXT2} style={{ marginRight: 8 }} />
            <Text style={s.tfAndroidTxt}>{h}:{m}</Text>
          </TouchableOpacity>
          {show && <DateTimePicker value={date} mode="time" display="spinner" is24Hour onChange={onChange} />}
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 24, color: TEXT, fontWeight: '900', letterSpacing: -0.5 },

  // Main card — shadow yerine clean card
  card: {
    marginHorizontal: 16, backgroundColor: CARD, borderRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },

  setNameInput: {
    fontSize: 18, fontWeight: '700', color: TEXT,
    paddingHorizontal: 20, paddingVertical: 20,
  },

  divider: { height: 0.5, backgroundColor: BORDER },

  itemsSection: {},
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14 },
  itemRowBorder: { borderBottomWidth: 0.5, borderBottomColor: BORDER },
  itemDot: { width: 8, height: 8, borderRadius: 4 },
  itemTitle: { fontSize: 13, fontWeight: '600', color: TEXT },
  itemMeta: { fontSize: 11, color: TEXT3, marginTop: 2 },

  // Inline form
  form: { padding: 16, gap: 12 },
  formTitleInput: {
    fontSize: 16, fontWeight: '600', color: TEXT,
    backgroundColor: SURFACE, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
  },

  dropdownTrigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: SURFACE, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13,
  },
  dropdownValue: { fontSize: 14, fontWeight: '700', color: TEXT },
  dropdownList: {
    position: 'absolute',
    backgroundColor: BG, borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 12,
  },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 13,
  },
  dropdownItemBorder: { borderBottomWidth: 0.5, borderBottomColor: BORDER },
  dropdownItemOn: { backgroundColor: GREEN + '12' },
  dropdownItemTxt: { fontSize: 14, color: TEXT2, fontWeight: '500' },
  dropdownItemTxtOn: { color: TEXT, fontWeight: '700' },

  dayRow: { flexDirection: 'row', gap: 5 },
  dayChip: { flex: 1, aspectRatio: 1, borderRadius: 999, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' },
  dayChipOn: { backgroundColor: TEXT },
  dayChipTxt: { fontSize: 11, fontWeight: '700', color: TEXT2 },

  calGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  calCell: { width: '12%', aspectRatio: 1, borderRadius: 10, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' },
  calCellOn: { backgroundColor: GREEN },
  calCellTxt: { fontSize: 12, fontWeight: '700', color: TEXT2 },

  timeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: SURFACE, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 13,
  },
  timeLbl: { fontSize: 13, color: TEXT2, flex: 1 },
  timeBtnTxt: { fontSize: 16, fontWeight: '800', color: TEXT, letterSpacing: 0.5 },

  formBtns: { flexDirection: 'row', gap: 8, marginTop: 4 },
  cancelBtn: { flex: 1, borderRadius: 999, paddingVertical: 13, alignItems: 'center', backgroundColor: SURFACE },
  cancelTxt: { fontSize: 14, color: TEXT2, fontWeight: '700' },
  addBtn: { flex: 2, borderRadius: 999, paddingVertical: 13, alignItems: 'center', backgroundColor: GREEN },
  addBtnOff: { backgroundColor: SURFACE },
  addBtnTxt: { fontSize: 14, color: '#fff', fontWeight: '800' },

  addRowBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 16 },
  addRowTxt: { fontSize: 14, color: GREEN, fontWeight: '700' },

  // Save — full-width sticky pill
  saveBtn: {
    marginHorizontal: 16, marginTop: 14, backgroundColor: GREEN,
    borderRadius: 999, paddingVertical: 16, alignItems: 'center',
    shadowColor: GREEN, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  saveTxt: { fontSize: 16, color: '#fff', fontWeight: '900', letterSpacing: 0.2 },

  // TimeField (for index.tsx)
  tfField: { marginBottom: 20 },
  tfLabel: { fontSize: 11, color: TEXT3, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 },
  tfAndroid: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  tfAndroidTxt: { fontSize: 22, color: TEXT, fontWeight: '600', letterSpacing: 1 },
});
