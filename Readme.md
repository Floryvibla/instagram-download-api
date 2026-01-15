# Alúlu — Guia de Uso (LinkedIn, Instagram, Browser)

## Visão Geral

- API em Next.js (App Router) para dados do LinkedIn, download do Instagram e automação de login via Browser.
- Rotas REST locais em http://localhost:3000.

## Requisitos

- Node 18+ e yarn.
- Acesso local a http://localhost:3000.

## Executar Localmente

- Instalar deps: `yarn`
- Development: `yarn dev`
- Produção: `yarn build && yarn start`

## Autenticação e Sessão (LinkedIn)

- As chamadas ao LinkedIn usam cookies `li_at` e `JSESSIONID` salvos em `linkedin_cookies.json`.
- Se os cookies estiverem inválidos, a API tenta efetuar login automático via Puppeteer e atualiza os cookies.
- Dica: acione a rota `/api/browser` para semear/validar sessão antes de consultar dados.

## Endpoints — LinkedIn

- `GET /api/linkedin/account?identifier=<username>&field=profile`
- `GET /api/linkedin/account/contact?identifier=<username>`
- `GET /api/linkedin/account/experiences?identifier=<username>`
- `GET /api/linkedin/company?identifier=<company-username>`
- `GET /api/linkedin/search?q=<termo>&field=people&offset=0&limit=10`
- `GET /api/linkedin/posts` (retorna lista vazia no estado atual)
- `GET /api/linkedin/posts/comments?url=<post-url>&start=0&limit=50`
- `GET /api/linkedin/account/<username>/<field>` com `field` em: `profile|contact|experiences|company|skills|education|certifications`

## Endpoints — Instagram

- `GET /api/instagram/download?url=<post-ou-reel-url>`
- Tenta extrair pela página pública; se falhar, usa GraphQL oficial para metadados/mídias.

## Endpoints — Browser

- `GET /api/browser`
- Executa automação do LinkedIn (login, navegação básica, valida sessão, encerra).

## Exemplos (curl)

```bash
# Semear sessão do LinkedIn
curl "http://localhost:3000/api/browser"

# Perfil (LinkedIn)
curl "http://localhost:3000/api/linkedin/account?identifier=flory&field=profile"

# Contato (LinkedIn)
curl "http://localhost:3000/api/linkedin/account/contact?identifier=flory"

# Experiências (LinkedIn)
curl "http://localhost:3000/api/linkedin/account/experiences?identifier=flory"

# Empresa (LinkedIn)
curl "http://localhost:3000/api/linkedin/company?identifier=vercel"

# Busca de pessoas (LinkedIn)
curl "http://localhost:3000/api/linkedin/search?q=flory&field=people&limit=10"

# Comentários de um post (LinkedIn)
curl "http://localhost:3000/api/linkedin/posts/comments?url=https://www.linkedin.com/posts/xxxx&start=0&limit=50"

# Download Instagram (post/reel)
curl "http://localhost:3000/api/instagram/download?url=https://www.instagram.com/p/POST_ID/"
```

## Respostas — Campos Principais

- Perfil: `id_urn`, `publicIdentifier`, `fullName`, `headline`, `profilePicture`, `backgroundPicture`.
- Experiências: `title`, `companyName`, `employmentType`, `location`, `duration`, `startDate`, `endDate`, `description`, `company.logo`.
- Contato: `address`, `phoneNumbers[]`, `emailAddress`, `websites[]`.
- Empresa: `name`, `description`, `companyPageUrl`, `staffCount`, `industries`, `logo`.
- Comentários: `id`, `createdAt`, `name`, `headline`, `profileUrl`, `comment`, `permalink`, `image`.
- Instagram: links e metadados de mídia (página ou GraphQL).

## Observações

- Uso destinado a ambiente local/testes; não exponha credenciais/cookies em produção.
- Para respostas completas, mantenha sessão válida do LinkedIn via `/api/browser`.
