import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    where 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAsq3MTihZj0jcqIEtnmR4s3iZDDkHyr0s",
    authDomain: "database-3639e.firebaseapp.com",
    projectId: "database-3639e",
    storageBucket: "database-3639e.appspot.com",
    messagingSenderId: "1085430135818",
    appId: "1:1085430135818:web:4fdd71b4b38e0979f1f3f3",
    measurementId: "G-JC8FX10B81"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Enable phone auth in your Firebase Console
// Also add your domain in authorized domains

export { 
    auth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    db,
    collection,
    addDoc,
    getDocs,
    query,
    where
}; 