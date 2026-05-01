import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, ChevronLeft, Calendar, CreditCard, Car, AlertTriangle, Gift } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import { Colors } from '@/constants/Colors';
import { notificationService, PushNotification } from '@/services/notifications';
import { notificationsAppAPI } from '@/services/api';

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async () => {
    try {
      // Try real API first
      const res = await notificationsAppAPI.getAll();
      const apiNotifs: PushNotification[] = (res.data.notifications ?? []).map((n: any) => ({
        id: String(n.id),
        title: n.title,
        body: n.body || n.message,
        timestamp: n.createdAt || n.created_at || new Date().toISOString(),
        type: n.type || 'system',
        data: n.data ?? {},
      }));
      if (apiNotifs.length > 0) {
        setNotifications(apiNotifs);
        return;
      }
    } catch {
      // fall through to mock data in dev
    }
    // Dev mock fallback
    if (__DEV__) {
      setNotifications([
        {
          id: '1',
          title: 'Booking Confirmed! 🎉',
          body: 'Your Tesla Model 3 is confirmed for Sydney pick-up.',
          timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          type: 'booking',
          data: { type: 'booking_confirmed', bookingId: '123' },
        },
        {
          id: '2',
          title: 'Payment Successful ✅',
          body: 'Payment of $450 processed successfully.',
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          type: 'payment',
          data: { type: 'payment_success', bookingId: '123' },
        },
      ]);
    }
  };

  const initializeNotifications = async () => {
    try {
      await notificationService.initialize();
      loadNotifications();
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeNotifications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'booking':
        return <Calendar size={20} color={Colors.success} />;
      case 'payment':
        return <CreditCard size={20} color={Colors.primary} />;
      case 'system':
        return <AlertTriangle size={20} color={Colors.warning} />;
      case 'promotional':
        return <Gift size={20} color={Colors.warning} />;
      default:
        return <Bell size={20} color={Colors.textSecondary} />;
    }
  };

  const getNotificationColor = (type?: string) => {
    switch (type) {
      case 'booking':
        return Colors.success;
      case 'payment':
        return Colors.primary;
      case 'system':
        return Colors.warning;
      case 'promotional':
        return Colors.warning;
      default:
        return Colors.textSecondary;
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  const NotificationCard = React.memo(({ item }: { item: PushNotification }) => {
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => {
          // Handle notification press
          console.log('Notification pressed:', item.data);
        }}
      >
        <View style={[styles.iconBox, { backgroundColor: getNotificationColor(item.type) + '20' }]}>
          {getNotificationIcon(item.type)}
        </View>
        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.time}>{formatTime(item.timestamp!)}</Text>
          </View>
          <Text style={styles.body}>{item.body}</Text>
        </View>
      </TouchableOpacity>
    );
  });

  NotificationCard.displayName = 'NotificationCard';

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft color={Colors.text} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text>Loading notifications...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color={Colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={() => notificationService.clearAllNotifications()}>
          <Text style={styles.clearBtn}>Clear</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id || Math.random().toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <NotificationCard item={item} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Bell color={Colors.textSecondary} size={48} />
            <Text style={styles.emptyText}>No notifications</Text>
            <Text style={styles.emptySubtext}>We&apos;ll notify you about important updates</Text>
          </View>
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        initialNumToRender={10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  list: {
    padding: 20,
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  time: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  body: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearBtn: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
