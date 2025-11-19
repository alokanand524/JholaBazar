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

  // Use only API data
  const cartItems = apiCartData?.items || [];
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
    const itemImage = item.variant?.images?.[0] || item.product?.images?.[0] || item.image;
    const itemPrice = item.unitPrice;
    const itemUnit = `${item.variant?.weight} ${item.variant?.baseUnit}`;
    const cartItemId = item.id;
    
    return (
      <View style={[styles.cartItem, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Image source={{ uri: itemImage }} style={styles.itemImage} />
        
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
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



        {/* Free Delivery Message */}
        {cartSummary?.thresholds?.freeDelivery && subtotal < cartSummary.thresholds.freeDelivery.amount && (
          <View style={[styles.freeDeliveryMessage, { backgroundColor: '#FFF3CD', borderColor: '#FFEAA7' }]}>
            <Icon name="local-shipping" size={16} color="#856404" />
            <Text style={styles.freeDeliveryText}>
              Add ₹{(cartSummary.thresholds.freeDelivery.amount - subtotal).toFixed(2)} more for free delivery
            </Text>
          </View>
        )}


      </ScrollView>

      {/* Threshold Information */}
      {isLoggedIn && apiCartData && cartSummary?.thresholds?.isEnabled && (
        <View style={[styles.thresholdCard, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          {cartSummary.thresholds.current && (
            <View style={styles.currentLevel}>
              <View style={styles.levelDot} />
              <Text style={[styles.levelText, { color: colors.primary }]}>
                ✓ {cartSummary.thresholds.current.name} Unlocked
              </Text>
            </View>
          )}
          
          {cartSummary.thresholds.next && (
            <View style={styles.nextLevel}>
              <View style={styles.progressTrack}>
                <View 
                  style={[
                    styles.progressActive, 
                    { width: `${Math.min(100, (subtotal / cartSummary.thresholds.next.amount) * 100)}%` }
                  ]} 
                />
              </View>
              <Text style={[styles.nextText, { color: colors.gray }]}>
                ₹{cartSummary.thresholds.next.amountNeeded} away from {cartSummary.thresholds.next.name}
              </Text>
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
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  freeDeliveryText: {
    fontSize: 12,
    color: '#856404',
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
    borderTopWidth: 1,
    gap: 12,
  },
  currentLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00B761',
  },
  levelText: {
    fontSize: 14,
    fontWeight: '500',
  },
  nextLevel: {
    gap: 8,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressActive: {
    height: '100%',
    backgroundColor: '#00B761',
    borderRadius: 2,
  },
  nextText: {
    fontSize: 12,
  },
});