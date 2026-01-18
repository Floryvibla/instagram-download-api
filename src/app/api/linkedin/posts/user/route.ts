import { NextRequest, NextResponse } from "next/server";
import { getUserPosts } from "@/libs/linkedin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const identifier = searchParams.get("identifier");
    const count = parseInt(searchParams.get("count") || "50");
    const start = parseInt(searchParams.get("start") || "0");

    if (!identifier) {
      return NextResponse.json(
        { error: "Parâmetro identifier é obrigatório" },
        { status: 400 }
      );
    }

    const posts = await getUserPosts({ identifier, count, start });

    return NextResponse.json({
      success: true,
      data: posts,
      total: posts.length,
    });
  } catch (error) {
    console.error("Erro ao buscar posts do usuário:", error);

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

