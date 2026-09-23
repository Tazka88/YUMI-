import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, profile, signOut, deleteAccount } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se déconnecter', style: 'destructive', onPress: () => signOut() },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer mon compte',
      'Attention : cette action est irréversible. Toutes vos données personnelles seront définitivement effacées conformément aux règlements de Google Play et de protection de la vie privée.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer définitivement',
          style: 'destructive',
          onPress: async () => {
            const res = await deleteAccount();
            if (res.success) {
              Alert.alert('Compte supprimé', 'Votre compte a été supprimé avec succès.');
            } else {
              Alert.alert('Erreur', res.error || 'Échec de la suppression du compte.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Mon Compte</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {user ? (
          /* Utilisateur Connecté */
          <>
            <View style={styles.userCard}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {(profile?.first_name || user.email || 'Z').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'Client ZORANDO'}
                </Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                {profile?.phone && (
                  <Text style={styles.userPhone}>{profile.phone}</Text>
                )}
                {profile?.wilaya && (
                  <View style={styles.wilayaBadge}>
                    <Ionicons name="location-outline" size={12} color={COLORS.primary} />
                    <Text style={styles.wilayaBadgeText}>{profile.wilaya}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Menu Commandes */}
            <View style={styles.menuSection}>
              <Text style={styles.sectionHeading}>Mes Achats</Text>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate('Orders')}
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name="cube-outline" size={22} color={COLORS.primary} />
                  <Text style={styles.menuItemTitle}>Historique des commandes</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* Visiteur non connecté */
          <View style={styles.guestCard}>
            <View style={styles.guestIconCircle}>
              <Ionicons name="person-circle-outline" size={64} color={COLORS.primary} />
            </View>
            <Text style={styles.guestTitle}>Bienvenue sur ZORANDO</Text>
            <Text style={styles.guestSubtitle}>
              Connectez-vous pour suivre l'état de vos commandes et enregistrer votre adresse de livraison.
            </Text>
            <View style={styles.authButtonsRow}>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.loginButtonText}>Se connecter</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.registerButton}
                onPress={() => navigation.navigate('Register')}
              >
                <Text style={styles.registerButtonText}>Créer un compte</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Section Aide et Informations */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionHeading}>Informations & Support</Text>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.textSecondary} />
              <Text style={styles.menuItemTitle}>Garantie et Authenticité</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="car-outline" size={20} color={COLORS.textSecondary} />
              <Text style={styles.menuItemTitle}>Livraison dans 58 Wilayas</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="document-text-outline" size={20} color={COLORS.textSecondary} />
              <Text style={styles.menuItemTitle}>Politique de confidentialité</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="call-outline" size={20} color={COLORS.textSecondary} />
              <Text style={styles.menuItemTitle}>Service Client & Contact</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Actions du compte connecté */}
        {user && (
          <View style={styles.accountActionsSection}>
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
              <Text style={styles.signOutText}>Se déconnecter</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
              <Ionicons name="trash-outline" size={18} color={COLORS.textMuted} />
              <Text style={styles.deleteText}>Supprimer définitivement mon compte</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>ZORANDO Mobile v1.0.0 (Android & iOS)</Text>
          <Text style={styles.copyrightText}>© 2026 ZORANDO. Tous droits réservés.</Text>
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
  headerRow: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxxl,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.white,
  },
  userInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  userPhone: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  wilayaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    marginTop: 6,
  },
  wilayaBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 3,
  },
  guestCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  guestIconCircle: {
    marginBottom: SPACING.sm,
  },
  guestTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  guestSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
    lineHeight: 18,
  },
  authButtonsRow: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
    width: '100%',
  },
  loginButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginRight: SPACING.xs,
  },
  loginButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  registerButton: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginLeft: SPACING.xs,
  },
  registerButtonText: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 14,
  },
  menuSection: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: SPACING.md,
  },
  accountActionsSection: {
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.dangerLight,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    width: '100%',
    marginBottom: SPACING.md,
  },
  signOutText: {
    color: COLORS.danger,
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
  },
  deleteText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginLeft: 6,
    textDecorationLine: 'underline',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  versionText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  copyrightText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
