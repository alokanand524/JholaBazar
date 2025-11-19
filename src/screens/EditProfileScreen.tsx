import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useTheme } from '../hooks/useTheme';
import { AppDispatch } from '../store/store';
import { setUser } from '../store/slices/userSlice';
import { tokenManager } from '../utils/tokenManager';

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
  });
  const [dateComponents, setDateComponents] = useState({
    year: '',
    month: '',
    day: '',
  });
  const [loading, setLoading] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  
  const years = Array.from({ length: 80 }, (_, i) => (new Date().getFullYear() - i).toString());
  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));

  const updateDateOfBirth = (component: string, value: string) => {
    const newComponents = { ...dateComponents, [component]: value };
    setDateComponents(newComponents);
    
    if (newComponents.year && newComponents.month && newComponents.day) {
      const dateString = `${newComponents.year}-${newComponents.month}-${newComponents.day}`;
      setFormData({ ...formData, dateOfBirth: dateString });
    }
  };

  useEffect(() => {
    if (route.params?.userProfile) {
      const profile = route.params.userProfile;
      const dobParts = profile.dateOfBirth ? profile.dateOfBirth.split('T')[0].split('-') : ['', '', ''];
      
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        gender: profile.gender || '',
        dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
      });
      
      setDateComponents({
        year: dobParts[0] || '',
        month: dobParts[1] || '',
        day: dobParts[2] || '',
      });
    }
  }, [route.params]);

  const handleSave = async () => {
    if (!formData.firstName || !formData.phone) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await tokenManager.makeAuthenticatedRequest('https://api.jholabazar.com/api/v1/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth,
        }),
      });

      const data = await response.json();

      if (data.success) {
        dispatch(setUser({
          id: data.data.id,
          name: data.data.fullName,
          phone: data.data.phone,
          email: data.data.email,
          gender: data.data.gender,
          dateOfBirth: data.data.dateOfBirth,
          walletBalance: data.data.walletBalance,
          isVerified: data.data.isVerified,
        }));

        Alert.alert('Success', 'Profile updated successfully', [
          { text: 'OK', onPress: () => {
            navigation.navigate('Profile', { refresh: true });
          }}
        ]);
      } else {
        Alert.alert('Error', data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Edit Profile
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Text style={[styles.saveButton, { color: loading ? colors.gray : colors.primary }]}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              First Name *
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="Enter first name"
              placeholderTextColor={colors.gray}
              value={formData.firstName}
              onChangeText={(text) => setFormData({ ...formData, firstName: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Last Name
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="Enter last name"
              placeholderTextColor={colors.gray}
              value={formData.lastName}
              onChangeText={(text) => setFormData({ ...formData, lastName: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Email
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="Enter email address"
              placeholderTextColor={colors.gray}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Phone Number *
            </Text>
            <View style={[styles.phoneContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.countryCode, { color: colors.text }]}>+91</Text>
              <TextInput
                style={[styles.phoneInput, { color: colors.text }]}
                placeholder="Enter phone number"
                placeholderTextColor={colors.gray}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="numeric"
                maxLength={10}
                editable={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Gender
            </Text>
            <View style={styles.genderContainer}>
              {['Male', 'Female', 'Other'].map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.genderButton,
                    {
                      backgroundColor: formData.gender === gender ? colors.primary : colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setFormData({ ...formData, gender })}
                >
                  <Text
                    style={[
                      styles.genderText,
                      { color: formData.gender === gender ? '#fff' : colors.text },
                    ]}
                  >
                    {gender}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Date of Birth
            </Text>
            <View style={styles.dateContainer}>
              <View style={styles.dateDropdown}>
                <Text style={[styles.dropdownLabel, { color: colors.gray }]}>Day</Text>
                <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => {
                      setShowDayPicker(!showDayPicker);
                      setShowMonthPicker(false);
                      setShowYearPicker(false);
                    }}
                  >
                    <Text style={[styles.dropdownText, { color: colors.text }]}>
                      {dateComponents.day || 'DD'}
                    </Text>
                    <Icon name="keyboard-arrow-down" size={20} color={colors.gray} />
                  </TouchableOpacity>
                </View>
                {showDayPicker && (
                  <View style={[styles.dropdownList, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <ScrollView 
                      style={styles.scrollableList} 
                      showsVerticalScrollIndicator={true}
                      nestedScrollEnabled={true}
                      bounces={false}
                    >
                      {days.map((item) => (
                        <TouchableOpacity
                          key={item}
                          style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                          onPress={() => {
                            updateDateOfBirth('day', item);
                            setShowDayPicker(false);
                          }}
                        >
                          <Text style={[styles.dropdownItemText, { color: colors.text }]}>{item}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
              
              <View style={styles.dateDropdown}>
                <Text style={[styles.dropdownLabel, { color: colors.gray }]}>Month</Text>
                <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => {
                      setShowMonthPicker(!showMonthPicker);
                      setShowDayPicker(false);
                      setShowYearPicker(false);
                    }}
                  >
                    <Text style={[styles.dropdownText, { color: colors.text }]}>
                      {months.find(m => m.value === dateComponents.month)?.label || 'Month'}
                    </Text>
                    <Icon name="keyboard-arrow-down" size={20} color={colors.gray} />
                  </TouchableOpacity>
                </View>
                {showMonthPicker && (
                  <View style={[styles.dropdownList, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <ScrollView 
                      style={styles.scrollableList} 
                      showsVerticalScrollIndicator={true}
                      nestedScrollEnabled={true}
                      bounces={false}
                    >
                      {months.map((item) => (
                        <TouchableOpacity
                          key={item.value}
                          style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                          onPress={() => {
                            updateDateOfBirth('month', item.value);
                            setShowMonthPicker(false);
                          }}
                        >
                          <Text style={[styles.dropdownItemText, { color: colors.text }]}>{item.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
              
              <View style={styles.dateDropdown}>
                <Text style={[styles.dropdownLabel, { color: colors.gray }]}>Year</Text>
                <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => {
                      setShowYearPicker(!showYearPicker);
                      setShowDayPicker(false);
                      setShowMonthPicker(false);
                    }}
                  >
                    <Text style={[styles.dropdownText, { color: colors.text }]}>
                      {dateComponents.year || 'YYYY'}
                    </Text>
                    <Icon name="keyboard-arrow-down" size={20} color={colors.gray} />
                  </TouchableOpacity>
                </View>
                {showYearPicker && (
                  <View style={[styles.dropdownList, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <ScrollView 
                      style={styles.scrollableList} 
                      showsVerticalScrollIndicator={true}
                      nestedScrollEnabled={true}
                      bounces={false}
                    >
                      {years.map((item) => (
                        <TouchableOpacity
                          key={item}
                          style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                          onPress={() => {
                            updateDateOfBirth('year', item);
                            setShowYearPicker(false);
                          }}
                        >
                          <Text style={[styles.dropdownItemText, { color: colors.text }]}>{item}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
          </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingLeft: 12,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dateContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dateDropdown: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
  dropdownLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  dropdown: {
    borderRadius: 8,
    borderWidth: 1,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  dropdownText: {
    fontSize: 14,
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    height: 200,
    borderRadius: 8,
    borderWidth: 1,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  scrollableList: {
    flex: 1,
  },
  dropdownItem: {
    paddingVertical: 15,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
  },
  dropdownItemText: {
    fontSize: 14,
    textAlign: 'center',
  },
});