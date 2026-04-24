import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use initializeFirestore to set settings like long polling which helps with connectivity issues
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()}),
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

// CRITICAL: Validate connection to Firestore on initialization
async function testConnection() {
  try {
    // Attempting to fetch a non-existent document from the server to check connectivity
    await getDocFromServer(doc(db, '___system___', 'connectivity_check'));
    console.log("Firestore connection successful");
  } catch (error) {
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('unavailable'))) {
      console.warn("Firestore might be offline or unreachable. The app will operate in offline mode.");
    }
  }
}

testConnection();
