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
        month: profileData.birthDateOn.month,
        day: profileData.birthDateOn.day,
      },
      profilePicture: `${getNestedValue(
        profileData,
        "profilePicture.displayImageReferenceResolutionResult.vectorImage.rootUrl"
      )}${
        getNestedValue(
          profileData,
          "profilePicture.displayImageReferenceResolutionResult.vectorImage.artifacts"
        ).at(-1).fileIdentifyingUrlPathSegment
      }`,
      backgroundPicture: `${getNestedValue(
        profileData,
        "backgroundPicture.displayImageReferenceResolutionResult.vectorImage.rootUrl"
      )}${
        getNestedValue(
          profileData,
          "backgroundPicture.displayImageReferenceResolutionResult.vectorImage.artifacts"
        ).at(-1).fileIdentifyingUrlPathSegment
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

  const experiencesField = {
    id: "entityUrn",
    title: "title",
    companyName: "company.miniCompany.name",
    companyUrn: "companyUrn",
    companyEmployeeCount: "company.employeeCountRange",
    companyIndustries: "company.miniCompany.industries",
    description: "description",
    location: "locationName",
    geoLocation: "geoLocationName",
    timePeriod: "timePeriod",
    startDate: "timePeriod.startDate",
    endDate: "timePeriod.endDate",
  };

  const total = response.included[0].components.paging.total;
  const experiencia = response.included[0].components.elements.map(
    (item: any) => ({
      company: item.components.entityComponent.subtitle.text,
      role: item.components.entityComponent.titleV2.text.text,
      typeContract: item.components.entityComponent.subtitle.text
        .split("·")[1]
        .trim(),
      typeJob: item.components.entityComponent.caption.text
        .split("·")[1]
        .trim(),
      companyUrlLinkedin: item.components.entityComponent.textActionTarget,
      location: item.components.entityComponent.caption.text
        .split("·")[0]
        .trim(),
    })
  );

  return extractExperiences(response);

  return {
    total,
    experiencia,
    elements: response.included[0].components.elements,
  };

  const { data, included } = response;
  const elements = data["*elements"] as string[];

  // Usar a nova função para resolver referências automaticamente
  const dataExperiences = extractDataWithReferences(elements, included);

  // Extrair campos específicos do included
  const extraFields = extractFieldsFromIncluded(included, ["universalName"]);

  // Mapeamento de campos
  const fieldsMap = {
    id: "entityUrn",
    title: "title",
    companyName: "company.miniCompany.name",
    companyUrn: "companyUrn",
    companyEmployeeCount: "company.employeeCountRange",
    companyIndustries: "company.miniCompany.industries",
    description: "description",
    location: "locationName",
    geoLocation: "geoLocationName",
    timePeriod: "timePeriod",
    startDate: "timePeriod.startDate",
    endDate: "timePeriod.endDate",
  };

  // Aplicar mapeamento aos dados resolvidos
  const mappedExperiences = extractFields(dataExperiences, fieldsMap);

  // Associar campos extras
  const experiencesWithExtras = mergeExtraFields(
    mappedExperiences,
    extraFields,
    "companyUrn"
  );

  // Ordenar: sem endDate (ativo) primeiro, depois do mais recente ao mais antigo
  return experiencesWithExtras.sort((a, b) => {
    if (!a.endDate && b.endDate) return -1;
    if (a.endDate && !b.endDate) return 1;
    if (!a.endDate && !b.endDate) return 0;

    const yearDiff = (b.endDate.year || 0) - (a.endDate.year || 0);
    if (yearDiff !== 0) return yearDiff;

    return (b.endDate.month || 0) - (a.endDate.month || 0);
  });
};
