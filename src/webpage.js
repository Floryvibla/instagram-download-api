import { load } from "cheerio";

import { makeHttpRequest } from "./utils.js";
import { handleScraperError, getIGVideoFileName, getIGImageFileName } from "./helpers.js";

/**
 * Formata dados extraídos da página para diferentes tipos de mídia
 */
export const formatPageJson = (postHtml) => {
    // Primeiro tenta extrair vídeo
    const videoElement = postHtml("meta[property='og:video']");
    
    if (videoElement.length > 0) {
        const videoUrl = videoElement.attr("content");
        if (videoUrl) {
            const width = postHtml("meta[property='og:video:width']").attr("content");
            const height = postHtml("meta[property='og:video:height']").attr("content");
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

    // Se não é vídeo, tenta extrair imagem
    const imageElement = postHtml("meta[property='og:image']");
    
    if (imageElement.length > 0) {
        const imageUrl = imageElement.attr("content");
        if (imageUrl) {
            const width = postHtml("meta[property='og:image:width']").attr("content");
            const height = postHtml("meta[property='og:image:height']").attr("content");
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

export const fetchFromPage = async (postId, timeout = 0) => {

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
        handleScraperError(e);
        return null;
    }

    if (response.statusText === "error") {
        return null;
    }

    if (!response.data) return null;

    const postHtml = load(response.data);
    const videoElement = postHtml("meta[property='og:video']");

    if (videoElement.length === 0) {
        return null;
    }

    const formattedJson = formatPageJson(postHtml);
    return formattedJson;
};
