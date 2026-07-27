# AI Agent Integration (agent-native pattern) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an AI agent to financial-management via an actions layer (agent-native pattern): global chat panel with read tools + confirmed writes, and an MCP endpoint — no stack migration.

**Architecture:** New `server-node/src/actions/` layer (Zod schema + `run()` over existing services) feeds two new surfaces: an SSE chat endpoint with an OpenRouter tool-calling loop, and a stateless MCP Streamable HTTP endpoint. Client gets a floating chat panel (Sheet) with localStorage history; the server is stateless (full history resent per turn).

**Tech Stack:** Express 4, Mongoose 8, Zod 3 (server), Next.js 14 / React 18 (client), OpenRouter (OpenAI-compatible API), `@modelcontextprotocol/sdk`, `zod-to-json-schema`, Vitest (new, server only).

**Spec:** `docs/superpowers/specs/2026-07-27-agent-native-integration-design.md`

## Global Constraints

- Commit direto na `main` (autorizado nesta sessão). Conventional commits (`feat:`, `test:`, `chore:`). **Sem co-author.**
- Gates obrigatórios antes de cada commit de código: `cd server-node && npx tsc --noEmit` (server) / `cd client && npm run lint && npm run build` (client, quando tocado).
- Novos testes de servidor: Vitest; rodar com `cd server-node && npm test`.
- UI strings: sempre em `client/src/lib/translations.ts`, chaves em **pt E en** (en é `Record<keyof typeof pt, string>` — faltar chave quebra o tsc).
- Sem `console.log` — usar `logger` (winston) no server.
- Imutabilidade por padrão; arquivos ≤ 400 linhas (800 máx).
- Nunca logar o documento raw do system-config (contém `openRouterToken` em plaintext).
- Deploy: `docker compose build api-financial-management app-financial-management && docker compose up -d` (na raiz do repo). App: http://100.115.143.64:4200. API na porta 3000 (container `financial-management_api`).
- Modelo LLM: campo novo `agentModel` no system-config; token: campo existente `openRouterToken`.

---

## Fase 1 — Camada de actions

### Task 1: Vitest no server-node

**Files:**
- Modify: `server-node/package.json` (scripts + devDependency)
- Create: `server-node/vitest.config.ts`
- Create: `server-node/src/actions/__tests__/smoke.test.ts` (removido na Task 2, vira teste real)

**Interfaces:**
- Produces: comando `npm test` (vitest run) funcionando em `server-node/`.

- [ ] **Step 1: Instalar e configurar**

```bash
cd server-node && npm install -D vitest
```

`server-node/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
```

Em `package.json`, adicionar aos scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 2: Smoke test**

`server-node/src/actions/__tests__/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('vitest setup', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 3: Rodar**

Run: `cd server-node && npm test` → Expected: 1 passed.

- [ ] **Step 4: Commit**

```bash
git add server-node/package.json server-node/package-lock.json server-node/vitest.config.ts server-node/src/actions/__tests__/smoke.test.ts
git commit -m "chore: add vitest to server-node"
```

### Task 2: Tipos de action + registry

**Files:**
- Create: `server-node/src/actions/action.types.ts`
- Create: `server-node/src/actions/registry.ts`
- Create: `server-node/src/actions/__tests__/registry.test.ts`
- Delete: `server-node/src/actions/__tests__/smoke.test.ts`
- Modify: `server-node/package.json` (dep `zod-to-json-schema`)

**Interfaces:**
- Produces: `defineAction(action)`, `type ActionMode = 'read' | 'write'`, `class ActionRegistry` com `get(name): AppAction | undefined`, `list(): AppAction[]`, `execute(name: string, input: unknown): Promise<unknown>` (valida Zod, lança `AppError` 404/400), `toOpenAiTools(): OpenAiTool[]`.

- [ ] **Step 1: Instalar dep**

```bash
cd server-node && npm install zod-to-json-schema
```

- [ ] **Step 2: Testes que falham**

`server-node/src/actions/__tests__/registry.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { defineAction } from '../action.types';
import { ActionRegistry } from '../registry';
import { AppError } from '../../middlewares/error-handler.middleware';

const echo = defineAction({
  name: 'echo',
  description: 'Echoes input',
  mode: 'read',
  inputSchema: z.object({ text: z.string() }),
  run: async (input) => ({ echoed: input.text }),
});

