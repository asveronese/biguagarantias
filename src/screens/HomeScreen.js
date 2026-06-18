import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen({ route, navigation }) {
  const { nome, cnpj, codigo } = route.params || {};
   const insets = useSafeAreaInsets();
  const [garantias, setGarantias] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGarantias = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.listarGarantias(cnpj);
      setGarantias(data || []);
    } catch (error) {
      console.error('Erro ao buscar garantias:', error);
    } finally {
      setLoading(false);
    }
  }, [cnpj]);

  useFocusEffect(
    useCallback(() => {
      fetchGarantias();
    }, [fetchGarantias])
  );

  const formatarData = (data) => {
    if (!data) return '';
    const d = new Date(data);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

    const handleExcluir = (id) => {
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja excluir esta garantia?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.excluirGarantia(id);
              fetchGarantias();
            } catch (error) {
              Alert.alert('Erro', error.message);
            }
          },
        },
      ]
    );
  };

const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pendente': return '#FF8C00';
      case 'concluído': return '#16A34A';
      default: return '#6B7280';
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardId}>#{item.ID}</Text>
        <View style={[styles.badge, { backgroundColor: getStatusColor(item.STATUS) }]}>
          <Text style={styles.badgeText}>{item.STATUS}</Text>
        </View>
      </View>
      <Text style={styles.cardTitle}>{item.DESCRICAO} ({item.PRODUTO})</Text>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Tipo:</Text>
        <Text style={styles.cardValue}>{item.TIPO}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Defeito:</Text>
        <Text style={styles.cardValue}>{item.DEFEITO}</Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.cardDate}>📅 {formatarData(item.DATA_ABERTURA)}</Text>
        {item.STATUS?.toLowerCase() === 'pendente' && (
          <>
            <TouchableOpacity
              style={styles.btnEditar}
              onPress={() => navigation.navigate('CriarGarantia', { cnpj, codigo, garantia: item })}
            >
              <Text style={styles.btnEditarText}>✏️ Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnEditar, { backgroundColor: '#dc3545', marginLeft: 8 }]}
              onPress={() => handleExcluir(item.ID)}
            >
              <Text style={styles.btnEditarText}>🗑️ Excluir</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.btnVoltar}
        onPress={() => navigation.replace('Login', { autoLogin: false })}
      >
        <Text style={styles.btnVoltarText}>← Voltar ao Login</Text>
      </TouchableOpacity>
      <View style={styles.header}>
        <Text style={styles.welcome}>Olá, {nome}</Text>
        <Text style={styles.cnpj}>CNPJ: {cnpj}</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#0047AB" style={styles.loader} />
      ) : (
        <FlatList
          data={garantias}
          keyExtractor={(item, index) => String(item.ID || index)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma garantia encontrada</Text>}
        />
      )}
      <TouchableOpacity
        style={[styles.fab, {bottom: 30 + insets.bottom}]}
        onPress={() => navigation.navigate('CriarGarantia', { cnpj, codigo })}
      >
        <Text style={styles.fabText}>Nova Garantia</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', padding: 20, paddingBottom: 30 },
  btnVoltar: {
    marginTop: 50,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  btnVoltarText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 15,
  },
  header: { marginBottom: 20 },
  welcome: { fontSize: 24, fontWeight: 'bold', color: '#0047AB' },
  cnpj: { fontSize: 14, color: '#6B7280', marginTop: 5 },
  loader: { marginTop: 50 },
  listContent: {
    paddingBottom: 100, paddingBottom: 100 },
  card: { backgroundColor: '#FFFFFF', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardId: { fontSize: 16, fontWeight: 'bold', color: '#0047AB' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  cardRow: { flexDirection: 'row', marginBottom: 4 },
  cardLabel: { fontSize: 14, color: '#6B7280', fontWeight: 'bold', marginRight: 5 },
  cardValue: { fontSize: 14, color: '#333', flex: 1 },
  cardDate: { fontSize: 13, color: '#999' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15 },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#6B7280' },
  fab: { backgroundColor: '#0047AB', padding: 15, borderRadius: 10, alignItems: 'center', position: 'absolute', bottom: 30, left: 20, right: 20 },
  fabText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  btnEditar: { backgroundColor: '#0047AB', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  btnEditarText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }
});
