import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Order } from '../types';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { formatPrice } from '../services/api';
import { Badge } from '../components/Badge';

export const OrderDetailScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { order } = route.params as { order: Order };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails de la commande</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* En-tête Statut */}
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <Text style={styles.orderId}>Commande #{order.order_id || order.id}</Text>
            <Badge label={order.status || 'En cours'} variant="primary" />
          </View>
          <Text style={styles.orderDate}>
            Passée le {new Date(order.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        {/* Informations de livraison */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Destinataire & Livraison</Text>

          <View style={styles.infoLine}>
            <Ionicons name="person-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>{order.customer_name}</Text>
          </View>

          <View style={styles.infoLine}>
            <Ionicons name="call-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>{order.customer_phone}</Text>
          </View>

          <View style={styles.infoLine}>
            <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>
              {order.shipping_wilaya} - {order.shipping_commune}
            </Text>
          </View>

          {order.shipping_address && (
            <View style={styles.infoLine}>
              <Ionicons name="home-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>{order.shipping_address}</Text>
            </View>
          )}

          <View style={styles.infoLine}>
            <Ionicons name="car-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>
              Mode : {order.delivery_type === 'stopdesk' ? 'Point Relais (Stop Desk)' : 'Livraison à Domicile'}
            </Text>
          </View>
        </View>

        {/* Paiement */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Paiement</Text>
          <View style={styles.codRow}>
            <Ionicons name="cash-outline" size={20} color={COLORS.primary} />
            <Text style={styles.codText}>Paiement à la livraison (En espèces)</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Frais de livraison</Text>
            <Text style={styles.priceValue}>{formatPrice(order.delivery_cost)}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total à payer au livreur</Text>
            <Text style={styles.totalValue}>{formatPrice(order.total_amount)}</Text>
          </View>
        </View>

        {/* Aide / Support */}
        <TouchableOpacity
          style={styles.supportButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Ionicons name="help-circle-outline" size={20} color={COLORS.primary} />
          <Text style={styles.supportButtonText}>Besoin d'aide pour cette commande ?</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    height: 48,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxxl,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  orderDate: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  codRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  codText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  priceLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  priceValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 4,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
    marginTop: 4,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
  },
  supportButtonText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 6,
  },
});
