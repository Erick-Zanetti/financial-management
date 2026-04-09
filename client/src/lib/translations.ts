export const pt = {
  // Header
  appTitle: 'Controle Financeiro',
  toggleTheme: 'Alternar tema',
  settings: 'Configurações',

  // Navigation / Sidebar
  releases: 'Lançamentos',
  timeline: 'Linha do tempo',
  menuDashboard: 'Dashboard',
  categories: 'Categorias',
  theme: 'Tema',

  // Dashboard
  month: 'Mês',
  currentBalance: 'Saldo Atual',
  balance: 'Saldo',
  receipts: 'Receitas',
  expenses: 'Despesas',
  receiptsVsExpenses: 'Receitas vs Despesas',
  summary: 'Resumo',
  totalBalance: 'Saldo Total',
  totalIncome: 'Total Receitas',
  totalExpenses: 'Total Despesas',
  vsPreviousMonth: 'vs. Mês anterior',

  // Table
  day: 'Dia',
  description: 'Descrição',
  value: 'Valor',
  total: 'Total',
  noData: 'Sem dados',
  add: 'Adicionar',

  // Release dialog
  edit: 'Editar',
  selectDay: 'Selecione o dia',
  dayPrefix: 'Dia',
  descriptionPlaceholder: 'Descrição',
  descriptionRequired: 'Descrição é obrigatória',
  maxChars: 'Máximo 30 caracteres',
  valueMustBePositive: 'Valor deve ser maior que zero',
  invalidDay: 'Dia inválido',
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

  // Status (settled)
  status: 'Status',
  pending: 'Pendente',
  received: 'Recebido',
  paid: 'Pago',
  settledSuccess: 'Lançamento efetivado!',
  unsettledSuccess: 'Lançamento revertido para pendente!',
  cannotEditSettled: 'Desmarque para editar',
  cannotDeleteSettled: 'Desmarque para remover',

  // Categories
  category: 'Categoria',
  categoryName: 'Nome da categoria',
  categoryRequired: 'Categoria é obrigatória',
  categoryCreated: 'Categoria criada com sucesso!',
  categoryUpdated: 'Categoria atualizada com sucesso!',
  categoryDeleted: 'Categoria removida com sucesso!',
  categoryDeleteFailed: 'Falha ao remover categoria.',
  categoryInUse: 'Categoria em uso, não pode ser removida.',
  confirmDeleteCategory: 'Deseja realmente remover esta categoria?',
  categoryNameRequired: 'Nome é obrigatório',
  editCategory: 'Editar categoria',
  addCategory: 'Adicionar categoria',
  categoryType: 'Tipo',
  categoryTypeReceipt: 'Receitas',
  categoryTypeExpense: 'Despesas',
  categoryTypeBoth: 'Ambas',
  categoryTypeRequired: 'Tipo é obrigatório',
  allowSubcategories: 'Permitir subcategorias',
  subcategories: 'Subcategorias',
  subcategoryName: 'Nome',
  addSubcategory: 'Adicionar subcategoria',
  removeSubcategory: 'Remover',
  subcategorySumMismatch: 'A soma das subcategorias deve ser igual ao valor total',

  // Dashboard charts
  dashboardCategoryBreakdown: 'Categorias por Mês',
  dashboardSavingsTrend: 'Tendência de Economia',
  dashboardCategoryDistribution: 'Distribuição por Categoria',
  dashboardIncomeDistribution: 'Receitas',
  dashboardExpenseDistribution: 'Despesas',
  dashboardNoData: 'Sem dados para o período',
  savings: 'Economia',

  // Observations
  observations: 'Observações',
  maxCharsObservations: 'Máximo 200 caracteres',

  // Clone
  clone: 'Clonar',
  releaseCloned: 'Lançamento clonado para o próximo mês!',

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

  // Navigation / Sidebar
  releases: 'Releases',
  timeline: 'Timeline',
  menuDashboard: 'Dashboard',
  categories: 'Categories',
  theme: 'Theme',

  // Dashboard
  month: 'Month',
  currentBalance: 'Current Balance',
  balance: 'Balance',
  receipts: 'Income',
  expenses: 'Expenses',
  receiptsVsExpenses: 'Income vs Expenses',
  summary: 'Summary',
  totalBalance: 'Total Balance',
  totalIncome: 'Total Income',
  totalExpenses: 'Total Expenses',
  vsPreviousMonth: 'vs. Previous month',

  // Table
  day: 'Day',
  description: 'Description',
  value: 'Amount',
  total: 'Total',
  noData: 'No data',
  add: 'Add',

  // Release dialog
  edit: 'Edit',
  selectDay: 'Select day',
  dayPrefix: 'Day',
  descriptionPlaceholder: 'Description',
  descriptionRequired: 'Description is required',
  maxChars: 'Maximum 30 characters',
  valueMustBePositive: 'Value must be greater than zero',
  invalidDay: 'Invalid day',
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

  // Status (settled)
  status: 'Status',
  pending: 'Pending',
  received: 'Received',
  paid: 'Paid',
  settledSuccess: 'Release settled!',
  unsettledSuccess: 'Release reverted to pending!',
  cannotEditSettled: 'Unsettle to edit',
  cannotDeleteSettled: 'Unsettle to delete',

  // Categories
  category: 'Category',
  categoryName: 'Category name',
  categoryRequired: 'Category is required',
  categoryCreated: 'Category created successfully!',
  categoryUpdated: 'Category updated successfully!',
  categoryDeleted: 'Category deleted successfully!',
  categoryDeleteFailed: 'Failed to delete category.',
  categoryInUse: 'Category is in use and cannot be deleted.',
  confirmDeleteCategory: 'Do you really want to remove this category?',
  categoryNameRequired: 'Name is required',
  editCategory: 'Edit category',
  addCategory: 'Add category',
  categoryType: 'Type',
  categoryTypeReceipt: 'Income',
  categoryTypeExpense: 'Expenses',
  categoryTypeBoth: 'Both',
  categoryTypeRequired: 'Type is required',
  allowSubcategories: 'Allow subcategories',
  subcategories: 'Subcategories',
  subcategoryName: 'Name',
  addSubcategory: 'Add subcategory',
  removeSubcategory: 'Remove',
  subcategorySumMismatch: 'Subcategory values must equal the total value',

  // Dashboard charts
  dashboardCategoryBreakdown: 'Categories by Month',
  dashboardSavingsTrend: 'Savings Trend',
  dashboardCategoryDistribution: 'Distribution by Category',
  dashboardIncomeDistribution: 'Income',
  dashboardExpenseDistribution: 'Expenses',
  dashboardNoData: 'No data for the period',
  savings: 'Savings',

  // Observations
  observations: 'Observations',
  maxCharsObservations: 'Maximum 200 characters',

  // Clone
  clone: 'Clone',
  releaseCloned: 'Release cloned to next month!',

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
