// services/whatsappService.js - Solo typing indicators nativos
const axios = require('axios');
const { token, phoneNumberId } = require('../config/whatsapp');

// Función original de envío
async function sendMessage(to, text) {
  try {
    const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text }
    };

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const response = await axios.post(url, payload, { headers });
    console.log(`📤 Mensaje enviado a ${to}: "${text.substring(0, 50)}..."`);
    return response.data;
  } catch (error) {
    const errorInfo = error.response?.data || error.message;
    console.error(`❌ Error al enviar el mensaje a ${to}:`, JSON.stringify(errorInfo, null, 2));
    throw new Error('Error al enviar el mensaje. ' + JSON.stringify(errorInfo));
  }
}

// ⭐ SOLO typing indicators nativos (3 puntos reales)
async function sendTypingIndicator(to, action = 'typing_on') {
  try {
    const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to,
      action: action
    };
    
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log(`🔄 Enviando typing indicator ${action} a ${to}...`);
    const response = await axios.post(url, payload, { headers });
    console.log(`📝 ✅ Typing indicator ${action} enviado exitosamente`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error en typing indicator:`, error.response?.data || error.message);
    
    // Log detallado para debug
    if (error.response?.status === 400) {
      console.error('🚨 Error 400: Posible problema de permisos o formato');
    }
    if (error.response?.status === 401) {
      console.error('🚨 Error 401: Token inválido o expirado');
    }
    
    throw error;
  }
}

// ⭐ Función limpia - SOLO 3 puntos nativos
async function sendMessageWithTyping(to, text, type = 'text', duration = 2000) {
  try {
    console.log(`⏱️ Iniciando typing nativo para ${to} por ${duration}ms`);
    
    // 1. Mostrar los 3 puntos nativos
    await sendTypingIndicator(to, 'typing_on');
    
    // 2. Esperar (usuario ve los 3 puntos)
    await new Promise(resolve => setTimeout(resolve, duration));
    
    // 3. Los 3 puntos desaparecen automáticamente al enviar mensaje
    const response = await sendMessage(to, text);
    
    console.log(`✅ Mensaje con typing nativo enviado correctamente`);
    return response;
    
  } catch (error) {
    console.error('❌ Error en typing nativo, enviando mensaje directo...');
    // Si falla el typing, enviar mensaje sin delay
    return await sendMessage(to, text);
  }
}

// ⭐ Alternativa con solo delay (sin mensajes visibles)
async function sendMessageWithDelay(to, text, duration = 2000) {
  try {
    console.log(`⏱️ Esperando ${duration}ms antes de enviar mensaje...`);
    
    // Solo esperar sin enviar nada
    await new Promise(resolve => setTimeout(resolve, duration));
    
    // Enviar mensaje
    return await sendMessage(to, text);
    
  } catch (error) {
    console.error('❌ Error en sendMessageWithDelay:', error);
    throw error;
  }
}

module.exports = { 
  sendMessage, 
  sendTypingIndicator, 
  sendMessageWithTyping,
  sendMessageWithDelay
};