describe('ActionRegistry', () => {
  it('executes a registered action with valid input', async () => {
    const registry = new ActionRegistry([echo]);
    await expect(registry.execute('echo', { text: 'oi' })).resolves.toEqual({
      echoed: 'oi',
    });
  });

  it('throws AppError 404 for unknown action', async () => {
    const registry = new ActionRegistry([echo]);
    await expect(registry.execute('nope', {})).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('throws AppError 400 for invalid input and does not run', async () => {
    const run = vi.fn();
    const registry = new ActionRegistry([{ ...echo, run }]);
    await expect(registry.execute('echo', { text: 42 })).rejects.toBeInstanceOf(
      AppError,
    );
    expect(run).not.toHaveBeenCalled();
  });

  it('generates OpenAI tool definitions', () => {
    const registry = new ActionRegistry([echo]);
    const tools = registry.toOpenAiTools();
    expect(tools).toHaveLength(1);
    expect(tools[0].type).toBe('function');
    expect(tools[0].function.name).toBe('echo');
    expect(tools[0].function.parameters).toMatchObject({ type: 'object' });
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `cd server-node && npm test` → Expected: FAIL (módulos não existem).

- [ ] **Step 4: Implementar**

`server-node/src/actions/action.types.ts`:

```ts
import { z } from 'zod';

export type ActionMode = 'read' | 'write';

export interface AppAction<S extends z.ZodTypeAny = z.ZodTypeAny> {
  name: string;
  description: string;
  mode: ActionMode;
  inputSchema: S;
  run: (input: z.infer<S>) => Promise<unknown>;
}

export function defineAction<S extends z.ZodTypeAny>(
  action: AppAction<S>,
): AppAction<S> {
  return action;
}
```

`server-node/src/actions/registry.ts`:

```ts
import { zodToJsonSchema } from 'zod-to-json-schema';
import { AppAction } from './action.types';
import { AppError } from '../middlewares/error-handler.middleware';

export interface OpenAiTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export class ActionRegistry {
  private readonly actions: Map<string, AppAction>;

  constructor(actions: AppAction[]) {
    this.actions = new Map(actions.map((a) => [a.name, a]));
  }

  get(name: string): AppAction | undefined {
    return this.actions.get(name);
  }

  list(): AppAction[] {
    return Array.from(this.actions.values());
  }

  async execute(name: string, input: unknown): Promise<unknown> {
    const action = this.get(name);
    if (!action) {
      throw new AppError(404, `Unknown action: ${name}`);
    }
    const parsed = action.inputSchema.safeParse(input);
    if (!parsed.success) {
      const detail = parsed.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ');
      throw new AppError(400, `Invalid input for ${name}: ${detail}`);
    }
    return action.run(parsed.data);
  }

  toOpenAiTools(): OpenAiTool[] {
    return this.list().map((a) => ({
      type: 'function' as const,
      function: {
        name: a.name,
        description: a.description,
        parameters: zodToJsonSchema(a.inputSchema) as Record<string, unknown>,
      },
    }));
  }
}
```

Apagar `smoke.test.ts`.

- [ ] **Step 5: Rodar testes + tsc**

Run: `cd server-node && npm test && npx tsc --noEmit` → Expected: 4 passed, tsc limpo.

- [ ] **Step 6: Commit**

```bash
git add -A server-node/src/actions server-node/package.json server-node/package-lock.json
git commit -m "feat: add action types and registry (agent-native pattern)"
```

### Task 3: Actions de leitura + serializers + searchByName

**Files:**
- Create: `server-node/src/actions/serializers.ts`
- Create: `server-node/src/actions/list-releases.action.ts`
- Create: `server-node/src/actions/search-releases.action.ts`
- Create: `server-node/src/actions/get-release.action.ts`
- Create: `server-node/src/actions/list-categories.action.ts`
- Create: `server-node/src/actions/get-dashboard-summary.action.ts`
- Create: `server-node/src/actions/__tests__/read-actions.test.ts`
- Modify: `server-node/src/services/financial-release.service.ts` (novo método `searchByName`)

**Interfaces:**
- Consumes: `financialReleaseService` (singleton), `categoryService.findAll()`, `financialReleaseService.getDashboardSummarySegmented(filter)`, `dashboardFilterSchema`/`filterByTypeSchema` de `validators/financial-release.validator.ts`.
- Produces: 5 `AppAction`s exportados default; `serializeRelease(doc)`, `serializeCategory(doc)`; `financialReleaseService.searchByName(text: string, year?: number)`.

- [ ] **Step 1: Testes que falham**

`server-node/src/actions/__tests__/read-actions.test.ts` — mockar os services com `vi.mock` (caminhos relativos aos actions):

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../services/financial-release.service', () => ({
  financialReleaseService: {
    findByTypeAndMonthAndYear: vi.fn(),
    findById: vi.fn(),
    searchByName: vi.fn(),
    getDashboardSummarySegmented: vi.fn(),
  },
}));
vi.mock('../../services/category.service', () => ({
  categoryService: { findAll: vi.fn() },
}));

import { financialReleaseService } from '../../services/financial-release.service';
import { categoryService } from '../../services/category.service';
import listReleases from '../list-releases.action';
import getRelease from '../get-release.action';
import searchReleases from '../search-releases.action';
import listCategories from '../list-categories.action';
import getDashboardSummary from '../get-dashboard-summary.action';

const fakeRelease = {
  id: 'r1',
  name: 'Mercado',
  value: 500,
  type: 'E',
  year: 2026,
  month: 7,
  day: 26,
  settled: false,
  category: { name: 'Alimentação' },
  subcategories: [],
};

beforeEach(() => vi.clearAllMocks());

describe('read actions', () => {
  it('list_releases busca R e E quando type é omitido', async () => {
    vi.mocked(financialReleaseService.findByTypeAndMonthAndYear).mockResolvedValue(
      [fakeRelease] as never,
    );
    const result = (await listReleases.run({ year: 2026, month: 7 })) as unknown[];
    expect(financialReleaseService.findByTypeAndMonthAndYear).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(2);
  });

  it('list_releases serializa com nome da categoria e data ISO', async () => {
    vi.mocked(financialReleaseService.findByTypeAndMonthAndYear).mockResolvedValue(
      [fakeRelease] as never,
    );
    const result = (await listReleases.run({
      year: 2026,
      month: 7,
      type: 'E',
    })) as Array<{ category: string | null; date: string }>;
    expect(result[0]).toMatchObject({ category: 'Alimentação', date: '2026-07-26' });
  });

  it('get_release retorna erro amigável quando não encontra', async () => {
    vi.mocked(financialReleaseService.findById).mockResolvedValue(null);
    await expect(
      getRelease.run({ id: 'aaaaaaaaaaaaaaaaaaaaaaaa' }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('search_releases repassa texto e ano', async () => {
    vi.mocked(financialReleaseService.searchByName).mockResolvedValue([] as never);
    await searchReleases.run({ text: 'mercado', year: 2026 });
    expect(financialReleaseService.searchByName).toHaveBeenCalledWith('mercado', 2026);
  });

  it('list_categories serializa campos essenciais', async () => {
    vi.mocked(categoryService.findAll).mockResolvedValue([
      { id: 'c1', name: 'Cartões', type: 'E', allowSubcategories: true, allowDirectEntry: true },
    ] as never);
    const result = (await listCategories.run({})) as Array<{ id: string; name: string }>;
    expect(result[0]).toMatchObject({ id: 'c1', name: 'Cartões' });
  });

  it('get_dashboard_summary delega para o service segmentado', async () => {
    vi.mocked(financialReleaseService.getDashboardSummarySegmented).mockResolvedValue(
      [] as never,
    );
    await getDashboardSummary.run({ fromYear: 2026, fromMonth: 1, toYear: 2026, toMonth: 7 });
    expect(financialReleaseService.getDashboardSummarySegmented).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar** — `npm test` → FAIL.

- [ ] **Step 3: Implementar**

`server-node/src/actions/serializers.ts` (tolerante a category populada ou não):

```ts
interface PopulatedName {
  name?: string;
}

function categoryName(value: unknown): string | null {
  if (value && typeof value === 'object' && 'name' in value) {
    return String((value as PopulatedName).name);
  }
  return null;
}

export interface SerializedRelease {
  id: string;
  name: string;
  value: number;
  type: string;
  category: string | null;
  date: string;
  settled: boolean;
  subcategories: Array<{ category: string | null; value: number }>;
}

export function serializeRelease(r: {
  id: string;
  name: string;
  value: number;
  type: string;
  year: number;
  month: number;
  day: number;
  settled?: boolean;
  category?: unknown;
  subcategories?: Array<{ category?: unknown; value: number }>;
}): SerializedRelease {
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    id: r.id,
    name: r.name,
    value: r.value,
    type: r.type,
    category: categoryName(r.category),
    date: `${r.year}-${pad(r.month)}-${pad(r.day)}`,
    settled: r.settled ?? false,
    subcategories: (r.subcategories ?? []).map((s) => ({
      category: categoryName(s.category),
      value: s.value,
    })),
  };
}

export function serializeCategory(c: {
  id: string;
  name: string;
  type: string;
  allowSubcategories?: boolean;
  allowDirectEntry?: boolean;
}): Record<string, unknown> {
  return {
    id: c.id,
    name: c.name,
    type: c.type,
    allowSubcategories: c.allowSubcategories ?? false,
    allowDirectEntry: c.allowDirectEntry !== false,
  };
}
```

`list-releases.action.ts`:

```ts
import { z } from 'zod';
import { defineAction } from './action.types';
import { financialReleaseService } from '../services/financial-release.service';
import { FinancialReleaseType } from '../types/financial-release.types';
import { serializeRelease } from './serializers';

export default defineAction({
  name: 'list_releases',
  description:
    'Lista os lançamentos financeiros de um mês. type: R = receitas, E = despesas; omita para ambos.',
  mode: 'read',
  inputSchema: z.object({
    year: z.number().int().min(2000).max(2100),
    month: z.number().int().min(1).max(12),
    type: z.nativeEnum(FinancialReleaseType).optional(),
  }),
  run: async ({ year, month, type }) => {
    const types = type ? [type] : [FinancialReleaseType.Receipt, FinancialReleaseType.Expense];
    const lists = await Promise.all(
      types.map((t) =>
        financialReleaseService.findByTypeAndMonthAndYear({ type: t, month, year }),
      ),
    );
    return lists.flat().map((r) => serializeRelease(r));
  },
});
```

`get-release.action.ts`:

```ts
import { z } from 'zod';
import { defineAction } from './action.types';
import { financialReleaseService } from '../services/financial-release.service';
import { AppError } from '../middlewares/error-handler.middleware';
import { serializeRelease } from './serializers';

export default defineAction({
  name: 'get_release',
  description: 'Busca um lançamento pelo id, incluindo subcategorias.',
  mode: 'read',
  inputSchema: z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/) }),
  run: async ({ id }) => {
    const release = await financialReleaseService.findById(id);
    if (!release) {
      throw new AppError(404, `Release ${id} not found`);
    }
    return serializeRelease(release);
  },
});
```

`search-releases.action.ts`:

```ts
import { z } from 'zod';
import { defineAction } from './action.types';
import { financialReleaseService } from '../services/financial-release.service';
import { serializeRelease } from './serializers';

export default defineAction({
  name: 'search_releases',
  description: 'Busca lançamentos por texto no nome (case-insensitive), opcionalmente filtrando por ano. Máx. 50 resultados.',
  mode: 'read',
  inputSchema: z.object({
    text: z.string().min(1).max(100),
    year: z.number().int().min(2000).max(2100).optional(),
  }),
  run: async ({ text, year }) => {
    const releases = await financialReleaseService.searchByName(text, year);
    return releases.map((r) => serializeRelease(r));
  },
});
```

`list-categories.action.ts`:

```ts
import { z } from 'zod';
import { defineAction } from './action.types';
import { categoryService } from '../services/category.service';
import { serializeCategory } from './serializers';

export default defineAction({
  name: 'list_categories',
  description:
    'Lista todas as categorias com id, tipo (R/E/B) e flags. Use os ids ao criar/editar lançamentos.',
  mode: 'read',
  inputSchema: z.object({}),
  run: async () => {
    const categories = await categoryService.findAll();
    return categories.map((c) => serializeCategory(c));
  },
});
```

`get-dashboard-summary.action.ts`:

```ts
import { z } from 'zod';
import { defineAction } from './action.types';
import { financialReleaseService } from '../services/financial-release.service';

export default defineAction({
  name: 'get_dashboard_summary',
  description:
    'Resumo agregado por categoria e mês (visão segmentada do dashboard) para um período. Valores em BRL.',
  mode: 'read',
  inputSchema: z.object({
    fromYear: z.number().int().min(2000).max(2100),
    fromMonth: z.number().int().min(1).max(12),
    toYear: z.number().int().min(2000).max(2100),
    toMonth: z.number().int().min(1).max(12),
  }),
  run: (filter) => financialReleaseService.getDashboardSummarySegmented(filter),
});
```

Novo método no `financial-release.service.ts` (mesmo populate dos outros finds):

```ts
async searchByName(
  text: string,
  year?: number,
): Promise<FinancialReleaseDocument[]> {
  const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return FinancialRelease.find({
    name: { $regex: escaped, $options: 'i' },
    ...(year !== undefined ? { year } : {}),
  })
    .populate([
      { path: 'category', select: 'name allowSubcategories allowAiIntegration' },
      { path: 'subcategories.category', select: 'name' },
    ])
    .sort({ year: -1, month: -1, day: -1 })
    .limit(50);
}
```

Nota: se `getDashboardSummarySegmented` receber `DashboardFilterDto`, o input da action já é estruturalmente idêntico — checar assinatura real ao implementar e ajustar o cast.

- [ ] **Step 4: Rodar testes + tsc** — `npm test && npx tsc --noEmit` → verde.

- [ ] **Step 5: Commit**

```bash
git add -A server-node/src/actions server-node/src/services/financial-release.service.ts
git commit -m "feat: add read actions (releases, categories, dashboard)"
```

### Task 4: Actions de escrita + índice do registry

**Files:**
- Create: `server-node/src/actions/create-release.action.ts`
- Create: `server-node/src/actions/update-release.action.ts`
- Create: `server-node/src/actions/delete-release.action.ts`
- Create: `server-node/src/actions/index.ts`
- Create: `server-node/src/actions/__tests__/write-actions.test.ts`
- Modify: `server-node/src/validators/financial-release.validator.ts` (exportar `objectIdSchema`)

**Interfaces:**
- Consumes: `createFinancialReleaseSchema`, `updateFinancialReleaseSchema`, `objectIdSchema` (passa a ser exportado), `financialReleaseService.create/update/delete`.
- Produces: `actionRegistry` (singleton `ActionRegistry` com as 8 actions) exportado de `actions/index.ts`.

- [ ] **Step 1: Testes que falham**

`server-node/src/actions/__tests__/write-actions.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../services/financial-release.service', () => ({
  financialReleaseService: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { financialReleaseService } from '../../services/financial-release.service';
import createRelease from '../create-release.action';
import updateRelease from '../update-release.action';
import deleteRelease from '../delete-release.action';
import { actionRegistry } from '../index';

const validCreate = {
  name: 'Mercado',
  value: 500,
  type: 'E',
  category: 'aaaaaaaaaaaaaaaaaaaaaaaa',
  year: 2026,
  month: 7,
  day: 26,
};

beforeEach(() => vi.clearAllMocks());

describe('write actions', () => {
  it('create_release tem mode write e delega para o service', async () => {
    expect(createRelease.mode).toBe('write');
    vi.mocked(financialReleaseService.create).mockResolvedValue({
      id: 'r1', ...validCreate, settled: false, subcategories: [],
    } as never);
    await actionRegistry.execute('create_release', validCreate);
    expect(financialReleaseService.create).toHaveBeenCalled();
  });

  it('create_release rejeita payload inválido via registry', async () => {
    await expect(
      actionRegistry.execute('create_release', { ...validCreate, value: -5 }),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(financialReleaseService.create).not.toHaveBeenCalled();
  });

  it('update_release separa id do resto do payload', async () => {
    expect(updateRelease.mode).toBe('write');
    vi.mocked(financialReleaseService.update).mockResolvedValue({} as never);
    await updateRelease.run({ id: 'aaaaaaaaaaaaaaaaaaaaaaaa', value: 600 });
    expect(financialReleaseService.update).toHaveBeenCalledWith(
      'aaaaaaaaaaaaaaaaaaaaaaaa',
      { value: 600 },
    );
  });

  it('delete_release delega para o service', async () => {
    expect(deleteRelease.mode).toBe('write');
    vi.mocked(financialReleaseService.delete).mockResolvedValue(undefined as never);
    await deleteRelease.run({ id: 'aaaaaaaaaaaaaaaaaaaaaaaa' });
    expect(financialReleaseService.delete).toHaveBeenCalledWith('aaaaaaaaaaaaaaaaaaaaaaaa');
  });

  it('registry contém as 8 actions', () => {
    expect(actionRegistry.list().map((a) => a.name).sort()).toEqual([
      'create_release',
      'delete_release',
      'get_dashboard_summary',
      'get_release',
      'list_categories',
      'list_releases',
      'search_releases',
      'update_release',
    ]);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar** — `npm test` → FAIL.

- [ ] **Step 3: Implementar**

No validator, trocar `const objectIdSchema` por `export const objectIdSchema`.

`create-release.action.ts`:

```ts
import { defineAction } from './action.types';
import { createFinancialReleaseSchema } from '../validators/financial-release.validator';
import { financialReleaseService } from '../services/financial-release.service';
import { serializeRelease } from './serializers';

export default defineAction({
  name: 'create_release',
  description:
    'Cria um lançamento financeiro. category deve ser um id obtido via list_categories. Valores em BRL, sempre positivos (type define receita/despesa).',
  mode: 'write',
  inputSchema: createFinancialReleaseSchema,
  run: async (input) => {
    const created = await financialReleaseService.create(input);
    return serializeRelease(created);
  },
});
```

`update-release.action.ts` (`updateFinancialReleaseSchema` é `ZodObject.partial()`, dá para estender):

```ts
import { defineAction } from './action.types';
import {
  objectIdSchema,
  updateFinancialReleaseSchema,
} from '../validators/financial-release.validator';
import { financialReleaseService } from '../services/financial-release.service';
import { serializeRelease } from './serializers';

export default defineAction({
  name: 'update_release',
  description:
    'Atualiza campos de um lançamento existente. Envie apenas os campos a alterar.',
  mode: 'write',
  inputSchema: updateFinancialReleaseSchema.extend({ id: objectIdSchema }),
  run: async ({ id, ...data }) => {
    const updated = await financialReleaseService.update(id, data);
    return serializeRelease(updated);
  },
});
```

`delete-release.action.ts`:

```ts
import { z } from 'zod';
import { defineAction } from './action.types';
import { objectIdSchema } from '../validators/financial-release.validator';
import { financialReleaseService } from '../services/financial-release.service';

export default defineAction({
  name: 'delete_release',
  description: 'Apaga um lançamento definitivamente. Ação irreversível.',
  mode: 'write',
  inputSchema: z.object({ id: objectIdSchema }),
  run: async ({ id }) => {
    await financialReleaseService.delete(id);
    return { deleted: true, id };
  },
});
```

`actions/index.ts`:

```ts
import { ActionRegistry } from './registry';
import listReleases from './list-releases.action';
import searchReleases from './search-releases.action';
import getRelease from './get-release.action';
import listCategories from './list-categories.action';
import getDashboardSummary from './get-dashboard-summary.action';
import createRelease from './create-release.action';
import updateRelease from './update-release.action';
import deleteRelease from './delete-release.action';

export const actionRegistry = new ActionRegistry([
  listReleases,
  searchReleases,
  getRelease,
  listCategories,
  getDashboardSummary,
  createRelease,
  updateRelease,
  deleteRelease,
]);
```

Nota: se `financialReleaseService.update` lançar/retornar null para id inexistente, seguir o comportamento do service (o AppError dele já vira tool_result de erro na Fase 2). Se retornar `null`, lançar `AppError(404, ...)` na action antes de serializar.

- [ ] **Step 4: Rodar testes + tsc** — verde.

- [ ] **Step 5: Checkpoint de fase — deploy**

```bash
docker compose build api-financial-management && docker compose up -d api-financial-management
docker logs financial-management_api --tail 20   # esperar "Migrations complete" + "Server running"
```

Nada visível muda (camada interna). Smoke: `curl -s http://localhost:3000/health`.

- [ ] **Step 6: Commit**

```bash
git add -A server-node/src/actions server-node/src/validators/financial-release.validator.ts
git commit -m "feat: add write actions and action registry index"
```

---

## Fase 2 — Runtime do agente + chat somente leitura

### Task 5: Parser de stream da OpenRouter

**Files:**
- Create: `server-node/src/services/agent/agent.types.ts`
- Create: `server-node/src/services/agent/stream-parser.ts`
- Create: `server-node/src/services/agent/__tests__/stream-parser.test.ts`

**Interfaces:**
- Produces:
  - Tipos: `ChatMessage`, `OpenRouterToolCall { id: string; type: 'function'; function: { name: string; arguments: string } }`, `ScreenContext { route: string; year?: number; month?: number }`, `AgentChatRequest { messages: ChatMessage[]; screenContext?: ScreenContext; decisions?: Record<string, boolean> }`, `AgentEvent` (union: `token`, `assistant_message`, `tool_message`, `tool_start`, `tool_result`, `confirmation_request`, `done`, `error`).
  - `extractDataLines(buffer: string): { events: string[]; rest: string }` — corta eventos SSE completos (`data: ...`) e devolve o resto do buffer.
  - `createAccumulator(): DeltaAccumulator` e `applyDelta(acc, delta): string | null` — acumula `content`/`tool_calls` de chunks `choices[0].delta`; retorna o token de content quando houver.
  - `finishAccumulator(acc): { content: string; toolCalls: OpenRouterToolCall[] }`.

- [ ] **Step 1: Testes que falham**

`stream-parser.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  extractDataLines,
  createAccumulator,
  applyDelta,
  finishAccumulator,
} from '../stream-parser';

describe('extractDataLines', () => {
  it('separa eventos completos e mantém resto parcial', () => {
    const { events, rest } = extractDataLines(
      'data: {"a":1}\n\ndata: {"b":2}\n\ndata: {"par',
    );
    expect(events).toEqual(['{"a":1}', '{"b":2}']);
    expect(rest).toBe('data: {"par');
  });

  it('ignora [DONE] e linhas de comentário', () => {
    const { events } = extractDataLines('data: [DONE]\n\n: keep-alive\n\n');
    expect(events).toEqual([]);
  });
});

describe('delta accumulator', () => {
  it('acumula content e retorna tokens', () => {
    const acc = createAccumulator();
    expect(applyDelta(acc, { content: 'Olá' })).toBe('Olá');
    expect(applyDelta(acc, { content: ' mundo' })).toBe(' mundo');
    expect(finishAccumulator(acc).content).toBe('Olá mundo');
  });

  it('acumula tool_calls fragmentados por index', () => {
    const acc = createAccumulator();
    applyDelta(acc, {
      tool_calls: [
        { index: 0, id: 'tc1', function: { name: 'list_releases', arguments: '{"ye' } },
      ],
    });
    applyDelta(acc, {
      tool_calls: [{ index: 0, function: { arguments: 'ar":2026}' } }],
    });
    const { toolCalls } = finishAccumulator(acc);
    expect(toolCalls).toEqual([
      {
        id: 'tc1',
        type: 'function',
        function: { name: 'list_releases', arguments: '{"year":2026}' },
      },
    ]);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar.**

- [ ] **Step 3: Implementar**

`agent.types.ts`:

```ts
export interface OpenRouterToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export type ChatMessage =
  | { role: 'system'; content: string }
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: OpenRouterToolCall[] }
  | { role: 'tool'; tool_call_id: string; content: string };

export interface ScreenContext {
  route: string;
  year?: number;
  month?: number;
}

export interface AgentChatRequest {
  messages: ChatMessage[];
  screenContext?: ScreenContext;
  decisions?: Record<string, boolean>;
}

export type AgentEvent =
  | { type: 'token'; content: string }
  | { type: 'assistant_message'; message: ChatMessage }
  | { type: 'tool_message'; message: ChatMessage }
  | { type: 'tool_start'; toolCallId: string; name: string }
  | { type: 'tool_result'; toolCallId: string; ok: boolean }
  | { type: 'confirmation_request'; toolCallId: string; name: string; args: unknown }
  | { type: 'done' }
  | { type: 'error'; message: string };
```

`stream-parser.ts`:

```ts
import { OpenRouterToolCall } from './agent.types';

export interface StreamDelta {
  content?: string | null;
  tool_calls?: Array<{
    index: number;
    id?: string;
    function?: { name?: string; arguments?: string };
  }>;
}

export interface DeltaAccumulator {
  content: string;
  toolCalls: Map<number, { id: string; name: string; arguments: string }>;
}

export function extractDataLines(buffer: string): {
  events: string[];
  rest: string;
} {
  const events: string[] = [];
  let rest = buffer;
  let idx: number;
  while ((idx = rest.indexOf('\n\n')) !== -1) {
    const block = rest.slice(0, idx);
    rest = rest.slice(idx + 2);
    for (const line of block.split('\n')) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (payload && payload !== '[DONE]') events.push(payload);
    }
  }
  return { events, rest };
}

export function createAccumulator(): DeltaAccumulator {
  return { content: '', toolCalls: new Map() };
}

export function applyDelta(
  acc: DeltaAccumulator,
  delta: StreamDelta,
): string | null {
  if (delta.tool_calls) {
    for (const tc of delta.tool_calls) {
      const existing = acc.toolCalls.get(tc.index) ?? {
        id: '',
        name: '',
        arguments: '',
      };
      acc.toolCalls.set(tc.index, {
        id: tc.id ?? existing.id,
        name: existing.name + (tc.function?.name ?? ''),
        arguments: existing.arguments + (tc.function?.arguments ?? ''),
      });
    }
  }
  if (delta.content) {
    acc.content += delta.content;
    return delta.content;
  }
  return null;
}

export function finishAccumulator(acc: DeltaAccumulator): {
  content: string;
  toolCalls: OpenRouterToolCall[];
} {
  const toolCalls: OpenRouterToolCall[] = [];
  acc.toolCalls.forEach((tc) => {
    toolCalls.push({
      id: tc.id,
      type: 'function',
      function: { name: tc.name, arguments: tc.arguments },
    });
  });
  return { content: acc.content, toolCalls };
}
```

(`Map.forEach` em vez de iterar `values()` — tsconfig não tem downlevelIteration.)

- [ ] **Step 4: Rodar testes + tsc** — verde.

- [ ] **Step 5: Commit**

```bash
git add -A server-node/src/services/agent
git commit -m "feat: add agent types and OpenRouter stream parser"
```

### Task 6: Loop do agente (AgentService)

**Files:**
- Create: `server-node/src/services/agent/openrouter-client.ts`
- Create: `server-node/src/services/agent/system-prompt.ts`
- Create: `server-node/src/services/agent/agent.service.ts`
- Create: `server-node/src/services/agent/__tests__/agent.service.test.ts`

**Interfaces:**
- Consumes: `actionRegistry` de `actions/index.ts`; `systemConfigService.get()`; tipos da Task 5.
- Produces:
  - `streamChatCompletion(opts: { token: string; model: string; messages: ChatMessage[]; tools: OpenAiTool[]; onToken: (t: string) => void }): Promise<{ content: string; toolCalls: OpenRouterToolCall[] }>` — usa `fetch` global com `stream: true`.
  - `buildSystemPrompt(screenContext?: ScreenContext, now?: Date): string`.
  - `agentService.chat(req: AgentChatRequest, emit: (e: AgentEvent) => void): Promise<void>` — nunca rejeita; erros viram evento `error`.

- [ ] **Step 1: Testes que falham**

`agent.service.test.ts` — mockar `openrouter-client` e `systemConfigService`; usar o `actionRegistry` real com services mockados:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../openrouter-client', () => ({ streamChatCompletion: vi.fn() }));
vi.mock('../../system-config.service', () => ({
  systemConfigService: {
    get: vi.fn().mockResolvedValue({ openRouterToken: 'tok', agentModel: 'test-model' }),
  },
}));
vi.mock('../../financial-release.service', () => ({
  financialReleaseService: {
    findByTypeAndMonthAndYear: vi.fn().mockResolvedValue([]),
    findById: vi.fn(),
    searchByName: vi.fn(),
    getDashboardSummarySegmented: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock('../../category.service', () => ({
  categoryService: { findAll: vi.fn().mockResolvedValue([]) },
}));

import { streamChatCompletion } from '../openrouter-client';
import { agentService } from '../agent.service';
import { AgentEvent } from '../agent.types';

function collectEvents() {
  const events: AgentEvent[] = [];
  return { events, emit: (e: AgentEvent) => events.push(e) };
}

const toolCall = (id: string, name: string, args: string) => ({
  id,
  type: 'function' as const,
  function: { name, arguments: args },
});

beforeEach(() => vi.clearAllMocks());

describe('agentService.chat', () => {
  it('resposta simples: assistant_message + done', async () => {
    vi.mocked(streamChatCompletion).mockResolvedValue({ content: 'Oi!', toolCalls: [] });
    const { events, emit } = collectEvents();
    await agentService.chat({ messages: [{ role: 'user', content: 'oi' }] }, emit);
    expect(events.at(-1)).toEqual({ type: 'done' });
    expect(events.some((e) => e.type === 'assistant_message')).toBe(true);
  });

  it('executa tool read e continua o loop', async () => {
    vi.mocked(streamChatCompletion)
      .mockResolvedValueOnce({
        content: '',
        toolCalls: [toolCall('tc1', 'list_categories', '{}')],
      })
      .mockResolvedValueOnce({ content: 'Sem categorias.', toolCalls: [] });
    const { events, emit } = collectEvents();
    await agentService.chat({ messages: [{ role: 'user', content: 'categorias?' }] }, emit);
    expect(events.filter((e) => e.type === 'tool_start')).toHaveLength(1);
    expect(events.filter((e) => e.type === 'tool_message')).toHaveLength(1);
    expect(events.at(-1)).toEqual({ type: 'done' });
    expect(streamChatCompletion).toHaveBeenCalledTimes(2);
  });

  it('tool write vira confirmation_request e encerra o stream', async () => {
    vi.mocked(streamChatCompletion).mockResolvedValueOnce({
      content: '',
      toolCalls: [toolCall('tc9', 'delete_release', '{"id":"aaaaaaaaaaaaaaaaaaaaaaaa"}')],
    });
    const { events, emit } = collectEvents();
    await agentService.chat({ messages: [{ role: 'user', content: 'apaga' }] }, emit);
    const confirm = events.find((e) => e.type === 'confirmation_request');
    expect(confirm).toMatchObject({ toolCallId: 'tc9', name: 'delete_release' });
    expect(events.at(-1)).toEqual({ type: 'done' });
    expect(streamChatCompletion).toHaveBeenCalledTimes(1);
  });

  it('erro de tool vira tool_result ok=false e o loop segue', async () => {
    vi.mocked(streamChatCompletion)
      .mockResolvedValueOnce({
        content: '',
        toolCalls: [toolCall('tc2', 'get_release', '{"id":"invalido"}')],
      })
      .mockResolvedValueOnce({ content: 'Id inválido.', toolCalls: [] });
    const { events, emit } = collectEvents();
    await agentService.chat({ messages: [{ role: 'user', content: 'x' }] }, emit);
    expect(events.find((e) => e.type === 'tool_result')).toMatchObject({ ok: false });
    expect(events.at(-1)).toEqual({ type: 'done' });
  });

  it('respeita o limite de 10 iterações', async () => {
    vi.mocked(streamChatCompletion).mockResolvedValue({
      content: '',
      toolCalls: [toolCall('tcN', 'list_categories', '{}')],
    });
    const { events, emit } = collectEvents();
    await agentService.chat({ messages: [{ role: 'user', content: 'loop' }] }, emit);
    expect(streamChatCompletion).toHaveBeenCalledTimes(10);
    expect(events.at(-1)).toMatchObject({ type: 'error' });
  });

  it('sem token configurado: evento error amigável', async () => {
    const { systemConfigService } = await import('../../system-config.service');
    vi.mocked(systemConfigService.get).mockResolvedValueOnce({
      openRouterToken: '',
      agentModel: 'm',
    } as never);
    const { events, emit } = collectEvents();
    await agentService.chat({ messages: [{ role: 'user', content: 'oi' }] }, emit);
    expect(events).toEqual([
      { type: 'error', message: expect.stringContaining('OpenRouter') },
    ]);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar.**

- [ ] **Step 3: Implementar**

`openrouter-client.ts` (mesmo endpoint do llm-classifier):

```ts
import { AppError } from '../../middlewares/error-handler.middleware';
import { OpenAiTool } from '../../actions/registry';
import { ChatMessage, OpenRouterToolCall } from './agent.types';
import {
  extractDataLines,
  createAccumulator,
  applyDelta,
  finishAccumulator,
  StreamDelta,
} from './stream-parser';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function streamChatCompletion(opts: {
  token: string;
  model: string;
  messages: ChatMessage[];
  tools: OpenAiTool[];
  onToken: (t: string) => void;
}): Promise<{ content: string; toolCalls: OpenRouterToolCall[] }> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      tools: opts.tools,
      stream: true,
    }),
  });

  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => '');
    throw new AppError(502, `OpenRouter error ${response.status}: ${text.slice(0, 300)}`);
  }

  const acc = createAccumulator();
  const decoder = new TextDecoder();
  let buffer = '';
  const reader = response.body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const { events, rest } = extractDataLines(buffer);
    buffer = rest;
    for (const raw of events) {
      let parsed: { choices?: Array<{ delta?: StreamDelta }> };
      try {
        parsed = JSON.parse(raw);
      } catch {
        continue;
      }
      const delta = parsed.choices?.[0]?.delta;
      if (!delta) continue;
      const tokenText = applyDelta(acc, delta);
      if (tokenText) opts.onToken(tokenText);
    }
  }
  return finishAccumulator(acc);
}
```

`system-prompt.ts`:

```ts
import { ScreenContext } from './agent.types';

const MONTH_NAMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

export function buildSystemPrompt(
  screenContext?: ScreenContext,
  now: Date = new Date(),
): string {
  const lines = [
    'Você é o assistente financeiro do app de controle financeiro pessoal do Erick.',
    'Você consulta e gerencia lançamentos (receitas/despesas), categorias e resumos do dashboard através das tools disponíveis.',
    `Data de hoje: ${now.getDate()} de ${MONTH_NAMES[now.getMonth()]} de ${now.getFullYear()}.`,
    'Valores são em reais (BRL). Responda em português, de forma direta.',
    'Antes de criar ou editar lançamentos, use list_categories para obter o id correto da categoria.',
    'Ações de escrita (criar/editar/apagar) exigem aprovação do usuário: proponha UMA ação de escrita por vez e aguarde.',
    'Nunca invente ids ou valores; se faltar informação, pergunte.',
  ];
  if (screenContext) {
    const parts = [`rota ${screenContext.route}`];
    if (screenContext.month && screenContext.year) {
      parts.push(`vendo ${MONTH_NAMES[screenContext.month - 1]} de ${screenContext.year}`);
    }
    lines.push(`Contexto da tela do usuário agora: ${parts.join(', ')}.`);
  }
  return lines.join('\n');
}
```

`agent.service.ts`:

```ts
import { actionRegistry } from '../../actions';
import { systemConfigService } from '../system-config.service';
import { logger } from '../../config/logger.config';
import { streamChatCompletion } from './openrouter-client';
import { buildSystemPrompt } from './system-prompt';
import {
  AgentChatRequest,
  AgentEvent,
  ChatMessage,
  OpenRouterToolCall,
} from './agent.types';

const MAX_TOOL_ITERATIONS = 10;

function safeParseArgs(raw: string): unknown {
  try {
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}

export class AgentService {
  async chat(
    req: AgentChatRequest,
    emit: (e: AgentEvent) => void,
  ): Promise<void> {
    try {
      const config = await systemConfigService.get();
      if (!config.openRouterToken || !config.agentModel) {
        emit({
          type: 'error',
          message:
            'Configure o token OpenRouter e o modelo do agente em Configurações.',
        });
        return;
      }

      const messages: ChatMessage[] = [
        { role: 'system', content: buildSystemPrompt(req.screenContext) },
        ...req.messages,
      ];

      const pending = this.resolvePendingWrites(messages, req.decisions ?? {});
      for (const result of await pending) {
        emit({ type: 'tool_message', message: result });
        messages.push(result);
      }
      if (this.hasUndecidedWrites(messages)) {
        this.emitConfirmations(messages, emit);
        emit({ type: 'done' });
        return;
      }

      for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
        const { content, toolCalls } = await streamChatCompletion({
          token: config.openRouterToken,
          model: config.agentModel,
          messages,
          tools: actionRegistry.toOpenAiTools(),
          onToken: (t) => emit({ type: 'token', content: t }),
        });

        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: content || null,
          ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
        };
        emit({ type: 'assistant_message', message: assistantMessage });
        messages.push(assistantMessage);

        if (toolCalls.length === 0) {
          emit({ type: 'done' });
          return;
        }

        let awaitingConfirmation = false;
        for (const tc of toolCalls) {
          const action = actionRegistry.get(tc.function.name);
          if (action?.mode === 'write') {
            emit({
              type: 'confirmation_request',
              toolCallId: tc.id,
              name: tc.function.name,
              args: safeParseArgs(tc.function.arguments),
            });
            awaitingConfirmation = true;
            continue;
          }
          const toolMessage = await this.runTool(tc, emit);
          emit({ type: 'tool_message', message: toolMessage });
          messages.push(toolMessage);
        }
        if (awaitingConfirmation) {
          emit({ type: 'done' });
          return;
        }
      }

      emit({
        type: 'error',
        message: 'Limite de ações por mensagem atingido. Tente uma pergunta mais específica.',
      });
    } catch (error) {
      logger.error('Agent chat failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      emit({
        type: 'error',
        message: 'Não consegui falar com o modelo agora. Tente novamente.',
      });
    }
  }

  private async runTool(
    tc: OpenRouterToolCall,
    emit: (e: AgentEvent) => void,
  ): Promise<ChatMessage> {
    emit({ type: 'tool_start', toolCallId: tc.id, name: tc.function.name });
    try {
      const result = await actionRegistry.execute(
        tc.function.name,
        safeParseArgs(tc.function.arguments),
      );
      emit({ type: 'tool_result', toolCallId: tc.id, ok: true });
      return {
        role: 'tool',
        tool_call_id: tc.id,
        content: JSON.stringify(result),
      };
    } catch (error) {
      emit({ type: 'tool_result', toolCallId: tc.id, ok: false });
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      return {
        role: 'tool',
        tool_call_id: tc.id,
        content: JSON.stringify({ error: message }),
      };
    }
  }

  /** Tool calls de escrita da última mensagem assistant que ainda não têm tool result. */
  private undecidedWrites(messages: ChatMessage[]): OpenRouterToolCall[] {
    const last = [...messages]
      .reverse()
      .find((m): m is Extract<ChatMessage, { role: 'assistant' }> => m.role === 'assistant');
    if (!last?.tool_calls) return [];
    const answered = new Set(
      messages
        .filter((m): m is Extract<ChatMessage, { role: 'tool' }> => m.role === 'tool')
        .map((m) => m.tool_call_id),
    );
    return last.tool_calls.filter(
      (tc) => !answered.has(tc.id) && actionRegistry.get(tc.function.name)?.mode === 'write',
    );
  }

  private hasUndecidedWrites(messages: ChatMessage[]): boolean {
    return this.undecidedWrites(messages).length > 0;
  }

  private emitConfirmations(
    messages: ChatMessage[],
    emit: (e: AgentEvent) => void,
  ): void {
    for (const tc of this.undecidedWrites(messages)) {
      emit({
        type: 'confirmation_request',
        toolCallId: tc.id,
        name: tc.function.name,
        args: safeParseArgs(tc.function.arguments),
      });
    }
  }

  /** Executa (ou rejeita) writes pendentes que receberam decisão neste request. */
  private async resolvePendingWrites(
    messages: ChatMessage[],
    decisions: Record<string, boolean>,
  ): Promise<ChatMessage[]> {
    const results: ChatMessage[] = [];
    for (const tc of this.undecidedWrites(messages)) {
      if (!(tc.id in decisions)) continue;
      if (decisions[tc.id]) {
        results.push(await this.runTool(tc, () => undefined));
      } else {
        results.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify({
            error: 'Usuário rejeitou esta ação. Não execute; pergunte como prosseguir.',
          }),
        });
      }
    }
    return results;
  }
}

