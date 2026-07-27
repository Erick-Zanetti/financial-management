import { ScreenContext } from './agent.types';

const MONTH_NAMES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
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
    'Pode formatar respostas em Markdown (negrito, listas, tabelas) — o chat renderiza. Prefira tabelas compactas; o painel é estreito.',
    'Antes de criar ou editar lançamentos, use list_categories para obter o id correto da categoria.',
    'Para criar, editar ou apagar, chame a tool diretamente assim que tiver todos os dados — NÃO peça permissão por texto antes: o app já mostra um card de confirmação com Aprovar/Rejeitar para CADA escrita, e pedir de novo duplicaria a pergunta.',
    'Operações em lote (ex.: apagar vários lançamentos) podem ir todas na mesma resposta, uma tool call por item — o usuário aprova cada card individualmente.',
    'Nunca invente ids ou valores; se faltar informação (ex.: dia, valor), aí sim pergunte.',
  ];
  if (screenContext) {
    const parts = [`rota ${screenContext.route}`];
    if (screenContext.month && screenContext.year) {
      parts.push(
        `vendo ${MONTH_NAMES[screenContext.month - 1]} de ${screenContext.year}`,
      );
    }
    lines.push(`Contexto da tela do usuário agora: ${parts.join(', ')}.`);
  }
  return lines.join('\n');
}
