import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import ImageCreation from '@/models/ImageCreation';

const JWT_SECRET = process.env.JWT_SECRET || '';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Configure Cloudinary from Environment Variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    const headersList = await headers();
    const authHeader = headersList.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let decoded: any;
    
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const { prompt, model = 'flux-1-schnell' } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt é obrigatório' }, { status: 400 });
    }

    if (!OPENROUTER_API_KEY) {
        return NextResponse.json({ error: 'API Key não configurada no servidor' }, { status: 500 });
    }

    // Determine model configuration
    let targetModel = 'black-forest-labs/flux-1-schnell';
    let additionalBodyParams = {};

    switch (model) {
        case 'nano-banana-pro':
            targetModel = 'google/gemini-2.0-flash-exp:free'; // Using 2.0 Flash Exp as "Nano Banana Pro"
            additionalBodyParams = {
                modalities: ['image', 'text']
            };
            break;
        case 'flux-1-dev':
            targetModel = 'black-forest-labs/flux-1-dev';
            break;
        case 'recraft-v3':
            targetModel = 'recraft-ai/recraft-v3';
            break;
        case 'stable-diffusion-3.5-large':
            targetModel = 'stabilityai/stable-diffusion-3-5-large';
            break;
        case 'flux-1-schnell':
        default:
            targetModel = 'black-forest-labs/flux-1-schnell';
            break;
    }

    // Generate Image
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://fayapoint.com',
        'X-Title': 'Fayapoint AI',
      },
      body: JSON.stringify({
        model: targetModel,
        messages: [
            {
              "role": "user",
              "content": prompt
            }
          ],
        ...additionalBodyParams
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenRouter Error:", errorText);
        return NextResponse.json({ error: 'Erro na geração da imagem' }, { status: response.status });
    }

    const result = await response.json();
    let tempImageUrl = null;

    // Handle Response (Gemini 3 Pro returns base64 in message.images, Flux returns url in message.images or content)
    if (result.choices && result.choices[0].message) {
        const message = result.choices[0].message;
        
        if (message.images && message.images.length > 0) {
             // Works for both URL and Base64 Data URI
             tempImageUrl = message.images[0].image_url.url; 
        } else if (message.content) {
             // Fallback for models returning URL in text
             const urlMatch = message.content.match(/https?:\/\/[^\s)]+/);
             if (urlMatch) {
                 tempImageUrl = urlMatch[0];
             }
        }
    }

    if (!tempImageUrl) {
         return NextResponse.json({ error: 'Nenhuma imagem gerada' }, { status: 500 });
    }

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(tempImageUrl, {
        folder: 'fayapoint-ai-creations',
        context: {
            username: user.name,
            prompt: prompt
        }
    });

    // Save to MongoDB
    const newCreation = await ImageCreation.create({
        userId: user._id,
        userName: user.name,
        prompt: prompt,
        imageUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        provider: 'flux-1-schnell'
    });

    return NextResponse.json({ 
        imageUrl: uploadResult.secure_url,
        creationId: newCreation._id
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
