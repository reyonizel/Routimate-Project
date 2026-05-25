import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useStore } from '../store/useStore';
import { localDateStr } from '../lib/date';

const BG = '#EEE3D0'; const SURFACE = '#F5EDE0'; const CARD = '#FFFFFF';
const TEXT = '#0A3B25'; const TEXT2 = '#3D6B58'; const TEXT3 = '#B2B7AA';
const GREEN = '#2A6151'; const BORDER = '#B2B7AA'; const PILL = 999;
const GOLD = '#D8C2A4';

const FREQ_LABEL: Record<string, string> = { daily: 'Günlük', weekly: 'Haftalık', monthly: 'Aylık' };

const CAT_COLORS = ['#E91E63','#9C27B0','#3F51B5','#2196F3','#00ACC1','#00897B','#F4511E','#6D4C41','#546E7A','#558B2F'];
function catColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return CAT_COLORS[Math.abs(h) % CAT_COLORS.length];
}

const SET_ICONS = [
  'star-outline', 'barbell-outline', 'walk-outline', 'bicycle-outline', 'restaurant-outline',
  'water-outline', 'bed-outline', 'book-outline', 'briefcase-outline',
  'code-slash-outline', 'brush-outline', 'musical-notes-outline', 'heart-outline',
  'leaf-outline', 'sunny-outline', 'moon-outline', 'people-outline',
  'home-outline', 'cash-outline', 'trophy-outline', 'medkit-outline',
  'flame-outline', 'color-palette-outline', 'fitness-outline',
] as const;

