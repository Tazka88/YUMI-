import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Brand } from '../types';
import { getBrands, getImageUrl } from '../services/api';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.lg * 2 - SPACING.md) / 2;

export const BrandsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBrands = async () => {
    try {
      const data = await getBrands();
      setBrands(data);
    } catch (err) {
      console.warn('Error fetching brands:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBrands();
  };

  const filteredBrands = useMemo(() => {
    if (!searchQuery.trim()) return brands;
    const q = searchQuery.toLowerCase().trim();
    return brands.filter(
      (b) => b.name?.toLowerCase().includes(q) || b.slug?.toLowerCase().includes(q)
    );
  }, [brands, searchQuery]);

  const handleBrandPress = (brand: Brand) => {
    navigation.navigate('BrandDetail', {
      brand,
      brandId: brand.id,
      brandName: brand.name ? brand.name.toUpperCase() : 'Marque',
      brandSlug: brand.slug,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Nos Marques</Text>
          <Text style={styles.headerSubtitle}>
            {brands.length} marques officielles partenaires
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Cart')}
          style={styles.cartButton}
          activeOpacity={0.7}
        >
          <Ionicons name="bag-handle-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Barre de recherche de marques */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une marque (ex: Apple, Philips, VGR...)"
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Contenu principal */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement des marques...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBrands}
          numColumns={2}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="pricetag-outline" size={56} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Aucune marque trouvée</Text>
              <Text style={styles.emptySubtitle}>
                Essayez un autre mot-clé pour votre recherche.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.brandCard}
              onPress={() => handleBrandPress(item)}
              activeOpacity={0.85}
            >
              <View style={styles.logoContainer}>
                {item.image ? (
                  <Image
                    source={{ uri: getImageUrl(item.image) }}
                    style={styles.brandLogo}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.placeholderLogo}>
                    <Text style={styles.placeholderText}>
                      {item.name ? item.name.substring(0, 2).toUpperCase() : 'Z'}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.brandInfo}>
                <Text style={styles.brandName} numberOfLines={1}>
                  {item.name ? item.name.toUpperCase() : 'MARQUE'}
                </Text>
                <View style={styles.viewProductsBadge}>
                  <Text style={styles.viewProductsText}>Voir les produits</Text>
                  <Ionicons name="chevron-forward" size={12} color={COLORS.primary} />
                </View>
              </View>
            </TouchableOpacity>
          )}
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
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: SPACING.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  cartButton: {
    padding: SPACING.xs,
  },
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: 14,
    color: COLORS.text,
    padding: 0,
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  brandCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    marginRight: SPACING.md,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  logoContainer: {
    width: '100%',
    height: 110,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  brandLogo: {
    width: '100%',
    height: '100%',
  },
  placeholderLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  brandInfo: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  brandName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  viewProductsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  viewProductsText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    marginRight: 2,
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
    paddingVertical: SPACING.xxl * 2,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
});
