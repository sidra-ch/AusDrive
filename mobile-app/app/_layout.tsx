import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoadingScreenAdvanced } from '@/components/loading-screen-advanced';
import { useAuthStore } from '@/store/useAuthStore';
import { notificationService } from '@/services/notifications';
import { StripeProvider } from '@stripe/stripe-react-native';
import { OfflineBanner } from '@/components/offline-banner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 10,   // 10 minutes
    },
  },
});

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
      router.replace('/(auth)/welcome');
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
    <QueryClientProvider client={queryClient}>
      <StripeProvider
        publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_TYooMQauvdEDq54NiTphI7jx"}
      >
        <OfflineBanner />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="car/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="payment/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="booking/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="invoice/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="notifications" options={{ presentation: 'modal' }} />
        </Stack>
      </StripeProvider>
    </QueryClientProvider>
  );
}
