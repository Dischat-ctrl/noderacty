// src/routes/botRoutes.js
const express = require('express');
const router = express.Router();
const botController = require('../controllers/botController');

// Ruta para crear un bot
router.get('/createbot', botController.createBot);

// Ruta para modificar un archivo de bot
router.post('/modifyFile', botController.modifyFile);

// Ruta para renombrar un archivo de bot
router.post('/renameFile', botController.renameFile);

// Ruta para crear un archivo de bot
router.post('/createFile', botController.createFile);

// Ruta para eliminar un archivo de bot
router.post('/deleteFile', botController.deleteFile);

// Ruta para iniciar un bot
router.get('/startbot', botController.startBot);

// Ruta para ejecutar el bot y obtener logs en vivo
router.get('/runbot', botController.runBot);

// Ruta para obtener logs de un bot
router.get('/logs', botController.getBotLogs);

// Exportar las rutas
module.exports = router;
