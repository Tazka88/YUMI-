import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// CRITICAL: Validate connection to Firestore on initialization
async function testConnection() {
  try {
    // Attempting to fetch a non-existent document to check connectivity
    await getDocFromServer(doc(db, '___system___', 'connectivity_check'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Firebase is offline. Please check your configuration and network.");
    }
  }
}

testConnection();
