import { queryAll, queryOne, run, persistDb } from '../database/db';
import { Invoice, InvoiceItem, Product, ApiResponse } from '../types';

export function createInvoice(data: {
  customer_id?: number | null;
  user_id: number;
  items: { product_id: number; quantity: number; unit_price: number }[];
  discount: number;
  payment_method: 'cash' | 'credit';
  paid_amount: number;
  notes?: string;
}): ApiResponse<Invoice> {
  try {
    if (!data.items || data.items.length === 0) {
      return { success: false, error: 'الفاتورة فارغة، برجاء إضافة منتجات أولاً' };
    }

    // Validate and fetch current product snapshots
    const resolvedItems: (InvoiceItem & { current_stock: number })[] = [];
    let calculatedSubtotal = 0;

    for (const item of data.items) {
      const prod = queryOne<Product>('SELECT * FROM products WHERE id = ?', [item.product_id]);
      if (!prod) {
        return { success: false, error: `المنتج رقم (${item.product_id}) غير موجود!` };
      }

      if (prod.quantity < item.quantity) {
        return {
          success: false,
          error: `الكمية المطلوبة من "${prod.name}" (${item.quantity}) أكبر من المتاح في المخزن (${prod.quantity})!`,
        };
      }

      const itemTotal = item.quantity * item.unit_price;
      calculatedSubtotal += itemTotal;

      resolvedItems.push({
        product_id: prod.id,
        product_name: prod.name,
        barcode: prod.barcode,
        unit_price: item.unit_price,
        buy_price: prod.buy_price,
        quantity: item.quantity,
        total: itemTotal,
        current_stock: prod.quantity,
      });
    }

    const discount = Math.max(0, Number(data.discount) || 0);
    const total = Math.max(0, calculatedSubtotal - discount);
    const paid_amount = Math.min(total, Math.max(0, Number(data.paid_amount) || 0));
    const remaining = Math.max(0, total - paid_amount);

    let status: 'paid' | 'partial' | 'unpaid' = 'paid';
    if (remaining > 0) {
      status = paid_amount > 0 ? 'partial' : 'unpaid';
    }

    // Generate unique invoice number: INV-YYYYMMDD-XXXX
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const todayCountRes = queryOne<{ cnt: number }>(
      "SELECT COUNT(*) as cnt FROM invoices WHERE created_at LIKE date('now', 'localtime') || '%'"
    );
    const seq = ((todayCountRes?.cnt || 0) + 1).toString().padStart(4, '0');
    const invoiceNumber = `INV-${dateStr}-${seq}`;

    // Insert Invoice
    const invoiceRes = run(
      `INSERT INTO invoices (
        invoice_number, customer_id, user_id, subtotal, discount, total,
        payment_method, paid_amount, remaining, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoiceNumber,
        data.customer_id || null,
        data.user_id,
        calculatedSubtotal,
        discount,
        total,
        data.payment_method,
        paid_amount,
        remaining,
        status,
        data.notes || '',
      ]
    );

    const invoiceId = invoiceRes.lastInsertRowid;

    // Insert Items and decrement stock
    for (const item of resolvedItems) {
      run(
        `INSERT INTO invoice_items (
          invoice_id, product_id, product_name, barcode, unit_price, buy_price, quantity, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          invoiceId,
          item.product_id,
          item.product_name,
          item.barcode,
          item.unit_price,
          item.buy_price || 0,
          item.quantity,
          item.total,
        ]
      );

      // Decrement product inventory
      run(
        `UPDATE products SET quantity = quantity - ?, updated_at = datetime('now', 'localtime') WHERE id = ?`,
        [item.quantity, item.product_id]
      );
    }

    persistDb();

    // Fetch complete invoice with joined names
    const completeInvoice = getInvoiceDetails(invoiceId);
    if (!completeInvoice.success || !completeInvoice.data) {
      throw new Error('فشل جلب تفاصيل الفاتورة بعد الإنشاء');
    }

    return { success: true, data: completeInvoice.data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function getInvoices(filters?: {
  startDate?: string;
  endDate?: string;
  customerId?: number;
  status?: string;
}): ApiResponse<Invoice[]> {
  try {
    let sql = `
      SELECT i.*,
             c.name as customer_name,
             c.phone as customer_phone,
             u.display_name as user_name
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN users u ON i.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.startDate) {
      sql += ' AND date(i.created_at) >= date(?)';
      params.push(filters.startDate);
    }

    if (filters?.endDate) {
      sql += ' AND date(i.created_at) <= date(?)';
      params.push(filters.endDate);
    }

    if (filters?.customerId) {
      sql += ' AND i.customer_id = ?';
      params.push(filters.customerId);
    }

    if (filters?.status && filters.status !== 'all') {
      sql += ' AND i.status = ?';
      params.push(filters.status);
    }

    sql += ' ORDER BY i.id DESC';

    const invoices = queryAll<Invoice>(sql, params);
    return { success: true, data: invoices };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function getInvoiceDetails(id: number): ApiResponse<Invoice> {
  try {
    const invoice = queryOne<Invoice>(
      `SELECT i.*,
              c.name as customer_name,
              c.phone as customer_phone,
              u.display_name as user_name
       FROM invoices i
       LEFT JOIN customers c ON i.customer_id = c.id
       LEFT JOIN users u ON i.user_id = u.id
       WHERE i.id = ?`,
      [id]
    );

    if (!invoice) {
      return { success: false, error: 'الفاتورة غير موجودة' };
    }

    const items = queryAll<InvoiceItem>(
      'SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY id ASC',
      [id]
    );

    invoice.items = items;
    return { success: true, data: invoice };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function cancelInvoice(id: number): ApiResponse<boolean> {
  try {
    const invoice = queryOne<Invoice>('SELECT * FROM invoices WHERE id = ?', [id]);
    if (!invoice) {
      return { success: false, error: 'الفاتورة غير موجودة' };
    }

    // Get items to restore stock
    const items = queryAll<InvoiceItem>('SELECT * FROM invoice_items WHERE invoice_id = ?', [id]);
    for (const item of items) {
      if (item.product_id) {
        run('UPDATE products SET quantity = quantity + ? WHERE id = ?', [item.quantity, item.product_id]);
      }
    }

    // Delete invoice items and invoice
    run('DELETE FROM invoice_items WHERE invoice_id = ?', [id]);
    run('DELETE FROM invoices WHERE id = ?', [id]);

    persistDb();
    return { success: true, data: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
