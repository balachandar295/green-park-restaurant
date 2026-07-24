import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UserProfile {
  id: string;
  name: string;
  phone?: string;
  role: 'waiter' | 'kitchen' | 'cashier' | 'admin';
  restaurant_id: string;
}

export interface Restaurant {
  id: string;
  name: string;
  upi_id: string;
  tax_percent: number;
}

export interface TableItem {
  id: string;
  name: string;
  status: 'empty' | 'occupied' | 'bill_requested';
  restaurant_id: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  restaurant_id: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category_id: string;
  rate: number;
  is_veg: boolean;
  in_stock: boolean;
  image_url?: string;
  restaurant_id: string;
}

export interface Order {
  id: string;
  table_id: string;
  table_name?: string;
  status: 'pending' | 'preparing' | 'ready' | 'billed' | 'completed' | 'cancelled';
  waiter_id?: string;
  waiter_name?: string;
  restaurant_id: string;
  created_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  item_name?: string;
  quantity: number;
  notes?: string;
  rate_at_order: number;
  kot_batch: number;
  created_at?: string;
}

export interface Payment {
  id: string;
  order_id: string;
  table_name?: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  method: 'cash' | 'upi' | 'card';
  paid_at: string;
  cashier_id?: string;
  restaurant_id: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  low_stock_threshold: number;
  restaurant_id: string;
}
