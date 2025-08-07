// config/whatsapp.js
require('dotenv').config();

module.exports = {
  token: process.env.WHATSAPP_TOKEN,
  phoneNumberId: process.env.PHONE_NUMBER_ID,
};
