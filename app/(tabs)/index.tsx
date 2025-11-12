import React from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../_contexts/AuthContext'; // Ajuste o caminho se necessário

export default function HomeScreen() {
  // Pega o usuário, o status de loading e a função signOut do contexto
  const { user, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    // O _layout.tsx cuidará do redirecionamento para a tela de login
  };

  // Mostra um spinner enquanto o contexto de auth está carregando
  if (loading) {
    return (
      <View style={styles.spinnerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Bem-vindo(a), {user?.displayName || user?.email}!
      </Text>
      <Text style={styles.subtitle}>
        Esta é a sua tela principal.
      </Text>
      
      <Button 
        title="Sair" 
        onPress={handleSignOut} 
        color="#e74c3c" // Um vermelho para o botão de sair
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  spinnerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
});