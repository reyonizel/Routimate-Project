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

export default function WelcomeScreen() {
  const router = useRouter();

  // Blob animations
  const b1 = useRef(new Animated.Value(0)).current;
  const b2 = useRef(new Animated.Value(0)).current;
  const b3 = useRef(new Animated.Value(0)).current;
  const fadeIn  = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;

  // Staggered feature items
  const PHRASES = [
    'Rutin yolculuğunda yalnız değilsin.',
    'Her gün birlikte, her adım daha güçlü.',
    'Taahhüt et. Görül. Büyü.',
  ];
  const [phraseIdx, setPhraseIdx] = useState(0);
  const phraseOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 900, delay: 200, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 800, delay: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    // Phrase crossfade cycle
    const cycle = () => {
      Animated.sequence([
        Animated.delay(2800),
        Animated.timing(phraseOpacity, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start(() => {
        setPhraseIdx(i => (i + 1) % PHRASES.length);
        Animated.timing(phraseOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start(cycle);
      });
    };
    const cycleTimeout = setTimeout(cycle, 400);

    // Looping blob animations
    const loop = (val: Animated.Value, duration: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();

    loop(b1, 5000);
    loop(b2, 4200);
    loop(b3, 6100);

    return () => clearTimeout(cycleTimeout);
  }, []);

  const b1tx = b1.interpolate({ inputRange: [0, 1], outputRange: [-30, 40] });
  const b1ty = b1.interpolate({ inputRange: [0, 1], outputRange: [-20, 30] });
  const b2tx = b2.interpolate({ inputRange: [0, 1], outputRange: [20, -40] });
  const b2ty = b2.interpolate({ inputRange: [0, 1], outputRange: [30, -10] });
  const b3sc = b3.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] });
  const b3tx = b3.interpolate({ inputRange: [0, 1], outputRange: [10, -30] });

  return (
    <View style={styles.container}>
      {/* Animated Background */}
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[styles.blob, styles.blob1, { transform: [{ translateX: b1tx }, { translateY: b1ty }] }]} />
        <Animated.View style={[styles.blob, styles.blob2, { transform: [{ translateX: b2tx }, { translateY: b2ty }] }]} />
        <Animated.View style={[styles.blob, styles.blob3, { transform: [{ translateX: b3tx }, { scale: b3sc }] }]} />
        <View style={styles.overlay} />
      </View>

      <SafeAreaView style={styles.inner} edges={['top', 'bottom']}>
        {/* Logo Area */}
        <Animated.View style={[styles.logoWrap, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
          <View style={styles.logoIcon}>
            <Ionicons name="flame" size={36} color="#fff" />
          </View>
          <Text style={styles.logoText}>RoutinMate</Text>
          <Text style={styles.logoSub}>Rutin yolculuğunda yalnız değilsin.</Text>
        </Animated.View>

        {/* Crossfading phrase */}
        <Animated.Text style={[styles.phrase, { opacity: phraseOpacity }]}>
          {PHRASES[phraseIdx]}
        </Animated.Text>

        {/* CTA Buttons */}
        <Animated.View style={[styles.btnGroup, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
          <TouchableOpacity
            style={styles.btnPrimary}
            activeOpacity={0.85}
            onPress={() => router.push('/auth?mode=register')}
          >
            <Text style={styles.btnPrimaryTxt}>Başlayalım</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSecondary}
            activeOpacity={0.8}
            onPress={() => router.push('/auth?mode=login')}
          >
            <Text style={styles.btnSecondaryTxt}>Zaten hesabım var</Text>
          </TouchableOpacity>

          <Text style={styles.legal}>
            Devam ederek <Text style={styles.legalLink}>Kullanım Koşulları</Text>'nı kabul etmiş olursunuz.
          </Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK },
  inner: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 32 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(13,13,26,0.55)' },

  blob: { position: 'absolute', borderRadius: 999, opacity: 0.5 },
  blob1: { width: 280, height: 280, backgroundColor: '#7C3AED', top: -80, left: -60 },
  blob2: { width: 240, height: 240, backgroundColor: '#E60023', top: height * 0.25, right: -80 },
  blob3: { width: 220, height: 220, backgroundColor: '#2563EB', bottom: height * 0.2, left: 20 },

  logoWrap: { alignItems: 'center', marginTop: 40 },
  logoIcon: { width: 80, height: 80, borderRadius: 24, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', marginBottom: 20, shadowColor: RED, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 12 },
  logoText: { fontSize: 36, color: '#fff', fontWeight: '900', letterSpacing: -1 },
  logoSub:  { fontSize: 15, color: 'rgba(255,255,255,0.6)', marginTop: 8, textAlign: 'center' },

  phrase: { fontSize: 15, color: 'rgba(255,255,255,0.45)', textAlign: 'center', fontWeight: '400', letterSpacing: 0.1, lineHeight: 22 },

  btnGroup:      { gap: 12 },
  btnPrimary:    { backgroundColor: RED, borderRadius: 14, paddingVertical: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: RED, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8 },
  btnPrimaryTxt: { color: '#fff', fontSize: 17, fontWeight: '800' },
  btnSecondary:    { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  btnSecondaryTxt: { color: '#fff', fontSize: 16, fontWeight: '600' },
  legal:     { textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 4 },
  legalLink: { color: 'rgba(255,255,255,0.55)', textDecorationLine: 'underline' },
});
