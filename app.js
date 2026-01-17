// app.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const sequelize = require('./config/database');
const webhookRoutes = require('./routes/webhook');
const sendRoutes = require('./routes/send');
const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Log para verificar que .env se está cargando correctamente
console.log('📦 Variables de entorno cargadas:', {
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_HOST: process.env.DB_HOST,
});

app.use(bodyParser.json());
app.use('/webhooks', webhookRoutes);
app.use('/send', sendRoutes);

app.get('/', (req, res) => {
  res.send('✅ App Node.js + Express conectada y funcionando correctamente.');
});

sequelize.authenticate()
  .then(() => {
    console.log('✅ Conectado a MySQL');
    return sequelize.sync();
  })
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 Servidor corriendo en el puerto ${PORT}`));
  })
  .catch(err => {
    console.error('❌ Error al conectar a MySQL:', err);
  });

// Logs opcionales para errores inesperados
process.on('uncaughtException', err => {
  console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', err => {
  console.error('❌ Unhandled Rejection:', err);
});
