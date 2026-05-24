// STORE_DEFERRED — Mağaza MVP'de kapalı. Bu ekran şimdilik erişilemez.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CartScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <TouchableOpacity style={s.back} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={22} color="#0A3B25" />
      </TouchableOpacity>
      <View style={s.body}>
        <Text style={s.emoji}>ğŸ›’</Text>
        <Text style={s.title}>Mağaza Yakında Açılıyor</Text>
        <Text style={s.sub}>Sepet özelliği mağaza açıldığında kullanılabilir olacak.</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EEE3D0' },
  back: { margin: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '900', color: '#0A3B25', marginBottom: 8, textAlign: 'center' },
  sub: { fontSize: 14, color: '#3D6B58', textAlign: 'center', lineHeight: 20 },
});

