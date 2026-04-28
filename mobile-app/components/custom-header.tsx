import React from 'react';
import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Menu, User, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Modal, Pressable, Animated, Easing } from 'react-native';
import { SidebarContent } from './sidebar';
import { useAuthStore } from '@/store/useAuthStore';

const { width } = Dimensions.get('window');

export function CustomHeader({ title }: { title: string }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [sidebarVisible, setSidebarVisible] = React.useState(false);
  const slideAnim = React.useRef(new Animated.Value(-width)).current;

  function toggleSidebar(show: boolean) {
    if (show) {
      setSidebarVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(() => setSidebarVisible(false));
    }
  }

  function handleMenuPress() {
    toggleSidebar(true);
  }

  return (
    <View style={styles.container}>
      {/* Wavy Background (Simulated with curved View) */}
      <View style={styles.wavyBg}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={handleMenuPress} style={styles.iconBtn}>
            <Menu color="#fff" size={24} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.profileContainer}
            onPress={() => router.push('/notifications')}
          >
            <Image 
              source={{ uri: 'https://i.pravatar.cc/100' }} 
              style={styles.profileImg} 
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.username}>Hey, {user?.name?.split(' ')[0] || 'Member'} 👋</Text>
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* Sidebar Modal Overlay */}
      <Modal
        transparent
        visible={sidebarVisible}
        onRequestClose={() => toggleSidebar(false)}
        animationType="none"
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.backdrop} onPress={() => toggleSidebar(false)} />
          <Animated.View 
            style={[
              styles.sidebarContainer, 
              { transform: [{ translateX: slideAnim }] }
            ]}
          >
            <TouchableOpacity 
              style={styles.closeBtn} 
              onPress={() => toggleSidebar(false)}
            >
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
            <SidebarContent />
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: Colors.background,
  },
  wavyBg: {
    backgroundColor: Colors.primary,
    height: 200,
    width: '100%',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    padding: 24,
    paddingTop: 50,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    padding: 2,
  },
  profileImg: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  username: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginBottom: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sidebarContainer: {
    width: width * 0.8,
    height: '100%',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 100,
    padding: 8,
  },
  iconBtn: {
    padding: 4,
  }
});

// Memoized header component to prevent unnecessary re-renders
export const MemoizedCustomHeader = React.memo(CustomHeader, (prevProps, nextProps) => {
  return prevProps.title === nextProps.title;
});
