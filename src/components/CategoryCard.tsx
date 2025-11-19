import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface CategoryCardProps {
  category: string;
  image: string;
  isSelected: boolean;
  onPress: (category: string) => void;
  itemCount: number;
}

export function CategoryCard({ category, image, isSelected, onPress, itemCount }: CategoryCardProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { 
          backgroundColor: colors.card,
          borderColor: isSelected ? colors.primary : colors.border,
        }
      ]}
      onPress={() => onPress(category)}
    >
      <Image
        source={{ uri: image || 'https://via.placeholder.com/60' }}
        style={styles.image}
      />
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
        {category}
      </Text>
      {itemCount > 0 && (
        <Text style={[styles.itemCount, { color: colors.gray }]}>
          {itemCount} items
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 100,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    margin: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  itemCount: {
    fontSize: 10,
  },
});