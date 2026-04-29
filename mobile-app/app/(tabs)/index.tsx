import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Animated, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { dashboardAPI } from '@/services/api';
import { aiService, CarRecommendation } from '@/services/ai-service';
import { Colors } from '@/constants/Colors';
import { CustomHeader } from '@/components/custom-header';
import { SkeletonLoader } from '@/components/skeleton-loader';
import { Car, Users, Calendar, Key, MapPin, Wrench, ArrowRight, Star, Zap, BrainCircuit } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<CarRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const fadeAnims = useRef([...Array(6)].map(() => new Animated.Value(0))).current;
  const slideAnims = useRef([...Array(6)].map(() => new Animated.Value(30))).current;

  useEffect(() => {
    loadData();
    startAnimations();
  }, []);

  async function loadData() {
    setLoading(true);
    await Promise.all([loadStats(), loadRecommendations()]);
    setLoading(false);
  }

  function startAnimations() {
    fadeAnims.forEach((anim, i) => {
      Animated.parallel([
        Animated.timing(anim, {
          toValue: 1,
          duration: 600,
          delay: i * 100,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnims[i], {
          toValue: 0,
          tension: 20,
          delay: i * 100,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }

  async function loadStats() {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data.stats ?? response.data.kpis);
    } catch (error: any) {
      const status = error?.response?.status;
      const backendMessage = error?.response?.data?.error;
      if (status) {
        console.warn(`[Dashboard] Stats request failed (${status}): ${backendMessage || 'Unknown server error'}`);
      } else {
        console.warn('Backend offline - using demo data');
      }
      setStats({
        total_bookings: 12,
        active_rentals: 3,
        total_revenue: 2850,
        available_cars: 28,
      });
    }
  }

  async function loadRecommendations() {
    try {
      const data = await aiService.getRecommendations(1000);
      // Fallback with demo data if API returns empty
      if (data.length === 0) {
        setRecommendations([
          {
            id: 1,
            make: 'Toyota',
            model: 'Camry',
            category: 'Sedan',
            daily_rate: '$85',
            image_url: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=400',
            ai_reason: 'Popular choice for comfort & reliability',
          },
          {
            id: 2,
            make: 'BMW',
            model: '3 Series',
            category: 'Luxury',
            daily_rate: '$150',
            image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=400',
            ai_reason: 'Premium performance match for you',
          },
        ]);
      } else {
        setRecommendations(data);
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const backendMessage = error?.response?.data?.error;
      if (status) {
        console.warn(`[Dashboard] Recommendations failed (${status}): ${backendMessage || 'Unknown server error'}`);
      } else {
        console.warn('Backend offline - using demo data');
      }
      // Demo data on error
      setRecommendations([
        {
          id: 1,
          make: 'Toyota',
          model: 'Camry',
          category: 'Sedan',
          daily_rate: '$85',
          image_url: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=400',
          ai_reason: 'Popular choice for comfort & reliability',
        },
      ]);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }

  return (
    <View style={styles.container}>
      <CustomHeader title="AusDrive" />
      
      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Location & Search Section */}
        <Animated.View style={[styles.topSection, { opacity: fadeAnims[0], transform: [{ translateY: slideAnims[0] }] }]}>
          <View style={styles.locationRow}>
            <MapPin size={18} color={Colors.primary} />
            <Text style={styles.locationText}>Sydney, Australia 🇦🇺</Text>
            <ArrowRight size={14} color={Colors.textSecondary} />
          </View>
          
          <View style={styles.searchBar}>
            <View style={styles.searchInputGroup}>
              <Car size={20} color={Colors.textSecondary} />
              <View>
                <Text style={styles.searchLabel}>Pick-up & Drop-off</Text>
                <Text style={styles.searchValue}>Sydney Intl. Airport</Text>
              </View>
            </View>
            <View style={styles.searchDivider} />
            <TouchableOpacity style={styles.searchDateGroup}>
              <Calendar size={20} color={Colors.textSecondary} />
              <View>
                <Text style={styles.searchLabel}>Dates</Text>
                <Text style={styles.searchValue}>24 Apr - 28 Apr</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View style={[styles.statsGrid, { opacity: fadeAnims[1], transform: [{ translateY: slideAnims[1] }] }]}>
          {loading ? (
            <>
              <SkeletonLoader width="45%" height={80} borderRadius={20} />
              <SkeletonLoader width="45%" height={80} borderRadius={20} />
            </>
          ) : (
            <>
              <StatCard label="Available Cars" value={stats?.totalCars || 42} color={Colors.primary} />
              <StatCard label="Active Offers" value="12" color={Colors.success} />
              <StatCard label="Avg Price" value="$120" color={Colors.info} />
            </>
          )}
        </Animated.View>

        {/* AI Recommendations Section */}
        {recommendations.length > 0 && (
          <Animated.View style={[styles.section, { opacity: fadeAnims[1], transform: [{ translateY: slideAnims[1] }] }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recommended for You</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredList}>
              {recommendations.map((car) => (
                <TouchableOpacity 
                  key={car.id} 
                  style={styles.aiCard}
                  onPress={() => router.push({
                    pathname: `/car/${car.id}`,
                    params: { 
                      make: car.make, 
                      model: car.model, 
                      rate: car.daily_rate,
                      image: car.image_url || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=400'
                    }
                  })}
                >
                  <Image 
                    source={{ uri: car.image_url || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=400' }} 
                    style={styles.aiImg} 
                    resizeMode="contain" 
                  />
                  <Text style={styles.aiName}>{car.make} {car.model}</Text>
                  <Text style={styles.aiReason}>{car.ai_reason}</Text>
                  <View style={styles.aiBtn}>
                    <Text style={styles.aiBtnText}>Book for ${parseFloat(car.daily_rate).toFixed(0)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Featured Section */}
        <Animated.View style={[styles.section, { opacity: fadeAnims[1], transform: [{ translateY: slideAnims[1] }] }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Fleet</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/cars')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredList}>
            <FeaturedCard 
              name="Tesla Model 3" 
              price="149" 
              img="https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=400" 
              rating={4.9} 
              onPress={() => router.push('/(tabs)/cars')}
            />
            <FeaturedCard 
              name="Toyota Prado" 
              price="180" 
              img="https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&q=80&w=400" 
              rating={4.8} 
              onPress={() => router.push('/(tabs)/cars')}
            />
          </ScrollView>
        </Animated.View>

        <Animated.View style={[styles.section, { opacity: fadeAnims[2], transform: [{ translateY: slideAnims[2] }] }]}>
          <Text style={styles.sectionTitle}>Explore Categories</Text>
          <View style={styles.actionsGrid}>
            <ActionItem title="SUV" icon={<Car size={24} color={Colors.primary} />} count="12" onPress={() => router.push('/(tabs)/cars')} />
            <ActionItem title="Luxury" icon={<Star size={24} color={Colors.primary} />} count="5" onPress={() => router.push('/(tabs)/cars')} />
            <ActionItem title="Sports" icon={<Zap size={24} color={Colors.primary} />} count="8" onPress={() => router.push('/(tabs)/cars')} />
            <ActionItem title="Electric" icon={<Zap size={24} color={Colors.primary} />} count="10" onPress={() => router.push('/(tabs)/cars')} />
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, color }: any) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
    </View>
  );
}

function FeaturedCard({ name, price, img, rating, onPress }: any) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.featuredCard}>
      <Image source={{ uri: img }} style={styles.featuredImg} resizeMode="contain" />
      <View style={styles.featuredInfo}>
        <Text style={styles.featuredName}>{name}</Text>
        <View style={styles.featuredBottom}>
          <Text style={styles.featuredPrice}>${price}/day</Text>
          <View style={styles.ratingBox}>
            <Star size={10} color="#FFB800" fill="#FFB800" />
            <Text style={styles.ratingText}>{rating}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function ActionItem({ title, icon, count, onPress }: any) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.actionItem}>
      <View style={styles.actionIcon}>{icon}</View>
      <View>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionCount}>{count} Cars</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
    marginTop: -50,
    paddingHorizontal: 20,
  },
  topSection: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  searchBar: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInputGroup: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
  },
  searchDateGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  searchValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  seeAll: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '700',
  },
  featuredList: {
    marginLeft: -4,
  },
  featuredCard: {
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  featuredImg: {
    width: '100%',
    height: 100,
    marginBottom: 12,
  },
  featuredInfo: {
    gap: 4,
  },
  featuredName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  featuredBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFB800',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  actionCount: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  aiBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  aiCard: {
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(30, 58, 138, 0.1)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  aiImg: {
    width: '100%',
    height: 120,
    marginBottom: 16,
  },
  aiName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  aiReason: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  aiBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  aiBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
