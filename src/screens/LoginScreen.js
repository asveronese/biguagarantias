import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { api } from '../services/api';
export default function LoginScreen({ navigation }) {
  const [cnpj, setCnpj] = useState('50539279000154');
  const [senha, setSenha] = useState('garantia');
  const [loading, setLoading] = useState(false);
  const handleLogin = async () => {
    if (!cnpj || !senha) {
      Alert.alert('Atenção', 'Preencha CNPJ e senha');
      return;
    }
    setLoading(true);
    try {
      const data = await api.login(cnpj, senha);
      if (data.success) {
        navigation.replace('Home', { cnpj, nome: data.nome || 'Usuário', codigo: data.codigo });
      } else {
        Alert.alert('Erro', 'CNPJ ou senha inválidos');
      }
    } catch (error) {
      Alert.alert('Erro', error.message || 'Falha na conexão com o servidor');
    }
    setLoading(false);
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bigua Garantias</Text>
      <Text style={styles.subtitle}>Sistema de Garantias</Text>
      <View style={styles.form}>
        <Text style={styles.label}>CNPJ</Text>
        <TextInput
          style={styles.input}
          value={cnpj}
          onChangeText={setCnpj}
          placeholder="Digite o CNPJ"
          keyboardType="numeric"
          autoCapitalize="none"
        />
        <Text style={styles.label}>Senha</Text>
        <TextInput
          style={styles.input}
          value={senha}
          onChangeText={setSenha}
          placeholder="Digite a senha"
          secureTextEntry
        />
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0047AB', padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#FFFFFF', marginBottom: 40, opacity: 0.8 },
  form: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 5 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 15 },
  button: { backgroundColor: '#0047AB', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
});