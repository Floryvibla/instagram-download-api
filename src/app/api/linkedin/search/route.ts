import { NextRequest, NextResponse } from "next/server";
import { search, searchPeople } from "@/libs/linkedin";
import { ISearchParams } from "@/libs/linkedin/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const field = searchParams.get("field");
    const offset = searchParams.get("offset");
    const limit = searchParams.get("limit");

    if (!query) {
      return NextResponse.json(
        { error: "Parâmetro query é obrigatório" },
        { status: 400 }
      );
    }

    if (field === "people") {
      const resultsPeople = await searchPeople(query);

      return NextResponse.json(resultsPeople);
    }

    const searchParams_obj: ISearchParams = {
      query,
      offset: offset ? parseInt(offset) : 0,
      limit: limit ? parseInt(limit) : 20,
    };

    const results = await search(searchParams_obj);

    return NextResponse.json(results);
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
