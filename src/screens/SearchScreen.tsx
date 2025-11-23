import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from '../hooks/useTheme';
import { ProductCard } from '../components/ProductCard';
import { RootState } from '../store/store';

export default function SearchScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { items } = useSelector((state: RootState) => state.cart);
  
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  
  const popularSearches = [
    'Vegetables', 'Fruits', 'Milk', 'Bread', 'Rice', 'Oil', 'Onion', 'Potato'
  ];

  const cartItemsCount = items?.reduce(
    (sum: number, item: any) => sum + (item.quantity || 0),
    0
  );

  useEffect(() => {
    loadRecentSearches();
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const recent = await AsyncStorage.getItem('recentSearches');
      if (recent) {
        setRecentSearches(JSON.parse(recent));
      }
    } catch (error) {
      console.log('Error loading recent searches:', error);
    }
  };

  const saveRecentSearch = async (query: string) => {
    try {
      const updated = [query, ...recentSearches.filter(item => item !== query)].slice(0, 5);
      setRecentSearches(updated);
      await AsyncStorage.setItem('recentSearches', JSON.stringify(updated));
    } catch (error) {
      console.log('Error saving recent search:', error);
    }
  };

  const clearRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem('recentSearches');
    } catch (error) {
      console.log('Error clearing recent searches:', error);
    }
  };

  const handleSearch = async (text: string) => {
    setSearchText(text);
    if (text.trim().length > 2) {
      setIsSearching(true);
      if (text.trim().length > 0) {
        await saveRecentSearch(text.trim());
      }
      // TODO: Implement search API call
      setTimeout(() => {
        setSearchResults([]);
        setIsSearching(false);
      }, 800);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const handleQuickSearch = (query: string) => {
    setSearchText(query);
    handleSearch(query);
  };

  const clearSearch = () => {
    setSearchText('');
    setSearchResults([]);
    setIsSearching(false);
  };

  const renderProduct = ({ item }: { item: any }) => (
    <View style={styles.productItem}>
      <ProductCard product={item} />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={[styles.searchContainer, { backgroundColor: colors.lightGray }]}>
          <Icon name="search" size={20} color={colors.gray} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search for products"
            placeholderTextColor={colors.gray}
            value={searchText}
            onChangeText={handleSearch}
            autoFocus={true}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Icon name="close" size={20} color={colors.gray} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.cartButton, { backgroundColor: colors.lightGray }]}
          onPress={() => navigation.navigate('Cart')}
        >
          <Icon name="shopping-bag" size={24} color={colors.primary} />
          {cartItemsCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItemsCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <Animated.View 
        style={[styles.content, { 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }]}
      >
        {isSearching ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.gray }]}>
              Searching for "{searchText}"...
            </Text>
          </View>
        ) : searchText.length === 0 ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Popular Searches */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="trending-up" size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Popular Searches
                </Text>
              </View>
              <View style={styles.tagsContainer}>
                {popularSearches.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.tag, { 
                      backgroundColor: colors.lightGray,
                      borderColor: colors.border 
                    }]}
                    onPress={() => handleQuickSearch(item)}
                  >
                    <Icon name="search" size={16} color={colors.primary} />
                    <Text style={[styles.tagText, { color: colors.text }]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Icon name="history" size={20} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Recent Searches
                  </Text>
                  <TouchableOpacity onPress={clearRecentSearches}>
                    <Text style={[styles.clearText, { color: colors.primary }]}>Clear</Text>
                  </TouchableOpacity>
                </View>
                {recentSearches.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.recentItem, { borderBottomColor: colors.border }]}
                    onPress={() => handleQuickSearch(item)}
                  >
                    <Icon name="history" size={18} color={colors.gray} />
                    <Text style={[styles.recentText, { color: colors.text }]}>{item}</Text>
                    <Icon name="north-west" size={16} color={colors.gray} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Search Tips */}
            <View style={styles.section}>
              <View style={styles.tipsContainer}>
                <Icon name="lightbulb-outline" size={24} color={colors.primary} />
                <Text style={[styles.tipsTitle, { color: colors.text }]}>Search Tips</Text>
                <Text style={[styles.tipsText, { color: colors.gray }]}>
                  • Try searching for categories like "Vegetables" or "Fruits"{"\n"}
                  • Use specific product names like "Basmati Rice"{"\n"}
                  • Search by brand names for better results
                </Text>
              </View>
            </View>
          </ScrollView>
        ) : searchResults.length === 0 ? (
          <View style={styles.centerContainer}>
            <View style={[styles.noResultsContainer, { backgroundColor: colors.lightGray }]}>
              <Icon name="search-off" size={60} color={colors.gray} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No results found
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.gray }]}>
                We couldn't find any products matching "{searchText}"
              </Text>
              <TouchableOpacity 
                style={[styles.suggestButton, { backgroundColor: colors.primary }]}
                onPress={() => setSearchText('')}
              >
                <Text style={styles.suggestButtonText}>Try different keywords</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <FlatList
            data={searchResults}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id?.toString()}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </Animated.View>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  cartButton: {
    position: 'relative',
    padding: 10,
    borderRadius: 12,
  },
  cartBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  recentText: {
    flex: 1,
    fontSize: 16,
  },
  tipsContainer: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 183, 97, 0.05)',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noResultsContainer: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    marginHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  suggestButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  suggestButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  productItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  row: {
    justifyContent: 'space-between',
  },
});