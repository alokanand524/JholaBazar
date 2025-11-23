import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  BackHandler,
  Animated,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useTheme } from '../hooks/useTheme';
import { tokenManager } from '../utils/tokenManager';

export default function OrderDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const { orderId, fromOrderPlacement } = route.params || {};
  
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  // Handle back navigation for order placement flow
  useFocusEffect(
    React.useCallback(() => {
      if (fromOrderPlacement) {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
          // Navigate to Home and refresh
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs', params: { refresh: true } }],
          });
          return true;
        });
        
        return () => backHandler.remove();
      }
    }, [fromOrderPlacement, navigation])
  );

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await tokenManager.makeAuthenticatedRequest(`https://api.jholabazar.com/api/v1/orders/${orderId}`);
      const data = await response.json();
      
      if (data.success) {
        setOrderDetails(data.data);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return '#00B761';
      case 'CONFIRMED': return '#007AFF';
      case 'PACKED': return '#FF9500';
      case 'DISPATCHED': return '#5856D6';
      case 'CANCELLED': return '#FF3B30';
      case 'PAYMENT_PENDING': return '#FF9500';
      default: return colors.gray;
    }
  };

  const renderOrderItem = (item: any) => (
    <View key={item.id} style={[styles.orderItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Image source={{ uri: item.product.image }} style={styles.productImage} />
      
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>
          {item.product.name}
        </Text>
        <Text style={[styles.brandName, { color: colors.gray }]}>
          {item.product.brand?.name}
        </Text>
        <Text style={[styles.quantity, { color: colors.gray }]}>
          Qty: {item.quantity}
        </Text>
        <Text style={[styles.price, { color: colors.text }]}>
          ₹{item.unitPrice} each
        </Text>
        {item.isFreeProduct && (
          <Text style={[styles.freeTag, { color: colors.primary }]}>
            FREE - {item.freeProductReason}
          </Text>
        )}
      </View>
      
      <View style={styles.itemTotalContainer}>
        <Text style={[styles.itemTotal, { color: colors.text }]}>
          ₹{item.totalPrice}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => {
            if (fromOrderPlacement) {
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs', params: { refresh: true } }],
              });
            } else {
              navigation.goBack();
            }
          }}>
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Order Details</Text>
        </View>
        <OrderDetailsSkeleton colors={colors} />
      </View>
    );
  }

  if (!orderDetails) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Order Details</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.text }]}>Order not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => {
          if (fromOrderPlacement) {
            // Navigate to Home and refresh
            navigation.reset({
              index: 0,
              routes: [{ name: 'MainTabs', params: { refresh: true } }],
            });
          } else {
            navigation.goBack();
          }
        }}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Order Details</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Info Card */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.orderInfoRow}>
            <View style={styles.orderDetails}>
              <Text style={[styles.orderNumber, { color: colors.text }]}>
                #{orderDetails.orderNumber}
              </Text>
              <Text style={[styles.orderDate, { color: colors.gray }]}>
                {new Date(orderDetails.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(orderDetails.status) }]}>
              <Text style={styles.statusText}>{orderDetails.status.replace('_', ' ')}</Text>
            </View>
          </View>
          
          <View style={styles.addressSection}>
            <Text style={[styles.addressLabel, { color: colors.gray }]}>Delivery Address</Text>
            <Text style={[styles.addressText, { color: colors.text }]}>
              {orderDetails.deliveryAddress.addressLine1}
            </Text>
            {orderDetails.deliveryAddress.landmark && (
              <Text style={[styles.landmarkText, { color: colors.gray }]}>
                Near {orderDetails.deliveryAddress.landmark}
              </Text>
            )}
          </View>
        </View>

        {/* Order Tracking */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Tracking</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalTracking}>
            {[
              { key: 'ordered', label: 'Placed', icon: 'shopping-cart', time: orderDetails.timeline.ordered },
              { key: 'confirmed', label: 'Confirmed', icon: 'check-circle', time: orderDetails.timeline.confirmed },
              { key: 'packed', label: 'Packed', icon: 'inventory', time: orderDetails.timeline.packed },
              { key: 'dispatched', label: 'Dispatched', icon: 'local-shipping', time: orderDetails.timeline.dispatched },
              { key: 'delivered', label: 'Delivered', icon: 'done-all', time: orderDetails.timeline.delivered },
            ].map((step, index) => (
              <View key={step.key} style={styles.trackingStepHorizontal}>
                <View style={[
                  styles.trackingIconContainer,
                  { backgroundColor: step.time ? colors.primary : colors.border }
                ]}>
                  <Icon name={step.icon} size={16} color={step.time ? '#fff' : colors.gray} />
                </View>
                <Text style={[styles.trackingLabelHorizontal, { color: step.time ? colors.text : colors.gray }]}>
                  {step.label}
                </Text>
                {step.time && (
                  <Text style={[styles.trackingTimeHorizontal, { color: colors.gray }]}>
                    {new Date(step.time).toLocaleDateString()}
                  </Text>
                )}
                {index < 4 && (
                  <View style={[
                    styles.horizontalLine,
                    { backgroundColor: step.time ? colors.primary : colors.border }
                  ]} />
                )}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Order Items */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Items ({orderDetails.items.length})
          </Text>
          {orderDetails.items.map(renderOrderItem)}
        </View>

        {/* Bill Details */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Bill Details</Text>
          
          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { color: colors.gray }]}>Item Total</Text>
            <Text style={[styles.billValue, { color: colors.text }]}>₹{orderDetails.subtotal}</Text>
          </View>
          
          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { color: colors.gray }]}>Delivery Fee</Text>
            <Text style={[styles.billValue, { color: colors.text }]}>
              {orderDetails.deliveryCharge === 0 ? 'FREE' : `₹${orderDetails.deliveryCharge}`}
            </Text>
          </View>
          
          {orderDetails.pricing.hasFreeProducts && (
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: colors.primary }]}>Free Items</Text>
              <Text style={[styles.billValue, { color: colors.primary }]}>₹{orderDetails.pricing.freeItemsTotal}</Text>
            </View>
          )}
          
          <View style={[styles.billRow, styles.totalRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total Amount</Text>
            <Text style={[styles.totalValue, { color: colors.text }]}>₹{orderDetails.totalAmount}</Text>
          </View>
        </View>

        {/* Payment Info */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Information</Text>
          <View style={styles.paymentRow}>
            <Text style={[styles.paymentLabel, { color: colors.gray }]}>Payment Method</Text>
            <Text style={[styles.paymentValue, { color: colors.text }]}>
              {orderDetails.payment.frontendMethod === 'ONLINE_PAYMENT' ? 'Online Payment' : 'Cash on Delivery'}
            </Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={[styles.paymentLabel, { color: colors.gray }]}>Payment Status</Text>
            <Text style={[styles.paymentValue, { color: colors.text }]}>
              {orderDetails.paymentStatus}
            </Text>
          </View>
        </View>

        {/* Reorder Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.reorderButton, 
              { backgroundColor: orderDetails.status === 'DELIVERED' ? colors.primary : colors.gray }
            ]}
            disabled={orderDetails.status !== 'DELIVERED'}
            onPress={() => {
              if (orderDetails.status === 'DELIVERED') {
                console.log('Reorder items:', orderDetails.items);
              }
            }}
          >
            <Icon name="refresh" size={20} color="#fff" />
            <Text style={styles.reorderButtonText}>Reorder</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  orderInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderDetails: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  addressSection: {
    marginTop: 8,
  },
  addressLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    marginBottom: 4,
  },
  landmarkText: {
    fontSize: 12,
  },
  orderItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  brandName: {
    fontSize: 12,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 12,
  },
  price: {
    fontSize: 14,
    fontWeight: '500',
  },
  freeTag: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: 'bold',
  },
  itemTotalContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    minWidth: 80,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
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
  totalRow: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  horizontalTracking: {
    paddingVertical: 8,
  },
  trackingStepHorizontal: {
    alignItems: 'center',
    marginRight: 24,
    position: 'relative',
  },
  trackingIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  trackingLabelHorizontal: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  trackingTimeHorizontal: {
    fontSize: 10,
    textAlign: 'center',
  },
  horizontalLine: {
    position: 'absolute',
    top: 16,
    right: -24,
    width: 24,
    height: 2,
  },
  bottomContainer: {
    padding: 16,
    borderTopWidth: 1,
  },
  reorderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  reorderButtonText: {
    color: '#fff',
    fontSize: 16,
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

const OrderDetailsSkeleton = ({ colors }: any) => (
  <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
    {/* Order Info Skeleton */}
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <View style={styles.orderInfoRow}>
        <View style={styles.orderDetails}>
          <SkeletonBox width={120} height={20} style={{ marginBottom: 8 }} colors={colors} />
          <SkeletonBox width={80} height={16} colors={colors} />
        </View>
        <SkeletonBox width={80} height={28} style={{ borderRadius: 16 }} colors={colors} />
      </View>
      
      <View style={styles.addressSection}>
        <SkeletonBox width={100} height={14} style={{ marginBottom: 8 }} colors={colors} />
        <SkeletonBox width={200} height={16} style={{ marginBottom: 4 }} colors={colors} />
        <SkeletonBox width={150} height={14} colors={colors} />
      </View>
    </View>

    {/* Order Tracking Skeleton */}
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <SkeletonBox width={120} height={18} style={{ marginBottom: 16 }} colors={colors} />
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalTracking}>
        {[1, 2, 3, 4, 5].map((item) => (
          <View key={item} style={styles.trackingStepHorizontal}>
            <SkeletonBox width={32} height={32} style={{ borderRadius: 16, marginBottom: 8 }} colors={colors} />
            <SkeletonBox width={60} height={14} style={{ marginBottom: 4 }} colors={colors} />
            <SkeletonBox width={50} height={12} colors={colors} />
          </View>
        ))}
      </ScrollView>
    </View>

    {/* Order Items Skeleton */}
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <SkeletonBox width={80} height={18} style={{ marginBottom: 16 }} colors={colors} />
      {[1, 2, 3].map((item) => (
        <View key={item} style={[styles.orderItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SkeletonBox width={60} height={60} style={{ borderRadius: 8, marginRight: 12 }} colors={colors} />
          
          <View style={styles.productInfo}>
            <SkeletonBox width={150} height={16} style={{ marginBottom: 6 }} colors={colors} />
            <SkeletonBox width={100} height={14} style={{ marginBottom: 6 }} colors={colors} />
            <SkeletonBox width={60} height={14} style={{ marginBottom: 6 }} colors={colors} />
            <SkeletonBox width={80} height={16} colors={colors} />
          </View>
          
          <View style={styles.itemTotalContainer}>
            <SkeletonBox width={60} height={18} colors={colors} />
          </View>
        </View>
      ))}
    </View>

    {/* Bill Details Skeleton */}
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <SkeletonBox width={100} height={18} style={{ marginBottom: 16 }} colors={colors} />
      
      {[1, 2, 3, 4].map((item) => (
        <View key={item} style={styles.billRow}>
          <SkeletonBox width={80} height={16} colors={colors} />
          <SkeletonBox width={60} height={16} colors={colors} />
        </View>
      ))}
    </View>

    {/* Payment Info Skeleton */}
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <SkeletonBox width={140} height={18} style={{ marginBottom: 16 }} colors={colors} />
      
      {[1, 2].map((item) => (
        <View key={item} style={styles.paymentRow}>
          <SkeletonBox width={100} height={16} colors={colors} />
          <SkeletonBox width={80} height={16} colors={colors} />
        </View>
      ))}
    </View>

    {/* Reorder Button Skeleton */}
    <View style={styles.section}>
      <SkeletonBox width="100%" height={50} style={{ borderRadius: 8 }} colors={colors} />
    </View>
  </ScrollView>
);