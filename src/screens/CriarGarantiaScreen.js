import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Modal, FlatList } from 'react-native';

const API = 'http://192.168.15.9:3000/api';

export default function CriarGarantiaScreen({ route, navigation }) {
  const { cnpj } = route.params;
  const [listas, setListas] = useState({ Tipo: [], Defeito: [], Envio: [], Suporte: [] });
  const [produtoBusca, setProdutoBusca] = useState('');
  const [sugestoes, setSugestoes] = useState([]);
  const [form, setForm] = useState({ produto: '', tipo: '', defeito: '', envio: '', suporte: '', nfe: '', obs: '' });
  const [modal, setModal] = useState({ show: false, campo: '', opcoes: [] });

  useEffect(() => {
    fetch(API + '/listas')
      .then(r => r.json())
      .then(d => setListas(d))
      .catch(() => Alert.alert('Erro', 'Falha ao carregar listas'));
  }, []);

  const buscarProduto = async (texto) => {
    setProdutoBusca(texto);
    if (texto.length >= 3) {
      try {
        const r = await fetch(API + '/produtos?busca=' + texto);
        const d = await r.json();
        setSugestoes(d);
      } catch(e) { setSugestoes([]); }
    } else {
      setSugestoes([]);
    }
  };

  const salvar = async () => {
    if (!form.produto || !form.tipo || !form.defeito) {
      return Alert.alert('Erro', 'Preencha Produto, Tipo e Defeito');
    }
    try {
      const r = await fetch(API + '/garantias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cnpj: cnpj, produto: form.produto, tipo: form.tipo, defeito: form.defeito, envio: form.envio, suporte: form.suporte, nfe: form.nfe, obs: form.obs, qte: 1, codigo: 1, solicitante: '', fone: '', email: '' })
      });
      if (r.ok) {
        Alert.alert('Sucesso', 'Garantia criada!');
        navigation.goBack();
      } else {
        Alert.alert('Erro', 'Falha ao salvar');
      }
    } catch(e) {
      Alert.alert('Erro', 'Falha ao conectar');
    }
  };

  const abrirModal = (campo) => {
    const campoOriginal = campo.charAt(0).toUpperCase() + campo.slice(1);
    setModal({ show: true, campo: campo.toLowerCase(), opcoes: listas[campoOriginal] || [] });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Produto *</Text>
      <TextInput style={styles.input} value={produtoBusca} onChangeText={buscarProduto} placeholder="Digite para buscar..." />
      {sugestoes.map(item => (
        <TouchableOpacity key={item.PRODUTO} style={styles.sugestao} onPress={() => {
          setForm({...form, produto: item.PRODUTO});
          setProdutoBusca(item.DESCRICAO);
          setSugestoes([]);
        }}>
          <Text style={styles.sugestaoText}>{item.DESCRICAO}</Text>
        </TouchableOpacity>
      ))}
      {form.produto ? <Text style={styles.selecionado}>Codigo: {form.produto}</Text> : null}

      <Text style={styles.label}>Tipo *</Text>
      <TouchableOpacity style={styles.input} onPress={() => abrirModal('Tipo')}>
        <Text>{form.tipo || 'Selecione...'}</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Defeito *</Text>
      <TouchableOpacity style={styles.input} onPress={() => abrirModal('Defeito')}>
        <Text>{form.defeito || 'Selecione...'}</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Suporte</Text>
      <TouchableOpacity style={styles.input} onPress={() => abrirModal('Suporte')}>
        <Text>{form.suporte || 'Selecione...'}</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Envio</Text>
      <TouchableOpacity style={styles.input} onPress={() => abrirModal('Envio')}>
        <Text>{form.envio || 'Selecione...'}</Text>
      </TouchableOpacity>

      <Text style={styles.label}>NFE</Text>
      <TextInput style={styles.input} value={form.nfe} onChangeText={v => setForm({...form, nfe: v})} placeholder="NFe..." />

      <Text style={styles.label}>Observacao</Text>
      <TextInput style={[styles.input, {height: 80}]} multiline value={form.obs} onChangeText={v => setForm({...form, obs: v})} placeholder="Obs..." />

      <TouchableOpacity style={styles.btnSalvar} onPress={salvar}>
        <Text style={styles.btnText}>SALVAR</Text>
      </TouchableOpacity>

      <Modal visible={modal.show} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>Selecione {modal.campo}</Text>
            <FlatList
              data={modal.opcoes}
              keyExtractor={(item, i) => i.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => {
                  setForm({...form, [modal.campo]: item});
                  setModal({ show: false, campo: '', opcoes: [] });
                }}>
                  <Text>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.btnFechar} onPress={() => setModal({ show: false, campo: '', opcoes: [] })}>
              <Text style={{color: '#fff'}}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  label: { fontWeight: 'bold', marginTop: 15, marginBottom: 5, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 12, backgroundColor: '#f9f9f9', fontSize: 15 },
  sugestao: { padding: 12, backgroundColor: '#f0f0f0', borderBottomWidth: 1, borderColor: '#ddd' },
  sugestaoText: { fontSize: 14 },
  selecionado: { color: '#007AFF', fontWeight: 'bold', marginTop: 5 },
  btnSalvar: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 30, marginBottom: 40 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  modalBg: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { margin: 20, backgroundColor: '#fff', borderRadius: 10, padding: 20, maxHeight: '70%' },
  modalTitulo: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#007AFF' },
  modalItem: { padding: 15, borderBottomWidth: 1, borderColor: '#eee' },
  btnFechar: { backgroundColor: '#999', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 15 }
});