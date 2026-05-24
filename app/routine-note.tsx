import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useStore } from '../store/useStore';
import { getAppDate } from '../lib/date';

const BG = '#EEE3D0'; const CARD = '#FFFFFF'; const SURFACE = '#F5EDE0';
const TEXT = '#0A3B25'; const TEXT2 = '#3D6B58'; const TEXT3 = '#B2B7AA';
const GREEN = '#2A6151'; const BORDER = '#B2B7AA';

const CAT_COLORS = ['#E91E63','#9C27B0','#3F51B5','#2196F3','#00ACC1','#00897B','#F4511E','#6D4C41','#546E7A','#558B2F'];
function catColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return CAT_COLORS[Math.abs(h) % CAT_COLORS.length];
}

export default function RoutineNoteScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useStore(s => s.user);
  const addRoutineNote = useStore(s => s.addRoutineNote);
  const today = getAppDate(user.dayEndHour ?? 0);

  const routine = user.routines.find(r => r.id === id);
  const [noteText, setNoteText] = useState('');

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

  const cc = routine.setName ? catColor(routine.setName) : TEXT3;
  const existingNotes = [...(routine.notes ?? [])].reverse();

  const handleSave = () => {
    if (!noteText.trim()) return;
    addRoutineNote(routine.id, today, noteText.trim());
    setNoteText('');
    router.back();
  };

  const todayFormatted = new Date(today + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={22} color={TEXT} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Not Ekle</Text>
          <TouchableOpacity
            style={[s.saveBtn, !noteText.trim() && s.saveBtnOff]}
            onPress={handleSave}
            disabled={!noteText.trim()}
            activeOpacity={0.8}
          >
            <Text style={[s.saveTxt, !noteText.trim() && { color: TEXT3 }]}>Kaydet</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Rutin chip */}
          <View style={s.routineChipRow}>
            <View style={[s.routineChip, { borderColor: routine.setName ? cc : BORDER }]}>
              <View style={[s.chipIcon, { backgroundColor: routine.setName ? cc : SURFACE }]}>
                <Ionicons name={(routine.setIcon as any) || 'star-outline'} size={11} color={routine.setName ? '#fff' : TEXT3} />
              </View>
              <Text style={s.routineChipTxt}>{routine.name}</Text>
            </View>
            <Text style={s.dateChip}>{todayFormatted}</Text>
          </View>

          {/* Not girişi */}
          <View style={s.inputCard}>
            <TextInput
              style={s.noteInput}
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Bugün nasıl geçti? Ne hissediyorsun?..."
              placeholderTextColor={TEXT3}
              multiline
              autoFocus
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={s.charCount}>{noteText.length}/500</Text>
          </View>

          {/* Önceki notlar */}
          {existingNotes.length > 0 && (
            <View style={{ paddingHorizontal: 16 }}>
              <Text style={s.prevTitle}>ÖNCEKİ NOTLAR</Text>
              <View style={s.prevList}>
                {existingNotes.map((note, i) => (
                  <View key={note.id} style={[s.prevNote, i < existingNotes.length - 1 && s.prevNoteBorder]}>
                    <Text style={s.prevNoteDate}>
                      {new Date(note.date + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </Text>
                    <Text style={s.prevNoteTxt}>{note.text}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, color: TEXT, fontWeight: '800', letterSpacing: -0.3 },
  saveBtn: { backgroundColor: GREEN, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 9 },
  saveBtnOff: { backgroundColor: SURFACE },
  saveTxt: { fontSize: 14, color: '#fff', fontWeight: '800' },

  routineChipRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 },
  routineChip: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  chipIcon: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  routineChipTxt: { fontSize: 13, color: TEXT2, fontWeight: '600' },
  dateChip: { fontSize: 12, color: TEXT3 },

  inputCard: { marginHorizontal: 16, backgroundColor: CARD, borderRadius: 20, padding: 16, marginBottom: 20, minHeight: 140 },
  noteInput: { fontSize: 16, color: TEXT, lineHeight: 24, minHeight: 100, flex: 1 },
  charCount: { fontSize: 11, color: TEXT3, textAlign: 'right', marginTop: 8 },

  prevTitle: { fontSize: 10, fontWeight: '800', color: TEXT3, letterSpacing: 1, marginBottom: 10 },
  prevList: { backgroundColor: CARD, borderRadius: 16, overflow: 'hidden' },
  prevNote: { padding: 14 },
  prevNoteBorder: { borderBottomWidth: 0.5, borderBottomColor: BORDER },
  prevNoteDate: { fontSize: 11, color: TEXT3, fontWeight: '700', marginBottom: 6 },
  prevNoteTxt: { fontSize: 14, color: TEXT, lineHeight: 20 },
});

