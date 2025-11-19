import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Clipboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useTheme } from '../hooks/useTheme';
import { RootState } from '../store/store';

export default function ReferralScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { user, isLoggedIn } = useSelector((state: RootState) => state.user);

  const referralCode = user?.referralCode || 'JHOLA123';
  const referralLink = `https://jholabazar.com/ref/${referralCode}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Hey! Use my referral code ${referralCode} on Jhola Bazar and get ₹50 off on your first order. Download now: ${referralLink}`,
        title: 'Join Jhola Bazar',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCopyCode = () => {
    Clipboard.setString(referralCode);
  };

  const handleCopyLink = () => {
    Clipboard.setString(referralLink);
  };

  if (!isLoggedIn) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Referral Program
          </Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.loginPrompt}>
          <Icon name="person-add" size={80} color={colors.gray} />
          <Text style={[styles.loginTitle, { color: colors.text }]}>
            Login Required
          </Text>
          <Text style={[styles.loginSubtitle, { color: colors.gray }]}>
            Please login to access the referral program
          </Text>
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Referral Program
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Icon name="card-giftcard" size={80} color={colors.primary} />
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            Refer & Earn
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.gray }]}>
            Invite friends and earn rewards together
          </Text>
        </View>

        <View style={styles.rewardSection}>
          <View style={[styles.rewardCard, { backgroundColor: colors.primary }]}>
            <Text style={styles.rewardAmount}>₹50</Text>
            <Text style={styles.rewardText}>You Get</Text>
          </View>
          <View style={styles.rewardDivider}>
            <Icon name="add" size={24} color={colors.gray} />
          </View>
          <View style={[styles.rewardCard, { backgroundColor: '#FF6B35' }]}>
            <Text style={styles.rewardAmount}>₹50</Text>
            <Text style={styles.rewardText}>Friend Gets</Text>
          </View>
        </View>

        <View style={styles.codeSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Your Referral Code
          </Text>
          <View style={[styles.codeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.codeText, { color: colors.text }]}>
              {referralCode}
            </Text>
            <TouchableOpacity
              style={[styles.copyButton, { backgroundColor: colors.primary }]}
              onPress={handleCopyCode}
            >
              <Icon name="content-copy" size={16} color="#fff" />
              <Text style={styles.copyButtonText}>Copy</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.linkSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Referral Link
          </Text>
          <View style={[styles.linkCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.linkText, { color: colors.gray }]} numberOfLines={1}>
              {referralLink}
            </Text>
            <TouchableOpacity
              style={[styles.copyButton, { backgroundColor: colors.primary }]}
              onPress={handleCopyLink}
            >
              <Icon name="content-copy" size={16} color="#fff" />
              <Text style={styles.copyButtonText}>Copy</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.shareButton, { backgroundColor: colors.primary }]}
          onPress={handleShare}
        >
          <Icon name="share" size={20} color="#fff" />
          <Text style={styles.shareButtonText}>Share with Friends</Text>
        </TouchableOpacity>

        <View style={styles.howItWorksSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            How it Works
          </Text>
          
          <View style={styles.stepsList}>
            <View style={styles.stepItem}>
              <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.gray }]}>
                Share your referral code with friends
              </Text>
            </View>
            <View style={styles.stepItem}>
              <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.gray }]}>
                Friend signs up and places first order
              </Text>
            </View>
            <View style={styles.stepItem}>
              <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.gray }]}>
                Both of you get ₹50 credit
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
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loginTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  loginButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  rewardSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  rewardCard: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  rewardText: {
    fontSize: 12,
    color: '#fff',
    marginTop: 4,
  },
  rewardDivider: {
    marginHorizontal: 20,
  },
  codeSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  codeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  codeText: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  linkSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 32,
    gap: 8,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  howItWorksSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  stepsList: {
    gap: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: 16,
  },
});