import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useTheme } from '../hooks/useTheme';
import { RootState } from '../store/store';
import { tokenManager } from '../utils/tokenManager';

export default function OrdersScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { isLoggedIn } = useSelector((state: RootState) => state.user);
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      fetchOrders();
    }
  }, [isLoggedIn]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await tokenManager.makeAuthenticatedRequest('https://api.jholabazar.com/api/v1/orders/');
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.data?.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PAYMENT_PENDING': return 'Payment Pending';
      case 'CONFIRMED': return 'Confirmed';
      case 'PACKED': return 'Packed';
      case 'DISPATCHED': return 'Out for Delivery';
      case 'DELIVERED': return 'Delivered';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  };

  const renderOrder = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.orderCard, { backgroundColor: colors.card }]}
      onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={[styles.orderNumber, { color: colors.text }]}>
            #{item.orderNumber}
          </Text>
          <Text style={[styles.orderDate, { color: colors.gray }]}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.orderItems}>
        {item.productImages?.slice(0, 4).map((image: string, index: number) => (
          <View key={index} style={[styles.imageContainer, { backgroundColor: '#F5F5F5' }]}>
            <Image 
              source={{ uri: image }} 
              style={styles.productImage} 
            />
          </View>
        ))}
        {item.productImages?.length > 4 && (
          <View style={[styles.moreImagesContainer, { backgroundColor: '#F5F5F5' }]}>
            <Text style={[styles.moreImagesText, { color: colors.text }]}>+{item.productImages.length - 4}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.orderFooter}>
        <Text style={[styles.firstProductName, { color: colors.text }]} numberOfLines={1}>
          {item.firstProductName}
        </Text>
        <Icon name="chevron-right" size={20} color={colors.gray} />
      </View>
    </TouchableOpacity>
  );

  if (!isLoggedIn) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>My Orders</Text>
        </View>
        
        <View style={styles.emptyContainer}>
          <Icon name="login" size={80} color={colors.gray} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Please login to view orders
          </Text>
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>Login</Text>
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Orders</Text>
      </View>

      {loading ? (
        <OrdersListSkeleton colors={colors} />
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="shopping-bag" size={80} color={colors.gray} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No orders yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.gray }]}>
            Start shopping to place your first order
          </Text>
          <TouchableOpacity
            style={[styles.shopButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('MainTabs')}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={fetchOrders}
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
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
  loginButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  listContainer: {
    paddingVertical: 8,
  },
  orderCard: {
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 13,
    opacity: 0.7,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  orderItems: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 10,
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    padding: 4,
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  moreImagesContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  firstProductName: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    flex: 1,
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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

const OrderCardSkeleton = ({ colors }: any) => (
  <View style={[styles.orderCard, { backgroundColor: colors.card }]}>
    {/* Order Header */}
    <View style={styles.orderHeader}>
      <View>
        <SkeletonBox width={100} height={20} style={{ marginBottom: 8 }} colors={colors} />
        <SkeletonBox width={80} height={14} colors={colors} />
      </View>
      <SkeletonBox width={80} height={28} style={{ borderRadius: 16 }} colors={colors} />
    </View>

    {/* Product Images */}
    <View style={styles.orderItems}>
      {[1, 2, 3, 4].map((item) => (
        <SkeletonBox key={item} width={60} height={60} style={{ borderRadius: 12 }} colors={colors} />
      ))}
    </View>
    
    {/* Order Footer */}
    <View style={styles.orderFooter}>
      <SkeletonBox width={150} height={18} colors={colors} />
      <SkeletonBox width={20} height={20} colors={colors} />
    </View>
  </View>
);

const OrdersListSkeleton = ({ colors }: any) => (
  <View style={styles.listContainer}>
    {[1, 2, 3, 4, 5].map((item) => (
      <OrderCardSkeleton key={item} colors={colors} />
    ))}
  </View>
);