/* eslint-disable @typescript-eslint/no-explicit-any */
import { getCompany } from "./company";
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

  const experiencesData = Promise.all(
    extractExperiences(response).map(async (item) => {
      const company = await getCompany(item.idCompany || "");
      if (item.idCompany) {
        delete (item as any).idCompany;
      }
      return {
        ...item,
        company,
      };
    })
  );

  return experiencesData;
};

export const getContactInfo = async (identifier: string) => {
  const profileId = await extractProfileIdLinkedin(identifier);

  if (!profileId) {
    throw new Error("Profile not found");
  }

  const response = await fetchData(
    `graphql?includeWebMetadata=true&variables=(memberIdentity:${identifier})&queryId=voyagerIdentityDashProfiles.c7452e58fa37646d09dae4920fc5b4b9`
  );

  const included = response?.included || [];
  if (!included.length) {
    console.warn("[PROFILE] No 'included' array found");
    return [];
  }

  const dataProfile = included.find(
    (item: any) => item?.entityUrn === `urn:li:fsd_profile:${profileId}`
  );

  const contactInfo = {
    address: dataProfile?.address || null,
    weChatContactInfo: dataProfile?.weChatContactInfo || null,
    phoneNumbers:
      dataProfile?.phoneNumbers?.map(
        (item: any) => item?.phoneNumber?.number
      ) || null,
    emailAddress: dataProfile?.emailAddress?.emailAddress || null,
    websites:
      dataProfile?.websites?.map((item: any) => ({
        label: item?.label,
        url: item?.url,
      })) || null,
  };

  return contactInfo;
};

export const getLinkedinSkills = async (identifier: string) => {
  const profileId = await extractProfileIdLinkedin(identifier);

  if (!profileId) {
    throw new Error("Profile not found");
  }

  const response = await fetchData(
    `graphql?includeWebMetadata=true&variables=(profileUrn:urn%3Ali%3Afsd_profile%3A${profileId},sectionType:skills,locale:pt_BR)&queryId=voyagerIdentityDashProfileComponents.c5d4db426a0f8247b8ab7bc1d660775a`
  );

  const included = response?.included || [];

  const componentsSkills = included
    .filter(
      (item: any) =>
        item?.$type ===
        "com.linkedin.voyager.dash.identity.profile.tetris.PagedListComponent"
    )
    .map((item: any) =>
      item?.components.elements.map(
        (item: any) =>
          item?.components.entityComponent.titleV2.text.text || null
      )
    )
    .filter((item: any) => item !== null)
    .flat();

  return componentsSkills;
};

export const getLinkedinEducation = async (identifier: string) => {
  const profileId = await extractProfileIdLinkedin(identifier);

  if (!profileId) {
    throw new Error("Profile not found");
  }

  const response = await fetchData(
    `graphql?includeWebMetadata=true&variables=(profileUrn:urn%3Ali%3Afsd_profile%3A${profileId},sectionType:education,locale:pt_BR)&queryId=voyagerIdentityDashProfileComponents.c5d4db426a0f8247b8ab7bc1d660775a`
  );

  const included = response?.included || [];

  const componentsEducation = included
    .filter(
      (item: any) =>
        item?.$type ===
        "com.linkedin.voyager.dash.identity.profile.tetris.PagedListComponent"
    )
    .map((item: any) =>
      item?.components.elements.map(
        (item: any) => item?.components.entityComponent || null
      )
    )
    .filter((item: any) => item !== null);

  const parseData = componentsEducation?.[0] || [];

  const educationData = parseData.map((item: any) => {
    const isStudying = item?.caption === null;

    const skillsData = item?.subComponents.components.find(
      (item: any) => item?.components?.insightComponent === null
    );

    return {
      schoolName: item?.titleV2?.text?.text || null,
      linkedinUrlSchool: item?.textActionTarget || null,
      degreeName: item?.subtitle.text || null,
      startDate: !isStudying
        ? Number(item?.caption?.text?.split(" - ")[0]) || null
        : null,
      endDate: !isStudying
        ? Number(item?.caption?.text?.split(" - ")[1]) || null
        : null,
      isStudying,
      skills:
        skillsData?.components?.fixedListComponent?.components[0]?.components
          ?.textComponent?.text.text || null,
    };
  });

  return educationData;
};

export const getLinkedinCertifications = async (identifier: string) => {
  const profileId = await extractProfileIdLinkedin(identifier);

  if (!profileId) {
    throw new Error("Profile not found");
  }

  const response = await fetchData(
    `graphql?includeWebMetadata=true&variables=(profileUrn:urn%3Ali%3Afsd_profile%3A${profileId},sectionType:certifications,locale:pt_BR)&queryId=voyagerIdentityDashProfileComponents.c5d4db426a0f8247b8ab7bc1d660775a`
  );

  const included = response?.included || [];

  const componentsCertifications = included
    .filter(
      (item: any) =>
        item?.$type ===
        "com.linkedin.voyager.dash.identity.profile.tetris.PagedListComponent"
    )
    .map((item: any) =>
      item?.components.elements.map(
        (item: any) => item?.components.entityComponent || null
      )
    )
    .filter((item: any) => item !== null);

  const parseData = componentsCertifications?.[0] || [];

  return parseData;
};
