import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Plus,
  Search,
  Printer,
  Edit2,
  Trash2,
  AlertTriangle,
  Package,
  Layers,
  X,
} from 'lucide-react';
import { Product, Category } from '../../types';
import { ProductFormModal } from './ProductFormModal';
import { BarcodePrintModal } from './BarcodePrintModal';

export const ProductList: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialFilter = queryParams.get('filter');

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<number>(0);
  const [showLowStockOnly, setShowLowStockOnly] = useState<boolean>(initialFilter === 'low');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
  const [barcodeProduct, setBarcodeProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [search, selectedCat, showLowStockOnly]);

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
      if (showLowStockOnly) {
        const res = await window.electronAPI.getLowStockProducts();
        if (res.success && res.data) {
          setProducts(res.data);
        }
      } else {
        const res = await window.electronAPI.getProducts(search, selectedCat);
        if (res.success && res.data) {
          setProducts(res.data);
        }
      }
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`هل أنت متأكد من رغبتك في حذف الصنف "${name}"؟`)) {
      if (window.electronAPI) {
        const res = await window.electronAPI.deleteProduct(id);
        if (res.success) {
          loadProducts();
        } else {
          alert(res.error || 'فشل حذف المنتج');
        }
      }
    }
  };

  const openBarcodeModal = (product: Product) => {
    setBarcodeProduct(product);
    setIsBarcodeOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-4 select-none">
      {/* 1. Page Header */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600/20 to-blue-600/10 border border-purple-500/25 flex items-center justify-center text-purple-400">
              <Package className="w-4 h-4" />
            </div>
            <span>قطع الغيار وإدارة المخزون</span>
          </h2>
          <p className="text-xs text-[#7878a0] mt-1">
            إضافة وتعديل المنتجات، مراقبة النواقص، وطباعة ملصقات الباركود على XPrinter
          </p>
        </div>

        <button onClick={openAddModal} className="btn-primary text-xs !py-2.5 px-4 shadow-md">
          <Plus className="w-4 h-4" />
          <span>إضافة قطعة غيار جديدة</span>
        </button>
      </div>

      {/* 2. Filters Bar */}
      <div className="p-3 rounded-2xl pos-card shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[300px]">
          {/* Search box */}
          <div className="mac-search-bar flex-1 max-w-sm">
            <Search className="w-4 h-4 text-[#7878a0] flex-shrink-0" />
            <input
              type="text"
              placeholder="بحث بالاسم أو كود الباركود..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-xs text-[#7878a0] hover:text-white font-bold p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2 bg-[rgba(18,16,31,0.8)] border border-[rgba(42,42,74,0.6)] rounded-xl px-3 py-1.5 w-52">
            <Layers className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <select
              value={selectedCat}
              onChange={(e) => {
                setSelectedCat(Number(e.target.value));
                setShowLowStockOnly(false);
              }}
              className="bg-transparent border-none outline-none text-xs text-[#f0f0ff] font-medium w-full cursor-pointer"
            >
              <option value={0} className="bg-[#1a1a2e]">جميع التصنيفات</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#1a1a2e]">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Low Stock Filter Toggle */}
        <button
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
            showLowStockOnly
              ? 'bg-[rgba(255,159,67,0.1)] border-[rgba(255,159,67,0.3)] text-[#ffba6b] shadow-sm shadow-[rgba(255,159,67,0.1)]'
              : 'bg-[rgba(26,26,46,0.8)] border-[rgba(42,42,74,0.5)] text-[#a8a8c8] hover:text-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-[#ff9f43]" />
          <span>النواقص فقط ({products.filter(p => p.quantity <= p.min_quantity).length})</span>
        </button>
      </div>

      {/* 3. Products Table */}
      <div className="pos-card overflow-hidden shadow-sm">
        <div className="table-container">
          <table className="pos-table">
            <thead>
              <tr>
                <th style={{ width: '18%' }}>الباركود</th>
                <th style={{ width: '28%' }}>اسم قطعة الغيار</th>
                <th style={{ width: '16%' }}>التصنيف</th>
                <th style={{ width: '12%' }}>سعر الشراء</th>
                <th style={{ width: '12%' }}>سعر البيع</th>
                <th style={{ width: '10%', textAlign: 'center' }}>الكمية بالمخزن</th>
                <th style={{ width: '8%', textAlign: 'center' }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const isOutOfStock = p.quantity <= 0;
                const isLowStock = p.quantity <= p.min_quantity && !isOutOfStock;
                return (
                  <tr key={p.id}>
                    {/* Barcode with Print Action */}
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#f0f0ff] bg-[rgba(18,16,31,0.8)] px-2 py-1 rounded-md border border-[rgba(42,42,74,0.5)]">
                          {p.barcode}
                        </span>
                        <button
                          onClick={() => openBarcodeModal(p)}
                          title="طباعة ملصق باركود على XPrinter"
                          className="p-1 rounded-md bg-[rgba(34,34,68,0.6)] hover:bg-[rgba(42,42,74,0.8)] text-[#a8a8c8] hover:text-white transition-colors border border-[rgba(42,42,74,0.5)]"
                        >
                          <Printer className="w-3.5 h-3.5 text-purple-400" />
                        </button>
                      </div>
                    </td>

                    {/* Name & Description */}
                    <td>
                      <div className="font-bold text-white text-xs leading-snug">{p.name}</div>
                      {p.description && (
                        <div className="text-[11px] text-[#7878a0] truncate mt-0.5">{p.description}</div>
                      )}
                    </td>

                    {/* Category */}
                    <td className="text-xs text-[#a8a8c8] font-medium">
                      {p.category_name || '-'}
                    </td>

                    {/* Buy Price */}
                    <td className="font-mono text-xs text-[#7878a0]">
                      {p.buy_price.toFixed(2)} ج.م
                    </td>

                    {/* Sell Price */}
                    <td className="font-mono text-xs font-bold text-[#06d6a0]">
                      {p.sell_price.toFixed(2)} ج.م
                    </td>

                    {/* Quantity & Stock Badge */}
                    <td style={{ textAlign: 'center' }}>
                      {isOutOfStock ? (
                        <span className="badge badge-red font-mono">0 (نفد)</span>
                      ) : isLowStock ? (
                        <span className="badge badge-amber font-mono">
                          {p.quantity} (منخفض)
                        </span>
                      ) : (
                        <span className="badge badge-green font-mono">
                          {p.quantity} قطعة
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'center' }}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(p)}
                          title="تعديل بيانات الصنف"
                          className="p-1.5 rounded-lg text-[#7878a0] hover:text-purple-400 hover:bg-[rgba(124,58,237,0.1)] transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          title="حذف الصنف"
                          className="p-1.5 rounded-lg text-[#7878a0] hover:text-[#ff6b6b] hover:bg-[rgba(255,107,107,0.1)] transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-[#5a5a80]">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-25 text-purple-400" />
                    <p className="font-bold text-[#a8a8c8] text-sm">لا توجد قطع غيار مسجلة</p>
                    <p className="text-[#5a5a80] text-xs mt-1">اضغط على زر "إضافة قطعة غيار جديدة" للبدء</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        product={editingProduct}
        categories={categories}
        onSuccess={() => {
          setIsFormOpen(false);
          loadProducts();
          loadCategories();
        }}
      />

      {barcodeProduct && (
        <BarcodePrintModal
          isOpen={isBarcodeOpen}
          onClose={() => {
            setIsBarcodeOpen(false);
            setBarcodeProduct(null);
          }}
          product={barcodeProduct}
        />
      )}
    </div>
  );
};
