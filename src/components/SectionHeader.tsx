import { useTheme } from '../hooks/useTheme';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SectionHeaderProps {
  title: string;
  categoryName?: string;
  sectionType?: 'category' | 'featured' | 'popular';
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, categoryName, sectionType = 'category' }) => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  
  const handleSeeAll = () => {
    if (sectionType === 'featured') {
      navigation.navigate('FeaturedProducts' as never);
    } else if (sectionType === 'popular') {
      navigation.navigate('PopularProducts' as never);
    } else if (categoryName) {
      navigation.navigate('Category' as never, { categoryName } as never);
    }
  };

  // side arrow icon 
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <TouchableOpacity style={styles.seeAllButton} onPress={handleSeeAll}>
        <Text style={[styles.seeAllText, { color: colors.primary }]}>See all</Text>
        <Icon name="chevron-forward" size={16} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
});