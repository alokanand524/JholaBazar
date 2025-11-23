import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useTheme } from '../hooks/useTheme';
import { setSelectedAddress } from '../store/slices/addressSlice';
import { Toast } from '../components/Toast';

export default function AddressDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch();
  const { colors } = useTheme();
  
  const { latitude, longitude, address, deliveryMessage } = route.params;
  
  const user = useSelector((state: any) => state.user);
  
  const [orderForFriend, setOrderForFriend] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    type: 'home',
    isDefault: false,
  });
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    // Load user data by default
    if (!orderForFriend) {
      setFormData(prev => ({
        ...prev,
        name: user?.name || user?.fullName || user?.firstName || '',
        mobile: user?.mobile || user?.phone || user?.phoneNumber || ''
      }));
    }
  }, [user, orderForFriend]);

  const handleOrderForFriendToggle = (value: boolean) => {
    setOrderForFriend(value);
    if (value) {
      // Clear fields when ordering for friend
      setFormData(prev => ({
        ...prev,
        name: '',
        mobile: ''
      }));
    } else {
      // Load user data when unchecked
      setFormData(prev => ({
        ...prev,
        name: user?.name || user?.fullName || user?.firstName || '',
        mobile: user?.mobile || user?.phone || user?.phoneNumber || ''
      }));
    }
  };

  const addressTypes = [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'office', label: 'Office', icon: 'business' },
    { key: 'other', label: 'Other', icon: 'location-on' },
  ];

  const showToast = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.mobile.trim()) {
      showToast('Please fill name and mobile number', 'error');
      return;
    }

    if (formData.mobile.length !== 10) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }

    try {
      const payload = {
        type: formData.type,
        address: address,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        contactPersonName: formData.name,
        contactMobile: formData.mobile,
        // isDefault: formData.isDefault.toString()
      };

      const response = await fetch('https://api.jholabazar.com/api/v1/service-area/save-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        // Create address object for local state
        const addressData = {
          id: data.data?.id || Date.now().toString(),
          latitude,
          longitude,
          fullAddress: address,
          name: formData.name,
          mobile: formData.mobile,
          type: formData.type,
          isDefault: formData.isDefault,
          deliveryMessage,
        };

        // Set as selected address
        dispatch(setSelectedAddress(addressData));

        showToast('Address saved successfully!', 'success');
        
        // Navigate after short delay to show toast
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs', params: { screen: 'Home' } }],
          });
        }, 1500);
      } else {
        showToast(data.message || 'Failed to save address', 'error');
      }
    } catch (error) {
      console.error('Save address error:', error);
      showToast('Failed to save address. Please try again.', 'error');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Add Address Details
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Selected Address Display */}
        <View style={[styles.addressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.addressHeader}>
            <Icon name="location-on" size={20} color={colors.primary} />
            <Text style={[styles.addressTitle, { color: colors.text }]}>Selected Address</Text>
          </View>
          <Text style={[styles.addressText, { color: colors.gray }]} numberOfLines={2}>
            {address}
          </Text>
          {deliveryMessage && (
            <View style={[styles.deliveryBadge, { backgroundColor: colors.primary + '20' }]}>
              <Icon name="local-shipping" size={16} color={colors.primary} />
              <Text style={[styles.deliveryText, { color: colors.primary }]}>
                {deliveryMessage}
              </Text>
            </View>
          )}
        </View>

        {/* User Details Form */}
        <View style={styles.formContainer}>
          {/* Order for Friend Checkbox */}
          <View style={[styles.checkboxContainer, { borderColor: colors.border }]}>
            <TouchableOpacity 
              style={styles.checkboxContent}
              onPress={() => handleOrderForFriendToggle(!orderForFriend)}
            >
              <View style={[styles.checkbox, { borderColor: colors.border, backgroundColor: orderForFriend ? colors.primary : 'transparent' }]}>
                {orderForFriend && <Icon name="check" size={16} color="#fff" />}
              </View>
              <Text style={[styles.checkboxText, { color: colors.text }]}>
                Order for Friend
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Full Name *
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="Enter your full name"
              placeholderTextColor={colors.gray}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Mobile Number *
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="Enter 10-digit mobile number"
              placeholderTextColor={colors.gray}
              value={formData.mobile}
              onChangeText={(text) => setFormData({ ...formData, mobile: text.replace(/[^0-9]/g, '') })}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          {/* Address Type Selection */}
          <View style={styles.typeContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Address Type
            </Text>
            <View style={styles.typeRow}>
              {addressTypes.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.typeButton,
                    { 
                      backgroundColor: formData.type === type.key ? colors.primary : colors.card,
                      borderColor: colors.border 
                    }
                  ]}
                  onPress={() => setFormData({ ...formData, type: type.key })}
                >
                  <Icon 
                    name={type.icon} 
                    size={20} 
                    color={formData.type === type.key ? '#fff' : colors.gray} 
                  />
                  <Text style={[
                    styles.typeText,
                    { color: formData.type === type.key ? '#fff' : colors.text }
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Make Default Switch */}
          <View style={[styles.defaultContainer, { borderColor: colors.border }]}>
            <View style={styles.defaultContent}>
              <Icon name="star" size={20} color={colors.primary} />
              <View style={styles.defaultTextContainer}>
                <Text style={[styles.defaultTitle, { color: colors.text }]}>
                  Make as Default Address
                </Text>
                <Text style={[styles.defaultSubtitle, { color: colors.gray }]}>
                  Use this address for future orders
                </Text>
              </View>
            </View>
            <Switch
              value={formData.isDefault}
              onValueChange={(value) => setFormData({ ...formData, isDefault: value })}
              trackColor={{ false: colors.border, true: colors.primary + '40' }}
              thumbColor={formData.isDefault ? colors.primary : colors.gray}
            />
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: colors.primary }]}
        onPress={handleSave}
      >
        <Icon name="save" size={20} color="#fff" />
        <Text style={styles.saveButtonText}>Save Your Location</Text>
      </TouchableOpacity>

      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
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
    padding: 16,
  },
  addressCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addressText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  deliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 4,
  },
  deliveryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  formContainer: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  typeContainer: {
    marginTop: 4,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  defaultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  defaultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  defaultTextContainer: {
    flex: 1,
  },
  defaultTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  defaultSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxContainer: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  checkboxContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxText: {
    fontSize: 14,
    fontWeight: '500',
  },
});