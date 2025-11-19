import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/hooks/useTheme';

interface PaymentStatusModalProps {
  visible: boolean;
  status: 'processing' | 'success' | 'failed';
  message: string;
  onRetry?: () => void;
  onClose: () => void;
}

export default function PaymentStatusModal({ visible, status, message, onRetry, onClose }: PaymentStatusModalProps) {
  const { colors } = useTheme();

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <Ionicons name="checkmark-circle" size={60} color="#00B761" />;
      case 'failed':
        return <Ionicons name="close-circle" size={60} color="#FF3B30" />;
      default:
        return <Ionicons name="time" size={60} color={colors.primary} />;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: colors.background }]}>
          {getStatusIcon()}
          <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
          
          {status === 'failed' && onRetry && (
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={onRetry}>
              <Text style={styles.buttonText}>Retry</Text>
            </TouchableOpacity>
          )}
          
          {status !== 'processing' && (
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.gray }]} onPress={onClose}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '80%',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  button: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});