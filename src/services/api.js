import { Platform } from 'react-native';

const getBaseURL = () => {
  return 'https://strenuous-approve-cold.ngrok-free.dev';
};

const BASE_URL = getBaseURL();

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

  async listarGarantias(cnpj = null, status = null) {
    let url = `${BASE_URL}/api/garantias?`;
    if (cnpj) url += `cnpj=${cnpj}&`;
    if (status) url += `status=${status}`;
    const response = await fetch(url);
    return response.json();
  },

  async criarGarantia(formData) {
    const response = await fetch(`${BASE_URL}/api/garantias`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Erro ao criar garantia');
    return data;
  },

  getFotoUrl(id, numero) {
    return `${BASE_URL}/api/garantias/${id}/foto/${numero}`;
  },
};