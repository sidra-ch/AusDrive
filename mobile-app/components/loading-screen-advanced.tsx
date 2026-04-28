import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Colors } from '@/constants/Colors';

export function LoadingScreenAdvanced() {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [carAnim] = useState(new Animated.Value(0));
  const [dotAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Car animation (left to right)
    Animated.loop(
      Animated.sequence([
        Animated.timing(carAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(carAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Dot pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(dotAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim, carAnim, dotAnim]);

  const carTranslate = carAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-60, 60],
  });

  const dotOpacity = dotAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Background */}
      <View style={styles.background} />

      {/* Content */}
      <View style={styles.content}>
        {/* Car Animation */}
        <View style={styles.carContainer}>
          <Animated.View
            style={[
              styles.carWrapper,
              {
                transform: [{ translateX: carTranslate }],
              },
            ]}
          >
            <Text style={styles.carEmoji}>🚗</Text>
          </Animated.View>

          {/* Road lines */}
          <View style={styles.roadLine} />
        </View>

        {/* Text */}
        <View style={styles.textContainer}>
          <Text style={styles.mainText}>Starting your ride...</Text>
          <Animated.View style={[styles.dotsContainer, { opacity: dotOpacity }]}>
            <Text style={styles.dots}>●</Text>
          </Animated.View>
        </View>

        {/* Brand Name */}
        <View style={styles.brandContainer}>
          <Text style={styles.brandName}>AusDrive Premium</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 50,
    paddingHorizontal: 20,
  },
  carContainer: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  carEmoji: {
    fontSize: 60,
  },
  roadLine: {
    width: '80%',
    height: 2,
    backgroundColor: Colors.primary,
    opacity: 0.3,
    borderRadius: 1,
  },
  textContainer: {
    alignItems: 'center',
    gap: 12,
  },
  mainText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: 0.5,
  },
  dotsContainer: {
    height: 20,
    justifyContent: 'center',
  },
  dots: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  brandContainer: {
    marginTop: 20,
  },
  brandName: {
    fontSize: 12,
    color: Colors.textSecondary,
    letterSpacing: 1,
    fontWeight: '500',
  },
});
