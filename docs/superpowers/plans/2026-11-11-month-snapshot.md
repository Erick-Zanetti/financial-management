# Snapshot mensal + aba "Comparação": plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Todo dia 1 (BRT), congelar automaticamente os lançamentos do mês seguinte e mostrar numa aba "Comparação" o mês atual lado a lado com esse snapshot, com diff linha a linha.

**Architecture:** Coleção nova `monthsnapshots` (um doc por mês, com cópia fiel das linhas). Um scheduler dentro do processo da API chama `ensureCurrentSnapshot()` no boot e a cada 15 min, de forma idempotente. A rota `GET /financial-release/snapshots/:year/:month` entrega o snapshot. O client calcula o diff numa função pura e renderiza duas colunas reaproveitando `SummaryCard` e `ReleaseList`. Dezembro/2026 vem de um dump do backup de 01/11.

**Tech Stack:** Express + Mongoose 8 + vitest (server-node), Next.js 14 + React Query + Tailwind/shadcn (client), MongoDB 7.0.5.

**Spec:** `docs/superpowers/specs/2026-11-11-month-snapshot-design.md` (leia junto; as decisões 1–8 de lá estão aprovadas).

## Global Constraints

- Fuso da captura: `America/Sao_Paulo`. O container da API roda em UTC (`TZ` vazio), então o código nunca pode depender do fuso do processo.
- Primeiro mês com captura automática: **Janeiro/2027**. Antes disso o job retorna `'skipped'`.
- Intervalo do scheduler: 15 min (`15 * 60 * 1000`), e roda uma vez no boot logo depois de `runMigrations()`.
- Índice único `{ year: 1, month: 1 }` em `monthsnapshots`. Um erro de chave duplicada (código `11000`) conta como "já existe".
- "Alterado" = `name`, `value`, `day` ou `category.id` diferentes. `settled`, `observations`, `subcategories` e `aiReport` são ignorados.
- Totais da comparação = soma de **todas** as linhas do mês (pagas ou não), e Saldo = Receitas − Despesas, **sem** `currentBalance`.
- Diferenças em dinheiro arredondadas para centavos: `Math.round(x * 100) / 100`.
- Sem dependência de runtime nova. Única dependência nova: `vitest` como devDependency do client (é ela que dá teste à função pura de diff).
- Na aba Comparação não aparece nada de status pago/recebido: sem coluna de status, sem linha riscada por estar paga.
- A aba Lançamentos e a Linha do tempo continuam com comportamento idêntico ao de hoje.
- Gates: server `npm test` + `npx tsc --noEmit`; client `npm test` + `npm run lint` + `npm run build`.
- Git: o repo está em `main`, e **push na main dispara deploy** (`.github/workflows/deploy.yml`). Antes do primeiro commit, pergunte ao Erick se quer commit direto na `main` ou uma branch nova (regra global dele). Commits seguem conventional commits, sem co-author.
- Nunca logar o documento de `system-config` (tem token em texto plano).

## Review Focus

1. **Virada de dia em BRT vs UTC:** `2026-12-01T02:59:59Z` ainda é 30/11 em BRT, então o alvo é Dez/2026 (skipped). Já `2026-12-01T03:00:00Z` é 01/12, e o alvo é Jan/2027. Testado no Task 1.
2. **Virada de ano:** em Dezembro/2027 o alvo é Janeiro/2028. Testado no Task 1.
3. **Arredondamento de float no delta:** `5275.15 − 1452.04` tem que dar `3823.11` exato, não `3823.1100000000006`. Testado no Task 4.
4. **Duas instâncias/ciclos correndo ao mesmo tempo:** o `create` concorrente bate no índice único, e a segunda chamada tem que retornar `'exists'`, sem lançar erro. Testado no Task 2.
5. **Mês sem snapshot / 404:** o hook devolve `null` (não `error`), e a aba mostra o texto certo para "antes de Dez/2026" e para "ainda não tirado". Testado no Task 4 (função de texto) e verificado no Task 7.

---

### Task 1: Modelo `MonthSnapshot` e cálculo do mês-alvo

