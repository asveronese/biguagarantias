import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Modal, FlatList, Image, Platform, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { BASE_URL } from '../services/api';
const API = BASE_URL + '/api';

export default function CriarGarantiaScreen({ route, navigation }) {
  const { cnpj, codigo, garantia } = route.params;
  const isEdit = !!garantia;

  const [listas, setListas] = useState({ Tipo: [], Defeito: [], Envio: [], Suporte: [] });
  const [produtoBusca, setProdutoBusca] = useState('');
  const [sugestoes, setSugestoes] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [form, setForm] = useState({
    produto: '',
    tipo: '',
    defeito: '',
    envio: '',
    suporte: '',
    nfe: '',
    obs: '',
    solicitante: '',
    fone: '',
    email: ''
  });
  const [modal, setModal] = useState({ show: false, campo: '', opcoes: [] });
  const [fotos, setFotos] = useState([
    { uri: null, status: 'vazio' },
    { uri: null, status: 'vazio' },
    { uri: null, status: 'vazio' },
    { uri: null, status: 'vazio' },
    { uri: null, status: 'vazio' }
  ]);

  useEffect(() => {
    fetch(API + '/listas')
      .then(r => r.json())
      .then(d => setListas(d))
      .catch(() => Alert.alert('Erro', 'Falha ao carregar listas'));

    if (isEdit) {
      fetch(API + '/garantias/' + garantia.ID)
        .then(r => r.json())
        .then(d => {
          setForm({
            produto: d.produto,
            tipo: d.tipo,
            defeito: d.defeito,
            envio: d.envio || '',
            suporte: d.suporte || '',
            nfe: d.nfe || '',
            obs: d.obs || '',
            solicitante: d.solicitante || '',
            fone: d.fone || '',
            email: d.email || ''
          });
          setProdutoBusca(d.produtoDescricao || d.produto);
          
          const loadedFotos = [
            { uri: null, status: 'vazio' },
            { uri: null, status: 'vazio' },
            { uri: null, status: 'vazio' },
            { uri: null, status: 'vazio' },
            { uri: null, status: 'vazio' }
          ];
          if (d.fotos && d.fotos.length > 0) {
            d.fotos.forEach((fotoUri, i) => {
              if (fotoUri && i < 5) {
                loadedFotos[i] = { uri: fotoUri, status: 'existente' };
              }
            });
          }
          setFotos(loadedFotos);
          setLoading(false);
        })
        .catch(() => {
          Alert.alert('Erro', 'Falha ao carregar detalhes da garantia');
          setLoading(false);
        });
    }
  }, [garantia]);

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

  const selecionarFoto = async (index) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsMultipleSelection: false,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newFotos = [...fotos];
      newFotos[index] = { uri: result.assets[0].uri, status: 'novo' };
      setFotos(newFotos);
    }
  };

  const removerFoto = (index) => {
    const newFotos = [...fotos];
    if (newFotos[index].status === 'existente') {
      newFotos[index] = { uri: null, status: 'remover' };
    } else {
      newFotos[index] = { uri: null, status: 'vazio' };
    }
    setFotos(newFotos);
  };

  const salvar = async () => {
    if (!form.produto || !form.tipo || !form.defeito) {
      return Alert.alert('Erro', 'Preencha Produto, Tipo e Defeito');
    }
    try {
      const formData = new FormData();
      formData.append('cnpj', cnpj);
      formData.append('codigo', codigo);
      formData.append('produto', form.produto);
      formData.append('tipo', form.tipo);
      formData.append('defeito', form.defeito);
      formData.append('envio', form.envio || '');
      formData.append('suporte', form.suporte || '');
      formData.append('nfe', form.nfe || '');
      formData.append('obs', form.obs || '');
      formData.append('qte', '1');
      formData.append('solicitante', form.solicitante || '');
      formData.append('fone', form.fone || '');
      formData.append('email', form.email || '');

      fotos.forEach((foto, index) => {
        formData.append(`foto_status_${index}`, foto.status);
        if (foto.status === 'novo' && foto.uri) {
          const filename = foto.uri.split('/').pop() || `foto_${index}.jpg`;
          const ext = filename.split('.').pop() || 'jpg';
          formData.append('fotos', {
            uri: Platform.OS === 'android' ? foto.uri : foto.uri.replace('file://', ''),
            type: `image/${ext}`,
            name: filename,
          });
        }
      });

      const url = isEdit ? `${API}/garantias/${garantia.ID}` : `${API}/garantias/fotos`;
      const method = isEdit ? 'PUT' : 'POST';

      const r = await fetch(url, {
        method: method,
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = await r.json();
      if (data.success) {
        Alert.alert('Sucesso', isEdit ? 'Garantia atualizada!' : 'Garantia criada!');
        navigation.navigate("Home", { cnpj, codigo });
      } else {
        Alert.alert('Erro', data.error || 'Falha ao salvar');
      }
    } catch(e) {
      Alert.alert('Erro', 'Falha ao conectar: ' + e.message);
    }
  };

  const abrirModal = (campo) => {
    const campoOriginal = campo.charAt(0).toUpperCase() + campo.slice(1);
    if (campo === 'nfe') {
      if (!form.produto) {
        Alert.alert('Aviso', 'Selecione um produto primeiro');
        return;
      }
      fetch(API + '/nfs/' + codigo + '/' + form.produto)
        .then(r => r.json())
        .then(d => setModal({ show: true, campo: 'nfe', opcoes: d.map(item => item.NFE + ' | ' + item.DESCRICAO) }))
        .catch(() => Alert.alert('Erro', 'Falha ao buscar NF-es'));
    } else {
      setModal({ show: true, campo: campo.toLowerCase(), opcoes: listas[campoOriginal] || [] });
    }
  };

  const selecionarOpcao = (opcao) => {
    if (modal.campo === 'nfe') {
      const nfe = opcao.split(' | ')[0];
      setForm({ ...form, nfe: nfe });
    } else {
      setForm({ ...form, [modal.campo]: opcao });
    }
    setModal({ show: false, campo: '', opcoes: [] });
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10 }}>Carregando dados da garantia...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
      <TouchableOpacity style={styles.btnVoltar} onPress={() => navigation.goBack()}>
        <Text style={styles.btnVoltarText}>← Voltar</Text>
      </TouchableOpacity>
      <Text style={styles.titulo}>{isEdit ? 'Editar Garantia' : 'Nova Garantia'}</Text>
      <Text style={styles.label}>Produto *</Text>
      <TextInput
        style={styles.input}
        value={produtoBusca}
        onChangeText={buscarProduto}
        placeholder="Digite para buscar..."
      />
      {sugestoes.map(item => (
        <TouchableOpacity
          key={item.PRODUTO}
          style={styles.sugestao}
          onPress={() => {
            setForm({...form, produto: item.PRODUTO});
            setProdutoBusca(item.DESCRICAO);
            setSugestoes([]);
          }}
        >
          <Text style={styles.sugestaoText}>{item.DESCRICAO} ({item.PRODUTO})</Text>
        </TouchableOpacity>
      ))}
      {form.produto ? <Text style={styles.selecionado}>Código: {form.produto}</Text> : null}
      <Text style={styles.label}>Tipo *</Text>
      <TouchableOpacity style={styles.selectBtn} onPress={() => abrirModal('tipo')}>
        <Text style={form.tipo ? styles.selectText : styles.selectPlaceholder}>
          {form.tipo || 'Selecione...'}
        </Text>
      </TouchableOpacity>
      <Text style={styles.label}>Defeito *</Text>
      <TouchableOpacity style={styles.selectBtn} onPress={() => abrirModal('defeito')}>
        <Text style={form.defeito ? styles.selectText : styles.selectPlaceholder}>
          {form.defeito || 'Selecione...'}
        </Text>
      </TouchableOpacity>
      <Text style={styles.label}>Envio</Text>
      <TouchableOpacity style={styles.selectBtn} onPress={() => abrirModal('envio')}>
        <Text style={form.envio ? styles.selectText : styles.selectPlaceholder}>
          {form.envio || 'Selecione...'}
        </Text>
      </TouchableOpacity>
      <Text style={styles.label}>Suporte</Text>
      <TouchableOpacity style={styles.selectBtn} onPress={() => abrirModal('suporte')}>
        <Text style={form.suporte ? styles.selectText : styles.selectPlaceholder}>
          {form.suporte || 'Selecione...'}
        </Text>
      </TouchableOpacity>
      <Text style={styles.label}>NF-e</Text>
      <TouchableOpacity style={styles.selectBtn} onPress={() => abrirModal('nfe')}>
        <Text style={form.nfe ? styles.selectText : styles.selectPlaceholder}>
          {form.nfe || 'Selecione a NF-e...'}
        </Text>
      </TouchableOpacity>
      {form.nfe ? <Text style={styles.selecionado}>NF-e: {form.nfe}</Text> : null}
      <Text style={styles.label}>Solicitante</Text>
      <TextInput
        style={styles.input}
        value={form.solicitante}
        onChangeText={(t) => setForm({...form, solicitante: t})}
        placeholder="Nome do solicitante"
      />
      <Text style={styles.label}>Telefone</Text>
      <TextInput
        style={styles.input}
        value={form.fone}
        onChangeText={(t) => setForm({...form, fone: t})}
        placeholder="Telefone para contato"
        keyboardType="phone-pad"
      />
      <Text style={styles.label}>E-mail</Text>
      <TextInput
        style={styles.input}
        value={form.email}
        onChangeText={(t) => setForm({...form, email: t})}
        placeholder="E-mail para contato"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Text style={styles.label}>Observações</Text>
      <TextInput
        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
        value={form.obs}
        onChangeText={(t) => setForm({...form, obs: t})}
        placeholder="Observações..."
        multiline
      />

      <Text style={styles.label}>Fotos (máx. 5)</Text>
      <View style={styles.fotosContainer}>
        {fotos.map((foto, index) => {
          const hasImage = foto.status === 'novo' || foto.status === 'existente';
          return (
            <View key={index} style={styles.fotoWrapper}>
              {hasImage ? (
                <>
                  <Image source={{ uri: foto.uri }} style={styles.fotoThumb} />
                  <TouchableOpacity style={styles.fotoRemove} onPress={() => removerFoto(index)}>
                    <Text style={styles.fotoRemoveText}>X</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={styles.fotoAdd} onPress={() => selecionarFoto(index)}>
                  <Text style={styles.fotoAddText}>+</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>

      <TouchableOpacity style={styles.btnSalvar} onPress={salvar}>
        <Text style={styles.btnText}>{isEdit ? 'Salvar Alterações' : 'Salvar Garantia'}</Text>
      </TouchableOpacity>
      <Modal visible={modal.show} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>Selecione {modal.campo === 'nfe' ? 'NF-e' : modal.campo}</Text>
            <FlatList
              data={modal.opcoes}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => selecionarOpcao(item)}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
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
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: '#fff' },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#333', marginTop: 10, marginBottom: 5 },
  label: { fontWeight: 'bold', marginTop: 15, marginBottom: 5, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 12, backgroundColor: '#f9f9f9', fontSize: 15 },
  sugestao: { padding: 12, backgroundColor: '#f0f0f0', borderBottomWidth: 1, borderColor: '#ddd' },
  sugestaoText: { fontSize: 14 },
  selecionado: { color: '#007AFF', fontWeight: 'bold', marginTop: 5 },
  selectBtn: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 12, backgroundColor: '#f9f9f9' },
  selectText: { fontSize: 15, color: '#333' },
  selectPlaceholder: { fontSize: 15, color: '#999' },
  btnSalvar: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 30, marginBottom: 40 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  modalBg: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { margin: 20, backgroundColor: '#fff', borderRadius: 10, padding: 20, maxHeight: '70%' },
  modalTitulo: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#007AFF' },
  modalItem: { padding: 15, borderBottomWidth: 1, borderColor: '#eee' },
  modalItemText: { fontSize: 15 },
  btnFechar: { backgroundColor: '#999', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 15 },
  btnVoltar: { paddingVertical: 10, paddingHorizontal: 15, backgroundColor: '#f0f0f0', borderRadius: 8, alignSelf: 'flex-start', marginBottom: 10 },
  btnVoltarText: { color: '#333', fontWeight: 'bold', fontSize: 15 },
  fotosContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 5 },
  fotoWrapper: { width: 80, height: 80, position: 'relative' },
  fotoThumb: { width: '100%', height: '100%', borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  fotoRemove: { position: 'absolute', top: -6, right: -6, backgroundColor: '#ff4444', width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  fotoRemoveText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  fotoAdd: { width: '100%', height: '100%', borderRadius: 8, borderWidth: 2, borderColor: '#007AFF', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f8ff' },
  fotoAddText: { fontSize: 30, color: '#007AFF', fontWeight: 'bold' },
});
