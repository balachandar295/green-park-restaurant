'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  LogOut, 
  Utensils, 
  Grid, 
  Users, 
  Settings as SettingsIcon, 
  BarChart3, 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Download, 
  AlertTriangle,
  QrCode,
  Percent,
  Search,
  DollarSign,
  TrendingUp,
  ShoppingBag
} from 'lucide-react';
import { 
  INITIAL_RESTAURANT, 
  INITIAL_TABLES, 
  INITIAL_CATEGORIES, 
  INITIAL_MENU_ITEMS, 
  INITIAL_STAFF, 
  INITIAL_INVENTORY,
  INITIAL_PAYMENTS,
  getStoredData, 
  setStoredData 
} from '@/lib/store';
import { MenuItem, MenuCategory, TableItem, UserProfile, InventoryItem, Restaurant, Payment } from '@/lib/supabase';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'menu' | 'tables' | 'staff' | 'settings' | 'reports' | 'inventory'>('overview');
  
  // States
  const [restaurant, setRestaurant] = useState<Restaurant>(INITIAL_RESTAURANT);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Form States
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [menuForm, setMenuForm] = useState({ name: '', category_id: '', rate: '', is_veg: true, in_stock: true, image_url: '' });

  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [tableNameInput, setTableNameInput] = useState('');

  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', phone: '', role: 'waiter' as 'waiter' | 'kitchen' | 'cashier' | 'admin' });

  const [showAddInvModal, setShowAddInvModal] = useState(false);
  const [invForm, setInvForm] = useState({ name: '', quantity: '', unit: 'kg', low_stock_threshold: '5' });

  const [upiInput, setUpiInput] = useState('');
  const [taxInput, setTaxInput] = useState('5');
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Load store data
  useEffect(() => {
    setRestaurant(getStoredData('restaurant', INITIAL_RESTAURANT));
    setTables(getStoredData('tables', INITIAL_TABLES));
    setCategories(getStoredData('categories', INITIAL_CATEGORIES));
    setMenuItems(getStoredData('menu_items', INITIAL_MENU_ITEMS));
    setStaff(getStoredData('staff', INITIAL_STAFF));
    setInventory(getStoredData('inventory', INITIAL_INVENTORY));
    setPayments(getStoredData('payments', INITIAL_PAYMENTS));

    const storedRest = getStoredData('restaurant', INITIAL_RESTAURANT);
    setUpiInput(storedRest.upi_id);
    setTaxInput(storedRest.tax_percent.toString());
  }, []);

  const handleLogout = () => {
    document.cookie = 'gp_user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    localStorage.removeItem('gp_current_role');
    router.push('/');
  };

  // MENU MANAGEMENT HANDLERS
  const handleSaveMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuForm.name || !menuForm.category_id || !menuForm.rate) return;

    let updated: MenuItem[];
    if (editingMenuItem) {
      updated = menuItems.map((item) =>
        item.id === editingMenuItem.id
          ? {
              ...item,
              name: menuForm.name,
              category_id: menuForm.category_id,
              rate: parseFloat(menuForm.rate),
              is_veg: menuForm.is_veg,
              in_stock: menuForm.in_stock,
              image_url: menuForm.image_url,
            }
          : item
      );
    } else {
      const newItem: MenuItem = {
        id: `m-${Date.now()}`,
        name: menuForm.name,
        category_id: menuForm.category_id,
        rate: parseFloat(menuForm.rate),
        is_veg: menuForm.is_veg,
        in_stock: menuForm.in_stock,
        image_url: menuForm.image_url,
        restaurant_id: restaurant.id,
      };
      updated = [...menuItems, newItem];
    }

    setMenuItems(updated);
    setStoredData('menu_items', updated);
    setShowAddMenuModal(false);
    setEditingMenuItem(null);
    setMenuForm({ name: '', category_id: categories[0]?.id || '', rate: '', is_veg: true, in_stock: true, image_url: '' });
  };

  const handleToggleStock = (itemId: string) => {
    const updated = menuItems.map((item) =>
      item.id === itemId ? { ...item, in_stock: !item.in_stock } : item
    );
    setMenuItems(updated);
    setStoredData('menu_items', updated);
  };

  const handleDeleteMenuItem = (itemId: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    const updated = menuItems.filter((item) => item.id !== itemId);
    setMenuItems(updated);
    setStoredData('menu_items', updated);
  };

  // TABLE HANDLERS
  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNameInput) return;
    const newTable: TableItem = {
      id: `t-${Date.now()}`,
      name: tableNameInput,
      status: 'empty',
      restaurant_id: restaurant.id,
    };
    const updated = [...tables, newTable];
    setTables(updated);
    setStoredData('tables', updated);
    setTableNameInput('');
    setShowAddTableModal(false);
  };

  const handleDeleteTable = (tableId: string) => {
    if (!confirm('Delete this table?')) return;
    const updated = tables.filter((t) => t.id !== tableId);
    setTables(updated);
    setStoredData('tables', updated);
  };

  // STAFF HANDLERS
  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.name) return;
    const newStaff: UserProfile = {
      id: `u-${Date.now()}`,
      name: staffForm.name,
      phone: staffForm.phone,
      role: staffForm.role,
      restaurant_id: restaurant.id,
    };
    const updated = [...staff, newStaff];
    setStaff(updated);
    setStoredData('staff', updated);
    setStaffForm({ name: '', phone: '', role: 'waiter' });
    setShowAddStaffModal(false);
  };

  const handleDeleteStaff = (staffId: string) => {
    if (!confirm('Remove staff account?')) return;
    const updated = staff.filter((s) => s.id !== staffId);
    setStaff(updated);
    setStoredData('staff', updated);
  };

  // SETTINGS HANDLER
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedRest: Restaurant = {
      ...restaurant,
      upi_id: upiInput,
      tax_percent: parseFloat(taxInput) || 5.0,
    };
    setRestaurant(updatedRest);
    setStoredData('restaurant', updatedRest);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  // INVENTORY HANDLERS
  const handleAddInventory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invForm.name || !invForm.quantity) return;
    const newInv: InventoryItem = {
      id: `inv-${Date.now()}`,
      name: invForm.name,
      quantity: parseFloat(invForm.quantity),
      unit: invForm.unit,
      low_stock_threshold: parseFloat(invForm.low_stock_threshold) || 5,
      restaurant_id: restaurant.id,
    };
    const updated = [...inventory, newInv];
    setInventory(updated);
    setStoredData('inventory', updated);
    setInvForm({ name: '', quantity: '', unit: 'kg', low_stock_threshold: '5' });
    setShowAddInvModal(false);
  };

  const handleUpdateStockQty = (id: string, delta: number) => {
    const updated = inventory.map((inv) =>
      inv.id === id ? { ...inv, quantity: Math.max(0, inv.quantity + delta) } : inv
    );
    setInventory(updated);
    setStoredData('inventory', updated);
  };

  const handleDeleteInventory = (id: string) => {
    if (!confirm('Delete inventory item?')) return;
    const updated = inventory.filter((inv) => inv.id !== id);
    setInventory(updated);
    setStoredData('inventory', updated);
  };

  // REPORT CALCULATIONS
  const totalRevenue = payments.reduce((acc, p) => acc + p.total, 0);
  const totalOrdersCount = payments.length;
  const paymentMethodData = [
    { name: 'UPI', value: payments.filter((p) => p.method === 'upi').reduce((a, b) => a + b.total, 0) || 787.5 },
    { name: 'Cash', value: payments.filter((p) => p.method === 'cash').reduce((a, b) => a + b.total, 0) || 1210 },
    { name: 'Card', value: payments.filter((p) => p.method === 'card').reduce((a, b) => a + b.total, 0) || 450 },
  ];
  const COLORS = ['#16a34a', '#2563eb', '#d97706'];

  const salesByDay = [
    { day: 'Mon', sales: 4200 },
    { day: 'Tue', sales: 5800 },
    { day: 'Wed', sales: 5100 },
    { day: 'Thu', sales: 6400 },
    { day: 'Fri', sales: 8900 },
    { day: 'Sat', sales: 12500 },
    { day: 'Sun', sales: 14200 },
  ];

  const exportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'ID,Table,Subtotal,Tax,Discount,Total,Method,Paid At\n' +
      payments
        .map((p) => `${p.id},${p.table_name || 'Table'},${p.subtotal},${p.tax},${p.discount},${p.total},${p.method},${p.paid_at}`)
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20 md:pb-6">
      
      {/* Top Navbar */}
      <header className="bg-white border-b border-emerald-100 px-4 py-3 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <Image src="/logo-v3.png" alt="Logo" fill className="object-contain" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 leading-tight">
                {restaurant.name}
              </h1>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Admin Panel
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 px-4">
        <div className="max-w-7xl mx-auto flex gap-1 overflow-x-auto py-2 no-scrollbar">
          {[
            { id: 'overview', label: 'Overview', icon: Grid },
            { id: 'menu', label: 'Menu', icon: Utensils },
            { id: 'tables', label: 'Tables', icon: Grid },
            { id: 'staff', label: 'Staff Accounts', icon: Users },
            { id: 'reports', label: 'Sales Reports', icon: BarChart3 },
            { id: 'inventory', label: 'Inventory', icon: Package },
            { id: 'settings', label: 'Settings', icon: SettingsIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6">

        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs flex items-center gap-3">
                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Today Revenue</p>
                  <p className="text-lg font-extrabold text-slate-900">₹{totalRevenue.toFixed(2)}</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs flex items-center gap-3">
                <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Orders Billed</p>
                  <p className="text-lg font-extrabold text-slate-900">{totalOrdersCount}</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs flex items-center gap-3">
                <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
                  <Grid className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Active Tables</p>
                  <p className="text-lg font-extrabold text-slate-900">
                    {tables.filter((t) => t.status !== 'empty').length} / {tables.length}
                  </p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-xs flex items-center gap-3">
                <div className="p-3 bg-rose-100 text-rose-700 rounded-xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Low Stock Alerts</p>
                  <p className="text-lg font-extrabold text-rose-600">
                    {inventory.filter((inv) => inv.quantity <= inv.low_stock_threshold).length}
                  </p>
                </div>
              </div>
            </div>

            {/* Live Table Map */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Grid className="w-4 h-4 text-emerald-600" />
                Live Table Status Overview
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {tables.map((t) => {
                  let bg = 'bg-slate-50 border-slate-200 text-slate-700';
                  let statusLabel = 'Empty';
                  if (t.status === 'occupied') {
                    bg = 'bg-amber-50 border-amber-300 text-amber-900';
                    statusLabel = 'Occupied';
                  } else if (t.status === 'bill_requested') {
                    bg = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold';
                    statusLabel = 'Bill Requested';
                  }
                  return (
                    <div key={t.id} className={`p-4 rounded-2xl border-2 text-center space-y-1 ${bg}`}>
                      <p className="text-base font-extrabold">{t.name}</p>
                      <p className="text-xs font-bold capitalize">{statusLabel}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 2. MENU MANAGEMENT TAB */}
        {activeTab === 'menu' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Food Menu Management</h2>
                <p className="text-xs text-slate-500 font-medium">Add, edit, toggle availability or update pricing</p>
              </div>
              <button
                onClick={() => {
                  setEditingMenuItem(null);
                  setMenuForm({ name: '', category_id: categories[0]?.id || '', rate: '', is_veg: true, in_stock: true, image_url: '' });
                  setShowAddMenuModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Type</th>
                      <th className="p-3.5">Item Name</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Price (₹)</th>
                      <th className="p-3.5">Availability</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {menuItems.map((item) => {
                      const cat = categories.find((c) => c.id === item.category_id);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50 transition">
                          <td className="p-3.5">
                            <span
                              className={`inline-block w-4 h-4 border-2 p-0.5 rounded-xs ${
                                item.is_veg ? 'border-green-600' : 'border-red-600'
                              }`}
                            >
                              <span
                                className={`block w-full h-full rounded-full ${
                                  item.is_veg ? 'bg-green-600' : 'bg-red-600'
                                }`}
                              />
                            </span>
                          </td>
                          <td className="p-3.5 font-bold text-slate-900">{item.name}</td>
                          <td className="p-3.5 text-slate-600">{cat?.name || 'Uncategorized'}</td>
                          <td className="p-3.5 font-extrabold text-emerald-700">₹{item.rate.toFixed(2)}</td>
                          <td className="p-3.5">
                            <button
                              onClick={() => handleToggleStock(item.id)}
                              className={`px-2.5 py-1 rounded-full text-xs font-bold border transition ${
                                item.in_stock
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {item.in_stock ? 'In Stock' : 'Out of Stock'}
                            </button>
                          </td>
                          <td className="p-3.5 text-right space-x-2">
                            <button
                              onClick={() => {
                                setEditingMenuItem(item);
                                setMenuForm({
                                  name: item.name,
                                  category_id: item.category_id,
                                  rate: item.rate.toString(),
                                  is_veg: item.is_veg,
                                  in_stock: item.in_stock,
                                  image_url: item.image_url || '',
                                });
                                setShowAddMenuModal(true);
                              }}
                              className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition inline-block"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteMenuItem(item.id)}
                              className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg transition inline-block"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. TABLES TAB */}
        {activeTab === 'tables' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Table Setup</h2>
                <p className="text-xs text-slate-500 font-medium">Add, renumber or delete tables</p>
              </div>
              <button
                onClick={() => setShowAddTableModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Table</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {tables.map((t) => (
                <div key={t.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{t.name}</h3>
                    <p className="text-xs text-slate-400 capitalize">Status: {t.status}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteTable(t.id)}
                    className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. STAFF ACCOUNTS TAB */}
        {activeTab === 'staff' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Staff Accounts & Roles</h2>
                <p className="text-xs text-slate-500 font-medium">Create and manage accounts for Waiters, Kitchen & Cashiers</p>
              </div>
              <button
                onClick={() => setShowAddStaffModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Staff</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {staff.map((s) => (
                <div key={s.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-900 text-sm">{s.name}</h3>
                      <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {s.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Phone: {s.phone || 'N/A'}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteStaff(s.id)}
                    className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. SALES REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Sales Reports & Analytics</h2>
                <p className="text-xs text-slate-500 font-medium">Daily, weekly totals and payment method breakdowns</p>
              </div>
              <button
                onClick={exportCSV}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Weekly Revenue Trend (₹)</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesByDay}>
                      <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="sales" fill="#16a34a" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Payment Method Share</h3>
                <div className="h-64 w-full flex justify-center items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={paymentMethodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {paymentMethodData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Past Payment Log */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 bg-slate-50 border-b border-slate-200 font-extrabold text-xs text-slate-700 uppercase">
                Recent Billed Transactions
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase">
                    <tr>
                      <th className="p-3">Order ID</th>
                      <th className="p-3">Table</th>
                      <th className="p-3">Method</th>
                      <th className="p-3">Subtotal</th>
                      <th className="p-3">Tax</th>
                      <th className="p-3">Discount</th>
                      <th className="p-3">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono text-slate-500">{p.id}</td>
                        <td className="p-3 font-bold">{p.table_name || 'Table'}</td>
                        <td className="p-3 uppercase font-bold text-emerald-700">{p.method}</td>
                        <td className="p-3">₹{p.subtotal.toFixed(2)}</td>
                        <td className="p-3">₹{p.tax.toFixed(2)}</td>
                        <td className="p-3">₹{p.discount.toFixed(2)}</td>
                        <td className="p-3 font-extrabold text-slate-900">₹{p.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 6. INVENTORY TAB */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Basic Inventory Tracking</h2>
                <p className="text-xs text-slate-500 font-medium">Manual stock adjustment & low stock threshold alerts</p>
              </div>
              <button
                onClick={() => setShowAddInvModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                    <tr>
                      <th className="p-3.5">Item Name</th>
                      <th className="p-3.5">Quantity</th>
                      <th className="p-3.5">Unit</th>
                      <th className="p-3.5">Low Stock Threshold</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Adjust Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {inventory.map((inv) => {
                      const isLow = inv.quantity <= inv.low_stock_threshold;
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50">
                          <td className="p-3.5 font-bold text-slate-900">{inv.name}</td>
                          <td className="p-3.5 font-extrabold text-base">{inv.quantity}</td>
                          <td className="p-3.5 text-slate-500 uppercase">{inv.unit}</td>
                          <td className="p-3.5 text-slate-500">{inv.low_stock_threshold} {inv.unit}</td>
                          <td className="p-3.5">
                            {isLow ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Low Stock
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Sufficient
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right space-x-1">
                            <button
                              onClick={() => handleUpdateStockQty(inv.id, -1)}
                              className="px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded font-bold"
                            >
                              -1
                            </button>
                            <button
                              onClick={() => handleUpdateStockQty(inv.id, 1)}
                              className="px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded font-bold"
                            >
                              +1
                            </button>
                            <button
                              onClick={() => handleDeleteInventory(inv.id)}
                              className="p-1 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded ml-2"
                            >
                              <Trash2 className="w-3.5 h-3.5 inline" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 7. SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="max-w-xl bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Restaurant Settings</h2>
              <p className="text-xs text-slate-500 font-medium">Configure UPI payment ID & default Tax %</p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  UPI VPA ID (For POS QR Code)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={upiInput}
                    onChange={(e) => setUpiInput(e.target.value)}
                    required
                    placeholder="e.g. greenpark@upi"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <QrCode className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Default Tax Percentage (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={taxInput}
                    onChange={(e) => setTaxInput(e.target.value)}
                    required
                    placeholder="5.0"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <Percent className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
                </div>
              </div>

              {settingsSaved && (
                <p className="text-xs font-bold text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  ✓ Settings saved successfully!
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition"
              >
                Save Settings
              </button>
            </form>
          </div>
        )}

      </main>

      {/* ADD MENU ITEM MODAL */}
      {showAddMenuModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingMenuItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h3>
              <button onClick={() => setShowAddMenuModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMenuItem} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={menuForm.name}
                  onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                  placeholder="e.g. Paneer Tikka"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label>
                <select
                  value={menuForm.category_id}
                  onChange={(e) => setMenuForm({ ...menuForm, category_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Rate (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={menuForm.rate}
                  onChange={(e) => setMenuForm({ ...menuForm, rate: e.target.value })}
                  placeholder="240.00"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                />
              </div>

              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={menuForm.is_veg}
                    onChange={(e) => setMenuForm({ ...menuForm, is_veg: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Is Pure Veg?</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={menuForm.in_stock}
                    onChange={(e) => setMenuForm({ ...menuForm, in_stock: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>In Stock</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition mt-2"
              >
                {editingMenuItem ? 'Update Item' : 'Create Item'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD TABLE MODAL */}
      {showAddTableModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-extrabold text-slate-900">Add New Table</h3>
              <button onClick={() => setShowAddTableModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTable} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Table Name</label>
                <input
                  type="text"
                  required
                  value={tableNameInput}
                  onChange={(e) => setTableNameInput(e.target.value)}
                  placeholder="e.g. Table 7 or VIP 1"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition"
              >
                Add Table
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD STAFF MODAL */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-extrabold text-slate-900">Add Staff Account</h3>
              <button onClick={() => setShowAddStaffModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assigned Role</label>
                <select
                  value={staffForm.role}
                  onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                >
                  <option value="waiter">Waiter</option>
                  <option value="kitchen">Kitchen Staff</option>
                  <option value="cashier">Cashier</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition"
              >
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD INVENTORY MODAL */}
      {showAddInvModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-extrabold text-slate-900">Add Inventory Stock</h3>
              <button onClick={() => setShowAddInvModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddInventory} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Stock Item Name</label>
                <input
                  type="text"
                  required
                  value={invForm.name}
                  onChange={(e) => setInvForm({ ...invForm, name: e.target.value })}
                  placeholder="e.g. Basmati Rice"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Quantity</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={invForm.quantity}
                  onChange={(e) => setInvForm({ ...invForm, quantity: e.target.value })}
                  placeholder="25.0"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Unit</label>
                <select
                  value={invForm.unit}
                  onChange={(e) => setInvForm({ ...invForm, unit: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                >
                  <option value="kg">kg</option>
                  <option value="Ltr">Ltr</option>
                  <option value="Pcs">Pcs</option>
                  <option value="Packets">Packets</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition"
              >
                Add Inventory
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
