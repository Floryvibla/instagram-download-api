import { getCommentsByPostUrl } from "@florydev/linkedin-api-voyager";
import { Client } from "./config";

export const linkedinLib = async () => {
  Client({
    JSESSIONID: "0466411065031579456",
    li_at:
      "AQEDAU9C-sMEobZ6AAABmgzAd04AAAGdoxs1kU4AYDxi4dFa2JUkdsZHqpIU9JuPIhi6J_aMAPYQ5dIYJuv6jXBRj04t-4vhJvMHhlMF48-MRFPJDD-k5f8CYH4QESpzmpP4zMm6WKODloiizUwuthG8",
  });
  return {
    getCommentsByPostUrl,
  };
};
