import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useTheme } from '../hooks/useTheme';
import { RootState, AppDispatch } from '../store/store';
import { updateQuantity, removeItem } from '../store/slices/cartSlice';
import { tokenManager } from '../utils/tokenManager';

export default function CartScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { items } = useSelector((state: RootState) => state.cart);
  const { isLoggedIn } = useSelector((state: RootState) => state.user);
  
  const [apiCartData, setApiCartData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      fetchCartData();
    }
  }, [isLoggedIn]);

  const fetchCartData = async () => {
    try {
      setLoading(true);
      const response = await tokenManager.makeAuthenticatedRequest('https://api.jholabazar.com/api/v1/cart/');
      const data = await response.json();
      
      if (data.success && data.data.carts.length > 0) {
        setApiCartData(data.data.carts[0]);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use only API data and sort free products to top
  const cartItems = (apiCartData?.items || []).sort((a: any, b: any) => {
    if (a.isFreeProduct && !b.isFreeProduct) return -1;
    if (!a.isFreeProduct && b.isFreeProduct) return 1;
    return 0;
  });
  const cartSummary = apiCartData?.summary;
  
  const subtotal = cartSummary?.subtotal || 0;
  const totalMRP = cartItems.reduce((sum: number, item: any) => sum + (parseFloat(item.variant?.basePrice || item.unitPrice) * item.quantity), 0);
  const deliveryFee = cartSummary?.deliveryCharge || 0;
  const total = cartSummary?.totalAmount || 0;

  const handleIncrement = async (cartItemId: string) => {
    try {
      await tokenManager.makeAuthenticatedRequest(`https://api.jholabazar.com/api/v1/cart/items/${cartItemId}/increment`, {
        method: 'PATCH'
      });
      fetchCartData();
    } catch (error) {
      console.error('Error incrementing item:', error);
    }
  };

  const handleDecrement = async (cartItemId: string, quantity: number) => {
    try {
      if (quantity === 1) {
        // Delete item when quantity is 1
        await tokenManager.makeAuthenticatedRequest(`https://api.jholabazar.com/api/v1/cart/items/${cartItemId}`, {
          method: 'DELETE'
        });
      } else {
        // Decrement quantity
        await tokenManager.makeAuthenticatedRequest(`https://api.jholabazar.com/api/v1/cart/items/${cartItemId}/decrement`, {
          method: 'PATCH'
        });
      }
      fetchCartData();
    } catch (error) {
      console.error('Error decrementing item:', error);
    }
  };

  const renderCartItem = ({ item }: { item: any }) => {
    const itemName = item.variant?.name || item.name;
    const itemImage = item.product?.images || item.variant?.images || item.image;
    const itemPrice = item.unitPrice;
    const itemUnit = `${item.variant?.weight} ${item.variant?.baseUnit}`;
    const cartItemId = item.id;
    
    return (
      <View style={[
        styles.cartItem, 
        { backgroundColor: colors.card, borderBottomColor: colors.border },
        item.isFreeProduct && { borderWidth: 2, borderColor: '#FF8C00', borderRadius: 12, marginHorizontal: 8, marginVertical: 4 }
      ]}>
        <Image 
          source={{ uri: itemImage }} 
          style={styles.itemImage}
          defaultSource={require('../../assets/images/jhola-bazar.png')}
          onError={() => console.log('Image load error for:', itemImage)}
        />
        
        <View style={styles.itemDetails}>
          <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>
            {itemName}
          </Text>
          <Text style={[styles.itemUnit, { color: colors.gray }]}>
            {itemUnit}
          </Text>
          <View style={styles.priceContainer}>
            {item.variant?.basePrice && item.variant.basePrice !== item.unitPrice && (
              <Text style={[styles.mrpPrice, { color: colors.gray }]}>
                ₹{item.variant.basePrice}
              </Text>
            )}
            <Text style={[styles.itemPrice, { color: colors.text }]}>
              ₹{itemPrice}
            </Text>
          </View>
          {item.isFreeProduct && (
            <Text style={[styles.freeTag, { color: colors.primary }]}>
              FREE
            </Text>
          )}
        </View>

        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={[styles.quantityButton, { borderColor: colors.primary }]}
            onPress={() => handleDecrement(cartItemId, item.quantity)}
          >
            <Icon 
              name={item.quantity === 1 ? "delete" : "remove"} 
              size={16} 
              color={colors.primary} 
            />
          </TouchableOpacity>
          
          <Text style={[styles.quantity, { color: colors.text }]}>
            {item.quantity}
          </Text>
          
          <TouchableOpacity
            style={[styles.quantityButton, { borderColor: colors.primary }]}
            onPress={() => handleIncrement(cartItemId)}
          >
            <Icon name="add" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            My Jhola
          </Text>
        </View>
        <CartScreenSkeleton colors={colors} />
      </View>
    );
  }

  if (cartItems.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            My Jhola
          </Text>
        </View>
        
        <View style={styles.emptyContainer}>
          <Icon name="shopping-cart" size={80} color={colors.gray} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Your jhola is empty
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.gray }]}>
            Add items to get started
          </Text>
          <TouchableOpacity
            style={[styles.shopButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('MainTabs')}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          My Jhola ({cartItems.length} items)
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Delivery Info */}
        <View style={[styles.deliveryInfo, { backgroundColor: colors.card }]}>
          <Icon name="schedule" size={20} color={colors.primary} />
          <Text style={[styles.deliveryText, { color: colors.text }]}>
            Delivery in 10-15 mins
          </Text>
        </View>

        {/* Cart Items */}
        <FlatList
          data={cartItems}
          renderItem={renderCartItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />

        {/* Add More Items */}
        <TouchableOpacity
          style={[styles.addMoreButton, { borderColor: colors.border }]}
          onPress={() => navigation.navigate('MainTabs')}
        >
          <Icon name="add" size={20} color={colors.primary} />
          <Text style={[styles.addMoreText, { color: colors.primary }]}>
            Add more items
          </Text>
        </TouchableOpacity>



      </ScrollView>

      {/* Free Delivery Message */}
      {cartSummary?.deliveryInfo && !cartSummary.deliveryInfo.isEligibleForFreeDelivery && (
        <View style={[styles.freeDeliveryMessage, { backgroundColor: '#E8F5E8', borderColor: '#4CAF50' }]}>
          <Icon name="local-shipping" size={18} color="#2E7D32" />
          <Text style={[styles.freeDeliveryText, { color: '#2E7D32' }]}>
            Add ₹{cartSummary.deliveryInfo.amountNeededForFreeDelivery} more for free delivery & save ₹{cartSummary.deliveryInfo.deliveryCharge}
          </Text>
        </View>
      )}

      {/* Threshold Information */}
      {isLoggedIn && apiCartData && cartSummary?.thresholds?.isEnabled && (
        <View style={[styles.thresholdCard, { backgroundColor: colors.card }]}>
          {cartSummary.thresholds.current && (
            <View style={styles.currentLevelCreative}>
              <View style={styles.levelBadge}>
                <Icon name="stars" size={16} color="#FFD700" />
                <Text style={styles.levelBadgeText}>{cartSummary.thresholds.current.name}</Text>
              </View>
              <Text style={[styles.levelUnlockedText, { color: colors.primary }]}>Unlocked!</Text>
            </View>
          )}
          
          {cartSummary.thresholds.next && (
            <View style={styles.nextLevelCreative}>
              <View style={styles.progressContainer}>
                <View style={styles.progressTrackCreative}>
                  <View 
                    style={[
                      styles.progressActiveCreative, 
                      { width: `${Math.min(100, (subtotal / cartSummary.thresholds.next.amount) * 100)}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressPercentage}>
                  {Math.round((subtotal / cartSummary.thresholds.next.amount) * 100)}%
                </Text>
              </View>
              <View style={styles.nextLevelInfo}>
                <Text style={[styles.nextLevelTitle, { color: colors.text }]}>
                  🎯 Next: {cartSummary.thresholds.next.name}
                </Text>
                <Text style={[styles.nextLevelAmount, { color: colors.primary }]}>
                  ₹{cartSummary.thresholds.next.amountNeeded} to go
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Checkout Button */}
      <View style={[styles.checkoutContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <View style={styles.totalSection}>
          <View style={styles.priceRow}>
            <Text style={[styles.mrpText, { color: colors.gray }]}>
              ₹{totalMRP.toFixed(2)}
            </Text>
            <Text style={[styles.totalAmount, { color: colors.text }]}>
              ₹{total.toFixed(2)}
            </Text>
          </View>
          {totalMRP > total && (
            <Text style={[styles.savingsText, { color: colors.primary }]}>
              You save ₹{(totalMRP - total).toFixed(2)}
            </Text>
          )}
        </View>
        
        <TouchableOpacity
          style={[styles.checkoutButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('Checkout')}
        >
          <Text style={styles.checkoutButtonText}>
            Proceed to Checkout
          </Text>
        </TouchableOpacity>
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
  content: {
    flex: 1,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  deliveryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  cartItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemUnit: {
    fontSize: 12,
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mrpPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 20,
    textAlign: 'center',
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 16,
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: 'dashed',
    gap: 8,
  },
  addMoreText: {
    fontSize: 14,
    fontWeight: '500',
  },
  freeDeliveryMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  freeDeliveryText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  checkoutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
  },
  totalSection: {
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  mrpText: {
    fontSize: 14,
    textDecorationLine: 'line-through',
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '500',
  },
  payText: {
    fontSize: 12,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  checkoutButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
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
    marginBottom: 32,
  },
  shopButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  freeTag: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  thresholdCard: {
    padding: 16,
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    gap: 16,
  },
  currentLevelCreative: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#F57C00',
  },
  levelUnlockedText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  nextLevelCreative: {
    gap: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressTrackCreative: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressActiveCreative: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
    minWidth: 35,
  },
  nextLevelInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextLevelTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  nextLevelAmount: {
    fontSize: 14,
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

const CartItemSkeleton = ({ colors }: any) => (
  <View style={[styles.cartItem, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
    <SkeletonBox width={60} height={60} style={{ borderRadius: 8 }} colors={colors} />
    
    <View style={styles.itemDetails}>
      <SkeletonBox width="80%" height={16} style={{ marginBottom: 6 }} colors={colors} />
      <SkeletonBox width="60%" height={14} style={{ marginBottom: 6 }} colors={colors} />
      <SkeletonBox width="40%" height={16} colors={colors} />
    </View>

    <View style={styles.quantityControls}>
      <SkeletonBox width={32} height={32} style={{ borderRadius: 6 }} colors={colors} />
      <SkeletonBox width={20} height={16} colors={colors} />
      <SkeletonBox width={32} height={32} style={{ borderRadius: 6 }} colors={colors} />
    </View>
  </View>
);

const CartScreenSkeleton = ({ colors }: any) => (
  <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
    {/* Delivery Info Skeleton */}
    <View style={[styles.deliveryInfo, { backgroundColor: colors.card }]}>
      <SkeletonBox width={20} height={20} colors={colors} />
      <SkeletonBox width={150} height={16} colors={colors} />
    </View>

    {/* Cart Items Skeleton */}
    {[1, 2, 3, 4].map((item) => (
      <CartItemSkeleton key={item} colors={colors} />
    ))}

    {/* Add More Button Skeleton */}
    <View style={[styles.addMoreButton, { borderColor: colors.border }]}>
      <SkeletonBox width={20} height={20} colors={colors} />
      <SkeletonBox width={100} height={16} colors={colors} />
    </View>

    {/* Threshold Card Skeleton */}
    <View style={[styles.thresholdCard, { backgroundColor: colors.card }]}>
      <View style={styles.currentLevelCreative}>
        <SkeletonBox width={100} height={28} style={{ borderRadius: 20 }} colors={colors} />
        <SkeletonBox width={80} height={16} colors={colors} />
      </View>
      
      <View style={styles.nextLevelCreative}>
        <View style={styles.progressContainer}>
          <SkeletonBox width="100%" height={8} style={{ borderRadius: 4 }} colors={colors} />
          <SkeletonBox width={35} height={14} colors={colors} />
        </View>
        <View style={styles.nextLevelInfo}>
          <SkeletonBox width={120} height={16} colors={colors} />
          <SkeletonBox width={80} height={16} colors={colors} />
        </View>
      </View>
    </View>

    {/* Checkout Section Skeleton */}
    <View style={[styles.checkoutContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
      <View style={styles.totalSection}>
        <View style={styles.priceRow}>
          <SkeletonBox width={60} height={16} colors={colors} />
          <SkeletonBox width={80} height={20} colors={colors} />
        </View>
        <SkeletonBox width={100} height={14} style={{ marginTop: 4 }} colors={colors} />
      </View>
      
      <SkeletonBox width={150} height={40} style={{ borderRadius: 8 }} colors={colors} />
    </View>
  </ScrollView>
);