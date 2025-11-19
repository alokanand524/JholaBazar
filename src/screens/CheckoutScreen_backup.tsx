import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useTheme } from '../hooks/useTheme';
import { RootState } from '../store/store';
import { tokenManager } from '../utils/tokenManager';
import RazorpayCheckout from 'react-native-razorpay';

export default function CheckoutScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { isLoggedIn } = useSelector((state: RootState) => state.user);
  const { selectedAddress } = useSelector((state: RootState) => state.address);
  const { items } = useSelector((state: RootState) => state.cart);
  
  const [cartData, setCartData] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      fetchCartData();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn]);

  const fetchCartData = async () => {
    try {
      setLoading(true);
      const response = await tokenManager.makeAuthenticatedRequest('https://api.jholabazar.com/api/v1/cart/');
      const data = await response.json();
      
      if (data.success) {
        console.log('Cart API Response:', JSON.stringify(data, null, 2));
        if (data.data.carts && data.data.carts.length > 0) {
          setCartData(data.data.carts[0]);
        } else if (data.data.items) {
          // Handle direct items structure
          setCartData({
            items: data.data.items,
            summary: data.data.summary || data.data
          });
        }
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('Error', 'Please select a delivery address');
      return;
    }

    setPlacing(true);
    setShowConfirmModal(false);

    try {
      const orderPayload = {
        storeId: '0d29835f-3840-4d72-a26d-ed96ca744a34',
        deliveryAddressId: selectedAddress.id,
        paymentMethod: paymentMethod === 'cod' ? 'CASH_ON_DELIVERY' : 'ONLINE_PAYMENT'
      };

      console.log('Order Payload:', JSON.stringify(orderPayload, null, 2));
      
      const response = await tokenManager.makeAuthenticatedRequest('https://api.jholabazar.com/api/v1/orders/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      });

      console.log('Order API Response Status:', response.status);
      const data = await response.json();
      console.log('Order API Response:', JSON.stringify(data, null, 2));
      
      if (data.success) {
        if (data.data.order.paymentMethod === 'RAZORPAY') {
          // Open Razorpay payment
          await handleRazorpayPayment(data.data);
        } else {
          // COD order success
          Alert.alert('Success', 'Order placed successfully!', [
            { text: 'OK', onPress: () => navigation.navigate('Orders') }
          ]);
        }
      } else {
        console.log('Order creation failed:', data.message);
        Alert.alert('Error', data.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', `Failed to place order: ${error.message || 'Network error'}`);
    } finally {
      setPlacing(false);
    }
  };

  const handleRazorpayPayment = async (orderData: any) => {
    const { payment, order } = orderData;
    
    if (!RazorpayCheckout) {
      Alert.alert('Error', 'Razorpay module not available. Please restart the app.');
      return;
    }
    
    if (!payment?.gatewayData?.keyId || !payment?.gatewayData?.gatewayOrderId) {
      Alert.alert('Error', 'Payment configuration missing');
      return;
    }

    const options = {
      description: `Payment for Order ${order.orderNumber}`,
      currency: 'INR',
      key: payment.gatewayData.keyId,
      amount: payment.gatewayData.rawResponse.amount, // Already in paise from API
      order_id: payment.gatewayData.gatewayOrderId,
      name: 'JholaBazar',
      prefill: {
        email: 'customer@jholabazar.com',
        contact: '9999999999',
        name: 'Customer'
      },
      theme: { color: '#4CAF50' }
    };

    console.log('Razorpay Options:', options);

    try {
      const result = await RazorpayCheckout.open(options);
      console.log('Payment Success:', result);
      Alert.alert('Payment Successful', 'Your order has been placed successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('Orders') }
      ]);
    } catch (error: any) {
      console.log('Payment Error:', error);
      if (error.code === 'payment_cancelled') {
        Alert.alert('Payment Cancelled', 'You cancelled the payment.');
      } else {
        Alert.alert('Payment Failed', 'Payment failed. Please try again.');
      }
    }
  };

  // Use API data if logged in and available, otherwise use Redux cart
  const currentCartItems = isLoggedIn && cartData ? cartData.items : items;
  const currentCartSummary = isLoggedIn && cartData ? cartData.summary : null;
  
  // Calculate totals for Redux cart
  const reduxSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const reduxDeliveryFee = reduxSubtotal > 500 ? 0 : 25;
  const reduxTotal = reduxSubtotal + reduxDeliveryFee;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Checkout</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (currentCartItems.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Checkout</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.emptyText, { color: colors.text }]}>No items in cart</Text>
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Checkout</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Delivery Address */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Icon name="location-on" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Delivery Address</Text>
          </View>
          
          {selectedAddress ? (
            <TouchableOpacity 
              style={[styles.addressCard, { borderColor: colors.border }]}
              onPress={() => navigation.navigate('Addresses')}
            >
              <View style={styles.addressContent}>
                <Text style={[styles.addressType, { color: colors.primary }]}>
                  {selectedAddress.type || 'Home'}
                </Text>
                <Text style={[styles.addressText, { color: colors.text }]} numberOfLines={2}>
                  {selectedAddress.fullAddress || 'Current Location'}
                </Text>
                {selectedAddress.pincode && (
                  <Text style={[styles.addressSubtext, { color: colors.gray }]}>
                    {selectedAddress.pincode.city}, {selectedAddress.pincode.state}
                  </Text>
                )}
              </View>
              <Icon name="chevron-right" size={20} color={colors.gray} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.addAddressButton, { borderColor: colors.primary }]}
              onPress={() => navigation.navigate('Addresses')}
            >
              <Icon name="add" size={20} color={colors.primary} />
              <Text style={[styles.addAddressText, { color: colors.primary }]}>
                Add Delivery Address
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Product Details */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Icon name="shopping-cart" size={20} color={colors.primary} />
<<<<<<< HEAD
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Items ({cartData?.items?.length || 0})</Text>
          </View>
          
          {cartData?.items?.map((item: any) => (
            <View key={item.id} style={[styles.productItem, { borderBottomColor: colors.border }]}>
              <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>
                  {item.variant?.name || item.name}
                </Text>
                <Text style={[styles.productUnit, { color: colors.gray }]}>
                  {item.variant?.weight} {item.variant?.baseUnit || item.unit}
                </Text>
                <View style={styles.productPricing}>
                  {item.variant?.basePrice && item.variant.basePrice !== item.variant.currentPrice && (
                    <Text style={[styles.productMRP, { color: colors.gray }]}>
                      ₹{item.variant.basePrice}
                    </Text>
                  )}
                  <Text style={[styles.productPrice, { color: colors.text }]}>
                    ₹{item.unitPrice}
=======
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Items ({currentCartItems.length})</Text>
          </View>
          
          {currentCartItems.map((item: any) => {
            const isApiItem = isLoggedIn && cartData;
            return (
              <View key={item.id} style={[styles.productItem, { borderBottomColor: colors.border }]}>
                <View style={styles.productInfo}>
                  <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>
                    {isApiItem ? item.variant.name : item.name}
>>>>>>> 48d8987478eb9e9bc4450aded823fe0a42ab43b4
                  </Text>
                  <Text style={[styles.productUnit, { color: colors.gray }]}>
                    {isApiItem ? `${item.variant.weight} ${item.variant.baseUnit}` : (item.unit || 'pc')}
                  </Text>
                  <View style={styles.productPricing}>
                    {isApiItem && item.variant.basePrice !== item.variant.currentPrice && (
                      <Text style={[styles.productMRP, { color: colors.gray }]}>
                        ₹{item.variant.basePrice}
                      </Text>
                    )}
                    <Text style={[styles.productPrice, { color: colors.text }]}>
                      ₹{isApiItem ? item.unitPrice : item.price}
                    </Text>
                    {isApiItem && item.isFreeProduct && (
                      <Text style={[styles.freeLabel, { color: colors.primary }]}>FREE</Text>
                    )}
                  </View>
                </View>
                <View style={styles.productQuantity}>
                  <Text style={[styles.quantityText, { color: colors.text }]}>Qty: {item.quantity}</Text>
                  <Text style={[styles.itemTotal, { color: colors.text }]}>₹{isApiItem ? item.totalPrice : (item.price * item.quantity)}</Text>
                </View>
              </View>
            );
          })}
        </View>

<<<<<<< HEAD
=======
        {/* Detailed Bill */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Icon name="receipt" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Bill Details</Text>
          </View>
          
          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { color: colors.gray }]}>Item Total</Text>
            <Text style={[styles.billValue, { color: colors.text }]}>₹{currentCartSummary?.subtotal || reduxSubtotal}</Text>
          </View>
          
          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { color: colors.gray }]}>Delivery Fee</Text>
            <Text style={[styles.billValue, { color: colors.text }]}>
              {(currentCartSummary?.deliveryCharge || reduxDeliveryFee) === 0 ? 'FREE' : `₹${currentCartSummary?.deliveryCharge || reduxDeliveryFee}`}
            </Text>
          </View>
          
          {currentCartSummary?.thresholds?.freeProduct && (
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: colors.primary }]}>Free Product Savings</Text>
              <Text style={[styles.billValue, { color: colors.primary }]}>-₹{currentCartSummary.thresholds.freeProduct.currentPrice}</Text>
            </View>
          )}
          
          <View style={[styles.billRow, styles.totalBillRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.totalBillLabel, { color: colors.text }]}>Total Amount</Text>
            <Text style={[styles.totalBillValue, { color: colors.text }]}>₹{currentCartSummary?.totalAmount || reduxTotal}</Text>
          </View>
        </View>