export const agentService = new AgentService();
```

Atenção ao detalhe: em `resolvePendingWrites` os `tool_start`/`tool_result` são suprimidos (`() => undefined`) — ao aprovar, o cliente já sabe o que está rodando; se preferir emitir, passar `emit` adiante (irrelevante para os testes acima).

- [ ] **Step 4: Rodar testes + tsc** — verde. (O teste de confirmação aprovada/rejeitada entra na Task 10, junto do fluxo completo.)

- [ ] **Step 5: Commit**

```bash
git add -A server-node/src/services/agent
git commit -m "feat: add agent tool-calling loop over OpenRouter"
```

### Task 7: Endpoint /agent/chat (SSE) + campo agentModel

**Files:**
- Create: `server-node/src/validators/agent.validator.ts`
- Create: `server-node/src/controllers/agent.controller.ts`
- Create: `server-node/src/routes/agent.routes.ts`
- Modify: `server-node/src/routes/index.ts` (`router.use('/agent', agentRoutes)`)
- Modify: `server-node/src/models/system-config.model.ts` (+`agentModel: { type: String, default: '' }`)
- Modify: `server-node/src/types/system-config.types.ts` (+`agentModel: string`)
- Modify: `server-node/src/validators/system-config.validator.ts` (+`agentModel: z.string().max(200).optional()` no update schema)
- Create: `server-node/src/validators/__tests__/agent.validator.test.ts`

**Interfaces:**
- Consumes: `agentService.chat`, tipos da Task 5.
- Produces: `POST /agent/chat` — body `AgentChatRequest`, resposta `text/event-stream` com `data: <AgentEvent JSON>\n\n` por evento; `agentChatSchema` (zod).

- [ ] **Step 1: Teste do validator (falha primeiro)**

```ts
import { describe, it, expect } from 'vitest';
import { agentChatSchema } from '../agent.validator';

