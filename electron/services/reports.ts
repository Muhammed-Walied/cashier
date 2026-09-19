import { queryAll, queryOne } from '../database/db';
import { ApiResponse } from '../types';

export function getDashboardStats(): ApiResponse<{
  todaySales: number;
  todayProfit: number;
  todayInvoicesCount: number;
  totalProductsCount: number;
  lowStockCount: number;
  totalDebts: number;
}> {
  try {
    // Today's Sales & Invoices Count
    const todaySalesRes = queryOne<{ total: number; cnt: number }>(
      `SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as cnt
       FROM invoices
       WHERE date(created_at) = date('now', 'localtime')`
    );

    // Today's Profit: item total - (buy_price * quantity)
    const todayProfitRes = queryOne<{ profit: number }>(
      `SELECT COALESCE(SUM(ii.total - (ii.buy_price * ii.quantity)), 0) as profit
       FROM invoice_items ii
       JOIN invoices i ON ii.invoice_id = i.id
       WHERE date(i.created_at) = date('now', 'localtime')`
    );

    // Active Products Count
    const prodCountRes = queryOne<{ cnt: number }>(
      'SELECT COUNT(*) as cnt FROM products WHERE is_active = 1'
    );

    // Low stock count
    const lowStockRes = queryOne<{ cnt: number }>(
      'SELECT COUNT(*) as cnt FROM products WHERE is_active = 1 AND quantity <= min_quantity'
    );

    // Total outstanding debts
    const debtsRes = queryOne<{ debt: number }>(
      'SELECT COALESCE(SUM(remaining), 0) as debt FROM invoices WHERE status != "paid"'
    );

    return {
      success: true,
      data: {
        todaySales: todaySalesRes?.total || 0,
        todayProfit: todayProfitRes?.profit || 0,
        todayInvoicesCount: todaySalesRes?.cnt || 0,
        totalProductsCount: prodCountRes?.cnt || 0,
        lowStockCount: lowStockRes?.cnt || 0,
        totalDebts: debtsRes?.debt || 0,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function getSalesReport(period: 'day' | 'week' | 'month' | 'year' = 'month', targetDate?: string): ApiResponse<any> {
  try {
    // Trend data for chart (e.g. last 14 days)
    const trendSql = `
      SELECT date(i.created_at) as date,
             COALESCE(SUM(i.total), 0) as sales,
             COALESCE(SUM(ii.total - (ii.buy_price * ii.quantity)), 0) as profit,
             COUNT(DISTINCT i.id) as count
      FROM invoices i
      LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
      WHERE date(i.created_at) >= date('now', 'localtime', '-14 days')
      GROUP BY date(i.created_at)
      ORDER BY date(i.created_at) ASC
    `;
    const trendData = queryAll(trendSql);

    // Top selling products
    const topProductsSql = `
      SELECT ii.product_name,
             SUM(ii.quantity) as total_qty,
             SUM(ii.total) as total_revenue
      FROM invoice_items ii
      GROUP BY ii.product_name
      ORDER BY total_qty DESC
      LIMIT 6
    `;
    const topProducts = queryAll(topProductsSql);

    // Sales by category
    const categorySalesSql = `
      SELECT COALESCE(c.name, 'أخرى') as category_name,
             COALESCE(SUM(ii.total), 0) as revenue
      FROM invoice_items ii
      LEFT JOIN products p ON ii.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      GROUP BY c.name
      ORDER BY revenue DESC
    `;
    const categorySales = queryAll(categorySalesSql);

    return {
      success: true,
      data: {
        trendData,
        topProducts,
        categorySales,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
