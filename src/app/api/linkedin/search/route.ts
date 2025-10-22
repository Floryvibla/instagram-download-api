/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { search } from "@/libs/linkedin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const count = searchParams.get("count");
    const filters = searchParams.get("filters");
    const origin = searchParams.get("origin");
    const start = searchParams.get("start");
    const limit = searchParams.get("limit");

    if (!query) {
      return NextResponse.json(
        { error: "Parâmetro q (query) é obrigatório" },
        { status: 400 }
      );
    }

    const searchParams_obj: any = { q: query };

    if (count) searchParams_obj.count = count;
    if (filters) searchParams_obj.filters = filters;
    if (origin) searchParams_obj.origin = origin;
    if (start) searchParams_obj.start = parseInt(start);

    const options: any = {};
    if (limit) options.limit = parseInt(limit);

    const results = await search(searchParams_obj, options);

    return NextResponse.json({
      success: true,
      data: results,
      total: results.length,
    });
  } catch (error) {
    console.error("Erro ao realizar busca:", error);

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
