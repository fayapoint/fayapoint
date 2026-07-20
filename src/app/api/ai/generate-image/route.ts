import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { v2 as cloudinary } from 'cloudinary';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import ImageCreation from '@/models/ImageCreation';
import { invalidateCachePattern, invalidateCache, CACHE_KEYS } from '@/lib/redis';
import { resolvePlan } from '@/lib/course-tiers';
import { DAILY_IMAGE_QUOTA, getStudioModel, planAtLeast } from '@/lib/studio-models';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Configure Cloudinary from Environment Variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(authUser.id);
    if (!user) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // ── Cota DIÁRIA por plano (Fase 4.1/4.2) ──
    const plan = resolvePlan(user.subscription?.plan || 'free');
    const dailyQuota = user.role === 'admin' ? 1000000 : DAILY_IMAGE_QUOTA[plan];
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const usedToday = await ImageCreation.countDocuments({
        userId: user._id,
        createdAt: { $gte: startOfDay },
    });
    if (usedToday >= dailyQuota) {
        return NextResponse.json({
            error: plan === 'free'
                ? `Suas ${dailyQuota} gerações grátis de hoje acabaram — volte amanhã ou faça upgrade para gerar mais.`
                : `Sua cota diária de ${dailyQuota} imagens acabou — volta à meia-noite.`,
            quota: { used: usedToday, limit: dailyQuota },
        }, { status: 403 });
    }

    const body = await request.json();
    const { prompt, model = 'nano-banana-1', referenceImage } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt é obrigatório' }, { status: 400 });
    }

    const apiKey = OPENROUTER_API_KEY?.trim();
    if (!apiKey) {
        return NextResponse.json({ error: 'API Key não configurada no servidor' }, { status: 500 });
    }

    // ── Catálogo único de modelos + gating por plano (Fase 4.2/4.4) ──
    const studioModel = getStudioModel(model) || getStudioModel('nano-banana-1')!;
    if (user.role !== 'admin' && !planAtLeast(plan, studioModel.minPlan)) {
        return NextResponse.json({
            error: `O modelo ${studioModel.name} está disponível a partir do plano ${studioModel.minPlan}.`,
        }, { status: 403 });
    }

    // ── Edição / consistência de personagem (Fase 4.3, omni da Google) ──
    // Com imagem de referência, roteia para o modelo omni que aceita entrada
    // multimodal e devolve imagem editada mantendo o personagem.
    const isEdit = typeof referenceImage === 'string' && referenceImage.length > 0;
    const editModel = getStudioModel('nano-banana-pro')!;
    if (isEdit && user.role !== 'admin' && !planAtLeast(plan, editModel.minPlan)) {
        return NextResponse.json({
            error: `Edição com imagem de referência está disponível a partir do plano ${editModel.minPlan}.`,
        }, { status: 403 });
    }

    const primaryModel = isEdit ? editModel.orModel : studioModel.orModel;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const additionalBodyParams: any =
        primaryModel === 'google/gemini-3-pro-image-preview'
            ? { modalities: ['image', 'text'] }
            : {};

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
            
            // Com referência (edição/consistência), envia conteúdo multimodal
            const userContent = isEdit
                ? [
                      { type: 'text', text: prompt },
                      { type: 'image_url', image_url: { url: referenceImage } },
                  ]
                : prompt;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const requestBody: any = {
                model: currentModel,
                messages: [
                    {
                        "role": "user",
                        "content": userContent
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
                    'HTTP-Referer': 'https://fayai.com.br',
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

    // Upload to Cloudinary. Se falhar (ex.: credenciais ausentes no host — foi
    // exatamente o bug de 20/07: geração cobrada no OpenRouter e "Erro interno"
    // pro usuário), devolve a imagem crua mesmo assim: o usuário pagou por ela.
    let uploadResult;
    try {
        uploadResult = await cloudinary.uploader.upload(tempImageUrl, {
            folder: 'fayapoint-ai-creations',
            context: {
                username: user.name,
                prompt: prompt
            }
        });
    } catch (uploadError) {
        console.error('Cloudinary upload failed after successful generation:', uploadError);
        return NextResponse.json({
            imageUrl: tempImageUrl,
            warning: 'Imagem gerada, mas não foi salva na sua galeria — baixe agora se quiser guardá-la.',
            quota: { used: usedToday, limit: dailyQuota },
        });
    }

    // Save to MongoDB
    const newCreation = await ImageCreation.create({
        userId: user._id,
        userName: user.name,
        prompt: prompt,
        imageUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        provider: usedModel || primaryModel
    });

    // REDIS: Invalidate caches (new image added)
    invalidateCachePattern('gallery:*').catch(err => console.error('Gallery cache invalidation error:', err));
    invalidateCachePattern('community:*').catch(err => console.error('Community cache invalidation error:', err));
    invalidateCache(CACHE_KEYS.USER_CREATIONS(String(user._id))).catch(err => console.error('User creations cache invalidation error:', err));

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
        creationId: newCreation._id,
        quota: { used: usedToday + 1, limit: dailyQuota }
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
