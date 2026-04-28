import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Wrench, Car, Calendar, DollarSign } from 'lucide-react-native';
import { format } from 'date-fns';
import { maintenanceAPI } from '@/services/api';
import { Colors } from '@/constants/Colors';

type Maintenance = {
  id: number;
  car_make: string;
  car_model: string;
  car_plate: string;
  type: string;
  description: string;
  cost: number;
  service_date: string;
  status: string;
  provider?: string;
};

export default function MaintenanceScreen() {
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadMaintenance();
  }, []);

  async function loadMaintenance() {
    try {
      const response = await maintenanceAPI.getAll();
      setMaintenance(response.data.maintenance || []);
    } catch (error) {
      console.error('Failed to load maintenance:', error);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadMaintenance();
    setRefreshing(false);
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed': return Colors.success;
      case 'in_progress': return Colors.info;
      case 'scheduled': return Colors.warning;
      default: return Colors.textSecondary;
    }
  }

  function getTypeIcon(type: string) {
    if (type.toLowerCase().includes('oil')) return '🛢️';
    if (type.toLowerCase().includes('tire')) return '🛞';
    if (type.toLowerCase().includes('brake')) return '🔧';
    if (type.toLowerCase().includes('inspection')) return '🔍';
    return '⚙️';
  }

  const filteredMaintenance = filter === 'all' 
    ? maintenance 
    : maintenance.filter(m => m.status === filter);

  function renderMaintenance({ item }: { item: Maintenance }) {
    return (
      <TouchableOpacity style={styles.maintenanceCard}>
        <View style={styles.cardHeader}>
          <View style={styles.typeContainer}>
            <Text style={styles.typeIcon}>{getTypeIcon(item.type)}</Text>
            <View>
              <Text style={styles.typeName}>{item.type}</Text>
              <Text style={styles.maintenanceId}>M-{item.id}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.replace('_', ' ')}
            </Text>
          </View>
        </View>

        <View style={styles.carInfo}>
          <Car color={Colors.textSecondary} size={16} />
          <Text style={styles.carText}>
            {item.car_make} {item.car_model} • {item.car_plate}
          </Text>
        </View>

        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <Calendar color={Colors.textSecondary} size={14} />
            <Text style={styles.footerText}>
              {format(new Date(item.service_date), 'MMM d, yyyy')}
            </Text>
          </View>
          <View style={styles.footerItem}>
            <DollarSign color={Colors.success} size={14} />
            <Text style={[styles.footerText, { color: Colors.success, fontWeight: 'bold' }]}>
              ${parseFloat(String(item.cost)).toFixed(2)}
            </Text>
          </View>
        </View>

        {item.provider && (
          <View style={styles.provider}>
            <Text style={styles.providerText}>Provider: {item.provider}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  const stats = {
    scheduled: maintenance.filter(m => m.status === 'scheduled').length,
    inProgress: maintenance.filter(m => m.status === 'in_progress').length,
    completed: maintenance.filter(m => m.status === 'completed').length,
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Maintenance Schedule</Text>
        <Text style={styles.subtitle}>{maintenance.length} records</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.scheduled}</Text>
          <Text style={styles.statLabel}>Scheduled</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.inProgress}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      <View style={styles.filters}>
        {['all', 'scheduled', 'in_progress', 'completed'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.filterBtn, filter === status && styles.filterBtnActive]}
            onPress={() => setFilter(status)}
          >
            <Text style={[styles.filterText, filter === status && styles.filterTextActive]}>
              {status === 'all' ? 'All' : status.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredMaintenance}
        renderItem={renderMaintenance}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Wrench color={Colors.textSecondary} size={48} />
            <Text style={styles.emptyText}>No maintenance records</Text>
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
    textTransform: 'capitalize',
  },
  filterTextActive: {
    color: Colors.primary,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  maintenanceCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeIcon: {
    fontSize: 32,
  },
  typeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  maintenanceId: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  carInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  carText: {
    fontSize: 14,
    color: Colors.text,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  provider: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 8,
  },
  providerText: {
    fontSize: 12,
    color: Colors.textSecondary,
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
