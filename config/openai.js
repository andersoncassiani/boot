// Importa las clases necesarias de OpenAI
const { Configuration, OpenAIApi } = require('openai');

// Configura el acceso con la API key
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

// Crea una instancia de la API
const openai = new OpenAIApi(configuration);
module.exports = openai; // Exporta para usar en otros módulos
