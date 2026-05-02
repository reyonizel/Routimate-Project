import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useStore } from '../../store/useStore';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';

const today = new Date().toISOString().split('T')[0];

function BlurredAvatar({ uri, size, accentColor, isPro }: {
  uri: string | null;
  size: number;
  accentColor: string;
  isPro: boolean;
}) {
  return (
    <View style={[
      styles.avatarRing,
      {
        width: size + 6,
        height: size + 6,
        borderRadius: (size + 6) / 2,
        borderColor: accentColor,
      }
    ]}>
      <View style={[styles.avatarBase, { width: size, height: size, borderRadius: size / 2 }]}>
        {/* Since we can't use BlurView for null images, show initials */}
        <View style={[styles.avatarPlaceholder, {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: accentColor + '33',
        }]}>
          <Text style={[styles.avatarInitial, { color: accentColor, fontSize: size * 0.35 }]}>?</Text>
          {!isPro && (
            <View style={[StyleSheet.absoluteFillObject, {
              borderRadius: size / 2,
              backgroundColor: 'rgba(0,0,0,0.75)',
              alignItems: 'center',
              justifyContent: 'center',
            }]}>
              <Text style={{ fontSize: 20 }}>🔒</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

function MateRoutineRow({ routine }: { routine: any }) {
  const isCompleted = routine.completedDates.includes(today);
  return (
    <View style={styles.mateRoutineRow}>
      <View style={[styles.routineStatus, { backgroundColor: isCompleted ? '#2ecc71' : '#333' }]}>
        {isCompleted && <Text style={{ color: '#fff', fontSize: 10 }}>✓</Text>}
      </View>
      <Text style={[styles.mateRoutineName, !isCompleted && { opacity: 0.5 }]}>{routine.name}</Text>
      <View style={[
        styles.statusBadge,
        { backgroundColor: isCompleted ? '#2ecc7122' : '#e74c3c22' }
      ]}>
        <Text style={[styles.statusText, { color: isCompleted ? '#2ecc71' : '#e74c3c' }]}>
          {isCompleted ? 'Tamamlandı' : 'Bekleniyor'}
        </Text>
      </View>
    </View>
  );
}

export default function MateScreen() {
  const user = useStore((s) => s.user);
  const mate = useStore((s) => s.mate);
  const router = useRouter();
  const accentColor = mate.gender === 'female' ? Colors.female : Colors.male;

  const matchedSince = new Date(user.matchedSince);
  const daysPassed = Math.floor((Date.now() - matchedSince.getTime()) / (1000 * 60 * 60 * 24));
  const daysLeft = 30 - daysPassed;

  const completedToday = mate.routines.filter((r) => r.completedDates.includes(today)).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Rutinmate</Text>
          <View style={styles.matchTimer}>
            <Text style={styles.timerLabel}>Kalan</Text>
            <Text style={[styles.timerDays, { color: daysLeft < 7 ? Colors.danger : Colors.male }]}>
              {daysLeft}g
            </Text>
          </View>
        </View>

        {/* Mate Card */}
        <View style={styles.mateCard}>
          <View style={styles.mateTop}>
            <BlurredAvatar
              uri={mate.avatarUri}
              size={80}
              accentColor={accentColor}
              isPro={user.isPro}
            />
            <View style={styles.mateInfo}>
              <Text style={styles.mateUsername}>@{mate.username}</Text>
              <View style={[styles.genderBadge, { backgroundColor: accentColor + '22', borderColor: accentColor + '55' }]}>
                <Text style={[styles.genderText, { color: accentColor }]}>
                  {mate.gender === 'male' ? '♂ Erkek' : '♀ Kadın'}
                </Text>
              </View>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Başarı: </Text>
                <Text style={[styles.scoreValue, { color: accentColor }]}>{mate.achievementScore}%</Text>
              </View>
            </View>
          </View>

          {/* Match Progress */}
          <View style={styles.matchProgress}>
            <View style={styles.matchProgressRow}>
              <Text style={styles.matchLabel}>Eşleşme Süreci ({daysPassed}/30 gün)</Text>
              <Text style={styles.matchDays}>{Math.floor((daysPassed / 30) * 100)}%</Text>
            </View>
            <View style={styles.matchTrack}>
              <View style={[styles.matchFill, {
                width: `${Math.min((daysPassed / 30) * 100, 100)}%` as any,
                backgroundColor: accentColor,
              }]} />
            </View>
          </View>

          {/* Today's Progress */}
          <View style={styles.todayProgress}>
            <Text style={styles.todayLabel}>Mate bugün:</Text>
            <Text style={styles.todayCount}>
              <Text style={{ color: '#2ecc71', fontWeight: '800' }}>{completedToday}</Text>
              <Text style={{ color: Colors.textSecondary }}>/{mate.routines.length} rutin</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.profileBtn, { borderColor: accentColor }]}
            onPress={() => router.push('/mate-profile')}
          >
            <Text style={[styles.profileBtnText, { color: accentColor }]}>Profili Gör</Text>
          </TouchableOpacity>
        </View>

        {/* Routine List (Read-Only) */}
        <View style={styles.routineSection}>
          <Text style={styles.sectionTitle}>BUGÜNKÜ RUTİNLER</Text>
          <Text style={styles.readOnly}>Sadece görüntüleme — değiştiremezsin</Text>

          {mate.routines.map((r) => (
            <MateRoutineRow key={r.id} routine={r} />
          ))}
        </View>

        {!user.isPro && (
          <View style={styles.proBanner}>
            <Text style={styles.proBannerIcon}>🔓</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.proBannerTitle}>Buzları Kaldır</Text>
              <Text style={styles.proBannerText}>Pro'ya geç, mate'inin fotoğraflarını gör</Text>
            </View>
            <View style={[styles.proTag, { backgroundColor: Colors.proGold }]}>
              <Text style={{ color: '#000', fontSize: 11, fontWeight: '800' }}>PRO</Text>
            </View>
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
    paddingBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xl,
    color: Colors.text,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  matchTimer: {
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
  },
  timerLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  timerDays: {
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  mateCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
    marginBottom: Spacing.lg,
  },
  mateTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  avatarRing: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarBase: {
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontWeight: '700',
  },
  mateInfo: {
    flex: 1,
  },
  mateUsername: {
    fontSize: FontSize.lg,
    color: Colors.text,
    fontWeight: '800',
    marginBottom: 8,
  },
  genderBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 8,
  },
  genderText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  scoreValue: {
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  matchProgress: {
    marginBottom: Spacing.md,
  },
  matchProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  matchLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  matchDays: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  matchTrack: {
    height: 3,
    backgroundColor: Colors.cardBorder,
    borderRadius: 2,
    overflow: 'hidden',
  },
  matchFill: {
    height: 3,
    borderRadius: 2,
  },
  todayProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  todayLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  todayCount: {
    fontSize: FontSize.md,
  },
  profileBtn: {
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    paddingVertical: 12,
    alignItems: 'center',
  },
  profileBtnText: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  routineSection: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  readOnly: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },
  mateRoutineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
  },
  routineStatus: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  mateRoutineName: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '500',
  },
  statusBadge: {
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  proBanner: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.proGold + '11',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.proGold + '33',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.lg,
  },
  proBannerIcon: {
    fontSize: 28,
  },
  proBannerTitle: {
    fontSize: FontSize.md,
    color: Colors.proGold,
    fontWeight: '800',
    marginBottom: 2,
  },
  proBannerText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  proTag: {
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});
