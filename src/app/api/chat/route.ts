import { NextRequest, NextResponse } from 'next/server';

// Llamada directa a la API de Zhipu AI (GLM-4)
async function callZhipuAI(messages: { role: string; content: string }[]) {
  const apiKey = process.env.ZAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('ZAI_API_KEY no está configurada');
  }

  // API de Zhipu AI (GLM-4)
  const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'glm-4-flash', // Modelo gratis
      messages: messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, profile } = body;

    console.log('[Chat API] Received request');

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({
        message: '¡Hola! 👋 ¿En qué puedo ayudarte?'
      });
    }

    // System prompt
    let systemPrompt = `Eres un asistente personal de desarrollo personal. Responde en español de forma cálida y útil. 
Cuando te pidan citas bíblicas, ofrece versículos apropiados.
Ayuda al usuario con motivación, consejos de desarrollo personal, reflexiones y apoyo emocional.`;

    if (profile) {
      const profileContext = [];
      if (profile.personality) profileContext.push(`Personalidad: ${profile.personality}`);
      if (profile.lifeGoals) profileContext.push(`Objetivos de vida: ${profile.lifeGoals}`);
      if (profile.currentChallenges) profileContext.push(`Desafíos actuales: ${profile.currentChallenges}`);
      if (profile.values) profileContext.push(`Valores: ${profile.values}`);
      if (profile.interests) profileContext.push(`Intereses: ${profile.interests}`);
      if (profile.additionalInfo) profileContext.push(`Información adicional: ${profile.additionalInfo}`);

      if (profileContext.length > 0) {
        systemPrompt += `\n\nInformación sobre el usuario:\n${profileContext.join('\n')}`;
      }
    }

    // Formatear mensajes para la API
    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    ];

    console.log('[Chat API] Calling Zhipu AI API...');
    const response = await callZhipuAI(formattedMessages);
    
    console.log('[Chat API] Response received');

    const reply = response.choices?.[0]?.message?.content;

    if (reply) {
      return NextResponse.json({ message: reply });
    }

    return NextResponse.json({ message: 'No pude generar una respuesta.' });

  } catch (error: unknown) {
    console.error('[Chat API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    return NextResponse.json({ 
      message: `Lo siento, hubo un error. Por favor intenta de nuevo.`,
      error: errorMessage 
    });
  }
}