**Files:**
- Create: `server-node/src/models/month-snapshot.model.ts`
- Create: `server-node/src/services/month-snapshot/snapshot-target.ts`
- Test: `server-node/src/services/month-snapshot/__tests__/snapshot-target.test.ts`

**Interfaces:**
- Produces:
  - `MonthSnapshot` (Mongoose model, coleção `monthsnapshots`), com o schema exatamente como em "Modelo de dados" do spec: `releases[]` com `releaseId: ObjectId`, `name`, `value`, `type`, `day`, `categoryId`, `categoryName`, `person?`, `settled`, `observations?`, `subcategories: [{ categoryId, categoryName, value, _id: false }]`, mais `capturedAt: Date` e `source: 'scheduled' | 'backup-import'`. Índice único `{year:1, month:1}`. `toJSON` igual ao de `financial-release.model.ts` (`id` string, sem `_id`/`__v`).
  - `type YearMonth = { year: number; month: number }`
  - `snapshotTargetFor(now: Date): YearMonth`: o mês seguinte ao mês corrente **em BRT**.
  - `isBeforeFirstScheduled(target: YearMonth): boolean`: true se `target < {2027, 1}`.
  - `FIRST_SCHEDULED_SNAPSHOT: YearMonth = { year: 2027, month: 1 }`

- [ ] **Step 1: Escrever os testes que falham**

```ts
describe('snapshotTargetFor', () => {
  it('ainda é 30/11 em BRT às 02:59:59Z de 01/12', () =>
    expect(snapshotTargetFor(new Date('2026-12-01T02:59:59Z'))).toEqual({ year: 2026, month: 12 }));
  it('vira 01/12 em BRT às 03:00Z', () =>
    expect(snapshotTargetFor(new Date('2026-12-01T03:00:00Z'))).toEqual({ year: 2027, month: 1 }));
  it('vira o ano em dezembro', () =>
    expect(snapshotTargetFor(new Date('2027-12-15T12:00:00Z'))).toEqual({ year: 2028, month: 1 }));
  it('meio do mês aponta para o mês seguinte (catch-up)', () =>
    expect(snapshotTargetFor(new Date('2027-02-10T12:00:00Z'))).toEqual({ year: 2027, month: 3 }));
});
describe('isBeforeFirstScheduled', () => {
  it('Dez/2026 é antes', () => expect(isBeforeFirstScheduled({ year: 2026, month: 12 })).toBe(true));
  it('Jan/2027 não é', () => expect(isBeforeFirstScheduled({ year: 2027, month: 1 })).toBe(false));
});
```

- [ ] **Step 2: Rodar e ver falhar:** `cd server-node && npx vitest run src/services/month-snapshot`. Esperado: FAIL (módulo não existe).
- [ ] **Step 3: Implementar.** Pegue ano e mês em BRT com `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: 'numeric' }).formatToParts(now)`. O Node 20 vem com full-ICU. Crie também o model.
- [ ] **Step 4: Rodar e ver passar:** mesmo comando, PASS. Rode também `npx tsc --noEmit` (limpo).
- [ ] **Step 5: Commit:** `feat: add month snapshot model and BRT target month calc`

---

### Task 2: `ensureCurrentSnapshot()` (captura idempotente)

**Files:**
- Create: `server-node/src/services/month-snapshot/month-snapshot.service.ts`
- Test: `server-node/src/services/month-snapshot/__tests__/month-snapshot.service.test.ts`

**Interfaces:**
- Consumes: `MonthSnapshot`, `snapshotTargetFor`, `isBeforeFirstScheduled` (Task 1); `FinancialRelease` model.
- Produces:
  - `toSnapshotRelease(doc): SnapshotReleaseInput`: recebe um release lean com `category` e `subcategories.category` populados (`{_id, name}`) e mapeia para o subdocumento. Se a categoria vier `null` (apagada), `categoryName = ''`.
  - `ensureCurrentSnapshot(now?: Date): Promise<'created' | 'exists' | 'skipped'>`
  - `findSnapshot(year: number, month: number): Promise<MonthSnapshotDocument | null>`

