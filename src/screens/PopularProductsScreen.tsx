import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  TextInput,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { ProductCard } from '../components/ProductCard';
import { useTheme } from '../hooks/useTheme';
import { useCart } from '../hooks/useCart';
import { API_ENDPOINTS } from '../constants/api';

export default function PopularProductsScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { getCartItemCount } = useCart();

  const [products, setProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPopularProducts();
  }, []);

  const fetchPopularProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://api.jholabazar.com/api/v1/products/');
      const result = await response.json();
      
      const rawProducts = result.data?.products || [];
      const transformedProducts = rawProducts.map((product: any) => ({
        id: product.id,
        name: product.name,
        image: product.images?.[0] || '',
        price: product.variants?.[0]?.price?.sellingPrice || '0',
        originalPrice: product.variants?.[0]?.price?.basePrice || '0',
        category: product.category?.name || 'General',
        description: product.description || product.shortDescription || '',
        unit: `${product.variants?.[0]?.weight || '1'} ${product.variants?.[0]?.baseUnit || 'unit'}`,
        inStock: product.variants?.[0]?.stock?.availableQty > 0,
        rating: 4.5,
        deliveryTime: '10 mins',
        variants: product.variants
      }));
      
      setProducts(transformedProducts);
      setAllProducts(transformedProducts);
    } catch (error) {
      console.error('Error fetching popular products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchPopularProducts();
    setRefreshing(false);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setProducts(allProducts);
    } else {
      const filtered = allProducts.filter(product =>
        product.name.toLowerCase().includes(query.toLowerCase())
      );
      setProducts(filtered);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setProducts(allProducts);
  };

  const renderProduct = ({ item }: { item: any }) => (
    <ProductCard product={item} />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Popular Products
        </Text>
        <TouchableOpacity
          style={[styles.cartButton, { backgroundColor: colors.lightGray }]}
          onPress={() => navigation.navigate('Cart')}
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
      <View style={[styles.searchContainer, { backgroundColor: colors.lightGray }]}>
        <Icon name="search" size={20} color={colors.gray} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search products..."
          placeholderTextColor={colors.gray}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch}>
            <Icon name="clear" size={20} color={colors.gray} />
          </TouchableOpacity>
        )}
      </View>

      {loading && !refreshing ? (
        <PopularProductsSkeleton colors={colors} />
      ) : products.length === 0 ? (
        <View style={styles.centerContainer}>
          <Icon name="trending-up" size={80} color={colors.gray} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No popular products
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.gray }]}>
            Check back later for popular items
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id?.toString()}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContainer}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
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
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
});

// Skeleton Components
const SkeletonBox = ({ width, height, style, colors }: any) => {
  const [pulseAnim] = useState(new Animated.Value(0));
  
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);
  
  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: colors.border,
          borderRadius: 4,
          opacity: pulseAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 0.7],
          }),
        },
        style,
      ]}
    />
  );
};

const ProductCardSkeleton = ({ colors }: any) => (
  <View style={[styles.productItem, { backgroundColor: colors.card, borderRadius: 12, padding: 12, marginBottom: 16 }]}>
    <SkeletonBox width="100%" height={120} style={{ borderRadius: 8, marginBottom: 12 }} colors={colors} />
    <SkeletonBox width="80%" height={14} style={{ marginBottom: 6 }} colors={colors} />
    <SkeletonBox width="60%" height={12} style={{ marginBottom: 8 }} colors={colors} />
    <SkeletonBox width="50%" height={16} colors={colors} />
  </View>
);

const PopularProductsSkeleton = ({ colors }: any) => (
  <View style={{ flex: 1 }}>
    {/* Search Bar Skeleton */}
    <View style={[styles.searchContainer, { backgroundColor: colors.lightGray }]}>
      <SkeletonBox width={20} height={20} colors={colors} />
      <SkeletonBox width="70%" height={16} colors={colors} />
    </View>
    
    {/* Products Grid Skeleton */}
    <View style={styles.listContainer}>
      {[1, 2, 3, 4, 5, 6].map((item, index) => (
        <View key={item} style={[styles.row, { marginBottom: 8 }]}>
          <ProductCardSkeleton colors={colors} />
          {index % 2 === 0 && <ProductCardSkeleton colors={colors} />}
        </View>
      ))}
    </View>
  </View>
);