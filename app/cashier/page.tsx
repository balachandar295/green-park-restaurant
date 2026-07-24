'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { 
  LogOut, 
  Receipt, 
  DollarSign, 
  CreditCard, 
  QrCode, 
  CheckCircle, 
  Printer, 
  Share2, 
  Download, 
  X, 
  Percent, 
  Grid,
  ShoppingBag,
  ArrowRight,
  Clock
} from 'lucide-react';
import { 
  INITIAL_RESTAURANT, 
  INITIAL_TABLES, 
  INITIAL_ORDERS, 
  INITIAL_PAYMENTS,
  getStoredData, 
  setStoredData 
} from '@/lib/store';
import { TableItem, Order, Payment, Restaurant } from '@/lib/supabase';

export default function CashierDashboard() {
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant>(INITIAL_RESTAURANT);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Settlement & Billing state
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const [discountValue, setDiscountValue] = useState<string>('0');
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card'>('upi');
  const [showBillModal, setShowBillModal] = useState(false);
  const [generatedReceiptPayment, setGeneratedReceiptPayment] = useState<Payment | null>(null);

  const syncData = () => {
    setRestaurant(getStoredData('restaurant', INITIAL_RESTAURANT));
    setTables(getStoredData('tables', INITIAL_TABLES));
    setOrders(getStoredData('orders', INITIAL_ORDERS));
    setPayments(getStoredData('payments', INITIAL_PAYMENTS));
  };

  useEffect(() => {
    syncData();
    const handleStorage = () => syncData();
    window.addEventListener('gp_store_update', handleStorage);
    return () => window.removeEventListener('gp_store_update', handleStorage);
  }, []);

  const handleLogout = () => {
    document.cookie = 'gp_user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    localStorage.removeItem('gp_current_role');
    router.push('/');
  };

  // Find active orders for selected table
  const activeOrderForTable = selectedTable
    ? orders.find(
        (o) => o.table_id === selectedTable.id && o.status !== 'billed' && o.status !== 'completed' && o.status !== 'cancelled'
      )
    : null;

  // Calculation helpers
  const subtotal = activeOrderForTable?.items
    ? activeOrderForTable.items.reduce((sum, item) => sum + item.rate_at_order * item.quantity, 0)
    : 0;

  const taxAmount = (subtotal * (restaurant.tax_percent || 5.0)) / 100;
  
  let discountAmount = parseFloat(discountValue) || 0;
  if (discountType === 'percent') {
    discountAmount = (subtotal * discountAmount) / 100;
  }
  discountAmount = Math.min(subtotal, discountAmount);

  const grandTotal = Math.max(0, subtotal + taxAmount - discountAmount);

  // Generate UPI QR String (upi://pay?pa=...&pn=...&am=...)
  const upiString = `upi://pay?pa=${encodeURIComponent(restaurant.upi_id)}&pn=${encodeURIComponent(
    restaurant.name
  )}&am=${grandTotal.toFixed(2)}&cu=INR`;

  // Complete Payment & Settle Table
  const handleCompletePayment = () => {
    if (!selectedTable || !activeOrderForTable) return;

    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      order_id: activeOrderForTable.id,
      table_name: selectedTable.name,
      subtotal,
      tax: taxAmount,
      discount: discountAmount,
      total: grandTotal,
      method: paymentMethod,
      paid_at: new Date().toISOString(),
      cashier_id: 'c-1',
      restaurant_id: restaurant.id,
    };

    // Update Order Status to billed & Table Status to empty
    const allOrders = getStoredData('orders', INITIAL_ORDERS);
    const updatedOrders = allOrders.map((o: Order) =>
      o.id === activeOrderForTable.id ? { ...o, status: 'billed' as const } : o
    );

    const allTables = getStoredData('tables', INITIAL_TABLES);
    const updatedTables = allTables.map((t: TableItem) =>
      t.id === selectedTable.id ? { ...t, status: 'empty' as const } : t
    );

    const allPayments = [newPayment, ...payments];

    setStoredData('orders', updatedOrders);
    setStoredData('tables', updatedTables);
    setStoredData('payments', allPayments);

    syncData();
    setGeneratedReceiptPayment(newPayment);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20 md:pb-6">
      
      {/* Top Navbar */}
      <header className="bg-white border-b border-emerald-100 px-4 py-3 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-emerald-500 bg-emerald-50">
              <Image src="/logo.jpg" alt="Logo" fill className="object-cover" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 leading-tight">
                Cashier POS & Billing
              </h1>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {restaurant.name}
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Active Tables Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Grid className="w-4 h-4 text-emerald-600" />
                Select Table for Settlement
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Tap an occupied or bill requested table to generate invoice & payment
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {tables.map((t) => {
                const activeOrder = orders.find(
                  (o) => o.table_id === t.id && o.status !== 'billed' && o.status !== 'completed' && o.status !== 'cancelled'
                );

                const isSelected = selectedTable?.id === t.id;
                let bgStyle = 'bg-white border-slate-200 hover:border-slate-300';
                let statusLabel = 'Empty';

                if (t.status === 'occupied') {
                  bgStyle = 'bg-amber-50/80 border-amber-300 hover:border-amber-500';
                  statusLabel = 'Occupied';
                } else if (t.status === 'bill_requested') {
                  bgStyle = 'bg-emerald-50 border-emerald-400 font-bold hover:border-emerald-600';
                  statusLabel = 'Bill Requested';
                }

                if (isSelected) {
                  bgStyle += ' ring-2 ring-emerald-600 shadow-md';
                }

                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTable(t);
                      setGeneratedReceiptPayment(null);
                    }}
                    className={`p-4 rounded-3xl border-2 text-left transition transform active:scale-95 shadow-xs space-y-2 ${bgStyle}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase">Table</span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white/80 border capitalize">
                        {statusLabel}
                      </span>
                    </div>

                    <h3 className="text-lg font-extrabold text-slate-900">{t.name}</h3>

                    {activeOrder && activeOrder.items ? (
                      <p className="text-xs font-bold text-emerald-700">
                        ₹
                        {activeOrder.items
                          .reduce((s, i) => s + i.rate_at_order * i.quantity, 0)
                          .toFixed(2)}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400">No active bill</p>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Past Daily Bills History */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                Today's Settlement History
              </h3>

              {payments.length === 0 ? (
                <p className="text-xs text-slate-400">No settlements completed today.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {payments.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900">{p.table_name || 'Table'}</span>
                          <span className="font-bold text-[10px] uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                            {p.method}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(p.paid_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-slate-900 text-sm">₹{p.total.toFixed(2)}</span>
                        <button
                          onClick={() => router.push(`/receipt/${p.id}`)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition"
                        >
                          View Receipt
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Billing & Settlement Panel (1 Col) */}
          <div className="space-y-4">
            
            {!selectedTable || !activeOrderForTable ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-3 text-slate-400 shadow-xs">
                <Receipt className="w-10 h-10 mx-auto stroke-1" />
                <h3 className="text-sm font-extrabold text-slate-700">No Table Selected</h3>
                <p className="text-xs font-medium">Select an occupied table on the left to generate the bill and record payment.</p>
              </div>
            ) : generatedReceiptPayment ? (
              /* Payment Success Screen */
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-6 text-center space-y-4 shadow-md">
                <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
                <div>
                  <h3 className="text-lg font-extrabold text-emerald-950">Payment Completed!</h3>
                  <p className="text-xs font-bold text-emerald-700 mt-1">
                    {selectedTable.name} has been reset to Empty.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-emerald-200 text-left space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Total Paid:</span>
                    <span className="font-extrabold text-emerald-800 text-sm">
                      ₹{generatedReceiptPayment.total.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Payment Method:</span>
                    <span className="font-bold uppercase text-slate-900">{generatedReceiptPayment.method}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => router.push(`/receipt/${generatedReceiptPayment.id}`)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>Open Shareable Digital Receipt</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedTable(null);
                      setGeneratedReceiptPayment(null);
                    }}
                    className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition"
                  >
                    Settle Another Table
                  </button>
                </div>
              </div>
            ) : (
              /* Bill Calculation & Payment Options */
              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-5">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase">
                      Bill for {selectedTable.name}
                    </h3>
                    <p className="text-[11px] text-slate-400">Order #{activeOrderForTable.id.slice(-6)}</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full uppercase">
                    {activeOrderForTable.status}
                  </span>
                </div>

                {/* Itemized list */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {activeOrderForTable.items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-xl">
                      <div>
                        <span className="font-bold text-slate-900">{item.item_name}</span>
                        <span className="text-slate-500 font-semibold ml-1">× {item.quantity}</span>
                      </div>
                      <span className="font-extrabold text-slate-800">
                        ₹{(item.rate_at_order * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Discount input */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase">
                    Apply Discount
                  </label>
                  <div className="flex gap-2">
                    <div className="flex bg-slate-200 p-1 rounded-xl shrink-0">
                      <button
                        type="button"
                        onClick={() => setDiscountType('amount')}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg ${
                          discountType === 'amount' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        ₹ Fixed
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountType('percent')}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg ${
                          discountType === 'percent' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        % Off
                      </button>
                    </div>

                    <input
                      type="number"
                      step="0.01"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                        paymentMethod === 'upi'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <QrCode className="w-4 h-4 text-emerald-600" />
                      <span>UPI QR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                        paymentMethod === 'cash'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <DollarSign className="w-4 h-4 text-amber-600" />
                      <span>Cash</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                        paymentMethod === 'card'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      <span>Card</span>
                    </button>
                  </div>
                </div>

                {/* UPI QR Display if UPI is selected */}
                {paymentMethod === 'upi' && (
                  <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-2xl text-center space-y-2">
                    <p className="text-[11px] font-bold text-emerald-900">
                      Scan to Pay ₹{grandTotal.toFixed(2)} ({restaurant.upi_id})
                    </p>
                    <div className="bg-white p-3 rounded-xl border border-emerald-200 inline-block shadow-xs">
                      <QRCodeSVG value={upiString} size={130} />
                    </div>
                  </div>
                )}

                {/* Summary Totals */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-bold">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Tax ({restaurant.tax_percent}%)</span>
                    <span className="font-bold">₹{taxAmount.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-rose-600 font-bold">
                      <span>Discount</span>
                      <span>-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                    <span>Grand Total</span>
                    <span className="text-emerald-700">₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCompletePayment}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Mark as Paid & Clear Table</span>
                </button>
              </div>
            )}

          </div>

        </div>

      </main>

    </div>
  );
}
