import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { formatPrice, getImageUrl } from '../services/api';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const { addToCart } = useCart();
  const hasPromo = !!product.promo_price && product.promo_price < product.price;
  const isOutOfStock = product.stock <= 0;

  // Calcul du pourcentage de réduction
  const discountPercent = hasPromo && product.promo_price
    ? Math.round(((product.price - product.promo_price) / product.price) * 100)
    : 0;

  const handleQuickAdd = (e: any) => {
    e.stopPropagation?.();
    if (!isOutOfStock) {
      addToCart(product);
    }
  };

  const productImg = product.image || (Array.isArray(product.images) ? product.images[0] : product.images);

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Image container avec badge */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: getImageUrl(productImg) }}
          style={styles.image}
          resizeMode="contain"
        />

        {hasPromo && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discountPercent}%</Text>
          </View>
        )}

        {isOutOfStock && (
          <View style={styles.stockOverlay}>
            <Text style={styles.stockOverlayText}>Rupture</Text>
          </View>
        )}
      </View>

      {/* Détails du produit */}
      <View style={styles.details}>
        {product.brand_name && (
          <Text style={styles.brandName} numberOfLines={1}>
            {product.brand_name}
          </Text>
        )}

        <Text style={styles.title} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Note et avis */}
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={13} color={COLORS.star} />
          <Text style={styles.ratingText}>
            {product.avg_rating ? Number(product.avg_rating).toFixed(1) : '4.8'}
          </Text>
          <Text style={styles.reviewsCount}>
            ({product.reviews_count || 12})
          </Text>
        </View>

        {/* Prix et bouton d'ajout */}
        <View style={styles.priceRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.currentPrice}>
              {formatPrice(hasPromo ? product.promo_price : product.price)}
            </Text>
            {hasPromo && (
              <Text style={styles.originalPrice}>
                {formatPrice(product.price)}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.addButton, isOutOfStock && styles.addButtonDisabled]}
            onPress={handleQuickAdd}
            disabled={isOutOfStock}
          >
            <Ionicons name="cart-outline" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    flex: 1,
    marginHorizontal: SPACING.xs,
    ...SHADOWS.card,
  },
  imageContainer: {
    width: '100%',
    height: 150,
    backgroundColor: COLORS.white,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xs,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: SPACING.xs,
    left: SPACING.xs,
    backgroundColor: COLORS.danger,
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  discountText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
  },
  stockOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 3,
    alignItems: 'center',
  },
  stockOverlayText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  details: {
    padding: SPACING.sm,
    backgroundColor: COLORS.white,
    flex: 1,
    justifyContent: 'space-between',
  },
  brandName: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 17,
    minHeight: 34,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 3,
  },
  reviewsCount: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginLeft: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  priceContainer: {
    flex: 1,
  },
  currentPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  originalPrice: {
    fontSize: 11,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
    marginTop: 1,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.xs,
  },
  addButtonDisabled: {
    backgroundColor: COLORS.border,
  },
});
