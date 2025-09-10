/* eslint-disable @typescript-eslint/no-explicit-any */
import { load } from "cheerio";
import querystring from "querystring";
import axios, { AxiosError } from "axios";

export const getTimedFilename = (name: string, ext: string) => {
  const timeStamp = Math.floor(Date.now() / 1000).toString();
  return `${name}-${timeStamp}.${ext}`;
};

export const getClientIp = (request: any) => {
  let ip;

  ip = request.ip ?? request.headers.get("x-real-ip");
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (!ip && forwardedFor) {
    ip = forwardedFor.split(",").at(0) ?? null;
  }

  return ip;
};

export const makeSuccessResponse = (data: any) => {
  const response = {
    status: "success",
    data: data,
  };
  return response;
};

export const makeErrorResponse = (message = "Internal Server Error") => {
  const response = {
    status: "error",
    message: message,
  };
  return response;
};

export const makeHttpRequest = async ({ timeout = 10000, ...args }) => {
  try {
    const response = await axios({
      ...args,
      timeout: timeout, // Garantir que o timeout seja aplicado corretamente
    });
    return response;
  } catch (error) {
    const axiosError = error as AxiosError;
    
    if (axiosError.code === 'ECONNABORTED') {
      console.error("Request timeout:", axiosError.message);
      throw new Error("Request timed out. Please try again.");
    }
    
    if (axiosError.response) {
      console.error("Axios Error:", axiosError.message);
      throw new Error(axiosError.message);
    } else if (axiosError.request) {
      console.error("Request Error:", axiosError.message);
      throw new Error("Network error. Please check your connection.");
    } else {
      console.error("Server Error:", axiosError.message);
      throw new Error("Something went wrong, please try again.");
    }
  }
};

export const formatPageJson = (postHtml: any) => {
  // Primeiro tenta extrair vídeo
  const videoElement = postHtml("meta[property='og:video']");

  if (videoElement.length > 0) {
    const videoUrl = videoElement.attr("content");
    if (videoUrl) {
      const width = postHtml("meta[property='og:video:width']").attr("content");
      const height = postHtml("meta[property='og:video:height']").attr(
        "content"
      );
      const filename = getIGVideoFileName();

      return {
        type: "video",
        filename: filename,
        width: width ?? "",
        height: height ?? "",
        videoUrl: videoUrl,
      };
    }
  }

  // Verifica se é um carrossel procurando por indicadores na página
  const pageText = postHtml.html();
  const isCarousel = pageText.includes('"edge_sidecar_to_children"') || 
                    pageText.includes('sidecar') ||
                    pageText.includes('GraphSidecar');
  
  // Se detectar carrossel, retorna null para forçar uso do GraphQL
  if (isCarousel) {
    return null;
  }

  // Se não é vídeo nem carrossel, tenta extrair imagem única
  const imageElement = postHtml("meta[property='og:image']");

  if (imageElement.length > 0) {
    const imageUrl = imageElement.attr("content");
    if (imageUrl) {
      const width = postHtml("meta[property='og:image:width']").attr("content");
      const height = postHtml("meta[property='og:image:height']").attr(
        "content"
      );
      const filename = getIGImageFileName();

      return {
        type: "image",
        filename: filename,
        width: width ?? "",
        height: height ?? "",
        imageUrl: imageUrl,
      };
    }
  }

  return null;
};

export const getPostId = (postUrl: string) => {
  if (!postUrl) {
    throw new Error("Instagram URL was not provided");
  }
  const postRegex =
    /^https:\/\/(?:www\.)?instagram\.com\/p\/([a-zA-Z0-9_-]+)\/?/;
  const reelRegex =
    /^https:\/\/(?:www\.)?instagram\.com\/reels?\/([a-zA-Z0-9_-]+)\/?/;
  let postId;

  if (!postUrl) {
    throw new Error("Instagram URL was not provided");
  }

  const postCheck = postUrl.match(postRegex);
  if (postCheck) {
    postId = postCheck.at(-1);
  }

  const reelCheck = postUrl.match(reelRegex);
  if (reelCheck) {
    postId = reelCheck.at(-1);
  }

  if (!postId) {
    throw new Error("Instagram post/reel ID was not found");
  }

  return postId;
};

export const fetchFromPage = async (postId: string, timeout = 10000) => {
  const postUrl = "https://www.instagram.com/p/" + postId;

  const headers = {
    accept: "*/*",
    host: "www.instagram.com",
    referer: "https://www.instagram.com/",
    DNT: "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "same-origin",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/117.0",
  };

  let response;
  try {
    response = await makeHttpRequest({
      url: postUrl,
      method: "GET",
      headers,
      timeout,
    });
  } catch (e) {
    handleScraperError(e as AxiosError);
    return null;
  }

  if (response.statusText === "error") {
    return null;
  }

  if (!response.data) return null;

  const postHtml = load(response.data);
  const videoElement = postHtml("meta[property='og:video']");

  // CORREÇÃO: Se não há vídeo, retorna null para forçar uso do GraphQL
  if (videoElement.length === 0) {
    return null;
  }

  const formattedJson = formatPageJson(postHtml);
  return formattedJson;
};

