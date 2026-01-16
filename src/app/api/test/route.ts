import {
  extractProfileIdLinkedin,
  fetchData,
  getDataIncludedForEntity,
  getUserPosts,
} from "@/libs/linkedin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const identifier = searchParams.get("identifier") || "rodrigovencefy";
  const profileId = await extractProfileIdLinkedin(identifier);

  const response = await getUserPosts({
    identifier,
  });

  return NextResponse.json(response);
}
