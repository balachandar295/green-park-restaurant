'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  LogOut, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Send, 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  UtensilsCrossed, 
  ShoppingBag, 
  ChefHat, 
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { 
  INITIAL_RESTAURANT, 
  INITIAL_TABLES, 
  INITIAL_CATEGORIES, 
  INITIAL_MENU_ITEMS, 
  INITIAL_ORDERS,
  getStoredData, 
  setStoredData 
} from '@/lib/store';
import { MenuItem, MenuCategory, TableItem, Order, OrderItem, Restaurant } from '@/lib/supabase';

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes: string;
}

export default function WaiterDashboard() {
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant>(INITIAL_RESTAURANT);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Selected Table & Order View
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cart state for active order creation / batch addition
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeItemForNotes, setActiveItemForNotes] = useState<CartItem | null>(null);
  const [notesInput, setNotesInput] = useState('');

  // Sync state and set up local storage event listener
  const syncState = () => {
    setRestaurant(getStoredData('restaurant', INITIAL_RESTAURANT));
    setTables(getStoredData('tables', INITIAL_TABLES));
    setCategories(getStoredData('categories', INITIAL_CATEGORIES));
    setMenuItems(getStoredData('menu_items', INITIAL_MENU_ITEMS));
    setOrders(getStoredData('orders', INITIAL_ORDERS));
  };

  useEffect(() => {
    syncState();
    const handleStorageUpdate = (e: any) => {
      syncState();
    };
    window.addEventListener('gp_store_update', handleStorageUpdate);
    return () => window.removeEventListener('gp_store_update', handleStorageUpdate);
  }, []);

  const handleLogout = () => {
    document.cookie = 'gp_user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    localStorage.removeItem('gp_current_role');
    router.push('/');
  };

  // Cart operations
  const handleAddToCart = (item: MenuItem) => {
    setCart((prevCart) => {
      const existing = prevCart.find((ci) => ci.menuItem.id === item.id);
      if (existing) {
        return prevCart.map((ci) =>
          ci.menuItem.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...prevCart, { menuItem: item, quantity: 1, notes: '' }];
    });
  };

  const handleUpdateQty = (itemId: string, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((ci) => {
          if (ci.menuItem.id === itemId) {
            const newQty = ci.quantity + delta;
            return newQty > 0 ? { ...ci, quantity: newQty } : null;
          }
          return ci;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleSaveNotes = (itemId: string) => {
    setCart((prevCart) =>
      prevCart.map((ci) => (ci.menuItem.id === itemId ? { ...ci, notes: notesInput } : ci))
    );
    setActiveItemForNotes(null);
    setNotesInput('');
  };

  // Submit Order / Send to Kitchen
  const handleSubmitOrder = () => {
    if (!selectedTable || cart.length === 0) return;

    // Check if table already has an active order
    const existingOrder = orders.find(
      (o) => o.table_id === selectedTable.id && o.status !== 'billed' && o.status !== 'completed' && o.status !== 'cancelled'
    );

    let updatedOrders: Order[];
    let nextKotBatch = 1;

    if (existingOrder && existingOrder.items) {
      // Calculate max kot_batch
      const currentBatches = existingOrder.items.map((i) => i.kot_batch || 1);
      nextKotBatch = Math.max(...currentBatches, 1) + 1;

      const newOrderItems: OrderItem[] = cart.map((ci, idx) => ({
        id: `oi-${Date.now()}-${idx}`,
        order_id: existingOrder.id,
        menu_item_id: ci.menuItem.id,
        item_name: ci.menuItem.name,
        quantity: ci.quantity,
        notes: ci.notes,
        rate_at_order: ci.menuItem.rate,
        kot_batch: nextKotBatch,
        created_at: new Date().toISOString(),
      }));

      updatedOrders = orders.map((o) =>
        o.id === existingOrder.id
          ? {
              ...o,
              status: 'pending', // Re-mark as pending for kitchen for new KOT batch
              items: [...(o.items || []), ...newOrderItems],
            }
          : o
      );
    } else {
      // Create new Order
      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        table_id: selectedTable.id,
        table_name: selectedTable.name,
        status: 'pending',
        waiter_id: 'w-1',
        waiter_name: 'Rahul (Waiter)',
        restaurant_id: restaurant.id,
        created_at: new Date().toISOString(),
        items: cart.map((ci, idx) => ({
          id: `oi-${Date.now()}-${idx}`,
          order_id: `ord-${Date.now()}`,
          menu_item_id: ci.menuItem.id,
          item_name: ci.menuItem.name,
          quantity: ci.quantity,
          notes: ci.notes,
          rate_at_order: ci.menuItem.rate,
          kot_batch: 1,
          created_at: new Date().toISOString(),
        })),
      };
      updatedOrders = [newOrder, ...orders];
    }

    // Update table status to occupied
    const updatedTables = tables.map((t) =>
      t.id === selectedTable.id ? { ...t, status: 'occupied' as const } : t
    );

    setOrders(updatedOrders);
    setTables(updatedTables);
    setStoredData('orders', updatedOrders);
    setStoredData('tables', updatedTables);

    setCart([]);
    alert(`Order sent to kitchen! (KOT Batch ${nextKotBatch})`);
  };

  // Filter menu items
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategoryId === 'all' || item.category_id === selectedCategoryId;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Get active order for selected table
  const activeTableOrder = selectedTable
    ? orders.find(
        (o) => o.table_id === selectedTable.id && o.status !== 'billed' && o.status !== 'completed' && o.status !== 'cancelled'
      )
    : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20 md:pb-6">
      
      {/* Top Navbar */}
      <header className="bg-white border-b border-emerald-100 px-4 py-3 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-emerald-500 bg-emerald-50">
              <Image src="/logo-v2.jpg" alt="Logo" fill className="object-cover" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 leading-tight">
                Green Park Waiter
              </h1>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Order Entry & Status
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

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6">

        {/* 1. TABLE LIST VIEW (When no table is selected) */}
        {!selectedTable ? (
          <div className="space-y-6">
            <div className="bg-emerald-600 text-white p-5 rounded-3xl shadow-sm space-y-1">
              <h2 className="text-lg font-extrabold">Select a Table to Take Order</h2>
              <p className="text-xs text-emerald-100 font-medium">
                Live statuses update in real time. Tap any table to open the digital menu.
              </p>
            </div>

            {/* Table Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {tables.map((t) => {
                const activeOrder = orders.find(
                  (o) => o.table_id === t.id && o.status !== 'billed' && o.status !== 'completed' && o.status !== 'cancelled'
                );

                let statusBadge = 'Empty';
                let statusBg = 'bg-white border-slate-200 text-slate-700 hover:border-emerald-400';
                let badgeStyle = 'bg-slate-100 text-slate-600 border-slate-200';

                if (t.status === 'occupied') {
                  statusBadge = activeOrder ? `Occupied • ${activeOrder.status}` : 'Occupied';
                  statusBg = 'bg-amber-50/80 border-amber-300 text-amber-900 hover:border-amber-500';
                  badgeStyle = 'bg-amber-100 text-amber-800 border-amber-300';
                } else if (t.status === 'bill_requested') {
                  statusBadge = 'Bill Requested';
                  statusBg = 'bg-blue-50 border-blue-400 text-blue-900 font-bold hover:border-blue-600';
                  badgeStyle = 'bg-blue-100 text-blue-800 border-blue-300';
                }

                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTable(t)}
                    className={`p-5 rounded-3xl border-2 text-left transition transform active:scale-95 shadow-xs flex flex-col justify-between h-36 ${statusBg}`}
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Table</span>
                      <h3 className="text-xl font-extrabold leading-tight">{t.name}</h3>
                    </div>

                    <div className="space-y-1">
                      <span className={`inline-block text-[11px] font-extrabold px-2.5 py-1 rounded-full border capitalize ${badgeStyle}`}>
                        {statusBadge}
                      </span>
                      {activeOrder && (
                        <p className="text-[10px] text-slate-500 font-semibold truncate">
                          {activeOrder.items?.length || 0} items ordered
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* 2. ORDER PLACEMENT VIEW FOR SELECTED TABLE */
          <div className="space-y-6">
            
            {/* Table Header Bar */}
            <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-xs gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedTable(null);
                    setCart([]);
                  }}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">{selectedTable.name}</h2>
                  <p className="text-xs text-emerald-700 font-bold uppercase">
                    Status: {selectedTable.status}
                  </p>
                </div>
              </div>

              {activeTableOrder && (
                <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <ChefHat className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold text-emerald-800">
                    Active Order Status: <span className="uppercase">{activeTableOrder.status}</span>
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Menu & Search Column (2 Cols) */}
              <div className="lg:col-span-2 space-y-4">
                
                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search menu items (e.g. Biryani, Paneer)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                  />
                  <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                </div>

                {/* Categories Bar */}
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  <button
                    onClick={() => setSelectedCategoryId('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                      selectedCategoryId === 'all'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    All Items
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                        selectedCategoryId === cat.id
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                {/* Items Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredMenuItems.map((item) => {
                    const cartEntry = cart.find((ci) => ci.menuItem.id === item.id);
                    return (
                      <div
                        key={item.id}
                        className={`bg-white p-4 rounded-2xl border transition shadow-xs flex justify-between items-center ${
                          item.in_stock ? 'border-slate-200 hover:border-emerald-300' : 'opacity-50 border-slate-200'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-block w-3.5 h-3.5 border-2 p-0.5 rounded-xs ${
                                item.is_veg ? 'border-green-600' : 'border-red-600'
                              }`}
                            >
                              <span
                                className={`block w-full h-full rounded-full ${
                                  item.is_veg ? 'bg-green-600' : 'bg-red-600'
                                }`}
                              />
                            </span>
                            <h4 className="font-extrabold text-slate-900 text-sm">{item.name}</h4>
                          </div>
                          <p className="text-xs font-bold text-emerald-700">₹{item.rate.toFixed(2)}</p>
                        </div>

                        {item.in_stock ? (
                          cartEntry ? (
                            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-300 rounded-xl p-1">
                              <button
                                onClick={() => handleUpdateQty(item.id, -1)}
                                className="p-1 text-emerald-800 hover:bg-emerald-200 rounded-lg transition"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="text-xs font-extrabold text-emerald-900 px-1">
                                {cartEntry.quantity}
                              </span>
                              <button
                                onClick={() => handleUpdateQty(item.id, 1)}
                                className="p-1 text-emerald-800 hover:bg-emerald-200 rounded-lg transition"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAddToCart(item)}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                            >
                              + Add
                            </button>
                          )
                        ) : (
                          <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                            Out of Stock
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Cart & Active Ticket Column (1 Col) */}
              <div className="space-y-4">
                
                {/* Active Order items if already placed */}
                {activeTableOrder && activeTableOrder.items && activeTableOrder.items.length > 0 && (
                  <div className="bg-amber-50/90 border border-amber-200 rounded-3xl p-4 space-y-3">
                    <div className="flex justify-between items-center border-b border-amber-200/60 pb-2">
                      <h3 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                        <ChefHat className="w-4 h-4 text-amber-700" />
                        Already Submitted Orders
                      </h3>
                      <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                        {activeTableOrder.status}
                      </span>
                    </div>

                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {activeTableOrder.items.map((item) => (
                        <div key={item.id} className="text-xs flex justify-between items-center text-amber-950 font-medium bg-white/70 p-2 rounded-xl border border-amber-200/40">
                          <div>
                            <span className="font-bold">{item.item_name}</span> × {item.quantity}
                            {item.notes && <p className="text-[10px] text-amber-700 italic">Note: "{item.notes}"</p>}
                          </div>
                          <span className="font-extrabold">₹{(item.rate_at_order * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Cart Batch */}
                <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-emerald-600" />
                      {activeTableOrder ? 'Add Extra Items (KOT Batch)' : 'New Order Items'}
                    </h3>
                    <span className="text-xs font-bold text-slate-400">{cart.length} items</span>
                  </div>

                  {cart.length === 0 ? (
                    <div className="text-center py-8 space-y-2 text-slate-400">
                      <UtensilsCrossed className="w-8 h-8 mx-auto stroke-1" />
                      <p className="text-xs font-medium">Select menu items to add to order</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((ci) => (
                        <div key={ci.menuItem.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-extrabold text-slate-900 text-xs">{ci.menuItem.name}</p>
                              <p className="text-[11px] font-bold text-emerald-700">₹{(ci.menuItem.rate * ci.quantity).toFixed(2)}</p>
                            </div>

                            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
                              <button
                                onClick={() => handleUpdateQty(ci.menuItem.id, -1)}
                                className="p-1 text-slate-600 hover:bg-slate-100 rounded transition"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs font-extrabold text-slate-900 px-1">
                                {ci.quantity}
                              </span>
                              <button
                                onClick={() => handleUpdateQty(ci.menuItem.id, 1)}
                                className="p-1 text-slate-600 hover:bg-slate-100 rounded transition"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Notes option */}
                          <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                            {ci.notes ? (
                              <p className="text-[11px] text-emerald-800 font-semibold italic bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                "{ci.notes}"
                              </p>
                            ) : (
                              <span className="text-[10px] text-slate-400">No special instructions</span>
                            )}
                            <button
                              onClick={() => {
                                setActiveItemForNotes(ci);
                                setNotesInput(ci.notes || '');
                              }}
                              className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                            >
                              <MessageSquare className="w-3 h-3" />
                              {ci.notes ? 'Edit Note' : '+ Add Note'}
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Total & Submit */}
                      <div className="pt-3 border-t border-slate-200 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-500 uppercase">Subtotal</span>
                          <span className="text-base font-extrabold text-slate-900">
                            ₹
                            {cart
                              .reduce((sum, item) => sum + item.menuItem.rate * item.quantity, 0)
                              .toFixed(2)}
                          </span>
                        </div>

                        <button
                          onClick={handleSubmitOrder}
                          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition"
                        >
                          <Send className="w-4 h-4" />
                          <span>Send Order to Kitchen</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>
        )}

      </main>

      {/* NOTES MODAL */}
      {activeItemForNotes && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase">
              Item Notes for {activeItemForNotes.menuItem.name}
            </h3>

            <textarea
              rows={3}
              placeholder="e.g. Less sugar, extra spicy, no onion..."
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setActiveItemForNotes(null)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveNotes(activeItemForNotes.menuItem.id)}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
