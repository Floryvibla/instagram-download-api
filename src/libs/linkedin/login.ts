import {
  launchBrowserWithBrowserless,
  LinkedInCredentials,
  launchBrowserLocal,
} from "../browser";
import { LINKEDIN_CREDS } from "./config";

export async function LoginLinkedin(params?: LinkedInCredentials) {
  const result = await launchBrowserLocal(params || LINKEDIN_CREDS);

  // Fechar o browser após o login
  if (result?.browser) {
    console.log("🔒 Fechando browser após login...");
    await result.browser.close();
  }
}
