// controllers/messageController.js
const Message = require('../models/Message');
const { getChatResponse } = require('../services/chatService');
const { sendMessageWithTyping } = require('../services/whatsappService');
const { getContextBySede } = require('../services/context');
const { setSede, getSede, setLanguage, getLanguage } = require('../services/session');

// FUNCIÓN MEJORADA de detección de idioma
function detectLanguage(text) {
  const englishPatterns = [
    /\b(hello|hi|hey|good|morning|afternoon|evening|night|thanks|please|help|what|where|when|how|booking|reservation|menu|price|cost|locations|club|experience|want|make|need|can|would|like)\b/i,
  ];
  
  const spanishPatterns = [
    /\b(hola|buenas|hey|saludos|gracias|por favor|ayuda|qué|dónde|cuándo|cómo|reserva|menú|precio|costo|vale|sedes|club|experiencia|quiero|hacer|necesito|puedo|gustaría)\b/i,
    /[ñáéíóúü]/i  // Caracteres específicos del español
  ];
  
  const textLower = text.toLowerCase();
  
  // Conteo de palabras específicas
  const englishMatches = (textLower.match(englishPatterns[0]) || []).length;
  const spanishMatches = (textLower.match(spanishPatterns[0]) || []).length;
  
  // Si hay caracteres específicos del español, priorizar español
  if (spanishPatterns[1].test(text)) return 'es';
  
  // Frases específicas en inglés
  if (/\b(i want|i need|i would like|do you|can you|how much|what time)\b/i.test(textLower)) {
    return 'en';
  }
  
  // Frases específicas en español  
  if (/\b(me gustaría|necesito|quiero|puedes|puedo|cuánto cuesta|qué hora)\b/i.test(textLower)) {
    return 'es';
  }
  
  // Si hay más coincidencias en inglés
  if (englishMatches > spanishMatches && englishMatches > 0) return 'en';
  
  // Por defecto, español
  return 'es';
}

// Mejora de la función isMultiSedeQuestion para detectar más patrones
function isMultiSedeQuestion(message, language) {
  const multiSedePatterns = {
    es: [
      /cuántas sedes/i,
      /cuántas ubicaciones/i,
      /cuántos locales/i,
      /cuántas sucursales/i,
      /dónde están ubicados/i,
      /qué sedes tienen/i,
      /en qué ciudades/i,
      /todas las sedes/i,
      /lista de sedes/i,
      /ubicaciones disponibles/i,
      /otros lugares/i,
      /más sedes/i,
      /tienen más/i,
      // ⭐ NUEVOS PATRONES MÁS ESPECÍFICOS
      /tienen.*sedes/i,
      /sedes.*tienen/i,
      /ubicaciones.*club/i,
      /dónde.*pley/i,
      /ciudades.*pley/i,
      /locales.*pley/i,
      /sucursales.*pley/i,
      /direcciones.*pley/i
    ],
    en: [
      /how many locations/i,
      /how many branches/i,
      /how many sites/i,
      /where are you located/i,
      /what locations/i,
      /which cities/i,
      /all locations/i,
      /list of locations/i,
      /available locations/i,
      /other places/i,
      /more locations/i,
      /do you have more/i,
      // ⭐ NUEVOS PATRONES MÁS ESPECÍFICOS
      /locations.*have/i,
      /have.*locations/i,
      /where.*pley/i,
      /cities.*pley/i,
      /branches.*pley/i,
      /addresses.*pley/i
    ]
  };
  
  return multiSedePatterns[language].some(pattern => pattern.test(message));
}

// ⭐ ALTERNATIVA: Función más robusta que también verifica palabras clave sueltas
function isSedeRelatedQuestion(message, language) {
  const sedeKeywords = {
    es: ['sede', 'sedes', 'ubicación', 'ubicaciones', 'local', 'locales', 'sucursal', 'sucursales', 'dirección', 'direcciones', 'ciudad', 'ciudades'],
    en: ['location', 'locations', 'branch', 'branches', 'site', 'sites', 'address', 'addresses', 'city', 'cities', 'place', 'places']
  };
  
  const questionWords = {
    es: ['cuántas', 'cuántos', 'dónde', 'qué', 'tienen', 'hay', 'existe', 'existen'],
    en: ['how many', 'where', 'what', 'do you have', 'are there', 'exist', 'exists']
  };
  
  const messageLower = message.toLowerCase();
  
  const hasSedeKeyword = sedeKeywords[language].some(keyword => messageLower.includes(keyword));
  const hasQuestionWord = questionWords[language].some(word => messageLower.includes(word));
  
  return hasSedeKeyword && hasQuestionWord;
}

