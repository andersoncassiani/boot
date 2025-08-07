// models/Message.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Definimos el modelo Message con Sequelize
const Message = sequelize.define('Message', {
  from: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  to: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  response: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'messages', // nombre de la tabla en MySQL
  timestamps: false // no usa createdAt ni updatedAt automáticos
});

module.exports = Message;
