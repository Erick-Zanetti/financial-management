# Snapshot mensal e aba "Comparação": design

**Data:** 2026-11-11 · **Status:** aprovado pelo Erick em 2026-11-11 (inclusive as decisões 1–8 abaixo)
**Mockup aprovado (opção A):** https://claude.ai/artifact/HubfatjMJ24um7L4rRnmrX

## Intenção

Todo dia 1 o app congela automaticamente os lançamentos do **mês seguinte**. Por exemplo, em 01/12/2026 ele congela Janeiro/2027. Enquanto o mês corrente anda, o cartão acumula e aparecem contas novas, e tudo isso cai no mês seguinte. Durante o próprio mês, conforme o Erick ajusta as coisas, os valores mudam de novo. Ele quer olhar a qualquer momento o mês "real" (a tela de Lançamentos de hoje) lado a lado com o retrato do dia 1 e ver, linha a linha, o que mudou: quanto o cartão cresceu, que contas surgiram, o que sumiu e quanto o saldo andou.

## Metas

1. Captura automática, sem ação manual: às 00:00 de cada dia 1 (horário de Brasília), um snapshot do mês M+1.
2. Uma aba nova, **"Comparação"**, ao lado de "Linha do tempo", com duas colunas:
   - **Atual** (esquerda): reaproveita os componentes da aba Lançamentos (cards de resumo + listas de Receitas/Despesas), com cada linha marcada como *alterado* (laranja, com a diferença) ou *novo* (azul). Os cards mostram o delta contra o snapshot.
   - **Snapshot** (direita): os mesmos cards e listas, como estavam no momento da captura. É só leitura. As linhas removidas desde então aparecem riscadas, com a tag REMOVIDO.
   - No celular (< `lg`), as colunas ficam uma embaixo da outra (Atual primeiro).
3. Dezembro/2026 ganha um snapshot importado do backup restic de **01/11/2026 02:09 BRT** (`fc0657ba`), que é quase exatamente o "dia 1". A partir de Janeiro/2027 tudo vem da captura automática.

## Não-metas

- **Status pago/recebido não entra.** Pagar ou receber não conta como mudança, e a coluna de status (checkbox) não aparece em nenhuma das duas colunas dessa aba. *(decisão do Erick)*
- Os gráficos da parte de baixo da tela de Lançamentos (curva acumulada e categorias do mês) ficam de fora. *(decisão minha)*
- Sem snapshots manuais e sem vários snapshots por mês. Cada mês tem no máximo um.
- Sem comparar snapshot com snapshot, nem histórico de versões.

## Anti-metas (o que faria a feature falhar mesmo "funcionando")

- Um snapshot que muda depois de tirado. Ele precisa ser imutável: renomear ou apagar categoria, editar ou apagar lançamento, nada disso pode alterar o que o snapshot mostra.
- Renomear um lançamento ("Vigil (3663)" → "Vigil (3443)") aparecer como removido + novo.
- Marcar uma conta como paga fazer a despesa "cair" na comparação.
- O servidor estar fora do ar à meia-noite do dia 1 e o mês ficar sem snapshot sem ninguém perceber.

## Comportamento

### Captura

- **Quando:** dia 1, 00:00 America/Sao_Paulo (03:00 UTC). O container roda em UTC, então o cálculo de data tem que usar explicitamente o fuso `America/Sao_Paulo`.
- **O quê:** todos os `financialreleases` com `{year, month}` = mês seguinte ao dia 1 corrente, dos dois tipos (R e E).
- **Como agenda:** dentro do processo da API, sem dependência nova:
  - no boot (depois de `runMigrations()`) e depois a cada 15 min, roda `ensureCurrentSnapshot()`;
  - `ensureCurrentSnapshot()` calcula o "agora" em BRT. Se o snapshot do mês M+1 ainda não existe, cria. É idempotente: o índice único em `{year, month}` garante um por mês, e um erro de chave duplicada é tratado como "já existe".
  - **Catch-up:** se a API ficou fora no dia 1 e voltou no dia 3, o snapshot é criado no dia 3. `capturedAt` registra o momento real, e a UI mostra essa data ("Snapshot · 03/12 08:14"), então o atraso fica visível. Não tem como reconstruir o dia 1 retroativamente pela API (o backup é o plano B manual, igual ao de Dezembro).
