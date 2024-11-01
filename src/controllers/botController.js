// src/controllers/botController.js
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const botsDir = path.join(__dirname, '../bots');
const logs = {}; // Almacenará los logs en memoria
const botStatus = {}; // Para almacenar el estado de los bots

// Crear un bot
const createBot = (req, res) => {
    const { name, disk, cpu, ram, language } = req.query;
    const botPath = path.join(botsDir, name);

    if (!fs.existsSync(botPath)) {
        fs.mkdirSync(botPath);
        const config = { name, disk, cpu, ram, language };
        fs.writeFileSync(path.join(botPath, 'config.json'), JSON.stringify(config, null, 2));
        res.status(201).json({ message: `Bot ${name} creado exitosamente`, config });
    } else {
        res.status(400).json({ error: `El bot ${name} ya existe` });
    }
};

const modifyFile = (req, res) => {
  const { bot, path: filePath, content } = req.body;  // Obteniendo bot, path y content del cuerpo de la solicitud

  // Decodificar el contenido recibido
  const decodedContent = decodeURIComponent(content);

  const botPath = path.join(__dirname, '../bots', bot);
  const fileFullPath = path.join(botPath, filePath);

  // Verificar si el bot existe
  if (!fs.existsSync(botPath)) {
      return res.status(404).json({ error: `El bot ${bot} no existe` });
  }

  // Verificar si el archivo existe
  if (!fs.existsSync(fileFullPath)) {
      return res.status(404).json({ error: `El archivo ${filePath} no existe en el bot ${bot}` });
  }

  try {
      // Escribir el contenido decodificado en el archivo, aceptando cualquier carácter
      fs.writeFileSync(fileFullPath, decodedContent, 'utf8');

      res.status(200).json({ message: `Archivo ${filePath} modificado exitosamente` });
  } catch (error) {
      console.error("Error al modificar el archivo:", error);
      res.status(500).json({ error: 'Error al modificar el archivo' });
  }
};

// Cambiar el nombre de un archivo
const renameFile = (req, res) => {
    const { bot, oldPath, newPath } = req.body; // Recibiendo parámetros del cuerpo de la solicitud
    const botDir = path.join(botsDir, bot);

    if (!fs.existsSync(botDir)) {
        return res.status(404).json({ error: `El bot ${bot} no existe` });
    }

    const oldFullPath = path.join(botDir, oldPath);
    const newFullPath = path.join(botDir, newPath);

    if (!fs.existsSync(oldFullPath)) {
        return res.status(404).json({ error: `El archivo ${oldPath} no existe en el bot ${bot}` });
    }

    // Cambiar el nombre del archivo
    fs.renameSync(oldFullPath, newFullPath);
    res.status(200).json({ message: `Archivo renombrado de ${oldPath} a ${newPath} exitosamente` });
};

// Crear un archivo
const createFile = (req, res) => {
    const { bot, path: filePath } = req.body; // Recibiendo parámetros del cuerpo de la solicitud
    const botDir = path.join(botsDir, bot);

    if (!fs.existsSync(botDir)) {
        return res.status(404).json({ error: `El bot ${bot} no existe` });
    }

    const fullPath = path.join(botDir, filePath);

    // Crear un archivo vacío
    fs.writeFileSync(fullPath, ''); // Creamos un archivo vacío
    res.status(201).json({ message: `Archivo ${filePath} creado exitosamente` });
};

// Eliminar un archivo
const deleteFile = (req, res) => {
    const { bot, path: filePath } = req.body; // Recibiendo parámetros del cuerpo de la solicitud
    const botDir = path.join(botsDir, bot);

    if (!fs.existsSync(botDir)) {
        return res.status(404).json({ error: `El bot ${bot} no existe` });
    }

    const fullPath = path.join(botDir, filePath);

    if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ error: `El archivo ${filePath} no existe en el bot ${bot}` });
    }

    // Eliminar el archivo
    fs.unlinkSync(fullPath);
    res.status(200).json({ message: `Archivo ${filePath} eliminado exitosamente` });
};

