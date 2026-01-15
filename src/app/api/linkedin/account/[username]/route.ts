/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  getCompany,
  getContactInfo,
  getLinkedinCertifications,
  getLinkedinEducation,
  getLinkedinSkills,
  getProfile,
  getProfissionalExperiences,
} from "@/libs/linkedin";
import { NextResponse } from "next/server";

async function safe<T>(fn: () => Promise<T>) {
  try {
    return await fn();
  } catch {
    return null;
  }
}

function getFirstCompanyIdentifier(experiences: any): string | null {
  if (!Array.isArray(experiences)) return null;
  for (const item of experiences) {
    const id = item?.company?.id;
    if (typeof id === "string" && id.length > 0) return id;
  }
  return null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const [contact, profile, experiences, skills, education, certifications] =
    await Promise.all([
      safe(() => getContactInfo(username)),
      safe(() => getProfile(username)),
      safe(() => getProfissionalExperiences(username)),
      safe(() => getLinkedinSkills(username)),
      safe(() => getLinkedinEducation(username)),
      safe(() => getLinkedinCertifications(username)),
    ]);

  const companyIdentifier = getFirstCompanyIdentifier(experiences);
  const company = companyIdentifier
    ? await safe(() => getCompany(companyIdentifier))
    : null;

  return NextResponse.json({
    profile,
    contact,
    company,
    experiences,
    education,
    skills,
    certifications,
  });
}
