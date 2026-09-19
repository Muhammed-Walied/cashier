import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit2, Trash2, FileText, Phone, MapPin, CreditCard, X } from 'lucide-react';
import { Customer, Invoice } from '../../types';
import { CustomerFormModal } from './CustomerFormModal';
import { InvoiceDetailModal } from '../Invoices/InvoiceDetailModal';

export const CustomerList: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Customer Invoices History Modal
  const [customerInvoices, setCustomerInvoices] = useState<Invoice[]>([]);
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const loadCustomers = async () => {
    if (window.electronAPI) {
      const res = await window.electronAPI.getCustomers(search);
      if (res.success && res.data) {
        setCustomers(res.data);
      }
    }
  };

  const handleDelete = async (customer: Customer) => {
    if (customer.total_debt && customer.total_debt > 0) {
      alert(`لا يمكن حذف العميل "${customer.name}" لأن عليه مديونية مستحقة قدرها ${customer.total_debt.toFixed(2)} ج.م`);
      return;
    }

    if (window.confirm(`هل أنت متأكد من حذف العميل "${customer.name}"؟`)) {
      if (window.electronAPI) {
        const res = await window.electronAPI.deleteCustomer(customer.id);
        if (res.success) {
          loadCustomers();
        } else {
          alert(res.error || 'فشل حذف العميل');
        }
      }
    }
  };

  const viewHistory = async (customer: Customer) => {
    if (window.electronAPI) {
      const res = await window.electronAPI.getCustomerInvoices(customer.id);
      if (res.success && res.data) {
        setCustomerInvoices(res.data);
        setSelectedCustomerForHistory(customer);
        setIsHistoryOpen(true);
      }
    }
  };

  const totalDebts = customers.reduce((acc, c) => acc + (c.total_debt || 0), 0);

  return (
    <div className="space-y-4 select-none">
      {/* 1. Page Header */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600/20 to-blue-600/10 border border-purple-500/25 flex items-center justify-center text-purple-400">
              <Users className="w-4 h-4" />
            </div>
            <span>إدارة العملاء والديون الآجلة</span>
          </h2>
          <p className="text-xs text-[#7878a0] mt-1">
            تسجيل بيانات العملاء، متابعة المسحوبات الآجلة، وسجل الفواتير السابقة
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCustomer(null);
            setIsFormOpen(true);
          }}
          className="btn-primary text-xs !py-2.5 px-4 shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة عميل جديد</span>
        </button>
      </div>

      {/* 2. Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl pos-card shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#a8a8c8]">إجمالي عدد العملاء المسجلين</span>
            <div className="w-8 h-8 rounded-xl bg-[rgba(124,58,237,0.12)] border border-[rgba(124,58,237,0.25)] text-purple-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-white font-mono">{customers.length}</span>
          <span className="text-[11px] font-semibold text-[#7878a0] block mt-1">عميل مسجل في النظام</span>
        </div>

        <div className="p-4 rounded-2xl pos-card shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#ff9f43]">إجمالي الديون المستحقة على العملاء</span>
            <div className="w-8 h-8 rounded-xl bg-[rgba(255,159,67,0.12)] border border-[rgba(255,159,67,0.25)] text-[#ff9f43] flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-[#ff9f43] font-mono">{totalDebts.toFixed(2)}</span>
            <span className="text-xs font-bold text-[#ff9f43]/70">ج.م</span>
          </div>
          <span className="text-[11px] font-semibold text-[#7878a0] block mt-1">مبالغ آجلة قيد التحصيل</span>
        </div>
      </div>

      {/* 3. Search Filter */}
      <div className="p-3 rounded-2xl pos-card shadow-sm">
        <div className="mac-search-bar max-w-sm">
          <Search className="w-4 h-4 text-[#7878a0] flex-shrink-0" />
          <input
            type="text"
            placeholder="بحث بالاسم أو رقم الهاتف أو المنطقة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-xs text-[#7878a0] hover:text-white font-bold p-1">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. Customers Table */}
      <div className="pos-card overflow-hidden shadow-sm">
        <div className="table-container">
          <table className="pos-table">
            <thead>
              <tr>
                <th style={{ width: '25%' }}>اسم العميل</th>
                <th style={{ width: '20%' }}>رقم الهاتف</th>
                <th style={{ width: '20%' }}>العنوان / المنطقة</th>
                <th style={{ width: '18%' }}>المديونية الحالية</th>
                <th style={{ width: '17%', textAlign: 'center' }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const hasDebt = (c.total_debt || 0) > 0;
                return (
                  <tr key={c.id}>
                    {/* Name & Notes */}
                    <td>
                      <div className="font-bold text-white text-xs">{c.name}</div>
                      {c.notes && <div className="text-[11px] text-[#7878a0] truncate mt-0.5">{c.notes}</div>}
                    </td>

                    {/* Phone */}
                    <td>
                      {c.phone ? (
                        <div className="flex items-center gap-1.5 text-xs font-mono text-[#f0f0ff]">
                          <Phone className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                          <span>{c.phone}</span>
                        </div>
                      ) : (
                        <span className="text-[#7878a0] text-xs">-</span>
                      )}
                    </td>

                    {/* Address */}
                    <td>
                      {c.address ? (
                        <div className="flex items-center gap-1.5 text-xs text-[#a8a8c8]">
                          <MapPin className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                          <span className="truncate">{c.address}</span>
                        </div>
                      ) : (
                        <span className="text-[#7878a0] text-xs">-</span>
                      )}
                    </td>

                    {/* Current Debt */}
                    <td>
                      {hasDebt ? (
                        <div className="flex items-baseline gap-1 font-mono">
                          <span className="text-sm font-black text-[#ff9f43] font-mono">
                            {c.total_debt?.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-[#ff9f43]/80 font-sans font-bold">ج.م (آجل)</span>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-1 font-mono">
                          <span className="text-sm font-black text-[#06d6a0] font-mono">0.00</span>
                          <span className="text-[10px] text-[#06d6a0]/80 font-sans font-bold">ج.م (خالص)</span>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'center' }}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => viewHistory(c)}
                          title="عرض فواتير ومسحوبات العميل"
                          className="p-1.5 rounded-lg text-[#a8a8c8] hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingCustomer(c);
                            setIsFormOpen(true);
                          }}
                          title="تعديل بيانات العميل"
                          className="p-1.5 rounded-lg text-[#a8a8c8] hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          title="حذف العميل"
                          className="p-1.5 rounded-lg text-[#a8a8c8] hover:text-[#ff6b6b] hover:bg-[#ff6b6b]/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {customers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-[#7878a0]">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30 text-purple-400" />
                    <p className="font-bold text-[#f0f0ff] text-sm">لا يوجد عملاء مسجلين</p>
                    <p className="text-[#7878a0] text-xs mt-1">اضغط على زر "إضافة عميل جديد" لبدء التسجيل</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Form Modal */}
      <CustomerFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        customer={editingCustomer}
        onSave={() => {
          setIsFormOpen(false);
          loadCustomers();
        }}
      />

      {/* Customer Invoices History Modal */}
      {isHistoryOpen && selectedCustomerForHistory && (
        <div className="modal-overlay select-none">
          <div className="modal-content !max-w-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(124,58,237,0.12)]">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span>سجل فواتير العميل:</span>
                  <span className="text-purple-400">{selectedCustomerForHistory.name}</span>
                </h3>
                <span className="text-xs text-[#a8a8c8] mt-0.5 block">
                  المديونية الحالية: {(selectedCustomerForHistory.total_debt || 0).toFixed(2)} ج.م
                </span>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="p-1.5 rounded-lg text-[#7878a0] hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 max-h-72 overflow-y-auto border border-[rgba(42,42,74,0.5)] rounded-xl bg-[rgba(18,16,31,0.8)]">
              <table className="pos-table">
                <thead>
                  <tr>
                    <th>رقم الفاتورة</th>
                    <th>التاريخ</th>
                    <th>إجمالي الفاتورة</th>
                    <th>المدفوع</th>
                    <th>المتبقي</th>
                    <th style={{ textAlign: 'center' }}>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {customerInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={async () => {
                        if (window.electronAPI) {
                          const res = await window.electronAPI.getInvoiceDetails(inv.id);
                          if (res.success && res.data) {
                            setSelectedInvoice(res.data);
                            setIsDetailOpen(true);
                          }
                        }
                      }}
                      className="cursor-pointer hover:bg-[rgba(124,58,237,0.1)] transition-colors"
                    >
                      <td className="font-mono font-bold text-xs text-purple-300">{inv.invoice_number}</td>
                      <td className="text-xs text-[#7878a0] font-mono">
                        {new Date(inv.created_at).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="font-mono text-xs font-bold text-white">{inv.total.toFixed(2)} ج.م</td>
                      <td className="font-mono text-xs text-[#06d6a0] font-bold">{inv.paid_amount.toFixed(2)} ج.م</td>
                      <td className="font-mono text-xs text-[#ff9f43] font-bold">{inv.remaining.toFixed(2)} ج.م</td>
                      <td style={{ textAlign: 'center' }}>
                        {inv.status === 'paid' ? (
                          <span className="badge badge-green">مدفوعة</span>
                        ) : (
                          <span className="badge badge-amber">آجل</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {customerInvoices.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#7878a0] text-xs">
                        لا توجد فواتير سابقة لهذا العميل
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end">
              <button onClick={() => setIsHistoryOpen(false)} className="btn-secondary !py-2 text-xs">
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal if clicked from history */}
      {selectedInvoice && (
        <InvoiceDetailModal
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedInvoice(null);
          }}
          invoice={selectedInvoice}
        />
      )}
    </div>
  );
};
