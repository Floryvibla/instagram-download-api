import { extractProfileIdLinkedin, fetchData } from "@/libs/linkedin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const profileId = await extractProfileIdLinkedin("florymignon");

  const response = await fetchData(
    `graphql?variables=(profileUrn:urn%3Ali%3Afsd_profile%3A${profileId},sectionType:experience,locale:en_US)&queryId=voyagerIdentityDashProfileComponents.c5d4db426a0f8247b8ab7bc1d660775a`
  );

  return NextResponse.json(response);
}
