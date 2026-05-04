import { NextRequest, NextResponse } from "next/server";
import {
  getUserMiniProfile,
  getProfissionalExperiences,
  getCompany,
  searchPeople,
  getCommentsByPostUrl,
  Client,
} from "@florydev/linkedin-api-voyager";

export async function GET(request: NextRequest) {
  try {
    Client({
      JSESSIONID: "0466411065031579456",
      li_at:
        "AQEDAU9C-sMEobZ6AAABmgzAd04AAAGdoxs1kU4AYDxi4dFa2JUkdsZHqpIU9JuPIhi6J_aMAPYQ5dIYJuv6jXBRj04t-4vhJvMHhlMF48-MRFPJDD-k5f8CYH4QESpzmpP4zMm6WKODloiizUwuthG8",
    });
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    const start = parseInt(searchParams.get("start") || "0");
    const limit = parseInt(searchParams.get("limit") || "100");

    if (!url) {
      return NextResponse.json(
        { error: "Parâmetro url é obrigatório" },
        { status: 400 },
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
      { status: 500 },
    );
  }
}
