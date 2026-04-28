import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Home, 
  Car, 
  Calendar, 
  MapPin, 
  User, 
  Settings, 
  HelpCircle, 
  LogOut, 
  Wrench,
  Users,
  Wallet,
  BarChart2,
  BrainCircuit,
  Star
} from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { useAuthStore } from '@/store/useAuthStore';

export function SidebarContent() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  const menuItems = [
    { label: 'Browse Cars', icon: <Car size={22} color={Colors.primary} />, path: '/(tabs)/cars' },
    { label: 'My Bookings', icon: <Calendar size={22} color={Colors.primary} />, path: '/(tabs)/bookings' },
    { label: 'Saved Cars', icon: <Star size={22} color={Colors.primary} />, path: '/(tabs)/saved' },
    { label: 'Live Tracking', icon: <MapPin size={22} color={Colors.primary} />, path: '/(tabs)/tracking' },
    { label: 'Payments & Wallet', icon: <Wallet size={22} color={Colors.primary} />, path: '/notifications' },
    { label: 'Exclusive Offers', icon: <Users size={22} color={Colors.success} />, path: '/(tabs)/offers' },
  ];

  const adminItems = [
    { label: 'Admin Dashboard', icon: <BarChart2 size={22} color={Colors.warning} />, path: '/(tabs)/index' },
    { label: 'Manage Cars', icon: <Car size={22} color={Colors.warning} />, path: '/(tabs)/cars' },
    { label: 'AI Insights', icon: <BrainCircuit size={22} color={Colors.warning} />, path: '/(tabs)/index' },
    { label: 'Pricing Control', icon: <Settings size={22} color={Colors.warning} />, path: '/(tabs)/index' },
    { label: 'Users Management', icon: <Users size={22} color={Colors.info} />, path: '/(tabs)/customers' },
    { label: 'Revenue Analytics', icon: <Wallet size={22} color={Colors.info} />, path: '/(tabs)/index' },
  ];

  const handleLogout = async () => {
    await clearAuth();
    router.replace('/(auth)/login');
  };

  const getUserIdDisplay = () => {
    if (!user?.id) return 'AD-10293';
    try {
      const idStr = String(user.id);
      return idStr.substring(0, 8).toUpperCase();
    } catch (e) {
      return 'AD-10293';
    }
  };

  return (
    <View style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <User size={32} color="#fff" />
        </View>
        <View>
          <Text style={styles.name}>{user?.name || 'AusDrive User'}</Text>
          <Text style={styles.email}>{user?.email || 'Premium Member'}</Text>
          <Text style={styles.userId}>ID: {getUserIdDisplay()}</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll}>
        <Text style={styles.sectionTitle}>MAIN MENU</Text>
        {menuItems.map((item, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.item} 
            onPress={() => router.push(item.path as any)}
          >
            {item.icon}
            <Text style={styles.itemText}>{item.label}</Text>
          </TouchableOpacity>
        ))}

        {user?.role === 'admin' && (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>ADMINISTRATION</Text>
            {adminItems.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.item} 
                onPress={() => router.push(item.path as any)}
              >
                {item.icon}
                <Text style={styles.itemText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>SUPPORT</Text>
        <TouchableOpacity style={styles.item}>
          <Settings size={22} color={Colors.textSecondary} />
          <Text style={styles.itemTextAlt}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.item}>
          <HelpCircle size={22} color={Colors.textSecondary} />
          <Text style={styles.itemTextAlt}>Help & Support</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <LogOut size={22} color="#FF4444" />
        <Text style={styles.logoutText}>Logout Session</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 30,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  email: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  userId: {
    fontSize: 10,
    color: Colors.primary,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.textSecondary,
    marginLeft: 20,
    marginBottom: 10,
    letterSpacing: 1.5,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 15,
  },
  itemText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  itemTextAlt: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 20,
    marginHorizontal: 20,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF5F5',
    gap: 12,
    margin: 20,
    borderRadius: 16,
  },
  logoutText: {
    color: '#FF4444',
    fontWeight: '800',
    fontSize: 15,
  },
});
