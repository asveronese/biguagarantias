import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { api } from '../services/api';
const logo = require('../assets/logo.png');
export default function LoginScreen({ navigation }) {
  const [cnpj, setCnpj] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const handleLogin = async () => {
    if (!cnpj || !senha) {
      Alert.alert('Erro', 'Preencha CNPJ e senha');
      return;
    }
    setLoading(true);
    try {
      const data = await api.login(cnpj, senha);
      if (data && data.nome) {
        navigation.replace('Home', { nome: data.nome, cnpj: cnpj, codigo: data.codigo });
      } else {
        Alert.alert('Erro', 'Usuário ou senha inválidos');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao conectar ao servidor');
    } finally {
      setLoading(false);
    }
  };
  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
        <Text style={styles.topBarText}>Controle de Garantias</Text>
      </View>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Login</Text>
        <Text style={styles.label}>CNPJ</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite o CNPJ"
          placeholderTextColor="#999"
          value={cnpj}
          onChangeText={setCnpj}
          keyboardType="numeric"
        />
        <Text style={styles.label}>Senha</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite a senha"
          placeholderTextColor="#999"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
        />
        {loading ? (
          <ActivityIndicator size="large" color="#0047AB" style={{ marginTop: 20 }} />
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Entrar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  topBar: {
    backgroundColor: '#0047AB',
    paddingVertical: 15,
    paddingTop: 50,
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 8,
    borderRadius: 100,
  },
  topBarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 30,
    marginTop: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0047AB',
    textAlign: 'center',
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    marginLeft: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#0047AB',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
