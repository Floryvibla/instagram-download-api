/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
export function filterKeys(obj: any, keysToKeep: string[]) {
  const filteredObject: any = {};
  keysToKeep.forEach((key) => {
    if (obj.hasOwnProperty(key)) {
      filteredObject[key] = obj[key];
    }
  });
  return filteredObject;
}

export function filterOutKeys(obj: any, keysToIgnore: string[]) {
  const filteredObject: any = {};
  Object.keys(obj).forEach((key) => {
    if (!keysToIgnore.includes(key)) {
      filteredObject[key] = obj[key];
    }
  });
  return filteredObject;
}

// Nova função para extrair valores de caminhos aninhados
export function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((current, key) => {
    // Lidar com arrays como attributes[0]
    if (key.includes("[") && key.includes("]")) {
      const [arrayKey, indexStr] = key.split("[");
      const index = parseInt(indexStr.replace("]", ""));
      return current?.[arrayKey]?.[index];
    }
    return current?.[key];
  }, obj);
}

// Nova função melhorada para filtrar com caminhos aninhados
export function extractFields(
  data: any[],
  fieldsMap: Record<string, string>
): any[] {
  return data.map((item) => {
    const extracted: any = {};

    Object.entries(fieldsMap).forEach(([newKey, path]) => {
      const value = getNestedValue(item, path);
      if (value !== undefined) {
        extracted[newKey] = value;
      }
    });

    return extracted;
  });
}

// Função para debug - mostra a estrutura do objeto
export function debugObjectStructure(
  obj: any,
  maxDepth: number = 3,
  currentDepth: number = 0
): void {
  if (currentDepth >= maxDepth) return;

  const indent = "  ".repeat(currentDepth);

  if (Array.isArray(obj)) {
    console.log(`${indent}Array[${obj.length}]:`);
    if (obj.length > 0) {
      console.log(`${indent}  [0]:`);
      debugObjectStructure(obj[0], maxDepth, currentDepth + 2);
    }
  } else if (obj && typeof obj === "object") {
    Object.keys(obj)
      .slice(0, 10)
      .forEach((key) => {
        const value = obj[key];
        if (typeof value === "object" && value !== null) {
          console.log(`${indent}${key}:`);
          debugObjectStructure(value, maxDepth, currentDepth + 1);
        } else {
          console.log(
            `${indent}${key}: ${typeof value} = ${String(value).slice(
              0,
              50
            )}...`
          );
        }
      });
  }
}

// Função para resolver referências URN dinamicamente
export function resolveReferences(data: any, included: any[]): any {
  if (!data || !included) return data;

  // Criar um mapa de URN para acesso rápido
  const urnMap = new Map();
  included.forEach((item) => {
    if (item.entityUrn) {
      urnMap.set(item.entityUrn, item);
    }
  });

  // Função recursiva para resolver referências
  function resolveObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => resolveObject(item));
    }

    if (obj && typeof obj === "object") {
      const resolved: any = {};

      Object.entries(obj).forEach(([key, value]) => {
        // Detectar chaves que começam com * (referências URN)
        if (key.startsWith("*") && typeof value === "string") {
          const referencedData = urnMap.get(value);
          if (referencedData) {
            // Remover o * e usar como chave
            const cleanKey = key.substring(1);
            resolved[cleanKey] = resolveObject(referencedData);
          } else {
            resolved[key] = value; // Manter original se não encontrar
          }
        }
        // Detectar arrays de URNs
        else if (
          Array.isArray(value) &&
          value.length > 0 &&
          typeof value[0] === "string" &&
          value[0].startsWith("urn:li:")
        ) {
          const resolvedArray = value
            .map((urn) => {
              const referencedData = urnMap.get(urn);
              return referencedData ? resolveObject(referencedData) : urn;
            })
            .filter((item) => item !== null);
          resolved[key] = resolvedArray;
        }
        // Recursão para objetos aninhados
        else if (value && typeof value === "object") {
          resolved[key] = resolveObject(value);
        }
        // Valores primitivos
        else {
          resolved[key] = value;
        }
      });

      return resolved;
    }

    return obj;
  }

  return resolveObject(data);
}

// Função para extrair dados com resolução automática de referências
export function extractDataWithReferences(
  elements: string[],
  included: any[],
  fieldsMap?: Record<string, string>
): any[] {
  // Filtrar dados pelos elementos
  const filteredData = included.filter((item) =>
    elements.includes(item.entityUrn)
  );

  // Resolver todas as referências
  const resolvedData = filteredData.map((item) =>
    resolveReferences(item, included)
  );

  // Se há mapeamento de campos, aplicar
  if (fieldsMap) {
    return extractFields(resolvedData, fieldsMap);
  }

  return resolvedData;
}

