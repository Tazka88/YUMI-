import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getUserOrders, formatPrice } from '../services/api';
import { Order } from '../types';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { Badge } from '../components/Badge';

export const OrdersScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    try {
      const data = await getUserOrders(user.id);
      setOrders(data);
    } catch (err) {
      console.warn('Error fetching orders:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
      case 'livré':
      case 'livree':
        return <Badge label="Livrée" variant="success" />;
      case 'shipped':
      case 'en livraison':
      case 'expédié':
        return <Badge label="En livraison" variant="primary" />;
      case 'confirmed':
      case 'confirmé':
      case 'confirmee':
        return <Badge label="Confirmée" variant="warning" />;
      case 'cancelled':
      case 'annulé':
      case 'annulee':
        return <Badge label="Annulée" variant="danger" />;
      case 'pending':
      default:
        return <Badge label="En attente" variant="neutral" />;
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Ionicons name="lock-closed-outline" size={56} color={COLORS.textMuted} />
        <Text style={styles.loginPromptTitle}>Connexion requise</Text>
        <Text style={styles.loginPromptText}>
          Veuillez vous connecter pour voir l'historique et le suivi de vos commandes.
        </Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginButtonText}>Se connecter</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Commandes</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="cube-outline" size={60} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>Aucune commande trouvée</Text>
          <Text style={styles.emptySubtitle}>
            Vous n'avez pas encore passé de commande avec ce compte.
          </Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => navigation.navigate('HomeTabs', { screen: 'Catalog' })}
          >
            <Text style={styles.shopButtonText}>Commencer vos achats</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.orderCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('OrderDetail', { order: item })}
            >
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.orderNumber}>
                    Commande #{item.order_id || item.id}
                  </Text>
                  <Text style={styles.orderDate}>
                    {new Date(item.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                {getStatusBadge(item.status)}
              </View>

              <View style={styles.divider} />

              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.infoText}>
                    {item.shipping_wilaya} {item.shipping_commune ? `- ${item.shipping_commune}` : ''}
                  </Text>
                </View>

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total :</Text>
                  <Text style={styles.totalPrice}>{formatPrice(item.total_amount)}</Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.white,
  },
  loginPromptTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  loginPromptText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xs,
    lineHeight: 18,
  },
  loginButton: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  loginButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
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
  shopButton: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  shopButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  listContent: {
    padding: SPACING.md,
  },
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  orderDate: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.sm,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginRight: 4,
  },
  totalPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
});
