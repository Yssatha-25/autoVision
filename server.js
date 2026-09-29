const express = require('express');
const {Pool} = require('pg');
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

    if (modelo){
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
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
});

app.listen(3000, () => {
  console.log(`API rodando em http://localhost:3000`);
});
