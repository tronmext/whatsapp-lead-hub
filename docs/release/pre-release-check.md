# Pre-release Check (Local + D1 Remoto)

Este projeto usa estratégia híbrida para entregar rápido sem perder segurança de release:

1. Desenvolvimento diário em D1 local (Miniflare / `.wrangler/state/...sqlite`).
2. Validação pré-release em D1 remoto (staging) antes de deploy.

## Script

- Script: `scripts/pre-release-check.sh`
- Comando rápido:

```bash
npm run pre-release:check
```

- Comando completo (inclui lint):

```bash
npm run pre-release:check:full
```

## O que o script valida

1. Build local do projeto (`npm run build`).
2. Conectividade com D1 remoto via `wrangler d1 execute --remote`.
3. Presença de tabelas essenciais (`contacts`, `messages`, `instances`).
4. Persistência de contato (status + metadata) no D1 remoto.
5. Persistência de mensagem e leitura no D1 remoto.
6. Cleanup automático dos registros de teste ao final.

## Variáveis opcionais

- `D1_DATABASE_NAME` (default: `ggailabs-leadflow`)
- `RUN_BUILD` (default: `1`)
- `RUN_LINT` (default: `0`)
- `TEST_INSTANCE_ID` (default: `pre-release-instance`)

Exemplo:

```bash
D1_DATABASE_NAME=ggailabs-leadflow TEST_INSTANCE_ID=65996419667 npm run pre-release:check
```

## Pré-requisitos

1. Estar autenticado no Cloudflare Wrangler.
2. Ter acesso ao banco D1 remoto de staging.
3. Estar com dependências instaladas (`npm install`).

## Fluxo recomendado para liberar rápido

1. Implementar e validar no ambiente local (D1 local).
2. Rodar `npm run pre-release:check`.
3. Se passar, validar manualmente no staging UI:
   - abrir contato novo e confirmar badge/tag `Novo`;
   - editar briefing/tags/notas e recarregar tela;
   - abrir conversa e confirmar persistência.
4. Deploy.
