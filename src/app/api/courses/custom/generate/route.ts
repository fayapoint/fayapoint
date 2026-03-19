import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import CustomCourse from '@/models/CustomCourse';
import { generate as aiGenerate } from '@/lib/ai/provider';
import { getAuthUser } from '@/lib/auth';

// =============================================================================
// POST - Trigger Course Generation (admin or internal)
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId } = await request.json();
    if (!requestId) {
      return NextResponse.json({ error: 'requestId required' }, { status: 400 });
    }

    await dbConnect();
    const courseRequest = await CustomCourse.findById(requestId);

    if (!courseRequest) {
      return NextResponse.json({ error: 'Course request not found' }, { status: 404 });
    }

    // Only generate for paid requests
    if (!['paid', 'generating'].includes(courseRequest.status)) {
      return NextResponse.json(
        { error: `Cannot generate course in status: ${courseRequest.status}` },
        { status: 400 }
      );
    }

    // Mark as generating
    courseRequest.status = 'generating';
    courseRequest.generationLog.push({
      step: 'generation_started',
      status: 'started',
      timestamp: new Date(),
      details: 'AI course generation initiated',
    });
    await courseRequest.save();

    // Generate curriculum outline
    try {
      const curriculumPrompt = buildCurriculumPrompt(courseRequest);
      const curriculumResult = await aiGenerate({
        messages: [
          { role: 'system', content: COURSE_GENERATOR_SYSTEM },
          { role: 'user', content: curriculumPrompt },
        ],
        tier: 'budget',
        json: true,
        maxTokens: 4096,
      });

      courseRequest.generationLog.push({
        step: 'curriculum_generated',
        status: 'completed',
        timestamp: new Date(),
        details: `Generated with ${curriculumResult.model} (cost: $${curriculumResult.cost.toFixed(4)})`,
      });

      // Move to quality loop
      courseRequest.status = 'quality_loop';
      courseRequest.qualityIterations = 1;
      await courseRequest.save();

      return NextResponse.json({
        success: true,
        requestId: courseRequest._id,
        status: 'quality_loop',
        model: curriculumResult.model,
        cost: curriculumResult.cost,
        curriculum: JSON.parse(curriculumResult.content),
      });
    } catch (genError) {
      courseRequest.status = 'failed';
      courseRequest.generationLog.push({
        step: 'generation_failed',
        status: 'failed',
        timestamp: new Date(),
        details: genError instanceof Error ? genError.message : 'Unknown error',
      });
      await courseRequest.save();

      return NextResponse.json(
        { error: 'Course generation failed', details: genError instanceof Error ? genError.message : 'Unknown' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[CustomCourse Generate] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =============================================================================
// PROMPTS
// =============================================================================

const COURSE_GENERATOR_SYSTEM = `You are an expert course curriculum designer. You create detailed, practical,
industry-standard course outlines in JSON format. Each course should be structured with modules containing
lessons. Focus on hands-on learning with real-world examples.

Output JSON with this structure:
{
  "title": "Course Title",
  "subtitle": "Brief subtitle",
  "description": "2-3 sentence description",
  "objectives": ["objective1", "objective2", ...],
  "requirements": ["prereq1", "prereq2", ...],
  "targetAudience": ["audience1", "audience2", ...],
  "modules": [
    {
      "title": "Module Title",
      "description": "Module description",
      "order": 1,
      "lessons": [
        {
          "title": "Lesson Title",
          "description": "What the student will learn",
          "type": "text|video|quiz",
          "duration": 30,
          "isFree": false,
          "content": "Full lesson content (detailed, educational, with examples)"
        }
      ]
    }
  ]
}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildCurriculumPrompt(request: any): string {
  const features = [];
  if (request.includeQuizzes) features.push('quizzes at the end of each module');
  if (request.includeExercises) features.push('practical exercises');
  if (request.includeVideoScripts) features.push('video scripts for each lesson');
  if (request.includeCertificate) features.push('final assessment for certification');

  return `Create a comprehensive ${request.duration}-hour course curriculum.

Topic: ${request.topic}
Description: ${request.description}
Level: ${request.level}
Language: ${request.language === 'pt-BR' ? 'Brazilian Portuguese' : request.language === 'en' ? 'English' : request.language}
${features.length > 0 ? `Include: ${features.join(', ')}` : ''}
${request.additionalNotes ? `Additional notes: ${request.additionalNotes}` : ''}

Requirements:
- Total duration must be approximately ${request.duration} hours
- Each lesson should be 15-45 minutes
- Include practical examples and real-world applications
- Progress from fundamentals to advanced topics
- Each lesson should have detailed, educational content (not just titles)
- If quizzes are requested, include 3-5 questions per module quiz

Generate the complete course in valid JSON.`;
}
