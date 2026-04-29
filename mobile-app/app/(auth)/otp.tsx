import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { authAPI } from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';

export default function OtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string }>();
  const { setAuth } = useAuthStore();

  const [phone, setPhone] = useState(String(params.phone || ''));
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const normalizeUser = (user: any) => ({
    ...user,
    id: String(user?.id ?? ''),
  });

  async function handleVerifyOtp() {
    if (!phone || !code) {
      Alert.alert('Missing fields', 'Please enter phone and OTP code.');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.verifyOtp({ phone, code });
      const { user, token, refreshToken } = response.data;

      if (!token) throw new Error('No token received');

      await setAuth(normalizeUser(user), token, refreshToken || null);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('OTP Verification Failed', error.response?.data?.error || error.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    if (!phone) {
      Alert.alert('Phone Required', 'Please enter phone number first.');
      return;
    }

    setLoading(true);
    try {
      await authAPI.sendOtp(phone, 'sms');
      Alert.alert('OTP Sent', 'A new OTP has been sent to your phone.');
    } catch (error: any) {
      Alert.alert('Resend Failed', error.response?.data?.error || error.message || 'Could not resend OTP');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Phone Verification</Text>
      <Text style={styles.subtitle}>Enter the OTP sent to your phone</Text>

      <TextInput
        style={styles.input}
        placeholder="+61400000000"
        keyboardType="phone-pad"
        autoCapitalize="none"
        value={phone}
        onChangeText={setPhone}
      />

      <TextInput
        style={styles.input}
        placeholder="Enter OTP"
        keyboardType="number-pad"
        maxLength={8}
        value={code}
        onChangeText={setCode}
      />

      <TouchableOpacity style={[styles.primaryBtn, loading && styles.disabled]} onPress={handleVerifyOtp} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Verify OTP</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={[styles.secondaryBtn, loading && styles.disabled]} onPress={resendOtp} disabled={loading}>
        <Text style={styles.secondaryBtnText}>Resend OTP</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.backText}>Back to login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: Colors.background,
    padding: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: Colors.text,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 24,
    color: Colors.textSecondary,
    fontSize: 15,
  },
  input: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  secondaryBtn: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    backgroundColor: '#fff',
  },
  secondaryBtnText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  backText: {
    marginTop: 16,
    textAlign: 'center',
    color: Colors.textSecondary,
  },
  disabled: {
    opacity: 0.7,
  },
});
