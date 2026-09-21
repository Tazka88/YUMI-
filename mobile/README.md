# Application Mobile ZORANDO (React Native + Expo + TypeScript)

Application mobile officielle pour la plateforme e-commerce **ZORANDO.com**, conçue pour **Google Play (Android)** et l'**App Store (iOS)**.

---

## 🌟 Points Clés de l'Architecture

- **100% Connectée au Backend Existant** : Aucune deuxième base de données, aucun système de stock parallèle. L'application utilise exactement les mêmes API, la même base PostgreSQL/Supabase, et les mêmes tables (`products`, `categories`, `brands`, `orders`, `profiles`, `wilayas`, etc.).
- **Spécialement Optimisée pour le Marché Algérien** :
  - **Paiement à la livraison (COD / Cash on Delivery)** en espèces.
  - **Livraison dans les 58 Wilayas** avec calcul automatique des frais.
  - Prise en charge des **communes** et des **bureaux Stop Desk / Points Relais**.
  - Règle de **livraison gratuite** (dès 10 000 DZD d'achats et 3 articles).
- **Conformité Règlements Google Play & App Store** :
  - Fonctionnalité obligatoire de **suppression définitive du compte** client (`POST /api/users/delete-account`).
  - Système natif de **Push Notifications** (`expo-notifications`).
  - Interface soignée aux couleurs de ZORANDO (Orange, Noir, Blanc).

---

## 📁 Structure du Projet Mobile

```
mobile/
├── assets/                    # Icônes de l'app, splash screen et notifications
├── src/
│   ├── components/            # Composants réutilisables
│   │   ├── Badge.tsx          # Badges statut et réductions
│   │   ├── BannerCarousel.tsx # Bannières promotionnelles défilantes
│   │   ├── BrandList.tsx      # Carrousel des marques officielles
│   │   ├── CategoryList.tsx   # Liste des catégories en bulles
│   │   ├── Header.tsx         # Barre de recherche et badge panier
│   │   └── ProductCard.tsx    # Carte produit (prix promo, note, stock, bouton panier)
│   ├── config/
│   │   └── api.ts             # Configuration URL de l'API ZORANDO & Supabase
│   ├── constants/
│   │   └── theme.ts           # Charte graphique ZORANDO (couleurs, espacements, rayons)
│   ├── context/
│   │   ├── AuthContext.tsx    # Authentification Supabase + session locale
│   │   └── CartContext.tsx    # Gestion du panier avec persistance AsyncStorage
│   ├── navigation/
│   │   ├── RootNavigator.tsx  # Stack principale (détails, checkout, commande)
│   │   └── TabNavigator.tsx   # Navigation 5 onglets (Accueil, Catalogue, Panier, Commandes, Compte)
│   ├── screens/
│   │   ├── HomeScreen.tsx           # Page d'accueil avec bannières, promos et nouveautés
│   │   ├── CatalogScreen.tsx        # Catalogue avec filtres (marques, catégories, tri)
│   │   ├── ProductDetailScreen.tsx  # Fiche produit, galerie, variations, avis
│   │   ├── CartScreen.tsx           # Panier et calcul de la livraison gratuite
│   │   ├── CheckoutScreen.tsx       # Formulaire COD (58 wilayas, communes, stop desk)
│   │   ├── OrderSuccessScreen.tsx   # Confirmation commande avec numéro et appel
│   │   ├── OrdersScreen.tsx         # Historique des commandes utilisateur
│   │   ├── OrderDetailScreen.tsx    # Détail d'une commande passée
│   │   ├── LoginScreen.tsx          # Connexion client
│   │   └── RegisterScreen.tsx       # Inscription client
│   ├── services/
│   │   ├── api.ts                   # Appels aux routes REST ZORANDO (/products, /orders...)
│   │   ├── supabase.ts              # Client Supabase avec AsyncStorage
│   │   └── pushNotifications.ts     # Enregistrement du token push notification
│   └── types/
│       └── index.ts                 # Types TypeScript (Product, Order, Wilaya...)
├── App.tsx                    # Entrée principale de l'application
├── app.json                   # Configuration Expo & package Android/iOS
├── package.json
└── tsconfig.json
```

---

## 🚀 Démarrage et Développement Local

### 1. Prérequis
- [Node.js](https://nodejs.org/) (version 18 ou supérieure)
- L'application **Expo Go** installée sur votre smartphone Android (disponible sur Google Play) ou iOS (App Store).

### 2. Installation des dépendances
Dans le répertoire `mobile/` :
```bash
cd mobile
npm install
```

### 3. Lancement du serveur de développement
```bash
npx expo start
```
- Scannez le QR Code affiché dans votre terminal avec l'application **Expo Go** pour tester l'application directement sur votre téléphone.

---

## 📦 Génération des Fichiers pour les Stores (EAS Build)

Pour générer un fichier **APK** (test direct sur téléphone) ou **AAB** (publication sur le Play Console) :

### 1. Installer la CLI EAS
```bash
npm install -g eas-cli
eas login
```

### 2. Configurer le projet EAS
```bash
eas build:configure
```

### 3. Générer un APK de test Android
```bash
eas build -p android --profile preview
```
Vous recevrez un lien de téléchargement direct pour installer l'APK sur n'importe quel smartphone Android.

### 4. Générer le fichier AAB (Android App Bundle) pour Google Play
```bash
eas build -p android --profile production
```
Le fichier `.aab` généré peut être téléversé directement sur la **Google Play Console** dans la section "Production" ou "Test fermé".

### 5. Générer pour Apple App Store (iOS)
```bash
eas build -p ios --profile production
```

---

## 🔔 Notifications Push

Le fichier `src/services/pushNotifications.ts` enregistre le token de notification de chaque appareil auprès du backend (`POST /api/mobile/push-token`).
Le backend stocke les tokens dans la table `push_tokens` pour vous permettre d'envoyer des notifications ciblées :
- Promotion exceptionnelle ou solde flash
- Alerte de changement de statut d'une commande (confirmée, en cours de livraison)

---

## 🛡️ Conformité Google Play (Suppression de Compte)

Conformément à la politique de Google Play en vigueur depuis 2023 :
- Dans l'onglet **Compte**, un bouton clair permet à l'utilisateur de demander la **suppression définitive** de son compte.
- L'API `POST /api/users/delete-account` supprime le profil de la base de données et anonymise les commandes pour préserver la comptabilité tout en respectant la vie privée.
