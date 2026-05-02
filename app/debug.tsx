import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useStore } from '../store/useStore';
import { Colors, Spacing, BorderRadius, FontSize } from '../constants/theme';

export default function DebugScreen() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const mate = useStore((s) => s.mate);
  const messages = useStore((s) => s.messages);
  const forceNewMatch = useStore((s) => s.forceNewMatch);
  const togglePro = useStore((s) => s.togglePro);
  const generateMockStats = useStore((s) => s.generateMockStats);

  const accentColor = user.gender === 'female' ? Colors.female : Colors.male;

  const handleForceMatch = () => {
    forceNewMatch();
    Alert.alert('✓ Force Match', 'Yeni bir mate ile eşleşildi!');
  };

  const handleTogglePro = () => {
    togglePro();
    Alert.alert('✓ Toggle Pro', `Pro: ${!user.isPro ? 'AÇIK' : 'KAPALI'}`);
  };

  const handleMockData = () => {
    generateMockStats();
    Alert.alert('✓ Mock Data', 'Rastgele başarı verileri üretildi!');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⚙ Debug Paneli</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Warning Banner */}
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>⚠ Bu panel yalnızca geliştirme aşamasında görünür</Text>
        </View>

        {/* Current State */}
        <Text style={styles.sectionTitle}>MEVCUT DURUM</Text>
        <View style={styles.stateCard}>
          <StateRow label="Kullanıcı" value={`@${user.username}`} />
          <StateRow label="Cinsiyet" value={user.gender} />
          <StateRow label="Pro" value={user.isPro ? '✓ AÇIK' : '✗ KAPALI'} color={user.isPro ? '#2ecc71' : Colors.danger} />
          <StateRow label="Mate" value={`@${mate.username}`} />
          <StateRow label="Mesaj Sayısı" value={String(messages.length)} />
          <StateRow label="Rutin Sayısı" value={String(user.routines.length)} />
          <StateRow label="Başarı Skoru" value={`${user.achievementScore}%`} color={accentColor} />
        </View>

        {/* Debug Actions */}
        <Text style={styles.sectionTitle}>EYLEMLER</Text>

        <DebugBtn
          icon="🔄"
          label="Force Match"
          sub="30 günü beklemeden anında mate değiştir"
          color="#9b59b6"
          onPress={handleForceMatch}
        />

        <DebugBtn
          icon={user.isPro ? "🔒" : "🔓"}
          label={user.isPro ? "Pro Kapat (Toggle)" : "Pro Aç (Toggle)"}
          sub={`Şu an: ${user.isPro ? 'PRO' : 'FREE'} — UI geçiş testi`}
          color={Colors.proGold}
          onPress={handleTogglePro}
        />

        <DebugBtn
          icon="📊"
          label="Mock Daily Data"
          sub="Başarı grafiği için rastgele 30 günlük veri üret"
          color="#3498db"
          onPress={handleMockData}
        />

        {/* Route Info */}
        <Text style={styles.sectionTitle}>UYGULAMA BİLGİSİ</Text>
        <View style={styles.stateCard}>
          <StateRow label="Versiyon" value="1.0.0" />
          <StateRow label="Platform" value="Expo Router 6" />
          <StateRow label="State" value="Zustand" />
          <StateRow label="Tema" value="True Black #000000" />
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StateRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.stateRow}>
      <Text style={styles.stateLabel}>{label}</Text>
      <Text style={[styles.stateValue, color ? { color } : {}]}>{value}</Text>
    </View>
  );
}

function DebugBtn({ icon, label, sub, color, onPress }: {
  icon: string;
  label: string;
  sub: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.debugBtn, { borderColor: color + '44' }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.debugBtnIcon, { backgroundColor: color + '22' }]}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.debugBtnLabel, { color }]}>{label}</Text>
        <Text style={styles.debugBtnSub}>{sub}</Text>
      </View>
      <Text style={[styles.debugBtnArrow, { color }]}>→</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.cardBorder,
  },
  back: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: '600',
    width: 60,
  },
  title: {
    fontSize: FontSize.lg,
    color: Colors.text,
    fontWeight: '800',
  },
  warningBanner: {
    margin: Spacing.lg,
    backgroundColor: '#e67e2222',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#e67e2244',
  },
  warningText: {
    color: '#e67e22',
    fontSize: FontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  stateCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  stateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.cardBorder,
  },
  stateLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  stateValue: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: '700',
  },
  debugBtn: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    gap: 12,
  },
  debugBtnIcon: {
    fontSize: 24,
    width: 48,
    height: 48,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 48,
    borderRadius: BorderRadius.md,
  },
  debugBtnLabel: {
    fontSize: FontSize.md,
    fontWeight: '700',
    marginBottom: 4,
  },
  debugBtnSub: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  debugBtnArrow: {
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
});
