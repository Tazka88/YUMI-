import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  RefreshControl, 
  ActivityIndicator, 
  TouchableOpacity 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/Header';
import { BannerCarousel } from '../components/BannerCarousel';
import { CategoryList } from '../components/CategoryList';
import { BrandList } from '../components/BrandList';
import { ProductCard } from '../components/ProductCard';
import { 
  getHeroBanners, 
  getCategories, 
  getBrands, 
  getProducts 
} from '../services/api';
import { HeroBanner, Category, Brand, Product } from '../types';
import { COLORS, SPACING } from '../constants/theme';
import { useCart } from '../context/CartContext';

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [promotions, setPromotions] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isFreeShipping, freeShippingProgress } = useCart();

  const loadData = useCallback(async () => {
    try {
      const [
        bannersData,
        categoriesData,
        brandsData,
        promosData,
        bestSellersData,
        newsData,
      ] = await Promise.all([
        getHeroBanners(),
        getCategories(),
        getBrands(),
        getProducts({ promo_active: true, limit: 6 }),
        getProducts({ sort: 'top_sales', limit: 6 }),
        getProducts({ sort: 'newest', limit: 6 }),
      ]);

      setBanners(bannersData);
      setCategories(categoriesData);
      setBrands(brandsData);
      setPromotions(promosData);
      setBestSellers(bestSellersData);
      setNewProducts(newsData);
    } catch (err) {
      console.warn('Error loading home data:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const navigateToProduct = (product: Product) => {
    navigation.navigate('ProductDetail', {
      slug: product.slug,
      title: product.name,
      initialProduct: product,
    });
  };

  const navigateToCategory = (category: Category) => {
    navigation.navigate('Catalog', { categoryId: category.id, categoryName: category.name });
  };

  const navigateToBrand = (brand: Brand) => {
    navigation.navigate('BrandDetail', {
      brand,
      brandId: brand.id,
      brandName: brand.name,
      brandSlug: brand.slug,
    });
  };

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement de ZORANDO...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* En-tête avec Recherche et Panier */}
      <Header
        showSearch
        onSearchSubmit={() => navigation.navigate('Catalog')}
        onCartPress={() => navigation.navigate('Cart')}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Barre info livraison Algérie */}
        <View style={styles.deliveryBar}>
          <Ionicons name="flash-outline" size={16} color={COLORS.primary} />
          <Text style={styles.deliveryText}>
            Livraison rapide 58 Wilayas • Paiement à la livraison
          </Text>
        </View>

        {/* Bannières défilantes */}
        <BannerCarousel
          banners={banners}
          onBannerPress={(b) => navigation.navigate('Catalog')}
        />

        {/* Catégories principales */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Catégories</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Catalog')}>
            <Text style={styles.seeAllText}>Tout voir</Text>
          </TouchableOpacity>
        </View>
        <CategoryList
          categories={categories}
          onSelectCategory={navigateToCategory}
        />

        {/* Marques officielles */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nos Marques Partenaires</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Brands')}>
            <Text style={styles.seeAllText}>Toutes</Text>
          </TouchableOpacity>
        </View>
        <BrandList
          brands={brands}
          onSelectBrand={navigateToBrand}
        />

        {/* Promotions Flash */}
        {promotions.length > 0 && (
          <View style={styles.productsSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.titleWithIcon}>
                <Ionicons name="flame" size={20} color={COLORS.danger} />
                <Text style={[styles.sectionTitle, { marginLeft: 4 }]}>
                  Offres & Promotions
                </Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Catalog', { filter: 'promos' })}>
                <Text style={styles.seeAllText}>Voir plus</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.productsGrid}>
              {promotions.map((item) => (
                <View key={item.id} style={styles.gridColumn}>
                  <ProductCard
                    product={item}
                    onPress={() => navigateToProduct(item)}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Meilleures Ventes */}
        {bestSellers.length > 0 && (
          <View style={styles.productsSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.titleWithIcon}>
                <Ionicons name="trophy-outline" size={18} color={COLORS.warning} />
                <Text style={[styles.sectionTitle, { marginLeft: 4 }]}>
                  Meilleures Ventes
                </Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Catalog', { sort: 'top_sales' })}>
                <Text style={styles.seeAllText}>Voir plus</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.productsGrid}>
              {bestSellers.map((item) => (
                <View key={item.id} style={styles.gridColumn}>
                  <ProductCard
                    product={item}
                    onPress={() => navigateToProduct(item)}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Nouveautés */}
        {newProducts.length > 0 && (
          <View style={styles.productsSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.titleWithIcon}>
                <Ionicons name="sparkles-outline" size={18} color={COLORS.primary} />
                <Text style={[styles.sectionTitle, { marginLeft: 4 }]}>
                  Nouveautés
                </Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Catalog', { sort: 'newest' })}>
                <Text style={styles.seeAllText}>Voir plus</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.productsGrid}>
              {newProducts.map((item) => (
                <View key={item.id} style={styles.gridColumn}>
                  <ProductCard
                    product={item}
                    onPress={() => navigateToProduct(item)}
                  />
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
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
    backgroundColor: COLORS.white,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  scrollContent: {
    paddingBottom: SPACING.xxxl,
    backgroundColor: COLORS.background,
  },
  deliveryBar: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#FED7AA',
  },
  deliveryText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  productsSection: {
    marginTop: SPACING.sm,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.xs,
  },
  gridColumn: {
    width: '50%',
    paddingHorizontal: SPACING.xs,
  },
});
