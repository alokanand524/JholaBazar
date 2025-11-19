import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useTheme } from '../hooks/useTheme';
import LocationSearchInput from '../components/LocationSearchInput';
import { PlaceResult } from '../services/placesService';

export default function AddAddressScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  
  const [formData, setFormData] = useState({
    type: 'home',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    pincode: '',
    area: '',
    city: '',
    searchAddress: '',
  });

  const handleLocationSelect = (location: PlaceResult) => {
    setFormData({
      ...formData,
      searchAddress: location.shortAddress,
      addressLine1: location.name || location.shortAddress,
      area: location.secondaryText.split(',')[0] || '',
      city: location.secondaryText.split(',')[1]?.trim() || '',
    });
  };

  const handleSave = () => {
    if (!formData.addressLine1 || !formData.pincode) {
      Alert.alert('Error', 'Please fill required fields');
      return;
    }
    
    Alert.alert('Success', 'Address saved successfully', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  const addressTypes = [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'office', label: 'Office', icon: 'business' },
    { key: 'other', label: 'Other', icon: 'location-on' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Add Address
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Search Address
            </Text>
            <LocationSearchInput
              placeholder="Search for your address..."
              onLocationSelect={handleLocationSelect}
              initialValue={formData.searchAddress}
              showNearbyPlaces={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Address Line 1 *
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="House/Flat/Office No, Building Name"
              placeholderTextColor={colors.gray}
              value={formData.addressLine1}
              onChangeText={(text) => setFormData({ ...formData, addressLine1: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Address Line 2
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="Street Name, Area"
              placeholderTextColor={colors.gray}
              value={formData.addressLine2}
              onChangeText={(text) => setFormData({ ...formData, addressLine2: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Landmark
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="Nearby landmark (optional)"
              placeholderTextColor={colors.gray}
              value={formData.landmark}
              onChangeText={(text) => setFormData({ ...formData, landmark: text })}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={[styles.label, { color: colors.text }]}>
                Pincode *
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                placeholder="000000"
                placeholderTextColor={colors.gray}
                value={formData.pincode}
                onChangeText={(text) => setFormData({ ...formData, pincode: text })}
                keyboardType="numeric"
                maxLength={6}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={[styles.label, { color: colors.text }]}>
                Area
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                placeholder="Area"
                placeholderTextColor={colors.gray}
                value={formData.area}
                onChangeText={(text) => setFormData({ ...formData, area: text })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              City
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="City"
              placeholderTextColor={colors.gray}
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
            />
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: colors.primary }]}
        onPress={handleSave}
      >
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  typeContainer: {
    marginBottom: 24,
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
  formContainer: {
    gap: 16,
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
  row: {
    flexDirection: 'row',
  },
  saveButton: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});