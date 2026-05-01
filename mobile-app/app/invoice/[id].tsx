import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, FileText, Download } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { formatCurrency, formatDateTime } from '@src/utils/formatting';
import { extractGst } from '@src/utils/formatting';

/**
 * Invoice/Receipt screen (Australia GST-format)
 * Shows invoice for a completed or paid booking.
 */
export default function InvoiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // In production this would be fetched from API
  // For now show a structured placeholder with real data flow
  const invoice = {
    invoiceNumber: `INV-${id}-2026`,
    date: new Date().toISOString(),
    customerName: 'Customer',
    carName: 'Vehicle',
    pickup: '–',
    dropoff: '–',
    days: 1,
    baseRate: 0,
    insuranceFee: 0,
    addonsFee: 0,
    promoDiscount: 0,
    subtotal: 0,
    gst: 0,
    total: 0,
    paid: true,
    abn: '12 345 678 901',
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invoice</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Business Header */}
        <View style={styles.businessHeader}>
          <Text style={styles.businessName}>AusDrive Premium Pty Ltd</Text>
          <Text style={styles.businessDetail}>ABN: {invoice.abn}</Text>
          <Text style={styles.businessDetail}>Sydney, NSW 2000, Australia</Text>
          <Text style={styles.businessDetail}>support@ausdrive.com.au</Text>
        </View>

        <View style={styles.divider} />

        {/* Invoice Meta */}
        <View style={styles.metaRow}>
          <View>
            <Text style={styles.metaLabel}>Invoice #</Text>
            <Text style={styles.metaValue}>{invoice.invoiceNumber}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.metaLabel}>Date</Text>
            <Text style={styles.metaValue}>{formatDateTime(invoice.date)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Line Items */}
        <Text style={styles.sectionTitle}>Booking Summary</Text>

        <LineItem label="Base Rental Rate" value={invoice.baseRate} />
        {invoice.insuranceFee > 0 && (
          <LineItem label="Insurance Package" value={invoice.insuranceFee} />
        )}
        {invoice.addonsFee > 0 && (
          <LineItem label="Add-ons" value={invoice.addonsFee} />
        )}
        {invoice.promoDiscount > 0 && (
          <LineItem label="Promo Discount" value={-invoice.promoDiscount} highlight />
        )}

        <View style={styles.divider} />

        <LineItem label="Subtotal (ex. GST)" value={invoice.subtotal} />
        <LineItem label="GST 10%" value={invoice.gst} />
        <View style={[styles.totalRow]}>
          <Text style={styles.totalLabel}>Total (AUD)</Text>
          <Text style={styles.totalValue}>{formatCurrency(invoice.total)}</Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: invoice.paid ? Colors.success + '20' : Colors.warning + '20' }]}>
          <Text style={[styles.statusText, { color: invoice.paid ? Colors.success : Colors.warning }]}>
            {invoice.paid ? '✓ PAID' : 'PAYMENT PENDING'}
          </Text>
        </View>

        <Text style={styles.taxNote}>
          * This is a tax invoice for Australian GST purposes. GST is included in the total amount shown above.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function LineItem({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <View style={styles.lineItem}>
      <Text style={[styles.lineLabel, highlight && styles.highlightText]}>{label}</Text>
      <Text style={[styles.lineValue, highlight && styles.highlightText]}>
        {value < 0 ? `-${formatCurrency(-value)}` : formatCurrency(value)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
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
  headerTitle: { fontWeight: '700', fontSize: 17, color: Colors.text },
  scroll: { padding: 20, gap: 16, paddingBottom: 40 },
  businessHeader: { gap: 3 },
  businessName: { fontSize: 18, fontWeight: '800', color: Colors.text },
  businessDetail: { fontSize: 13, color: Colors.textSecondary },
  divider: { height: 1, backgroundColor: Colors.border },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600', textTransform: 'uppercase' },
  metaValue: { fontSize: 14, fontWeight: '700', color: Colors.text, marginTop: 2 },
  sectionTitle: { fontWeight: '700', fontSize: 15, color: Colors.text },
  lineItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  lineLabel: { fontSize: 14, color: Colors.textSecondary },
  lineValue: { fontSize: 14, fontWeight: '600', color: Colors.text },
  highlightText: { color: Colors.success },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  totalLabel: { fontSize: 16, fontWeight: '800', color: Colors.text },
  totalValue: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  statusBadge: { borderRadius: 10, padding: 12, alignItems: 'center' },
  statusText: { fontWeight: '800', fontSize: 15, letterSpacing: 1 },
  taxNote: { fontSize: 11, color: Colors.textSecondary, lineHeight: 16 },
});
