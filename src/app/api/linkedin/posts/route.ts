import { NextResponse } from "next/server";
import { getPosts } from "@/libs/linkedin";

export async function GET() {
  try {
    const posts = await getPosts();

    return NextResponse.json({
      success: true,
      data: posts,
      total: posts.length,
    });
  } catch (error) {
    console.error("Erro ao buscar posts:", error);

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
