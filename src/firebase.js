// firebase.js

// Importa as funções que precisamos
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// 1. Importe a função getStorage
import { getStorage } from "firebase/storage";

// A configuração do seu app. Você copiou corretamente do Firebase.
const firebaseConfig = {
  apiKey: "AIzaSyBaKeS11TzvST_hy4bdSCh4eUlCAs0zxEY",
  authDomain: "olympus-crm-teste.firebaseapp.com",
  projectId: "olympus-crm-teste",
  storageBucket: "olympus-crm-teste.appspot.com", // Verifique se o ".appspot.com" está no final
  messagingSenderId: "1004859074248",
  appId: "1:1004859074248:web:397f22f0edaa57768d67fd",
  measurementId: "G-YN3MRB818H"
};

// Inicializa o Firebase com as suas chaves
const app = initializeApp(firebaseConfig);

// Inicializa e EXPORTA os serviços que vamos usar no resto da aplicação
export const auth = getAuth(app);      // Serviço de Autenticação
export const db = getFirestore(app);   // Serviço do Banco de Dados
// 2. Inicialize e exporte o Storage
export const storage = getStorage(app); // Serviço de Armazenamento de Arquivos