Fluxo de `ensureCurrentSnapshot`: alvo = `snapshotTargetFor(now)` → se `isBeforeFirstScheduled`, retorna `'skipped'` → se `MonthSnapshot.exists({year, month})`, retorna `'exists'` → senão, `FinancialRelease.find({year, month}).populate('category','name').populate('subcategories.category','name').lean()` → `MonthSnapshot.create({ year, month, capturedAt: now, source: 'scheduled', releases })` → `'created'`. Se o `create` lançar erro com `code === 11000`, retorna `'exists'`. Outros erros sobem.

- [ ] **Step 1: Escrever os testes que falham** (mock dos models com `vi.mock`, no mesmo padrão de `src/actions/__tests__/read-actions.test.ts`):
  - `'skipped'` para `now = 2026-11-20T12:00Z` e nenhuma chamada a `MonthSnapshot.create`.
  - `'exists'` quando `exists` resolve um doc, sem `create`.
  - `'created'` para `now = 2026-12-01T03:00Z`: `FinancialRelease.find` chamado com `{year: 2027, month: 1}`, e `create` com `source: 'scheduled'`, `capturedAt: now` e releases mapeados (um caso com `categoryName: 'Cartões'` e um com categoria `null` → `''`).
  - `'created'` com zero releases: `create` recebe `releases: []`.
  - `'exists'` quando `create` rejeita com `Object.assign(new Error('dup'), { code: 11000 })`.
  - Lança erro quando `create` rejeita com outro erro.
- [ ] **Step 2: Rodar e ver falhar:** `npx vitest run src/services/month-snapshot`. Esperado: FAIL.
- [ ] **Step 3: Implementar** as três funções no arquivo do service.
- [ ] **Step 4: Rodar e ver passar.** Depois `npm test` (suíte toda) + `npx tsc --noEmit`.
- [ ] **Step 5: Commit:** `feat: capture next-month snapshot idempotently`

---

### Task 3: Scheduler no boot + rota de leitura

**Files:**
- Create: `server-node/src/services/month-snapshot/snapshot-scheduler.ts`
- Modify: `server-node/src/server.ts` (depois de `await runMigrations()`)
- Modify: `server-node/src/controllers/financial-release.controller.ts` (método novo)
- Modify: `server-node/src/routes/financial-release.routes.ts` (rota nova com bloco swagger no padrão do arquivo)
- Test: `server-node/src/services/month-snapshot/__tests__/snapshot-scheduler.test.ts`

**Interfaces:**
- Consumes: `ensureCurrentSnapshot`, `findSnapshot` (Task 2).
- Produces:
  - `startSnapshotScheduler(intervalMs = 15 * 60 * 1000): NodeJS.Timeout`: chama `ensureCurrentSnapshot()` na hora e depois a cada `intervalMs`. Cada execução fica num try/catch: `'created'` → `logger.info('Month snapshot created …')`; erro → `logger.error('Month snapshot failed', err)`, e o processo **não** cai. O timer leva `.unref()`.
  - `GET /financial-release/snapshots/:year/:month` → 200 com o snapshot (JSON do model) | 404 `{ message: 'Snapshot not found' }` | 400 se `year` não for inteiro ou `month` não estiver em 1..12.

- [ ] **Step 1: Escrever os testes que falham** (`vi.useFakeTimers()`, mock do service e do logger):
  - chama `ensureCurrentSnapshot` 1× na hora e 2× depois de `advanceTimersByTimeAsync(15 * 60 * 1000)`;
  - quando `ensureCurrentSnapshot` rejeita, chama `logger.error` e o próximo tick roda de novo.
- [ ] **Step 2: Rodar e ver falhar.**
- [ ] **Step 3: Implementar** o scheduler, plugar em `server.ts`, e criar controller + rota (validar params no controller; seguir `findById` como modelo do 404).
- [ ] **Step 4: Rodar e ver passar:** `npm test` + `npx tsc --noEmit`.
- [ ] **Step 5: Commit:** `feat: schedule month snapshots and expose read route`

---

### Task 4: Client: infraestrutura de teste, tipos e diff puro

