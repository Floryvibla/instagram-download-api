import { Client } from "@florydev/linkedin-api-voyager";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/linkedin/")) {
    Client({
      JSESSIONID: "0466411065031579456",
      li_at:
        "AQEDAU9C-sMEobZ6AAABmgzAd04AAAGdoxs1kU4AYDxi4dFa2JUkdsZHqpIU9JuPIhi6J_aMAPYQ5dIYJuv6jXBRj04t-4vhJvMHhlMF48-MRFPJDD-k5f8CYH4QESpzmpP4zMm6WKODloiizUwuthG8",
    });
    return NextResponse.next();
  }
}

export const config = {
  matcher: "/api/linkedin/:path*",
};
