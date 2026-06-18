import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator, Image, ScrollView, Modal, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
const logo = require('../assets/logo.png');

export default function LoginScreen({ route, navigation }) {
  const [cnpj, setCnpj] = useState('');
  const [senha, setSenha] = useState('');
  const [lembrar, setLembrar] = useState(true);
  const [loading, setLoading] = useState(false);
  const [checkingStorage, setCheckingStorage] = useState(true);

  const [showTrocarSenha, setShowTrocarSenha] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loadingTrocar, setLoadingTrocar] = useState(false);

  const [showSenha, setShowSenha] = useState(false);
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);

  useEffect(() => {
    if (route.params?.autoLogin === false) {
      setCheckingStorage(false);
      return;
    }
    carregarCredenciais();
  }, []);

  const carregarCredenciais = async () => {
    try {
      const savedCnpj = await AsyncStorage.getItem('@login_cnpj');
      const savedSenha = await AsyncStorage.getItem('@login_senha');
      if (savedCnpj && savedSenha) {
        setCnpj(savedCnpj);
        setSenha(savedSenha);
        try {
          const data = await api.login(savedCnpj, savedSenha);
          if (data && data.nome) {
            navigation.replace('Home', { nome: data.nome, cnpj: savedCnpj, codigo: data.codigo });
            return;
          }
        } catch (e) {}
      }
    } catch (e) {}
    setCheckingStorage(false);
  };

  const handleLogin = async () => {
    if (!cnpj || !senha) {
      Alert.alert('Erro', 'Preencha CNPJ e senha');
      return;
    }
    setLoading(true);
    try {
      const data = await api.login(cnpj, senha);
      if (data && data.nome) {
        await AsyncStorage.setItem('@login_cnpj', lembrar ? cnpj : '');
        await AsyncStorage.setItem('@login_senha', lembrar ? senha : '');
        navigation.replace('Home', { nome: data.nome, cnpj: cnpj, codigo: data.codigo });
      } else {
        Alert.alert('Erro', 'Usuario ou senha invalidos');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao conectar ao servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleTrocarSenha = async () => {
    if (!senhaAtual || !novaSenha) {
      Alert.alert('Erro', 'Preencha a senha atual e a nova senha');
      return;
    }
    if (novaSenha.length < 4) {
      Alert.alert('Erro', 'A nova senha deve ter pelo menos 4 caracteres');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      Alert.alert('Erro', 'A confirmacao da nova senha nao confere');
      return;
    }
    setLoadingTrocar(true);
    try {
      const data = await api.trocarSenha(cnpj, senhaAtual, novaSenha);
      if (data && data.success) {
        Alert.alert('Sucesso', 'Senha alterada com sucesso!');
        setSenha(novaSenha);
        await AsyncStorage.setItem('@login_senha', novaSenha);
        setShowTrocarSenha(false);
        setSenhaAtual('');
        setNovaSenha('');
        setConfirmarSenha('');
      } else {
        Alert.alert('Erro', data.error || 'Falha ao alterar senha');
      }
    } catch (error) {
      Alert.alert('Erro', error.message || 'Falha ao alterar senha');
    } finally {
      setLoadingTrocar(false);
    }
  };

  const handleLogoff = () => {
    Alert.alert('Sair', 'Limpar dados salvos?', [
      { text: 'Nao', style: 'cancel' },
      { text: 'Sim', onPress: async () => {
        await AsyncStorage.removeItem('@login_cnpj');
        await AsyncStorage.removeItem('@login_senha');
        setCnpj('');
        setSenha('');
        setLembrar(true);
      }},
    ]);
  };

  if (checkingStorage) {
    return (
      <View style={styles.container}>
        <View style={[styles.topBar, { height: 220, justifyContent: 'center' }]}>
          <ActivityIndicator size="large" color="#FFF" />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
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
            autoCapitalize="none"
          />

          <Text style={styles.label}>Senha</Text>
          <View style={styles.senhaContainer}>
            <TextInput
              style={styles.senhaInput}
              placeholder="Digite a senha"
              placeholderTextColor="#999"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry={!showSenha}
            />
            <TouchableOpacity style={styles.olhoBtn} onPress={() => setShowSenha(!showSenha)}>
              <Text style={styles.olhoText}>{showSenha ? '👁️' : '🙈'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.lembrarRow}>
            <Switch
              value={lembrar}
              onValueChange={setLembrar}
              trackColor={{ false: '#ccc', true: '#0047AB' }}
              thumbColor={lembrar ? '#fff' : '#f4f3f4'}
            />
            <Text style={styles.lembrarText}>Manter conectado</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#0047AB" style={{ marginTop: 20 }} />
          ) : (
            <>
              <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Entrar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.trocarSenhaBtn}
                onPress={() => {
                  if (!cnpj) {
                    Alert.alert('Atencao', 'Digite o CNPJ primeiro para trocar a senha');
                    return;
                  }
                  setShowTrocarSenha(true);
                }}>
                <Text style={styles.trocarSenhaText}>Trocar senha</Text>
              </TouchableOpacity>
            </>
          )}

          {cnpj ? (
            <TouchableOpacity style={styles.logoffBtn} onPress={handleLogoff}>
              <Text style={styles.logoffText}>Esquecer dados salvos</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>

      <Modal visible={showTrocarSenha} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Trocar Senha</Text>
            {cnpj ? <Text style={styles.modalSubtitle}>CNPJ: {cnpj}</Text> : null}

            <Text style={styles.label}>Senha atual</Text>
            <View style={styles.senhaContainer}>
              <TextInput
                style={styles.senhaInput}
                placeholder="Digite a senha atual"
                placeholderTextColor="#999"
                value={senhaAtual}
                onChangeText={setSenhaAtual}
                secureTextEntry={!showSenhaAtual}
              />
              <TouchableOpacity style={styles.olhoBtn} onPress={() => setShowSenhaAtual(!showSenhaAtual)}>
                <Text style={styles.olhoText}>{showSenhaAtual ? '👁️' : '🙈'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Nova senha</Text>
            <View style={styles.senhaContainer}>
              <TextInput
                style={styles.senhaInput}
                placeholder="Digite a nova senha"
                placeholderTextColor="#999"
                value={novaSenha}
                onChangeText={setNovaSenha}
                secureTextEntry={!showNovaSenha}
              />
              <TouchableOpacity style={styles.olhoBtn} onPress={() => setShowNovaSenha(!showNovaSenha)}>
                <Text style={styles.olhoText}>{showNovaSenha ? '👁️' : '🙈'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Confirmar nova senha</Text>
            <View style={styles.senhaContainer}>
              <TextInput
                style={styles.senhaInput}
                placeholder="Digite novamente a nova senha"
                placeholderTextColor="#999"
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
                secureTextEntry={!showConfirmarSenha}
              />
              <TouchableOpacity style={styles.olhoBtn} onPress={() => setShowConfirmarSenha(!showConfirmarSenha)}>
                <Text style={styles.olhoText}>{showConfirmarSenha ? '👁️' : '🙈'}</Text>
              </TouchableOpacity>
            </View>

            {loadingTrocar ? (
              <ActivityIndicator size="large" color="#0047AB" style={{ marginTop: 20 }} />
            ) : (
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalBtnCancelar} onPress={() => { setShowTrocarSenha(false); setSenhaAtual(''); setNovaSenha(''); setConfirmarSenha(''); }}>
                  <Text style={styles.modalBtnCancelarText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalBtnConfirmar} onPress={handleTrocarSenha}>
                  <Text style={styles.modalBtnConfirmarText}>Alterar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  topBar: {
    backgroundColor: '#1A1A2E',
    paddingVertical: 15,
    paddingTop: 60,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 8,
    borderRadius: 90,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  topBarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 25,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 5,
    marginLeft: 2,
  },
  senhaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#fff',
    marginBottom: 14,
  },
  senhaInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  olhoBtn: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  olhoText: {
    fontSize: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#1F2937',
  },
  lembrarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  lembrarText: {
    fontSize: 14,
    color: '#6B7280',
  },
  button: {
    backgroundColor: '#0047AB',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  trocarSenhaBtn: {
    marginTop: 16,
    alignItems: 'center',
    padding: 8,
  },
  trocarSenhaText: {
    color: '#0047AB',
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  logoffBtn: {
    marginTop: 25,
    alignItems: 'center',
    padding: 10,
  },
  logoffText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 12,
  },
  modalBtnCancelar: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  modalBtnCancelarText: { color: '#6B7280', fontSize: 16, fontWeight: '600' },
  modalBtnConfirmar: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#0047AB',
    alignItems: 'center',
  },
  modalBtnConfirmarText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