**Files:**
- Modify: `client/package.json` (devDependency `vitest`, script `"test": "vitest run"`)
- Create: `client/vitest.config.ts` (environment `node`, alias `@` → `./src`, include `src/**/*.test.ts`)
- Modify: `client/src/types/financial-release.ts` (tipos novos)
- Create: `client/src/lib/snapshot-diff.ts`
- Test: `client/src/lib/__tests__/snapshot-diff.test.ts`

**Interfaces:**
- Produces (em `types/financial-release.ts`):
  ```ts
  export interface SnapshotRelease { releaseId: string; name: string; value: number; type: FinancialReleaseType; day: number;
    categoryId: string; categoryName: string; person?: string; settled: boolean; observations?: string;
    subcategories: { categoryId: string; categoryName: string; value: number }[] }
  export interface MonthSnapshot { id: string; year: number; month: number; capturedAt: string;
    source: 'scheduled' | 'backup-import'; releases: SnapshotRelease[] }
  ```
- Produces (em `lib/snapshot-diff.ts`):
  ```ts
  export type RowMark = { kind: 'new' } | { kind: 'changed'; valueDelta: number } | { kind: 'removed' };
  export interface ReleaseDiff { currentMarks: Map<string, RowMark>; snapshotMarks: Map<string, RowMark>;
    currentTotal: number; snapshotTotal: number; delta: number }
  export function snapshotToReleases(s: MonthSnapshot, type: FinancialReleaseType): FinancialRelease[]
  export function diffReleases(snapshot: FinancialRelease[], current: FinancialRelease[]): ReleaseDiff
  export function noSnapshotMessage(year: number, month: number): string
  ```
  - `snapshotToReleases`: `id = releaseId`, `category = { id: categoryId, name: categoryName }`, `year`/`month` do snapshot, `subcategories` mapeadas para `{ category: {id, name}, value }`, ordenado por `day`.
  - Chave das marcas: `release.id`. O id só no current vira `new` em `currentMarks`. O id só no snapshot vira `removed` em `snapshotMarks`. O id nos dois, com campo comparado diferente, vira `changed` em `currentMarks`, com `valueDelta = round2(current.value − snapshot.value)` (pode ser 0).
  - `noSnapshotMessage`: se `{year, month} < {2026, 12}`, devolve `'Snapshots começam em Dez/2026.'`; senão, `` `Ainda não há snapshot para ${Mmm}/${yyyy} — ele é tirado em 01/${MM do mês anterior}/${yyyy do mês anterior}.` `` (ex.: Fev/2027 → `01/01/2027`; Jan/2027 → `01/12/2026`). Use as abreviações de mês que `lib/months.ts` já tiver.

- [ ] **Step 1: Instalar o vitest** (`cd client && npm i -D vitest`), criar o config e o script.
- [ ] **Step 2: Escrever os testes que falham** usando os dados reais de Dezembro/2026 (do spec/mockup):
  - C6 `1452.04 → 5275.15`: `changed` com `valueDelta === 3823.11` (igualdade exata).
  - Cresol (só no current, `3618.52`): `new`.
  - Faculdade Julia (só no snapshot, `906`): `removed` em `snapshotMarks`, e ausente de `currentMarks`.
  - Vigil renomeado `'Vigil (3663)' → 'Vigil (3443)'`, mesmo id: `changed`, não new/removed.
  - Linha igual exceto `settled: false → true`: **sem** marca.
  - Linha com só `day` mudado: `changed` com `valueDelta === 0`.
  - Despesas completas de Dezembro: `snapshotTotal === 28455.11`, `currentTotal === 35127.06`, `delta === 6671.95`.
  - `snapshotToReleases` filtra por tipo e ordena por dia.
  - `noSnapshotMessage(2026, 11)` → `'Snapshots começam em Dez/2026.'`; `noSnapshotMessage(2027, 2)` contém `'01/01/2027'`; `noSnapshotMessage(2027, 1)` contém `'01/12/2026'`.
- [ ] **Step 3: Rodar e ver falhar:** `npm test`. Esperado: FAIL.
- [ ] **Step 4: Implementar** `snapshot-diff.ts` e os tipos.
- [ ] **Step 5: Rodar e ver passar:** `npm test` + `npm run lint`.
- [ ] **Step 6: Commit:** `feat: add client snapshot diff with vitest`