// ⭐ FUNCIÓN COMBINADA
function isAboutMultipleSedes(message, language) {
  return isMultiSedeQuestion(message, language) || isSedeRelatedQuestion(message, language);
}

// ⭐ Respuestas más naturales para múltiples sedes
function getMultiSedeResponse(language) {
  const responses = {
    es: `Tenemos 2 sedes en Colombia:

Cartagena: Tv. 48 #Diag 21-48, El Bosque
Barranquilla: Cra. 46 #73-26, Centro Histórico

Ambas abren de 8pm a 4am todos los días. ¿Te interesa alguna en particular?`,

    en: `We have 2 locations in Colombia:

Cartagena: Tv. 48 #Diag 21-48, El Bosque  
Barranquilla: Cra. 46 #73-26, Centro Histórico

Both open 8pm to 4am daily. Interested in any particular one?`
  };
  
  return responses[language];
}

// Mensajes multiidioma
const messages = {
  es: {
    welcome: 'Hola, buenas...!, bienvenido a *PleyClub*.\n\nPor favor escribe la sede con la que deseas comunicarte para continuar: *Cartagena* o *Barranquilla*',
    changeSede: 'Perfecto. Escribe *Cartagena* o *Barranquilla* para cambiar de sede.',
    sedeSelected: (sede) => `Listo, ahora si te hablamos desde la sede de ${sede.charAt(0).toUpperCase() + sede.slice(1)}. ¿En que puede colaborarte?`,
    selectSede: 'Antes de continuar, por favor escribe con que sede deseas comunicarte:\n*Cartagena* o *Barranquilla*',
    invalidSede: '❌ Por favor escribe exactamente *Cartagena* o *Barranquilla*',
    greetings: ['hola', 'buenas', 'hey', 'saludos'],
    changeSedeKeywords: ['cambiar sede', 'otra sede', 'otra ciudad', 'sede diferente', 'quiero cambiar']
  },
  en: {
    welcome: 'Hello, welcome to *PleyClub*!\n\nPlease enter the location you wish to contact to continue: *Cartagena* or *Barranquilla*',
    changeSede: 'Perfect. Write *Cartagena* or *Barranquilla* to change location.',
    sedeSelected: (sede) => `Ready, now we're talking to you from the headquarters of ${sede.charAt(0).toUpperCase() + sede.slice(1)} Can I help you with anything?`,
    selectSede: 'Before continuing, please write to the branch you wish to contact:\n*Cartagena* or *Barranquilla*',
    invalidSede: '❌ Please write exactly *Cartagena* or *Barranquilla*',
    greetings: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
    changeSedeKeywords: ['change location', 'other location', 'different location', 'another city', 'want to change']
  }
};

