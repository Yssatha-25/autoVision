const express = require('express');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(express.json());

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
      a.id_usuario, a.titulo, a.localidade, a.preco, a.imagem, a.vendedor_id, a.criado_em,
      u.nome AS vendedor, 
      u.usuario AS vendedor_usuario,
      u.telefone AS vendedor_telefone,   
      COUNT(i.id_interesse)::int AS interesses
    FROM anuncios a
    JOIN usuarios u ON u.id_usuario = a.vendedor_id
    LEFT JOIN interesses i ON i.anuncio_id = a.id_usuario
    `;

  if (modelo) {
    params.push(`%${modelo}%`);
    query += ` WHERE a.titulo ILIKE $${params.length}`;
  }

  // CORREÇÃO 3: Adicionado um espaço antes de 'GROUP BY' para não colar com o texto anterior
  query += ' GROUP BY a.id_usuario, u.nome, u.usuario, u.telefone ORDER BY a.criado_em DESC';

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
    `SELECT id, nome, usuario, telefone, foto_perfil
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

app.listen(3000, () => {
  console.log(`API rodando em http://localhost:3000`);
});
