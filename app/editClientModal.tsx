import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useAuth } from './_contexts/AuthContext';
import { db } from '../constants/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { FontAwesome } from '@expo/vector-icons';

export default function EditClientModal() {
  const router = useRouter();
  const { user } = useAuth();
  // Pega os parâmetros passados da tela de detalhes
  const params = useLocalSearchParams<{
    clientId: string;
    currentName: string;
    currentEmail: string;
    currentPhone: string;
  }>();

  // Inicializa o estado com os dados atuais do cliente
  const [name, setName] = useState(params.currentName || '');
  const [email, setEmail] = useState(params.currentEmail || '');
  const [phone, setPhone] = useState(params.currentPhone || '');
  const [loading, setLoading] = useState(false);

  // Função para salvar as alterações
  const handleUpdateClient = async () => {
    if (!user || !params.clientId) {
      Alert.alert('Erro', 'Não foi possível identificar o usuário ou cliente.');
      return;
    }
    if (!name) {
      Alert.alert('Campo Obrigatório', 'Por favor, insira o nome do cliente.');
      return;
    }

    setLoading(true);

    try {
      // Referência ao documento do cliente
      const clientRef = doc(db, 'users', user.uid, 'clients', params.clientId);

      // Atualiza o documento com os novos dados
      await updateDoc(clientRef, {
        name: name,
        email: email,
        phone: phone,
      });

      setLoading(false);
      Alert.alert('Sucesso', 'Cliente atualizado.');
      router.back(); // Fecha o modal
    } catch (error) {
      console.error('Erro ao atualizar cliente: ', error);
      setLoading(false);
      Alert.alert('Erro', 'Não foi possível atualizar os dados do cliente.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Configura o cabeçalho do Modal */}
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Editar Cliente',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <FontAwesome name="close" size={24} color="#007bff" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleUpdateClient} style={{ marginRight: 15 }} disabled={loading}>
              <FontAwesome name="check" size={24} color="#007bff" />
            </TouchableOpacity>
          ),
        }}
      />
      
      <View style={styles.container}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#007bff" />
          </View>
        )}

        <View style={styles.inputGroup}>
          <FontAwesome name="user" size={20} color="#888" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Nome do Cliente (Obrigatório)"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputGroup}>
          <FontAwesome name="envelope" size={20} color="#888" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="E-mail (Opcional)"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <FontAwesome name="phone" size={20} color="#888" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Telefone (Opcional)"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleUpdateClient} disabled={loading}>
          <Text style={styles.saveButtonText}>Salvar Alterações</Text>
        </TouchableOpacity>
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
    padding: 20,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});