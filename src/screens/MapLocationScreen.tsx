import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Geocoder from 'react-native-geocoding';
import { permissionManager } from '../utils/permissionManager';

import { useTheme } from '../hooks/useTheme';
import { setSelectedAddress } from '../store/slices/addressSlice';
import { locationService } from '../services/locationService';
import { config } from '../config/env';
import LocationSearchInput from '../components/LocationSearchInput';
import { PlaceResult } from '../services/placesService';
import { Toast } from '../components/Toast';

// Initialize Geocoder at module level
Geocoder.init(config.GOOGLE_MAPS_API_KEY);

export default function MapLocationScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const { colors } = useTheme();
  const mapRef = useRef<MapView>(null);
  
  const [region, setRegion] = useState({
    latitude: 28.6139,
    longitude: 77.2090,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [centerCoordinate, setCenterCoordinate] = useState({
    latitude: 28.6139,
    longitude: 77.2090,
  });
  const [currentAddress, setCurrentAddress] = useState('Fetching location...');
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    // Always request permission when map screen opens
    const initializeLocation = async () => {
      const permissionStatus = await permissionManager.checkLocationPermission();
      if (permissionStatus === 'granted') {
        getCurrentLocation();
      } else {
        // Request permission with rationale
        const granted = await permissionManager.requestLocationPermission(true);
        if (granted) {
          getCurrentLocation();
        }
      }
    };
    
    initializeLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      
      // Check permission first
      const permissionStatus = await permissionManager.checkLocationPermission();
      if (permissionStatus !== 'granted') {
        const granted = await permissionManager.requestLocationPermission(true);
        if (!granted) {
          setLoading(false);
          return;
        }
      }
      
      const location = await locationService.getCurrentLocation();
      
      if (location) {
        const newRegion = {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        
        setRegion(newRegion);
        setCenterCoordinate({ latitude: location.latitude, longitude: location.longitude });
        
        // Animate to location if map is ready
        if (mapRef.current && mapReady) {
          mapRef.current.animateToRegion(newRegion, 1000);
        }
        
        // Get address for the location
        await getAddressFromCoords(location.latitude, location.longitude);
      }
    } catch (error) {
      console.error('getCurrentLocation error:', error);
      setCurrentAddress('Location service unavailable');
    } finally {
      setLoading(false);
    }
  };

  const getAddressFromCoords = async (latitude: number, longitude: number) => {
    try {
      // Geocoder is already initialized at module level
      
      const response = await Geocoder.from(latitude, longitude);
      if (response.results && response.results.length > 0) {
        const result = response.results[0];
        const components = result.address_components;
        
        // Extract detailed address components (including road/street names)
        const streetNumber = components.find(c => c.types.includes('street_number'))?.long_name;
        const route = components.find(c => c.types.includes('route'))?.long_name;
        const premise = components.find(c => c.types.includes('premise'))?.long_name;
        const sublocality3 = components.find(c => c.types.includes('sublocality_level_3'))?.long_name;
        const sublocality2 = components.find(c => c.types.includes('sublocality_level_2'))?.long_name;
        const sublocality1 = components.find(c => c.types.includes('sublocality_level_1'))?.long_name;
        const locality = components.find(c => c.types.includes('locality'))?.long_name;
        const city = components.find(c => c.types.includes('administrative_area_level_2'))?.long_name;
        
        // Build detailed address with road/street names
        let addressParts = [];
        
        // Add street address if available
        if (streetNumber && route) {
          addressParts.push(`${streetNumber} ${route}`);
        } else if (route) {
          addressParts.push(route);
        }
        
        if (premise && premise !== route) addressParts.push(premise);
        if (sublocality3 && sublocality3 !== premise && sublocality3 !== route) addressParts.push(sublocality3);
        if (sublocality2 && sublocality2 !== sublocality3 && sublocality2 !== route) addressParts.push(sublocality2);
        if (sublocality1 && sublocality1 !== sublocality2 && sublocality1 !== route) addressParts.push(sublocality1);
        if (locality && locality !== sublocality1 && locality !== route) addressParts.push(locality);
        if (city && city !== locality && addressParts.length < 4) addressParts.push(city);
        
        // Fallback to formatted address parts if components are insufficient
        if (addressParts.length === 0) {
          const formatted = result.formatted_address.split(',').slice(0, 3);
          addressParts = formatted;
        }
        
        // Clean and join address parts (exclude division names)
        const detailedAddress = addressParts
          .map(part => part.trim())
          .filter(part => part.length > 0)
          .map(part => part.replace(/[A-Z0-9]{4}\+[A-Z0-9]{2,3}[,\s]*/g, '')) // Remove plus codes
          .map(part => part.replace(/Indestrial/g, 'Industrial')) // Fix typos
          .filter(part => part.length > 0)
          .filter(part => !part.match(/\b(Division|State|Pradesh|Bihar|West Bengal|Maharashtra|Karnataka|Tamil Nadu|Gujarat|Rajasthan|Uttar Pradesh|Madhya Pradesh|Odisha|Kerala|Assam|Punjab|Haryana|Jharkhand|Chhattisgarh|Himachal Pradesh|Uttarakhand|Goa|Manipur|Meghalaya|Tripura|Nagaland|Mizoram|Arunachal Pradesh|Sikkim|Telangana|Andhra Pradesh|Jammu and Kashmir|Ladakh|Delhi|Puducherry|Chandigarh|Dadra and Nagar Haveli|Daman and Diu|Lakshadweep|Andaman and Nicobar Islands)\b/i)) // Remove state/division names
          .slice(0, 3) // Take max 3 parts
          .join(', ');
        
        setCurrentAddress(detailedAddress || 'Address not found');
      } else {
        setCurrentAddress('Address not found');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setCurrentAddress('Address not found');
    }
  };

  const onRegionChangeComplete = async (newRegion: any) => {
    const { latitude, longitude } = newRegion;
    setCenterCoordinate({ latitude, longitude });
    await getAddressFromCoords(latitude, longitude);
  };

  const handleLocationSelect = async (result: PlaceResult) => {
    const newRegion = {
      latitude: result.location.lat,
      longitude: result.location.lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    
    setRegion(newRegion);
    setCenterCoordinate({ latitude: result.location.lat, longitude: result.location.lng });
    
    if (mapRef.current) {
      mapRef.current.animateToRegion(newRegion, 1000);
    }
    
    await getAddressFromCoords(result.location.lat, result.location.lng);
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const confirmLocation = async () => {
    try {
      setLoading(true);
      
      // Validate service area
      const serviceValidation = await locationService.validateServiceArea(
        centerCoordinate.latitude,
        centerCoordinate.longitude
      );
      
      if (serviceValidation.isServiceable) {
        // Navigate to address details screen
        navigation.navigate('AddressDetails', {
          latitude: centerCoordinate.latitude,
          longitude: centerCoordinate.longitude,
          address: currentAddress,
          deliveryMessage: serviceValidation.message
        });
      } else {
        showToast(serviceValidation.message, 'error');
      }
    } catch (error) {
      console.error('Confirm location error:', error);
      showToast('Failed to confirm location. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Select Location
        </Text>
      </View>

      <View style={styles.searchWrapper}>
        <LocationSearchInput
          placeholder="Search for area, street name..."
          onLocationSelect={handleLocationSelect}
          userLocation={{ lat: region.latitude, lng: region.longitude }}
          showNearbyPlaces={true}
          onResultsVisibilityChange={setShowResults}
        />
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={region}
          onRegionChangeComplete={onRegionChangeComplete}
          onMapReady={() => setMapReady(true)}
          showsUserLocation={true}
          showsMyLocationButton={false}
          toolbarEnabled={false}
          showsCompass={false}
          showsScale={false}
          showsBuildings={false}
          showsTraffic={false}
          showsIndoors={false}
          rotateEnabled={false}
          pitchEnabled={false}
          mapType="standard"
          zoomEnabled={true}
          scrollEnabled={!showResults}
          zoomControlEnabled={false}
          mapToolbarEnabled={false}
        />
        
        {/* Center Pin Overlay */}
        <View style={styles.centerPin}>
          <Icon name="location-on" size={40} color="#FF0000" />
        </View>
        
        {/* Current Location Button */}
        <TouchableOpacity
          style={[styles.currentLocationButton, { backgroundColor: colors.card }]}
          onPress={getCurrentLocation}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Icon name="my-location" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <View style={[styles.deliverySection, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.deliveryTitle, { color: colors.text }]}>
          Selected Location
        </Text>
        <View style={styles.locationRow}>
          <Icon name="location-on" size={20} color={colors.primary} />
          <Text style={[styles.locationText, { color: colors.text }]} numberOfLines={2}>
            {currentAddress}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.confirmButton, { backgroundColor: colors.primary }]}
          onPress={confirmLocation}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.confirmButtonText}>Add Address</Text>
          )}
        </TouchableOpacity>
      </View>

      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchWrapper: {
    margin: 16,
    zIndex: 1000,
  },
  mapContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  currentLocationButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  deliverySection: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  locationText: {
    fontSize: 16,
  },
  confirmButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  centerPin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
});