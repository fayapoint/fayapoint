import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Certificate from '@/models/Certificate';
import { allCourses } from '@/data/courses';
import { getAllProducts } from '@/lib/products';
import { toolsData } from '@/data/tools-complete';

export const dynamic = "force-dynamic";

/**
 * ⚠️ O CATÁLOGO É O BANCO, NÃO O ARQUIVO ESCRITO À MÃO (26/08/2026)
 *
 * Até hoje esta rota somava `totalLessons` de `@/data/courses` — 19 entradas
 * escritas à mão, somando **2.035 capítulos**. A home anunciava esse número (e
 * caía num literal "256" quando a busca falhava). O catálogo real tem
 * **22 cursos e 517 capítulos**, medidos no conteúdo por
 * `scripts/aulas-e-tempo-honestos.mjs`.
 *
 * Quatro vezes o tamanho, na primeira dobra da porta de entrada. É a mesma
 * família do "Mais de 150 cursos" (item 5 do laudo) e da prova social inventada
 * (item 3): número redondo que ninguém contou.
 *
 * `getAllProducts` já vem com projeção e cache — a lista custa ~220 KB, não os
 * 4 MB do documento inteiro (ver `PROJECAO_DE_LISTA` em `lib/products.ts`).
 * O arquivo estático fica como rede de segurança para banco vazio, e só.
 */
export async function GET() {
  try {
    await dbConnect();

    const [totalUsers, totalCertificates, cursos] = await Promise.all([
      User.countDocuments(),
      Certificate.countDocuments(),
      getAllProducts({ type: 'course', limit: 200 }),
    ]);

    const totalCourses = cursos.length || allCourses.length;
    const totalChapters = cursos.reduce((acc, c) => acc + (c.metrics?.lessons || 0), 0);
    // A home dizia "40+ ferramentas de IA" desde sempre. O diretório tem 15,
    // e é este `toolsData` que `/ferramentas` e `llms.txt` já contam.
    const totalTools = Object.keys(toolsData).length;

    return NextResponse.json({
      totalUsers,
      totalCertificates,
      totalCourses,
      totalChapters,
      totalTools,
    });
  } catch (error) {
    console.error('Error fetching homepage stats:', error);
    // Return safe fallback so homepage always renders
    return NextResponse.json({
      totalUsers: 0,
      totalCertificates: 0,
      totalCourses: allCourses.length,
      totalChapters: 0,
      totalTools: Object.keys(toolsData).length,
    });
  }
}
