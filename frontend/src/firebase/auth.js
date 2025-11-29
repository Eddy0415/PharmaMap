import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "./firebase";

export const firebaseSignUp = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password);

export const firebaseSignIn = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const firebaseSignOut = () => signOut(auth);
