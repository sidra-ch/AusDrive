import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
import { CustomHeader } from '@/components/custom-header';
import { Star, Heart, Car, ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function SavedCarsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <CustomHeader title="Saved Cars" />
      
      <View style={styles.content}>
        <View style={styles.emptyContainer}>
          <View style={styles.iconCircle}>
            <Heart size={48} color={Colors.primary} fill="rgba(30, 58, 138, 0.1)" />
          </View>
          <Text style={styles.title}>No saved cars yet</Text>
          <Text style={styles.subtitle}>
            Tap the heart icon on any car to save it here for later.
          </Text>
          
          <TouchableOpacity 
            style={styles.browseBtn}
            onPress={() => router.push('/(tabs)/cars')}
          >
            <Text style={styles.browseBtnText}>Browse Our Fleet</Text>
            <ArrowRight size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 30,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 20,
    gap: 10,
  },
  browseBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
