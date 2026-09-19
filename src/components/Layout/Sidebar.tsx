import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShoppingCart,
  Package,
  FileText,
  Users,
  BarChart3,
  UserCheck,
  Settings,
  LogOut,
  Wrench,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout, isAdmin } = useAuth();

  const navItems = [
    { to: '/', label: 'نقطة البيع (الكاشير)', icon: ShoppingCart },
    { to: '/products', label: 'قطع الغيار والمخزون', icon: Package },
    { to: '/invoices', label: 'سجل الفواتير والمبيعات', icon: FileText },
    { to: '/customers', label: 'العملاء والديون', icon: Users },
    { to: '/reports', label: 'التقارير والأرباح', icon: BarChart3 },
    ...(isAdmin ? [{ to: '/users', label: 'إدارة المستخدمين', icon: UserCheck }] : []),
    { to: '/settings', label: 'الإعدادات والطباعة', icon: Settings },
  ];

  return (
    <aside
      className={`
        w-64 min-w-[256px] max-w-[256px] flex-shrink-0 flex flex-col h-screen select-none z-40
        border-l border-[rgba(124,58,237,0.15)]
        transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
        
        /* Base background: gradient + glass */
        bg-gradient-to-b from-[#1a1040] to-[#0d1f3c]
        backdrop-blur-xl
        
        /* Responsive: overlay on smaller screens */
        max-lg:fixed max-lg:right-0 max-lg:top-0
        ${isOpen ? 'max-lg:translate-x-0' : 'max-lg:translate-x-full'}
        
        /* Mini sidebar on medium screens */
        lg:max-xl:w-[70px] lg:max-xl:min-w-[70px] lg:max-xl:max-w-[70px]
      `}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-[rgba(124,58,237,0.15)] flex items-center gap-3 relative">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 flex-shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
          <Wrench className="w-5 h-5 stroke-[2.2] relative z-10" />
        </div>
        <div className="overflow-hidden lg:max-xl:hidden">
          <h1 className="font-extrabold text-sm text-white leading-snug">كاشير قطع الغيار</h1>
          <p className="text-[11px] font-medium text-purple-300/70">سيارات وموتوسيكلات</p>
        </div>
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="mr-auto p-1.5 rounded-lg text-purple-300/60 hover:text-white hover:bg-white/10 transition-colors lg:hidden"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 pt-2 pb-1 text-[11px] font-bold text-purple-300/50 tracking-wider lg:max-xl:hidden">
          القائمة الرئيسية
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all relative overflow-hidden ${
                  isActive
                    ? 'bg-gradient-to-l from-purple-600/20 to-purple-600/5 text-purple-300 border border-purple-500/25 shadow-sm shadow-purple-500/10'
                    : 'text-[#a8a8c8] hover:text-white hover:bg-white/5 border border-transparent'
                } lg:max-xl:justify-center lg:max-xl:px-0`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active indicator bar */}
                  {isActive && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-l-full bg-gradient-to-b from-purple-400 to-blue-400" />
                  )}
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-purple-400' : ''}`} />
                  <span className="truncate lg:max-xl:hidden">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-3 border-t border-[rgba(124,58,237,0.15)] bg-[rgba(13,10,25,0.5)]">
        <div className="p-2.5 rounded-xl bg-[rgba(26,26,46,0.7)] backdrop-blur-sm border border-[rgba(124,58,237,0.12)] flex items-center justify-between gap-2 lg:max-xl:justify-center">
          <div className="flex items-center gap-2.5 overflow-hidden lg:max-xl:hidden">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-inner relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
              <span className="relative z-10">{user?.display_name?.charAt(0) || 'م'}</span>
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate leading-tight">
                {user?.display_name || 'مستخدم'}
              </p>
              <span className="text-[10px] font-medium text-purple-400">
                {user?.role === 'admin' ? 'المدير العام' : 'كاشير'}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            title="تسجيل الخروج"
            className="p-1.5 rounded-lg text-[#7878a0] hover:text-[#ff6b6b] hover:bg-[rgba(255,107,107,0.1)] transition-colors flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