- **Início:** o job só cria snapshots de mês ≥ Janeiro/2027. Dezembro/2026 entra pela importação. Assim, se a feature subir antes de 01/12, o job não tira um "Dezembro" atrasado por cima do importado. *(decisão minha)*
- **Falhas:** se `ensureCurrentSnapshot()` lançar erro, loga (`logger.error`) e tenta de novo no próximo ciclo de 15 min. Não tem alerta nem painel no Grafana. O sinal visível é a aba mostrar "sem snapshot" ou uma data de captura atrasada. *(decisão minha; dá pra adicionar uma métrica em `/metrics` depois, se fizer falta)*
- **Mês vazio:** se M+1 não tiver nenhum lançamento no dia 1, mesmo assim cria o snapshot com listas vazias. Tudo que surgir depois aparece como novo.

### Comparação (casamento linha a linha)

- **Chave:** o `_id` do lançamento. A mesma `id` nos dois lados é a mesma linha.
  - Só no Atual → **novo**.
  - Só no Snapshot → **removido** (aparece riscado na coluna Snapshot).
  - Nos dois, com `value`, `name`, `day` ou `category` diferente → **alterado**. A tag mostra a diferença de valor quando o valor mudou (`+3.823,11`), ou só "ALTERADO" quando mudou só nome, dia ou categoria.
  - Nos dois, com esses campos iguais → sem marcação. `settled`, `observations`, `subcategories` e `aiReport` são ignorados.
- **Cards:** os totais dos dois lados comparam o **mês inteiro** (todas as linhas, pagas ou não), igual ao `comparisonValue` que o `SummaryCard` já tem. Saldo = Receitas − Despesas do mês, **sem** somar o "Saldo Atual" da conta (`currentBalance`). Isso deixa as duas colunas comparáveis em qualquer época do mês. *(decisão minha; difere da aba Lançamentos, que no mês corrente soma `currentBalance` e só conta o que não foi pago)*
- **Delta nos cards (coluna Atual):** `atual − snapshot`. A cor indica se ficou pior ou melhor: despesa subindo, receita caindo ou saldo caindo saem em laranja; o contrário sai em verde.
- **Mudança de tipo ou de mês com o mesmo `_id`:** o diff é feito por lista. Um lançamento que vira de R para E aparece como removido em Receitas e novo em Despesas. Um que muda de mês aparece como removido no mês original. Isso é raro, e não vale complicar o diff por causa disso. *(decisão minha)*
- **Ordenação:** igual à aba Lançamentos (por dia). Na coluna Snapshot, a linha removida fica na posição original.

### Estados da aba

- Mês sem snapshot (qualquer mês antes de Dez/2026, ou um mês futuro que ainda não chegou no dia 1): a aba mostra um aviso, "Ainda não há snapshot para Fev/2027 — ele é tirado em 01/01/2027." Para meses antigos: "Snapshots começam em Dez/2026."
- A coluna Atual continua permitindo editar e adicionar como na aba Lançamentos (reaproveita o `ReleaseList`). A comparação é recalculada quando os dados do React Query invalidam. *(decisão minha, a partir do pedido "replicando exatamente a aba de lançamentos")*

## Modelo de dados

Coleção nova **`monthsnapshots`** (um documento por mês):

```
{
  _id,
  year: Number, month: Number,          // mês congelado (ex: 2027, 1)
  capturedAt: Date,                     // momento real da captura (UTC)
  source: 'scheduled' | 'backup-import',
  releases: [{                          // cópia fiel no momento da captura
    releaseId: ObjectId,                // _id original, chave do diff
    name, value, type, day,
    categoryId: ObjectId, categoryName: String,   // nome denormalizado: sobrevive a renomear/apagar categoria
    person, settled, observations,
    subcategories: [{ categoryId, categoryName, value }]
  }]
}
índice único { year: 1, month: 1 }
```

