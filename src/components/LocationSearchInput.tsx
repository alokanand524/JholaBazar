import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../hooks/useTheme';
import { placesService, PlaceResult } from '../services/placesService';

interface LocationSearchInputProps {
  placeholder?: string;
  onLocationSelect: (location: PlaceResult) => void;
  userLocation?: { lat: number; lng: number };
  initialValue?: string;
  showNearbyPlaces?: boolean;
  onResultsVisibilityChange?: (visible: boolean) => void;
}

export default function LocationSearchInput({
  placeholder = "Search for area, street name...",
  onLocationSelect,
  userLocation,
  initialValue = '',
  showNearbyPlaces = true,
  onResultsVisibilityChange
}: LocationSearchInputProps) {
  const { colors } = useTheme();
  const [searchText, setSearchText] = useState(initialValue);
  const [predictions, setPredictions] = useState<PlaceResult[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<PlaceResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (showNearbyPlaces && userLocation && searchText.length === 0) {
      loadNearbyPlaces();
    }
  }, [userLocation, showNearbyPlaces]);

  const loadNearbyPlaces = async () => {
    if (!userLocation) return;
    
    try {
      setLoading(true);
      const nearby = await placesService.getNearbyPlaces(userLocation, 2000);
      setNearbyPlaces(nearby);
    } catch (error) {
      console.error('Error loading nearby places:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchPlaces = async (query: string) => {
    if (!query.trim()) {
      setPredictions([]);
      if (showNearbyPlaces && userLocation) {
        loadNearbyPlaces();
      }
      return;
    }

    try {
      setLoading(true);
      const results = await placesService.searchWithSuggestions(query, userLocation);
      setPredictions(results.predictions);
      
      // If query is short, also show nearby places
      if (query.length < 3 && showNearbyPlaces) {
        setNearbyPlaces(results.nearbyPlaces);
      } else {
        setNearbyPlaces([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setPredictions([]);
      setNearbyPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (text: string) => {
    setSearchText(text);
    setShowResults(true);

    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Debounce search
    searchTimeout.current = setTimeout(() => {
      searchPlaces(text);
    }, 300);
  };

  const handleLocationSelect = (location: PlaceResult) => {
    setSearchText(location.shortAddress);
    setShowResults(false);
    setPredictions([]);
    setNearbyPlaces([]);
    Keyboard.dismiss();
    onLocationSelect(location);
  };

  const handleFocus = () => {
    setShowResults(true);
    onResultsVisibilityChange?.(true);
    if (searchText.length === 0 && showNearbyPlaces && nearbyPlaces.length === 0) {
      loadNearbyPlaces();
    }
  };

  const handleBlur = () => {
    // Delay hiding results to allow for selection
    setTimeout(() => {
      setShowResults(false);
      onResultsVisibilityChange?.(false);
    }, 200);
  };



  const allResults = [
    ...predictions,
    ...(nearbyPlaces.length > 0 && searchText.length < 3 ? nearbyPlaces : [])
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Icon name="search" size={20} color={colors.gray} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={colors.gray}
          value={searchText}
          onChangeText={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="words"
        />
        {loading && <ActivityIndicator size="small" color={colors.primary} />}
        {searchText.length > 0 && !loading && (
          <TouchableOpacity onPress={() => handleTextChange('')}>
            <Icon name="clear" size={20} color={colors.gray} />
          </TouchableOpacity>
        )}
      </View>

      {showResults && allResults.length > 0 && (
        <View style={[styles.resultsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ScrollView
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="always"
            nestedScrollEnabled={true}
            bounces={false}
            style={styles.scrollView}
          >
            {nearbyPlaces.length > 0 && searchText.length < 3 && (
              <View style={styles.sectionHeader}>
                <Icon name="near-me" size={16} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>Nearby Places</Text>
              </View>
            )}
            
            {predictions.length > 0 && nearbyPlaces.length > 0 && searchText.length < 3 && (
              <View style={styles.sectionDivider}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.sectionTitle, { color: colors.gray }]}>Search Results</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>
            )}
            
            {allResults.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.resultItem, { borderBottomColor: colors.border }]}
                onPress={() => handleLocationSelect(item)}
              >
                <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
                  <Icon name={item.icon} size={18} color={colors.primary} />
                </View>
                <View style={styles.resultContent}>
                  <Text style={[styles.resultMainText, { color: colors.text }]} numberOfLines={1}>
                    {item.name || item.shortAddress}
                  </Text>
                  <Text style={[styles.resultSecondaryText, { color: colors.gray }]} numberOfLines={1}>
                    {item.secondaryText}
                    {item.distance && ` • ${item.distance}`}
                    {item.rating && ` • ⭐ ${item.rating.toFixed(1)}`}
                  </Text>
                </View>
                {item.isNearby && (
                  <View style={[styles.nearbyBadge, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.nearbyText, { color: colors.primary }]}>Nearby</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  resultsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    height: 300,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 1001,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultContent: {
    flex: 1,
  },
  resultMainText: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  resultSecondaryText: {
    fontSize: 13,
  },
  nearbyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  nearbyText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  scrollView: {
    flex: 1,
  },
});