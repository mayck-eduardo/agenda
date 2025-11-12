import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useAuth } from './_contexts/AuthContext'; // Ajuste o caminho
import { db } from '../constants/firebaseConfig'; // Ajuste o caminho
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  onSnapshot,
  orderBy,
  DocumentData,
} from 'firebase/firestore';
import { useRouter, useLocalSearchParams } from 'expo-router';
// Importa o Picker
import { Picker } from '@react-native-picker/picker';

// Interface para Clientes (para o Picker)
interface Client {
  id: string;
  name: string;
}

export default function AppointmentModal() {
  const { user } = useAuth();
  const router = useRouter(); // Para fechar o modal
  
  // Pega o parâmetro 'selectedDate' que foi passado pela tela de agenda
  const { selectedDate } = useLocalSearchParams<{ selectedDate: string }>();

  // Estado para o formulário
  const [time, setTime] = useState(''); // Ex: "09:00"
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>();
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Estado para a lista de clientes (para o Picker)
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);

  // Efeito para buscar os clientes do usuário e popular o Picker
  useEffect(() => {
    if (!user) return;

    setLoadingClients(true);
    const clientsRef = collection(db, 'users', user.uid, 'clients');
    const q = query(clientsRef, orderBy('name'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const clientsData: Client[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as DocumentData;
        clientsData.push({
          id: doc.id,
          name: data.name || 'Nome não definido',
        });
      });
      setClients(clientsData);
      setLoadingClients(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Função para salvar o agendamento
  const handleSaveAppointment = async () => {
    if (!user) {
      Alert.alert('Erro', 'Você não está logado.');
      return;
    }

    // Validação simples
    if (!selectedDate || !time || !selectedClientId) {
      Alert.alert(
        'Atenção',
        'Por favor, preencha a hora e selecione um cliente.'
      );
      return;
    }

    // Formata a hora (garante HH:MM)
    const formattedTime = time.replace(/[^0-9:]/g, '');
    if (!/^\d{2}:\d{2}$/.test(formattedTime)) {
        Alert.alert('Atenção', 'Por favor, insira a hora no formato HH:MM (ex: 09:00).');
        return;
    }

    setLoading(true);

    try {
      // Referência para a subcoleção 'appointments'
      const appointmentsRef = collection(db, 'users', user.uid, 'appointments');

      // Pega o nome do cliente selecionado (para salvar junto)
      const clientName = clients.find(c => c.id === selectedClientId)?.name || 'Cliente';

      // Adiciona o novo documento
      await addDoc(appointmentsRef, {
        date: selectedDate, // A data que recebemos
        time: formattedTime, // A hora do formulário
        clientId: selectedClientId,
        clientName: clientName, // Salva o nome para fácil exibição
        notes: notes.trim(),
        createdAt: serverTimestamp(),
      });

      setLoading(false);
      router.back(); // Fecha o modal
    } catch (error) {
      console.error('Erro ao salvar agendamento: ', error);
      Alert.alert('Erro', 'Não foi possível salvar o agendamento.');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* O Stack.Screen no _layout já fornece o título "Novo Horário" */}

        <View style={styles.form}>
          <Text style={styles.dateInfo}>
            Agendando para:{' '}
            <Text style={styles.dateInfoBold}>
              {new Date(selectedDate + 'T00:00:00-03:00').toLocaleDateString(
                'pt-br',
                { day: '2-digit', month: 'long', year: 'numeric' }
              )}
            </Text>
          </Text>

          <Text style={styles.label}>Hora (HH:MM)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 09:00"
            value={time}
            onChangeText={setTime}
            keyboardType="numeric"
            maxLength={5}
          />

          <Text style={styles.label}>Cliente</Text>
          {loadingClients ? (
            <ActivityIndicator />
          ) : (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedClientId}
                onValueChange={(itemValue) => setSelectedClientId(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="-- Selecione um cliente --" value={undefined} />
                {clients.map((client) => (
                  <Picker.Item
                    key={client.id}
                    label={client.name}
                    value={client.id}
                  />
                ))}
              </Picker>
            </View>
          )}

          <Text style={styles.label}>Anotações (Opcional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Observações sobre a consulta..."
            value={notes}
            onChangeText={setNotes}
            multiline={true}
            numberOfLines={4}
          />

          {/* Botão de Salvar */}
          {loading ? (
            <ActivityIndicator size="large" color="#007bff" style={styles.spinner} />
          ) : (
            <Button
              title="Salvar Agendamento"
              onPress={handleSaveAppointment}
              disabled={loading || loadingClients}
            />
          )}
        </View>
      </ScrollView>
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
  form: {
    padding: 20,
  },
  dateInfo: {
    fontSize: 18,
    color: '#333',
    marginBottom: 25,
    textAlign: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderColor: '#eee',
    borderWidth: 1,
  },
  dateInfoBold: {
    fontWeight: 'bold',
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
  textArea: {
    height: 100,
    textAlignVertical: 'top', // Para Android
    paddingTop: 15, // Para iOS
  },
  pickerContainer: {
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50, // No iOS pode precisar de ajuste de altura diferente
    width: '100%',
  },
  spinner: {
    marginTop: 20,
  },
});