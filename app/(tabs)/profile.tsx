import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useStore } from '../../store/useStore';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - Spacing.lg * 2 - 4) / 3;

const today = new Date().toISOString().split('T')[0];

// --- Stats Chart ---
function StatsChart({ routines, score }: { routines: any[]; score: number }) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 80;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (score / 100) * circumference;

  return (
    <View style={styles.chartWrap}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${cx}, ${cy}`}>
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke={Colors.cardBorder}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke="#3498db"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${strokeDash} ${circumference}`}
            strokeLinecap="round"
          />
        </G>
        <SvgText
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          fill="#fff"
          fontSize="32"
          fontWeight="bold"
        >{score}%</SvgText>
        <SvgText
          x={cx}
          y={cy + 18}
          textAnchor="middle"
          fill="#A0A0A0"
          fontSize="12"
        >Başarı</SvgText>
      </Svg>

      <View style={styles.statsGrid}>
        {routines.slice(0, 4).map((r) => {
          const pct = r.completedDates.length > 0
            ? Math.min(Math.floor((r.completedDates.length / 30) * 100), 100)
            : 0;
          return (
            <View key={r.id} style={styles.statItem}>
              <View style={styles.statBar}>
                <View style={[styles.statFill, { height: `${pct}%` as any }]} />
              </View>
              <Text style={styles.statPct}>{pct}%</Text>
              <Text style={styles.statName} numberOfLines={1}>{r.name.split(' ')[0]}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// --- Photo Grid ---
function PhotoGrid({ photos, isPro }: { photos: any[]; isPro: boolean }) {
  return (
    <View style={styles.photoGrid}>
      {/* Upload button */}
      <TouchableOpacity style={styles.photoAddBtn} onPress={() => Alert.alert('Upload', 'Galeri açılacak (expo-image-picker ile entegre edilebilir)')}>
        <Text style={styles.photoAddIcon}>+</Text>
      </TouchableOpacity>

      {photos.map((photo) => (
        <View key={photo.id} style={styles.photoCell}>
          <Image
            source={{ uri: photo.uri }}
            style={[styles.photoImg, !isPro && { opacity: 0.15 }]}
          />
          {!isPro && (
            <View style={styles.photoBlueLock}>
              <Text style={{ fontSize: 20 }}>🔒</Text>
            </View>
          )}
        </View>
      ))}

      {photos.length === 0 && (
        <View style={styles.emptyPhotos}>
          <Text style={styles.emptyPhotoText}>Henüz fotoğraf yok</Text>
        </View>
      )}
    </View>
  );
}

export default function ProfileScreen() {
  const user = useStore((s) => s.user);
  const router = useRouter();
  const accentColor = user.gender === 'female' ? Colors.female : Colors.male;
  const [activeTab, setActiveTab] = useState(0);

  const activeRoutines = user.routines.filter((r) => r.completedDates.length > 0);
  const allDone = user.routines.filter((r) => r.completedDates.includes(today));

  const TABS = ['Rutinlerim', 'Photos', 'Stats'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Settings button */}
        <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/modal')}>
          <Text style={styles.settingsIcon}>⚙</Text>
        </TouchableOpacity>

        {/* Profile Top */}
        <View style={styles.profileTop}>
          <View style={[styles.avatarOuter, { borderColor: accentColor }]}>
            <View style={styles.avatarInner}>
              <Text style={[styles.avatarLetter, { color: accentColor }]}>
                {user.username[0].toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.username}>@{user.username}</Text>

          <View style={[styles.genderChip, { backgroundColor: accentColor + '22', borderColor: accentColor + '55' }]}>
            <Text style={[styles.genderChipText, { color: accentColor }]}>
              {user.gender === 'male' ? '♂ Erkek' : '♀ Kadın'}
            </Text>
          </View>

          <View style={styles.scoreRow}>
            <View style={[styles.scoreBox, { borderColor: accentColor + '44' }]}>
              <Text style={[styles.scoreNum, { color: accentColor }]}>{user.achievementScore}%</Text>
              <Text style={styles.scoreLabel}>Başarı</Text>
            </View>
            <View style={[styles.scoreBox, { borderColor: Colors.cardBorder }]}>
              <Text style={styles.scoreNum}>{user.routines.length}</Text>
              <Text style={styles.scoreLabel}>Rutin</Text>
            </View>
            <View style={[styles.scoreBox, { borderColor: Colors.cardBorder }]}>
              <Text style={styles.scoreNum}>{user.photos.length}</Text>
              <Text style={styles.scoreLabel}>Foto</Text>
            </View>
          </View>

          {/* Pro badge */}
          {user.isPro ? (
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>✦ PRO ÜYE</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.upgradeBtn}
              onPress={() => router.push('/modal')}
            >
              <Text style={styles.upgradeBtnText}>🔓 Buzları Kaldır — Pro'ya Geç</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabRow}>
          {TABS.map((t, i) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, activeTab === i && { borderBottomColor: accentColor }]}
              onPress={() => setActiveTab(i)}
            >
              <Text style={[styles.tabText, activeTab === i && { color: accentColor }]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab 0: Routines */}
        {activeTab === 0 && (
          <View style={styles.tabContent}>
            {user.routines.length === 0 ? (
              <Text style={styles.emptyMsg}>Henüz rutin yok</Text>
            ) : (
              <>
                {user.routines.map((r) => {
                  const isDone = r.completedDates.includes(today);
                  const streak = r.completedDates.length;
                  return (
                    <View key={r.id} style={styles.routineRow}>
                      <View style={[styles.routineDot, { backgroundColor: isDone ? '#2ecc71' : Colors.textMuted }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.routineRowName}>{r.name}</Text>
                        <Text style={styles.routineRowMeta}>{r.frequency} · {streak} tamamlama</Text>
                      </View>
                      <View style={[styles.routineStatusBadge, {
                        backgroundColor: isDone ? '#2ecc7122' : Colors.surfaceAlt,
                      }]}>
                        <Text style={[styles.routineStatusText, { color: isDone ? '#2ecc71' : Colors.textMuted }]}>
                          {isDone ? '✓' : '○'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </>
            )}
          </View>
        )}

        {/* Tab 1: Photos */}
        {activeTab === 1 && (
          <View style={styles.tabContent}>
            <PhotoGrid photos={user.photos} isPro={user.isPro} />
          </View>
        )}

        {/* Tab 2: Stats */}
        {activeTab === 2 && (
          <View style={styles.tabContent}>
            <StatsChart routines={user.routines} score={user.achievementScore} />
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
  settingsBtn: {
    position: 'absolute',
    right: Spacing.lg,
    top: Spacing.md,
    zIndex: 10,
    padding: 8,
  },
  settingsIcon: {
    fontSize: 22,
    color: Colors.textSecondary,
  },
  profileTop: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  avatarOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 40,
    fontWeight: '800',
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
  genderChipText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.md,
  },
  scoreBox: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minWidth: 80,
  },
  scoreNum: {
    fontSize: FontSize.xl,
    color: Colors.text,
    fontWeight: '800',
  },
  scoreLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  proBadge: {
    backgroundColor: Colors.proGold,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  proBadgeText: {
    color: '#000',
    fontSize: FontSize.sm,
    fontWeight: '800',
    letterSpacing: 1,
  },
  upgradeBtn: {
    backgroundColor: Colors.proGold + '22',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.proGold + '55',
  },
  upgradeBtnText: {
    color: Colors.proGold,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.cardBorder,
    marginHorizontal: Spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  tabContent: {
    padding: Spacing.lg,
  },
  emptyMsg: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: FontSize.md,
    paddingTop: 40,
  },
  routineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: 12,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
  },
  routineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  routineRowName: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '600',
  },
  routineRowMeta: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 3,
  },
  routineStatusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineStatusText: {
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  photoAddBtn: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderStyle: 'dashed',
  },
  photoAddIcon: {
    fontSize: 32,
    color: Colors.textMuted,
  },
  photoCell: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    backgroundColor: Colors.card,
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  photoBlueLock: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPhotos: {
    width: '100%',
    paddingTop: 40,
    alignItems: 'center',
  },
  emptyPhotoText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  chartWrap: {
    alignItems: 'center',
    paddingTop: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: Spacing.xl,
    alignItems: 'flex-end',
  },
  statItem: {
    alignItems: 'center',
    width: 50,
  },
  statBar: {
    width: 24,
    height: 80,
    backgroundColor: Colors.card,
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginBottom: 6,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
  },
  statFill: {
    width: '100%',
    backgroundColor: '#3498db',
    borderRadius: 4,
  },
  statPct: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  statName: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
    width: 50,
    textAlign: 'center',
  },
});
