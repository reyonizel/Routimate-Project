import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const THEME_GREEN = '#00cc6d';

export default function WelcomeScreen() {
  const router = useRouter();
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 800, delay: 100, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 800, delay: 100, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Top Left: App Icon + Name */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Image source={require('../assets/images/routinemate (1).png')} style={{ width: 28, height: 28, resizeMode: 'contain' }} />
        </View>
        <Text style={styles.appName}>RoutinMate</Text>
      </View>

      {/* Middle: Welcome Text */}
      <Animated.View style={[styles.middleContainer, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
        <Text style={styles.welcomeText}>Hoşgeldiniz,</Text>
        <Text style={styles.welcomeText}>değişime başlayın.</Text>
      </Animated.View>

      {/* Bottom: Start Button */}
      <Animated.View style={[styles.bottomContainer, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
        <TouchableOpacity 
          style={styles.startButton} 
          activeOpacity={0.85} 
          onPress={() => router.push('/auth?mode=register')}
        >
          <Text style={styles.startButtonText}>Başlayalım</Text>
          <Ionicons name="arrow-forward" size={20} color={THEME_GREEN} />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_GREEN,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  middleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 48,
    letterSpacing: -1,
  },
  bottomContainer: {
    paddingBottom: 20,
  },
  startButton: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME_GREEN,
  },
});

