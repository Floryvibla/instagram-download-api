/* eslint-disable @typescript-eslint/no-explicit-any */
import { instagramDownloadPost } from "@/libs/instagram";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 }
      );
    }

    const response = await instagramDownloadPost(url);

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
