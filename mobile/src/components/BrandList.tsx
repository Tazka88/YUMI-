import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const handleImageError = (id: string | number) => {
    setFailedImages((prev) => ({ ...prev, [String(id)]: true }));
  };

  if (!brands || brands.length === 0) {
    return null;
  }

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
          const hasImageFailed = failedImages[String(item.id)];
          const hasValidImage = !!item.image && !hasImageFailed;
          const brandName = item.name ? item.name.toUpperCase() : 'MARQUE';

          return (
            <TouchableOpacity
              style={[styles.item, isSelected && styles.itemSelected]}
              onPress={() => onSelectBrand(item)}
              activeOpacity={0.75}
            >
              {hasValidImage ? (
                <Image
                  source={{ uri: getImageUrl(item.image) }}
                  style={styles.image}
                  resizeMode="contain"
                  onError={() => handleImageError(item.id)}
                />
              ) : (
                <View style={styles.textFallback}>
                  <Ionicons name="pricetag" size={12} color={isSelected ? COLORS.primary : COLORS.textMuted} style={styles.fallbackIcon} />
                  <Text style={[styles.name, isSelected && styles.nameSelected]} numberOfLines={1}>
                    {brandName}
                  </Text>
                </View>
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
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginRight: SPACING.sm,
    height: 48,
    minWidth: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  image: {
    width: 75,
    height: 32,
  },
  textFallback: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackIcon: {
    marginRight: 4,
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

