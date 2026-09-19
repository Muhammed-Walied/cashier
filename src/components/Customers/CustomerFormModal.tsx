import React, { useState, useEffect } from 'react';
import { X, Check, UserPlus } from 'lucide-react';
import { Customer } from '../../types';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSave: () => void;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  customer,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone || '');
      setAddress(customer.address || '');
      setNotes(customer.notes || '');
    } else {
      setName('');
      setPhone('');
      setAddress('');
      setNotes('');
    }
    setErrorMsg('');
  }, [customer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('برجاء كتابة اسم العميل');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (window.electronAPI) {
        if (customer) {
          const res = await window.electronAPI.updateCustomer(customer.id, {
            name: name.trim(),
            phone: phone.trim(),
            address: address.trim(),
            notes: notes.trim(),
          });
          if (res.success) {
            onSave();
            onClose();
          } else {
            setErrorMsg(res.error || 'فشل تعديل بيانات العميل');
          }
        } else {
          const res = await window.electronAPI.createCustomer({
            name: name.trim(),
            phone: phone.trim(),
            address: address.trim(),
            notes: notes.trim(),
          });
          if (res.success) {
            onSave();
            onClose();
          } else {
            setErrorMsg(res.error || 'فشل إضافة العميل');
          }
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay select-none">
      <div className="modal-content !max-w-md p-6">
        <div className="flex items-center justify-between pb-4 border-b border-[rgba(124,58,237,0.12)]">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[rgba(124,58,237,0.15)] border border-[rgba(124,58,237,0.25)] flex items-center justify-center text-purple-400">
              <UserPlus className="w-4 h-4" />
            </div>
            <span>{customer ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7878a0] hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 rounded-xl bg-[rgba(255,107,107,0.15)] border border-[rgba(255,107,107,0.3)] text-[#ff6b6b] text-xs font-bold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="text-xs font-bold text-[#a8a8c8] block mb-1">اسم العميل *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: محمد أحمد، ورشة الأمانة، كابتن علي..."
              className="input-dark text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#a8a8c8] block mb-1">رقم الهاتف</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010xxxxxxxx"
              className="input-dark text-xs font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#a8a8c8] block mb-1">العنوان / المنطقة</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="مثال: شارع الورش، المحطة..."
              className="input-dark text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#a8a8c8] block mb-1">ملاحظات</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أية تفاصيل إضافية عن العميل أو تعاملاته..."
              className="input-dark text-xs"
            />
          </div>

          <div className="mt-6 pt-3 border-t border-[rgba(124,58,237,0.12)] flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1 !py-2.5 text-xs font-bold"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? 'جاري الحفظ...' : customer ? 'حفظ التعديلات' : 'إضافة العميل'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary !py-2.5 text-xs"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
