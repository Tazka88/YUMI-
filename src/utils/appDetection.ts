/**
 * Détection de l'application Android ZORANDO installée
 * Utilise l'API standard Web 'navigator.getInstalledRelatedApps()'
 * (prise en charge par Google Chrome sous Android et les navigateurs basés sur Chromium).
 */

export interface RelatedAppInfo {
  platform: string;
  id: string;
  url?: string;
  version?: string;
}

/**
 * Vérifie si le navigateur prend en charge l'API getInstalledRelatedApps.
 */
export function isAppDetectionSupported(): boolean {
  return typeof window !== 'undefined' && 'getInstalledRelatedApps' in navigator;
}

/**
 * Détecte si l'application officielle Android ZORANDO (com.zorando.app) est installée.
 * 
 * Prérequis pour renvoyer true :
 * 1. Le site est servi en HTTPS (https://www.zorando.com)
 * 2. public/manifest.json contient related_applications avec id: "com.zorando.app"
 * 3. public/.well-known/assetlinks.json liste les empreintes SHA-256 de l'app
 * 4. L'utilisateur navigue sur Chrome Android avec l'app installée
 */
export async function isZorandoAppInstalled(): Promise<boolean> {
  if (!isAppDetectionSupported()) {
    return false;
  }

  try {
    // navigator.getInstalledRelatedApps() est supporté sur Chromium / Chrome Android
    const nav = navigator as Navigator & {
      getInstalledRelatedApps?: () => Promise<RelatedAppInfo[]>;
    };

    if (!nav.getInstalledRelatedApps) {
      return false;
    }

    const relatedApps = await nav.getInstalledRelatedApps();
    
    return relatedApps.some(
      (app) => app.platform === 'play' && app.id === 'com.zorando.app'
    );
  } catch (err) {
    // Silencieux en production pour ne pas perturber l'expérience utilisateur
    console.debug('[Zorando AppDetection] Impossible de vérifier les applications associées:', err);
    return false;
  }
}