// Iniciar un bot
const startBot = (req, res) => {
    const { name } = req.query;
    const botPath = path.join(botsDir, name);

    if (!fs.existsSync(botPath)) {
        return res.status(404).json({ error: `El bot ${name} no existe` });
    }

    const configPath = path.join(botPath, 'config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const mainScript = config.language === 'python' ? 'main.py' : 'main.js';
    const command = config.language === 'python' ? 'python' : 'node';

    // Actualizar el estado del bot a "iniciado"
    botStatus[name] = 'running';

    // Ejecutar el comando y capturar logs en tiempo real
    const child = spawn(command, ['-u', path.join(botPath, mainScript)], { cwd: botPath });

    // Guardar logs en memoria y en la consola
    child.stdout.on('data', (data) => {
        logs[name] = logs[name] || [];
        const logMessage = data.toString().trim();
        logs[name].push({ type: 'log', message: logMessage });
        console.log(`[${name} LOG]: ${logMessage}`); // Imprimir en la consola
    });

    child.stderr.on('data', (data) => {
        logs[name] = logs[name] || [];
        const errorMessage = data.toString().trim();
        logs[name].push({ type: 'error', message: errorMessage });
        console.error(`[${name} ERROR]: ${errorMessage}`); // Imprimir en la consola
    });

    child.on('close', (code) => {
        logs[name] = logs[name] || [];
        logs[name].push({ type: 'info', message: `Proceso cerrado con código ${code}` });
        console.log(`[${name} INFO]: Proceso cerrado con código ${code}`); // Imprimir en la consola
        botStatus[name] = 'stopped'; // Actualizar el estado a detenido
    });

    res.status(200).json({ message: `Bot ${name} ejecutado`, output: 'Logs en tiempo real disponibles' });
};

// Ejecutar un bot y obtener logs en vivo
const runBot = (req, res) => {
    const { name } = req.query;
    const botPath = path.join(botsDir, name);

    if (!fs.existsSync(botPath)) {
        return res.status(404).json({ error: `El bot ${name} no existe` });
    }

    const configPath = path.join(botPath, 'config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const mainScript = config.language === 'python' ? 'main.py' : 'main.js';
    const command = config.language === 'python' ? 'python' : 'node';

    // Actualizar el estado del bot a "ejecutando"
    botStatus[name] = 'running';

    // Capturar logs en tiempo real
    const child = spawn(command, ['-u', path.join(botPath, mainScript)], { cwd: botPath });

    // Guardar logs en memoria y en la consola
    child.stdout.on('data', (data) => {
        logs[name] = logs[name] || [];
        const logMessage = data.toString().trim();
        logs[name].push({ type: 'log', message: logMessage });
        console.log(`[${name} LOG]: ${logMessage}`); // Imprimir en la consola
    });

    child.stderr.on('data', (data) => {
        logs[name] = logs[name] || [];
        const errorMessage = data.toString().trim();
        logs[name].push({ type: 'error', message: errorMessage });
        console.error(`[${name} ERROR]: ${errorMessage}`); // Imprimir en la consola
    });

    child.on('close', (code) => {
        logs[name] = logs[name] || [];
        logs[name].push({ type: 'info', message: `Proceso cerrado con código ${code}` });
        console.log(`[${name} INFO]: Proceso cerrado con código ${code}`); // Imprimir en la consola
        botStatus[name] = 'stopped'; // Actualizar el estado a detenido
    });

    res.status(200).json({ message: `Bot ${name} ejecutado`, output: 'Logs en tiempo real disponibles' });
};

// Obtener logs de un bot
const getBotLogs = (req, res) => {
    const { name } = req.query;

    if (!logs[name]) {
        return res.status(404).json({ error: `No hay logs para el bot ${name}` });
    }

    res.status(200).json({ logs: logs[name] });
};

// Exportar las funciones
module.exports = {
    createBot,
    modifyFile,
    renameFile,
    createFile,
    deleteFile,
    startBot,
    runBot,
    getBotLogs,
};