export default function SetPanelScreen() {
  const router = useRouter();
  const { setName } = useLocalSearchParams<{ setName: string }>();
  const setKey = setName ?? '';

  const user = useStore(s => s.user);
  const renameSet = useStore(s => s.renameSet);
  const deleteSet = useStore(s => s.deleteSet);
  const toggleSetActive = useStore(s => s.toggleSetActive);
  const updateRoutine = useStore(s => s.updateRoutine);

  const routines = user.routines.filter(r => r.setName === setKey);
  const isInactive = (user.inactiveSets ?? []).includes(setKey);
  const today = localDateStr();
  const setIcon = routines[0]?.setIcon ?? 'star-outline';
  const cc = catColor(setKey);

  const [editingSetName, setEditingSetName] = useState(false);
  const [setNameVal, setSetNameVal] = useState(setKey);
  const [showIconPicker, setShowIconPicker] = useState(false);


  const saveSetName = () => {
    const trimmed = setNameVal.trim();
    setEditingSetName(false);
    if (!trimmed || trimmed === setKey) return;
    renameSet(setKey, trimmed);
    router.back();
  };

  const handleIconSelect = (icon: string) => {
    routines.forEach(r => updateRoutine(r.id, { setIcon: icon }));
    setShowIconPicker(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Seti Sil',
      `"${setKey}" seti ve içindeki ${routines.length} rutin silinecek. Emin misin?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: () => { deleteSet(setKey); router.back(); } },
      ]
    );
  };

  if (routines.length === 0) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={22} color={TEXT} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>{setKey}</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: TEXT3, fontSize: 14 }}>Set bulunamadı</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>

      {/* ── Header ─────────────────────────────── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={TEXT} />
        </TouchableOpacity>

        <TouchableOpacity style={s.iconBtn} onPress={() => setShowIconPicker(true)} activeOpacity={0.75}>
          <View style={[s.iconCircle, { backgroundColor: isInactive ? SURFACE : cc }]}>
            <Ionicons name={setIcon as any} size={20} color={isInactive ? TEXT3 : '#fff'} />
          </View>
        </TouchableOpacity>

        {editingSetName ? (
          <TextInput
            style={s.setNameInput}
            value={setNameVal}
            onChangeText={setSetNameVal}
            onBlur={saveSetName}
            onSubmitEditing={saveSetName}
            autoFocus
            maxLength={40}
            returnKeyType="done"
          />
        ) : (
          <TouchableOpacity style={{ flex: 1 }} onPress={() => { setSetNameVal(setKey); setEditingSetName(true); }} activeOpacity={0.7}>
            <Text style={[s.headerTitle, isInactive && { color: TEXT3 }]} numberOfLines={1}>{setKey}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={s.actionIconBtn} onPress={() => toggleSetActive(setKey)} activeOpacity={0.7}>
          <Ionicons name={isInactive ? 'eye-outline' : 'eye-off-outline'} size={22} color={isInactive ? GREEN : TEXT3} />
        </TouchableOpacity>

        <TouchableOpacity style={s.actionIconBtn} onPress={handleDelete} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <Text style={s.countLabel}>{routines.length} adet rutin</Text>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Rutin Listesi ─────────────────────── */}
        {routines.map((r, i) => {
          const done = r.completedDates.includes(today);
          return (
            <View key={r.id}>
              <TouchableOpacity
                style={s.taskRow}
                onPress={() => router.push({ pathname: '/routine-edit', params: { id: r.id } })}
                activeOpacity={0.7}
              >
                <View style={[s.catIcon, { backgroundColor: isInactive ? SURFACE : cc }]}>
                  <Ionicons name={setIcon as any} size={16} color={isInactive ? TEXT3 : '#fff'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.taskName, done && s.taskNameDone]}>{r.name}</Text>
                  <Text style={s.taskMeta}>{FREQ_LABEL[r.frequency]} · {r.completedDates.length} tamamlama</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={TEXT3} />
              </TouchableOpacity>
              {i < routines.length - 1 && <View style={s.taskDivider} />}
            </View>
          );
        })}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* ── İkon Seçici Modal ────────────────────── */}
      <Modal visible={showIconPicker} transparent animationType="slide" onRequestClose={() => setShowIconPicker(false)}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowIconPicker(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} />
        </TouchableOpacity>
        <View style={s.iconPickerSheet}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>İkon Seç</Text>
          <View style={s.iconActionsCard}>
            <View style={s.iconGrid}>
              {SET_ICONS.map(icon => {
                const on = icon === setIcon;
                return (
                  <TouchableOpacity
                    key={icon}
                    style={[s.iconCell, on && { backgroundColor: cc }]}
                    onPress={() => handleIconSelect(icon)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={icon} size={22} color={on ? '#fff' : TEXT2} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <TouchableOpacity style={s.sheetCloseBtn} onPress={() => setShowIconPicker(false)} activeOpacity={0.8}>
            <Text style={s.sheetCloseTxt}>Kapat</Text>
          </TouchableOpacity>
        </View>
      </Modal>

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
  iconBtn: { padding: 2 },
  iconCircle: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: TEXT, letterSpacing: -0.3 },
  setNameInput: {
    flex: 1, fontSize: 18, fontWeight: '800', color: TEXT,
    backgroundColor: SURFACE, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  actionIconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center',
  },

  countLabel: {
    fontSize: 12, fontWeight: '600', color: TEXT3,
    paddingHorizontal: 16, paddingBottom: 10, marginTop: -2,
  },

  taskRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 13, paddingHorizontal: 16,
    backgroundColor: SURFACE,
  },
  taskDivider: { height: 1, backgroundColor: BORDER, marginHorizontal: 20 },
  catIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  taskName: { fontSize: 14, color: TEXT, fontWeight: '500' },
  taskNameDone: { color: TEXT3, textDecorationLine: 'line-through' },
  taskMeta: { fontSize: 11, color: TEXT3, marginTop: 2 },

  iconPickerSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: GOLD, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 8, paddingBottom: 40, paddingHorizontal: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 24, elevation: 20,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: SURFACE, alignSelf: 'center', marginBottom: 14,
  },
  sheetTitle: { fontSize: 15, fontWeight: '800', color: TEXT, marginBottom: 10, letterSpacing: -0.2 },
  iconActionsCard: {
    backgroundColor: SURFACE, borderRadius: 16, overflow: 'hidden', marginBottom: 10,
  },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12 },
  iconCell: {
    width: 46, height: 46, borderRadius: 13,
    backgroundColor: BG, alignItems: 'center', justifyContent: 'center',
  },
  sheetCloseBtn: {
    backgroundColor: SURFACE, borderRadius: 16, paddingVertical: 14, alignItems: 'center',
  },
  sheetCloseTxt: { fontSize: 14, fontWeight: '700', color: TEXT2 },
});
