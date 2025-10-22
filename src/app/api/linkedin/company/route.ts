import { NextRequest, NextResponse } from 'next/server';
import { getCompany } from '@/libs/linkedin';

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

    const company = await getCompany(identifier);
    
    return NextResponse.json({
      success: true,
      data: company
    });

  } catch (error) {
    console.error('Erro ao buscar empresa:', error);
    
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