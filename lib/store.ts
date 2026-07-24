'use client';

import { MenuItem, MenuCategory, TableItem, Order, OrderItem, Payment, InventoryItem, Restaurant, UserProfile } from './supabase';

export const INITIAL_RESTAURANT: Restaurant = {
  id: 'e8f98a21-9988-4221-a111-111111111111',
  name: 'Green Park Family Restaurant',
  upi_id: 'greenpark@upi',
  tax_percent: 5.0,
};

export const INITIAL_TABLES: TableItem[] = [
  { id: 't-1', name: 'Table 1', status: 'empty', restaurant_id: INITIAL_RESTAURANT.id },
  { id: 't-2', name: 'Table 2', status: 'occupied', restaurant_id: INITIAL_RESTAURANT.id },
  { id: 't-3', name: 'Table 3', status: 'bill_requested', restaurant_id: INITIAL_RESTAURANT.id },
  { id: 't-4', name: 'Table 4', status: 'empty', restaurant_id: INITIAL_RESTAURANT.id },
  { id: 't-5', name: 'Table 5', status: 'empty', restaurant_id: INITIAL_RESTAURANT.id },
  { id: 't-6', name: 'Table 6', status: 'empty', restaurant_id: INITIAL_RESTAURANT.id },
];

export const INITIAL_CATEGORIES: MenuCategory[] = [
  { id: 'c-1', name: 'Starters', restaurant_id: INITIAL_RESTAURANT.id },
  { id: 'c-2', name: 'Main Course', restaurant_id: INITIAL_RESTAURANT.id },
  { id: 'c-3', name: 'Breads & Rice', restaurant_id: INITIAL_RESTAURANT.id },
  { id: 'c-4', name: 'Beverages', restaurant_id: INITIAL_RESTAURANT.id },
  { id: 'c-5', name: 'Desserts', restaurant_id: INITIAL_RESTAURANT.id },
];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  { id: 'm-1', name: 'Paneer Tikka', category_id: 'c-1', rate: 240, is_veg: true, in_stock: true, restaurant_id: INITIAL_RESTAURANT.id },
  { id: 'm-2', name: 'Chicken 65', category_id: 'c-1', rate: 280, is_veg: false, in_stock: true, restaurant_id: INITIAL_RESTAURANT.id },
  { id: 'm-3', name: 'Crispy Veg Corn', category_id: 'c-1', rate: 190, is_veg: true, in_stock: true, restaurant_id: INITIAL_RESTAURANT.id },
  { id: 'm-4', name: 'Butter Chicken', category_id: 'c-2', rate: 320, is_veg: false, in_stock: true, restaurant_id: INITIAL_RESTAURANT.id },
  { id: 'm-5', name: 'Dal Makhani', category_id: 'c-2', rate: 210, is_veg: true, in_stock: true, restaurant_id: INITIAL_RESTAURANT.id },
  { id: 'm-6', name: 'Paneer Butter Masala', category_id: 'c-2', rate: 260, is_veg: true, in_stock: true, restaurant_id: INITIAL_RESTAURANT.id },
  { id: 'm-7', name: 'Butter Naan', category_id: 'c-3', rate: 50, is_veg: true, in_stock: true, restaurant_id: INITIAL_RESTAURANT.id },
  { id: 'm-8', name: 'Hyderabadi Chicken Biryani', category_id: 'c-3', rate: 290, is_veg: false, in_stock: true, restaurant_id: INITIAL_RESTAURANT.id },
  { id: 'm-9', name: 'Jeera Rice', category_id: 'c-3', rate: 140, is_veg: true, in_stock: true, restaurant_id: INITIAL_RESTAURANT.id },
  { id: 'm-10', name: 'Fresh Lime Soda', category_id: 'c-4', rate: 80, is_veg: true, in_stock: true, restaurant_id: INITIAL_RESTAURANT.id },
  { id: 'm-11', name: 'Mango Lassi', category_id: 'c-4', rate: 110, is_veg: true, in_stock: true, restaurant_id: INITIAL_RESTAURANT.id },
  { id: 'm-12', name: 'Gulab Jamun (2 pcs)', category_id: 'c-5', rate: 90, is_veg: true, in_stock: true, restaurant_id: INITIAL_RESTAURANT.id },
  { id: 'm-13', name: 'Sizzling Brownie', category_id: 'c-5', rate: 180, is_veg: true, in_stock: false, restaurant_id: INITIAL_RESTAURANT.id },
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-101',
    table_id: 't-2',
    table_name: 'Table 2',
    status: 'pending',
    waiter_id: 'w-1',
    waiter_name: 'Rahul (Waiter)',
    restaurant_id: INITIAL_RESTAURANT.id,
    created_at: new Date(Date.now() - 12 * 60000).toISOString(),
    items: [
      { id: 'oi-1', order_id: 'ord-101', menu_item_id: 'm-2', item_name: 'Chicken 65', quantity: 1, notes: 'Extra crispy', rate_at_order: 280, kot_batch: 1 },
      { id: 'oi-2', order_id: 'ord-101', menu_item_id: 'm-8', item_name: 'Hyderabadi Chicken Biryani', quantity: 2, notes: 'Medium spicy', rate_at_order: 290, kot_batch: 1 },
      { id: 'oi-3', order_id: 'ord-101', menu_item_id: 'm-10', item_name: 'Fresh Lime Soda', quantity: 2, notes: 'Less sugar', rate_at_order: 80, kot_batch: 1 },
    ],
  },
  {
    id: 'ord-102',
    table_id: 't-3',
    table_name: 'Table 3',
    status: 'ready',
    waiter_id: 'w-2',
    waiter_name: 'Priya (Waiter)',
    restaurant_id: INITIAL_RESTAURANT.id,
    created_at: new Date(Date.now() - 25 * 60000).toISOString(),
    items: [
      { id: 'oi-4', order_id: 'ord-102', menu_item_id: 'm-1', item_name: 'Paneer Tikka', quantity: 1, notes: 'Mint chutney extra', rate_at_order: 240, kot_batch: 1 },
      { id: 'oi-5', order_id: 'ord-102', menu_item_id: 'm-6', item_name: 'Paneer Butter Masala', quantity: 1, notes: '', rate_at_order: 260, kot_batch: 1 },
      { id: 'oi-6', order_id: 'ord-102', menu_item_id: 'm-7', item_name: 'Butter Naan', quantity: 4, notes: '', rate_at_order: 50, kot_batch: 1 },
    ],
  },
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'inv-1', name: 'Basmati Rice', quantity: 25.0, unit: 'kg', low_stock_threshold: 10.0, restaurant_id: INITIAL_RESTAURANT.id },
  { id: 'inv-2', name: 'Paneer', quantity: 4.5, unit: 'kg', low_stock_threshold: 5.0, restaurant_id: INITIAL_RESTAURANT.id },
  { id: 'inv-3', name: 'Fresh Chicken', quantity: 18.0, unit: 'kg', low_stock_threshold: 8.0, restaurant_id: INITIAL_RESTAURANT.id },
  { id: 'inv-4', name: 'Amul Butter', quantity: 3.0, unit: 'kg', low_stock_threshold: 4.0, restaurant_id: INITIAL_RESTAURANT.id },
  { id: 'inv-5', name: 'Cooking Oil', quantity: 40.0, unit: 'Ltr', low_stock_threshold: 15.0, restaurant_id: INITIAL_RESTAURANT.id },
];

