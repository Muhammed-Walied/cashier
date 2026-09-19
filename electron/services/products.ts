import { queryAll, queryOne, run } from '../database/db';
import { Product, Category, ApiResponse } from '../types';

export function getCategories(): ApiResponse<Category[]> {
  try {
    const cats = queryAll<Category>('SELECT id, name, description, type FROM categories ORDER BY id ASC');
    return { success: true, data: cats };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function createCategory(cat: Partial<Category>): ApiResponse<Category> {
  try {
    const res = run('INSERT INTO categories (name, description, type) VALUES (?, ?, ?)', [
      cat.name,
      cat.description || '',
      cat.type || 'both',
    ]);
    const created = queryOne<Category>('SELECT * FROM categories WHERE id = ?', [res.lastInsertRowid]);
    return { success: true, data: created! };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function getProducts(search?: string, categoryId?: number): ApiResponse<Product[]> {
  try {
    let sql = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1
    `;
    const params: any[] = [];

    if (categoryId && categoryId > 0) {
      sql += ' AND p.category_id = ?';
      params.push(categoryId);
    }

    if (search && search.trim() !== '') {
      sql += ' AND (p.name LIKE ? OR p.barcode LIKE ? OR p.description LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY p.id DESC';

    const products = queryAll<Product>(sql, params);
    return { success: true, data: products };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function getProductByBarcode(barcode: string): ApiResponse<Product | null> {
  try {
    const trimmed = barcode.trim();
    const product = queryOne<Product>(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.barcode = ? AND p.is_active = 1`,
      [trimmed]
    );
    return { success: true, data: product || null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function createProduct(
  productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>
): ApiResponse<Product> {
  try {
    // Generate barcode if not provided
    let barcode = productData.barcode ? productData.barcode.trim() : '';
    if (!barcode) {
      barcode = 'PRD' + Date.now().toString().slice(-8);
    }

    // Check barcode uniqueness
    const existing = queryOne('SELECT id FROM products WHERE barcode = ? AND is_active = 1', [barcode]);
    if (existing) {
      return { success: false, error: `الباركود (${barcode}) مسجل بالفعل لمنتج آخر!` };
    }

    const res = run(
      `INSERT INTO products (
        barcode, name, description, category_id, buy_price, sell_price,
        quantity, min_quantity, unit, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        barcode,
        productData.name.trim(),
        productData.description || '',
        productData.category_id || null,
        productData.buy_price || 0,
        productData.sell_price || 0,
        productData.quantity || 0,
        productData.min_quantity || 5,
        productData.unit || 'قطعة',
      ]
    );

    const created = queryOne<Product>(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [res.lastInsertRowid]
    );

    return { success: true, data: created! };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function updateProduct(id: number, productData: Partial<Product>): ApiResponse<boolean> {
  try {
    if (productData.barcode) {
      const existing = queryOne('SELECT id FROM products WHERE barcode = ? AND id != ? AND is_active = 1', [
        productData.barcode.trim(),
        id,
      ]);
      if (existing) {
        return { success: false, error: 'الباركود مسجل بالفعل لمنتج آخر!' };
      }
    }

    run(
      `UPDATE products SET
        barcode = COALESCE(?, barcode),
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        category_id = COALESCE(?, category_id),
        buy_price = COALESCE(?, buy_price),
        sell_price = COALESCE(?, sell_price),
        quantity = COALESCE(?, quantity),
        min_quantity = COALESCE(?, min_quantity),
        unit = COALESCE(?, unit),
        updated_at = datetime('now', 'localtime')
      WHERE id = ?`,
      [
        productData.barcode?.trim() ?? null,
        productData.name?.trim() ?? null,
        productData.description ?? null,
        productData.category_id ?? null,
        productData.buy_price ?? null,
        productData.sell_price ?? null,
        productData.quantity ?? null,
        productData.min_quantity ?? null,
        productData.unit ?? null,
        id,
      ]
    );

    return { success: true, data: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function deleteProduct(id: number): ApiResponse<boolean> {
  try {
    run('UPDATE products SET is_active = 0, updated_at = datetime("now", "localtime") WHERE id = ?', [id]);
    return { success: true, data: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function getLowStockProducts(): ApiResponse<Product[]> {
  try {
    const products = queryAll<Product>(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = 1 AND p.quantity <= p.min_quantity
       ORDER BY p.quantity ASC`
    );
    return { success: true, data: products };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
