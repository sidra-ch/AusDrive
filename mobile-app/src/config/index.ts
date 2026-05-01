/**
 * AusDrive Mobile — Enterprise Configuration
 * All environment-based config goes here. Never read process.env directly in features.
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

const resolveApiUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl) return envUrl;

  // Auto-detect host from Expo debugger in dev
  const hostSources = [
    (Constants as any)?.expoGoConfig?.debuggerHost,
    (Constants.expoConfig as any)?.hostUri,
    (Constants as any)?.manifest2?.extra?.expoGo?.debuggerHost,
    (Constants as any)?.manifest?.debuggerHost,
  ];
  for (const src of hostSources) {
    if (typeof src === 'string' && src.trim()) {
      const host = src.split(':')[0];
      if (host) return `http://${host}:3000`;
    }
  }

  if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
  return 'http://127.0.0.1:3000';
};

export const Config = {
  // API
  apiUrl: resolveApiUrl(),
  socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL?.trim() || resolveApiUrl(),

  // Maps
  googleMapsKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',

  // Payments
  stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',

  // Auth (Google)
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
  googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
  googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',

  // App
  appVersion: Constants.expoConfig?.version ?? '1.0.0',
  env: (__DEV__ ? 'development' : 'production') as 'development' | 'staging' | 'production',
  isDev: __DEV__,

  // Timeouts
  apiTimeoutMs: 15_000,
  refreshTokenBufferSecs: 60,

  // OTP
  otpResendCooldownSecs: 60,
  maxOtpAttempts: 5,

  // Sentry (set in prod builds)
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
} as const;
