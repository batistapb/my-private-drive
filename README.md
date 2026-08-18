# MyPrivateDrive

Uma nuvem privada pessoal, estilo Google Drive, construída como projeto de estudo full-stack: backend em ASP.NET Core, banco relacional, autenticação própria, frontend em React e deploy containerizado.

## Sobre o projeto

O objetivo é ter um lugar próprio para guardar arquivos, com login, upload/download, organização em pastas — e, no processo, aprender na prática backend, banco de dados, autenticação e infraestrutura com uma stack moderna em .NET.

Funcionalidades:

- Cadastro e login, com JWT (access token) + refresh token e renovação automática
- Upload e download de arquivos, com arrastar-e-soltar direto na página
- Visualização de imagens, PDF e texto direto no site (duplo clique abre um preview, sem precisar baixar)
- Listagem, organização e navegação em pastas (árvore, com breadcrumb, renomear e mover)
- **Organizações** — espaços nomeados com pasta raiz própria, para separar contextos diferentes; pastas existentes podem ser movidas para dentro de uma organização, não só criadas lá
- **Mapa** — vista em árvore expansível/colapsável da estrutura de pastas de uma organização
- **Lixeira** — exclusão de arquivo/pasta é reversível (pasta exclui em cascata todo o conteúdo), com restauração e expiração automática após 30 dias
- **Favoritos** — marcar arquivos/pastas com estrela e ver tudo numa página só
- **Busca** — por nome de arquivo/pasta, case-insensitive, com o caminho de cada resultado
- **Log de atividade** — histórico paginado de login, upload, download, exclusão, renomeação e troca de senha
- **Rate limiting** — limite de tentativas de login/cadastro e limite geral nos demais endpoints
- Edição de perfil, troca de senha (com campo de mostrar/ocultar) e exclusão de conta
- Tema claro/escuro (padrão escuro), com preferência salva no navegador
- Interface própria com sistema de design consistente (paleta, cartões com ícone, avatares) em toda a aplicação

## Arquitetura

O backend segue uma Clean Architecture simplificada, em 4 camadas:

```
MyPrivateDrive.Api             → Controllers, autenticação, rate limiting, background services, ponto de entrada HTTP
MyPrivateDrive.Application      → DTOs, interfaces, configurações (sem dependência de framework/banco)
MyPrivateDrive.Domain           → Entidades (User, FileItem, Folder, RefreshToken, Organization, ActivityLog)
MyPrivateDrive.Infrastructure   → EF Core, PostgreSQL, geração de tokens JWT, hashing, log de atividade
```

Regra de dependência: `Domain` não depende de nada; `Application` depende só do `Domain`; `Infrastructure` implementa o que `Application`/`Domain` definem; `Api` conhece todas as camadas para fazer a injeção de dependência. A maior parte da lógica fica direto nos Controllers (sem camada de repositório), exceto o log de atividade — `IActivityLogger` fica em `Application`, `ActivityLogger` (implementação) em `Infrastructure`.

