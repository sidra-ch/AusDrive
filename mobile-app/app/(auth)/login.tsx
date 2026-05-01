import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Eye, EyeOff, Mail, Lock, Phone } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { API_DEBUG_INFO, authAPI } from '@/services/api';
import * as AppleAuthentication from 'expo-apple-authentication';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();


export default function LoginScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '', phone: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable).catch(() => setAppleAvailable(false));
    }
  }, []);

  const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

  // Native Android/iOS clients use package-based auth — no redirect URI or responseType needed.
  // webClientId is required so the server can verify the idToken.
  const [googleRequest, googleResponse, promptGoogle] = Google.useAuthRequest({
    iosClientId: googleIosClientId,
    androidClientId: googleAndroidClientId,
    webClientId: googleWebClientId,
    scopes: ["openid", "profile", "email"],
  });

  const normalizeUser = (user: any) => ({
    ...user,
    id: String(user?.id ?? ''),
  });

  useEffect(() => {
    const processGoogleResponse = async () => {
      if (!googleResponse) return;

      if (googleResponse.type !== 'success') {
        if (googleResponse.type === 'dismiss') return;
        const errorDescription =
          (googleResponse as any)?.params?.error_description ||
          (googleResponse as any)?.error?.message ||
          (googleResponse as any)?.params?.error ||
          'Google authorization failed. Check Android/iOS OAuth client IDs in env.';
        Alert.alert('Google Login Failed', errorDescription);
        return;
      }

      // Native client code flow: idToken comes from authentication object after PKCE exchange
      const idToken =
        googleResponse.authentication?.idToken ||
        googleResponse.params?.id_token;
      if (!idToken) {
        Alert.alert('Google Login Failed', 'No ID token returned. Make sure EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is set (required for token verification).');
        return;
      }

      await handleOAuthLogin('google', idToken);
    };

    void processGoogleResponse();
  }, [googleResponse]);

  const handleGoogleLogin = async () => {
    if (!googleAndroidClientId && !googleIosClientId) {
      Alert.alert(
        'Google Login Config Missing',
        'Add EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID and/or EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID in mobile-app/.env and restart Expo with -c flag.'
      );
      return;
    }

    if (!googleRequest) {
      Alert.alert('Google Login', 'Google auth is not ready yet. Please try again.');
      return;
    }

    setGoogleLoading(true);
    try {
      await promptGoogle({ showInRecents: true });
    } catch (err: any) {
      Alert.alert('Google Login Failed', err.message || 'Authentication failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const showNetworkError = (title: string, error: any) => {
    const details = error?.response?.data?.error || error?.message || 'Request failed';
    if (!error?.response) {
      Alert.alert(
        title,
        `Network error. Backend URL: ${API_DEBUG_INFO.apiUrl}\n\nMake sure Next.js backend is running on port 3000 and mobile + laptop are on same WiFi.\n\nDetail: ${details}`
      );
      return;
    }
    Alert.alert(title, details);
  };

  const handleOAuthLogin = async (provider: 'google' | 'apple', token: string, fullName?: any) => {
    setLoading(true);
    try {
      let res;
      if (provider === 'google') {
        res = await authAPI.google(token);
      } else {
        res = await authAPI.apple(token, fullName);
      }
      const { user, token: authToken, refreshToken } = res.data;
      if (!authToken) throw new Error('No token received from server');
      await setAuth(normalizeUser(user), authToken, refreshToken || null);
      router.replace('/(tabs)');
    } catch (err: any) {
      showNetworkError('Login Failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    if (!appleAvailable) {
      Alert.alert(
        'Apple Sign In Unavailable',
        'Apple Sign In requires a development build. It is not supported in Expo Go.'
      );
      return;
    }
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        await handleOAuthLogin('apple', credential.identityToken, credential.fullName);
      } else {
        Alert.alert('Apple Login Failed', 'No identity token returned from Apple.');
      }
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Apple Login Failed', e.message);
      }
    }
  };

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.login(form.email, form.password);
      const { user, token, refreshToken } = res.data;

      if (!token) throw new Error('No token received from server');

      await setAuth(normalizeUser(user), token, refreshToken || null);
      router.replace('/(tabs)');
    } catch (error: any) {
      showNetworkError('Login Failed', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!form.phone) {
      Alert.alert('Phone Required', 'Please enter your phone number with country code.');
      return;
    }

    setLoading(true);
    try {
      await authAPI.sendOtp(form.phone, 'sms');
      router.push({ pathname: '/(auth)/otp', params: { phone: form.phone } });
    } catch (error: any) {
      showNetworkError('OTP Failed', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Welcome back.</Text>
        <Text style={styles.subtitle}>Sign in to your AusDrive Premium account.</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Access</Text>
          <View style={styles.inputContainer}>
            <Mail size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(text) => setForm({ ...form, email: text })}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Secure Password</Text>
          <View style={styles.inputContainer}>
            <Lock size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              value={form.password}
              onChangeText={(text) => setForm({ ...form, password: text })}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? (
                <EyeOff size={20} color={Colors.textSecondary} />
              ) : (
                <Eye size={20} color={Colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={styles.forgotPassword}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.loginBtn, loading && styles.loginBtnDisabled]} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginBtnText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone OTP Login</Text>
          <View style={styles.inputContainer}>
            <Phone size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="+61400000000"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(text) => setForm({ ...form, phone: text })}
            />
          </View>
          <TouchableOpacity
            style={[styles.secondaryBtn, loading && styles.loginBtnDisabled]}
            onPress={handleSendOtp}
            disabled={loading}
          >
            <Text style={styles.secondaryBtnText}>Send OTP</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
        <View style={styles.divider} />
      </View>

      <View style={styles.socialContainer}>
        <TouchableOpacity style={[styles.socialBtn, (loading || googleLoading) && styles.loginBtnDisabled]} onPress={handleGoogleLogin} disabled={loading || googleLoading}>
          {googleLoading ? (
            <ActivityIndicator color={Colors.text} />
          ) : (
            <Text style={styles.socialBtnText}>Continue with Google</Text>
          )}
        </TouchableOpacity>
        
        {Platform.OS === 'ios' && (
          <TouchableOpacity style={[styles.socialBtn, styles.appleBtn]} onPress={handleAppleLogin} disabled={loading}>
            <Text style={[styles.socialBtnText, styles.appleBtnText]}>
              {appleAvailable ? 'Apple' : 'Apple (dev build only)'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
          <Text style={styles.signupLink}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  form: {
    gap: 20,
    marginBottom: 30,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  forgotPassword: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  loginBtn: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.textSecondary,
    paddingHorizontal: 16,
    fontSize: 12,
    fontWeight: '600',
  },
  socialContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
  },
  socialBtn: {
    flex: 1,
    height: 56,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialBtnText: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  appleBtn: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  appleBtnText: {
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: 15,
  },
  signupLink: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: 'bold',
  },
  secondaryBtn: {
    marginTop: 10,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  secondaryBtnText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
