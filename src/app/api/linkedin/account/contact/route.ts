import { NextRequest, NextResponse } from "next/server";
import { getContactInfo } from "@/libs/linkedin";

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

    const contactInfo = await getContactInfo(identifier);

    return NextResponse.json({
      success: true,
      data: contactInfo,
    });
  } catch (error) {
    console.error("Erro ao pegar contato:", error);

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
