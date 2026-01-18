import { NextRequest, NextResponse } from "next/server";
import { getPostLinkedin } from "@/libs/linkedin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    const commentsCount = parseInt(searchParams.get("commentsCount") || "10");
    const likesCount = parseInt(searchParams.get("likesCount") || "10");

    if (!url) {
      return NextResponse.json(
        { error: "Parâmetro url é obrigatório" },
        { status: 400 }
      );
    }

    const post = await getPostLinkedin(url, commentsCount, likesCount);

    return NextResponse.json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error("Erro ao buscar postagem:", error);

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

