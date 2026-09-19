import bwipjs from 'bwip-js';
import { BrowserWindow } from 'electron';
import { Product, ApiResponse } from '../types';
import { getSettings } from '../services/settings';

export async function generateBarcodeDataUrl(text: string, type: string = 'code128'): Promise<ApiResponse<string>> {
  try {
    const pngBuffer = await bwipjs.toBuffer({
      bcid: type, // Barcode type: code128, ean13, qrcode, etc.
      text: text, // Text to encode
      scale: 3, // 3x scaling factor
      height: 10, // Bar height, in millimeters
      includetext: true, // Show human-readable text
      textxalign: 'center', // Always good to center text
    });

    const base64 = `data:image/png;base64,${pngBuffer.toString('base64')}`;
    return { success: true, data: base64 };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function printBarcodeLabel(product: Product, count: number = 1): Promise<ApiResponse<boolean>> {
  try {
    const settingsRes = getSettings();
    const settings = settingsRes.data;
    const widthMm = settings?.barcode_width || 40;
    const heightMm = settings?.barcode_height || 30;

    const barcodeUrlRes = await generateBarcodeDataUrl(product.barcode);
    if (!barcodeUrlRes.success || !barcodeUrlRes.data) {
      return { success: false, error: 'فشل توليد صورة الباركود' };
    }

    const labelsHtml = Array(count)
      .fill(0)
      .map(
        () => `
        <div class="label">
          <div class="store-title">${settings?.shop_name || 'محل قطع الغيار'}</div>
          <div class="product-name">${product.name}</div>
          <div class="barcode-img"><img src="${barcodeUrlRes.data}" /></div>
          <div class="price-tag">السعر: ${product.sell_price.toFixed(2)} ج.م</div>
        </div>
      `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="utf-8">
          <style>
            @page {
              size: ${widthMm}mm ${heightMm}mm;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
              direction: rtl;
              text-align: center;
              background: #fff;
              color: #000;
              -webkit-print-color-adjust: exact;
            }
            .label {
              width: ${widthMm}mm;
              height: ${heightMm}mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              align-items: center;
              padding: 2mm;
              box-sizing: border-box;
              page-break-after: always;
              overflow: hidden;
            }
            .store-title {
              font-size: 8pt;
              font-weight: bold;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              width: 100%;
            }
            .product-name {
              font-size: 8pt;
              font-weight: 600;
              line-height: 1.1;
              max-height: 18pt;
              overflow: hidden;
              width: 100%;
            }
            .barcode-img img {
              max-width: 95%;
              max-height: 12mm;
              object-fit: contain;
            }
            .price-tag {
              font-size: 9pt;
              font-weight: 900;
              border: 1px solid #000;
              padding: 1px 4px;
              border-radius: 2px;
            }
          </style>
        </head>
        <body>
          ${labelsHtml}
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
          silent: false, // Allows user to select their XPrinter device
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
