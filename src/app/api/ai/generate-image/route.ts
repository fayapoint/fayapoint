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

    const user = await User.findById(decoded.id);
    if (!user) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Check Usage Limits
    const plan = user.subscription?.plan || 'free';
    // Strict limit for Free tier as requested: 1 image total
    const LIMITS: Record<string, number> = { 
        free: 1, 
        starter: 50, 
        pro: 1000000, // Effectively unlimited
        business: 1000000 
    };

    if (plan === 'free') {
        const usageCount = await ImageCreation.countDocuments({ userId: user._id });
        if (usageCount >= LIMITS.free) {
            return NextResponse.json({ 
                error: 'Limite do plano Gratuito atingido. Faça upgrade para gerar mais imagens.' 
            }, { status: 403 });
        }
    } else if (plan === 'starter') {
        // For starter, check monthly usage
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const usageCount = await ImageCreation.countDocuments({ 
            userId: user._id,
            createdAt: { $gte: startOfMonth }
        });
        if (usageCount >= LIMITS.starter) {
            return NextResponse.json({ 
                error: 'Limite mensal do plano Starter atingido.' 
            }, { status: 403 });
        }
    }

    const body = await request.json();
    const { prompt, model = 'flux-1-schnell' } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt é obrigatório' }, { status: 400 });
    }

    const apiKey = OPENROUTER_API_KEY?.trim();
    if (!apiKey) {
        return NextResponse.json({ error: 'API Key não configurada no servidor' }, { status: 500 });
    }

    // Determine model configuration
    let primaryModel = 'google/gemini-2.0-flash-exp:free';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let additionalBodyParams: any = {};

    // Check plan for Pro models
    if (model === 'nano-banana-pro' && plan === 'free') {
        return NextResponse.json({ 
            error: 'O modelo Nano Banana Pro está disponível apenas para planos Starter ou superior.' 
        }, { status: 403 });
    }

    switch (model) {
        case 'nano-banana-1':
            // Gemini 2.5 Flash (New Default)
            primaryModel = 'google/gemini-2.5-flash-image';
            break;
        case 'nano-banana-pro':
            // Gemini 3 Pro Image Preview (Premium)
            primaryModel = 'google/gemini-3-pro-image-preview';
            additionalBodyParams = {
                modalities: ['image', 'text']
            };
            break;
        case 'gpt-5-image-mini':
            primaryModel = 'openai/gpt-5-image-mini';
            break;
        case 'flux-1-dev':
            primaryModel = 'black-forest-labs/flux-1-dev';
            break;
        case 'recraft-v3':
            primaryModel = 'recraft-ai/recraft-v3';
            break;
        case 'stable-diffusion-3.5-large':
            primaryModel = 'stabilityai/stable-diffusion-3-5-large';
            break;
        case 'flux-1-schnell':
        default:
            primaryModel = 'black-forest-labs/flux-1-schnell';
            if (model === 'nano-banana-1') {
                 // Fallback if nano-banana-1 is not explicitly matched (though it is above)
                 primaryModel = 'google/gemini-2.5-flash-image';
            }
            break;
    }

    // Fallback chain - Removed invalid IDs, keeping simple for now to debug primary
    const uniqueModels = [primaryModel];

    let result = null;
    let usedModel = '';
    let lastError = '';

    // Ensure Bearer prefix is correct
    const authHeaderValue = apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`;

    for (const currentModel of uniqueModels) {
        try {
            console.log(`Attempting generation with model: ${currentModel}`);
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const requestBody: any = {
                model: currentModel,
                messages: [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                ...additionalBodyParams
            };

            // Only add modalities for Gemini 3
            if (currentModel !== 'google/gemini-3-pro-image-preview') {
                delete requestBody.modalities;
            }

            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    Authorization: authHeaderValue,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://fayapoint.com',
                    'X-Title': 'Fayapoint AI',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = errorText;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.error?.message || errorJson.message || errorText;
                } catch { }
                
                console.error(`OpenRouter Error (${currentModel}):`, errorMessage);
                lastError = errorMessage;
                
                // If 429 (Rate Limit) or 404/400 (Invalid Model), try next
                if (response.status === 429 || response.status === 404 || response.status === 400) {
                    continue;
                }
                // For other errors (401 unauthorized), fail immediately
                if (response.status === 401) break;
                
                continue; 
            }

            result = await response.json();
            usedModel = currentModel;
            break; // Success
        } catch (e) {
            console.error(`Exception with model ${currentModel}:`, e);
            lastError = e instanceof Error ? e.message : 'Unknown error';
        }
    }

    if (!result) {
        return NextResponse.json({ error: `Falha na geração com todos os modelos. Último erro: ${lastError}` }, { status: 500 });
    }

    let tempImageUrl = null;

    // Handle Response (Gemini 3 Pro returns base64 in message.images, Flux returns url in message.images or content)
    if (result.choices && result.choices[0].message) {
        const message = result.choices[0].message;
        
        if (message.images && message.images.length > 0) {
             // Works for both URL and Base64 Data URI
             tempImageUrl = message.images[0].image_url.url; 
        } else if (message.content) {
             // Fallback for models returning URL in text or Markdown
             // Match http/https URLs
             const urlMatch = message.content.match(/https?:\/\/[^\s)"]+/);
             if (urlMatch) {
                 tempImageUrl = urlMatch[0];
             } else {
                 // Match data:image base64
                 const base64Match = message.content.match(/data:image\/[^;]+;base64,[^"\s)]+/);
                 if (base64Match) {
                     tempImageUrl = base64Match[0];
                 }
             }
        }

        // If no image found, but we have content, it might be a refusal or error from the model
        if (!tempImageUrl && message.content) {
            console.log(`Model response (${usedModel}) - no image found:`, message.content);
            // If it's a short refusal and we are on the last model or it's a refusal, return it
            if (message.content.length < 500) {
                 // Don't return error immediately, maybe just continue? 
                 // But if we are here, it means status was 200 OK.
                 // We should probably treat this as a failure to generate image.
            }
        }
    }

    if (!tempImageUrl) {
         console.error("Full OpenRouter Response:", JSON.stringify(result, null, 2));
         return NextResponse.json({ error: 'Nenhuma imagem gerada pelo modelo. O modelo pode ter recusado o prompt.' }, { status: 500 });
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

    // OPTIMIZATION: Award XP inline (saves 1 API call to /api/user/checkin)
    User.findByIdAndUpdate(user._id, {
      $inc: { 
        'gamification.totalImagesGenerated': 1,
        'progress.xp': 5,
        'progress.weeklyXp': 5,
      }
    }).catch(err => console.error('Image XP update error:', err));

    return NextResponse.json({ 
        imageUrl: uploadResult.secure_url,
        creationId: newCreation._id
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
