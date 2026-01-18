import {
  Client,
  extractProfileIdLinkedin,
  fetchData,
  getDataIncludedForEntity,
  getPostLinkedin,
  getUserPosts,
} from "@/libs/linkedin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const identifier = searchParams.get("identifier") || "rodrigovencefy";
  const profileId = await extractProfileIdLinkedin(identifier);

  const api = await Client(undefined, "https://www.linkedin.com/posts/");

  // const response = await api.get(
  //   `rodrigovencefy_voc%C3%AA-n%C3%A3o-precisa-de-mais-conte%C3%BAdo-sobre-linkedin-activity-7417560942021906432-D74r/?utm_source=social_share_send&utm_medium=member_desktop_web&rcm=ACoAABgQ7uMBHhkeqe_cSk1_5fNcRa3Q1TZ8j0k`,
  // );

  // console.log("response: ", response.data);

  const response = await getPostLinkedin(
    "https://www.linkedin.com/posts/rodrigovencefy_voc%C3%AA-n%C3%A3o-precisa-de-mais-conte%C3%BAdo-sobre-linkedin-activity-7417560942021906432-D74r/?utm_source=social_share_send&utm_medium=member_desktop_web&rcm=ACoAABgQ7uMBHhkeqe_cSk1_5fNcRa3Q1TZ8j0k",
  );

  return NextResponse.json({ response });
}
