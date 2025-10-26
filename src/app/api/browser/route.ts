import { LinkedInAutomation } from "@/libs/browser/linkedin-automation";

export async function GET() {
  const automation = new LinkedInAutomation();

  try {
    // Definir credenciais (substitua pelos valores reais)
    automation.setCredentials({
      email: "fmignon243@gmail.com",
      password: "kinshasardc",
    });

    // Inicializar automação
    const initialized = await automation.initialize();

    if (!initialized) {
      console.log("❌ Falha ao inicializar automação");
      return;
    }

    // Verificar se está logado
    const isLoggedIn = await automation.isLoggedIn();
    console.log("Status do login:", isLoggedIn ? "✅ Logado" : "❌ Não logado");

    // Navegar para o feed
    await automation.navigateTo("https://www.linkedin.com/feed/");

    // Aguardar alguns segundos para ver o resultado
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Exemplo de interação: aguardar elemento do feed
    const feedExists = await automation.waitForElement(
      '[data-urn*="urn:li:activity"]'
    );
    console.log("Feed carregado:", feedExists ? "✅ Sim" : "❌ Não");
    return Response.json({ browser: "tudo okey" });
  } catch (error) {
    console.log("❌ Erro durante execução:", error);
    return Response.json({ browser: "erro" });
  } finally {
    // Sempre fechar o browser
    await automation.close();
    return Response.json({ browser: "finally close" });
  }
}
