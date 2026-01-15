import { extractProfileIdLinkedin, fetchData } from "@/libs/linkedin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const identifier = searchParams.get("identifier") || "florymignon";
  const profileId = await extractProfileIdLinkedin(identifier);

  const response = await fetchData(
    `graphql?variables=(vanityName:${identifier})&queryId=voyagerIdentityDashProfiles.34ead06db82a2cc9a778fac97f69ad6a`
  );

  return NextResponse.json(response);
}
