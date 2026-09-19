import React, { useState, useEffect } from 'react';
import { X, Check, UserPlus, DollarSign, CreditCard, Printer } from 'lucide-react';
import { Customer, CartItem, Invoice } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  onSuccess: (invoice: Invoice, shouldPrint: boolean) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  subtotal,
  discount,
  total,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit'>('cash');
  const [paidAmount, setPaidAmount] = useState<string>(total.toString());
  const [notes, setNotes] = useState('');
  const [printReceipt, setPrintReceipt] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Quick add customer mode
  const [showQuickAddCustomer, setShowQuickAddCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPaidAmount(total.toString());
      setErrorMsg('');
      loadCustomers();
    }
  }, [isOpen, total]);

  const loadCustomers = async () => {
    if (window.electronAPI) {
      const res = await window.electronAPI.getCustomers();
      if (res.success && res.data) {
        setCustomers(res.data);
      }
    }
  };

  if (!isOpen) return null;

  const paidNum = parseFloat(paidAmount) || 0;
  const remaining = Math.max(0, total - paidNum);
  const change = Math.max(0, paidNum - total);

  const handleQuickAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;

    if (window.electronAPI) {
      const res = await window.electronAPI.createCustomer({
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim(),
        address: '',
        notes: '',
      });

      if (res.success && res.data) {
        setCustomers((prev) => [res.data!, ...prev]);
        setSelectedCustomerId(res.data.id);
        setShowQuickAddCustomer(false);
        setNewCustomerName('');
        setNewCustomerPhone('');
      } else {
        setErrorMsg(res.error || 'فشل إضافة العميل');
      }
    }
  };

  const handleSubmit = async () => {
    if (cartItems.length === 0) return;
    if (paymentMethod === 'credit' && !selectedCustomerId) {
      setErrorMsg('يجب اختيار عميل لتسجيل الفاتورة كآجل (على الحساب)');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (window.electronAPI) {
        const payload = {
          customer_id: selectedCustomerId,
          user_id: user?.id || 1,
          items: cartItems.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
            unit_price: item.unit_price,
          })),
          discount: discount,
          payment_method: paymentMethod,
          paid_amount: paymentMethod === 'cash' ? Math.min(paidNum, total) : paidNum,
          notes: notes.trim(),
        };

        const res = await window.electronAPI.createInvoice(payload);
        if (res.success && res.data) {
          onSuccess(res.data, printReceipt);
          onClose();
        } else {
          setErrorMsg(res.error || 'حدث خطأ أثناء حفظ الفاتورة');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'خطأ غير متوقع');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content !max-w-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[rgba(124,58,237,0.12)]">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#06d6a0]" />
            إتمام عملية البيع والدفع
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7878a0] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 rounded-xl bg-[rgba(255,107,107,0.1)] border border-[rgba(255,107,107,0.25)] text-[#ff8a8a] text-xs font-bold">
            {errorMsg}
          </div>
        )}

        {/* Totals Summary */}
        <div className="mt-4 p-4 rounded-xl bg-[rgba(18,16,31,0.8)] border border-[rgba(6,214,160,0.12)] flex items-center justify-between">
          <div>
            <span className="text-xs text-[#a8a8c8] block mb-0.5">المبلغ المطلوب سداده</span>
            <span className="text-2xl font-black text-[#06d6a0] font-mono">{total.toFixed(2)} ج.م</span>
          </div>
          {discount > 0 && (
            <div className="text-left">
              <span className="text-xs text-[#a8a8c8] block mb-0.5">الخصم المطبق</span>
              <span className="text-sm font-bold text-[#ff8a8a] font-mono">-{discount.toFixed(2)} ج.م</span>
            </div>
          )}
        </div>

        {/* Customer Select */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-[#a8a8c8]">العميل</label>
            <button
              type="button"
              onClick={() => setShowQuickAddCustomer(!showQuickAddCustomer)}
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-bold"
            >
              <UserPlus className="w-3.5 h-3.5" />
              {showQuickAddCustomer ? 'إلغاء' : 'إضافة عميل جديد'}
            </button>
          </div>

          {showQuickAddCustomer ? (
            <div className="p-3 bg-[rgba(34,34,68,0.5)] rounded-xl border border-[rgba(124,58,237,0.12)] mb-2 space-y-2">
              <input
                type="text"
                placeholder="اسم العميل"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                className="input-dark text-xs !py-2"
                autoFocus
              />
              <input
                type="text"
                placeholder="رقم الهاتف"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                className="input-dark text-xs !py-2"
              />
              <button
                type="button"
                onClick={handleQuickAddCustomer}
                className="btn-primary w-full text-xs !py-2"
              >
                حفظ العميل
              </button>
            </div>
          ) : (
            <select
              value={selectedCustomerId || ''}
              onChange={(e) => setSelectedCustomerId(e.target.value ? Number(e.target.value) : null)}
              className="input-dark text-sm"
            >
              <option value="">-- عميل نقدي (بدون تسجيل) --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ''} {c.total_debt ? `[مديونية: ${c.total_debt} ج.م]` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Payment Method */}
        <div className="mt-4">
          <label className="text-xs font-bold text-[#a8a8c8] block mb-2">طريقة الدفع</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setPaymentMethod('cash');
                setPaidAmount(total.toString());
              }}
              className={`py-2.5 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                paymentMethod === 'cash'
                  ? 'bg-[rgba(6,214,160,0.1)] border-[rgba(6,214,160,0.4)] text-[#34d399] shadow-sm shadow-[rgba(6,214,160,0.15)]'
                  : 'bg-[rgba(18,16,31,0.6)] border-[rgba(42,42,74,0.5)] text-[#a8a8c8] hover:text-white'
              }`}
            >
              <DollarSign className="w-4 h-4 text-[#06d6a0]" />
              كاش / نقدي
            </button>
            <button
              type="button"
              onClick={() => {
                setPaymentMethod('credit');
                setPaidAmount('0');
              }}
              className={`py-2.5 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                paymentMethod === 'credit'
                  ? 'bg-[rgba(255,159,67,0.1)] border-[rgba(255,159,67,0.4)] text-[#ffba6b] shadow-sm shadow-[rgba(255,159,67,0.15)]'
                  : 'bg-[rgba(18,16,31,0.6)] border-[rgba(42,42,74,0.5)] text-[#a8a8c8] hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4 text-[#ff9f43]" />
              آجل / على الحساب
            </button>
          </div>
        </div>

        {/* Paid Amount */}
        <div className="mt-4">
          <label className="text-xs font-bold text-[#a8a8c8] block mb-1.5">المبلغ المدفوع (ج.م)</label>
          <input
            type="number"
            step="any"
            value={paidAmount}
            onChange={(e) => setPaidAmount(e.target.value)}
            className="input-dark text-lg font-black text-center !py-2.5 font-mono text-white"
          />
        </div>

        {/* Change or Remaining Debt Badge */}
        <div className="mt-3 flex items-center justify-between text-xs p-3 rounded-xl bg-[rgba(18,16,31,0.6)] border border-[rgba(42,42,74,0.5)]">
          {paymentMethod === 'cash' ? (
            <>
              <span className="text-[#a8a8c8] font-medium">الباقي للعميل:</span>
              <span className="font-extrabold text-[#06d6a0] text-sm font-mono">{change.toFixed(2)} ج.م</span>
            </>
          ) : (
            <>
              <span className="text-[#a8a8c8] font-medium">المتبقي دين على العميل:</span>
              <span className="font-extrabold text-[#ffba6b] text-sm font-mono">{remaining.toFixed(2)} ج.م</span>
            </>
          )}
        </div>

        {/* Print Option */}
        <div className="mt-4 flex items-center gap-2.5">
          <input
            type="checkbox"
            id="printReceipt"
            checked={printReceipt}
            onChange={(e) => setPrintReceipt(e.target.checked)}
            className="w-4 h-4 rounded text-purple-600 bg-[rgba(18,16,31,0.8)] border-[rgba(42,42,74,0.6)] cursor-pointer accent-purple-500"
          />
          <label htmlFor="printReceipt" className="text-xs text-[#a8a8c8] flex items-center gap-1.5 cursor-pointer font-medium">
            <Printer className="w-3.5 h-3.5 text-purple-400" />
            طباعة فاتورة ريسيت تلقائياً
          </label>
        </div>

        {/* Submit Actions */}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn-success flex-1 !py-3 text-sm font-extrabold"
          >
            <Check className="w-4 h-4" />
            {isSubmitting ? 'جاري الحفظ...' : 'تأكيد وإصدار الفاتورة'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary !py-3">
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};
