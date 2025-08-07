// src/api/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = typeof __firebase_config !== 'undefined' 
    ? JSON.parse(__firebase_config)
    : {
        apiKey: "AIzaSyB59jgrSOfRf0D09D5TH-ivZXUGPbEQsRU",
        authDomain: "pg-bma.firebaseapp.com",
        projectId: "pg-bma",
        storageBucket: "pg-bma.firebasestorage.app",
        messagingSenderId: "363463917163",
        appId: "1:363463917163:web:c76de01c71fda0f986bb2e"
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'primejet-bma-dev';

export { auth, db, appId };