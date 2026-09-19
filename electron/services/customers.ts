import { queryAll, queryOne, run } from '../database/db';
import { Customer, Invoice, ApiResponse } from '../types';

export function getCustomers(search?: string): ApiResponse<Customer[]> {
  try {
    let sql = `
      SELECT c.*,
             COALESCE(SUM(i.remaining), 0) as total_debt
      FROM customers c
      LEFT JOIN invoices i ON c.id = i.customer_id AND i.status != 'paid'
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search && search.trim() !== '') {
      sql += ' AND (c.name LIKE ? OR c.phone LIKE ? OR c.address LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    sql += ' GROUP BY c.id ORDER BY c.id DESC';

    const customers = queryAll<Customer>(sql, params);
    return { success: true, data: customers };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function createCustomer(
  customerData: Omit<Customer, 'id' | 'created_at' | 'total_debt'>
): ApiResponse<Customer> {
  try {
    const res = run(
      'INSERT INTO customers (name, phone, address, notes) VALUES (?, ?, ?, ?)',
      [
        customerData.name.trim(),
        customerData.phone?.trim() || '',
        customerData.address?.trim() || '',
        customerData.notes?.trim() || '',
      ]
    );

    const created = queryOne<Customer>('SELECT *, 0 as total_debt FROM customers WHERE id = ?', [
      res.lastInsertRowid,
    ]);

    return { success: true, data: created! };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function updateCustomer(id: number, customerData: Partial<Customer>): ApiResponse<boolean> {
  try {
    run(
      `UPDATE customers SET
        name = COALESCE(?, name),
        phone = COALESCE(?, phone),
        address = COALESCE(?, address),
        notes = COALESCE(?, notes)
      WHERE id = ?`,
      [
        customerData.name?.trim() ?? null,
        customerData.phone?.trim() ?? null,
        customerData.address?.trim() ?? null,
        customerData.notes?.trim() ?? null,
        id,
      ]
    );
    return { success: true, data: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function deleteCustomer(id: number): ApiResponse<boolean> {
  try {
    // Check if customer has outstanding debt
    const debtRes = queryOne<{ debt: number }>(
      'SELECT COALESCE(SUM(remaining), 0) as debt FROM invoices WHERE customer_id = ? AND status != "paid"',
      [id]
    );
    if (debtRes && debtRes.debt > 0) {
      return {
        success: false,
        error: `لا يمكن حذف هذا العميل لوجود مديونية مستحقة عليه بقيمة ${debtRes.debt.toFixed(2)} ج.م`,
      };
    }

    run('DELETE FROM customers WHERE id = ?', [id]);
    return { success: true, data: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function getCustomerInvoices(customerId: number): ApiResponse<Invoice[]> {
  try {
    const invoices = queryAll<Invoice>(
      `SELECT i.*, u.display_name as user_name
       FROM invoices i
       LEFT JOIN users u ON i.user_id = u.id
       WHERE i.customer_id = ?
       ORDER BY i.id DESC`,
      [customerId]
    );
    return { success: true, data: invoices };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
