import React, { useState, useEffect } from 'react';
import { X, Check, Wand2, Package } from 'lucide-react';
import { Product, Category } from '../../types';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  categories: Category[];
  onSave?: () => void;
  onSuccess?: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  product,
  categories,
  onSave,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number>(1);
  const [buyPrice, setBuyPrice] = useState('0');
  const [sellPrice, setSellPrice] = useState('0');
  const [quantity, setQuantity] = useState('0');
  const [minQuantity, setMinQuantity] = useState('3');
  const [unit, setUnit] = useState('قطعة');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setBarcode(product.barcode);
      setDescription(product.description || '');
      setCategoryId(product.category_id || (categories[0]?.id ?? 1));
      setBuyPrice(product.buy_price.toString());
      setSellPrice(product.sell_price.toString());
      setQuantity(product.quantity.toString());
      setMinQuantity(product.min_quantity.toString());
      setUnit(product.unit || 'قطعة');
    } else {
      setName('');
      setBarcode('');
      setDescription('');
      setCategoryId(categories[0]?.id ?? 1);
      setBuyPrice('0');
      setSellPrice('0');
      setQuantity('10');
      setMinQuantity('3');
      setUnit('قطعة');
    }
    setErrorMsg('');
  }, [product, isOpen, categories]);

  if (!isOpen) return null;

  const handleGenerateBarcode = () => {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    setBarcode(`2026${randomSuffix}`);
  };

  const buyNum = parseFloat(buyPrice) || 0;
  const sellNum = parseFloat(sellPrice) || 0;
  const profitMargin = sellNum - buyNum;
  const profitPercent = buyNum > 0 ? ((profitMargin / buyNum) * 100).toFixed(1) : '0';

  const notifySaved = () => {
    if (onSuccess) onSuccess();
    if (onSave) onSave();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('برجاء كتابة اسم الصنف / قطعة الغيار');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (window.electronAPI) {
        if (product) {
          const res = await window.electronAPI.updateProduct(product.id, {
            name: name.trim(),
            barcode: barcode.trim(),
            description: description.trim(),
            category_id: categoryId,
            buy_price: buyNum,
            sell_price: sellNum,
            quantity: parseInt(quantity) || 0,
            min_quantity: parseInt(minQuantity) || 3,
            unit,
          });

          if (res.success) {
            notifySaved();
          } else {
            setErrorMsg(res.error || 'فشل تعديل المنتج');
          }
        } else {
          const res = await window.electronAPI.createProduct({
            name: name.trim(),
            barcode: barcode.trim(),
            description: description.trim(),
            category_id: categoryId,
            buy_price: buyNum,
            sell_price: sellNum,
            quantity: parseInt(quantity) || 0,
            min_quantity: parseInt(minQuantity) || 3,
            unit,
            is_active: 1,
          });

          if (res.success) {
            notifySaved();
          } else {
            setErrorMsg(res.error || 'فشل إضافة المنتج');
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
    <div className="modal-overlay">
      <div className="modal-content !max-w-lg p-6 select-none">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[rgba(124,58,237,0.12)]">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-purple-400" />
            {product ? 'تعديل قطعة غيار / منتج' : 'إضافة قطعة غيار جديدة'}
          </h3>
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Barcode & Generator */}
          <div>
            <label className="text-xs font-bold text-[#a8a8c8] block mb-1">
              الباركود (سكان بالقارئ أو توليد تلقائي)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="مرر الباركود أو اتركه للتوليد التلقائي..."
                className="input-dark font-mono text-xs flex-1"
              />
              <button
                type="button"
                onClick={handleGenerateBarcode}
                className="btn-secondary text-xs !py-2 whitespace-nowrap"
              >
                <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                توليد باركود
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-bold text-[#a8a8c8] block mb-1">اسم قطعة الغيار / المنتج *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: تيل فرامل خلفي دايو، بوجيه ياباني، زيت 10W-40..."
              className="input-dark text-xs"
            />
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#a8a8c8] block mb-1">التصنيف</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="input-dark text-xs"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#a8a8c8] block mb-1">الوحدة</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="input-dark text-xs"
              >
                <option value="قطعة">قطعة</option>
                <option value="طقم">طقم</option>
                <option value="علبة">علبة</option>
                <option value="لتر">لتر</option>
                <option value="متر">متر</option>
              </select>
            </div>
          </div>

          {/* Prices & Profit Calculation */}
          <div className="p-3 bg-[rgba(18,16,31,0.8)] rounded-xl border border-[rgba(42,42,74,0.5)]">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#7878a0] block mb-1">سعر الشراء (التكلفة)</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  className="input-dark text-xs font-bold font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#06d6a0] block mb-1">سعر البيع للعميل *</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  className="input-dark text-xs font-bold text-[#06d6a0] font-mono"
                />
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-[rgba(42,42,74,0.4)] flex items-center justify-between text-xs">
              <span className="text-[#7878a0] font-medium">هامش الربح المتوقع:</span>
              <span className="font-bold text-[#06d6a0] font-mono">
                {profitMargin.toFixed(2)} ج.م ({profitPercent}%)
              </span>
            </div>
          </div>

          {/* Stock & Minimum Quantity Alert */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#a8a8c8] block mb-1">الكمية الحالية في المخزن</label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="input-dark text-xs font-bold font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#a8a8c8] block mb-1">حد تنبيه النواقص</label>
              <input
                type="number"
                min="1"
                value={minQuantity}
                onChange={(e) => setMinQuantity(e.target.value)}
                className="input-dark text-xs font-mono"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 pt-3 border-t border-[rgba(124,58,237,0.12)] flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1 !py-2.5 text-xs font-bold"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? 'جاري الحفظ...' : product ? 'حفظ التعديلات' : 'إضافة الصنف'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary !py-2.5 text-xs">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
