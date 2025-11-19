import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { SkeletonLoader } from './SkeletonLoader';
import { responsive } from '../utils/responsive';

export const BannerSkeleton: React.FC = () => {
  return (
    <View style={styles.bannerContainer}>
      <SkeletonLoader width={350} height={180} borderRadius={12} />
    </View>
  );
};

export const FeaturedSkeleton: React.FC = () => {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredScroll}>
      {[1, 2, 3].map((item) => (
        <View key={item} style={styles.featuredCard}>
          <SkeletonLoader width={160} height={200} borderRadius={12} />
        </View>
      ))}
    </ScrollView>
  );
};

export const CategoriesSkeleton: React.FC = () => {
  return (
    <View style={styles.categoriesContainer}>
      <View style={styles.categoriesGrid}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
          <View key={item} style={styles.categoryItem}>
            <SkeletonLoader width={70} height={70} borderRadius={8} style={{ marginBottom: 4 }} />
            <SkeletonLoader width={50} height={10} borderRadius={4} />
          </View>
        ))}
      </View>
    </View>
  );
};

export const ProductsSkeleton: React.FC = () => {
  const columns = responsive.getProductColumns();
  
  return (
    <View style={styles.productsGrid}>
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <View key={item} style={[styles.productCard, { width: `${100 / columns - 2}%` }]}>
          <SkeletonLoader width={140} height={120} borderRadius={8} style={{ marginBottom: 8 }} />
          <SkeletonLoader width={100} height={12} style={{ marginBottom: 4 }} />
          <SkeletonLoader width={60} height={10} style={{ marginBottom: 4 }} />
          <SkeletonLoader width={80} height={14} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  featuredScroll: {
    paddingLeft: 16,
    marginBottom: 20,
  },
  featuredCard: {
    marginRight: 12,
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
    alignItems: 'center',
    marginBottom: 12,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  productCard: {
    marginBottom: 16,
    alignItems: 'center',
  },
});