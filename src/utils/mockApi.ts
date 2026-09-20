import { ElectronAPI, User, Category, Product, Customer, Invoice, ShopSettings } from '../types';

// Sample initial products for browser testing if opened outside Electron
const initialCategories: Category[] = [
  { id: 1, name: 'قطع غيار سيارات', description: 'تيل فرامل، سيور، فلاتر، بوجيهات سيارات', type: 'car' },
  { id: 2, name: 'قطع غيار موتوسيكلات', description: 'مساعدين، جنازير، بكرات، تيل موتوسيكل', type: 'motorcycle' },
  { id: 3, name: 'زيوت وسوائل', description: 'زيوت محرك، مياه رادياتير، زيت فرامل', type: 'both' },
  { id: 4, name: 'إلكترونيات وبطاريات', description: 'بطاريات جافة، لمبات ليد، فيوزات', type: 'both' },
  { id: 5, name: 'إكسسوارات وعدد', description: 'مفكات، كابلات، معطرات، كفرات', type: 'both' },
];

let mockProducts: Product[] = [
  {
    id: 1,
    barcode: '1001001',
    name: 'تيل فرامل أمامي كوري - دايو لانوس / نوبيرا',
    description: 'تيل أصلي عالي الجودة',
    category_id: 1,
    category_name: 'قطع غيار سيارات',
    buy_price: 220,
    sell_price: 290,
    quantity: 18,
    min_quantity: 4,
    unit: 'طقم',
    is_active: 1,
    created_at: '2026-09-18 10:00:00',
    updated_at: '2026-09-18 10:00:00',
  },
  {
    id: 2,
    barcode: '1001002',
    name: 'طقم بوجيهات NGK سن رفيع ياباني أصلي',
    description: 'بوجيهات إشعال سريعة',
    category_id: 1,
    category_name: 'قطع غيار سيارات',
    buy_price: 180,
    sell_price: 240,
    quantity: 25,
    min_quantity: 6,
    unit: 'طقم',
    is_active: 1,
    created_at: '2026-09-18 10:00:00',
    updated_at: '2026-09-18 10:00:00',
  },
  {
    id: 3,
    barcode: '1001003',
    name: 'فلتر زيت تويوتا كورولا ياباني',
    description: 'فلتر محرك تويوتا',
    category_id: 1,
    category_name: 'قطع غيار سيارات',
    buy_price: 75,
    sell_price: 110,
    quantity: 30,
    min_quantity: 5,
    unit: 'قطعة',
    is_active: 1,
    created_at: '2026-09-18 10:00:00',
    updated_at: '2026-09-18 10:00:00',
  },
  {
    id: 4,
    barcode: '2001001',
    name: 'مساعد خلفي موتوسيكل دايو 4 / هوجان 8',
    description: 'مساعد هيدروليك معزز',
    category_id: 2,
    category_name: 'قطع غيار موتوسيكلات',
    buy_price: 280,
    sell_price: 370,
    quantity: 12,
    min_quantity: 3,
    unit: 'طقم',
    is_active: 1,
    created_at: '2026-09-18 10:00:00',
    updated_at: '2026-09-18 10:00:00',
  },
  {
    id: 5,
    barcode: '2001002',
    name: 'جنزير ذهبي معزز 428 موتوسيكل بوكسر',
    description: 'جنزير تروس قوي',
    category_id: 2,
    category_name: 'قطع غيار موتوسيكلات',
    buy_price: 140,
    sell_price: 195,
    quantity: 15,
    min_quantity: 4,
    unit: 'قطعة',
    is_active: 1,
    created_at: '2026-09-18 10:00:00',
    updated_at: '2026-09-18 10:00:00',
  },
  {
    id: 6,
    barcode: '3001001',
    name: 'جركن زيت شل هيلكس HX7 10W-40 (4 لتر)',
    description: 'زيت تخليقي نصف اصطناعي',
    category_id: 3,
    category_name: 'زيوت وسوائل',
    buy_price: 780,
    sell_price: 920,
    quantity: 8,
    min_quantity: 3,
    unit: 'علبة',
    is_active: 1,
    created_at: '2026-09-18 10:00:00',
    updated_at: '2026-09-18 10:00:00',
  },
];

