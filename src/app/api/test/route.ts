import {
  extractProfileIdLinkedin,
  fetchData,
  getDataIncludedForEntity,
  getProfileSectionAbout,
} from "@/libs/linkedin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const identifier = searchParams.get("identifier") || "florymignon";

  const response = await getProfileSectionAbout(identifier);

  return NextResponse.json({
    response,
  });
}
