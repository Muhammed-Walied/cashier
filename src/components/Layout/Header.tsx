import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle, Clock, Keyboard, Menu } from 'lucide-react';
import { Product } from '../../types';

interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setDateStr(
        now.toLocaleDateString('ar-EG', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkLowStock = async () => {
      if (window.electronAPI) {
        const res = await window.electronAPI.getLowStockProducts();
        if (res.success && res.data) {
          setLowStockProducts(res.data);
        }
      }
    };

    checkLowStock();
    const pollInterval = setInterval(checkLowStock, 30000);
    return () => clearInterval(pollInterval);
  }, []);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'نقطة البيع (الكاشير)';
      case '/products':
        return 'قطع الغيار والمخزون';
      case '/invoices':
        return 'سجل الفواتير والمبيعات';
      case '/customers':
        return 'العملاء والديون';
      case '/reports':
        return 'التقارير والأرباح';
      case '/users':
        return 'إدارة المستخدمين';
      case '/settings':
        return 'الإعدادات والطباعة';
      default:
        return 'كاشير قطع الغيار';
    }
  };

  return (
    <header className="h-14 bg-[rgba(22,19,43,0.6)] backdrop-blur-xl border-b border-[rgba(124,58,237,0.1)] px-4 xl:px-6 flex items-center justify-between select-none z-10 relative">
      {/* Gradient line at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

      {/* Page Title & Hotkeys */}
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          onClick={onMenuToggle}
          className="p-1.5 rounded-lg text-purple-300/60 hover:text-white hover:bg-white/10 transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
          <span>{getPageTitle()}</span>
        </h2>
        {location.pathname === '/' && (
          <div className="hidden xl:flex items-center gap-2.5 text-xs font-semibold text-[#a8a8c8] bg-[rgba(26,26,46,0.7)] px-3 py-1 rounded-lg border border-[rgba(124,58,237,0.12)]">
            <Keyboard className="w-3.5 h-3.5 text-purple-400" />
            <span><strong className="text-white font-mono">[F2]</strong> قارئ الباركود</span>
            <span className="text-[#5a5a80]">•</span>
            <span><strong className="text-teal-400 font-mono">[F9]</strong> إتمام الفاتورة</span>
          </div>
        )}
      </div>

      {/* Alerts and Clock */}
      <div className="flex items-center gap-3">
        {lowStockProducts.length > 0 && (
          <button
            onClick={() => navigate('/products?filter=low')}
            className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[rgba(255,159,67,0.1)] border border-[rgba(255,159,67,0.25)] text-[#ffba6b] hover:bg-[rgba(255,159,67,0.18)] text-xs font-bold transition-all shadow-sm"
            title="قطع غيار قاربت على النفاد"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-[#ff9f43] animate-pulse" />
            <span className="hidden sm:inline">نواقص المخزن ({lowStockProducts.length})</span>
          </button>
        )}

        <div className="flex items-center gap-2.5 text-xs font-medium bg-[rgba(26,26,46,0.7)] px-3.5 py-1.5 rounded-xl border border-[rgba(124,58,237,0.12)] text-[#a8a8c8]">
          <Clock className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
          <span className="text-white font-mono font-bold">{timeStr}</span>
          <span className="text-[#5a5a80] hidden sm:inline">|</span>
          <span className="text-[#7878a0] font-normal hidden sm:inline">{dateStr}</span>
        </div>
      </div>
    </header>
  );
};
