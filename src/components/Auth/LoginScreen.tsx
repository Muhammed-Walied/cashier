import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, Lock, User, LogIn, Sparkles, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in, redirect to POS home
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('برجاء إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    const res = await login(username.trim(), password.trim());
    if (res.success) {
      navigate('/', { replace: true });
    } else {
      setErrorMsg(res.error || 'اسم المستخدم أو كلمة المرور غير صحيحة');
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (userStr: string, passStr: string) => {
    setUsername(userStr);
    setPassword(passStr);
    setIsLoading(true);
    setErrorMsg('');
    const res = await login(userStr, passStr);
    if (res.success) {
      navigate('/', { replace: true });
    } else {
      setErrorMsg(res.error || 'خطأ أثناء تسجيل الدخول');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090b14] flex items-center justify-center p-4 relative overflow-hidden select-none font-cairo" dir="rtl">
      {/* Ambient background glows */}
      <div className="absolute -top-32 right-1/4 w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/4 w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-[430px] relative z-10">
        <div className="bg-[#121526]/95 backdrop-blur-2xl p-7 sm:p-8 rounded-3xl border border-indigo-500/20 shadow-2xl shadow-black/70 relative overflow-hidden">
          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-75" />

          {/* Header Brand */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-600/30 border border-white/20 mb-3.5">
              <Wrench className="w-8 h-8 text-white stroke-[2.2]" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">كاشير قطع الغيار</h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              منظومة مبيعات ومخازن قطع غيار السيارات والموتوسيكلات
            </p>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                اسم المستخدم
              </label>
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#0a0d1c] border border-[#232844] focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                <User className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <div className="w-[1px] h-4 bg-[#232844] flex-shrink-0" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="اسم المستخدم (admin أو cashier)"
                  className="w-full bg-transparent text-white text-xs outline-none placeholder:text-slate-500 font-medium"
                  autoFocus
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                كلمة المرور
              </label>
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#0a0d1c] border border-[#232844] focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                <Lock className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <div className="w-[1px] h-4 bg-[#232844] flex-shrink-0" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="كلمة المرور..."
                  className="w-full bg-transparent text-white text-xs outline-none placeholder:text-slate-500 font-medium"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 active:scale-[0.99] text-white font-bold text-xs shadow-lg shadow-indigo-600/30 border border-indigo-400/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول إلى النظام'}</span>
            </button>
          </form>

          {/* Quick Demo Access */}
          <div className="mt-6 pt-5 border-t border-[#232844]">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>دخول سريع للتجربة بضغطة زر واحدة:</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="p-2.5 rounded-xl bg-[#171b33] hover:bg-[#1f2444] border border-indigo-500/20 hover:border-indigo-500/40 text-right transition-all group flex flex-col gap-0.5 cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                  <span className="text-xs font-bold text-white group-hover:text-indigo-300">المدير (admin)</span>
                </div>
                <span className="text-[10px] text-slate-400">صلاحيات كاملة للنظام</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('cashier', '123456')}
                className="p-2.5 rounded-xl bg-[#171b33] hover:bg-[#1f2444] border border-emerald-500/20 hover:border-emerald-500/40 text-right transition-all group flex flex-col gap-0.5 cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="text-xs font-bold text-white group-hover:text-emerald-300">كاشير (cashier)</span>
                </div>
                <span className="text-[10px] text-slate-400">نقطة البيع والفواتير</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
