import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getProductBySlug, getProductReviews, formatPrice, getImageUrl } from '../services/api';
import { Product, ProductVariation, Review } from '../types';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { useCart } from '../context/CartContext';
import { Badge } from '../components/Badge';

const { width } = Dimensions.get('window');

export const ProductDetailScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { slug, initialProduct } = route.params || {};
  const [product, setProduct] = useState<Product | null>(initialProduct || null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(!initialProduct);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [hasImageError, setHasImageError] = useState<boolean>(false);
  const galleryScrollRef = React.useRef<ScrollView>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    if (!initialProduct) {
      setIsLoading(true);
    }
    Promise.all([
      getProductBySlug(slug),
      getProductReviews(slug),
    ])
      .then(([prod, revs]) => {
        setProduct(prod);
        setReviews(revs);
        // Initialiser la première variation si disponible
        let vars: ProductVariation[] = [];
        if (typeof prod.variations === 'string') {
          try { vars = JSON.parse(prod.variations); } catch(e) {}
        } else if (Array.isArray(prod.variations)) {
          vars = prod.variations;
        }
        if (vars.length > 0) {
          setSelectedVariation(vars[0]);
        }
      })
      .catch((err) => {
        console.warn('Error loading product detail:', err);
        if (!initialProduct) {
          Alert.alert('Erreur', 'Impossible de charger ce produit.');
        }
      })
      .finally(() => setIsLoading(false));
  }, [slug]);

  if (isLoading || !product) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  // Parse variations
  let parsedVariations: ProductVariation[] = [];
  if (typeof product.variations === 'string') {
    try { parsedVariations = JSON.parse(product.variations); } catch(e) {}
  } else if (Array.isArray(product.variations)) {
    parsedVariations = product.variations;
  }

  // Parse images (image principale + galerie d'images secondaires)
  const rawList: string[] = [];
  if (product.image) {
    const mainImg = typeof product.image === 'object' && product.image !== null
      ? ((product.image as any).image || (product.image as any).url || (product.image as any).uri || (product.image as any).src || '')
      : String(product.image);
    if (mainImg) rawList.push(mainImg);
  }

  let secondaryImages: any[] = [];
  if (Array.isArray(product.images)) {
    secondaryImages = product.images;
  } else if (typeof product.images === 'string') {
    try {
      const parsed = JSON.parse(product.images);
      secondaryImages = Array.isArray(parsed) ? parsed : [product.images];
    } catch (e) {
      secondaryImages = [product.images];
    }
  }

  secondaryImages.forEach((img: any) => {
    if (!img) return;
    let url = '';
    if (typeof img === 'string') {
      url = img;
    } else if (typeof img === 'object' && img !== null) {
      url = img.image || img.url || img.uri || img.src || img.image_url || img.path || '';
    }
    if (url && !rawList.includes(url)) {
      rawList.push(url);
    }
  });

  const imagesList = rawList.length > 0 ? rawList : [''];

  // Prix et stock dynamiques
  const currentPrice = selectedVariation?.price ? Number(selectedVariation.price) : (product.promo_price || product.price);
  const originalPrice = product.price;
  const currentStock = selectedVariation?.stock !== undefined ? Number(selectedVariation.stock) : product.stock;
  const hasPromo = !!product.promo_price && product.promo_price < product.price && !selectedVariation?.price;
  const isOutOfStock = currentStock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) {
      Alert.alert('Rupture de stock', 'Ce produit est actuellement indisponible.');
      return;
    }
    const success = addToCart(product, selectedVariation, quantity);
    if (success) {
      Alert.alert(
        'Ajouté au panier !',
        `${quantity}x ${product.name} a été ajouté à votre panier.`,
        [
          { text: 'Continuer les achats', style: 'cancel' },
          { text: 'Voir le panier', onPress: () => navigation.navigate('Cart') },
        ]
      );
    }
  };

  const handleBuyNow = () => {
    if (isOutOfStock) {
      Alert.alert('Rupture de stock', 'Ce produit est actuellement indisponible.');
      return;
    }
    addToCart(product, selectedVariation, quantity);
    navigation.navigate('Checkout');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Navbar */}
      <View style={styles.topNavbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>{product.brand_name || 'ZORANDO'}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={styles.navButton}>
          <Ionicons name="bag-handle-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Galerie photos principale */}
        <View style={styles.galleryStage}>
          {/* Conteneur image active */}
          <View style={styles.mainImageWrapper}>
            {imageLoading && (
              <View style={styles.imageLoader}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            )}
            <Image
              key={`main-img-${activeImageIndex}-${imagesList[activeImageIndex] || ''}`}
              source={{ 
                uri: hasImageError 
                  ? getImageUrl(product.image) 
                  : getImageUrl(imagesList[activeImageIndex] || product.image) 
              }}
              style={styles.mainImage}
              resizeMode="contain"
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                setHasImageError(true);
              }}
            />
          </View>

          {/* Boutons Suivant / Précédent flottants si plusieurs images */}
          {imagesList.length > 1 && (
            <>
              <TouchableOpacity
                style={[styles.arrowButton, styles.leftArrow]}
                onPress={() => {
                  setHasImageError(false);
                  setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : imagesList.length - 1));
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={20} color={COLORS.text} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.arrowButton, styles.rightArrow]}
                onPress={() => {
                  setHasImageError(false);
                  setActiveImageIndex((prev) => (prev < imagesList.length - 1 ? prev + 1 : 0));
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-forward" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </>
          )}

          {/* Badge compteur photos (ex: 1 / 5) */}
          {imagesList.length > 1 && (
            <View style={styles.indexBadge}>
              <Text style={styles.indexBadgeText}>{activeImageIndex + 1} / {imagesList.length}</Text>
            </View>
          )}

          {/* Badge promo */}
          {hasPromo && (
            <View style={styles.promoBadge}>
              <Text style={styles.promoBadgeText}>
                -{Math.round(((originalPrice - (product.promo_price || 0)) / originalPrice) * 100)}%
              </Text>
            </View>
          )}
        </View>

        {/* Miniatures de la galerie */}
        {imagesList.length > 1 && (
          <View style={styles.thumbnailContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.thumbnailScroll}
            >
              {imagesList.map((img, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.thumbnailItem,
                    idx === activeImageIndex && styles.thumbnailItemActive,
                  ]}
                  onPress={() => {
                    setHasImageError(false);
                    setActiveImageIndex(idx);
                  }}
                  activeOpacity={0.75}
                >
                  <Image
                    source={{ uri: getImageUrl(img) }}
                    style={styles.thumbnailImage}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Détails principaux */}
        <View style={styles.mainDetails}>
          {product.brand_name && (
            <Text style={styles.brandTag}>{product.brand_name}</Text>
          )}
          <Text style={styles.productTitle}>{product.name}</Text>

          {/* Avis & note */}
          <View style={styles.ratingRow}>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name="star"
                  size={16}
                  color={star <= Math.round(product.avg_rating || 5) ? COLORS.star : COLORS.border}
                />
              ))}
            </View>
            <Text style={styles.ratingScore}>
              {Number(product.avg_rating || 4.8).toFixed(1)}
            </Text>
            <Text style={styles.reviewsText}>
              ({reviews.length > 0 ? reviews.length : 14} avis vérifiés)
            </Text>
          </View>

          {/* Prix */}
          <View style={styles.pricingBox}>
            <Text style={styles.currentPrice}>{formatPrice(currentPrice)}</Text>
            {hasPromo && (
              <Text style={styles.originalPrice}>{formatPrice(originalPrice)}</Text>
            )}
            <View style={styles.stockBadgeContainer}>
              <Badge
                label={isOutOfStock ? 'Rupture de stock' : 'En stock'}
                variant={isOutOfStock ? 'danger' : 'success'}
              />
            </View>
          </View>

          {/* Sélecteur de variations (si existantes) */}
          {parsedVariations.length > 0 && (
            <View style={styles.variationSection}>
              <Text style={styles.sectionLabel}>
                Sélectionnez un modèle / variation :
              </Text>
              <View style={styles.variationsList}>
                {parsedVariations.map((v, i) => {
                  const isSelected = selectedVariation?.value === v.value && selectedVariation?.attribute === v.attribute;
                  const isVarOutOfStock = v.stock !== undefined && Number(v.stock) <= 0;
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.variationPill,
                        isSelected && styles.variationPillSelected,
                        isVarOutOfStock && styles.variationPillDisabled,
                      ]}
                      onPress={() => !isVarOutOfStock && setSelectedVariation(v)}
                      disabled={isVarOutOfStock}
                    >
                      <Text
                        style={[
                          styles.variationText,
                          isSelected && styles.variationTextSelected,
                          isVarOutOfStock && styles.variationTextDisabled,
                        ]}
                      >
                        {v.attribute} : {v.value}
                      </Text>
                      {v.price && (
                        <Text style={styles.variationPrice}>{formatPrice(v.price)}</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Sélecteur de quantité */}
          <View style={styles.quantitySection}>
            <Text style={styles.sectionLabel}>Quantité :</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Ionicons name="remove" size={18} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => setQuantity(Math.min(currentStock, quantity + 1))}
                disabled={quantity >= currentStock}
              >
                <Ionicons name="add" size={18} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Avantages ZORANDO */}
          <View style={styles.perksCard}>
            <View style={styles.perkRow}>
              <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.primary} />
              <View style={styles.perkTextContainer}>
                <Text style={styles.perkTitle}>Produit 100% Authentique</Text>
                <Text style={styles.perkDesc}>Garantie officielle et matériel certifié</Text>
              </View>
            </View>
            <View style={styles.perkDivider} />
            <View style={styles.perkRow}>
              <Ionicons name="cash-outline" size={20} color={COLORS.primary} />
              <View style={styles.perkTextContainer}>
                <Text style={styles.perkTitle}>Paiement à la livraison</Text>
                <Text style={styles.perkDesc}>Payez en espèces après vérification du colis</Text>
              </View>
            </View>
            <View style={styles.perkDivider} />
            <View style={styles.perkRow}>
              <Ionicons name="car-outline" size={20} color={COLORS.primary} />
              <View style={styles.perkTextContainer}>
                <Text style={styles.perkTitle}>Livraison 58 Wilayas</Text>
                <Text style={styles.perkDesc}>Expédition rapide à domicile ou en Point Relais</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          {product.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Description du produit</Text>
              <Text style={styles.descriptionText}>{product.description}</Text>
            </View>
          )}

          {/* Avis clients */}
          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Avis clients ({reviews.length})</Text>
            </View>

            {reviews.length === 0 ? (
              <Text style={styles.noReviewsText}>Soyez le premier à donner votre avis sur ce produit !</Text>
            ) : (
              reviews.map((rev) => (
                <View key={rev.id} style={styles.reviewCard}>
                  <View style={styles.reviewTop}>
                    <Text style={styles.reviewerName}>{rev.customer_name}</Text>
                    <View style={styles.reviewStars}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Ionicons
                          key={s}
                          name="star"
                          size={12}
                          color={s <= rev.rating ? COLORS.star : COLORS.border}
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewComment}>{rev.comment}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Barre d'action fixe en bas */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.cartActionButton, isOutOfStock && styles.actionDisabled]}
          onPress={handleAddToCart}
          disabled={isOutOfStock}
        >
          <Ionicons name="cart-outline" size={20} color={COLORS.primary} />
          <Text style={styles.cartActionText}>Ajouter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.buyActionButton, isOutOfStock && styles.actionDisabled]}
          onPress={handleBuyNow}
          disabled={isOutOfStock}
        >
          <Text style={styles.buyActionText}>Acheter maintenant</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topNavbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  navButton: {
    padding: SPACING.xs,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  scrollContent: {
    paddingBottom: 100,
    backgroundColor: COLORS.background,
  },
  galleryStage: {
    width: '100%',
    height: 330,
    backgroundColor: COLORS.white,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  mainImageWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  imageLoader: {
    position: 'absolute',
    zIndex: 2,
    alignSelf: 'center',
  },
  mainImage: {
    width: '100%',
    height: '100%',
    maxWidth: width - 32,
    maxHeight: 290,
  },
  arrowButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  leftArrow: {
    left: SPACING.md,
  },
  rightArrow: {
    right: SPACING.md,
  },
  indexBadge: {
    position: 'absolute',
    bottom: SPACING.md,
    right: SPACING.md,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    zIndex: 5,
  },
  indexBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  thumbnailContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  thumbnailScroll: {
    paddingHorizontal: SPACING.lg,
    gap: 8,
  },
  thumbnailItem: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    padding: 4,
    backgroundColor: COLORS.white,
  },
  thumbnailItemActive: {
    borderColor: COLORS.primary,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  promoBadge: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    backgroundColor: COLORS.danger,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  promoBadgeText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 12,
  },
  mainDetails: {
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    marginTop: -RADIUS.md,
  },
  brandTag: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    lineHeight: 24,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 6,
  },
  ratingScore: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  reviewsText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  pricingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  currentPrice: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primary,
    marginRight: SPACING.sm,
  },
  originalPrice: {
    fontSize: 14,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
    marginRight: SPACING.sm,
  },
  stockBadgeContainer: {
    marginLeft: 'auto',
  },
  variationSection: {
    marginVertical: SPACING.sm,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  variationsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  variationPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  variationPillSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  variationPillDisabled: {
    opacity: 0.4,
  },
  variationText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  variationTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  variationTextDisabled: {
    color: COLORS.textMuted,
  },
  variationPrice: {
    fontSize: 10,
    color: COLORS.primary,
    marginTop: 2,
    fontWeight: '700',
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.borderLight,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginHorizontal: SPACING.lg,
  },
  perksCard: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  perkTextContainer: {
    marginLeft: SPACING.md,
  },
  perkTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  perkDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  perkDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.xs,
  },
  descriptionSection: {
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  descriptionText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  reviewsSection: {
    marginTop: SPACING.xl,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  noReviewsText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  reviewCard: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  reviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  reviewerName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  reviewStars: {
    flexDirection: 'row',
  },
  reviewComment: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    ...SHADOWS.modal,
  },
  cartActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    marginRight: SPACING.sm,
  },
  cartActionText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 6,
  },
  buyActionButton: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
  },
  buyActionText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 14,
  },
  actionDisabled: {
    opacity: 0.5,
  },
});
