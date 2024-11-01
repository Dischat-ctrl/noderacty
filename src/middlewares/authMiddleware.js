// src/middlewares/authMiddleware.js
const fs = require('fs');
const path = require('path');

const tokenFilePath = path.join(__dirname, '../../token.txt');

module.exports = (req, res, next) => {
  try {
    // Leer el token desde `token.txt`
    if (!fs.existsSync(tokenFilePath)) {
      return res.status(500).json({ error: 'token.txt no encontrado' });
    }

    const savedToken = fs.readFileSync(tokenFilePath, 'utf8').trim();
    const token = req.params.token; // Obtener el token de los parámetros de la URL

    if (!token) {
      return res.status(403).json({ error: 'Token requerido' });
    }

    if (token !== savedToken) {
      return res.status(401).json({ error: 'Token no válido' });
    }

    next(); // Token válido, continuar
  } catch (error) {
    console.error("Error al procesar el token:", error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
