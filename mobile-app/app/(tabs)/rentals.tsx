import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';

import { format } from 'date-fns';
import { rentalsAPI } from '@/services/api';
import { Colors } from '@/constants/Colors';

type Rental = {
  id: number;
  customer_name: string;
  car_make: string;
  car_model: string;
  car_plate: string;
  start_date: string;
  expected_return: string;
  status: string;
  total_amount: number;
  daily_rate: number;
};

export default function RentalsScreen() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadRentals();
  }, []);

  async function loadRentals() {
    try {
      const response = await rentalsAPI.getAll();
      setRentals(response.data.rentals || []);
    } catch (error) {
      console.error('Failed to load rentals:', error);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadRentals();
    setRefreshing(false);
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'active': return Colors.success;
      case 'completed': return Colors.info;
      case 'overdue': return Colors.danger;
      case 'cancelled': return Colors.textSecondary;
      default: return Colors.warning;
    }
  }

  const filteredRentals = filter === 'all' 
    ? rentals 
    : rentals.filter(r => r.status === filter);

  const stats = {
    active: rentals.filter(r => r.status === 'active').length,
    completed: rentals.filter(r => r.status === 'completed').length,
    overdue: rentals.filter(r => r.status === 'overdue').length,
  };

  function renderRental({ item }: { item: Rental }) {
    const isActive = item.status === 'active';
    const isOverdue = item.status === 'overdue';
    
    return (
      <TouchableOpacity style={styles.rentalCard}>
        <View style={styles.rentalHeader}>
          <View style={styles.rentalId}>
            <Text style={styles.rentalIdText}>R-{item.id}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.rentalInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>👤</Text>
            <Text style={styles.infoText}>{item.customer_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🚗</Text>
            <Text style={styles.infoText}>{item.car_make} {item.car_model} • {item.car_plate}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📅</Text>
            <Text style={styles.infoText}>
              {item.start_date ? format(new Date(item.start_date), 'MMM d') : 'N/A'} - {item.expected_return ? format(new Date(item.expected_return), 'MMM d, yyyy') : 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.rentalFooter}>
          <View style={styles.rateInfo}>
            <Text style={styles.rateLabel}>Daily Rate</Text>
            <Text style={styles.rateValue}>${parseFloat(String(item.daily_rate)).toFixed(0)}/day</Text>
          </View>
          <View style={styles.totalInfo}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={[styles.totalValue, { color: isOverdue ? Colors.danger : Colors.success }]}>
              ${parseFloat(String(item.total_amount)).toFixed(2)}
            </Text>
          </View>
        </View>

        {isOverdue && (
          <View style={styles.overdueAlert}>
            <Text style={styles.overdueIcon}>⚠️</Text>
            <Text style={styles.overdueText}>Rental is overdue</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Active Rentals</Text>
        <Text style={styles.subtitle}>{rentals.length} total rentals</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.active}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: Colors.danger }]}>{stats.overdue}</Text>
          <Text style={styles.statLabel}>Overdue</Text>
        </View>
      </View>

      <View style={styles.filters}>
        {['all', 'active', 'completed', 'overdue'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.filterBtn, filter === status && styles.filterBtnActive]}
            onPress={() => setFilter(status)}
          >
            <Text style={[styles.filterText, filter === status && styles.filterTextActive]}>
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredRentals}
        renderItem={renderRental}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔑</Text>
            <Text style={styles.emptyText}>No rentals found</Text>
          </View>
        }
      />
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
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterBtnActive: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  filterTextActive: {
    color: Colors.primary,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  rentalCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rentalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rentalId: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rentalIdText: {
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
  rentalInfo: {
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
    flex: 1,
  },
  rentalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  rateInfo: {
    alignItems: 'flex-start',
  },
  rateLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  rateValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
  },
  totalInfo: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  overdueAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.danger + '20',
    borderColor: Colors.danger + '40',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  overdueIcon: {
    fontSize: 16,
  },
  overdueText: {
    fontSize: 14,
    color: Colors.danger,
    fontWeight: '600',
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
});