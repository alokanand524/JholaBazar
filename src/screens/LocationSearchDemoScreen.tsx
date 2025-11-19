import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useTheme } from '../hooks/useTheme';
import LocationSearchInput from '../components/LocationSearchInput';
import { PlaceResult } from '../services/placesService';

export default function LocationSearchDemoScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const [selectedLocation, setSelectedLocation] = useState<PlaceResult | null>(null);

  const handleLocationSelect = (location: PlaceResult) => {
    setSelectedLocation(location);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Enhanced Location Search
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Google-like Search Experience
          </Text>
          <Text style={[styles.description, { color: colors.gray }]}>
            Search for any location with autocomplete suggestions and nearby places
          </Text>
          
          <LocationSearchInput
            placeholder="Search for area, street name, landmark..."
            onLocationSelect={handleLocationSelect}
            showNearbyPlaces={true}
          />
        </View>

        {selectedLocation && (
          <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.resultHeader}>
              <Icon name={selectedLocation.icon} size={24} color={colors.primary} />
              <Text style={[styles.resultTitle, { color: colors.text }]}>
                Selected Location
              </Text>
            </View>
            
            <View style={styles.resultContent}>
              <Text style={[styles.locationName, { color: colors.text }]}>
                {selectedLocation.name || selectedLocation.shortAddress}
              </Text>
              <Text style={[styles.locationAddress, { color: colors.gray }]}>
                {selectedLocation.address}
              </Text>
              
              <View style={styles.locationDetails}>
                <Text style={[styles.detailLabel, { color: colors.gray }]}>Coordinates:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {selectedLocation.location.lat.toFixed(6)}, {selectedLocation.location.lng.toFixed(6)}
                </Text>
              </View>
              
              {selectedLocation.distance && (
                <View style={styles.locationDetails}>
                  <Text style={[styles.detailLabel, { color: colors.gray }]}>Distance:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {selectedLocation.distance}
                  </Text>
                </View>
              )}
              
              {selectedLocation.rating && (
                <View style={styles.locationDetails}>
                  <Text style={[styles.detailLabel, { color: colors.gray }]}>Rating:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    ⭐ {selectedLocation.rating.toFixed(1)}
                  </Text>
                </View>
              )}
              
              <View style={styles.locationDetails}>
                <Text style={[styles.detailLabel, { color: colors.gray }]}>Types:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {selectedLocation.types.slice(0, 3).join(', ')}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={[styles.featuresCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.featuresTitle, { color: colors.text }]}>
            Enhanced Features
          </Text>
          
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Icon name="search" size={20} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.text }]}>
                Real-time autocomplete suggestions
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <Icon name="near-me" size={20} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.text }]}>
                Nearby places with proper names
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <Icon name="place" size={20} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.text }]}>
                Place type icons and ratings
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <Icon name="my-location" size={20} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.text }]}>
                Distance calculation from user location
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <Icon name="speed" size={20} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.text }]}>
                Debounced search for better performance
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  resultCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContent: {
    gap: 8,
  },
  locationName: {
    fontSize: 18,
    fontWeight: '600',
  },
  locationAddress: {
    fontSize: 14,
    lineHeight: 20,
  },
  locationDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 80,
  },
  detailValue: {
    fontSize: 12,
    flex: 1,
  },
  featuresCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },
});