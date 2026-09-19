import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Auth & Users
  login: (credentials: any) => ipcRenderer.invoke('auth:login', credentials),
  getUsers: () => ipcRenderer.invoke('users:get-all'),
  createUser: (userData: any) => ipcRenderer.invoke('users:create', userData),
  updateUser: (id: number, userData: any) => ipcRenderer.invoke('users:update', id, userData),
  deleteUser: (id: number) => ipcRenderer.invoke('users:delete', id),

  // Categories
  getCategories: () => ipcRenderer.invoke('categories:get-all'),
  createCategory: (categoryData: any) => ipcRenderer.invoke('categories:create', categoryData),

  // Products
  getProducts: (search?: string, categoryId?: number) => ipcRenderer.invoke('products:get-all', search, categoryId),
  getProductByBarcode: (barcode: string) => ipcRenderer.invoke('products:get-by-barcode', barcode),
  createProduct: (productData: any) => ipcRenderer.invoke('products:create', productData),
  updateProduct: (id: number, productData: any) => ipcRenderer.invoke('products:update', id, productData),
  deleteProduct: (id: number) => ipcRenderer.invoke('products:delete', id),
  getLowStockProducts: () => ipcRenderer.invoke('products:get-low-stock'),

  // Customers
  getCustomers: (search?: string) => ipcRenderer.invoke('customers:get-all', search),
  createCustomer: (customerData: any) => ipcRenderer.invoke('customers:create', customerData),
  updateCustomer: (id: number, customerData: any) => ipcRenderer.invoke('customers:update', id, customerData),
  deleteCustomer: (id: number) => ipcRenderer.invoke('customers:delete', id),
  getCustomerInvoices: (customerId: number) => ipcRenderer.invoke('customers:get-invoices', customerId),

  // Invoices
  createInvoice: (invoiceData: any) => ipcRenderer.invoke('invoices:create', invoiceData),
  getInvoices: (filters?: any) => ipcRenderer.invoke('invoices:get-all', filters),
  getInvoiceDetails: (id: number) => ipcRenderer.invoke('invoices:get-details', id),
  cancelInvoice: (id: number) => ipcRenderer.invoke('invoices:cancel', id),

  // Reports
  getDashboardStats: () => ipcRenderer.invoke('reports:get-dashboard-stats'),
  getSalesReport: (period: string, date?: string) => ipcRenderer.invoke('reports:get-sales-report', period, date),

  // Settings & Database
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings: any) => ipcRenderer.invoke('settings:update', settings),
  backupDatabase: () => ipcRenderer.invoke('db:backup'),
  restoreDatabase: () => ipcRenderer.invoke('db:restore'),

  // Printing & Barcodes
  generateBarcodeDataUrl: (text: string, type?: string) => ipcRenderer.invoke('printer:generate-barcode', text, type),
  printReceipt: (invoiceId: number) => ipcRenderer.invoke('printer:print-receipt', invoiceId),
  printBarcodeLabel: (product: any, count: number) => ipcRenderer.invoke('printer:print-barcode', product, count),
});
