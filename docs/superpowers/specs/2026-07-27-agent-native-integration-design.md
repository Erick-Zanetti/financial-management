# Agente de IA — integração do padrão agent-native na stack atual

**Data:** 2026-07-27
**Status:** aprovado por Erick
**Página visual:** https://claude.ai/code/artifact/b5204fec-55d9-4121-8a19-b65b78bc12b0

## Contexto

O app está funcionalmente completo, mas não foi desenhado para acoplar um agente de IA.
O framework [BuilderIO/agent-native](https://github.com/BuilderIO/agent-native) tem a ideia
certa — **Actions definidas uma vez servindo todas as superfícies** (UI, agente, HTTP, MCP,
CLI) — porém sua stack é opinativa (Nitro + Drizzle/SQL, greenfield-first) e incompatível
com Express + Mongoose + MongoDB sem reescrever a fundação.

**Decisão: adotar o padrão, não o framework** (abordagem A). Uma camada de actions sobre os
services existentes alimenta o agente de chat e o endpoint MCP. Zero migração de banco/host.

## Decisões de produto

| Decisão | Escolha |
|---|---|
| Papel do agente | Consultar/analisar + executar ações + MCP. Sem automações em background (v1). |
| Superfície UI | Painel global de chat (botão flutuante em todas as telas, contexto da tela atual). |
| LLM | OpenRouter, reusando o token do system-config (mesmo da classificação de faturas). |
| Escritas | Sempre com confirmação: preview no chat + Aprovar/Rejeitar antes de gravar. |
| Histórico | Cliente (localStorage), servidor stateless. Nenhuma collection nova. |

## Arquitetura

```
client (Next.js)                      server-node (Express)
├─ Telas atuais ──────── REST ──────► controllers/services (intactos)
└─ AgentPanel ── POST /agent/chat ──► agent runtime (loop tool-calling, SSE)
                                          │
Claude (tailnet) ── POST /mcp ──────► Action Registry ──► services ──► MongoDB
```

### Camada de actions (`server-node/src/actions/`)

Contrato (espelho do `defineAction` do agent-native):

```ts
interface AppAction<TInput> {
  name: string;
  description: string;
  mode: 'read' | 'write';        // write ⇒ exige confirmação no chat
  inputSchema: ZodSchema<TInput>; // reusa validators existentes quando possível
  run(input: TInput): Promise<unknown>;
}
```

- `registry.ts`: registro único; `executeAction(name, input)` valida com Zod **antes** de
  rodar (agente e MCP passam pelo mesmo funil do REST); `toOpenAiTools()` gera os JSON
  Schemas via `zod-to-json-schema`.
- Erros de action (ZodError ou AppError) viram tool_result de erro — nunca derrubam o stream.

### Catálogo v1

| Action | Modo | Entrada | Reusa |
|---|---|---|---|
| `list_releases` | read | year, month, type? | findByTypeAndMonthAndYear |
| `search_releases` | read | texto, período? | método novo pequeno no service |
| `get_release` | read | id | findById |
| `list_categories` | read | — | categoryService.findAll |
| `get_dashboard_summary` | read | período from/to | getDashboardSummarySegmented |
| `create_release` | write | createFinancialReleaseSchema | create (+ auto-link parents) |
| `update_release` | write | id + update parcial | update |
| `delete_release` | write | id | delete |

Categorias: o agente só lê na v1; escrita de categorias = actions futuras no mesmo registro.

### Runtime do agente (`server-node/src/services/agent/`)

- `POST /agent/chat` (SSE). Entrada: histórico completo de mensagens + contexto de tela
  (rota, mês/ano selecionados) + aprovação pendente, se houver.
- Loop de tool-calling contra OpenRouter (API OpenAI-compatível), modelo do campo novo
  `agentModel` no system-config, token existente `openRouterToken`.
- Actions **read** executam direto durante o loop (evento `tool_start`/`tool_result`).
- Actions **write**: o loop PARA, emite `confirmation_request` com o tool_call + preview;
  o cliente reenvia o histórico com a decisão. Aprovado ⇒ executa e continua o loop;
  rejeitado ⇒ tool_result "usuário rejeitou" e o modelo responde de acordo.
- Eventos SSE: `token`, `tool_start`, `tool_result`, `confirmation_request`, `done`, `error`.
- Limite: máx. 10 iterações de tools por turno.
- System prompt inclui contexto de tela ("o usuário está vendo lançamentos de 07/2026")
  e a data atual.

### MCP (`routes/mcp.routes.ts`)

- `POST /mcp` no próprio Express via `@modelcontextprotocol/sdk` (Streamable HTTP).
- Tools geradas do mesmo registry. Escritas via MCP executam direto — a confirmação é do
  próprio client MCP (Claude pede aprovação antes de chamar a tool).
- Segurança: app sem auth, exposto só na tailnet — o MCP tem a mesma exposição do REST
  atual; nada novo se abre.

### Cliente (`client/src/components/agent/` + `hooks/use-agent-chat.ts`)

- Botão flutuante (canto inferior direito, todas as telas) abre sheet lateral de chat.
- Mensagens em markdown; chips de atividade de tools; card de confirmação de escrita com
  os campos do lançamento + Aprovar/Rejeitar.
- `use-agent-chat`: consumo do SSE, estado das mensagens, persistência em localStorage,
  botão de limpar conversa.
- Contexto de tela publicado por um provider leve (rota + mês/ano correntes).
- `/configuracoes`: campo "Modelo do agente" (agentModel).

## O que NÃO muda

MongoDB/Mongoose (modelos, migrações no boot), Express/REST/controllers, toda a UI atual,
pipeline "Fill with AI", deploy docker compose.

## Dependências novas

`@modelcontextprotocol/sdk`, `zod-to-json-schema` (server). Nenhuma no cliente.

## Fases (cada uma deployável)

1. Camada de actions + registry + testes (invisível ao usuário).
2. Runtime do agente + `/agent/chat` + painel de chat somente-leitura.
3. Actions de escrita + fluxo de confirmação.
4. Endpoint MCP + conexão com o Claude.

## Erros e testes

- OpenRouter indisponível/sem token ⇒ evento `error` amigável no chat, retry manual.
- Testes: unit do registry (validação, execução, geração de tools), unit por action
  (services mockados), integração do loop com OpenRouter mockado. Gate atual obrigatório
  (tsc server; lint + build client). Cobertura alvo 80%+ na camada nova.
