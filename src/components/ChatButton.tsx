import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; // ✅ Replaces @expo/vector-icons
import ChatWidget from './ChatWidget'; // ✅ Ensure correct relative path
import { useTheme } from '../hooks/useTheme'; // ✅ Use theme hook instead of static Colors

export default function ChatButton() {
  const [showChat, setShowChat] = useState(false);
  const { colors } = useTheme();

  return (
    <>
      <TouchableOpacity 
        style={[styles.chatButton, { backgroundColor: colors.primary }]}
        onPress={() => setShowChat(true)}
        activeOpacity={0.8}
      >
        <Icon name="chatbubble" size={24} color="#fff" />
      </TouchableOpacity>

      <ChatWidget 
        visible={showChat}
        onClose={() => setShowChat(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  chatButton: {
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