```
myprivatedrive-web/             → Frontend React + Vite (SPA)
```

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | ASP.NET Core 9 Web API (C#) |
| Banco de dados | PostgreSQL 16 |
| ORM | Entity Framework Core (com global query filter para soft-delete) |
| Autenticação | JWT (access token) + Refresh Token, senhas com BCrypt |
| Rate limiting | `Microsoft.AspNetCore.RateLimiting` (nativo do ASP.NET Core) |
| Frontend | React 19 + Vite, Tailwind CSS v4, react-router-dom, axios |
| Proxy / servidor web | Nginx |
| Containerização | Docker + Docker Compose |

## Estrutura do repositório

```
MyPrivateDrive.sln
MyPrivateDrive.Api/             # Web API — Controllers, Program.cs, BackgroundServices, Dockerfile
MyPrivateDrive.Application/     # DTOs e interfaces (Auth, Users, Files, Folders, Organizations, Trash, Favorites, Search, Activity)
MyPrivateDrive.Domain/          # Entidades
MyPrivateDrive.Infrastructure/  # DbContext, migrations, TokenService, ActivityLogger
myprivatedrive-web/             # Frontend React + Vite, Dockerfile, nginx.conf
docker-compose.yml              # api + db + nginx
```

## Como rodar

### Opção 1 — Docker Compose (recomendado)

Sobe API, PostgreSQL e o frontend (servido via Nginx) juntos, com migrations aplicadas automaticamente no start da API.

Antes do primeiro `up`, crie o arquivo de segredo do JWT (não é versionado):

```bash
cp .env.example .env
# edite .env e defina JWT_SECRET com um valor aleatório, ex.:
openssl rand -base64 48
```

```bash
docker compose up --build
```

Acesse **http://localhost:8081**.

Para derrubar tudo: `docker compose down` (os dados do banco e os arquivos enviados ficam guardados nos volumes `pgdata` e `storage_data`; use `docker compose down -v` para apagá-los também).

### Opção 2 — Ambiente de desenvolvimento local

Útil para rodar o backend e o frontend com hot-reload durante o desenvolvimento.

**Pré-requisitos:** .NET 9 SDK, Node.js 20+, Docker (para o Postgres).

1. Subir um PostgreSQL local:
   ```bash
   docker run -d --name myprivatedrive-postgres \
     -e POSTGRES_DB=myprivatedrive \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=postgres \
     -p 5432:5432 \
     postgres:16
   ```

2. Definir o segredo do JWT em `MyPrivateDrive.Api/appsettings.Development.json` (não é versionado — veja a seção [Configuração](#configuração)), depois rodar a API (aplica as migrations automaticamente no startup):
   ```bash
   cd MyPrivateDrive.Api
   dotnet run
   ```
   API disponível em `http://localhost:5261` (ou a porta definida em `Properties/launchSettings.json`).

3. Rodar o frontend:
   ```bash
   cd myprivatedrive-web
   npm install
   npm run dev
   ```
   Frontend em `http://localhost:5173`, já configurado (CORS + `VITE_API_URL`) para conversar com a API local.

## Endpoints da API

| Método | Rota | Autenticado | Descrição |
|---|---|---|---|
| POST | `/api/auth/register` | não | Cria conta e retorna tokens |
| POST | `/api/auth/login` | não | Autentica e retorna tokens |
| POST | `/api/auth/refresh` | não | Troca um refresh token válido por um novo par |
| GET | `/api/users/me` | sim | Dados do usuário logado |
| PUT | `/api/users/me` | sim | Atualiza e-mail |
| PUT | `/api/users/me/password` | sim | Troca a senha (exige a senha atual) |
| DELETE | `/api/users/me` | sim | Exclui a conta |
| POST | `/api/files/upload` | sim | Upload de arquivo (`multipart/form-data`, `folderId` opcional) |
| GET | `/api/files/{id}/download` | sim | Download de um arquivo |
| GET | `/api/files/{id}/preview` | sim | Visualiza o arquivo inline — imagens, PDF, texto (415 para outros tipos) |
| DELETE | `/api/files/{id}` | sim | Move o arquivo para a lixeira |
| PUT | `/api/files/{id}/favorite` | sim | Alterna favorito |
| GET | `/api/folders` | sim | Lista conteúdo da raiz ("Meus Arquivos") |
| GET | `/api/folders/{id}` | sim | Lista conteúdo de uma pasta |
| POST | `/api/folders` | sim | Cria pasta |
| PUT | `/api/folders/{id}` | sim | Renomeia e/ou move (`moveToRoot: true` para mover à raiz; move para dentro de uma organização atualiza a organização em cascata) |
| DELETE | `/api/folders/{id}` | sim | Move a pasta (e todo o conteúdo) para a lixeira |
| PUT | `/api/folders/{id}/favorite` | sim | Alterna favorito |
| GET | `/api/organizations` | sim | Lista as organizações do usuário |
| GET | `/api/organizations/{id}` | sim | Detalhes de uma organização |
| POST | `/api/organizations` | sim | Cria organização (e a pasta raiz, na mesma operação) |
| GET | `/api/organizations/{id}/map` | sim | Árvore de pastas da organização |
| DELETE | `/api/organizations/{id}` | sim | Exclui a organização (bloqueado se a pasta raiz não estiver vazia) |
| GET | `/api/trash` | sim | Lista itens na lixeira (só o item excluído originalmente, não cada descendente) |
| POST | `/api/trash/{id}/restore` | sim | Restaura um item (e sua subárvore, se for pasta) |
| DELETE | `/api/trash/{id}/permanent` | sim | Exclui definitivamente |
| GET | `/api/favorites` | sim | Lista tudo que está marcado com estrela |
| GET | `/api/search?q=` | sim | Busca por nome (case-insensitive) em arquivos e pastas |
| GET | `/api/activity?page=&pageSize=` | sim | Histórico paginado de atividade da conta |

Endpoints autenticados esperam o header `Authorization: Bearer <accessToken>`. Os endpoints de `/api/auth` têm limite de 5 requisições/minuto; os demais, 100/minuto (limite global do servidor, não por IP). O arquivo `MyPrivateDrive.Api/MyPrivateDrive.Api.http` tem exemplos prontos para testar direto no VS Code (extensão REST Client).

## Configuração

As chaves relevantes ficam em `MyPrivateDrive.Api/appsettings.json`:

- `ConnectionStrings:Default` — string de conexão com o PostgreSQL
- `Jwt:Secret`, `Jwt:Issuer`, `Jwt:Audience`, `Jwt:AccessTokenMinutes`, `Jwt:RefreshTokenDays`
- `Storage:Root`, `Storage:MaxSizeBytes` — pasta e limite de tamanho para os arquivos enviados

`Jwt:Secret` **não é versionado** — o `appsettings.json` traz o campo vazio de propósito. Em Docker Compose ele vem da variável de ambiente `JWT_SECRET` (arquivo `.env`, veja `.env.example`); rodando localmente (`dotnet run`), defina-o em `MyPrivateDrive.Api/appsettings.Development.json` (também não versionado) ou via `dotnet user-secrets`. As credenciais do banco em `docker-compose.yml`/`appsettings.json` (`postgres`/`postgres`) são só para uso local — troque antes de qualquer deploy real.

## Segurança implementada

- Senhas com hash via BCrypt (nunca em texto puro)
- Access token JWT de vida curta (15 min) + refresh token de vida longa, com rotação (o token antigo é revogado a cada uso)
- Segredo de assinatura do JWT fora do controle de versão (variável de ambiente / `dotnet user-secrets`), nunca commitado
- Rate limiting: janela fixa de 5 requisições/minuto em `/api/auth/*` (mitiga força bruta em login/cadastro), 100/minuto nos demais endpoints
- Toda ação sobre "meu" recurso (perfil, arquivos, pastas) usa o ID extraído do token — nunca um ID enviado pelo cliente
- Upload: nome físico do arquivo é sempre um GUID aleatório (evita colisão e *path traversal*), limite de tamanho e bloqueio de extensões perigosas (`.exe`, `.sh`, `.bat`, etc.)
- Acesso a arquivo/pasta de outro usuário retorna `404` (não `403`), para não revelar que o recurso existe
- Exclusão é reversível (soft-delete via *global query filter* do EF Core) — nada some de verdade até a lixeira expirar ou o usuário confirmar a exclusão definitiva
- CORS restrito à origem do frontend em desenvolvimento (`http://localhost:5173`); em produção (Docker Compose), frontend e API são servidos pela mesma origem via Nginx, dispensando CORS

## Como o projeto foi construído

O desenvolvimento seguiu uma ordem incremental, uma camada de cada vez, com testes manuais (via curl/browser) a cada etapa antes de avançar:

1. **Scaffold da solução** — criação dos 4 projetos .NET e das referências entre camadas.
2. **PostgreSQL + EF Core** — entidades de domínio, `AppDbContext`, primeira migration.
3. **Autenticação JWT + Refresh Token** — hash de senha, geração/validação de tokens, rotação de refresh token.
4. **CRUD de usuários** — perfil protegido por `[Authorize]`, sempre resolvendo o usuário pelo claim do token.
5. **Upload/download de arquivos** — armazenamento em disco com nome aleatório, validação de tamanho/extensão.
6. **Gerenciamento de pastas** — estrutura em árvore, prevenção de ciclos ao mover, exclusão bloqueada se não vazia.
7. **Frontend React + Vite** — cliente HTTP centralizado com renovação automática de token, telas de login/cadastro e navegação de arquivos/pastas.
8. **Docker + Docker Compose** — containerização da API e do frontend, proxy reverso via Nginx, migrations automáticas no startup.
9. **Preview de arquivos e imagens** — endpoint dedicado que serve o arquivo inline (em vez de forçar download), com um modal no frontend para imagens, PDF e texto.
10. **Aba de Configurações** — dados da conta e troca de senha (exigindo a senha atual).
11. **Tema claro/escuro** — contexto React com preferência persistida no navegador, padrão escuro.
12. **Refinamento visual geral** — adoção do Tailwind CSS, layout com barra lateral, breadcrumb de pastas, notificações toast e estados vazio/carregamento.
13. **Rate limiting** — política restrita nos endpoints de autenticação, política geral nos demais.
14. **Organizações** — entidade com pasta raiz própria, criada na mesma transação que a organização; pastas existentes também podem ser movidas para dentro de uma organização (com atualização em cascata para as subpastas).
15. **Mapa** — árvore de pastas de uma organização, montada em memória a partir de uma única consulta.
16. **Lixeira com restauração** — soft-delete via *global query filter* do EF Core, para não precisar alterar cada consulta existente; exclusão de pasta cascade nas subpastas/arquivos; `BackgroundService` expira itens com mais de 30 dias.
17. **Favoritos** — campo booleano em arquivo/pasta, com página dedicada listando tudo.
18. **Busca** — por nome, case-insensitive (`ILIKE` do PostgreSQL), com o caminho de cada resultado.
19. **Log de atividade** — serviço central (`IActivityLogger`) injetado nos endpoints, histórico paginado na tela de Configurações.
20. **Redesign visual completo** — novo sistema de design (paleta, cartões com ícone, avatares) aplicado a toda a aplicação; fundo animado (WebGL) nas telas de login/cadastro; upload por arrastar-e-soltar.

## Objetivos futuros

Compartilhamento por link, sincronização, cliente desktop, aplicativo mobile, versionamento de arquivos, miniaturas e criptografia em repouso.

## Licença

MIT — veja [LICENSE](LICENSE).
