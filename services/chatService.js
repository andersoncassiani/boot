// services/chatService.js

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: '',
});

/**
 * Genera una respuesta desde OpenAI usando el contexto de la sede.
 * @param {string} message - Mensaje del usuario
 * @param {object} contexto - Objeto de contexto según la sede seleccionada
 * @returns {Promise<string>}
 */
async function getChatResponse(message, contexto) {
  try {
    const chat = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        contexto, // 🧠 Contexto del sistema (Cartagena o Barranquilla)
        { role: 'user', content: message }
      ],
    });

    const respuesta = chat.choices[0].message.content;
    console.log('🤖 IA respondió:', respuesta);
    return respuesta;
  } catch (error) {
    console.error('❌ Error al generar respuesta con IA:', error.response?.data || error.message);
    return 'Lo siento, hubo un problema generando la respuesta. Intenta más tarde.';
  }
}

module.exports = { getChatResponse };
