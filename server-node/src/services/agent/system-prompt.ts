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
    'Antes de criar ou editar lançamentos, use list_categories para obter o id correto da categoria.',
    'Ações de escrita (criar/editar/apagar) exigem aprovação do usuário: proponha UMA ação de escrita por vez e aguarde.',
    'Nunca invente ids ou valores; se faltar informação, pergunte.',
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
