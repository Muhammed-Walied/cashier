import { BrowserWindow } from 'electron';
import { getInvoiceDetails } from '../services/invoices';
import { getSettings } from '../services/settings';
import { generateBarcodeDataUrl } from './barcode';
import { ApiResponse } from '../types';

export async function printReceipt(invoiceId: number): Promise<ApiResponse<boolean>> {
  try {
    const invRes = getInvoiceDetails(invoiceId);
    if (!invRes.success || !invRes.data) {
      return { success: false, error: 'تعذر العثور على الفاتورة' };
    }
    const invoice = invRes.data;

    const settingsRes = getSettings();
    const settings = settingsRes.data;

    // Generate invoice barcode
    let barcodeDataUrl = '';
    const barcodeRes = await generateBarcodeDataUrl(invoice.invoice_number);
    if (barcodeRes.success && barcodeRes.data) {
      barcodeDataUrl = barcodeRes.data;
    }

    const itemsRows = (invoice.items || [])
      .map(
        (item, idx) => `
      <tr>
        <td style="text-align: right; padding: 4px 2px;">${item.product_name}</td>
        <td style="text-align: center; padding: 4px 2px;">${item.quantity}</td>
        <td style="text-align: left; padding: 4px 2px;">${item.unit_price.toFixed(2)}</td>
        <td style="text-align: left; padding: 4px 2px; font-weight: bold;">${item.total.toFixed(2)}</td>
      </tr>
    `
      )
      .join('');

    const isThermal80 = settings?.printer_type === 'thermal_80mm';
    const paperWidth = isThermal80 ? '78mm' : '56mm';

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="utf-8">
          <style>
            @page {
              size: auto;
              margin: 0;
            }
            body {
              width: ${paperWidth};
              margin: 0 auto;
              padding: 5mm;
              font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
              direction: rtl;
              font-size: 11px;
              color: #000;
              background: #fff;
              -webkit-print-color-adjust: exact;
            }
            .header {
              text-align: center;
              border-bottom: 1px dashed #000;
              padding-bottom: 8px;
              margin-bottom: 8px;
            }
            .shop-name {
              font-size: 16px;
              font-weight: 900;
              margin-bottom: 4px;
            }
            .info-line {
              font-size: 11px;
              margin-bottom: 2px;
            }
            .meta-box {
              border-bottom: 1px dashed #000;
              padding-bottom: 6px;
              margin-bottom: 8px;
              font-size: 11px;
            }
            .meta-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 2px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 8px;
            }
            th {
              border-bottom: 1px solid #000;
              padding: 4px 2px;
              font-size: 11px;
            }
            .totals-box {
              border-top: 1px dashed #000;
              border-bottom: 1px dashed #000;
              padding: 6px 0;
              margin-bottom: 8px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
              font-size: 11px;
            }
            .grand-total {
              font-size: 15px;
              font-weight: 900;
            }
            .barcode-container {
              text-align: center;
              margin: 10px 0 5px 0;
            }
            .barcode-container img {
              max-width: 80%;
              height: auto;
            }
            .footer {
              text-align: center;
              font-size: 10px;
              margin-top: 6px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="shop-name">${settings?.shop_name || 'محل قطع الغيار'}</div>
            <div class="info-line">هاتف: ${settings?.shop_phone || ''}</div>
            <div class="info-line">${settings?.shop_address || ''}</div>
          </div>

          <div class="meta-box">
            <div class="meta-row">
              <span>رقم الفاتورة:</span>
              <strong style="font-family: monospace;">${invoice.invoice_number}</strong>
            </div>
            <div class="meta-row">
              <span>التاريخ والوقت:</span>
              <span>${invoice.created_at}</span>
            </div>
            <div class="meta-row">
              <span>الكاشير:</span>
              <span>${invoice.user_name || 'المدير'}</span>
            </div>
            ${
              invoice.customer_name
                ? `
            <div class="meta-row">
              <span>العميل:</span>
              <strong>${invoice.customer_name}</strong>
            </div>
            `
                : ''
            }
          </div>

          <table>
            <thead>
              <tr>
                <th style="text-align: right;">الصنف</th>
                <th style="text-align: center;">العدد</th>
                <th style="text-align: left;">السعر</th>
                <th style="text-align: left;">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div class="totals-box">
            <div class="total-row">
              <span>المجموع الفرعي:</span>
              <span>${invoice.subtotal.toFixed(2)} ج.م</span>
            </div>
            ${
              invoice.discount > 0
                ? `
            <div class="total-row" style="color: #000;">
              <span>الخصم:</span>
              <span>- ${invoice.discount.toFixed(2)} ج.م</span>
            </div>
            `
                : ''
            }
            <div class="total-row grand-total">
              <span>الصافي المطلوب:</span>
              <span>${invoice.total.toFixed(2)} ج.م</span>
            </div>
            <div class="total-row">
              <span>المدفوع:</span>
              <span>${invoice.paid_amount.toFixed(2)} ج.م</span>
            </div>
            ${
              invoice.remaining > 0
                ? `
            <div class="total-row" style="font-weight: bold;">
              <span>المتبقي (آجل):</span>
              <span>${invoice.remaining.toFixed(2)} ج.م</span>
            </div>
            `
                : ''
            }
          </div>

          ${
            barcodeDataUrl
              ? `
          <div class="barcode-container">
            <img src="${barcodeDataUrl}" />
          </div>
          `
              : ''
          }

          <div class="footer">
            <div>${settings?.invoice_footer || ''}</div>
          </div>
        </body>
      </html>
    `;

    const printWin = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
      },
    });

    await printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

    return new Promise((resolve) => {
      printWin.webContents.print(
        {
          silent: false, // Opens standard Windows print dialog for thermal receipt printer
          printBackground: true,
        },
        (success, failureReason) => {
          printWin.close();
          if (!success) {
            resolve({ success: false, error: failureReason });
          } else {
            resolve({ success: true, data: true });
          }
        }
      );
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
