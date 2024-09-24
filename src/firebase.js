import { initializeApp } from "firebase/app";
import {getFirestore} from "@firebase/firestore"
import { getAuth } from "firebase/auth";
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA44CAURxPGr4kYn2jrxqpZJy4PrCB8OLA",
  authDomain: "fir-login-343fc.firebaseapp.com",
  databaseURL: "https://fir-login-343fc-default-rtdb.firebaseio.com",
  projectId: "fir-login-343fc",
  storageBucket: "fir-login-343fc.appspot.com",
  messagingSenderId: "210013598411",
  appId: "1:210013598411:web:01090583d1cfb0a072214e"
};


const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

