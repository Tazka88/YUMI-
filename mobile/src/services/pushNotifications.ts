// Service de notifications adapte pour Expo Go (sans import de la bibliotheque native bloquee dans Expo Go)
export const setupPushNotifications = async (userId?: string): Promise<string | null> => {
  console.log('Push notifications: desactivees pour la session de test Expo Go');
  return null;
};
