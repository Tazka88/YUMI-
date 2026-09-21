import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { formatPrice } from '../services/api';

export const OrderSuccessScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { 
    orderId, 
    customerName, 
    phone, 
    totalAmount, 
    deliveryCost, 
    deliveryType, 
    wilaya, 
    commune 
  } = route.params || {};

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Icône de succès */}
        <View style={styles.successCircle}>
          <Ionicons name="checkmark-sharp" size={48} color={COLORS.white} />
        </View>

        <Text style={styles.congratsTitle}>Commande Confirmée !</Text>
        <Text style={styles.congratsSubtitle}>
          Merci pour votre confiance, <Text style={styles.bold}>{customerName}</Text>.
        </Text>

        {/* Badge numéro de commande */}
        <View style={styles.orderIdBadge}>
          <Text style={styles.orderIdLabel}>Numéro de commande :</Text>
          <Text style={styles.orderIdValue}>#{orderId}</Text>
        </View>

        {/* Notice d'appel de confirmation */}
        <View style={styles.noticeCard}>
          <Ionicons name="call-outline" size={24} color={COLORS.primary} />
          <View style={styles.noticeTextContainer}>
            <Text style={styles.noticeTitle}>Confirmation par Téléphone</Text>
            <Text style={styles.noticeDesc}>
              Notre équipe va vous appeler au <Text style={styles.bold}>{phone}</Text> afin de valider les détails et planifier l’expédition de votre colis.
            </Text>
          </View>
        </View>

        {/* Détails de livraison & montant */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Récapitulatif</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Destination :</Text>
            <Text style={styles.detailValue}>{wilaya} - {commune}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Mode :</Text>
            <Text style={styles.detailValue}>
              {deliveryType === 'stopdesk' ? 'Point Relais / Stop Desk' : 'À Domicile'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Paiement :</Text>
            <Text style={styles.detailValue}>En espèces à la livraison</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.totalLabel}>Montant à payer au livreur :</Text>
            <Text style={styles.totalValue}>{formatPrice(totalAmount)}</Text>
          </View>
        </View>

        {/* Boutons d'action */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('HomeTabs', { screen: 'Home' })}
          >
            <Ionicons name="home-outline" size={18} color={COLORS.white} style={{ marginRight: 8 }} />
            <Text style={styles.primaryButtonText}>Retour à l'accueil</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('HomeTabs', { screen: 'Orders' })}
          >
            <Text style={styles.secondaryButtonText}>Suivre mes commandes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    alignItems: 'center',
    padding: SPACING.xl,
    paddingTop: SPACING.xxxl,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  congratsTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
  },
  congratsSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  bold: {
    fontWeight: '700',
    color: COLORS.text,
  },
  orderIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  orderIdLabel: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  orderIdValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    marginLeft: 6,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginVertical: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  noticeTextContainer: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  noticeDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  detailsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.md,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
  },
  actionsContainer: {
    width: '100%',
    marginTop: SPACING.xxl,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 15,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 14,
  },
});
