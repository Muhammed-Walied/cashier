import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Printer,
  Eye,
  RotateCcw,
  DollarSign,
  TrendingUp,
  CreditCard,
  User,
  X,
} from 'lucide-react';
import { Invoice } from '../../types';
import { InvoiceDetailModal } from './InvoiceDetailModal';

export const InvoiceList: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, [statusFilter]);

  const loadInvoices = async () => {
    if (window.electronAPI) {
      const res = await window.electronAPI.getInvoices({
        status: statusFilter,
      });
      if (res.success && res.data) {
        setInvoices(res.data);
      }
    }
  };

  const handleViewDetails = async (invoiceId: number) => {
    if (window.electronAPI) {
      const res = await window.electronAPI.getInvoiceDetails(invoiceId);
      if (res.success && res.data) {
        setSelectedInvoice(res.data);
        setIsDetailOpen(true);
      }
    }
  };

  const handlePrint = async (invoiceId: number) => {
    if (window.electronAPI) {
      await window.electronAPI.printReceipt(invoiceId);
    }
  };

  const handleCancelInvoice = async (invoice: Invoice) => {
    if (
      window.confirm(
        `هل تريد بالتأكيد إلغاء الفاتورة "${invoice.invoice_number}" وإعادة البضاعة إلى المخزن؟`
      )
    ) {
      if (window.electronAPI) {
        const res = await window.electronAPI.cancelInvoice(invoice.id);
        if (res.success) {
          loadInvoices();
        } else {
          alert(res.error || 'فشل إلغاء الفاتورة');
        }
      }
    }
  };

  // Filtered list
  const filteredInvoices = invoices.filter((inv) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase().trim();
    return (
      inv.invoice_number.toLowerCase().includes(term) ||
      (inv.customer_name && inv.customer_name.toLowerCase().includes(term))
    );
  });

  const totalRevenue = filteredInvoices.reduce((acc, inv) => acc + inv.total, 0);
  const totalPaid = filteredInvoices.reduce((acc, inv) => acc + inv.paid_amount, 0);
  const totalRemaining = filteredInvoices.reduce((acc, inv) => acc + inv.remaining, 0);

  return (
    <div className="space-y-4 select-none">
      {/* 1. Page Header */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600/20 to-blue-600/10 border border-purple-500/25 flex items-center justify-center text-purple-400">
              <FileText className="w-4 h-4" />
            </div>
            <span>سجل فواتير المبيعات</span>
          </h2>
          <p className="text-xs text-[#7878a0] mt-1">
            متابعة عمليات البيع، طباعة إيصالات الريسيت، وإدارة المرتجعات والحسابات
          </p>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Sales */}
        <div className="p-4 rounded-2xl pos-card shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#a8a8c8]">إجمالي مبيعات الفواتير</span>
            <div className="w-8 h-8 rounded-xl bg-[rgba(124,58,237,0.12)] border border-[rgba(124,58,237,0.25)] text-purple-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-white font-mono">{totalRevenue.toFixed(2)}</span>
            <span className="text-xs font-bold text-[#7878a0]">ج.م</span>
          </div>
          <span className="text-[11px] font-semibold text-[#7878a0] block mt-1.5">
            إجمالي الفواتير: {filteredInvoices.length} فاتورة
          </span>
        </div>

        {/* Paid / Cash */}
        <div className="p-4 rounded-2xl pos-card shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#06d6a0]">المبالغ المحصلة (نقدي)</span>
            <div className="w-8 h-8 rounded-xl bg-[rgba(6,214,160,0.12)] border border-[rgba(6,214,160,0.25)] text-[#06d6a0] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-[#06d6a0] font-mono">{totalPaid.toFixed(2)}</span>
            <span className="text-xs font-bold text-[#06d6a0]/70">ج.م</span>
          </div>
          <span className="text-[11px] font-semibold text-[#7878a0] block mt-1.5">
            تم تحصيلها في الدرج
          </span>
        </div>

        {/* Remaining / Credit */}
        <div className="p-4 rounded-2xl pos-card shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#ff9f43]">المتبقي (ديون آجلة)</span>
            <div className="w-8 h-8 rounded-xl bg-[rgba(255,159,67,0.12)] border border-[rgba(255,159,67,0.25)] text-[#ff9f43] flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-[#ff9f43] font-mono">{totalRemaining.toFixed(2)}</span>
            <span className="text-xs font-bold text-[#ff9f43]/70">ج.م</span>
          </div>
          <span className="text-[11px] font-semibold text-[#7878a0] block mt-1.5">
            مستحقة على العملاء
          </span>
        </div>
      </div>

      {/* 3. Filter & Search Toolbar */}
      <div className="p-3 rounded-2xl pos-card shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="mac-search-bar w-80 max-w-full">
          <Search className="w-4 h-4 text-[#7878a0] flex-shrink-0" />
          <input
            type="text"
            placeholder="بحث برقم الفاتورة أو اسم العميل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-xs text-[#7878a0] hover:text-white font-bold p-1">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { id: 'all', label: 'جميع الفواتير' },
            { id: 'paid', label: 'مدفوعة بالكامل' },
            { id: 'partial', label: 'دفع جزئي' },
            { id: 'unpaid', label: 'آجل بالكامل' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setStatusFilter(item.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                statusFilter === item.id
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30 border border-purple-400/30'
                  : 'bg-[rgba(26,26,46,0.8)] text-[#a8a8c8] hover:text-white border border-[rgba(42,42,74,0.5)]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Invoices Table */}
      <div className="pos-card overflow-hidden shadow-sm">
        <div className="table-container">
          <table className="pos-table">
            <thead>
              <tr>
                <th style={{ width: '18%' }}>رقم الفاتورة</th>
                <th style={{ width: '18%' }}>التاريخ والوقت</th>
                <th style={{ width: '20%' }}>العميل</th>
                <th style={{ width: '13%' }}>إجمالي الفاتورة</th>
                <th style={{ width: '13%' }}>المبلغ المدفوع</th>
                <th style={{ width: '10%', textAlign: 'center' }}>الحالة</th>
                <th style={{ width: '8%', textAlign: 'center' }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => (
                <tr key={inv.id}>
                  {/* Invoice Number */}
                  <td>
                    <span className="font-mono text-xs font-bold text-purple-300 bg-[rgba(18,16,31,0.9)] px-2.5 py-1 rounded-lg border border-[rgba(124,58,237,0.2)]">
                      {inv.invoice_number}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="text-xs text-[#7878a0] font-mono">
                    {new Date(inv.created_at).toLocaleString('ar-EG', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>

                  {/* Customer */}
                  <td>
                    <div className="flex items-center gap-1.5 text-xs text-[#f0f0ff] font-bold">
                      <User className="w-3.5 h-3.5 text-purple-400" />
                      <span>{inv.customer_name || 'عميل نقدي'}</span>
                    </div>
                  </td>

                  {/* Total */}
                  <td className="font-mono text-xs font-extrabold text-white">
                    {inv.total.toFixed(2)} ج.م
                  </td>

                  {/* Paid */}
                  <td className="font-mono text-xs font-bold text-[#06d6a0]">
                    {inv.paid_amount.toFixed(2)} ج.م
                  </td>

                  {/* Status */}
                  <td style={{ textAlign: 'center' }}>
                    {inv.status === 'paid' ? (
                      <span className="badge badge-green">مدفوعة</span>
                    ) : inv.status === 'partial' ? (
                      <span className="badge badge-amber">جزئي</span>
                    ) : (
                      <span className="badge badge-red">آجل</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ textAlign: 'center' }}>
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleViewDetails(inv.id)}
                        title="عرض تفاصيل الفاتورة"
                        className="p-1.5 rounded-lg text-[#a8a8c8] hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handlePrint(inv.id)}
                        title="طباعة إيصال ريسيت"
                        className="p-1.5 rounded-lg text-[#a8a8c8] hover:text-[#06d6a0] hover:bg-[#06d6a0]/10 transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleCancelInvoice(inv)}
                        title="إلغاء الفاتورة وإرجاع البضاعة"
                        className="p-1.5 rounded-lg text-[#a8a8c8] hover:text-[#ff6b6b] hover:bg-[#ff6b6b]/10 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-[#7878a0]">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-30 text-purple-400" />
                    <p className="font-bold text-[#f0f0ff] text-sm">لا توجد فواتير مطابقة</p>
                    <p className="text-[#7878a0] text-xs mt-1">تأكد من شروط البحث أو الفلتر المختار</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <InvoiceDetailModal
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedInvoice(null);
          }}
          invoice={selectedInvoice}
          onPrint={handlePrint}
        />
      )}
    </div>
  );
};
