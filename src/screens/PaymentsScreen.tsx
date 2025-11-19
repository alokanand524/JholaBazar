import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useTheme } from '../hooks/useTheme';

const paymentMethods = [
  {
    id: '1',
    title: 'Credit/Debit Cards',
    subtitle: 'Visa, Mastercard, RuPay',
    icon: 'credit-card',
    enabled: true,
  },
  {
    id: '2',
    title: 'UPI',
    subtitle: 'Google Pay, PhonePe, Paytm',
    icon: 'account-balance-wallet',
    enabled: true,
  },
  {
    id: '3',
    title: 'Net Banking',
    subtitle: 'All major banks supported',
    icon: 'account-balance',
    enabled: true,
  },
  {
    id: '4',
    title: 'Cash on Delivery',
    subtitle: 'Pay when you receive',
    icon: 'money',
    enabled: true,
  },
];

export default function PaymentsScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Payment Methods
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoSection}>
          <Icon name="security" size={48} color={colors.primary} />
          <Text style={[styles.infoTitle, { color: colors.text }]}>
            Secure Payments
          </Text>
          <Text style={[styles.infoSubtitle, { color: colors.gray }]}>
            Your payment information is encrypted and secure
          </Text>
        </View>

        <View style={styles.methodsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Available Payment Methods
          </Text>
          
          {paymentMethods.map((method) => (
            <View
              key={method.id}
              style={[
                styles.methodCard,
                { 
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: method.enabled ? 1 : 0.5,
                }
              ]}
            >
              <View style={[styles.methodIcon, { backgroundColor: colors.primary }]}>
                <Icon name={method.icon} size={24} color="#fff" />
              </View>
              <View style={styles.methodContent}>
                <Text style={[styles.methodTitle, { color: colors.text }]}>
                  {method.title}
                </Text>
                <Text style={[styles.methodSubtitle, { color: colors.gray }]}>
                  {method.subtitle}
                </Text>
              </View>
              <View style={styles.methodStatus}>
                {method.enabled ? (
                  <Icon name="check-circle" size={20} color="#4CAF50" />
                ) : (
                  <Icon name="schedule" size={20} color={colors.gray} />
                )}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.featuresSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Payment Features
          </Text>
          
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Icon name="lock" size={20} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.gray }]}>
                256-bit SSL encryption
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="receipt" size={20} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.gray }]}>
                Instant payment confirmation
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="replay" size={20} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.gray }]}>
                Easy refunds and returns
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="support-agent" size={20} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.gray }]}>
                24/7 payment support
              </Text>
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
  content: {
    flex: 1,
  },
  infoSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  infoSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  methodsSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  methodContent: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  methodSubtitle: {
    fontSize: 14,
  },
  methodStatus: {
    marginLeft: 8,
  },
  featuresSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  featuresList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    flex: 1,
  },
});