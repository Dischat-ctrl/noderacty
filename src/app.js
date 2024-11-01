// src/app.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

const authMiddleware = require('./middlewares/authMiddleware');
const botRoutes = require('./routes/botRoutes');

const tokenFilePath = path.join(__dirname, '../token.txt');
app.use(express.json());

// Función para generar un token en el formato requerido
function generateToken() {
  const randomPart = Math.random().toString(36).substr(2, 12); // Generar parte aleatoria de 12 caracteres
  return `noderactyl-${randomPart}`;
}

// Asegurar la existencia de token.txt
function ensureTokenFile() {
  if (!fs.existsSync(tokenFilePath)) {
    console.log("token.txt no existe. Generando nuevo token...");
    const token = generateToken();
    fs.writeFileSync(tokenFilePath, token, 'utf8'); // Crear y escribir el token en token.txt
    console.log('Token generado y almacenado en token.txt:', token);
  } else {
    console.log('El archivo token.txt ya existe.');
  }
}

// Llamar a ensureTokenFile antes de cargar el middleware
ensureTokenFile(); // Verificar o crear el token.txt

// Usar el middleware de autenticación en todas las rutas de /api/
app.use('/api/:token', authMiddleware, botRoutes); // Asegurarse de que el token esté en la ruta

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

module.exports = app;