describe('agentChatSchema', () => {
  it('aceita request mínimo', () => {
    const parsed = agentChatSchema.safeParse({
      messages: [{ role: 'user', content: 'oi' }],
    });
    expect(parsed.success).toBe(true);
  });

  it('aceita assistant com tool_calls e tool message', () => {
    const parsed = agentChatSchema.safeParse({
      messages: [
        { role: 'user', content: 'apaga x' },
        {
          role: 'assistant',
          content: null,
          tool_calls: [
            { id: 'tc1', type: 'function', function: { name: 'delete_release', arguments: '{}' } },
          ],
        },
        { role: 'tool', tool_call_id: 'tc1', content: '{}' },
      ],
      decisions: { tc1: true },
      screenContext: { route: '/lancamentos', year: 2026, month: 7 },
    });
    expect(parsed.success).toBe(true);
  });

  it('rejeita role system vinda do cliente e histórico gigante', () => {
    expect(
      agentChatSchema.safeParse({ messages: [{ role: 'system', content: 'hack' }] }).success,
    ).toBe(false);
    expect(
      agentChatSchema.safeParse({
        messages: Array.from({ length: 201 }, () => ({ role: 'user', content: 'x' })),
      }).success,
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Implementar validator**

`agent.validator.ts`:

```ts
import { z } from 'zod';

const toolCallSchema = z.object({
  id: z.string().min(1).max(100),
  type: z.literal('function'),
  function: z.object({
    name: z.string().min(1).max(100),
    arguments: z.string().max(20000),
  }),
});

const messageSchema = z.discriminatedUnion('role', [
  z.object({ role: z.literal('user'), content: z.string().min(1).max(8000) }),
  z.object({
    role: z.literal('assistant'),
    content: z.string().max(20000).nullable(),
    tool_calls: z.array(toolCallSchema).max(10).optional(),
  }),
  z.object({
    role: z.literal('tool'),
    tool_call_id: z.string().min(1).max(100),
    content: z.string().max(100000),
  }),
]);

export const agentChatSchema = z.object({
  messages: z.array(messageSchema).min(1).max(200),
  screenContext: z
    .object({
      route: z.string().max(200),
      year: z.number().int().min(2000).max(2100).optional(),
      month: z.number().int().min(1).max(12).optional(),
    })
    .optional(),
  decisions: z.record(z.string(), z.boolean()).optional(),
});

export type AgentChatDto = z.infer<typeof agentChatSchema>;
```

- [ ] **Step 3: Controller + rota**

`agent.controller.ts`:

```ts
import { Request, Response } from 'express';
import { agentChatSchema } from '../validators/agent.validator';
import { agentService } from '../services/agent/agent.service';
import { AgentEvent } from '../services/agent/agent.types';
import { AppError } from '../middlewares/error-handler.middleware';

class AgentController {
  async chat(req: Request, res: Response): Promise<void> {
    const parsed = agentChatSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'Invalid agent chat request');
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const emit = (event: AgentEvent): void => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    await agentService.chat(parsed.data, emit);
    res.end();
  }
}

export const agentController = new AgentController();
```

`agent.routes.ts` (mesmo padrão das outras rotas, com `asyncHandler`):

```ts
import { Router } from 'express';
import { agentController } from '../controllers/agent.controller';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

router.post('/chat', asyncHandler(agentController.chat.bind(agentController)));

export default router;
```

Em `routes/index.ts`: `import agentRoutes from './agent.routes';` + `router.use('/agent', agentRoutes);`.

System-config: adicionar `agentModel` no model (default `''`), no tipo `ISystemConfig` e no update validator. **Sem migração** — default de schema materializa na leitura, e `$set` só grava quando editado (mesmo padrão do aiModel).

- [ ] **Step 4: Gates** — `npm test && npx tsc --noEmit` → verde.

- [ ] **Step 5: Deploy + smoke SSE**

```bash
docker compose build api-financial-management && docker compose up -d api-financial-management
docker exec financial-management_api node -e "
fetch('http://localhost:3000/agent/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages: [{ role: 'user', content: 'oi' }] }),
}).then(async (r) => {
  const text = await r.text();
  console.log(r.status, text.slice(0, 500));
});"
```

Expected: status 200; se `agentModel` ainda vazio no banco → evento `error` pedindo configuração (comportamento correto); com modelo configurado → eventos `token`/`assistant_message`/`done`.

- [ ] **Step 6: Commit**

```bash
git add -A server-node/src
git commit -m "feat: add /agent/chat SSE endpoint and agentModel config"
```

### Task 8: Painel de chat no cliente (somente leitura)

**Files:**
- Create: `client/src/types/agent.ts`
- Create: `client/src/hooks/use-agent-chat.ts`
- Create: `client/src/components/agent/agent-panel.tsx`
- Create: `client/src/components/agent/agent-message-list.tsx`
- Modify: `client/src/app/layout.tsx` (montar `<AgentPanel />` dentro de QueryProvider, após `<Toaster />`)
- Modify: `client/src/lib/translations.ts` (chaves novas pt+en)

**Interfaces:**
- Consumes: `API_BASE_URL` de `lib/api/client.ts`; `useSettings` (t); componentes `Sheet`, `Button`, `ScrollArea` de `components/ui`.
- Produces:
  - `client/src/types/agent.ts`: espelhos de `ChatMessage`, `OpenRouterToolCall`, `AgentEvent`, `ScreenContext` (mesmos shapes da Task 5) + `DisplayEntry { id: string; role: 'user' | 'assistant' | 'tool-chip'; content: string; confirmation?: PendingConfirmation }` e `PendingConfirmation { toolCallId: string; name: string; args: Record<string, unknown>; resolved?: 'approved' | 'rejected' }`.
  - Hook `useAgentChat(): { display: DisplayEntry[]; sending: boolean; sendMessage(text: string): Promise<void>; respondToConfirmation(toolCallId: string, approved: boolean): Promise<void>; clear(): void; pendingConfirmation: PendingConfirmation | null }`.

- [ ] **Step 1: Tipos + hook**

`use-agent-chat.ts` — pontos obrigatórios:

```ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '@/lib/api/client';
import {
  AgentEvent,
  ChatMessage,
  DisplayEntry,
  PendingConfirmation,
  ScreenContext,
} from '@/types/agent';
import { getScreenContext } from '@/lib/agent-screen-context';

const STORAGE_KEY = 'agent-chat-v1';

interface StoredState {
  history: ChatMessage[];
  display: DisplayEntry[];
}

async function streamAgentEvents(
  body: { messages: ChatMessage[]; screenContext?: ScreenContext; decisions?: Record<string, boolean> },
  onEvent: (e: AgentEvent) => void,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/agent/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok || !response.body) {
    throw new Error(`Agent error: ${response.status}`);
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const block = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      for (const line of block.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        try {
          onEvent(JSON.parse(line.slice(6)) as AgentEvent);
        } catch {
          // chunk malformado: ignora
        }
      }
    }
  }
}
```

O hook mantém `history` (protocolo exato — mensagens `assistant_message`/`tool_message` são anexadas **verbatim** para o resume stateless funcionar) e `display` (para render). Tratamento de eventos:

- `token` → concatena no buffer da resposta corrente (entry assistant "digitando");
- `assistant_message` → push no history; se `message.content`, garante entry assistant final com o content (substitui o buffer de tokens);
- `tool_message` → push no history;
- `tool_start` → adiciona `tool-chip` no display (content = nome da action);
- `confirmation_request` → seta `pendingConfirmation` e adiciona entry com `confirmation` (Fase 3 renderiza o card; nesta fase não ocorre — actions write existem mas o painel ainda não trata; o evento fica ignorado com um chip "ação pendente" temporário);
- `done` → finaliza; `error` → entry assistant com o texto de erro.

Persistir `{ history, display }` em localStorage num `useEffect` (com try/catch para quota); hidratar no mount (`useRef` de inicialização). `sendMessage` bloqueia quando `sending`. `respondToConfirmation` nesta task pode lançar `not implemented` (implementação real na Task 11) — mas exportar já a assinatura.

`client/src/lib/agent-screen-context.ts` (criar nesta task, publicação nas páginas na Task 9):

```ts
export interface ScreenContextState {
  route: string;
  year?: number;
  month?: number;
}

let current: ScreenContextState = { route: '/' };

export function publishScreenContext(ctx: Partial<ScreenContextState>): void {
  current = { ...current, ...ctx };
}

export function getScreenContext(): ScreenContextState {
  return current;
}
```

- [ ] **Step 2: UI**

`agent-panel.tsx`: botão flutuante `fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg` (ícone `Sparkles` do lucide) abrindo `Sheet side="right"` com largura `sm:max-w-md`, header (título + botão limpar com ícone `Trash2` + confirmação implícita não necessária), `AgentMessageList` num `ScrollArea` flex-1 (auto-scroll para o fim a cada mensagem via ref), e footer com `<textarea>` de 1-3 linhas (Enter envia, Shift+Enter quebra) + botão enviar. Enquanto `sending`, mostrar chip animado "pensando…" (`Loader2` girando). O panel chama `publishScreenContext({ route: pathname })` num `useEffect` de `usePathname()`.

`agent-message-list.tsx`: renderiza `DisplayEntry[]` — user: bolha à direita (`bg-primary text-primary-foreground`); assistant: bolha à esquerda (`bg-muted`), `whitespace-pre-wrap` (texto puro, sem markdown na v1); tool-chip: pill pequena com nome amigável da tool.

Traduções (pt / en): `agentTitle` ('Assistente' / 'Assistant'), `agentPlaceholder` ('Pergunte ou peça uma ação…' / 'Ask or request an action…'), `agentSend` ('Enviar' / 'Send'), `agentClear` ('Limpar conversa' / 'Clear conversation'), `agentThinking` ('Pensando…' / 'Thinking…'), `agentErrorGeneric` ('Não consegui responder agora. Tente de novo.' / "Couldn't respond right now. Try again."), `agentToolPrefix` ('Consultando' / 'Querying'), `agentEmptyState` ('Pergunte sobre seus gastos, receitas e categorias.' / 'Ask about your expenses, income and categories.').

- [ ] **Step 3: Gates cliente**

Run: `cd client && npm run lint && npm run build` → verde.

- [ ] **Step 4: Deploy + verificação manual**

```bash
docker compose build app-financial-management && docker compose up -d app-financial-management
```

Manual em http://100.115.143.64:4200: configurar `agentModel` via API (`PATCH /system-config` com ex. `{"agentModel":"openai/gpt-4o-mini"}`) ou aguardar Task 9 (campo na UI); abrir painel, perguntar "quanto gastei em julho de 2026?" → chips de tool + resposta com números reais.

- [ ] **Step 5: Commit**

```bash
git add -A client/src
git commit -m "feat: add global agent chat panel (read-only)"
```

### Task 9: Contexto de tela + campo de modelo em /configuracoes

**Files:**
- Modify: `client/src/app/lancamentos/page.tsx` (publicar year/month no screen context)
- Modify: `client/src/app/configuracoes/page.tsx` (campo "Modelo do agente")
- Modify: `client/src/types/system-config.ts` (+`agentModel?: string`)
- Modify: `client/src/lib/translations.ts` (+`agentModelLabel`, `agentModelHint`)

**Interfaces:**
- Consumes: `publishScreenContext` (Task 8), `useMonth` (na página de lançamentos), hook `use-system-config` existente.

- [ ] **Step 1: Publicar contexto**

Na página de lançamentos (componente que já usa `useMonth`):

```tsx
const { currentYear, currentMonth } = useMonth();
useEffect(() => {
  publishScreenContext({ year: currentYear, month: currentMonth });
}, [currentYear, currentMonth]);
```

- [ ] **Step 2: Campo em /configuracoes**

Seguir o padrão exato do campo `aiModel` existente na página (FloatingInput + save via mutation do use-system-config): label `t('agentModelLabel')` ('Modelo do agente (chat)' / 'Agent model (chat)'), hint `t('agentModelHint')` ('Ex.: openai/gpt-4o-mini — modelo OpenRouter usado pelo assistente' / 'E.g. openai/gpt-4o-mini — OpenRouter model used by the assistant'). Incluir `agentModel` no payload de save e no estado inicial vindo do GET.

- [ ] **Step 3: Gates + deploy + manual**

`cd client && npm run lint && npm run build`; rebuild app container; configurar o modelo pela UI; no painel, com a tela de lançamentos em julho, perguntar "e nesse mês que estou vendo?" → resposta deve usar 07/2026 sem você citar o mês.

- [ ] **Step 4: Commit**

```bash
git add -A client/src
git commit -m "feat: agent screen context and agent model setting"
```

---

## Fase 3 — Escritas com confirmação

### Task 10: Fluxo de decisão no servidor (testes)

**Files:**
- Modify: `server-node/src/services/agent/__tests__/agent.service.test.ts` (novos casos)
- Modify (se necessário): `server-node/src/services/agent/agent.service.ts`

A lógica já foi implementada na Task 6 (`resolvePendingWrites`/`undecidedWrites`); esta task a cobre com testes de resume e corrige o que aparecer.

- [ ] **Step 1: Testes que devem passar (ou revelar bugs)**

Adicionar ao describe existente:

```ts
it('aprovação executa o write pendente e continua o loop', async () => {
  vi.mocked(streamChatCompletion).mockResolvedValueOnce({
    content: 'Apagado com sucesso.',
    toolCalls: [],
  });
  const { financialReleaseService } = await import(
    '../../financial-release.service'
  );
  vi.mocked(financialReleaseService.delete).mockResolvedValue(undefined as never);
  const history = [
    { role: 'user' as const, content: 'apaga o lançamento X' },
    {
      role: 'assistant' as const,
      content: null,
      tool_calls: [toolCall('tc9', 'delete_release', '{"id":"aaaaaaaaaaaaaaaaaaaaaaaa"}')],
    },
  ];
  const { events, emit } = collectEvents();
  await agentService.chat(
    { messages: history, decisions: { tc9: true } },
    emit,
  );
  expect(financialReleaseService.delete).toHaveBeenCalledWith('aaaaaaaaaaaaaaaaaaaaaaaa');
  expect(events.some((e) => e.type === 'tool_message')).toBe(true);
  expect(events.at(-1)).toEqual({ type: 'done' });
});

it('rejeição vira tool_result de recusa sem executar', async () => {
  vi.mocked(streamChatCompletion).mockResolvedValueOnce({
    content: 'Ok, não vou apagar.',
    toolCalls: [],
  });
  const { financialReleaseService } = await import(
    '../../financial-release.service'
  );
  const history = [
    { role: 'user' as const, content: 'apaga o lançamento X' },
    {
      role: 'assistant' as const,
      content: null,
      tool_calls: [toolCall('tc9', 'delete_release', '{"id":"aaaaaaaaaaaaaaaaaaaaaaaa"}')],
    },
  ];
  const { events, emit } = collectEvents();
  await agentService.chat({ messages: history, decisions: { tc9: false } }, emit);
  expect(financialReleaseService.delete).not.toHaveBeenCalled();
  const toolMsg = events.find((e) => e.type === 'tool_message');
  expect(JSON.stringify(toolMsg)).toContain('rejeitou');
});

it('write pendente sem decisão re-emite confirmation_request', async () => {
  const history = [
    { role: 'user' as const, content: 'apaga' },
    {
      role: 'assistant' as const,
      content: null,
      tool_calls: [toolCall('tc9', 'delete_release', '{"id":"aaaaaaaaaaaaaaaaaaaaaaaa"}')],
    },
  ];
  const { events, emit } = collectEvents();
  await agentService.chat({ messages: history }, emit);
  expect(events.find((e) => e.type === 'confirmation_request')).toBeTruthy();
  expect(streamChatCompletion).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Rodar, corrigir o que falhar, gates verdes.**

- [ ] **Step 3: Commit**

```bash
git add -A server-node/src/services/agent
git commit -m "test: cover write confirmation resume flow"
```

### Task 11: Card de confirmação no cliente

**Files:**
- Create: `client/src/components/agent/agent-confirmation-card.tsx`
- Modify: `client/src/hooks/use-agent-chat.ts` (implementar `respondToConfirmation`, tratar `confirmation_request`)
- Modify: `client/src/components/agent/agent-message-list.tsx` (renderizar o card)
- Modify: `client/src/lib/translations.ts` (chaves novas)

**Interfaces:**
- Consumes: `useCategories()` (mapear category id → nome no preview), hook e tipos das Tasks 8.

- [ ] **Step 1: Hook**

`confirmation_request` → cria `DisplayEntry` com `confirmation: { toolCallId, name, args }` e seta `pendingConfirmation`. `respondToConfirmation(toolCallId, approved)`:

```ts
const respondToConfirmation = useCallback(
  async (toolCallId: string, approved: boolean) => {
    setPendingConfirmation(null);
    setDisplay((prev) =>
      prev.map((d) =>
        d.confirmation?.toolCallId === toolCallId
          ? { ...d, confirmation: { ...d.confirmation, resolved: approved ? 'approved' : 'rejected' } }
          : d,
      ),
    );
    await runTurn({ messages: historyRef.current, decisions: { [toolCallId]: approved } });
  },
  [runTurn],
);
```

(`runTurn` é a função interna compartilhada com `sendMessage` que faz o POST/stream e processa eventos; `historyRef` acompanha o state para evitar staleness no mesmo tick.)

- [ ] **Step 2: Card**

`agent-confirmation-card.tsx`: borda `border-amber-500/50`, header com título por action (`create_release` → `t('agentConfirmCreate')`, `update_release` → `t('agentConfirmUpdate')`, `delete_release` → `t('agentConfirmDelete')`), grid de campos do `args` com labels traduzidas (name/value/type/category/date — value formatado com `formatDisplayValue`, category id resolvido para nome via `useCategories`, campos ausentes omitidos), e botões `t('agentApprove')`/`t('agentReject')` (variant default/outline). Quando `resolved`, esconder botões e mostrar badge 'Aprovado'/'Rejeitado'.

Traduções: `agentConfirmCreate` ('Criar lançamento?' / 'Create release?'), `agentConfirmUpdate` ('Atualizar lançamento?' / 'Update release?'), `agentConfirmDelete` ('Apagar lançamento? Essa ação é irreversível.' / 'Delete release? This cannot be undone.'), `agentApprove` ('Aprovar' / 'Approve'), `agentReject` ('Rejeitar' / 'Reject'), `agentApproved` ('Aprovado' / 'Approved'), `agentRejected` ('Rejeitado' / 'Rejected').

Após um write aprovado com sucesso, invalidar queries de releases/dashboard para a UI refletir:

```ts
import { useQueryClient } from '@tanstack/react-query';
// no runTurn, ao receber tool_message subsequente a uma aprovação:
queryClient.invalidateQueries();
```

(Invalidação ampla é aceitável aqui — app pessoal, dados pequenos.)

- [ ] **Step 3: Gates + deploy + verificação manual E2E**

`cd client && npm run lint && npm run build`; rebuild dos dois containers. Manual:
1. "lança R$ 1 de teste do agente hoje em Outros" → card aparece com preview correto → Aprovar → lançamento surge na tela de lançamentos (query invalidada).
2. Pedir para apagar o mesmo lançamento → card de delete → Aprovar → some.
3. Repetir criação e Rejeitar → nada gravado, agente responde reconhecendo.

- [ ] **Step 4: Commit**

```bash
git add -A client/src
git commit -m "feat: write confirmation cards in agent chat"
```

---

## Fase 4 — MCP

### Task 12: Endpoint MCP

**Files:**
- Modify: `server-node/package.json` (dep `@modelcontextprotocol/sdk`)
- Create: `server-node/src/services/mcp/mcp-server.ts`
- Create: `server-node/src/routes/mcp.routes.ts`
- Modify: `server-node/src/routes/index.ts` (`router.use('/mcp', mcpRoutes)`)
- Create: `server-node/src/services/mcp/__tests__/mcp-server.test.ts`

**Interfaces:**
- Consumes: `actionRegistry`, `zodToJsonSchema`.
- Produces: `createMcpServer(): Server` (SDK low-level); `POST /mcp` stateless (Streamable HTTP), GET/DELETE → 405.

- [ ] **Step 1: Instalar**

```bash
cd server-node && npm install @modelcontextprotocol/sdk
```

- [ ] **Step 2: Testes que falham** (usar `InMemoryTransport` do SDK)

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../financial-release.service', () => ({
  financialReleaseService: {
    findByTypeAndMonthAndYear: vi.fn(), findById: vi.fn(), searchByName: vi.fn(),
    getDashboardSummarySegmented: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(),
  },
}));
vi.mock('../../category.service', () => ({
  categoryService: { findAll: vi.fn().mockResolvedValue([]) },
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createMcpServer } from '../mcp-server';

async function connectedClient() {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createMcpServer();
  const client = new Client({ name: 'test', version: '1.0.0' });
  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);
  return client;
}

beforeEach(() => vi.clearAllMocks());

describe('MCP server', () => {
  it('lista as 8 tools com schemas', async () => {
    const client = await connectedClient();
    const { tools } = await client.listTools();
    expect(tools).toHaveLength(8);
    const names = tools.map((t) => t.name);
    expect(names).toContain('create_release');
    expect(tools.find((t) => t.name === 'list_releases')?.inputSchema).toMatchObject({
      type: 'object',
    });
  });

  it('executa uma tool e retorna JSON', async () => {
    const client = await connectedClient();
    const result = await client.callTool({ name: 'list_categories', arguments: {} });
    expect(result.isError).toBeFalsy();
  });

  it('input inválido vira isError sem lançar', async () => {
    const client = await connectedClient();
    const result = await client.callTool({
      name: 'get_release',
      arguments: { id: 'não-é-objectid' },
    });
    expect(result.isError).toBe(true);
  });
});
```

- [ ] **Step 3: Implementar**

`mcp-server.ts`:

```ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { actionRegistry } from '../../actions';

export function createMcpServer(): Server {
  const server = new Server(
    { name: 'financial-management', version: '1.0.0' },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: actionRegistry.list().map((a) => ({
      name: a.name,
      description: a.description,
      inputSchema: zodToJsonSchema(a.inputSchema) as {
        type: 'object';
        [key: string]: unknown;
      },
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    try {
      const result = await actionRegistry.execute(
        req.params.name,
        req.params.arguments ?? {},
      );
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: error instanceof Error ? error.message : 'Unknown error',
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}
```

`mcp.routes.ts` (stateless: server+transport novos por request):

```ts
import { Router, Request, Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpServer } from '../services/mcp/mcp-server';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    res.on('close', () => {
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  }),
);

const methodNotAllowed = (_req: Request, res: Response): void => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method not allowed' },
    id: null,
  });
};

router.get('/', methodNotAllowed);
router.delete('/', methodNotAllowed);

export default router;
```

Nota: se o tsc reclamar dos imports `.js` do SDK, checar `moduleResolution` no tsconfig (com `node`/`commonjs` os subpath exports do SDK funcionam; ajustar para `node16`+`module: node16` NÃO é necessário — o SDK tem builds CJS).

- [ ] **Step 4: Gates** — `npm test && npx tsc --noEmit` → verde.

- [ ] **Step 5: Deploy + smoke MCP**

```bash
docker compose build api-financial-management && docker compose up -d api-financial-management
curl -s -X POST http://localhost:3000/mcp \
  -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"curl","version":"0"}}}'
```

Expected: resposta JSON-RPC com serverInfo `financial-management`.

- [ ] **Step 6: Commit**

```bash
git add -A server-node
git commit -m "feat: expose actions as MCP server (streamable http)"
```

### Task 13: Conectar o Claude + encerramento

**Files:**
- Modify: `docs/superpowers/specs/2026-07-27-agent-native-integration-design.md` (marcar status implementado, registrar URL MCP)

- [ ] **Step 1: Conectar Claude Code (na máquina do Erick)**

```bash
claude mcp add --transport http financial-management http://100.115.143.64:3000/mcp
```

Testar numa sessão: "liste minhas categorias" → tools do app aparecem e executam. Para Claude Desktop: Settings → Connectors → Add custom connector com a mesma URL.

- [ ] **Step 2: Verificação E2E final (as 4 fases)**

1. Chat: pergunta analítica sobre dois meses (usa `get_dashboard_summary`).
2. Chat: criar + apagar lançamento de teste com confirmação.
3. MCP: mesma operação via Claude Code.
4. Conferir que REST/UI existentes seguem intactos (abrir dashboard e lançamentos).

- [ ] **Step 3: Commit final de docs**

```bash
git add docs
git commit -m "docs: mark agent integration spec as implemented"
```

---

## Self-Review (executado na escrita do plano)

- **Cobertura da spec:** actions (T2-T4), runtime+SSE (T5-T7), painel (T8), contexto de tela + agentModel (T7/T9), confirmação (T10-T11), MCP (T12), fases deployáveis (checkpoints em T4/T7-T9/T11/T12). ✔
- **Sem placeholders:** todo step de código tem o código; steps de UI descrevem elementos e chaves de tradução exatas. ✔
- **Consistência de tipos:** `AgentEvent`/`ChatMessage`/`OpenRouterToolCall` definidos em T5 e referenciados em T6-T8/T10-T11 com os mesmos nomes; `ActionRegistry.execute/list/toOpenAiTools` consistente entre T2, T6 e T12. ✔
