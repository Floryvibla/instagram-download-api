import { getTimedFilename } from "./utils.js";

// Função para gerar nome de arquivo de vídeo
export const getIGVideoFileName = () =>
    getTimedFilename("ig-downloader", "mp4");

// Função para gerar nome de arquivo de imagem
export const getIGImageFileName = () =>
    getTimedFilename("ig-downloader", "jpg");

export const handleScraperError = (error) => {
    console.log("Scraper error:", error.message);
    if (error.message.includes("status code 404")) {
        throw new Error("This post is private or does not exist", 404);
    } else if (error) {
        throw new Error();
    }
};
