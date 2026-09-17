import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore, persistentLocalCache, memoryLocalCache } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyDRJaQNX2qcCFsWcsOw8eICtEjmm49uWMA",
  authDomain: "beautymanager-saas.firebaseapp.com",
  projectId: "beautymanager-saas",
  storageBucket: "beautymanager-saas.firebasestorage.app",
  messagingSenderId: "19424492347",
  appId: "1:19424492347:web:a884e5c889c116414f151e",
  measurementId: "G-MZZRHDGNW4"
};

export const app = initializeApp(firebaseConfig);

// Configurar base de datos con Modo Sótano (Offline Persistence)
export const db = initializeFirestore(app, {
  localCache: Platform.OS === 'web' ? persistentLocalCache() : memoryLocalCache()
});

export const storage = getStorage(app);
