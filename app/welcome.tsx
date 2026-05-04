import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const RED = '#E60023';
const DARK = '#0D0D1A';

const PHRASES = [
  { text: "İnsan için ancak çalıştığının karşılığı vardır.", author: "Necm Suresi, 39" },
  { text: "İki günü birbirine eşit olan ziyandadır.", author: "Hz. Muhammed (S.A.V)" },
  { text: "Sabır, başarının anahtarıdır.", author: "Hz. Ali" },
  { text: "Çalışmadan rızık bekleyen, boşuna bekler.", author: "Hz. Ömer" },
  { text: "En akıllı kişi, nefsini hesaba çekendir.", author: "Hz. Osman" },
  { text: "Doğruluk emanet, yalancılık hıyanettir.", author: "Hz. Ebubekir" },
  { text: "İmkansız, sadece aptalların sözlüğünde bulunan bir kelimedir.", author: "Napolyon" },
  { text: "Benim imkanlarımın ulaştığı yere, onların hayalleri bile ulaşamaz.", author: "Fatih Sultan Mehmet" },
  { text: "Zorluklar, başarının değerini artıran süslerdir.", author: "Mevlana" },
  { text: "Disiplin, her zaferin temelidir.", author: "Jül Sezar" },
  { text: "Kendi disiplinine sahip olamayan, başkalarının kölesi olur.", author: "Pisagor" },
  { text: "Zafer, sabredenlerindir.", author: "Napolyon" },
  { text: "Yarınlar, bugünden hazırlananlarındır.", author: "Malcolm X" },
  { text: "Rutin, dehanın koruyucusudur.", author: "J. W. von Goethe" },
  { text: "Disiplin, isteklerinizle hedefleriniz arasındaki köprüdür.", author: "Jim Rohn" },
  { text: "En büyük zafer, kendine karşı kazanılan zaferdir.", author: "Platon" },
  { text: "Bir adım daha atmak, bin milin yarısıdır.", author: "Lao Tzu" },
  { text: "Yetenek size maçı kazandırır, disiplin ise şampiyonluğu.", author: "Michael Jordan" },
  { text: "Durmadığın sürece ne kadar yavaş gittiğinin bir önemi yoktur.", author: "Konfüçyüs" },
  { text: "İrade, her türlü engelden daha güçlü bir silahtır.", author: "Fatih Sultan Mehmet" }
];

