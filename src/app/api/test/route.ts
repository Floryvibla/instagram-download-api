/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Client,
  extractFields,
  extractProfileIdLinkedin,
  fetchData,
  filterKeys,
  filterOutKeys,
  getDataIncludedForEntity,
  getPostLinkedin,
  getUserPosts,
} from "@/libs/linkedin";
import { NextRequest, NextResponse } from "next/server";

interface LinkedInMessage {
  id: string;
  text: string;
  sentAt: number;
  media?: {
    type: "VIDEO" | "IMAGE" | "FILE" | "AUDIO";
    url: string | null;
    thumbnail?: string | null;
    duration?: number; // para vídeos/áudios
    fileName?: string;
  } | null;
  sender: {
    urn: string;
    fullName: string;
    firstName: string;
    lastName: string;
    profilePicture: string | null;
    isSelf: boolean;
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const identifier = searchParams.get("identifier") || "dev-anonyme-rdc";
  const profileId = await extractProfileIdLinkedin(identifier);

  const response = await fetchData(
    `voyagerMessagingGraphQL/graphql?queryId=messengerMessages.5846eeb71c981f11e0134cb6626cc314&variables=(conversationUrn:urn%3Ali%3Amsg_conversation%3A%28urn%3Ali%3Afsd_profile%3A${profileId}%2C2-MjdhODAyMzMtM2EwZi00YzIyLTg3YzktNDliOTcwN2FjMmU0XzEwMA%3D%3D%29)`,
  );

  const organizeNormalizedMessages = (rawPayload: any): LinkedInMessage[] => {
    const included = rawPayload?.included || [];
    const messageUrns =
      rawPayload?.data?.data?.messengerMessagesBySyncToken?.["*elements"] || [];

    // 1. Criamos mapas para busca rápida dentro do array 'included'
    const messageMap = new Map();
    const participantMap = new Map();
    const mediaMap = new Map();

    included.forEach((item: any) => {
      if (item.$type === "com.linkedin.messenger.Message") {
        messageMap.set(item.entityUrn, item);
      } else if (item.$type === "com.linkedin.messenger.MessagingParticipant") {
        participantMap.set(item.entityUrn, item);
      } else if (item.$type === "com.linkedin.videocontent.VideoPlayMetadata") {
        mediaMap.set(item.entityUrn, item);
      }
      // Adicione outros tipos de mídia aqui se necessário (File, Image, etc)
    });

    // 2. Montamos a lista final baseada na ordem do array principal (*elements)
    return messageUrns
      .map((urn: string) => {
        const msg = messageMap.get(urn);
        if (!msg) return null;

        const senderUrn = msg["*sender"];
        const senderRaw = participantMap.get(senderUrn);
        const memberInfo = senderRaw?.participantType?.member;

        // Processamento de Foto do Remetente
        let profilePic = null;
        if (memberInfo?.profilePicture?.artifacts) {
          const bestArtifact = memberInfo.profilePicture.artifacts.reduce(
            (prev: any, curr: any) => (prev.width > curr.width ? prev : curr),
          );
          profilePic = `${memberInfo.profilePicture.rootUrl}${bestArtifact.fileIdentifyingUrlPathSegment}`;
        }

        // Processamento de Mídia (Video, Imagem, File)
        let mediaContent = null;
        const renderContent = msg.renderContent?.[0];

        if (renderContent) {
          // Caso seja Vídeo (URN referenciada)

          if (renderContent["*video"]) {
            const videoData = mediaMap.get(renderContent["*video"]);
            const stream =
              videoData?.progressiveStreams?.[0]?.streamingLocations?.[0];
            mediaContent = {
              type: "VIDEO",
              url: stream?.url || null,
              thumbnail:
                videoData?.thumbnail?.artifacts?.[0]
                  ?.fileIdentifyingUrlPathSegment || null,
              duration: videoData?.duration,
            };
          }
          // Caso seja Imagem (Objeto direto)
          else if (renderContent.vectorImage) {
            mediaContent = {
              type: "IMAGE",
              url:
                renderContent.vectorImage.rootUrl +
                (renderContent.vectorImage.artifacts?.[0]
                  ?.fileIdentifyingUrlPathSegment || ""),
            };
          }
          // Caso seja Arquivo (Objeto direto)
          else if (renderContent.file) {
            mediaContent = {
              type: "FILE",
              url: renderContent.file.url,
              fileName: renderContent.file.name,
            };
          } else if (renderContent.audio) {
            mediaContent = {
              type: "AUDIO",
              url: renderContent.audio.url,
              duration: renderContent.audio.duration,
            };
          }
        }

        return {
          id: msg.backendUrn,
          text: msg.body?.text || null,
          sentAt: msg.deliveredAt,
          media: mediaContent,
          sender: {
            urn: senderRaw?.hostIdentityUrn || null,
            fullName:
              `${memberInfo?.firstName?.text || "LinkedIn User"} ${memberInfo?.lastName?.text || ""}`.trim(),
            profilePicture: profilePic,
            isSelf: memberInfo?.distance === "SELF",
          },
        };
      })
      .filter(Boolean)
      .sort((a: LinkedInMessage, b: LinkedInMessage) => b.sentAt - a.sentAt);
  };

  const messages = organizeNormalizedMessages(response);

  // console.log("response: ", response.data);

  // const response = await getPostLinkedin(
  //   "https://www.linkedin.com/posts/a-messina_lovable-ai-vibecoding-activity-7418374054778388481-xdM1?utm_source=social_share_send&utm_medium=member_desktop_web&rcm=ACoAABgQ7uMBHhkeqe_cSk1_5fNcRa3Q1TZ8j0k",
  // );

  return NextResponse.json({ messages });
}
