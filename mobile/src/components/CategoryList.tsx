import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Category } from '../types';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { getImageUrl } from '../services/api';

interface CategoryListProps {
  categories: Category[];
  selectedCategory?: number | string | null;
  onSelectCategory: (category: Category) => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          const isSelected = selectedCategory === item.id;
          return (
            <TouchableOpacity
              style={[styles.item, isSelected && styles.itemSelected]}
              onPress={() => onSelectCategory(item)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
                {item.image ? (
                  <Image
                    source={{ uri: getImageUrl(item.image) }}
                    style={styles.image}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.placeholder}>
                    <Text style={styles.placeholderText}>{item.name.charAt(0)}</Text>
                  </View>
                )}
              </View>
              <Text
                style={[styles.name, isSelected && styles.nameSelected]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.sm,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
  },
  item: {
    alignItems: 'center',
    marginRight: SPACING.md,
    width: 72,
  },
  itemSelected: {
    transform: [{ scale: 1.05 }],
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  iconBoxSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  name: {
    fontSize: 11,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  nameSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
