import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';

const BG = '#FCF7F0'; const SURFACE = '#F5EDE0'; const BORDER = '#B2B7AA';
const TEXT = '#0A3B25'; const TEXT2 = '#3D6B58'; const TEXT3 = '#B2B7AA';
const GREEN = '#2A6151';

const SET_ICONS = [
  'star-outline', 'barbell-outline', 'walk-outline', 'bicycle-outline', 'restaurant-outline',
  'water-outline', 'bed-outline', 'book-outline', 'briefcase-outline',
  'code-slash-outline', 'brush-outline', 'musical-notes-outline', 'heart-outline',
  'leaf-outline', 'sunny-outline', 'moon-outline', 'people-outline',
  'home-outline', 'cash-outline', 'trophy-outline', 'medkit-outline',
  'flame-outline', 'color-palette-outline', 'fitness-outline',
] as const;

export default function CategorySelectScreen() {
  const router = useRouter();
  const user = useStore(s => s.user);
  const setSelectedCategory = useStore(s => s.setSelectedCategory);

  const existingSets = (() => {
    const map = new Map<string, { name: string; icon: string }>();
    user.routines.forEach(r => {
      if (r.setName && !map.has(r.setName)) {
        map.set(r.setName, { name: r.setName, icon: r.setIcon ?? 'star-outline' });
      }
    });
    return Array.from(map.values());
  })();

  const handleSelect = (set: { name: string; icon: string }) => {
    setSelectedCategory(set);
    router.back();
  };

  const handleCreateNew = () => {
    setSelectedCategory({ name: 'new', icon: 'add-circle-outline' });
    router.back();
  };

  const renderItem = ({ item }: { item: { name: string; icon: string } }) => (
    <TouchableOpacity style={s.item} onPress={() => handleSelect(item)} activeOpacity={0.7}>
      <View style={s.itemIcon}>
        <Ionicons name={item.icon as any} size={18} color={GREEN} />
      </View>
      <Text style={s.itemName}>{item.name}</Text>
      <Ionicons name="chevron-forward" size={18} color={TEXT3} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={TEXT} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Kategori Seç</Text>
      </View>

      <FlatList
        data={existingSets}
        keyExtractor={item => item.name}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="grid-outline" size={40} color={TEXT3} />
            <Text style={s.emptyTxt}>Henüz kategori yok</Text>
          </View>
        }
        ListFooterComponent={
          <TouchableOpacity style={s.newBtn} onPress={handleCreateNew} activeOpacity={0.7}>
            <View style={s.newBtnIcon}>
              <Ionicons name="add-circle-outline" size={20} color={GREEN} />
            </View>
            <Text style={s.newBtnTxt}>Yeni kategori oluştur</Text>
          </TouchableOpacity>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, color: TEXT, fontWeight: '700', marginLeft: 12 },
  list: { padding: 16, gap: 4 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12, backgroundColor: SURFACE },
  itemIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },
  itemName: { flex: 1, fontSize: 15, color: TEXT, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTxt: { fontSize: 14, color: TEXT3 },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16, marginTop: 12 },
  newBtnIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: GREEN + '15', alignItems: 'center', justifyContent: 'center' },
  newBtnTxt: { fontSize: 15, color: GREEN, fontWeight: '600' },
});
