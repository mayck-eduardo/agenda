import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  User,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword, // Importa a função de login com email/senha
  createUserWithEmailAndPassword, // Importa a função de cadastro
} from 'firebase/auth';
// Importações do React Native necessárias para os tipos de erro
import { Alert } from 'react-native';
import { FirebaseError } from 'firebase/app'; // Para tipar o erro

// Corrigindo o caminho de importação (deve estar em /constants, não /_contexts)
import { auth, db } from '../../constants/firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// 1. Definimos o tipo do que nosso Contexto vai fornecer
interface AuthContextType {
  user: User | null;
  loading: boolean;
  // Nossas novas funções de autenticação
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// 2. Criamos o Contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Criamos o Provedor (Componente que envolve o app)
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Efeito para ouvir mudanças no estado de autenticação do Firebase
  // Isso mantém o usuário logado mesmo se fechar e abrir o app
  // Funciona para QUALQUER método de login (Google, Senha, etc)
  useEffect(() => {
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (authenticatedUser) => {
      if (authenticatedUser) {
        // Usuário está logado
        // Sincroniza dados (garante que está no firestore)
        await syncUserWithFirestore(authenticatedUser);
        setUser(authenticatedUser);
      } else {
        // Usuário está deslogado
        setUser(null);
      }
      setLoading(false);
    });

    // Limpa o listener ao desmontar o componente
    return () => unsubscribe();
  }, []);

  // Função para salvar/atualizar o usuário no Firestore
  // Modificada para aceitar dados extras no cadastro
  const syncUserWithFirestore = async (
    firebaseUser: User,
    additionalData: { displayName?: string } = {}
  ) => {
    if (!firebaseUser) return;

    // Salva na coleção 'users'
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Se o usuário não existe no Firestore, cria um novo documento
      const { uid, email, photoURL } = firebaseUser;
      const displayName =
        additionalData.displayName || firebaseUser.displayName || 'Usuário';

      try {
        await setDoc(userRef, {
          uid,
          email,
          displayName,
          photoURL,
          createdAt: new Date(),
        });
      } catch (error) {
        console.error('Erro ao salvar usuário no Firestore:', error);
      }
    }
    // Se já existe, não faz nada
  };

  // Função de SignIn (chamada pela tela de login)
  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    try {
      // Tenta fazer login com email e senha
      await signInWithEmailAndPassword(auth, email, pass);
      // O 'onAuthStateChanged' acima cuidará de atualizar o estado 'user'
    } catch (error) {
      console.error('Erro no signIn:', error);
      const fbError = error as FirebaseError;
      // Mostra um alerta amigável
      if (
        fbError.code === 'auth/user-not-found' ||
        fbError.code === 'auth/wrong-password' ||
        fbError.code === 'auth/invalid-credential'
      ) {
        Alert.alert('Erro', 'Email ou senha inválidos.');
      } else {
        Alert.alert('Erro', 'Não foi possível fazer login.');
      }
      setLoading(false); // Garante que o loading para em caso de erro
    }
  };

  // Função de SignUp (chamada pela tela de cadastro)
  const signUp = async (email: string, pass: string, name: string) => {
    setLoading(true);
    try {
      // 1. Cria o usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        pass
      );

      // 2. Sincroniza os dados (incluindo o nome) no Firestore
      if (userCredential.user) {
        await syncUserWithFirestore(userCredential.user, { displayName: name });
      }
      // O 'onAuthStateChanged' cuidará de atualizar o estado 'user'
    } catch (error) {
      console.error('Erro no signUp:', error);
      const fbError = error as FirebaseError;
      if (fbError.code === 'auth/email-already-in-use') {
        Alert.alert('Erro', 'Este email já está cadastrado.');
      } else if (fbError.code === 'auth/weak-password') {
        Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres.');
      } else {
        Alert.alert('Erro', 'Não foi possível criar a conta.');
      }
      setLoading(false); // Garante que o loading para em caso de erro
    }
  };

  // Função de SignOut
  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      // O 'onAuthStateChanged' vai detectar o signOut e atualizar o estado
    } catch (error) {
      console.error('Erro ao fazer signOut:', error);
      setLoading(false);
    }
  };

  // 4. Fornecemos os valores para os componentes filhos
  const value = {
    user,
    loading,
    signIn,
    signUp, // Adiciona a nova função
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 5. Criamos o Hook 'useAuth'
// Isso permite que qualquer componente acesse o contexto facilmente
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};