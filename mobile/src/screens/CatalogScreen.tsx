import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Modal, 
  ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/Header';
import { ProductCard } from '../components/ProductCard';
import { getProducts, getCategories, getBrands } from '../services/api';
import { Product, Category, Brand } from '../types';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

export const CatalogScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const initialCategoryId = route.params?.categoryId || null;
  const initialBrandId = route.params?.brandId || null;
  const initialFilter = route.params?.filter || null;

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | string | null>(initialCategoryId);
  const [selectedBrand, setSelectedBrand] = useState<number | string | null>(initialBrandId);
  const [selectedSort, setSelectedSort] = useState<string>('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Charger les filtres (catégories et marques)
  useEffect(() => {
    Promise.all([getCategories(), getBrands()]).then(([cats, bnds]) => {
      setCategories(cats);
      setBrands(bnds);
    });
  }, []);

  // Écouter les changements de paramètres de navigation (ex: clic sur une marque ou catégorie)
  useEffect(() => {
    if (route.params?.brandId !== undefined) {
      setSelectedBrand(route.params.brandId);
    }
    if (route.params?.categoryId !== undefined) {
      setSelectedCategory(route.params.categoryId);
    }
  }, [route.params?.brandId, route.params?.categoryId]);

  const fetchCatalogProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getProducts({
        search: searchQuery || undefined,
        category: selectedCategory || undefined,
        brand: selectedBrand || undefined,
        sort: selectedSort as any,
        promo_active: initialFilter === 'promos' ? true : undefined,
        limit: 50,
      });
      setProducts(data);
    } catch (err) {
      console.warn('Error fetching catalog products:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedCategory, selectedBrand, selectedSort, initialFilter]);

  useEffect(() => {
    fetchCatalogProducts();
  }, [fetchCatalogProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCatalogProducts();
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedBrand(null);
    setSelectedSort('trending');
    setSearchQuery('');
  };

  const activeFiltersCount = 
    (selectedCategory ? 1 : 0) + 
    (selectedBrand ? 1 : 0) + 
    (selectedSort !== 'trending' ? 1 : 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header avec recherche */}
      <Header
        showSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={fetchCatalogProducts}
        onCartPress={() => navigation.navigate('Cart')}
      />

      {/* Barre de contrôle des filtres et du tri */}
      <View style={styles.filterBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity 
            style={[styles.filterButton, activeFiltersCount > 0 && styles.filterButtonActive]}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons 
              name="options-outline" 
              size={18} 
              color={activeFiltersCount > 0 ? COLORS.primary : COLORS.text} 
            />
            <Text style={[styles.filterButtonText, activeFiltersCount > 0 && styles.filterButtonTextActive]}>
              Filtres {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, { marginLeft: 8, backgroundColor: COLORS.card }]}
            onPress={() => navigation.navigate('Brands')}
          >
            <Ionicons name="pricetag-outline" size={16} color={COLORS.primary} />
            <Text style={[styles.filterButtonText, { color: COLORS.primary, marginLeft: 4 }]}>
              Nos Marques
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.resultsCount}>
          {products.length} {products.length > 1 ? 'produits' : 'produit'}
        </Text>
      </View>

      {/* Chips des filtres actifs */}
      {(selectedBrand || selectedCategory) && (
        <View style={{ flexDirection: 'row', paddingHorizontal: SPACING.lg, paddingBottom: 8, flexWrap: 'wrap', gap: 8 }}>
          {selectedBrand && (
            <TouchableOpacity
              onPress={() => setSelectedBrand(null)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: COLORS.primaryLight || '#fff7ed',
                borderColor: COLORS.primary,
                borderWidth: 1,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 16,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: COLORS.primary, marginRight: 4 }}>
                Marque: {brands.find(b => String(b.id) === String(selectedBrand))?.name?.toUpperCase() || selectedBrand}
              </Text>
              <Ionicons name="close-circle" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          )}
          {selectedCategory && (
            <TouchableOpacity
              onPress={() => setSelectedCategory(null)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: COLORS.card,
                borderColor: COLORS.border,
                borderWidth: 1,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 16,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.text, marginRight: 4 }}>
                Catégorie: {categories.find(c => String(c.id) === String(selectedCategory))?.name || selectedCategory}
              </Text>
              <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Liste des produits */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={56} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>Aucun produit trouvé</Text>
          <Text style={styles.emptySubtitle}>
            Essayez de modifier votre recherche ou de réinitialiser vos filtres.
          </Text>
          <TouchableOpacity style={styles.resetButton} onPress={clearFilters}>
            <Text style={styles.resetButtonText}>Réinitialiser les filtres</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          numColumns={2}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={onRefresh}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <ProductCard
                product={item}
                onPress={() => navigation.navigate('ProductDetail', { slug: item.slug, title: item.name, initialProduct: item })}
              />
            </View>
          )}
        />
      )}

      {/* Modal de filtres et de tri */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrer & Trier</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Tri */}
              <Text style={styles.filterSectionTitle}>Trier par</Text>
              <View style={styles.chipsContainer}>
                {[
                  { label: 'Plus populaires', value: 'trending' },
                  { label: 'Meilleures ventes', value: 'top_sales' },
                  { label: 'Nouveautés', value: 'newest' },
                  { label: 'Prix croissant', value: 'price_asc' },
                  { label: 'Prix décroissant', value: 'price_desc' },
                ].map((sortOption) => (
                  <TouchableOpacity
                    key={sortOption.value}
                    style={[
                      styles.chip,
                      selectedSort === sortOption.value && styles.chipActive,
                    ]}
                    onPress={() => setSelectedSort(sortOption.value)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selectedSort === sortOption.value && styles.chipTextActive,
                      ]}
                    >
                      {sortOption.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Catégories */}
              <Text style={styles.filterSectionTitle}>Catégorie</Text>
              <View style={styles.chipsContainer}>
                <TouchableOpacity
                  style={[styles.chip, selectedCategory === null && styles.chipActive]}
                  onPress={() => setSelectedCategory(null)}
                >
                  <Text style={[styles.chipText, selectedCategory === null && styles.chipTextActive]}>
                    Toutes
                  </Text>
                </TouchableOpacity>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.chip, selectedCategory === cat.id && styles.chipActive]}
                    onPress={() => setSelectedCategory(cat.id)}
                  >
                    <Text
                      style={[styles.chipText, selectedCategory === cat.id && styles.chipTextActive]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Marques */}
              <Text style={styles.filterSectionTitle}>Marque</Text>
              <View style={styles.chipsContainer}>
                <TouchableOpacity
                  style={[styles.chip, selectedBrand === null && styles.chipActive]}
                  onPress={() => setSelectedBrand(null)}
                >
                  <Text style={[styles.chipText, selectedBrand === null && styles.chipTextActive]}>
                    Toutes
                  </Text>
                </TouchableOpacity>
                {brands.map((bnd) => (
                  <TouchableOpacity
                    key={bnd.id}
                    style={[styles.chip, selectedBrand === bnd.id && styles.chipActive]}
                    onPress={() => setSelectedBrand(bnd.id)}
                  >
                    <Text
                      style={[styles.chipText, selectedBrand === bnd.id && styles.chipTextActive]}
                    >
                      {bnd.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalResetButton} onPress={clearFilters}>
                <Text style={styles.modalResetText}>Effacer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalApplyButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.modalApplyText}>Appliquer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  filterButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 6,
  },
  filterButtonTextActive: {
    color: COLORS.primary,
  },
  resultsCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  listContainer: {
    padding: SPACING.sm,
    backgroundColor: COLORS.background,
    paddingBottom: SPACING.xxxl,
  },
  gridItem: {
    width: '50%',
    padding: SPACING.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xs,
    lineHeight: 18,
  },
  resetButton: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
  },
  resetButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    marginRight: SPACING.xs + 2,
    marginBottom: SPACING.xs + 2,
  },
  chipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  modalResetButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
  },
  modalResetText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  modalApplyButton: {
    flex: 2,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
  },
  modalApplyText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
