import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { BannerCarousel } from '../components/BannerCarousel';
import { ProductCard } from '../components/ProductCard';
import { SectionCard } from '../components/SectionCard';
import { SectionHeader } from '../components/SectionHeader';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { BannerSkeleton, FeaturedSkeleton, CategoriesSkeleton, ProductsSkeleton } from '../components/HomeSkeleton';
import { API_ENDPOINTS } from '../constants/api';
import { productAPI } from '../services/api';
import { locationService } from '../services/locationService';
import { useTheme } from '../hooks/useTheme';
import { useCart } from '../hooks/useCart';
import { fetchCart } from '../store/slices/cartSlice';
import { clearAddresses } from '../store/slices/addressSlice';
import { RootState, AppDispatch } from '../store/store';
import { responsive } from '../utils/responsive';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { selectedAddress } = useSelector((state: RootState) => state.address);
  const { isLoggedIn } = useSelector((state: RootState) => state.user);
  const { getCartItemCount, fetchCart } = useCart();
  const { colors } = useTheme();


  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [apiProducts, setApiProducts] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0); // 0: initial, 1: banners, 2: featured, 3: categories, 4: products
  const [deliveryMessage, setDeliveryMessage] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState<'success' | 'error' | null>(null);
  const [currentLocationName, setCurrentLocationName] = useState('Current Location');

  // Check delivery service when component mounts or address changes
  useEffect(() => {
    console.log('🏠 Address changed, checking delivery service:', selectedAddress?.fullAddress);
    checkDeliveryService();
  }, [selectedAddress]);

  const checkDeliveryService = async () => {
    console.log('🔍 Starting delivery service check...');
    let lat, lng, locationName;
    
    if (selectedAddress?.latitude && selectedAddress?.longitude) {
      // Use selected address coordinates
      lat = selectedAddress.latitude;
      lng = selectedAddress.longitude;
      locationName = selectedAddress.fullAddress || 'Selected Address';
      console.log('📍 Using selected address:', { lat, lng, locationName });
    } else {
      // Use current location as fallback
      console.log('📍 No selected address, using current location');
      const location = await locationService.getCurrentLocation();
      if (!location) {
        console.log('❌ Location unavailable');
        setDeliveryMessage('Location unavailable');
        setDeliveryStatus('error');
        return;
      }
      lat = location.latitude;
      lng = location.longitude;
      locationName = await locationService.getLocationName(lat, lng);
      console.log('📍 Current location:', { lat, lng, locationName });
    }
    
    setCurrentLocationName(locationName);
    await fetchDeliveryEstimate(lat, lng);
  };

  const fetchDeliveryEstimate = async (lat: number, lng: number) => {
    try {
      console.log('🚀 Calling service area API with:', { lat, lng });
      const response = await fetch('https://api.jholabazar.com/api/v1/service-area/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: lat.toString(),
          longitude: lng.toString(),
        }),
      });
      
      const data = await response.json();
      console.log('📦 Service area API response:', JSON.stringify(data, null, 2));
      
      if (data.success && data.data?.available && data.data?.nearbyStores?.[0]?.delivery) {
        // Serviceable area - show actual delivery time
        const deliveryInfo = data.data.nearbyStores[0].delivery;
        console.log('✅ Serviceable area - delivery message:', deliveryInfo.deliveryMessage);
        setDeliveryMessage(deliveryInfo.deliveryMessage);
        setDeliveryStatus('success');
      } else {
        // Not serviceable area
        console.log('❌ Not serviceable area');
        setDeliveryMessage('Not serviceable area');
        setDeliveryStatus('error');
      }
    } catch (error) {
      console.error('💥 Service area check error:', error);
      setDeliveryMessage('Service check failed');
      setDeliveryStatus('error');
    }
  };



  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await fetch('https://api.jholabazar.com/api/v1/categories');
      const data = await response.json();
      
      if (data.success && data.data && data.data.categories) {
        setCategories(data.data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      console.log('Fetching products...');
      const products = await productAPI.getAllProducts();
      console.log('Products fetched:', products.length);
      setApiProducts(products.slice(0, 6));
    } catch (error) {
      console.error('Error fetching products:', error);
      setApiProducts([]);
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      console.log('Fetching featured products...');
      const products = await productAPI.getAllProducts();
      console.log('Featured products fetched:', products.length);
      setFeaturedProducts(products.slice(0, 4));
    } catch (error) {
      console.error('Error fetching featured products:', error);
      setFeaturedProducts([]);
    }
  };


  const loadDataSerially = async () => {
    try {
      // 1. Load banners first
      await new Promise(resolve => setTimeout(resolve, 600));
      setLoadingStage(1);
      
      // 2. Load featured products
      await fetchFeaturedProducts();
      await new Promise(resolve => setTimeout(resolve, 400));
      setLoadingStage(2);
      
      // 3. Load categories
      await fetchCategories();
      await new Promise(resolve => setTimeout(resolve, 400));
      setLoadingStage(3);
      
      // 4. Load products last
      await fetchProducts();
      await new Promise(resolve => setTimeout(resolve, 400));
      setLoadingStage(4);
    } catch (error) {
      console.error('Error in serial loading:', error);
      setLoadingStage(4); // Show all content even if there's an error
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setLoadingStage(0);
    await Promise.all([
      fetchProducts(),
      fetchFeaturedProducts(),
      fetchCategories(),
      checkDeliveryService(),
      isLoggedIn ? fetchCart() : Promise.resolve(),
    ]);
    setLoadingStage(4);
    setRefreshing(false);
  }, [dispatch, isLoggedIn, selectedAddress]);

  // Load data on mount
  useEffect(() => {
    loadDataSerially();
    if (isLoggedIn) {
      fetchCart();
    }
  }, [dispatch, isLoggedIn, fetchCart]);

  // Refresh cart when user logs in/out
  useEffect(() => {
    fetchCart();
  }, [isLoggedIn, fetchCart]);

  // Refresh cart when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchCart();
    }, [fetchCart])
  );

  // Auto-refresh cart every 10 seconds (reduced frequency)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isLoggedIn) {
        fetchCart();
      }
    }, 10000); // Changed from 1000ms to 10000ms

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Debug loading stages
  useEffect(() => {
    console.log('Loading stage:', loadingStage);
  }, [loadingStage]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.locationContainer}>
          {deliveryMessage && (
            <View style={styles.deliveryTimeRow}>
              <Icon name="schedule" size={16} color={deliveryStatus === 'error' ? '#FF3B30' : colors.primary} />
              <Text style={[styles.deliveryTimeText, { color: deliveryStatus === 'error' ? '#FF3B30' : colors.primary }]}>
                {deliveryMessage}
              </Text>
            </View>
          )}
          <View style={styles.locationRow}>
            <Icon name="location-on" size={20} color={colors.primary} />
            <Text style={[styles.locationText, { color: colors.gray }]}>
              Delivery to
            </Text>
            <TouchableOpacity
              onPress={() => isLoggedIn ? navigation.navigate('Addresses') : navigation.navigate('Login')}
              style={styles.addressButton}
            >
              <Text style={[styles.addressText, { color: colors.text }]} numberOfLines={1}>
                {(selectedAddress?.fullAddress || currentLocationName).length > 30 
                  ? `${(selectedAddress?.fullAddress || currentLocationName).substring(0, 30)}...` 
                  : (selectedAddress?.fullAddress || currentLocationName)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.cartButton, { backgroundColor: colors.lightGray }]}
          onPress={() => navigation.navigate('Cart' as never)}
        >
          <Icon name="shopping-bag" size={24} color={colors.primary} />
          {getCartItemCount() > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{getCartItemCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View
        style={[styles.searchContainer, { backgroundColor: colors.lightGray }]}
      >
        <Icon name="search" size={20} color={colors.gray} />
        <TouchableOpacity
          style={styles.searchTouchable}
          onPress={() =>
            navigation.navigate('SearchResults' as never, { query: '' } as never)
          }
        >
          <Text style={[styles.searchPlaceholder, { color: colors.gray }]}>
            Search for products
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Banners */}
        {loadingStage >= 1 ? (
          <BannerCarousel />
        ) : (
          <BannerSkeleton />
        )}

        {/* Featured Section */}
        {loadingStage >= 1 && (
          <>
            <SectionHeader title="Featured this week" sectionType="featured" />
            {loadingStage >= 2 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.productScroll}
              >
                {featuredProducts.map((item) => (
                  <View key={item.id?.toString()} style={styles.featuredCard}>
                    <ProductCard product={item} />
                  </View>
                ))}
              </ScrollView>
            ) : (
              <FeaturedSkeleton />
            )}
          </>
        )}

        {/* Categories */}
        {loadingStage >= 2 && (
          <>
            <View style={styles.categoryHeader}>
              <Text style={[styles.categoryTitle, { color: colors.text }]}>
                Shop by category
              </Text>
            </View>

            {loadingStage >= 3 ? (
              <View style={styles.categoriesContainer}>
                <View style={styles.categoriesGrid}>
                  {categories.map((category) => (
                    <View key={category.id} style={styles.categoryItem}>
                      <SectionCard
                        title={category.name}
                        image={category.image}
                        category={category.name}
                        categoryId={category.id}
                      />
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <CategoriesSkeleton />
            )}
          </>
        )}

        {/* Grocery Banner */}
        {loadingStage >= 3 && (
          <View style={styles.groceryBannerContainer}>
            <Image 
              source={require('../../assets/images/GROCERY.png')} 
              style={styles.groceryBanner}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Products */}
        {loadingStage >= 3 && (
          <View style={styles.productsContainer}>
            <SectionHeader title="Popular Products" sectionType="popular" />
            {loadingStage >= 4 ? (
              <FlatList
                data={apiProducts}
                renderItem={({ item }) => <ProductCard product={item} />}
                keyExtractor={(item) => item.id?.toString()}
                numColumns={responsive.getProductColumns()}
                scrollEnabled={false}
                columnWrapperStyle={responsive.getProductColumns() > 2 ? styles.rowTablet : styles.row}
                ListEmptyComponent={
                  <Text style={{ textAlign: 'center', color: colors.gray }}>
                    No products found.
                  </Text>
                }
              />
            ) : (
              <ProductsSkeleton />
            )}
          </View>
        )}

        {/* Footer */}
        {loadingStage >= 4 && (
          <View style={styles.footerContainer}>
            <Image 
              source={require('../../assets/images/jhola-bajar-footer.png')} 
              style={styles.footerImage}
              resizeMode="cover"
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// 💅 Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  locationContainer: {
    flex: 1,
  },
  deliveryTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  deliveryTimeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 14,
  },
  addressText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  addressButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  cartButton: {
    position: 'relative',
    padding: 8,
    borderRadius: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
  },
  searchTouchable: {
    flex: 1,
    marginLeft: 8,
  },
  searchPlaceholder: {
    fontSize: 16,
  },
  productScroll: {
    paddingLeft: 8,
    marginBottom: 20,
  },
  featuredCard: {
    width: 300,
    marginRight: -130,
  },
  categoryHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: responsive.isTablet ? '15%' : '22%',
    marginBottom: 12,
  },
  productsContainer: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  rowTablet: {
    justifyContent: 'space-around',
  },

  groceryBannerContainer: {
    paddingHorizontal: 16,
    marginVertical: 20,
  },
  groceryBanner: {
    width: '100%',
    height: 250,
    borderRadius: 12,
  },
  footerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  loginPrompt: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  loginPromptText: {
    fontSize: 14,
    fontWeight: '500',
  },
});