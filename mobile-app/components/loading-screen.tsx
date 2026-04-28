import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import { Colors } from '@/constants/Colors';

const { width } = Dimensions.get('window');

export function LoadingScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(barAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(barAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const barWidth = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[
        styles.content,
        { 
          opacity: fadeAnim, 
          transform: [{ scale: scaleAnim }, { translateY: slideAnim }] 
        }
      ]}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>🚗</Text>
        </View>
        <Text style={styles.brandName}>AusDrive<Text style={{color: Colors.accent}}>Premium</Text></Text>
        <Text style={styles.tagline}>Australia's Pro Fleet Management</Text>
        
        <View style={styles.loaderTrack}>
          <Animated.View style={[styles.loaderBar, { width: barWidth }]} />
        </View>
        
        <Text style={styles.loadingText}>Initializing Enterprise Systems...</Text>
      </Animated.View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Secure Protocol v2.4.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    width: '80%',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  logoEmoji: {
    fontSize: 50,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    fontWeight: '600',
  },
  loaderTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginTop: 40,
    overflow: 'hidden',
  },
  loaderBar: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  loadingText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

// Memoized loading screen - prevents unnecessary re-renders
export const MemoizedLoadingScreen = React.memo(LoadingScreen);
