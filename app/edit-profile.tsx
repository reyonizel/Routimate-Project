import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Platform, ActivityIndicator, KeyboardAvoidingView,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useStore } from '../store/useStore';
import LocationSearch, { LocationResult } from '../components/LocationSearch';
import { supabase } from '../lib/supabase';
import { handleError, ValidationErrors, showError } from '../lib/errors';

const BG = '#EEE3D0'; const CARD = '#FFFFFF'; const SURFACE = '#F5EDE0';
const TEXT = '#0A3B25'; const TEXT2 = '#3D6B58'; const TEXT3 = '#B2B7AA';
const GREEN = '#2A6151'; const BORDER = '#B2B7AA';

export default function EditProfileScreen() {
  const router = useRouter();
  const user = useStore(s => s.user);
  const updateUser = useStore(s => s.updateUser);
  const uploadAvatar = useStore(s => s.uploadAvatar);

  const [fullName, setFullName] = useState(user.fullName ?? '');
  const [username, setUsername] = useState(user.username ?? '');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const usernameDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [bio, setBio] = useState(user.bio ?? '');
  const [avatarUri, setAvatarUri] = useState(user.avatarUri);
  const [locationData, setLocationData] = useState<LocationResult | null>(null);
  const [locationLabel, setLocationLabel] = useState(user.locationName ?? '');

  const [birthDate, setBirthDate] = useState<Date | null>(() => {
    if (!user.birthDate) return null;
    const d = new Date(user.birthDate);
    return isNaN(d.getTime()) ? null : d;
  });
  const [showPicker, setShowPicker] = useState(false);

  const accentColor = user.gender === 'female' ? '#e91e63' : '#3498db';

  const checkUsername = useCallback((value: string) => {
    if (usernameDebounce.current) clearTimeout(usernameDebounce.current);
    const trimmed = value.trim();
    if (trimmed.length < 3) { setUsernameStatus('idle'); return; }
    if (trimmed === user.username) { setUsernameStatus('available'); return; }
    setUsernameStatus('checking');
    usernameDebounce.current = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', trimmed)
          .maybeSingle();
        setUsernameStatus(data ? 'taken' : 'available');
      } catch {
        setUsernameStatus('idle');
      }
    }, 500);
  }, [user.username]);

  const pickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { showError('İzin Gerekli', ValidationErrors.photoUploadFail); return; }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, aspect: [1, 1], quality: 0.85,
      });
      if (!result.canceled) setAvatarUri(result.assets[0].uri);
    } catch (err) {
      handleError(err);
    }
  };

  const handleSave = () => {
    const trimmed = username.trim();
    if (trimmed.length < 3) { showError('Geçersiz Kullanıcı Adı', ValidationErrors.usernameShort); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) { showError('Geçersiz Kullanıcı Adı', ValidationErrors.usernameInvalid); return; }
    if (usernameStatus === 'taken') { showError('Kullanıcı Adı Alınmış', ValidationErrors.usernameTaken); return; }
    if (usernameStatus === 'checking') { showError('Lütfen Bekle', ValidationErrors.usernameChecking); return; }
    if (user.bio && bio.trim().length > 200) { showError('Biyografi Çok Uzun', ValidationErrors.bioTooLong); return; }
    try {
      // Upload avatar to Storage if it's a local file URI
      const finalAvatarUri = avatarUri;
      const profileUpdates: Parameters<typeof updateUser>[0] = {
        fullName: fullName.trim() || undefined,
        username: trimmed,
        bio: bio.trim() || undefined,
        birthDate: birthDate ? birthDate.toISOString() : undefined,
        locationName: (locationData?.label ?? locationLabel) || undefined,
        locationLat: locationData?.lat,
        locationLon: locationData?.lon,
      };
      updateUser(profileUpdates);

      if (finalAvatarUri && finalAvatarUri !== user.avatarUri) {
        uploadAvatar(finalAvatarUri);
      }
      router.back();
    } catch (err) {
      handleError(err, 'Profil kaydedilemedi.');
    }
  };

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={TEXT} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Profili Düzenle</Text>
        <TouchableOpacity style={s.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={s.saveBtnTxt}>Kaydet</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Avatar */}
        <TouchableOpacity style={s.avatarWrap} onPress={pickAvatar} activeOpacity={0.85}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={s.avatar} contentFit="cover" />
          ) : (
            <View style={[s.avatarFallback, { backgroundColor: accentColor + '20' }]}>
              <Text style={[s.avatarLetter, { color: accentColor }]}>
                {(username || '?')[0].toUpperCase()}
              </Text>
            </View>
          )}
          <View style={[s.cameraOverlay, { backgroundColor: accentColor }]}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={s.changePhotoTxt}>Fotoğrafı değiştir</Text>

        {/* Form */}
        <View style={s.section}>
          <Field
            label="Ad Soyad"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Örn: Burhan Yılmaz"
          />
          <View style={f.wrap}>
            <Text style={f.label}>Kullanıcı Adı</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                style={[f.input, { flex: 1 }]}
                value={username}
                onChangeText={v => { setUsername(v); checkUsername(v); }}
                placeholder="kullanici_adi"
                placeholderTextColor="#B2B7AA"
                autoCapitalize="none"
                autoCorrect={false}
                selectionColor={GREEN}
              />
              {usernameStatus === 'checking' && (
                <ActivityIndicator size="small" color={TEXT3} style={{ marginLeft: 8 }} />
              )}
              {usernameStatus === 'available' && (
                <Ionicons name="checkmark-circle" size={20} color={GREEN} style={{ marginLeft: 8 }} />
              )}
              {usernameStatus === 'taken' && (
                <Ionicons name="close-circle" size={20} color="#e74c3c" style={{ marginLeft: 8 }} />
              )}
            </View>
            <View style={[f.underline, usernameStatus === 'taken' && { backgroundColor: '#e74c3c' }, usernameStatus === 'available' && { backgroundColor: GREEN }]} />
            {usernameStatus === 'taken' && (
              <Text style={{ fontSize: 12, color: '#e74c3c', marginTop: 4 }}>Bu kullanıcı adı alınmış</Text>
            )}
          </View>
          <Field
            label="Biyografi"
            value={bio}
            onChangeText={setBio}
            placeholder="Kendinden kısaca bahset..."
            multiline
          />
        </View>

        {/* Birth Date */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Doğum Tarihi</Text>
          {Platform.OS === 'ios' ? (
            <View style={s.card}>
              <DateTimePicker
                value={birthDate ?? new Date(2000, 0, 1)}
                mode="date"
                display="spinner"
                onChange={(_, d) => d && setBirthDate(d)}
                style={{ height: 120 }}
              />
            </View>
          ) : (
            <TouchableOpacity style={s.dateRow} onPress={() => setShowPicker(true)} activeOpacity={0.8}>
              <Ionicons name="calendar-outline" size={18} color={TEXT2} />
              <Text style={[s.dateValue, !birthDate && { color: TEXT3 }]}>
                {birthDate ? birthDate.toLocaleDateString('tr-TR') : 'Tarih seçin'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={TEXT3} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          )}
          {showPicker && Platform.OS === 'android' && (
            <DateTimePicker
              value={birthDate ?? new Date(2000, 0, 1)}
              mode="date"
              display="spinner"
              onChange={(e, d) => { setShowPicker(false); if (e.type === 'set' && d) setBirthDate(d); }}
            />
          )}
        </View>

        {/* Location */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Konum</Text>
          <LocationSearch
            value={locationLabel}
            accentColor={accentColor}
            placeholder="Şehir ara..."
            onSelect={result => {
              setLocationLabel(result.label);
              setLocationData(result);
            }}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label, value, onChangeText, placeholder, multiline, autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={f.wrap}>
      <Text style={[f.label, focused && { color: '#111' }]}>{label}</Text>
      <TextInput
        style={[f.input, multiline && f.inputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#B2B7AA"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        multiline={multiline}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        selectionColor="#2A6151"
      />
      <View style={[f.underline, focused && f.underlineFocused]} />
    </View>
  );
}

const f = StyleSheet.create({
  wrap: { marginBottom: 24 },
  label: { fontSize: 12, fontWeight: '700', color: '#B2B7AA', letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' },
  input: { fontSize: 16, color: '#111', paddingVertical: 6 },
  inputMulti: { minHeight: 72, textAlignVertical: 'top' },
  underline: { height: 1, backgroundColor: '#B2B7AA', marginTop: 2 },
  underlineFocused: { height: 1.5, backgroundColor: '#2A6151' },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: BORDER,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: CARD, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: TEXT },
  saveBtn: { backgroundColor: GREEN, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7 },
  saveBtnTxt: { fontSize: 14, fontWeight: '800', color: '#fff' },

  scroll: { paddingHorizontal: 20 },

  avatarWrap: { alignSelf: 'center', marginTop: 28, marginBottom: 8, position: 'relative' },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarFallback: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 36, fontWeight: '900' },
  cameraOverlay: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: BG,
  },
  changePhotoTxt: { textAlign: 'center', fontSize: 13, color: TEXT2, fontWeight: '600', marginBottom: 32 },

  section: { marginBottom: 12 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: TEXT3, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 },

  card: { backgroundColor: CARD, borderRadius: 16, overflow: 'hidden' },
  dateRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: CARD, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  dateValue: { fontSize: 16, color: TEXT, fontWeight: '500' },
});

