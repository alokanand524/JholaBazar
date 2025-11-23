import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useTheme } from '../hooks/useTheme';
import { RootState } from '../store/store';
import { tokenManager } from '../utils/tokenManager';
import { setSelectedAddress } from '../store/slices/addressSlice';
import { Toast } from '../components/Toast';

export default function AddressesScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const { colors } = useTheme();
  const { isLoggedIn } = useSelector((state: RootState) => state.user);
  const { selectedAddress } = useSelector((state: RootState) => state.address);

  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    if (!isLoggedIn) {
      setAddresses([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await tokenManager.makeAuthenticatedRequest('https://api.jholabazar.com/api/v1/service-area/addresses');
      const data = await response.json();
      
      if (data.success) {
        setAddresses(data.data || []);
      } else {
        setAddresses([]);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = (addressId: string) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await tokenManager.makeAuthenticatedRequest(`https://api.jholabazar.com/api/v1/service-area/addresses/${addressId}`, {
                method: 'DELETE'
              });
              
              if (response.ok) {
                fetchAddresses(); // Refresh list
                setToast({ visible: true, message: 'Address deleted successfully', type: 'success' });
              } else {
                setToast({ visible: true, message: 'Failed to delete address', type: 'error' });
              }
            } catch (error) {
              console.error('Error deleting address:', error);
              setToast({ visible: true, message: 'Failed to delete address', type: 'error' });
            }
          },
        },
      ]
    );
  };

  const handleSelectAddress = (address: any) => {
    dispatch(setSelectedAddress(address));
    navigation.navigate('Home');
  };

  const handleMarkAsDefault = async (addressId: string) => {
    try {
      const response = await tokenManager.makeAuthenticatedRequest(`https://api.jholabazar.com/api/v1/service-area/addresses/${addressId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isDefault: true
        })
      });
      
      if (response.ok) {
        fetchAddresses(); // Refresh the list
        setToast({ visible: true, message: 'Address marked as default', type: 'success' });
      } else {
        setToast({ visible: true, message: 'Failed to mark address as default', type: 'error' });
      }
    } catch (error) {
      console.error('Error marking address as default:', error);
      setToast({ visible: true, message: 'Failed to mark address as default', type: 'error' });
    }
  };

  const renderAddress = ({ item }: { item: any }) => {
    const isSelected = selectedAddress?.id === item.id;
    
    return (
      <TouchableOpacity 
        style={[
          styles.addressCard, 
          { 
            backgroundColor: colors.card, 
            borderColor: isSelected ? colors.primary : colors.border,
            borderWidth: isSelected ? 2 : 1
          }
        ]}
        onPress={() => handleSelectAddress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.addressHeader}>
          <View style={styles.addressTypeContainer}>
            <Icon 
              name={item.type === 'home' ? 'home' : item.type === 'office' ? 'business' : 'location-on'} 
              size={20} 
              color={colors.primary} 
            />
            <Text style={[styles.addressType, { color: colors.primary }]}>
              {item.type?.toUpperCase() || 'OTHER'}
            </Text>

          </View>
          <View style={styles.addressActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                handleDeleteAddress(item.id);
              }}
            >
              <Icon name="delete" size={18} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={[styles.addressText, { color: colors.text }]}>
          {item.fullAddress}
        </Text>
        {item.landmark && (
          <Text style={[styles.landmarkText, { color: colors.gray }]}>
            Near {item.landmark}
          </Text>
        )}
        {item.pincode && (
          <Text style={[styles.pincodeText, { color: colors.gray }]}>
            {item.pincode.city}, {item.pincode.state} - {item.pincode.code}
          </Text>
        )}
        
        <View style={styles.bottomActions}>
          {item.isDefault ? (
            <View style={[styles.defaultBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.defaultText}>Default Address</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.setDefaultButton, { borderColor: colors.primary }]}
              onPress={(e) => {
                e.stopPropagation();
                handleMarkAsDefault(item.id);
              }}
            >
              <Text style={[styles.setDefaultText, { color: colors.primary }]}>Set as Default</Text>
            </TouchableOpacity>
          )}
          
          {isSelected && (
            <Text style={[styles.selectedText, { color: colors.primary }]}>
              Currently Selected
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };



  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          My Addresses
        </Text>
        <View />
      </View>

      <TouchableOpacity
        style={[styles.mapButton, { backgroundColor: colors.primary }]}
        onPress={() => {
          try {
            navigation.navigate('MapLocation');
          } catch (error) {
            console.error('Map navigation error:', error);
            Alert.alert('Error', 'Map feature is currently unavailable');
          }
        }}
      >
        <Icon name="map" size={20} color="#fff" />
        <Text style={styles.mapButtonText}>Select location on Map</Text>
      </TouchableOpacity>



      {loading ? (
        <AddressesListSkeleton colors={colors} />
      ) : addresses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="location-off" size={80} color={colors.gray} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No addresses found
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.gray }]}>
            Add your first delivery address
          </Text>

        </View>
      ) : (
        <FlatList
          data={addresses}
          renderItem={renderAddress}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  addButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  addressCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addressTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressType: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  addressActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  addressText: {
    fontSize: 16,
    marginBottom: 4,
    lineHeight: 22,
  },
  landmarkText: {
    fontSize: 14,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  pincodeText: {
    fontSize: 14,
    marginTop: 4,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  mapButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  currentLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  currentLocationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  defaultText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
  },

  selectedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  setDefaultButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  setDefaultText: {
    fontSize: 12,
    fontWeight: '600',
  },
  currentLocationContent: {
    flex: 1,
    marginLeft: 8,
  },
  currentLocationLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  currentLocationSubtext: {
    fontSize: 12,
    marginTop: 2,
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

const AddressCardSkeleton = ({ colors }: any) => (
  <View style={[styles.addressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={styles.addressHeader}>
      <View style={styles.addressTypeContainer}>
        <SkeletonBox width={20} height={20} colors={colors} />
        <SkeletonBox width={60} height={16} colors={colors} />
      </View>
      <View style={styles.addressActions}>
        <SkeletonBox width={18} height={18} colors={colors} />
      </View>
    </View>
    
    <SkeletonBox width="90%" height={18} style={{ marginBottom: 8 }} colors={colors} />
    <SkeletonBox width="70%" height={14} style={{ marginBottom: 8 }} colors={colors} />
    <SkeletonBox width="80%" height={14} style={{ marginBottom: 12 }} colors={colors} />
    
    <View style={styles.bottomActions}>
      <SkeletonBox width={100} height={28} style={{ borderRadius: 16 }} colors={colors} />
      <SkeletonBox width={120} height={14} colors={colors} />
    </View>
  </View>
);

const AddressesListSkeleton = ({ colors }: any) => (
  <View>
    {/* Map Button Skeleton */}
    <View style={[styles.mapButton, { backgroundColor: colors.border }]}>
      <SkeletonBox width={20} height={20} colors={colors} />
      <SkeletonBox width={150} height={16} colors={colors} />
    </View>
    
    {/* Address Cards Skeleton */}
    <View style={styles.listContainer}>
      {[1, 2, 3].map((item) => (
        <AddressCardSkeleton key={item} colors={colors} />
      ))}
    </View>
  </View>
);