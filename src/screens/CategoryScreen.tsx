import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useTheme } from '../hooks/useTheme';
import { categoryAPI, productAPI } from '../services/api';
import { ProductCard } from '../components/ProductCard';

export default function CategoryScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const { categoryId, categoryName } = route.params || {};

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryData, setCategoryData] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    fetchCategoryData();
  }, [categoryId]);

  useEffect(() => {
    handleSearch();
  }, [searchQuery, products, selectedSubcategory]);

  const fetchCategoryData = async () => {
    try {
      setLoading(true);
      if (categoryId) {
        // Fetch category details and subcategories
        const categoryData = await categoryAPI.getCategoryById(categoryId);
        setCategoryData(categoryData);
        
        // Fetch all products for this category
        const categoryProducts = await productAPI.getCategoryProducts(categoryId);
        setProducts(categoryProducts);
      } else {
        const allProducts = await productAPI.getAllProducts();
        setProducts(allProducts);
      }
    } catch (error) {
      console.error('Error fetching category data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setSearchLoading(true);
      
      if (searchQuery.trim()) {
        const searchResults = await productAPI.searchProducts(searchQuery);
        setFilteredProducts(searchResults);
      } else {
        // If no search query, show current products (either all category products or subcategory products)
        setFilteredProducts(products);
      }
    } catch (error) {
      console.error('Error searching products:', error);
      setFilteredProducts(products);
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchSubcategoryProducts = async (subcategoryId: string) => {
    try {
      setSearchLoading(true);
      const subcategoryProducts = await productAPI.getCategoryProducts(subcategoryId);
      setFilteredProducts(subcategoryProducts);
    } catch (error) {
      console.error('Error fetching subcategory products:', error);
      setFilteredProducts([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const renderSubcategory = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.subcategoryItem,
        {
          backgroundColor: selectedSubcategory === item.id ? colors.primary : 'transparent',
          borderColor: selectedSubcategory === item.id ? colors.primary : colors.border,
          shadowColor: selectedSubcategory === item.id ? colors.primary : 'transparent',
          elevation: selectedSubcategory === item.id ? 3 : 0,
        },
      ]}
      onPress={() => {
        if (selectedSubcategory === item.id) {
          setSelectedSubcategory(null);
          setFilteredProducts(products);
        } else {
          setSelectedSubcategory(item.id);
          fetchSubcategoryProducts(item.id);
        }
      }}
    >
      {item.image && (
        <View style={[styles.subcategoryImageContainer, { borderColor: selectedSubcategory === item.id ? '#fff' : colors.border }]}>
          <Image 
            source={{ uri: item.image }} 
            style={styles.subcategoryImage}
            resizeMode="cover"
          />
        </View>
      )}
      <Text
        style={[
          styles.subcategoryText,
          {
            color: selectedSubcategory === item.id ? '#fff' : colors.text,
            fontWeight: selectedSubcategory === item.id ? 'bold' : '500',
          },
        ]}
        numberOfLines={2}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderProduct = ({ item }: { item: any }) => (
    <View style={styles.featuredCard}>
      <ProductCard product={item} />
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {categoryName || 'Products'}
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {categoryName || 'Products'}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card, shadowColor: colors.primary }]}>
        <View style={[styles.searchIconContainer, { backgroundColor: colors.primary + '15' }]}>
          <Icon name="search" size={20} color={colors.primary} />
        </View>
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search products..."
          placeholderTextColor={colors.gray}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchLoading && (
          <ActivityIndicator size="small" color={colors.primary} />
        )}
      </View>

      <View style={styles.content}>
        {/* Subcategories Sidebar */}
        {categoryData?.children && categoryData.children.length > 0 && (
          <View style={[styles.sidebar, { backgroundColor: colors.background }]}>
            <View style={[styles.sidebarHeader, { backgroundColor: colors.primary + '10' }]}>
              {/* <Icon name="category" size={16} color={colors.primary} /> */}
              <Text style={[styles.sidebarTitle, { color: colors.primary }]}>Categories</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.subcategoryItem,
                {
                  backgroundColor: !selectedSubcategory ? colors.primary : 'transparent',
                  borderColor: !selectedSubcategory ? colors.primary : colors.border,
                  shadowColor: !selectedSubcategory ? colors.primary : 'transparent',
                  elevation: !selectedSubcategory ? 3 : 0,
                },
              ]}
              onPress={() => {
                setSelectedSubcategory(null);
                setFilteredProducts(products);
              }}
            >
              <Text
                style={[
                  styles.subcategoryText,
                  { color: !selectedSubcategory ? '#fff' : colors.text, fontWeight: !selectedSubcategory ? 'bold' : '500' },
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            <FlatList
              data={categoryData.children}
              renderItem={renderSubcategory}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {/* Products Grid */}
        <View style={styles.productsContainer}>
          {filteredProducts.length > 0 ? (
            <>
              <View style={[styles.productsHeader, { backgroundColor: colors.card }]}>
                <Text style={[styles.productsCount, { color: colors.text }]}>
                  {filteredProducts.length} Products
                </Text>
                <View style={styles.filterBadge}>
                  <Icon name="tune" size={16} color={colors.primary} />
                </View>
              </View>
              <FlatList
                data={filteredProducts}
                renderItem={renderProduct}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={styles.productRow}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.productsList}
              />
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconContainer, { backgroundColor: colors.primary + '10' }]}>
                <Icon name="search-off" size={48} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No products found
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.gray }]}>
                {searchQuery
                  ? `No results for "${searchQuery}"`
                  : 'No products available in this category'}
              </Text>
            </View>
          )}
        </View>
      </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    gap: 12,
  },
  searchIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 90,
    padding: 8,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  sidebarTitle: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  subcategoryItem: {
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  subcategoryImageContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    padding: 2,
    marginBottom: 6,
  },
  subcategoryImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  subcategoryText: {
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 12,
  },
  productsContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  productsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 8,
    marginBottom: 8,
    borderRadius: 10,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  productsCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productsList: {
    padding: 8,
  },
  productRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  featuredCard: {
    width: 300,
    marginRight: -140,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});