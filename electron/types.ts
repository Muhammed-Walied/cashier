export interface User {
  id: number;
  username: string;
  password_hash?: string;
  display_name: string;
  role: 'admin' | 'cashier';
  is_active: number;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  type: 'car' | 'motorcycle' | 'both';
}

export interface Product {
  id: number;
  barcode: string;
  name: string;
  description: string;
  category_id: number;
  category_name?: string;
  buy_price: number;
  sell_price: number;
  quantity: number;
  min_quantity: number;
  unit: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  address: string;
  notes: string;
  total_debt?: number;
  created_at: string;
}

export interface InvoiceItem {
  id?: number;
  invoice_id?: number;
  product_id: number;
  product_name: string;
  barcode: string;
  unit_price: number;
  buy_price?: number;
  quantity: number;
  total: number;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  customer_id?: number | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  user_id: number;
  user_name?: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: 'cash' | 'credit';
  paid_amount: number;
  remaining: number;
  status: 'paid' | 'partial' | 'unpaid';
  notes: string;
  created_at: string;
  items?: InvoiceItem[];
}

export interface ShopSettings {
  shop_name: string;
  shop_phone: string;
  shop_address: string;
  invoice_footer: string;
  barcode_width: number;
  barcode_height: number;
  printer_type: 'thermal_80mm' | 'thermal_58mm' | 'standard';
  auto_print: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
