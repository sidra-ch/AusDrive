import { useEffect, useState } from 'react';
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { format } from 'date-fns';
import { bookingsAPI } from '@/services/api';
import { Colors } from '@/constants/Colors';
import { CustomHeader } from '@/components/custom-header';
import { SkeletonLoader } from '@/components/skeleton-loader';
import { useRouter } from 'expo-router';

type Booking = {
  id: number;
  customer_name: string;
  car_make: string;
  car_model: string;
  pickup_date: string;
  return_date: string;
  status: string;
  total_amount?: number;
};

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    setError(null);
    try {
      const response = await bookingsAPI.getAll();
      setBookings(response.data.bookings || []);
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'Failed to load bookings';
      console.error('[Bookings] Load failed:', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  }

  function getStatusColor(status: string) {
    const s = status?.toUpperCase();
    switch (s) {
      case 'CONFIRMED': return Colors.success;
      case 'PENDING': return Colors.warning;
      case 'CANCELLED': return Colors.danger;
      case 'ACTIVE': return Colors.primary;
      case 'COMPLETED': return Colors.textSecondary;
      default: return Colors.textSecondary;
    }
  }

  const BookingCard = React.memo(function BookingCard({ item }: { item: Booking }) {
    return (
      <TouchableOpacity style={styles.bookingCard} onPress={() => router.push(`/booking/${item.id}` as any)}>
        <View style={styles.bookingHeader}>
          <View style={styles.bookingId}>
            <Text style={styles.bookingIdText}>BK-{item.id}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status?.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.bookingInfo}>
          {item.customer_name ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>👤</Text>
              <Text style={styles.infoText}>{item.customer_name}</Text>
            </View>
          ) : null}
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🚗</Text>
            <Text style={styles.infoText}>{item.car_make} {item.car_model}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🕐</Text>
            <Text style={styles.infoText}>
              {item.pickup_date ? format(new Date(item.pickup_date), 'MMM d') : 'N/A'} -{' '}
              {item.return_date ? format(new Date(item.return_date), 'MMM d, yyyy') : 'N/A'}
            </Text>
          </View>
        </View>

        {item.total_amount != null && (
          <View style={styles.bookingFooter}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amountValue}>${parseFloat(String(item.total_amount)).toFixed(2)}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  });

  return (
    <View style={styles.container}>
      <CustomHeader title="My Bookings" />

      {loading ? (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {[...Array(4)].map((_, i) => (
            <View key={i} style={{ marginBottom: 12 }}>
              <SkeletonLoader width="100%" height={160} borderRadius={16} />
            </View>
          ))}
        </ScrollView>
      ) : error ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>⚠️</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity onPress={loadBookings} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={({ item }) => <BookingCard item={item} />}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyText}>No bookings found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  bookingCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingId: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bookingIdText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  bookingInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoIcon: {
    fontSize: 16,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  amountLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.success,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
