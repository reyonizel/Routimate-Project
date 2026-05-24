import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';

const BG = '#EEE3D0'; const SURFACE = '#F5EDE0'; const BORDER = '#B2B7AA';
const TEXT = '#0A3B25'; const TEXT2 = '#3D6B58'; const TEXT3 = '#B2B7AA';
const GREEN = '#2A6151'; const PILL = 999;

const PRESET_CATEGORIES = [
  { name: 'Spor', icon: 'barbell-outline' },
  { name: 'Beslenme', icon: 'restaurant-outline' },
  { name: 'Uyku', icon: 'bed-outline' },
  { name: 'Okuma', icon: 'book-outline' },
  { name: 'Meditasyon', icon: 'leaf-outline' },
  { name: 'Çalışma', icon: 'briefcase-outline' },
  { name: 'Su İçme', icon: 'water-outline' },
  { name: 'Yürüyüş', icon: 'walk-outline' },
] as const;

const SET_ICONS = [
  'star-outline', 'barbell-outline', 'walk-outline', 'bicycle-outline', 'restaurant-outline',
  'water-outline', 'bed-outline', 'book-outline', 'briefcase-outline',
  'code-slash-outline', 'brush-outline', 'musical-notes-outline', 'heart-outline',
  'leaf-outline', 'sunny-outline', 'moon-outline', 'people-outline',
  'home-outline', 'cash-outline', 'trophy-outline', 'medkit-outline',
  'flame-outline', 'color-palette-outline', 'fitness-outline',
] as const;

type SetIcon = typeof SET_ICONS[number];

export default function CategorySelectScreen() {
  const router = useRouter();
  const user = useStore(s => s.user);
  const setSelectedCategory = useStore(s => s.setSelectedCategory);

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState<SetIcon>('star-outline');

  const existingSets = (() => {
    const map = new Map<string, { name: string; icon: string }>();
    user.routines.forEach(r => {
      if (r.setName && !map.has(r.setName)) {
        map.set(r.setName, { name: r.setName, icon: r.setIcon ?? 'star-outline' });
      }
    });
    return Array.from(map.values());
  })();

  const existingNames = new Set(existingSets.map(s => s.name));
  const suggestedPresets = PRESET_CATEGORIES.filter(p => !existingNames.has(p.name));

  const handleSelect = (set: { name: string; icon: string }) => {
    setSelectedCategory(set);
    router.back();
  };

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setSelectedCategory({ name: trimmed, icon: newIcon });
    router.back();
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={TEXT} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Kategori Seç</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Mevcut kategoriler */}
          {existingSets.length > 0 && (
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Kategorilerim</Text>
              </View>
              {existingSets.map((item, i) => (
                <TouchableOpacity
                  key={item.name}
                  style={[s.item, i < existingSets.length - 1 && s.itemBorder]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={s.itemIconBox}>
                    <Ionicons name={item.icon as any} size={18} color={GREEN} />
                  </View>
                  <Text style={s.itemName}>{item.name}</Text>
                  <Ionicons name="chevron-forward" size={16} color={TEXT3} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Hazır kategoriler */}
          {suggestedPresets.length > 0 && (
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Hazır Kategoriler</Text>
              </View>
              {suggestedPresets.map((item, i) => (
                <TouchableOpacity
                  key={item.name}
                  style={[s.item, i < suggestedPresets.length - 1 && s.itemBorder]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={s.itemIconBox}>
                    <Ionicons name={item.icon as any} size={18} color={GREEN} />
                  </View>
                  <Text style={s.itemName}>{item.name}</Text>
                  <Ionicons name="chevron-forward" size={16} color={TEXT3} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Yeni kategori oluştur */}
          {!creating ? (
            <TouchableOpacity style={s.newBtn} onPress={() => setCreating(true)} activeOpacity={0.7}>
              <View style={s.newBtnIcon}>
                <Ionicons name="add" size={20} color={GREEN} />
              </View>
              <Text style={s.newBtnTxt}>Yeni kategori oluştur</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.createBox}>
              <Text style={s.createTitle}>Yeni Kategori</Text>

              {/* İsim */}
              <TextInput
                style={s.nameInput}
                value={newName}
                onChangeText={setNewName}
                placeholder="Kategori adı..."
                placeholderTextColor={TEXT3}
                maxLength={30}
                autoFocus
              />

              {/* İkon seçimi */}
              <Text style={s.iconLabel}>İkon seç</Text>
              <View style={s.iconGrid}>
                {SET_ICONS.map(icon => {
                  const on = newIcon === icon;
                  return (
                    <TouchableOpacity
                      key={icon}
                      style={[s.iconCell, on && s.iconCellOn]}
                      onPress={() => setNewIcon(icon)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name={icon} size={20} color={on ? '#fff' : TEXT2} />
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Butonlar */}
              <View style={s.createBtns}>
                <TouchableOpacity
                  style={s.cancelBtn}
                  onPress={() => { setCreating(false); setNewName(''); setNewIcon('star-outline'); }}
                  activeOpacity={0.7}
                >
                  <Text style={s.cancelTxt}>Vazgeç</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.createBtn, !newName.trim() && s.createBtnOff]}
                  onPress={handleCreate}
                  disabled={!newName.trim()}
                  activeOpacity={0.85}
                >
                  <Text style={[s.createBtnTxt, !newName.trim() && { color: TEXT3 }]}>Oluştur</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: BORDER,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, color: TEXT, fontWeight: '700' },

  section: { marginHorizontal: 16, marginTop: 16, borderRadius: 16, overflow: 'hidden', backgroundColor: SURFACE },
  sectionHeader: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: TEXT3, letterSpacing: 0.6, textTransform: 'uppercase' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 14 },
  itemBorder: { borderBottomWidth: 0.5, borderBottomColor: BORDER },
  itemIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },
  itemName: { flex: 1, fontSize: 15, color: TEXT, fontWeight: '600' },

  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTxt: { fontSize: 14, color: TEXT3 },

  newBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginTop: 16,
    paddingVertical: 14, paddingHorizontal: 14,
    backgroundColor: GREEN + '12', borderRadius: 16,
  },
  newBtnIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: GREEN + '20', alignItems: 'center', justifyContent: 'center' },
  newBtnTxt: { fontSize: 15, color: GREEN, fontWeight: '700' },

  createBox: { marginHorizontal: 16, marginTop: 16, backgroundColor: SURFACE, borderRadius: 16, padding: 16, gap: 14 },
  createTitle: { fontSize: 16, fontWeight: '800', color: TEXT, letterSpacing: -0.2 },

  nameInput: {
    fontSize: 16, fontWeight: '600', color: TEXT,
    backgroundColor: BG, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
  },

  iconLabel: { fontSize: 12, fontWeight: '700', color: TEXT3, letterSpacing: 0.5 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconCell: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: BG, alignItems: 'center', justifyContent: 'center',
  },
  iconCellOn: { backgroundColor: GREEN },

  createBtns: { flexDirection: 'row', gap: 8 },
  cancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: PILL,
    backgroundColor: BG, alignItems: 'center',
  },
  cancelTxt: { fontSize: 14, fontWeight: '600', color: TEXT2 },
  createBtn: {
    flex: 1, paddingVertical: 12, borderRadius: PILL,
    backgroundColor: GREEN, alignItems: 'center',
  },
  createBtnOff: { backgroundColor: BG },
  createBtnTxt: { fontSize: 14, fontWeight: '800', color: '#fff' },
});
