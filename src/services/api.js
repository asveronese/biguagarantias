import { Platform } from 'react-native';

const getBaseURL = () => {
  //return 'http://192.168.15.9:3000';
	return 'http://vendas.biguasom.com.br/garantias';
};

const BASE_URL = getBaseURL();
export { BASE_URL };

export const api = {
  async login(cnpj, senha) {
    const response = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cnpj, senha }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Erro ao fazer login');
    return data;
  },

  async listarGarantias(cnpj = null) {
    let url = `${BASE_URL}/api/garantias?`;
    if (cnpj) url += `cnpj=${cnpj}`;
    const response = await fetch(url);
    return response.json();
  },

  async criarGarantia(formData) {
    const response = await fetch(`${BASE_URL}/api/garantias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Erro ao criar garantia');
    return data;
  },

  getFotoUrl(id, numero) {
	return `${BASE_URL}/api/garantias/${id}/foto/${numero}`;
  },
};