---

### Task 5: Client: API, hook e props de comparação nos componentes compartilhados

**Files:**
- Modify: `client/src/lib/api/releases.ts` (`getSnapshot`)
- Modify: `client/src/hooks/use-releases.ts` (`useMonthSnapshot`)
- Modify: `client/src/components/releases/release-list.tsx`
- Modify: `client/src/components/dashboard/summary-card.tsx`

**Interfaces:**
- Consumes: `MonthSnapshot`, `RowMark` (Task 4).
- Produces:
  - `releasesApi.getSnapshot(year, month) → apiClient.get<MonthSnapshot>(`/snapshots/${year}/${month}`)`
  - `useMonthSnapshot(month: number, year: number)`: `queryKey: ['month-snapshot', year, month]`, devolve `MonthSnapshot | null`. Erro com `status === 404` vira `null`; outros erros continuam sendo erro do React Query. `retry: false` para 404.
  - `ReleaseList` ganha a prop opcional `comparison?: { marks: Map<string, RowMark>; readOnly: boolean }`. Quando presente:
    - sem coluna de status;
    - nenhuma linha riscada/esmaecida por `settled`;
    - o gráfico de barra/pizza do card usa todas as linhas (como se `allMonthSettled` fosse true);
    - cada linha com marca ganha fundo e tag: `new` → azul + `NOVO`; `changed` → laranja + `+3.823,11` / `−748,80`, ou `ALTERADO` quando `valueDelta === 0`; `removed` → riscado cinza + `REMOVIDO`;
    - com `readOnly`, somem o botão Adicionar e a coluna de ações (editar/copiar/excluir).
    - Sem `comparison`, o componente fica **idêntico** ao de hoje.
  - `SummaryCard` ganha a prop opcional `snapshotDelta?: number`. Quando definida, substitui o chip de "% vs. mês anterior" por `±R$ x vs. snapshot` (formatado com `formatCurrency`). A cor é laranja quando piora (despesa subiu; receita ou saldo caiu) e verde quando melhora. Chip omitido quando `delta === 0`.

- [ ] **Step 1: Implementar** API, hook e as duas props, com tokens de cor do Tailwind já usados no app (`orange-*`, `blue-*`, `muted-foreground`) em light e dark.
- [ ] **Step 2: Verificar que nada regrediu:** `npm run lint && npm run build`. Abra a aba Lançamentos (dev ou build) e confirme que está visualmente igual (status, riscado dos pagos, botões).
- [ ] **Step 3: Commit:** `feat: add comparison mode to release list and summary card`

---

### Task 6: Client: aba "Comparação"

**Files:**
- Create: `client/src/components/comparison/comparison-view.tsx`
- Modify: `client/src/providers/month-provider.tsx` (`ViewTab = 'releases' | 'timeline' | 'comparison'`)
- Modify: `client/src/components/layout/month-navigation.tsx` (terceiro `TabsTrigger`, larguras `w-1/3`)
- Modify: `client/src/app/lancamentos/page.tsx` (render `ComparisonView` quando `activeTab === 'comparison'`)
- Modify: `client/src/lib/translations.ts` (chaves `comparison: 'Comparação'` / `'Comparison'`, `comparisonCurrent: 'Atual · hoje'`, `comparisonSnapshot: 'Snapshot'`, `readOnly: 'somente leitura'`)

**Interfaces:**
- Consumes: `useExpenses`, `useReceipts`, `useMonthSnapshot`, `snapshotToReleases`, `diffReleases`, `noSnapshotMessage`, `ReleaseList.comparison`, `SummaryCard.snapshotDelta`.
- Produces: `ComparisonView({ month, year }: { month: number; year: number })`.

