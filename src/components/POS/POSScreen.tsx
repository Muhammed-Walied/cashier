import React, { useState, useEffect, useRef } from 'react';
import {
  Barcode,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Printer,
  RotateCcw,
  AlertCircle,
  Package,
  ShoppingCart,
  Receipt,
  X,
} from 'lucide-react';
import { Product, Category, CartItem, Invoice } from '../../types';
import { PaymentModal } from './PaymentModal';
import { playBeep } from '../../utils/audio';

export const POSScreen: React.FC = () => {
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // States
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<string>('0');
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<Invoice | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadCategories();
    loadProducts();
    focusBarcodeInput();
  }, []);

  const focusBarcodeInput = () => {
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 100);
  };

  const loadCategories = async () => {
    if (window.electronAPI) {
      const res = await window.electronAPI.getCategories();
      if (res.success && res.data) {
        setCategories(res.data);
      }
    }
  };

  const loadProducts = async () => {
    if (window.electronAPI) {
      const res = await window.electronAPI.getProducts(searchQuery, selectedCategory);
      if (res.success && res.data) {
        setProducts(res.data);
      }
    }
  };

  useEffect(() => {
    loadProducts();
  }, [searchQuery, selectedCategory]);

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const barcode = barcodeQuery.trim();
    if (!barcode) return;

    if (window.electronAPI) {
      const res = await window.electronAPI.getProductByBarcode(barcode);
      if (res.success && res.data) {
        addProductToCart(res.data);
        playBeep('success');
        showStatus('success', `تمت إضافة: ${res.data.name}`);
      } else {
        playBeep('error');
        showStatus('error', `لم يتم العثور على صنف بالباركود: ${barcode}`);
      }
    }
    setBarcodeQuery('');
    focusBarcodeInput();
  };

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 3000);
  };

  const addProductToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const existing = prevCart[existingIndex];
        if (existing.quantity >= product.quantity) {
          showStatus('error', `الكمية المتاحة في المخزن فقط ${product.quantity}`);
          return prevCart;
        }
        const updated = [...prevCart];
        const newQty = existing.quantity + 1;
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          total: newQty * existing.unit_price,
        };
        return updated;
      } else {
        if (product.quantity <= 0) {
          showStatus('error', `عفواً، هذا الصنف نفد من المخزن!`);
          return prevCart;
        }
        return [
          {
            product,
            quantity: 1,
            unit_price: product.sell_price,
            total: product.sell_price,
          },
          ...prevCart,
        ];
      }
    });
  };

  const updateItemQuantity = (productId: number, newQty: number) => {
    if (newQty <= 0) {
      removeItem(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.product.id === productId) {
          if (newQty > item.product.quantity) {
            showStatus('error', `الكمية المتاحة بالمخزن فقط ${item.product.quantity}`);
            return item;
          }
          return {
            ...item,
            quantity: newQty,
            total: newQty * item.unit_price,
          };
        }
        return item;
      })
    );
  };

  const updateItemPrice = (productId: number, newPrice: number) => {
    if (newPrice < 0) return;
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.product.id === productId) {
          return {
            ...item,
            unit_price: newPrice,
            total: item.quantity * newPrice,
          };
        }
        return item;
      })
    );
  };

  const removeItem = (productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
    focusBarcodeInput();
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('هل أنت متأكد من تفريغ الفاتورة الحالية؟')) {
      setCart([]);
      setDiscount('0');
      focusBarcodeInput();
    }
  };

  const subtotal = cart.reduce((acc, item) => acc + item.total, 0);
  const discountNum = Math.max(0, parseFloat(discount) || 0);
  const grandTotal = Math.max(0, subtotal - discountNum);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0) {
          setIsPaymentOpen(true);
        }
      } else if (e.key === 'F2') {
        e.preventDefault();
        focusBarcodeInput();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart]);

  const handlePaymentSuccess = async (invoice: Invoice, shouldPrint: boolean) => {
    setLastInvoice(invoice);
    setCart([]);
    setDiscount('0');
    loadProducts();
    focusBarcodeInput();

    if (shouldPrint && window.electronAPI) {
      await window.electronAPI.printReceipt(invoice.id);
    }
  };

  const handlePrintLastInvoice = async () => {
    if (lastInvoice && window.electronAPI) {
      await window.electronAPI.printReceipt(lastInvoice.id);
    }
  };

  return (
    <div className="flex gap-3 xl:gap-4 h-full overflow-hidden select-none">
      {/* =========================================================================
          1. RIGHT PANEL: Active Invoice / Cart
          ========================================================================= */}
      <div className="w-[44%] min-w-[380px] max-w-[500px] flex flex-col pos-card p-3 xl:p-4 overflow-hidden shadow-xl">
        {/* Barcode Scanner Box */}
        <form onSubmit={handleBarcodeSubmit} className="flex gap-2 mb-3">
          <div className="mac-search-bar flex-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#06d6a0] animate-pulse flex-shrink-0 shadow-[0_0_8px_rgba(6,214,160,0.5)]" title="جاهز للمسح" />
            <Barcode className="w-4 h-4 text-[#7878a0] flex-shrink-0" />
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="امسح الباركود هنا (F2)..."
              value={barcodeQuery}
              onChange={(e) => setBarcodeQuery(e.target.value)}
              className="font-mono font-bold text-sm"
            />
          </div>
          <button type="submit" className="btn-primary whitespace-nowrap text-xs px-4">
            <Plus className="w-4 h-4" />
            إضافة
          </button>
        </form>

        {/* Status Toast Alert */}
        {statusMessage && (
          <div
            className={`p-2.5 mb-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all animate-fade-in ${
              statusMessage.type === 'success'
                ? 'bg-[rgba(6,214,160,0.1)] border border-[rgba(6,214,160,0.25)] text-[#34d399]'
                : 'bg-[rgba(255,107,107,0.1)] border border-[rgba(255,107,107,0.25)] text-[#ff8a8a]'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#06d6a0]" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#ff6b6b]" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Last Saved Invoice Quick Print */}
        {lastInvoice && (
          <div className="p-2 mb-2.5 rounded-xl bg-[rgba(34,34,68,0.5)] border border-[rgba(124,58,237,0.12)] flex items-center justify-between text-xs animate-fade-in">
            <div className="flex items-center gap-2 text-[#f0f0ff]">
              <CheckCircle2 className="w-4 h-4 text-[#06d6a0] flex-shrink-0" />
              <span>
                فاتورة رقم: <strong className="font-mono text-white">{lastInvoice.invoice_number}</strong> (
                {lastInvoice.total.toFixed(2)} ج.م)
              </span>
            </div>
            <button
              onClick={handlePrintLastInvoice}
              className="px-2.5 py-1 rounded-lg bg-[rgba(34,34,68,0.8)] hover:bg-[rgba(42,42,74,0.9)] border border-[rgba(124,58,237,0.15)] text-[#f0f0ff] font-bold flex items-center gap-1 transition-colors text-xs"
            >
              <Printer className="w-3.5 h-3.5 text-purple-400" />
              طباعة إيصال
            </button>
          </div>
        )}

        {/* Cart Header */}
        <div className="flex items-center justify-between px-1 mb-2">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-[#f0f0ff]">أصناف الفاتورة الحالية</h3>
            <span className="badge badge-slate text-[11px] font-mono">
              {cart.length} أصناف
            </span>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-[11px] font-bold text-[#ff6b6b] hover:text-[#ff8a8a] flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              تفريغ الفاتورة
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto border border-[rgba(42,42,74,0.5)] rounded-xl bg-[rgba(18,16,31,0.5)] p-1 space-y-1">
          {cart.map((item) => (
            <div
              key={item.product.id}
              className="p-2.5 rounded-lg bg-[rgba(26,26,46,0.8)] border border-[rgba(42,42,74,0.5)] flex items-center justify-between gap-2 transition-all hover:border-[rgba(124,58,237,0.25)]"
            >
              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[#f0f0ff] text-xs truncate leading-tight">
                  {item.product.name}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-[#7878a0] font-mono">
                    {item.product.barcode}
                  </span>
                  <span className="text-[#3a3a60]">•</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-[#7878a0]">سعر:</span>
                    <input
                      type="number"
                      step="any"
                      value={item.unit_price}
                      onChange={(e) => updateItemPrice(item.product.id, parseFloat(e.target.value) || 0)}
                      className="w-14 text-center bg-[rgba(18,16,31,0.8)] border border-[rgba(42,42,74,0.6)] rounded px-1 text-[11px] text-[#f0f0ff] font-mono outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Quantity Stepper */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => updateItemQuantity(item.product.id, item.quantity - 1)}
                  className="w-6 h-6 rounded bg-[rgba(34,34,68,0.7)] hover:bg-[rgba(124,58,237,0.2)] text-[#a8a8c8] hover:text-white flex items-center justify-center font-bold text-xs border border-[rgba(42,42,74,0.6)] transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItemQuantity(item.product.id, parseInt(e.target.value) || 1)}
                  className="w-9 text-center bg-[rgba(18,16,31,0.8)] border border-[rgba(42,42,74,0.6)] rounded text-xs text-white font-bold py-0.5 font-mono outline-none"
                />
                <button
                  onClick={() => updateItemQuantity(item.product.id, item.quantity + 1)}
                  className="w-6 h-6 rounded bg-[rgba(34,34,68,0.7)] hover:bg-[rgba(124,58,237,0.2)] text-[#a8a8c8] hover:text-white flex items-center justify-center font-bold text-xs border border-[rgba(42,42,74,0.6)] transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Item Total */}
              <div className="text-left font-extrabold font-mono text-[#f0f0ff] text-xs w-16 flex-shrink-0">
                {item.total.toFixed(2)}
              </div>

              {/* Delete button */}
              <button
                onClick={() => removeItem(item.product.id)}
                className="text-[#7878a0] hover:text-[#ff6b6b] p-1 transition-colors flex-shrink-0"
                title="حذف الصنف"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {cart.length === 0 && (
            <div className="py-24 text-center text-[#5a5a80] flex flex-col items-center justify-center">
              <ShoppingCart className="w-12 h-12 mb-3 opacity-20 text-purple-400" />
              <p className="font-bold text-[#a8a8c8] text-sm">الفاتورة فارغة حالياً</p>
              <p className="text-[#5a5a80] text-xs mt-1">
                مرر قارئ الباركود أو اضغط على أي صنف من القائمة
              </p>
            </div>
          )}
        </div>

        {/* Cart Bottom Summary & Checkout Button */}
        <div className="mt-3 pt-3 border-t border-[rgba(124,58,237,0.12)] bg-[rgba(18,16,31,0.5)] -mx-3 xl:-mx-4 -mb-3 xl:-mb-4 p-3 xl:p-4 rounded-b-2xl">
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="p-2.5 rounded-xl bg-[rgba(26,26,46,0.8)] border border-[rgba(42,42,74,0.5)]">
              <span className="text-[11px] font-bold text-[#a8a8c8] block mb-0.5">المجموع:</span>
              <span className="text-sm font-extrabold text-[#f0f0ff] font-mono">{subtotal.toFixed(2)} ج.م</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[rgba(26,26,46,0.8)] border border-[rgba(255,107,107,0.12)]">
              <span className="text-[11px] font-bold text-[#a8a8c8] block mb-0.5">الخصم:</span>
              <input
                type="number"
                min="0"
                step="any"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full bg-transparent border-b border-[rgba(255,107,107,0.4)] text-sm font-extrabold text-[#ff8a8a] outline-none font-mono py-0.5"
              />
            </div>

            <div className="p-2.5 rounded-xl bg-[rgba(6,214,160,0.06)] border border-[rgba(6,214,160,0.15)]">
              <span className="text-[11px] font-bold text-[#06d6a0] block mb-0.5">الصافي:</span>
              <span className="text-base font-black text-white font-mono">{grandTotal.toFixed(2)} ج.م</span>
            </div>
          </div>

          <button
            onClick={() => setIsPaymentOpen(true)}
            disabled={cart.length === 0}
            className="btn-success w-full text-base font-extrabold py-3 shadow-lg"
          >
            <Receipt className="w-5 h-5" />
            <span>إتمام الفاتورة والدفع [F9]</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. LEFT PANEL: Products Catalog & Search
          ========================================================================= */}
      <div className="flex-1 flex flex-col pos-card p-3 xl:p-4 overflow-hidden shadow-xl">
        {/* Search Header */}
        <div className="mac-search-bar mb-3">
          <Search className="w-4 h-4 text-[#7878a0] flex-shrink-0" />
          <input
            type="text"
            placeholder="بحث عن قطعة غيار بالاسم أو الكود..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-xs text-[#7878a0] hover:text-white font-bold p-1">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-2.5 mb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory(0)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === 0
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-[rgba(26,26,46,0.8)] text-[#a8a8c8] hover:text-white hover:bg-[rgba(34,34,68,0.8)] border border-[rgba(42,42,74,0.5)]'
            }`}
          >
            جميع الأصناف
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-[rgba(26,26,46,0.8)] text-[#a8a8c8] hover:text-white hover:bg-[rgba(34,34,68,0.8)] border border-[rgba(42,42,74,0.5)]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 xl:grid-cols-3 gap-3 content-start p-1">
          {products.map((p) => {
            const isOutOfStock = p.quantity <= 0;
            const isLowStock = p.quantity <= p.min_quantity && !isOutOfStock;
            return (
              <div
                key={p.id}
                onClick={() => !isOutOfStock && addProductToCart(p)}
                className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between select-none ${
                  isOutOfStock
                    ? 'bg-[rgba(18,16,31,0.6)] border-[rgba(42,42,74,0.3)] opacity-40 cursor-not-allowed'
                    : 'pos-product-card cursor-pointer'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[10px] font-mono text-[#a8a8c8] bg-[rgba(18,16,31,0.8)] px-2 py-0.5 rounded-md border border-[rgba(42,42,74,0.5)]">
                      {p.barcode}
                    </span>
                    {isOutOfStock ? (
                      <span className="badge badge-red text-[10px]">نفد من المخزن</span>
                    ) : isLowStock ? (
                      <span className="badge badge-amber text-[10px]">باقي: {p.quantity}</span>
                    ) : (
                      <span className="badge badge-green text-[10px]">متاح: {p.quantity}</span>
                    )}
                  </div>
                  <h4 className="font-extrabold text-xs text-white leading-snug line-clamp-2 min-h-[2.4rem]">
                    {p.name}
                  </h4>
                  {p.category_name && (
                    <span className="text-[11px] text-[#7878a0] block mt-1 truncate">
                      {p.category_name}
                    </span>
                  )}
                </div>

                <div className="mt-3 pt-2.5 border-t border-[rgba(42,42,74,0.4)] flex items-center justify-between">
                  <span className="text-sm font-black font-mono text-[#06d6a0]">
                    {p.sell_price.toFixed(2)} ج.م
                  </span>
                  <button
                    disabled={isOutOfStock}
                    className="w-7 h-7 rounded-lg bg-[rgba(124,58,237,0.15)] hover:bg-gradient-to-r hover:from-purple-600 hover:to-blue-600 text-purple-400 hover:text-white flex items-center justify-center text-xs font-bold transition-all border border-[rgba(124,58,237,0.25)]"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {products.length === 0 && (
            <div className="col-span-2 xl:col-span-3 py-20 text-center text-[#5a5a80] text-xs">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-30 text-purple-400" />
              <p className="font-bold text-[#a8a8c8] text-sm">لا توجد قطع غيار مطابقة</p>
              <p className="text-[#5a5a80] text-xs mt-1">تأكد من كتابة الاسم أو الكود بشكل صحيح</p>
            </div>
          )}
        </div>
      </div>

      {/* Checkout Payment Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => {
          setIsPaymentOpen(false);
          focusBarcodeInput();
        }}
        cartItems={cart}
        subtotal={subtotal}
        discount={discountNum}
        total={grandTotal}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};
