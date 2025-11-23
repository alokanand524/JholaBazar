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
  Animated,
  BackHandler,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LottieView from 'lottie-react-native';

import { useTheme } from '../hooks/useTheme';
import { RootState } from '../store/store';
import { tokenManager } from '../utils/tokenManager';
import { Toast } from '../components/Toast';

// Import Razorpay
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
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });
  const [defaultAddress, setDefaultAddress] = useState<any>(null);
  
  // Enhanced states
  const [validationStep, setValidationStep] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [progressAnim] = useState(new Animated.Value(0));
  const [celebrationAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (isLoggedIn) {
      fetchCartData();
      fetchDefaultAddress();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn]);

  const fetchDefaultAddress = async () => {
    try {
      const response = await tokenManager.makeAuthenticatedRequest('https://api.jholabazar.com/api/v1/service-area/addresses');
      const data = await response.json();
      
      if (data.success && data.data) {
        const defaultAddr = data.data.find((addr: any) => addr.isDefault);
        if (defaultAddr) {
          setDefaultAddress(defaultAddr);
        }
      }
    } catch (error) {
      console.error('Error fetching default address:', error);
    }
  };

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

  const validateOrder = async () => {
    const addressToUse = selectedAddress || defaultAddress;
    
    // 1. Validate Address
    setValidationStep('Validating delivery address...');
    if (!addressToUse) {
      setToast({ visible: true, message: 'Please select a delivery address', type: 'error' });
      return false;
    }
    
    // 2. Check Address Serviceability
    try {
      const serviceResponse = await fetch('https://api.jholabazar.com/api/v1/service-area/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: addressToUse.latitude?.toString() || '0',
          longitude: addressToUse.longitude?.toString() || '0',
        }),
      });
      const serviceData = await serviceResponse.json();
      
      if (!serviceData.success || !serviceData.data?.available) {
        setToast({ visible: true, message: 'Delivery not available to this address', type: 'error' });
        return false;
      }
    } catch (error) {
      setToast({ visible: true, message: 'Unable to verify delivery area', type: 'error' });
      return false;
    }
    
    // 3. Validate Items Availability
    setValidationStep('Checking item availability...');
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 4. Validate Payment Method
    setValidationStep('Confirming payment method...');
    if (!paymentMethod) {
      setToast({ visible: true, message: 'Please select a payment method', type: 'error' });
      return false;
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  };

  const handlePlaceOrder = async () => {
    const addressToUse = selectedAddress || defaultAddress;
    
    setPlacing(true);
    setShowConfirmModal(false);
    
    // Disable back navigation
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    
    try {
      // Pre-order validation
      const isValid = await validateOrder();
      if (!isValid) {
        setPlacing(false);
        backHandler.remove();
        return;
      }
      
      // Start progress animation
      setValidationStep('Processing your order...');
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false,
      }).start();

      const orderPayload = {
        storeId: '0d29835f-3840-4d72-a26d-ed96ca744a34',
        deliveryAddressId: addressToUse.id,
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
        setOrderDetails(data.data);
        
        if (paymentMethod === 'online' && data.data?.payment?.gatewayData) {
          // Handle Razorpay payment for online orders
          await handleRazorpayPayment(data.data);
        } else {
          // COD order success - show success screen
          setValidationStep('Order confirmed! 🎉');
          setTimeout(() => {
            setPlacing(false);
            setShowSuccessModal(true);
            // Start celebration animation
            Animated.timing(celebrationAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }).start();
          }, 1000);
        }
      } else {
        console.log('Order creation failed:', data.message);
        setToast({ visible: true, message: data.message || 'Failed to place order', type: 'error' });
      }
    } catch (error) {
      console.error('Error placing order:', error);
      setToast({ visible: true, message: `Failed to place order: ${error.message || 'Network error'}`, type: 'error' });
    } finally {
      if (!showSuccessModal) {
        setPlacing(false);
      }
      backHandler.remove();
      setValidationStep('');
      progressAnim.setValue(0);
    }
  };

  const verifyPayment = async (orderId: string, paymentData: any) => {
    try {
      const verificationPayload = {
        orderId: orderId,
        paymentData: {
          razorpay_order_id: paymentData.razorpay_order_id,
          razorpay_payment_id: paymentData.razorpay_payment_id,
          razorpay_signature: paymentData.razorpay_signature
        },
        gateway: 'razorpay'
      };

      console.log('Verification Payload:', JSON.stringify(verificationPayload, null, 2));

      const response = await tokenManager.makeAuthenticatedRequest('https://api.jholabazar.com/api/v1/customer/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verificationPayload),
      });

      const data = await response.json();
      console.log('Verification Response:', JSON.stringify(data, null, 2));

      if (data.success) {
        setOrderDetails(data.data);
        setPlacing(false);
        setShowSuccessModal(true);
        // Start celebration animation
        Animated.timing(celebrationAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start();
      } else {
        setToast({ visible: true, message: data.message || 'Payment verification failed. Please contact support.', type: 'error' });
      }
    } catch (error) {
      console.error('Verification Error:', error);
      setToast({ visible: true, message: 'Unable to verify payment. Please contact support.', type: 'error' });
    }
  };

  const handleRazorpayPayment = async (orderData: any) => {
    const { payment, order } = orderData;
    
    if (!RazorpayCheckout) {
      setToast({ visible: true, message: 'Razorpay module not available. Please restart the app.', type: 'error' });
      return;
    }
    
    if (!payment?.gatewayData?.keyId || !payment?.gatewayData?.gatewayOrderId) {
      setToast({ visible: true, message: 'Payment configuration missing', type: 'error' });
      return;
    }

    const options = {
      description: `Payment for Order ${order.orderNumber}`,
      currency: 'INR',
      key: payment.gatewayData.keyId,
      amount: payment.gatewayData.rawResponse.amount,
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

    RazorpayCheckout.open(options)
      .then(async (data: any) => {
        console.log('Payment Success:', data);
        await verifyPayment(order.id, data);
      })
      .catch((error: any) => {
        console.log('Payment Error:', error);
        if (error.code === 'payment_cancelled') {
          setToast({ visible: true, message: 'You cancelled the payment.', type: 'error' });
        } else {
          setToast({ visible: true, message: 'Payment failed. Please try again.', type: 'error' });
        }
      });
  };

  const currentCartItems = isLoggedIn && cartData ? cartData.items : items;
  const currentCartSummary = isLoggedIn && cartData ? cartData.summary : null;
  
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
          
          {selectedAddress || defaultAddress ? (
            <TouchableOpacity 
              style={[styles.addressCard, { borderColor: colors.border }]}
              onPress={() => navigation.navigate('Addresses')}
            >
              <View style={styles.addressContent}>
                <View style={styles.addressTypeContainer}>
                  <Text style={[styles.addressType, { color: colors.primary }]}>
                    {(selectedAddress || defaultAddress).type || 'Home'}
                  </Text>
                  {(selectedAddress || defaultAddress).isDefault && (
                    <View style={[styles.defaultBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.defaultText}>Default</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.addressText, { color: colors.text }]} numberOfLines={2}>
                  {(selectedAddress || defaultAddress).fullAddress || 'Current Location'}
                </Text>
                {(selectedAddress || defaultAddress).pincode && (
                  <Text style={[styles.addressSubtext, { color: colors.gray }]}>
                    {(selectedAddress || defaultAddress).pincode.city}, {(selectedAddress || defaultAddress).pincode.state}
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
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Items ({currentCartItems.length})</Text>
          </View>
          
          {currentCartItems.map((item: any) => {
            const isApiItem = isLoggedIn && cartData;
            return (
              <View key={item.id} style={[styles.productItem, { borderBottomColor: colors.border }]}>
                <View style={styles.productInfo}>
                  <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>
                    {isApiItem ? item.variant?.name || item.name : item.name}
                  </Text>
                  <Text style={[styles.productUnit, { color: colors.gray }]}>
                    {isApiItem ? `${item.variant?.weight} ${item.variant?.baseUnit}` : (item.unit || 'pc')}
                  </Text>
                  <View style={styles.productPricing}>
                    {isApiItem && item.variant?.basePrice && item.variant.basePrice !== item.unitPrice && (
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
      </ScrollView>

      {/* Bill Details */}
      <View style={[styles.billSection, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
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
        
        <View style={[styles.billRow, styles.totalBillRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.totalBillLabel, { color: colors.text }]}>Total Amount</Text>
          <Text style={[styles.totalBillValue, { color: colors.text }]}>₹{currentCartSummary?.totalAmount || reduxTotal}</Text>
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
          onPress={() => {
            if (paymentMethod === 'cod') {
              setShowConfirmModal(true);
            } else {
              handlePlaceOrder();
            }
          }}
          disabled={placing}
        >
          {placing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.placeOrderText}>Place Order</Text>
          )}
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
      
      {/* Loading Progress Modal */}
      <Modal
        visible={placing}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingContent, { backgroundColor: colors.card }]}>
            <View style={styles.progressContainer}>
              <Animated.View 
                style={[
                  styles.progressBar,
                  { 
                    backgroundColor: colors.primary,
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%']
                    })
                  }
                ]}
              />
            </View>
            <ActivityIndicator size="large" color={colors.primary} style={styles.loadingSpinner} />
            <Text style={[styles.loadingText, { color: colors.text }]}>{validationStep}</Text>
            <Text style={[styles.loadingSubtext, { color: colors.gray }]}>Please don't close the app</Text>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.successOverlay}>
          <Animated.View 
            style={[
              styles.successContent, 
              { 
                backgroundColor: colors.card,
                transform: [{
                  scale: celebrationAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1]
                  })
                }]
              }
            ]}
          >
            {/* Celebration Animation */}
            <View style={styles.celebrationContainer}>
              <Animated.View 
                style={[
                  styles.successIcon,
                  {
                    backgroundColor: colors.primary,
                    transform: [{
                      scale: celebrationAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1.2]
                      })
                    }]
                  }
                ]}
              >
                <Icon name="check" size={40} color="#fff" />
              </Animated.View>
            </View>
            
            <Text style={[styles.successTitle, { color: colors.text }]}>Order Placed Successfully! 🎉</Text>
            <Text style={[styles.successSubtitle, { color: colors.gray }]}>Thank you for your order</Text>
            
            {orderDetails && (
              <View style={styles.orderInfo}>
                <Text style={[styles.orderNumber, { color: colors.text }]}>Order #{orderDetails.order?.orderNumber}</Text>
                <Text style={[styles.deliveryTime, { color: colors.primary }]}>Estimated delivery: 10-30 minutes</Text>
              </View>
            )}
            
            {/* Quick Actions */}
            <View style={styles.successActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.trackButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  setShowSuccessModal(false);
                  // Navigate to Order Details page with the specific order
                  navigation.navigate('OrderDetails', { 
                    orderId: orderDetails.order?.id,
                    fromOrderPlacement: true 
                  });
                }}
              >
                <Icon name="local-shipping" size={20} color="#fff" />
                <Text style={styles.trackButtonText}>Track Order</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.continueButton, { borderColor: colors.border }]}
                onPress={() => {
                  setShowSuccessModal(false);
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'MainTabs' }],
                  });
                }}
              >
                <Icon name="shopping-cart" size={20} color={colors.text} />
                <Text style={[styles.continueButtonText, { color: colors.text }]}>Continue Shopping</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
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
  addressTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  defaultBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  defaultText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
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
  // Loading Progress Modal
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    margin: 20,
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 280,
  },
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  loadingSpinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  // Success Modal
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContent: {
    margin: 20,
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 300,
  },
  celebrationContainer: {
    marginBottom: 20,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  orderInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  deliveryTime: {
    fontSize: 14,
    fontWeight: '500',
  },
  successActions: {
    width: '100%',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  trackButton: {
    marginBottom: 8,
  },
  trackButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    borderWidth: 1,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});