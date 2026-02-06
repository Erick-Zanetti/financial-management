export const pt = {
  // Header
  appTitle: 'Controle Financeiro',
  toggleTheme: 'Alternar tema',
  settings: 'Configurações',

  // Navigation
  releases: 'Lançamentos',
  timeline: 'Linha do tempo',

  // Dashboard
  balance: 'Saldo',
  receipts: 'Receitas',
  expenses: 'Despesas',
  receiptsVsExpenses: 'Receitas vs Despesas',
  summary: 'Resumo',

  // Table
  day: 'Dia',
  description: 'Descrição',
  person: 'Pessoa',
  value: 'Valor',
  total: 'Total',
  noData: 'Sem dados',
  add: 'Adicionar',

  // Person filter
  all: 'Todos',
  filterByPerson: 'Filtrar por pessoa',

  // Person selection modal
  whoAreYou: 'Quem é você?',
  personSelectionDescription: 'Escolha para pré-filtrar os dados do dashboard.',

  // Release dialog
  edit: 'Editar',
  selectPerson: 'Selecione uma pessoa',
  selectDay: 'Selecione o dia',
  dayPrefix: 'Dia',
  descriptionPlaceholder: 'Descrição',
  descriptionRequired: 'Descrição é obrigatória',
  maxChars: 'Máximo 30 caracteres',
  valueMustBePositive: 'Valor deve ser maior que zero',
  invalidDay: 'Dia inválido',
  personRequired: 'Pessoa é obrigatória',
  cancel: 'Cancelar',
  save: 'Salvar',
  saving: 'Salvando...',
  releaseUpdated: 'Lançamento atualizado com sucesso!',
  releaseSaved: 'Lançamento salvo com sucesso!',
  saveFailed: 'Falha ao salvar. Tente novamente.',

  // Delete dialog
  confirmDelete: 'Confirmar exclusão',
  deleteConfirmation: 'Deseja realmente remover esse lançamento?',
  no: 'Não',
  yes: 'Sim',
  removing: 'Removendo...',
  releaseDeleted: 'Lançamento removido com sucesso!',
  deleteFailed: 'Falha ao remover. Tente novamente.',

  // Timeline
  noReleasesThisMonth: 'Nenhum lançamento para este mês',

  // Settings
  language: 'Idioma',
  currency: 'Moeda',
  portuguese: 'Português',
  english: 'Inglês',

  // Months
  monthJan: 'Jan',
  monthFeb: 'Fev',
  monthMar: 'Mar',
  monthApr: 'Abr',
  monthMay: 'Mai',
  monthJun: 'Jun',
  monthJul: 'Jul',
  monthAug: 'Ago',
  monthSep: 'Set',
  monthOct: 'Out',
  monthNov: 'Nov',
  monthDec: 'Dez',
} as const;

export const en: Record<keyof typeof pt, string> = {
  // Header
  appTitle: 'Financial Management',
  toggleTheme: 'Toggle theme',
  settings: 'Settings',

  // Navigation
  releases: 'Releases',
  timeline: 'Timeline',

  // Dashboard
  balance: 'Balance',
  receipts: 'Income',
  expenses: 'Expenses',
  receiptsVsExpenses: 'Income vs Expenses',
  summary: 'Summary',

  // Table
  day: 'Day',
  description: 'Description',
  person: 'Person',
  value: 'Amount',
  total: 'Total',
  noData: 'No data',
  add: 'Add',

  // Person filter
  all: 'All',
  filterByPerson: 'Filter by person',

  // Person selection modal
  whoAreYou: 'Who are you?',
  personSelectionDescription: 'Choose to pre-filter the dashboard data.',

  // Release dialog
  edit: 'Edit',
  selectPerson: 'Select a person',
  selectDay: 'Select day',
  dayPrefix: 'Day',
  descriptionPlaceholder: 'Description',
  descriptionRequired: 'Description is required',
  maxChars: 'Maximum 30 characters',
  valueMustBePositive: 'Value must be greater than zero',
  invalidDay: 'Invalid day',
  personRequired: 'Person is required',
  cancel: 'Cancel',
  save: 'Save',
  saving: 'Saving...',
  releaseUpdated: 'Release updated successfully!',
  releaseSaved: 'Release saved successfully!',
  saveFailed: 'Failed to save. Try again.',

  // Delete dialog
  confirmDelete: 'Confirm deletion',
  deleteConfirmation: 'Do you really want to remove this release?',
  no: 'No',
  yes: 'Yes',
  removing: 'Removing...',
  releaseDeleted: 'Release removed successfully!',
  deleteFailed: 'Failed to remove. Try again.',

  // Timeline
  noReleasesThisMonth: 'No releases for this month',

  // Settings
  language: 'Language',
  currency: 'Currency',
  portuguese: 'Portuguese',
  english: 'English',

  // Months
  monthJan: 'Jan',
  monthFeb: 'Feb',
  monthMar: 'Mar',
  monthApr: 'Apr',
  monthMay: 'May',
  monthJun: 'Jun',
  monthJul: 'Jul',
  monthAug: 'Aug',
  monthSep: 'Sep',
  monthOct: 'Oct',
  monthNov: 'Nov',
  monthDec: 'Dec',
};

export type TranslationKey = keyof typeof pt;

const translations = { pt, en } as const;
export type Language = keyof typeof translations;
export default translations;
