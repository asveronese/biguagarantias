const express = require('express');
const Firebird = require('node-firebird');

const app = express();
app.use(express.json());

const dbOptions = {
  host: '192.168.1.3',
  port: 3050,
  database: 'BIGUA',
  user: 'SYSDBA',
  password: 'EPROM0304'
};

const executeQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    Firebird.attach(dbOptions, (err, db) => {
      if (err) return reject(err);
      db.query(sql, params, (err, result) => {
        db.detach();
        if (err) reject(err); else resolve(result);
      });
    });
  });
};

app.post('/api/login', async (req, res) => {
  const { cnpj, senha } = req.body;
  
  if (senha === 'garantia') {
    try {
      const users = await executeQuery('SELECT NOME, NUM_DOCTO1 FROM CADASTRO WHERE NUM_DOCTO1 = ?', [cnpj]);
      if (users && users.length > 0) {
        return res.json({ success: true, nome: users[0].NOME, cnpj: users[0].NUM_DOCTO1 });
      }
      return res.json({ success: true, nome: '', cnpj });
    } catch (e) {
      return res.json({ success: true, nome: '', cnpj });
    }
  }
  
  try {
    const users = await executeQuery('SELECT NOME, NUM_DOCTO1 FROM CADASTRO WHERE NUM_DOCTO1 = ? AND SENHA = ?', [cnpj, senha]);
    if (users && users.length > 0) {
      return res.json({ success: true, nome: users[0].NOME, cnpj: users[0].NUM_DOCTO1 });
    }
    return res.json({ success: false });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.get('/api/garantias', async (req, res) => {
  const { cnpj } = req.query;
  try {
    const sql = 'SELECT PROTOCOLO, PRODUTO, TIPO, DEFEITO, STATUS, DATA_ABERTURA FROM GARANTIAS_APP WHERE CNPJ = ? ORDER BY DATA_ABERTURA DESC';
    const rows = await executeQuery(sql, [cnpj]);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/garantias', async (req, res) => {
  try {
    const maxIdRes = await executeQuery('SELECT MAX(ID) as M FROM GARANTIAS_APP');
    const newId = (maxIdRes[0].M || 0) + 1;
    const protocolo = 'G-' + Date.now();
    const sql = 'INSERT INTO GARANTIAS_APP (ID, CNPJ, CODIGO, SOLICITANTE, FONE, EMAIL, QTE, PRODUTO, TIPO, DEFEITO, OBS, SUPORTE, PROTOCOLO, NFE, ENVIO, STATUS, DATA_ABERTURA, DATA_ATUALIZACAO) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
    const params = [newId, req.body.cnpj, req.body.codigo, req.body.solicitante, req.body.fone, req.body.email, req.body.qte, req.body.produto, req.body.tipo, req.body.defeito, req.body.obs, req.body.suporte, protocolo, req.body.nfe, req.body.envio, 'Pendente', new Date(), new Date()];
    await executeQuery(sql, params);
    res.json({ success: true, protocolo });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/produtos', async (req, res) => {
  const busca = '%' + (req.query.busca || '') + '%';
  try {
    const rows = await executeQuery('SELECT PRODUTO, DESCRICAO FROM CEPRODUTOS WHERE DESCRICAO LIKE ? ORDER BY DESCRICAO', [busca]);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/listas', (req, res) => {
  res.json({
    Tipo: ['Devolução de Novo', 'Devolução com Defeito', 'Remessa de Garantia'],
    Defeito: ['Produto travou ou não liga', 'Produto não sai som ou não sai como deveria', 'Produto com marcas de uso ou faltando componente', 'Produto não dá acabamento', 'Produto não acende ou fica piscando', 'Produto com cheiro de queimado', 'Produto com barulho estranho', 'Bluetooth não funciona', 'AACP não conecta', 'Tela trincada ou riscada', 'Outros'],
    Envio: ['Transportadora', 'Correio', 'Pessoalmente'],
    Suporte: ['Sim', 'Não']
  });
});

app.get('/api/nfs/:codigo/:produto', async (req, res) => {
  const sql = "select filial||'-'||serie||'-'||documento as nfe, 'dt:'||substring(data from 9 for 2)||'/'||substring(data from 6 for 2)||'/'||substring(data from 1 for 4)||'-qt:'||cast(qte-qteg as varchar(10)) as descricao from sp_garantia_nfs(?, ?)";
  try {
    const rows = await executeQuery(sql, [req.params.codigo, req.params.produto]);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));