import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  Modal, 
  FlatList 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { 
  getWilayas, 
  getCommunes, 
  getStopDesks, 
  createOrder, 
  formatPrice 
} from '../services/api';
import { Wilaya, Commune, StopDesk } from '../types';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

export const CheckoutScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { items, subtotal, isFreeShipping, clearCart } = useCart();
  const { user, profile } = useAuth();

  // Form states
  const [fullName, setFullName] = useState(
    profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : ''
  );
  const [phone, setPhone] = useState(profile?.phone || '');
  const [address, setAddress] = useState(profile?.full_address || '');
  const [note, setNote] = useState('');

  // Delivery type: 'home' | 'stopdesk'
  const [deliveryType, setDeliveryType] = useState<'home' | 'stopdesk'>('home');

  // Algeria regions data
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [stopDesks, setStopDesks] = useState<StopDesk[]>([]);

  const [selectedWilaya, setSelectedWilaya] = useState<Wilaya | null>(null);
  const [selectedCommune, setSelectedCommune] = useState<Commune | null>(null);
  const [selectedStopDesk, setSelectedStopDesk] = useState<StopDesk | null>(null);

  // Modal pickers
  const [showWilayaModal, setShowWilayaModal] = useState(false);
  const [showCommuneModal, setShowCommuneModal] = useState(false);
  const [showStopDeskModal, setShowStopDeskModal] = useState(false);
  const [searchModalText, setSearchModalText] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRegions, setIsLoadingRegions] = useState(true);

  useEffect(() => {
    Promise.all([getWilayas(), getCommunes(), getStopDesks()])
      .then(([wils, comms, sds]) => {
        setWilayas(wils);
        setCommunes(comms);
        setStopDesks(sds);

        // Si l'utilisateur a une wilaya enregistrée dans son profil
        if (profile?.wilaya) {
          const userWil = wils.find(
            (w) => w.name.toLowerCase() === profile.wilaya?.toLowerCase()
          );
          if (userWil) setSelectedWilaya(userWil);
        }
      })
      .catch((err) => console.warn('Error loading regions:', err))
      .finally(() => setIsLoadingRegions(false));
  }, [profile]);

  // Communes filtrées par wilaya
  const filteredCommunes = selectedWilaya
    ? communes.filter((c) => c.wilaya_id === selectedWilaya.id)
    : [];

  // Stop desks filtrés par wilaya
  const filteredStopDesks = selectedWilaya
    ? stopDesks.filter((sd) => sd.wilaya_id === selectedWilaya.id)
    : [];

  // Calcul des frais de livraison
  const deliveryCost = isFreeShipping
    ? 0
    : selectedWilaya
    ? deliveryType === 'stopdesk'
      ? selectedWilaya.stop_desk_fee || Math.max(300, selectedWilaya.shipping_fee - 200)
      : selectedWilaya.shipping_fee || 600
    : 600;

  const totalAmount = subtotal + deliveryCost;

  const handleSubmitOrder = async () => {
    if (!fullName.trim()) {
      Alert.alert('Champs requis', 'Veuillez renseigner votre nom et prénom.');
      return;
    }

    // Validation simple numéro algérien
    const cleanPhone = phone.replace(/\s+/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      Alert.alert('Numéro invalide', 'Veuillez saisir un numéro de téléphone valide (ex: 0555 12 34 56).');
      return;
    }

    if (!selectedWilaya) {
      Alert.alert('Wilaya requise', 'Veuillez sélectionner votre wilaya de livraison.');
      return;
    }

    if (deliveryType === 'home') {
      if (!selectedCommune) {
        Alert.alert('Commune requise', 'Veuillez choisir votre commune de livraison.');
        return;
      }
      if (!address.trim()) {
        Alert.alert('Adresse requise', 'Veuillez préciser votre adresse exacte de livraison.');
        return;
      }
    } else {
      if (!selectedStopDesk && filteredStopDesks.length > 0) {
        Alert.alert('Point Relais requis', 'Veuillez sélectionner votre bureau de retrait Stop Desk.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        customer_name: fullName.trim(),
        customer_email: profile?.email || user?.email || undefined,
        customer_phone: cleanPhone,
        wilaya: selectedWilaya.name,
        commune: deliveryType === 'home' ? (selectedCommune?.name || '') : (selectedStopDesk?.name || 'Point Relais'),
        address: deliveryType === 'home' ? address.trim() : (selectedStopDesk?.address || selectedStopDesk?.name || 'Bureau Stop Desk'),
        note: note.trim() || undefined,
        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          variation: item.variation,
        })),
        delivery_cost: deliveryCost,
        customer_user_id: user?.id || null,
        stop_desk: deliveryType === 'stopdesk',
        office_id: selectedStopDesk?.id || null,
        office_name: selectedStopDesk?.name || null,
      };

      const result = await createOrder(orderPayload);

      clearCart();
      navigation.replace('OrderSuccess', {
        orderId: result.order_id || result.id,
        customerName: fullName,
        phone: cleanPhone,
        totalAmount,
        deliveryCost,
        deliveryType,
        wilaya: selectedWilaya.name,
        commune: selectedCommune?.name || selectedStopDesk?.name || '',
      });
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Impossible de confirmer la commande.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top bar */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finaliser la commande</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Type de livraison */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Mode de livraison</Text>
          <View style={styles.deliveryTypeRow}>
            <TouchableOpacity
              style={[
                styles.deliveryOption,
                deliveryType === 'home' && styles.deliveryOptionActive,
              ]}
              onPress={() => setDeliveryType('home')}
            >
              <Ionicons 
                name="home-outline" 
                size={22} 
                color={deliveryType === 'home' ? COLORS.primary : COLORS.textMuted} 
              />
              <Text style={[styles.deliveryOptionTitle, deliveryType === 'home' && styles.deliveryOptionTitleActive]}>
                À Domicile
              </Text>
              <Text style={styles.deliveryOptionDesc}>Livré chez vous</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.deliveryOption,
                deliveryType === 'stopdesk' && styles.deliveryOptionActive,
              ]}
              onPress={() => setDeliveryType('stopdesk')}
            >
              <Ionicons 
                name="business-outline" 
                size={22} 
                color={deliveryType === 'stopdesk' ? COLORS.primary : COLORS.textMuted} 
              />
              <Text style={[styles.deliveryOptionTitle, deliveryType === 'stopdesk' && styles.deliveryOptionTitleActive]}>
                Point Relais
              </Text>
              <Text style={styles.deliveryOptionDesc}>Stop Desk agence</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Coordonnées */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Coordonnées du destinataire</Text>

          <Text style={styles.fieldLabel}>Nom & Prénom *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Mohamed Benali"
            placeholderTextColor={COLORS.textMuted}
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.fieldLabel}>Numéro de téléphone *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 0550 12 34 56"
            placeholderTextColor={COLORS.textMuted}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        {/* Adresse et Wilaya */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Adresse de livraison</Text>

          {/* Sélecteur Wilaya */}
          <Text style={styles.fieldLabel}>Wilaya *</Text>
          <TouchableOpacity
            style={styles.selectInput}
            onPress={() => {
              setSearchModalText('');
              setShowWilayaModal(true);
            }}
          >
            <Text style={selectedWilaya ? styles.selectTextSelected : styles.selectTextPlaceholder}>
              {selectedWilaya ? `${selectedWilaya.number}. ${selectedWilaya.name}` : 'Choisir votre wilaya (58 wilayas)'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>

          {/* Sélecteur Commune (si livraison à domicile) */}
          {deliveryType === 'home' && (
            <>
              <Text style={styles.fieldLabel}>Commune *</Text>
              <TouchableOpacity
                style={[styles.selectInput, !selectedWilaya && styles.selectDisabled]}
                disabled={!selectedWilaya}
                onPress={() => {
                  setSearchModalText('');
                  setShowCommuneModal(true);
                }}
              >
                <Text style={selectedCommune ? styles.selectTextSelected : styles.selectTextPlaceholder}>
                  {selectedCommune ? selectedCommune.name : 'Sélectionner la commune'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>

              <Text style={styles.fieldLabel}>Adresse exacte *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Numéro de rue, quartier, bâtiment..."
                placeholderTextColor={COLORS.textMuted}
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={2}
              />
            </>
          )}

          {/* Sélecteur Stop Desk (si point relais) */}
          {deliveryType === 'stopdesk' && (
            <>
              <Text style={styles.fieldLabel}>Bureau de retrait / Agence Stop Desk *</Text>
              <TouchableOpacity
                style={[styles.selectInput, !selectedWilaya && styles.selectDisabled]}
                disabled={!selectedWilaya}
                onPress={() => {
                  setSearchModalText('');
                  setShowStopDeskModal(true);
                }}
              >
                <Text style={selectedStopDesk ? styles.selectTextSelected : styles.selectTextPlaceholder}>
                  {selectedStopDesk ? selectedStopDesk.name : 'Choisir une agence relais'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
              {selectedStopDesk?.address && (
                <Text style={styles.stopDeskAddress}>{selectedStopDesk.address}</Text>
              )}
            </>
          )}

          <Text style={styles.fieldLabel}>Note pour le livreur (Optionnel)</Text>
          <TextInput
            style={styles.input}
            placeholder="Instructions particulières..."
            placeholderTextColor={COLORS.textMuted}
            value={note}
            onChangeText={setNote}
          />
        </View>

        {/* Mode de paiement */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Mode de paiement</Text>
          <View style={styles.codBox}>
            <View style={styles.codIconCircle}>
              <Ionicons name="cash-outline" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.codTextContainer}>
              <Text style={styles.codTitle}>Paiement à la livraison (COD)</Text>
              <Text style={styles.codDesc}>
                Vous réglez en espèces au livreur lors de la remise en main propre de votre colis.
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
          </View>
        </View>

        {/* Récapitulatif financier */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Récapitulatif de la commande</Text>
          <View style={styles.summaryLine}>
            <Text style={styles.summaryText}>Sous-total ({items.length} articles)</Text>
            <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
          </View>
          <View style={styles.summaryLine}>
            <Text style={styles.summaryText}>Frais de livraison ({selectedWilaya ? selectedWilaya.name : 'Wilaya'})</Text>
            <Text style={[styles.summaryValue, isFreeShipping && styles.freeShippingText]}>
              {isFreeShipping ? 'GRATUITE' : formatPrice(deliveryCost)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalLine}>
            <Text style={styles.totalText}>Total à payer à la livraison</Text>
            <Text style={styles.totalValue}>{formatPrice(totalAmount)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bouton de confirmation en bas */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.confirmButton, isSubmitting && styles.buttonDisabled]}
          onPress={handleSubmitOrder}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.confirmButtonText}>
                Confirmer la commande • {formatPrice(totalAmount)}
              </Text>
              <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal Wilayas */}
      <Modal visible={showWilayaModal} animationType="slide">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeading}>Choisir une Wilaya</Text>
            <TouchableOpacity onPress={() => setShowWilayaModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.modalSearch}
            placeholder="Rechercher une wilaya..."
            value={searchModalText}
            onChangeText={setSearchModalText}
          />
          <FlatList
            data={wilayas.filter((w) =>
              w.name.toLowerCase().includes(searchModalText.toLowerCase()) ||
              String(w.number).includes(searchModalText)
            )}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setSelectedWilaya(item);
                  setSelectedCommune(null);
                  setSelectedStopDesk(null);
                  setShowWilayaModal(false);
                }}
              >
                <Text style={styles.modalItemNumber}>{item.number}</Text>
                <Text style={styles.modalItemText}>{item.name}</Text>
                <Text style={styles.modalItemFee}>
                  {deliveryType === 'stopdesk' 
                    ? formatPrice(item.stop_desk_fee || Math.max(300, item.shipping_fee - 200))
                    : formatPrice(item.shipping_fee)}
                </Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>

      {/* Modal Communes */}
      <Modal visible={showCommuneModal} animationType="slide">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeading}>Choisir une Commune</Text>
            <TouchableOpacity onPress={() => setShowCommuneModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.modalSearch}
            placeholder="Rechercher une commune..."
            value={searchModalText}
            onChangeText={setSearchModalText}
          />
          <FlatList
            data={filteredCommunes.filter((c) =>
              c.name.toLowerCase().includes(searchModalText.toLowerCase())
            )}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setSelectedCommune(item);
                  setShowCommuneModal(false);
                }}
              >
                <Text style={styles.modalItemText}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>

      {/* Modal Stop Desks */}
      <Modal visible={showStopDeskModal} animationType="slide">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeading}>Choisir un Point Relais</Text>
            <TouchableOpacity onPress={() => setShowStopDeskModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={filteredStopDesks}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setSelectedStopDesk(item);
                  setShowStopDeskModal(false);
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalItemText}>{item.name}</Text>
                  {item.address && (
                    <Text style={styles.modalItemSubtext}>{item.address}</Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
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
    paddingBottom: 110,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  deliveryTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deliveryOption: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
    backgroundColor: COLORS.background,
  },
  deliveryOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  deliveryOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  deliveryOptionTitleActive: {
    color: COLORS.primary,
  },
  deliveryOptionDesc: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 14,
    color: COLORS.text,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md - 2,
  },
  selectDisabled: {
    opacity: 0.5,
  },
  selectTextSelected: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  selectTextPlaceholder: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  stopDeskAddress: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  codBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  codIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codTextContainer: {
    flex: 1,
    marginHorizontal: SPACING.sm,
  },
  codTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  codDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  summaryText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  freeShippingText: {
    color: COLORS.success,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.sm,
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.primary,
  },
  bottomBar: {
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
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 15,
    marginRight: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  modalSafe: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalSearch: {
    margin: SPACING.md,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 14,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalItemNumber: {
    width: 28,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  modalItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalItemSubtext: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  modalItemFee: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
});
