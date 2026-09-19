import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { initializeSchema } from './database/schema';
import * as usersService from './services/users';
import * as productsService from './services/products';
import * as customersService from './services/customers';
import * as invoicesService from './services/invoices';
import * as reportsService from './services/reports';
import * as settingsService from './services/settings';
import * as barcodePrinter from './printer/barcode';
import * as receiptPrinter from './printer/receipt';

// Disable hardware acceleration to avoid Windows GPU cache locks and display issues
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#090d16',
    show: true,
    center: true,
    title: 'برنامج كاشير قطع الغيار',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
    console.error('Failed to load:', code, desc, url);
  });

  mainWindow.webContents.on('console-message', (_event, _level, message) => {
    console.log('[Renderer]', message);
  });

  // Load dev server or production build
  const isDev = process.env.NODE_ENV === 'development';
  const distPath = path.join(__dirname, '../dist/index.html');

  if (!isDev && fs.existsSync(distPath)) {
    mainWindow.loadFile(distPath);
  } else {
    mainWindow.loadURL('http://localhost:5173');
  }

  mainWindow.show();
  mainWindow.focus();
  mainWindow.setAlwaysOnTop(true);
  mainWindow.setAlwaysOnTop(false);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function setupIpcHandlers() {
  // Auth & Users
  ipcMain.handle('auth:login', async (_e, { username, password }) => {
    return usersService.loginUser(username, password);
  });
  ipcMain.handle('users:get-all', async () => usersService.getAllUsers());
  ipcMain.handle('users:create', async (_e, data) => usersService.createUser(data));
  ipcMain.handle('users:update', async (_e, id, data) => usersService.updateUser(id, data));
  ipcMain.handle('users:delete', async (_e, id) => usersService.deleteUser(id));

  // Categories
  ipcMain.handle('categories:get-all', async () => productsService.getCategories());
  ipcMain.handle('categories:create', async (_e, data) => productsService.createCategory(data));

  // Products
  ipcMain.handle('products:get-all', async (_e, search, catId) => productsService.getProducts(search, catId));
  ipcMain.handle('products:get-by-barcode', async (_e, barcode) => productsService.getProductByBarcode(barcode));
  ipcMain.handle('products:create', async (_e, data) => productsService.createProduct(data));
  ipcMain.handle('products:update', async (_e, id, data) => productsService.updateProduct(id, data));
  ipcMain.handle('products:delete', async (_e, id) => productsService.deleteProduct(id));
  ipcMain.handle('products:get-low-stock', async () => productsService.getLowStockProducts());

  // Customers
  ipcMain.handle('customers:get-all', async (_e, search) => customersService.getCustomers(search));
  ipcMain.handle('customers:create', async (_e, data) => customersService.createCustomer(data));
  ipcMain.handle('customers:update', async (_e, id, data) => customersService.updateCustomer(id, data));
  ipcMain.handle('customers:delete', async (_e, id) => customersService.deleteCustomer(id));
  ipcMain.handle('customers:get-invoices', async (_e, id) => customersService.getCustomerInvoices(id));

  // Invoices
  ipcMain.handle('invoices:create', async (_e, data) => invoicesService.createInvoice(data));
  ipcMain.handle('invoices:get-all', async (_e, filters) => invoicesService.getInvoices(filters));
  ipcMain.handle('invoices:get-details', async (_e, id) => invoicesService.getInvoiceDetails(id));
  ipcMain.handle('invoices:cancel', async (_e, id) => invoicesService.cancelInvoice(id));

  // Reports
  ipcMain.handle('reports:get-dashboard-stats', async () => reportsService.getDashboardStats());
  ipcMain.handle('reports:get-sales-report', async (_e, period, date) => reportsService.getSalesReport(period, date));

  // Settings & DB
  ipcMain.handle('settings:get', async () => settingsService.getSettings());
  ipcMain.handle('settings:update', async (_e, settings) => settingsService.updateSettings(settings));
  ipcMain.handle('db:backup', async () => settingsService.backupDatabase());
  ipcMain.handle('db:restore', async () => settingsService.restoreDatabase());

  // Printing & Barcodes
  ipcMain.handle('printer:generate-barcode', async (_e, text, type) =>
    barcodePrinter.generateBarcodeDataUrl(text, type)
  );
  ipcMain.handle('printer:print-receipt', async (_e, invoiceId) => receiptPrinter.printReceipt(invoiceId));
  ipcMain.handle('printer:print-barcode', async (_e, product, count) =>
    barcodePrinter.printBarcodeLabel(product, count)
  );
}

app.whenReady().then(async () => {
  try {
    await initializeSchema();
    setupIpcHandlers();
    createWindow();
  } catch (err) {
    console.error('Fatal initialization error:', err);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
