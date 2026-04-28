import { useEffect, useState } from 'react';

/**
 * Hook to manage app loading state
 * Shows loading screen for minimum duration and until app is ready
 */
export function useAppLoading(minDuration: number = 1500) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Minimum loading duration
    const minTimer = setTimeout(() => {
      setIsLoading(false);
    }, minDuration);

    return () => clearTimeout(minTimer);
  }, [minDuration]);

  return { isLoading };
}

/**
 * Hook to manage screen-specific loading
 * Used for individual screens/pages
 */
export function useScreenLoading(initialState: boolean = true) {
  const [isLoading, setIsLoading] = useState(initialState);

  const startLoading = () => setIsLoading(true);
  const stopLoading = () => setIsLoading(false);

  return {
    isLoading,
    startLoading,
    stopLoading,
  };
}
