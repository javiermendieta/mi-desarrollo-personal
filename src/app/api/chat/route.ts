import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, profile } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({
        message: '¡Hola! 👋 ¿En qué puedo ayudarte?'
      });
    }

    // Crear archivo de configuración en runtime
    const configPath = join(tmpdir(), '.z-ai-config');
    const homeConfig = join(process.env.HOME || tmpdir(), '.z-ai-config');

    try {
      writeFileSync(configPath, '{}');
      writeFileSync(homeConfig, '{}');
    } catch (e) {
      // Ignorar errores de escritura
    }

    const systemPrompt = `Eres un asistente personal de desarrollo personal. Responde en español de forma cálida y útil. Cuando te pidan citas bíblicas, ofrece versículos apropiados.`;

    const zai = await ZAI.create();

    const formattedMessages = [
      { role: 'assistant', content: systemPrompt },
      ...messages.map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    const response = await zai.chat.completions.create({
      messages: formattedMessages,
      stream: false,
      thinking: { type: 'disabled' }
    });

    const reply = response.choices?.[0]?.message?.content;

    if (reply) {
      return NextResponse.json({ message: reply });
    }

    return NextResponse.json({ message: 'No pude generar una respuesta.' });

  } catch (error: unknown) {
    console.error('Chat error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ message: `Error: ${errorMessage}` });
  }
}
