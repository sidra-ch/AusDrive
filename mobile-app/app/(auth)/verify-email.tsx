import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MailCheck, RefreshCw, CheckCircle2, Clock } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { authAPI } from '@/services/api';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;
    setResending(true);
    try {
      await authAPI.resendVerification(email as string);
      setCooldown(60);
      Alert.alert('Sent!', 'A new verification email has been sent.');
    } catch (err: any) {
      Alert.alert('Failed', err?.response?.data?.error || 'Could not resend. Try again.');
    } finally {
      setResending(false);
    }
  };

  const handleCheckVerified = async () => {
    // User taps "I've verified" — attempt to proceed to login
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <MailCheck size={52} color={Colors.primary} />
        </View>

        <Text style={styles.title}>Check your inbox</Text>
        <Text style={styles.subtitle}>
          We sent a verification link to{'\n'}
          <Text style={styles.emailText}>{email || 'your email address'}</Text>
        </Text>

        <View style={styles.steps}>
          <StepItem num={1} text="Open the email from AusDrive" />
          <StepItem num={2} text="Tap the verification link" />
          <StepItem num={3} text="Come back and log in" />
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleCheckVerified}
          activeOpacity={0.85}
        >
          <CheckCircle2 size={18} color="#fff" />
          <Text style={styles.primaryBtnText}>I've verified my email</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.resendBtn, (cooldown > 0 || resending) && styles.resendBtnDisabled]}
          onPress={handleResend}
          disabled={cooldown > 0 || resending}
          activeOpacity={0.7}
        >
          {resending ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : cooldown > 0 ? (
            <>
              <Clock size={16} color={Colors.textSecondary} />
              <Text style={styles.resendBtnTextMuted}>Resend in {cooldown}s</Text>
            </>
          ) : (
            <>
              <RefreshCw size={16} color={Colors.primary} />
              <Text style={styles.resendBtnText}>Resend verification email</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.backText}>← Back to Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function StepItem({ num, text }: { num: number; text: string }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepNum}>
        <Text style={styles.stepNumText}>{num}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 48,
    paddingBottom: 32,
    alignItems: 'center',
    gap: 20,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 26, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  subtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  emailText: { fontWeight: '700', color: Colors.text },
  steps: { width: '100%', gap: 12, marginTop: 8 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  stepText: { fontSize: 14, color: Colors.text, fontWeight: '500', flex: 1 },
  primaryBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  resendBtnDisabled: { borderColor: Colors.border },
  resendBtnText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  resendBtnTextMuted: { color: Colors.textSecondary, fontWeight: '600', fontSize: 14 },
  backText: { color: Colors.textSecondary, fontSize: 14, marginTop: 4 },
});
