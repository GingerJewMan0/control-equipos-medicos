const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Obtener todos los equipos
app.get('/api/equipos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM equipos ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor al obtener equipos');
  }
});

// Crear un nuevo equipo
app.post('/api/equipos', async (req, res) => {
  const { codigo_inventario, nombre_equipo, hospital, ubicacion, estado } = req.body;
  try {
    const query = `
      INSERT INTO equipos (codigo_inventario, nombre_equipo, hospital, ubicacion, estado, ultima_actualizacion)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *;
    `;
    const values = [codigo_inventario, nombre_equipo, hospital, ubicacion, estado];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'El código de inventario ya existe.' });
    }
    res.status(500).send('Error al registrar el nuevo equipo');
  }
});

// Actualizar equipo existente
app.put('/api/equipos/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre_equipo, hospital, ubicacion, estado } = req.body;
  try {
    const query = `
      UPDATE equipos 
      SET nombre_equipo = $1, hospital = $2, ubicacion = $3, estado = $4, ultima_actualizacion = NOW() 
      WHERE id = $5 RETURNING *;
    `;
    const values = [nombre_equipo, hospital, ubicacion, estado, id];
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error al actualizar el equipo');
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});