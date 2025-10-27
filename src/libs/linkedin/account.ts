/* eslint-disable @typescript-eslint/no-explicit-any */
import { fetchData } from "./config";
import {
  extractDataWithReferences,
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

  // const data = response.data;

  // const dataResult: any[] = response?.included;

  // const getEntityByUrn = (urn: string) =>
  //   dataResult.find((item) => item.entityUrn === urn);

  // const keyProfile = getEntityByUrn(data?.["*profile"]);
  // if (!keyProfile) throw new Error("Key profile not found");

  // const miniProfile = getEntityByUrn(keyProfile?.["*miniProfile"]);
  // if (!miniProfile) throw new Error("Mini profile not found");

  // return data;
};

export const getProfissionalExperiences = async (identifier: string) => {
  const response = await fetchData(
    `/identity/profiles/${identifier}/positions`
  );

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
