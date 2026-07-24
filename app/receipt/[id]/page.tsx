'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  CheckCircle, 
  UtensilsCrossed, 
  Printer,
  Sparkles,
  PhoneCall
} from 'lucide-react';
import { 
  INITIAL_RESTAURANT, 
  INITIAL_ORDERS, 
  INITIAL_PAYMENTS, 
  getStoredData 
} from '@/lib/store';
import { Payment, Order, Restaurant } from '@/lib/supabase';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function DigitalReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const receiptRef = useRef<HTMLDivElement>(null);

  const [restaurant, setRestaurant] = useState<Restaurant>(INITIAL_RESTAURANT);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const paymentId = params.id as string;
    const storedRest = getStoredData('restaurant', INITIAL_RESTAURANT);
    const storedPayments = getStoredData('payments', INITIAL_PAYMENTS);
    const storedOrders = getStoredData('orders', INITIAL_ORDERS);

    setRestaurant(storedRest);

    const foundPayment = storedPayments.find((p: Payment) => p.id === paymentId);
    if (foundPayment) {
      setPayment(foundPayment);
      const foundOrder = storedOrders.find((o: Order) => o.id === foundPayment.order_id);
      if (foundOrder) setOrder(foundOrder);
    }
  }, [params.id]);

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 160], // Thermal receipt proportions
      });
      pdf.addImage(imgData, 'PNG', 0, 0, 80, 160);
      pdf.save(`GreenPark_Receipt_${payment?.id || 'bill'}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Generating image download fallback...');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!receiptRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `GreenPark_Receipt_${payment?.id || 'bill'}.png`;
      link.click();
    } catch (err) {
      console.error('Image export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleWhatsAppShare = () => {
    if (!payment) return;
    const text = `🧾 *Green Park Family Restaurant - Digital Receipt*\nTable: ${payment.table_name || 'N/A'}\nTotal Paid: ₹${payment.total.toFixed(2)}\nPayment Method: ${payment.method.toUpperCase()}\nDate: ${new Date(payment.paid_at).toLocaleString()}\nThank you for dining with us!`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  if (!payment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl shadow-md text-center space-y-3">
          <p className="text-sm font-bold text-slate-700">Receipt Not Found</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 py-8">
      
      {/* Top Action Bar */}
      <div className="w-full max-w-sm mb-4 flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-700 font-bold text-xs rounded-xl shadow-xs border border-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex gap-2">
          <button
            onClick={handleWhatsAppShare}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-emerald-700 transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-slate-800 transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting...' : 'PDF'}</span>
          </button>
        </div>
      </div>

      {/* RECEIPT CARD CONTAINER (Optimized for Mobile view & Export) */}
      <div
        ref={receiptRef}
        className="w-full max-w-sm bg-white rounded-3xl border border-slate-200 p-6 shadow-xl space-y-5 text-slate-800"
      >
        {/* Header Branding */}
        <div className="text-center space-y-2 border-b border-dashed border-slate-200 pb-4">
          <div className="w-16 h-16 mx-auto flex items-center justify-center">
            <Image src="/logo-v5.png" alt="Logo" width={64} height={64} className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">{restaurant.name}</h1>
            <p className="text-[11px] font-semibold text-emerald-700">Family Restaurant & Dine-In</p>
            <p className="text-[10px] text-slate-400">GSTIN: 33AAAAA0000A1Z5 • Tel: +91 98765 43210</p>
          </div>
        </div>

        {/* Bill Metadata */}
        <div className="text-xs space-y-1 text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100 font-medium">
          <div className="flex justify-between">
            <span>Bill No:</span>
            <span className="font-mono font-bold text-slate-900">{payment.id}</span>
          </div>
          <div className="flex justify-between">
            <span>Table:</span>
            <span className="font-extrabold text-slate-900">{payment.table_name || 'Table'}</span>
          </div>
          <div className="flex justify-between">
            <span>Date & Time:</span>
            <span>{new Date(payment.paid_at).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Payment Method:</span>
            <span className="font-bold uppercase text-emerald-700">{payment.method}</span>
          </div>
        </div>

        {/* Itemized Order Breakdown */}
        <div className="space-y-3">
          <div className="text-xs font-black uppercase text-slate-400 border-b border-slate-100 pb-1 flex justify-between">
            <span>Item Breakdown</span>
            <span>Amt (₹)</span>
          </div>

          <div className="space-y-2 text-xs">
            {order?.items?.map((item) => (
              <div key={item.id} className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-slate-900">{item.item_name}</p>
                  <p className="text-[10px] text-slate-500">
                    ₹{item.rate_at_order.toFixed(2)} × {item.quantity}
                  </p>
                </div>
                <span className="font-extrabold text-slate-900">
                  ₹{(item.rate_at_order * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="border-t border-dashed border-slate-200 pt-3 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="font-bold">₹{payment.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>GST Tax ({restaurant.tax_percent}%)</span>
            <span className="font-bold">₹{payment.tax.toFixed(2)}</span>
          </div>
          {payment.discount > 0 && (
            <div className="flex justify-between text-rose-600 font-bold">
              <span>Discount</span>
              <span>-₹{payment.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
            <span>Grand Total Paid</span>
            <span className="text-emerald-700">₹{payment.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-2 border-t border-slate-100 space-y-1">
          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Paid & Verified</span>
          </div>
          <p className="text-[10px] text-slate-400 pt-1">
            Thank you for dining with Green Park Family Restaurant!
          </p>
        </div>

      </div>

      {/* Alternative Download Option */}
      <div className="w-full max-w-sm mt-4 text-center">
        <button
          onClick={handleDownloadImage}
          className="text-xs font-bold text-slate-600 hover:text-emerald-700 hover:underline"
        >
          Download Image (.PNG) Instead
        </button>
      </div>

    </div>
  );
}
