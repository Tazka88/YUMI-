import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Product, Brand, Category } from '../types';
import { getProducts, getBrands, getImageUrl } from '../services/api';
import { ProductCard } from '../components/ProductCard';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - SPACING.lg * 2 - SPACING.md) / 2;

export const BrandDetailScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { brandId, brandSlug, brandName: initialName, brand: initialBrand } = route.params || {};
  
  const [brand, setBrand] = useState<Brand | null>(initialBrand || null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSort, setSelectedSort] = useState<'trending' | 'price_asc' | 'price_desc'>('trending');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Charger les informations de la marque si non fournies
  useEffect(() => {
    if (!brand && (brandId || brandSlug)) {
      getBrands().then((allBrands) => {
        const found = allBrands.find(
          (b) => String(b.id) === String(brandId) || (brandSlug && b.slug === brandSlug)
        );
        if (found) setBrand(found);
      }).catch(console.warn);
    }
  }, [brandId, brandSlug, brand]);

  // Charger les produits de la marque
  const loadBrandProducts = useCallback(async () => {
    const targetId = brand?.id || brandId;
    if (!targetId) return;

    setIsLoading(true);
    try {
      const data = await getProducts({
        brand: targetId,
        sort: selectedSort,
        limit: 100,
      });
      setProducts(data);
    } catch (err) {
      console.warn('Error loading brand products:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [brand?.id, brandId, selectedSort]);

  useEffect(() => {
    loadBrandProducts();
  }, [loadBrandProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    loadBrandProducts();
  };

  // Extraire les catégories uniques présentes dans les produits de cette marque
  const availableCategories = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => {
      if (p.category_name) {
        map.set(p.category_name, p.category_name);
      }
    });
    return Array.from(map.keys());
  }, [products]);

  // Filtrer les produits selon la catégorie sélectionnée
  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return products;
    return products.filter((p) => p.category_name === selectedCategory);
  }, [products, selectedCategory]);

  const displayName = brand?.name ? brand.name.toUpperCase() : (initialName ? initialName.toUpperCase() : 'MARQUE');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* En-tête de navigation */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{displayName}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={styles.cartButton}>
          <Ionicons name="bag-handle-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Bannière / Carte de la Marque */}
      <View style={styles.brandHeroCard}>
        <View style={styles.logoBadge}>
          {brand?.image ? (
            <Image
              source={{ uri: getImageUrl(brand.image) }}
              style={styles.logoImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.placeholderLogo}>
              <Text style={styles.placeholderLetter}>{displayName.charAt(0)}</Text>
            </View>
          )}
        </View>
        <View style={styles.brandHeroInfo}>
          <View style={styles.officialBadge}>
            <Ionicons name="checkmark-circle" size={14} color={COLORS.primary} />
            <Text style={styles.officialText}>Marque Partenaire Officielle</Text>
          </View>
          <Text style={styles.brandHeroTitle}>{displayName}</Text>
          <Text style={styles.productCountText}>
            {products.length} {products.length > 1 ? 'produits disponibles' : 'produit disponible'}
          </Text>
        </View>
      </View>

      {/* Filtres par catégories de la marque */}
      {availableCategories.length > 1 && (
        <View style={styles.categoryFilterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            <TouchableOpacity
              style={[styles.categoryPill, !selectedCategory && styles.categoryPillActive]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[styles.categoryPillText, !selectedCategory && styles.categoryPillTextActive]}>
                Tout ({products.length})
              </Text>
            </TouchableOpacity>
            {availableCategories.map((catName) => (
              <TouchableOpacity
                key={catName}
                style={[styles.categoryPill, selectedCategory === catName && styles.categoryPillActive]}
                onPress={() => setSelectedCategory(selectedCategory === catName ? null : catName)}
              >
                <Text style={[styles.categoryPillText, selectedCategory === catName && styles.categoryPillTextActive]}>
                  {catName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Barre de tri */}
      <View style={styles.sortBar}>
        <Text style={styles.sortBarCount}>
          {filteredProducts.length} {filteredProducts.length > 1 ? 'résultats' : 'résultat'}
        </Text>
        <View style={styles.sortButtons}>
          <TouchableOpacity
            style={[styles.sortButton, selectedSort === 'trending' && styles.sortButtonActive]}
            onPress={() => setSelectedSort('trending')}
          >
            <Text style={[styles.sortButtonText, selectedSort === 'trending' && styles.sortButtonTextActive]}>
              Populaire
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, selectedSort === 'price_asc' && styles.sortButtonActive]}
            onPress={() => setSelectedSort('price_asc')}
          >
            <Text style={[styles.sortButtonText, selectedSort === 'price_asc' && styles.sortButtonTextActive]}>
              Prix croissant
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Grille de produits */}
      {isLoading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement des produits {displayName}...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          numColumns={2}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <ProductCard
                product={item}
                onPress={() => navigation.navigate('ProductDetail', { slug: item.slug, initialProduct: item })}
              />
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={56} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Aucun produit trouvé</Text>
              <Text style={styles.emptySubtitle}>
                Cette marque n'a pas de produits disponibles dans cette sélection pour le moment.
              </Text>
              <TouchableOpacity
                style={styles.browseAllButton}
                onPress={() => navigation.navigate('Brands')}
              >
                <Text style={styles.browseAllButtonText}>Découvrir d'autres marques</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  cartButton: {
    padding: SPACING.xs,
  },
  brandHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    ...SHADOWS.card,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  placeholderLogo: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.borderLight,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderLetter: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.primary,
  },
  brandHeroInfo: {
    flex: 1,
  },
  officialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  officialText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 4,
  },
  brandHeroTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },
  productCountText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  categoryFilterContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingVertical: 8,
  },
  categoryScroll: {
    paddingHorizontal: SPACING.lg,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  categoryPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  categoryPillTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
  },
  sortBarCount: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  sortButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.card,
  },
  sortButtonActive: {
    backgroundColor: COLORS.primaryLight,
  },
  sortButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  sortButtonTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  cardWrapper: {
    width: COLUMN_WIDTH,
    marginRight: SPACING.md,
    marginBottom: SPACING.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.lg,
  },
  browseAllButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  browseAllButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 13,
  },
});