>>>>>>> 48d8987478eb9e9bc4450aded823fe0a42ab43b4





      </ScrollView>

      {/* Bill Details */}
      <View style={[styles.billSection, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={styles.billRow}>
          <Text style={[styles.billLabel, { color: colors.gray }]}>Item Total</Text>
          <Text style={[styles.billValue, { color: colors.text }]}>₹{cartData?.summary?.subtotal || cartData?.subtotal || 0}</Text>
        </View>
        
        <View style={styles.billRow}>
          <Text style={[styles.billLabel, { color: colors.gray }]}>Delivery Fee</Text>
          <Text style={[styles.billValue, { color: colors.text }]}>
            {(cartData?.summary?.deliveryCharge || cartData?.deliveryCharge || 0) === 0 ? 'FREE' : `₹${cartData?.summary?.deliveryCharge || cartData?.deliveryCharge || 0}`}
          </Text>
        </View>
        
        <View style={[styles.billRow, styles.totalBillRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.totalBillLabel, { color: colors.text }]}>Total Amount</Text>
          <Text style={[styles.totalBillValue, { color: colors.text }]}>₹{cartData?.summary?.totalAmount || cartData?.totalAmount || 0}</Text>
        </View>
      </View>

      {/* Place Order Button */}
      <View style={[styles.bottomContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <View style={styles.paymentSection}>
          <Text style={[styles.paymentLabel, { color: colors.gray }]}>Payment Method</Text>
          <TouchableOpacity 
            style={styles.paymentSelector}
            onPress={() => setShowPaymentDropdown(!showPaymentDropdown)}
          >
            <Icon 
              name={paymentMethod === 'cod' ? 'money' : 'credit-card'} 
              size={16} 
              color={colors.text} 
            />
            <Text style={[styles.paymentMethodText, { color: colors.text }]}>
              {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
            </Text>
            <Icon name="keyboard-arrow-down" size={16} color={colors.gray} />
          </TouchableOpacity>
          
          {showPaymentDropdown && (
            <View style={[styles.paymentDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity 
                style={[styles.paymentDropdownItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setPaymentMethod('cod');
                  setShowPaymentDropdown(false);
                }}
              >
                <Icon name="money" size={16} color={colors.text} />
                <Text style={[styles.paymentDropdownText, { color: colors.text }]}>Cash on Delivery</Text>
                {paymentMethod === 'cod' && <Icon name="check" size={16} color={colors.primary} />}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.paymentDropdownItem}
                onPress={() => {
                  setPaymentMethod('online');
                  setShowPaymentDropdown(false);
                }}
              >
                <Icon name="credit-card" size={16} color={colors.text} />
                <Text style={[styles.paymentDropdownText, { color: colors.text }]}>Online Payment</Text>
                {paymentMethod === 'online' && <Icon name="check" size={16} color={colors.primary} />}
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <TouchableOpacity
          style={[styles.placeOrderButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowConfirmModal(true)}
          disabled={placing}
        >
          <Text style={styles.placeOrderText}>Place Order</Text>
        </TouchableOpacity>
      </View>
      
      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Confirm Order</Text>
            <Text style={[styles.modalMessage, { color: colors.gray }]}>
              Are you sure you want to place this order?
            </Text>
            <Text style={[styles.modalAmount, { color: colors.text }]}>
              Total: ₹{currentCartSummary?.totalAmount || reduxTotal}
            </Text>
            <Text style={[styles.modalPayment, { color: colors.gray }]}>
              Payment: {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: colors.primary }]}
                onPress={handlePlaceOrder}
                disabled={placing}
              >
                {placing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm Order</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  addressContent: {
    flex: 1,
  },
  addressType: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 12,
    marginBottom: 2,
  },
  addressSubtext: {
    fontSize: 10,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: 'dashed',
    gap: 8,
  },
  addAddressText: {
    fontSize: 14,
    fontWeight: '500',
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  productUnit: {
    fontSize: 12,
    marginBottom: 4,
  },
  productPricing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productMRP: {
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  freeLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  productQuantity: {
    alignItems: 'flex-end',
  },
  quantityText: {
    fontSize: 12,
    marginBottom: 4,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  billLabel: {
    fontSize: 14,
  },
  billValue: {
    fontSize: 14,
  },
  totalBillRow: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 8,
  },
  totalBillLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalBillValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  paymentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentText: {
    fontSize: 14,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  billSection: {
    padding: 16,
    borderTopWidth: 1,
  },
  bottomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  paymentSection: {
    flex: 1,
    position: 'relative',
  },
  paymentLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  paymentSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '500',
  },
  paymentDropdown: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  paymentDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
  },
  paymentDropdownText: {
    flex: 1,
    fontSize: 14,
  },
  placeOrderButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 120,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalPayment: {
    fontSize: 12,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {
    minWidth: 120,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});