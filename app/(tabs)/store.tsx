import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Modal, Animated, Easing, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';
import { supabase } from '../../lib/supabase';

const BG = '#FFFFFF'; const CARD = '#F4F4F4';
const TEXT = '#111111'; const TEXT2 = '#767676'; const TEXT3 = '#ABABAB';
const GREEN = '#00cc6d'; const BORDER = '#E8E8E8'; const PILL = 999;

const SLOGANS = [
  'İndirimleri Kaçırma',
  'Çok Yakında Açılıyor',
  'Sınava Hazırlanlar İçin Her Şey',
  'Spor Yapanlara Özel Fiyatlar',
  'Sabahın Rutini, Günün Kalitesi',
  'Erken Üyelere Özel Fiyat',
  'Hedefine Bir Adım Daha',
  'Sağlıklı Yaşam, Doğru Ekipman',
];

export default function StoreScreen() {
  const joinStoreWaitlist = useStore(s => s.joinStoreWaitlist);
  const user = useStore(s => s.user);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const marqueeX = useRef(new Animated.Value(0)).current;
  const [setW, setSetW] = useState(0);
  const marqueeAnim = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (setW === 0) return;
    marqueeAnim.current = Animated.loop(
      Animated.timing(marqueeX, {
        toValue: -setW,
        duration: setW * 12,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    marqueeAnim.current.start();
    return () => marqueeAnim.current?.stop();
  }, [setW]);

  const openSheet = async () => {
    const { data } = await supabase.auth.getUser();
    setEmail(data?.user?.email ?? '');
    setJoined(false);
    setSheetVisible(true);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 160 }).start();
  };

  const closeSheet = () => {
    Animated.timing(slideAnim, { toValue: 300, duration: 220, easing: Easing.in(Easing.ease), useNativeDriver: true }).start(
      () => setSheetVisible(false)
    );
  };

  const handleJoin = async () => {
    if (!email.trim()) return;
    setLoading(true);
    const result = await joinStoreWaitlist(email.trim());
    setLoading(false);
    if (result === 'ok') {
      setJoined(true);
    } else if (result === 'already') {
      setJoined(true);
    } else {
      Alert.alert('Hata', 'Bir sorun oluştu, lütfen tekrar dene.');
    }
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>RoutinMarket</Text>
      </View>

      {/* Coming Soon Content */}
      <View style={s.body}>
        <View style={s.iconCard}>
          <Text style={s.iconEmoji}>🛍️</Text>
        </View>

        <Text style={s.title}>Yakında Açılıyor</Text>
        <Text style={s.subtitle}>
          RoutinMate mağazasında motivasyon kitapları, sağlıklı beslenme ürünleri ve egzersiz ekipmanları bulabileceksin.
        </Text>

        {/* Auto-scrolling ribbon */}
        <View style={s.ribbonOuter}>
          <Animated.View style={[s.marqueeTrack, { transform: [{ translateX: marqueeX }] }]}>
            {[0, 1, 2].map(copy => (
              <View
                key={copy}
                style={s.marqueeSet}
                onLayout={copy === 0 ? e => {
                  const w = e.nativeEvent.layout.width;
                  if (w > 0 && setW === 0) setSetW(w);
                } : undefined}
              >
                {SLOGANS.map((slogan, i) => (
                  <View key={i} style={s.marqueeItem}>
                    <Text style={s.marqueeTxt}>{slogan.toUpperCase()}</Text>
                    <Text style={s.marqueeSep}>·</Text>
                  </View>
                ))}
              </View>
            ))}
          </Animated.View>
        </View>

        <TouchableOpacity style={s.cta} onPress={openSheet} activeOpacity={0.85}>
          <Ionicons name="notifications-outline" size={18} color="#fff" />
          <Text style={s.ctaTxt}>Açılınca Beni Haberdar Et</Text>
        </TouchableOpacity>

        <Text style={s.hint}>Mağaza açıldığında sana e-posta göndereceğiz</Text>
      </View>

      {/* Notification Bottom Sheet */}
      <Modal transparent visible={sheetVisible} animationType="none" onRequestClose={closeSheet}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={closeSheet}>
          <View style={{ flex: 1 }} />
        </TouchableOpacity>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.sheetWrapper}>
          <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
            <View style={s.sheetHandle} />

            {joined ? (
              <View style={s.successBox}>
                <View style={s.successIcon}>
                  <Ionicons name="checkmark" size={28} color={GREEN} />
                </View>
                <Text style={s.successTitle}>Harika! Seni listeye ekledik ✓</Text>
                <Text style={s.successSub}>Mağaza açıldığında sana haber vereceğiz.</Text>
                <TouchableOpacity style={s.doneBtn} onPress={closeSheet} activeOpacity={0.85}>
                  <Text style={s.doneBtnTxt}>Tamam</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={s.sheetTitle}>Mağaza açılınca bildirim al</Text>
                <Text style={s.sheetSub}>E-posta adresini onayla, mağaza açılınca sana ilk haber vereceğiz.</Text>

                <View style={s.inputBox}>
                  <Ionicons name="mail-outline" size={18} color={TEXT2} />
                  <TextInput
                    style={s.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="E-posta adresin"
                    placeholderTextColor={TEXT3}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <TouchableOpacity
                  style={[s.joinBtn, loading && { opacity: 0.7 }]}
                  onPress={handleJoin}
                  activeOpacity={0.85}
                  disabled={loading}
                >
                  <Text style={s.joinBtnTxt}>{loading ? 'Ekleniyor...' : 'Beni Listeye Ekle'}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={closeSheet} style={s.cancelLink}>
                  <Text style={s.cancelLinkTxt}>Şimdi değil</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  headerTitle: { fontSize: 30, color: TEXT, fontWeight: '900', letterSpacing: -1 },

  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },

  iconCard: {
    width: 100, height: 100, borderRadius: 30, backgroundColor: CARD,
    alignItems: 'center', justifyContent: 'center', marginBottom: 28,
  },
  iconEmoji: { fontSize: 48 },

  title: { fontSize: 26, fontWeight: '900', color: TEXT, letterSpacing: -0.5, marginBottom: 12, textAlign: 'center', paddingHorizontal: 32 },
  subtitle: { fontSize: 15, color: TEXT2, lineHeight: 22, textAlign: 'center', marginBottom: 0, paddingHorizontal: 32 },

  ribbonOuter: {
    height: 56,
    overflow: 'hidden',
    alignSelf: 'stretch',
    marginVertical: 32,
    backgroundColor: GREEN,
    justifyContent: 'center',
  },
  marqueeTrack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  marqueeSet: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  marqueeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  marqueeTxt: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.2,
  },
  marqueeSep: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    marginLeft: 20,
  },

  cta: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: GREEN, borderRadius: PILL,
    paddingHorizontal: 28, paddingVertical: 16, marginBottom: 12,
    marginHorizontal: 32,
  },
  ctaTxt: { fontSize: 16, fontWeight: '800', color: '#fff' },
  hint: { fontSize: 12, color: TEXT3, textAlign: 'center', paddingHorizontal: 32 },

  // Sheet
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheetWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  sheet: {
    backgroundColor: BG, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12,
  },
  sheetHandle: {
    width: 36, height: 4, backgroundColor: BORDER,
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  sheetTitle: { fontSize: 20, fontWeight: '900', color: TEXT, marginBottom: 8 },
  sheetSub: { fontSize: 14, color: TEXT2, lineHeight: 20, marginBottom: 20 },

  inputBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: CARD, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    marginBottom: 14,
  },
  input: { flex: 1, fontSize: 15, color: TEXT },

  joinBtn: {
    backgroundColor: GREEN, borderRadius: PILL,
    paddingVertical: 16, alignItems: 'center', marginBottom: 12,
  },
  joinBtnTxt: { fontSize: 16, fontWeight: '800', color: '#fff' },

  cancelLink: { alignItems: 'center', paddingVertical: 8 },
  cancelLinkTxt: { fontSize: 14, color: TEXT3 },

  // Success state
  successBox: { alignItems: 'center', paddingVertical: 16 },
  successIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: GREEN + '18', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  successTitle: { fontSize: 18, fontWeight: '800', color: TEXT, marginBottom: 8, textAlign: 'center' },
  successSub: { fontSize: 14, color: TEXT2, textAlign: 'center', marginBottom: 24 },
  doneBtn: {
    backgroundColor: CARD, borderRadius: PILL,
    paddingHorizontal: 40, paddingVertical: 14,
  },
  doneBtnTxt: { fontSize: 15, fontWeight: '700', color: TEXT },
});

