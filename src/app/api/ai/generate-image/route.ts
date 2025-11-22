import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    try {
      jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt é obrigatório' }, { status: 400 });
    }

    if (!OPENROUTER_API_KEY) {
        return NextResponse.json({ error: 'API Key não configurada no servidor' }, { status: 500 });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://fayapoint.com', // Optional, for including your app on openrouter.ai rankings.
        'X-Title': 'Fayapoint AI', // Optional. Shows in rankings on openrouter.ai.
      },
      body: JSON.stringify({
        model: 'black-forest-labs/flux-1-schnell',
        messages: [
            {
              "role": "user",
              "content": prompt
            }
          ],
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenRouter Error:", errorText);
        return NextResponse.json({ error: 'Erro na geração da imagem' }, { status: response.status });
    }

    const result = await response.json();
    let imageUrl = null;

    if (result.choices && result.choices[0].message && result.choices[0].message.images) {
        // Look for images in the message
        const images = result.choices[0].message.images;
        if (images.length > 0) {
             imageUrl = images[0].image_url.url;
        }
    } else if (result.choices && result.choices[0].message && result.choices[0].message.content) {
         // Sometimes the content might contain a link if it's not structured as 'images'
         // But for 'gemini-3-pro-image-preview' via OpenRouter, it typically returns an image block or url.
         // Let's assume the user snippet is correct about `message.images`.
         // If it's text, we return it as a fallback description?
         // Actually, looking at user snippet: `message.images.forEach(...)`.
    }

    if (!imageUrl) {
         // Fallback check if it's in content (sometimes models behave differently)
         // For now, return error if no image found
         return NextResponse.json({ error: 'Nenhuma imagem gerada' }, { status: 500 });
    }

    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
