import React from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { formatPrice, getImageUrl } from '../services/api';

export const CartScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { 
    items, 
    subtotal, 
    itemsCount, 
    updateQuantity, 
    removeFromCart, 
    isFreeShipping, 
    freeShippingProgress,
    clearCart 
  } = useCart();

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.emptySafe} edges={['top']}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Mon Panier</Text>
        </View>
        <View style={styles.emptyContent}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="cart-outline" size={64} color={COLORS.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Votre panier est vide</Text>
          <Text style={styles.emptySubtitle}>
            Découvrez nos offres et ajoutez des articles à votre panier !
          </Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => navigation.navigate('Catalog')}
          >
            <Text style={styles.shopButtonText}>Explorer le catalogue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Mon Panier ({itemsCount})</Text>
        <TouchableOpacity onPress={clearCart}>
          <Text style={styles.clearText}>Vider</Text>
        </TouchableOpacity>
      </View>

      {/* Barre d'éligibilité livraison gratuite */}
      <View style={styles.freeShippingBanner}>
        <View style={styles.freeShippingHeader}>
          <Ionicons 
            name={isFreeShipping ? "checkmark-circle" : "gift-outline"} 
            size={18} 
            color={isFreeShipping ? COLORS.success : COLORS.primary} 
          />
          <Text style={styles.freeShippingTitle}>
            {isFreeShipping 
              ? 'Félicitations ! Vous bénéficiez de la livraison gratuite !'
              : `Plus que ${formatPrice(Math.max(0, 10000 - subtotal))} pour la livraison gratuite`}
          </Text>
        </View>
        <View style={styles.progressBarBg}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${freeShippingProgress.percentage}%` },
              isFreeShipping && styles.progressBarSuccess
            ]} 
          />
        </View>
        {!isFreeShipping && (
          <Text style={styles.freeShippingCondition}>
            *Valable dès 10 000 DZD d'achats et un minimum de 3 articles.
          </Text>
        )}
      </View>

      {/* Liste des articles */}
      <FlatList
        data={items}
        keyExtractor={(item, index) => `${item.product_id}_${item.variation}_${index}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.cartCard}>
            <Image
              source={{ uri: getImageUrl(item.image) }}
              style={styles.productImage}
              resizeMode="contain"
            />
            <View style={styles.cardDetails}>
              <View style={styles.cardTop}>
                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                <TouchableOpacity onPress={() => removeFromCart(item.product_id, item.variation)}>
                  <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                </TouchableOpacity>
              </View>

              {item.variation && (
                <Text style={styles.variationTag}>
                  Variation : {item.variation}
                </Text>
              )}

              <View style={styles.cardBottom}>
                <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
                <View style={styles.stepper}>
                  <TouchableOpacity
                    style={styles.stepperButton}
                    onPress={() => updateQuantity(item.product_id, item.variation || null, item.quantity - 1)}
                  >
                    <Ionicons name="remove" size={14} color={COLORS.text} />
                  </TouchableOpacity>
                  <Text style={styles.stepperCount}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.stepperButton}
                    onPress={() => updateQuantity(item.product_id, item.variation || null, item.quantity + 1)}
                  >
                    <Ionicons name="add" size={14} color={COLORS.text} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
      />

      {/* Résumé de commande fixe en bas */}
      <View style={styles.summaryFooter}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Sous-total ({itemsCount} articles)</Text>
          <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Livraison estimée</Text>
          <Text style={[styles.summaryValue, isFreeShipping && styles.freeText]}>
            {isFreeShipping ? 'GRATUITE' : 'Calculée à l’étape suivante'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={() => navigation.navigate('Checkout')}
        >
          <Text style={styles.checkoutButtonText}>
            Passer la commande • {formatPrice(subtotal)}
          </Text>
          <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  emptySafe: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  clearText: {
    fontSize: 13,
    color: COLORS.danger,
    fontWeight: '600',
  },
  freeShippingBanner: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#FED7AA',
  },
  freeShippingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  freeShippingTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 6,
    flex: 1,
  },
  progressBarBg: {
    height: 5,
    backgroundColor: '#FED7AA',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 2,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  progressBarSuccess: {
    backgroundColor: COLORS.success,
  },
  freeShippingCondition: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 3,
    fontStyle: 'italic',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 120,
  },
  cartCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
  },
  cardDetails: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: 'space-between',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    marginRight: SPACING.xs,
  },
  variationTag: {
    fontSize: 11,
    color: COLORS.textMuted,
    backgroundColor: COLORS.background,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
  },
  stepperButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stepperCount: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    paddingHorizontal: 6,
  },
  summaryFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    ...SHADOWS.modal,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  freeText: {
    color: COLORS.success,
    fontWeight: '800',
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
  },
  checkoutButtonText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 15,
    marginRight: 6,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xs,
    lineHeight: 18,
  },
  shopButton: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  shopButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
