// Define las rutas del webhook
const express = require('express');
const router = express.Router();
const { handleMessage } = require('../controllers/messageController');

// Ruta GET para la verificación del webhook (Meta lo requiere)
router.get('/', (req, res) => {
  const verify_token = process.env.VERIFY_TOKEN;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Verifica si el token coincide
  if (mode && token === verify_token) {
    return res.status(200).send(challenge); // Responde con el challenge
  }
  res.sendStatus(403); // Rechaza si el token es incorrecto
});

// Ruta POST para recibir mensajes
router.post('/', handleMessage);

module.exports = router; // Exporta las rutas
