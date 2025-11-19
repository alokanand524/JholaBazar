import { ImageWithLoading } from './ImageWithLoading';
import { useTheme } from '../hooks/useTheme';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SectionCardProps {
  title: string;
  image: string;
  category?: string;
  categoryId?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({ title, image, category, categoryId }) => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  
  const handlePress = () => {
    navigation.navigate('Category' as never, { 
      categoryName: title,
      categoryId: categoryId || title
    } as never);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={[styles.imageContainer, { backgroundColor: colors.lightGray }]}>
        <ImageWithLoading 
          source={{ uri: image }} 
          width={70} 
          height={70} 
          borderRadius={0}
        />
      </View>
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={2} ellipsizeMode="tail">{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  imageContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 6,
    shadowColor: '#00B761',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: 2,
  },
});