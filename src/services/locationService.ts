import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import Geocoder from 'react-native-geocoding';
import { config } from '../config/env';

// Initialize Geocoder with Google API key
Geocoder.init(config.GOOGLE_MAPS_API_KEY);

interface LocationCoords {
  latitude: number;
  longitude: number;
  address?: string;
}

class LocationService {
  async requestLocationPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Jhola Bazar needs location access to show nearby stores and delivery options.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (error) {
        console.error('Permission request error:', error);
        return false;
      }
    }
    return true;
  }

  async getCurrentLocation(): Promise<LocationCoords | null> {
    return new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Location error, using fallback');
          resolve({ latitude: 28.6139, longitude: 77.2090 });
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 60000,
        }
      );
    });
  }

  async getLocationName(latitude: number, longitude: number): Promise<string> {
    try {
      const response = await Geocoder.from(latitude, longitude);
      if (response.results && response.results.length > 0) {
        const address = response.results[0].formatted_address;
        const addressParts = address.split(',').slice(0, 3)
          .map(part => part.trim())
          .filter(part => !/^[0-9A-Z]{4}\+[0-9A-Z]{2,3}$/.test(part)) // Remove plus codes
          .filter(part => !/^\d+$/.test(part)) // Remove pure numbers
          .slice(0, 2);
        return addressParts.join(', ') || 'Current Location';
      }
      return 'Current Location';
    } catch (error) {
      console.error('Geocoding failed:', error);
      return 'Current Location';
    }
  }

  async validateServiceArea(latitude: number, longitude: number) {
    try {
      const payload = {
        latitude: latitude.toString(),
        longitude: longitude.toString(),
      };
      
      console.log('🚀 API REQUEST:');
      console.log('URL: https://api.jholabazar.com/api/v1/service-area/validate-address');
      console.log('Method: POST');
      console.log('Payload:', JSON.stringify(payload, null, 2));
      
      const response = await fetch('https://api.jholabazar.com/api/v1/service-area/validate-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('📡 Response Status:', response.status);
      console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('📦 API RESPONSE:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.success === true) {
        // Check for delivery message in various possible locations
        const deliveryMessage = data.data?.nearbyStores?.[0]?.delivery?.deliveryMessage || 
                               data.data?.deliveryMessage || 
                               data.message || 
                               'Delivery available in your area';
        
        console.log('✅ Serviceable area detected');
        return {
          isServiceable: true,
          message: deliveryMessage,
          type: 'success'
        };
      } else {
        // Non-serviceable area or error
        console.log('❌ Non-serviceable area detected');
        return {
          isServiceable: false,
          message: data.message || 'Service not available in your area',
          type: 'error'
        };
      }
    } catch (error) {
      console.error('💥 Service area validation error:', error);
      return {
        isServiceable: false,
        message: 'Unable to check service availability',
        type: 'error'
      };
    }
  }
}

export const locationService = new LocationService();