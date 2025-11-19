import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface SkeletonLoaderProps {
  width?: number;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  width = 100, 
  height = 20, 
  borderRadius = 4,
  style 
}) => {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => animate());
    };
    animate();
  }, [opacity]);

  return (
    <Animated.View 
      style={[
        styles.skeleton, 
        { 
          width, 
          height, 
          borderRadius,
          backgroundColor: colors.lightGray,
          opacity 
        },
        style
      ]} 
    />
  );
};

export const CartItemSkeleton: React.FC = () => {
  return (
    <View style={styles.cartItemContainer}>
      <View style={styles.cartItemCard}>
        <View style={styles.cartItem}>
          <SkeletonLoader width={60} height={60} borderRadius={8} />
          <View style={styles.itemDetails}>
            <SkeletonLoader width={120} height={16} style={{ marginBottom: 4 }} />
            <SkeletonLoader width={80} height={12} style={{ marginBottom: 4 }} />
            <SkeletonLoader width={60} height={14} />
          </View>
          <SkeletonLoader width={80} height={32} borderRadius={6} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    // backgroundColor will be set dynamically
  },
  cartItemContainer: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    paddingTop: 4,
  },
  cartItemCard: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#F5F5F5',
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
});