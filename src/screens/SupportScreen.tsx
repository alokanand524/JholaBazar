import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function SupportScreen() {
  const navigation = useNavigation<any>();

  const supportOptions = [
    {
      id: '1',
      title: 'Call Us',
      subtitle: '+91 9262626392',
      icon: 'phone',
      action: () => Linking.openURL('tel:+919262626392'),
    },
    {
      id: '2',
      title: 'Chat with Us',
      subtitle: 'Live chat support',
      icon: 'chat-bubble',
      action: () => navigation.navigate('Chat'),
    },
    {
      id: '3',
      title: 'Email Us',
      subtitle: 'support@jholabazar.com',
      icon: 'email',
      action: () => Linking.openURL('mailto:support@jholabazar.com'),
    },
    {
      id: '4',
      title: 'WhatsApp',
      subtitle: 'Chat with us',
      icon: 'chat',
      action: () => Linking.openURL('https://wa.me/919262626392'),
    },
  ];

  const faqs = [
    {
      question: 'How do I track my order?',
      answer: 'You can track your order in the "My Orders" section.',
    },
    {
      question: 'What is the delivery time?',
      answer: 'We deliver within 10-15 minutes in your area.',
    },
    {
      question: 'How do I cancel an order?',
      answer: 'You can cancel before dispatch from the store.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept UPI and Credit/Debit Cards.',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Contact Options */}
        <Text style={styles.sectionTitle}>Contact Us</Text>
        {supportOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.optionCard}
            onPress={option.action}
          >
            <View style={styles.iconContainer}>
              <Icon name={option.icon} size={24} color="#00B761" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#ccc" />
          </TouchableOpacity>
        ))}

        {/* FAQs */}
        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>
          Frequently Asked Questions
        </Text>
        {faqs.map((faq, index) => (
          <View key={index} style={styles.faqCard}>
            <Text style={styles.faqQuestion}>{faq.question}</Text>
            <Text style={styles.faqAnswer}>{faq.answer}</Text>
          </View>
        ))}

        {/* App Info */}
        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>
          App Information
        </Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>App Version: 1.0.0</Text>
          <Text style={styles.infoText}>Last Updated: January 2025</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 24,
    marginBottom: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f8f4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  faqCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
});