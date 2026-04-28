import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
import { CustomHeader } from '@/components/custom-header';
import { Gift, Zap, Star, ArrowRight, Camera } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function OffersScreen() {
  const router = useRouter();

  const offers = [
    {
      title: 'First Trip Discount',
      desc: 'Get 20% off your very first rental with AusDrive.',
      code: 'WELCOME20',
      color: '#4F46E5',
      icon: <Zap size={24} color="#fff" />
    },
    {
      title: 'Weekend Special',
      desc: 'Rent for 3 days, pay for 2 on all SUV models.',
      code: 'WEEKEND32',
      color: '#10B981',
      icon: <Gift size={24} color="#fff" />
    },
    {
      title: 'Premium Member',
      desc: 'Double rewards points on all luxury car bookings.',
      code: 'LOYALTY10',
      color: '#F59E0B',
      icon: <Star size={24} color="#fff" />
    }
  ];

  return (
    <View style={styles.container}>
      <CustomHeader title="Exclusive Offers" />
      
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Summer Sale is Live! ☀️</Text>
            <Text style={styles.bannerSub}>Up to 40% off on convertibles and sports cars this month.</Text>
            <TouchableOpacity style={styles.bannerBtn}>
              <Text style={styles.bannerBtnText}>Claim Offer</Text>
            </TouchableOpacity>
          </View>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=400' }} 
            style={styles.bannerImg}
          />
        </View>

        <Text style={styles.sectionTitle}>Available Coupons</Text>
        
        {offers.map((offer, i) => (
          <View key={i} style={styles.offerCard}>
            <View style={[styles.iconBox, { backgroundColor: offer.color }]}>
              {offer.icon}
            </View>
            <View style={styles.offerInfo}>
              <Text style={styles.offerTitle}>{offer.title}</Text>
              <Text style={styles.offerDesc}>{offer.desc}</Text>
              <View style={styles.codeRow}>
                <View style={styles.codeBox}>
                  <Text style={styles.codeText}>{offer.code}</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/(tabs)/cars')}>
                    <Text style={styles.useText}>Apply Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        <View style={styles.footerSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
    padding: 20,
    marginTop: -40,
  },
  banner: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: 24,
    height: 160,
  },
  bannerContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    zIndex: 2,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  bannerSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginBottom: 16,
  },
  bannerBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  bannerBtnText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  bannerImg: {
    width: '40%',
    height: '100%',
    opacity: 0.6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 16,
  },
  offerCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerInfo: {
    flex: 1,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  offerDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  codeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.primary,
    letterSpacing: 1,
  },
  useText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  footerSpace: {
    height: 100,
  }
});
