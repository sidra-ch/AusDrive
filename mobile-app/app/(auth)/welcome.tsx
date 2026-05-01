import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { ChevronRight } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const FEATURES = [
  { emoji: '🚗', text: 'Premium fleet — luxury & economy' },
  { emoji: '📍', text: 'Real-time GPS tracking' },
  { emoji: '🛡️', text: 'Full insurance coverage' },
  { emoji: '⚡', text: 'Instant booking & payment' },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const featureAnims = useRef(FEATURES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 20, useNativeDriver: true }),
    ]).start(() => {
      Animated.stagger(
        120,
        featureAnims.map(anim =>
          Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true })
        )
      ).start();
    });
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.container}>
        {/* Logo */}
        <Animated.View style={[styles.logoSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🚘</Text>
          </View>
          <Text style={styles.brandName}>AusDrive</Text>
          <Text style={styles.brandTagline}>Australia's Premium Car Rental</Text>
        </Animated.View>

        {/* Features */}
        <View style={styles.featureList}>
          {FEATURES.map((f, i) => (
            <Animated.View key={i} style={[styles.featureRow, { opacity: featureAnims[i] }]}>
              <Text style={styles.featureEmoji}>{f.emoji}</Text>
              <Text style={styles.featureText}>{f.text}</Text>
            </Animated.View>
          ))}
        </View>

        {/* CTA */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push('/(auth)/signup')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Get Started</Text>
            <ChevronRight size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>I already have an account</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.legal}>
          By continuing you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  logoSection: { alignItems: 'center', paddingTop: 24 },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoEmoji: { fontSize: 44 },
  brandName: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -1,
  },
  brandTagline: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  featureList: { gap: 14, paddingVertical: 8 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 14,
  },
  featureEmoji: { fontSize: 22 },
  featureText: { fontSize: 15, color: Colors.text, fontWeight: '500', flex: 1 },
  actions: { gap: 12 },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  secondaryBtnText: { color: Colors.text, fontWeight: '600', fontSize: 15 },
  legal: {
    textAlign: 'center',
    fontSize: 11,
    color: Colors.textSecondary,
    paddingTop: 4,
  },
});
