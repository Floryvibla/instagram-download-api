import {
  getCompany,
  getContactInfo,
  getLinkedinCertifications,
  getLinkedinEducation,
  getLinkedinSkills,
  getProfile,
  getProfissionalExperiences,
  getUserPosts,
} from "@/libs/linkedin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string; field: string }> }
) {
  const { username, field } = await params;

  switch (field) {
    case "contact":
      return NextResponse.json(await getContactInfo(username));
    case "experiences":
      return NextResponse.json(await getProfissionalExperiences(username));
    case "company":
      return NextResponse.json(await getCompany(username));
    case "miniProfile":
      return NextResponse.json(await getProfile(username));
    case "skills":
      return NextResponse.json(await getLinkedinSkills(username));
    case "education":
      return NextResponse.json(await getLinkedinEducation(username));
    case "certifications":
      return NextResponse.json(await getLinkedinCertifications(username));
    case "posts":
      return NextResponse.json(await getUserPosts({ identifier: username }));
    default:
      return NextResponse.json({ msg: "Field not found" });
  }
}
