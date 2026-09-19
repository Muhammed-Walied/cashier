import bcrypt from 'bcryptjs';
import { getDb, persistDb, queryOne, run } from './db';

export async function initializeSchema(): Promise<void> {
  const db = await getDb();

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'cashier',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL DEFAULT 'both'
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      buy_price REAL NOT NULL DEFAULT 0,
      sell_price REAL NOT NULL DEFAULT 0,
      quantity INTEGER NOT NULL DEFAULT 0,
      min_quantity INTEGER NOT NULL DEFAULT 5,
      unit TEXT NOT NULL DEFAULT 'قطعة',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      subtotal REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      payment_method TEXT NOT NULL DEFAULT 'cash',
      paid_amount REAL NOT NULL DEFAULT 0,
      remaining REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'paid',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      product_name TEXT NOT NULL,
      barcode TEXT NOT NULL,
      unit_price REAL NOT NULL,
      buy_price REAL NOT NULL DEFAULT 0,
      quantity INTEGER NOT NULL,
      total REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
    CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
    CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(created_at);
    CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
  `);

  // Default Admin User if none exists
  const adminUser = queryOne('SELECT id FROM users WHERE username = ?', ['admin']);
  if (!adminUser) {
    const defaultPasswordHash = bcrypt.hashSync('admin123', 10);
    run(
      'INSERT INTO users (username, password_hash, display_name, role, is_active) VALUES (?, ?, ?, ?, ?)',
      ['admin', defaultPasswordHash, 'المدير العام', 'admin', 1]
    );

    // Also a cashier demo user
    const cashierHash = bcrypt.hashSync('123456', 10);
    run(
      'INSERT INTO users (username, password_hash, display_name, role, is_active) VALUES (?, ?, ?, ?, ?)',
      ['cashier', cashierHash, 'كاشير المحل', 'cashier', 1]
    );
  }

  // Default Categories if none exist
  const existingCats = queryOne('SELECT COUNT(*) as cnt FROM categories');
  if (!existingCats || existingCats.cnt === 0) {
    const defaultCategories = [
      { name: 'قطع غيار سيارات', description: 'تيل فرامل، سيور، فلاتر، بوجيهات سيارات', type: 'car' },
      { name: 'قطع غيار موتوسيكلات', description: 'مساعدين، جنازير، بكرات، تيل موتوسيكل', type: 'motorcycle' },
      { name: 'زيوت وسوائل', description: 'زيوت محرك، مياه رادياتير، زيت فرامل', type: 'both' },
      { name: 'إلكترونيات وبطاريات', description: 'بطاريات جافة، لمبات ليد، فيوزات', type: 'both' },
      { name: 'إكسسوارات وعدد', description: 'مفكات، كابلات، معطرات، كفرات', type: 'both' },
    ];

    for (const cat of defaultCategories) {
      run('INSERT INTO categories (name, description, type) VALUES (?, ?, ?)', [
        cat.name,
        cat.description,
        cat.type,
      ]);
    }
  }

  // Default Settings if not exist
  const shopNameSetting = queryOne('SELECT value FROM settings WHERE key = ?', ['shop_name']);
  if (!shopNameSetting) {
    const defaultSettings: Record<string, string> = {
      shop_name: 'المركز لقطع غيار السيارات والموتوسيكلات',
      shop_phone: '01012345678',
      shop_address: 'شارع الجمهورية - بجوار محطة الوقود',
      invoice_footer: 'شكراً لتعاملكم معنا! البضاعة المباعة ترد أو تستبدل خلال 14 يوماً بالفاتورة',
      barcode_width: '40',
      barcode_height: '30',
      printer_type: 'thermal_80mm',
      auto_print: '1',
    };

    for (const [k, v] of Object.entries(defaultSettings)) {
      run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [k, v]);
    }
  }

  // Sample Products for quick demo/first run if products table is empty
  const prodCount = queryOne('SELECT COUNT(*) as cnt FROM products');
  if (!prodCount || prodCount.cnt === 0) {
    const sampleProducts = [
      {
        barcode: '1001001',
        name: 'تيل فرامل أمامي كوري - دايو لانوس / نوبيرا',
        cat_id: 1,
        buy: 220,
        sell: 290,
        qty: 18,
        min: 4,
      },
      {
        barcode: '1001002',
        name: 'طقم بوجيهات NGK سن رفيع ياباني أصلي',
        cat_id: 1,
        buy: 180,
        sell: 240,
        qty: 25,
        min: 6,
      },
      {
        barcode: '1001003',
        name: 'فلتر زيت تويوتا كورولا ياباني',
        cat_id: 1,
        buy: 75,
        sell: 110,
        qty: 30,
        min: 5,
      },
      {
        barcode: '2001001',
        name: 'مساعد خلفي موتوسيكل دايو 4 / هوجان 8',
        cat_id: 2,
        buy: 280,
        sell: 370,
        qty: 12,
        min: 3,
      },
      {
        barcode: '2001002',
        name: 'جنزير ذهبي معزز 428 موتوسيكل بوكسر',
        cat_id: 2,
        buy: 140,
        sell: 195,
        qty: 15,
        min: 4,
      },
      {
        barcode: '3001001',
        name: 'جركن زيت شل هيلكس HX7 10W-40 (4 لتر)',
        cat_id: 3,
        buy: 780,
        sell: 920,
        qty: 8,
        min: 3,
      },
      {
        barcode: '3001002',
        name: 'زيت موتوسيكل موتول 20W-50 4T (1 لتر)',
        cat_id: 3,
        buy: 160,
        sell: 210,
        qty: 24,
        min: 5,
      },
      {
        barcode: '4001001',
        name: 'بطارية جافة كلورايد 12V 70Ah للسيارة',
        cat_id: 4,
        buy: 1850,
        sell: 2150,
        qty: 6,
        min: 2,
      },
    ];

    for (const p of sampleProducts) {
      run(
        `INSERT INTO products (barcode, name, category_id, buy_price, sell_price, quantity, min_quantity)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [p.barcode, p.name, p.cat_id, p.buy, p.sell, p.qty, p.min]
      );
    }
  }

  persistDb();
}