// Função para debug de estrutura com referências resolvidas
export function debugResolvedStructure(
  elements: string[],
  included: any[],
  maxDepth: number = 2
): void {
  console.log("🔍 Estrutura dos dados com referências resolvidas:");
  const resolved = extractDataWithReferences(elements, included);

  if (resolved.length > 0) {
    console.log(`📊 Total de itens: ${resolved.length}`);
    console.log("📋 Estrutura do primeiro item:");
    debugObjectStructure(resolved[0], maxDepth);
  }
}

// Função para extrair campos específicos de todos os objetos no included
export function extractFieldsFromIncluded(
  included: any[],
  fields: string[]
): Record<string, any>[] {
  return included
    .filter((item) => fields.some((field) => item[field] !== undefined))
    .map((item) => {
      const extracted: any = { entityUrn: item.entityUrn };

      fields.forEach((field) => {
        if (item[field] !== undefined) {
          extracted[field] = item[field];
        }
      });

      return extracted;
    });
}

// Função para associar dados extras aos dados principais
export function mergeExtraFields(
  mainData: any[],
  extraData: Record<string, any>[],
  matchKey: string = "companyUrn"
): any[] {
  return mainData.map((item) => {
    const extraItem = extraData.find(
      (extra) => item[matchKey] && extra.entityUrn === item[matchKey]
    );

    if (extraItem) {
      const { entityUrn, ...extraFields } = extraItem;
      return { ...item, ...extraFields };
    }

    return item;
  });
}

// src/libs/linkedin/extractExperiences.ts
type AnyObject = Record<string, any>;

interface Experience {
  role: string;
  company: string;
  time_duration?: string;
  location?: string;
  description?: string;
  time_period?: string;
  duration?: string;
}

export function extractExperiences(jsonData: AnyObject): Experience[] {
  const experiences: Experience[] = [];

  try {
    const included = jsonData?.included ?? [];
    if (!included.length) {
      console.warn("[PROFILE] No 'included' array found");
      return experiences;
    }

    // ===== PASS 1: Build component map by URN =====
    console.info(
      `[PROFILE] Pass 1: Building component map from ${included.length} items`
    );
    const componentMap: Record<string, AnyObject> = {};
    for (const item of included) {
      const urn = item?.entityUrn;
      if (urn) componentMap[urn] = item;
    }

    console.info(
      `[PROFILE] Pass 1: Indexed ${
        Object.keys(componentMap).length
      } components by URN`
    );

    // ===== PASS 2: Find anchor and traverse =====
    let mainExperienceUrn: string | null = null;
    for (const urn of Object.keys(componentMap)) {
      if (
        urn.includes("EXPERIENCE_VIEW_DETAILS") &&
        urn.includes("fsd_profile:")
      ) {
        mainExperienceUrn = urn;
        console.info(`[PROFILE] Pass 2: Found main experience anchor: ${urn}`);
        break;
      }
    }

    if (!mainExperienceUrn) {
      console.warn("[PROFILE] Pass 2: No experience anchor found");
      return experiences;
    }

    const mainList = componentMap[mainExperienceUrn];
    if (!mainList) {
      console.error(
        "[PROFILE] Pass 2: Anchor URN not in map (shouldn't happen)"
      );
      return experiences;
    }

    let elements: any[] =
      mainList.elements ?? mainList.components?.elements ?? [];

    console.info(
      `[PROFILE] Pass 2: Found ${elements.length} experience blocks`
    );

    const paging = mainList.paging ?? mainList.components?.paging;
    if (paging) {
      const { total = "unknown", count = "unknown", start = 0 } = paging;
      console.warn(
        `[PROFILE] PAGINATION: ${count} of ${total} experiences (start: ${start})`
      );
    }

    if (!elements.length) {
      console.warn("[PROFILE] Pass 2: No elements in main list");
      return experiences;
    }

    // Step 4: Process each experience block
    elements.forEach((elem, idx) => {
      try {
        if (typeof elem !== "object" || elem === null) return;

        const entity = elem?.components?.entityComponent;
        if (typeof entity !== "object" || !entity) {
          console.debug(`[PROFILE] Element ${idx}: No entityComponent`);
          return;
        }

        // Detect nested grouped roles (company with multiple positions)
        let nestedUrn: string | null = null;
        const subCompsWrapper = entity.subComponents;
        if (typeof subCompsWrapper === "object" && subCompsWrapper) {
          const subComponents = subCompsWrapper.components;
          if (Array.isArray(subComponents) && subComponents.length > 0) {
            const firstSub = subComponents[0];
            const subComps = firstSub?.components;
            if (typeof subComps === "object" && subComps) {
              for (const key of ["*pagedListComponent", "pagedListComponent"]) {
                const value = subComps[key];
                if (value) {
                  nestedUrn =
                    typeof value === "string"
                      ? value
                      : value?.entityUrn ?? null;
                  if (nestedUrn) break;
                }
              }
              if (!nestedUrn) {
                for (const [key, value] of Object.entries(subComps)) {
                  if (
                    key.toLowerCase().includes("pagedlistcomponent") &&
                    value
                  ) {
                    nestedUrn =
                      typeof value === "string"
                        ? value
                        : (value as any)?.entityUrn ?? null;
                    if (nestedUrn) break;
                  }
                }
              }
            }
          }
        }

        if (nestedUrn) {
          // GROUPED ENTRY (company with multiple roles)
          let companyName = "";
          const titleV2 = entity.titleV2;
          if (typeof titleV2 === "object") {
            const textObj = titleV2.text;
            companyName =
              typeof textObj === "string" ? textObj : textObj?.text ?? "";
          }

          let totalDuration = "";
          const subtitle = entity.subtitle;
          if (typeof subtitle === "object") {
            const textObj = subtitle.text;
            totalDuration =
              typeof textObj === "string" ? textObj : textObj?.text ?? "";
          }

          console.info(
            `[PROFILE] Element ${idx}: Grouped company '${companyName}' (${totalDuration})`
          );

          const nestedList = componentMap[nestedUrn];
          if (nestedList) {
            const nestedElements =
              nestedList.elements ?? nestedList.components?.elements ?? [];

            console.info(
              `[PROFILE] Found ${nestedElements.length} roles for '${companyName}'`
            );

            for (const [roleIdx, roleElem] of nestedElements.entries()) {
              const roleEntity = roleElem?.components?.entityComponent;
              if (roleEntity && typeof roleEntity === "object") {
                const exp = extractOneExperience(roleEntity, companyName);
                if (exp) {
                  console.debug(
                    `[PROFILE] Extracted role ${roleIdx + 1}/${
                      nestedElements.length
                    }: ${exp.role} at ${companyName}`
                  );
                  experiences.push(exp);
                }
              }
            }
          } else {
            console.warn(`[PROFILE] Nested URN not found in map: ${nestedUrn}`);
          }

          // Continue to next element without extracting parent
          return;
        }

        // SINGLE ENTRY
        const titleV2 = entity.titleV2;
        const caption = entity.caption;

        if (titleV2 && !caption) {
          console.warn(
            `[PROFILE] Element ${idx}: Skipping potential parent block`
          );
          return;
        }

        const exp = extractOneExperience(entity);
        if (exp) experiences.push(exp);
      } catch (err: any) {
        console.warn(`[PROFILE] Error on element ${idx}: ${err.message}`);
      }
    });

    console.info(
      `[PROFILE] Successfully extracted ${experiences.length} total experiences`
    );
  } catch (err: any) {
    console.error(`[PROFILE] Fatal error: ${err.message}`);
  }

  return experiences;
}

