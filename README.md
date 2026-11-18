# Controle de Frota

Aplicativo de controle de manutenção da frota: cadastros, lançamentos, histórico com filtros e painel com alertas de preventivas. Funciona no computador e no celular (pode ser instalado na tela inicial).

Não depende mais do Manus. O banco de dados é um arquivo SQLite em `dados/frota.db`, criado sozinho na primeira vez.

## Como rodar no seu computador (Windows)

1. Instale o Node.js 22 ou mais novo: https://nodejs.org
2. Abra o terminal nesta pasta e rode, uma vez: `corepack enable` e depois `pnpm install`
3. Para usar: `pnpm build` e depois `pnpm start`
4. Abra http://localhost:3000 no navegador.

Para desenvolver com recarga automática: `pnpm dev`.

## Configurações (arquivo `.env`, opcional)

| Variável | Para que serve |
|---|---|
| `APP_PASSWORD` | Senha única da equipe. Se não for definida, o app abre sem login (só use assim no seu computador). |
| `SESSION_SECRET` | Texto aleatório longo para assinar o login. |
| `DATABASE_URL` | Onde fica o banco. Padrão `file:./dados/frota.db`. Para um banco na nuvem (Turso), use a URL `libsql://...`. |
| `DATABASE_AUTH_TOKEN` | Token do banco na nuvem (Turso), quando usado. |
| `PORT` | Porta do servidor. Padrão 3000. |

## Comandos

- `pnpm check`: confere os tipos do código.
- `pnpm db:generate`: gera uma nova migração depois de mudar `drizzle/schema.ts`. As migrações rodam sozinhas ao iniciar o app.
