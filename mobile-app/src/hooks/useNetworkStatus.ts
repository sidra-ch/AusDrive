import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

/**
 * Returns { isOnline, isOffline } with live network state.
 * Subscribes to NetInfo changes so components re-render on connectivity changes.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsOnline(state.isConnected !== false);
    });
    // Check immediately
    NetInfo.fetch().then((state: NetInfoState) => {
      setIsOnline(state.isConnected !== false);
    });
    return unsubscribe;
  }, []);

  return { isOnline, isOffline: !isOnline };
}
