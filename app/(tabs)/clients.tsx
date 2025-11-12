import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Button, 
  StyleSheet, 
  ActivityIndicator,
  Alert
  // SafeAreaView removido daqui
} from 'react-native';
// Importação CORRETA do SafeAreaView
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../_contexts/AuthContext'; // Ajuste o caminho se necessário
import { db } from '../../constants/firebaseConfig'; // Ajuste o caminho se necessário
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'expo-router';

export default function AddClientModal() {
  const { user } = useAuth();
  const router = useRouter(); // Para fechar o modal
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSaveClient = async () => {
    if (!user) {
      Alert.alert("Erro", "Você não está logado.");
      return;
    }
    
    // Validação simples
    if (name.trim() === '') {
      Alert.alert("Atenção", "Por favor, preencha pelo menos o nome.");
      return;
    }

    setLoading(true);

    try {
      // Referência para a subcoleção 'clients' do usuário logado
      const clientsRef = collection(db, 'users', user.uid, 'clients');
      
      // Adiciona o novo documento
      await addDoc(clientsRef, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        createdAt: serverTimestamp(), // Adiciona data de criação
      });

      setLoading(false);
      router.back(); // Fecha o modal após o sucesso

    } catch (error) {
      console.error("Erro ao salvar cliente: ", error);
      Alert.alert("Erro", "Não foi possível salvar o cliente.");
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Novo Cliente</Text>
          {/* Botão para fechar o modal (funciona se for stack modal) */}
          <Button title="Cancelar" onPress={() => router.back()} color="#e74c3c" />
        </View>
        
        <View style={styles.form}>
          <Text style={styles.label}>Nome Completo</Text>
          <TextInput
            style={styles.input}
            placeholder="Nome do cliente"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          
          <Text style={styles.label}>Email (Opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="email@exemplo.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <Text style={styles.label}>Telefone (Opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="(00) 99999-9999"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          {/* Botão de Salvar */}
          {loading ? (
            <ActivityIndicator size="large" color="#007bff" style={styles.spinner} />
          ) : (
            <Button 
              title="Salvar Cliente" 
              onPress={handleSaveClient} 
              disabled={loading}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  spinner: {
    marginTop: 20,
  }
});