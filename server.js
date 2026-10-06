const express = require('express');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(express.json());

const storage = multer.diskStorage({
  destination: "public/uploads",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname))
  }
})

const upload = multer({ storage: storage });

// fazendo a conexão com o PostgreSQL
const pool = new Pool({
  user: 'postgres',
  password: 'senai',
  host: 'localhost',
  database: 'autoVision_db',
  port: 5432,
});

app.get('/api/usuarios', async (req, res) => {
  const { modelo } = req.query;
  const params = [];

  // CORREÇÃO 1: Adicionada a vírgula após a.criado_em
  // CORREÇÃO 2: Ajustado o ON do interesses (geralmente aponta para o id do anúncio, não do usuário)

  let query = `
    SELECT 
      a.id_anuncio, a.titulo, a.localidade, a.preco, a.imagem, a.vendedor_id, a.criado_em,
      u.nome AS vendedor, 
      u.usuario AS vendedor_usuario,
      u.telefone AS vendedor_telefone,   
      COUNT(i.id_interesse)::int AS interesses
    FROM anuncios a
    JOIN usuarios u ON u.id_usuario = a.vendedor_id
    LEFT JOIN interesses i ON i.anuncio_id = a.id_anuncio
    `;

  if (modelo) {
    params.push(`%${modelo}%`);
    query += ` WHERE a.titulo ILIKE $${params.length}`;
  }

  // CORREÇÃO 3: Adicionado um espaço antes de 'GROUP BY' para não colar com o texto anterior
  query += ' GROUP BY a.id_anuncio, u.nome, u.usuario, u.telefone ORDER BY a.criado_em DESC';

  try {
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      erro: 'Erro interno no servidor'
    });
  }
});

app.post('/api/login', async (req, res) => {
  const { usuario, senha } = req.body;
  const { rows } = await pool.query(
    `SELECT id_usuario, nome, usuario, telefone, foto_perfil
    FROM usuarios 
    WHERE usuario = $1 AND senha = $2`,
    [usuario, senha]
  );
  if (rows.length === 0) {
    return res.status(401).json({
      erro: 'Usuário ou senha inválidos'
    });
  }
  res.json(rows[0]);
});

app.post('/api/interesses/:anuncio_id', async (req, res) => {
  const { anuncio_id } = req.params;
  const { cliente_nome, cliente_contato } = req.body;

  if (!cliente_nome || !cliente_contato) {
    return res.status(400).json({
      erro: 'Nome e contato inválidos'
    });
  }

  await pool.query(
    `INSERT INTO interesses (anuncio_id, cliente_nome, cliente_contato)
    VALUES ($1, $2, $3)`,
    [anuncio_id, cliente_nome, cliente_contato]
  );

  const { rows } = await pool.query(
    `SELECT COUNT (*)::int AS total FROM interesses
    WHERE anuncio_id = $1`,
    [anuncio_id]
  );

  res.json({ interesses: rows[0].total });
});


app.get('/api/perfil/:id', async (req, res) => {
  const { id } = req.params;
  const anuncios = await pool.query(
    `SELECT a.id_anuncio, a.titulo, a.localidade, a.preco, a.imagem, a.criado_em,
    COUNT(i.id_interesse)::int AS interesses
    FROM anuncios a LEFT JOIN interesses i 
    ON i.anuncio_id = a.id_anuncio
    WHERE a.vendedor_id = $1 GROUP BY a.id_anuncio ORDER BY a.criado_em DESC`,
    [id]
  );

  const totalInteresses = anuncios.rows.reduce((acc, a) => acc + a.interesses, 0);

  res.json({
    totalAnuncios: anuncios.rows.length,
    totalInteresses,
    anuncios: anuncios.rows,
  });
});

app.post('/api/mensagens/:anuncio_id', async (req, res) => {
  const { anuncio_id } = req.params;
  const { cliente_nome, cliente_contato, mensagem } = req.body;

  if(!cliente_nome || !cliente_contato || !mensagem) {
    return res.status(400).json({
      erro: 'Nome, contato e mensagem são obrigatórios.'
    });
  }

  await pool.query(
    `INSERT INTO mensagens (anuncio_id, cliente_nome, cliente_contato, mensagem)
    VALUES ($1, $2, $3, $4)`,
    [anuncio_id, cliente_nome, cliente_contato, mensagem],
  );

  res.json({ok: true});
});

app. post('/api/anuncios', upload.single('imagem'), async (req, res) => {
  const { titulo, localidade, preco, vendedor_id } = req.body;
  if(!req.file) return res.status(400).json({ erro: 'Imagem é obrigatória.'});

  const { rows } = await pool.query(
    "INSERT INTO anuncios (titulo, localidade, preco, imagem, vendedor_id)VALUES ($1, $2, $3, $4, $5) RETURNING",
    [titulo, localidade, preco, req.file.filename, vendedor_id]
  );
  
  return res.status(201).json({
    mensagem: 'Anúncio criado com sucesso.',
    anuncio: rows[0]
  })
});

app.delete('/api/anuncios/:id', async (req, res) => {
  const { id } = req.params
  const { rows } = await pool.query("DELETE FROM anuncios WHERE id = $1 - RETURNING", [id])

  return res.status(200).json({
    ok: "Anuncio excluído",
    anuncio: rows})
});

app.listen(3000, () => {
  console.log(`API rodando em http://localhost:3000`);
});
