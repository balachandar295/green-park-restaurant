'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  LogOut, 
  ChefHat, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Flame, 
  RefreshCw,
  Utensils,
  Bell
} from 'lucide-react';
import { 
  INITIAL_RESTAURANT, 
  INITIAL_ORDERS, 
  getStoredData, 
  setStoredData 
} from '@/lib/store';
import { Order, Restaurant } from '@/lib/supabase';

export default function KitchenDashboard() {
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant>(INITIAL_RESTAURANT);
  const [orders, setOrders] = useState<Order[]>([]);
  const [now, setNow] = useState<number>(Date.now());

  const syncOrders = () => {
    setRestaurant(getStoredData('restaurant', INITIAL_RESTAURANT));
    const allOrders = getStoredData('orders', INITIAL_ORDERS);
    // Filter active orders for kitchen (pending, preparing, ready)
    const kitchenOrders = allOrders.filter(
      (o: Order) => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready'
    );
    setOrders(kitchenOrders);
  };

  useEffect(() => {
    syncOrders();
    // Refresh elapsed time every 10s
    const timer = setInterval(() => setNow(Date.now()), 10000);

    const handleStorageUpdate = () => {
      syncOrders();
    };
    window.addEventListener('gp_store_update', handleStorageUpdate);

    return () => {
      clearInterval(timer);
      window.removeEventListener('gp_store_update', handleStorageUpdate);
    };
  }, []);

  const handleLogout = () => {
    document.cookie = 'gp_user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    localStorage.removeItem('gp_current_role');
    router.push('/');
  };

  const handleUpdateStatus = (orderId: string, newStatus: 'preparing' | 'ready') => {
    const allOrders = getStoredData('orders', INITIAL_ORDERS);
    const updated = allOrders.map((o: Order) =>
      o.id === orderId ? { ...o, status: newStatus } : o
    );

    // If order becomes ready, notify waiter/table status
    setStoredData('orders', updated);
    syncOrders();
  };

  // Helper to calculate minutes elapsed
  const getMinutesElapsed = (createdAt: string) => {
    const elapsed = Math.floor((now - new Date(createdAt).getTime()) / 60000);
    return Math.max(0, elapsed);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col pb-20 md:pb-6">
      
      {/* Top Bar for Kitchen Display */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <Image src="/logo-v3.png" alt="Logo" fill className="object-contain" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white leading-tight flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-emerald-400" />
                Kitchen Display System (KOT)
              </h1>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                Green Park Live Feed
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={syncOrders}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-xl transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-300 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 rounded-xl transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6">

        {orders.length === 0 ? (
          <div className="bg-slate-800/60 rounded-3xl border border-slate-700 p-12 text-center max-w-md mx-auto space-y-4 my-12">
            <Utensils className="w-12 h-12 text-slate-500 mx-auto stroke-1" />
            <h3 className="text-lg font-extrabold text-slate-200">Kitchen Queue Clean!</h3>
            <p className="text-xs text-slate-400 font-medium">
              No pending orders at the moment. New KOT tickets submitted by waiters will appear instantly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => {
              const minutes = getMinutesElapsed(order.created_at);
              const isDelayed = minutes > 15;

              let statusBorder = 'border-amber-500';
              let statusBg = 'bg-slate-800';
              let statusBadgeBg = 'bg-amber-950 text-amber-300 border-amber-800';

              if (order.status === 'preparing') {
                statusBorder = 'border-blue-500';
                statusBadgeBg = 'bg-blue-950 text-blue-300 border-blue-800';
              } else if (order.status === 'ready') {
                statusBorder = 'border-emerald-500';
                statusBadgeBg = 'bg-emerald-950 text-emerald-300 border-emerald-800';
              }

              if (isDelayed && order.status !== 'ready') {
                statusBorder = 'border-rose-500 animate-pulse';
              }

              return (
                <div
                  key={order.id}
                  className={`bg-slate-800 rounded-3xl border-2 shadow-xl overflow-hidden flex flex-col justify-between ${statusBorder} ${statusBg}`}
                >
                  {/* Card Header */}
                  <div className="p-4 bg-slate-800/80 border-b border-slate-700/80 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase">Table</span>
                        <h2 className="text-xl font-black text-emerald-400">{order.table_name || 'Table'}</h2>
                      </div>
                      <p className="text-[11px] text-slate-400">Order #{order.id.slice(-6)} • {order.waiter_name || 'Waiter'}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full border uppercase tracking-wider ${statusBadgeBg}`}>
                        {order.status}
                      </span>
                      <div
                        className={`flex items-center gap-1 text-xs font-bold ${
                          isDelayed && order.status !== 'ready' ? 'text-rose-400 font-extrabold' : 'text-slate-300'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{minutes} mins ago</span>
                        {isDelayed && order.status !== 'ready' && (
                          <AlertCircle className="w-4 h-4 text-rose-500" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-72">
                    {order.items?.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="p-3 bg-slate-900/90 rounded-2xl border border-slate-700/80 space-y-1"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-sm font-black text-slate-100 flex-1">
                            {item.item_name}
                          </span>
                          <span className="text-sm font-black text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-lg border border-emerald-800">
                            × {item.quantity}
                          </span>
                        </div>

                        {item.notes ? (
                          <p className="text-xs text-amber-300 font-semibold bg-amber-950/60 p-2 rounded-xl border border-amber-800/80 flex items-start gap-1.5">
                            <Bell className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span>Note: "{item.notes}"</span>
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="p-4 bg-slate-900/60 border-t border-slate-700 flex gap-2">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'preparing')}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 transition"
                      >
                        <Flame className="w-4 h-4 text-amber-300" />
                        <span>Start Preparing</span>
                      </button>
                    )}

                    {order.status === 'preparing' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'ready')}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 transition"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark Order Ready!</span>
                      </button>
                    )}

                    {order.status === 'ready' && (
                      <div className="w-full py-2.5 bg-emerald-950/80 text-emerald-300 border border-emerald-800 rounded-2xl text-center text-xs font-bold flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Order Ready for Serving</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

    </div>
  );
}
