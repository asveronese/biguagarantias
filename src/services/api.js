import { Platform } from 'react-native';

const getBaseURL = () => {
  return 'http://vendas.biguasom.com.br/garantias';
};

export const BASE_URL = getBaseURL();

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Erro ao realizar a operação');
  }
  return data;
};

export const api = {
  async login(cnpj, senha) {
    const response = await fetch(BASE_URL + '/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cnpj, senha }),
    });
    return handleResponse(response);
  },

  async listarGarantias(cnpj = null) {
    const cnpjLimpo = cnpj;
    const url = BASE_URL + '/api/garantias?cnpj=' + cnpjLimpo;
    const response = await fetch(url);
    return response.json();
  },

  async criarGarantia(formData) {
    const response = await fetch(BASE_URL + '/api/garantias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    return handleResponse(response);
  },

  getFotoUrl(id, numero) {
    return BASE_URL + '/api/garantias/' + id + '/foto/' + numero;
  },
  async excluirGarantia(id) {
    const response = await fetch(BASE_URL + '/api/garantias/' + id, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};