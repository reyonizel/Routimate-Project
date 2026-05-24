import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Animated, ScrollView, Dimensions, Image, Alert, KeyboardAvoidingView, Platform, Keyboard
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../store/useStore';
import LocationSearch, { LocationResult } from '../components/LocationSearch';

const { width } = Dimensions.get('window');
const RED = '#2A6151';
const TEXT = '#0A3B25'; const TEXT2 = '#3D6B58'; const TEXT3 = '#B2B7AA';
const BORDER = '#B2B7AA'; const CARD = '#FFFFFF'; const BG = '#EEE3D0';

const STEPS = ['Cinsiyet', 'Yaş', 'Konum', 'İlgi Alanları', 'Profil Fotoğrafı', 'Kullanıcı Adı'];

const AVAILABLE_INTERESTS = [
  'Spor', 'Yazılım', 'Meditasyon', 'Beslenme', 'Kitap', 
  'Müzik', 'Sanat', 'Tasarım', 'Girişimcilik', 'Dil Öğrenimi',
  'Yürüyüş', 'Seyahat'
];

export default function OnboardingScreen() {
  const router = useRouter();
  const updateUser   = useStore(s => s.updateUser);
  const setLoggedIn  = useStore(s => s.setLoggedIn);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const insets       = useSafeAreaInsets();

  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const [step, setStep]           = useState(0);
  const [gender, setGender]       = useState<'male' | 'female' | null>(null);
  const [age, setAge]             = useState('');
  const [location, setLocation]   = useState('');
  const [locationData, setLocationData] = useState<LocationResult | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [username, setUsername]   = useState('');

  const progressAnim = useRef(new Animated.Value(0)).current;
  const slideAnim    = useRef(new Animated.Value(0)).current;

  const goToStep = (next: number) => {
    const isForward = next > step;
    
    Animated.parallel([
      Animated.timing(progressAnim, {
        toValue: next / (STEPS.length - 1),
        duration: 400,
        useNativeDriver: false,
      }),
      Animated.timing(slideAnim, { 
        toValue: isForward ? -width : width, 
        duration: 200, 
        useNativeDriver: true 
      }),
    ]).start(() => {
      // Değişikliği anında yap ve zıt taraftan başlat
      setStep(next);
      slideAnim.setValue(isForward ? width : -width);
      
      requestAnimationFrame(() => {
        Animated.timing(slideAnim, { 
          toValue: 0, 
          duration: 300, 
          useNativeDriver: true 
        }).start();
      });
    });
  };

  const handleNext = () => {
    if (step === 0 && !gender) return Alert.alert('', 'Lütfen bir cinsiyet seç.');
    if (step === 1 && (!age || isNaN(Number(age)) || Number(age) < 13)) return Alert.alert('', 'Lütfen geçerli bir yaş gir (En az 13).');
    if (step === 2 && location.trim().length > 0 && location.trim().length < 2) return Alert.alert('', 'Lütfen geçerli bir konum gir.');
    if (step === 3 && interests.length === 0) return Alert.alert('', 'Lütfen en az bir ilgi alanı seç.');
    if (step === 5 && username.trim().length < 3) return Alert.alert('', 'Kullanıcı adı en az 3 karakter olmalı.');

    if (step < STEPS.length - 1) {
      Keyboard.dismiss();
      goToStep(step + 1);
    } else {
      Keyboard.dismiss();
      requestAnimationFrame(() => {
        // Save & proceed
        const currentYear = new Date().getFullYear();
        const birthYear = currentYear - Number(age);
        const birthDate = `${birthYear}-01-01`; // Simplified date 

        updateUser({
          gender: gender!,
          birthDate,
          locationName: (locationData?.label ?? location.trim()) || undefined,
          locationLat: locationData?.lat,
          locationLon: locationData?.lon,
          interests,
          avatarUri,
          username: username.trim()
        });
        setLoggedIn(true);
        router.replace('/(tabs)');
      });
    }
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!res.canceled) setAvatarUri(res.assets[0].uri);
  };

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      if (interests.length < 5) {
        setInterests([...interests, interest]);
      } else {
        Alert.alert('', 'En fazla 5 ilgi alanı seçebilirsin.');
      }
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const accent = gender === 'female' ? '#e91e63' : (gender === 'male' ? '#3498db' : RED);

  return (
    <View style={s.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* Progress Bar */}
        <View style={s.progressBg}>
          <Animated.View style={[s.progressFill, { width: progressWidth, backgroundColor: accent }]} />
        </View>

        {/* Step Label */}
        <View style={s.stepRow}>
          <Text style={s.stepCounter}>{step + 1} / {STEPS.length}</Text>
          <Text style={s.stepLabel}>{STEPS[step]}</Text>
        </View>

        {/* Content */}
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        >
          <Animated.View style={[s.content, { transform: [{ translateX: slideAnim }] }]}>

            {/* â”€â”€ Step 0: Gender â”€â”€ */}
            {step === 0 && (
              <View style={s.stepWrap}>
                <Text style={s.stepTitle}>Sen kimsin?</Text>
                <Text style={s.stepSub}>RoutinMate seni daha iyi tanısın.</Text>

                <View style={s.genderRow}>
                  <TouchableOpacity
                    testID="gender-male-card"
                    style={[s.genderCard, gender === 'male' && s.genderCardActive, gender === 'male' && { borderColor: '#3498db' }]}
                    onPress={() => setGender('male')}
                    activeOpacity={0.8}
                  >
                    <View style={[s.genderIcon, { backgroundColor: gender === 'male' ? '#3498db15' : CARD }]}>
                      <FontAwesome5 name="mars" size={36} color={gender === 'male' ? '#3498db' : TEXT3} />
                    </View>
                    <Text style={[s.genderLabel, gender === 'male' && { color: '#3498db', fontWeight: '800' }]}>Erkek</Text>
                    {gender === 'male' && (
                      <View style={[s.genderCheck, { backgroundColor: '#3498db' }]}>
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    testID="gender-female-card"
                    style={[s.genderCard, gender === 'female' && s.genderCardActive, gender === 'female' && { borderColor: '#e91e63' }]}
                    onPress={() => setGender('female')}
                    activeOpacity={0.8}
                  >
                    <View style={[s.genderIcon, { backgroundColor: gender === 'female' ? '#e91e6315' : CARD }]}>
                      <FontAwesome5 name="venus" size={36} color={gender === 'female' ? '#e91e63' : TEXT3} />
                    </View>
                    <Text style={[s.genderLabel, gender === 'female' && { color: '#e91e63', fontWeight: '800' }]}>Kadın</Text>
                    {gender === 'female' && (
                      <View style={[s.genderCheck, { backgroundColor: '#e91e63' }]}>
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* â”€â”€ Step 1: Age â”€â”€ */}
            {step === 1 && (
              <View style={s.stepWrap}>
                <Text style={s.stepTitle}>Kaç yaşındasın?</Text>
                <Text style={s.stepSub}>Sana uygun rutinler önermemize yardımcı olur.</Text>

                <View style={[s.inputWrap, { borderColor: age ? accent : BORDER }]}>
                  <TextInput
                    testID="onboarding-age-input"
                    nativeID="onboarding-age-input"
                    style={s.bigInput}
                    placeholder="24"
                    placeholderTextColor={TEXT3}
                    value={age}
                    onChangeText={t => setAge(t.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                    maxLength={2}
                    autoFocus
                  />
                  <Text style={s.inputSuffix}>Yaş</Text>
                </View>
              </View>
            )}

            {/* â”€â”€ Step 2: Location â”€â”€ */}
            {step === 2 && (
              <View style={s.stepWrap}>
                <Text style={s.stepTitle}>Neredensin?</Text>
                <Text style={s.stepSub}>Yakınlarındaki benzer hedefleri olan mate'leri bul. (İsteğe bağlı)</Text>

                <LocationSearch
                  value={location}
                  accentColor={accent}
                  placeholder="Şehir ara... (örn: İstanbul)"
                  onSelect={result => {
                    setLocation(result.label);
                    setLocationData(result);
                  }}
                />
              </View>
            )}

            {/* â”€â”€ Step 3: Interests â”€â”€ */}
            {step === 3 && (
              <View style={s.stepWrap}>
                <Text style={s.stepTitle}>İlgi alanların neler?</Text>
                <Text style={s.stepSub}>Seni daha iyi eşleştirebilmemiz için en fazla 5 tane seç.</Text>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.interestsGrid}>
                  {AVAILABLE_INTERESTS.map(interest => {
                    const isSelected = interests.includes(interest);
                    return (
                      <TouchableOpacity
                        key={interest}
                        style={[s.interestPill, isSelected && { backgroundColor: accent, borderColor: accent }]}
                        onPress={() => toggleInterest(interest)}
                        activeOpacity={0.7}
                      >
                        <Text style={[s.interestTxt, isSelected && { color: '#fff' }]}>{interest}</Text>
                        {isSelected && <Ionicons name="checkmark" size={14} color="#fff" style={{ marginLeft: 4 }} />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* â”€â”€ Step 4: Avatar â”€â”€ */}
            {step === 4 && (
              <View style={s.stepWrap}>
                <Text style={s.stepTitle}>Nasıl görünüyorsun?</Text>
                <Text style={s.stepSub}>Partnerın seni tanısın. İstersen atla.</Text>

                <TouchableOpacity style={s.avatarPicker} onPress={pickImage} activeOpacity={0.85}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={s.avatarImg} />
                  ) : (
                    <View style={[s.avatarPlaceholder, { borderColor: accent }]}>
                      <Ionicons name="camera-outline" size={36} color={accent} />
                      <Text style={[s.avatarHint, { color: accent }]}>Fotoğraf Ekle</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {avatarUri && (
                  <TouchableOpacity onPress={pickImage} style={s.changePhotoBtn}>
                    <Text style={[s.changePhotoTxt, { color: accent }]}>Fotoğrafı Değiştir</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={s.skipBtn} onPress={() => goToStep(5)}>
                  <Text style={s.skipTxt}>Şimdilik Atla</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* â”€â”€ Step 5: Username â”€â”€ */}
            {step === 5 && (
              <View style={s.stepWrap}>
                <Text style={s.stepTitle}>Kullanıcı Adın?</Text>
                <Text style={s.stepSub}>Bu isimle tanınacaksın. Değiştiremezsin.</Text>

                <View style={[s.usernameWrap, { borderColor: username.length >= 3 ? accent : BORDER }]}>
                  <Text style={[s.usernameAt, { color: accent }]}>@</Text>
                  <TextInput
                    testID="onboarding-username-input"
                    nativeID="onboarding-username-input"
                    style={s.usernameInput}
                    placeholder="kullanici_adi"
                    placeholderTextColor={TEXT3}
                    value={username}
                    onChangeText={t => setUsername(t.replace(/[^a-z0-9_]/gi, '').toLowerCase())}
                    autoCapitalize="none"
                    maxLength={24}
                    autoFocus
                  />
                  {username.length >= 3 && (
                    <Ionicons name="checkmark-circle" size={20} color={accent} />
                  )}
                </View>

                <Text style={s.usernameHint}>
                  Yalnızca harf, rakam ve alt çizgi (_) kullanabilirsin.
                </Text>

                {/* Preview */}
                {username.length > 0 && (
                  <View style={[s.previewCard, { borderColor: accent + '30' }]}>
                    <View style={[s.previewAvatar, { backgroundColor: accent + '20' }]}>
                      {avatarUri ? (
                        <Image source={{ uri: avatarUri }} style={{ width: '100%', height: '100%', borderRadius: 99 }} />
                      ) : (
                        <Ionicons name="person" size={22} color={accent} />
                      )}
                    </View>
                    <View>
                      <Text style={s.previewName}>@{username}</Text>
                      <Text style={s.previewSub}>RoutinMate üyesi</Text>
                    </View>
                  </View>
                )}
              </View>
            )}

          </Animated.View>

          {/* Footer */}
          <View style={[s.footer, { paddingBottom: isKeyboardVisible ? 12 : Math.max(insets.bottom, 16) }]}>
            {step > 0 && (
              <TouchableOpacity style={s.backBtn} onPress={() => goToStep(step - 1)}>
                <Ionicons name="chevron-back" size={20} color={TEXT} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              testID="onboarding-next-btn"
              style={[s.nextBtn, { backgroundColor: accent, flex: 1 }]}
              onPress={handleNext}
              activeOpacity={0.85}
            >
              <Text style={s.nextTxt}>
                {step === STEPS.length - 1 ? 'Hazırım! 🚀' : 'Devam Et'}
              </Text>
              {step < STEPS.length - 1 && (
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // Progress
  progressBg:   { height: 3, backgroundColor: BORDER },
  progressFill: { height: 3, borderRadius: 2 },

  // Step row
  stepRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  stepCounter: { fontSize: 12, color: TEXT3, fontWeight: '600' },
  stepLabel:   { fontSize: 12, color: TEXT2, fontWeight: '700' },

  // Content area
  content:  { flex: 1, paddingHorizontal: 24 },
  stepWrap: { flex: 1, paddingTop: 8 },
  stepTitle:{ fontSize: 30, fontWeight: '900', color: TEXT, letterSpacing: -0.5, marginBottom: 8 },
  stepSub:  { fontSize: 15, color: TEXT2, marginBottom: 36 },

  // Input Generic
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD, borderRadius: 16, borderWidth: 2, paddingHorizontal: 16, paddingVertical: 4 },
  bigInput:  { flex: 1, fontSize: 32, fontWeight: '800', color: TEXT, paddingVertical: 16, textAlign: 'center' },
  inputSuffix: { fontSize: 18, fontWeight: '600', color: TEXT3, position: 'absolute', right: 24 },
  textInput: { flex: 1, fontSize: 18, fontWeight: '600', color: TEXT, paddingVertical: 18 },

  // Gender
  genderRow:  { flexDirection: 'row', gap: 16 },
  genderCard: { flex: 1, alignItems: 'center', paddingVertical: 28, borderRadius: 20, borderWidth: 2, borderColor: BORDER, backgroundColor: CARD, position: 'relative' },
  genderCardActive: { backgroundColor: '#fff' },
  genderIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  genderLabel:{ fontSize: 16, color: TEXT, fontWeight: '600' },
  genderCheck:{ position: 'absolute', top: 12, right: 12, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  // Interests
  interestsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 40 },
  interestPill:  { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  interestTxt:   { fontSize: 15, fontWeight: '600', color: TEXT2 },

  // Avatar
  avatarPicker:     { alignSelf: 'center', marginBottom: 20 },
  avatarImg:        { width: 160, height: 160, borderRadius: 80 },
  avatarPlaceholder:{ width: 160, height: 160, borderRadius: 80, borderWidth: 2.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 8 },
  avatarHint:       { fontSize: 14, fontWeight: '700' },
  changePhotoBtn:   { alignSelf: 'center', marginBottom: 16 },
  changePhotoTxt:   { fontSize: 14, fontWeight: '700' },
  skipBtn:          { alignSelf: 'center', marginTop: 8, padding: 8 },
  skipTxt:          { fontSize: 14, color: TEXT3, fontWeight: '600' },

  // Username
  usernameWrap:  { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD, borderRadius: 16, borderWidth: 2, paddingHorizontal: 16, paddingVertical: 4, marginBottom: 12 },
  usernameAt:    { fontSize: 22, fontWeight: '800', marginRight: 4 },
  usernameInput: { flex: 1, fontSize: 20, fontWeight: '700', color: TEXT, paddingVertical: 14 },
  usernameHint:  { fontSize: 12, color: TEXT3, marginBottom: 24 },
  previewCard:   { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: CARD, borderRadius: 16, padding: 16, borderWidth: 1.5 },
  previewAvatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  previewName:   { fontSize: 16, fontWeight: '800', color: TEXT },
  previewSub:    { fontSize: 12, color: TEXT3, marginTop: 2 },

  // Footer
  footer:  { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, gap: 12, borderTopWidth: 0.5, borderTopColor: BORDER },
  backBtn: { width: 52, height: 52, borderRadius: 14, backgroundColor: CARD, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, height: 52, shadowColor: RED, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  nextTxt: { fontSize: 16, color: '#fff', fontWeight: '800' },
});

