import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useStore } from '../store/useStore';
import { Colors, Spacing, BorderRadius, FontSize } from '../constants/theme';

const today = new Date().toISOString().split('T')[0];

export default function MateProfileScreen() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const mate = useStore((s) => s.mate);
  const accentColor = mate.gender === 'female' ? Colors.female : Colors.male;
  const isPro = user.isPro;

  const completedCount = mate.routines.filter((r) => r.completedDates.includes(today)).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mate Profili</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.profileTop}>
          <View style={[styles.avatarOuter, { borderColor: accentColor }]}>
            <View style={[styles.avatarInner, !isPro && styles.blurred]}>
              {isPro ? (
                <Text style={[styles.avatarLetter, { color: accentColor }]}>
                  {mate.username[0].toUpperCase()}
                </Text>
              ) : (
                <Text style={styles.lockIcon}>🔒</Text>
              )}
            </View>
          </View>

          <Text style={styles.username}>@{mate.username}</Text>

          <View style={[styles.genderChip, { backgroundColor: accentColor + '22', borderColor: accentColor + '55' }]}>
            <Text style={[styles.genderText, { color: accentColor }]}>
              {mate.gender === 'male' ? '♂ Erkek' : '♀ Kadın'}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: accentColor }]}>{mate.achievementScore}%</Text>
              <Text style={styles.statLabel}>Başarı</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{mate.routines.length}</Text>
              <Text style={styles.statLabel}>Rutin</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: completedCount > 0 ? '#2ecc71' : Colors.textMuted }]}>
                {completedCount}
              </Text>
              <Text style={styles.statLabel}>Bugün</Text>
            </View>
          </View>
        </View>

        {/* Routines (Read-Only) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RUTINLER (SALT OKUNUR)</Text>
          {mate.routines.map((r) => {
            const done = r.completedDates.includes(today);
            return (
              <View key={r.id} style={[styles.routineItem, done && styles.routineItemDone]}>
                <View style={[styles.check, { borderColor: accentColor }, done && { backgroundColor: accentColor }]}>
                  {done && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.routineName, !done && { opacity: 0.6 }]}>{r.name}</Text>
                  <Text style={styles.routineMeta}>{r.frequency} · ⏰ {r.notificationTime}</Text>
                </View>
                <Text style={[styles.status, { color: done ? '#2ecc71' : Colors.textMuted }]}>
                  {done ? 'Tamamlandı' : 'Bekliyor'}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Photos (blurred if free) */}
        {!isPro && (
          <View style={styles.proGateCard}>
            <Text style={styles.proGateIcon}>📸</Text>
            <Text style={styles.proGateTitle}>Fotoğraflar Kilitli</Text>
            <Text style={styles.proGateText}>
              Mate'inin paylaştığı fotoğrafları görmek için Pro üyeliğe geç!
            </Text>
            <View style={styles.blurPreview}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={styles.blurCell}>
                  <Text style={{ fontSize: 24 }}>🔒</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
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
  headerTitle: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '700',
  },
  profileTop: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  avatarOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarInner: {
    width: 98,
    height: 98,
    borderRadius: 49,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blurred: {
    backgroundColor: '#1A1A1A',
  },
  avatarLetter: {
    fontSize: 44,
    fontWeight: '800',
  },
  lockIcon: {
    fontSize: 36,
  },
  username: {
    fontSize: FontSize.xl,
    color: Colors.text,
    fontWeight: '800',
    marginBottom: Spacing.sm,
  },
  genderChip: {
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: Spacing.md,
  },
  genderText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
    minWidth: 80,
  },
  statNum: {
    fontSize: FontSize.xl,
    color: Colors.text,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  section: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
  },
  routineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
    gap: 12,
  },
  routineItemDone: {
    borderColor: '#2ecc7122',
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  routineName: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '600',
  },
  routineMeta: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 3,
  },
  status: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  proGateCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.proGold + '33',
    marginBottom: Spacing.lg,
  },
  proGateIcon: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  proGateTitle: {
    fontSize: FontSize.lg,
    color: Colors.proGold,
    fontWeight: '800',
    marginBottom: Spacing.sm,
  },
  proGateText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  blurPreview: {
    flexDirection: 'row',
    gap: 8,
  },
  blurCell: {
    width: 70,
    height: 70,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
  },
});
