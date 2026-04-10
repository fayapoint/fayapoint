import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import SocialAccount from '@/models/SocialAccount';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const XP_FIRST_ANALYSIS = 200;

const SYSTEM_PROMPT = `You are an expert social media analyst. Analyze this user's social media presence and persona preferences, then return a JSON object with:
- contentThemes: string[] (top 5 content themes you detect)
- writingStyle: string (formal, casual, educational, etc.)
- audienceInsights: string (2-3 sentences about who their audience is)
- primaryInterests: string[] (top 10 interests merged from all sources)
- recommendedCourses: string[] (course slugs from this list: chatgpt-masterclass, claude-ia-segura, prompt-engineering, n8n-automacao-avancada, make-integracao-total, gemini-ia-google, midjourney-arte-profissional, leonardo-ai-criacao-visual, crie-agentes-de-ia-autonomos, autoresearch-singularity, perplexity-pesquisa-inteligente, primeiras-automacoes)
- recommendationReasoning: string[] (one reason per recommended course)
- postingFrequency: string (daily, weekly, irregular, etc.)
Return ONLY valid JSON.`;

interface AnalysisResult {
  contentThemes: string[];
  writingStyle: string;
  audienceInsights: string;
  primaryInterests: string[];
  recommendedCourses: string[];
  recommendationReasoning: string[];
  postingFrequency: string;
}

/**
 * POST /api/social/analyze
 * Triggers AI analysis of user's social data and persona preferences.
 */
export async function POST() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await dbConnect();

    const [user, socialAccounts] = await Promise.all([
      User.findById(authUser.id),
      SocialAccount.find({ userId: authUser.id, status: 'active' }),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Compile social data for analysis
    const accountSummaries = socialAccounts.map((account) => ({
      platform: account.platform,
      username: account.username,
      followers: account.metadata.followerCount,
      following: account.metadata.followingCount,
      posts: account.metadata.postCount,
      engagement: account.metadata.averageEngagement,
      bio: account.metadata.biography || '',
      website: account.metadata.websiteUrl || '',
      businessAccount: account.metadata.businessAccount,
    }));

    const personaData = {
      industry: user.socialPersona.industry,
      toneOfVoice: user.socialPersona.toneOfVoice,
      marketingGoals: user.socialPersona.marketingGoals,
      contentTypes: user.socialPersona.contentTypes,
      experienceLevel: user.socialPersona.experienceLevel,
    };

    const userData = JSON.stringify({
      name: user.name,
      profile: {
        bio: user.profile?.bio,
        interests: user.profile?.interests,
        skills: user.profile?.skills,
        company: user.profile?.company,
        position: user.profile?.position,
      },
      socialAccounts: accountSummaries,
      personaPreferences: personaData,
    });

    // Call OpenRouter API
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userData },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      return NextResponse.json({ error: 'Erro na análise de IA' }, { status: 502 });
    }

    const aiResponse = await response.json();
    const rawContent = aiResponse.choices?.[0]?.message?.content;

    if (!rawContent) {
      return NextResponse.json({ error: 'Resposta da IA vazia' }, { status: 502 });
    }

    let analysis: AnalysisResult;
    try {
      analysis = JSON.parse(rawContent);
    } catch {
      console.error('Failed to parse AI response:', rawContent);
      return NextResponse.json({ error: 'Resposta da IA inválida' }, { status: 502 });
    }

    // Check if this is the first analysis
    const isFirstAnalysis = !user.socialPersona.lastAnalyzed;

    // Update user's socialPersona with AI results
    user.socialPersona.contentThemes = analysis.contentThemes || [];
    user.socialPersona.writingStyle = analysis.writingStyle || '';
    user.socialPersona.audienceInsights = analysis.audienceInsights || '';
    user.socialPersona.primaryInterests = analysis.primaryInterests || [];
    user.socialPersona.recommendedCourses = analysis.recommendedCourses || [];
    user.socialPersona.recommendationReasoning = analysis.recommendationReasoning || [];
    user.socialPersona.postingFrequency = analysis.postingFrequency || '';
    user.socialPersona.lastAnalyzed = new Date();

    // Award XP for first analysis
    if (isFirstAnalysis) {
      user.progress.xp += XP_FIRST_ANALYSIS;
      user.progress.weeklyXp += XP_FIRST_ANALYSIS;
      user.progress.monthlyXp += XP_FIRST_ANALYSIS;
    }

    await user.save();

    return NextResponse.json({
      analysis,
      xpAwarded: isFirstAnalysis ? XP_FIRST_ANALYSIS : 0,
    });
  } catch (error) {
    console.error('Social analyze POST error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