// Helper function
function extractOneExperience(
  entity: AnyObject,
  companyOverride?: string
): Experience | null {
  if (!entity || typeof entity !== "object") return null;

  const safeGetText = (obj: any, ...keys: string[]): string => {
    let current = obj;
    for (const key of keys) {
      if (typeof current !== "object" || current === null) return "";
      current = current[key];
      if (current === undefined || current === null) return "";
    }
    return typeof current === "string" ? current : current?.text ?? "";
  };

  const title = safeGetText(entity, "titleV2", "text", "text");
  if (!title) return null;

  let company = companyOverride ?? "";
  if (!company) {
    const subtitle = entity.subtitle;
    if (typeof subtitle === "object") {
      company =
        typeof subtitle.text === "string"
          ? subtitle.text
          : subtitle.text?.text ?? "";
    }
  }

  let dates = "";
  const caption = entity.caption;
  if (typeof caption === "object") {
    dates =
      typeof caption.text === "string"
        ? caption.text
        : caption.text?.text ?? "";
  }

  let location = "";
  const metadata = entity.metadata;
  if (typeof metadata === "object") {
    location =
      typeof metadata.text === "string"
        ? metadata.text
        : metadata.text?.text ?? "";
  }

  let description = "";
  try {
    const subcomps = entity.subComponents;
    const components = subcomps?.components;
    if (Array.isArray(components)) {
      for (const sc of components) {
        const scComps = sc?.components;
        const fixed = scComps?.fixedListComponent;
        const fixedComps = fixed?.components;
        if (Array.isArray(fixedComps)) {
          for (const fc of fixedComps) {
            const txtComp = fc?.components?.textComponent;
            const txt = safeGetText(txtComp, "text", "text");
            if (txt) {
              description = txt;
              break;
            }
          }
        }
        if (description) break;
      }
    }
  } catch (err: any) {
    console.debug(`[PROFILE] Error extracting description: ${err.message}`);
  }

  const result: Experience = {
    role: title,
    company: company || "N/A",
    time_duration: dates || "",
    location: location || "",
    description: description || "N/A",
  };

  if (dates.includes("·")) {
    const parts = dates.split("·");
    result.time_period = parts[0].trim();
    if (parts[1]) result.duration = parts[1].trim();
  }

  console.info(`[PROFILE] ✓ ${title} at ${company || "N/A"}`);
  return result;
}
