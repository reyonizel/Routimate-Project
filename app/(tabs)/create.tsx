import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore, Routine } from '../../store/useStore';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';

type Frequency = 'daily' | 'weekly' | 'monthly';

const FREQ_OPTIONS: { value: Frequency; label: string }[] = [
  { value: 'daily', label: 'Günlük' },
  { value: 'weekly', label: 'Haftalık' },
  { value: 'monthly', label: 'Aylık' },
];

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTE_OPTIONS = ['00', '15', '30', '45'];

export default function CreateScreen() {
  const user = useStore((s) => s.user);
  const addRoutine = useStore((s) => s.addRoutine);
  const accentColor = user.gender === 'female' ? Colors.female : Colors.male;

  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [hour, setHour] = useState('09');
  const [minute, setMinute] = useState('00');
  const [showHourPicker, setShowHourPicker] = useState(false);
  const [showMinPicker, setShowMinPicker] = useState(false);

  const handleCreate = () => {
    if (!name.trim()) {
      Alert.alert('Hata', 'Rutin adı boş bırakılamaz.');
      return;
    }

    const routine: Routine = {
      id: Date.now().toString(),
      name: name.trim(),
      frequency,
      notificationTime: `${hour}:${minute}`,
      completedDates: [],
      createdAt: new Date().toISOString(),
    };

    addRoutine(routine);
    setName('');
    setFrequency('daily');
    setHour('09');
    setMinute('00');
    Alert.alert('✓ Başarılı', `"${routine.name}" rutini eklendi!`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Rutin Oluştur</Text>
          <Text style={styles.subtitle}>Yeni bir alışkanlık başlat</Text>
        </View>

        {/* Name Input */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Rutin Adı</Text>
          <View style={[styles.inputWrap, { borderColor: name.length > 0 ? accentColor + '66' : Colors.cardBorder }]}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={(t) => setName(t.substring(0, 50))}
              placeholder="Örnek: Sabah koşusu..."
              placeholderTextColor={Colors.textMuted}
              maxLength={50}
              returnKeyType="done"
            />
            <Text style={[styles.charCount, name.length > 40 ? { color: Colors.danger } : {}]}>
              {name.length}/50
            </Text>
          </View>
        </View>

        {/* Frequency Segmented Control */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Sıklık</Text>
          <View style={styles.segmentedControl}>
            {FREQ_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.segment,
                  frequency === opt.value && {
                    backgroundColor: accentColor,
                  },
                ]}
                onPress={() => setFrequency(opt.value)}
              >
                <Text style={[
                  styles.segmentText,
                  frequency === opt.value && { color: '#fff' },
                ]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Time Picker */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Bildirim Saati</Text>
          <View style={styles.timeRow}>
            {/* Hour */}
            <TouchableOpacity
              style={[styles.timePicker, { borderColor: showHourPicker ? accentColor : Colors.cardBorder }]}
              onPress={() => { setShowHourPicker(!showHourPicker); setShowMinPicker(false); }}
            >
              <Text style={styles.timeValue}>{hour}</Text>
              <Text style={styles.timeUnit}>saat</Text>
            </TouchableOpacity>

            <Text style={styles.timeSep}>:</Text>

            {/* Minute */}
            <TouchableOpacity
              style={[styles.timePicker, { borderColor: showMinPicker ? accentColor : Colors.cardBorder }]}
              onPress={() => { setShowMinPicker(!showMinPicker); setShowHourPicker(false); }}
            >
              <Text style={styles.timeValue}>{minute}</Text>
              <Text style={styles.timeUnit}>dakika</Text>
            </TouchableOpacity>

            <View style={styles.timeDisplay}>
              <Text style={[styles.timeDisplayText, { color: accentColor }]}>⏰ {hour}:{minute}</Text>
            </View>
          </View>

          {/* Hour options */}
          {showHourPicker && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
              {HOUR_OPTIONS.map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[styles.pickerOption, hour === h && { backgroundColor: accentColor }]}
                  onPress={() => { setHour(h); setShowHourPicker(false); }}
                >
                  <Text style={[styles.pickerOptionText, hour === h && { color: '#fff' }]}>{h}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Minute options */}
          {showMinPicker && (
            <View style={styles.pickerRow}>
              {MINUTE_OPTIONS.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.pickerOption, styles.pickerOptionLg, minute === m && { backgroundColor: accentColor }]}
                  onPress={() => { setMinute(m); setShowMinPicker(false); }}
                >
                  <Text style={[styles.pickerOptionText, minute === m && { color: '#fff' }]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Preview Card */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Önizleme</Text>
          <View style={styles.previewCard}>
            <View style={[styles.previewDot, { backgroundColor: accentColor }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.previewName}>{name || 'Rutin adı giriniz...'}</Text>
              <Text style={styles.previewMeta}>
                {FREQ_OPTIONS.find(f => f.value === frequency)?.label} · {hour}:{minute}
              </Text>
            </View>
          </View>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[
            styles.createBtn,
            { backgroundColor: name.trim() ? accentColor : Colors.surfaceAlt },
          ]}
          onPress={handleCreate}
          activeOpacity={0.8}
        >
          <Text style={[styles.createBtnText, !name.trim() && { color: Colors.textMuted }]}>
            Rutin Oluştur ✦
          </Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSize.xxl,
    color: Colors.text,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  formSection: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  inputWrap: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
    paddingVertical: 16,
  },
  charCount: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: 4,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  segmentText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timePicker: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    alignItems: 'center',
    minWidth: 72,
  },
  timeValue: {
    fontSize: FontSize.xxl,
    color: Colors.text,
    fontWeight: '800',
  },
  timeUnit: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  timeSep: {
    fontSize: FontSize.xxl,
    color: Colors.textMuted,
    fontWeight: '300',
  },
  timeDisplay: {
    flex: 1,
    alignItems: 'flex-end',
  },
  timeDisplayText: {
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  pickerScroll: {
    marginTop: Spacing.sm,
  },
  pickerRow: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    gap: 8,
  },
  pickerOption: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
  },
  pickerOptionLg: {
    flex: 1,
    alignItems: 'center',
  },
  pickerOptionText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  previewCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
    gap: 12,
  },
  previewDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  previewName: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '600',
  },
  previewMeta: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  createBtn: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    paddingVertical: 18,
    alignItems: 'center',
  },
  createBtnText: {
    fontSize: FontSize.lg,
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
