# Kutaramabuku

Aplicacao web para criacao, edicao, publicacao e descoberta de ebooks, com editor rico de capitulos, templates de capa, autenticacao e exportacao em PDF e DOCX.

## Visao Geral Tecnica

### Front-end
- Linguagens:
  - TypeScript
  - CSS
  - HTML
- Framework principal:
  - React 18
- Build tool / bundler:
  - Vite 5
- Routing:
  - React Router DOM
- UI e design system:
  - Tailwind CSS
  - shadcn/ui
  - Radix UI
  - Lucide React
  - Sonner
  - Vaul
- Estado e data fetching:
  - TanStack React Query
- Formularios e validacao:
  - React Hook Form
  - Zod
  - Hookform Resolvers
- Editor rico:
  - TipTap
  - CKEditor 5
- Drag and drop / layout:
  - @hello-pangea/dnd
  - react-resizable-panels
- Graficos e componentes auxiliares:
  - Recharts
  - Embla Carousel
  - react-day-picker

### Backend / BaaS
- Plataforma principal:
  - Supabase
- Servicos usados:
  - Supabase Auth
  - Supabase Database
  - Supabase Storage
  - Supabase Edge Functions
- Edge Function identificada no projeto:
  - `parse-ebook`

### Base de Dados
- Linguagem:
  - SQL
- Motor:
  - PostgreSQL via Supabase
- Migracoes versionadas:
  - `supabase/migrations/*.sql`

### Exportacao de documentos e media
- PDF:
  - jsPDF
  - html2canvas
- DOCX:
  - docx
- Download de arquivos:
  - file-saver
- Sanitizacao HTML:
  - DOMPurify

### Ferramentas de desenvolvimento
- Node.js
- npm
- TypeScript compiler
- ESLint
- PostCSS
- Autoprefixer
- Vercel

## Dominios e Ambientes

### Desenvolvimento local
- URL padrao do Vite:
  - `http://localhost:8080`

### Deploy web
- Deploy SPA configurado para Vercel:
  - [vercel.json](C:\Users\unlps\MyProjects\kutaramabuku-app\vercel.json)
- Dominio publico em uso no projeto:
  - `https://kutaramabuku.vercel.app`

### Supabase
- Project ref configurado:
  - `tshpbhaxukrxzhtjbrpu`
- Config:
  - [supabase/config.toml](C:\Users\unlps\MyProjects\kutaramabuku-app\supabase\config.toml)

## Variaveis de Ambiente

Crie um arquivo `.env` na raiz com:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_APP_URL=http://localhost:8080
```

Referencia:
- [src/integrations/supabase/client.ts](C:\Users\unlps\MyProjects\kutaramabuku-app\src\integrations\supabase\client.ts)
- [src/pages/Auth.tsx](C:\Users\unlps\MyProjects\kutaramabuku-app\src\pages\Auth.tsx)

## Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
npm run lint
```

## Estrutura Principal

```text
src/
  components/
    Editor/
    templates/
    ui/
  hooks/
  integrations/
    supabase/
  pages/
  lib/
  services/

public/
supabase/
  functions/
  migrations/
```

## Paginas Principais

- `Index`
- `Auth`
- `Dashboard`
- `Discover`
- `CreateEbook`
- `Editor`
- `BookDetails`
- `MyBooks`
- `Notifications`
- `Account`
- `Settings`

## Funcionalidades Principais

- autenticacao por email/password e OAuth com Google
- criacao e edicao de ebooks
- editor rico de capitulos
- selecao de templates de capa
- upload de imagem de capa
- armazenamento de arquivos no Supabase Storage
- publicacao publica/privada
- descoberta de livros publicos
- wishlist, reviews e notificacoes
- exportacao de ebooks em PDF e DOCX
- parse de ebook via Edge Function

## Comandos de Base de Dados

Para trabalhar com o Supabase local/remoto:

```bash
supabase link --project-ref tshpbhaxukrxzhtjbrpu
supabase db push
```

As migracoes ficam em:
- [supabase/migrations](C:\Users\unlps\MyProjects\kutaramabuku-app\supabase\migrations)

## Deploy

### Build local

```bash
npm run build
```

### Vercel

- O projeto esta configurado como SPA.
- Todas as rotas sao reescritas para `index.html`.
- Depois de atualizar variaveis de ambiente na Vercel, faca redeploy.

## Observacoes

- O cliente Supabase esta configurado com `persistSession: true`, `autoRefreshToken: true` e `localStorage`.
- O favicon em uso pode ser ajustado a partir de `public/`, incluindo:
  - `kutarafavicon.png`
  - `favicon.ico`

## Arquivos de Configuracao Relevantes

- [package.json](C:\Users\unlps\MyProjects\kutaramabuku-app\package.json)
- [vite.config.ts](C:\Users\unlps\MyProjects\kutaramabuku-app\vite.config.ts)
- [tailwind.config.ts](C:\Users\unlps\MyProjects\kutaramabuku-app\tailwind.config.ts)
- [postcss.config.js](C:\Users\unlps\MyProjects\kutaramabuku-app\postcss.config.js)
- [eslint.config.js](C:\Users\unlps\MyProjects\kutaramabuku-app\eslint.config.js)
- [vercel.json](C:\Users\unlps\MyProjects\kutaramabuku-app\vercel.json)
- [supabase/config.toml](C:\Users\unlps\MyProjects\kutaramabuku-app\supabase\config.toml)
