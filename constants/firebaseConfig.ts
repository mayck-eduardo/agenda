// Importe as funções necessárias do SDK do Firebase
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// Adicione outros serviços que formos usar no futuro, como o Storage
// import { getStorage } from "firebase/storage";

// TODO: Cole aqui a configuração do seu app Firebase
// Você obtém isso no Console do Firebase > Configurações do Projeto > Seus apps
const firebaseConfig = {
  apiKey: "AIzaSyCwCTsTwjExVqSto393cW7zWuQcPnq8oN0",

  authDomain: "appagenda-192d7.firebaseapp.com",

  projectId: "appagenda-192d7",

  storageBucket: "appagenda-192d7.firebasestorage.app",

  messagingSenderId: "1010562211811",

  appId: "1:1010562211811:web:814084fc5a204037f64ad6",

  measurementId: "G-1BBB6X0TPJ"

};

// Inicialize o Firebase
const app = initializeApp(firebaseConfig);

// Exporte os serviços do Firebase que vamos usar no app
// Isso é ótimo, pois importaremos 'auth' e 'db' de um único lugar
export const auth = getAuth(app);
export const db = getFirestore(app);

// Exporte o 'app' se precisar dele em outro lugar (raro)
export default app;