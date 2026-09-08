export type ExpenseCategory =
  | 'Market & Gıda'
  | 'Restoran & Cafe'
  | 'Ulaşım & Akaryakıt'
  | 'Fatura & Abonelikler'
  | 'Ofis & Kırtasiye'
  | 'Sağlık & Eczane'
  | 'Giyim & Yaşam'
  | 'Elektronik & Donanım'
  | 'Diğer';

export type DocumentType = 'Fiş' | 'Fatura' | 'E-Fatura' | 'Makbuz';

export type PaymentMethod = 'Kredi Kartı' | 'Nakit' | 'Havale / EFT' | 'Banka Kartı';

export interface ReceiptItem {
  id?: string;
  name: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice: number;
}

export interface Receipt {
  id: string;
  merchant: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  totalAmount: number;
  currency: string;
  taxAmount?: number;
  taxRate?: number; // e.g. 10 or 20
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  docType: DocumentType;
  docNumber?: string;
  items: ReceiptItem[];
  imageUrl?: string;
  isUnusualExpense: boolean;
  unusualReason?: string;
  status: 'processed' | 'pending_2100_queue';
  createdAt: string;
  encryptedHash?: string;
  notes?: string;
}

export interface BudgetGoal {
  category: ExpenseCategory;
  monthlyLimit: number;
  spent: number;
}

export interface DailySummary {
  date: string;
  receiptCount: number;
  totalAmount: number;
  topCategory: ExpenseCategory | string;
  topCategoryAmount: number;
  hasUnusualExpense: boolean;
  unusualExpenses: Array<{
    merchant: string;
    amount: number;
    reason: string;
  }>;
  morningNotificationTime: string;
  formattedMessage: string;
}

export interface MonthlyReport {
  month: string; // YYYY-MM
  monthName: string; // e.g. "Eylül 2026"
  totalSpending: number;
  totalReceipts: number;
  categoryBreakdown: {
    category: ExpenseCategory;
    total: number;
    count: number;
    percentage: number;
    color: string;
  }[];
  dailyTotals: {
    date: string;
    day: number;
    total: number;
  }[];
  previousMonthComparison?: {
    prevTotal: number;
    percentageDiff: number; // positive = increased, negative = decreased
  };
}

export interface SystemStatus {
  cloudSync: {
    connected: boolean;
    lastSyncedAt: string;
    deviceId: string;
    encryptedWith: string;
  };
  batch2100: {
    enabled: boolean;
    scheduledTime: string;
    lastRunAt: string;
    pendingCount: number;
  };
  notifications: {
    morningTime: string;
    pushSupported: boolean;
    permission: 'granted' | 'denied' | 'default';
  };
}
