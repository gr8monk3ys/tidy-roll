import React, { useMemo, useRef } from 'react';
import { Animated, Dimensions, PanResponder, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { theme } from '@/src/theme';

type Props = {
  uri: string;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onLongPress?: () => void;
  leftLabel?: string;
  rightLabel?: string;
  leftColor?: string;
  rightColor?: string;
};

const SWIPE_THRESHOLD = 110;
const LONG_PRESS_MS = 420;

export function SwipeCard({
  uri,
  onSwipeLeft,
  onSwipeRight,
  onLongPress,
  leftLabel = 'DELETE',
  rightLabel = 'KEEP',
  leftColor = theme.colors.red,
  rightColor = theme.colors.green,
}: Props) {
  const position = useRef(new Animated.ValueXY()).current;
  const longPressTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { width: screenWidth } = Dimensions.get('window');

  const rotate = useMemo(
    () =>
      position.x.interpolate({
        inputRange: [-screenWidth / 2, 0, screenWidth / 2],
        outputRange: ['-10deg', '0deg', '10deg'],
        extrapolate: 'clamp',
      }),
    [position.x, screenWidth]
  );

  const keepOpacity = useMemo(
    () =>
      position.x.interpolate({
        inputRange: [0, SWIPE_THRESHOLD],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      }),
    [position.x]
  );

  const deleteOpacity = useMemo(
    () =>
      position.x.interpolate({
        inputRange: [-SWIPE_THRESHOLD, 0],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      }),
    [position.x]
  );

  const clearLongPress = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          clearLongPress();
          if (onLongPress) {
            longPressTimeout.current = setTimeout(() => {
              longPressTimeout.current = null;
              onLongPress();
            }, LONG_PRESS_MS);
          }
        },
        onPanResponderMove: (_, gesture) => {
          if (Math.abs(gesture.dx) > 8 || Math.abs(gesture.dy) > 8) clearLongPress();
          position.setValue({ x: gesture.dx, y: gesture.dy });
        },
        onPanResponderRelease: (_, gesture) => {
          clearLongPress();

          if (gesture.dx > SWIPE_THRESHOLD) {
            Animated.timing(position, {
              toValue: { x: screenWidth + 120, y: gesture.dy },
              duration: 180,
              useNativeDriver: true,
            }).start(() => {
              position.setValue({ x: 0, y: 0 });
              onSwipeRight();
            });
            return;
          }

          if (gesture.dx < -SWIPE_THRESHOLD) {
            Animated.timing(position, {
              toValue: { x: -screenWidth - 120, y: gesture.dy },
              duration: 180,
              useNativeDriver: true,
            }).start(() => {
              position.setValue({ x: 0, y: 0 });
              onSwipeLeft();
            });
            return;
          }

          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
            friction: 7,
            tension: 60,
          }).start();
        },
        onPanResponderTerminate: () => {
          clearLongPress();
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
            friction: 7,
            tension: 60,
          }).start();
        },
      }),
    [onLongPress, onSwipeLeft, onSwipeRight, position, screenWidth]
  );

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }],
        },
      ]}
      {...panResponder.panHandlers}>
      <View style={styles.overlay}>
        <Animated.Text
          accessibilityLabel="Keep"
          style={[styles.keep, { opacity: keepOpacity, color: rightColor }]}>
          {rightLabel}
        </Animated.Text>
        <Animated.Text
          accessibilityLabel="Discard"
          style={[
            styles.delete,
            { opacity: deleteOpacity, color: leftColor },
          ]}>
          {leftLabel}
        </Animated.Text>
      </View>

      <Image
        source={{ uri }}
        style={styles.image}
        contentFit="cover"
        transition={120}
        cachePolicy="disk"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.stroke,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    zIndex: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  keep: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
    color: theme.colors.green,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  delete: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
    color: theme.colors.red,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
});
