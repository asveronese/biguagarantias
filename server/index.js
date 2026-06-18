require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Firebird = require('node-firebird');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

const formataCNPJ = (v) => {
  const n = (v || "").replace(/\D/g, "");
  return n.length === 14 ? n.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5") : v;
};
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const dbOptions = {
  host: process.env.DB_HOST || '192.168.1.3',
  port: parseInt(process.env.DB_PORT || '3050'),
  database: process.env.DB_NAME || 'BIGUA',
  user: process.env.DB_USER || 'SYSDBA',
  password: process.env.DB_PASSWORD || 'EPROM0304'
};

const readBlob = (blob) => {
  return new Promise((resolve) => {
    if (typeof blob !== 'function') {
      return resolve(blob);
    }
    blob((err, name, stream) => {
      if (err) return resolve(null);
      const chunks = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      stream.on('error', () => resolve(null));
    });
  });
};

const executeQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    Firebird.attach(dbOptions, (err, db) => {
      if (err) return reject(err);
      db.query(query, params, async (err, result) => {
        if (err) {
          db.detach();
          return reject(err);
        }
        if (Array.isArray(result)) {
          try {
            for (let row of result) {
              for (let key in row) {
                if (typeof row[key] === 'function') {
                  row[key] = await readBlob(row[key]);
                }
              }
            }
            db.detach();
            resolve(result);
          } catch (e) {
            db.detach();
            reject(e);
          }
        } else {
          db.detach();
          resolve(result);
        }
      });
    });
  });
};

