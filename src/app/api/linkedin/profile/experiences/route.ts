import { NextRequest, NextResponse } from 'next/server';
import { getProfissionalExperiences } from '@/libs/linkedin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const identifier = searchParams.get('identifier');

    if (!identifier) {
      return NextResponse.json(
        { error: 'Parâmetro identifier é obrigatório' },
        { status: 400 }
      );
    }

    const experiences = await getProfissionalExperiences(identifier);
    
    return NextResponse.json({
      success: true,
      data: experiences,
      total: experiences.length
    });

  } catch (error) {
    console.error('Erro ao buscar experiências:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}