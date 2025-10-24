import * as fs from "fs-extra";
import axios from "axios";
import { Cookie } from "puppeteer";

export const COOKIE_FILE_PATH = "linkedin_cookies.json";

export const API_BASE_URL = "https://www.linkedin.com/voyager/api";
export const AUTH_BASE_URL = "https://www.linkedin.com";

// Interface para os cookies completos (formato Puppeteer)
interface LinkedInCookiesFile {
  cookies: Cookie[];
  timestamp: number;
}

// Interface para cookies específicos do LinkedIn API
interface LinkedInApiCookies {
  JSESSIONID: string;
  li_at: string;
}

// Função para salvar todos os cookies do Puppeteer no arquivo JSON
export const saveAllCookies = async (cookies: Cookie[]): Promise<void> => {
  try {
    const cookieData: LinkedInCookiesFile = {
      cookies,
      timestamp: Date.now(),
    };

    await fs.ensureFile(COOKIE_FILE_PATH);
    await fs.writeJson(COOKIE_FILE_PATH, cookieData, { spaces: 2 });
    console.log(`Todos os cookies salvos em: ${COOKIE_FILE_PATH}`);
  } catch (error) {
    console.error("Erro ao salvar cookies:", error);
    throw error;
  }
};

// Função para carregar todos os cookies do arquivo JSON
export const loadAllCookies = async (): Promise<Cookie[] | null> => {
  try {
    const exists = await fs.pathExists(COOKIE_FILE_PATH);
    if (!exists) {
      console.log("Arquivo de cookies não encontrado");
      return null;
    }

    const cookieData: LinkedInCookiesFile = await fs.readJson(COOKIE_FILE_PATH);

    // Verificar se tem a estrutura esperada
    if (!cookieData.cookies || !Array.isArray(cookieData.cookies)) {
      console.log("Estrutura de cookies inválida no arquivo");
      return null;
    }

    // Verificar se os cookies não expiraram (1 semana)
    // const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
    // if (Date.now() - cookieData.timestamp > ONE_WEEK) {
    //   console.log("Cookies expirados, removendo arquivo");
    //   await fs.remove(COOKIE_FILE_PATH);
    //   return null;
    // }

    console.log(
      `${cookieData.cookies.length} cookies carregados de: ${COOKIE_FILE_PATH}`
    );
    return cookieData.cookies;
  } catch (error) {
    console.error("Erro ao carregar cookies:", error);
    return null;
  }
};

// Função para extrair cookies específicos para API do LinkedIn
export const extractApiCookies = (
  cookies: Cookie[]
): LinkedInApiCookies | null => {
  const jsessionCookie = cookies.find((c) => c.name === "JSESSIONID");
  const liAtCookie = cookies.find((c) => c.name === "li_at");

  if (!jsessionCookie || !liAtCookie) {
    console.log("Cookies JSESSIONID ou li_at não encontrados");
    return null;
  }

  // Extrair o valor do JSESSIONID (remover "ajax:" se presente)
  let jsessionValue = jsessionCookie.value.replace(/"/g, "");
  if (jsessionValue.startsWith("ajax:")) {
    jsessionValue = jsessionValue.replace("ajax:", "");
  }

  return {
    JSESSIONID: jsessionValue,
    li_at: liAtCookie.value,
  };
};

// Função para salvar cookies específicos (compatibilidade com código existente)
export const saveCookies = async (
  JSESSIONID: string,
  li_at: string
): Promise<void> => {
  try {
    // Criar cookies no formato Puppeteer
    const cookies: Cookie[] = [
      {
        name: "JSESSIONID",
        value: `"ajax:${JSESSIONID}"`,
        domain: ".www.linkedin.com",
        path: "/",
        expires: -1,
        size: 0,
        httpOnly: false,
        secure: true,
        session: true,
        sameSite: "None",
      },
      {
        name: "li_at",
        value: li_at,
        domain: ".linkedin.com",
        path: "/",
        expires: -1,
        size: 0,
        httpOnly: true,
        secure: true,
        session: false,
        sameSite: "None",
      },
    ];

    await saveAllCookies(cookies);
  } catch (error) {
    console.error("Erro ao salvar cookies específicos:", error);
    throw error;
  }
};

// Função para carregar cookies específicos (compatibilidade com código existente)
export const loadCookies = async (): Promise<LinkedInApiCookies | null> => {
  try {
    const allCookies = await loadAllCookies();
    if (!allCookies) {
      return null;
    }

    return extractApiCookies(allCookies);
  } catch (error) {
    console.error("Erro ao carregar cookies específicos:", error);
    return null;
  }
};

// Função para criar cliente com cookies automáticos
export const Client = async (
  providedCookies?: LinkedInApiCookies
): Promise<ReturnType<typeof api>> => {
  let cookiesToUse: LinkedInApiCookies;
  const savedCookies = await loadCookies();

  if (savedCookies) {
    cookiesToUse = savedCookies;
  } else {
    if (providedCookies) {
      await saveCookies(providedCookies.JSESSIONID, providedCookies.li_at);
      cookiesToUse = providedCookies;
    } else {
      throw new Error("Nenhum cookie válido fornecido");
    }
  }

  return api({
    JSESSIONID: parseInt(cookiesToUse.JSESSIONID),
    li_at: cookiesToUse.li_at,
  });
};

const api = ({ JSESSIONID, li_at }: { li_at: string; JSESSIONID: number }) => {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "accept-language":
        "pt-BR,pt;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
      accept: "application/vnd.linkedin.normalized+json+2.1",
      cookie: `li_at=${li_at}; JSESSIONID="ajax:${JSESSIONID}"`,
      "csrf-token": `ajax:${JSESSIONID}`,
    },
  });
};

export const fetchData = async (endpoint: string) => {
  const api = await Client();
  const response = await api.get(endpoint);
  return response.data;
};
