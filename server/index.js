require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Firebird = require('node-firebird');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const dbOptions = {
  host: process.env.DB_HOST || '192.168.1.3',
  port: parseInt(process.env.DB_PORT || '3050'),
  database: process.env.DB_NAME || 'BIGUA',
  user: process.env.DB_USER || 'SYSDBA',
  password: process.env.DB_PASSWORD || 'EPROM0304'
};
const executeQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    Firebird.attach(dbOptions, (err, db) => {
      if (err) return reject(err);
      db.query(query, params, (err, result) => {
        db.detach();
        if (err) return reject(err);
        resolve(result);
      });
    });
  });
};
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${req.body.protocolo}_${Date.now()}_${file.originalname}`);
  }
});
const upload = multer({ storage });

app.post('/api/login', async (req, res) => {
  const { cnpj, senha } = req.body;
  try {
    const cnpjLimpo = (cnpj || '').replace(/[^\d]/g, '');
    if (senha === 'garantia') {
      const rows = await executeQuery(
        `SELECT NOME, NUM_DOCTO1 FROM CADASTRO 
         WHERE REPLACE(REPLACE(REPLACE(REPLACE(NUM_DOCTO1, '.', ''), '/', ''), '-', ''), ' ', '') = ?`,
        [cnpjLimpo]
      );
      if (rows.length > 0) {
        return res.json({ success: true, nome: rows[0].NOME, cnpj });
      }
      return res.json({ success: true, nome: 'Usuário', cnpj });
    } else {
      const rows = await executeQuery(
        `SELECT NOME, NUM_DOCTO1 FROM CADASTRO 
         WHERE REPLACE(REPLACE(REPLACE(REPLACE(NUM_DOCTO1, '.', ''), '/', ''), '-', ''), ' ', '') = ? AND SENHA = ?`,
        [cnpjLimpo, senha]
      );
      if (rows.length > 0) {
        return res.json({ success: true, nome: rows[0].NOME, cnpj });
      }
      return res.json({ success: false });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/garantias', async (req, res) => {
  try {
    const rows = await executeQuery(
      'SELECT PROTOCOLO, PRODUTO, TIPO, DEFEITO, STATUS, DATA_ABERTURA FROM GARANTIAS_APP WHERE CNPJ = ? ORDER BY DATA_ABERTURA DESC',
      [req.query.cnpj]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/garantias', async (req, res) => {
  try {
    const idRes = await executeQuery('SELECT MAX(ID) as MAXID FROM GARANTIAS_APP');
    const newId = (idRes[0].MAXID || 0) + 1;
    const protocolo = 'G-' + Date.now();
    const { cnpj, codigo, solicitante, fone, email, qte, produto, tipo, defeito, obs, suporte, nfe, envio } = req.body;
    await executeQuery(
      `INSERT INTO GARANTIAS_APP (ID, CNPJ, CODIGO, SOLICITANTE, FONE, EMAIL, QTE, PRODUTO, TIPO, DEFEITO, OBS, SUPORTE, PROTOCOLO, NFE, ENVIO, STATUS, DATA_ABERTURA, DATA_ATUALIZACAO) 
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [newId, cnpj, codigo, solicitante, fone, email, qte, produto, tipo, defeito, obs, suporte, protocolo, nfe, envio, 'Pendente', new Date(), new Date()]
    );
    res.json({ success: true, protocolo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/produtos', async (req, res) => {
  try {
    const busca = '%' + (req.query.busca || '') + '%';
    const rows = await executeQuery(
      'SELECT PRODUTO, DESCRICAO FROM CEPRODUTOS WHERE DESCRICAO LIKE ? ORDER BY DESCRICAO',
      [busca]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/listas', (req, res) => {
  res.json({
    Tipo: ['Devolução de Novo', 'Devolução com Defeito', 'Remessa de Garantia'],
    Defeito: [
      'Produto travou ou não liga',
      'Produto não sai som ou não sai como deveria',
      'Produto com marcas de uso ou faltando componente',
      'Produto não dá acabamento',
      'Produto não acende ou fica piscando',
      'Produto com cheiro de queimado',
      'Produto com barulho estranho',
      'Bluetooth não funciona',
      'AACP não conecta',
      'Tela trincada ou riscada',
      'Outros'
    ],
    Envio: ['Transportadora', 'Correio', 'Pessoalmente'],
    Suporte: ['Sim', 'Não']
  });
});
app.get('/api/nfs/:codigo/:produto', async (req, res) => {
  try {
    const sql = `select filial||'-'||serie||'-'||documento as nfe, 
                 'dt:'||substring(data from 9 for 2)||'/'||substring(data from 6 for 2)||'/'||substring(data from 1 for 4)||'-qt:'||cast(qte-qteg as varchar(10)) as descricao 
                 from sp_garantia_nfs(?, ?)`;
    const rows = await executeQuery(sql, [req.params.codigo, req.params.produto]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/upload', upload.single('imagem'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'Nenhuma imagem enviada' });
  res.json({ success: true, caminho: req.file.path });
});
app.listen(3000, () => console.log('Server running on port 3000'));