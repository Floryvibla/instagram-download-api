import { NextRequest, NextResponse } from "next/server";
import { getCommentsByPostUrl } from "@/libs/linkedin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    const start = parseInt(searchParams.get("start") || "0");
    const limit = parseInt(searchParams.get("limit") || "100");

    if (!url) {
      return NextResponse.json(
        { error: "Parâmetro url é obrigatório" },
        { status: 400 }
      );
    }

    const comments = await getCommentsByPostUrl(url, start, limit);

    return NextResponse.json({
      success: true,
      data: comments,
      total: comments.length,
    });
  } catch (error) {
    console.error("Erro ao buscar comentários:", error);

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
