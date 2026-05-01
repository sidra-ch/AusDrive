import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/Colors';
import {
  User, Bell, CreditCard, Shield, HelpCircle, LogOut, ChevronRight,
  Settings, FileText, ShieldCheck, Smartphone, LogOutIcon,
} from 'lucide-react-native';
import { CustomHeader } from '@/components/custom-header';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'expo-router';
import { authAPI } from '@/services/api';

export default function ProfileScreen() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await authAPI.logout();
    } catch {
      // proceed even if server call fails
    }
    await clearAuth();
    setLoggingOut(false);
    router.replace('/(auth)/login');
  };

  const handleLogoutAll = () => {
    Alert.alert(
      'Logout All Devices',
      'This will sign you out of all devices including this one.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout All',
          style: 'destructive',
          onPress: async () => {
            try {
              await authAPI.logoutAll();
            } catch {}
            await clearAuth();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const kycLabel =
    user?.kycStatus === 'approved'
      ? '✓ Verified'
      : user?.kycStatus === 'pending'
      ? '⏳ Pending'
      : user?.kycStatus === 'rejected'
      ? '✗ Rejected'
      : 'Upload Documents';

  return (
    <View style={styles.container}>
      <CustomHeader title="My Profile" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* User Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'A'}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'AusDrive User'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'premium@ausdrive.com'}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{user?.role?.toUpperCase() || 'CLIENT'}</Text>
            </View>
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT SETTINGS</Text>
          <MenuLink icon={<Settings size={20} color={Colors.primary} />} label="Personal Information" />
          <MenuLink icon={<CreditCard size={20} color={Colors.primary} />} label="Payment Methods" />
          <MenuLink icon={<Bell size={20} color={Colors.primary} />} label="Notifications" />
          <MenuLink
            icon={<ShieldCheck size={20} color={Colors.success} />}
            label={`Identity (KYC) — ${kycLabel}`}
            onPress={() => router.push('/(auth)/kyc')}
          />
        </View>

        {/* History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BOOKINGS & DOCS</Text>
          <MenuLink
            icon={<FileText size={20} color={Colors.primary} />}
            label="My Bookings"
            onPress={() => router.push('/(tabs)/bookings')}
          />
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SECURITY & SUPPORT</Text>
          <MenuLink icon={<Shield size={20} color={Colors.success} />} label="Privacy & Security" />
          <MenuLink
            icon={<HelpCircle size={20} color={Colors.info} />}
            label="Help & Support"
            onPress={() => router.push('/(tabs)/support')}
          />
          <MenuLink
            icon={<Smartphone size={20} color={Colors.textSecondary} />}
            label="Active Sessions"
          />
          <MenuLink
            icon={<LogOutIcon size={20} color={Colors.danger} />}
            label="Logout All Devices"
            onPress={handleLogoutAll}
            labelColor={Colors.danger}
          />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} disabled={loggingOut}>
          {loggingOut ? (
            <ActivityIndicator size="small" color="#FF4444" />
          ) : (
            <>
              <LogOut size={20} color="#FF4444" />
              <Text style={styles.logoutText}>Sign Out</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.version}>AusDrive Premium v2.0.1 · Australia</Text>
      </ScrollView>
    </View>
  );
}

function MenuLink({
  icon,
  label,
  onPress,
  labelColor,
}: {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
  labelColor?: string;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuLeft}>
        <View style={styles.iconBox}>{icon}</View>
        <Text style={[styles.menuLabel, labelColor ? { color: labelColor } : {}]}>{label}</Text>
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
