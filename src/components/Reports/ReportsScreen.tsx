import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  PackageCheck,
  AlertTriangle,
  Award,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DashboardStats } from '../../types';

export const ReportsScreen: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reportData, setReportData] = useState<{
    trendData: any[];
    topProducts: any[];
    categorySales: any[];
  }>({
    trendData: [],
    topProducts: [],
    categorySales: [],
  });

  useEffect(() => {
    loadStats();
    loadReports();
  }, []);

  const loadStats = async () => {
    if (window.electronAPI) {
      const res = await window.electronAPI.getDashboardStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    }
  };

  const loadReports = async () => {
    if (window.electronAPI) {
      const res = await window.electronAPI.getSalesReport('month');
      if (res.success && res.data) {
        setReportData(res.data);
      }
    }
  };

  return (
    <div className="space-y-4 select-none">
      {/* 1. Page Header */}
      <div>
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600/20 to-blue-600/10 border border-purple-500/25 flex items-center justify-center text-purple-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <span>التقارير المالية وحركة المبيعات</span>
        </h2>
        <p className="text-xs text-[#7878a0] mt-1">
          مؤشرات الأداء اليومية، صافي الأرباح، وحركة الأصناف الأكثر طلباً
        </p>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today Sales */}
        <div className="p-4 rounded-2xl pos-card shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#a8a8c8]">مبيعات اليوم الإجمالية</span>
            <div className="w-8 h-8 rounded-xl bg-[rgba(124,58,237,0.12)] border border-[rgba(124,58,237,0.25)] text-purple-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-white font-mono block">
            {(stats?.todaySales || 0).toFixed(2)} <span className="text-xs font-bold text-[#7878a0]">ج.م</span>
          </span>
          <span className="text-[11px] text-[#7878a0] block mt-1">
            {stats?.todayInvoicesCount || 0} عملية بيع مسجلة اليوم
          </span>
        </div>

        {/* Today Profit */}
        <div className="p-4 rounded-2xl pos-card shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#06d6a0]">صافي أرباح اليوم</span>
            <div className="w-8 h-8 rounded-xl bg-[rgba(6,214,160,0.12)] border border-[rgba(6,214,160,0.25)] text-[#06d6a0] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-[#06d6a0] font-mono block">
            {(stats?.todayProfit || 0).toFixed(2)} <span className="text-xs font-bold text-[#06d6a0]/70">ج.م</span>
          </span>
          <span className="text-[11px] text-[#7878a0] block mt-1">
            هامش الربح بعد خصم التكلفة
          </span>
        </div>

        {/* Total Products */}
        <div className="p-4 rounded-2xl pos-card shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#a8a8c8]">إجمالي قطع الغيار</span>
            <div className="w-8 h-8 rounded-xl bg-[rgba(124,58,237,0.12)] border border-[rgba(124,58,237,0.25)] text-purple-400 flex items-center justify-center">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-white font-mono block">
            {stats?.totalProductsCount || 0}
          </span>
          <span className="text-[11px] text-[#7878a0] block mt-1">أصناف نشطة بالمحل</span>
        </div>

        {/* Low Stock Alert */}
        <div className="p-4 rounded-2xl pos-card shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#ff9f43]">نواقص المخزون</span>
            <div className="w-8 h-8 rounded-xl bg-[rgba(255,159,67,0.12)] border border-[rgba(255,159,67,0.25)] text-[#ff9f43] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-[#ff9f43] font-mono block">
            {stats?.lowStockCount || 0}
          </span>
          <span className="text-[11px] text-[#7878a0] block mt-1">أصناف وصلت للحد الأدنى</span>
        </div>
      </div>

      {/* 3. Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl pos-card shadow-sm flex flex-col">
          <h3 className="text-sm font-extrabold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span>حركة المبيعات والأرباح (آخر 14 يوماً)</span>
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reportData.trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06d6a0" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06d6a0" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(42, 42, 74, 0.4)" />
                <XAxis dataKey="date" stroke="#7878a0" tick={{ fontSize: 11 }} />
                <YAxis stroke="#7878a0" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(26, 26, 46, 0.95)',
                    border: '1px solid rgba(124, 58, 237, 0.3)',
                    borderRadius: '14px',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    color: '#f0f0ff',
                    direction: 'rtl',
                    fontFamily: 'Cairo',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="المبيعات (ج.م)"
                  stroke="#a855f7"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  name="الأرباح (ج.م)"
                  stroke="#06d6a0"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorProfit)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="p-5 rounded-2xl pos-card shadow-sm flex flex-col">
          <h3 className="text-sm font-extrabold text-white mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-[#ff9f43]" />
            <span>الأكثر مبيعاً وطلباً</span>
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2 max-h-64">
            {reportData.topProducts.map((p, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-[rgba(18,16,31,0.8)] border border-[rgba(42,42,74,0.5)] flex items-center justify-between hover:border-purple-500/30 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-600/30 to-blue-600/20 text-purple-300 font-bold text-xs flex items-center justify-center font-mono border border-purple-500/20">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-[#f0f0ff] line-clamp-1">{p.product_name}</h4>
                    <span className="text-[10px] text-[#7878a0]">الكمية المباعة: {p.total_qty}</span>
                  </div>
                </div>
                <span className="text-xs font-black font-mono text-[#06d6a0]">
                  {p.total_revenue.toFixed(2)} ج.م
                </span>
              </div>
            ))}

            {reportData.topProducts.length === 0 && (
              <div className="py-12 text-center text-[#7878a0] text-xs">
                لا توجد بيانات مبيعات كافية
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
