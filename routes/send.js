// routes/send.js
const express = require('express');
const router = express.Router();
const { sendMessage } = require('../services/whatsappService');

router.get('/', async (req, res) => {
  const to = req.query.to;
  const text = req.query.text;

  if (!to || !text) {
    return res.status(400).json({
      success: false,
      message: 'Parámetros faltantes: debes enviar ?to=NUMERO&text=MENSAJE',
    });
  }

  try {
    await sendMessage(to, text);
    res.json({
      success: true,
      message: `Mensaje enviado a ${to}`,
      text,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
});

module.exports = router;
