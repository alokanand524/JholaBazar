import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from '@react-native-community/geolocation';
import { permissionManager } from '../utils/permissionManager';

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  deliveryTime?: string;
}

export const useLocation = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const LOCATION_STORAGE_KEY = 'user_location';



  const getCurrentLocation = async (retryCount = 0) => {
    try {
      setLoading(true);
      
      const hasPermission = await permissionManager.requestLocationPermission(true);
      if (!hasPermission) {
        setError('Location permission denied');
        setLoading(false);
        return;
      }

      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          const locationData: LocationData = {
            latitude,
            longitude,
            address: 'Current Location',
            deliveryTime: '10 mins',
          };

          setLocation(locationData);
          AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(locationData));
          setLoading(false);
        },
        (error) => {
          console.error('Location error:', error);
          
          if (retryCount < 2) {
            setTimeout(() => getCurrentLocation(retryCount + 1), 2000);
            return;
          }
          
          setError('Failed to get location');
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    } catch (error) {
      console.error('Location error:', error);
      setError('Failed to get location');
      setLoading(false);
    }
  };

  useEffect(() => {
    const initLocation = async () => {
      try {
        // Always request fresh location when app opens
        await getCurrentLocation();
      } catch (error) {
        console.error('Error getting location:', error);
        // Fallback to stored location if fresh location fails
        const storedLocation = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
        if (storedLocation) {
          setLocation(JSON.parse(storedLocation));
        }
        setLoading(false);
      }
    };

    initLocation();
  }, []);

  return {
    location,
    loading,
    error,
    refreshLocation: getCurrentLocation,
  };
};