import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { Users, Phone, Mail, MapPin } from 'lucide-react-native';
import { customersAPI } from '@/services/api';
import { Colors } from '@/constants/Colors';

type Customer = {
  id: number;
  name: string;
  email: string;
  phone: string;
  address?: string;
  created_at: string;
  total_bookings?: number;
};

import { CustomHeader } from '@/components/custom-header';

export default function CustomersScreen() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [search, customers]);

  async function loadCustomers() {
    try {
      const response = await customersAPI.getAll();
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadCustomers();
    setRefreshing(false);
  }

  function filterCustomers() {
    let filtered = customers;

    if (search) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(search.toLowerCase()) ||
        customer.email.toLowerCase().includes(search.toLowerCase()) ||
        customer.phone.includes(search)
      );
    }

    setFilteredCustomers(filtered);
  }

  function renderCustomer({ item }: { item: Customer }) {
    return (
      <TouchableOpacity style={styles.customerCard}>
        <View style={styles.customerHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </Text>
          </View>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{item.name}</Text>
            <Text style={styles.customerId}>ID: {item.id}</Text>
          </View>
          {item.total_bookings && (
            <View style={styles.bookingsBadge}>
              <Text style={styles.bookingsText}>{item.total_bookings}</Text>
            </View>
          )}
        </View>

        <View style={styles.contactInfo}>
          <View style={styles.contactRow}>
            <Mail color={Colors.textSecondary} size={16} />
            <Text style={styles.contactText}>{item.email}</Text>
          </View>
          <View style={styles.contactRow}>
            <Phone color={Colors.textSecondary} size={16} />
            <Text style={styles.contactText}>{item.phone}</Text>
          </View>
          {item.address && (
            <View style={styles.contactRow}>
              <MapPin color={Colors.textSecondary} size={16} />
              <Text style={styles.contactText} numberOfLines={1}>{item.address}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader title="Customers" />

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search customers..."
            placeholderTextColor={Colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={filteredCustomers}
        renderItem={renderCustomer}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Users color={Colors.textSecondary} size={48} />
            <Text style={styles.emptyText}>No customers found</Text>
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
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    fontSize: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  list: {
    padding: 16,
    paddingTop: 8,
    gap: 12,
  },
  customerCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  customerInfo: {
    flex: 1,
    gap: 2,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  customerId: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  bookingsBadge: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bookingsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.success,
  },
  contactInfo: {
    gap: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});