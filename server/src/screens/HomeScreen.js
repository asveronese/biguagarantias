import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

export default function HomeScreen({ route, navigation }) {
  const { nome, cnpj } = route.params;
  const [garantias, setGarantias] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGarantias = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://192.168.1.3:3000/api/garantias?cnpj=' + cnpj);
      const data = await res.json();
      setGarantias(data);
    } catch (e) {
      console.log('Erro:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchGarantias(); }, [cnpj]));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.nomeCliente}>{nome}</Text>
        <Text style={styles.cnpjCliente}>CNPJ: {cnpj}</Text>
      </View>
      <TouchableOpacity style={styles.btnNova} onPress={() => navigation.navigate('CriarGarantia', { cnpj }) }>
        <Text style={styles.btnText}>NOVA GARANTIA</Text>
      </TouchableOpacity>
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <FlatList
          data={garantias}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.label}>Protocolo: <Text style={styles.value}>{item.PROTOCOLO}</Text></Text>
              <Text style={styles.label}>Produto: <Text style={styles.value}>{item.PRODUTO}</Text></Text>
              <Text style={styles.label}>Tipo: <Text style={styles.value}>{item.TIPO}</Text></Text>
              <Text style={styles.label}>Defeito: <Text style={styles.value}>{item.DEFEITO}</Text></Text>
              <Text style={styles.label}>Status: <Text style={styles.value}>{item.STATUS}</Text></Text>
              <Text style={styles.label}>Data: <Text style={styles.value}>{item.DATA_ABERTURA}</Text></Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Nenhuma garantia encontrada</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  header: { marginBottom: 20, padding: 15, backgroundColor: '#fff', borderRadius: 10, elevation: 2 },
  nomeCliente: { fontSize: 18, fontWeight: 'bold', color: '#007AFF' },
  cnpjCliente: { fontSize: 14, color: '#888', marginTop: 4 },
  btnNova: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 20 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 3 },
  label: { fontWeight: 'bold', color: '#333', marginBottom: 4 },
  value: { fontWeight: 'normal', color: '#555' },
  empty: { textAlign: 'center', marginTop: 50, color: '#999', fontSize: 16 }
});