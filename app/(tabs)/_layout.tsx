import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs 
      screenOptions={{
        headerShown: false, // O cabeçalho já está em cada tela
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#eee',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      {/* Aba Início */}
      <Tabs.Screen
        name="index" // Corresponderá ao arquivo app/(tabs)/index.tsx
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => 
            <FontAwesome name="home" size={24} color={color} />,
        }}
      />
      
      {/* Aba Clientes */}
      <Tabs.Screen
        name="clients" // Corresponderá ao arquivo app/(tabs)/clients.tsx
        options={{
          title: 'Clientes',
          tabBarIcon: ({ color }) => 
            <FontAwesome name="users" size={24} color={color} />,
        }}
      />

      {/* NOVA ABA: Agenda */}
      <Tabs.Screen
        name="agenda" // Corresponderá ao arquivo app/(tabs)/agenda.tsx
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color }) => 
            <FontAwesome name="calendar" size={24} color={color} />,
        }}
      />
      
    </Tabs>
  );
}