import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Button, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity 
} from 'react-native';
import { useAuth } from './_contexts/AuthContext'; // Ajuste o caminho se necessário

export default function LoginScreen() {
  const { signIn, signUp, loading } = useAuth();
  
  // Estados locais para os campos
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Apenas para cadastro
  
  // Estado para alternar entre Login e Cadastro
  const [isRegistering, setIsRegistering] = useState(false);

  // Funções para lidar com os botões
  const handleLogin = () => {
    if (email && password) {
      signIn(email, password);
    }
  };
  
  const handleSignUp = () => {
    if (email && password && name) {
      signUp(email, password, name);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isRegistering ? 'Criar Conta' : 'AgendaApp'}
      </Text>
      <Text style={styles.subtitle}>
        {isRegistering ? 'Preencha seus dados' : 'Faça login para continuar'}
      </Text>

      {/* Campo de Nome (só aparece no cadastro) */}
      {isRegistering && (
        <TextInput
          style={styles.input}
          placeholder="Nome Completo"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
      )}

      {/* Campo de Email */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* Campo de Senha */}
      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry // Esconde a senha
      />

      {/* Seção de Botões */}
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" style={styles.spinner} />
      ) : (
        <View style={styles.buttonContainer}>
          {isRegistering ? (
            <>
              <Button
                title="Cadastrar"
                onPress={handleSignUp}
                disabled={!email || !password || !name}
              />
              <TouchableOpacity onPress={() => setIsRegistering(false)}>
                <Text style={styles.toggleText}>Já tenho uma conta. Fazer Login</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Button
                title="Entrar"
                onPress={handleLogin}
                disabled={!email || !password}
              />
              <TouchableOpacity onPress={() => setIsRegistering(true)}>
                <Text style={styles.toggleText}>Não tem uma conta? Criar conta</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 10,
  },
  toggleText: {
    color: '#007bff',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  spinner: {
    marginTop: 20,
  }
});