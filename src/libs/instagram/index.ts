import { fetchFromGraphQL, fetchFromPage, getPostId } from "./helpers";

/**
 * Função principal para fazer download de posts do Instagram
 * Suporta vídeos, imagens únicas e carrossel
 */
export const instagramDownloadPost = async (
  postUrl: string,
  timeout: number = 10000 // 10 segundos em milissegundos
) => {
  const postId = getPostId(postUrl);

  // Primeiro tenta extrair da página
  const pageJson = await fetchFromPage(postId, timeout);
  if (pageJson) return pageJson;

  // Se falhar, tenta via GraphQL
  const apiJson = await fetchFromGraphQL(postId, timeout);
  if (apiJson) return apiJson;

  throw new Error("Video link for this post is not public.", {
    cause: 401,
  });
};