export default function WelcomeScreen() {
  const router = useRouter();

  // Background blobs
  const b1 = useRef(new Animated.Value(0)).current;
  const b2 = useRef(new Animated.Value(0)).current;
  const b3 = useRef(new Animated.Value(0)).current;
  const fadeIn  = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;

  // Phrase control
  const [phraseIdx, setPhraseIdx] = useState(0);
  const phraseOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isCancelled = false;

    const startAnimation = () => {
      if (isCancelled) return;
      phraseOpacity.setValue(0);

      Animated.sequence([
        Animated.timing(phraseOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.delay(5000), 
        Animated.timing(phraseOpacity, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished && !isCancelled) {
          setPhraseIdx(prev => (prev + 1) % PHRASES.length);
        }
      });
    };

    startAnimation();

    return () => {
      isCancelled = true;
      phraseOpacity.stopAnimation();
    };
  }, [phraseIdx]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 900, delay: 200, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 800, delay: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    const loop = (val: Animated.Value, duration: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();

    loop(b1, 5000); loop(b2, 4200); loop(b3, 6100);
  }, []);

  const b1tx = b1.interpolate({ inputRange: [0, 1], outputRange: [-30, 40] });
  const b1ty = b1.interpolate({ inputRange: [0, 1], outputRange: [-20, 30] });
  const b2tx = b2.interpolate({ inputRange: [0, 1], outputRange: [20, -40] });
  const b2ty = b2.interpolate({ inputRange: [0, 1], outputRange: [30, -10] });
  const b3sc = b3.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] });
  const b3tx = b3.interpolate({ inputRange: [0, 1], outputRange: [10, -30] });

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[styles.blob, styles.blob1, { transform: [{ translateX: b1tx }, { translateY: b1ty }] }]} />
        <Animated.View style={[styles.blob, styles.blob2, { transform: [{ translateX: b2tx }, { translateY: b2ty }] }]} />
        <Animated.View style={[styles.blob, styles.blob3, { transform: [{ translateX: b3tx }, { scale: b3sc }] }]} />
        <View style={styles.overlay} />
      </View>

      <SafeAreaView style={styles.inner} edges={['top', 'bottom']}>
        <Animated.View style={[styles.logoWrap, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
          <View style={styles.logoIcon}>
            <Ionicons name="flame" size={36} color="#fff" />
          </View>
          <Text style={styles.logoText}>RoutinMate</Text>
          <Text style={styles.logoSub}>Rutin yolculuğunda yalnız değilsin.</Text>
        </Animated.View>

        <Animated.View style={{ opacity: phraseOpacity, alignItems: 'center', paddingHorizontal: 32 }}>
          <Text style={styles.quoteMark}>“</Text>
          <Text style={styles.phraseText}>{PHRASES[phraseIdx].text}</Text>
          <View style={styles.authorLine} />
          <Text style={styles.authorText}>{PHRASES[phraseIdx].author}</Text>
        </Animated.View>

        <Animated.View style={[styles.btnGroup, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
          <TouchableOpacity style={styles.btnPrimary} activeOpacity={0.85} onPress={() => router.push('/auth?mode=register')}>
            <Text style={styles.btnPrimaryTxt}>Başlayalım</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSecondary} activeOpacity={0.8} onPress={() => router.push('/auth?mode=login')}>
            <Text style={styles.btnSecondaryTxt}>Zaten hesabım var</Text>
          </TouchableOpacity>
          <Text style={styles.legal}>Devam ederek <Text style={styles.legalLink}>Kullanım Koşulları</Text>'nı kabul etmiş olursunuz.</Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK },
  inner: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 32 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(13,13,26,0.65)' },
  blob: { position: 'absolute', borderRadius: 999, opacity: 0.5 },
  blob1: { width: 280, height: 280, backgroundColor: '#7C3AED', top: -80, left: -60 },
  blob2: { width: 240, height: 240, backgroundColor: '#E60023', top: height * 0.25, right: -80 },
  blob3: { width: 220, height: 220, backgroundColor: '#2563EB', bottom: height * 0.2, left: 20 },
  logoWrap: { alignItems: 'center', marginTop: 40 },
  logoIcon: { width: 80, height: 80, borderRadius: 24, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', marginBottom: 20, shadowColor: RED, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 12 },
  logoText: { fontSize: 36, color: '#fff', fontWeight: '900', letterSpacing: -1 },
  logoSub:  { fontSize: 15, color: 'rgba(255,255,255,0.6)', marginTop: 8, textAlign: 'center' },

  quoteMark: { fontSize: 60, color: RED, fontWeight: '900', height: 40, marginBottom: -10 },
  phraseText: { fontSize: 18, color: '#fff', textAlign: 'center', fontWeight: '700', lineHeight: 28, fontStyle: 'italic' },
  authorLine: { width: 30, height: 2, backgroundColor: RED, marginVertical: 16, borderRadius: 1 },
  authorText: { fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },

  btnGroup:      { gap: 12 },
  btnPrimary:    { backgroundColor: RED, borderRadius: 14, paddingVertical: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: RED, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8 },
  btnPrimaryTxt: { color: '#fff', fontSize: 17, fontWeight: '800' },
  btnSecondary:    { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  btnSecondaryTxt: { color: '#fff', fontSize: 16, fontWeight: '600' },
  legal:     { textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 4 },
  legalLink: { color: 'rgba(255,255,255,0.55)', textDecorationLine: 'underline' },
});
