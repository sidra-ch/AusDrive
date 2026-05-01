import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { LoadingScreenAdvanced } from '@/components/loading-screen-advanced';
import { useAuthStore } from '@/store/useAuthStore';
import { notificationService } from '@/services/notifications';

export default function RootLayout() {
  const { loadAuth, isLoading, isAuthenticated } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [minimumLoaderVisible, setMinimumLoaderVisible] = useState(true);

  useEffect(() => {
    loadAuth();
    notificationService.initialize().catch(error => {
      console.warn('Failed to initialize notification service:', error);
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinimumLoaderVisible(false);
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  // Safety timeout - if loadAuth hangs (e.g. SecureStore hang), force navigation
  useEffect(() => {
    if (!isLoading) return;

    const timeout = setTimeout(() => {
      console.warn('Loading timeout - forcing navigation');
      useAuthStore.setState({ isLoading: false });
    }, 10000);

    return () => clearTimeout(timeout);
  }, [isLoading]);

  if (isLoading || minimumLoaderVisible) {
    return <LoadingScreenAdvanced />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="car/[id]" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
