/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect } from "react";
import useSWRMutation from "swr/mutation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import {
  Linkedin,
  Instagram,
  Globe,
  ChevronRight,
  Loader2,
  Copy,
  Check,
  Terminal,
  Info,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// Dynamic import for ReactJson to avoid SSR issues
const ReactJson = dynamic(() => import("react-json-view"), { ssr: false });

// --- Types ---
type OperationMode = "account" | "contact" | "company" | "search" | "comments";

interface OperationInfo {
  title: string;
  description: string;
  params: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  exampleRequest: Record<string, any>;
  exampleResponse: Record<string, any>;
}

// --- Data & Constants ---
const LINKEDIN_OPERATIONS: Record<OperationMode, OperationInfo> = {
  account: {
    title: "Dados do Perfil",
    description:
      "Recupera informações detalhadas de um perfil pessoal do LinkedIn, incluindo experiências, educação e skills.",
    params: [
      {
        name: "identifier",
        type: "string",
        required: true,
        description: "Username público ou URN do perfil",
      },
      {
        name: "field",
        type: "string",
        required: false,
        description: "Filtro opcional: profile, experiences, skills, education",
      },
    ],
    exampleRequest: { identifier: "billgates", field: "profile" },
    exampleResponse: {
      success: true,
      data: {
        firstName: "Bill",
        lastName: "Gates",
        headline: "Co-chair, Bill & Melinda Gates Foundation",
        publicIdentifier: "billgates",
        profilePicture: "https://media.licdn.com/...",
      },
    },
  },
  contact: {
    title: "Informações de Contato",
    description:
      "Busca dados de contato como email, telefone, sites e endereço (se disponíveis e visíveis).",
    params: [
      {
        name: "identifier",
        type: "string",
        required: true,
        description: "Username público ou URN do perfil",
      },
    ],
    exampleRequest: { identifier: "billgates" },
    exampleResponse: {
      success: true,
      data: {
        emailAddress: "billg@gatesfoundation.org",
        websites: [{ url: "https://www.gatesnotes.com" }],
      },
    },
  },
  company: {
    title: "Dados da Empresa",
    description:
      "Extrai informações públicas de uma Company Page, como setor, tamanho, localização e descrição.",
    params: [
      {
        name: "identifier",
        type: "string",
        required: true,
        description: "Username da empresa (ex: google)",
      },
    ],
    exampleRequest: { identifier: "google" },
    exampleResponse: {
      success: true,
      data: {
        name: "Google",
        description: "A Google mission is to organize...",
        followerCount: 34000000,
        companyIndustries: [{ localizedName: "Technology" }],
      },
    },
  },
  search: {
    title: "Pesquisa de Pessoas",
    description:
      "Realiza uma busca por pessoas no LinkedIn com base em palavras-chave.",
    params: [
      {
        name: "q",
        type: "string",
        required: true,
        description: "Termo de busca (ex: Software Engineer)",
      },
    ],
    exampleRequest: { q: "Software Engineer Google" },
    exampleResponse: {
      success: true,
      data: [
        {
          name: "John Doe",
          headline: "Engineer at Google",
          publicIdentifier: "john-doe-123",
        },
      ],
    },
  },
  comments: {
    title: "Comentários do Post",
    description:
      "Extrai comentários de um post específico do LinkedIn. Suporta paginação.",
    params: [
      {
        name: "url",
        type: "string",
        required: true,
        description: "URL completa do post",
      },
    ],
    exampleRequest: { url: "https://www.linkedin.com/posts/..." },
    exampleResponse: {
      success: true,
      data: [
        {
          text: "Great post!",
          author: { name: "Jane Doe" },
          created_at: "2023-10-27T10:00:00Z",
        },
      ],
      total: 1,
    },
  },
};

// --- Fetcher for SWR ---
async function fetcher(url: string, { arg }: { arg: Record<string, any> }) {
  const params = new URLSearchParams();
  Object.entries(arg).forEach(([key, value]) => {
    if (value) params.append(key, String(value));
  });

  const queryString = params.toString();
  const fullUrl = queryString ? `${url}?${queryString}` : url;

  const res = await fetch(fullUrl);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.message || errorData.error || "Ocorreu um erro na requisição"
    );
  }
  return res.json();
}

// --- Helper Components ---

const CodeBlock = ({
  code,
  language = "json",
  title,
}: {
  code: string;
  language?: string;
  title?: string;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-lg overflow-hidden border bg-zinc-950">
      {title && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-xs text-zinc-400">
          <span>{title}</span>
        </div>
      )}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-zinc-400 hover:text-white hover:bg-zinc-800"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>
      <div className="text-xs font-mono">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: "1rem",
            background: "transparent",
          }}
          wrapLines={true}
          wrapLongLines={true}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

