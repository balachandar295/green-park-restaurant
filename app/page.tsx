'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { UserCheck, Phone, Lock, ArrowRight, Shield, UtensilsCrossed, ChefHat, Receipt, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'phone' | 'email'>('phone');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'waiter' | 'kitchen' | 'cashier' | 'admin'>('waiter');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')) {
        const { error } = await supabase.auth.signInWithPassword({
          email: authMode === 'email' ? identifier : `${identifier}@greenpark.com`,
          password: password || '123456',
        });
        if (error) {
          console.warn('Supabase Auth warning:', error.message);
        }
      }

      // Set cookie for middleware access
      document.cookie = `gp_user_role=${selectedRole}; path=/; max-age=86400`;
      localStorage.setItem('gp_current_role', selectedRole);

      router.push(`/${selectedRole}`);
    } catch {
      document.cookie = `gp_user_role=${selectedRole}; path=/; max-age=86400`;
      localStorage.setItem('gp_current_role', selectedRole);
      router.push(`/${selectedRole}`);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRoleSelect = (role: 'waiter' | 'kitchen' | 'cashier' | 'admin') => {
    document.cookie = `gp_user_role=${role}; path=/; max-age=86400`;
    localStorage.setItem('gp_current_role', role);
    router.push(`/${role}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-emerald-100 p-6 sm:p-8 space-y-6">
        
        {/* Header with Logo */}
        <div className="text-center space-y-3">
          <div className="relative w-24 h-24 mx-auto rounded-2xl overflow-hidden shadow-md border-2 border-emerald-500 bg-emerald-50 p-1">
            <Image
              src="/logo.jpg"
              alt="Green Park Family Restaurant Logo"
              fill
              className="object-cover rounded-xl"
              priority
            />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Green Park
            </h1>
            <p className="text-sm font-semibold text-emerald-700">Family Restaurant Management</p>
          </div>
        </div>

        {/* Quick Demo Access Bar */}
        <div className="bg-emerald-50/80 rounded-2xl p-3 border border-emerald-200/60">
          <div className="flex items-center gap-1.5 mb-2.5 px-1">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Quick Role Login (One-Tap Demo)
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickRoleSelect('waiter')}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-emerald-200 text-slate-800 text-xs font-bold shadow-xs hover:border-emerald-500 hover:bg-emerald-50 transition"
            >
              <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
              <span>Waiter POS</span>
            </button>
            <button
              onClick={() => handleQuickRoleSelect('kitchen')}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-emerald-200 text-slate-800 text-xs font-bold shadow-xs hover:border-emerald-500 hover:bg-emerald-50 transition"
            >
              <ChefHat className="w-4 h-4 text-orange-500" />
              <span>Kitchen (KOT)</span>
            </button>
            <button
              onClick={() => handleQuickRoleSelect('cashier')}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-emerald-200 text-slate-800 text-xs font-bold shadow-xs hover:border-emerald-500 hover:bg-emerald-50 transition"
            >
              <Receipt className="w-4 h-4 text-blue-600" />
              <span>Cashier POS</span>
            </button>
            <button
              onClick={() => handleQuickRoleSelect('admin')}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-emerald-200 text-slate-800 text-xs font-bold shadow-xs hover:border-emerald-500 hover:bg-emerald-50 transition"
            >
              <Shield className="w-4 h-4 text-purple-600" />
              <span>Admin Panel</span>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-slate-400 font-semibold">Or Sign In With Credentials</span>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* Role selector dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Select Your Role
            </label>
            <div className="relative">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition appearance-none"
              >
                <option value="waiter">Waiter (Table & Orders)</option>
                <option value="kitchen">Kitchen Staff (KOT Queue)</option>
                <option value="cashier">Cashier (Billing & Receipts)</option>
                <option value="admin">Admin / Restaurant Manager</option>
              </select>
              <UserCheck className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          {/* Auth Method Switch */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setAuthMode('phone')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                authMode === 'phone' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500'
              }`}
            >
              Phone Number
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('email')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                authMode === 'email' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500'
              }`}
            >
              Email Address
            </button>
          </div>

          {/* Input field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              {authMode === 'phone' ? 'Phone Number' : 'Email Address'}
            </label>
            <div className="relative">
              <input
                type={authMode === 'phone' ? 'tel' : 'email'}
                placeholder={authMode === 'phone' ? 'e.g. 9876543210' : 'waiter@greenpark.com'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
              <Phone className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          {/* Password field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
              <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 font-medium">
          Green Park Family Restaurant • Vercel + Supabase
        </p>

      </div>
    </div>
  );
}
