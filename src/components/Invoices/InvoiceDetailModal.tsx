import React, { useState } from 'react';
import { X, Printer } from 'lucide-react';
import { Invoice } from '../../types';

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onPrint?: (invoiceId: number) => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onPrint,
}) => {
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen || !invoice) return null;

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      if (onPrint) {
        onPrint(invoice.id);
      } else if (window.electronAPI) {
        await window.electronAPI.printReceipt(invoice.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="modal-overlay select-none">
      <div className="modal-content !max-w-xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(124,58,237,0.12)]">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              تفاصيل الفاتورة: <span className="font-mono text-purple-400">{invoice.invoice_number}</span>
            </h3>
            <span className="text-[11px] text-[#7878a0] font-mono">{invoice.created_at}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7878a0] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer & Cashier Info */}
        <div className="mt-3 p-3 rounded-xl bg-[rgba(18,16,31,0.8)] border border-[rgba(42,42,74,0.5)] grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-[#7878a0] block mb-0.5">العميل:</span>
            <span className="font-bold text-white text-sm">{invoice.customer_name || 'عميل نقدي سريع'}</span>
            {invoice.customer_phone && (
              <span className="text-[#7878a0] block font-mono mt-0.5">{invoice.customer_phone}</span>
            )}
          </div>
          <div>
            <span className="text-[#7878a0] block mb-0.5">الكاشير المسئول:</span>
            <span className="font-bold text-white text-sm">{invoice.user_name || 'المدير'}</span>
            <span className="text-[#7878a0] block mt-0.5">
              طريقة الدفع: {invoice.payment_method === 'cash' ? 'نقدي (كاش)' : 'آجل (على الحساب)'}
            </span>
          </div>
        </div>

        {/* Items Table */}
        <div className="mt-4 max-h-56 overflow-y-auto border border-[rgba(42,42,74,0.5)] rounded-xl bg-[rgba(18,16,31,0.6)]">
          <table className="pos-table">
            <thead>
              <tr>
                <th>الصنف</th>
                <th style={{ textAlign: 'center' }}>الكمية</th>
                <th style={{ textAlign: 'left' }}>السعر</th>
                <th style={{ textAlign: 'left' }}>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items || []).map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <div className="font-bold text-white text-xs">{item.product_name}</div>
                    <div className="text-[10px] text-[#7878a0] font-mono">{item.barcode}</div>
                  </td>
                  <td style={{ textAlign: 'center' }} className="text-xs font-mono font-bold">
                    {item.quantity}
                  </td>
                  <td style={{ textAlign: 'left' }} className="text-xs font-mono text-[#a8a8c8]">
                    {item.unit_price.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'left' }} className="text-xs font-mono font-extrabold text-[#f0f0ff]">
                    {item.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-4 p-3.5 rounded-xl bg-[rgba(18,16,31,0.8)] border border-[rgba(42,42,74,0.5)] space-y-1.5 text-xs">
          <div className="flex justify-between text-[#7878a0]">
            <span>المجموع الفرعي:</span>
            <span className="font-mono text-[#f0f0ff]">{invoice.subtotal.toFixed(2)} ج.م</span>
          </div>
          {invoice.discount > 0 && (
            <div className="flex justify-between text-[#ff8a8a]">
              <span>الخصم الممنوح:</span>
              <span className="font-mono">-{invoice.discount.toFixed(2)} ج.م</span>
            </div>
          )}
          <div className="flex justify-between text-base font-black text-white pt-1.5 border-t border-[rgba(42,42,74,0.4)]">
            <span>المطلوب نهائياً:</span>
            <span className="font-mono text-[#06d6a0]">{invoice.total.toFixed(2)} ج.م</span>
          </div>
          <div className="flex justify-between text-[#a8a8c8]">
            <span>المبلغ المدفوع:</span>
            <span className="font-mono text-[#06d6a0] font-bold">{invoice.paid_amount.toFixed(2)} ج.م</span>
          </div>
          {invoice.remaining > 0 && (
            <div className="flex justify-between text-[#ffba6b] font-bold">
              <span>المتبقي (آجل على العميل):</span>
              <span className="font-mono">{invoice.remaining.toFixed(2)} ج.م</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={handlePrint}
            disabled={isPrinting}
            className="btn-primary flex-1 !py-2.5 text-xs font-bold"
          >
            <Printer className="w-4 h-4" />
            {isPrinting ? 'جاري الطباعة...' : 'طباعة الفاتورة على الطابعة'}
          </button>
          <button onClick={onClose} className="btn-secondary !py-2.5 text-xs">
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