const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/login', async (req, res) => {
  const { cnpj, senha } = req.body;
  try {
    const cnpjLimpo = (cnpj || '').replace(/[^\d]/g, '');
    const rows = await executeQuery(
      `SELECT NOME, NUM_DOCTO1, CODIGO FROM CADASTRO
       WHERE REPLACE(REPLACE(REPLACE(REPLACE(NUM_DOCTO1, '.', ''), '/', ''), '-', ''), ' ', '') = ?
       AND ESP_SENHA_APP = ?`,
      [cnpjLimpo, senha]
    );
    if (rows.length > 0) {
      return res.json({ success: true, nome: rows[0].NOME, cnpj, codigo: rows[0].CODIGO });
    }
    return res.json({ success: false });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/garantias', async (req, res) => {
  try {
    const rows = await executeQuery(
      `SELECT g.ID, g.PROTOCOLO, g.PRODUTO, p.DESCRICAO, g.TIPO, g.DEFEITO, g.STATUS, g.DATA_ABERTURA
       FROM GARANTIAS_APP g
       LEFT JOIN CEPRODUTOS p ON g.PRODUTO = p.PRODUTO
       WHERE g.CNPJ = ?
       ORDER BY g.ID DESC`,
      [formataCNPJ(req.query.cnpj)]
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
      [newId, formataCNPJ(cnpj), codigo, solicitante, fone, email, qte, produto, tipo, defeito, obs, suporte, protocolo, nfe, envio, 'Pendente', new Date(), new Date()]
    );
    res.json({ success: true, protocolo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/garantias/fotos', upload.array('fotos', 5), async (req, res) => {
  try {
    const idRes = await executeQuery('SELECT MAX(ID) as MAXID FROM GARANTIAS_APP');
    const newId = (idRes[0].MAXID || 0) + 1;
    const protocolo = 'G-' + Date.now();
    const { cnpj, codigo, solicitante, fone, email, qte, produto, tipo, defeito, obs, suporte, nfe, envio } = req.body;
    const img1 = req.files && req.files[0] ? req.files[0].buffer : null;
    const img2 = req.files && req.files[1] ? req.files[1].buffer : null;
    const img3 = req.files && req.files[2] ? req.files[2].buffer : null;
    const img4 = req.files && req.files[3] ? req.files[3].buffer : null;
    const img5 = req.files && req.files[4] ? req.files[4].buffer : null;
    await executeQuery(
      `INSERT INTO GARANTIAS_APP (ID, CNPJ, CODIGO, SOLICITANTE, FONE, EMAIL, QTE, PRODUTO, TIPO, DEFEITO, OBS, SUPORTE, PROTOCOLO, NFE, ENVIO, STATUS, DATA_ABERTURA, DATA_ATUALIZACAO, IMAGEM1, IMAGEM2, IMAGEM3, IMAGEM4, IMAGEM5)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [newId, formataCNPJ(cnpj), codigo, solicitante, fone, email, qte || 1, produto, tipo, defeito, obs, suporte, protocolo, nfe, envio, 'Pendente', new Date(), new Date(), img1, img2, img3, img4, img5]
    );
    res.json({ success: true, protocolo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/garantias/:id', async (req, res) => {
  try {
    const rows = await executeQuery(
      `SELECT g.*, p.DESCRICAO as PRODUTO_DESCRICAO
       FROM GARANTIAS_APP g
       LEFT JOIN CEPRODUTOS p ON g.PRODUTO = p.PRODUTO
       WHERE g.ID = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Garantia não encontrada' });
    }
    const item = rows[0];
    const fotos = [];
    if (item.IMAGEM1) fotos.push(`data:image/jpeg;base64,${item.IMAGEM1.toString('base64')}`);
    if (item.IMAGEM2) fotos.push(`data:image/jpeg;base64,${item.IMAGEM2.toString('base64')}`);
    if (item.IMAGEM3) fotos.push(`data:image/jpeg;base64,${item.IMAGEM3.toString('base64')}`);
    if (item.IMAGEM4) fotos.push(`data:image/jpeg;base64,${item.IMAGEM4.toString('base64')}`);
    if (item.IMAGEM5) fotos.push(`data:image/jpeg;base64,${item.IMAGEM5.toString('base64')}`);

    res.json({
      id: item.ID,
      cnpj: item.CNPJ,
      codigo: item.CODIGO,
      solicitante: item.SOLICITANTE,
      fone: item.FONE,
      email: item.EMAIL,
      qte: item.QTE,
      produto: item.PRODUTO,
      produtoDescricao: item.PRODUTO_DESCRICAO,
      tipo: item.TIPO,
      defeito: item.DEFEITO,
      obs: item.OBS,
      suporte: item.SUPORTE,
      protocolo: item.PROTOCOLO,
      nfe: item.NFE,
      envio: item.ENVIO,
      status: item.STATUS,
      fotos
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/garantias/:id', upload.array('fotos', 5), async (req, res) => {
  try {
    const { id } = req.params;
    const { produto, tipo, defeito, envio, suporte, nfe, obs, solicitante, fone, email } = req.body;

    const current = await executeQuery('SELECT IMAGEM1, IMAGEM2, IMAGEM3, IMAGEM4, IMAGEM5, STATUS FROM GARANTIAS_APP WHERE ID = ?', [id]);
    if (current.length === 0) {
      return res.status(404).json({ success: false, error: 'Garantia não encontrada' });
    }

    if (current[0].STATUS?.toLowerCase() !== 'pendente') {
      return res.status(400).json({ success: false, error: 'Apenas garantias com status Pendente podem ser alteradas' });
    }

    const currentImages = [
      current[0].IMAGEM1,
      current[0].IMAGEM2,
      current[0].IMAGEM3,
      current[0].IMAGEM4,
      current[0].IMAGEM5
    ];

    const finalImages = [null, null, null, null, null];
    let fileIndex = 0;

    for (let i = 0; i < 5; i++) {
      const status = req.body[`foto_status_${i}`];
      if (status === 'manter' || status === 'existente') {
        finalImages[i] = currentImages[i];
      } else if (status === 'remover') {
        finalImages[i] = null;
      } else if (status === 'novo') {
        if (req.files && req.files[fileIndex]) {
          finalImages[i] = req.files[fileIndex].buffer;
          fileIndex++;
        } else {
          finalImages[i] = null;
        }
      } else {
        finalImages[i] = null;
      }
    }

    await executeQuery(
      `UPDATE GARANTIAS_APP SET 
        PRODUTO = ?, TIPO = ?, DEFEITO = ?, ENVIO = ?, SUPORTE = ?, NFE = ?, OBS = ?, 
        SOLICITANTE = ?, FONE = ?, EMAIL = ?, DATA_ATUALIZACAO = ?,
        IMAGEM1 = ?, IMAGEM2 = ?, IMAGEM3 = ?, IMAGEM4 = ?, IMAGEM5 = ?
       WHERE ID = ?`,
      [
        produto, tipo, defeito, envio || '', suporte || '', nfe || '', obs || '',
        solicitante || '', fone || '', email || '', new Date(),
        finalImages[0], finalImages[1], finalImages[2], finalImages[3], finalImages[4],
        id
      ]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/produtos', async (req, res) => {
  try {
    const busca = '%' + (req.query.busca || '') + '%';
    const rows = await executeQuery(
      'SELECT PRODUTO, DESCRICAO FROM CEPRODUTOS WHERE UPPER(DESCRICAO) LIKE UPPER(?) OR PRODUTO LIKE ? ORDER BY DESCRICAO',
      [busca, busca]
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

app.delete('/api/garantias/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const statusAtual = await executeQuery('SELECT STATUS FROM GARANTIAS_APP WHERE ID = ?', [id]);
    if (statusAtual.length === 0) {
      return res.status(404).json({ success: false, error: 'Garantia não encontrada' });
    }
    if (statusAtual[0].STATUS?.toLowerCase() !== 'pendente') {
      return res.status(400).json({ success: false, error: 'Apenas garantias com status Pendente podem ser excluídas' });
    }
    await executeQuery('DELETE FROM GARANTIAS_APP WHERE ID = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/trocar-senha', async (req, res) => {
  const { cnpj, senhaAtual, novaSenha } = req.body;
  try {
    const cnpjLimpo = (cnpj || '').replace(/[^\d]/g, '');
    const rows = await executeQuery(
      `SELECT NOME, NUM_DOCTO1, CODIGO FROM CADASTRO
       WHERE REPLACE(REPLACE(REPLACE(REPLACE(NUM_DOCTO1, '.', ''), '/', ''), '-', ''), ' ', '') = ?
       AND ESP_SENHA_APP = ?`,
      [cnpjLimpo, senhaAtual]
    );
    if (rows.length === 0) {
      return res.json({ success: false, error: 'Senha atual incorreta' });
    }
    await executeQuery(
      `UPDATE CADASTRO SET ESP_SENHA_APP = ?
       WHERE REPLACE(REPLACE(REPLACE(REPLACE(NUM_DOCTO1, '.', ''), '/', ''), '-', ''), ' ', '') = ?`,
      [novaSenha, cnpjLimpo]
    );
    return res.json({ success: true, message: 'Senha alterada com sucesso' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
