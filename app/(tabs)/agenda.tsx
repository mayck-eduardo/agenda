import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert, // 1. Importa o Alert para a confirmação
} from 'react-native';
// Importação CORRETA do SafeAreaView
import { SafeAreaView } from 'react-native-safe-area-context';
// Importa o componente Calendário
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { FontAwesome } from '@expo/vector-icons';
// Caminho do contexto CORRIGIDO (era ../../)
import { useAuth } from '../_contexts/AuthContext';
import { db } from '../../constants/firebaseConfig'; // Este caminho está correto
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  DocumentData,
  deleteDoc, // 2. Importa a função de exclusão
  doc, // 3. Importa a referência do documento
} from 'firebase/firestore';
import { useRouter, useFocusEffect } from 'expo-router';

// Configuração do LocaleConfig (sem mudanças)
LocaleConfig.locales['pt-br'] = {
  monthNames: [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ],
  monthNamesShort: [
    'Jan.',
    'Fev.',
    'Mar.',
    'Abr.',
    'Mai.',
    'Jun.',
    'Jul.',
    'Ago.',
    'Set.',
    'Out.',
    'Nov.',
    'Dez.',
  ],
  dayNames: [
    'Domingo',
    'Segunda',
    'Terça',
    'Quarta',
    'Quinta',
    'Sexta',
    'Sábado',
  ],
  dayNamesShort: ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'],
  today: 'Hoje',
};
LocaleConfig.defaultLocale = 'pt-br';

// Interface para um dia marcado
interface MarkedDate {
  [date: string]: {
    marked?: boolean;
    dotColor?: string;
    activeOpacity?: number;
    selected?: boolean;
    selectedColor?: string;
    selectedTextColor?: string;
    disableTouchEvent?: boolean;
  };
}

// Interface para um Agendamento
interface Appointment {
  id: string;
  time: string;
  clientName: string;
  notes?: string;
}

