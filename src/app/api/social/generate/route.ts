import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import SocialAccount from '@/models/SocialAccount';
import SocialPost from '@/models/SocialPost';
import { generate } from '@/lib/ai/provider';

const PLATFORM_LIMITS: Record<string, number> = {
  twitter: 280,
  instagram: 2200,
  facebook: 5000,
  linkedin: 3000,
  youtube: 5000,
  tiktok: 2200,
};

const SYSTEM_PROMPT = `You are an expert social media content strategist. Generate engaging, platform-optimized posts.
Always respond in valid JSON with this structure:
{
  "posts": [
    {
      "content": "The post text",
      "hashtags": ["hashtag1", "hashtag2"],
      "mediaPrompt": "Description of ideal image/video to accompany this post",
      "callToAction": "CTA suggestion",
      "bestTimeToPost": "HH:MM format, timezone-aware",
      "estimatedEngagement": "low|medium|high"
    }
  ]
}`;

// =============================================================================
// POST - Generate AI social media content
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(authUser.id);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userDoc = user as any;
    const plan = userDoc.subscription?.plan;
    if (!plan || !['pro', 'business', 'profissional', 'expert'].includes(plan)) {
      return NextResponse.json(
        { error: 'AI social content generation requires Pro or Business plan' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      accountId,
      topic,
      tone = 'professional',
      language = 'pt-BR',
      count = 3,
      includeHashtags = true,
      action = 'generatePosts',
    } = body;

    if (!topic) {
      return NextResponse.json({ error: 'topic is required' }, { status: 400 });
    }

    const postCount = Math.min(Math.max(count, 1), 10);

    // Get account context if provided
    let platformContext = '';
    let platform = body.platform || 'instagram';
    if (accountId) {
      const account = await SocialAccount.findOne({ _id: accountId, userId: userDoc._id });
      if (account) {
        platform = account.platform;
        platformContext = `\nAccount: @${account.username} on ${account.platform} (${account.metadata?.followerCount || 0} followers)`;
      }
    }

    const charLimit = PLATFORM_LIMITS[platform] || 2200;
    const langName = language === 'pt-BR' ? 'Brazilian Portuguese' : language === 'en' ? 'English' : language;

    // Persona do usuário (Vidente/pescaria/builder alimentam socialPersona) —
    // o blueprint do engine (Uss/docs) exige persona estruturada em TODA geração
    const sp = userDoc.socialPersona || {};
    const personaFields: Record<string, unknown> = {};
    if (sp.industry?.length) personaFields.industry = sp.industry;
    if (sp.toneOfVoice?.length) personaFields.tone_of_voice = sp.toneOfVoice;
    if (sp.marketingGoals?.length) personaFields.marketing_goals = sp.marketingGoals;
    if (sp.contentTypes?.length) personaFields.content_types = sp.contentTypes;
    if (sp.experienceLevel) personaFields.experience_level = sp.experienceLevel;
    if (sp.topHashtags?.length) personaFields.top_hashtags = sp.topHashtags;
    if (sp.contentThemes?.length) personaFields.content_themes = sp.contentThemes;
    if (sp.audienceInsights) personaFields.audience_insights = sp.audienceInsights;
    if (sp.writingStyle) personaFields.writing_style = sp.writingStyle;
    if (sp.primaryInterests?.length) personaFields.primary_interests = sp.primaryInterests;
    const personaBlock = Object.keys(personaFields).length
      ? `\n\nUser persona (write in THIS voice; align topics, examples and CTAs with these interests, audience and goals; prefer their proven hashtags when relevant):\n<persona_json>\n${JSON.stringify(personaFields)}\n</persona_json>`
      : '';

    // ── Trends em tempo real (Fase 7.2): manchetes de IA das últimas 48h do
    // hub IA Hoje entram no prompt — o post nasce ancorado no assunto do dia
    let trendsBlock = '';
    try {
      const db = (await import('mongoose')).default.connection.db;
      if (db) {
        const news = await db
          .collection('ainews')
          .find({ publishedAt: { $gte: new Date(Date.now() - 48 * 3600 * 1000) } })
          .sort({ publishedAt: -1 })
          .limit(5)
          .project({ title: 1, summary: 1 })
          .toArray();
        if (news.length) {
          trendsBlock =
            `\n\nCurrent AI trends (last 48h headlines — if any is relevant to the topic, reference it to make the post timely; otherwise ignore):\n` +
            news.map((n) => `- ${n.title}: ${String(n.summary || '').slice(0, 140)}`).join('\n');
        }
      }
    } catch {
      /* trends são opcionais — geração segue sem elas */
    }

    let userPrompt = '';

    if (action === 'generatePosts') {
      userPrompt = `Generate ${postCount} ${platform} posts about: "${topic}"

Tone: ${tone}
Language: ${langName}
Character limit: ${charLimit} per post
${includeHashtags ? 'Include relevant hashtags (5-10 per post)' : 'No hashtags'}
${platformContext}

Requirements:
- Each post must be unique and engaging
- Optimize for ${platform} algorithm and best practices
- Include clear calls to action
- Suggest best posting times (timezone: America/Sao_Paulo)${personaBlock}${trendsBlock}`;
    } else if (action === 'generateHashtags') {
      userPrompt = `Generate 20 relevant hashtags for ${platform} content about: "${topic}"
Language: ${langName}
${platformContext}

Return JSON: { "posts": [{ "content": "", "hashtags": [...20 hashtags...], "mediaPrompt": "", "callToAction": "", "bestTimeToPost": "", "estimatedEngagement": "medium" }] }${personaBlock}`;
    } else if (action === 'generateMediaPrompt') {
      // Fase 7.3: pipeline modular — só o prompt de imagem, para um post já escrito
      userPrompt = `Write ONE detailed image-generation prompt (in English, for an AI image model) for a ${platform} post with this content: "${topic}"

The image must feel premium, on-brand and scroll-stopping. No text in the image.
Return JSON: { "posts": [{ "content": "", "hashtags": [], "mediaPrompt": "THE PROMPT HERE", "callToAction": "", "bestTimeToPost": "", "estimatedEngagement": "medium" }] }${personaBlock}`;
    } else if (action === 'analyzeTrends') {
      userPrompt = `Analyze current trends on ${platform} related to: "${topic}"
Language: ${langName}
${platformContext}

Return JSON with posts array where each item represents a trend-inspired post idea.${personaBlock}${trendsBlock}`;
    } else {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    const result = await generate({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      tier: 'budget',
      json: true,
      maxTokens: 4096,
    });

    let generated;
    try {
      generated = JSON.parse(result.content);
    } catch {
      generated = { posts: [{ content: result.content, hashtags: [], mediaPrompt: '', callToAction: '', bestTimeToPost: '', estimatedEngagement: 'medium' }] };
    }

    // Optionally save as draft posts
    const savedPosts = [];
    if (body.saveDrafts && accountId && generated.posts) {
      for (const genPost of generated.posts) {
        const post = new SocialPost({
          userId: userDoc._id,
          accountId,
          platform,
          content: genPost.content,
          hashtags: genPost.hashtags || [],
          status: 'suggested',
          aiGenerated: true,
          aiModel: result.model,
          aiCost: result.cost / (generated.posts.length || 1),
        });
        await post.save();
        savedPosts.push(post.toObject());
      }
    }

    return NextResponse.json({
      success: true,
      generated,
      model: result.model,
      cost: result.cost,
      savedPosts: savedPosts.length > 0 ? savedPosts : undefined,
    });
  } catch (error) {
    console.error('[Social Generate] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
