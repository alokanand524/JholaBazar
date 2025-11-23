import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useTheme } from '../hooks/useTheme';
import { useCart } from '../hooks/useCart';
import { ProductCard } from '../components/ProductCard';

export default function FeaturedProductsScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { getCartItemCount } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://api.jholabazar.com/api/v1/products/featured');
      const data = await response.json();
      
      if (data.success && data.data?.products) {
        const transformedProducts = data.data.products.map((product: any) => {
          const firstVariant = product.variants?.[0];
          return {
            ...product,
            id: product.id,
            name: product.name,
            image: product.images?.[0] || firstVariant?.images?.[0],
            price: firstVariant?.price?.sellingPrice,
            originalPrice: firstVariant?.price?.basePrice !== firstVariant?.price?.sellingPrice ? firstVariant?.price?.basePrice : null,
            category: product.category?.name,
            unit: `${firstVariant?.weight} ${firstVariant?.baseUnit}`,
            variants: product.variants?.map((variant: any) => ({
              ...variant,
              price: variant.price
            }))
          };
        });
        setProducts(transformedProducts);
        setFilteredProducts(transformedProducts);
      }
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Featured Products
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

      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Icon name="search" size={20} color={colors.gray} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search featured products..."
          placeholderTextColor={colors.gray}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch}>
            <Icon name="close" size={20} color={colors.gray} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <FeaturedProductsSkeleton colors={colors} />
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={({ item }) => <ProductCard product={item} />}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.productsList}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.gray }]}>
                No products found
              </Text>
            </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  productsList: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
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
  <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 12, marginHorizontal: 4, marginBottom: 16 }}>
    <SkeletonBox width="100%" height={120} style={{ borderRadius: 8, marginBottom: 12 }} colors={colors} />
    <SkeletonBox width="80%" height={14} style={{ marginBottom: 6 }} colors={colors} />
    <SkeletonBox width="60%" height={12} style={{ marginBottom: 8 }} colors={colors} />
    <SkeletonBox width="50%" height={16} colors={colors} />
  </View>
);

const FeaturedProductsSkeleton = ({ colors }: any) => (
  <View style={{ flex: 1 }}>
    {/* Search Bar Skeleton */}
    <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <SkeletonBox width={20} height={20} colors={colors} />
      <SkeletonBox width="70%" height={16} colors={colors} />
    </View>
    
    {/* Products Grid Skeleton */}
    <View style={styles.productsList}>
      {[1, 2, 3].map((item) => (
        <View key={item} style={styles.row}>
          <ProductCardSkeleton colors={colors} />
          <ProductCardSkeleton colors={colors} />
        </View>
      ))}
    </View>
  </View>
);