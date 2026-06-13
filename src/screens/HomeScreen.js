import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';

export default function HomeScreen({ route, navigation }) {
  const { nome, cnpj } = route.params || {};
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

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pendente': return '#FF8C00';
      case 'concluído': return '#16A34A';
      default: return '#6B7280';
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.PRODUTO}</Text>
      <Text style={styles.cardText}>Data: {item.DATA_ABERTURA}</Text>
      <Text style={styles.cardText}>Tipo: {item.TIPO}</Text>
      <View style={[styles.badge, { backgroundColor: getStatusColor(item.STATUS) }]}>
        <Text style={styles.badgeText}>{item.STATUS}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>Olá, {nome}</Text>
        <Text style={styles.cnpj}>CNPJ: {cnpj}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0047AB" style={styles.loader} />
      ) : (
        <FlatList
          data={garantias}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma garantia encontrada</Text>}
        />
      )}

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('CriarGarantia', { cnpj })}
      >
        <Text style={styles.fabText}>Nova Garantia</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', padding: 20 },
  header: { marginBottom: 20, marginTop: 40 },
  welcome: { fontSize: 24, fontWeight: 'bold', color: '#0047AB' },
  cnpj: { fontSize: 16, color: '#6B7280', marginTop: 5 },
  loader: { marginTop: 50 },
  listContent: { paddingBottom: 100 },
  card: { backgroundColor: '#FFFFFF', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  cardText: { fontSize: 14, color: '#6B7280', marginBottom: 2 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15, marginTop: 10 },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#6B7280' },
  fab: { backgroundColor: '#0047AB', padding: 15, borderRadius: 10, alignItems: 'center', position: 'absolute', bottom: 30, left: 20, right: 20 },
  fabText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }
});