export const INITIAL_STAFF: UserProfile[] = [
  { id: 'w-1', name: 'Rahul Sharma', phone: '9876543210', role: 'waiter', restaurant_id: INITIAL_RESTAURANT.id },
  { id: 'w-2', name: 'Priya Patel', phone: '9876543211', role: 'waiter', restaurant_id: INITIAL_RESTAURANT.id },
  { id: 'k-1', name: 'Master Chef Kumar', phone: '9876543212', role: 'kitchen', restaurant_id: INITIAL_RESTAURANT.id },
  { id: 'c-1', name: 'Suresh Kumar', phone: '9876543213', role: 'cashier', restaurant_id: INITIAL_RESTAURANT.id },
  { id: 'a-1', name: 'Restaurant Admin', phone: '9876543214', role: 'admin', restaurant_id: INITIAL_RESTAURANT.id },
];

export const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay-1',
    order_id: 'ord-100',
    table_name: 'Table 1',
    subtotal: 750,
    tax: 37.5,
    discount: 0,
    total: 787.5,
    method: 'upi',
    paid_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    cashier_id: 'c-1',
    restaurant_id: INITIAL_RESTAURANT.id,
  },
  {
    id: 'pay-2',
    order_id: 'ord-99',
    table_name: 'Table 4',
    subtotal: 1200,
    tax: 60,
    discount: 50,
    total: 1210,
    method: 'cash',
    paid_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    cashier_id: 'c-1',
    restaurant_id: INITIAL_RESTAURANT.id,
  },
];

// Helper functions for state management with LocalStorage sync
export function getStoredData<T>(key: string, initialData: T): T {
  if (typeof window === 'undefined') return initialData;
  try {
    const stored = localStorage.getItem(`gp_${key}`);
    return stored ? JSON.parse(stored) : initialData;
  } catch {
    return initialData;
  }
}

export function setStoredData<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`gp_${key}`, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('gp_store_update', { detail: { key } }));
  } catch (err) {
    console.error(`Failed to store data for ${key}:`, err);
  }
}
