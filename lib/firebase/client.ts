import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getDatabase, type Database } from 'firebase/database';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAHP6NXbXJbYq6kwMUzROjepw4zH2I0Qzc",
  authDomain: "dimsglowweb.firebaseapp.com",
  databaseURL: "https://dimsglowweb-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "dimsglowweb",
  storageBucket: "dimsglowweb.firebasestorage.app",
  messagingSenderId: "829941897975",
  appId: "1:829941897975:web:62abea2df44a8c485411f2",
  measurementId: "G-6WPDRKNY8D",
};

// Singleton initialization pattern for client browser
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const rtdb: Database = getDatabase(app);
const storage: FirebaseStorage = getStorage(app);

export { app, auth, db, rtdb, storage, firebaseConfig };
