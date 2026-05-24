import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Modal, FlatList, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export type LocationResult = {
  label: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
};

type Props = {
  value: string;
  onSelect: (result: LocationResult) => void;
  accentColor?: string;
  placeholder?: string;
};

const TEXT  = '#111111'; const TEXT2 = '#767676'; const TEXT3 = '#B2B7AA';
const BORDER = '#E8E8E8'; const CARD = '#F4F4F4'; const BG = '#FFFFFF';

export default function LocationSearch({
  value,
  onSelect,
  accentColor = '#00bf63',
  placeholder = 'Şehir ara...',
}: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState<LocationResult[]>([]);
  const [loading, setLoading]   = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(value || '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (text: string) => {
    if (text.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const res  = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(text)}&count=8&language=tr&format=json`,
        { signal: controller.signal }
      );
      const data = await res.json();
      const items: any[] = data.results ?? [];
      setResults(items.map(r => {
        const parts = [r.name, r.admin1 !== r.name ? r.admin1 : null, r.country].filter(Boolean);
        return {
          label:   parts.join(', '),
          city:    r.name ?? '',
          country: r.country ?? '',
          lat: r.latitude,
          lon: r.longitude,
        };
      }));
    } catch {
      setResults([]);
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  }, []);

  const handleChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(text), 300);
  };

  const handleOpen = () => {
    setQuery('');
    setResults([]);
    setModalVisible(true);
  };

  const handleClose = () => {
    setModalVisible(false);
    setQuery('');
    setResults([]);
  };

  const handleSelect = (result: LocationResult) => {
    setSelectedLabel(result.label);
    setModalVisible(false);
    onSelect(result);
  };

  return (
    <View>
      {/* Trigger — tapping opens the search modal */}
      <TouchableOpacity
        style={s.trigger}
        onPress={handleOpen}
        activeOpacity={0.8}
      >
        <View style={[s.triggerIconWrap, { backgroundColor: selectedLabel ? accentColor + '18' : CARD }]}>
          <Ionicons
            name={selectedLabel ? 'location' : 'search-outline'}
            size={18}
            color={selectedLabel ? accentColor : TEXT3}
          />
        </View>
        <Text style={[s.triggerTxt, !selectedLabel && s.triggerPlaceholder]} numberOfLines={1}>
          {selectedLabel || placeholder}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={TEXT3} />
      </TouchableOpacity>

      {/* Full-screen search modal — avoids all clipping issues */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
        onRequestClose={handleClose}
      >
        <SafeAreaView style={s.modal} edges={['top', 'bottom']}>

          {/* Header */}
          <View style={s.modalHeader}>
            <TouchableOpacity style={s.closeBtn} onPress={handleClose} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={TEXT} />
            </TouchableOpacity>
            <Text style={s.modalTitle}>Konum Seç</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Search input */}
          <View style={s.searchRow}>
            <Ionicons name="search-outline" size={18} color={TEXT3} />
            <TextInput
              autoFocus
              style={s.searchInput}
              value={query}
              onChangeText={handleChange}
              placeholder="Şehir veya ilçe ara..."
              placeholderTextColor={TEXT3}
              autoCapitalize="none"
              autoCorrect={false}
              selectionColor={accentColor}
              returnKeyType="search"
            />
            {loading && <ActivityIndicator size="small" color={TEXT3} />}
            {!loading && query.length > 0 && (
              <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color={TEXT3} />
              </TouchableOpacity>
            )}
          </View>

          {/* States */}
          {query.length < 2 ? (
            <View style={s.emptyState}>
              <Ionicons name="location-outline" size={40} color={TEXT3} />
              <Text style={s.emptyTxt}>Aramak için yazmaya başla</Text>
            </View>
          ) : !loading && results.length === 0 ? (
            <View style={s.emptyState}>
              <Ionicons name="search-outline" size={40} color={TEXT3} />
              <Text style={s.emptyTxt}>Sonuç bulunamadı</Text>
              <Text style={s.emptyHint}>Farklı bir şehir veya ilçe adı dene</Text>
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(_, i) => String(i)}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={s.separator} />}
              renderItem={({ item }) => (
                <TouchableOpacity style={s.resultRow} onPress={() => handleSelect(item)} activeOpacity={0.7}>
                  <View style={[s.resultIcon, { backgroundColor: accentColor + '18' }]}>
                    <Ionicons name="location-outline" size={16} color={accentColor} />
                  </View>
                  <Text style={s.resultTxt} numberOfLines={2}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={14} color={TEXT3} />
                </TouchableOpacity>
              )}
            />
          )}

        </SafeAreaView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  // Trigger button
  trigger: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: CARD, borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  triggerIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  triggerTxt:         { flex: 1, fontSize: 15, color: TEXT },
  triggerPlaceholder: { color: TEXT3 },

  // Modal shell
  modal: { flex: 1, backgroundColor: BG },

  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: BORDER,
  },
  closeBtn:   { width: 36, height: 36, borderRadius: 18, backgroundColor: CARD, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 17, fontWeight: '800', color: TEXT },

  // Search input row
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    margin: 16, paddingHorizontal: 16, paddingVertical: 13,
    backgroundColor: CARD, borderRadius: 14,
  },
  searchInput: { flex: 1, fontSize: 16, color: TEXT },

  // Result list
  resultRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingVertical: 14,
  },
  resultIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  resultTxt:  { flex: 1, fontSize: 15, color: TEXT, lineHeight: 20 },
  separator:  { height: 0.5, backgroundColor: BORDER, marginHorizontal: 20 },

  // Empty states
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingBottom: 80 },
  emptyTxt:   { fontSize: 15, color: TEXT2, fontWeight: '600' },
  emptyHint:  { fontSize: 13, color: TEXT3 },
});
