import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Star, ChevronRight } from 'lucide-react-native';

import { useRouter } from 'expo-router';

interface CarCardProps {
  id: number | string;
  make: string;
  model: string;
  rate: string;
  rating: number;
  deals: number;
  imageUrl?: string;
}

function CarCardComponent({ id, make, model, rate, rating, deals, imageUrl }: CarCardProps) {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={() => router.push({
        pathname: "/car/[id]",
        params: { id, make, model, rate, image: imageUrl }
      })}
    >
      <Animated.View style={[
        styles.container,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}>
      {/* Top Section with Rating and Deals */}
      <View style={styles.badgeRow}>
        <View style={styles.ratingBadge}>
          <Star size={10} color="#FFB800" fill="#FFB800" />
          <Text style={styles.ratingText}>{rating}</Text>
        </View>
        <Text style={styles.dealsText}>{deals} Deals</Text>
      </View>

      {/* Car Image */}
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: imageUrl || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=400' }} 
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      {/* Info Section */}
      <View style={styles.infoRow}>
        <View style={styles.details}>
          <Text style={styles.name}>{make} {model}</Text>
          <Text style={styles.price}>From ${rate} / day</Text>
        </View>
        <TouchableOpacity style={styles.button}>
          <ChevronRight color="#fff" size={20} />
        </TouchableOpacity>
      </View>
    </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFB800',
  },
  dealsText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  imageContainer: {
    height: 120,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 10,
  },
  details: {
    gap: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  price: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  button: {
    backgroundColor: Colors.primary,
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// Export memoized component to prevent unnecessary re-renders in FlatList
export const CarCard = React.memo(CarCardComponent, (prevProps, nextProps) => {
  // Return true if props are equal (no re-render needed)
  // Return false if props changed (re-render needed)
  return (
    prevProps.id === nextProps.id &&
    prevProps.make === nextProps.make &&
    prevProps.model === nextProps.model &&
    prevProps.rate === nextProps.rate &&
    prevProps.rating === nextProps.rating &&
    prevProps.deals === nextProps.deals &&
    prevProps.imageUrl === nextProps.imageUrl
  );
});
