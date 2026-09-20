import { User, Category, Product, Customer, Invoice, InvoiceItem, ShopSettings, ApiResponse } from '../../electron/types';

export * from '../../electron/types';

export interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface DashboardStats {
  todaySales: number;
  todayProfit: number;
  todayInvoicesCount: number;
  totalProductsCount: number;
  lowStockCount: number;
  totalDebts: number;
}

export interface ElectronAPI {
  // Auth
  login: (credentials: { username: string; password: string }) => Promise<ApiResponse<User>>;
  getUsers: () => Promise<ApiResponse<User[]>>;
  createUser: (user: Partial<User> & { password?: string }) => Promise<ApiResponse<User>>;
  updateUser: (id: number, user: Partial<User> & { password?: string }) => Promise<ApiResponse<boolean>>;
  deleteUser: (id: number) => Promise<ApiResponse<boolean>>;

  // Categories
  getCategories: () => Promise<ApiResponse<Category[]>>;
  createCategory: (cat: Partial<Category>) => Promise<ApiResponse<Category>>;

  // Products
  getProducts: (search?: string, categoryId?: number) => Promise<ApiResponse<Product[]>>;
  getProductByBarcode: (barcode: string) => Promise<ApiResponse<Product | null>>;
  createProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<ApiResponse<Product>>;
  updateProduct: (id: number, product: Partial<Product>) => Promise<ApiResponse<boolean>>;
  deleteProduct: (id: number) => Promise<ApiResponse<boolean>>;
  getLowStockProducts: () => Promise<ApiResponse<Product[]>>;

  // Customers
  getCustomers: (search?: string) => Promise<ApiResponse<Customer[]>>;
  createCustomer: (customer: Omit<Customer, 'id' | 'created_at' | 'total_debt'>) => Promise<ApiResponse<Customer>>;
  updateCustomer: (id: number, customer: Partial<Customer>) => Promise<ApiResponse<boolean>>;
  deleteCustomer: (id: number) => Promise<ApiResponse<boolean>>;
  getCustomerInvoices: (customerId: number) => Promise<ApiResponse<Invoice[]>>;

  // Invoices
  createInvoice: (invoiceData: {
    customer_id?: number | null;
    user_id: number;
    items: { product_id: number; quantity: number; unit_price: number }[];
    discount: number;
    payment_method: 'cash' | 'credit';
    paid_amount: number;
    notes?: string;
  }) => Promise<ApiResponse<Invoice>>;
  getInvoices: (filters?: {
    startDate?: string;
    endDate?: string;
    customerId?: number;
    status?: string;
  }) => Promise<ApiResponse<Invoice[]>>;
  getInvoiceDetails: (id: number) => Promise<ApiResponse<Invoice>>;
  cancelInvoice: (id: number) => Promise<ApiResponse<boolean>>;

  // Reports
  getDashboardStats: () => Promise<ApiResponse<DashboardStats>>;
  getSalesReport: (period: 'day' | 'week' | 'month' | 'year', date?: string) => Promise<ApiResponse<any>>;

  // Settings & DB
  getSettings: () => Promise<ApiResponse<ShopSettings>>;
  updateSettings: (settings: Partial<ShopSettings>) => Promise<ApiResponse<boolean>>;
  backupDatabase: () => Promise<ApiResponse<string>>;
  restoreDatabase: () => Promise<ApiResponse<boolean>>;

  // Printing & Barcode
  generateBarcodeDataUrl: (text: string, type?: string) => Promise<ApiResponse<string>>;
  printReceipt: (invoiceId: number) => Promise<ApiResponse<boolean>>;
  printBarcodeLabel: (product: Product, count: number) => Promise<ApiResponse<boolean>>;

  // License
  getMachineId: () => Promise<string>;
  getMachineIdFull: () => Promise<string>;
  getLicenseStatus: () => Promise<{ status: string; info?: any }>;
  activateLicense: (key: string) => Promise<{ success: boolean; message: string }>;
  getLicenseInfo: () => Promise<any>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
