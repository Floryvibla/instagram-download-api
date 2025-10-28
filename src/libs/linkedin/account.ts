/* eslint-disable @typescript-eslint/no-explicit-any */
import { fetchData } from "./config";
import {
  extractDataWithReferences,
  extractExperiences,
  extractFields,
  extractFieldsFromIncluded,
  getNestedValue,
  mergeExtraFields,
} from "./utils";

export const extractProfileIdLinkedin = async (profileUrl: string) => {
  const match = profileUrl.match(/linkedin\.com\/in\/([a-zA-Z0-9-]+)/);
  const profileId = match ? match[1] : profileUrl;

  if (profileId) {
    const response = await fetchData(
      `graphql?variables=(vanityName:${profileId})&queryId=voyagerIdentityDashProfiles.34ead06db82a2cc9a778fac97f69ad6a`
    );

    if ("included" in response) {
      const profileData = response.included.find(
        (item: any) => item?.publicIdentifier === `${profileId}`
      );

      return profileData?.entityUrn.replace("urn:li:fsd_profile:", "") || null;
    }

    return null;
  }

  return null;
};

export const getProfile = async (identifier: string) => {
  const response = await fetchData(
    `graphql?variables=(vanityName:${identifier})&queryId=voyagerIdentityDashProfiles.34ead06db82a2cc9a778fac97f69ad6a`
  );

  if ("included" in response) {
    const profileData = response.included.find(
      (item: any) => item?.publicIdentifier === `${identifier}`
    );

    const profile = {
      id_urn: profileData?.entityUrn.replace("urn:li:fsd_profile:", ""),
      publicIdentifier: profileData?.publicIdentifier,
      firstName: profileData?.firstName,
      lastName: profileData?.lastName,
      fullName: `${profileData?.firstName || ""} ${
        profileData?.lastName || ""
      }`,
      headline: getNestedValue(profileData, "headline"),
      birthDate: {
        month: profileData?.birthDateOn?.month || null,
        day: profileData?.birthDateOn?.day || null,
      },
      profilePicture: `${getNestedValue(
        profileData,
        "profilePicture.displayImageReferenceResolutionResult.vectorImage.rootUrl"
      )}${
        getNestedValue(
          profileData,
          "profilePicture.displayImageReferenceResolutionResult.vectorImage.artifacts"
        )?.at(-1)?.fileIdentifyingUrlPathSegment || null
      }`,
      backgroundPicture: `${getNestedValue(
        profileData,
        "backgroundPicture.displayImageReferenceResolutionResult.vectorImage.rootUrl"
      )}${
        getNestedValue(
          profileData,
          "backgroundPicture.displayImageReferenceResolutionResult.vectorImage.artifacts"
        )?.at(-1)?.fileIdentifyingUrlPathSegment || null
      }`,
    };

    return profile;
  }

  throw new Error("Profile not found");
};

export const getProfissionalExperiences = async (identifier: string) => {
  const profileId = await extractProfileIdLinkedin(identifier);

  if (!profileId) {
    throw new Error("Profile not found");
  }

  const response = await fetchData(
    `graphql?variables=(profileUrn:urn%3Ali%3Afsd_profile%3A${profileId},sectionType:experience,locale:en_US)&queryId=voyagerIdentityDashProfileComponents.c5d4db426a0f8247b8ab7bc1d660775a`
  );

  return extractExperiences(response);
};
