import { NextRequest, NextResponse } from "next/server";
import {
  getCompany,
  getProfile,
  getProfissionalExperiences,
} from "@/libs/linkedin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const identifier = searchParams.get("identifier");
    const field = searchParams.get("field");

    if (!identifier) {
      return NextResponse.json(
        { error: "Parâmetro identifier é obrigatório" },
        { status: 400 }
      );
    }

    let data;

    if (field === "experiences") {
      data = await getProfissionalExperiences(identifier);
    } else if (field === "company") {
      data = await getCompany(identifier);
    } else {
      data = await getProfile(identifier);
    }

    return NextResponse.json({
      success: true,
      data,
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
