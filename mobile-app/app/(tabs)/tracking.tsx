import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView, Platform, Animated } from 'react-native';
import { MapPin, Gauge, Fuel, Zap, Navigation } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import { Colors } from '@/constants/Colors';
import { SkeletonLoader } from '@/components/skeleton-loader';

// Conditionally load maps only for native platforms
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  try {
    const RNMaps = require('react-native-maps');
    MapView = RNMaps.default;
    Marker = RNMaps.Marker;
    PROVIDER_GOOGLE = RNMaps.PROVIDER_GOOGLE;
  } catch (e) {
    console.error('Failed to load react-native-maps', e);
    // Fallback to View on native if maps fail to load
    MapView = View;
    Marker = View;
  }
}

import { gpsAPI } from '@/services/api';
import { socketService } from '@/services/socket';

type TrackedCar = {
  car_id: number;
  make: string;
  model: string;
  plate: string;
  car_status: string;
  lat: number;
  lng: number;
  speed: number;
  ignition: boolean;
  fuel_level: number;
  updated_at: string;
};

export default function TrackingScreen() {
  const [tracking, setTracking] = useState<TrackedCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animated values for smooth marker transitions
  const markerAnimations = useRef<Map<string, Animated.ValueXY>>(new Map()).current;

  useEffect(() => {
    loadTracking();
    
    // Connect to socket for real-time GPS updates
    socketService.connect();
    
    // Listen for real GPS broadcasts from car devices
    socketService.on('gps_broadcast', (data: any) => {
      setTracking(prev => {
        const carIndex = prev.findIndex(car => car.car_id === data.carId);
        if (carIndex >= 0) {
          // Animate marker to new position
          const existingCar = prev[carIndex];
          const animation = markerAnimations.get(data.carId);
          
          if (animation) {
            Animated.timing(animation, {
              toValue: { x: data.longitude, y: data.latitude },
              duration: 1500, // Smooth 1.5 second animation
              useNativeDriver: false,
            }).start();
          } else {
            // Create new animation for this car
            const newAnimation = new Animated.ValueXY({
              x: data.longitude,
              y: data.latitude,
            });
            markerAnimations.set(data.carId, newAnimation);
          }

          // Update existing car data
          const updatedCars = [...prev];
          updatedCars[carIndex] = {
            ...updatedCars[carIndex],
            lat: data.latitude,
            lng: data.longitude,
            speed: data.speed || 0,
            updated_at: data.timestamp,
          };
          return updatedCars;
        } else {
          // Add new car with animation
          const newAnimation = new Animated.ValueXY({
            x: data.longitude,
            y: data.latitude,
          });
          markerAnimations.set(data.carId, newAnimation);
          
          return [...prev, {
            car_id: data.carId,
            make: 'Unknown',
            model: 'Vehicle',
            plate: 'UNKNOWN',
            car_status: 'active',
            lat: data.latitude,
            lng: data.longitude,
            speed: data.speed || 0,
            ignition: true,
            fuel_level: 75,
            updated_at: data.timestamp,
          }];
        }
      });
    });

    // Listen for car status updates (online/offline)
    socketService.on('car_status_update', (data: any) => {
      setTracking(prev => {
        if (data.status === 'offline') {
          // Remove car from tracking when offline
          return prev.filter(car => car.car_id !== data.carId);
        }
        return prev;
      });
    });

    // Refresh tracking data every 30 seconds as fallback
    const interval = setInterval(loadTracking, 30000);

    return () => {
      clearInterval(interval);
      socketService.disconnect();
    };
  }, []);

  async function loadTracking() {
    try {
      const response = await gpsAPI.getLive();
      setTracking(response.data.tracking || []);
    } catch (error) {
      console.error('Failed to load tracking:', error);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadTracking();
    setRefreshing(false);
  }

  const CarCard = React.memo(({ item }: { item: TrackedCar }) => {
  return (
    <View style={styles.carCard}>
      <View style={styles.carHeader}>
        <View style={styles.carInfo}>
          <Text style={styles.carName}>{item.make} {item.model}</Text>
          <Text style={styles.carPlate}>{item.plate}</Text>
        </View>
        <View style={[styles.ignitionBadge, { backgroundColor: item.ignition ? Colors.success + '20' : Colors.border }]}>
          <Zap color={item.ignition ? Colors.success : Colors.textSecondary} size={16} />
          <Text style={[styles.ignitionText, { color: item.ignition ? Colors.success : Colors.textSecondary }]}>
            {item.ignition ? 'ON' : 'OFF'}
          </Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Gauge color={Colors.primary} size={20} />
          <Text style={styles.statLabel}>Speed</Text>
          <Text style={styles.statValue}>{item.speed || 0} km/h</Text>
        </View>
        <View style={styles.statItem}>
          <Fuel color={Colors.warning} size={20} />
          <Text style={styles.statLabel}>Fuel</Text>
          <Text style={styles.statValue}>{item.fuel_level || 0}%</Text>
        </View>
        <View style={styles.statItem}>
          <Navigation color={Colors.info} size={20} />
          <Text style={styles.statLabel}>Location</Text>
          <Text style={styles.statValue}>
            {(item.lat || 0).toFixed(4)}, {(item.lng || 0).toFixed(4)}
          </Text>
        </View>
      </View>

      <View style={styles.carFooter}>
        <MapPin color={Colors.textSecondary} size={14} />
        <Text style={styles.updateText}>
          Updated {item.updated_at ? formatDistanceToNow(new Date(item.updated_at)) : 'unknown time'} ago
        </Text>
      </View>
    </View>
  );
});

CarCard.displayName = 'CarCard';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Live Fleet Tracking</Text>
          {loading ? (
            <SkeletonLoader width={120} height={16} borderRadius={4} style={{ marginTop: 6 }} />
          ) : (
            <Text style={styles.subtitle}>{tracking.length} vehicles tracked</Text>
          )}
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <View style={styles.mapContainer}>
        {loading ? (
          <SkeletonLoader width="100%" height={300} borderRadius={24} />
        ) : Platform.OS === 'web' ? (
          // Web fallback: Show table view instead of map
          <View style={styles.webMapFallback}>
            <Text style={styles.webFallbackText}>📍 Map View Not Available on Web</Text>
            <Text style={styles.webFallbackSubtext}>Use mobile app for live GPS tracking</Text>
          </View>
        ) : MapView ? (
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: tracking[0]?.lat || -33.8688,
              longitude: tracking[0]?.lng || 151.2093,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            {tracking.map((car) => (
              <Marker
                key={car.car_id}
                coordinate={{ latitude: car.lat || 0, longitude: car.lng || 0 }}
                title={`${car.make} ${car.model}`}
                description={car.plate}
              >
                <View style={styles.markerContainer}>
                  <View style={styles.markerDot} />
                </View>
              </Marker>
            ))}
          </MapView>
        ) : (
          <View style={styles.mapError}>
            <Text style={styles.mapErrorText}>Maps not available</Text>
          </View>
        )}
      </View>

      {loading ? (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {[...Array(3)].map((_, i) => (
            <View key={i} style={{ marginBottom: 12 }}>
              <SkeletonLoader width="100%" height={160} borderRadius={16} />
            </View>
          ))}
        </ScrollView>
      ) : (
        <FlatList
          data={tracking}
          renderItem={({ item }) => <CarCard item={item} />}
          keyExtractor={(item, index) => item.car_id?.toString() || index.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={10}
          getItemLayout={(data, index) => ({
            length: 172, // Approximate height of car card
            offset: 172 * index,
            index,
          })}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MapPin color={Colors.textSecondary} size={48} />
              <Text style={styles.emptyText}>No GPS-equipped vehicles</Text>
              <Text style={styles.emptySubtext}>Vehicles need GPS IMEI assigned</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  liveText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.success,
  },
  mapContainer: {
    height: 300,
    margin: 16,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(30, 58, 138, 0.2)',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  list: {
    padding: 16,
    paddingTop: 8,
    gap: 12,
  },
  carCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  carHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  carInfo: {
    gap: 4,
  },
  carName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  carPlate: {
    fontSize: 14,
    color: Colors.primary,
    fontFamily: 'monospace',
  },
  ignitionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ignitionText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statItem: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.text,
  },
  carFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  updateText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptySubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  webMapFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderRadius: 24,
  },
  webFallbackText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  webFallbackSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  mapError: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.danger + '20',
    borderRadius: 24,
  },
  mapErrorText: {
    fontSize: 14,
    color: Colors.danger,
  },
});
