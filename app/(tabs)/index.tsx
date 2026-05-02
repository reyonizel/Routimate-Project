import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../store/useStore';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';

const today = new Date().toISOString().split('T')[0];

function FrequencyBadge({ frequency }: { frequency: string }) {
  const colorMap: Record<string, string> = {
    daily: '#3498db',
    weekly: '#9b59b6',
    monthly: '#e67e22',
  };
  const labelMap: Record<string, string> = {
    daily: 'Günlük',
    weekly: 'Haftalık',
    monthly: 'Aylık',
  };
  return (
    <View style={[styles.badge, { backgroundColor: colorMap[frequency] + '22', borderColor: colorMap[frequency] + '55' }]}>
      <Text style={[styles.badgeText, { color: colorMap[frequency] }]}>{labelMap[frequency]}</Text>
    </View>
  );
}

function RoutineCard({ routine, accentColor }: { routine: any; accentColor: string }) {
  const toggleRoutineComplete = useStore((s) => s.toggleRoutineComplete);
  const isCompleted = routine.completedDates.includes(today);
  const [scale] = useState(new Animated.Value(1));

  const handleToggle = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    toggleRoutineComplete(routine.id, today);
  };

  return (
    <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
      <TouchableOpacity style={styles.cardInner} onPress={handleToggle} activeOpacity={0.85}>
        <TouchableOpacity
          style={[
            styles.checkbox,
            { borderColor: accentColor },
            isCompleted && { backgroundColor: accentColor },
          ]}
          onPress={handleToggle}
        >
          {isCompleted && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
        <View style={styles.cardContent}>
          <Text style={[styles.routineName, isCompleted && styles.completed]}>{routine.name}</Text>
          <View style={styles.meta}>
            <FrequencyBadge frequency={routine.frequency} />
            <Text style={styles.time}>⏰ {routine.notificationTime}</Text>
          </View>
        </View>
        {isCompleted && (
          <View style={[styles.doneTag, { backgroundColor: accentColor + '22' }]}>
            <Text style={[styles.doneText, { color: accentColor }]}>Done</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const user = useStore((s) => s.user);
  const accentColor = user.gender === 'female' ? Colors.female : Colors.male;

  const dailyRoutines = user.routines.filter((r) => r.frequency === 'daily');
  const otherRoutines = user.routines.filter((r) => r.frequency !== 'daily');
  const completedCount = dailyRoutines.filter((r) => r.completedDates.includes(today)).length;
  const progress = dailyRoutines.length > 0 ? (completedCount / dailyRoutines.length) * 100 : 0;

  const dateStr = new Date().toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Merhaba, <Text style={[styles.userName, { color: accentColor }]}>@{user.username}</Text></Text>
          <Text style={styles.date}>{dateStr}</Text>
        </View>
        <View style={[styles.scoreChip, { borderColor: accentColor + '44' }]}>
          <Text style={[styles.scoreText, { color: accentColor }]}>🏆 {user.achievementScore}%</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Bugünkü İlerleme</Text>
          <Text style={[styles.progressCount, { color: accentColor }]}>{completedCount}/{dailyRoutines.length}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` as any, backgroundColor: accentColor }]} />
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {dailyRoutines.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>GÜNLÜK</Text>
            {dailyRoutines.map((r) => (
              <RoutineCard key={r.id} routine={r} accentColor={accentColor} />
            ))}
          </View>
        )}

        {otherRoutines.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PERİYODİK</Text>
            {otherRoutines.map((r) => (
              <RoutineCard key={r.id} routine={r} accentColor={accentColor} />
            ))}
          </View>
        )}

        {user.routines.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✦</Text>
            <Text style={styles.emptyTitle}>Henüz rutin yok</Text>
            <Text style={styles.emptyText}>Create sekmesine git ve ilk rutinini ekle!</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  greeting: {
    fontSize: FontSize.lg,
    color: Colors.text,
    fontWeight: '700',
  },
  userName: {
    fontWeight: '800',
  },
  date: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  scoreChip: {
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  scoreText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  progressContainer: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  progressCount: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.cardBorder,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  scroll: {
    flex: 1,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  card: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  cardContent: {
    flex: 1,
  },
  routineName: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 6,
  },
  completed: {
    opacity: 0.5,
    textDecorationLine: 'line-through',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  time: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  doneTag: {
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  doneText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 48,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
