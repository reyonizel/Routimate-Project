import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Animated, KeyboardAvoidingView, Platform, Dimensions,
  Easing, Keyboard
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';

const { height } = Dimensions.get('window');
const RED = '#E60023';
const DARK = '#0D0D1A';
const TEXT = '#111111'; const TEXT2 = '#767676'; const TEXT3 = '#ABABAB';
const BORDER = '#EFEFEF'; const BG = '#FFFFFF';

export default function AuthScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode: 'login' | 'register' }>();
  const [tab, setTab] = useState<'login' | 'register'>(mode ?? 'register');
  const setLoggedIn = useStore(s => s.setLoggedIn);
  const insets = useSafeAreaInsets();

  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [name, setName]           = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);

  const slideAnim = useRef(new Animated.Value(tab === 'register' ? 0 : 1)).current;
  const fadeIn    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const switchTab = (t: 'login' | 'register') => {
    setTab(t);
    Animated.spring(slideAnim, { toValue: t === 'register' ? 0 : 1, useNativeDriver: true, bounciness: 0, speed: 16 }).start();
  };

  const handleSubmit = () => {
    Keyboard.dismiss();
    requestAnimationFrame(() => {
      if (tab === 'register') {
        router.push('/onboarding');
      } else {
        setLoggedIn(true);
        router.replace('/(tabs)');
      }
    });
  };

  const tabW = 160;

  return (
    <View style={s.container}>
      {/* Soft top gradient bg */}
      <View style={s.topGrad} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Back Button */}
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={TEXT} />
        </TouchableOpacity>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
        >
          <Animated.View style={[s.inner, { opacity: fadeIn }]}>
            {/* Header */}
            <View style={s.headerWrap}>
              <View style={s.logoMini}>
                <Ionicons name="flame" size={20} color="#fff" />
              </View>
              <Text style={s.pageTitle}>
                {tab === 'register' ? 'Hesap Oluştur' : 'Tekrar Hoş Geldin'}
              </Text>
              <Text style={s.pageSub}>
                {tab === 'register'
                  ? 'Rutin yolculuğuna bugün başla.'
                  : 'Devam etmek için giriş yap.'}
              </Text>
            </View>

            {/* Tab Switcher */}
            <View style={s.tabBar}>
              <Animated.View
                style={[
                  s.tabIndicator,
                  {
                    width: tabW,
                    transform: [{
                      translateX: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, tabW] })
                    }]
                  }
                ]}
              />
              <TouchableOpacity style={[s.tab, { width: tabW }]} onPress={() => switchTab('register')}>
                <Text style={[s.tabTxt, tab === 'register' && s.tabTxtActive]}>Kayıt Ol</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.tab, { width: tabW }]} onPress={() => switchTab('login')}>
                <Text style={[s.tabTxt, tab === 'login' && s.tabTxtActive]}>Giriş Yap</Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={s.form}>
              {tab === 'register' && (
                <View style={s.inputWrap}>
                  <Ionicons name="person-outline" size={18} color={TEXT3} style={s.inputIcon} />
                  <TextInput
                    style={s.input}
                    placeholder="Ad Soyad"
                    placeholderTextColor={TEXT3}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              )}

              <View style={s.inputWrap}>
                <Ionicons name="mail-outline" size={18} color={TEXT3} style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  placeholder="E-posta adresi"
                  placeholderTextColor={TEXT3}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={s.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={TEXT3} style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  placeholder="Şifre"
                  placeholderTextColor={TEXT3}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ padding: 4 }}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={TEXT3} />
                </TouchableOpacity>
              </View>

              {tab === 'login' && (
                <TouchableOpacity style={s.forgotBtn}>
                  <Text style={s.forgotTxt}>Şifremi unuttum</Text>
                </TouchableOpacity>
              )}

              {/* Submit */}
              <TouchableOpacity
                style={[s.submitBtn, { marginBottom: Math.max(insets.bottom, 16) }]}
                onPress={handleSubmit}
                activeOpacity={0.85}
              >
                <Text style={s.submitTxt}>{tab === 'register' ? 'Hesap Oluştur' : 'Giriş Yap'}</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>

              {/* Divider */}
              <View style={s.dividerRow}>
                <View style={s.dividerLine} />
                <Text style={s.dividerTxt}>veya</Text>
                <View style={s.dividerLine} />
              </View>

              {/* Social */}
              <View style={s.socialRow}>
                <TouchableOpacity style={s.socialBtn} activeOpacity={0.8}>
                  <Ionicons name="logo-google" size={20} color={TEXT} />
                  <Text style={s.socialTxt}>Google</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.socialBtn} activeOpacity={0.8}>
                  <Ionicons name="logo-apple" size={20} color={TEXT} />
                  <Text style={s.socialTxt}>Apple</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  topGrad:   { position: 'absolute', top: 0, left: 0, right: 0, height: height * 0.35, backgroundColor: '#FFF5F5', borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },

  backBtn:  { margin: 16, width: 40, height: 40, borderRadius: 12, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },

  inner:      { flex: 1, paddingHorizontal: 24 },
  headerWrap: { marginTop: 16, marginBottom: 28 },
  logoMini:   { width: 44, height: 44, borderRadius: 13, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: RED, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  pageTitle:  { fontSize: 28, fontWeight: '900', color: TEXT, letterSpacing: -0.5, marginBottom: 6 },
  pageSub:    { fontSize: 14, color: TEXT2 },

  // Tab switcher
  tabBar:       { flexDirection: 'row', backgroundColor: '#F2F2F2', borderRadius: 14, padding: 4, alignSelf: 'flex-start', marginBottom: 28, position: 'relative' },
  tabIndicator: { position: 'absolute', top: 4, left: 4, height: '100%', backgroundColor: '#fff', borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  tab:          { paddingVertical: 10, alignItems: 'center', zIndex: 1 },
  tabTxt:       { fontSize: 14, color: TEXT3, fontWeight: '600' },
  tabTxtActive: { color: TEXT, fontWeight: '800' },

  // Form
  form:      { gap: 12 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F8F8', borderRadius: 14, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 14 },
  inputIcon: { marginRight: 10 },
  input:     { flex: 1, fontSize: 15, color: TEXT, paddingVertical: 14 },

  forgotBtn: { alignSelf: 'flex-end', marginTop: -4 },
  forgotTxt: { color: RED, fontSize: 13, fontWeight: '600' },

  submitBtn: { backgroundColor: RED, borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4, shadowColor: RED, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 8 },
  submitTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },

  dividerRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  dividerLine: { flex: 1, height: 0.5, backgroundColor: BORDER },
  dividerTxt:  { fontSize: 13, color: TEXT3 },

  socialRow: { flexDirection: 'row', gap: 12 },
  socialBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F5F5F5', borderRadius: 14, paddingVertical: 14, borderWidth: 1, borderColor: BORDER },
  socialTxt: { fontSize: 14, fontWeight: '700', color: TEXT },
});