Layout (mockup opção A): `grid grid-cols-1 lg:grid-cols-2 gap-6`, com Atual à esquerda (primeiro no celular) e Snapshot à direita. O cabeçalho da coluna Snapshot mostra `Snapshot · dd/MM HH:mm` de `capturedAt`, formatado em `America/Sao_Paulo`, mais "somente leitura". Cada coluna tem 3 `SummaryCard` (Receitas, Despesas, Saldo), com `snapshotDelta` só na coluna Atual, e depois `ReleaseList` de Receitas e de Despesas. Na coluna Atual: `comparison={{ marks: diff.currentMarks, readOnly: false }}`. Na coluna Snapshot: `comparison={{ marks: diff.snapshotMarks, readOnly: true }}`. Sem snapshot (`null`): um card centralizado com `noSnapshotMessage(year, month)`. Durante o carregamento, o skeleton que `SummaryCard` e `ReleaseList` já têm.

- [ ] **Step 1: Implementar** o componente e a navegação.
- [ ] **Step 2: Verificar:** `npm test && npm run lint && npm run build`.
- [ ] **Step 3: Commit:** `feat: add comparison tab with side-by-side snapshot view`

---

### Task 7: Importar Dezembro/2026, deploy e verificação ponta a ponta

**Files:**
- Create: `server-node/scripts/build-snapshot-from-dump.js` (script mongosh que roda no Mongo **descartável**)
- Modify (outro repo, `/opt/services`): `VPS-SETUP-GUIDE.md` §1.2 (nota da app financial-management: job interno de snapshot dia 1 00:00 BRT, coleção `monthsnapshots`) e §1.4 (agendamento interno da API). Commit separado no repo `vps-apps-home`.

O script recebe `year`/`month`/`capturedAt` por `--eval` e imprime em EJSON um documento `monthsnapshots` com `source: 'backup-import'`, montado com `$lookup` em `categories` para pegar `categoryName` (e o das subcategorias). O mapeamento de campos tem que ser idêntico ao `toSnapshotRelease` do Task 2.

- [ ] **Step 1: Gerar o doc a partir do dump:**
  ```bash
  docker run -d --rm --name fm-snapimport -v "$PWD/backups:/bk" -v "$PWD/server-node/scripts:/s" mongo:7.0.5
  docker exec fm-snapimport mongorestore --quiet --gzip --archive=/bk/financial-management-2026-11-01.archive.gz
  docker exec fm-snapimport mongosh --quiet financial-management --eval 'var Y=2026,M=12,CAP="2026-11-01T05:09:47Z"' /s/build-snapshot-from-dump.js > <scratchpad>/snapshot-2026-12.json
  docker stop fm-snapimport
  ```
  Esperado no JSON: 12 linhas, R = 3 / `37916.70`, E = 9 / `28455.11`, e nenhum `categoryName` vazio.
- [ ] **Step 2: Deploy do código (Tasks 1–6).** Push na main, ou `docker compose build api-financial-management app-financial-management && docker compose up -d …` conforme o runbook. Confirme no log da API que o scheduler rodou e retornou `skipped` (em Nov/2026 o alvo é Dez/2026).
- [ ] **Step 3: PEDIR CONFIRMAÇÃO ao Erick** antes de gravar em produção. Depois, backup da coleção (vazia, mas segue o padrão do runbook) e insert:
  `docker exec -i financial-management_mongodb mongosh --quiet financial-management --eval 'db.monthsnapshots.insertOne(EJSON.parse(require("fs").readFileSync(0,"utf8")))' < snapshot-2026-12.json` (ou equivalente).
- [ ] **Step 4: Verificar a rota:** `docker exec financial-management_api node -e 'fetch("http://localhost:3000/financial-release/snapshots/2026/12").then(r=>r.json()).then(j=>console.log(j.releases.length, j.source))'` deve imprimir `12 backup-import`. E `/snapshots/2027/1` deve dar 404.
- [ ] **Step 5: Verificar na tela:** aba Comparação em Dez/2026 mostra C6 `+3.823,11`, Cresol NOVO, Faculdade Julia REMOVIDO e card Despesas `+R$ 6.671,95`. Nov/2026 mostra "Snapshots começam em Dez/2026.", e Jan/2027 mostra "…tirado em 01/12/2026."
- [ ] **Step 6: Commits:** `feat: add backup-to-snapshot import script` (este repo) e `docs: document financial-management month snapshot job` (repo `/opt/services`).
