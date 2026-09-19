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
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center p-4 relative overflow-hidden select-none font-cairo">
      {/* Animated Background Orbs */}
      <div className="absolute top-1/4 -right-24 w-[500px] h-[500px] rounded-full bg-purple-600/15 blur-[160px] pointer-events-none animate-float" />
      <div className="absolute bottom-1/4 -left-24 w-[450px] h-[450px] rounded-full bg-blue-600/12 blur-[140px] pointer-events-none animate-float-slow" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-pink-500/8 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Card with glass effect and gradient border */}
        <div className="bg-[rgba(26,26,46,0.85)] backdrop-blur-2xl p-8 rounded-3xl border border-[rgba(124,58,237,0.2)] shadow-2xl shadow-purple-900/20 relative overflow-hidden">
          {/* Top gradient line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/50 to-pink-500/30" />

          {/* Header Icon & Brand */}
          <div className="text-center mb-7">
            <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-tr from-purple-600 via-purple-500 to-pink-500 mx-auto flex items-center justify-center shadow-xl shadow-purple-500/30 mb-4 border border-white/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
              <Wrench className="w-9 h-9 text-white stroke-[2.2] relative z-10" />
            </div>
            <h1 className="text-2xl font-black text-gradient-primary tracking-tight">كاشير قطع الغيار</h1>
            <p className="text-xs text-[#a8a8c8] mt-1.5 font-medium">
              منظومة كاشير ومبيعات ومخازن سيارات وموتوسيكلات
            </p>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-[rgba(255,107,107,0.1)] border border-[rgba(255,107,107,0.25)] text-[#ff8a8a] text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#ff6b6b]" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#a8a8c8] block mb-1.5">اسم المستخدم</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#5a5a80] absolute right-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="اسم المستخدم (admin أو cashier)"
                  className="input-dark pr-10 text-xs !py-3"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#a8a8c8] block mb-1.5">كلمة المرور</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#5a5a80] absolute right-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="كلمة المرور"
                  className="input-dark pr-10 text-xs !py-3"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full !py-3.5 text-sm font-bold mt-2"
            >
              <LogIn className="w-4 h-4" />
              {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول إلى النظام'}
            </button>
          </form>

          {/* Fast Credentials Buttons */}
          <div className="mt-8 pt-5 border-t border-[rgba(124,58,237,0.12)]">
            <span className="text-[11px] text-[#7878a0] font-semibold block text-center mb-3 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#ff9f43]" />
              دخول فوري بضغطة زر للتجربة:
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="py-2.5 px-3 rounded-xl bg-[rgba(34,34,68,0.6)] hover:bg-[rgba(42,42,74,0.8)] border border-[rgba(124,58,237,0.15)] text-[#f0f0ff] text-xs font-bold text-center transition-all hover:border-purple-500/40 hover:shadow-glow-purple/20 flex items-center justify-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                المدير (admin)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('cashier', '123456')}
                className="py-2.5 px-3 rounded-xl bg-[rgba(34,34,68,0.6)] hover:bg-[rgba(42,42,74,0.8)] border border-[rgba(6,214,160,0.15)] text-[#f0f0ff] text-xs font-bold text-center transition-all hover:border-teal-500/40 flex items-center justify-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-teal-400" />
                كاشير (cashier)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
