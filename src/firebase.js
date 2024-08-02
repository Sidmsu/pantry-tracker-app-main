import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDhIAwUSIs9gmL45lJWDkYY9zKfVgtn6m0",
    authDomain: "pantry-track-b875c.firebaseapp.com",
    projectId: "pantry-track-b875c",
    storageBucket: "pantry-track-b875c.appspot.com",
    messagingSenderId: "583668338356",
    appId: "1:583668338356:web:a24e5da9dd7841e83451e1"
};
  

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { firestore, auth, provider, signInWithPopup, signOut };