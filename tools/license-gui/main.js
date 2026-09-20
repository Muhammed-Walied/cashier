const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { execSync } = require('child_process');

let win = null;
const ROOT_DIR = path.join(__dirname, '..', '..');
const PRIVATE_KEY_PATH = path.join(ROOT_DIR, 'tools', 'keys', 'private.pem');

function getLocalMachineId() {
  try {
    const mb = execSync('powershell -NoProfile -NonInteractive -Command "(Get-CimInstance Win32_ComputerSystemProduct).UUID"', {
      encoding: 'utf-8', timeout: 5000, windowsHide: true,
    }).trim() || 'UNKNOWN-MB';

    const disk = execSync('powershell -NoProfile -NonInteractive -Command "(Get-CimInstance Win32_DiskDrive | Select-Object -First 1).SerialNumber"', {
      encoding: 'utf-8', timeout: 5000, windowsHide: true,
    }).trim() || 'UNKNOWN-DISK';

    const cpu = execSync('powershell -NoProfile -NonInteractive -Command "(Get-CimInstance Win32_Processor | Select-Object -First 1).ProcessorId"', {
      encoding: 'utf-8', timeout: 5000, windowsHide: true,
    }).trim() || 'UNKNOWN-CPU';

    const raw = `${mb}|${disk}|${cpu}`;
    const hash = crypto.createHash('sha256').update(raw).digest('hex');
    const short = hash.substring(0, 16).toUpperCase();
    const formatted = `${short.slice(0, 4)}-${short.slice(4, 8)}-${short.slice(8, 12)}-${short.slice(12, 16)}`;

    return { short: formatted, full: hash };
  } catch {
    return null;
  }
}

function createWindow() {
  Menu.setApplicationMenu(null);

  win = new BrowserWindow({
    width: 680,
    height: 760,
    minWidth: 600,
    minHeight: 650,
    title: 'مولد تراخيص نظام الكاشير (POS License Generator)',
    backgroundColor: '#0f0f1a',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.setMenu(null);
  win.loadFile(path.join(__dirname, 'index.html'));
}

ipcMain.handle('get-local-machine-id', async () => {
  return getLocalMachineId();
});

ipcMain.handle('generate-license', async (_e, { machineId, customer, expires }) => {
  try {
    if (!fs.existsSync(PRIVATE_KEY_PATH)) {
      return {
        success: false,
        error: 'المفتاح الخاص (private.pem) غير موجود في مجلد tools/keys/! تأكد من وجوده.',
      };
    }

    const cleanMachineId = (machineId || '').trim().replace(/[^a-zA-Z0-9]/g, '');
    if (!cleanMachineId || cleanMachineId.length < 16) {
      return {
        success: false,
        error: 'كود جهاز العميل غير صالح! يجب إدخال كود الجهاز المكون من 16 حرف أو الهاش الكامل.',
      };
    }

    if (!customer || !customer.trim()) {
      return {
        success: false,
        error: 'يرجى كتابة اسم العميل أو المحل.',
      };
    }

    const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf-8');

    const payload = {
      machineId: cleanMachineId,
      customer: customer.trim(),
      issuedAt: new Date().toISOString(),
      expiresAt: expires ? new Date(expires + 'T23:59:59.999Z').toISOString() : null,
    };

    const payloadJson = JSON.stringify(payload);
    const payloadB64 = Buffer.from(payloadJson).toString('base64');

    const signer = crypto.createSign('SHA256');
    signer.update(payloadB64);
    signer.end();
    const signature = signer.sign(privateKey, 'base64');

    const licenseData = {
      data: payloadB64,
      signature: signature,
    };

    const licenseKey = Buffer.from(JSON.stringify(licenseData)).toString('base64');

    // حفظ في مجلد licenses/
    const licensesDir = path.join(ROOT_DIR, 'licenses');
    if (!fs.existsSync(licensesDir)) {
      fs.mkdirSync(licensesDir, { recursive: true });
    }

    const safeName = customer.trim().replace(/[/\\?%*:|"<>]/g, '_');
    const customerFile = path.join(licensesDir, `ترخيص_${safeName}.txt`);
    const rootOutputFile = path.join(ROOT_DIR, 'license_output.txt');

    const fileContent = `================================================================
🔑 مفتاح ترخيص نظام الكاشير (POS Offline License)
================================================================
العميل / المحل : ${customer.trim()}
كود الجهاز    : ${cleanMachineId}
تاريخ الإصدار  : ${payload.issuedAt.split('T')[0]}
الصلاحية       : ${expires ? expires : 'مدى الحياة ♾️'}
================================================================

مفتاح التفعيل (انسخ السطر التالي كاملاً والصقه في شاشة التفعيل بالبرنامج):
----------------------------------------------------------------
${licenseKey}
----------------------------------------------------------------
`;

    fs.writeFileSync(customerFile, fileContent, 'utf-8');
    fs.writeFileSync(rootOutputFile, fileContent, 'utf-8');

    return {
      success: true,
      licenseKey,
      customer: customer.trim(),
      machineId: cleanMachineId,
      expires: expires || 'مدى الحياة ♾️',
      savedPath: customerFile,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'حدث خطأ أثناء توليد الترخيص',
    };
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
