import path from 'path';
import fs from 'fs';
import { app, dialog } from 'electron';
import { queryAll, run, backupDatabase as backupDbFile, restoreDatabase as restoreDbFile, persistDb } from '../database/db';
import { ShopSettings, ApiResponse } from '../types';

export function getSettings(): ApiResponse<ShopSettings> {
  try {
    const rows = queryAll<{ key: string; value: string }>('SELECT key, value FROM settings');
    const settingsMap: Record<string, string> = {};
    for (const r of rows) {
      settingsMap[r.key] = r.value;
    }

    const settings: ShopSettings = {
      shop_name: settingsMap['shop_name'] || 'محل قطع غيار السيارات والموتوسيكلات',
      shop_phone: settingsMap['shop_phone'] || '01012345678',
      shop_address: settingsMap['shop_address'] || 'شارع الجمهورية الرئيسي',
      invoice_footer:
        settingsMap['invoice_footer'] ||
        'شكراً لتعاملكم معنا! البضاعة المباعة ترد أو تستبدل خلال 14 يوماً بالفاتورة الأصلية',
      barcode_width: Number(settingsMap['barcode_width']) || 40,
      barcode_height: Number(settingsMap['barcode_height']) || 30,
      printer_type: (settingsMap['printer_type'] as any) || 'thermal_80mm',
      auto_print: settingsMap['auto_print'] !== '0',
    };

    return { success: true, data: settings };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function updateSettings(settings: Partial<ShopSettings>): ApiResponse<boolean> {
  try {
    for (const [key, value] of Object.entries(settings)) {
      if (value !== undefined) {
        run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
          key,
          typeof value === 'boolean' ? (value ? '1' : '0') : String(value),
        ]);
      }
    }
    persistDb();
    return { success: true, data: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function backupDatabase(): Promise<ApiResponse<string>> {
  try {
    const dateStr = new Date().toISOString().slice(0, 10);
    const defaultFilename = `casher_backup_${dateStr}.sqlite`;

    const { filePath } = await dialog.showSaveDialog({
      title: 'حفظ نسخة احتياطية من قاعدة البيانات',
      defaultPath: path.join(app.getPath('downloads'), defaultFilename),
      filters: [{ name: 'SQLite Database', extensions: ['sqlite', 'db'] }],
    });

    if (!filePath) {
      return { success: false, error: 'تم إلغاء عملية النسخ الاحتياطي' };
    }

    const ok = backupDbFile(filePath);
    if (!ok) {
      return { success: false, error: 'فشل تصدير قاعدة البيانات' };
    }

    return { success: true, data: filePath };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function restoreDatabase(): Promise<ApiResponse<boolean>> {
  try {
    const { filePaths } = await dialog.showOpenDialog({
      title: 'استعادة نسخة احتياطية',
      properties: ['openFile'],
      filters: [{ name: 'SQLite Database', extensions: ['sqlite', 'db'] }],
    });

    if (!filePaths || filePaths.length === 0) {
      return { success: false, error: 'لم يتم اختيار ملف' };
    }

    const ok = restoreDbFile(filePaths[0]);
    if (!ok) {
      return { success: false, error: 'فشل استعادة قاعدة البيانات من الملف المحدد' };
    }

    return { success: true, data: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
