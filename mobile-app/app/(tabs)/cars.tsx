import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput, ScrollView, Alert } from 'react-native';
import { MapPin, Calendar, SlidersHorizontal } from 'lucide-react-native';
import * as Location from 'expo-location';
import { carsAPI } from '@/services/api';
import { Colors } from '@/constants/Colors';
import { CustomHeader } from '@/components/custom-header';
import { CarCard } from '@/components/car-card';
import { SkeletonLoader } from '@/components/skeleton-loader';

type Car = {
  id: number;
  make: string;
  model: string;
  plate: string;
  year: number;
  status: string;
  daily_rate: string;
  category: string;
  colour?: string;
  image_url?: string;
};

export default function CarsScreen() {
  const [cars, setCars] = useState<Car[]>([]);
  const [filteredCars, setFilteredCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadCars();
  }, []);

  useEffect(() => {
    filterCars();
  }, [search, cars]);

  async function loadCars() {
    try {
      const response = await carsAPI.getAll();
      setCars(response.data.cars || []);
    } catch (error) {
      console.error('Failed to load cars:', error);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadCars();
    setRefreshing(false);
  }

  function filterCars() {
    let filtered = cars;
    if (search) {
      filtered = filtered.filter(car =>
        car.make.toLowerCase().includes(search.toLowerCase()) ||
        car.model.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFilteredCars(filtered);
  }

  const handleGetLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow location access to find cars near you.');
        return;
      }
      setLoading(true);
      const loc = await Location.getCurrentPositionAsync({});
      // Reverse geocode to get city
      const [address] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (address?.city || address?.region) {
        setSearch(address.city || address.region || '');
      }
    } catch (err) {
      Alert.alert('Error', 'Could not fetch location. Using default.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDate = () => {
    Alert.alert(
      'Select Rental Period',
      'Choose your preferred pick-up date:',
      [
        { text: 'Tomorrow', onPress: () => Alert.alert('Selected', 'Pickup set for Tomorrow') },
        { text: 'Next week', onPress: () => Alert.alert('Selected', 'Pickup set for Next Week') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Choose a Car" />

      {/* Floated Search / Config Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <TouchableOpacity style={styles.searchMain} onPress={handleGetLocation}>
            <MapPin size={18} color={Colors.primary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search city or brand..."
              placeholderTextColor={Colors.textSecondary}
              value={search}
              onChangeText={setSearch}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleSelectDate}>
            <Calendar size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={() => Alert.alert('Filters', 'Advanced filtering coming soon!')}>
          <SlidersHorizontal size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsText}>{filteredCars.length} Results</Text>
          <TouchableOpacity>
             <Text style={styles.dots}>●●●</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            {[...Array(5)].map((_, i) => (
              <View key={i} style={{ marginBottom: 16 }}>
                <SkeletonLoader width="100%" height={200} borderRadius={24} />
              </View>
            ))}
          </ScrollView>
        ) : (
          <FlatList
            data={filteredCars}
            renderItem={({ item }) => (
              <CarCard 
                id={item.id}
                make={item.make}
                model={item.model}
                rate={parseFloat(item.daily_rate).toFixed(0)}
                rating={4.5 + (item.id % 5) / 10}
                deals={10 + (item.id % 20)}
                imageUrl={item.image_url}
              />
            )}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No cars found in this area</Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: -30,
    paddingHorizontal: 24,
    zIndex: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  searchMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  iconBtn: {
    backgroundColor: Colors.accent,
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtn: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  resultsText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  dots: {
    fontSize: 10,
    letterSpacing: 1,
    color: Colors.textSecondary,
  },
  list: {
    paddingBottom: 40,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    color: Colors.textSecondary,
  }
});