async function handleMessage(req, res) {
  try {
    const body = req.body;
    console.log("📥 Webhook recibido:", JSON.stringify(body, null, 2));
    
    const entry = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!entry) return res.sendStatus(200);

    const from = entry.from;
    const type = entry.type;
    let message = '';
    let originalMessage = '';

    // 📌 Procesar diferentes tipos de mensajes
    if (type === 'text') {
      originalMessage = entry.text?.body;
      message = originalMessage?.toLowerCase().trim();
    } 
    // ⭐ Manejo de notas de voz
    else if (type === 'audio') {
      console.log(`🎤 Nota de voz recibida de ${from}`);
      
      // Obtener idioma actual del usuario
      const currentLang = getLanguage(from) || 'es';
      
      // Verificar si el usuario ya seleccionó sede
      const sedeSeleccionada = getSede(from);
      
      if (!sedeSeleccionada) {
        // Si no ha seleccionado sede, pedirle que lo haga por texto
        const voiceResponse = currentLang === 'es' 
          ? "He recibido tu nota de voz, pero primero necesito que escribas *Cartagena* o *Barranquilla* para continuar."
          : "I received your voice message, but first I need you to write *Cartagena* or *Barranquilla* to continue.";
        
        await sendMessageWithTyping(from, voiceResponse, 'text', 2000);
        return res.sendStatus(200);
      }
      
      // Si ya tiene sede, responder que no puede procesar audio por ahora
      const voiceResponse = currentLang === 'es' 
        ? "Recibí tu nota de voz, pero por ahora solo puedo responder mensajes de texto. ¿Puedes escribir tu pregunta?"
        : "I received your voice note, but for now I can only respond to text messages. Can you write your question?";
      
      await sendMessageWithTyping(from, voiceResponse, 'text', 2000);
      return res.sendStatus(200);
    } 
    // ⭐ Manejar otros tipos de mensajes no soportados
    else {
      console.log(`📎 Mensaje de tipo ${type} no soportado de ${from}`);
      
      // Obtener idioma actual del usuario
      const currentLang = getLanguage(from) || 'es';
      
      const unsupportedResponse = currentLang === 'es' 
        ? "Solo puedo responder mensajes de texto por ahora. ¿En qué puedo ayudarte?"
        : "I can only respond to text messages for now. How can I help you?";
      
      await sendMessageWithTyping(from, unsupportedResponse, 'text', 1500);
      return res.sendStatus(200);
    }

    console.log(`📨 Mensaje recibido de ${from}: "${message}"`);

    // 🌍 SIEMPRE detectar idioma del mensaje actual
    const detectedLang = detectLanguage(originalMessage);
    let currentLang = detectedLang; // Usar el idioma detectado del mensaje actual
    
    // Actualizar idioma de la sesión
    setLanguage(from, currentLang);
    console.log(`🌍 Idioma del mensaje actual: ${currentLang}`);

    const msgs = messages[currentLang];
    const esSaludo = msgs.greetings.some(s => message.includes(s));
    const quiereCambiar = msgs.changeSedeKeywords.some(p => message.includes(p));

    let sedeSeleccionada = getSede(from);

    // ⭐ Detectar pregunta sobre múltiples sedes
    if (isAboutMultipleSedes(originalMessage, currentLang)) {
      console.log(`🏢 Pregunta sobre múltiples sedes detectada de ${from}`);
      const multiSedeResponse = getMultiSedeResponse(currentLang);
      await sendMessageWithTyping(from, multiSedeResponse, 'text', 3000);
      return res.sendStatus(200);
    }

    // ✅ Si quiere cambiar de sede
    if (quiereCambiar) {
      setSede(from, null);
      await sendMessageWithTyping(from, msgs.changeSede, 'text', 1500);
      return res.sendStatus(200);
    }

    // ✅ Si no ha seleccionado sede y saluda
    if (!sedeSeleccionada && esSaludo) {
      await sendMessageWithTyping(from, msgs.welcome, 'text', 2000);
      return res.sendStatus(200);
    }

    // ✅ Verificar si escribió una ciudad válida
    const ciudadSeleccionada = message.includes('cartagena') ? 'cartagena' : 
                              message.includes('barranquilla') ? 'barranquilla' : null;

    if (ciudadSeleccionada && !sedeSeleccionada) {
      setSede(from, ciudadSeleccionada);
      await sendMessageWithTyping(from, msgs.sedeSelected(ciudadSeleccionada), 'text', 1200);
      return res.sendStatus(200);
    }

    // ⚠️ Si aún no ha seleccionado sede
    if (!sedeSeleccionada) {
      await sendMessageWithTyping(from, msgs.selectSede, 'text', 1500);
      return res.sendStatus(200);
    }

    // ✅ Si ya tiene sede pero escribió una ciudad diferente (cambio de sede)
    if (ciudadSeleccionada && ciudadSeleccionada !== sedeSeleccionada) {
      setSede(from, ciudadSeleccionada);
      await sendMessageWithTyping(from, msgs.sedeSelected(ciudadSeleccionada), 'text', 1200);
      return res.sendStatus(200);
    }

    // ✅ Obtener contexto según sede E IDIOMA ACTUAL DEL MENSAJE
    const contexto = getContextBySede(sedeSeleccionada, currentLang);
    
    console.log(`🔍 Usando contexto para ${sedeSeleccionada} en idioma ${currentLang}`);

    // 🤖 Obtiene respuesta desde la IA
    const respuesta = await getChatResponse(originalMessage, contexto);

    // ⭐ Typing inteligente basado en longitud de respuesta
    const typingDuration = Math.min(Math.max(respuesta.length * 30, 2000), 4000);
    
    await sendMessageWithTyping(from, respuesta, 'text', typingDuration);

    // 💾 Guarda conversación en DB
    await Message.create({
      from,
      to: 'bot',
      message: originalMessage,
      response: respuesta,
      timestamp: new Date()
    });

    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Error en handleMessage:', error);
    res.sendStatus(500);
  }
}

module.exports = { handleMessage };