const RequestPreview = ({
  method,
  url,
  params,
}: {
  method: string;
  url: string;
  params: Record<string, any>;
}) => {
  const queryString = new URLSearchParams(params as any).toString();
  const fullUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${url}${queryString ? `?${queryString}` : ""}`
      : `${url}?${queryString}`;
  const curl = `curl -X ${method} "${fullUrl}"`;

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground uppercase tracking-wider">
        cURL Request
      </Label>
      <CodeBlock code={curl} language="bash" />
    </div>
  );
};

const InteractiveJsonViewer = ({ data }: { data: any }) => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Define colors based on theme but more muted/clean
  const isDark = theme === "dark";

  // Customizing react-json-view theme to match shadcn/ui
  // We can pass a theme object
  const jsonTheme = isDark ? "tomorrow" : "rjv-default";

  // Custom styles for container
  const style = {
    padding: "20px",
    borderRadius: "0.5rem",
    backgroundColor: "transparent", // Let container handle bg
    fontSize: "0.85rem",
    fontFamily: "var(--font-geist-mono), monospace",
  };

  return (
    <div className="json-viewer-container [&_.string-value]:cursor-pointer [&_.string-value:hover]:underline">
      <ReactJson
        src={data}
        theme={jsonTheme}
        style={style}
        collapsed={false} // Expand by default
        enableClipboard={true}
        displayDataTypes={false}
        displayObjectSize={true}
        indentWidth={4}
        collapseStringsAfterLength={80}
        name={null} // Don't show root name
        onEdit={false}
        onAdd={false}
        onDelete={false}
      />
    </div>
  );
};

const ResponseViewer = ({
  data,
  error,
  isLoading,
  lastRequest,
}: {
  data: any;
  error: any;
  isLoading: boolean;
  lastRequest?: { url: string; params: any };
}) => {
  return (
    <div className="mt-6 space-y-4">
      {lastRequest && !isLoading && (
        <RequestPreview
          method="GET"
          url={lastRequest.url}
          params={lastRequest.params}
        />
      )}

      <div className="rounded-xl border bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-sm overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-4 py-2 border-b bg-zinc-100/50 dark:bg-zinc-800/50">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Resposta da API
          </span>
          <div className="flex items-center gap-2">
            {isLoading && (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            )}
            {!isLoading && data && (
              <Badge
                variant="outline"
                className="text-[10px] bg-green-500/10 text-green-600 border-green-200"
              >
                Sucesso
              </Badge>
            )}
            {!isLoading && error && (
              <Badge
                variant="outline"
                className="text-[10px] bg-red-500/10 text-red-600 border-red-200"
              >
                Erro
              </Badge>
            )}
          </div>
        </div>

        <div className="relative min-h-[200px]">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin opacity-20" />
                <span className="text-xs">Processando requisição...</span>
              </div>
            </div>
          ) : error ? (
            <div className="p-4 text-red-500 font-mono text-xs whitespace-pre-wrap">
              {error.message || JSON.stringify(error, null, 2)}
            </div>
          ) : data ? (
            <div className="bg-white dark:bg-[#1d1f21] overflow-hidden">
              <InteractiveJsonViewer data={data} />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground opacity-50 text-xs">
              Aguardando execução...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const OperationDetails = ({ info }: { info: OperationInfo }) => {
  return (
    <div className="space-y-4 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border text-sm">
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <h4 className="font-medium text-foreground">{info.title}</h4>
          <p className="text-muted-foreground">{info.description}</p>
        </div>
      </div>

      {info.params.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Parâmetros
          </h5>
          <ul className="space-y-2">
            {info.params.map((param) => (
              <li
                key={param.name}
                className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs"
              >
                <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border font-mono text-blue-600 dark:text-blue-400">
                  {param.name}
                </code>
                <span className="text-muted-foreground hidden sm:inline">
                  -
                </span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  {param.description}
                  {param.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="space-y-2">
          <Label className="text-[10px] uppercase text-muted-foreground">
            Exemplo Request (JSON)
          </Label>
          <CodeBlock
            code={JSON.stringify(info.exampleRequest, null, 2)}
            title="Payload"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] uppercase text-muted-foreground">
            Exemplo Response (JSON)
          </Label>
          <CodeBlock
            code={JSON.stringify(info.exampleResponse, null, 2)}
            title="Response"
          />
        </div>
      </div>
    </div>
  );
};

// --- LinkedIn Playground ---
const LinkedinPlayground = () => {
  const [mode, setMode] = useState<OperationMode>("account");
  const [identifier, setIdentifier] = useState("");
  const [field, setField] = useState("profile");
  const [query, setQuery] = useState("");
  const [postUrl, setPostUrl] = useState("");
  const [lastRequest, setLastRequest] = useState<
    { url: string; params: any } | undefined
  >(undefined);

  const endpoints = {
    account: "/api/linkedin/account",
    contact: "/api/linkedin/account/contact",
    company: "/api/linkedin/company",
    search: "/api/linkedin/search",
    comments: "/api/linkedin/posts/comments",
    posts: "", // Deprecated/Removed from UI
  };

  const { trigger, data, error, isMutating } = useSWRMutation(
    endpoints[mode],
    fetcher
  );

  const handleExecute = () => {
    const args: Record<string, any> = {};

    if (mode === "account") {
      if (!identifier) return;
      args.identifier = identifier;
      if (field !== "profile") args.field = field;
    } else if (mode === "contact") {
      if (!identifier) return;
      args.identifier = identifier;
    } else if (mode === "company") {
      if (!identifier) return;
      args.identifier = identifier;
    } else if (mode === "search") {
      if (!query) return;
      args.q = query;
      args.field = "people";
    } else if (mode === "comments") {
      if (!postUrl) return;
      args.url = postUrl;
    }

    setLastRequest({ url: endpoints[mode], params: args });
    trigger(args);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleExecute();
    }
  };

  const info = LINKEDIN_OPERATIONS[mode];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="space-y-4 p-4 rounded-xl border bg-card shadow-sm">
            <div className="space-y-2">
              <Label>Operação</Label>
              <Select value={mode} onValueChange={(v: any) => setMode(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a operação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="account">Perfil Pessoal</SelectItem>
                  <SelectItem value="contact">Contato</SelectItem>
                  <SelectItem value="company">Empresa</SelectItem>
                  <SelectItem value="search">Pesquisa</SelectItem>
                  <SelectItem value="comments">Comentários (Post)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                {(mode === "account" ||
                  mode === "contact" ||
                  mode === "company") && (
                  <div className="space-y-2">
                    <Label>Identificador (Username/URN)</Label>
                    <Input
                      placeholder={
                        mode === "company" ? "ex: google" : "ex: billgates"
                      }
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                  </div>
                )}

                {mode === "account" && (
                  <div className="space-y-2">
                    <Label>Campo Específico</Label>
                    <Select value={field} onValueChange={setField}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="profile">Perfil Completo</SelectItem>
                        <SelectItem value="experiences">
                          Experiências
                        </SelectItem>
                        <SelectItem value="skills">Habilidades</SelectItem>
                        <SelectItem value="education">Educação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {mode === "search" && (
                  <div className="space-y-2">
                    <Label>Termo de Busca</Label>
                    <Input
                      placeholder="ex: Software Engineer at Google"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                  </div>
                )}

                {mode === "comments" && (
                  <div className="space-y-2">
                    <Label>URL do Post</Label>
                    <Input
                      placeholder="ex: https://www.linkedin.com/posts/..."
                      value={postUrl}
                      onChange={(e) => setPostUrl(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <Button
              className="w-full"
              onClick={handleExecute}
              disabled={isMutating}
            >
              {isMutating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ChevronRight className="mr-2 h-4 w-4" />
              )}
              Executar Requisição
            </Button>
          </div>

          <div className="hidden lg:block">
            <OperationDetails info={info} />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="lg:hidden">
            <OperationDetails info={info} />
          </div>
          <ResponseViewer
            data={data}
            error={error}
            isLoading={isMutating}
            lastRequest={lastRequest}
          />
        </div>
      </div>
    </div>
  );
};

// --- Instagram Playground ---
const InstagramPlayground = () => {
  const [url, setUrl] = useState("");
  const [lastRequest, setLastRequest] = useState<
    { url: string; params: any } | undefined
  >(undefined);

  const { trigger, data, error, isMutating } = useSWRMutation(
    "/api/instagram/download",
    fetcher
  );

  const handleExecute = () => {
    if (!url) return;
    setLastRequest({ url: "/api/instagram/download", params: { url } });
    trigger({ url });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleExecute();
  };

  const info: OperationInfo = {
    title: "Download de Mídia",
    description:
      "Extrai links de vídeo/imagem e metadados de posts públicos do Instagram (Reels, Posts, TV).",
    params: [
      {
        name: "url",
        type: "string",
        required: true,
        description: "URL completa do post",
      },
    ],
    exampleRequest: { url: "https://www.instagram.com/p/C..." },
    exampleResponse: {
      success: true,
      data: {
        shortcode: "C...",
        videoUrl: "https://scontent...",
        caption: "Awesome post!",
      },
    },
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="space-y-4 p-4 rounded-xl border bg-card shadow-sm">
            <div className="space-y-2">
              <Label>URL do Post/Reel</Label>
              <Input
                placeholder="https://www.instagram.com/p/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <p className="text-[10px] text-muted-foreground">
                Apenas contas públicas são suportadas.
              </p>
            </div>
            <Button
              className="w-full"
              onClick={handleExecute}
              disabled={isMutating}
            >
              {isMutating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ChevronRight className="mr-2 h-4 w-4" />
              )}
              Baixar Mídia
            </Button>
          </div>
          <div className="hidden lg:block">
            <OperationDetails info={info} />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="lg:hidden">
            <OperationDetails info={info} />
          </div>
          <ResponseViewer
            data={data}
            error={error}
            isLoading={isMutating}
            lastRequest={lastRequest}
          />
        </div>
      </div>
    </div>
  );
};

// --- Browser Playground ---
const BrowserPlayground = () => {
  const { trigger, data, error, isMutating } = useSWRMutation(
    "/api/browser",
    fetcher
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-dashed shadow-none bg-zinc-50/50">
            <CardContent className="pt-6 flex flex-col items-center justify-center text-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <Globe className="h-6 w-6 text-blue-600" />
              </div>
              <div className="space-y-1">
                <h3 className="font-medium">Gerenciador de Sessão</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Inicializa ou verifica o status do navegador headless. Use
                  isso para garantir que os cookies do LinkedIn estão válidos.
                </p>
              </div>
              <Button
                onClick={() => trigger({})}
                variant="outline"
                disabled={isMutating}
                className="w-full"
              >
                {isMutating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Verificar & Inicializar
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <ResponseViewer data={data} error={error} isLoading={isMutating} />
        </div>
      </div>
    </div>
  );
};

export default function PlaygroundPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
            <Terminal className="h-8 w-8 text-zinc-800 dark:text-zinc-200" />
            API Playground
          </h1>
          <p className="text-muted-foreground text-lg font-light">
            Teste e valide a extração de dados em tempo real.
          </p>
        </div>

        <Tabs defaultValue="linkedin" className="space-y-6">
          <TabsList className="bg-zinc-100/80 dark:bg-zinc-900/80 p-1 rounded-lg backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 w-full sm:w-auto overflow-x-auto flex justify-start">
            <TabsTrigger
              value="linkedin"
              className="rounded-md flex-1 sm:flex-none data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300"
            >
              <Linkedin className="mr-2 h-4 w-4" />
              LinkedIn
            </TabsTrigger>
            <TabsTrigger
              value="instagram"
              className="rounded-md flex-1 sm:flex-none data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300"
            >
              <Instagram className="mr-2 h-4 w-4" />
              Instagram
            </TabsTrigger>
            <TabsTrigger
              value="browser"
              className="rounded-md flex-1 sm:flex-none data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300"
            >
              <Globe className="mr-2 h-4 w-4" />
              Browser
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="linkedin" asChild>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-0 shadow-xl shadow-zinc-200/50 dark:shadow-none ring-1 ring-zinc-200 dark:ring-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 bg-blue-600 rounded-lg text-white">
                        <Linkedin className="h-5 w-5" />
                      </div>
                      Extração LinkedIn
                    </CardTitle>
                    <CardDescription>
                      Acesse perfis públicos, dados de empresas e resultados de
                      busca via automação.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LinkedinPlayground />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="instagram" asChild>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-0 shadow-xl shadow-zinc-200/50 dark:shadow-none ring-1 ring-zinc-200 dark:ring-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-orange-500 rounded-lg text-white">
                        <Instagram className="h-5 w-5" />
                      </div>
                      Instagram Downloader
                    </CardTitle>
                    <CardDescription>
                      Obtenha links de mídia e metadados de Posts e Reels.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <InstagramPlayground />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="browser" asChild>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-0 shadow-xl shadow-zinc-200/50 dark:shadow-none ring-1 ring-zinc-200 dark:ring-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 bg-emerald-600 rounded-lg text-white">
                        <Globe className="h-5 w-5" />
                      </div>
                      Status do Sistema
                    </CardTitle>
                    <CardDescription>
                      Monitore e gerencie a instância do navegador headless.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <BrowserPlayground />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </div>
    </div>
  );
}
