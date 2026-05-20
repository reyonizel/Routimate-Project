import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Dimensions,
  Keyboard, Alert, ActivityIndicator, Image, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';

const { width, height } = Dimensions.get('window');
const THEME_GREEN = '#2A6151';
const BG = '#FCF7F0';
const TEXT = '#0A3B25';
const TEXT_MUTED = '#B2B7AA';

export default function AuthScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode: 'login' | 'register' }>();
  const [tab, setTab] = useState<'login' | 'register'>(mode ?? 'login');
  const [step, setStep] = useState<'form' | 'verify' | 'forgot_password' | 'verify_reset_otp' | 'new_password'>('form');
  const [loading, setLoading] = useState(false);
  const loadUserData = useStore(s => s.loadUserData);
  
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otp, setOtp]           = useState(['', '', '', '', '', '']);
  const [showPass, setShowPass] = useState(false);
  const [timer, setTimer]       = useState(60);

  const otpRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if ((step === 'verify' || step === 'verify_reset_otp') && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const switchTab = (t: 'login' | 'register') => {
    setTab(t);
    setStep('form');
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setTimer(60);
    if (step === 'verify_reset_otp') {
      await supabase.auth.resetPasswordForEmail(email);
    } else {
      await supabase.auth.resend({ type: 'signup', email });
    }
  };

  const handleOtpChange = (val: string, index: number) => {
    if (val.length > 1) val = val[0];
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);
    if (val !== '' && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setLoading(true);
    try {
      if (step === 'form') {
        if (tab === 'register') {
          const { error } = await supabase.auth.signUp({ email, password });
          if (error) {
            Alert.alert('Kayıt Hatası', error.message);
            return;
          }
          setStep('verify');
          setTimer(60);
        } else {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) {
            Alert.alert('Giriş Hatası', error.message);
            return;
          }
          await loadUserData();
          router.replace('/(tabs)');
        }
      } else if (step === 'verify') {
        const token = otp.join('');
        if (token.length !== 6) {
          Alert.alert('', '6 haneli kodu eksiksiz gir.');
          return;
        }
        const { error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' });
        if (error) {
          Alert.alert('Doğrulama Hatası', error.message);
          return;
        }
        router.replace('/onboarding');
      } else if (step === 'forgot_password') {
        if (!email) {
          Alert.alert('', 'Lütfen e-posta adresinizi girin.');
          return;
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) {
          Alert.alert('Hata', error.message);
          return;
        }
        setOtp(['', '', '', '', '', '']);
        setTimer(60);
        setStep('verify_reset_otp');
      } else if (step === 'verify_reset_otp') {
        const token = otp.join('');
        if (token.length !== 6) {
          Alert.alert('', '6 haneli kodu eksiksiz gir.');
          return;
        }
        const { error } = await supabase.auth.verifyOtp({ email, token, type: 'recovery' });
        if (error) {
          Alert.alert('Hata', error.message);
          return;
        }
        setStep('new_password');
      } else if (step === 'new_password') {
        if (newPassword.length < 6) {
          Alert.alert('', 'Şifre en az 6 karakter olmalı.');
          return;
        }
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          Alert.alert('Hata', error.message);
          return;
        }
        Alert.alert('Başarılı', 'Şifreniz başarıyla güncellendi. Artık giriş yapabilirsiniz.');
        setStep('form');
        setTab('login');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => (
    <View style={s.inner}>
      <View style={s.contentCenter}>
        <View style={s.headerWrap}>
          <Text style={s.pageTitle}>{tab === 'register' ? 'Kayıt Ol' : 'Giriş Yap'}</Text>
        </View>

        <View style={s.form}>
          {tab === 'register' && (
            <View style={s.inputWrap}>
              <TextInput
                style={s.input}
                placeholder="Ad Soyad"
                placeholderTextColor={TEXT_MUTED}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={s.inputWrap}>
            <TextInput
              style={s.input}
              placeholder="E-posta"
              placeholderTextColor={TEXT_MUTED}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={s.inputWrap}>
            <TextInput
              style={s.input}
              placeholder="Şifre"
              placeholderTextColor={TEXT_MUTED}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ padding: 4 }}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={TEXT_MUTED} />
            </TouchableOpacity>
          </View>

          {tab === 'login' && (
            <TouchableOpacity style={s.forgotBtn} onPress={() => setStep('forgot_password')}>
              <Text style={s.forgotTxt}>Şifremi unuttum</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[s.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.submitTxt}>{tab === 'register' ? 'Devam Et' : 'Giriş Yap'}</Text>
            )}
          </TouchableOpacity>

          <View style={s.socialContainer}>
            <Text style={s.socialHeader}>Veya şununla devam et</Text>
            <View style={s.socialRow}>
              <TouchableOpacity style={s.socialBtn} activeOpacity={0.8}>
                <Ionicons name="logo-google" size={20} color={TEXT} />
              </TouchableOpacity>
              <TouchableOpacity style={s.socialBtn} activeOpacity={0.8}>
                <Ionicons name="logo-apple" size={20} color={TEXT} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity style={s.toggleBtn} onPress={() => switchTab(tab === 'login' ? 'register' : 'login')}>
        <Text style={s.toggleTxt}>
          {tab === 'login' ? 'Hesabın yok mu? ' : 'Zaten hesabın var mı? '}
          <Text style={s.toggleTxtBold}>{tab === 'login' ? 'Kayıt Ol' : 'Giriş Yap'}</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderVerify = () => {
    const isReset = step === 'verify_reset_otp';
    return (
      <View style={s.inner}>
        <View style={s.contentCenter}>
          <TouchableOpacity style={s.backBtnStep} onPress={() => setStep(isReset ? 'forgot_password' : 'form')}>
            <Ionicons name="arrow-back" size={24} color={TEXT} />
          </TouchableOpacity>

          <View style={s.headerWrap}>
            <Text style={s.pageTitle}>Doğrulama</Text>
            <Text style={s.pageSub}>
              <Text style={{ fontWeight: '600', color: TEXT }}>{email}</Text> adresine gönderilen kodu girin.
            </Text>
          </View>

          <View style={s.otpContainer}>
            {otp.map((digit, idx) => (
              <TextInput
                key={idx}
                ref={ref => { otpRefs.current[idx] = ref; }}
                style={[s.otpInput, digit !== '' && s.otpInputActive]}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={v => handleOtpChange(v, idx)}
                onKeyPress={e => handleKeyPress(e, idx)}
                textAlign="center"
              />
            ))}
          </View>

          <TouchableOpacity
            style={[s.submitBtn, { marginTop: 24 }, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitTxt}>Doğrula</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={s.resendBtn} onPress={handleResend} disabled={timer > 0}>
            <Text style={[s.resendTxt, timer > 0 && { color: TEXT_MUTED }]}>
              {timer > 0 ? `Tekrar gönder (${timer}s)` : 'Tekrar gönder'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderForgotPassword = () => (
    <View style={s.inner}>
      <View style={s.contentCenter}>
        <TouchableOpacity style={s.backBtnStep} onPress={() => setStep('form')}>
          <Ionicons name="arrow-back" size={24} color={TEXT} />
        </TouchableOpacity>

        <View style={s.headerWrap}>
          <Text style={s.pageTitle}>Şifremi Unuttum</Text>
          <Text style={s.pageSub}>
            Hesabınıza bağlı e-posta adresini girin. Size bir sıfırlama kodu göndereceğiz.
          </Text>
        </View>

        <View style={s.form}>
          <View style={s.inputWrap}>
            <TextInput
              style={s.input}
              placeholder="E-posta"
              placeholderTextColor={TEXT_MUTED}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[s.submitBtn, { marginTop: 12 }, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitTxt}>Kodu Gönder</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderNewPassword = () => (
    <View style={s.inner}>
      <View style={s.contentCenter}>
        <View style={s.headerWrap}>
          <Text style={s.pageTitle}>Yeni Şifre</Text>
          <Text style={s.pageSub}>Lütfen yeni şifrenizi belirleyin.</Text>
        </View>

        <View style={s.form}>
          <View style={s.inputWrap}>
            <TextInput
              style={s.input}
              placeholder="Yeni Şifre"
              placeholderTextColor={TEXT_MUTED}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ padding: 4 }}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={TEXT_MUTED} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[s.submitBtn, { marginTop: 12 }, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitTxt}>Şifreyi Güncelle</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      {step === 'form' && (
        <View style={s.topNav}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={TEXT} />
          </TouchableOpacity>
          <Image source={require('../assets/images/routinemate (1).png')} style={s.navLogo} />
          <View style={{ width: 40 }} />
        </View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {step === 'form' && renderForm()}
          {(step === 'verify' || step === 'verify_reset_otp') && renderVerify()}
          {step === 'forgot_password' && renderForgotPassword()}
          {step === 'new_password' && renderNewPassword()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  
  topNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  navLogo: { width: 28, height: 28, resizeMode: 'contain' },

  backBtnStep: { marginVertical: 8, width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },

  inner: { flex: 1, paddingHorizontal: 32 },
  contentCenter: { flex: 1, justifyContent: 'center', paddingVertical: 20 },
  
  headerWrap: { marginBottom: 32 },
  pageTitle: { fontSize: 28, fontWeight: '700', color: TEXT, marginBottom: 4 },
  pageSub: { fontSize: 13, color: TEXT_MUTED, lineHeight: 18 },

  form: { gap: 12 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5EDE0', borderRadius: 8, paddingHorizontal: 16, height: 48 },
  input: { flex: 1, fontSize: 14, color: TEXT },

  forgotBtn: { alignSelf: 'flex-end', marginTop: 4, marginBottom: 16 },
  forgotTxt: { color: TEXT_MUTED, fontSize: 12, fontWeight: '500' },

  submitBtn: { backgroundColor: THEME_GREEN, borderRadius: 24, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  submitTxt: { color: '#fff', fontSize: 15, fontWeight: '600' },

  socialContainer: { marginTop: 40, alignItems: 'center' },
  socialHeader: { fontSize: 12, color: TEXT_MUTED, marginBottom: 16 },
  socialRow: { flexDirection: 'row', gap: 16 },
  socialBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F5EDE0', alignItems: 'center', justifyContent: 'center' },

  toggleBtn: { paddingVertical: 20, alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? 10 : 30, marginTop: 'auto' },
  toggleTxt: { fontSize: 13, color: TEXT_MUTED },
  toggleTxtBold: { color: THEME_GREEN, fontWeight: '600' },

  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  otpInput: { width: (width - 90) / 6, height: 50, backgroundColor: '#F5EDE0', borderRadius: 8, fontSize: 20, fontWeight: '600', color: TEXT },
  otpInputActive: { borderWidth: 1, borderColor: THEME_GREEN, backgroundColor: '#fff' },
  
  resendBtn: { alignSelf: 'center', marginTop: 24 },
  resendTxt: { color: THEME_GREEN, fontSize: 13, fontWeight: '500' },
});

