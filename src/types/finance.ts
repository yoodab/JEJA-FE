export type FinanceType = 'INCOME' | 'EXPENSE'
export type PaymentMethod = 'CASH' | 'ACCOUNT'

// --- 1. 재정 관리 (General Finance) ---

export interface FinanceRequestDto {
  date: string // YYYY-MM-DD
  transactionType: FinanceType
  category: string
  detail: string
  amount: number
  receiptImages?: string[]
  scheduleId?: number
}

export interface FinanceResponseDto {
  id: number
  date: string
  transactionType: FinanceType
  category: string
  detail: string
  amount: number
  balance: number
  receiptImages: string[]
  relatedEvent?: string
}

// --- 2. 재정 카테고리 (Finance Category) ---

export interface CategoryDto {
  id?: number
  name: string
  type: FinanceType
}

// --- 3. 재정 리포트 (Finance Report) ---

export interface YearlyReportDto {
  summary: {
    totalIncome: number
    totalExpense: number
    netIncome: number
  }
  monthlyStats: {
    month: string // YYYY-MM
    income: number
    expense: number
  }[]
  incomeCategories: {
    category: string
    amount: number
    percentage: number
  }[]
  expenseCategories: {
    category: string
    amount: number
    percentage: number
  }[]
  topEvents: {
    eventName: string
    amount: number
  }[]
}

// --- 4. 회비 관리 (Dues) ---

export interface DuesEventDto {
  id: number
  name: string
  targetAmount: number
  date: string // YYYY-MM-DD
  targetDate?: string // YYYY-MM-DD
  scheduleId?: number
  priceOptions?: {
    optionId: string
    name: string
    amount: number
  }[]
}

export interface DuesRecordDto {
  id?: number
  eventId: number
  memberName: string
  paidAmount: number
  expectedAmount: number
  paymentMethod: PaymentMethod
  paymentDate?: string // YYYY-MM-DD
  note?: string
}
