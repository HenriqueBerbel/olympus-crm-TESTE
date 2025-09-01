import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// ===================================================================
// CONFIGURAÇÃO DO SEU PROJETO FIREBASE
// ===================================================================
const firebaseConfig = {
  apiKey: "AIzaSyAF00BlwzBxLqLETp6TV-4HrfWH3jumtYQ",
  authDomain: "olympus-crm-prod.firebaseapp.com",
  projectId: "olympus-crm-prod",
  storageBucket: "olympus-crm-prod.firebasestorage.app",
  messagingSenderId: "232578695156",
  appId: "1:232578695156:web:e4f671cfab6dd46c5943a1",
  measurementId: "G-KRPQQYB3XD"
};

// ===================================================================
// INICIALIZAÇÃO DOS SERVIÇOS
// ===================================================================

// Inicializa o app principal do Firebase
const app = initializeApp(firebaseConfig);

// Inicialização do App Check
// Esta é a forma mais robusta de garantir que o token de depuração
// seja usado apenas no ambiente de desenvolvimento local.
if (process.env.NODE_ENV !== 'production') {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6LcGlrMAAAAAImtF9OZ4ZgG18Dr0MG2S6EfQ7'),
  isTokenAutoRefreshEnabled: true
});

// ===================================================================
// EXPORTAÇÃO DOS SERVIÇOS PARA USO NO RESTANTE DA APLICAÇÃO
// ===================================================================

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
// Força a conexão com a região correta das suas funções
export const functions = getFunctions(app, 'us-central1');