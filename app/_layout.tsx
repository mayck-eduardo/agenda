import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from './_contexts/AuthContext'; // Nosso context
import { View, ActivityIndicator } from 'react-native';

// Componente separado para a lógica de layout,
// pois ele precisa estar "dentro" do AuthProvider para usar o hook useAuth()
function RootLayoutNav() {
  const { user, loading } = useAuth(); // Pega o estado do nosso context
  const segments = useSegments(); // Pega os "segmentos" da rota (ex: ['(tabs)', 'home'])
  const router = useRouter(); // Permite navegar

  useEffect(() => {
    // Se estiver carregando, não faça nada (mostra o spinner)
    if (loading) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)'; // Estamos na tela de login?
    const inAppGroup = segments[0] === '(tabs)'; // Estamos dentro do app?

    if (user && !inAppGroup) {
      // Usuário está logado mas NÃO está no grupo (tabs)?
      // Mande ele para a home!
      router.replace('/(tabs)/'); // Redireciona para a home
    } else if (!user && !inAuthGroup) {
      // Usuário NÃO está logado e NÃO está na tela de login?
      // Mande ele para o login!
      router.replace('/'); // Redireciona para /index.tsx
    }
    
    // O Expo Router v3 tem uma forma mais nova de fazer isso com <Redirect />
    // mas esta lógica com useEffect é 100% robusta.

  }, [user, loading, segments, router]); // Re-execute se o usuário ou o loading mudar

  // Se estiver carregando a autenticação, mostre um spinner
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // <Slot /> renderiza a rota atual (seja index.tsx ou (tabs))
  return <Slot />;
}

// Este é o componente principal de layout
export default function RootLayout() {
  return (
    // 1. Envolvemos todo o app no AuthProvider
    <AuthProvider>
      {/* 2. Renderizamos o navegador que tem a lógica de guarda */}
      <RootLayoutNav />
    </AuthProvider>
  );
}