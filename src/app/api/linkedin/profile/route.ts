import { NextRequest, NextResponse } from "next/server";
import { getProfile, getProfissionalExperiences } from "@/libs/linkedin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const identifier = searchParams.get("identifier");

    if (!identifier) {
      return NextResponse.json(
        { error: "Parâmetro identifier é obrigatório" },
        { status: 400 }
      );
    }

    const profile = await getProfissionalExperiences(identifier);

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