export const fetchFromGraphQL = async (postId: string, timeout = 10000) => {
  if (!postId) return null;

  const API_URL = "https://www.instagram.com/api/graphql";
  const headers = {
    Accept: "*/*",
    "Accept-Language": "en-US,en;q=0.5",
    "Content-Type": "application/x-www-form-urlencoded",
    "X-FB-Friendly-Name": "PolarisPostActionLoadPostQueryQuery",
    "X-CSRFToken": "RVDUooU5MYsBbS1CNN3CzVAuEP8oHB52",
    "X-IG-App-ID": "1217981644879628",
    "X-FB-LSD": "AVqbxe3J_YA",
    "X-ASBD-ID": "129477",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "User-Agent":
      "Mozilla/5.0 (Linux; Android 11; SAMSUNG SM-G973U) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/14.2 Chrome/87.0.4280.141 Mobile Safari/537.36",
  };

  const encodedData = encodePostRequestData(postId);

  let response;
  try {
    response = await makeHttpRequest({
      url: API_URL,
      method: "POST",
      headers,
      data: encodedData,
      timeout,
    });
    if (response.statusText === "error") {
      return null;
    }
  } catch (e) {
    handleScraperError(e as AxiosError);
    return null;
  }

  if (response.statusText === "error") return null;

  const contentType = response.headers["content-type"];

  if (contentType !== "text/javascript; charset=utf-8") return null;

  const responseJson = response.data;
  if (!responseJson.data) return null;

  const formattedJson = formatGraphqlJson(responseJson);
  return formattedJson;
};

export const getIGVideoFileName = () =>
  getTimedFilename("ig-downloader", "mp4");

// Função para gerar nome de arquivo de imagem
export const getIGImageFileName = () =>
  getTimedFilename("ig-downloader", "jpg");

export const handleScraperError = (error: AxiosError) => {
  console.log("Scraper error:", error.message);
  if (error.message.includes("status code 404")) {
    throw new Error("This post is private or does not exist");
  } else if (error) {
    throw new Error();
  }
};

export const formatGraphqlJson = (postJson: any) => {
  const data = postJson.data.xdt_shortcode_media;

  if (!data) {
    throw new Error("This post does not exist");
  }

  const { width, height } = data.dimensions;

  // Verifica se é um vídeo
  if (data.is_video) {
    const filename = getIGVideoFileName();
    const videoUrl = data.video_url;

    return {
      type: "video",
      filename: filename,
      width: width.toString(),
      height: height.toString(),
      videoUrl: videoUrl,
    };
  }

  // Verifica se é um carrossel (múltiplas imagens/vídeos)
  if (
    data.edge_sidecar_to_children &&
    data.edge_sidecar_to_children.edges &&
    data.edge_sidecar_to_children.edges.length > 0
  ) {
    const mediaItems = data.edge_sidecar_to_children.edges.map(
      (edge: any, index: number) => {
        const node = edge.node;
        const itemDimensions = node.dimensions;

        if (node.is_video) {
          return {
            type: "video",
            filename: getTimedFilename(`ig-carousel-${index + 1}`, "mp4"),
            width: itemDimensions.width.toString(),
            height: itemDimensions.height.toString(),
            videoUrl: node.video_url,
          };
        } else {
          return {
            type: "image",
            filename: getTimedFilename(`ig-carousel-${index + 1}`, "jpg"),
            width: itemDimensions.width.toString(),
            height: itemDimensions.height.toString(),
            imageUrl: node.display_url,
          };
        }
      }
    );

    return {
      type: "carousel",
      totalItems: mediaItems.length,
      items: mediaItems,
    };
  }

  // Imagem única
  if (data.display_url) {
    const filename = getIGImageFileName();

    return {
      type: "image",
      filename: filename,
      width: width.toString(),
      height: height.toString(),
      imageUrl: data.display_url,
    };
  }

  throw new Error("Unsupported media type");
};

const encodePostRequestData = (shortcode: string) => {
  const requestData = {
    av: "0",
    __d: "www",
    __user: "0",
    __a: "1",
    __req: "3",
    __hs: "19624.HYP:instagram_web_pkg.2.1..0.0",
    dpr: "3",
    __ccg: "UNKNOWN",
    __rev: "1008824440",
    __s: "xf44ne:zhh75g:xr51e7",
    __hsi: "7282217488877343271",
    __dyn:
      "7xeUmwlEnwn8K2WnFw9-2i5U4e0yoW3q32360CEbo1nEhw2nVE4W0om78b87C0yE5ufz81s8hwGwQwoEcE7O2l0Fwqo31w9a9x-0z8-U2zxe2GewGwso88cobEaU2eUlwhEe87q7-0iK2S3qazo7u1xwIw8O321LwTwKG1pg661pwr86C1mwraCg",
    __csr:
      "gZ3yFmJkillQvV6ybimnG8AmhqujGbLADgjyEOWz49z9XDlAXBJpC7Wy-vQTSvUGWGh5u8KibG44dBiigrgjDxGjU0150Q0848azk48N09C02IR0go4SaR70r8owyg9pU0V23hwiA0LQczA48S0f-x-27o05NG0fkw",
    __comet_req: "7",
    lsd: "AVqbxe3J_YA",
    jazoest: "2957",
    __spin_r: "1008824440",
    __spin_b: "trunk",
    __spin_t: "1695523385",
    fb_api_caller_class: "RelayModern",
    fb_api_req_friendly_name: "PolarisPostActionLoadPostQueryQuery",
    variables: JSON.stringify({
      shortcode: shortcode,
      fetch_comment_count: "null",
      fetch_related_profile_media_count: "null",
      parent_comment_count: "null",
      child_comment_count: "null",
      fetch_like_count: "null",
      fetch_tagged_user_count: "null",
      fetch_preview_comment_count: "null",
      has_threaded_comments: "false",
      hoisted_comment_id: "null",
      hoisted_reply_id: "null",
    }),
    server_timestamps: "true",
    doc_id: "10015901848480474",
  };
  const encoded = querystring.stringify(requestData);
  return encoded;
};
