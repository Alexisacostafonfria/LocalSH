

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  unitOfMeasure?: string;
  imageUrl?: string;
  description?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  personalId?: string;
  cardNumber?: string;
  transferIdentifier?: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type OrderStatus = 'pending' | 'in-progress' | 'ready' | 'completed' | 'cancelled';

export const ORDER_STATUS_MAP: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  'in-progress': 'En Preparación',
  ready: 'Listo para Retirar',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

export interface Order {
  id: string; // UUID
  orderNumber: number; // Sequential number
  timestamp: string; // ISO string
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  items: SaleItem[];
  totalAmount: number;
  status: OrderStatus;
  notes?: string;
}


export interface CashPaymentDetails {
  amountReceived: number;
  changeGiven: number;
  tip?: number;
  breakdown?: { [denomination: string]: number };
}

export interface TransferPaymentDetails {
  reference?: string;
  customerId?: string;
  customerName?: string;
  personalId?: string;
  mobileNumber?: string;
  cardNumber?: string;
}

export type InvoiceStatus = 'pending' | 'paid' | 'overdue';

export interface InvoicePaymentDetails {
  invoiceNumber: string; // Can be the sale.id
  dueDate: string; // ISO String
  status: InvoiceStatus;
  paidDate?: string; // ISO String
  paidAmount?: number;
  paidMethod?: 'cash' | 'transfer';
  paymentNotes?: string;
}

export type PaymentDetails = CashPaymentDetails | TransferPaymentDetails | InvoicePaymentDetails;

export interface Sale {
  id: string;
  timestamp: string; // ISO string
  orderId?: string; // Link to the original order
  origin: 'pos' | 'order'; // Where the sale originated from
  customerId?: string;
  customerName?: string;
  items: SaleItem[];
  subTotal: number;
  discount?: number;
  fees?: { description: string; amount: number; }[];
  totalAmount: number;
  paymentMethod: 'cash' | 'transfer' | 'invoice';
  paymentDetails: PaymentDetails;
  userId?: string; // ID of the user who made the sale
  operationalDate?: string; // ISO string (date part only) for accounting
}

export interface InvoicePaymentRecord {
    id: string; // UUID for the payment record itself
    invoiceSaleId: string; // The ID of the sale that was the invoice
    paymentTimestamp: string; // Full ISO timestamp of when the payment was recorded
    operationalDate: string; // Operational day it was received on
    amountPaid: number;
    method: 'cash' | 'transfer';
    reference?: string; // Optional reference for the payment (e.g., transfer ref)
}


export interface AppSettings {
  lowStockThreshold: number;
  currencySymbol: string;
  allowTips: boolean;
  invoicePaymentFeePercentage: number;
  latePaymentFeePercentage: number;
  autoPrintOrderTicket: boolean;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  lowStockThreshold: 10,
  currencySymbol: '$',
  allowTips: true,
  invoicePaymentFeePercentage: 5, // Default 5% fee for invoice payments
  latePaymentFeePercentage: 10, // Default 10% penalty for late payments
  autoPrintOrderTicket: false,
};

export interface BusinessSettings {
  businessName: string;
  address: string;
  phone: string;
  email: string;
  taxId?: string;
  website?: string;
  logoUrl?: string;
}

export const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  businessName: 'Tu Nombre de Negocio',
  address: 'Tu Dirección Completa, Ciudad, País',
  phone: '+1 (555) 123-4567',
  email: 'contacto@tunegocio.com',
  taxId: '',
  website: 'https://www.tunegocio.com',
  logoUrl: '',
};

export interface DenominationCount {
  denomination: number;
  count: number;
  totalValue: number;
}

export interface DailyClosureReport {
  closureDate: string; 
  expectedCashInBox: number;
  countedCashBreakdown: DenominationCount[];
  totalCountedCash: number;
  cashDifference: number;
  closureNotes: string;
  totalRevenue: number;
  totalCogs: number;
  grossProfit: number;
  totalTransactions: number;
  cashSalesAmount: number;
  transferSalesAmount: number;
  totalTips: number;
  invoicePaymentsInCash: number;
  invoicePaymentsInTransfer: number;
}

export interface MonthlyClosureReport {
    year: number;
    month: number; // 1-12
    generationDate: string; // ISO string
    totalRevenue: number;
    totalCogs: number;
    grossProfit: number;
    totalTransactions: number;
    totalTips: number;
}

export interface AccountingSettings {
  lastClosureDate: string | null;
  currentOperationalDate: string | null;
  isDayOpen: boolean;
  dailyClosureHistory: DailyClosureReport[];
  monthlyClosureHistory: MonthlyClosureReport[];
}

export const DEFAULT_ACCOUNTING_SETTINGS: AccountingSettings = {
  lastClosureDate: null,
  currentOperationalDate: null,
  isDayOpen: false,
  dailyClosureHistory: [],
  monthlyClosureHistory: [],
};

export type InventoryItem = Pick<Product, 'id' | 'name' | 'stock' | 'category' | 'imageUrl' | 'unitOfMeasure'> & {
  isLowStock?: boolean;
};

export interface SalesDataPoint {
  date: string; // YYYY-MM-DD
  salesVolume: number;
}

// User Management Types
export type UserRole = 'admin' | 'cashier';

export interface User {
  id: string;
  username: string; // For login
  name: string; // Display name
  role: UserRole;
  // passwordHash?: string; // For a real app, never store plaintext
}

export interface AuthState {
  currentUser: User | null;
  users: User[];
}

export const DEFAULT_ADMIN_USER_ID = 'default-admin-001';

export const DEFAULT_USERS_STATE: User[] = [
  {
    id: DEFAULT_ADMIN_USER_ID,
    username: 'admin',
    name: 'Administrador Principal',
    role: 'admin',
  },
];

export const DEFAULT_AUTH_STATE: AuthState = {
  currentUser: null, // Will be set to default admin if users list is empty or no current user
  users: [],
};


export type BackupData = {
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  orders: Order[];
  invoicePayments: InvoicePaymentRecord[];
  appSettings: AppSettings;
  accountingSettings: AccountingSettings;
  businessSettings: BusinessSettings;
  authData?: AuthState; // Added authData to backup
  backupTimestamp: string;
};