let mockCustomers: Customer[] = [
  { id: 1, name: 'محمد أحمد (ورشة الأمانة)', phone: '01012345678', address: 'شارع الورش', notes: 'عميل دائم', total_debt: 290, created_at: '2026-09-18' },
  { id: 2, name: 'كابتن محمود دليفري', phone: '01198765432', address: 'الوسط التجاري', notes: 'موتوسيكل بوكسر', total_debt: 0, created_at: '2026-09-18' },
];

let mockInvoices: Invoice[] = [
  {
    id: 1,
    invoice_number: 'INV-20260918-0001',
    customer_id: 1,
    customer_name: 'محمد أحمد (ورشة الأمانة)',
    user_id: 1,
    user_name: 'المدير العام',
    subtotal: 290,
    discount: 0,
    total: 290,
    payment_method: 'credit',
    paid_amount: 0,
    remaining: 290,
    status: 'unpaid',
    notes: 'تيل فرامل دايو لانوس',
    created_at: '2026-09-18 14:30:00',
    items: [
      {
        id: 1,
        invoice_id: 1,
        product_id: 1,
        product_name: 'تيل فرامل أمامي كوري - دايو لانوس / نوبيرا',
        barcode: '1001001',
        unit_price: 290,
        buy_price: 220,
        quantity: 1,
        total: 290,
      },
    ],
  },
];

let mockSettings: ShopSettings = {
  shop_name: 'المركز لقطع غيار السيارات والموتوسيكلات',
  shop_phone: '01012345678',
  shop_address: 'شارع الجمهورية - بجوار محطة الوقود',
  invoice_footer: 'شكراً لتعاملكم معنا! البضاعة المباعة ترد أو تستبدل خلال 14 يوماً بالفاتورة',
  barcode_width: 40,
  barcode_height: 30,
  printer_type: 'thermal_80mm',
  auto_print: true,
};

