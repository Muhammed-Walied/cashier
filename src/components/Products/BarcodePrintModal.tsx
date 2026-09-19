import React, { useState, useEffect } from 'react';
import { X, Printer, Barcode } from 'lucide-react';
import { Product } from '../../types';

interface BarcodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export const BarcodePrintModal: React.FC<BarcodePrintModalProps> = ({ isOpen, onClose, product }) => {
  const [count, setCount] = useState(1);
  const [barcodeDataUrl, setBarcodeDataUrl] = useState<string>('');
  const [isPrinting, setIsPrinting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen && product) {
      setCount(1);
      setErrorMsg('');
      setSuccessMsg('');
      loadBarcodeImage();
    }
  }, [isOpen, product]);

  const loadBarcodeImage = async () => {
    if (product && window.electronAPI) {
      const res = await window.electronAPI.generateBarcodeDataUrl(product.barcode, 'code128');
      if (res.success && res.data) {
        setBarcodeDataUrl(res.data);
      }
    }
  };

  if (!isOpen || !product) return null;

  const handlePrint = async () => {
    setIsPrinting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (window.electronAPI) {
        const res = await window.electronAPI.printBarcodeLabel(product, count);
        if (res.success) {
          setSuccessMsg(`تم إرسال ${count} ملصق إلى طابعة XPrinter`);
          setTimeout(() => {
            onClose();
          }, 1500);
        } else {
          setErrorMsg(res.error || 'فشلت الطباعة');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content !max-w-sm p-6 select-none">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(124,58,237,0.12)]">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <Barcode className="w-4 h-4 text-purple-400" />
            طباعة ملصق باركود (XPrinter)
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

        {successMsg && (
          <div className="mt-3 p-3 rounded-xl bg-[rgba(6,214,160,0.1)] border border-[rgba(6,214,160,0.25)] text-[#34d399] text-xs font-bold">
            {successMsg}
          </div>
        )}

        {/* Sticker Preview Card (Mimics thermal sticker) */}
        <div className="mt-4 p-4 rounded-xl bg-white text-black text-center shadow-md border border-slate-300 select-none">
          <div className="text-[11px] font-extrabold tracking-tight text-slate-800">محل قطع الغيار</div>
          <div className="text-xs font-bold text-slate-900 mt-0.5 line-clamp-1">{product.name}</div>

          <div className="my-2 flex justify-center">
            {barcodeDataUrl ? (
              <img src={barcodeDataUrl} alt="باركود" className="h-12 max-w-full object-contain" />
            ) : (
              <div className="h-12 flex items-center justify-center text-xs text-slate-400 font-mono">
                {product.barcode}
              </div>
            )}
          </div>

          <div className="text-xs font-black border border-black inline-block px-3 py-0.5 rounded font-mono">
            السعر: {product.sell_price.toFixed(2)} ج.م
          </div>
        </div>

        {/* Quantity of labels to print */}
        <div className="mt-4">
          <label className="text-xs font-bold text-[#a8a8c8] block mb-1.5">عدد الملصقات المطلوب طباعتها:</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="500"
              value={count}
              onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="input-dark text-center font-bold text-base !py-1.5 font-mono"
            />
            <button
              type="button"
              onClick={() => setCount(product.quantity > 0 ? product.quantity : 1)}
              className="btn-secondary text-xs whitespace-nowrap"
            >
              بالمخزون ({product.quantity})
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            disabled={isPrinting}
            className="btn-primary flex-1 !py-2.5 text-sm font-bold"
          >
            <Printer className="w-4 h-4" />
            {isPrinting ? 'جاري الإرسال للطابعة...' : 'طباعة الملصق الآن'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary !py-2.5 text-xs">
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
