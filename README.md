# 📅 AgendaApp

AgendaApp é um aplicativo móvel para gerenciamento de agendamentos, desenvolvido para profissionais liberais e pequenos estabelecimentos. Ele permite um controle simplificado de uma carteira de clientes e dos horários agendados, utilizando o Firebase como backend.

Este projeto foi construído com React Native (Expo) e demonstra o gerenciamento de estado de autenticação, navegação (abas e modais) e operações CRUD em tempo real com o Firestore.

## ✨ Funcionalidades Principais

* **Autenticação:** Login e cadastro de usuários com Email e Senha (via Firebase Authentication).
* **Navegação Protegida:** O usuário só acessa as telas principais após o login, com persistência da sessão.
* **Gerenciamento de Clientes (CRUD):**
    * **C**riar: Adicionar novos clientes através de um formulário modal.
    * **R**ead (Ler): Listar todos os clientes em tempo real.
    * **U**pdate (Atualizar): Editar as informações de um cliente (modal).
    * **D**elete (Excluir): Excluir um cliente e todos os seus agendamentos associados.
* **Gerenciamento de Agenda (CRUD):**
    * **C**riar: Adicionar novos agendamentos em um dia específico, com seleção de cliente.
    * **R**ead (Ler): Visualizar um calendário com os dias marcados e a lista de horários de um dia selecionado.
    * **D**elete (Excluir): Remover um agendamento com um toque.
* **Histórico de Cliente:** A tela de "Detalhes do Cliente" exibe o histórico completo de agendamentos daquele cliente.

## 🛠️ Tecnologias Utilizadas

* **Framework:** React Native com Expo
* **Navegação:** Expo Router (v3)
* **Backend (BaaS):** Firebase
    * **Autenticação:** Firebase Authentication
    * **Banco de Dados:** Firestore (para `users`, `clients` e `appointments`)
* **Bibliotecas:**
    * `react-native-calendars`
    * `@react-native-picker/picker`
    * `react-native-safe-area-context`

## 🚀 Como Executar o Projeto

1.  **Clone o repositório:**
    ```bash
    git clone (https://github.com/mayck-eduardo/agenda.git)
    cd agenda
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure o Firebase:**
    * Crie um novo projeto no [Console do Firebase](https://console.firebase.google.com/).
    * Na seção "Authentication", habilite o provedor **Email/Senha**.
    * Na seção "Firestore Database", crie um banco de dados (comece em modo de teste para facilitar).
    * Vá para as "Configurações do Projeto", crie um **Aplicativo da Web** (ícone `</>`).
    * Copie o objeto `firebaseConfig` e cole-o no arquivo `constants/firebase.ts` do seu projeto.

4.  **Crie o Índice do Firestore:**
    * O aplicativo requer um índice composto para a tela de "Detalhes do Cliente" (para filtrar agendamentos por cliente e ordenar por data).
    * Quando você executar o app e receber o erro no console, o **Firebase fornecerá um link direto** para criar o índice automaticamente.
    * O índice necessário é para a coleção `appointments`: `clientId` (Ascendente) e `date` (Descendente).
    * [Imagem da configuração de índices do Firestore]

5.  **Execute o aplicativo:**
    ```bash
    npx expo start
    ```
