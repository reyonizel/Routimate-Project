import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';

const SHIMMER_FROM = '#F0F0F0';
const SHIMMER_TO   = '#E0E0E0';

function useShimmer() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: false }),
      ])
    ).start();
  }, []);
  return anim;
}

export function SkeletonBox({
  width, height, borderRadius = 8, style,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}) {
  const anim = useShimmer();
  const bg = anim.interpolate({ inputRange: [0, 1], outputRange: [SHIMMER_FROM, SHIMMER_TO] });
  return (
    <Animated.View style={[{ width: width as any, height, borderRadius, backgroundColor: bg }, style]} />
  );
}

export function SkeletonAvatar({ size = 48 }: { size?: number }) {
  return <SkeletonBox width={size} height={size} borderRadius={size / 2} />;
}

export function SkeletonRow({ lines = 2, style }: { lines?: number; style?: ViewStyle }) {
  return (
    <View style={[{ gap: 8 }, style]}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox key={i} width={i === lines - 1 ? '60%' : '100%'} height={12} borderRadius={6} />
      ))}
    </View>
  );
}

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.card, style]}>
      <SkeletonBox width="100%" height={140} borderRadius={0} />
      <View style={styles.cardBody}>
        <SkeletonBox width="80%" height={12} borderRadius={6} />
        <SkeletonBox width="50%" height={10} borderRadius={5} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#F4F4F4', borderRadius: 16, overflow: 'hidden' },
  cardBody: { padding: 12, gap: 0 },
});
