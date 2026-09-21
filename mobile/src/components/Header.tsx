import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { useCart } from '../context/CartContext';

interface HeaderProps {
  title?: string;
  showSearch?: boolean;
  searchQuery?: string;
  onSearchChange?: (text: string) => void;
  onSearchSubmit?: () => void;
  onCartPress?: () => void;
  onBackPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showSearch = false,
  searchQuery = '',
  onSearchChange,
  onSearchSubmit,
  onCartPress,
  onBackPress,
}) => {
  const { itemsCount } = useCart();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {onBackPress ? (
          <TouchableOpacity onPress={onBackPress} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.logoContainer}>
            <Text style={styles.logoZ}>ZOR</Text>
            <Text style={styles.logoO}>ANDO</Text>
          </View>
        )}

        {title && <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>}

        <View style={styles.rightActions}>
          {onCartPress && (
            <TouchableOpacity onPress={onCartPress} style={styles.cartButton}>
              <Ionicons name="bag-handle-outline" size={24} color={COLORS.text} />
              {itemsCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {itemsCount > 99 ? '99+' : itemsCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showSearch && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un produit, marque..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={onSearchChange}
            onSubmitEditing={onSearchSubmit}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => onSearchChange?.('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoZ: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.secondary,
    letterSpacing: -0.5,
  },
  logoO: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: SPACING.sm,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: SPACING.xs,
  },
  cartButton: {
    position: 'relative',
    padding: SPACING.xs,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: -2,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 42,
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    height: '100%',
  },
});