export function setupBrowserMockApi() {
  if (typeof window === 'undefined' || window.electronAPI) return;

  const mockApi: ElectronAPI = {
    login: async ({ username, password }) => {
      if ((username === 'admin' && password === 'admin123') || (username === 'cashier' && password === '123456')) {
        const user: User = {
          id: username === 'admin' ? 1 : 2,
          username,
          display_name: username === 'admin' ? 'المدير العام' : 'كاشير المحل',
          role: username === 'admin' ? 'admin' : 'cashier',
          is_active: 1,
          created_at: new Date().toISOString(),
        };
        return { success: true, data: user };
      }
      return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
    },
    getUsers: async () => ({
      success: true,
      data: [
        { id: 1, username: 'admin', display_name: 'المدير العام', role: 'admin', is_active: 1, created_at: '2026-09-18' },
        { id: 2, username: 'cashier', display_name: 'كاشير المحل', role: 'cashier', is_active: 1, created_at: '2026-09-18' },
      ],
    }),
    createUser: async (user) => {
      const newUser: User = {
        id: Date.now(),
        username: user.username || 'user',
        display_name: user.display_name || 'مستخدم جديد',
        role: user.role || 'cashier',
        is_active: 1,
        created_at: new Date().toISOString(),
      };
      return { success: true, data: newUser };
    },
    updateUser: async () => ({ success: true, data: true }),
    deleteUser: async () => ({ success: true, data: true }),

    getCategories: async () => ({ success: true, data: initialCategories }),
    createCategory: async (c) => ({
      success: true,
      data: { id: Date.now(), name: c.name || '', description: c.description || '', type: c.type || 'both' },
    }),

    getProducts: async (search, catId) => {
      let filtered = mockProducts.filter((p) => p.is_active === 1);
      if (catId && catId > 0) {
        filtered = filtered.filter((p) => p.category_id === catId);
      }
      if (search && search.trim() !== '') {
        const s = search.toLowerCase().trim();
        filtered = filtered.filter((p) => p.name.toLowerCase().includes(s) || p.barcode.includes(s));
      }
      return { success: true, data: filtered };
    },
    getProductByBarcode: async (barcode) => {
      const prod = mockProducts.find((p) => p.barcode === barcode.trim() && p.is_active === 1);
      return { success: true, data: prod || null };
    },
    createProduct: async (p) => {
      const newProd: Product = {
        ...p,
        id: Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockProducts.unshift(newProd);
      return { success: true, data: newProd };
    },
    updateProduct: async (id, p) => {
      mockProducts = mockProducts.map((prod) => (prod.id === id ? { ...prod, ...p } : prod));
      return { success: true, data: true };
    },
    deleteProduct: async (id) => {
      mockProducts = mockProducts.filter((p) => p.id !== id);
      return { success: true, data: true };
    },
    getLowStockProducts: async () => {
      const low = mockProducts.filter((p) => p.quantity <= p.min_quantity);
      return { success: true, data: low };
    },

    getCustomers: async (search) => {
      let list = mockCustomers;
      if (search && search.trim() !== '') {
        const s = search.toLowerCase().trim();
        list = list.filter((c) => c.name.toLowerCase().includes(s) || c.phone.includes(s));
      }
      return { success: true, data: list };
    },
    createCustomer: async (c) => {
      const newC: Customer = {
        ...c,
        id: Date.now(),
        total_debt: 0,
        created_at: new Date().toISOString(),
      };
      mockCustomers.unshift(newC);
      return { success: true, data: newC };
    },
    updateCustomer: async (id, c) => {
      mockCustomers = mockCustomers.map((cust) => (cust.id === id ? { ...cust, ...c } : cust));
      return { success: true, data: true };
    },
    deleteCustomer: async (id) => {
      mockCustomers = mockCustomers.filter((c) => c.id !== id);
      return { success: true, data: true };
    },
    getCustomerInvoices: async (customerId) => {
      const invs = mockInvoices.filter((i) => i.customer_id === customerId);
      return { success: true, data: invs };
    },

    createInvoice: async (data) => {
      const invNum = `INV-20260918-${Math.floor(1000 + Math.random() * 9000)}`;
      let subtotal = 0;
      const items = data.items.map((it) => {
        const prod = mockProducts.find((p) => p.id === it.product_id);
        const itemTotal = it.quantity * it.unit_price;
        subtotal += itemTotal;
        if (prod) {
          prod.quantity = Math.max(0, prod.quantity - it.quantity);
        }
        return {
          product_id: it.product_id,
          product_name: prod?.name || 'صنف',
          barcode: prod?.barcode || '',
          unit_price: it.unit_price,
          quantity: it.quantity,
          total: itemTotal,
        };
      });

      const total = Math.max(0, subtotal - data.discount);
      const remaining = Math.max(0, total - data.paid_amount);
      const customer = mockCustomers.find((c) => c.id === data.customer_id);

      if (customer && remaining > 0) {
        customer.total_debt = (customer.total_debt || 0) + remaining;
      }

      const newInv: Invoice = {
        id: Date.now(),
        invoice_number: invNum,
        customer_id: data.customer_id,
        customer_name: customer?.name || null,
        user_id: data.user_id,
        user_name: 'المدير',
        subtotal,
        discount: data.discount,
        total,
        payment_method: data.payment_method,
        paid_amount: data.paid_amount,
        remaining,
        status: remaining <= 0 ? 'paid' : data.paid_amount > 0 ? 'partial' : 'unpaid',
        notes: data.notes || '',
        created_at: new Date().toLocaleString('ar-EG'),
        items,
      };

      mockInvoices.unshift(newInv);
      return { success: true, data: newInv };
    },
    getInvoices: async (filters) => {
      let list = mockInvoices;
      if (filters?.status && filters.status !== 'all') {
        list = list.filter((i) => i.status === filters.status);
      }
      return { success: true, data: list };
    },
    getInvoiceDetails: async (id) => {
      const inv = mockInvoices.find((i) => i.id === id);
      return { success: true, data: inv! };
    },
    cancelInvoice: async (id) => {
      mockInvoices = mockInvoices.filter((i) => i.id !== id);
      return { success: true, data: true };
    },

    getDashboardStats: async () => ({
      success: true,
      data: {
        todaySales: mockInvoices.reduce((acc, i) => acc + i.total, 0),
        todayProfit: 340,
        todayInvoicesCount: mockInvoices.length,
        totalProductsCount: mockProducts.length,
        lowStockCount: mockProducts.filter((p) => p.quantity <= p.min_quantity).length,
        totalDebts: mockCustomers.reduce((acc, c) => acc + (c.total_debt || 0), 0),
      },
    }),
    getSalesReport: async () => ({
      success: true,
      data: {
        trendData: [
          { date: '09-12', sales: 1200, profit: 310 },
          { date: '09-13', sales: 1850, profit: 460 },
          { date: '09-14', sales: 950, profit: 240 },
          { date: '09-15', sales: 2400, profit: 620 },
          { date: '09-16', sales: 3100, profit: 790 },
          { date: '09-17', sales: 2800, profit: 690 },
          { date: '09-18', sales: 1650, profit: 420 },
        ],
        topProducts: [
          { product_name: 'تيل فرامل دايو لانوس', total_qty: 14, total_revenue: 4060 },
          { product_name: 'زيت شل هيلكس HX7', total_qty: 9, total_revenue: 8280 },
          { product_name: 'بوجيهات NGK ياباني', total_qty: 8, total_revenue: 1920 },
          { product_name: 'فلتر زيت كورولا', total_qty: 11, total_revenue: 1210 },
        ],
        categorySales: [
          { category_name: 'قطع غيار سيارات', revenue: 7200 },
          { category_name: 'زيوت وسوائل', revenue: 8900 },
          { category_name: 'قطع غيار موتوسيكلات', revenue: 3400 },
        ],
      },
    }),

    getSettings: async () => ({ success: true, data: mockSettings }),
    updateSettings: async (s) => {
      mockSettings = { ...mockSettings, ...s };
      return { success: true, data: true };
    },
    backupDatabase: async () => ({ success: true, data: 'casher_backup.sqlite' }),
    restoreDatabase: async () => ({ success: true, data: true }),

    generateBarcodeDataUrl: async (text) => {
      // Basic SVG/Canvas Barcode fallback for browser preview
      const canvas = document.createElement('canvas');
      canvas.width = 240;
      canvas.height = 70;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 240, 70);
        ctx.fillStyle = '#000000';
        for (let i = 20; i < 220; i += 4) {
          if ((i * 7) % 3 === 0) {
            ctx.fillRect(i, 8, 2, 42);
          }
        }
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(text, 120, 62);
      }
      return { success: true, data: canvas.toDataURL() };
    },
    printReceipt: async () => {
      window.print();
      return { success: true, data: true };
    },
    printBarcodeLabel: async () => {
      window.print();
      return { success: true, data: true };
    },

    // License (mock - always valid in browser)
    getMachineId: async () => 'MOCK-XXXX-XXXX-XXXX',
    getMachineIdFull: async () => 'mock_machine_id_for_browser_development',
    getLicenseStatus: async () => ({ status: 'valid' }),
    activateLicense: async () => ({ success: true, message: 'تم التفعيل (وضع التطوير)' }),
    getLicenseInfo: async () => null,
  };

  window.electronAPI = mockApi;
}