export default function AgendaScreen() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const { user } = useAuth();
  const router = useRouter();

  // Estado para os horários do dia selecionado
  const [dailyAppointments, setDailyAppointments] = useState<Appointment[]>([]);
  // Estado para todos os dias que têm *algum* agendamento (para os pontinhos)
  const [allMarkedDates, setAllMarkedDates] = useState<MarkedDate>({});
  const [loadingSchedules, setLoadingSchedules] = useState(true);

  // Efeito 1: Busca TODOS os agendamentos (sem mudanças)
  useFocusEffect(
    useCallback(() => {
      if (!user) return;

      const appointmentsRef = collection(
        db,
        'users',
        user.uid,
        'appointments'
      );
      const q = query(appointmentsRef); // No futuro, pode filtrar por mês

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const marked: MarkedDate = {};
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.date) {
            marked[data.date] = { marked: true, dotColor: '#007bff' };
          }
        });
        setAllMarkedDates(marked);
      });

      return () => unsubscribe();
    }, [user])
  );

  // Efeito 2: Busca os agendamentos APENAS do dia selecionado (sem mudanças)
  useEffect(() => {
    if (!user) return;

    setLoadingSchedules(true);
    const appointmentsRef = collection(
      db,
      'users',
      user.uid,
      'appointments'
    );

    const q = query(
      appointmentsRef,
      where('date', '==', selectedDate)
      // orderBy('time') // <-- REMOVIDO PARA EVITAR O ERRO DE ÍNDICE
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const appointmentsData: Appointment[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as DocumentData;
          appointmentsData.push({
            id: doc.id,
            time: data.time || '00:00',
            clientName: data.clientName || 'Cliente não informado',
            notes: data.notes || '',
          });
        });

        // Ordenação local
        appointmentsData.sort((a, b) => a.time.localeCompare(b.time));

        setDailyAppointments(appointmentsData);
        setLoadingSchedules(false);
      },
      (error) => {
        console.error('Erro ao buscar agendamentos do dia: ', error);
        setLoadingSchedules(false);
      }
    );

    return () => unsubscribe();
  }, [selectedDate, user]);

  // Função chamada quando um dia é pressionado (sem mudanças)
  const onDayPress = (day: any) => {
    console.log('Dia selecionado:', day.dateString);
    setSelectedDate(day.dateString);
  };

  // Cria as marcações para os dias selecionados (sem mudanças)
  const getSelectedDateMarking = (): MarkedDate => {
    return {
      [selectedDate]: {
        selected: true,
        disableTouchEvent: true,
        selectedColor: '#007bff',
        selectedTextColor: '#ffffff',
      },
    };
  };

  // 4. NOVA FUNÇÃO: Lida com a exclusão de um agendamento
  const handleDeleteAppointment = (appointmentId: string) => {
    // Pede confirmação
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este agendamento?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            try {
              // Pega a referência do documento
              const docRef = doc(
                db,
                'users',
                user.uid,
                'appointments',
                appointmentId
              );
              // Exclui o documento
              await deleteDoc(docRef);
              // O onSnapshot atualizará a lista automaticamente
            } catch (error) {
              console.error('Erro ao excluir agendamento: ', error);
              Alert.alert('Erro', 'Não foi possível excluir o agendamento.');
            }
          },
        },
      ]
    );
  };

  // 5. ATUALIZAÇÃO: Renderiza cada item de agendamento na lista
  const renderAppointmentItem = ({ item }: { item: Appointment }) => (
    <View style={styles.appointmentItem}>
      {/* Container para o conteúdo de texto */}
      <View style={styles.appointmentContent}>
        <Text style={styles.appointmentTime}>{item.time}</Text>
        <View style={styles.appointmentDetails}>
          <Text style={styles.appointmentClient}>{item.clientName}</Text>
          {item.notes && (
            <Text style={styles.appointmentNotes}>{item.notes}</Text>
          )}
        </View>
      </View>

      {/* Botão de Excluir */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteAppointment(item.id)}
      >
        <FontAwesome name="trash-o" size={24} color="#e74c3c" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Minha Agenda</Text>
        </View>

        {/* Componente Calendário (sem mudanças) */}
        <Calendar
          style={styles.calendar}
          current={selectedDate}
          onDayPress={onDayPress}
          markedDates={{
            ...allMarkedDates,
            ...getSelectedDateMarking(),
          }}
          theme={{
            backgroundColor: '#ffffff',
            calendarBackground: '#ffffff',
            textSectionTitleColor: '#b6c1cd',
            selectedDayBackgroundColor: '#007bff',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#007bff',
            dayTextColor: '#2d4150',
            textDisabledColor: '#d9e1e8',
            dotColor: '#007bff',
            selectedDotColor: '#ffffff',
            arrowColor: '#007bff',
            monthTextColor: '#333',
            indicatorColor: 'blue',
            textDayFontWeight: '300',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '300',
            textDayFontSize: 16,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 14,
          }}
        />

        {/* Seção "Horários do dia" (sem mudanças) */}
        <View style={styles.scheduleHeader}>
          <Text style={styles.scheduleTitle}>
            Horários para{' '}
            {new Date(
              selectedDate + 'T00:00:00-03:00'
            ).toLocaleDateString('pt-br', {
              day: '2-digit',
              month: 'long',
            })}
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() =>
              router.push({
                pathname: '/appointmentModal',
                params: { selectedDate: selectedDate },
              })
            }
          >
            <FontAwesome name="plus" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Lista de Horários (sem mudanças) */}
        {loadingSchedules ? (
          <ActivityIndicator
            size="large"
            color="#007bff"
            style={styles.loader}
          />
        ) : (
          <FlatList
            data={dailyAppointments}
            renderItem={renderAppointmentItem} // Agora usa o renderItem atualizado
            keyExtractor={(item) => item.id}
            style={styles.scheduleList}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={() => (
              <View style={styles.emptySchedule}>
                <FontAwesome name="clock-o" size={24} color="#999" />
                <Text style={styles.emptyScheduleText}>
                  Nenhum horário agendado.
                </Text>
              </View>
            )}
          />
        )}
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  calendar: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    margin: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  scheduleTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007bff',
    padding: 8,
    borderRadius: 50, // Círculo
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  scheduleList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  loader: {
    marginTop: 40,
  },
  emptySchedule: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyScheduleText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
  // 6. ESTILOS ATUALIZADOS E NOVOS
  appointmentItem: {
    flexDirection: 'row', // Permite o botão ao lado
    justifyContent: 'space-between', // Separa o conteúdo do botão
    alignItems: 'center', // Alinha verticalmente
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  appointmentContent: {
    flex: 1, // Ocupa o espaço disponível
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
    width: 60, // Largura fixa para alinhar
  },
  appointmentDetails: {
    flex: 1,
    marginLeft: 10,
  },
  appointmentClient: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  appointmentNotes: {
    fontSize: 14,
    color: '#777',
    marginTop: 3,
  },
  deleteButton: {
    paddingLeft: 10, // Espaço para não ficar colado no texto
    paddingVertical: 5,
  },
});