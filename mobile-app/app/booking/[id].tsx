import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  ChevronLeft,
  Calendar,
  MapPin,
  CreditCard,
  Clock,
  Car,
  FileText,
  XCircle,
  RefreshCw,
} from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { bookingsAPI } from '@/services/api';
import { formatDate, formatDateTime, formatCurrency, formatBookingStatus } from '@src/utils/formatting';
import type { Booking, BookingStatus } from '@src/types';

const STATUS_COLORS: Record<BookingStatus, { bg: string; text: string }> = {
  pending: { bg: '#FFF3E0', text: '#F57C00' },
  payment_pending: { bg: '#FFF3E0', text: '#F57C00' },
  paid: { bg: '#E8F5E9', text: '#388E3C' },
  confirmed: { bg: '#E3F2FD', text: '#1976D2' },
  active: { bg: Colors.primary + '15', text: Colors.primary },
  completed: { bg: '#F3E5F5', text: '#7B1FA2' },
  cancelled: { bg: '#FFEBEE', text: Colors.danger },
};

export default function BookingDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (id) loadBooking();
  }, [id]);

  const loadBooking = async () => {
    try {
      const res = await bookingsAPI.getOne(Number(id));
      setBooking(res.data.booking ?? res.data);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Could not load booking.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? Cancellation fees may apply.',
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await bookingsAPI.cancel(Number(id));
              Alert.alert('Cancelled', 'Your booking has been cancelled.');
              setBooking(b => b ? { ...b, status: 'cancelled' } : b);
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.error || 'Could not cancel booking.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) return null;

  const statusStyle = STATUS_COLORS[booking.status] ?? STATUS_COLORS.pending;
  const canCancel = ['pending', 'payment_pending', 'paid', 'confirmed'].includes(booking.status);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking #{booking.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {formatBookingStatus(booking.status)}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Car Info */}
        <View style={styles.carCard}>
          {booking.car_image ? (
            <Image source={{ uri: booking.car_image }} style={styles.carImage} contentFit="cover" />
          ) : (
            <View style={[styles.carImage, styles.carImagePlaceholder]}>
              <Car size={40} color={Colors.textSecondary} />
            </View>
          )}
          <View style={styles.carInfo}>
            <Text style={styles.carName}>
              {booking.car_make} {booking.car_model}
            </Text>
            {booking.car_plate && (
              <Text style={styles.carPlate}>🚘 {booking.car_plate}</Text>
            )}
          </View>
        </View>

        {/* Trip Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Details</Text>

          <DetailRow
            icon={<MapPin size={16} color={Colors.primary} />}
            label="Pickup"
            value={booking.pickup_location}
          />
          <DetailRow
            icon={<MapPin size={16} color={Colors.danger} />}
            label="Drop-off"
            value={booking.dropoff_location || booking.pickup_location}
          />
          <DetailRow
            icon={<Calendar size={16} color={Colors.primary} />}
            label="From"
            value={formatDateTime(booking.pickup_date)}
          />
          <DetailRow
            icon={<Calendar size={16} color={Colors.primary} />}
            label="Until"
            value={formatDateTime(booking.return_date)}
          />
        </View>

        {/* Payment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <DetailRow
            icon={<CreditCard size={16} color={Colors.primary} />}
            label="Method"
            value={booking.payment_method === 'cash' ? 'Cash on Pickup' : 'Card / Stripe'}
          />
          {booking.total_amount && (
            <DetailRow
              icon={<FileText size={16} color={Colors.primary} />}
              label="Total (incl. GST)"
              value={formatCurrency(booking.total_amount)}
            />
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {booking.invoice_url && (
            <TouchableOpacity
              style={styles.invoiceBtn}
              onPress={() => router.push(`/invoice/${booking.id}` as any)}
            >
              <FileText size={18} color={Colors.primary} />
              <Text style={styles.invoiceBtnText}>View Invoice</Text>
            </TouchableOpacity>
          )}

          {canCancel && (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? (
                <ActivityIndicator size="small" color={Colors.danger} />
              ) : (
                <>
                  <XCircle size={18} color={Colors.danger} />
                  <Text style={styles.cancelBtnText}>Cancel Booking</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {booking.notes && (
          <Text style={styles.notes}>📝 {booking.notes}</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      {icon}
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontWeight: '700', fontSize: 17, color: Colors.text },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontWeight: '700', fontSize: 12 },
  scroll: { padding: 20, gap: 20, paddingBottom: 40 },
  carCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  carImage: {
    width: 90,
    height: 70,
    borderRadius: 10,
  },
  carImagePlaceholder: {
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carInfo: { flex: 1 },
  carName: { fontWeight: '700', fontSize: 16, color: Colors.text },
  carPlate: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  section: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  sectionTitle: { fontWeight: '700', fontSize: 15, color: Colors.text, marginBottom: 2 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  detailValue: { fontSize: 14, color: Colors.text, fontWeight: '600', marginTop: 1 },
  actions: { gap: 12 },
  invoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary + '10',
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  invoiceBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 15 },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.danger + '10',
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: Colors.danger,
  },
  cancelBtnText: { color: Colors.danger, fontWeight: '700', fontSize: 15 },
  notes: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
});
