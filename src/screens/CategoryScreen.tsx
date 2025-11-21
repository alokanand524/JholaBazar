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
        const data = await categoryAPI.getCategoryById(categoryId);
        setCategoryData(data);
        setProducts(data.products || []);
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
      let filtered = products;

      // Filter by subcategory
      if (selectedSubcategory) {
        filtered = filtered.filter(product => 
          product.category === selectedSubcategory
        );
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const searchResults = await productAPI.searchProducts(searchQuery);
        filtered = searchResults.filter(product => {
          if (selectedSubcategory) {
            return product.category === selectedSubcategory;
          }
          return categoryId ? product.category === categoryName : true;
        });
      }

      setFilteredProducts(filtered);
    } catch (error) {
      console.error('Error searching products:', error);
      setFilteredProducts(products);
    } finally {
      setSearchLoading(false);
    }
  };

  const renderSubcategory = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.subcategoryItem,
        {
          backgroundColor: selectedSubcategory === item.name ? colors.primary : colors.card,
          borderColor: colors.border,
        },
      ]}
      onPress={() => {
        setSelectedSubcategory(
          selectedSubcategory === item.name ? null : item.name
        );
      }}
    >
      {item.image && (
        <Image 
          source={{ uri: item.image }} 
          style={styles.subcategoryImage}
          resizeMode="cover"
        />
      )}
      <Text
        style={[
          styles.subcategoryText,
          {
            color: selectedSubcategory === item.name ? '#fff' : colors.text,
          },
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderProduct = ({ item }: { item: any }) => (
    <View style={styles.productItem}>
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
      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
        <Icon name="search" size={20} color={colors.gray} />
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
          <View style={[styles.sidebar, { backgroundColor: colors.card, borderRightColor: colors.border }]}>
            <Text style={[styles.sidebarTitle, { color: colors.text }]}>Categories</Text>
            <TouchableOpacity
              style={[
                styles.subcategoryItem,
                {
                  backgroundColor: !selectedSubcategory ? colors.primary : colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setSelectedSubcategory(null)}
            >
              <Text
                style={[
                  styles.subcategoryText,
                  { color: !selectedSubcategory ? '#fff' : colors.text },
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
            <FlatList
              data={filteredProducts}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.productRow}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.productsList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="search-off" size={64} color={colors.gray} />
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
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
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
    width: 120,
    borderRightWidth: 1,
    padding: 8,
  },
  sidebarTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  subcategoryItem: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  subcategoryImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 4,
  },
  subcategoryText: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  productsContainer: {
    flex: 1,
  },
  productsList: {
    padding: 8,
  },
  productRow: {
    justifyContent: 'space-around',
  },
  productItem: {
    width: '48%',
    marginBottom: 16,
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