import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useTheme } from '../hooks/useTheme';
import { RootState, AppDispatch } from '../store/store';
import { setThemeMode, ThemeMode } from '../store/slices/uiSlice';

const { width: screenWidth } = Dimensions.get('window');

const themeOptions = [
  { value: 'light' as ThemeMode, label: 'Light', icon: 'wb-sunny' },
  { value: 'dark' as ThemeMode, label: 'Dark', icon: 'brightness-2' },
  { value: 'system' as ThemeMode, label: 'Auto', icon: 'phone-android' },
];

export function ThemeDropdown() {
  const dispatch = useDispatch<AppDispatch>();
  const { colors } = useTheme();
  const { themeMode } = useSelector((state: RootState) => state.ui);
  const [showModal, setShowModal] = useState(false);
  const [buttonLayout, setButtonLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const buttonRef = useRef<TouchableOpacity>(null);

  const currentTheme = themeOptions.find(option => option.value === themeMode);

  const handleThemeChange = (theme: ThemeMode) => {
    console.log('ThemeDropdown: Changing theme to:', theme);
    console.log('ThemeDropdown: Current themeMode before change:', themeMode);
    dispatch(setThemeMode(theme));
    setShowModal(false);
    console.log('ThemeDropdown: Theme change dispatched');
  };

  const handleDropdownPress = () => {
    buttonRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setButtonLayout({ x: pageX, y: pageY, width, height });
      setShowModal(true);
    });
  };

  return (
    <>
      <TouchableOpacity
        ref={buttonRef}
        style={[styles.dropdown, { borderColor: colors.border, backgroundColor: colors.surface }]}
        onPress={handleDropdownPress}
      >
        <Icon name={currentTheme?.icon || 'settings'} size={16} color={colors.text} />
        <Text style={[styles.dropdownText, { color: colors.text }]}>
          {currentTheme?.label || 'System'}
        </Text>
        <Icon name="keyboard-arrow-down" size={16} color={colors.gray} />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <View style={[
            styles.modalContent, 
            { 
              backgroundColor: colors.card,
              position: 'absolute',
              top: buttonLayout.y + buttonLayout.height - 2,
              left: buttonLayout.x,
            }
          ]}>
            {themeOptions.map((option, index) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.option,
                  { borderBottomColor: colors.border },
                  index === themeOptions.length - 1 && { borderBottomWidth: 0 },
                  themeMode === option.value && { backgroundColor: colors.lightGray }
                ]}
                onPress={() => handleThemeChange(option.value)}
              >
                <Icon name={option.icon} size={20} color={colors.text} />
                <Text style={[styles.optionText, { color: colors.text }]}>
                  {option.label}
                </Text>
                {themeMode === option.value && (
                  <Icon name="check" size={16} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    minWidth: 140,
    gap: 8,
  },
  dropdownText: {
    fontSize: 14,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    width: 160,
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
    gap: 12,
    minHeight: 56,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
});