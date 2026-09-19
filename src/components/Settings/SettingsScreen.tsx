import React, { useState, useEffect } from 'react';
import { Settings, Save, Database, Download, Upload, CheckCircle2, Store, Printer } from 'lucide-react';
import { ShopSettings } from '../../types';

export const SettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<ShopSettings>({
    shop_name: '',
    shop_phone: '',
    shop_address: '',
    invoice_footer: '',
    printer_type: 'thermal_80mm',
    barcode_width: 40,
    barcode_height: 30,
    auto_print: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [dbBackupMsg, setDbBackupMsg] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (window.electronAPI) {
      const res = await window.electronAPI.getSettings();
      if (res.success && res.data) {
        setSettings(res.data);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg('');

    try {
      if (window.electronAPI) {
        const res = await window.electronAPI.updateSettings(settings);
        if (res.success) {
          setSuccessMsg('تم حفظ الإعدادات بنجاح');
          setTimeout(() => setSuccessMsg(''), 3000);
        }
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackupDb = async () => {
    setDbBackupMsg('جاري إنشاء نسخة احتياطية...');
    if (window.electronAPI) {
      const res = await window.electronAPI.backupDatabase();
      if (res.success && res.data) {
        setDbBackupMsg(`تم حفظ النسخة الاحتياطية بنجاح في:\n${res.data}`);
      } else {
        setDbBackupMsg(res.error || 'فشل النسخ الاحتياطي');
      }
    }
  };

  const handleRestoreDb = async () => {
    if (
      window.confirm(
        'تحذير: استعادة نسخة احتياطية سيستبدل قاعدة البيانات الحالية. هل ترغب بالاستمرار؟'
      )
    ) {
      if (window.electronAPI) {
        const res = await window.electronAPI.restoreDatabase();
        if (res.success) {
          alert('تمت استعادة قاعدة البيانات بنجاح! سيتم إعادة تحميل الإعدادات.');
          loadSettings();
        } else if (res.error) {
          alert(res.error);
        }
      }
    }
  };

  return (
    <div className="space-y-4 max-w-4xl select-none">
      {/* 1. Page Header */}
      <div>
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600/20 to-blue-600/10 border border-purple-500/25 flex items-center justify-center text-purple-400">
            <Settings className="w-4 h-4" />
          </div>
          <span>إعدادات النظام والطباعة</span>
        </h2>
        <p className="text-xs text-[#7878a0] mt-1">
          تخصيص بيانات المحل، قياسات ملصقات طابعة XPrinter، والنسخ الاحتياطي
        </p>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-[rgba(6,214,160,0.12)] border border-[rgba(6,214,160,0.25)] text-[#06d6a0] text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        {/* Section 1: Store Information */}
        <div className="p-5 rounded-2xl pos-card space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2 border-b border-[rgba(124,58,237,0.12)] pb-3">
            <Store className="w-4 h-4 text-purple-400" />
            <span>بيانات المحل والفاتورة</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#a8a8c8] block mb-1">اسم المحل / المعرض</label>
              <input
                type="text"
                value={settings.shop_name}
                onChange={(e) => setSettings({ ...settings, shop_name: e.target.value })}
                className="input-dark text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#a8a8c8] block mb-1">رقم هاتف المحل</label>
              <input
                type="text"
                value={settings.shop_phone}
                onChange={(e) => setSettings({ ...settings, shop_phone: e.target.value })}
                className="input-dark text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#a8a8c8] block mb-1">عنوان المحل</label>
            <input
              type="text"
              value={settings.shop_address}
              onChange={(e) => setSettings({ ...settings, shop_address: e.target.value })}
              className="input-dark text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#a8a8c8] block mb-1">
              النص أسفل الفاتورة (ملاحظات الاسترجاع والضمان)
            </label>
            <textarea
              rows={2}
              value={settings.invoice_footer}
              onChange={(e) => setSettings({ ...settings, invoice_footer: e.target.value })}
              className="input-dark text-xs"
            />
          </div>
        </div>

        {/* Section 2: Printer & Barcode Settings */}
        <div className="p-5 rounded-2xl pos-card space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2 border-b border-[rgba(124,58,237,0.12)] pb-3">
            <Printer className="w-4 h-4 text-purple-400" />
            <span>إعدادات طابعة XPrinter وملصقات الباركود</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#a8a8c8] block mb-1">نوع طابعة الريسيت</label>
              <select
                value={settings.printer_type}
                onChange={(e) => setSettings({ ...settings, printer_type: e.target.value as any })}
                className="input-dark text-xs bg-[#1a1a2e]"
              >
                <option value="thermal_80mm">طابعة حرارية عريضة (80 مم) - القياسية</option>
                <option value="thermal_58mm">طابعة حرارية صغيرة (58 مم)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#a8a8c8] block mb-1">
                مقاس ملصق الباركود الافتراضي (عرض × ارتفاع بالملليمتر)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="20"
                  max="100"
                  value={settings.barcode_width}
                  onChange={(e) => setSettings({ ...settings, barcode_width: Number(e.target.value) })}
                  className="input-dark text-xs text-center font-mono w-24"
                  placeholder="العرض مم"
                />
                <span className="text-[#7878a0] font-bold">×</span>
                <input
                  type="number"
                  min="15"
                  max="100"
                  value={settings.barcode_height}
                  onChange={(e) => setSettings({ ...settings, barcode_height: Number(e.target.value) })}
                  className="input-dark text-xs text-center font-mono w-24"
                  placeholder="الارتفاع مم"
                />
                <span className="text-[#7878a0] text-xs whitespace-nowrap">مم (المعتاد: 40×30)</span>
              </div>
            </div>
          </div>
        </div>

        <button type="submit" disabled={isSaving} className="btn-primary text-xs !py-3 px-6 shadow-md">
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'جاري الحفظ...' : 'حفظ كافة التعديلات'}</span>
        </button>
      </form>

      {/* Section 3: Database & Backup Management */}
      <div className="p-5 rounded-2xl pos-card space-y-4">
        <h3 className="text-sm font-extrabold text-white flex items-center gap-2 border-b border-[rgba(124,58,237,0.12)] pb-3">
          <Database className="w-4 h-4 text-[#06d6a0]" />
          <span>النسخ الاحتياطي وحفظ البيانات</span>
        </h3>
        <p className="text-xs text-[#a8a8c8]">
          تعتمد المنظومة على قاعدة بيانات SQLite مدمجة وخفيفة وسريعة. يمكنك إنشاء نسخة احتياطية يدوياً في أي وقت أو استعادتها.
        </p>

        {dbBackupMsg && (
          <div className="p-3 rounded-xl bg-[rgba(124,58,237,0.12)] border border-[rgba(124,58,237,0.25)] text-purple-300 text-xs font-mono whitespace-pre-line">
            {dbBackupMsg}
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-1">
          <button
            type="button"
            onClick={handleBackupDb}
            className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border border-[rgba(6,214,160,0.3)] hover:border-[#06d6a0] text-[#06d6a0] bg-[rgba(6,214,160,0.08)] hover:bg-[rgba(6,214,160,0.15)] transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-[#06d6a0]" />
            <span>أخذ نسخة احتياطية وحفظها الآن (Backup)</span>
          </button>

          <button
            type="button"
            onClick={handleRestoreDb}
            className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border border-[rgba(255,159,67,0.3)] hover:border-[#ff9f43] text-[#ff9f43] bg-[rgba(255,159,67,0.08)] hover:bg-[rgba(255,159,67,0.15)] transition-all shadow-sm"
          >
            <Upload className="w-4 h-4 text-[#ff9f43]" />
            <span>استعادة نسخة سابقة (Restore)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
