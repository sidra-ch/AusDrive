import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStripe, CardField } from '@stripe/stripe-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Lock } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { paymentsAPI } from '@/services/api';

export default function PaymentScreen() {
  const { id } = useLocalSearchParams(); // booking ID
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const router = useRouter();
  const { confirmPayment } = useStripe();

  useEffect(() => {
    fetchPaymentIntent();
  }, [id]);

  const fetchPaymentIntent = async () => {
    try {
      setLoading(true);
      const res = await paymentsAPI.createPaymentIntent({
        bookingId: id as string,
        amount: 0, // backend calculates from bookingId
      });
      setClientSecret(res.data.clientSecret);
      setAmount(res.data.amount);
    } catch (error: any) {
      console.error('Error fetching intent:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to initialize payment.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handlePayPress = async () => {
    if (!clientSecret) return;

    setProcessing(true);

    try {
      const { error, paymentIntent } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
      });

      if (error) {
        Alert.alert('Payment failed', error.message);
      } else if (paymentIntent) {
        Alert.alert('Success', 'Your booking is confirmed!', [
          { text: 'OK', onPress: () => router.replace('/(tabs)/bookings') }
        ]);
      }
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', 'An unexpected error occurred during payment.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Secure Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Initializing secure payment...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Amount to Pay</Text>
            <Text style={styles.amountText}>${(amount / 100).toFixed(2)} AUD</Text>
            <View style={styles.secureBadge}>
              <Lock size={12} color="#10b981" />
              <Text style={styles.secureText}>Encrypted & Secure</Text>
            </View>
          </View>

          <Text style={styles.label}>Card Details</Text>
          <CardField
            postalCodeEnabled={false}
            style={styles.cardField}
            cardStyle={{
              backgroundColor: '#f8f9fa',
              textColor: '#000000',
              placeholderColor: '#aab7c4',
              borderColor: '#e2e8f0',
              borderWidth: 1,
              borderRadius: 12,
            }}
          />

          <TouchableOpacity 
            style={[styles.payButton, processing && styles.disabledButton]} 
            onPress={handlePayPress}
            disabled={processing || !clientSecret}
          >
            {processing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.payButtonText}>Pay ${(amount / 100).toFixed(2)}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  summaryCard: {
    backgroundColor: '#f8f9fa',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  summaryTitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  amountText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  secureText: {
    color: '#065f46',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  cardField: {
    width: '100%',
    height: 60,
    marginBottom: 32,
  },
  payButton: {
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#94a3b8',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
