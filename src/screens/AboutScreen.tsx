import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useTheme } from '../hooks/useTheme';

export default function AboutScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          About Us
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.logoSection}>
          <Image
            source={require('../../assets/images/jhola-bazar.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.appName, { color: colors.text }]}>
            Jhola Bazar
          </Text>
          <Text style={[styles.version, { color: colors.gray }]}>
            Version 1.0.0
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Our Mission
          </Text>
          <Text style={[styles.sectionText, { color: colors.gray }]}>
            To provide fresh, quality groceries delivered right to your doorstep with convenience, 
            affordability, and exceptional service. We believe in making grocery shopping simple 
            and accessible for everyone.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            What We Offer
          </Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Icon name="schedule" size={20} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.gray }]}>
                Fast delivery within 10-30 minutes
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="verified" size={20} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.gray }]}>
                Fresh and quality products
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="local-offer" size={20} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.gray }]}>
                Best prices and exclusive deals
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="support-agent" size={20} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.gray }]}>
                24/7 customer support
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Contact Information
          </Text>
          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <Icon name="email" size={20} color={colors.primary} />
              <Text style={[styles.contactText, { color: colors.gray }]}>
                support@jholabazar.com
              </Text>
            </View>
            <View style={styles.contactItem}>
              <Icon name="phone" size={20} color={colors.primary} />
              <Text style={[styles.contactText, { color: colors.gray }]}>
                +91 9262626392
              </Text>
            </View>
            <View style={styles.contactItem}>
              <Icon name="location-on" size={20} color={colors.primary} />
              <Text style={[styles.contactText, { color: colors.gray }]}>
                Samastipur, Bihar, India
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Legal
          </Text>
          
          <TouchableOpacity 
            style={styles.legalItem}
            onPress={() => Linking.openURL('https://jholabazar.com/privacy-policy')}
          >
            <Text style={[styles.legalLink, { color: colors.primary }]}>
              Privacy Policy
            </Text>
            <Icon name="chevron-right" size={20} color={colors.gray} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.legalItem}
            onPress={() => Linking.openURL('https://jholabazar.com/terms-conditions')}
          >
            <Text style={[styles.legalLink, { color: colors.primary }]}>
              Terms & Conditions
            </Text>
            <Icon name="chevron-right" size={20} color={colors.gray} />
          </TouchableOpacity>
          
          <Text style={[styles.legalText, { color: colors.gray }]}>
            © 2025 Jhola Bazar. All rights reserved.
          </Text>
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
  logoSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  version: {
    fontSize: 16,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'justify',
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
  contactInfo: {
    gap: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactText: {
    fontSize: 16,
  },
  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  legalLink: {
    fontSize: 16,
    fontWeight: '500',
  },
  legalText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
});