Copiar para dentro do documento (em vez de guardar só os ids) é o que torna o snapshot imutável. O volume é pequeno, cerca de 12 linhas por mês.

Nenhuma coleção existente muda. Não tem migração de dados.

## API

- `GET /financial-release/snapshots/:year/:month` → o snapshot, ou 404. A rota pode ficar em outro arquivo de rotas se o builder preferir. O client já fala com `/api/financial-release`, então ficar sob esse prefixo evita mexer no proxy do Next.
- Sem endpoint de criação ou de deleção exposto. A criação é só pelo job e pelo script de importação.

O diff é calculado **no client**, numa função pura (`diffSnapshot(snapshot, currentReleases)`), porque o lado Atual já vem do React Query que a aba Lançamentos usa, e a edição precisa refletir na hora.

## Importação de Dezembro/2026

- O dump está salvo em `backups/financial-management-2026-11-01.archive.gz` (12 KB, gitignored, mesma pasta do `db-coldcopy-20260803`). Assim a importação não depende mais do retention do restic (que derruba o `fc0657ba` lá pelo início de Dezembro) e pode rodar como uma tarefa normal da feature. A origem é `restic dump fc0657ba /var/backups/vps/staging/apps/financial-management/db/financial-management.archive.gz`.
- Processo: restaurar o dump num Mongo descartável (`docker run --rm mongo:7.0.5`, como foi feito na verificação), ler os `financialreleases` de `{year:2026, month:12}` e os nomes de categoria, e gravar um `monthsnapshots` com `source:'backup-import'` e `capturedAt = 2026-11-01T05:09:47Z`. Pode ser um script one-shot em `server-node/scripts/` ou um passo manual com mongosh. Não é migração de boot.
- Conteúdo esperado (verificado em 2026-11-11): 3 receitas = R$ 37.916,70, 9 despesas = R$ 28.455,11.
- Antes de gravar em produção: backup rápido da coleção via mongosh (padrão do runbook).

## Restrições

- Stack existente: Next.js client + Express/Mongoose `server-node`, MongoDB 7. Sem dependência nova para agendamento.
- Gates: server `npm test` (vitest) + `npx tsc --noEmit`; client `npm run lint && npm run build`.
- TDD: testes primeiro para `diffSnapshot`, para o cálculo de "qual mês capturar agora" (virada de mês e de ano, fuso BRT vs UTC, por exemplo 2026-12-01T02:59Z ainda é 30/11 em BRT) e para a idempotência de `ensureCurrentSnapshot`.
- `/opt/services/CLAUDE.md`: o job roda dentro do container da API (não é cron/timer do host). Mesmo assim, registrar o agendamento em `VPS-SETUP-GUIDE.md` §1.4 no mesmo commit, e confirmar que `monthsnapshots` entra no backup (o manifesto faz dump do banco inteiro, então já entra).

## Fica a critério do builder

- Como o `ReleaseList` passa a aceitar as marcações de diff e esconder a coluna de status (props novas, componente wrapper etc.), desde que a aba Lançamentos continue idêntica.
- Nome do enum/tab (`'comparison'` no `ViewTab`) e a chave de tradução.
- Estrutura de arquivos no server (service/model/job).

## Decisões tomadas por mim (Claude), para o Erick conferir

1. Saldo da comparação = Receitas − Despesas do mês inteiro, sem `currentBalance` e sem filtrar pagos.
2. Gráficos de baixo ficam de fora da aba.
3. "Alterado" considera nome, valor, dia e categoria. Observações e subcategorias não contam.
4. O job não cria snapshot de mês anterior a Jan/2027 (Dezembro vem do backup).
5. Catch-up tardio cria o snapshot com a data real de captura, que aparece na UI.
6. A coluna Atual continua editável.
7. Uma linha que muda de tipo (R↔E) ou de mês aparece como removida + nova, sem tratamento especial.
8. Sem alerta para falha de captura. Fica só o log e o estado visível na aba.
