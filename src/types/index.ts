

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

export type PaymentDetails = CashPaymentDetails | TransferPaymentDetails;

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
  totalAmount: number;
  paymentMethod: 'cash' | 'transfer';
  paymentDetails: PaymentDetails;
  userId?: string; // ID of the user who made the sale
  operationalDate?: string; // ISO string (date part only) for accounting
}

export interface AppSettings {
  lowStockThreshold: number;
  currencySymbol: string;
  allowTips: boolean;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  lowStockThreshold: 10,
  currencySymbol: '$',
  allowTips: true,
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

export interface LastClosureDetails {
  closureDate: string; // ISO string date of the operational day that was closed
  expectedCashInBox: number;
  countedCashBreakdown: DenominationCount[];
  totalCountedCash: number;
  cashDifference: number;
  closureNotes: string;
  totalRevenue: number;
  totalTransactions: number;
  cashSalesAmount: number;
  transferSalesAmount: number;
  totalTips: number;
}

export interface AccountingSettings {
  lastClosureDate: string | null;
  currentOperationalDate: string | null;
  isDayOpen: boolean;
  lastClosureDetails?: LastClosureDetails;
}

export const DEFAULT_ACCOUNTING_SETTINGS: AccountingSettings = {
  lastClosureDate: null,
  currentOperationalDate: null,
  isDayOpen: false,
  lastClosureDetails: undefined,
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
  appSettings: AppSettings;
  accountingSettings: AccountingSettings;
  businessSettings: BusinessSettings;
  authData?: AuthState; // Added authData to backup
  backupTimestamp: string;
};
