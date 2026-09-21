import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Brand } from '../types';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { getImageUrl } from '../services/api';

interface BrandListProps {
  brands: Brand[];
  selectedBrand?: number | string | null;
  onSelectBrand: (brand: Brand) => void;
}

export const BrandList: React.FC<BrandListProps> = ({
  brands,
  selectedBrand,
  onSelectBrand,
}) => {
  return (
    <View style={styles.container}>
      <FlatList
        data={brands}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          const isSelected = selectedBrand === item.id;
          return (
            <TouchableOpacity
              style={[styles.item, isSelected && styles.itemSelected]}
              onPress={() => onSelectBrand(item)}
              activeOpacity={0.8}
            >
              {item.image ? (
                <Image
                  source={{ uri: getImageUrl(item.image) }}
                  style={styles.image}
                  resizeMode="contain"
                />
              ) : (
                <Text style={[styles.name, isSelected && styles.nameSelected]}>
                  {item.name}
                </Text>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.xs,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
  },
  item: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
    height: 44,
    minWidth: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  image: {
    width: 65,
    height: 28,
  },
  name: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  nameSelected: {
    color: COLORS.primary,
  },
});
