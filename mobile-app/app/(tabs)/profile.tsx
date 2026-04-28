import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Colors } from '@/constants/Colors';
import { User, Bell, CreditCard, Shield, HelpCircle, LogOut, ChevronRight, Settings } from 'lucide-react-native';
import { CustomHeader } from '@/components/custom-header';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await clearAuth();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="My Profile" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* User Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'A'}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'AusDrive User'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'premium@ausdrive.com'}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{user?.role?.toUpperCase() || 'CLIENT'}</Text>
            </View>
          </View>
        </View>

        {/* Menu Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <MenuLink icon={<Settings size={20} color={Colors.primary} />} label="Personal Information" />
          <MenuLink icon={<CreditCard size={20} color={Colors.primary} />} label="Payment Methods" />
          <MenuLink icon={<Bell size={20} color={Colors.primary} />} label="Notifications" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <MenuLink icon={<Shield size={20} color={Colors.success} />} label="Privacy & Security" />
          <MenuLink icon={<HelpCircle size={20} color={Colors.info} />} label="Help & Support" />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={20} color="#FF4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>AusDrive Premium v2.0.1 (Production)</Text>
      </ScrollView>
    </View>
  );
}

function MenuLink({ icon, label }: any) {
  return (
    <TouchableOpacity style={styles.menuItem}>
      <View style={styles.menuLeft}>
        <View style={styles.iconBox}>{icon}</View>
        <Text style={styles.menuLabel}>{label}</Text>
      </View>
      <ChevronRight size={20} color={Colors.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: 24,
    paddingBottom: 100,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  userInfo: {
    gap: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  badge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.primary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
    marginBottom: 12,
    letterSpacing: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFF5F5',
    padding: 18,
    borderRadius: 16,
    marginTop: 10,
  },
  logoutText: {
    color: '#FF4444',
    fontWeight: 'bold',
    fontSize: 16,
  },
  version: {
    textAlign: 'center',
    marginTop: 30,
    color: Colors.textSecondary,
    fontSize: 12,
  },
});
