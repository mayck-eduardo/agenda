import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../_contexts/AuthContext';
import { db } from '../../constants/firebaseConfig';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  DocumentData,
} from 'firebase/firestore';
import { FontAwesome } from '@expo/vector-icons';

// Interface para os dados do Cliente
interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

// Interface para Agendamentos (igual à da tela de agenda)
interface Appointment {
  id: string;
  date: string;
  time: string;
  notes?: string;
}

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); // Pega o ID da URL
  const { user } = useAuth();
  const router = useRouter();

  const [client, setClient] = useState<Client | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Efeito 1: Busca os dados do cliente específico
  useEffect(() => {
    if (!user || !id) return;

    setLoading(true);
    const clientRef = doc(db, 'users', user.uid, 'clients', id);

    const fetchClientData = async () => {
      try {
        const docSnap = await getDoc(clientRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as DocumentData;
          setClient({
            id: docSnap.id,
            name: data.name || 'Cliente sem nome',
            phone: data.phone || '',
            email: data.email || '',
          });
        } else {
          Alert.alert('Erro', 'Cliente não encontrado.');
          router.back();
        }
      } catch (error) {
        console.error('Erro ao buscar cliente:', error);
        Alert.alert('Erro', 'Não foi possível carregar os dados do cliente.');
      }
    };

    fetchClientData();
  }, [user, id]);

  // Efeito 2: Busca o histórico de agendamentos DESSE cliente
  useEffect(() => {
    if (!user || !id) return;

    const appointmentsRef = collection(db, 'users', user.uid, 'appointments');
    
    // Query: filtra por clientId E ordena por data (mais recentes primeiro)
    const q = query(
      appointmentsRef,
      where('clientId', '==', id),
      orderBy('date', 'desc') // Mais recentes primeiro
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const apptData: Appointment[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as DocumentData;
          apptData.push({
            id: doc.id,
            date: data.date,
            time: data.time,
            notes: data.notes || '',
          });
        });
        setAppointments(apptData);
        setLoading(false); // Só para o loading quando os agendamentos tb chegam
      },
      (error) => {
        // Erro de índice: O Firestore pode exigir um índice para esta query
        if (error.code === 'failed-precondition') {
           Alert.alert(
            "Configuração Necessária",
            "Esta consulta requer um índice do Firestore. Por favor, crie o índice no seu Console do Firebase. (clients/appointments: clientId (asc), date (desc))"
          );
        } else {
          console.error('Erro ao buscar agendamentos:', error);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, id]);

  // Renderiza cada agendamento
  const renderAppointmentItem = ({ item }: { item: Appointment }) => {
    const formattedDate = new Date(item.date + 'T00:00:00-03:00').toLocaleDateString('pt-br', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
    return (
      <View style={styles.appointmentItem}>
        <View style={styles.appointmentDate}>
           <FontAwesome name="calendar" size={16} color="#007bff" />
           <Text style={styles.appointmentDateText}>{formattedDate}</Text>
        </View>
        <Text style={styles.appointmentTime}>{item.time}</Text>
        {item.notes && <Text style={styles.appointmentNotes}>{item.notes}</Text>}
      </View>
    );
  };

  if (loading || !client) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Define o título da página dinamicamente */}
      <Stack.Screen
        options={{
          headerShown: true,
          title: client.name, // O título da página será o nome do cliente
          headerBackTitleVisible: false, // Opcional: esconde o "Voltar" no iOS
        }}
      />
      <FlatList
        data={appointments}
        renderItem={renderAppointmentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          // Cabeçalho da Lista: Mostra os dados do cliente
          <View style={styles.header}>
            <View style={styles.clientIcon}>
              <FontAwesome name="user-circle" size={50} color="#007bff" />
            </View>
            <Text style={styles.clientName}>{client.name}</Text>
            
            {client.phone ? (
              <View style={styles.infoRow}>
                <FontAwesome name="phone" size={18} color="#555" />
                <Text style={styles.infoText}>{client.phone}</Text>
              </View>
            ) : null}
            
            {client.email ? (
              <View style={styles.infoRow}>
                <FontAwesome name="envelope" size={18} color="#555" />
                <Text style={styles.infoText}>{client.email}</Text>
              </View>
            ) : null}

            <Text style={styles.historyTitle}>Histórico de Agendamentos</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Nenhum agendamento encontrado para este cliente.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
    marginBottom: 10,
  },
  clientIcon: {
    marginBottom: 10,
  },
  clientName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  infoText: {
    fontSize: 16,
    color: '#555',
    marginLeft: 10,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    alignSelf: 'flex-start',
  },
  appointmentItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  appointmentDate: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  appointmentDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  appointmentTime: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 5,
    marginLeft: 24, // Alinha com o texto da data
  },
  appointmentNotes: {
    fontSize: 14,
    color: '#777',
    marginLeft: 24, // Alinha com o texto da data
    fontStyle: 'italic',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#777',
  },
});