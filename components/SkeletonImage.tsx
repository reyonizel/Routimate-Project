import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, ImageStyle, StyleProp, View, ViewStyle } from 'react-native';

interface Props {
  uri: string | null | undefined;
  style?: StyleProp<ImageStyle>;
  skeletonStyle?: StyleProp<ViewStyle>;
  borderRadius?: number;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
}

export default function SkeletonImage({ uri, style, skeletonStyle, borderRadius = 0, resizeMode = 'cover' }: Props) {
  const [loaded, setLoaded] = useState(false);
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (loaded) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [loaded]);

  return (
    <View style={[{ overflow: 'hidden', borderRadius }, skeletonStyle]}>
      {!loaded && (
        <Animated.View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: '#E0E0E0',
            opacity: pulse,
            borderRadius,
          }}
        />
      )}
      {uri ? (
        <Image
          source={{ uri }}
          style={[style, { opacity: loaded ? 1 : 0 }]}
          resizeMode={resizeMode}
          onLoad={() => setLoaded(true)}
        />
      ) : null}
    </View>
  );
}

import { StyleSheet } from 'react-native';
