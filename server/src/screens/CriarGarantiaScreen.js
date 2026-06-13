import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Modal, FlatList, ActivityIndicator } from 'react-native';
import { BASE_URL } from '../services/api';

export default function CriarGarantiaScreen({ route, navigation }) {
  const { cnpj } = route.params;
  const [listas, setListas] = useState({ Tipo: [], Defeito: [], Envio: [], Suporte: ['Sim', 'Não'] });
  const [produtoBusca, setProdutoBusca] = useState('');
  const [sugestoes, setSugestoes] = useState([]);
  const [form, setForm] = useState({ codigo: '', produto: '', solicitante: '', fone: '', email: '', qte: '', tipo: '', defeito: '', envio: '', suporte: '', nfe: '', obs: '' });
  const [modal, setModal] = useState({ show: false, campo: '', opcoes: [] });
  const [loading, setLoading] = useState(false);
  const [sugerindo, setSugerindo] = useState(false);

  useEffect(() => {
    fetch(`${BASE_URL}/api/listas`)
      .then(res => res.json())
      .then(data => {
        const normalizado = {};
        Object.keys(data).forEach(key => {
          normalizado[key.toLowerCase()] = data[key];
        });
        setListas(prev => ({ ...prev, ...data, ...normalizado }));
      })
      .catch(() => Alert.alert('Erro', 'Falha ao carregar listas'));
  }, []);

  const buscarProdutos = async (text) => {
    setProdutoBusca(text);
    setForm(prev => ({ ...prev, produto: text }));
    if (text.length < 3) { setSugestoes([]); return; }
    setSugerindo(true);
    try {
      const res = await fetch(`${BASE_URL}/api/produtos?busca=${text}`);
      const data = await res.json();
      setSugestoes(data || []);
    } catch (e) { 
      console.error(e); 
    } finally {
      setSugerindo(false);
    }
  };

  const abrirModal = (campo) => {
    const opcoes = listas[campo] || listas[campo.toLowerCase()] || listas[campo.toUpperCase()] || [];
    setModal({ show: true, campo, opcoes });
  };

  const enviarGarantia = async () => {
    if (!form.produto || !form.tipo || !form.defeito) {
      Alert.alert('Atenção', 'Preencha Produto, Tipo e Defeito');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/garantias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, cnpj })
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Sucesso', `Garantia criada! Protocolo: ${data.protocolo}`);
        navigation.goBack();
      } else {
        Alert.alert('Erro', data.error || 'Erro ao criar garantia');
      }
    } catch (e) { 
      Alert.alert('Erro', 'Falha na conexão'); 
    }
    setLoading(false);
  };

  const renderCampoSelect = (label, campo) => (
    <View key={campo}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.select} onPress={() => abrirModal(campo)}>
        <Text style={form[campo.toLowerCase()] ? styles.selectText : styles.placeholder}>
          {form[campo.toLowerCase()] || `Selecione ${label}`}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Nova Garantia</Text>

      <Text style={styles.label}>Código do Cliente</Text>
      <TextInput style={styles.input} value={form.codigo} onChangeText={v => setForm({...form, codigo: v})} placeholder="Código" />

      <Text style={styles.label}>Solicitante</Text>
      <TextInput style={styles.input} value={form.solicitante} onChangeText={v => setForm({...form, solicitante: v})} placeholder="Nome do solicitante" />

      <Text style={styles.label}>Telefone</Text>
      <TextInput style={styles.input} value={form.fone} onChangeText={v => setForm({...form, fone: v})} placeholder="(xx) xxxxx-xxxx" keyboardType="phone-pad" />

      <Text style={styles.label}>E-mail</Text>
      <TextInput style={styles.input} value={form.email} onChangeText={v => setForm({...form, email: v})} placeholder="email@exemplo.com" keyboardType="email-address" />

      <Text style={styles.label}>Produto</Text>
      <TextInput style={styles.input} value={produtoBusca} onChangeText={buscarProdutos} placeholder="Digite o produto" />
      {sugerindo && <ActivityIndicator style={{ marginBottom: 10 }} />}
      {sugestoes.length > 0 && (
        <View style={styles.sugestoesContainer}>
          {sugestoes.map((item, i) => {
            const descricao = item.DESCRICAO || item.descricao || item.NOME || item.nome || item.PRODUTO || item.produto || '';
            return (
              <TouchableOpacity key={i} style={styles.sugestaoItem} onPress={() => {
                setForm({...form, produto: descricao});
                setProdutoBusca(descricao);
                setSugestoes([]);
              }}>
                <Text style={styles.sugestaoText}>{descricao}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <Text style={styles.label}>Quantidade</Text>
      <TextInput style={styles.input} value={form.qte} onChangeText={v => setForm({...form, qte: v})} placeholder="1" keyboardType="numeric" />

      {renderCampoSelect('Tipo', 'Tipo')}
      {renderCampoSelect('Defeito', 'Defeito')}
      {renderCampoSelect('Envio', 'Envio')}
      {renderCampoSelect('Suporte', 'Suporte')}

      <Text style={styles.label}>NF-e</Text>
      <TextInput style={styles.input} value={form.nfe} onChangeText={v => setForm({...form, nfe: v})} placeholder="Número da NF-e" />

      <Text style={styles.label}>Observações</Text>
      <TextInput style={[styles.input, styles.textArea]} value={form.obs} onChangeText={v => setForm({...form, obs: v})} placeholder="Observações" multiline textAlignVertical="top" />

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.submitButton]} onPress={enviarGarantia} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Enviar Garantia</Text>}
        </TouchableOpacity>
      </View>

      <Modal visible={modal.show} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione {modal.campo}</Text>
            <FlatList 
              data={modal.opcoes} 
              keyExtractor={(item, i) => i.toString()}
              renderItem={({item}) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => {
                  setForm({...form, [modal.campo.toLowerCase()]: item});
                  setModal({...modal, show: false});
                }}>
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )} 
            />
            <TouchableOpacity style={styles.modalClose} onPress={() => setModal({...modal, show: false})}>
              <Text style={styles.modalCloseText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0047AB', marginBottom: 20, marginTop: 40 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 5, marginTop: 10 },
  input: { backgroundColor: '#FFFFFF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', fontSize: 16 },
  textArea: { height: 80 },
  select: { backgroundColor: '#FFFFFF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  selectText: { fontSize: 16, color: '#1A1A2E' },
  placeholder: { fontSize: 16, color: '#9CA3AF' },
  sugestoesContainer: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, maxHeight: 150 },
  sugestaoItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  sugestaoText: { fontSize: 14, color: '#1A1A2E' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 },
  button: { flex: 0.48, padding: 15, borderRadius: 8, alignItems: 'center' },
  cancelButton: { backgroundColor: '#6B7280' },
  submitButton: { backgroundColor: '#0047AB' },
  buttonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '70%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#1A1A2E' },
  modalItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalItemText: { fontSize: 16, color: '#1A1A2E' },
  modalClose: { padding: 15, alignItems: 'center', marginTop: 10 },
  modalCloseText: { fontSize: 16, color: '#0047AB', fontWeight: '600' },
});